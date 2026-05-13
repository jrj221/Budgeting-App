import { StyleSheet } from "react-native";

import { Palette } from "@/constants/colors";

export const budgetCardStyles = StyleSheet.create({
	container: {
		backgroundColor: Palette.cardBackground,
		borderRadius: 20,
		padding: 16,
		gap: 14,
		shadowColor: Palette.shadow,
		shadowOpacity: 0.06,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 10,
		elevation: 2,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 8,
	},
	headerLeft: {
		gap: 2,
		flex: 1,
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
	toggle: {
		flexDirection: "row",
		backgroundColor: Palette.toggleTrack,
		borderRadius: 999,
		padding: 3,
	},
	toggleBtn: {
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 999,
	},
	toggleBtnActive: {
		backgroundColor: Palette.cardBackground,
		shadowColor: Palette.shadow,
		shadowOpacity: 0.06,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
	},
	toggleText: {
		fontSize: 13,
		fontWeight: "600",
		color: Palette.textSubtle,
	},
	toggleTextActive: {
		color: Palette.text,
	},
	plusBtn: {
		width: 50,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: Palette.surface,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: Palette.border,
	},
	list: {
		gap: 12,
	},
	row: {
		gap: 6,
	},
	rowHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 10,
	},
	rowLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		flex: 1,
	},
	dot: {
		width: 28,
		height: 28,
		borderRadius: 14,
	},
	rowName: {
		fontSize: 14,
		fontWeight: "600",
		color: Palette.text,
	},
	rowAmounts: {
		fontSize: 13,
		color: Palette.text,
		fontWeight: "600",
	},
	rowAmountsOver: {
		color: Palette.spent,
	},
	rowMeta: {
		fontSize: 12,
		color: Palette.textMuted,
	},
	empty: {
		alignItems: "center",
		paddingVertical: 16,
		gap: 8,
	},
	emptyText: {
		fontSize: 13,
		color: Palette.textMuted,
		textAlign: "center",
	},
	emptyCta: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: Palette.brand,
	},
	emptyCtaText: {
		color: "#fff",
		fontSize: 13,
		fontWeight: "700",
	},
	legend: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingTop: 4,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: Palette.border,
		marginTop: 4,
	},
	legendItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	legendSwatch: {
		width: 14,
		height: 8,
		borderRadius: 2,
	},
	legendStripe: {
		width: 14,
		height: 8,
		borderRadius: 2,
	},
	legendText: {
		fontSize: 12,
		color: Palette.textMuted,
	},
});
