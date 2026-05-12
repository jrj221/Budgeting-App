import { StyleSheet } from "react-native";

import { Palette } from "@/constants/colors";

const DIM = "rgba(15, 23, 42, 0.55)";

export const tourStyles = StyleSheet.create({
	fill: {
		...StyleSheet.absoluteFillObject,
	},
	dim: {
		backgroundColor: DIM,
	},
	centerWrap: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
	},
	card: {
		backgroundColor: Palette.cardBackground,
		borderRadius: 18,
		padding: 18,
		gap: 8,
		width: "100%",
		maxWidth: 360,
		shadowColor: Palette.shadow,
		shadowOpacity: 0.18,
		shadowOffset: { width: 0, height: 6 },
		shadowRadius: 18,
		elevation: 6,
	},
	cardEyebrow: {
		fontSize: 12,
		fontWeight: "700",
		color: Palette.brand,
		textTransform: "uppercase",
		letterSpacing: 0.6,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: Palette.text,
	},
	cardBody: {
		fontSize: 14,
		color: Palette.textMuted,
		lineHeight: 19,
	},
	cardActions: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: 8,
	},
	primaryBtn: {
		backgroundColor: Palette.brand,
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 999,
	},
	primaryText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 14,
	},
	skipBtn: {
		paddingHorizontal: 8,
		paddingVertical: 8,
	},
	skipText: {
		color: Palette.textMuted,
		fontSize: 13,
		fontWeight: "600",
	},
	tooltip: {
		backgroundColor: Palette.cardBackground,
		borderRadius: 14,
		padding: 14,
		gap: 4,
		shadowColor: Palette.shadow,
		shadowOpacity: 0.18,
		shadowOffset: { width: 0, height: 4 },
		shadowRadius: 12,
		elevation: 6,
	},
	tooltipTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: Palette.text,
	},
	tooltipBody: {
		fontSize: 13,
		color: Palette.textMuted,
		lineHeight: 18,
	},
	tooltipFooter: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: 8,
	},
	tooltipStep: {
		fontSize: 11,
		color: Palette.textMuted,
		fontWeight: "600",
	},
	tooltipSkip: {
		fontSize: 12,
		color: Palette.brand,
		fontWeight: "700",
	},
	ring: {
		borderColor: Palette.brand,
		borderWidth: 2,
		borderRadius: 16,
		backgroundColor: "rgba(61, 149, 206, 0.08)",
	},
});
