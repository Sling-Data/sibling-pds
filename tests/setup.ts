class MockTextEncoder {
  encode(input?: string): Uint8Array {
    return new Uint8Array(Buffer.from(input || ""));
  }
}

class MockTextDecoder {
  decode(input?: Uint8Array): string {
    return input ? Buffer.from(input).toString() : "";
  }
}

global.TextEncoder = MockTextEncoder as any;
global.TextDecoder = MockTextDecoder as any;
