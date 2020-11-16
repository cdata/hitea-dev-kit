import { LineSegments } from 'three/src/objects/LineSegments.js';
import { BufferGeometry } from 'three/src/core/BufferGeometry.js';
import { Float32BufferAttribute } from 'three/src/core/BufferAttribute.js';
import { LineBasicMaterial } from 'three/src/materials/LineBasicMaterial.js';
import { Color } from 'three/src/math/Color.js';

const createVertices = (width: number, height: number, cellSize: number) => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  const left = -1 * halfWidth * cellSize;
  const right = halfWidth * cellSize;
  const top = halfHeight * cellSize;
  const bottom = -1 * halfHeight * cellSize;

  const vertices = [];

  for (let y = top; y >= bottom; y -= cellSize) {
    vertices.push(left, y, 0, right, y, 0);
  }

  for (let x = left; x <= right; x += cellSize) {
    vertices.push(x, top, 0, x, bottom, 0);
  }

  return new Float32BufferAttribute(vertices, 3);
};

export class Grid extends LineSegments {
  cellSize: number;

  width: number;
  height: number;

  constructor(
    color: Color,
    alpha: number,
    width = 4,
    height = 4,
    cellSize = 8
  ) {
    const geometry = new BufferGeometry();
    const material = new LineBasicMaterial({ color });

    if (alpha !== 1) {
      material.opacity = alpha;
      material.transparent = true;
    }
    geometry.setAttribute('position', createVertices(width, height, cellSize));

    super(geometry, material);

    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.type = 'Grid';
  }

  setSize(width: number, height: number, cellSize: number = 8) {
    if (
      width === this.width &&
      height === this.height &&
      cellSize === this.cellSize
    ) {
      return;
    }

    (this.geometry as BufferGeometry).setAttribute(
      'position',
      createVertices(width, height, cellSize)
    );

    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
  }
}
