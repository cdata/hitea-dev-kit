export const pixelsToHex = (pixels: number[]) => {
  let hex = [];

  for (let i = 0; i < pixels.length; ++i) {
    const pixel = pixels[i] || 2;
    hex.push(pixel.toString(16));
  }

  return hex.join('');
};

export const hexToPixels = (hex: string) => {
  return hex.split('').map((char) => parseInt(char, 16));
};
