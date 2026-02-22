import type { StylePreset } from "@/types/api";

const presets: StylePreset[] = [
  {
    name: "midnight-scholar",
    colors: { bg: "#0f172a", text: "#e2e8f0", accent: "#38bdf8", surface: "#1e293b" },
    fonts: { heading: "Space Grotesk", body: "Inter" },
    mood: "dark, technical, clean",
  },
  {
    name: "warm-notebook",
    colors: { bg: "#fef3c7", text: "#451a03", accent: "#d97706", surface: "#ffffff" },
    fonts: { heading: "Playfair Display", body: "Source Sans 3" },
    mood: "warm, editorial, approachable",
  },
  {
    name: "forest-green",
    colors: { bg: "#064e3b", text: "#d1fae5", accent: "#34d399", surface: "#065f46" },
    fonts: { heading: "Merriweather", body: "Lato" },
    mood: "natural, calm, earthy",
  },
  {
    name: "sunset-coral",
    colors: { bg: "#fff1f2", text: "#4c0519", accent: "#f43f5e", surface: "#ffffff" },
    fonts: { heading: "Poppins", body: "Nunito" },
    mood: "energetic, vibrant, friendly",
  },
  {
    name: "ocean-deep",
    colors: { bg: "#0c4a6e", text: "#e0f2fe", accent: "#0ea5e9", surface: "#075985" },
    fonts: { heading: "Archivo", body: "IBM Plex Sans" },
    mood: "professional, deep, modern",
  },
  {
    name: "lavender-dream",
    colors: { bg: "#faf5ff", text: "#3b0764", accent: "#a855f7", surface: "#ffffff" },
    fonts: { heading: "DM Serif Display", body: "DM Sans" },
    mood: "elegant, soft, creative",
  },
  {
    name: "charcoal-minimal",
    colors: { bg: "#18181b", text: "#fafafa", accent: "#a1a1aa", surface: "#27272a" },
    fonts: { heading: "Geist", body: "Geist Mono" },
    mood: "stark, focused, monochrome",
  },
  {
    name: "terracotta",
    colors: { bg: "#fef2f2", text: "#7c2d12", accent: "#ea580c", surface: "#ffffff" },
    fonts: { heading: "Libre Baskerville", body: "Karla" },
    mood: "classic, warm, grounded",
  },
  {
    name: "arctic-frost",
    colors: { bg: "#f0f9ff", text: "#0c4a6e", accent: "#06b6d4", surface: "#ffffff" },
    fonts: { heading: "Outfit", body: "Work Sans" },
    mood: "crisp, airy, minimal",
  },
  {
    name: "golden-hour",
    colors: { bg: "#fffbeb", text: "#78350f", accent: "#f59e0b", surface: "#ffffff" },
    fonts: { heading: "Cormorant Garamond", body: "Fira Sans" },
    mood: "luxurious, refined, warm",
  },
];

export function getRandomPreset(): StylePreset {
  return presets[Math.floor(Math.random() * presets.length)];
}
