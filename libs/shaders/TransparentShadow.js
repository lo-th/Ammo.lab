

var TransparentShadow = function ( color, opacity ) {

    color = color || 0x040205;
    opacity = opacity || 0.3;
    //THREE.ShaderMaterial.call( this, parameters );
    //this.type = 'TransparentShadow';

    var fragment = [

    "uniform vec3 diffuse;",
    "uniform float opacity;",

    "#ifndef FLAT_SHADED",

    "   varying vec3 vNormal;",

    "#endif",

    THREE.ShaderChunk[ "common" ],
    //THREE.ShaderChunk[ "color_pars_fragment" ],
    THREE.ShaderChunk[ "uv_pars_fragment" ],
   // THREE.ShaderChunk[ "uv2_pars_fragment" ],
    //THREE.ShaderChunk[ "map_pars_fragment" ],
    THREE.ShaderChunk[ "alphamap_pars_fragment" ],
    //THREE.ShaderChunk[ "aomap_pars_fragment" ],
    //THREE.ShaderChunk[ "envmap_pars_fragment" ],
    //THREE.ShaderChunk[ "fog_pars_fragment" ],
    THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
    //THREE.ShaderChunk[ "specularmap_pars_fragment" ],
    THREE.ShaderChunk[ "logdepthbuf_pars_fragment" ],

    "void main() {",

    "   vec4 diffuseColor = vec4( diffuse, opacity );",

        THREE.ShaderChunk[ "logdepthbuf_fragment" ],
      //  THREE.ShaderChunk[ "map_fragment" ],
       // THREE.ShaderChunk[ "color_fragment" ],
        THREE.ShaderChunk[ "alphamap_fragment" ],
        THREE.ShaderChunk[ "alphatest_fragment" ],
     //   THREE.ShaderChunk[ "specularmap_fragment" ],

    //"   ReflectedLight reflectedLight;",
    //"   reflectedLight.directDiffuse = vec3( 0.0 );",
    //"   reflectedLight.directSpecular = vec3( 0.0 );",
    //"   reflectedLight.indirectDiffuse = diffuseColor.rgb;",
    //"   reflectedLight.indirectSpecular = vec3( 0.0 );",

       //THREE.ShaderChunk[ "aomap_fragment" ],
        THREE.ShaderChunk[ "shadowmap_fragment" ],

      //  "reflectedLight.indirectDiffuse *= shadowMask;",

       //"vec3 outgoingLight = vec3( 0.0 );",//reflectedLight.indirectDiffuse;",

        //THREE.ShaderChunk[ "envmap_fragment" ],
       // THREE.ShaderChunk[ "linear_to_gamma_fragment" ],
        //THREE.ShaderChunk[ "fog_fragment" ],

    //"   gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
    "   gl_FragColor = vec4( diffuseColor.xyz, diffuseColor.a - shadowMask );",

    "}"

].join( "\n" );

    var mat = new THREE.ShaderMaterial({
        uniforms: THREE.ShaderLib['basic'].uniforms,
        vertexShader: THREE.ShaderLib['basic'].vertexShader,
        fragmentShader: fragment,
        transparent:true,
        depthWrite: false, 
        fog:false
    });

    mat.uniforms.diffuse.value = new THREE.Color(color);
    mat.uniforms.opacity.value = opacity;

    return mat; 

}
