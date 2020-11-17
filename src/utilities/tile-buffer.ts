import { SpriteSheet, Selection } from '../state/store.js';
import { intToRgb } from './color.js';

export interface TileBufferConfig {
  columns: number;
  rows: number;
  tilePixelWidth: number;
  tilePixelHeight: number;
  colorChannels: number;
}

export const TILE_BUFFER_CONFIG_DEFAULTS: TileBufferConfig = {
  columns: 8,
  rows: 16,
  tilePixelWidth: 8,
  tilePixelHeight: 8,
  colorChannels: 4,
};

export class TileBuffer extends EventTarget {
  get rows() {
    return this.#config.rows;
  }

  get columns() {
    return this.#config.columns;
  }

  get tilePixelWidth() {
    return this.#config.tilePixelWidth;
  }

  get tilePixelHeight() {
    return this.#config.tilePixelHeight;
  }

  get colorChannels() {
    return this.#config.colorChannels;
  }

  readonly pixelsPerRow: number;
  readonly pixelsPerColumn: number;

  readonly bufferEdgePixels: number;
  readonly bufferEdgeBytes: number;

  readonly array: Uint8ClampedArray;

  #config: TileBufferConfig;
  #selectAll: Selection;

  constructor(config: Partial<TileBufferConfig> = {}) {
    super();

    this.#config = {
      ...TILE_BUFFER_CONFIG_DEFAULTS,
      ...config,
    };

    this.#selectAll = {
      start: {
        x: 0,
        y: 0,
      },
      end: {
        x: this.columns,
        y: this.rows,
      },
    };

    this.pixelsPerRow = this.columns * this.tilePixelWidth;
    this.pixelsPerColumn = this.rows * this.tilePixelHeight;

    this.bufferEdgePixels = Math.max(this.pixelsPerColumn, this.pixelsPerRow);
    this.bufferEdgeBytes =
      Math.max(this.pixelsPerColumn, this.pixelsPerRow) * this.colorChannels;

    this.array = new Uint8ClampedArray(
      this.bufferEdgeBytes * this.bufferEdgeBytes
    );
    this.array.fill(255);
  }

  setPixel(x: number, y: number, color: number[]) {
    x = Math.max(0, Math.min(x, this.pixelsPerRow));
    y = Math.max(0, Math.min(y, this.pixelsPerColumn));

    const bufferIndex = this.bufferEdgeBytes * y + this.colorChannels * x;

    // console.log('TileBuffer#setPixel', x, y, color);
    this.array.set(color, bufferIndex);

    this.dispatchEvent(new CustomEvent('updated'));
  }

  drawSpriteSheet(
    spriteSheet: SpriteSheet,
    selection: Selection = this.#selectAll
  ) {
    console.log('DRAW SPRITESHEET');
    // TODO: Multiple palette support
    const palette = spriteSheet.palettes[0];

    const { x: startX, y: startY } = selection.start;
    const { x: endX, y: endY } = selection.end;

    const selectionColumns = endX - startX;
    const pixelStartY = startY * this.tilePixelHeight;
    const pixelEndY = endY * this.tilePixelHeight;
    const pixelStartX = startX * this.tilePixelWidth;
    const pixelEndX = endX * this.tilePixelWidth;
    const selectionPixelsPerRow = selectionColumns * this.tilePixelWidth;

    for (let y = pixelStartY; y < pixelEndY; ++y) {
      const yPixelOffset = y * this.bufferEdgePixels;
      const pixels = this.array.subarray(
        (yPixelOffset + pixelStartX) * this.colorChannels,
        (yPixelOffset + pixelEndX) * this.colorChannels
      );

      for (let x = 0; x < selectionPixelsPerRow; ++x) {
        const pixelIndex = y * this.pixelsPerRow + pixelStartX + x;
        // TODO: Support multiple layers
        const colorIndex = spriteSheet.layers[0].pixels[pixelIndex];
        const color =
          colorIndex != null ? palette.colors[colorIndex] : 0xffffff;
        const { r, g, b } = intToRgb(color);
        const bufferIndex = x * this.colorChannels;

        pixels.set([r, g, b, 1], bufferIndex);
      }
    }

    this.dispatchEvent(new CustomEvent('updated'));
  }
}
