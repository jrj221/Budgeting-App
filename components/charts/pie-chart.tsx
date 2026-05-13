import { Canvas, Circle, Path, Skia } from "@shopify/react-native-skia";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

import { chartStyles } from "@/components/charts/charts.styles";
import { Palette } from "@/constants/colors";

export type PieSlice = {
	key: string;
	label: string;
	value: number;
	color: string;
};

type PieChartProps = {
	data: PieSlice[];
	size: number;
	innerRatio?: number;
	formatValue?: (value: number) => string;
	innerColor?: string;
	labelColor?: string;
	labelMutedColor?: string;
};

export function PieChart({
	data,
	size,
	innerRatio = 0,
	formatValue,
	innerColor,
	labelColor,
	labelMutedColor,
}: PieChartProps) {
	const total = useMemo(() => data.reduce((acc, s) => acc + Math.max(0, s.value), 0), [data]);

	const slices = useMemo(() => {
		if (total <= 0 || size <= 0) return [];
		const cx = size / 2;
		const cy = size / 2;
		const r = size / 2;
		const oval = { x: cx - r, y: cy - r, width: 2 * r, height: 2 * r };
		const valid = data.filter((s) => s.value > 0);
		if (valid.length === 0) return [];

		let startDeg = -90;
		return valid.map((s) => {
			const sweepDeg = (s.value / total) * 360;
			const path = Skia.Path.Make();
			if (valid.length === 1) {
				path.addCircle(cx, cy, r);
			} else {
				path.moveTo(cx, cy);
				path.arcToOval(oval, startDeg, sweepDeg, false);
				path.close();
			}
			const slice = {
				key: s.key,
				label: s.label,
				value: s.value,
				color: s.color,
				path,
				startDeg,
				sweepDeg,
				isFull: valid.length === 1,
			};
			startDeg += sweepDeg;
			return slice;
		});
	}, [data, size, total]);

	const cx = size / 2;
	const cy = size / 2;
	const innerR = (size / 2) * innerRatio;
	const outerR = size / 2;

	const [activeKey, setActiveKey] = useState<string | null>(null);

	const updateActive = (x: number, y: number) => {
		if (slices.length === 0) {
			setActiveKey(null);
			return;
		}
		const dx = x - cx;
		const dy = y - cy;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist > outerR || dist < innerR) {
			setActiveKey(null);
			return;
		}
		let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
		while (angle < -90) angle += 360;
		while (angle >= 270) angle -= 360;
		for (const s of slices) {
			if (angle >= s.startDeg && angle < s.startDeg + s.sweepDeg) {
				setActiveKey(s.key);
				return;
			}
		}
		setActiveKey(null);
	};

	const clearActive = () => setActiveKey(null);

	const pan = useMemo(
		() =>
			Gesture.Pan()
				.minDistance(0)
				.onBegin((e) => runOnJS(updateActive)(e.x, e.y))
				.onUpdate((e) => runOnJS(updateActive)(e.x, e.y))
				.onFinalize(() => runOnJS(clearActive)()),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[slices, innerR, outerR, cx, cy],
	);

	if (slices.length === 0) return null;

	const activeSlice = activeKey ? slices.find((s) => s.key === activeKey) : null;
	const DIVIDER = "rgba(255,255,255,0.82)";
	const OUTLINE = "rgba(255,255,255,0.95)";
	const OUTLINE_WIDTH = 2.5;

	// Build a single closed outline path for the active donut segment so the
	// inner-circle arc and the slice edges share corners with no overlapping stroke.
	const activeOutlinePath = useMemo(() => {
		if (!activeSlice) return null;
		const outerOval = { x: cx - outerR, y: cy - outerR, width: 2 * outerR, height: 2 * outerR };
		const p = Skia.Path.Make();
		if (activeSlice.isFull) {
			p.addCircle(cx, cy, outerR);
			if (innerR > 0) {
				// Cut out inner circle (addCircle in opposite winding for donut hole)
				p.addCircle(cx, cy, innerR);
			}
		} else {
			const startRad = (activeSlice.startDeg * Math.PI) / 180;
			const endDeg = activeSlice.startDeg + activeSlice.sweepDeg;
			const endRad = (endDeg * Math.PI) / 180;
			if (innerR > 0) {
				const innerOval = { x: cx - innerR, y: cy - innerR, width: 2 * innerR, height: 2 * innerR };
				// Donut segment: inner start → outer start → outer arc → inner end → inner arc back
				p.moveTo(cx + innerR * Math.cos(startRad), cy + innerR * Math.sin(startRad));
				p.lineTo(cx + outerR * Math.cos(startRad), cy + outerR * Math.sin(startRad));
				p.arcToOval(outerOval, activeSlice.startDeg, activeSlice.sweepDeg, false);
				p.lineTo(cx + innerR * Math.cos(endRad), cy + innerR * Math.sin(endRad));
				p.arcToOval(innerOval, endDeg, 360 - activeSlice.sweepDeg, false);
				p.close();
			} else {
				// Solid wedge: center → outer start → outer arc → close
				p.moveTo(cx, cy);
				p.lineTo(cx + outerR * Math.cos(startRad), cy + outerR * Math.sin(startRad));
				p.arcToOval(outerOval, activeSlice.startDeg, activeSlice.sweepDeg, false);
				p.close();
			}
		}
		return p;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeSlice, cx, cy, outerR, innerR]);

	return (
		<GestureDetector gesture={pan}>
			<View style={{ width: size, height: size }}>
				<Canvas style={{ width: size, height: size }}>
					{/* Slice fills */}
					{slices.map((s) => (
						<Path
							key={s.key}
							path={s.path}
							color={s.color}
							opacity={activeKey && activeKey !== s.key ? 0.45 : 1}
						/>
					))}

					{/* Separator lines from center to outer rim between every slice */}
					{slices.length > 1 &&
						slices.map((s) => {
							const angleRad = (s.startDeg * Math.PI) / 180;
							const sep = Skia.Path.Make();
							sep.moveTo(cx, cy);
							sep.lineTo(cx + outerR * Math.cos(angleRad), cy + outerR * Math.sin(angleRad));
							return (
								<Path key={`sep-${s.key}`} path={sep} color={DIVIDER} style="stroke" strokeWidth={2} />
							);
						})}

					{/* Inner donut circle — fills with active slice color when selected */}
					{innerR > 0 && (
						<Circle
							cx={cx}
							cy={cy}
							r={innerR}
							color={activeSlice ? activeSlice.color : (innerColor ?? Palette.cardBackground)}
						/>
					)}

					{/* Single unified outline for the active donut segment (outer arc + radii + inner arc) */}
					{activeOutlinePath && (
						<Path path={activeOutlinePath} color={OUTLINE} style="stroke" strokeWidth={OUTLINE_WIDTH} />
					)}
				</Canvas>

				{activeSlice && (
					<View pointerEvents="none" style={pieOverlay(size)}>
						<Text style={[chartStyles.pieLabelName, { color: "#fff" }]}>{activeSlice.label}</Text>
						<Text style={[chartStyles.pieLabelValue, { color: "#fff" }]}>
							{formatValue ? formatValue(activeSlice.value) : activeSlice.value}
						</Text>
						<Text style={[chartStyles.pieLabelPercent, { color: "rgba(255,255,255,0.8)" }]}>
							{((activeSlice.value / total) * 100).toFixed(0)}%
						</Text>
					</View>
				)}

				{!activeSlice && (
					<View pointerEvents="none" style={pieOverlay(size)}>
						{/* placeholder so layout doesn't shift */}
					</View>
				)}
			</View>
		</GestureDetector>
	);
}

function pieOverlay(size: number) {
	return {
		position: "absolute" as const,
		top: 0,
		left: 0,
		width: size,
		height: size,
		alignItems: "center" as const,
		justifyContent: "center" as const,
		paddingHorizontal: size * 0.18,
	};
}
