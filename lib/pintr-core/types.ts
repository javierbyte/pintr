export type PintrPoint = [x: number, y: number];
export type PintrLine = [from: PintrPoint, to: PintrPoint];

// The core starts after image preparation. Keeping this shape small means a
// browser, native app, or CLI only has to agree on pixels — never on decoders.
export type PintrImage = {
  width: number;
  height: number;
  // Column-major: gray[x * height + y], where 0 is black and 255 is white.
  gray: Uint8Array;
};

export type PintrConfig = {
  // 0-100
  contrast: number;
  // 0-100
  definition: number;
  singleLine: boolean;
  // in px, greater than zero
  strokeWidth: number;
};

export type PintrSession = {
  next(): PintrLine;
};
