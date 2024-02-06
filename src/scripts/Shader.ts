export abstract class Shader {
  private _context: GPUCanvasContext | null | undefined = undefined;
  device!: GPUDevice;
  canvasFormat!: GPUTextureFormat;
  /** Milliseconds between frames. Set to 0 for maximum FPS. */
  frameLength: number = 200;
  prevMS: number | undefined = undefined;
  avgDeltaT = 0;
  // TODO: handle incrementation in Shader class by separating compute and render functions
  /** The current step of the animation, increment it in your update function. */
  step = 0;

  constructor(canvas: HTMLCanvasElement | null) {
    this.init(canvas).then(() => {
      this.setup();
      if (this.frameLength === 0) {
        const step = (currMS: number) => {
          if (this.prevMS === undefined) this.prevMS = currMS;
          const deltaT = currMS - this.prevMS;
          this.avgDeltaT = (this.avgDeltaT * this.step + deltaT) / (this.step + 1);
          this.prevMS = currMS;

          requestAnimationFrame(step);
          this.update(deltaT);
        };

        requestAnimationFrame(step);
      } else {
        setInterval(() => this.update(), this.frameLength);
      }

      setInterval(() => this.recordFPS(), 1000);
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

  recordFPS() {
    const fpsElement = document.getElementById('fps');

    if (!fpsElement || this.avgDeltaT <= 0) return;

    fpsElement.textContent = `${Math.floor(1000 / this.avgDeltaT)} FPS`;
  }

  /** Put one-time stuff here. Access this.context and this.device */
  abstract setup(): void;

  /** Put render step here. This will be run every 200ms */
  abstract update(deltaT?: number): void;
}
