declare module 'escpos-printer-toolkit' {
  export class EscPos {
    constructor();
    initialize(): this;
    align(alignment: 'left' | 'center' | 'right'): this;
    bold(enable: boolean): this;
    size(width: number, height: number): this;
    text(content: string): this;
    cut(): this;
    getBuffer(): Uint8Array;
  }
}