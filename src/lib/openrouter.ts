export type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high";

export interface OpenRouterOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  reasoning?: {
    effort: ReasoningEffort;
  };
  /** Raw OpenRouter `response_format` object (e.g. json_schema). */
  responseFormat?: Record<string, unknown>;
  /** Network-level retries on 429/5xx/transient errors. Default 2. */
  retries?: number;
  /** If true, return partial content instead of throwing on finish_reason="length". */
  allowTruncated?: boolean;
}

/** Thrown when the model stopped because it hit the token cap (finish_reason="length"). */
export class TruncatedError extends Error {
  constructor(message = "Model response was truncated (finish_reason=length)") {
    super(message);
    this.name = "TruncatedError";
  }
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function isAbort(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

async function backoff(attempt: number, signal?: AbortSignal): Promise<void> {
  const ms = 400 * Math.pow(3, attempt); // 400ms, 1200ms, ...
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

/**
 * Shared OpenRouter POST core with retry/backoff. Retries only on 429 / 5xx /
 * transient network errors; never on 4xx or abort. Returns the parsed JSON body.
 */
export async function openrouterFetch(
  body: Record<string, unknown>,
  signal?: AbortSignal,
  retries = 2,
): Promise<{ choices?: Array<{ message?: { content?: unknown; images?: unknown }; finish_reason?: string }> }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal,
        body: JSON.stringify(body),
      });

      if (response.ok) return await response.json();

      const errorBody = await response.text().catch(() => "unknown error");
      const retriable = response.status === 429 || response.status >= 500;
      if (retriable && attempt < retries) {
        lastErr = new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
        console.warn(`[openrouter] ${response.status}, retry ${attempt + 1}/${retries}`);
        await backoff(attempt, signal);
        continue;
      }
      throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
    } catch (err) {
      if (isAbort(err)) throw err; // timeout / cancellation — bubble immediately
      if (attempt < retries) {
        lastErr = err;
        console.warn(`[openrouter] network error, retry ${attempt + 1}/${retries}:`, err instanceof Error ? err.message : err);
        await backoff(attempt, signal);
        continue;
      }
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("OpenRouter request failed");
}

function buildBody(
  systemPrompt: string,
  userMessage: string,
  options: OpenRouterOptions,
): Record<string, unknown> {
  return {
    model: options.model ?? process.env.OPENROUTER_MODEL,
    temperature: options.temperature ?? 0.6,
    max_tokens: options.maxTokens ?? 24576,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    ...(options.reasoning && options.reasoning.effort !== "none"
      ? { reasoning: { effort: options.reasoning.effort } }
      : {}),
    ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
  };
}

/**
 * Single text completion. Throws TruncatedError if the model hit the token cap
 * (so callers degrade instead of stitching broken HTML).
 */
export async function generateExplanation(
  systemPrompt: string,
  userMessage: string,
  options: OpenRouterOptions = {},
): Promise<string> {
  const model = options.model ?? process.env.OPENROUTER_MODEL;
  if (!model) {
    throw new Error("No model specified and OPENROUTER_MODEL is not set");
  }

  const data = await openrouterFetch(
    buildBody(systemPrompt, userMessage, { ...options, model }),
    options.signal,
    options.retries,
  );

  const choice = data?.choices?.[0];
  const content = choice?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("OpenRouter returned an empty or malformed response");
  }
  if (choice?.finish_reason === "length" && !options.allowTruncated) {
    throw new TruncatedError();
  }
  return content;
}

export interface JsonSchemaSpec {
  name: string;
  schema: Record<string, unknown>;
}

/**
 * Structured output via OpenRouter `response_format: json_schema`. The caller
 * supplies a JSON Schema (for the model) and a validate() fn (e.g. Zod parse)
 * that both narrows the type and throws on mismatch. Retries once on a
 * truncated/unparseable/invalid response; never retries on abort.
 */
export async function generateStructured<T>(
  systemPrompt: string,
  userMessage: string,
  jsonSchema: JsonSchemaSpec,
  validate: (data: unknown) => T,
  options: OpenRouterOptions = {},
): Promise<T> {
  const responseFormat = {
    type: "json_schema",
    json_schema: { name: jsonSchema.name, strict: false, schema: jsonSchema.schema },
  };

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await generateExplanation(systemPrompt, userMessage, {
        ...options,
        responseFormat,
      });
      return validate(JSON.parse(raw));
    } catch (err) {
      if (isAbort(err)) throw err;
      lastErr = err;
      console.warn(`[openrouter] structured attempt ${attempt + 1}/2 failed:`, err instanceof Error ? err.message : err);
    }
  }
  throw new Error(
    `Structured output failed after retries: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
  );
}
