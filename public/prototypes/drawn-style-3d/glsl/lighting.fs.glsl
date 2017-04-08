// basic 2d output
precision mediump float;
#define AMBIENT 0
#define POINT 1
#define DIRECTIONAL 2

uniform struct Light {
  vec3 position;

  vec4 ambientColor;
  float ambientIntensity;
  vec4 diffuseColor;
  float diffuseIntensity;
  vec4 specularColor;
  float specularIntensity;

  float radius;
  float falloffStart;
  float bias;
} uLights [NUM_LIGHTS];

uniform sampler2D uNormalTexture;
uniform sampler2D uPositionTexture;
uniform sampler2D uColorTexture;
uniform sampler2D uLineartTexture;
uniform vec3 uCameraPosition;
uniform int uNumLights;
uniform samplerCube uShadowCubes [NUM_LIGHTS];

#ifdef BACKGROUND_TEXTURE
 uniform sampler2D uBackgroundTexture;
 const vec3 multiplyColor = vec3(168.0 / 255.0,  152.0 / 255.0,  104.0 / 255.0);
#endif

const float shininess = 16.0;
const float screenGamma = 2.2; // Assume the monitor is calibrated to the sRGB color space

varying vec2 vTextureCoords;

void main () {
  vec3 normal = normalize(texture2D(uNormalTexture, vTextureCoords).xyz * 2.0 - 1.0);
  vec3 position = texture2D(uPositionTexture, vTextureCoords).xyz;
  vec3 viewDir = normalize(uCameraPosition - position);
  vec4 materialColor = texture2D(uColorTexture, vTextureCoords);

  vec3 lighting = vec3(0.0);

  for( int i = 0; i < NUM_LIGHTS; i++ ) {
    Light light = uLights[i];
    if (i < uNumLights) {
      vec3 lightDir = normalize(light.position - position);
      // formula for intensity at distance
      // intensity / ((distance / radius + 1) ^ 2)
      float dist = distance(light.position, position);
      float attenuation = 1.0 - (max(dist - light.falloffStart, 0.0) / (light.radius - light.falloffStart));
      float diffuseAttenuation = light.diffuseIntensity * min(attenuation,1.0);

      // determine the diffuse
      // it's the dot product of the light direction and the normal
      float diffuse = max(dot(lightDir, normal), 0.0);

      lighting += light.ambientColor.rgb * light.ambientColor.a * light.ambientIntensity;

      float shadowDepth = textureCube(uShadowCubes[i], lightDir * vec3(1.0,1.0,-1.0)).r;
      if (diffuse > 0.0 && (shadowDepth == 0.0 || (shadowDepth + light.bias) > dist / light.radius)) {
        // lighting += vec3(1.0);
        lighting += light.diffuseColor.rgb * light.diffuseColor.a * (diffuseAttenuation * diffuse);// * materialColor.rgb;
      }
    }
  }
  //texture2D(uLineartTexture, vTextureCoords).r *
  float r = clamp(texture2D(uLineartTexture, vTextureCoords).r * sign((lighting.r - (1.0 - materialColor.r))),  0.0,  1.0);

  #ifdef BACKGROUND_TEXTURE
    gl_FragColor = texture2D(uBackgroundTexture, vTextureCoords) * vec4(min(multiplyColor + r, 1.0), 1.0);
  #else
    gl_FragColor = vec4(r,r,r, 1.0);
  #endif
}
