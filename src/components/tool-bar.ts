import { css, customElement, html, LitElement, property } from 'lit-element';
import { Tool } from '../state/store.js';

export interface ToolSelectDetail {
  tool: Tool;
}

export type ToolSelectEvent = CustomEvent<ToolSelectDetail>;

@customElement('tool-bar')
export class ToolBar extends LitElement {
  @property({ type: String })
  selectedTool: Tool = 'pen';

  #selectTool = (tool: Tool) => {
    this.dispatchEvent(
      new CustomEvent<ToolSelectDetail>('tool-select', {
        detail: {
          tool,
        },
      })
    );
  };

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
      }

      button {
        display: block;
        width: 64px;
        height: 64px;
        background-color: transparent;
        border: none;
        margin: 0;
        padding: 0;
        background-size: 50%;
        background-position: center;
        background-repeat: no-repeat;
        cursor: pointer;
      }

      button.active {
        background-color: rgba(255, 255, 255, 0.25);
      }

      #menu {
        background-image: url('./images/toolMenu.png');
      }

      #pen {
        background-image: url('./images/toolPencil.png');
      }

      #eraser {
        background-image: url('./images/toolEraser.png');
      }
    `;
  }

  render() {
    return html`
      <button
        id="menu"
        class="${this.selectedTool === 'menu' ? 'active' : ''}"
        @click="${() => this.#selectTool('menu')}"
      ></button>
      <button
        id="pen"
        class="${this.selectedTool === 'pen' ? 'active' : ''}"
        @click="${() => this.#selectTool('pen')}"
      ></button>
    `;
  }
}
