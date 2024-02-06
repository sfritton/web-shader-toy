export abstract class Shader {
  private _context: GPUCanvasContext | null | undefined = undefined;
  device!: GPUDevice;
  canvasFormat!: GPUTextureFormat;
  updateInterval: number = 200;
  shouldRequestAnimationFrame = false;
  prevMS: number | undefined = undefined;

  constructor(canvas: HTMLCanvasElement | null) {
    this.init(canvas).then(() => {
      this.setup();
      if (this.shouldRequestAnimationFrame) {
        const step = (currMS: number) => {
          if (this.prevMS === undefined) this.prevMS = currMS;
          const deltaT = currMS - this.prevMS;
          this.prevMS = currMS;

          requestAnimationFrame(step);
          this.update(deltaT);
        };

        requestAnimationFrame(step);
      } else {
        setInterval(() => this.update(), this.updateInterval);
      }
    });
  }

  // Make sure WebGPU is supported, set up the device and the canvas
  async init(canvas: HTMLCanvasElement | null) {
    if (!navigator.gpu) {
      document.getElementById('no-web-gpu')?.classList.add('visible');
      throw Error('WebGPU not supported');
    }

    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      document.getElementById('no-adapter')?.classList.add('visible');
      throw Error("Couldn't request WebGPU adapter");
    }

    const device = await adapter.requestDevice();
    if (!device) {
      document.getElementById('no-device')?.classList.add('visible');
      throw Error('Couldn’t request WebGPU logical device.');
    }

    this.device = device;

    this._context = canvas?.getContext('webgpu');

    this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    this._context?.configure({ device: this.device, format: this.canvasFormat });
  }

  get context() {
    if (!this._context) {
      document.getElementById('no-canvas')?.classList.add('visible');
      throw Error("Couldn't get canvas context");
    }

    return this._context;
  }

  /** Put one-time stuff here. Access this.context and this.device */
  abstract setup(): void;

  /** Put render step here. This will be run every 200ms */
  abstract update(deltaT?: number): void;
}
