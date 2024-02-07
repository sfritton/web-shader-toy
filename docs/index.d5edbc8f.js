class $50ad2468206126ad$export$462bb059fed9d9e5 {
    calculateDeltaT(currMS) {
        if (this.prevMS === undefined) this.prevMS = currMS;
        const deltaT = currMS - this.prevMS;
        if (this.avgDeltaT === 0) this.avgDeltaT = deltaT;
        else if (deltaT / this.avgDeltaT < 5) this.avgDeltaT = (this.avgDeltaT * this.step + deltaT) / (this.step + 1);
        this.prevMS = currMS;
        return deltaT;
    }
    // Make sure WebGPU is supported, set up the device and the canvas
    async init(canvas) {
        var _this__canvas, _this__context;
        if (!navigator.gpu) {
            var _document_getElementById;
            (_document_getElementById = document.getElementById("no-web-gpu")) === null || _document_getElementById === void 0 ? void 0 : _document_getElementById.classList.add("visible");
            throw Error("WebGPU not supported");
        }
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            var _document_getElementById1;
            (_document_getElementById1 = document.getElementById("no-adapter")) === null || _document_getElementById1 === void 0 ? void 0 : _document_getElementById1.classList.add("visible");
            throw Error("Couldn't request WebGPU adapter");
        }
        const device = await adapter.requestDevice();
        if (!device) {
            var _document_getElementById2;
            (_document_getElementById2 = document.getElementById("no-device")) === null || _document_getElementById2 === void 0 ? void 0 : _document_getElementById2.classList.add("visible");
            throw Error("Couldn\u2019t request WebGPU logical device.");
        }
        this.device = device;
        this._canvas = canvas;
        this._context = (_this__canvas = this._canvas) === null || _this__canvas === void 0 ? void 0 : _this__canvas.getContext("webgpu");
        this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        (_this__context = this._context) === null || _this__context === void 0 ? void 0 : _this__context.configure({
            device: this.device,
            format: this.canvasFormat
        });
    }
    get context() {
        if (!this._context) {
            var _document_getElementById;
            (_document_getElementById = document.getElementById("no-canvas")) === null || _document_getElementById === void 0 ? void 0 : _document_getElementById.classList.add("visible");
            throw Error("Couldn't get canvas context");
        }
        return this._context;
    }
    get canvas() {
        if (!this._canvas) {
            var _document_getElementById;
            (_document_getElementById = document.getElementById("no-canvas")) === null || _document_getElementById === void 0 ? void 0 : _document_getElementById.classList.add("visible");
            throw Error("Couldn't get canvas element");
        }
        return this._canvas;
    }
    recordFPS() {
        const fpsElement = document.getElementById("fps");
        if (!fpsElement || this.avgDeltaT <= 0) return;
        fpsElement.textContent = `${Math.floor(1000 / this.avgDeltaT)} FPS`;
    }
    constructor(canvas){
        this._context = undefined;
        this._canvas = undefined;
        /** Milliseconds between frames. Set to 0 for maximum FPS. */ this.frameLength = 200;
        this.prevMS = undefined;
        this.avgDeltaT = 0;
        // TODO: handle incrementation in Shader class by separating compute and render functions
        /** The current step of the animation, increment it in your update function. */ this.step = 0;
        this.init(canvas).then(()=>{
            this.setup();
            if (this.frameLength === 0) {
                const step = (currMS)=>{
                    const deltaT = this.calculateDeltaT(currMS);
                    requestAnimationFrame(step);
                    this.update(deltaT);
                };
                requestAnimationFrame(step);
            } else setInterval(()=>this.update(), this.frameLength);
            setInterval(()=>this.recordFPS(), 1000);
        });
    }
}


const $4e939e94d233ed5b$export$eb912ff306213ab3 = (radius, angle)=>{
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    return {
        x: x,
        y: y
    };
};
const $4e939e94d233ed5b$export$c4293a6a9b6ab33a = (radius)=>{
    const r = Math.sqrt(Math.random()) * radius;
    const angle = Math.random() * 2 * Math.PI;
    return $4e939e94d233ed5b$export$eb912ff306213ab3(r, angle);
};


const $c8a6c04c3ac47780$var$WORKGROUP_SIZE = 64;
const $c8a6c04c3ac47780$var$PARTICLE_SIZE = 0.1;
const $c8a6c04c3ac47780$var$PARTICLE_COUNT = $c8a6c04c3ac47780$var$WORKGROUP_SIZE * 128;
const $c8a6c04c3ac47780$var$SPEED = 0.004;
const $c8a6c04c3ac47780$var$GRAVITY = 0.005;
const $c8a6c04c3ac47780$var$PARTICLE_INTERVAL = 5;
const $c8a6c04c3ac47780$var$DECAY_RATE = 0.004;
const $c8a6c04c3ac47780$var$ORIGIN_RADIUS = 0.2;
const $c8a6c04c3ac47780$var$ORIGIN_Y = -0.4;
const $c8a6c04c3ac47780$var$TRIANGLE_COUNT = 16;
const $c8a6c04c3ac47780$var$THETA = 2 * Math.PI / $c8a6c04c3ac47780$var$TRIANGLE_COUNT;
const $c8a6c04c3ac47780$var$VERTICES = new Float32Array($c8a6c04c3ac47780$var$TRIANGLE_COUNT * 6); // 6 for the x,y coordinates of the three points on the triangle
for(let triangleIndex = 0; triangleIndex < $c8a6c04c3ac47780$var$TRIANGLE_COUNT; triangleIndex++){
    const i = triangleIndex * 6;
    const point1 = (0, $4e939e94d233ed5b$export$eb912ff306213ab3)(1, triangleIndex * $c8a6c04c3ac47780$var$THETA);
    const point2 = (0, $4e939e94d233ed5b$export$eb912ff306213ab3)(1, (triangleIndex + 1) * $c8a6c04c3ac47780$var$THETA);
    $c8a6c04c3ac47780$var$VERTICES[i] = 0;
    $c8a6c04c3ac47780$var$VERTICES[i + 1] = 0;
    $c8a6c04c3ac47780$var$VERTICES[i + 2] = point1.x;
    $c8a6c04c3ac47780$var$VERTICES[i + 3] = point1.y;
    $c8a6c04c3ac47780$var$VERTICES[i + 4] = point2.x;
    $c8a6c04c3ac47780$var$VERTICES[i + 5] = point2.y;
}
class $c8a6c04c3ac47780$export$b9202086c45b387e extends (0, $50ad2468206126ad$export$462bb059fed9d9e5) {
    setup() {
        const particleCounter = document.getElementById("particle-count");
        if (particleCounter) particleCounter.textContent = `${Math.floor($c8a6c04c3ac47780$var$PARTICLE_COUNT / 1000)}k`;
        /*
    ┍━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┑
    │ PARTICLE SHAPE                  │
    ┕━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙
    */ this.vertexBuffer = this.device.createBuffer({
            label: "Particle Vertices",
            size: $c8a6c04c3ac47780$var$VERTICES.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(this.vertexBuffer, 0, $c8a6c04c3ac47780$var$VERTICES);
        const vertexBufferLayout = {
            arrayStride: 8,
            attributes: [
                {
                    format: "float32x2",
                    offset: 0,
                    shaderLocation: 0
                }
            ]
        };
        /*
    ┍━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┑
    │ PARTICLE DATA                   │
    ┕━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙
    */ /**
     * Particle state, stored as [
     *   position.x,
     *   position.y,
     *   velocity.x,
     *   velocity.y,
     *   lifespan
     * ]
     *
     */ const particleStates = new Float32Array($c8a6c04c3ac47780$var$PARTICLE_COUNT * $c8a6c04c3ac47780$var$PARTICLE_INTERVAL);
        for(let i = 0; i < particleStates.length; i += $c8a6c04c3ac47780$var$PARTICLE_INTERVAL){
            const position = (0, $4e939e94d233ed5b$export$c4293a6a9b6ab33a)($c8a6c04c3ac47780$var$ORIGIN_RADIUS);
            const velocity = (0, $4e939e94d233ed5b$export$c4293a6a9b6ab33a)($c8a6c04c3ac47780$var$ORIGIN_RADIUS);
            particleStates[i] = position.x;
            particleStates[i + 1] = position.y + $c8a6c04c3ac47780$var$ORIGIN_Y;
            particleStates[i + 2] = velocity.x;
            particleStates[i + 3] = velocity.y;
            particleStates[i + 4] = Math.random();
        }
        const particleStatesStorage = [
            this.device.createBuffer({
                label: "Particle State A",
                size: particleStates.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            }),
            this.device.createBuffer({
                label: "Particle State B",
                size: particleStates.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            })
        ];
        this.device.queue.writeBuffer(particleStatesStorage[0], 0, particleStates);
        const initialStatesStorage = this.device.createBuffer({
            label: "Initial Particle State",
            size: particleStates.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(initialStatesStorage, 0, particleStates);
        /*
    ┍━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┑
    │ BIND GROUPS & LAYOUTS           │
    ┕━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙
    */ const bindGroupLayout = this.device.createBindGroupLayout({
            label: "Particle Bind Group Layout",
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage"
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage"
                    }
                }
            ]
        });
        this.bindGroups = [
            this.device.createBindGroup({
                label: "Particle renderer bind group A",
                layout: bindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: particleStatesStorage[0]
                        }
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: particleStatesStorage[1]
                        }
                    },
                    {
                        binding: 2,
                        resource: {
                            buffer: initialStatesStorage
                        }
                    }
                ]
            }),
            this.device.createBindGroup({
                label: "Particle renderer bind group B",
                layout: bindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: particleStatesStorage[1]
                        }
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: particleStatesStorage[0]
                        }
                    },
                    {
                        binding: 2,
                        resource: {
                            buffer: initialStatesStorage
                        }
                    }
                ]
            })
        ];
        const pipelineLayout = this.device.createPipelineLayout({
            label: "Particle pipeline layout",
            bindGroupLayouts: [
                bindGroupLayout
            ]
        });
        /*
    ┍━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┑
    │ COMPUTE PIPELINE                │
    ┕━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙
    */ const computeShaderModule = this.device.createShaderModule({
            label: "Flame compute shader",
            code: /* wgsl */ `
        @group(0) @binding(0) var<storage> particleStatesIn: array<f32>;
        @group(0) @binding(1) var<storage, read_write> particleStatesOut: array<f32>;
        @group(0) @binding(2) var<storage> initialStates: array<f32>;

        @compute
        @workgroup_size(${$c8a6c04c3ac47780$var$WORKGROUP_SIZE})
        fn computeMain(@builtin(global_invocation_id) index: vec3u) {
          let i = index.x * ${$c8a6c04c3ac47780$var$PARTICLE_INTERVAL};
          let positionIn = vec2f(particleStatesIn[i], particleStatesIn[i+1]);
          let velocityIn = vec2f(particleStatesIn[i+2], particleStatesIn[i+3]);
          let lifespan = particleStatesIn[i+4] - ${$c8a6c04c3ac47780$var$DECAY_RATE};

          let positionOut = positionIn + velocityIn * ${$c8a6c04c3ac47780$var$SPEED};
          let velocityOut = vec2f(velocityIn.x, velocityIn.y + ${$c8a6c04c3ac47780$var$GRAVITY});

          // reset the particle
          if (lifespan < 0) {
            particleStatesOut[i] = initialStates[i];
            particleStatesOut[i+1] = initialStates[i+1];
            particleStatesOut[i+2] = initialStates[i+2];
            particleStatesOut[i+3] = initialStates[i+3];
            particleStatesOut[i+4] = 1;
          } else {
            particleStatesOut[i] = positionOut.x;
            particleStatesOut[i+1] = positionOut.y;
            particleStatesOut[i+2] = velocityOut.x;
            particleStatesOut[i+3] = velocityOut.y;
            particleStatesOut[i+4] = lifespan;
          }
        }
      `
        });
        this.computePipeline = this.device.createComputePipeline({
            label: "Flame compute pipeline",
            layout: pipelineLayout,
            compute: {
                module: computeShaderModule,
                entryPoint: "computeMain"
            }
        });
        /*
    ┍━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┑
    │ RENDER PIPELINE                 │
    ┕━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙
    */ const renderShaderModule = this.device.createShaderModule({
            label: "Flame render shader",
            code: /* wgsl */ `
        struct VertexInput {
          @location(0) pos: vec2f,
          @builtin(instance_index) instance: u32,
        };

        struct VertexOutput {
          @builtin(position) pos: vec4f,
          @location(0) lifespan: f32,
          @location(1) alpha: f32,
        };

        @group(0) @binding(0) var<storage> particleStates: array<f32>;

        // Returns a y value between 0 and 1
        fn lerp(x: f32, x1: f32, x2: f32, y1: f32, y2: f32) -> f32 {
          return y1 + (x - x1) * (y2 - y1) / (x2 - x1);
        }

        fn particleScale(lifespan: f32) -> f32 {
          let fullSizeBegin = 0.85;
          let fullSizeEnd = 0.8;

          if (lifespan > fullSizeBegin) {
            return lerp(lifespan, 1, fullSizeBegin, 0, 1);
          } else if (lifespan > fullSizeEnd) {
            return 1;
          } else {
            return lerp(lifespan, fullSizeEnd, 0, 1, 0);
          }
        }
        
        @vertex
        fn vertexMain(input: VertexInput) -> VertexOutput {
          let i = input.instance * ${$c8a6c04c3ac47780$var$PARTICLE_INTERVAL};
          let position = vec2f(particleStates[i], particleStates[i+1]);
          let lifespan = particleStates[i+4];
          let scale = particleScale(lifespan);
          let pos = (input.pos * ${$c8a6c04c3ac47780$var$PARTICLE_SIZE} * scale) + position;

          var output: VertexOutput;
          output.pos = vec4f(pos, 0, 1);
          output.lifespan = lifespan;
          if (input.pos.x == 0 && input.pos.y == 0) {
            output.alpha = scale;
          } else {
            output.alpha = 0;
          }
          return output;
        }

        @fragment
        fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
          return vec4f(0.4 + input.lifespan * 2, input.lifespan * 1.5, input.lifespan * 2 - 0.75, 1) * input.alpha; // rgba
        }
      `
        });
        this.renderPipeline = this.device.createRenderPipeline({
            label: "Flame render pipeline",
            layout: pipelineLayout,
            vertex: {
                module: renderShaderModule,
                entryPoint: "vertexMain",
                buffers: [
                    vertexBufferLayout
                ]
            },
            fragment: {
                module: renderShaderModule,
                entryPoint: "fragmentMain",
                targets: [
                    {
                        format: this.canvasFormat,
                        blend: {
                            color: {
                                srcFactor: "one",
                                dstFactor: "one-minus-src-alpha"
                            },
                            alpha: {
                                srcFactor: "one",
                                dstFactor: "one-minus-src-alpha"
                            }
                        }
                    }
                ]
            }
        });
        const backgroundShaderModule = this.device.createShaderModule({
            label: "Background render shader",
            code: /* wgsl */ `
        struct VertexOutput {
          @builtin(position) pos: vec4f,
          @location(1) alpha: f32,
        };
        
        @vertex
        fn vertexMain(@location(0) pos: vec2f) -> VertexOutput {

          var output: VertexOutput;
          output.pos = vec4f(pos.x * 2, pos.y * 2 + ${$c8a6c04c3ac47780$var$ORIGIN_Y}, 0, 1);
          if (pos.x == 0 && pos.y == 0) {
            output.alpha = 1;
          } else {
            output.alpha = 0;
          }
          return output;
        }

        @fragment
        fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
          return vec4f(1,0.8,0.8,1) * input.alpha * 0.35; // rgba
        }
      `
        });
        this.backgroundPipeline = this.device.createRenderPipeline({
            label: "Background render pipeline",
            layout: "auto",
            vertex: {
                module: backgroundShaderModule,
                entryPoint: "vertexMain",
                buffers: [
                    vertexBufferLayout
                ]
            },
            fragment: {
                module: backgroundShaderModule,
                entryPoint: "fragmentMain",
                targets: [
                    {
                        format: this.canvasFormat,
                        blend: {
                            color: {
                                srcFactor: "one",
                                dstFactor: "one-minus-src-alpha"
                            },
                            alpha: {
                                srcFactor: "one",
                                dstFactor: "one-minus-src-alpha"
                            }
                        }
                    }
                ]
            }
        });
    }
    update() {
        const encoder = this.device.createCommandEncoder();
        // Start a compute pass
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, this.bindGroups[this.step % 2]);
        const workgroupCount = Math.ceil($c8a6c04c3ac47780$var$PARTICLE_COUNT / $c8a6c04c3ac47780$var$WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();
        this.step++;
        // Start a render pass
        const pass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    loadOp: "clear",
                    clearValue: {
                        r: 0,
                        g: 0,
                        b: 0.15,
                        a: 1
                    },
                    storeOp: "store"
                }
            ]
        });
        pass.setPipeline(this.backgroundPipeline);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw($c8a6c04c3ac47780$var$VERTICES.length / 2);
        pass.setPipeline(this.renderPipeline);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setBindGroup(0, this.bindGroups[this.step % 2]);
        pass.draw($c8a6c04c3ac47780$var$VERTICES.length / 2, $c8a6c04c3ac47780$var$PARTICLE_COUNT);
        pass.end();
        // Finish the command buffer and immediately submit it.
        this.device.queue.submit([
            encoder.finish()
        ]);
    }
    constructor(...args){
        super(...args);
        this.frameLength = 0;
    }
}


const $35d6c5b58b8fcd66$var$canvas = document.querySelector("canvas");
new (0, $c8a6c04c3ac47780$export$b9202086c45b387e)($35d6c5b58b8fcd66$var$canvas);


//# sourceMappingURL=index.d5edbc8f.js.map