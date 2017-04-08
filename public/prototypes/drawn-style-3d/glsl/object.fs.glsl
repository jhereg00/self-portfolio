// our standard 3d fragment shader for building the g-buffer
#extension GL_EXT_draw_buffers : require
precision mediump float;

uniform vec4 uColor;
#if COLOR_TEXTURE
uniform sampler2D uColorTexture;
#endif

uniform float uSpecularity;
#if SPECULARITY_TEXTURE
uniform sampler2D uSpecularityTexture;
#endif

#if LINEART_TEXTURE
uniform sampler2D uLineartTexture;
#endif

varying vec4 vPos;
varying vec3 vNormal;
varying vec2 vUV;
varying float vDepth;

void main () {
  // color output
  #if COLOR_TEXTURE
  gl_FragData[0] = uColor * texture2D(uColorTexture, vUV);
  #else
  gl_FragData[0] = uColor;
  #endif

  // normals
  gl_FragData[1] = vec4((vNormal + vec3(1.0)) / 2.0, 1.0);

  // depth
  gl_FragData[2] = vec4(vDepth, vDepth, vDepth, 1.0);

  // position
  gl_FragData[3] = vPos;

  // specularity
  // not used for this
  // gl_FragData[4] = vec4(vec3(uSpecularity), 1.0);

  #if LINEART_TEXTURE
  gl_FragData[4] = texture2D(uLineartTexture, vUV);
  #else
  gl_FragData[4] = vec4(1.0);
  #endif
}
