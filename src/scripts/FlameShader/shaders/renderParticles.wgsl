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
  let i = input.instance * ${PARTICLE_INTERVAL};
  let position = vec2f(particleStates[i], particleStates[i+1]);
  let lifespan = particleStates[i+4];
  let scale = particleScale(lifespan);
  let pos = (input.pos * ${PARTICLE_SIZE} * scale) + position;

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