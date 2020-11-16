import { css, customElement, html, LitElement, property } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';
import { styleMap } from 'lit-html/directives/style-map.js';
import { SpriteSheetPalette } from '../state/store.js';
import { intToCssHex } from '../utilities/color.js';

export interface PaletteColorSelectedDetail {
  palette: number;
  color: number;
}

export type PaletteColorSelectedEvent = CustomEvent<PaletteColorSelectedDetail>;

@customElement('color-palettes')
export class ColorPalettes extends LitElement {
  @property({ type: Number })
  activePalette: number = 0;

  @property({ type: Number })
  activeColor: number = 0;

  @property({ type: Array })
  palettes: SpriteSheetPalette[] = [];

  static get styles() {
    return css`
      .palette {
        display: grid;
        grid-template-rows: auto auto auto auto;
        grid-template-columns: auto auto auto auto;
        width: 128px;
        height: 128px;
      }

      button {
        display: block;
        position: relative;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        border: none;
        width: 32px;
        height: 32px;
        cursor: pointer;
      }

      button:focus,
      button:active {
        border: none;
        outline: none;
      }

      button.active {
        border: 1px solid white;
      }

      button.active:before {
        content: ' ';
        display: block;
        box-sizing: border-box;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: 1px solid black;
      }
    `;
  }

  render() {
    const palettes = this.palettes.map((palette, paletteIndex) => {
      const items = palette.colors.map(
        (color, colorIndex) =>
          html`<button
            class="${classMap({
              active:
                paletteIndex === this.activePalette &&
                colorIndex === this.activeColor,
            })}"
            style="${styleMap({
              backgroundColor: intToCssHex(color),
            })}"
            @click="${() =>
              this.dispatchEvent(
                new CustomEvent<PaletteColorSelectedDetail>(
                  'palette-color-selected',
                  {
                    detail: {
                      palette: paletteIndex,
                      color: colorIndex,
                    },
                  }
                )
              )}"
          ></button>`
      );
      return html`<div class="palette" data-id="${palette.id || 'default'}">
        ${items}
      </div>`;
    });

    return html`${palettes}`;
  }
}
