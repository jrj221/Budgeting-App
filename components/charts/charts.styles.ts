import { StyleSheet } from "react-native";

import { Palette } from "@/constants/colors";

export const chartStyles = StyleSheet.create({
	container: {
		backgroundColor: Palette.cardBackground,
		borderRadius: 20,
		padding: 16,
		shadowColor: Palette.shadow,
		shadowOpacity: 0.06,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 10,
		elevation: 2,
		gap: 12,
	},
	title: {
		fontSize: 16,
		fontWeight: "700",
		color: Palette.text,
	},
	subtitle: {
		fontSize: 13,
		color: Palette.textMuted,
	},
	canvasWrap: {
		position: "relative",
	},
	axisLabel: {
		position: "absolute",
		fontSize: 10,
		color: Palette.textMuted,
	},
	empty: {
		paddingVertical: 32,
		alignItems: "center",
		gap: 8,
	},
	emptyText: {
		fontSize: 14,
		color: Palette.textMuted,
		textAlign: "center",
	},
	legend: {
		gap: 8,
	},
	legendRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	legendLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		flex: 1,
	},
	legendDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
	},
	legendName: {
		fontSize: 14,
		color: Palette.text,
	},
	legendValue: {
		fontSize: 14,
		fontWeight: "600",
		color: Palette.text,
	},
	legendPercent: {
		fontSize: 12,
		color: Palette.textMuted,
	},
	tooltip: {
		minHeight: 44,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 4,
	},
	tooltipDate: {
		fontSize: 13,
		color: Palette.textMuted,
	},
	tooltipAmount: {
		fontSize: 18,
		fontWeight: "700",
	},
	tooltipHint: {
		fontSize: 12,
		color: Palette.textMuted,
		fontStyle: "italic",
	},
	pieLabelName: {
		fontSize: 14,
		fontWeight: "600",
		color: Palette.text,
		textAlign: "center",
	},
	pieLabelValue: {
		fontSize: 18,
		fontWeight: "700",
		color: Palette.text,
		textAlign: "center",
		marginTop: 2,
	},
	pieLabelPercent: {
		fontSize: 12,
		color: Palette.textMuted,
		marginTop: 2,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		gap: 12,
	},
	headerLeft: {
		flex: 1,
		gap: 2,
	},
	filterButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 10,
		paddingVertical: 6,
		backgroundColor: Palette.surface,
		borderRadius: 999,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: Palette.border,
	},
	filterText: {
		fontSize: 13,
		color: Palette.text,
		fontWeight: "600",
	},
	menuOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.25)",
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 32,
	},
	menuCard: {
		backgroundColor: Palette.cardBackground,
		borderRadius: 14,
		width: "100%",
		maxHeight: "70%",
		paddingVertical: 4,
		shadowColor: Palette.shadow,
		shadowOpacity: 0.15,
		shadowOffset: { width: 0, height: 6 },
		shadowRadius: 18,
		elevation: 6,
	},
	menuScroll: {
		flexGrow: 0,
	},
	menuRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: Palette.border,
	},
	menuRowText: {
		fontSize: 16,
		color: Palette.text,
	},
});
