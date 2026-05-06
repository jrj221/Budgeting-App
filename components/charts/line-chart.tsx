import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { chartStyles as styles } from '@/components/charts/charts.styles';
import { Palette } from '@/constants/colors';

export type LinePoint = {
  x: number;
  y: number;
};

type LineChartProps = {
  data: LinePoint[];
  width: number;
  height: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  formatYAxis: (cents: number) => string;
  formatYTooltip: (cents: number) => string;
  formatX: (timestamp: number) => string;
  lineColor?: string;
};

const PAD_LEFT = 56;
const PAD_RIGHT = 14;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

export function LineChart({
  data,
  width,
  height,
  xMin,
  xMax,
  yMin,
  yMax,
  formatYAxis,
  formatYTooltip,
  formatX,
  lineColor,
}: LineChartProps) {
  const innerW = Math.max(0, width - PAD_LEFT - PAD_RIGHT);
  const innerH = Math.max(0, height - PAD_TOP - PAD_BOTTOM);
  const stroke = lineColor ?? Palette.brand;

  const yTicks = useMemo(() => niceTicks(yMin, yMax, 4), [yMin, yMax]);
  const niceYMin = yTicks[0] ?? yMin;
  const niceYMax = yTicks[yTicks.length - 1] ?? yMax;

  const xTicks = useMemo(() => evenTicks(xMin, xMax, 3), [xMin, xMax]);

  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const projected = useMemo(() => {
    if (data.length === 0 || innerW <= 0 || innerH <= 0) return [];
    const xSpan = xMax - xMin || 1;
    const ySpan = niceYMax - niceYMin || 1;
    return data.map((d) => ({
      px: PAD_LEFT + ((d.x - xMin) / xSpan) * innerW,
      py: PAD_TOP + innerH - ((d.y - niceYMin) / ySpan) * innerH,
      raw: d,
    }));
  }, [data, innerW, innerH, xMin, xMax, niceYMin, niceYMax]);

  const linePathD = useMemo(() => {
    if (projected.length === 0) return '';
    return projected
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px} ${p.py}`)
      .join(' ');
  }, [projected]);

  const updateActiveByX = (x: number) => {
    if (projected.length === 0) return;
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < projected.length; i++) {
      const d = Math.abs(projected[i].px - x);
      if (d < best) {
        best = d;
        nearest = i;
      }
    }
    setActiveIdx(nearest);
  };

  const clearActive = () => setActiveIdx(null);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => runOnJS(updateActiveByX)(e.x))
        .onUpdate((e) => runOnJS(updateActiveByX)(e.x))
        .onFinalize(() => runOnJS(clearActive)()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projected],
  );

  if (projected.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Need at least two data points to draw a line.</Text>
      </View>
    );
  }

  const active = activeIdx != null ? projected[activeIdx] : null;
  const zeroY =
    niceYMin < 0 && niceYMax > 0
      ? projectY(0, niceYMin, niceYMax, innerH)
      : null;

  return (
    <View>
      <View style={styles.tooltip}>
        {active ? (
          <>
            <Text style={styles.tooltipDate}>{formatX(active.raw.x)}</Text>
            <Text style={styles.tooltipAmount}>{formatYTooltip(active.raw.y)}</Text>
          </>
        ) : (
          <Text style={styles.tooltipHint}>Drag across the chart to inspect.</Text>
        )}
      </View>

      <GestureDetector gesture={pan}>
        <View style={[styles.canvasWrap, { width, height }]}>
          <Svg width={width} height={height}>
            {yTicks.map((tick) => {
              const yPx = projectY(tick, niceYMin, niceYMax, innerH);
              return (
                <Line
                  key={`grid-${tick}`}
                  x1={PAD_LEFT}
                  y1={yPx}
                  x2={PAD_LEFT + innerW}
                  y2={yPx}
                  stroke={Palette.border}
                  strokeWidth={1}
                />
              );
            })}
            {zeroY != null && (
              <Line
                x1={PAD_LEFT}
                y1={zeroY}
                x2={PAD_LEFT + innerW}
                y2={zeroY}
                stroke={Palette.iconMuted}
                strokeWidth={1}
                strokeDasharray="4,3"
              />
            )}
            {xTicks.map((tick) => {
              const xPx =
                PAD_LEFT + ((tick - xMin) / (xMax - xMin || 1)) * innerW;
              return (
                <Line
                  key={`xgrid-${tick}`}
                  x1={xPx}
                  y1={PAD_TOP + innerH}
                  x2={xPx}
                  y2={PAD_TOP + innerH + 4}
                  stroke={Palette.border}
                  strokeWidth={1}
                />
              );
            })}
            <Path
              d={linePathD}
              stroke={stroke}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
            />
            {projected.map((p, i) => (
              <Circle key={i} cx={p.px} cy={p.py} r={3} fill={stroke} />
            ))}
            {active && (
              <>
                <Line
                  x1={active.px}
                  y1={PAD_TOP}
                  x2={active.px}
                  y2={PAD_TOP + innerH}
                  stroke={Palette.iconMuted}
                  strokeWidth={1}
                />
                <Circle
                  cx={active.px}
                  cy={active.py}
                  r={6}
                  fill={Palette.cardBackground}
                  stroke={stroke}
                  strokeWidth={2}
                />
              </>
            )}
          </Svg>

          {yTicks.map((tick) => {
            const yPx = projectY(tick, niceYMin, niceYMax, innerH);
            return (
              <Text
                key={`ylabel-${tick}`}
                numberOfLines={1}
                style={[
                  styles.axisLabel,
                  { top: yPx - 7, left: 0, width: PAD_LEFT - 6, textAlign: 'right' },
                ]}>
                {formatYAxis(tick)}
              </Text>
            );
          })}

          {xTicks.map((tick, i) => {
            const xPx =
              PAD_LEFT + ((tick - xMin) / (xMax - xMin || 1)) * innerW;
            const isFirst = i === 0;
            const isLast = i === xTicks.length - 1;
            const labelW = 64;
            const left = isFirst
              ? xPx
              : isLast
                ? xPx - labelW
                : xPx - labelW / 2;
            const textAlign: 'left' | 'right' | 'center' = isFirst
              ? 'left'
              : isLast
                ? 'right'
                : 'center';
            return (
              <Text
                key={`xlabel-${tick}`}
                numberOfLines={1}
                style={[
                  styles.axisLabel,
                  { bottom: 4, left, width: labelW, textAlign },
                ]}>
                {formatX(tick)}
              </Text>
            );
          })}
        </View>
      </GestureDetector>
    </View>
  );
}

function projectY(value: number, yMin: number, yMax: number, innerH: number): number {
  const ySpan = yMax - yMin || 1;
  return PAD_TOP + innerH - ((value - yMin) / ySpan) * innerH;
}

function niceTicks(min: number, max: number, target = 4): number[] {
  if (max === min) {
    return [min];
  }
  const range = max - min;
  const rough = range / Math.max(1, target);
  const exp = Math.floor(Math.log10(Math.abs(rough)));
  const f = rough / Math.pow(10, exp);
  const niceF = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
  const step = niceF * Math.pow(10, exp);
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) {
    ticks.push(Math.round(v / step) * step);
  }
  return ticks;
}

function evenTicks(min: number, max: number, count = 4): number[] {
  if (max <= min || count < 2) return [min];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(min + i * step));
}
