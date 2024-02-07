import { Shader } from '../Shader';
import { pointOnCircle, randomVector } from './util';
import {
  WORKGROUP_SIZE,
  PARTICLE_COUNT,
  PARTICLE_INTERVAL,
  ORIGIN_RADIUS,
  ORIGIN_Y,
} from './constants';

import {
  computeParticlesShader,
  renderBackgroundShader,
  renderParticlesShader,
} from './shaders/index';

const TRIANGLE_COUNT = 16;
const THETA = (2 * Math.PI) / TRIANGLE_COUNT;
const VERTICES = new Float32Array(TRIANGLE_COUNT * 6); // 6 for the x,y coordinates of the three points on the triangle

for (let triangleIndex = 0; triangleIndex < TRIANGLE_COUNT; triangleIndex++) {
  const i = triangleIndex * 6;
  const point1 = pointOnCircle(1, triangleIndex * THETA);
  const point2 = pointOnCircle(1, (triangleIndex + 1) * THETA);

  VERTICES[i] = 0;
  VERTICES[i + 1] = 0;

  VERTICES[i + 2] = point1.x;
  VERTICES[i + 3] = point1.y;

  VERTICES[i + 4] = point2.x;
  VERTICES[i + 5] = point2.y;
}

export class FlameShader extends Shader {
  vertexBuffer!: GPUBuffer;
  renderPipeline!: GPURenderPipeline;
  backgroundPipeline!: GPURenderPipeline;
  computePipeline!: GPUComputePipeline;
  bindGroups!: GPUBindGroup[];
  frameLength = 0;

  setup() {
    const particleCounter = document.getElementById('particle-count');
    if (particleCounter) {
      particleCounter.textContent = `${Math.floor(PARTICLE_COUNT / 1000)}k`;
    }
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

    for (let i = 0; i < particleStates.length; i += PARTICLE_INTERVAL) {
      const position = randomVector(ORIGIN_RADIUS);
      const velocity = randomVector(ORIGIN_RADIUS);

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
      code: computeParticlesShader,
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
      code: renderParticlesShader,
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

    const backgroundShaderModule = this.device.createShaderModule({
      label: 'Background render shader',
      code: renderBackgroundShader,
    });

    this.backgroundPipeline = this.device.createRenderPipeline({
      label: 'Background render pipeline',
      layout: 'auto',
      vertex: {
        module: backgroundShaderModule,
        entryPoint: 'vertexMain',
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: backgroundShaderModule,
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

  update() {
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
          clearValue: { r: 0, g: 0, b: 0.15, a: 1 },
          storeOp: 'store',
        },
      ],
    });

    pass.setPipeline(this.backgroundPipeline);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.draw(VERTICES.length / 2);

    pass.setPipeline(this.renderPipeline);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setBindGroup(0, this.bindGroups[this.step % 2]);
    pass.draw(VERTICES.length / 2, PARTICLE_COUNT);

    pass.end();

    // Finish the command buffer and immediately submit it.
    this.device.queue.submit([encoder.finish()]);
  }
}
