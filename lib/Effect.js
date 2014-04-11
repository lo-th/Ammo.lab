THREE.CopyShader = {
	uniforms: {
		"tDiffuse": { type: "t", value: null },
		"opacity":  { type: "f", value: 1.0 }
	},
	vertexShader: [
		"varying vec2 vUv;",
		"void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join("\n"),
	fragmentShader: [
		"uniform float opacity;",
		"uniform sampler2D tDiffuse;",
		"varying vec2 vUv;",
		"void main() {",
			"vec4 texel = texture2D( tDiffuse, vUv );",
			"gl_FragColor = opacity * texel;",
		"}"
	].join("\n")
};

THREE.BlurShader = {
	uniforms: {
		"tDiffuse": { type: "t", value: null },
		"delta":  { type: "v2", value:new THREE.Vector2(.01,.01) }
	},
	vertexShader: [
		"varying vec2 vUv;",
		"void main() {",
			"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
			"gl_Position = projectionMatrix * mvPosition; vUv = uv;",
		"}"
	].join("\n"),
	fragmentShader: [
		"varying vec2 vUv;",
		"uniform sampler2D tDiffuse;",
		"uniform vec2 delta;",
		"float random(vec3 scale,float seed){return fract(sin(dot(gl_FragCoord.xyz+seed,scale))*43758.5453+seed);}",
		"void main() {",
			"vec4 color=vec4(0.0);",
			"float total=0.0;",
			"float offset=random(vec3(12.9898,78.233,151.7182),0.0);",
			"for(float t=-30.0;t<=30.0;t++){",
			    "float percent=(t+offset-0.5)/30.0;",
			    "float weight=1.0-abs(percent);",
			    "vec4 sample=texture2D(tDiffuse,vUv+delta*percent);",
			    "sample.rgb*=sample.a; color+=sample*weight; total+=weight;}",
			"gl_FragColor=color/total; gl_FragColor.rgb/=gl_FragColor.a+0.00001;",
		"}"
	].join("\n")
};


var vs_post = "varying vec3 vNormal; varying vec3 vPosition; varying vec3 vLight; vec4 lightPosition = vec4( 0., 0., -10., 1. );";
vs_post +="void main() { vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 ); gl_Position = projectionMatrix * mvPosition; vNormal = normalMatrix * normal; vPosition = mvPosition.xyz; vLight = ( viewMatrix * lightPosition ).xyz;}";
var fs_post ="varying vec3 vNormal; varying vec3 vPosition; varying vec3 vLight; uniform int renderDepth;";
fs_post += "void main() { vec3 ambient = vec3( .1 ); vec3 n = normalize( vNormal ); vec3 s = normalize( vLight - vPosition ); vec3 color = vec3( .75 ); vec3 diffuse = color * max( 0.0, dot( n, s ) ) * vec3( 1. ); vec3 r = - reflect( vLight, n );  r = normalize( r ); vec3 v = - vPosition.xyz; v = normalize( v ); float shininess = 10.; float rm = 1. - max( 0., dot( n, v ) ); vec3 rim = vec3( pow( rm, 2. ) ); vec3 specular; if( shininess != 0.0 ) { specular = vec3( 1. ) * vec3( 1. ) * pow( max( 0.0, dot( r, v ) ), shininess ); } else { specular = vec3( 0. ); } specular = vec3( 0.); rim = vec3( 0. ); if( renderDepth == 0 ) {  gl_FragColor = vec4( rim + ambient + diffuse + specular, 1. ); } else { float z = clamp( 0., 1., gl_FragCoord.w * 10. ); gl_FragColor = vec4( .5 * ( 1. + n.x ), .5 * ( 1. + n.y ), z, 1. );}}";

var vs_render = " varying vec2 vUv; void main() { vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 ); gl_Position = projectionMatrix * mvPosition; vUv = uv; } ";
var fs_render = " uniform sampler2D tDiffuse; uniform sampler2D tColor; uniform sampler2D tNoise; uniform sampler2D tPaper; uniform sampler2D tBlur; uniform vec2 resolution; varying vec2 vUv;";
fs_render+="void main() { float x = 1.0 / resolution.x; float y = 1.0 / resolution.y; vec4 horizEdge = vec4( 0.0 ); horizEdge -= texture2D( tDiffuse, vec2( vUv.x - x, vUv.y - y ) ) * 1.0; horizEdge -= texture2D( tDiffuse, vec2( vUv.x - x, vUv.y     ) ) * 2.0; horizEdge -= texture2D( tDiffuse, vec2( vUv.x - x, vUv.y + y ) ) * 1.0; horizEdge += texture2D( tDiffuse, vec2( vUv.x + x, vUv.y - y ) ) * 1.0; horizEdge += texture2D( tDiffuse, vec2( vUv.x + x, vUv.y ) ) * 2.0; horizEdge += texture2D( tDiffuse, vec2( vUv.x + x, vUv.y + y ) ) * 1.0; vec4 vertEdge = vec4( 0.0 ); vertEdge -= texture2D( tDiffuse, vec2( vUv.x - x, vUv.y - y ) ) * 1.0; vertEdge -= texture2D( tDiffuse, vec2( vUv.x    , vUv.y - y ) ) * 2.0; vertEdge -= texture2D( tDiffuse, vec2( vUv.x + x, vUv.y - y ) ) * 1.0; vertEdge += texture2D( tDiffuse, vec2( vUv.x - x, vUv.y + y ) ) * 1.0; vertEdge += texture2D( tDiffuse, vec2( vUv.x    , vUv.y + y ) ) * 2.0; vertEdge += texture2D( tDiffuse, vec2( vUv.x + x, vUv.y + y ) ) * 1.0; vec3 edge = sqrt((horizEdge.rgb * horizEdge.rgb) + (vertEdge.rgb * vertEdge.rgb)); float e = length( edge ); float z = texture2D( tDiffuse, vUv ).b; vec3 b = texture2D( tColor, vUv ).rgb; vec3 a = texture2D( tBlur, vUv ).rgb; vec3 c = vec3( 1. ) - ( vec3( 1. ) - a ) * ( vec3( 1. ) - b ); vec2 nUV = vec2( mod( vUv.x * resolution.x / 256., 1. ), mod( vUv.y * resolution.y / 256., 1. ) ); float s = mix( 1., texture2D( tNoise, nUV ).r, 1. - c.r ); s -= .15 * e * z; vec2 pUV = vec2( mod( vUv.x * resolution.x / 512., 1. ), mod( vUv.y * resolution.y / 512., 1. ) ); vec3 color = texture2D( tPaper, pUV ).rgb * s; gl_FragColor = vec4( color, 1. ); }";

THREE.RenderPass = function ( scene, camera, overrideMaterial, clearColor, clearAlpha ) {
	this.scene = scene;
	this.camera = camera;
	this.overrideMaterial = overrideMaterial;
	this.clearColor = clearColor;
	this.clearAlpha = ( clearAlpha !== undefined ) ? clearAlpha : 1;
	this.oldClearColor = new THREE.Color();
	this.oldClearAlpha = 1;
	this.enabled = true;
	this.clear = true;
	this.needsSwap = false;
};

THREE.RenderPass.prototype = {
	render: function ( renderer, writeBuffer, readBuffer, delta ) {
		this.scene.overrideMaterial = this.overrideMaterial;
		if ( this.clearColor ) {
			this.oldClearColor.copy( renderer.getClearColor() );
			this.oldClearAlpha = renderer.getClearAlpha();
			renderer.setClearColor( this.clearColor, this.clearAlpha );
		}
		renderer.render( this.scene, this.camera, readBuffer, this.clear );
		if ( this.clearColor ) {
			renderer.setClearColor( this.oldClearColor, this.oldClearAlpha );
		}
		this.scene.overrideMaterial = null;
	}
};

THREE.ShaderPass = function ( shader, textureID ) {
	this.textureID = ( textureID !== undefined ) ? textureID : "tDiffuse";
	this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );
	this.material = new THREE.ShaderMaterial( {
		uniforms: this.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader
	} );
	this.renderToScreen = false;
	this.enabled = true;
	this.needsSwap = true;
	this.clear = false;
};

THREE.ShaderPass.prototype = {
	render: function ( renderer, writeBuffer, readBuffer, delta ) {
		if ( this.uniforms[ this.textureID ] ) {
			this.uniforms[ this.textureID ].value = readBuffer;
		}
		THREE.EffectComposer.quad.material = this.material;
		if ( this.renderToScreen ) {
			renderer.render( THREE.EffectComposer.scene, THREE.EffectComposer.camera );
		} else {
			renderer.render( THREE.EffectComposer.scene, THREE.EffectComposer.camera, writeBuffer, this.clear );
		}
	}
};

THREE.MaskPass = function ( scene, camera ) {
	this.scene = scene;
	this.camera = camera;
	this.enabled = true;
	this.clear = true;
	this.needsSwap = false;
	this.inverse = false;
};

THREE.MaskPass.prototype = {
	render: function ( renderer, writeBuffer, readBuffer, delta ) {
		var context = renderer.context;
		context.colorMask( false, false, false, false );
		context.depthMask( false );
		var writeValue, clearValue;
		if ( this.inverse ) { writeValue = 0; clearValue = 1;} else { writeValue = 1; clearValue = 0;}
		context.enable( context.STENCIL_TEST );
		context.stencilOp( context.REPLACE, context.REPLACE, context.REPLACE );
		context.stencilFunc( context.ALWAYS, writeValue, 0xffffffff );
		context.clearStencil( clearValue );
		renderer.render( this.scene, this.camera, readBuffer, this.clear );
		renderer.render( this.scene, this.camera, writeBuffer, this.clear );
		context.colorMask( true, true, true, true );
		context.depthMask( true );
		context.stencilFunc( context.EQUAL, 1, 0xffffffff );  // draw if == 1
		context.stencilOp( context.KEEP, context.KEEP, context.KEEP );
	}
};

THREE.ClearMaskPass = function () {
	this.enabled = true;
};

THREE.ClearMaskPass.prototype = {
	render: function ( renderer, writeBuffer, readBuffer, delta ) {
		var context = renderer.context;
		context.disable( context.STENCIL_TEST );
	}
};

THREE.EffectComposer = function ( renderer, renderTarget ) {
	this.renderer = renderer;
	if ( renderTarget === undefined ) {
		var width = window.innerWidth || 1;
		var height = window.innerHeight || 1;
		var parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
		renderTarget = new THREE.WebGLRenderTarget( width, height, parameters );
	}
	this.renderTarget1 = renderTarget;
	this.renderTarget2 = renderTarget.clone();
	this.writeBuffer = this.renderTarget1;
	this.readBuffer = this.renderTarget2;
	this.passes = [];
	if ( THREE.CopyShader === undefined )
		console.error( "THREE.EffectComposer relies on THREE.CopyShader" );
	this.copyPass = new THREE.ShaderPass( THREE.CopyShader );
};

THREE.EffectComposer.prototype = {
	swapBuffers: function() {
		var tmp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = tmp;
	},
	addPass: function ( pass ) {
		this.passes.push( pass );
	},
	insertPass: function ( pass, index ) {
		this.passes.splice( index, 0, pass );
	},
	render: function ( delta ) {
		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;
		var maskActive = false;
		var pass, i, il = this.passes.length;
		for ( i = 0; i < il; i ++ ) {
			pass = this.passes[ i ];
			if ( !pass.enabled ) continue;
			pass.render( this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive );
			if ( pass.needsSwap ) {
				if ( maskActive ) {
					var context = this.renderer.context;
					context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );
					this.copyPass.render( this.renderer, this.writeBuffer, this.readBuffer, delta );
					context.stencilFunc( context.EQUAL, 1, 0xffffffff );
				}
				this.swapBuffers();
			}
			if ( pass instanceof THREE.MaskPass ) {
				maskActive = true;
			} else if ( pass instanceof THREE.ClearMaskPass ) {
				maskActive = false;
			}
		}
	},

	reset: function ( renderTarget ) {
		if ( renderTarget === undefined ) {
			renderTarget = this.renderTarget1.clone();
			renderTarget.width = window.innerWidth;
			renderTarget.height = window.innerHeight;
		}
		this.renderTarget1 = renderTarget;
		this.renderTarget2 = renderTarget.clone();
		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;
	},

	setSize: function ( width, height ) {
		var renderTarget = this.renderTarget1.clone();
		renderTarget.width = width;
		renderTarget.height = height;
		this.reset( renderTarget );
	}
};

THREE.EffectComposer.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
THREE.EffectComposer.quad = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), null );
THREE.EffectComposer.scene = new THREE.Scene();
THREE.EffectComposer.scene.add( THREE.EffectComposer.quad );