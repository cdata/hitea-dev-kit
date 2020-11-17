import { customElement, html, LitElement, property } from 'lit-element';
import { OrthographicCamera } from 'three/src/cameras/OrthographicCamera.js';
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js';
import { Scene } from 'three/src/scenes/Scene.js';
import { VirtualCanvas } from '../three/virtual-canvas.js';
import { TileBuffer } from '../utilities/tile-buffer.js';

@customElement('sprite-sheet-preview')
export class SpriteSheetPreview extends LitElement {
  @property({ type: Number })
  scale: number = 1;

  @property({ type: Object })
  tileBuffer: TileBuffer | null = null;

  #canvas = document.createElement('canvas');
  #animationFrameId: number | null = null;

  #renderer = new WebGLRenderer({
    canvas: this.#canvas,
  });
  #scene = new Scene();
  #camera = new OrthographicCamera(-1, 1, -1, 1);

  #virtualCanvas = new VirtualCanvas();

  #updateSize = () => {
    // TODO: ResizeObserver / element bounds
    const width = this.tileBuffer?.pixelsPerRow || 1;
    const height = this.tileBuffer?.pixelsPerColumn || 1;

    this.#renderer.setPixelRatio(self.devicePixelRatio);
    this.#renderer.setSize(width * this.scale, height * this.scale, true);

    this.#camera.left = (-1 * width) / 2;
    this.#camera.right = width / 2;
    this.#camera.bottom = (-1 * height) / 2;
    this.#camera.top = height / 2;
    this.#camera.updateProjectionMatrix();
  };

  #updateTileBuffer = () => {
    if (this.tileBuffer == null) {
      return;
    }

    this.#virtualCanvas.setTileBuffer(this.tileBuffer);
    this.#virtualCanvas.setSelection({
      start: {
        x: 0,
        y: 0,
      },
      end: {
        x: this.tileBuffer.columns,
        y: this.tileBuffer.rows,
      },
    });
  };

  #updatePixels = () => {
    this.#virtualCanvas.updatePixels();
  };

  #render = () => {
    this.#renderer.render(this.#scene, this.#camera);
    this.#animationFrameId = requestAnimationFrame(() => this.#render());
  };

  connectedCallback() {
    super.connectedCallback();
    this.#scene.add(this.#virtualCanvas);

    this.#renderer.setClearColor('#5062aa');
    this.#updateSize();

    this.#camera.layers.enable(1);
    this.#camera.position.set(0, 0, 10);
    this.#camera.lookAt(this.#scene.position);

    this.#render();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.#animationFrameId != null) {
      cancelAnimationFrame(this.#animationFrameId);
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    if (changedProperties.has('scale')) {
      this.#updateSize();
    }

    if (changedProperties.has('tileBuffer')) {
      const oldTileBuffer = changedProperties.get('tileBuffer') as
        | TileBuffer
        | undefined;
      if (oldTileBuffer != null) {
        oldTileBuffer.removeEventListener('updated', this.#updatePixels);
      }
      const newTileBuffer = this.tileBuffer;
      if (newTileBuffer != null) {
        newTileBuffer.addEventListener('updated', this.#updatePixels);
        this.#updateTileBuffer();
      }
    }
  }

  render() {
    return html` ${this.#canvas} `;
  }
}
