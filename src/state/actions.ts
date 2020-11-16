import { action, Action } from '@0xcda7a/bag-of-tricks/lib/state/store.js';
import { HiTeaDevState, Tool } from './store.js';
import { Selection } from '../state/store.js';

export const selectTool = (tool: Tool): Action<HiTeaDevState> =>
  action('SELECT_TOOL', (getState) => {
    const state = getState();

    return {
      ...state,
      drawingRoom: {
        ...state.drawingRoom,
        activeTool: tool,
      },
    };
  });

export const selectTiles = (selection: Selection): Action<HiTeaDevState> =>
  action('SELECT_TILES', (getState) => {
    const state = getState();

    return {
      ...state,
      drawingRoom: {
        ...state.drawingRoom,
        selection: {
          start: {
            ...selection.start,
          },
          end: {
            ...selection.end,
          },
        },
      },
    };
  });

export const selectColor = (color: number): Action<HiTeaDevState> =>
  action('SELECT_COLOR', (getState) => {
    const state = getState();

    return {
      ...state,
      drawingRoom: {
        ...state.drawingRoom,
        activeColor: color,
      },
    };
  });

export const selectPalette = (palette: number): Action<HiTeaDevState> =>
  action('SELECT_PALETTE', (getState) => {
    const state = getState();

    return {
      ...state,
      drawingRoom: {
        ...state.drawingRoom,
        activePalette: palette,
      },
    };
  });

export const selectPaletteColor = (
  palette: number,
  color: number
): Action<HiTeaDevState> =>
  action('SELECT_PALETTE_COLOR', async (_, dispatch) => {
    await dispatch(selectPalette(palette));
    await dispatch(selectColor(color));
  });

export const paint = (
  x: number,
  y: number,
  color: number,
  layerIndex: number = 0
): Action<HiTeaDevState> =>
  action('PAINT', (getState) => {
    const state = getState();
    const layer = state.drawingRoom.spriteSheet.layers[layerIndex];
    const width = 64;

    const index = y * width + x;

    layer.pixels[index] = color;
    layer.pixels = layer.pixels.slice();

    return {
      ...state,
    };
  });
