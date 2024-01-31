export abstract class Shader {
  private _context: GPUCanvasContext | null = null;
  device!: GPUDevice;
  canvasFormat!: GPUTextureFormat;
  updateInterval: number = 200;

  constructor(canvas: HTMLCanvasElement | null) {
    this.init(canvas).then(() => {
      this.setup();
      setInterval(() => this.update(), this.updateInterval);
    });
  }

  // Make sure WebGPU is supported, set up the device and the canvas
  async init(canvas: HTMLCanvasElement | null) {
    if (!navigator.gpu) throw Error('WebGPU not supported');

    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) throw Error("Couldn't request WebGPU adapter");
    if (!canvas) throw Error("Couldn't find the canvas");

    this.device = await adapter.requestDevice();
    this._context = canvas.getContext('webgpu');

    this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    this._context?.configure({ device: this.device, format: this.canvasFormat });
  }

  get context() {
    if (!this._context) throw Error("Couldn't get canvas context");

    return this._context;
  }

  /** Put one-time stuff here. Access this.context and this.device */
  abstract setup(): void;

  /** Put render step here. This will be run every 200ms */
  abstract update(): void;
}
