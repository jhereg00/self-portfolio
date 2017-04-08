// basic 2d output
precision mediump float;

uniform sampler2D uColorTexture;

varying vec2 vTextureCoords;

void main () {
  gl_FragColor = texture2D(uColorTexture, vTextureCoords);
}
