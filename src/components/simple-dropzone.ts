import { css, customElement, html, LitElement } from 'lit-element';
import { SimpleDropzone } from 'simple-dropzone';

export interface DropzoneDropDetail {
  fileMap: Map<string, File>;
}

export type DropzoneDropEvent = CustomEvent<DropzoneDropDetail>;

@customElement('simple-dropzone')
export class SimpleDropzoneElement extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
      }

      input {
        visibility: hidden;
        display: block;
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        z-index: 100;
      }

      ::slotted(*) {
        pointer-events: none;
      }
    `;
  }

  #fileInput = (() => {
    const input = document.createElement('input');
    input.type = 'file';
    return input;
  })();
  #dropzone: SimpleDropzone | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.initializeDropzone();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#dropzone != null) {
      this.#dropzone.destroy();
    }
    this.#dropzone = null;
  }

  initializeDropzone() {
    if (this.#dropzone != null) {
      return;
    }

    this.#dropzone = new SimpleDropzone(this, this.#fileInput);

    this.#dropzone.on('drop', (data) => {
      console.log(data);
      this.dispatchEvent(
        new CustomEvent<DropzoneDropDetail>('dropzone-drop', {
          detail: {
            fileMap: data.files,
          },
        })
      );
    });
  }

  render() {
    return html`
      ${this.#fileInput}
      <slot></slot>
    `;
  }
}
