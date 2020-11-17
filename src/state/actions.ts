import { action, Action } from '@0xcda7a/bag-of-tricks/lib/state/store.js';
import { HiTeaDevState, SpriteSheet, Task, Tool } from './store.js';
import { Selection } from '../state/store.js';
import { tbinToSpriteSheet, spriteSheetToTbin } from '../utilities/tbin.js';

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
    const { spriteSheet } = state.drawingRoom;
    const { columns, tilePixelWidth, layers } = spriteSheet;
    const layer = layers[layerIndex];
    const width = columns * tilePixelWidth;

    const index = y * width + x;

    layer.pixels[index] = color;
    layer.pixels = layer.pixels.slice();

    return {
      ...state,
    };
  });

export const setDragging = (): Action<HiTeaDevState> =>
  action('SET_DRAGGING', (getState) => {
    const state = getState();

    return {
      ...state,
      drawingRoom: {
        ...state.drawingRoom,
        userIsDragging: true,
      },
    };
  });

export const unsetDragging = (): Action<HiTeaDevState> =>
  action('UNSET_DRAGGING', (getState) => {
    const state = getState();

    return {
      ...state,
      drawingRoom: {
        ...state.drawingRoom,
        userIsDragging: false,
      },
    };
  });

export const receiveDroppedFile = (
  fileMap: Map<string, File>
): Action<HiTeaDevState> => {
  return action('RECEIVE_DROPPED_FILE', async (getState, dispatch) => {
    let spriteSheet: SpriteSheet | null = null;

    for (const file of fileMap.values()) {
      const buffer = await file.arrayBuffer();
      const array = new Uint8ClampedArray(buffer);

      try {
        spriteSheet = tbinToSpriteSheet(array);
      } catch (e) {}
    }

    await dispatch(unsetDragging());

    if (spriteSheet == null) {
      return;
    }

    const state = getState();

    return {
      ...state,
      drawingRoom: {
        ...state.drawingRoom,
        spriteSheet,
      },
    };
  });
};

export const syncCanvas = (selection?: Selection): Action<HiTeaDevState> =>
  action('SYNC_CANVAS', (getState) => {
    const state = getState();

    return {
      ...state,
      drawingRoom: {
        ...state.drawingRoom,
        taskQueue: [
          ...state.drawingRoom.taskQueue,
          {
            type: 'sync',
            selection,
          },
        ],
      },
    };
  });

export const dequeueTask = (completedTask: Task): Action<HiTeaDevState> =>
  action('DEQUEUE_TASK', (getState) => {
    const state = getState();

    return {
      ...state,
      drawingRoom: {
        ...state.drawingRoom,
        taskQueue: state.drawingRoom.taskQueue.filter(
          (task) => task !== completedTask
        ),
      },
    };
  });

export const exportFile = (): Action<HiTeaDevState> => {
  const fileResolves = self.showSaveFilePicker({
    types: [
      {
        description: 'HiTea binary file (.tbin)',
        accept: {
          'binary/hitea': ['.tbin'],
        },
      },
    ],
    excludeAcceptAllOption: true,
  });

  return action('EXPORT_FILE', async (getState, dispatch) => {
    const state = getState();
    const file = await fileResolves;
    const { spriteSheet } = state.drawingRoom;

    const tbin = spriteSheetToTbin(spriteSheet);

    const stream = await file.createWritable({
      keepExistingData: false,
    });

    await stream.write(tbin);

    await (stream as any).close();

    console.log(
      '0x' +
        Array.from(tbin)
          .map((n) => n.toString(16).padStart(2, '0'))
          .join('')
    );

    await dispatch(selectTool('pen'));
  });
};
