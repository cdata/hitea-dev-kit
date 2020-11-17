export {};

declare global {
  type FileSystemHandleKind = 'file' | 'directory';

  interface FileSystemHandlePermissionDescriptor {
    mode: 'read';
  }

  interface FileSystemHandle {
    kind: FileSystemHandleKind;
    name: string;
    isSameEntry(other: FileSystemHandle): Promise<boolean>;
    queryPermission(
      descriptor: FileSystemHandlePermissionDescriptor
    ): Promise<PermissionState>;
    requestPermission(
      descriptor: FileSystemHandlePermissionDescriptor
    ): Promise<PermissionState>;
  }

  interface FileSystemCreateWritableOptions {
    keepExistingData: boolean;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    getFile(): Promise<File>;
    createWritable(
      options: FileSystemCreateWritableOptions
    ): Promise<FileSystemWritableFileStream>;
  }

  type WriteCommandType = 'write' | 'seek' | 'truncate';

  interface WriteParams {
    type: WriteCommandType;

    size?: number;
    position?: number;

    data?: BufferSource | Blob | string;
  }

  type FileSystemWriteChunkType = BufferSource | Blob | string | WriteParams;

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: FileSystemWriteChunkType): Promise<void>;
    seek(position: number): Promise<void>;
    truncate(size: number): Promise<void>;
  }

  interface FileSystemAcceptType {
    description: string;
    accept: {
      [index: string]: string | string[];
    };
  }

  interface FilePickerOptions {
    types: FileSystemAcceptType[];
    excludeAcceptAllOption: true;
  }

  interface Window {
    showOpenFilePicker(options: {
      multiple: boolean;
    }): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker(
      options: FilePickerOptions
    ): Promise<FileSystemFileHandle>;
  }
}
