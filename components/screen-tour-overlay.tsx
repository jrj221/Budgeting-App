import { useEffect, useRef, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { tourStyles } from "@/components/tour-overlay.styles";
import { Palette } from "@/constants/colors";
import { useScreenTour } from "@/contexts/screen-tour-context";
import { useAppTheme } from "@/contexts/theme-context";

const DIM = "rgba(15, 23, 42, 0.62)";
const HIGHLIGHT_PADDING = 10;
const TOOLTIP_GAP = 14;
const TAB_BAR_HEIGHT = 49;

type Rect = { x: number; y: number; width: number; height: number };

export function ScreenTourOverlay() {
	const { scheme } = useAppTheme();
	const { steps, stepIndex, stepTargets, scrollRef, advance, dismiss } = useScreenTour();
	const { width: screenW, height: screenH } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const [highlight, setHighlight] = useState<Rect | null>(null);
	const [tooltipHeight, setTooltipHeight] = useState(160);
	const prevStepIndex = useRef<number | null>(null);
	const prevTargetNode = useRef<View | null>(null);

	const tabBarBottom = insets.bottom + TAB_BAR_HEIGHT;
	const visibleH = screenH - insets.top - tabBarBottom;

	useEffect(() => {
		if (stepIndex === null) {
			setHighlight(null);
			prevStepIndex.current = null;
			prevTargetNode.current = null;
			return;
		}

		// Same step re-rendered (e.g. theme change) — don't re-scroll.
		if (prevStepIndex.current === stepIndex) return;
		prevStepIndex.current = stepIndex;

		const target = stepTargets?.[stepIndex]?.current ?? null;
		const scroll = scrollRef?.current ?? null;

		// Same View node as the previous step — keep the existing highlight and let
		// only the tooltip text update. No scroll, no flash.
		if (target !== null && target === prevTargetNode.current) return;

		prevTargetNode.current = target;
		setHighlight(null);

		if (!target) return;

		const doMeasure = () => {
			target.measure((_x, _y, w, h, pageX, pageY) => {
				setHighlight({ x: pageX, y: pageY, width: w, height: h });
			});
		};

		if (scroll) {
			// Measure the element's position relative to the scroll view content,
			// then scroll to place it in the upper portion of the visible area.
			(target as any).measureLayout(
				scroll,
				(_lx: number, ly: number, _lw: number, lh: number) => {
					// Center the element vertically, biased to the upper third so the tooltip
					// has room below it.
					const desiredTop = ly - visibleH * 0.28;
					scroll.scrollTo({ y: Math.max(0, desiredTop), animated: true });
					// Wait for the scroll animation to settle, then read absolute position.
					setTimeout(doMeasure, 380);
				},
				doMeasure, // fallback if measureLayout fails
			);
		} else {
			doMeasure();
		}
	}, [stepIndex, stepTargets, scrollRef, visibleH]);

	if (stepIndex === null || !steps) return null;

	const step = steps[stepIndex];
	const isLast = stepIndex === steps.length - 1;
	const hasTarget = !!(stepTargets?.[stepIndex]?.current);

	// Still waiting for measureLayout + scroll + measure to settle — show dim only.
	if (hasTarget && !highlight) {
		return (
			<View style={tourStyles.fill} pointerEvents="auto">
				<Pressable style={[tourStyles.fill, { backgroundColor: DIM }]} onPress={dismiss} />
			</View>
		);
	}

	// No target for this step — render a centered info card.
	if (!highlight) {
		return (
			<View style={tourStyles.fill} pointerEvents="auto">
				<Pressable style={[tourStyles.fill, { backgroundColor: DIM }]} onPress={dismiss} />
				<View style={tourStyles.centerWrap} pointerEvents="box-none">
					<View
						style={[
							tourStyles.card,
							{ backgroundColor: scheme.surface, borderColor: scheme.border, borderWidth: 1 },
						]}
					>
						<Text style={tourStyles.cardEyebrow}>
							{stepIndex + 1} of {steps.length}
						</Text>
						<Text style={[tourStyles.cardTitle, { color: scheme.text }]}>{step.title}</Text>
						<Text style={[tourStyles.cardBody, { color: scheme.textMuted }]}>{step.body}</Text>
						<ActionRow
							isLast={isLast}
							onAdvance={advance}
							onDismiss={dismiss}
							stepIndex={stepIndex}
							total={steps.length}
						/>
					</View>
				</View>
			</View>
		);
	}

	const hx = highlight.x - HIGHLIGHT_PADDING;
	const hy = highlight.y - HIGHLIGHT_PADDING;
	const hw = highlight.width + HIGHLIGHT_PADDING * 2;
	const hh = highlight.height + HIGHLIGHT_PADDING * 2;

	// Decide whether to show the tooltip above or below the highlighted area.
	const spaceBelow = screenH - tabBarBottom - (hy + hh);
	const showAbove = spaceBelow < tooltipHeight + TOOLTIP_GAP + 24;

	const tooltipTop = showAbove
		? hy - TOOLTIP_GAP - tooltipHeight
		: hy + hh + TOOLTIP_GAP;

	const tooltipMaxW = Math.min(340, screenW - 32);
	const tooltipLeft = Math.min(
		Math.max(16, hx + hw / 2 - tooltipMaxW / 2),
		screenW - 16 - tooltipMaxW,
	);

	return (
		<View style={tourStyles.fill} pointerEvents="box-none">
			{/* Dim: top */}
			<View
				pointerEvents="auto"
				style={{ position: "absolute", top: 0, left: 0, right: 0, height: Math.max(0, hy), backgroundColor: DIM }}
			/>
			{/* Dim: left of highlight */}
			<View
				pointerEvents="auto"
				style={{ position: "absolute", top: hy, left: 0, width: Math.max(0, hx), height: hh, backgroundColor: DIM }}
			/>
			{/* Dim: right of highlight */}
			<View
				pointerEvents="auto"
				style={{
					position: "absolute",
					top: hy,
					left: hx + hw,
					right: 0,
					height: hh,
					backgroundColor: DIM,
				}}
			/>
			{/* Dim: bottom */}
			<View
				pointerEvents="auto"
				style={{
					position: "absolute",
					top: hy + hh,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: DIM,
				}}
			/>

			{/* Highlight border ring */}
			<View
				pointerEvents="none"
				style={{
					position: "absolute",
					top: hy,
					left: hx,
					width: hw,
					height: hh,
					borderRadius: 14,
					borderWidth: 2,
					borderColor: Palette.brand,
					backgroundColor: "rgba(61, 149, 206, 0.06)",
				}}
			/>

			{/* Tooltip card */}
			<View
				pointerEvents="box-none"
				style={{
					position: "absolute",
					top: Math.max(insets.top + 8, Math.min(tooltipTop, screenH - tabBarBottom - 20)),
					left: tooltipLeft,
					width: tooltipMaxW,
				}}
				onLayout={(e) => setTooltipHeight(e.nativeEvent.layout.height)}
			>
				<View
					style={[
						tourStyles.tooltip,
						{ backgroundColor: scheme.surface, borderColor: scheme.border },
					]}
				>
					<Text style={[tourStyles.tooltipTitle, { color: scheme.text }]}>{step.title}</Text>
					<Text style={[tourStyles.tooltipBody, { color: scheme.textMuted }]}>{step.body}</Text>
					<View style={tourStyles.tooltipFooter}>
						<Text style={tourStyles.tooltipStep}>
							{stepIndex + 1} of {steps.length}
						</Text>
						<View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
							<Pressable onPress={dismiss} hitSlop={8}>
								<Text style={tourStyles.tooltipSkip}>Close</Text>
							</Pressable>
							{isLast ? (
								<Pressable
									onPress={dismiss}
									style={[tourStyles.primaryBtn, { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Palette.earned }]}
								>
									<Text style={[tourStyles.primaryText, { fontSize: 13 }]}>Done</Text>
								</Pressable>
							) : (
								<Pressable
									onPress={advance}
									style={[tourStyles.primaryBtn, { paddingHorizontal: 12, paddingVertical: 7 }]}
								>
									<Text style={[tourStyles.primaryText, { fontSize: 13 }]}>Next</Text>
								</Pressable>
							)}
						</View>
					</View>
				</View>
			</View>
		</View>
	);
}

function ActionRow({
	isLast,
	onAdvance,
	onDismiss,
	stepIndex,
	total,
}: {
	isLast: boolean;
	onAdvance: () => void;
	onDismiss: () => void;
	stepIndex: number;
	total: number;
}) {
	return (
		<View style={tourStyles.cardActions}>
			<Pressable onPress={onDismiss} style={tourStyles.skipBtn} hitSlop={8}>
				<Text style={tourStyles.skipText}>Close</Text>
			</Pressable>
			{isLast ? (
				<Pressable onPress={onDismiss} style={[tourStyles.primaryBtn, { backgroundColor: Palette.earned }]}>
					<Text style={tourStyles.primaryText}>Done</Text>
				</Pressable>
			) : (
				<Pressable onPress={onAdvance} style={tourStyles.primaryBtn}>
					<Text style={tourStyles.primaryText}>Next</Text>
				</Pressable>
			)}
		</View>
	);
}
