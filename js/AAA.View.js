/**   _     _   _     
*    | |___| |_| |__
*    | / _ \  _|    |
*    |_\___/\__|_||_|
*    @author LoTh /http://3dflashlo.wordpress.com/
*/

// THREE for ammo.js
// use 1 three unit for 1 meter 

var AAA={ REVISION: 0.2 };

//-----------------------------------------------------
// 3D VIEW
//-----------------------------------------------------

AAA.View = function(Themes){
    this.container = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.center = null;
    this.content = null;
    this.clock = null;
    this.lights = null;
    this.ground = null;
    this.terrain = null;
    this.postEffect = null;

    this.cars = [];
    this.objs = [];

    this.cam = { fov:50, horizontal: 90, vertical: 70, distance: 30, automove: false };
    this.mouse = { ox:0, oy:0, h:0, v:0, rx:0, ry:0, dx:0, dy:0, down:false, moving:false, ray:false, direction:false };
    this.viewSize = { w:window.innerWidth, h:window.innerHeight, mw:1, mh:1};
    this.key = [0,0,0,0,0,0,0];

    this.themes = Themes || ['1d1f20', '2f3031', '424344', '68696b'];
    this.bgColor = parseInt("0x" + this.themes[0]);
    this.debugColor = parseInt("0x" + this.themes[2]);
    this.debugAlpha = 0.3;

    this.isShadow = false;
    this.isSketch = false;

    this.mats = [];
    this.geos = [];
    this.geoBasic = [];

    this.tt = [0 , 0];

    // for draw sketch
    this.tx01 = THREE.ImageUtils.loadTexture('images/sketch/noise2.png');
    this.tx02 = THREE.ImageUtils.loadTexture('images/sketch/paper.jpg');

    this.init();
}

AAA.View.prototype = {
    constructor: AAA.View,
    init:function(){
        this.container = document.getElementById("container");

        this.renderer = new THREE.WebGLRenderer( {precision: "lowp", antialias: false, alpha:false } );
        this.renderer.setSize( this.viewSize.w, this.viewSize.h );
        this.renderer.setClearColor( this.bgColor, 1 );
        //this.renderer.sortObjects = false;
        //this.renderer.autoClear = false;
        //this.renderer.autoClearStencil = false;
        this.renderer.gammaInput = true;
        this.renderer.gammaOutput = true;
        this.renderer.shadowMapEnabled = this.isShadow;
        this.renderer.shadowMapType = THREE.BasicShadowMap;
        //this.container.appendChild( this.renderer.domElement );

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera( this.cam.fov, this.viewSize.w / this.viewSize.h, 0.1, 2000 );
        this.center = new THREE.Vector3();
        this.moveCamera();

        this.scene.add( this.camera );

        this.content = new THREE.Object3D();
        this.scene.add(this.content);

        this.clock = new THREE.Clock();

        this.lights = [];

        this.lights[0] = new THREE.AmbientLight( this.bgColor );
        
        this.lights[1] = new THREE.DirectionalLight( 0xffffff, 2 );
        this.lights[1].position.set( 100, 300, 50 );
        this.lights[1].castShadow = this.isShadow;
        this.lights[1].shadowMapWidth = this.lights[1].shadowMapHeight = 512;

        this.lights[2] = new THREE.PointLight( 0xAACCff, 3);
        this.lights[2].position.set(0, 0, 0);

        var i = this.lights.length;
        while(i--){
            this.scene.add(this.lights[i]);
        }

        var groundMat = new THREE.MeshBasicMaterial( { color: this.bgColor, transparent:true, opacity:this.debugAlpha } );
        var groundGeo = THREE.BufferGeometryUtils.fromGeometry( new THREE.PlaneGeometry( 1, 1 ) );
        groundGeo.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
        this.ground = new THREE.Mesh( groundGeo, groundMat );
        this.ground.position.y = -0.1
        this.ground.castShadow = false;
        this.ground.receiveShadow = true;
        this.scene.add( this.ground );

        var body = document.body;
        var _this = this;
        window.addEventListener( 'resize', function(e) { _this.resize() }, false );
        this.container.addEventListener( 'mousemove', function(e) { _this.onMouseMove(e) }, false );
        this.container.addEventListener( 'mousedown',  function(e) { _this.onMouseDown(e) }, false );
        this.container.addEventListener( 'mouseout', function(e) { _this.onMouseUp(e) }, false );
        this.container.addEventListener( 'mouseup', function(e) { _this.onMouseUp(e); if(Editor.getOpen())Editor.close();  }, false );
        document.addEventListener( 'keydown', function(e) { _this.onKeyDown(e) }, false );
        document.addEventListener( 'keyup', function(e) { _this.onKeyUp(e) }, false );
        if( body.addEventListener ){
            body.addEventListener( 'mousewheel', function(e) { _this.onMouseWheel(e) }, false ); //chrome
            body.addEventListener( 'DOMMouseScroll', function(e) { _this.onMouseWheel(e) }, false ); // firefox
        }else if( body.attachEvent ){
            body.attachEvent("onmousewheel" , function(e) { _this.onMouseWheel(e) }); // ie
        }

        this.initSkyAndMat();
        this.initBasicGeometry();
    },
    sketchMode:function(){
        if(this.isSketch){
            this.renderer.setClearColor( this.bgColor, 1);
            this.ground.material.color.setHex(  this.bgColor );
            this.mats[1].color.setHex( 0xFF0505 );
            this.mats[1].reflectivity =0.8;
            this.mats[2].reflectivity =0.8;
            this.postEffect.clear();
            this.isSketch = false;
        } else{
            this.renderer.setClearColor(0xffffff, 1);
            this.ground.material.color.setHex( 0xffffff );
            this.mats[1].color.setHex( 0xffffff );
            this.mats[1].reflectivity =1;
            this.mats[2].reflectivity =0.3;
            this.postEffect = new AAA.PostEffect(this);
            this.postEffect.init();
            this.isSketch = true;
        }
    },
    initBasicGeometry:function(){
        this.geoBasic[0] = THREE.BufferGeometryUtils.fromGeometry(new THREE.CubeGeometry( 1, 1, 1 ))
        this.geoBasic[1] = THREE.BufferGeometryUtils.fromGeometry(new THREE.SphereGeometry( 1, 20, 16  ));
        this.geoBasic[2] = THREE.BufferGeometryUtils.fromGeometry(new THREE.CylinderGeometry( 0, 1, 1, 20, 1 ));//cone
    },
    initSkyAndMat:function(){
        var path = "images/sky/";
        var format = '.jpg';
        var urls = [
            path + 'px' + format, path + 'nx' + format,
            path + 'py' + format, path + 'ny' + format,
            path + 'pz' + format, path + 'nz' + format
        ];

        this.sky = THREE.ImageUtils.loadTextureCube( urls );

        this.mats[0] = new THREE.MeshBasicMaterial({ color: 0x101010, reflectivity:0.8, envMap:this.sky, combine:THREE.MixOperation });
        this.mats[1] = new THREE.MeshBasicMaterial({ color: 0xFF0505, reflectivity:0.8, envMap:this.sky, combine:THREE.MixOperation, name:"red" });
        this.mats[2] = new THREE.MeshBasicMaterial({ color: 0x0505FF, reflectivity:0.8, envMap:this.sky, combine:THREE.MixOperation, name:"blue" });
    },
    render:function(){
        var delta = this.clock.getDelta();
        if( this.terrain !== null  ) this.terrain.update(delta);
        if(this.isSketch) this.postEffect.render();
        else this.renderer.render( this.scene, this.camera );
        var last = Date.now();
        if (last - 1000 > this.tt[0]) { this.tt[0] = last; this.fps = this.tt[1]; this.tt[1] = 0; } this.tt[1]++;
    },
    resize:function(){
        this.viewSize.w = window.innerWidth; 
        this.viewSize.h = window.innerHeight;

        this.renderer.setSize( this.viewSize.w*this.viewSize.mw, this.viewSize.h*this.viewSize.mh );
        this.camera.aspect = ( this.viewSize.w*this.viewSize.mw ) / ( this.viewSize.h*this.viewSize.mh );
        this.camera.updateProjectionMatrix();

        if(this.isSketch) this.postEffect.resize();
    },
    clearAll:function (){
        if(this.terrain!== null){ this.terrain.clear(); this.terrain = null; }
        var i = this.content.children.length;
        while (i--) {
            this.content.remove(this.content.children[ i ]);
        }

        this.cars.length = 0;
        this.objs.length = 0;
    },
    moveCamera:function(){
        this.camera.position.copy(AAA.Orbit(this.center, this.cam.horizontal, this.cam.vertical, this.cam.distance));
        this.camera.lookAt(this.center);
    },
    onMouseDown:function(e){
        e.preventDefault();
        this.mouse.ox = e.clientX;
        this.mouse.oy = e.clientY;
        this.mouse.h = this.cam.horizontal;
        this.mouse.v = this.cam.vertical;
        this.mouse.down = true;
    },
    onMouseUp:function(e){
        this.mouse.down = false;
        document.body.style.cursor = 'auto';
    },
    onMouseMove:function(e){
        e.preventDefault();
        if( this.mouse.ray ){
            this.mouse.rx = ( e.clientX / this.viewSize.w ) * 2 - 1;
            this.mouse.ry = -( e.clientY / this.viewSize.h ) * 2 + 1;
            //this.rayTest();
        }
        if( this.mouse.down ) {
            document.body.style.cursor = 'move';
            this.cam.horizontal = ((e.clientX - this.mouse.ox) * 0.3) + this.mouse.h;
            this.cam.vertical = (-(e.clientY - this.mouse.oy) * 0.3) + this.mouse.v;
            this.moveCamera();
        }
        if(this.mouse.direction){
            this.mouse.dx = (e.clientX - this.viewSize.w*0.5);
            this.mouse.dy = (e.clientX - this.viewSize.h*0.5);
        }
    },
    onMouseWheel:function(e){
        e.preventDefault();
        var delta = 0;
        if(e.wheelDelta){delta=e.wheelDelta*-1;}
        else if(e.detail){delta=e.detail*20;}
        this.cam.distance+=(delta/100);
        this.moveCamera(); 
    },
    addCar:function(obj){
        this.cars[this.cars.length] = new AAA.Car(obj, this);
    },
    addObj:function(obj){
        this.objs[this.objs.length] = new AAA.Obj(obj, this);
    },
    getVertex:function(name, size) {
        var v = [], n;
        var pp =  this.getGeoByName(name).vertices;
        var i = pp.length;
        while(i--){
            n = i*3;
            v[n+0]=pp[i].x*size[0];
            v[n+1]=pp[i].y*size[1];
            v[n+2]=pp[i].z*size[2];
        }
        return v;
    },
    getFaces:function(name, size) {
        var v = [], n, face, va, vb, vc;
        var geo = this.getGeoByName(name);
        var pp = geo.faces;
        var pv = geo.vertices;
        var i = pp.length;
        while(i--){
            n = i*9; face = pp[i];
            va = pv[face.a]; vb = pv[face.b]; vc = pv[face.c];
            v[n+0]=va.x*size[0]; v[n+1]=va.y*size[1]; v[n+2]=va.z*size[2];
            v[n+3]=vb.x*size[0]; v[n+4]=vb.y*size[1]; v[n+5]=vb.z*size[2];
            v[n+6]=vc.x*size[0]; v[n+7]=vc.y*size[1]; v[n+8]=vc.z*size[2];
        }
        return v;
    },
    getGeoByName:function(name, Buffer) {
        var g;
        var i = this.geos.length;
        var buffer = Buffer || false;
        while(i--){
            if(name==this.geos[i].name) g=this.geos[i];
        }
        if(buffer) g = THREE.BufferGeometryUtils.fromGeometry(g);
        return g
    },
    onKeyDown:function( e ) {
        var key = this.key;
        switch ( e.keyCode ) {
            case 38: case 87: case 90: key[0]=1; break; // up, W, Z
            case 40: case 83: key[1]=1; break;          // down, S
            case 37: case 65: case 81: key[2]=1; break; // left, A, Q
            case 39: case 68: key[3]=1; break;          // right, D
            case 17: case 67: key[4]=1; break;          // ctrl, c
            case 32: key[5]=1; break;                   // space
            case 96:case 48: key[6]=0; break; //0
            case 97:case 49: key[6]=1; break; //1
            case 98:case 50: key[6]=2; break; //2
            case 99:case 51: key[6]=3; break; //3
            case 100:case 52: key[6]=4; break; //4
            case 101:case 53: key[6]=5; break; //5
            case 102:case 54: key[6]=6; break; //6
            case 103:case 55: key[6]=7; break; //7
            case 104:case 56: key[6]=8; break; //8
            case 105:case 57: key[6]=9; break; //9
        }
        KEY(key);
    },
    onKeyUp:function( e ) {
        var key = this.key;
        switch( e.keyCode ) {
            case 38: case 87: case 90: key[0]=0; break; // up, W, Z
            case 40: case 83: key[1]=0; break;          // down, S
            case 37: case 65: case 81: key[2]=0; break; // left, A, Q
            case 39: case 68: key[3]=0; break;          // right, D
            case 17: case 67: key[4]=0; break;          // ctrl, c
            case 32: key[5]=0; break;                   // space
        }
        KEY(key);
    }
}



//-----------------------------------------------------
// MATH
//-----------------------------------------------------

AAA.ToRad = Math.PI / 180;

AAA.Orbit = function(origine, horizontal, vertical, distance) {
    var p = new THREE.Vector3();
    var phi = vertical*AAA.ToRad;
    var theta = horizontal*AAA.ToRad;
    p.x = (distance * Math.sin(phi) * Math.cos(theta)) + origine.x;
    p.z = (distance * Math.sin(phi) * Math.sin(theta)) + origine.z;
    p.y = (distance * Math.cos(phi)) + origine.y;
    return p;
}

//-----------------------------------------------------
// AAA OBJECT
//-----------------------------------------------------

AAA.Obj = function(obj, Parent){
    this.parent = Parent;
    var size = obj.size || [1,1,1];
    var div = obj.div || [64,64];
    var pos = obj.pos || [0,0,0];
    var mesh, helper;
    var shadow = true;

    switch(obj.type){
        case 'plane': mesh = new THREE.Object3D(); break;
        case 'boxbasic': case 'ground':
            mesh = new THREE.BoxHelper();
            mesh.material.color.set( this.parent.debugColor );
            mesh.material.opacity = this.parent.debugAlpha;
            mesh.material.transparent = true;
            mesh.matrixWorld = new THREE.Matrix4();
            mesh.scale.set( size[0]*0.5, size[1]*0.5, size[2]*0.5 );
            mesh.matrixAutoUpdate = true;
            shadow = false;
        break;
        case 'box':
            mesh = new THREE.Mesh( this.parent.getGeoByName("smoothCube", true), this.parent.mats[1] );
            mesh.scale.set( size[0], size[1], size[2] );
        break;
        case 'sphere':
            mesh = new THREE.Mesh( this.parent.geoBasic[1], this.parent.mats[1] );
            mesh.scale.set( size[0], size[0], size[0] );
        break;
        case 'cylinder':
            mesh = new THREE.Mesh( this.parent.getGeoByName("smoothCylinder", true), this.parent.mats[1] );
            mesh.scale.set( size[0], size[1], size[2] );
        break;
        case 'dice':
            mesh = new THREE.Mesh( this.parent.getGeoByName("dice", true), this.parent.mats[1] );
            mesh.scale.set( size[0], size[1], size[2] );
        break;
        case 'cone': 
            mesh = new THREE.Mesh( this.parent.geoBasic[2], this.parent.mats[1] );
            mesh.scale.set( size[0], size[1]*0.5, size[0] );
        break;
        case 'capsule':
            mesh = new THREE.Mesh( new AAA.CapsuleGeometry(size[0], size[1]*0.5), this.parent.mats[1] );
        break;
        case 'mesh': 
            mesh = new THREE.Mesh( this.parent.getGeoByName(obj.name, true), this.parent.mats[1] );
            mesh.scale.set( size[0], size[1], size[2] );
        break;
        case 'convex':
            mesh = new THREE.Mesh(this.parent.getGeoByName(obj.name, true), this.parent.mats[1] );
            mesh.scale.set( size[0], size[1], size[2] );
        break;
        case 'terrain': 
            this.parent.terrain = new TERRAIN.Generate( div, size );
            this.parent.terrain.init( window.innerWidth, window.innerHeight );
            this.parent.terrain.anim();// active morph
            mesh = this.parent.terrain.container;
            shadow = false;
        break;
    }

    if(shadow){
       mesh.castShadow = true;
       mesh.receiveShadow = true;
    }

    if(obj.type == 'ground'){// ground shadow
        this.parent.ground.scale.set( size[0], 1, size[2] );
        this.parent.ground.position.set( pos[0], pos[1]+(size[1]*0.5), pos[2]);
        if(obj.rot)this.parent.ground.rotation.set( (obj.rot[0])*AAA.ToRad, obj.rot[1]*AAA.ToRad, obj.rot[2]*AAA.ToRad );
        else this.parent.ground.rotation.set(0,0,0);
    }

    this.parent.content.add(mesh);

    // out of view range 
    mesh.position.y = 20000;

    this.mesh = mesh;
}

AAA.Obj.prototype = {
    constructor: AAA.Obj,
    update:function(id){
        var n = id * 8;
        var mesh = this.mesh;

        if(mtx[n+0]==2){ if(mesh.material) if(mesh.material.name=="red") mesh.material = this.parent.mats[2]; }
        else {
            if(mesh.material) if(mesh.material.name=="blue") mesh.material = this.parent.mats[1];
            
            mesh.quaternion.set( mtx[n+1], mtx[n+2], mtx[n+3], mtx[n+4] );
            mesh.position.set( mtx[n+5], mtx[n+6], mtx[n+7] );

            if(mtx[n+6]<-20){
                SET(id, {pos:[0, 3+Math.random()*10, 0]});
            }
        }
    }
}

AAA.CapsuleGeometry = function(radius, height, SRadius, SHeight) {
    var sRadius = SRadius || 20;
    var sHeight = SHeight || 10;
    var o0 = Math.PI*2;
    var o1 = Math.PI/2
    var geometry = new THREE.Geometry(); 
    var m0 = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, sRadius, 1, true));
    var m1 = new THREE.Mesh(new THREE.SphereGeometry(radius, sRadius, sHeight, 0, o0, 0, o1));
    var m2 = new THREE.Mesh(new THREE.SphereGeometry(radius, sRadius, sHeight, 0, o0, o1, o1));
    m1.position.set(0, height*0.5,0);
    m2.position.set(0,-height*0.5,0);
    THREE.GeometryUtils.merge(geometry, m0);
    THREE.GeometryUtils.merge(geometry, m1);
    THREE.GeometryUtils.merge(geometry, m2);
    return  THREE.BufferGeometryUtils.fromGeometry(geometry);
}

//-----------------------------------------------------
// AAA VEHICLE
//-----------------------------------------------------

AAA.Car = function(obj, Parent){
    this.parent = Parent;
    var size = obj.size || [10,5,20];
    var wPos = obj.wPos || [5,-5,10];
    var wRadius = obj.wRadius || 3;
    var wDeepth = obj.wDeepth || 2;
    var nWheels = obj.nWheels || 4;
    this.type = obj.type || 'c1gt';

    this.nWheels = nWheels;

    var wheelMesh;

    switch(this.type){

        case 'no':
            this.mesh = new THREE.Mesh( this.parent.getGeoByName("smoothCube", true), this.parent.mats[1] ) || obj.mesh;
            this.mesh.scale.set( size[0], size[1], size[2] );

            wheelMesh = new THREE.Mesh( this.parent.getGeoByName("smoothCylinder", true), this.parent.mats[2] ) || obj.wheel;
            wheelMesh.scale.set( wRadius, wDeepth, wRadius );
        break;
        case 'c1gt':
            this.mesh= new THREE.Object3D();
            var c = c1gt.car.clone();
            c.rotation.y = 180*AAA.ToRad;
            this.mesh.add(c);

            wheelMesh = c1gt.wheel;
            wRadius = 0.34;
            wDeepth = 0.26;
            size = [ 1.85,0.5,3.44];//1.465
            wPos = [0.79,0,1.2];
        break;
        case 'vision':
            this.mesh= new THREE.Object3D();
            var c = vision.car.clone();
            c.position.y = -0.33;
            this.mesh.add(c)

            wheelMesh = vision.wheel;
            wRadius = 0.38;
            
            wDeepth = 0.22
            //wheelMesh.scale.set( wRadius, wDeepth, wRadius );
            size = [1.9,0.5,4.6];//1.24
            wPos = [0.85,0,1.42];
        break;

    }
    this.mesh.position.y = 20000;
    //this.mesh.castShadow = true;
    //this.mesh.receiveShadow = true;

    this.wheels = [];

    var i = this.nWheels, w;
    while(i--){
        this.wheels[i] = new THREE.Object3D();
        w = wheelMesh.clone();
        w.castShadow = true;
        w.receiveShadow = true;
        if(this.type=='no')w.rotation.z = -Math.PI / 2;
        else if(this.type=='c1gt'){
            if(i==0 || i==3)w.rotation.z = 180*AAA.ToRad
        }else if(this.type=='vision'){
            if(i==1 || i==2)w.rotation.z = 180*AAA.ToRad
        }
        this.wheels[i].add(w);
        this.parent.content.add(this.wheels[i]);

        // out of view range 
        this.wheels[i].position.y = 20000;
    }

    this.parent.content.add(this.mesh);
    // out of view range 
    //this.mesh.position.y = 20000;

    obj.size = size;
    obj.wPos = wPos;
    obj.wRadius = wRadius;
    obj.wDeepth = wDeepth;
    obj.nWheels = nWheels;
}

AAA.Car.prototype = {
    constructor: AAA.Car,
    update:function(id){

        var m = mtxCar;
        var n = id * 40;

        this.mesh.position.set( m[n+5], m[n+6], m[n+7] );
        this.mesh.quaternion.set( m[n+1], m[n+2], m[n+3], m[n+4] );

        var i = this.nWheels, wm, w;
        while(i--){
            w = 8*(i+1);
            wm = this.wheels[i];
            wm.position.set( m[n+w+5], m[n+w+6], m[n+w+7] );
            wm.quaternion.set( m[n+w+1], m[n+w+2], m[n+w+3], m[n+w+4] );
        }
    }
}

//-----------------------------------------------------
// POST EFFECT
//-----------------------------------------------------

AAA.PostEffect = function(Parent){
    this.parent = Parent;
    this.composer = null;
    this.colorBuffer = null;
    this.blurBuffer = null;
    this.renderPass = null;
    this.shader = null;
    this.pass = null;
    this.parameters={minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, format:THREE.RGBFormat, stencilBuffer:false};
}
AAA.PostEffect.prototype = {
    constructor: AAA.PostEffect,
    init:function(){
        this.colorBuffer=new THREE.WebGLRenderTarget(1,1,this.parameters);
        //this.blurBuffer=new THREE.WebGLRenderTarget(1,1,parameters);
        this.composer= new THREE.EffectComposer(this.parent.renderer);
        this.renderPass = new THREE.RenderPass( this.parent.scene, this.parent.camera );
        this.composer.addPass( this.renderPass );
        this.shader={
            uniforms:{
                tDiffuse:{type:'t',value:null},
                tColor:{ type:'t',value:null},
                tBlur:{type:'t',value:null},
                tNoise:{type:'t',value:this.parent.tx01},
                tPaper:{type:'t',value:this.parent.tx02},
                resolution:{ type:'v2',value:new THREE.Vector2(1,1)}
            },
            vertexShader:vs_render,
            fragmentShader:fs_render
        }
        this.pass=new THREE.ShaderPass(this.shader);
        this.pass.renderToScreen=true;
        this.composer.addPass(this.pass);
        this.pass.uniforms.tNoise.value.needsUpdate=true;
        this.pass.uniforms.tPaper.value.needsUpdate=true;
        this.resize();
    },
    render:function(){
        if(this.pass && this.composer){
            this.parent.renderer.render(this.parent.scene, this.parent.camera, this.colorBuffer);
            this.pass.uniforms.tColor.value=this.colorBuffer;
            this.composer.render();
        }
    },
    resize:function(){
        var w = this.parent.viewSize.w* this.parent.viewSize.mw;
        var h = this.parent.viewSize.h* this.parent.viewSize.mh;
        this.composer.setSize(w,h);
        this.pass.uniforms.resolution.value.set(w,h);
        this.colorBuffer=new THREE.WebGLRenderTarget(w,h,this.parameters);
    },
    clear:function(){
        this.composer = null;
        this.colorBuffer = null;
        this.blurBuffer = null;
        this.renderPass = null;
        this.shader = null;
        this.pass = null;
    }
}
