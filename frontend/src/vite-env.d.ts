/// <reference types="vite/client" />

declare module 'd3-delaunay' {
  export class Delaunay {
    static from(points: ArrayLike<number> | Iterable<number> | ArrayLike<ArrayLike<number>>): Delaunay;
    triangles: Uint32Array;
    constructor(points: Float64Array);
  }
}
