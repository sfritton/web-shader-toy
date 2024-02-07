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