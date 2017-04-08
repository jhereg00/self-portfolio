// basic 2d output
attribute vec2 aPosition;
attribute vec2 aUV;

varying mediump vec2 vTextureCoords;

void main(void) {
	vTextureCoords = aUV;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
