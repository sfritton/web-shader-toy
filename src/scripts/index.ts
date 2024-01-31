/// <reference types="@webgpu/types" />

/** Both height and width */
const GRID_SIZE = 32;
const UPDATE_INTERVAL = 200; // Update every 200ms (5 times/sec)
let step = 0; // Track how many simulation steps have been run
const WORKGROUP_SIZE = 8;

async function init() {
  /*
   ┍━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┑
   │ 0. CANVAS & DEVICE SETUP        │
   ┕━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙
   */
  if (!navigator.gpu) throw Error('WebGPU not supported');

  const adapter = await navigator.gpu.requestAdapter();

  if (!adapter) throw Error("Couldn't request WebGPU adapter");

  const canvas = document.querySelector<HTMLCanvasElement>('canvas.cave-generator');

  if (!canvas) throw Error("Couldn't find the canvas");

  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');

  if (!context) throw Error("Couldn't get canvas context");

  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format: canvasFormat });

  /*
   ┍━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┑
   │ 1. DRAW A SQUARE                │
   ┕━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙
   */
  const vertices = new Float32Array([
    // Triangle 1 [ x,y, x,y, ...]
    -0.8, -0.8, 0.8, -0.8, 0.8, 0.8,
    // Triangle 2 [ x,y, x,y, ...]
    -0.8, -0.8, 0.8, 0.8, -0.8, 0.8,
  ]);

  const vertexBuffer = device.createBuffer({
    label: 'Cell vertices',
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/ 0, vertices);

  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 8,
    attributes: [
      {
        format: 'float32x2',
        offset: 0,
        shaderLocation: 0, // Position, see vertex shader
      },
    ],
  };

  const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
  const uniformBuffer = device.createBuffer({
    label: 'Grid Uniforms',
    size: uniformArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

  const cellStateArray = new Uint32Array(GRID_SIZE * GRID_SIZE);

  const cellStateStorage = [
    device.createBuffer({
      label: 'Cell State A',
      size: cellStateArray.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
    device.createBuffer({
      label: 'Cell State B',
      size: cellStateArray.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
  ];

  // Set each cell to a random state
  for (let i = 0; i < cellStateArray.length; i++) {
    cellStateArray[i] = Math.random() > 0.6 ? 1 : 0;
  }
  device.queue.writeBuffer(cellStateStorage[0], 0, cellStateArray);

  const cellShaderModule = device.createShaderModule({
    label: 'Cell shader',
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
    `,
  });

  const simulationShaderModule = device.createShaderModule({
    label: 'Game of Life simulation shader',
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
      @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
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
    `,
  });

  const bindGruopLayout = device.createBindGroupLayout({
    label: 'Cell Bind Group Layout',
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
        buffer: {}, // Grid uniform buffer
      },
      {
        binding: 1,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
        buffer: { type: 'read-only-storage' }, // Cell state input buffer
      },
      {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: 'storage' }, // Cell state output buffer
      },
    ],
  });

  const bindGroups = [
    device.createBindGroup({
      label: 'Cell renderer bind group A',
      layout: bindGruopLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: uniformBuffer },
        },
        {
          binding: 1,
          resource: { buffer: cellStateStorage[0] },
        },
        {
          binding: 2,
          resource: { buffer: cellStateStorage[1] },
        },
      ],
    }),
    device.createBindGroup({
      label: 'Cell renderer bind group B',
      layout: bindGruopLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: uniformBuffer },
        },
        {
          binding: 1,
          resource: { buffer: cellStateStorage[1] },
        },
        {
          binding: 2,
          resource: { buffer: cellStateStorage[0] },
        },
      ],
    }),
  ];

  const pipelineLayout = device.createPipelineLayout({
    label: 'Cell Pipeline Layout',
    bindGroupLayouts: [bindGruopLayout],
  });

  const cellPipeline = device.createRenderPipeline({
    label: 'Cell pipeline',
    layout: pipelineLayout,
    vertex: {
      module: cellShaderModule,
      entryPoint: 'vertexMain',
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: cellShaderModule,
      entryPoint: 'fragmentMain',
      targets: [{ format: canvasFormat }],
    },
  });

  const simulationPipeline = device.createComputePipeline({
    label: 'Simulation pipeline',
    layout: pipelineLayout,
    compute: {
      module: simulationShaderModule,
      entryPoint: 'computeMain',
    },
  });

  function updateGrid() {
    if (!context) return;

    const encoder = device.createCommandEncoder();

    // Start a compute pass
    const computePass = encoder.beginComputePass();

    computePass.setPipeline(simulationPipeline);
    computePass.setBindGroup(0, bindGroups[step % 2]);

    const workgroupCount = Math.ceil(GRID_SIZE / WORKGROUP_SIZE);
    computePass.dispatchWorkgroups(workgroupCount, workgroupCount);

    computePass.end();

    step++;

    // Start a render pass
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadOp: 'clear',
          clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
          storeOp: 'store',
        },
      ],
    });

    // Draw the grid
    pass.setPipeline(cellPipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setBindGroup(0, bindGroups[step % 2]);
    pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);

    pass.end();

    // Finish the command buffer and immediately submit it.
    device.queue.submit([encoder.finish()]);
  }

  setInterval(updateGrid, UPDATE_INTERVAL);
}

init();
