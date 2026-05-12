import { hsvToRgb, rgbToHex, hsvToHex, hexToHsv } from '../../utils/color-conversion';

describe('hsvToRgb', () => {
  it('red: 0°, 100%, 100%', () => {
    expect(hsvToRgb(0, 100, 100)).toEqual([255, 0, 0]);
  });
  it('green: 120°, 100%, 100%', () => {
    expect(hsvToRgb(120, 100, 100)).toEqual([0, 255, 0]);
  });
  it('blue: 240°, 100%, 100%', () => {
    expect(hsvToRgb(240, 100, 100)).toEqual([0, 0, 255]);
  });
  it('white: any, 0%, 100%', () => {
    expect(hsvToRgb(0, 0, 100)).toEqual([255, 255, 255]);
  });
  it('black: any, any, 0%', () => {
    expect(hsvToRgb(0, 100, 0)).toEqual([0, 0, 0]);
  });
  it('wraps hue >360', () => {
    expect(hsvToRgb(360, 100, 100)).toEqual(hsvToRgb(0, 100, 100));
  });
});

describe('rgbToHex', () => {
  it('red', () => expect(rgbToHex([255, 0, 0])).toBe('#ff0000'));
  it('white', () => expect(rgbToHex([255, 255, 255])).toBe('#ffffff'));
  it('black', () => expect(rgbToHex([0, 0, 0])).toBe('#000000'));
  it('clamps above 255', () => expect(rgbToHex([300, 0, 0])).toBe('#ff0000'));
  it('clamps below 0', () => expect(rgbToHex([-1, 0, 0])).toBe('#000000'));
});

describe('hsvToHex', () => {
  it('red', () => expect(hsvToHex(0, 100, 100)).toBe('#ff0000'));
  it('green', () => expect(hsvToHex(120, 100, 100)).toBe('#00ff00'));
  it('blue', () => expect(hsvToHex(240, 100, 100)).toBe('#0000ff'));
});

describe('hexToHsv', () => {
  it('red', () => {
    const hsv = hexToHsv('#ff0000');
    expect(hsv.h).toBeCloseTo(0, 0);
    expect(hsv.s).toBeCloseTo(100, 0);
    expect(hsv.v).toBeCloseTo(100, 0);
  });
  it('green', () => {
    const hsv = hexToHsv('#00ff00');
    expect(hsv.h).toBeCloseTo(120, 0);
  });
  it('blue', () => {
    const hsv = hexToHsv('#0000ff');
    expect(hsv.h).toBeCloseTo(240, 0);
  });
  it('returns default for invalid hex', () => {
    const hsv = hexToHsv('not-a-hex');
    expect(hsv).toEqual({ h: 0, s: 100, v: 100 });
  });
  it('round-trips correctly', () => {
    const original = '#4a90d9';
    const hsv = hexToHsv(original);
    const back = hsvToHex(hsv.h, hsv.s, hsv.v);
    expect(back).toBe(original);
  });
});
