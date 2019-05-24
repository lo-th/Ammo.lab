varying vec2 vUv;
varying vec3 worldPosition;

void main() {

    vUv = uv;
	worldPosition = ( modelMatrix * vec4( position, 1.0 )).xyz;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}