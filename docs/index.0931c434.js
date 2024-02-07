
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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
        const params = new URLSearchParams(window.location.search);
        const shouldShowStats = params.has("stats", "true");
        const fpsElement = document.getElementById("fps");
        if (!fpsElement || this.avgDeltaT <= 0 || !shouldShowStats) return;
        fpsElement.textContent = `${Math.floor(1000 / this.avgDeltaT)} FPS`;
    }
    update(deltaT) {
        const encoder = this.device.createCommandEncoder();
        this.updateCompute(encoder, deltaT);
        this.step++;
        this.updateRender(encoder, deltaT);
        // Finish the command buffer and immediately submit it.
        this.device.queue.submit([
            encoder.finish()
        ]);
    }
    constructor(canvas){
        this._context = undefined;
        this._canvas = undefined;
        /** Milliseconds between frames. Set to 0 for maximum FPS. */ this.frameLength = 200;
        this.prevMS = undefined;
        this.avgDeltaT = 0;
        /** The current step of the animation. */ this.step = 0;
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


const $a208a15eab1643c4$export$eb912ff306213ab3 = (radius, angle)=>{
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    return {
        x: x,
        y: y
    };
};
const $a208a15eab1643c4$export$c4293a6a9b6ab33a = (radius)=>{
    const r = Math.sqrt(Math.random()) * radius;
    const angle = Math.random() * 2 * Math.PI;
    return $a208a15eab1643c4$export$eb912ff306213ab3(r, angle);
};


var $1ba33acf88ea8827$exports = {};

$parcel$export($1ba33acf88ea8827$exports, "WORKGROUP_SIZE", function () { return $1ba33acf88ea8827$export$fb78680ee3bd0d21; });
$parcel$export($1ba33acf88ea8827$exports, "PARTICLE_SIZE", function () { return $1ba33acf88ea8827$export$66983b8483285905; });
$parcel$export($1ba33acf88ea8827$exports, "PARTICLE_COUNT", function () { return $1ba33acf88ea8827$export$ffc0241869fe445; });
$parcel$export($1ba33acf88ea8827$exports, "SPEED", function () { return $1ba33acf88ea8827$export$cc060c12b7723909; });
$parcel$export($1ba33acf88ea8827$exports, "GRAVITY", function () { return $1ba33acf88ea8827$export$9c83558f29ac851e; });
$parcel$export($1ba33acf88ea8827$exports, "PARTICLE_INTERVAL", function () { return $1ba33acf88ea8827$export$9065f2e29538d195; });
$parcel$export($1ba33acf88ea8827$exports, "DECAY_RATE", function () { return $1ba33acf88ea8827$export$f8d487931b715cc9; });
$parcel$export($1ba33acf88ea8827$exports, "ORIGIN_RADIUS", function () { return $1ba33acf88ea8827$export$ff0d559910d80bb9; });
$parcel$export($1ba33acf88ea8827$exports, "ORIGIN_Y", function () { return $1ba33acf88ea8827$export$28b92f9a30b92e0b; });
const $1ba33acf88ea8827$export$fb78680ee3bd0d21 = 64;
const $1ba33acf88ea8827$export$66983b8483285905 = 0.1;
const $1ba33acf88ea8827$export$ffc0241869fe445 = $1ba33acf88ea8827$export$fb78680ee3bd0d21 * 128;
const $1ba33acf88ea8827$export$cc060c12b7723909 = 0.004;
const $1ba33acf88ea8827$export$9c83558f29ac851e = 0.005;
const $1ba33acf88ea8827$export$9065f2e29538d195 = 5;
const $1ba33acf88ea8827$export$f8d487931b715cc9 = 0.004;
const $1ba33acf88ea8827$export$ff0d559910d80bb9 = 0.2;
const $1ba33acf88ea8827$export$28b92f9a30b92e0b = -0.4;



var $1c923f75c1506daf$exports = {};
$1c923f75c1506daf$exports = "struct VertexInput {\n  @location(0) pos: vec2f,\n  @builtin(instance_index) instance: u32,\n};\n\nstruct VertexOutput {\n  @builtin(position) pos: vec4f,\n  @location(0) lifespan: f32,\n  @location(1) alpha: f32,\n};\n\n@group(0) @binding(0) var<storage> particleStates: array<f32>;\n\n// Returns a y value between 0 and 1\nfn lerp(x: f32, x1: f32, x2: f32, y1: f32, y2: f32) -> f32 {\n  return y1 + (x - x1) * (y2 - y1) / (x2 - x1);\n}\n\nfn particleScale(lifespan: f32) -> f32 {\n  let fullSizeBegin = 0.85;\n  let fullSizeEnd = 0.8;\n\n  if (lifespan > fullSizeBegin) {\n    return lerp(lifespan, 1, fullSizeBegin, 0, 1);\n  } else if (lifespan > fullSizeEnd) {\n    return 1;\n  } else {\n    return lerp(lifespan, fullSizeEnd, 0, 1, 0);\n  }\n}\n\n@vertex\nfn vertexMain(input: VertexInput) -> VertexOutput {\n  let i = input.instance * ${PARTICLE_INTERVAL};\n  let position = vec2f(particleStates[i], particleStates[i+1]);\n  let lifespan = particleStates[i+4];\n  let scale = particleScale(lifespan);\n  let pos = (input.pos * ${PARTICLE_SIZE} * scale) + position;\n\n  var output: VertexOutput;\n  output.pos = vec4f(pos, 0, 1);\n  output.lifespan = lifespan;\n  if (input.pos.x == 0 && input.pos.y == 0) {\n    output.alpha = scale;\n  } else {\n    output.alpha = 0;\n  }\n  return output;\n}\n\n@fragment\nfn fragmentMain(input: VertexOutput) -> @location(0) vec4f {\n  return vec4f(0.4 + input.lifespan * 2, input.lifespan * 1.5, input.lifespan * 2 - 0.75, 1) * input.alpha; // rgba\n}";


var $45af1b9190be3989$exports = {};
$45af1b9190be3989$exports = "@group(0) @binding(0) var<storage> particleStatesIn: array<f32>;\n@group(0) @binding(1) var<storage, read_write> particleStatesOut: array<f32>;\n@group(0) @binding(2) var<storage> initialStates: array<f32>;\n\n@compute\n@workgroup_size(${WORKGROUP_SIZE})\nfn computeMain(@builtin(global_invocation_id) index: vec3u) {\n  let i = index.x * ${PARTICLE_INTERVAL};\n  let positionIn = vec2f(particleStatesIn[i], particleStatesIn[i+1]);\n  let velocityIn = vec2f(particleStatesIn[i+2], particleStatesIn[i+3]);\n  let lifespan = particleStatesIn[i+4] - ${DECAY_RATE};\n\n  let positionOut = positionIn + velocityIn * ${SPEED};\n  let velocityOut = vec2f(velocityIn.x, velocityIn.y + ${GRAVITY});\n\n  // reset the particle\n  if (lifespan < 0) {\n    particleStatesOut[i] = initialStates[i];\n    particleStatesOut[i+1] = initialStates[i+1];\n    particleStatesOut[i+2] = initialStates[i+2];\n    particleStatesOut[i+3] = initialStates[i+3];\n    particleStatesOut[i+4] = 1;\n  } else {\n    particleStatesOut[i] = positionOut.x;\n    particleStatesOut[i+1] = positionOut.y;\n    particleStatesOut[i+2] = velocityOut.x;\n    particleStatesOut[i+3] = velocityOut.y;\n    particleStatesOut[i+4] = lifespan;\n  }\n}";


var $e763cc0f2c34ff9e$exports = {};
$e763cc0f2c34ff9e$exports = "struct VertexOutput {\n  @builtin(position) pos: vec4f,\n  @location(1) alpha: f32,\n};\n\n@vertex\nfn vertexMain(@location(0) pos: vec2f) -> VertexOutput {\n\n  var output: VertexOutput;\n  output.pos = vec4f(pos.x * 2, pos.y * 2 + ${ORIGIN_Y}, 0, 1);\n  if (pos.x == 0 && pos.y == 0) {\n    output.alpha = 1;\n  } else {\n    output.alpha = 0;\n  }\n  return output;\n}\n\n@fragment\nfn fragmentMain(input: VertexOutput) -> @location(0) vec4f {\n  return vec4f(1,0.8,0.8,1) * input.alpha * 0.35; // rgba\n}";


const $411d9a320534a5da$var$withConstants = (shader)=>shader.replace(/\$\{([A-Z_]+)\}/g, (_, variableName)=>$1ba33acf88ea8827$exports[variableName]);
const $411d9a320534a5da$export$d495e82be185645c = $411d9a320534a5da$var$withConstants((0, (/*@__PURE__*/$parcel$interopDefault($1c923f75c1506daf$exports))));
const $411d9a320534a5da$export$efec088117b02065 = $411d9a320534a5da$var$withConstants((0, (/*@__PURE__*/$parcel$interopDefault($45af1b9190be3989$exports))));
const $411d9a320534a5da$export$ae8a6f9c9c107e7d = $411d9a320534a5da$var$withConstants((0, (/*@__PURE__*/$parcel$interopDefault($e763cc0f2c34ff9e$exports))));


const $826c8f98e2b7c15f$var$TRIANGLE_COUNT = 16;
const $826c8f98e2b7c15f$var$THETA = 2 * Math.PI / $826c8f98e2b7c15f$var$TRIANGLE_COUNT;
const $826c8f98e2b7c15f$var$VERTICES = new Float32Array($826c8f98e2b7c15f$var$TRIANGLE_COUNT * 6); // 6 for the x,y coordinates of the three points on the triangle
for(let triangleIndex = 0; triangleIndex < $826c8f98e2b7c15f$var$TRIANGLE_COUNT; triangleIndex++){
    const i = triangleIndex * 6;
    const point1 = (0, $a208a15eab1643c4$export$eb912ff306213ab3)(1, triangleIndex * $826c8f98e2b7c15f$var$THETA);
    const point2 = (0, $a208a15eab1643c4$export$eb912ff306213ab3)(1, (triangleIndex + 1) * $826c8f98e2b7c15f$var$THETA);
    $826c8f98e2b7c15f$var$VERTICES[i] = 0;
    $826c8f98e2b7c15f$var$VERTICES[i + 1] = 0;
    $826c8f98e2b7c15f$var$VERTICES[i + 2] = point1.x;
    $826c8f98e2b7c15f$var$VERTICES[i + 3] = point1.y;
    $826c8f98e2b7c15f$var$VERTICES[i + 4] = point2.x;
    $826c8f98e2b7c15f$var$VERTICES[i + 5] = point2.y;
}
class $826c8f98e2b7c15f$export$b9202086c45b387e extends (0, $50ad2468206126ad$export$462bb059fed9d9e5) {
    setup() {
        const particleCounter = document.getElementById("particle-count");
        if (particleCounter) particleCounter.textContent = `${Math.floor((0, $1ba33acf88ea8827$export$ffc0241869fe445) / 1000)},000`;
        /*
    ┍━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┑
    │ PARTICLE SHAPE                  │
    ┕━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙
    */ this.vertexBuffer = this.device.createBuffer({
            label: "Particle Vertices",
            size: $826c8f98e2b7c15f$var$VERTICES.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(this.vertexBuffer, 0, $826c8f98e2b7c15f$var$VERTICES);
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
     */ const particleStates = new Float32Array((0, $1ba33acf88ea8827$export$ffc0241869fe445) * (0, $1ba33acf88ea8827$export$9065f2e29538d195));
        for(let i = 0; i < particleStates.length; i += (0, $1ba33acf88ea8827$export$9065f2e29538d195)){
            const position = (0, $a208a15eab1643c4$export$c4293a6a9b6ab33a)((0, $1ba33acf88ea8827$export$ff0d559910d80bb9));
            const velocity = (0, $a208a15eab1643c4$export$c4293a6a9b6ab33a)((0, $1ba33acf88ea8827$export$ff0d559910d80bb9));
            particleStates[i] = position.x;
            particleStates[i + 1] = position.y + (0, $1ba33acf88ea8827$export$28b92f9a30b92e0b);
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
            code: (0, $411d9a320534a5da$export$efec088117b02065)
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
            code: (0, $411d9a320534a5da$export$d495e82be185645c)
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
            code: (0, $411d9a320534a5da$export$ae8a6f9c9c107e7d)
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
    updateCompute(encoder) {
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, this.bindGroups[this.step % 2]);
        const workgroupCount = Math.ceil((0, $1ba33acf88ea8827$export$ffc0241869fe445) / (0, $1ba33acf88ea8827$export$fb78680ee3bd0d21));
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();
    }
    updateRender(encoder) {
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
        pass.draw($826c8f98e2b7c15f$var$VERTICES.length / 2);
        pass.setPipeline(this.renderPipeline);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setBindGroup(0, this.bindGroups[this.step % 2]);
        pass.draw($826c8f98e2b7c15f$var$VERTICES.length / 2, (0, $1ba33acf88ea8827$export$ffc0241869fe445));
        pass.end();
    }
    constructor(...args){
        super(...args);
        this.frameLength = 0;
    }
}


const $35d6c5b58b8fcd66$var$canvas = document.querySelector("canvas");
new (0, $826c8f98e2b7c15f$export$b9202086c45b387e)($35d6c5b58b8fcd66$var$canvas);


//# sourceMappingURL=index.0931c434.js.map
