/**
 * Missing module declarations
 */

export {};

// Declaration for yjs (collaboration)
declare module 'yjs' {
  export class Doc {
    constructor();
    getMap(name?: string): any;
    getArray(name?: string): any;
    getText(name?: string): any;
  }
  export class Awareness {
    setLocalState(state: any): void;
    getLocalState(): any;
    on(event: string, callback: Function): void;
  }
  export function createDoc(): Doc;
}

// Declaration for pdf-parse
declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }
  function pdf(dataBuffer: Buffer, options?: any): Promise<PDFData>;
  export = pdf;
}


// Plugin types (referenced but not defined)
export interface InstalledPlugin {
  name: string;
  version: string;
  path: string;
  enabled: boolean;
}

export interface PluginVerification {
  valid: boolean;
  signature?: string;
  checksum?: string;
}
