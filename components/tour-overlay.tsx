import { usePathname } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { tourStyles as styles } from "@/components/tour-overlay.styles";
import { TOUR_STEPS, useTour } from "@/contexts/tour-context";
import { useAppTheme } from "@/contexts/theme-context";

const TAB_COUNT = 5;
const TAB_BAR_CONTENT_HEIGHT = 49;
const TOTAL_INFO_STEPS = TOUR_STEPS.filter((s) => s.kind === "info").length;

function computeDisplayStep(stepIdx: number): number {
	let count = 0;
	for (let i = 0; i <= stepIdx; i++) {
		if (TOUR_STEPS[i].kind === "info") count++;
	}
	if (TOUR_STEPS[stepIdx]?.kind === "tap-tab") {
		for (let i = stepIdx + 1; i < TOUR_STEPS.length; i++) {
			if (TOUR_STEPS[i].kind === "info") {
				count++;
				break;
			}
		}
	}
	return Math.max(1, Math.min(count, TOTAL_INFO_STEPS));
}

export function TourOverlay() {
	const { scheme } = useAppTheme();
	const { stepIndex, advance, skip } = useTour();
	const pathname = usePathname();
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();

	const step = stepIndex !== null ? TOUR_STEPS[stepIndex] : null;

	useEffect(() => {
		if (!step || step.kind !== "tap-tab") return;
		if (pathname === step.expectedPath) {
			const t = setTimeout(() => advance(), 250);
			return () => clearTimeout(t);
		}
		return;
	}, [pathname, step, advance]);

	if (!step) return null;

	const tabBarTotalH = TAB_BAR_CONTENT_HEIGHT + insets.bottom;
	const tabBarTop = height - tabBarTotalH;
	const tabW = width / TAB_COUNT;
	const tabX = tabW * step.tabIndex;
	const stepNumber = computeDisplayStep(stepIndex ?? 0);

	if (step.kind === "info") {
		return (
			<View style={styles.fill} pointerEvents="auto">
				<Pressable style={[styles.fill, { backgroundColor: "rgba(15, 23, 42, 0.25)" }]} />
				<View style={styles.centerWrap} pointerEvents="box-none">
					<View style={[styles.card, { backgroundColor: scheme.cardBackground }]}>
						<Text style={styles.cardEyebrow}>
							Step {stepNumber} of {TOTAL_INFO_STEPS}
						</Text>
						<Text style={styles.cardTitle}>{step.title}</Text>
						<Text style={styles.cardBody}>{step.body}</Text>
						<View style={styles.cardActions}>
							<Pressable onPress={skip} style={styles.skipBtn} hitSlop={8}>
								<Text style={styles.skipText}>Skip tour</Text>
							</Pressable>
							<Pressable onPress={advance} style={styles.primaryBtn}>
								<Text style={styles.primaryText}>Got it</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</View>
		);
	}

	// tap-tab: dim around the highlighted tab + tooltip above it
	const tooltipMargin = 16;
	const tooltipMaxWidth = Math.min(320, width - 32);
	const tooltipBottom = tabBarTotalH + tooltipMargin;
	// tooltip horizontal anchor: centered above tab, clamped to screen
	let tooltipLeft = tabX + tabW / 2 - tooltipMaxWidth / 2;
	if (tooltipLeft < 16) tooltipLeft = 16;
	if (tooltipLeft + tooltipMaxWidth > width - 16) {
		tooltipLeft = width - 16 - tooltipMaxWidth;
	}

	return (
		<View style={styles.fill} pointerEvents="box-none">
			{/* dim above tab bar */}
			<Pressable
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: tabBarTop,
					...styleDim(),
				}}
			/>
			{/* dim left of highlighted tab */}
			{tabX > 0 && (
				<Pressable
					style={{
						position: "absolute",
						top: tabBarTop,
						left: 0,
						width: tabX,
						height: tabBarTotalH,
						...styleDim(),
					}}
				/>
			)}
			{/* dim right of highlighted tab */}
			{tabX + tabW < width && (
				<Pressable
					style={{
						position: "absolute",
						top: tabBarTop,
						left: tabX + tabW,
						width: width - (tabX + tabW),
						height: tabBarTotalH,
						...styleDim(),
					}}
				/>
			)}
			{/* highlight ring around the highlighted tab */}
			{(() => {
				const RING_HEIGHT = TAB_BAR_CONTENT_HEIGHT; // sit just inside the navbar
				const ringTop = tabBarTop + 2;
				const ringLeft = tabX + 8;
				const ringWidth = tabW - 16;
				return (
					<View
						pointerEvents="none"
						style={[
							styles.ring,
							{
								position: "absolute",
								top: ringTop,
								left: ringLeft,
								width: ringWidth,
								height: RING_HEIGHT,
								borderRadius: 14,
							},
						]}
					/>
				);
			})()}
			{/* tooltip */}
			<View
				pointerEvents="box-none"
				style={{
					position: "absolute",
					left: tooltipLeft,
					bottom: tooltipBottom,
					width: tooltipMaxWidth,
				}}
			>
				<View style={[styles.tooltip, { backgroundColor: scheme.cardBackground }]}>
					<Text style={styles.tooltipTitle}>{step.title}</Text>
					<Text style={styles.tooltipBody}>{step.body}</Text>
					<View style={styles.tooltipFooter}>
						<Text style={styles.tooltipStep}>
							Step {stepNumber} of {TOTAL_INFO_STEPS}
						</Text>
						<Pressable onPress={skip} hitSlop={8}>
							<Text style={styles.tooltipSkip}>Skip tour</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</View>
	);
}

function styleDim() {
	return { backgroundColor: "rgba(15, 23, 42, 0.55)" };
}
