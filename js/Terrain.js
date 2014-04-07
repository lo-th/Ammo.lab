var THREE;

var TERRAIN = { REVISION: '0.1' };

TERRAIN.ToRad = Math.PI / 180;

TERRAIN.Generate = function( div, size ){

    this.div = div || [64,64];
    this.size = size || [256, 30, 256];

    this.ratio = this.size[1]/765;
    this.hfFloatBuffer = new Float32Array(this.div[0]*this.div[1]);
    
    this.colors = [0x505050, 0x707050, 0x909050, 0xAAAA50, 0xFFFF50];

    this.bumpTexture = new THREE.Texture();

    this.heightMap = null;
    this.normalMap = null;

    this.uniformsNoise = null;
    this.uniformsNormal = null;
    this.uniformsTerrain = null;

    this.mlib = {};
    this.textureCounter=0;

    this.sceneRenderTarget = null;
    this.cameraOrtho = null;

    this.specularMap = null;
    
    this.W = 0;
    this.H = 0;

    this.quadTarget = null;

    this.animDelta = 0;
    this.animDeltaDir = -1;
    this.lightVal = 0;
    this.lightDir = 1;

    this.updateNoise = true;

    this.tmpData = null;

    this.textures = [];
    this.maps = ["level0", "level1", "level2", "level3", "level4", "diffuse1", "diffuse2", "normal"]

    this.fullLoaded = false;
    this.timerTest = null;

    var geometry = new THREE.PlaneGeometry(this.size[0], this.size[2], this.div[0], this.div[1]);
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    geometry.computeTangents();
        
    var geo = THREE.BufferGeometryUtils.fromGeometry( geometry );
    geometry.dispose();

    this.mesh = new THREE.Mesh( geo, new THREE.MeshBasicMaterial( { color:0x555555 } ) );
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.visible = false;

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.container = new THREE.Object3D();
    this.container.add(this.mesh);
}

TERRAIN.Generate.prototype = {
    constructor: TERRAIN.Generate,

    clear:function () {
        this.container.remove(this.mesh);
        this.mesh.material.dispose();
        this.mesh.geometry.dispose();
    },
    init:function (W,H) {
        _this = this;

        this.W = W || 512;
        this.H = H || 512;

        TERRAIN.initShader();

        var PATH = "images/terrain/";

        var i = this.maps.length;
        while(i--){
            this.textures[i] = new THREE.ImageUtils.loadTexture( PATH + this.maps[i]+ ".jpg" ); //, new THREE.UVMapping() );
        }

        this.timerTest = setInterval(this.loadTextures, 20, this);
    },
    loadTextures:function (parent) {
        if ( parent.textures.length == parent.maps.length)  {
            clearInterval(parent.timerTest);
            parent.start();
        }
    },
    start:function() {
        var i = this.textures.length;
        while(i--){
            this.textures[i].format = THREE.RGBFormat;
            this.textures[i].wrapS = this.textures[i].wrapT = THREE.RepeatWrapping;
        }

        this.generateData(this.div[0], this.div[1], new THREE.Color(0x000000));

        this.sceneRenderTarget = new THREE.Scene();

        this.cameraOrtho = new THREE.OrthographicCamera( this.W / - 2, this.W / 2, this.H / 2, this.H / - 2, -10000, 10000 );
        this.cameraOrtho.position.z = 100;
        this.sceneRenderTarget.add( this.cameraOrtho );

        // HEIGHT + NORMAL MAPS

        var normalShader = TERRAIN.NormalMapShader;

        var pars = { minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };

        this.heightMap  = new THREE.WebGLRenderTarget( this.div[0], this.div[1], pars );
        this.normalMap = new THREE.WebGLRenderTarget( this.div[0], this.div[1], pars );

        this.uniformsNoise = {

            time:   { type: "f", value: 1.0 },
            scale:  { type: "v2", value: new THREE.Vector2( 1.5, 1.5 ) },
            offset: { type: "v2", value: new THREE.Vector2( 0, 0 ) }

        };

        this.uniformsNormal = THREE.UniformsUtils.clone( normalShader.uniforms );

        this.uniformsNormal.height.value = 0.05;
        this.uniformsNormal.resolution.value = new THREE.Vector2( this.div[0], this.div[1] );
        this.uniformsNormal.scale.value = new THREE.Vector2( 1,1 );
        this.uniformsNormal.heightMap.value = this.heightMap;

        // NOISE
        var terrainNoise = TERRAIN.ShaderNoise[ "noise" ];

        //this.specularMap = new THREE.WebGLRenderTarget( 512, 512, pars );
        this.specularMap = new THREE.WebGLRenderTarget( 1024, 1024, pars );

        this.applyShader();

        // TERRAIN SHADER

        var terrainShader = TERRAIN.ShaderTerrain[ "terrain" ];

        this.uniformsTerrain = THREE.UniformsUtils.clone( terrainShader.uniforms );

        this.uniformsTerrain[ "oceanTexture" ].value = this.textures[0];
        this.uniformsTerrain[ "sandyTexture" ].value = this.textures[1];
        this.uniformsTerrain[ "grassTexture" ].value = this.textures[2];
        this.uniformsTerrain[ "rockyTexture" ].value = this.textures[3];
        this.uniformsTerrain[ "snowyTexture" ].value = this.textures[4];

        this.uniformsTerrain[ "tNormal" ].value = this.normalMap;
        this.uniformsTerrain[ "uNormalScale" ].value = 3.5;

        this.uniformsTerrain[ "tDisplacement" ].value = this.heightMap;

        this.uniformsTerrain[ "tDiffuse1" ].value = this.textures[5];
        this.uniformsTerrain[ "tDiffuse2" ].value = this.textures[6];
        this.uniformsTerrain[ "tSpecular" ].value = this.specularMap;
        this.uniformsTerrain[ "tDetail" ].value = this.textures[7];

        this.uniformsTerrain[ "enableDiffuse1" ].value = true;
        this.uniformsTerrain[ "enableDiffuse2" ].value = true;
        this.uniformsTerrain[ "enableSpecular" ].value = true;

        this.uniformsTerrain[ "diffuse" ].value.setHex( 0x303030 );
        this.uniformsTerrain[ "specular" ].value.setHex( 0x606060 );
        this.uniformsTerrain[ "ambient" ].value.setHex( 0x101010 );

        this.uniformsTerrain[ "shininess" ].value = 60;

        this.uniformsTerrain[ "uDisplacementScale" ].value = this.size[1];
        this.uniformsTerrain[ "uRepeatOverlay" ].value.set( 12, 12 );

        var params = [
                        [ 'heightmap',  terrainNoise.fragmentShader, terrainNoise.vertexShader, this.uniformsNoise, false ],
                        [ 'normal',     normalShader.fragmentShader,  normalShader.vertexShader, this.uniformsNormal, false ],
                        [ 'terrain',    terrainShader.fragmentShader, terrainShader.vertexShader, this.uniformsTerrain, true ]
                     ];

        var material;
        for( var i = 0; i < params.length; i ++ ) {

            material = new THREE.ShaderMaterial( {

                uniforms:       params[ i ][ 3 ],
                vertexShader:   params[ i ][ 2 ],
                fragmentShader: params[ i ][ 1 ],
                lights:         params[ i ][ 4 ],
                fog:            false,
                } );

            this.mlib[ params[ i ][ 0 ] ] = material;

        }

        var plane = new THREE.PlaneGeometry( this.W, this.H );

        this.quadTarget = new THREE.Mesh( plane, new THREE.MeshBasicMaterial( { color: 0x000000 } ) );
        this.quadTarget.position.z = -500;
        this.sceneRenderTarget.add( this.quadTarget );

        this.fullLoaded = true;


        this.mesh.material = this.mlib[ "terrain" ];
        this.mesh.visible = true;
        this.update(1);

    },
    
    applyShader:function () {
        var shader = TERRAIN.LuminosityShader;

        var shaderMaterial = new THREE.ShaderMaterial( {

            fragmentShader: shader.fragmentShader,
            vertexShader: shader.vertexShader,
            uniforms: THREE.UniformsUtils.clone( shader.uniforms )

        } );

        shaderMaterial.uniforms[ "tDiffuse" ].value = this.diffuseTexture1;

        var sceneTmp = new THREE.Scene();

        var meshTmp = new THREE.Mesh( new THREE.PlaneGeometry( this.W, this.H ), shaderMaterial );
        meshTmp.position.z = -500;

        sceneTmp.add( meshTmp );

        View.renderer.render( sceneTmp, this.cameraOrtho, this.specularMap, true );

    },

    generatePhysics : function () {
        var pix, j, n;
        var np = 0;
        var i = this.div[0]; 
        while (i--) {
            for (var j = 0; j < this.div[1]; j++) {
            n = ((i)*this.div[0])+(j+1);
            pix = n*4;
            np ++;
            this.hfFloatBuffer[np] = (this.tmpData[pix+0]+this.tmpData[pix+1]+this.tmpData[pix+2])*this.ratio;
           }
        }

        if(AmmoWorker) AmmoWorker.postMessage({tell:"UPTERRAIN", Hdata:this.hfFloatBuffer });
        else if(world) world.terrain.update(this.hfFloatBuffer);
    },
    
    generateData : function (width, height, color) {
        var size = width * height;
        
        var data = new Uint8Array(size*4);

        var r = Math.floor(color.r * 255);
        var g = Math.floor(color.g * 255);
        var b = Math.floor(color.b * 255);

        for (var i = 0; i < size; i++) {
            if (i == size / 2 + width / 2) {
                data[i * 4] = 255;
                data[i * 4 + 1] = g;
                data[i * 4 + 2] = b;
                data[i * 4 + 3] = 255;
            } else {
                data[i * 4] = r;
                data[i * 4 + 1] = g;
                data[i * 4 + 2] = b;
                data[i * 4 + 3] = 255;
            }
        }

        this.tmpData = data;
    },
    update:function (delta) {
        if ( this.fullLoaded ) {

            var time = Date.now() * 0.001;

            var fLow = 0.01, fHigh = 0.8;

            this.lightVal = THREE.Math.clamp( this.lightVal + 0.5 * delta * this.lightDir, fLow, fHigh );

            var valNorm = ( this.lightVal - fLow ) / ( fHigh - fLow );

            //if(scene.fog) scene.fog.color.setHSL( 43/360, 0.33, this.lightVal-0.03);

           // if(hemiLight){
            //    hemiLight.color.setHSL( 220/360, 0.17, this.lightVal-0.1  );
           //     hemiLight.groundColor.setHSL( 43/360, 0.33, this.lightVal-0.03 );
          //  }

            //if(directionalLight)directionalLight.intensity = THREE.Math.mapLinear( valNorm, 0, 1, 0.1, 1.15 );
            //if(pointLight)pointLight.intensity = THREE.Math.mapLinear( valNorm, 0, 1, 0.9, 1.5 );
            //if(sbox)sbox.opacity = (1-(this.lightVal*1.25));

            this.uniformsTerrain[ "uNormalScale" ].value = THREE.Math.mapLinear( valNorm, 0, 1, 0.6, 3.5 );

            if (  this.updateNoise ) {

                this.animDelta = THREE.Math.clamp( this.animDelta + 0.00075 * this.animDeltaDir, 0, 0.05 );
                this.uniformsNoise[ "time" ].value += delta * this.animDelta;

                this.uniformsNoise[ "offset" ].value.x += delta * 0.05;

                this.uniformsTerrain[ "uOffset" ].value.x = 8 * this.uniformsNoise[ "offset" ].value.x;//4

                this.quadTarget.material =  this.mlib[ "heightmap" ];
                View.renderer.render( this.sceneRenderTarget, this.cameraOrtho, this.heightMap, true );

                var gl = View.renderer.getContext();
                gl.readPixels( 0, 0, this.div[0], this.div[1], gl.RGBA, gl.UNSIGNED_BYTE, this.tmpData );

                this.quadTarget.material =  this.mlib[ "normal" ];
                View.renderer.render( this.sceneRenderTarget, this.cameraOrtho, this.normalMap, true );

                this.generatePhysics();
            }
        }

    },
    anim:function () {
        this.animDeltaDir *= -1;
    },
    night:function () {
        this.lightDir *= -1;
    },
    getZ:function (x, z) {
        if(!this.fullLoaded) return 0;
        var colx =Math.floor((x / this.size[0] + .5) * ( this.div[0]));
        var colz =Math.floor((-z / this.size[2] + .5) * ( this.div[1]));
        var pixel = Math.floor(((colz-1)*this.div[0])+colx)*4;
        var result = (this.tmpData[pixel+0]+this.tmpData[pixel+1]+this.tmpData[pixel+2])*this.ratio;
        return result-this.seaLevel+4;
    }

}

// WATER

/*TERRAIN.Water = function(size, renderer, camera, scene) {
    this.size = size;
    this.waterNormals = new THREE.ImageUtils.loadTexture( 'images/water.jpg' );
    this.waterNormals.wrapS = this.waterNormals.wrapT = THREE.RepeatWrapping; 
    //this.waterNormal.format = THREE.RGBFormat;

    this.water = new THREE.Water( renderer, camera, scene , {
        textureWidth: 256, 
        textureHeight: 256,
        waterNormals: this.waterNormals,
        alpha:  0.6,
        sunDirection:  directionalLight.position.normalize(),
        sunColor: 0xffffee,
        waterColor: 0x001e0f,
        distortionScale: 50.0,
        fog: true,
    } );

    this.mirrorMesh = new THREE.Mesh( new THREE.PlaneGeometry(this.size[0], this.size[2], 10, 10 ),  this.water.material);
    this.mirrorMesh.add( this.water );
    this.mirrorMesh.rotation.x = - Math.PI * 0.5;
    this.mirrorMesh.position.y = -0.1
    scene.add( this.mirrorMesh );
}

TERRAIN.Water.prototype = {
    constructor: TERRAIN.Water,
    clear:function () {
        scene.remove( this.mirrorMesh );
    },
    render:function () {
        this.water.material.uniforms.time.value += 1.0 / 60.0;
        this.water.render();
    }
}*/


TERRAIN.NormalMapShader = {

    uniforms: {

        "heightMap":  { type: "t", value: null },
        "resolution": { type: "v2", value: null },
        "scale":      { type: "v2", value: null },
        "height":     { type: "f", value: 0.05 }

    },

    vertexShader: [

        "varying vec2 vUv;",

        "void main() {",

            "vUv = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

        "}"

    ].join("\n"),

    fragmentShader: [

        "uniform float height;",
        "uniform vec2 resolution;",
        "uniform sampler2D heightMap;",

        "varying vec2 vUv;",

        "void main() {",

            "float val = texture2D( heightMap, vUv ).x;",

            "float valU = texture2D( heightMap, vUv + vec2( 1.0 / resolution.x, 0.0 ) ).x;",
            "float valV = texture2D( heightMap, vUv + vec2( 0.0, 1.0 / resolution.y ) ).x;",

            "gl_FragColor = vec4( ( 0.5 * normalize( vec3( val - valU, val - valV, height  ) ) + 0.5 ), 1.0 );",

        "}"

    ].join("\n")

};


TERRAIN.ShaderNoise = {

    'noise' : {

        uniforms:
            {

            }

        ,

        fragmentShader: [

            "uniform float time;",
            "uniform float imSize;",
            "varying vec2 vUv;",

            "vec4 permute( vec4 x ) {",

                "return mod( ( ( x * 34.0 ) + 1.0 ) * x, 289.0 );",

            "}",

            "vec4 taylorInvSqrt( vec4 r ) {",

                "return 1.79284291400159 - 0.85373472095314 * r;",

            "}",

            "float snoise( vec3 v ) {",

                "const vec2 C = vec2( 1.0 / 6.0, 1.0 / 3.0 );",
                "const vec4 D = vec4( 0.0, 0.5, 1.0, 2.0 );",

                "// First corner",

                "vec3 i  = floor( v + dot( v, C.yyy ) );",
                "vec3 x0 = v - i + dot( i, C.xxx );",

                "// Other corners",

                "vec3 g = step( x0.yzx, x0.xyz );",
                "vec3 l = 1.0 - g;",
                "vec3 i1 = min( g.xyz, l.zxy );",
                "vec3 i2 = max( g.xyz, l.zxy );",

                "vec3 x1 = x0 - i1 + 1.0 * C.xxx;",
                "vec3 x2 = x0 - i2 + 2.0 * C.xxx;",
                "vec3 x3 = x0 - 1. + 3.0 * C.xxx;",

                "// Permutations",

                "i = mod( i, 289.0 );",
                "vec4 p = permute( permute( permute(",
                        " i.z + vec4( 0.0, i1.z, i2.z, 1.0 ) )",
                       "+ i.y + vec4( 0.0, i1.y, i2.y, 1.0 ) )",
                       "+ i.x + vec4( 0.0, i1.x, i2.x, 1.0 ) );",

                "// Gradients",
                "// ( N*N points uniformly over a square, mapped onto an octahedron.)",

                "float n_ = 1.0 / 7.0; // N=7",

                "vec3 ns = n_ * D.wyz - D.xzx;",

                "vec4 j = p - 49.0 * floor( p * ns.z *ns.z );  //  mod(p,N*N)",

                "vec4 x_ = floor( j * ns.z );",
                "vec4 y_ = floor( j - 7.0 * x_ );    // mod(j,N)",

                "vec4 x = x_ *ns.x + ns.yyyy;",
                "vec4 y = y_ *ns.x + ns.yyyy;",
                "vec4 h = 1.0 - abs( x ) - abs( y );",

                "vec4 b0 = vec4( x.xy, y.xy );",
                "vec4 b1 = vec4( x.zw, y.zw );",


                "vec4 s0 = floor( b0 ) * 2.0 + 1.0;",
                "vec4 s1 = floor( b1 ) * 2.0 + 1.0;",
                "vec4 sh = -step( h, vec4( 0.0 ) );",

                "vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;",
                "vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;",

                "vec3 p0 = vec3( a0.xy, h.x );",
                "vec3 p1 = vec3( a0.zw, h.y );",
                "vec3 p2 = vec3( a1.xy, h.z );",
                "vec3 p3 = vec3( a1.zw, h.w );",

                "// Normalise gradients",

                "vec4 norm = taylorInvSqrt( vec4( dot( p0, p0 ), dot( p1, p1 ), dot( p2, p2 ), dot( p3, p3 ) ) );",
                "p0 *= norm.x;",
                "p1 *= norm.y;",
                "p2 *= norm.z;",
                "p3 *= norm.w;",

                "// Mix final noise value",

                "vec4 m = max( 0.6 - vec4( dot( x0, x0 ), dot( x1, x1 ), dot( x2, x2 ), dot( x3, x3 ) ), 0.0 );",
                'm = m * m;',
                "return 42.0 * dot( m*m, vec4( dot( p0, x0 ), dot( p1, x1 ),",
                                              "dot( p2, x2 ), dot( p3, x3 ) ) );",

            "}",

            "float surface3( vec3 coord ) {",

                "float n = 0.0;",

                "n += 1.0 * abs( snoise( coord ) );",
                "n += 0.5 * abs( snoise( coord * 2.0 ) );",
                "n += 0.25 * abs( snoise( coord * 4.0 ) );",
                "n += 0.125 * abs( snoise( coord * 8.0 ) );",

                "return n;",

            "}",

            "void main( void ) {",

                "vec3 coord = vec3( vUv, -time );",
                "float n = surface3( coord );",

                "gl_FragColor = vec4( vec3( n, n, n ), 1.0 );",

            "}"

        ].join("\n"),

        vertexShader: [

            "varying vec2 vUv;",
            "uniform vec2 scale;",
            "uniform vec2 offset;",

            "void main( void ) {",

                "vUv = uv * scale + offset;",
                "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

            "}",

        ].join("\n")

    }

};

TERRAIN.LuminosityShader = {

    uniforms: {

        "tDiffuse": { type: "t", value: null }

    },

    vertexShader: [

        "varying vec2 vUv;",

        "void main() {",

            "vUv = uv;",

            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

        "}"

    ].join("\n"),

    fragmentShader: [

        "uniform sampler2D tDiffuse;",

        "varying vec2 vUv;",

        "void main() {",

            "vec4 texel = texture2D( tDiffuse, vUv );",

            "vec3 luma = vec3( 0.299, 0.587, 0.114 );",

            "float v = dot( texel.xyz, luma );",

            "gl_FragColor = vec4( v, v, v, texel.w );",

        "}"

    ].join("\n")

};

TERRAIN.ShaderTerrain = {};
TERRAIN.initShader = function( ){
     TERRAIN.ShaderTerrain = {

    /* -------------------------------------------------------------------------
    //  Dynamic terrain shader
    //      - Blinn-Phong
    //      - height + normal + diffuse1 + diffuse2 + specular + detail maps
    //      - point, directional and hemisphere lights (use with "lights: true" material option)
    //      - shadow maps receiving
     ------------------------------------------------------------------------- */

    'terrain' : {

        uniforms: THREE.UniformsUtils.merge( [

            THREE.UniformsLib[ "fog" ],
            THREE.UniformsLib[ "lights" ],
            THREE.UniformsLib[ "shadowmap" ],

            {

                "oceanTexture"  : { type: "t", value: null },
                "sandyTexture"  : { type: "t", value: null },
                "grassTexture"  : { type: "t", value: null },
                "rockyTexture"  : { type: "t", value: null },
                "snowyTexture"  : { type: "t", value: null },

                "enableDiffuse1"  : { type: "i", value: 0 },
                "enableDiffuse2"  : { type: "i", value: 0 },
                "enableSpecular"  : { type: "i", value: 0 },
                "enableReflection": { type: "i", value: 0 },

                "tDiffuse1"    : { type: "t", value: null },
                "tDiffuse2"    : { type: "t", value: null },
                "tDetail"      : { type: "t", value: null },
                "tNormal"      : { type: "t", value: null },
                "tSpecular"    : { type: "t", value: null },
                "tDisplacement": { type: "t", value: null },

                "uNormalScale": { type: "f", value: 1.0 },

                "uDisplacementBias": { type: "f", value: 0.0 },
                "uDisplacementScale": { type: "f", value: 1.0 },

                "diffuse": { type: "c", value: new THREE.Color( 0xeeeeee ) },
                "specular": { type: "c", value: new THREE.Color( 0x111111 ) },
                "ambient": { type: "c", value: new THREE.Color( 0x050505 ) },
                "shininess": { type: "f", value: 30 },
                "opacity": { type: "f", value: 1 },

                //"vAmount": { type: "f", value: 30 },

                "uRepeatBase"    : { type: "v2", value: new THREE.Vector2( 1, 1 ) },
                "uRepeatOverlay" : { type: "v2", value: new THREE.Vector2( 1, 1 ) },

                "uOffset" : { type: "v2", value: new THREE.Vector2( 0, 0 ) }

            }

        ] ),

        fragmentShader: [
            "uniform sampler2D oceanTexture;",
            "uniform sampler2D sandyTexture;",
            "uniform sampler2D grassTexture;",
            "uniform sampler2D rockyTexture;",
            "uniform sampler2D snowyTexture;",

            "varying float vAmount;",

            "uniform vec3 ambient;",
            "uniform vec3 diffuse;",
            "uniform vec3 specular;",
            "uniform float shininess;",
            "uniform float opacity;",

            "uniform bool enableDiffuse1;",
            "uniform bool enableDiffuse2;",
            "uniform bool enableSpecular;",

            "uniform sampler2D tDiffuse1;",
            "uniform sampler2D tDiffuse2;",
            "uniform sampler2D tDetail;",
            "uniform sampler2D tNormal;",
            "uniform sampler2D tSpecular;",
            "uniform sampler2D tDisplacement;",

            "uniform float uNormalScale;",

            "uniform vec2 uRepeatOverlay;",
            "uniform vec2 uRepeatBase;",

            "uniform vec2 uOffset;",

            "varying vec3 vTangent;",
            "varying vec3 vBinormal;",
            "varying vec3 vNormal;",
            "varying vec2 vUv;",

            "uniform vec3 ambientLightColor;",

            "#if MAX_DIR_LIGHTS > 0",

                "uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];",
                "uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];",

            "#endif",

            "#if MAX_HEMI_LIGHTS > 0",

                "uniform vec3 hemisphereLightSkyColor[ MAX_HEMI_LIGHTS ];",
                "uniform vec3 hemisphereLightGroundColor[ MAX_HEMI_LIGHTS ];",
                "uniform vec3 hemisphereLightDirection[ MAX_HEMI_LIGHTS ];",

            "#endif",

            "#if MAX_POINT_LIGHTS > 0",

                "uniform vec3 pointLightColor[ MAX_POINT_LIGHTS ];",
                "uniform vec3 pointLightPosition[ MAX_POINT_LIGHTS ];",
                "uniform float pointLightDistance[ MAX_POINT_LIGHTS ];",

            "#endif",

            "varying vec3 vViewPosition;",

            THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
            THREE.ShaderChunk[ "fog_pars_fragment" ],

            "void main() {",

                "vec2 uvOverlay = uRepeatOverlay * vUv + uOffset;",
                "vec2 uvBase = uRepeatBase * vUv;",

                "vec4 water = (smoothstep(0.01, 0.20, vAmount) - smoothstep(0.24, 0.26, vAmount)) * texture2D( oceanTexture, uvOverlay );",
                "vec4 sandy = (smoothstep(0.10, 0.27, vAmount) - smoothstep(0.28, 0.31, vAmount)) * texture2D( sandyTexture, uvOverlay );", //vec2( 20,20 ) * vUv + uOffset
                "vec4 grass = (smoothstep(0.28, 0.40, vAmount) - smoothstep(0.35, 0.40, vAmount)) * texture2D( grassTexture, uvOverlay );",
                "vec4 rocky = (smoothstep(0.30, 0.76, vAmount) - smoothstep(0.40, 0.70, vAmount)) * texture2D( rockyTexture, uvOverlay );",
                "vec4 snowy = (smoothstep(0.80, 0.99, vAmount))                                   * texture2D( snowyTexture, uvOverlay );",

                "gl_FragColor = vec4( vec3( 1.0 ), opacity );",

                "vec3 specularTex = vec3( 1.0 );",

                

                "vec3 normalTex = texture2D( tDetail, uvOverlay ).xyz * 2.0 - 1.0;",
                "normalTex.xy *= uNormalScale;",
                "normalTex = normalize( normalTex );",

                

                "if( enableDiffuse1 && enableDiffuse2 ) {",

                    "vec4 colDiffuse1 = texture2D( tDiffuse1, uvOverlay );",
                    "vec4 colDiffuse2 = texture2D( tDiffuse2, uvOverlay );",

                    "#ifdef GAMMA_INPUT",

                        "colDiffuse1.xyz *= colDiffuse1.xyz;",
                        "colDiffuse2.xyz *= colDiffuse2.xyz;",

                    "#endif",

                    //"gl_FragColor = gl_FragColor * mix ( colDiffuse1, colDiffuse2, 1.0 - texture2D( tDisplacement, uvBase ) );",
                    "gl_FragColor = gl_FragColor * mix ( colDiffuse1, colDiffuse2, 1.0 - texture2D( tDisplacement, uvBase ) )+ water + sandy + grass + rocky + snowy;",
                    //"gl_FragColor = vec4( gl_FragColor.xyz, 1.0 )+ water + sandy + grass + rocky + snowy;",

                " } else if( enableDiffuse1 ) {",

                    "gl_FragColor = gl_FragColor * texture2D( tDiffuse1, uvOverlay );",
                    //"gl_FragColor = gl_FragColor * texture2D( tDiffuse1, uvOverlay ) + water + sandy + grass + rocky + snowy;",
                    //"gl_FragColor = gl_FragColor * mix ( tDiffuse1, water + sandy + grass + rocky + snowy, 1.0 - texture2D( tDisplacement, uvBase ) );",

                "} else if( enableDiffuse2 ) {",

                    "gl_FragColor = gl_FragColor * texture2D( tDiffuse2, uvOverlay );",

                "}",

                "if( enableSpecular )",
                    "specularTex = texture2D( tSpecular, uvOverlay ).xyz;",

                "mat3 tsb = mat3( vTangent, vBinormal, vNormal );",
                "vec3 finalNormal = tsb * normalTex;",

                "vec3 normal = normalize( finalNormal );",
                "vec3 viewPosition = normalize( vViewPosition );",

                // point lights

                "#if MAX_POINT_LIGHTS > 0",

                    "vec3 pointDiffuse = vec3( 0.0 );",
                    "vec3 pointSpecular = vec3( 0.0 );",

                    "for ( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {",

                        "vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );",
                        "vec3 lVector = lPosition.xyz + vViewPosition.xyz;",

                        "float lDistance = 1.0;",
                        "if ( pointLightDistance[ i ] > 0.0 )",
                            "lDistance = 1.0 - min( ( length( lVector ) / pointLightDistance[ i ] ), 1.0 );",

                        "lVector = normalize( lVector );",

                        "vec3 pointHalfVector = normalize( lVector + viewPosition );",
                        "float pointDistance = lDistance;",

                        "float pointDotNormalHalf = max( dot( normal, pointHalfVector ), 0.0 );",
                        "float pointDiffuseWeight = max( dot( normal, lVector ), 0.0 );",

                        "float pointSpecularWeight = specularTex.r * max( pow( pointDotNormalHalf, shininess ), 0.0 );",

                        "pointDiffuse += pointDistance * pointLightColor[ i ] * diffuse * pointDiffuseWeight;",
                        "pointSpecular += pointDistance * pointLightColor[ i ] * specular * pointSpecularWeight * pointDiffuseWeight;",

                    "}",

                "#endif",

                // directional lights

                "#if MAX_DIR_LIGHTS > 0",

                    "vec3 dirDiffuse = vec3( 0.0 );",
                    "vec3 dirSpecular = vec3( 0.0 );",

                    "for( int i = 0; i < MAX_DIR_LIGHTS; i++ ) {",

                        "vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );",

                        "vec3 dirVector = normalize( lDirection.xyz );",
                        "vec3 dirHalfVector = normalize( dirVector + viewPosition );",

                        "float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );",
                        "float dirDiffuseWeight = max( dot( normal, dirVector ), 0.0 );",

                        "float dirSpecularWeight = specularTex.r * max( pow( dirDotNormalHalf, shininess ), 0.0 );",

                        "dirDiffuse += directionalLightColor[ i ] * diffuse * dirDiffuseWeight;",
                        "dirSpecular += directionalLightColor[ i ] * specular * dirSpecularWeight * dirDiffuseWeight;",

                    "}",

                "#endif",

                // hemisphere lights

                "#if MAX_HEMI_LIGHTS > 0",

                    "vec3 hemiDiffuse  = vec3( 0.0 );",
                    "vec3 hemiSpecular = vec3( 0.0 );" ,

                    "for( int i = 0; i < MAX_HEMI_LIGHTS; i ++ ) {",

                        "vec4 lDirection = viewMatrix * vec4( hemisphereLightDirection[ i ], 0.0 );",
                        "vec3 lVector = normalize( lDirection.xyz );",

                        // diffuse

                        "float dotProduct = dot( normal, lVector );",
                        "float hemiDiffuseWeight = 0.5 * dotProduct + 0.5;",

                        "hemiDiffuse += diffuse * mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeight );",

                        // specular (sky light)

                        "float hemiSpecularWeight = 0.0;",

                        "vec3 hemiHalfVectorSky = normalize( lVector + viewPosition );",
                        "float hemiDotNormalHalfSky = 0.5 * dot( normal, hemiHalfVectorSky ) + 0.5;",
                        "hemiSpecularWeight += specularTex.r * max( pow( hemiDotNormalHalfSky, shininess ), 0.0 );",

                        // specular (ground light)

                        "vec3 lVectorGround = -lVector;",

                        "vec3 hemiHalfVectorGround = normalize( lVectorGround + viewPosition );",
                        "float hemiDotNormalHalfGround = 0.5 * dot( normal, hemiHalfVectorGround ) + 0.5;",
                        "hemiSpecularWeight += specularTex.r * max( pow( hemiDotNormalHalfGround, shininess ), 0.0 );",

                        "hemiSpecular += specular * mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeight ) * hemiSpecularWeight * hemiDiffuseWeight;",

                    "}",

                "#endif",

                // all lights contribution summation

                "vec3 totalDiffuse = vec3( 0.0 );",
                "vec3 totalSpecular = vec3( 0.0 );",

                "#if MAX_DIR_LIGHTS > 0",

                    "totalDiffuse += dirDiffuse;",
                    "totalSpecular += dirSpecular;",

                "#endif",

                "#if MAX_HEMI_LIGHTS > 0",

                    "totalDiffuse += hemiDiffuse;",
                    "totalSpecular += hemiSpecular;",

                "#endif",

                "#if MAX_POINT_LIGHTS > 0",

                    "totalDiffuse += pointDiffuse;",
                    "totalSpecular += pointSpecular;",

                "#endif",

                /*"vec4 water = (smoothstep(0.01, 0.25, vAmount) - smoothstep(0.24, 0.26, vAmount)) * texture2D( oceanTexture, vUv * 20.0 );",
                "vec4 sandy = (smoothstep(0.24, 0.27, vAmount) - smoothstep(0.28, 0.31, vAmount)) * texture2D( sandyTexture, vUv * 20.0 );",
                "vec4 grass = (smoothstep(0.28, 0.32, vAmount) - smoothstep(0.35, 0.40, vAmount)) * texture2D( grassTexture, vUv * 20.0 );",
                "vec4 rocky = (smoothstep(0.30, 0.50, vAmount) - smoothstep(0.40, 0.70, vAmount)) * texture2D( rockyTexture, vUv * 20.0 );",
                "vec4 snowy = (smoothstep(0.50, 0.65, vAmount))                                   * texture2D( snowyTexture, vUv * 20.0 );",*/

                //"vec2 uvOverlay = uRepeatOverlay * vUv + uOffset;",

                /*"vec4 water = (smoothstep(0.01, 0.25, vAmount) - smoothstep(0.24, 0.26, vAmount)) * texture2D( oceanTexture, uvOverlay );",
                "vec4 sandy = (smoothstep(0.24, 0.27, vAmount) - smoothstep(0.28, 0.31, vAmount)) * texture2D( sandyTexture, uvOverlay );", //vec2( 20,20 ) * vUv + uOffset
                "vec4 grass = (smoothstep(0.28, 0.32, vAmount) - smoothstep(0.35, 0.40, vAmount)) * texture2D( grassTexture, uvOverlay );",
                "vec4 rocky = (smoothstep(0.30, 0.50, vAmount) - smoothstep(0.40, 0.70, vAmount)) * texture2D( rockyTexture, uvOverlay );",
                "vec4 snowy = (smoothstep(0.50, 0.65, vAmount))                                   * texture2D( snowyTexture, uvOverlay );",*/

                //"gl_FragColor.xyz = gl_FragColor.xyz * ( totalDiffuse + ambientLightColor * ambient) + totalSpecular;",
                "gl_FragColor.xyz = gl_FragColor.xyz * ( totalDiffuse + ambientLightColor * ambient + totalSpecular );",
                //"gl_FragColor.xyz = gl_FragColor.xyz * ( totalDiffuse + ambientLightColor * ambient + totalSpecular );",
                //"vec4 finalTex       = (totalDiffuse + ambientLightColor * ambient + totalSpecular);",
                //"gl_FragColor = vec4( gl_FragColor.xyz, 1.0 )+ water + sandy + grass + rocky + snowy;",

                THREE.ShaderChunk[ "shadowmap_fragment" ],
                THREE.ShaderChunk[ "linear_to_gamma_fragment" ],
                THREE.ShaderChunk[ "fog_fragment" ],

            "}"

        ].join("\n"),

        vertexShader: [
            "varying float vAmount;",

            "attribute vec4 tangent;",

            "uniform vec2 uRepeatBase;",

            "uniform sampler2D tNormal;",

            "#ifdef VERTEX_TEXTURES",

                "uniform sampler2D tDisplacement;",
                "uniform float uDisplacementScale;",
                "uniform float uDisplacementBias;",

            "#endif",

            "varying vec3 vTangent;",
            "varying vec3 vBinormal;",
            "varying vec3 vNormal;",
            "varying vec2 vUv;",

            "varying vec3 vViewPosition;",

            THREE.ShaderChunk[ "shadowmap_pars_vertex" ],

            "void main() {",

                "vNormal = normalize( normalMatrix * normal );",

                // tangent and binormal vectors

                "vTangent = normalize( normalMatrix * tangent.xyz );",

                "vBinormal = cross( vNormal, vTangent ) * tangent.w;",
                "vBinormal = normalize( vBinormal );",

                // texture coordinates

                "vUv = uv;",

                'vec4 bumpData = texture2D( tDisplacement, uv );',
                'vAmount = bumpData.r;',

                "vec2 uvBase = uv * uRepeatBase;",

                // displacement mapping

                "#ifdef VERTEX_TEXTURES",

                    "vec3 dv = texture2D( tDisplacement, uvBase ).xyz;",
                    "float df = uDisplacementScale * dv.x + uDisplacementBias;",
                    "vec3 displacedPosition = normal * df + position;",

                    "vec4 worldPosition = modelMatrix * vec4( displacedPosition, 1.0 );",
                    "vec4 mvPosition = modelViewMatrix * vec4( displacedPosition, 1.0 );",

                "#else",

                    "vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
                    "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",

                "#endif",

                "gl_Position = projectionMatrix * mvPosition;",

                "vViewPosition = -mvPosition.xyz;",

                "vec3 normalTex = texture2D( tNormal, uvBase ).xyz * 2.0 - 1.0;",
                "vNormal = normalMatrix * normalTex;",

                THREE.ShaderChunk[ "shadowmap_vertex" ],

            "}"

        ].join("\n")

    }

};
}
