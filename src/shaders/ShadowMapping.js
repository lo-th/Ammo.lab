V.ShadowMapping={
uniforms:{
colorBase:    { type:'c', value: new THREE.Color(0xEEEFEF) },
ambient:    { type:'c', value: new THREE.Color(0x25292e) },
shininess: { type:'f', value:10.0 },
env : { type: 't', value: null },
depthTexture : { type: 't', value: null },
projector : { type: 't', value: null },
lightPosition : { type: 'v3', value: new THREE.Vector3() },
lightDirection : { type: 'v3', value: new THREE.Vector3() },
resolution : { type: 'v2', value: new THREE.Vector2( 512, 512 )  },
//mmMatrix : { type: 'm4', value: new THREE.Matrix4() },
shadowMVP : { type: 'm4', value: new THREE.Matrix4() },
shadowV : { type: 'm4', value: new THREE.Matrix4() },
shadowP : { type: 'm4', value: new THREE.Matrix4() }
},
fs: [
'precision highp float;',
'uniform vec3 colorBase;',
'uniform vec3 ambient;',
'uniform float shininess;',
'uniform sampler2D env;',
'uniform sampler2D depthTexture;',
'uniform sampler2D projector;',
'uniform vec3 lightPosition;',
'uniform vec2 resolution;',
'varying vec4 vShadowCoord;',
'varying vec3 vNormal;',
'varying vec3 vPosition;',
'varying float occluded;',
'varying float bias;',
//'varying vec2 vN;',

'float sampleVisibility( vec3 coord ) {',
	'float depth = texture2D( depthTexture, coord.xy ).r;',
	'float visibility  = ( coord.z - depth > bias ) ? 0. : 1.;',
	'return visibility;',
'}',

'void main(void) {',
	'vec2 poissonDisk[ 4 ];',
	'poissonDisk[ 0 ] = vec2( -0.94201624, -0.39906216 );',
	'poissonDisk[ 1 ] = vec2( 0.94558609, -0.76890725 );',
	'poissonDisk[ 2 ] = vec2( -0.094184101, -0.92938870 );',
	'poissonDisk[ 3 ] = vec2( 0.34495938, 0.29387760 );',
	'float shadow = 0.;',
	'vec3 shadowCoord = vShadowCoord.xyz / vShadowCoord.w;',
	'float skip = 0.;',

	'if( shadowCoord.x >= 0. || shadowCoord.x <= 1. || shadowCoord.y >= 0. || shadowCoord.y <= 1. ) {',
		'if( occluded > 0. ) {',
			'float step = 1.;',
			'float incX = step / resolution.x;',
			'float incY = step / resolution.y;',

			'shadow += sampleVisibility( shadowCoord + vec3( 0., -incY, 0. ) );',
			'shadow += sampleVisibility( shadowCoord + vec3( -incX, 0., 0. ) );',
			'shadow += sampleVisibility( shadowCoord + vec3( 0., 0., 0. ) );',
			'shadow += sampleVisibility( shadowCoord + vec3( incX, 0., 0. ) );',
			'shadow += sampleVisibility( shadowCoord + vec3( 0., incY, 0. ) );',

			'shadow /= 5.;',
		'}',
	'}',

	'vec3 n = normalize( vNormal );',

	'vec3 r = -reflect(lightPosition, n);',
	'r = normalize(r);',
	'vec3 v = -vPosition.xyz;',
	'v = normalize(v);',
	'float nDotHV = max( 0., dot( r, v ) );',

	//'float shininess = 10.;',
	'float specular = pow ( nDotHV, shininess );',

	//'vec3 colorBase = vec3( 1., 168. / 255., 0. );',
	//'vec3 ambient = vec3( 96. / 255., 54. / 255., 0. );',
	//'vec3 ev = texture2D( env, vN ).rgb;',
	'vec3 colorEnd=colorBase;',
    //'colorEnd *= ev;',

	'float falloff = smoothstep( 0., .1, .5 - length( shadowCoord.xy - .5 ) );',
	'vec4 mask = texture2D( projector, vShadowCoord.xy );',
	'gl_FragColor = vec4( ( .5 * occluded ) * ambient + falloff * occluded * colorEnd * shadow * mask.rgb + specular * occluded * falloff * shadow, 1. );',
'}'
].join('\n'),
vs: [
'precision highp float;',
//'uniform mat4 mmMatrix;',
'uniform mat4 shadowMVP;',
'uniform mat4 shadowV;',
'uniform mat4 shadowP;',
'uniform vec3 lightPosition;',
'uniform vec3 lightDirection;',

'varying vec4 vShadowCoord;',
'varying vec3 vPosition;',
'varying vec3 vNormal;',

'varying float occluded;',
'varying float bias;',
//'varying vec2 vN;',

'const mat4 biasMatrix = mat4( 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);',

'void main(void) {',
	'vec4 p = vec4( position, 1. );',
	'vShadowCoord = biasMatrix * shadowP * modelMatrix * shadowV * p;',
	'vPosition = ( modelViewMatrix * p ).xyz;',
	'gl_Position = projectionMatrix * modelViewMatrix * p;',

	'occluded = -dot( normalize( normal ), normalize( lightDirection ) );',

	//'vec3 vPos = normalize( vec3( mmMatrix * vec4( position, 1.0 ) ) );',
    //'vec3 vNormal = normalize( normalMatrix * normal );',
    //'vec3 r = reflect( vPos, vNormal );',
    //'float m = 2. * sqrt( pow( r.x, 2. ) + pow( r.y, 2. ) + pow( r.z + 1., 2. ) );',
    //'vN = r.xy / m + .5;',
    //'vN = vec2(0.0,0.0);',

	'float theta = clamp( -occluded, 0., 1. );',
    'bias = 0.005 * tan( acos( theta ) );',
    'bias = clamp( bias, 0., 0.01 );',
    'vNormal = normalMatrix * normal;',
'}'
].join('\n')
}