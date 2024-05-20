precision highp float;
precision highp int;
uniform sampler2D uTexture;
varying vec2 vUv;
uniform vec2 uOffset;
uniform vec2 uStrength;
uniform vec2 uViewportSizes;

#define M_PI 3.1415926535897932384626433832795

vec3 deformationCurve(vec3 position, vec2 uv, vec2 offset) {
        position.x = position.x + (sin(uv.y * M_PI) * offset.x);
        position.y = position.y + (sin(uv.x * M_PI) * offset.y);
        return position;
}

void main() {
    vUv = uv;
    vec3 pos = deformationCurve(position, vUv, uOffset);

    vec4 newPosition = modelViewMatrix * vec4(pos, 1.0);
    newPosition.z += sin(newPosition.x / uViewportSizes.x * M_PI + M_PI / 2.0) * uStrength.x;
    newPosition.z += sin(newPosition.y / uViewportSizes.y * M_PI + M_PI / 2.0) * uStrength.y;

    gl_Position = projectionMatrix * newPosition;
}
