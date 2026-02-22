export type ExportFormat = "png" | "pdf";

export interface ExportOptions {
  html: string;
  format: ExportFormat;
  filename?: string;
}

/**
 * Strips dangerous HTML content before rendering in the host document.
 * The canvas HTML is LLM-generated and normally runs inside sandbox="",
 * but export injects it into the host DOM — so we sanitize first.
 */
function sanitizeForExport(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=[^\s>]*/gi, "");
}

/**
 * Renders the canvas HTML offscreen and exports it as PNG or PDF.
 * Uses dynamic imports for html2canvas-pro and jspdf (browser-only libs).
 * Throws on failure — caller handles UI feedback.
 */
export async function exportCanvas(options: ExportOptions): Promise<void> {
  const { html: rawHtml, format, filename = `ai-explain-${Date.now()}` } = options;
  const html = sanitizeForExport(rawHtml);

  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;width:1200px;overflow:visible;";
  document.body.appendChild(container);

  const injectedFontLinks: HTMLLinkElement[] = [];

  try {
    // Extract Google Fonts <link> tags from the full HTML
    const fontLinkRegex = /<link[^>]*fonts\.googleapis\.com[^>]*>/gi;
    const fontLinkMatches = html.match(fontLinkRegex) ?? [];
    for (const linkStr of fontLinkMatches) {
      const temp = document.createElement("div");
      temp.innerHTML = linkStr;
      const link = temp.firstElementChild as HTMLLinkElement | null;
      if (link) {
        const cloned = document.createElement("link");
        for (const attr of Array.from(link.attributes)) {
          cloned.setAttribute(attr.name, attr.value);
        }
        document.head.appendChild(cloned);
        injectedFontLinks.push(cloned);
      }
    }

    // Extract <style> tags from <head> that contain @import font URLs
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const headContent = headMatch?.[1] ?? "";
    const headStyleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const importStyles: string[] = [];
    let headStyleMatch: RegExpExecArray | null;
    while ((headStyleMatch = headStyleRegex.exec(headContent)) !== null) {
      const styleContent = headStyleMatch[1];
      if (/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(styleContent)) {
        importStyles.push(headStyleMatch[0]);
      }
    }

    // Extract all <style> tags from the body (skip head font-import styles to avoid duplicates)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyContent = bodyMatch?.[1] ?? html;
    const bodyStyleRegex = /<style[^>]*>[\s\S]*?<\/style>/gi;
    const bodyStyles = bodyContent.match(bodyStyleRegex) ?? [];

    // Extract non-body styles from <head> (layout/theme styles, not font imports)
    const headNonFontStyles: string[] = [];
    const headStyleRegex2 = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let headStyleMatch2: RegExpExecArray | null;
    while ((headStyleMatch2 = headStyleRegex2.exec(headContent)) !== null) {
      const styleContent = headStyleMatch2[1];
      if (!/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(styleContent)) {
        headNonFontStyles.push(headStyleMatch2[0]);
      }
    }

    // Strip <style> tags from bodyContent to avoid duplication
    const bodyWithoutStyles = bodyContent.replace(bodyStyleRegex, "");

    // Combine: font imports + head styles + body styles + body content
    container.innerHTML = [
      ...importStyles,
      ...headNonFontStyles,
      ...bodyStyles,
      bodyWithoutStyles,
    ].join("\n");

    // Wait for fonts to load (5s timeout)
    await Promise.race([
      document.fonts.ready,
      new Promise<void>((r) => setTimeout(r, 5000)),
    ]);

    // Wait for all images to load (10s timeout per image)
    const images = Array.from(container.querySelectorAll("img"));
    if (images.length > 0) {
      await Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalWidth > 0) {
                resolve();
                return;
              }
              const timeout = setTimeout(resolve, 10000);
              img.onload = () => {
                clearTimeout(timeout);
                resolve();
              };
              img.onerror = () => {
                clearTimeout(timeout);
                resolve();
              };
            })
        )
      );
    }

    // Capture with html2canvas-pro
    const html2canvas = (await import("html2canvas-pro")).default;
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: 1200,
    });

    if (format === "png") {
      await exportPng(canvas, filename);
    } else {
      await exportPdf(canvas, filename);
    }
  } finally {
    // Cleanup: remove offscreen container and injected font links
    container.remove();
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
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

  const width = canvas.width / 2; // undo scale: 2
  const height = canvas.height / 2;

  const doc = new jsPDF({
    orientation: width > height ? "landscape" : "portrait",
    unit: "px",
    format: [width, height],
  });

  doc.addImage(dataUrl, "JPEG", 0, 0, width, height);
  doc.save(`${filename}.pdf`);
}
