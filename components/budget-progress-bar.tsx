import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, Rect } from 'react-native-svg';

type BudgetProgressBarProps = {
  color: string;
  /** Pale background tint (typically the category color blended with white). */
  backgroundColor: string;
  /** 0..1 fraction of the bar filled by actual spending. */
  actualFraction: number;
  /** 0..1 fraction filled by future-planned spending (stacks on top of actual). */
  plannedFraction: number;
  /** 0..1 position of a pace marker line (e.g. where the user should be right now). */
  paceMarkerFraction?: number;
  height?: number;
  patternKey: string;
};

export function BudgetProgressBar({
  color,
  backgroundColor,
  actualFraction,
  plannedFraction,
  paceMarkerFraction,
  height = 14,
  patternKey,
}: BudgetProgressBarProps) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const safeActual = clamp01(actualFraction);
  const remaining = Math.max(0, 1 - safeActual);
  const safePlanned = Math.min(remaining, Math.max(0, plannedFraction));

  const actualPx = width * safeActual;
  const plannedPx = width * safePlanned;

  return (
    <View
      onLayout={onLayout}
      style={{
        width: '100%',
        height,
        borderRadius: height / 2,
        overflow: 'hidden',
        backgroundColor,
      }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <ClipPath id={`clip-${patternKey}`}>
              <Rect x={actualPx} y={0} width={plannedPx} height={height} />
            </ClipPath>
          </Defs>
          <Rect x={0} y={0} width={actualPx} height={height} fill={color} />
          <Rect
            x={actualPx}
            y={0}
            width={plannedPx}
            height={height}
            fill={backgroundColor}
          />
          {plannedPx > 0 && (
            <G clipPath={`url(#clip-${patternKey})`}>
              {makeStripeLines(actualPx, plannedPx, height).map((s, i) => (
                <Line
                  key={i}
                  x1={s.x1}
                  y1={s.y1}
                  x2={s.x2}
                  y2={s.y2}
                  stroke={color}
                  strokeWidth={3}
                />
              ))}
            </G>
          )}
          {paceMarkerFraction != null && width > 0 && (() => {
            const markerX = clamp01(paceMarkerFraction) * width;
            const r = height / 2 + 1;
            return (
              <>
                <Line
                  x1={markerX}
                  y1={0}
                  x2={markerX}
                  y2={height}
                  stroke="#fff"
                  strokeWidth={2.5}
                  strokeDasharray="3,2"
                />
                <Circle
                  cx={markerX}
                  cy={height / 2}
                  r={r}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeOpacity={0.85}
                />
              </>
            );
          })()}
        </Svg>
      )}
    </View>
  );
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function makeStripeLines(
  startX: number,
  spanWidth: number,
  height: number,
): { x1: number; y1: number; x2: number; y2: number }[] {
  const spacing = 8;
  const out: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const count = Math.ceil((spanWidth + height) / spacing) + 1;
  for (let i = 0; i < count; i++) {
    const x = startX - height + i * spacing;
    out.push({ x1: x, y1: height, x2: x + height, y2: 0 });
  }
  return out;
}
