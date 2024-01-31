class $50ad2468206126ad$export$462bb059fed9d9e5 {
    // Make sure WebGPU is supported, set up the device and the canvas
    async init(canvas) {
        var _this__context;
        if (!navigator.gpu) throw Error("WebGPU not supported");
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw Error("Couldn't request WebGPU adapter");
        if (!canvas) throw Error("Couldn't find the canvas");
        this.device = await adapter.requestDevice();
        this._context = canvas.getContext("webgpu");
        this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        (_this__context = this._context) === null || _this__context === void 0 ? void 0 : _this__context.configure({
            device: this.device,
            format: this.canvasFormat
        });
    }
    get context() {
        if (!this._context) throw Error("Couldn't get canvas context");
        return this._context;
    }
    constructor(canvas){
        this._context = null;
        this.updateInterval = 200;
        this.init(canvas).then(()=>{
            this.setup();
            setInterval(()=>this.update(), this.updateInterval);
        });
    }
}


/** Both height and width */ const $46a133c61b15254b$var$GRID_SIZE = 32;
let $46a133c61b15254b$var$step = 0; // Track how many simulation steps have been run
const $46a133c61b15254b$var$WORKGROUP_SIZE = 8;
const $46a133c61b15254b$var$VERTICES = new Float32Array([
    // Triangle 1 [ x,y, x,y, ...]
    -0.8,
    -0.8,
    0.8,
    -0.8,
    0.8,
    0.8,
    // Triangle 2 [ x,y, x,y, ...]
    -0.8,
    -0.8,
    0.8,
    0.8,
    -0.8,
    0.8
]);
class $46a133c61b15254b$export$e1479da10f642a9 extends (0, $50ad2468206126ad$export$462bb059fed9d9e5) {
    setup() {
        this.vertexBuffer = this.device.createBuffer({
            label: "Cell Vertices",
            size: $46a133c61b15254b$var$VERTICES.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(this.vertexBuffer, 0, $46a133c61b15254b$var$VERTICES);
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
        const uniformArray = new Float32Array([
            $46a133c61b15254b$var$GRID_SIZE,
            $46a133c61b15254b$var$GRID_SIZE
        ]);
        const uniformBuffer = this.device.createBuffer({
            label: "Grid Uniforms",
            size: uniformArray.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(uniformBuffer, 0, uniformArray);
        const cellStateArray = new Uint32Array($46a133c61b15254b$var$GRID_SIZE * $46a133c61b15254b$var$GRID_SIZE);
        const cellStateStorage = [
            this.device.createBuffer({
                label: "Cell State A",
                size: cellStateArray.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            }),
            this.device.createBuffer({
                label: "Cell State B",
                size: cellStateArray.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            })
        ];
        // Set each cell to a random state
        for(let i = 0; i < cellStateArray.length; i++)cellStateArray[i] = Math.random() > 0.6 ? 1 : 0;
        this.device.queue.writeBuffer(cellStateStorage[0], 0, cellStateArray);
        const cellShaderModule = this.device.createShaderModule({
            label: "Cell shader",
            code: /*wgsl*/ `
        struct VertexInput {
          @location(0) pos: vec2f,
          @builtin(instance_index) instance: u32,
        };

        struct VertexOutput {
          @builtin(position) pos: vec4f,
          @location(0) cell: vec2f,
        };

        @group(0) @binding(0) var<uniform> grid: vec2f;
        @group(0) @binding(1) var<storage> cellState: array<u32>;

        @vertex
        fn vertexMain(input: VertexInput) -> VertexOutput {
          // Compute cell coordinates from index
          let i = f32(input.instance);
          let cell = vec2f(i % grid.x, floor(i / grid.x));
          let state = f32(cellState[input.instance]);

          // Determine cell position
          let cellOffset = cell / grid * 2;
          let gridPos = (input.pos*state + 1) / grid - 1 + cellOffset;

          var output: VertexOutput;
          output.pos = vec4f(gridPos, 0, 1);
          output.cell = cell / grid;

          return output;
        }

        @fragment
        fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
          return vec4f(input.cell, 1 - input.cell.x, 1); // (Red, Green, Blue, Alpha)
        }
      `
        });
        const simulationShaderModule = this.device.createShaderModule({
            label: "Game of Life simulation shader",
            code: /* wgsl */ `
        @group(0) @binding(0) var<uniform> grid: vec2f; // New line

        @group(0) @binding(1) var<storage> cellStateIn: array<u32>;
        @group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

        fn cellIndex(cell: vec2u) -> u32 {
          return (cell.y % u32(grid.y)) * u32(grid.x) + (cell.x % u32(grid.x));
        }

        fn cellActive(x: u32, y: u32) -> u32 {
          return cellStateIn[cellIndex(vec2(x, y))];
        }

        @compute
        @workgroup_size(${$46a133c61b15254b$var$WORKGROUP_SIZE}, ${$46a133c61b15254b$var$WORKGROUP_SIZE})
        fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
          let activeNeighbors = cellActive(cell.x+1, cell.y+1) +
                                cellActive(cell.x+1, cell.y) +
                                cellActive(cell.x+1, cell.y-1) +
                                cellActive(cell.x, cell.y-1) +
                                cellActive(cell.x-1, cell.y-1) +
                                cellActive(cell.x-1, cell.y) +
                                cellActive(cell.x-1, cell.y+1) +
                                cellActive(cell.x, cell.y+1);

          let i = cellIndex(cell.xy);

          // Conway's game of life rules:
          switch activeNeighbors {
            case 2: { // Active cells with 2 neighbors stay active.
              cellStateOut[i] = cellStateIn[i];
            }
            case 3: { // Cells with 3 neighbors become or stay active.
              cellStateOut[i] = 1;
            }
            default: { // Cells with < 2 or > 3 neighbors become inactive.
              cellStateOut[i] = 0;
            }
          }
        }
      `
        });
        const bindGroupLayout = this.device.createBindGroupLayout({
            label: "Cell Bind Group Layout",
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
                    buffer: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage"
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage"
                    }
                }
            ]
        });
        this.bindGroups = [
            this.device.createBindGroup({
                label: "Cell renderer bind group A",
                layout: bindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: uniformBuffer
                        }
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: cellStateStorage[0]
                        }
                    },
                    {
                        binding: 2,
                        resource: {
                            buffer: cellStateStorage[1]
                        }
                    }
                ]
            }),
            this.device.createBindGroup({
                label: "Cell renderer bind group B",
                layout: bindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: uniformBuffer
                        }
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: cellStateStorage[1]
                        }
                    },
                    {
                        binding: 2,
                        resource: {
                            buffer: cellStateStorage[0]
                        }
                    }
                ]
            })
        ];
        const pipelineLayout = this.device.createPipelineLayout({
            label: "Cell Pipeline Layout",
            bindGroupLayouts: [
                bindGroupLayout
            ]
        });
        this.cellPipeline = this.device.createRenderPipeline({
            label: "Cell pipeline",
            layout: pipelineLayout,
            vertex: {
                module: cellShaderModule,
                entryPoint: "vertexMain",
                buffers: [
                    vertexBufferLayout
                ]
            },
            fragment: {
                module: cellShaderModule,
                entryPoint: "fragmentMain",
                targets: [
                    {
                        format: this.canvasFormat
                    }
                ]
            }
        });
        this.simulationPipeline = this.device.createComputePipeline({
            label: "Simulation pipeline",
            layout: pipelineLayout,
            compute: {
                module: simulationShaderModule,
                entryPoint: "computeMain"
            }
        });
    }
    update() {
        const encoder = this.device.createCommandEncoder();
        // Start a compute pass
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.simulationPipeline);
        computePass.setBindGroup(0, this.bindGroups[$46a133c61b15254b$var$step % 2]);
        const workgroupCount = Math.ceil($46a133c61b15254b$var$GRID_SIZE / $46a133c61b15254b$var$WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();
        $46a133c61b15254b$var$step++;
        // Start a render pass
        const pass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    loadOp: "clear",
                    clearValue: {
                        r: 0,
                        g: 0,
                        b: 0.4,
                        a: 1
                    },
                    storeOp: "store"
                }
            ]
        });
        // Draw the grid
        pass.setPipeline(this.cellPipeline);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setBindGroup(0, this.bindGroups[$46a133c61b15254b$var$step % 2]);
        pass.draw($46a133c61b15254b$var$VERTICES.length / 2, $46a133c61b15254b$var$GRID_SIZE * $46a133c61b15254b$var$GRID_SIZE);
        pass.end();
        // Finish the command buffer and immediately submit it.
        this.device.queue.submit([
            encoder.finish()
        ]);
    }
}


const $35d6c5b58b8fcd66$var$canvas = document.querySelector("canvas");
new (0, $46a133c61b15254b$export$e1479da10f642a9)($35d6c5b58b8fcd66$var$canvas);


//# sourceMappingURL=index.2bfb6de1.js.map
