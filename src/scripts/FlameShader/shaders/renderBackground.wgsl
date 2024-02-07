struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(1) alpha: f32,
};

@vertex
fn vertexMain(@location(0) pos: vec2f) -> VertexOutput {

  var output: VertexOutput;
  output.pos = vec4f(pos.x * 2, pos.y * 2 + ${ORIGIN_Y}, 0, 1);
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