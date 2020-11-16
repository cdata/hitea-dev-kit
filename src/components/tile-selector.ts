import {
  css,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from 'lit-element';

import { styleMap } from 'lit-html/directives/style-map.js';
import { classMap } from 'lit-html/directives/class-map.js';
import { Point, Selection } from '../state/store.js';

export type SelectionEvent = CustomEvent<Selection>;

@customElement('tile-selector')
export class TileSelector extends LitElement {
  @property({ type: Number })
  width: number = 8;

  @property({ type: Number })
  height: number = 16;

  @property({ type: Number })
  xStart: number = 0;

  @property({ type: Number })
  yStart: number = 0;

  @property({ type: Number })
  xEnd: number = 0;

  @property({ type: Number })
  yEnd: number = 0;

  #selectionStart: Point | null = null;

  #pointerEventToTileCoordinates = (event: PointerEvent): Point | null => {
    const cell = event.composedPath()[0] as HTMLDivElement;
    const cellIndex = Array.from(cell.parentNode?.children || []).indexOf(cell);

    if (cellIndex > -1) {
      return {
        x: cellIndex % this.width,
        y: Math.floor(cellIndex / this.width),
      };
    }
    return null;
  };

  #computeSelection = (start: Point, end: Point) => {
    let xStart = Math.min(start.x, end.x);
    let yStart = Math.min(start.y, end.y);
    let xEnd = Math.max(start.x, end.x);
    let yEnd = Math.max(start.y, end.y);

    return {
      start: {
        x: xStart,
        y: yStart,
      },
      end: {
        x: xEnd + 1,
        y: yEnd + 1,
      },
    };
  };

  #announceSelection = (event: PointerEvent) => {
    const start = this.#selectionStart;

    if (start == null) {
      return;
    }

    const end = this.#pointerEventToTileCoordinates(event);

    if (end != null) {
      this.dispatchEvent(
        new CustomEvent<Selection>('selection', {
          detail: this.#computeSelection(start, end),
        })
      );
    }
  };

  #onPointerdown = (event: PointerEvent) => {
    if (this.#selectionStart != null) {
      return;
    }

    const start = this.#pointerEventToTileCoordinates(event);

    if (start != null) {
      this.#selectionStart = start;
    }
  };

  #onPointerup = (event: PointerEvent) => {
    this.#announceSelection(event);
    this.#selectionStart = null;
  };

  #onPointermove = (event: PointerEvent) => {
    this.#announceSelection(event);
  };

  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
        cursor: cell;
        --cell-size: calc(var(--cell-scale, 1) * 8px);
      }

      #container {
        display: block;
        position: relative;
        overflow: hidden;
      }

      #map {
        display: grid;
        position: absolute;
        width: 100%;
        height: 100%;
      }

      #content {
        position: absolute;
        width: 100%;
        height: 100%;
      }

      .cell:hover,
      .cell.active {
        background-color: rgba(30, 15, 80, 0.25);
      }
    `;
  }

  render() {
    const cells: TemplateResult[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let active =
          x >= this.xStart &&
          x < this.xEnd &&
          y >= this.yStart &&
          y < this.yEnd;

        cells.push(
          html`<div class="${classMap({ active, cell: true })}"></div>`
        );
      }
    }

    const columns: string[] = [];
    const rows: string[] = [];

    for (let i = 0; i < this.width; ++i) {
      columns.push(`var(--cell-size)`);
    }

    for (let i = 0; i < this.height; ++i) {
      rows.push(`var(--cell-size)`);
    }

    const containerStyles = styleMap({
      width: `calc(${this.width} * var(--cell-size))`,
      height: `calc(${this.height} * var(--cell-size))`,
    });
    const mapStyles = styleMap({
      gridTemplateRows: rows.join(' '),
      gridTemplateColumns: columns.join(' '),
    });

    return html`
      <div
        id="container"
        style="${containerStyles}"
        @pointerdown="${this.#onPointerdown}"
        @pointerup="${this.#onPointerup}"
        @pointermove="${this.#onPointermove}"
      >
        <div id="content">
          <slot></slot>
        </div>
        <div id="map" style="${mapStyles}">${cells}</div>
      </div>
    `;
  }
}
