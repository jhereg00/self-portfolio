// our standard 3d fragment shader for building the g-buffer
precision highp float;

varying float vDepth;
varying vec3 vDir;

void main () {
  // depth
  gl_FragColor = vec4(vec3(vDepth), 1.0);
}
