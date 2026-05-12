// Stub for @shopify/react-native-skia native module
const React = require('react');

const noop = () => {};
const noopComponent = ({ children }) => React.createElement(React.Fragment, null, children ?? null);

module.exports = {
  Canvas: noopComponent,
  Path: noopComponent,
  Skia: {
    Path: { Make: () => ({ moveTo: noop, lineTo: noop, close: noop }) },
    Color: () => 0,
  },
  useCanvasRef: () => ({ current: null }),
  useDerivedValue: (fn) => ({ value: fn() }),
  useSharedValue: (v) => ({ value: v }),
  useComputedValue: (fn) => ({ value: fn() }),
  useValue: (v) => ({ value: v }),
  runTiming: noop,
  runSpring: noop,
  interpolate: (v) => v,
  Easing: { linear: (t) => t },
  Fill: noopComponent,
  Group: noopComponent,
  Circle: noopComponent,
  Rect: noopComponent,
  Line: noopComponent,
  Text: noopComponent,
  useFont: () => null,
  matchFont: () => null,
  Paint: noopComponent,
  LinearGradient: noopComponent,
  useImage: () => null,
  Image: noopComponent,
};
