// Definiciones de tipos para Web Serial API

interface SerialPort {
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;

  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;

  getInfo(): SerialPortInfo;
}

interface SerialOptions {
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  bufferSize?: number;
  flowControl?: 'none' | 'hardware';
}

interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialPortFilter {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialPortRequestOptions {
  filters?: SerialPortFilter[];
}

interface Serial extends EventTarget {
  getPorts(): Promise<SerialPort[]>;
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;

  addEventListener(
    type: 'connect' | 'disconnect',
    listener: (this: Serial, ev: Event) => any,
    options?: boolean | AddEventListenerOptions
  ): void;

  removeEventListener(
    type: 'connect' | 'disconnect',
    listener: (this: Serial, ev: Event) => any,
    options?: boolean | EventListenerOptions
  ): void;
}

interface Navigator {
  serial: Serial;
}
