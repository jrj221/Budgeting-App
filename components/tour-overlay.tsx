import { usePathname } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { tourStyles as styles } from "@/components/tour-overlay.styles";
import { useAppTheme } from "@/contexts/theme-context";
import { TOUR_STEPS, useTour } from "@/contexts/tour-context";

const TAB_COUNT = 5;
const TAB_BAR_CONTENT_HEIGHT = 49;
const TOTAL_INFO_STEPS = TOUR_STEPS.filter((s) => s.kind === "info").length;

// Add button geometry (must match _layout.tsx AddTabButton styles)
const ADD_TAB_INDEX = 2;
const ADD_BTN_SIZE = 54;
const ADD_BTN_MARGIN_BOTTOM = 16;
// The button + its margin form a 70px effective flex-child in a 49px container.
// justifyContent:center centers the 70px box, putting the button's visual top at -10.5px.
const ADD_BTN_TOP_IN_TAB_BAR = (TAB_BAR_CONTENT_HEIGHT - (ADD_BTN_SIZE + ADD_BTN_MARGIN_BOTTOM)) / 2;
// Center of the button relative to the tab bar's top edge.
const ADD_BTN_CENTER_Y_IN_TAB_BAR = ADD_BTN_TOP_IN_TAB_BAR + ADD_BTN_SIZE / 2; // ≈ 16.5
const ADD_SPOTLIGHT_PADDING = 12;

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
					<View
						style={[
							styles.card,
							{ backgroundColor: scheme.surface, borderColor: scheme.border, borderWidth: 1 },
						]}
					>
						<Text style={styles.cardEyebrow}>
							Step {stepNumber} of {TOTAL_INFO_STEPS}
						</Text>
						<Text style={[styles.cardTitle, { color: scheme.text }]}>{step.title}</Text>
						<Text style={[styles.cardBody, { color: scheme.textMuted }]}>{step.body}</Text>
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
	// tooltip horizontal anchor: centered above tab, clamped to screen
	let tooltipLeft = tabX + tabW / 2 - tooltipMaxWidth / 2;
	if (tooltipLeft < 16) tooltipLeft = 16;
	if (tooltipLeft + tooltipMaxWidth > width - 16) tooltipLeft = width - 16 - tooltipMaxWidth;

	const tooltip = (tooltipBottom: number) => (
		<View
			pointerEvents="box-none"
			style={{ position: "absolute", left: tooltipLeft, bottom: tooltipBottom, width: tooltipMaxWidth }}
		>
			<View style={[styles.tooltip, { backgroundColor: scheme.surface, borderColor: scheme.border }]}>
				<Text style={[styles.tooltipTitle, { color: scheme.text }]}>{step.title}</Text>
				<Text style={[styles.tooltipBody, { color: scheme.textMuted }]}>{step.body}</Text>
				<View style={styles.tooltipFooter}>
					<Text style={styles.tooltipStep}>Step {stepNumber} of {TOTAL_INFO_STEPS}</Text>
					<Pressable onPress={skip} hitSlop={8}>
						<Text style={styles.tooltipSkip}>Skip tour</Text>
					</Pressable>
				</View>
			</View>
		</View>
	);

	// ── Add tab: circular spotlight that tracks the elevated round button ──────
	if (step.tabIndex === ADD_TAB_INDEX) {
		const btnCenterX = tabX + tabW / 2;
		const btnCenterY = tabBarTop + ADD_BTN_CENTER_Y_IN_TAB_BAR;
		const r = ADD_BTN_SIZE / 2 + ADD_SPOTLIGHT_PADDING; // spotlight radius

		const cLeft = btnCenterX - r;
		const cTop = btnCenterY - r;
		const cSize = r * 2;

		// Tooltip sits above the spotlight circle.
		const circleTooltipBottom = height - cTop + tooltipMargin;

		return (
			<View style={styles.fill} pointerEvents="box-none">
				{/* dim above circle */}
				<Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, height: Math.max(0, cTop), ...styleDim() }} />
				{/* dim below circle */}
				<Pressable style={{ position: "absolute", top: cTop + cSize, left: 0, right: 0, bottom: 0, ...styleDim() }} />
				{/* dim left of circle */}
				<Pressable style={{ position: "absolute", top: cTop, left: 0, width: Math.max(0, cLeft), height: cSize, ...styleDim() }} />
				{/* dim right of circle */}
				<Pressable style={{ position: "absolute", top: cTop, left: cLeft + cSize, right: 0, height: cSize, ...styleDim() }} />
				{tooltip(circleTooltipBottom)}
			</View>
		);
	}

	// ── Regular tab: rectangular spotlight ────────────────────────────────────
	return (
		<View style={styles.fill} pointerEvents="box-none">
			{/* dim above tab bar */}
			<Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, height: tabBarTop, ...styleDim() }} />
			{/* dim left of highlighted tab */}
			{tabX > 0 && (
				<Pressable style={{ position: "absolute", top: tabBarTop, left: 0, width: tabX, height: tabBarTotalH, ...styleDim() }} />
			)}
			{/* dim right of highlighted tab */}
			{tabX + tabW < width && (
				<Pressable style={{ position: "absolute", top: tabBarTop, left: tabX + tabW, width: width - (tabX + tabW), height: tabBarTotalH, ...styleDim() }} />
			)}
			{/* rectangular highlight ring */}
			<View
				pointerEvents="none"
				style={[styles.ring, { position: "absolute", top: tabBarTop + 2, left: tabX + 8, width: tabW - 16, height: TAB_BAR_CONTENT_HEIGHT, borderRadius: 14 }]}
			/>
			{tooltip(tabBarTotalH + tooltipMargin)}
		</View>
	);
}

function styleDim() {
	return { backgroundColor: "rgba(15, 23, 42, 0.55)" };
}
