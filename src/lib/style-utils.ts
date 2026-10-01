import type { StylePreset, CustomStyle } from "@/types/api";
import { getPresetByName } from "@/lib/styles";

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return { h: 0, s: 0, l: 50 };
  }
  const raw = hex.replace("#", "");
  const r = parseInt(raw.substring(0, 2), 16) / 255;
  const g = parseInt(raw.substring(2, 4), 16) / 255;
  const b = parseInt(raw.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round((n + m) * 255)));
    return clamped.toString(16).padStart(2, "0");
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function deriveColors(
  accentHex: string,
  mode: "light" | "dark",
): StylePreset["colors"] {
  const { h, s } = hexToHsl(accentHex);

  if (mode === "dark") {
    return {
      bg: hslToHex(h, Math.min(s, 30), 10),
      text: hslToHex(h, 10, 90),
      surface: hslToHex(h, Math.min(s, 25), 15),
      accent: accentHex,
    };
  }

  return {
    bg: hslToHex(h, Math.min(s, 30), 97),
    text: hslToHex(h, Math.min(s, 30), 15),
    surface: "#ffffff",
    accent: accentHex,
  };
}

export function buildCustomPreset(custom: CustomStyle): StylePreset {
  const fontSource = getPresetByName(custom.fontPairing) ?? getPresetByName("midnight-scholar")!;
  const colors = deriveColors(custom.accentColor, custom.mode);

  const { s } = hexToHsl(custom.accentColor);
  const vibrancy = s > 50 ? "vibrant" : "warm";
  const mood = `custom ${custom.mode}, ${vibrancy}`;

  return {
    name: `custom-${custom.mode}`,
    colors,
    fonts: { ...fontSource.fonts },
    mood,
  };
}
