import { SpriteSheet, SpriteSheetPalette } from '../state/store.js';
import { intRgb565ToRgb, intRgbToRgb565 } from './color.js';
import { uid } from '@0xcda7a/bag-of-tricks/lib/random.js';
import { toHex } from '../utilities/console.js';

/*

# TBIN

0xCAFEF00D
^
tbin magic

00       8F     88    03        05      1F        < color palettes - 32B > < tile remaps - 2B > < tiles - 32B >
^        ^      ^     ^         ^       ^
format   sheet  tile  # color   # tile  # tiles
version  w/h    w/h   palettes  remaps
[0]      [8x16] [8x8] [3]       [5]     [31]


# Color palette

FFFF ... 00FF
^
color
rgb565
x 16


# Tile remap

0x1F5D ...
^
Remap (1,15) to (5,13)


# Tile

0x0      2            4F30000...
^        ^            ^
Palette  Transparent  Pixel color
[0]      color index  palette index
         [2]
*/

const DEFAULT_TRANSPARENT_COLOR_INDEX = 2;
const DEFAULT_COLOR_PALETTE_INDEX = 0;

const TBIN_MAGIC = new Uint8ClampedArray([0xca, 0xfe, 0xf0, 0x0d]);
const VERSION = 0;

const TILE_FILL =
  (DEFAULT_TRANSPARENT_COLOR_INDEX << 4) | DEFAULT_TRANSPARENT_COLOR_INDEX;

const TBIN_HEADER_BYTES = 10;
const TILE_HEADER_BYTES = 1;
const COLOR_PALETTE_BYTES = 32;
const TILE_REMAP_BYTES = 2;
const PIXEL_BYTES = 0.5;
const COLOR_BYTES = 2;

export const spriteSheetToTbin = (
  spriteSheet: SpriteSheet
): Uint8ClampedArray => {
  const { columns, rows, tilePixelHeight, tilePixelWidth } = spriteSheet;

  const pixelsPerTile = tilePixelWidth * tilePixelHeight;
  // TODO: Multiple layers
  const pixels = spriteSheet.layers[0].pixels;
  // TODO: Disallow odd pixel counts in tiles
  const tileBytes = Math.ceil(pixelsPerTile * PIXEL_BYTES) + TILE_HEADER_BYTES;
  console.log('Tile bytes:', tileBytes);

  const sparseTiles: Uint8ClampedArray[] = [];
  const remaps: number[] = [];

  let tileShift = 0;

  // Sparsely pack / remap tiles
  for (let y = 0; y < rows; ++y) {
    for (let x = 0; x < columns; ++x) {
      const tileIndex = y * columns + x;
      let tileIsEmpty = true;
      let paletteIndex = DEFAULT_COLOR_PALETTE_INDEX;
      let transparentColorIndex: number = DEFAULT_TRANSPARENT_COLOR_INDEX;

      const currentTile = new Uint8ClampedArray(tileBytes);
      const tileColorScheme = spriteSheet.colorScheme.tiles[tileIndex];

      if (tileColorScheme != null) {
        for (let i = 0; i < spriteSheet.palettes.length; ++i) {
          if (spriteSheet.palettes[i].id === tileColorScheme.palette) {
            paletteIndex = i;
          }
        }

        transparentColorIndex = tileColorScheme.transparentColor;
      }

      currentTile.fill(TILE_FILL);
      currentTile[0] = (paletteIndex << 4) | transparentColorIndex;

      // console.log('\n\nTILE');
      for (let i = 0; i < tilePixelHeight; ++i) {
        for (let j = 0; j < tilePixelWidth; j += 2) {
          const tilePixelIndex =
            i * Math.floor(tilePixelWidth * PIXEL_BYTES) +
            Math.floor(j * PIXEL_BYTES);
          const spriteSheetPixelIndex =
            y * pixelsPerTile * columns +
            i * tilePixelWidth * columns +
            x * tilePixelWidth +
            j;

          const highColorIndex =
            pixels[spriteSheetPixelIndex] == null
              ? transparentColorIndex
              : pixels[spriteSheetPixelIndex];

          const lowColorIndex =
            pixels[spriteSheetPixelIndex + 1] == null
              ? transparentColorIndex
              : pixels[spriteSheetPixelIndex + 1];

          if (
            highColorIndex !== transparentColorIndex ||
            lowColorIndex !== transparentColorIndex
          ) {
            tileIsEmpty = false;
          }

          currentTile[tilePixelIndex + TILE_HEADER_BYTES] =
            (highColorIndex << 4) | lowColorIndex;
        }
      }

      if (tileIsEmpty) {
        tileShift++;
        continue;
      }

      console.log('Tile', tileIndex, 'has pixels');
      console.log(
        '0x' +
          Array.from(currentTile)
            .map((n) => n.toString(16).padStart(2, '0'))
            .join('')
      );
      const tileLayoutIndex = tileIndex - tileShift;

      if (tileLayoutIndex !== tileIndex) {
        remaps.push((tileIndex << 8) | tileLayoutIndex);
      }
      sparseTiles.push(currentTile);
    }
  }

  // console.log(sparseTiles);

  const { palettes } = spriteSheet;
  const tbin = new Uint8ClampedArray(
    TBIN_HEADER_BYTES +
      palettes.length * COLOR_PALETTE_BYTES +
      TILE_REMAP_BYTES * remaps.length +
      tileBytes * sparseTiles.length
  );

  // Header
  tbin.set(TBIN_MAGIC, 0);
  tbin.set([VERSION], 4);
  tbin.set([((columns - 1) << 4) | (rows - 1)], 5);
  tbin.set([((tilePixelWidth - 1) << 4) | (tilePixelHeight - 1)], 6);
  tbin.set([spriteSheet.palettes.length], 7);
  tbin.set([remaps.length], 8);
  tbin.set([sparseTiles.length], 9);

  // Color palettes
  for (let i = 0; i < palettes.length; ++i) {
    const palette = palettes[i];
    const paletteIndex = TBIN_HEADER_BYTES + COLOR_PALETTE_BYTES * i;

    for (let j = 0; j < palette.colors.length; ++j) {
      const rgb565 = intRgbToRgb565(palette.colors[j]);
      const colorIndex = j * COLOR_BYTES;
      tbin.set([rgb565 >> 8, rgb565 & 0xff], paletteIndex + colorIndex);
    }
  }

  // Tile remaps
  for (let i = 0; i < remaps.length; ++i) {
    const remapIndex =
      TBIN_HEADER_BYTES +
      COLOR_PALETTE_BYTES * palettes.length +
      i * TILE_REMAP_BYTES;
    const remap = remaps[i];

    tbin.set([remap >> 8, remap & 0xff], remapIndex);
  }

  // Tiles
  for (let i = 0; i < sparseTiles.length; ++i) {
    const tileIndex =
      TBIN_HEADER_BYTES +
      COLOR_PALETTE_BYTES * palettes.length +
      TILE_REMAP_BYTES * remaps.length +
      i * tileBytes;

    const tile = sparseTiles[i];
    tbin.set(tile, tileIndex);
  }

  return tbin;
};

export const assertIsTbin = (candidate: Uint8ClampedArray) => {
  for (let i = 0; i < TBIN_MAGIC.length; ++i) {
    if (candidate[i] !== TBIN_MAGIC[i]) {
      throw new Error('Invalid TBIN file');
    }
  }

  if (candidate[4] !== VERSION) {
    throw new Error('Unsupported TBIN version');
  }
};

export const tbinToSpriteSheet = (tbin: Uint8ClampedArray): SpriteSheet => {
  assertIsTbin(tbin);

  const columns = (tbin[5] >> 4) + 1;
  const rows = (tbin[5] & 0xf) + 1;

  const tilePixelWidth = (tbin[6] >> 4) + 1;
  const tilePixelHeight = (tbin[6] & 0xf) + 1;

  const paletteCount = tbin[7];
  const remapCount = tbin[8];
  const sparseTileCount = tbin[9];

  const pixelsPerTile = tilePixelWidth * tilePixelHeight;

  const paletteStart = TBIN_HEADER_BYTES;
  const paletteEnd = paletteStart + paletteCount * COLOR_PALETTE_BYTES;

  const remapStart = paletteEnd;
  const remapEnd = remapStart + remapCount * TILE_REMAP_BYTES;

  const tileBytes = Math.ceil(pixelsPerTile * PIXEL_BYTES) + TILE_HEADER_BYTES;
  const tileStart = remapEnd;
  const tileEnd = tileStart + sparseTileCount * tileBytes;

  const paletteSlice = tbin.subarray(paletteStart, paletteEnd);
  const remapSlice = tbin.subarray(remapStart, remapEnd);
  const tileSlice = tbin.subarray(tileStart, tileEnd);

  console.log('Tile slice:');
  console.log(toHex(tileSlice));

  const palettes: SpriteSheetPalette[] = [];

  for (let i = 0; i < paletteCount; ++i) {
    const colors: number[] = [];
    const paletteOffset = i * COLOR_PALETTE_BYTES;

    for (let j = 0; j < 32; j += 2) {
      const colorHigh = paletteSlice[paletteOffset + j];
      const colorLow = paletteSlice[paletteOffset + j + 1];
      const colorRgb565 = (colorHigh << 8) | colorLow;

      colors.push(intRgb565ToRgb(colorRgb565));
    }

    palettes.push({
      id: uid(),
      colors,
    });
  }

  const tileRemaps = new Map<number, number>();

  for (let i = 0; i < remapSlice.length; i += 2) {
    tileRemaps.set(remapSlice[i + 1], remapSlice[i]);
  }

  const pixels: number[] = Array(
    columns * tilePixelWidth + rows * tilePixelWidth
  );

  for (let i = 0; i < sparseTileCount; i++) {
    const index = tileRemaps.get(i) || i;
    const row = Math.floor(index / columns);
    const column = index % columns;
    console.log('Reading tile', index, '(sparse index', i, ')');

    for (let j = 0; j < pixelsPerTile; j += 2) {
      const byteIndex = j * PIXEL_BYTES;
      const x = j % tilePixelWidth;
      const y = Math.floor(j / tilePixelWidth);

      const sliceIndex = i * tileBytes + byteIndex + TILE_HEADER_BYTES;

      // console.log(sliceIndex);

      const doublePixel = tileSlice[sliceIndex];

      const pixelX = tilePixelWidth * column + x;
      const pixelY = tilePixelHeight * row + y;

      console.log('Pixel (', x, ',', y, ')', doublePixel >> 4);
      console.log('Pixel (', x + 1, ',', y, ')', doublePixel & 0xf);

      const pixelIndex = pixelY * columns * tilePixelWidth + pixelX;

      // const pixelIndex =
      //   row * columns * pixelsPerTile + column * y * tilePixelWidth + x;

      pixels[pixelIndex] = doublePixel >> 4;
      pixels[pixelIndex + 1] = doublePixel & 0xf;
    }
  }

  return {
    tilePixelHeight,
    tilePixelWidth,
    rows,
    columns,
    palettes,
    layers: [
      {
        id: uid(),
        pixels,
      },
    ],
    colorScheme: {
      defaultPalette: palettes[0].id,
      // TODO: Per-tile color scheme
      tiles: [],
    },
  };
};
