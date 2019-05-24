#include <common>

#define GOLDEN 1.61803398875

vec4 ToRGBE( in vec4 value ) {

	float maxComponent = max( max( value.r, value.g ), value.b );
	float fExp = clamp( ceil( log2( maxComponent ) ), -128.0, 127.0 );
	return vec4( value.rgb / exp2( fExp ), ( fExp + 128.0 ) / 255.0 );
    //return vec4( value.brg, ( 3.0 + 128.0 ) / 256.0 );
}

vec4 toHDR( in vec4 c ) {

    vec3 v = c.rgb;
    v = pow( abs(v), vec3( GOLDEN ));// exposure and gamma increase to match HDR
    return ToRGBE( vec4(v.r, v.g, v.b, 1.0) );

}
/*
vec4 HdrEncode(vec3 value) {
	//value = value / 65536.0;
	vec3 exponent = clamp(ceil(log2(value)), -128.0, 127.0);
	float commonExponent = max(max(exponent.r, exponent.g), exponent.b);
	float range = exp2(commonExponent);
	vec3 mantissa = clamp(value / range, 0.0, 1.0);
	return vec4(mantissa, (commonExponent + 128.0)/256.0);

}*/

uniform sampler2D map;
uniform int decode;
uniform int isHdr;
uniform int rev;
varying vec2 vUv;

void main() {
    int flip = isHdr;
    vec2 uVx = vec2( rev == 1 ? 0.5 - vUv.x : vUv.x, flip == 1 ? 1.0 - vUv.y : vUv.y );
    vec4 c = texture2D( map, uVx );
    vec4 color = isHdr == 1 ? c : toHDR( c );
    gl_FragColor = decode == 1 ? RGBEToLinear( color ) : color;
}