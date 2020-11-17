import { Store } from '@0xcda7a/bag-of-tricks/lib/state/store.js';
import { rgb565MappedRgb } from '../utilities/color';

export type Tool = 'pen' | 'eraser' | 'menu';

export interface Point {
  x: number;
  y: number;
}

export interface Selection {
  start: Point;
  end: Point;
}

export interface SpriteSheetLayer {
  id: string | null;
  pixels: number[];
}

export interface SpriteSheetPalette {
  // Null ID implies default palette
  id: string | null;
  colors: number[];
}

export interface TileColorScheme {
  transparentColor: number;
  palette: string;
}

export interface SpriteSheetColorScheme {
  defaultPalette: string | null;
  tiles: TileColorScheme[];
}

export interface SpriteSheet {
  palettes: SpriteSheetPalette[];
  layers: SpriteSheetLayer[];
  colorScheme: SpriteSheetColorScheme;
  columns: number;
  rows: number;
  tilePixelWidth: number;
  tilePixelHeight: number;
}

export interface SyncRequest {
  type: 'sync';
  selection?: Selection;
}

export type Task = SyncRequest;

export interface DrawingRoomState {
  activeTool: Tool;
  activeColor: number;
  activePalette: number;
  selection: Selection;
  spriteSheet: SpriteSheet;
  userIsDragging: boolean;
  taskQueue: Task[];
}

export interface HiTeaDevState {
  drawingRoom: DrawingRoomState;
}

export const emptySelection = () => ({
  start: {
    x: 0,
    y: 0,
  },
  end: {
    x: 1,
    y: 1,
  },
});

// http://androidarts.com/palette/16pal.htm
export const defaultPalette = (): SpriteSheetPalette => ({
  id: null,
  colors: [
    rgb565MappedRgb(0x000000),
    rgb565MappedRgb(0x9d9d9d),
    rgb565MappedRgb(0xffffff),
    rgb565MappedRgb(0xbe2633),
    rgb565MappedRgb(0xe06f8b),
    rgb565MappedRgb(0x493c2b),
    rgb565MappedRgb(0xa46422),
    rgb565MappedRgb(0xeb8931),
    rgb565MappedRgb(0xf7e26b),
    rgb565MappedRgb(0x2f484e),
    rgb565MappedRgb(0x44891a),
    rgb565MappedRgb(0xa3ce27),
    rgb565MappedRgb(0x1b2632),
    rgb565MappedRgb(0x005784),
    rgb565MappedRgb(0x31a2f2),
    rgb565MappedRgb(0xb2dcef),
  ],
});

export const store = new Store<HiTeaDevState>(
  {
    drawingRoom: {
      activeTool: 'pen',
      activePalette: 0,
      activeColor: 0,
      userIsDragging: false,
      taskQueue: [],
      spriteSheet: {
        columns: 8,
        rows: 16,
        tilePixelWidth: 8,
        tilePixelHeight: 8,
        palettes: [defaultPalette()],
        layers: [
          {
            id: null,
            pixels: [],
          },
        ],
        colorScheme: {
          defaultPalette: null,
          tiles: [],
        },
      },
      selection: emptySelection(),
    },
  },
  {
    verbose: false,
  }
);
