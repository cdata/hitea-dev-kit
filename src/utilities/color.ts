export const rgb565ToInt = (r: number, g: number, b: number) =>
  ((r & 0x1f) << 11) + ((g & 0x3f) << 5) + (b & 0x1f);

export const intToRgb565 = (rgb565: number) => ({
  r: (rgb565 >> 11) & 0x1f,
  g: (rgb565 >> 5) & 0x3f,
  b: rgb565 & 0x1f,
});

export const rgbToInt = (r: number, g: number, b: number) =>
  ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);

export const intToRgb = (rgb: number) => ({
  r: (rgb >> 16) & 0xff,
  g: (rgb >> 8) & 0xff,
  b: rgb & 0xff,
});

export const intRgbToRgb565 = (rgb: number) => {
  const { r: r0, g: g0, b: b0 } = intToRgb(rgb);
  const { r, g, b } = rgbToRgb565(r0, g0, b0);

  return rgb565ToInt(r, g, b);
};

export const intRgb565ToRgb = (rgb565: number) => {
  const { r: r0, g: g0, b: b0 } = intToRgb565(rgb565);
  const { r, g, b } = rgb565ToRgb(r0, g0, b0);

  return rgbToInt(r, g, b);
};

export const rgbToRgb565 = (r: number, g: number, b: number) => ({
  r: Math.round((r / 0xff) * 0x1f) | 0,
  g: Math.round((g / 0xff) * 0x3f) | 0,
  b: Math.round((b / 0xff) * 0x1f) | 0,
});

export const rgb565ToRgb = (r: number, g: number, b: number) => ({
  r: Math.round((r / 0x1f) * 0xff) | 0,
  g: Math.round((g / 0x3f) * 0xff) | 0,
  b: Math.round((b / 0x1f) * 0xff) | 0,
});

export const rgb565MappedRgb = (rgb: number) =>
  intRgb565ToRgb(intRgbToRgb565(rgb));

export const intToCssHex = (int: number) => {
  let hexString = (int & 0xffffff).toString(16);
  while (hexString.length < 6) {
    hexString = `0${hexString}`;
  }
  return `#${hexString}`;
};

// (self as any).rgb565ToRgb = rgb565ToRgb;
// (self as any).rgbToRgb565 = rgbToRgb565;
// (self as any).intRgb565ToRgb = intRgb565ToRgb;
// (self as any).intRgbToRgb565 = intRgbToRgb565;
// (self as any).rgb565MappedRgb = rgb565MappedRgb;
