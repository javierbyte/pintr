export type PintrPoint = [x: number, y: number];
export type PintrLine = [from: PintrPoint, to: PintrPoint];

// The core starts after image preparation. Keeping this shape small means a
// browser, native app, or CLI only has to agree on pixels — never on decoders.
export type PintrImage = {
  width: number;
  height: number;
  gray: Uint8Array;
};

export type PintrConfig = {
  contrast: number;
  definition: number;
  singleLine: boolean;
  strokeWidth: number;
};

export type PintrBatch = {
  startLine: number;
  endLine: number;
  lines: PintrLine[];
};

export type PintrSession = {
  width: number;
  height: number;
  seed: number;
  lineCount: number;
  next(lineCount: number): PintrBatch;
};

export class PintrError extends Error {
  constructor(message: string) {
    super(`PINTR: ${message}`);
    this.name = 'PintrError';
  }
}
