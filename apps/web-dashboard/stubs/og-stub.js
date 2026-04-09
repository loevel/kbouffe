// Stub: @vercel/og is not used in production (no opengraph-image routes).
// This prevents wrangler from bundling resvg.wasm + yoga.wasm.
export class ImageResponse extends Response {
  constructor() {
    super('', { status: 501 });
  }
}
export default { ImageResponse };
