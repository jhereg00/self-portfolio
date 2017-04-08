// our standard 3d vertex shader
precision highp float;

attribute vec3 aPosition;

uniform mat4 uProjectionMatrix;
uniform mat4 uMVMatrix;
uniform vec3 uCamPos;
uniform float uCamRange;

varying float vDepth;
varying vec3 vDir;

void main () {
  vec4 worldPosition = uMVMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * worldPosition;
  vDepth = distance(worldPosition.xyz, uCamPos) / uCamRange;
  // vDepth = (gl_Position.z) / gl_Position.w;
  vDir = worldPosition.xyz - uCamPos;
}
