declare module 'simple-dropzone' {
  export class SimpleDropzone {
    constructor(el: Element, inputEl: Element);

    on(
      type: 'drop',
      callback: (data: { files: Map<string, File> }) => void
    ): SimpleDropzone;
    on(type: 'dropstart', callback: () => void): SimpleDropzone;
    on(
      type: 'droperror',
      callback: (error: { message: string }) => void
    ): SimpleDropzone;

    destroy(): void;
  }
}
