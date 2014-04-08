/**   _     _   _     
*    | |___| |_| |__
*    | / _ \  _|    |
*    |_\___/\__|_||_|
*    @author LoTh /http://3dflashlo.wordpress.com/
*/

// THREE for ammo.js
// use 1 three unit for 1 meter 

var AAA={ REV: 0.1 };

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

    this.cars = [];
    this.objs = [];

    this.cam = { fov:50, horizontal: 90, vertical: 70, distance: 30, automove: false };
    this.mouse = { ox:0, oy:0, h:0, v:0, mx:0, my:0, down:false, over:false, moving:true };
    this.viewSize = { w:window.innerWidth, h:window.innerHeight, mw:1, mh:1};

    this.themes = Themes || ['1d1f20', '2f3031', '424344', '68696b'];
    this.bgColor = parseInt("0x" + this.themes[0]);
    this.debugColor = parseInt("0x" + this.themes[2]);
    this.debugAlpha = 0.3;

    this.isShadow = false;

    this.mats = [];
    this.geos = [];

    this.tt = [0 , 0];

    this.init();
}

AAA.View.prototype = {
    constructor: AAA.View,
    init:function(){
        this.container = document.getElementById("container");

        this.renderer = new THREE.WebGLRenderer( {precision: "lowp", antialias: false, alpha:false } );
        this.renderer.setSize( this.viewSize.w, this.viewSize.h );
        this.renderer.setClearColor( this.bgColor, 1 );
        //renderer.autoClear = false;
        this.renderer.gammaInput = true;
        this.renderer.gammaOutput = true;
        this.renderer.shadowMapEnabled = this.isShadow;
        this.container.appendChild( this.renderer.domElement );

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
        this.container.addEventListener( 'mouseup', function(e) { _this.onMouseUp(e) }, false );
        if( body.addEventListener ){
            body.addEventListener( 'mousewheel', function(e) { _this.onMouseWheel(e) }, false ); //chrome
            body.addEventListener( 'DOMMouseScroll', function(e) { _this.onMouseWheel(e) }, false ); // firefox
        }else if( body.attachEvent ){
            body.attachEvent("onmousewheel" , function(e) { _this.onMouseWheel(e) }); // ie
        }

        this.initSkyAndMat();
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
        this.renderer.render( this.scene, this.camera );
        var last = Date.now();
        if (last - 1000 > this.tt[0]) { this.tt[0] = last; this.fps = this.tt[1]; this.tt[1] = 0; } this.tt[1]++;
    },
    resize:function(){
        this.viewSize.w = window.innerWidth; 
        this.viewSize.h = window.innerHeight;

        this.renderer.setSize( this.viewSize.w*this.viewSize.mw, this.viewSize.h*this.viewSize.mh );
        this.camera.aspect = ( this.viewSize.w*this.viewSize.mw ) / ( this.viewSize.h*this.viewSize.mh );
        this.camera.updateProjectionMatrix();
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
        if ( this.mouse.down ) {
            document.body.style.cursor = 'move';
            this.cam.horizontal = ((e.clientX - this.mouse.ox) * 0.3) + this.mouse.h;
            this.cam.vertical = (-(e.clientY - this.mouse.oy) * 0.3) + this.mouse.v;
            this.moveCamera();
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
            mesh = new THREE.Mesh( this.parent.geos[1], this.parent.mats[1] );
            mesh.scale.set( size[0], size[1], size[2] );
        break;
        case 'sphere':
            mesh = new THREE.Mesh( this.parent.geos[2], this.parent.mats[1] );
            mesh.scale.set( size[0], size[0], size[0] );
        break;
        case 'cylinder':
            mesh = new THREE.Mesh( this.parent.geos[3], this.parent.mats[1] );
            mesh.scale.set( size[0], size[1], size[2] );
        break;
        case 'dice': 
            mesh = new THREE.Mesh( this.parent.geos[4], this.parent.mats[1] );
            mesh.scale.set( size[0], size[1], size[2] );
        break;
        case 'cone': 
            mesh = new THREE.Mesh( this.parent.geos[5], this.parent.mats[1] );
            mesh.scale.set( size[0], size[1], size[2] );
        break;
        case 'capsule':
            mesh = new THREE.Mesh( new AAA.CapsuleGeometry(size[0], size[1]*0.5), this.parent.mats[1] );
        break;
       
        case 'mesh': shape = new Ammo.btBoxShape(new Ammo.btVector3(size[0]*0.5, size[1]*0.5, size[2]*0.5)); break;
        case 'convex': shape = new Ammo.btBoxShape(new Ammo.btVector3(size[0]*0.5, size[1]*0.5, size[2]*0.5)); break;
        case 'terrain': 
            this.parent.terrain = new TERRAIN.Generate( div, size );
            this.parent.terrain.init( window.innerWidth, window.innerHeight );
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

    this.nWheels = nWheels;

    this.mesh = new THREE.Mesh( this.parent.geos[1], this.parent.mats[1] ) || obj.mesh;
    this.mesh.scale.set( size[0], size[1], size[2] );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    var wheelMesh = new THREE.Mesh( this.parent.geos[3], this.parent.mats[2] ) || obj.wheel;
    wheelMesh.scale.set( wRadius, wDeepth, wRadius );
    this.wheels = [];

    var i = this.nWheels, w;
    while(i--){
        this.wheels[i] = new THREE.Object3D();
        w = wheelMesh.clone();
        w.castShadow = true;
        w.receiveShadow = true;
        w.rotation.z = -Math.PI / 2;
        this.wheels[i].add(w);
        this.parent.content.add(this.wheels[i]);

        // out of view range 
        this.wheels[i].position.y = 20000;
    }

    this.parent.content.add(this.mesh);
    // out of view range 
    this.mesh.position.y = 20000;

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
