import { StyleSheet } from "react-native";

import { Palette } from "@/constants/colors";

export const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: Palette.pageBackground,
	},
	scroll: {
		padding: 20,
		gap: 16,
		paddingBottom: 40,
	},
	header: {
		gap: 4,
	},
	title: {
		fontSize: 28,
		fontWeight: "700",
		color: Palette.text,
	},
	subtitle: {
		fontSize: 15,
		color: Palette.textMuted,
	},
	pieRow: {
		alignItems: "center",
		paddingVertical: 8,
	},
	totalAmount: {
		fontSize: 22,
		fontWeight: "700",
		color: Palette.text,
		marginTop: 4,
	},
	totalLabel: {
		fontSize: 12,
		color: Palette.textMuted,
		textTransform: "uppercase",
		letterSpacing: 0.6,
	},
	balanceCard: {
		backgroundColor: Palette.cardBackground,
		borderRadius: 20,
		padding: 16,
		gap: 4,
		shadowColor: Palette.shadow,
		shadowOpacity: 0.06,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 10,
		elevation: 2,
	},
	balanceHeaderRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	balanceLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: Palette.textMuted,
		textTransform: "uppercase",
		letterSpacing: 0.6,
	},
	balanceAmount: {
		fontSize: 32,
		fontWeight: "800",
		letterSpacing: -1,
	},
	balanceAmountNeg: {
		color: Palette.spent,
	},
	balanceSub: {
		fontSize: 12,
		color: Palette.textMuted,
	},
	infoBtn: {
		width: 22,
		height: 22,
		borderRadius: 11,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: Palette.surface,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: Palette.border,
	},
});
