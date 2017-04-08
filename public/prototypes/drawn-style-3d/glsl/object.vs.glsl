// our standard 3d vertex shader
precision mediump float;

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUV;

uniform mat4 uProjectionMatrix;
uniform mat4 uMVMatrix;
uniform mat4 uNormalMatrix;

varying vec4 vPos;
varying vec3 vNormal;
varying vec2 vUV;
varying float vDepth;

void main () {
  vec4 worldPosition = uMVMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * worldPosition;
  vPos = worldPosition;
  vNormal = (uNormalMatrix * vec4(aNormal, 0.0)).xyz;
  vDepth = (gl_Position.z) / gl_Position.w;
  vUV = aUV;
  //vNormal;
}
