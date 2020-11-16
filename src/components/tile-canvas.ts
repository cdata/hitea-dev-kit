import { css, customElement, html, LitElement, property } from 'lit-element';
import { Grid } from '../three/grid.js';
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js';
import { Scene } from 'three/src/scenes/Scene.js';
import { OrthographicCamera } from 'three/src/cameras/OrthographicCamera.js';
import {
  emptySelection,
  Selection,
  SpriteSheet,
  SpriteSheetPalette,
} from '../state/store.js';
import { Color } from 'three/src/math/Color';
import { VirtualCanvas } from '../three/virtual-canvas.js';
import { Raycaster } from 'three/src/core/Raycaster.js';
import { Vector2 } from 'three/src/math/Vector2.js';
import { TileBuffer } from '../utilities/tile-buffer.js';

export interface PaintDetail {
  x: number;
  y: number;
}

export type PaintEvent = CustomEvent<PaintDetail>;

@customElement('tile-canvas')
export class TileCanvas extends LitElement {
  @property({ type: Object })
  selection: Selection = emptySelection();

  @property({ type: Number })
  scale: number = 1;

  @property({ type: Object })
  spriteSheet: SpriteSheet | null = null;

  @property({ type: Array })
  pixels: number[] = [];

  @property({ type: Array })
  palettes: SpriteSheetPalette[] = [];

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
  #tileGrid: Grid = new Grid(new Color('#0c2231'), 1);
  #pixelGrid: Grid = new Grid(new Color('#444444'), 0.2);

  #raycaster = new Raycaster();

  #width: number = self.innerWidth;
  #height: number = self.innerHeight;
  #drawing: boolean = false;

  #onPointerdown = (event: PointerEvent) => {
    if (this.#drawing) {
      return;
    }

    this.#drawing = true;
    this.#testIntersection(event.x, event.y);
  };

  #onPointermove = (event: PointerEvent) => {
    if (!this.#drawing) {
      return;
    }

    this.#testIntersection(event.x, event.y);
  };

  #onPointerup = (_event: PointerEvent) => {
    this.#drawing = false;
  };

  #onWheel = (event: WheelEvent) => {
    const delta = event.deltaY;
    const scale = this.#scene.scale.x;
    const percentChange = scale * (delta / 1000);

    const nextScale = Math.max(Math.min(scale + percentChange, 300), 0.5);

    // console.log(scale, percentChange, nextScale);

    this.#scene.scale.setScalar(nextScale);
  };

  #testIntersection = (x: number, y: number) => {
    this.#raycaster.ray.origin.set(
      x + this.#width / -2,
      -1 * y + this.#height / 2,
      10
    );

    const intersections = this.#raycaster.intersectObject(this.#scene, true);

    if (intersections.length) {
      this.#paintUv(intersections[0].uv!);
    }
  };

  #paintUv = (uv: Vector2) => {
    const gridColumns = this.selection.end.x - this.selection.start.x;
    const gridRows = this.selection.end.y - this.selection.start.y;

    const { cellSize } = this.#tileGrid;

    const pixelWidth = gridColumns * cellSize;
    const pixelHeight = gridRows * cellSize;

    const pixelXOffset = this.selection.start.x * cellSize;
    const pixelYOffset = this.selection.start.y * cellSize;

    const localX = (uv.x * pixelWidth) | 0;
    const localY = ((1 - uv.y) * pixelHeight) | 0;

    const x = pixelXOffset + localX;
    const y = pixelYOffset + localY;

    // console.log('PAINT:', x, y);
    this.dispatchEvent(
      new CustomEvent<PaintDetail>('paint', {
        detail: {
          x,
          y,
        },
      })
    );
  };

  #updateSize = () => {
    // TODO: ResizeObserver / element bounds
    const width = (this.#width = self.innerWidth);
    const height = (this.#height = self.innerHeight);

    this.#renderer.setPixelRatio(self.devicePixelRatio);
    this.#renderer.setSize(width, height, true);
    this.#camera.left = (-1 * width) / 2;
    this.#camera.right = width / 2;
    this.#camera.bottom = (-1 * height) / 2;
    this.#camera.top = height / 2;
    this.#camera.updateProjectionMatrix();
  };

  #render = () => {
    this.#renderer.render(this.#scene, this.#camera);
    this.#animationFrameId = requestAnimationFrame(() => this.#render());
  };

  #updateSelection = () => {
    const gridColumns = this.selection.end.x - this.selection.start.x;
    const gridRows = this.selection.end.y - this.selection.start.y;
    const { cellSize } = this.#tileGrid;

    const gridWidth = gridColumns * cellSize;
    const gridHeight = gridRows * cellSize;
    const gridAspect = gridWidth / gridHeight;

    const width = this.#width;
    const height = this.#height;
    const aspect = width / height;

    let scale = 1;

    if (gridAspect > aspect) {
      scale = this.#width / gridWidth;
    } else {
      scale = this.#height / gridHeight;
    }

    scale *= 0.9;

    this.#virtualCanvas.setSelection(this.selection);
    this.#tileGrid.setSize(gridColumns, gridRows);
    this.#pixelGrid.setSize(gridColumns * 8, gridRows * 8, 1);

    this.#scene.scale.setScalar(scale);
  };

  #updatePixels = () => {
    this.#virtualCanvas.updatePixels();
  };

  #updateSpriteSheet = () => {};

  #updateTileBuffer = () => {
    if (this.tileBuffer == null) {
      return;
    }

    this.#virtualCanvas.setTileBuffer(this.tileBuffer);
  };

  static get styles() {
    return css`
      :host {
        display: block;
        cursor: crosshair;
      }

      canvas {
        width: 100%;
        height: 100%;
      }
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    self.addEventListener('resize', this.#updateSize);
    // this.addEventListener('click', this.#onClick);
    this.addEventListener('pointerdown', this.#onPointerdown);
    this.addEventListener('pointerup', this.#onPointerup);
    this.addEventListener('pointermove', this.#onPointermove);
    this.addEventListener('wheel', this.#onWheel);

    this.#raycaster.layers.set(1);
    this.#tileGrid.layers.set(2);
    this.#pixelGrid.layers.set(2);
    this.#tileGrid.position.set(0.0, 0.0, 0.01);
    this.#virtualCanvas.position.set(0.0, 0.0, -0.01);

    this.#scene.add(this.#pixelGrid);
    this.#scene.add(this.#tileGrid);
    this.#scene.add(this.#virtualCanvas);
    // this.#scene.add(this.#camera);

    this.#renderer.setClearColor('#5062aa');
    this.#updateSize();

    this.#camera.layers.enable(1);
    this.#camera.layers.enable(2);
    this.#camera.position.set(0, 0, 10);
    this.#camera.lookAt(this.#scene.position);

    this.#render();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    self.removeEventListener('resize', this.#updateSize);
    this.removeEventListener('pointerdown', this.#onPointerdown);
    this.removeEventListener('pointerup', this.#onPointerup);
    this.removeEventListener('pointermove', this.#onPointermove);
    this.removeEventListener('wheel', this.#onWheel);

    if (this.#animationFrameId != null) {
      cancelAnimationFrame(this.#animationFrameId);
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    if (changedProperties.has('tileBuffer')) {
      this.#updateTileBuffer();
    }

    if (changedProperties.has('selection') || changedProperties.has('pixels')) {
      this.#updateSelection();
      this.#updatePixels();
    }

    if (changedProperties.has('spriteSheet')) {
      this.#updateSpriteSheet();
    }
  }

  render() {
    return html` ${this.#canvas} `;
  }
}
