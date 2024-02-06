import { Shader } from './Shader';

const WORKGROUP_SIZE = 64;
const PARTICLE_SIZE = 0.03;
const PARTICLE_COUNT = WORKGROUP_SIZE * 512;
console.log(`${Math.floor(PARTICLE_COUNT / 1000)}k particles`);
const PARTICLE_WIDTH = 0.6;
const PARTICLE_CENTER_Y = -0.4;
const SPEED = 0.004;
const GRAVITY = 0.005;
const PARTICLE_INTERVAL = 5;
const DECAY_RATE = 0.004;
const ORIGIN_RADIUS = 0.2;
const ORIGIN_Y = -0.4;

const VERTICES = new Float32Array([
  // Triangle 1 [ x,y, x,y, ...]
  -PARTICLE_WIDTH,
  PARTICLE_CENTER_Y,
  0,
  -1,
  PARTICLE_WIDTH,
  PARTICLE_CENTER_Y,
  // Triangle 2 [ x,y, x,y, ...]
  -PARTICLE_WIDTH,
  PARTICLE_CENTER_Y,
  PARTICLE_WIDTH,
  PARTICLE_CENTER_Y,
  0,
  1,
]);

export class FlameShader extends Shader {
  vertexBuffer!: GPUBuffer;
  renderPipeline!: GPURenderPipeline;
  computePipeline!: GPUComputePipeline;
  bindGroups!: GPUBindGroup[];
  shouldRequestAnimationFrame = true;

  avgDeltaT = 0;
  step = 0;

  setup() {
    /*
    ┍━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┑
    │ PARTICLE SHAPE                  │
    ┕━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙
    */
    this.vertexBuffer = this.device.createBuffer({
      label: 'Particle Vertices',
      size: VERTICES.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(this.vertexBuffer, 0, VERTICES);

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

    /*
    ┍━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┑
    │ PARTICLE DATA                   │
    ┕━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙
    */

    /**
     * Particle state, stored as [
     *   position.x,
     *   position.y,
     *   velocity.x,
     *   velocity.y,
     *   lifespan
     * ]
     *
     */
    const particleStates = new Float32Array(PARTICLE_COUNT * PARTICLE_INTERVAL);

    const randomVector = () => {
      const radius = Math.sqrt(Math.random()) * ORIGIN_RADIUS;
      const angle = Math.random() * 2 * Math.PI;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      return { x, y };
    };

    for (let i = 0; i < particleStates.length; i += PARTICLE_INTERVAL) {
      const position = randomVector();
      const velocity = randomVector();

      particleStates[i] = position.x;
      particleStates[i + 1] = position.y + ORIGIN_Y;
      particleStates[i + 2] = velocity.x;
      particleStates[i + 3] = velocity.y;
      particleStates[i + 4] = Math.random();
    }

    const particleStatesStorage = [
      this.device.createBuffer({
        label: 'Particle State A',
        size: particleStates.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      }),
      this.device.createBuffer({
        label: 'Particle State B',
        size: particleStates.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      }),
    ];

    this.device.queue.writeBuffer(particleStatesStorage[0], 0, particleStates);

    const initialStatesStorage = this.device.createBuffer({
      label: 'Initial Particle State',
      size: particleStates.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(initialStatesStorage, 0, particleStates);

    /*
    ┍━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┑
    │ BIND GROUPS & LAYOUTS           │
    ┕━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙
    */
    const bindGroupLayout = this.device.createBindGroupLayout({
      label: 'Particle Bind Group Layout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' }, // Particle state input buffer
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'storage' }, // Particle state output buffer
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' }, // Uniform buffer
        },
      ],
    });

    this.bindGroups = [
      this.device.createBindGroup({
        label: 'Particle renderer bind group A',
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: { buffer: particleStatesStorage[0] },
          },
          {
            binding: 1,
            resource: { buffer: particleStatesStorage[1] },
          },
          {
            binding: 2,
            resource: { buffer: initialStatesStorage },
          },
        ],
      }),
      this.device.createBindGroup({
        label: 'Particle renderer bind group B',
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: { buffer: particleStatesStorage[1] },
          },
          {
            binding: 1,
            resource: { buffer: particleStatesStorage[0] },
          },
          {
            binding: 2,
            resource: { buffer: initialStatesStorage },
          },
        ],
      }),
    ];

    const pipelineLayout = this.device.createPipelineLayout({
      label: 'Particle pipeline layout',
      bindGroupLayouts: [bindGroupLayout],
    });

    /*
    ┍━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┑
    │ COMPUTE PIPELINE                │
    ┕━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙
    */
    const computeShaderModule = this.device.createShaderModule({
      label: 'Flame compute shader',
      code: /* wgsl */ `
        @group(0) @binding(0) var<storage> particleStatesIn: array<f32>;
        @group(0) @binding(1) var<storage, read_write> particleStatesOut: array<f32>;
        @group(0) @binding(2) var<storage> initialStates: array<f32>;

        @compute
        @workgroup_size(${WORKGROUP_SIZE})
        fn computeMain(@builtin(global_invocation_id) index: vec3u) {
          let i = index.x * ${PARTICLE_INTERVAL};
          let positionIn = vec2f(particleStatesIn[i], particleStatesIn[i+1]);
          let velocityIn = vec2f(particleStatesIn[i+2], particleStatesIn[i+3]);
          let lifespan = particleStatesIn[i+4] - ${DECAY_RATE};

          let positionOut = positionIn + velocityIn * ${SPEED};
          let velocityOut = vec2f(velocityIn.x, velocityIn.y + ${GRAVITY});

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
      `,
    });

    this.computePipeline = this.device.createComputePipeline({
      label: 'Flame compute pipeline',
      layout: pipelineLayout,
      compute: {
        module: computeShaderModule,
        entryPoint: 'computeMain',
      },
    });

    /*
    ┍━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┑
    │ RENDER PIPELINE                 │
    ┕━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙
    */
    const renderShaderModule = this.device.createShaderModule({
      label: 'Flame render shader',
      code: /* wgsl */ `
        struct VertexInput {
          @location(0) pos: vec2f,
          @builtin(instance_index) instance: u32,
        };

        struct VertexOutput {
          @builtin(position) pos: vec4f,
          @location(0) lifespan: f32,
          // @location(0) cell: vec2f,
        };

        @group(0) @binding(0) var<storage> particleStates: array<f32>;

        // Returns a y value between 0 and 1
        fn lerp(x: f32, x1: f32, x2: f32, y1: f32, y2: f32) -> f32 {
          return y1 + (x - x1) * (y2 - y1) / (x2 - x1);
        }

        fn particleScale(lifespan: f32) -> f32 {
          let fullSizeBegin = 0.9;
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
          let i = input.instance * ${PARTICLE_INTERVAL};
          let position = vec2f(particleStates[i], particleStates[i+1]);
          let lifespan = particleStates[i+4];
          let scale = particleScale(lifespan);
          let pos = (input.pos * ${PARTICLE_SIZE} * scale) + position;

          var output: VertexOutput;
          output.pos = vec4f(pos, 0, 1);
          output.lifespan = lifespan;
          return output;
        }

        @fragment
        fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
          return vec4f(1, input.lifespan, input.lifespan * 2 - 1, 0.2); // rgba
        }
      `,
    });

    this.renderPipeline = this.device.createRenderPipeline({
      label: 'Flame render pipeline',
      layout: pipelineLayout,
      vertex: {
        module: renderShaderModule,
        entryPoint: 'vertexMain',
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: renderShaderModule,
        entryPoint: 'fragmentMain',
        targets: [
          {
            format: this.canvasFormat,
            blend: {
              color: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
              },
            },
          },
        ],
      },
    });
  }

  update(deltaT?: number) {
    if (deltaT) {
      this.avgDeltaT = (this.avgDeltaT * this.step + deltaT) / (this.step + 1);
      if (this.step % 60 === 0) console.log(`${Math.floor(1000 / this.avgDeltaT)} FPS`);
    }
    const encoder = this.device.createCommandEncoder();

    // Start a compute pass
    const computePass = encoder.beginComputePass();

    computePass.setPipeline(this.computePipeline);
    computePass.setBindGroup(0, this.bindGroups[this.step % 2]);

    const workgroupCount = Math.ceil(PARTICLE_COUNT / WORKGROUP_SIZE);
    computePass.dispatchWorkgroups(workgroupCount, workgroupCount);

    computePass.end();

    this.step++;

    // Start a render pass
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          loadOp: 'clear',
          clearValue: { r: 0.2, g: 0.2, b: 0.3, a: 1 },
          storeOp: 'store',
        },
      ],
    });

    pass.setPipeline(this.renderPipeline);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setBindGroup(0, this.bindGroups[this.step % 2]);
    pass.draw(VERTICES.length / 2, PARTICLE_COUNT);

    pass.end();

    // Finish the command buffer and immediately submit it.
    this.device.queue.submit([encoder.finish()]);
  }
}
