import type { TransactionMode } from "@/components/add-transaction-card.presenter";

export const Palette = {
	brand: "#006199",
	spent: "#e53935",
	earned: "#22a06b",

	pageBackground: "#f5f7fa",
	cardBackground: "#fff",
	surface: "#f7f8fa",
	border: "#e6e8eb",
	toggleTrack: "#f1f3f5",
	shadow: "#000",
	transparent: "transparent",

	text: "#11181C",
	textMuted: "#687076",
	textSubtle: "#777",
	amountPlaceholder: "#c4c8cc",
	iconMuted: "#9aa0a6",

	sheetHandle: "#d0d4d9",
	switchTrackOff: "#b6bcc3",
	submitDisabled: "#cfd8dc",
	uncategorized: "#9aa0a6",
} as const;

export const CategoryColorPalette: readonly string[] = [
	"#ef4444",
	"#f59e0b",
	"#eab308",
	"#84cc16",
	"#10b981",
	"#06b6d4",
	"#3b82f6",
	"#6366f1",
	"#a855f7",
	"#ec4899",
	"#f97316",
	"#14b8a6",
];

export function pickNextCategoryColor(usedColors: readonly string[]): string {
	for (const color of CategoryColorPalette) {
		if (!usedColors.includes(color)) return color;
	}
	return CategoryColorPalette[usedColors.length % CategoryColorPalette.length];
}

export type ColorScheme = {
	id: string;
	name: string;
	background: string;
	cardBackground: string;
	surface: string;
	toggleTrack: string;
	border: string;
	text: string;
	textMuted: string;
	lineChart: string;
};

export const COLOR_SCHEMES: ColorScheme[] = [
	{
		id: "default",
		name: "Daylight",
		background: "#f5f7fa",
		cardBackground: "rgba(255,255,255,0.80)",
		surface: "#eef0f3",
		toggleTrack: "#e6e9ed",
		border: "#dde1e6",
		text: "#11181C",
		textMuted: "#687076",
		lineChart: "#3D95CE",
	},
	{
		id: "midnight",
		name: "Midnight",
		background: "#0f172a",
		cardBackground: "rgba(255,255,255,0.07)",
		surface: "#1a2235",
		toggleTrack: "#232e44",
		border: "rgba(255,255,255,0.12)",
		text: "#e2e8f0",
		textMuted: "#94a3b8",
		lineChart: "#38bdf8",
	},
	{
		id: "forest",
		name: "Forest",
		background: "#14241b",
		cardBackground: "rgba(255,255,255,0.07)",
		surface: "#1e3024",
		toggleTrack: "#263a2d",
		border: "rgba(255,255,255,0.12)",
		text: "#e7f4ea",
		textMuted: "#a8c0ad",
		lineChart: "#4ade80",
	},
	{
		id: "sunset",
		name: "Sunset",
		background: "#fff4e6",
		cardBackground: "rgba(255,255,255,0.70)",
		surface: "#ffecd4",
		toggleTrack: "#fde3c5",
		border: "#f0cfa5",
		text: "#7c2d12",
		textMuted: "#a8745a",
		lineChart: "#ea580c",
	},
	{
		id: "blossom",
		name: "Blossom",
		background: "#fdf2f8",
		cardBackground: "rgba(255,255,255,0.70)",
		surface: "#fae8f4",
		toggleTrack: "#f5ddef",
		border: "#eacce4",
		text: "#831843",
		textMuted: "#a8638b",
		lineChart: "#ec4899",
	},
	{
		id: "ocean",
		name: "Ocean",
		background: "#0d1b2a",
		cardBackground: "rgba(255,255,255,0.07)",
		surface: "#172436",
		toggleTrack: "#1f2f42",
		border: "rgba(255,255,255,0.12)",
		text: "#cce5f8",
		textMuted: "#7aa0be",
		lineChart: "#38bdf8",
	},
	{
		id: "lavender",
		name: "Lavender",
		background: "#f3f0ff",
		cardBackground: "rgba(255,255,255,0.72)",
		surface: "#e9e5ff",
		toggleTrack: "#dfd9ff",
		border: "#cec6ff",
		text: "#3b1e7c",
		textMuted: "#7c64ad",
		lineChart: "#7c3aed",
	},
	{
		id: "dusk",
		name: "Dusk",
		background: "#1a1728",
		cardBackground: "rgba(255,255,255,0.07)",
		surface: "#221f35",
		toggleTrack: "#2b2840",
		border: "rgba(255,255,255,0.12)",
		text: "#e9d5ff",
		textMuted: "#9d84bb",
		lineChart: "#c084fc",
	},
];

export const DEFAULT_COLOR_SCHEME_ID = "default";

export function isColorSchemeDark(scheme: ColorScheme): boolean {
	const bg = scheme.background.replace('#', '');
	if (bg.length !== 6) return false;
	const r = parseInt(bg.slice(0, 2), 16);
	const g = parseInt(bg.slice(2, 4), 16);
	const b = parseInt(bg.slice(4, 6), 16);
	return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

export function paleColor(hex: string, blend = 0.82): string {
	const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
	if (!m) return "#f1f3f5";
	const n = parseInt(m[1], 16);
	const r = (n >> 16) & 0xff;
	const g = (n >> 8) & 0xff;
	const b = n & 0xff;
	const mix = (c: number) => Math.round(c + (255 - c) * blend);
	const out = (mix(r) << 16) | (mix(g) << 8) | mix(b);
	return `#${out.toString(16).padStart(6, "0")}`;
}

export const ModeColors: Record<TransactionMode, string> = {
	spent: Palette.spent,
	earned: Palette.earned,
};
