import DOMPurify from "dompurify";

export type ExportFormat = "png" | "pdf";

export interface ExportOptions {
  html: string;
  format: ExportFormat;
  filename?: string;
}

/**
 * Strips dangerous HTML content before rendering.
 * Canvas HTML is LLM-generated and normally runs inside sandbox="",
 * but export renders it in the host page — sanitize first.
 *
 * Uses DOMPurify with WHOLE_DOCUMENT so <html>/<head>/<body>/<style>
 * survive for Phase 1 iframe write. Explicitly allows <link> so Google
 * Fonts stylesheets are preserved.
 */
function sanitizeForExport(html: string): string {
  return DOMPurify.sanitize(html, {
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ["link"],
    ADD_ATTR: ["target", "crossorigin", "referrerpolicy"],
    FORBID_TAGS: ["script"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "onchange", "onsubmit", "onkeydown", "onkeyup", "onkeypress"],
  }) as string;
}

/**
 * Rewrite top-level body/html/:root CSS *selectors* to target the export
 * container. These selectors don't match when content lives inside a <div>.
 *
 * Only standalone root selectors are rewritten — never substrings inside
 * other selectors (`.card-body`), declaration values (`url("body.png")`),
 * or strings. A root token qualifies only when it sits on a selector
 * boundary: preceded by start-of-string, `{`, `}`, or `,` (optionally with
 * whitespace), and followed by a selector-valid continuation (`{`, `,`,
 * whitespace, combinators, `:`, `.`, `[`, `#`) or end-of-string.
 */
function rewriteSelectors(css: string): string {
  // (^|[{},]) captures the boundary; \s* swallows surrounding whitespace;
  // the lookahead asserts the next char keeps us in selector position.
  const rootSelector = /(^|[{},])(\s*)(?:html|body|:root)(?=$|[\s,{:.[#>+~])/g;
  return css.replace(rootSelector, "$1$2[data-export-root]");
}

/**
 * Force every JS-driven AE primitive in the cloned export DOM to its FINAL
 * visible state.
 *
 * The Phase 1 iframe runs with no scripts, so AE.* never executes and
 * primitives stay in their initial (pre-script) state: reveals are
 * opacity:0, accordions collapsed, counters show their start value, hidden
 * tab/step/toggle panels are display:none. This walks the host clone and
 * applies each primitive's end state via inline styles so the export
 * captures full content. Runs in the host document, so plain DOM APIs work.
 *
 * Every sub-step is guarded so one malformed node can't abort the export.
 */
function resolveAeStatic(root: HTMLElement): void {
  // ---- reveal: fade/translate in ----
  root.querySelectorAll<HTMLElement>('[data-ae="reveal"]').forEach((el) => {
    try {
      el.style.opacity = "1";
      el.style.transform = "none";
      el.style.transition = "none";
    } catch {
      /* skip malformed node */
    }
  });

  // ---- count: settle on the target value ----
  root.querySelectorAll<HTMLElement>('[data-ae="count"]').forEach((el) => {
    try {
      const to = parseFloat(el.getAttribute("data-ae-to") ?? "");
      if (Number.isFinite(to)) el.textContent = String(Math.round(to));
    } catch {
      /* skip malformed node */
    }
  });

  // ---- accordion: expand every section ----
  root.querySelectorAll<HTMLElement>('[data-ae="accordion"]').forEach((acc) => {
    try {
      acc.querySelectorAll<HTMLElement>("[data-ae-content]").forEach((content) => {
        content.style.maxHeight = "none";
        content.style.overflow = "visible";
        const toggle = content.parentElement?.querySelector<HTMLElement>("[data-ae-toggle]");
        toggle?.setAttribute("aria-expanded", "true");
      });
    } catch {
      /* skip malformed node */
    }
  });

  // ---- tabs: reveal all panels ----
  root.querySelectorAll<HTMLElement>('[data-ae="tabs"]').forEach((tabs) => {
    try {
      tabs.querySelectorAll<HTMLElement>("[data-ae-panel]").forEach((panel) => {
        panel.style.display = "";
      });
    } catch {
      /* skip malformed node */
    }
  });

  // ---- scrub: jump scroll-driven props to their end value ----
  root.querySelectorAll<HTMLElement>('[data-ae="scrub"]').forEach((el) => {
    try {
      const prop = el.getAttribute("data-ae-prop");
      const to = el.getAttribute("data-ae-to");
      if (!prop || to == null) return;
      const target = el.querySelector<HTMLElement>("[data-ae-target]") ?? el;
      // Mirror the runtime primitive: kebab → camelCase, assign bare value.
      const styleProp = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      if (prop === "stroke-dashoffset") {
        target.style.strokeDasharray = String(Math.abs(parseFloat(to) || 0));
      }
      (target.style as unknown as Record<string, string>)[styleProp] = to;
    } catch {
      /* skip malformed node */
    }
  });

  // ---- steps: show the whole walkthrough ----
  root.querySelectorAll<HTMLElement>('[data-ae="steps"]').forEach((wrap) => {
    try {
      wrap.querySelectorAll<HTMLElement>("[data-ae-step]").forEach((step) => {
        step.style.display = "";
      });
    } catch {
      /* skip malformed node */
    }
  });

  // ---- toggle: show every labeled state ----
  root.querySelectorAll<HTMLElement>('[data-ae="toggle"]').forEach((tg) => {
    try {
      tg.querySelectorAll<HTMLElement>("[data-ae-state]").forEach((state) => {
        state.style.display = "";
      });
    } catch {
      /* skip malformed node */
    }
  });

  // ---- compare: drop the clip so the after-layer is fully visible ----
  root.querySelectorAll<HTMLElement>('[data-ae="compare"]').forEach((cmp) => {
    try {
      const after = cmp.querySelector<HTMLElement>("[data-ae-after]");
      if (after) after.style.clipPath = "none";
    } catch {
      /* skip malformed node */
    }
  });

  // scrubber: intentionally left at its default/current state.
}

/**
 * Two-phase export: render in iframe (correct CSS resolution), then
 * clone into host div (html2canvas compatibility).
 *
 * Phase 1: iframe renders the full HTML document so body/html/:root
 *          selectors, tag attributes, and cascade all work correctly.
 * Phase 2: deep-clone the resolved DOM + rewritten styles into a host
 *          document div where html2canvas can capture it.
 */
export async function exportCanvas(options: ExportOptions): Promise<void> {
  const { html: rawHtml, format, filename = `ai-explain-${Date.now()}` } = options;
  const html = sanitizeForExport(rawHtml);

  // ── Phase 1: Render in iframe for correct CSS resolution ──────────

  const iframe = document.createElement("iframe");
  // allow-same-origin: required for iframeDoc.fonts, getComputedStyle,
  // querySelectorAll. No allow-scripts: blocks script execution even if
  // sanitizer missed something.
  iframe.setAttribute("sandbox", "allow-same-origin");
  iframe.style.cssText =
    "position:fixed;left:-9999px;top:0;width:1200px;border:none;visibility:hidden;";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument;
  if (!iframeDoc) throw new Error("Failed to access iframe document");
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for fonts inside iframe (5s timeout)
  await Promise.race([
    iframeDoc.fonts.ready,
    new Promise<void>((r) => setTimeout(r, 5000)),
  ]);

  // Resize iframe so content isn't clipped
  iframe.style.height = `${iframeDoc.documentElement.scrollHeight}px`;

  // Wait for all images inside iframe (10s timeout per image)
  const iframeImages = Array.from(iframeDoc.querySelectorAll("img"));
  if (iframeImages.length > 0) {
    await Promise.all(
      iframeImages.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }
            const t = setTimeout(resolve, 10000);
            img.onload = () => { clearTimeout(t); resolve(); };
            img.onerror = () => { clearTimeout(t); resolve(); };
          })
      )
    );
  }

  // Read computed styles from the iframe's body (correctly resolved)
  const iframeBodyStyle = getComputedStyle(iframeDoc.body);
  const iframeHtmlStyle = getComputedStyle(iframeDoc.documentElement);
  const isTransparent = (c: string) =>
    !c || c === "rgba(0, 0, 0, 0)" || c === "transparent";
  const backgroundColor = !isTransparent(iframeBodyStyle.backgroundColor)
    ? iframeBodyStyle.backgroundColor
    : !isTransparent(iframeHtmlStyle.backgroundColor)
      ? iframeHtmlStyle.backgroundColor
      : "#ffffff";

  // ── Phase 2: Clone into host document for html2canvas ─────────────

  const injectedFontLinks: HTMLLinkElement[] = [];
  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "position:fixed;left:-9999px;top:0;width:1200px;overflow:visible;";

  const container = document.createElement("div");
  container.setAttribute("data-export-root", "");
  // Apply resolved body styles so inherited properties (color, font) cascade
  container.style.cssText = [
    `background:${iframeBodyStyle.backgroundColor}`,
    `color:${iframeBodyStyle.color}`,
    `font-family:${iframeBodyStyle.fontFamily}`,
    `font-size:${iframeBodyStyle.fontSize}`,
    `line-height:${iframeBodyStyle.lineHeight}`,
    `margin:${iframeBodyStyle.margin}`,
    `padding:${iframeBodyStyle.padding}`,
    `width:1200px`,
  ].join(";");

  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  try {
    // Inject Google Fonts <link> tags into host <head>
    const fontLinks = Array.from(
      iframeDoc.querySelectorAll('link[href*="fonts.googleapis.com"]')
    );
    for (const link of fontLinks) {
      const cloned = document.createElement("link");
      for (const attr of Array.from(link.attributes)) {
        cloned.setAttribute(attr.name, attr.value);
      }
      document.head.appendChild(cloned);
      injectedFontLinks.push(cloned);
    }

    // Copy all <style> tags from iframe, rewriting body/html/:root selectors
    const iframeStyles = Array.from(iframeDoc.querySelectorAll("style"));
    for (const style of iframeStyles) {
      const rewritten = document.createElement("style");
      rewritten.textContent = rewriteSelectors(style.textContent ?? "");
      container.appendChild(rewritten);
    }

    // Deep-clone the body's children into the container
    for (const child of Array.from(iframeDoc.body.childNodes)) {
      container.appendChild(child.cloneNode(true));
    }

    // Force JS-driven AE primitives to their final visible state. The Phase 1
    // iframe ran without scripts, so reveals/accordions/tabs/counts are still
    // in their pre-script (often hidden) state — resolve them now in the host
    // document before html2canvas captures the clone.
    resolveAeStatic(container);

    // Done with iframe
    iframe.remove();

    // Wait for fonts in host document (may need to re-load from cache)
    await Promise.race([
      document.fonts.ready,
      new Promise<void>((r) => setTimeout(r, 5000)),
    ]);

    // Wait for cloned images to load in host context
    const hostImages = Array.from(container.querySelectorAll("img"));
    if (hostImages.length > 0) {
      await Promise.all(
        hostImages.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalWidth > 0) {
                resolve();
                return;
              }
              const t = setTimeout(resolve, 10000);
              img.onload = () => { clearTimeout(t); resolve(); };
              img.onerror = () => { clearTimeout(t); resolve(); };
            })
        )
      );
    }

    // Capture with html2canvas-pro (element is in host document)
    const html2canvas = (await import("html2canvas-pro")).default;
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: 1200,
      backgroundColor,
    });

    if (format === "png") {
      await exportPng(canvas, filename);
    } else {
      await exportPdf(canvas, filename);
    }
  } finally {
    wrapper.remove();
    iframe.parentNode?.removeChild(iframe); // safety — may already be removed
    for (const link of injectedFontLinks) {
      link.remove();
    }
  }
}

function exportPng(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create PNG blob"));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        resolve();
      },
      "image/png"
    );
  });
}

async function exportPdf(
  canvas: HTMLCanvasElement,
  filename: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const imgWidth = canvas.width / 2; // undo scale: 2
  const imgHeight = canvas.height / 2;

  // A4-proportioned pages at canvas width
  const pageWidth = imgWidth;
  const pageHeight = pageWidth * (297 / 210);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [pageWidth, pageHeight],
  });

  if (imgHeight <= pageHeight) {
    // Content fits in one page
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    doc.addImage(dataUrl, "JPEG", 0, 0, imgWidth, imgHeight);
  } else {
    // Multi-page: slice the canvas into page-sized chunks to avoid
    // toDataURL size limits and produce standard-sized PDF pages
    const totalPages = Math.ceil(imgHeight / pageHeight);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage([pageWidth, pageHeight], "portrait");

      const srcY = page * pageHeight * 2; // source Y in canvas pixels (scale:2)
      const sliceHeight = Math.min(pageHeight * 2, canvas.height - srcY);

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const ctx = pageCanvas.getContext("2d");
      if (!ctx) continue;

      ctx.drawImage(
        canvas,
        0, srcY, canvas.width, sliceHeight,
        0, 0, canvas.width, sliceHeight,
      );

      const dataUrl = pageCanvas.toDataURL("image/jpeg", 0.92);
      doc.addImage(dataUrl, "JPEG", 0, 0, imgWidth, sliceHeight / 2);
    }
  }

  doc.save(`${filename}.pdf`);
}
