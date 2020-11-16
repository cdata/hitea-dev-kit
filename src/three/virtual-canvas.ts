import { Object3D } from 'three/src/core/Object3D.js';
import { Mesh } from 'three/src/objects/Mesh.js';
import { PlaneBufferGeometry } from 'three/src/geometries/PlaneBufferGeometry.js';
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial.js';
import { DataTexture } from 'three/src/textures/DataTexture.js';
import { RGBAFormat, RepeatWrapping } from 'three/src/constants.js';
import { TileBuffer } from '../utilities/tile-buffer';
import { Material } from 'three/src/materials/Material';
import { Selection } from '../state/store';

class CanvasMaterial extends ShaderMaterial {
  dispose() {
    super.dispose();
    this.uniforms.pixels.value.dispose();
  }

  updatePixels() {
    this.uniforms.pixels.value.needsUpdate = true;
  }

  setUniformsFromSelection(selection: Selection) {
    this.uniforms.width.value = selection.end.x - selection.start.x;
    this.uniforms.height.value = selection.end.y - selection.start.y;
    this.uniforms.y.value = selection.start.y;
    this.uniforms.x.value = selection.start.x;
    this.needsUpdate = true;
  }

  constructor(tileBuffer: TileBuffer) {
    super({
      uniforms: {
        pixels: {
          value: new DataTexture(
            tileBuffer.array,
            tileBuffer.bufferEdgePixels,
            tileBuffer.bufferEdgePixels,
            RGBAFormat,
            undefined,
            undefined,
            RepeatWrapping,
            RepeatWrapping
          ),
        },
        x: {
          value: 0,
        },
        y: {
          value: 0,
        },
        width: {
          value: 0,
        },
        height: {
          value: 0,
        },
        tileDimension: {
          value: 16,
        },
      },
      vertexShader: `
      out vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0) * projectionMatrix * modelViewMatrix;
      }
      `,
      fragmentShader: `
      uniform sampler2D pixels;
      uniform float x;
      uniform float y;
      uniform float width;
      uniform float height;
      uniform float tileDimension;

      in vec2 vUv;

      void main() {
        float offsetX = x / tileDimension;
        float extentX = width / tileDimension;
        float offsetY = y / tileDimension;
        float extentY = height / tileDimension;

        float uvX = offsetX + (vUv.x) * extentX;
        float uvY = offsetY + (1.0 - vUv.y) * extentY;

        vec2 coord = vec2(uvX, uvY);
        gl_FragColor = texture2D(pixels, coord);
      }
      `,
    });
  }
}

// import { Uint8BufferAttribute } from 'three/src/core/BufferAttribute';
export class VirtualCanvas extends Object3D {
  #plane: Mesh | null = null;
  #tileBuffer: TileBuffer | null = null;

  #currentSelection: Selection | null = null;

  constructor() {
    super();

    this.layers.set(1);
  }

  setTileBuffer(buffer: TileBuffer) {
    if (this.#tileBuffer === buffer) {
      return;
    }

    this.#tileBuffer = buffer;

    const material = new CanvasMaterial(buffer);

    if (this.#plane != null) {
      (this.#plane.material as Material).dispose();
      this.#plane.material = material;
    } else {
      const geometry = new PlaneBufferGeometry(1, 1, 1, 1);
      const material = new CanvasMaterial(buffer);

      this.#plane = new Mesh(geometry, material);
      this.#plane.layers.set(1);
      this.add(this.#plane);
    }

    // console.log('VirtualCanvas#setTileBuffer');

    const selection = this.#currentSelection!;
    this.#currentSelection = null;
    if (selection != null) {
      this.setSelection(selection);
    }
  }

  setSelection(selection: Selection) {
    const { x: startX, y: startY } = selection.start;
    const { x: endX, y: endY } = selection.end;

    if (
      startX === this.#currentSelection?.start.x &&
      startY === this.#currentSelection?.start.y &&
      endX === this.#currentSelection?.end.x &&
      endY === this.#currentSelection?.end.y
    ) {
      return;
    }

    this.#currentSelection = selection;

    if (this.#plane == null) {
      return;
    }

    (this.#plane.material as CanvasMaterial).setUniformsFromSelection(
      selection
    );

    const width = (endX - startX) * (this.#tileBuffer?.tilePixelWidth || 8);
    const height = (endY - startY) * (this.#tileBuffer?.tilePixelWidth || 8);

    this.#plane.scale.set(width, height, 1);

    // console.log('VirtualCanvas#setSelection', selection);
    this.updatePixels();
  }

  updatePixels() {
    (this.#plane?.material as CanvasMaterial).updatePixels();
    // console.log('VirtualCanvas#updatePixels');
  }
}
