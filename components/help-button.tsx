import { Ionicons } from "@expo/vector-icons";
import { RefObject } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { useAppTheme } from "@/contexts/theme-context";
import { ScreenTourStep, useScreenTour } from "@/contexts/screen-tour-context";

type HelpButtonProps = {
	steps: ScreenTourStep[];
	stepTargets?: (RefObject<View | null> | null)[];
	scrollRef?: RefObject<ScrollView | null>;
	onStart?: () => void;
	onDismiss?: () => void;
};

export function HelpButton({ steps, stepTargets, scrollRef, onStart, onDismiss }: HelpButtonProps) {
	const { scheme } = useAppTheme();
	const { startTour } = useScreenTour();

	return (
		<Pressable
			onPress={() => startTour(steps, { stepTargets, scrollRef, onStart, onDismiss })}
			hitSlop={10}
			style={[styles.btn, { backgroundColor: scheme.surface, borderColor: scheme.border }]}
			accessibilityLabel="Help"
			accessibilityRole="button"
		>
			<Ionicons name="help" size={14} color={scheme.textMuted} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	btn: {
		width: 28,
		height: 28,
		borderRadius: 14,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
});
