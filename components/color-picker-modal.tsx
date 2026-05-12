import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { pickerStyles as styles } from '@/components/color-picker-modal.styles';
import { hexToHsv, hsvToHex } from '@/utils/color-conversion';

type ColorPickerModalProps = {
  visible: boolean;
  initialColor: string;
  title?: string;
  onClose: () => void;
  onSelect: (hex: string) => void;
};

const WHEEL_SIZE = 240;
const WHEEL_R = WHEEL_SIZE / 2;
const WEDGES = 36;
const SLIDER_W = 240;
const SLIDER_H = 24;

export function ColorPickerModal({
  visible,
  initialColor,
  title = 'Pick a color',
  onClose,
  onSelect,
}: ColorPickerModalProps) {
  const [hsv, setHsv] = useState(() => hexToHsv(initialColor));

  useEffect(() => {
    if (visible) setHsv(hexToHsv(initialColor));
  }, [visible, initialColor]);

  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);
  const fullBrightnessHex = hsvToHex(hsv.h, hsv.s, 100);

  const setHueSat = (h: number, s: number) => setHsv((prev) => ({ ...prev, h, s }));
  const setValue = (v: number) => setHsv((prev) => ({ ...prev, v }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.modalRoot}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          <ColorWheel hue={hsv.h} sat={hsv.s} onChange={setHueSat} />

          <BrightnessSlider
            value={hsv.v}
            fullBrightnessColor={fullBrightnessHex}
            onChange={setValue}
          />

          <View style={styles.previewRow}>
            <View style={[styles.previewSwatch, { backgroundColor: currentHex }]} />
            <Text style={styles.previewHex}>{currentHex.toUpperCase()}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.secondary]} onPress={onClose}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.primary]}
              onPress={() => {
                onSelect(currentHex);
                onClose();
              }}>
              <Text style={styles.primaryText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ColorWheel({
  hue,
  sat,
  onChange,
}: {
  hue: number;
  sat: number;
  onChange: (h: number, s: number) => void;
}) {
  const cx = WHEEL_R;
  const cy = WHEEL_R;

  const wedges = useMemo(() => {
    const out: { d: string; fill: string }[] = [];
    for (let i = 0; i < WEDGES; i++) {
      const startDeg = i * (360 / WEDGES) - 90;
      const endDeg = (i + 1) * (360 / WEDGES) - 90;
      const sr = (startDeg * Math.PI) / 180;
      const er = (endDeg * Math.PI) / 180;
      const x1 = cx + WHEEL_R * Math.cos(sr);
      const y1 = cy + WHEEL_R * Math.sin(sr);
      const x2 = cx + WHEEL_R * Math.cos(er);
      const y2 = cy + WHEEL_R * Math.sin(er);
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${WHEEL_R} ${WHEEL_R} 0 0 1 ${x2} ${y2} Z`;
      const midHue = (i + 0.5) * (360 / WEDGES);
      out.push({ d, fill: hsvToHex(midHue, 100, 100) });
    }
    return out;
  }, [cx, cy]);

  const handleAt = (x: number, y: number) => {
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180, 0 = right
    const h = (angle + 360) % 360;
    const s = Math.min(100, (dist / WHEEL_R) * 100);
    onChange(h, s);
  };

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => runOnJS(handleAt)(e.x, e.y))
        .onUpdate((e) => runOnJS(handleAt)(e.x, e.y)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cx, cy],
  );

  const indicatorR = (sat / 100) * WHEEL_R;
  const indicatorRad = (hue * Math.PI) / 180;
  const ix = cx + indicatorR * Math.cos(indicatorRad);
  const iy = cy + indicatorR * Math.sin(indicatorRad);

  return (
    <GestureDetector gesture={pan}>
      <View
        style={{
          width: WHEEL_SIZE,
          height: WHEEL_SIZE,
          borderRadius: WHEEL_R,
          overflow: 'hidden',
        }}>
        <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
          <Defs>
            <RadialGradient id="whiteCenter" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          {wedges.map((w, i) => (
            <Path key={i} d={w.d} fill={w.fill} />
          ))}
          <Circle cx={cx} cy={cy} r={WHEEL_R} fill="url(#whiteCenter)" />
          <Circle
            cx={ix}
            cy={iy}
            r={9}
            fill="none"
            stroke="#000000"
            strokeOpacity={0.4}
            strokeWidth={2}
          />
          <Circle cx={ix} cy={iy} r={7} fill="none" stroke="#ffffff" strokeWidth={2} />
        </Svg>
      </View>
    </GestureDetector>
  );
}

const SLIDER_INDICATOR_R = 10;
const SLIDER_TRACK_INSET = SLIDER_INDICATOR_R + 2;
const SLIDER_TRACK_RANGE = SLIDER_W - SLIDER_TRACK_INSET * 2;

function BrightnessSlider({
  value,
  fullBrightnessColor,
  onChange,
}: {
  value: number;
  fullBrightnessColor: string;
  onChange: (v: number) => void;
}) {
  const handleAt = (x: number) => {
    const local = x - SLIDER_TRACK_INSET;
    const v = Math.max(0, Math.min(100, (local / SLIDER_TRACK_RANGE) * 100));
    onChange(v);
  };

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => runOnJS(handleAt)(e.x))
        .onUpdate((e) => runOnJS(handleAt)(e.x)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const indicatorX = SLIDER_TRACK_INSET + (value / 100) * SLIDER_TRACK_RANGE;

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.brightnessTrack}>
        <Svg width={SLIDER_W} height={SLIDER_H + 8}>
          <Defs>
            <LinearGradient id="brightness-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#000000" />
              <Stop offset="100%" stopColor={fullBrightnessColor} />
            </LinearGradient>
          </Defs>
          <Rect
            x={SLIDER_TRACK_INSET}
            y={4}
            width={SLIDER_TRACK_RANGE}
            height={SLIDER_H}
            rx={SLIDER_H / 2}
            fill="url(#brightness-grad)"
          />
          <Circle
            cx={indicatorX}
            cy={4 + SLIDER_H / 2}
            r={SLIDER_INDICATOR_R}
            fill="#ffffff"
            stroke="#000000"
            strokeOpacity={0.4}
            strokeWidth={1.5}
          />
        </Svg>
      </View>
    </GestureDetector>
  );
}
