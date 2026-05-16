import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Palette } from "@/constants/colors";
import { useAppTheme } from "@/contexts/theme-context";
import { TOUR_STEPS, useTour } from "@/contexts/tour-context";

type IconName = ComponentProps<typeof IconSymbol>["name"];

function TourAwareTabIcon({ color, name, tabIndex }: { color: string; name: IconName; tabIndex: number }) {
	const { stepIndex } = useTour();
	const step = stepIndex !== null ? TOUR_STEPS[stepIndex] : null;
	const isTarget = step?.kind === "tap-tab" && step.tabIndex === tabIndex;
	return <IconSymbol size={28} name={name} color={isTarget ? Palette.brand : color} />;
}

function AddTabButton({ onPress, accessibilityLabel, accessibilityState }: BottomTabBarButtonProps) {
	const { scheme } = useAppTheme();
	const { stepIndex } = useTour();
	const step = stepIndex !== null ? TOUR_STEPS[stepIndex] : null;
	const isTarget = step?.kind === "tap-tab" && step.tabIndex === 2;

	return (
		<Pressable
			onPress={(e) => {
				if (process.env.EXPO_OS === "ios") {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
				}
				onPress?.(e);
			}}
			style={styles.addTabOuter}
			accessibilityLabel={accessibilityLabel}
			accessibilityState={accessibilityState}
		>
			<View
				style={[
					styles.addTabBtn,
					{ backgroundColor: isTarget ? scheme.lineChart : Palette.brand },
				]}
			>
				<Ionicons name="add" size={28} color="#fff" />
			</View>
		</Pressable>
	);
}

export default function TabLayout() {
	const { scheme } = useAppTheme();

	return (
		<Tabs
			initialRouteName="overview"
			screenOptions={{
				lazy: false,
				tabBarActiveTintColor: scheme.lineChart,
				tabBarInactiveTintColor: scheme.text,
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarStyle: {
					backgroundColor: scheme.toggleTrack,
					borderTopColor: scheme.border,
					borderTopWidth: 2,
				},
			}}
		>
			<Tabs.Screen
				name="overview"
				options={{
					title: "Home",
					tabBarIcon: ({ color }) => <TourAwareTabIcon color={color} name="house.fill" tabIndex={0} />,
				}}
			/>
			<Tabs.Screen
				name="goals"
				options={{
					title: "Goals",
					tabBarIcon: ({ color }) => <TourAwareTabIcon color={color} name="flag.fill" tabIndex={1} />,
				}}
			/>
			<Tabs.Screen
				name="index"
				options={{
					title: "Add",
					tabBarButton: AddTabButton,
				}}
			/>
			<Tabs.Screen
				name="history"
				options={{
					title: "History",
					tabBarIcon: ({ color }) => <TourAwareTabIcon color={color} name="clock.fill" tabIndex={3} />,
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Settings",
					tabBarIcon: ({ color }) => <TourAwareTabIcon color={color} name="gearshape.fill" tabIndex={4} />,
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	addTabOuter: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	addTabBtn: {
		width: 54,
		height: 54,
		borderRadius: 27,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
		shadowColor: "#000",
		shadowOpacity: 0.22,
		shadowOffset: { width: 0, height: 4 },
		shadowRadius: 8,
		elevation: 6,
	},
});
