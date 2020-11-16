import { LitElement, customElement, html, css, property } from 'lit-element';
import '../components/tile-selector.js';
import '../components/tool-bar.js';
import '../components/tile-canvas.js';
import '../components/color-palettes.js';
import '../components/sprite-sheet-preview.js';
import {
  emptySelection,
  HiTeaDevState,
  Selection,
  SpriteSheetPalette,
  Tool,
} from '../state/store.js';
import {
  connect,
  selfDispatch,
} from '@0xcda7a/bag-of-tricks/lib/state/connect.js';
import { select } from '@0xcda7a/bag-of-tricks/lib/state/decorators/select.js';
import {
  paint,
  selectPaletteColor,
  selectTiles,
  selectTool,
} from '../state/actions.js';
import { SelectionEvent } from '../components/tile-selector.js';
import { PaletteColorSelectedEvent } from '../components/color-palettes.js';
import { PaintEvent } from '../components/tile-canvas.js';
import { TileBuffer } from '../utilities/tile-buffer.js';
import { intToRgb } from '../utilities/color.js';
import { ToolSelectEvent } from '../components/tool-bar.js';
import { classMap } from 'lit-html/directives/class-map.js';

@customElement('drawing-room-app')
export class DrawingRoomApp extends connect<HiTeaDevState>()(LitElement) {
  @property({ type: Object })
  @select<HiTeaDevState>((state) => state.drawingRoom.selection)
  selection: Selection = emptySelection();

  @property({ type: String })
  @select<HiTeaDevState>((state) => state.drawingRoom.activeTool)
  activeTool: Tool = 'pen';

  @property({ type: Number })
  @select<HiTeaDevState>((state) => state.drawingRoom.activePalette)
  activePalette: number = 0;

  @property({ type: Number })
  @select<HiTeaDevState>((state) => state.drawingRoom.activeColor)
  activeColor: number = 0;

  @property({ type: Array })
  @select<HiTeaDevState>((state) => state.drawingRoom.spriteSheet.palettes)
  palettes: SpriteSheetPalette[] = [];

  @property({ type: Array })
  @select<HiTeaDevState>(
    (state) => state.drawingRoom.spriteSheet.layers[0].pixels
  )
  pixels: number[] = [];

  #tileBuffer = new TileBuffer();

  #selectTiles = selfDispatch(selectTiles);
  #selectPaletteColor = selfDispatch(selectPaletteColor);
  #selectTool = selfDispatch(selectTool);
  #paint = selfDispatch(paint);

  #onPaint = async (event: PaintEvent) => {
    const { x, y } = event.detail;

    await this.#paint(x, y, this.activeColor);

    const palette = this.palettes[this.activePalette];
    const color = palette.colors[this.activeColor];
    const { r, g, b } = intToRgb(color);

    this.#tileBuffer.setPixel(x, y, [r, g, b, 255]);

    // console.log(pixelsToHex(this.pixels));
  };

  static get styles() {
    return css`
      :host {
        display: flex;
        position: relative;
        flex-direction: row;
        overflow: hidden;
      }

      .panel {
        display: block;
        position: relative;
        background-color: var(--foreground-fill-color);
        box-shadow: 4px 4px 0 var(--accent-color);
      }

      #ui {
        position: absolute;
        display: flex;
        width: 100%;
        height: 100%;
        justify-content: space-between;
        pointer-events: none;
      }

      #ui:after {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        background-color: var(--default-text-color);
        transition: opacity 0.2s;
        transition-delay: 0.15s;
      }

      #ui.disabled:after {
        opacity: 0.25;
        pointer-events: all;
        transition-delay: 0s;
      }

      #tools {
        flex: 0 0 auto;
        width: 64px;
        padding: 16px;
      }

      #tools > *,
      #sidebar > * {
        pointer-events: initial;
      }

      #sidebar {
        display: flex;
        flex-direction: column;
        flex: 0 0 auto;
        width: 128px;
        padding: 16px;
      }

      #sidebar > .panel {
        margin-bottom: 16px;
      }

      #menu {
        display: block;
        position: absolute;
        z-index: 2;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        top: 16px;
        left: 96px;
        width: 128px;

        transition: transform 0.2s, opacity 0.2s;
        transition-delay: 0.15s;
        transform: translateY(0);
        opacity: 1;
      }

      #menu.disabled {
        pointer-events: none;
        transform: translateY(-50%);
        transition-delay: 0s;
        opacity: 0;
      }

      #menu > .panel {
        display: flex;
        flex-direction: column;
        width: 100%;
      }

      #menu > .panel > button {
        cursor: pointer;
        font-family: system-ui;
      }

      tile-canvas {
        width: 100%;
        height: 100%;
      }

      tile-selector {
        --cell-scale: 2;
      }
    `;
  }

  render() {
    return html`
      <section
        id="menu"
        class="${classMap({
          disabled: this.activeTool !== 'menu',
        })}"
      >
        <div class="panel">
          <button disabled>Export</button>
        </div>
      </section>
      <section
        id="ui"
        @click="${(event: Event) => {
          event.target === event.currentTarget &&
            this.activeTool === 'menu' &&
            this.#selectTool('pen');
        }}"
        class="${classMap({
          disabled: this.activeTool === 'menu',
        })}"
      >
        <section id="tools">
          <div class="panel">
            <tool-bar
              .selectedTool="${this.activeTool}"
              @tool-select="${(event: ToolSelectEvent) =>
                this.#selectTool(event.detail.tool)}"
            ></tool-bar>
          </div>
        </section>
        <section id="sidebar">
          <div class="panel">
            <tile-selector
              .xStart="${this.selection.start.x}"
              .yStart="${this.selection.start.y}"
              .xEnd="${this.selection.end.x}"
              .yEnd="${this.selection.end.y}"
              @selection="${(event: SelectionEvent) =>
                this.#selectTiles(event.detail)}"
            >
              <sprite-sheet-preview
                .scale="${2}"
                .tileBuffer="${this.#tileBuffer}"
                .pixels="${this.pixels}"
              ></sprite-sheet-preview>
            </tile-selector>
          </div>
          <div class="panel">
            <color-palettes
              .activeColor="${this.activeColor}"
              .activePalette="${this.activePalette}"
              .palettes="${this.palettes}"
              @palette-color-selected="${(event: PaletteColorSelectedEvent) =>
                this.#selectPaletteColor(
                  event.detail.palette,
                  event.detail.color
                )}"
            ></color-palettes>
          </div>
        </section>
      </section>
      <tile-canvas
        .pixels="${this.pixels}"
        .palettes="${this.palettes}"
        .selection="${this.selection}"
        .tileBuffer="${this.#tileBuffer}"
        @paint="${this.#onPaint}"
      ></tile-canvas>
    `;
  }
}
