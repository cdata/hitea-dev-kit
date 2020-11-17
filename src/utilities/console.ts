export const toHex = (array: Uint8ClampedArray | Uint8Array) =>
  '0x ' +
  Array.from(array)
    .map((n) => n.toString(16).padStart(2, '0'))
    .join(' ');
