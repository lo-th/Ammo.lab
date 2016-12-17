/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    THREE ultimate manager
*/

'use strict';
// MATH ADD
Math.torad = 0.0174532925199432957;
Math.todeg = 57.295779513082320876;
Math.degtorad = Math.PI / 180;//0.0174532925199432957;
Math.radtodeg = 180 / Math.PI;//57.295779513082320876;
Math.Pi = 3.141592653589793;
Math.TwoPI = 6.283185307179586;
Math.PI90 = 1.570796326794896;
Math.PI270 = 4.712388980384689;
Math.lerp = function (a, b, percent) { return a + (b - a) * percent; };
Math.rand = function (a, b) { return Math.lerp(a, b, Math.random()); };
Math.randInt = function (a, b, n) { return Math.lerp(a, b, Math.random()).toFixed(n || 0)*1; };
Math.int = function(x) { return ~~x; };

var view = ( function () {

    'use strict';

    var time = 0;
    var temp = 0;
    var count = 0;
    var fps = 0;

    var canvas, renderer, scene, camera, controls, debug;
    var ray, mouse, content, targetMouse, rayCallBack, moveplane, isWithRay = false;;
    var vs = { w:1, h:1, l:0, x:0 };

    var helper;
    
    var meshs = [];
    var statics = [];
    var terrains = [];
    var softs = [];
    var cars = [];
    //var carsSpeed = [];
    var heros = [];
    var extraGeo = [];

    var byName = {};

    var currentFollow = null;

    //var softsPoints = [];

    var geo = {};
    var mat = {};

    // key[8] = controle.
    //var key = [ 0,0,0,0,0,0,0,0,0 ];


    var imagesLoader;
    //var currentCar = -1;
    var isCamFollow = false;
    var isWithShadow = false;
    var shadowGround, light, ambient;
    var spy = -0.01;

    var perlin = null;//new Perlin();

    var environment, envcontext, nEnv = 1, isWirframe = true;
    var envLists = ['wireframe','ceramic','plastic','smooth','metal','chrome','brush','black','glow','red','sky'];
    var envMap;


    view = function () {};

    view.init = function ( callback ) {

        canvas = document.createElement("canvas");
        canvas.className = 'canvas3d';
        canvas.oncontextmenu = function(e){ e.preventDefault(); };
        canvas.ondrop = function(e) { e.preventDefault(); };
        document.body.appendChild( canvas );

        // RENDERER

        try {
            renderer = new THREE.WebGLRenderer({ canvas:canvas, antialias:true, alpha:false });
            //renderer = new THREE.WebGLRenderer({ canvas:canvas, precision:"mediump", antialias:true, alpha:false });
        } catch( error ) {
            if(intro !== null ) intro.message('<p>Sorry, your browser does not support WebGL.</p>'
                        + '<p>This application uses WebGL to quickly draw'
                        + ' AMMO Physics.</p>'
                        + '<p>AMMO Physics can be used without WebGL, but unfortunately'
                        + ' this application cannot.</p>'
                        + '<p>Have a great day!</p>');
            return;
        }

        if(intro !== null ) intro.clear();

        renderer.setClearColor(0x242424, 1);
        //renderer.setSize( 100, 100 );
        renderer.setPixelRatio( window.devicePixelRatio );

        //renderer.sortObjects = false;
        renderer.gammaInput = true;
        renderer.gammaOutput = true;

        renderer.toneMapping = THREE.Uncharted2ToneMapping;
        renderer.toneMappingExposure = 3.0;
        renderer.toneMappingWhitePoint = 5.0;

        // SCENE

        scene = new THREE.Scene();

        content = new THREE.Object3D();
        scene.add( content );

        // CAMERA / CONTROLER

        camera = new THREE.PerspectiveCamera( 60 , 1 , 1, 1000 );
        camera.position.set( 0, 0, 30 );

        controls = new THREE.OrbitControls( camera, canvas );
        controls.target.set( 0, 0, 0 );
        controls.enableKeys = false;
        controls.update();

        // LIGHTS
        view.addLights();

        // GEOMETRY

        geo['box'] =  new THREE.BufferGeometry().fromGeometry( new THREE.BoxGeometry(1,1,1) );
        geo['sphere'] = new THREE.SphereBufferGeometry( 1, 12, 10 );
        geo['cylinder'] =  new THREE.BufferGeometry().fromGeometry( new THREE.CylinderGeometry( 1,1,1,12,1 ) );
        geo['cone'] =  new THREE.BufferGeometry().fromGeometry( new THREE.CylinderGeometry( 0,1,0.5 ) );
        geo['wheel'] =  new THREE.BufferGeometry().fromGeometry( new THREE.CylinderGeometry( 1,1,1, 18 ) );
        geo['wheel'].rotateZ( -Math.PI90 );

        // MATERIAL

        mat['terrain'] = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, name:'terrain', wireframe:true });
        mat['cloth'] = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, name:'cloth', wireframe:true, transparent:true, opacity:0.9, side: THREE.DoubleSide });
        mat['ball'] = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, name:'ball', wireframe:true });
        mat['statique'] = new THREE.MeshBasicMaterial({ color:0x333399, name:'statique', wireframe:true, transparent:true, opacity:0.6 });
        mat['hero'] = new THREE.MeshBasicMaterial({ color:0x993399, name:'hero', wireframe:true });
        mat['move'] = new THREE.MeshBasicMaterial({ color:0x999999, name:'move', wireframe:true });
        mat['cars'] = new THREE.MeshBasicMaterial({ color:0xffffff, name:'cars', wireframe:true, transparent:true, side: THREE.DoubleSide });
        mat['tmp1'] = new THREE.MeshBasicMaterial({ color:0xffffff, name:'tmp1', wireframe:true, transparent:true });
        mat['tmp2'] = new THREE.MeshBasicMaterial({ color:0xffffff, name:'tmp2', wireframe:true, transparent:true });
        mat['movehigh'] = new THREE.MeshBasicMaterial({ color:0xffffff, name:'movehigh', wireframe:true });
        mat['sleep'] = new THREE.MeshBasicMaterial({ color:0x383838, name:'sleep', wireframe:true });

        mat['meca1'] = new THREE.MeshBasicMaterial({ color:0xffffff, name:'meca1', wireframe:true });
        mat['meca2'] = new THREE.MeshBasicMaterial({ color:0xffffff, name:'meca2', wireframe:true });
        mat['meca3'] = new THREE.MeshBasicMaterial({ color:0xffffff, name:'meca3', wireframe:true });

        mat['pig'] = new THREE.MeshBasicMaterial({ color:0xd3a790, name:'pig', wireframe:true, transparent:false });
        mat['avatar'] = new THREE.MeshBasicMaterial({ color:0xd3a790, name:'avatar', wireframe:true, transparent:false });

        mat['both'] = new THREE.MeshBasicMaterial({ color:0xffffff, name:'both', wireframe:true, side:THREE.DoubleSide  });
        mat['back'] = new THREE.MeshBasicMaterial({ color:0xffffff, name:'back', wireframe:true, side:THREE.BackSide  });

        // GROUND

        helper = new THREE.GridHelper( 50, 20, 0xFFFFFF, 0x333333 );
        helper.material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors, transparent:true, opacity:0.1 } );
        scene.add( helper );

        // RAYCAST

        ray = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        // EVENT

        window.addEventListener( 'resize', view.resize, false );

        imagesLoader = new THREE.TextureLoader();

        this.resize();
        this.initEnv();

        // charge basic geometry
        //this.load ( 'basic', callback );

        if( callback ) callback();

    };

    view.setLeft = function ( x ) { vs.x = x; };

    view.resize = function () {

        vs.h = window.innerHeight;
        vs.w = window.innerWidth - vs.x;

        canvas.style.left = vs.x +'px';
        camera.aspect = vs.w / vs.h;
        camera.updateProjectionMatrix();
        renderer.setSize( vs.w, vs.h );

        if(editor) editor.resizeMenu( vs.w );

    };

    view.getFps = function () {

        return fps;

    };

    view.getInfo = function () {

        return renderer.info.programs.length;

    };

    view.render = function () {

        time = now();
        if ( (time - 1000) > temp ){ temp = time; fps = count; count = 0; }; count++;

        this.controlUpdate();
        renderer.render( scene, camera );

    };

    view.addMap = function( name, matName ) {
        var map = imagesLoader.load( 'textures/' + name );
        //map.wrapS = THREE.RepeatWrapping;
        //map.wrapT = THREE.RepeatWrapping;
        map.flipY = false;

        mat[matName].map = map;
    }

    view.getGeo = function () {
        return geo;
    };

    view.getMat = function () {
        return mat;
    };

    view.getScene = function () {
        return scene;
    };

    view.removeRay = function(){
        if(isWithRay){
            isWithRay = false;

            canvas.removeEventListener( 'mousemove', view.rayTest, false );
            rayCallBack = null;

            content.remove(moveplane);
            scene.remove(targetMouse);

        }
    }

    view.activeRay = function ( callback ) {

        isWithRay = true;

        var g = new THREE.PlaneBufferGeometry(100,100);
        g.rotateX( -Math.PI90 );
        moveplane = new THREE.Mesh( g,  new THREE.MeshBasicMaterial({ color:0xFFFFFF, transparent:true, opacity:0 }));
        content.add(moveplane);
        //moveplane.visible = false;

        targetMouse = new THREE.Mesh( geo['box'] ,  new THREE.MeshBasicMaterial({color:0xFF0000}));
        scene.add(targetMouse);

        canvas.addEventListener( 'mousemove', view.rayTest, false );

        rayCallBack = callback;

    };

    view.rayTest = function (e) {
        //vs.h = window.innerHeight;
        //vs.w = window.innerWidth - vs.x;
        mouse.x = ( (e.clientX- vs.x )/ vs.w ) * 2 - 1;
        mouse.y = - ( e.clientY / vs.h ) * 2 + 1;

        ray.setFromCamera( mouse, camera );
        var intersects = ray.intersectObjects( content.children, true );
        if ( intersects.length) {
            targetMouse.position.copy( intersects[0].point )
            //paddel.position.copy( intersects[0].point.add(new THREE.Vector3( 0, 20, 0 )) );

            rayCallBack( targetMouse );
        }
    };

	var kdCallBack = null;
	var kuCallBack = null;
	var keycodes = {unknown: "unknown"};

	// Keycode definitions

	keycodes[37] = "left";
	keycodes[38] = "up";
	keycodes[39] = "right";
	keycodes[40] = "down";
	keycodes[48] = "0";
	keycodes[49] = "1";
	keycodes[50] = "2";
	keycodes[51] = "3";
	keycodes[52] = "4";
	keycodes[53] = "5";
	keycodes[54] = "6";
	keycodes[55] = "7";
	keycodes[56] = "8";
	keycodes[57] = "9";
	keycodes[65] = "a";
	keycodes[87] = "w";
	keycodes[68] = "d";
	keycodes[83] = "s";
	keycodes[81] = "q";

    view.keydown = function ( callback ) {

		kdCallBack = callback;
		canvas.addEventListener( 'keydown', view.keydownTest, false );

    };

	view.keyup = function ( callback ) {

		kuCallBack = callback;
		canvas.addEventListener( 'keyup', view.keyupTest, false );

	};

	view.keydownTest = function (e) {

		if( kdCallBack ) {
			kdCallBack(keycodes[e.keyCode || e.which] || keycodes.unknown);
		}

	};

	view.keyupTest = function (e) {

		if( kuCallBack ) {
			kuCallBack(keycodes[e.keyCode || e.which] || keycodes.unknown);
		}

	};

   

    view.changeMaterial = function ( type ) {

        var m, matType, name, i, j, k;

        if( type === 0 ) {
            isWirframe = true;
            matType = 'MeshBasicMaterial';
            this.removeShadow();
        }else{
            isWirframe = false;
            matType = 'MeshStandardMaterial';
            this.addShadow();
        }

        // create new material

        for( var old in mat ) {
            m = mat[old];
            name = m.name;
            mat[ name ] = new THREE[ matType ]({ 
                name:name, 
                envMap:null,
                map:m.map || null, 
                vertexColors:m.vertexColors || false, 
                color: m.color === undefined ? 0xFFFFFF : m.color.getHex(),
                wireframe:isWirframe, 
                transparent: m.transparent || false, 
                opacity: m.opacity || 1, 
                side: m.side || THREE.FrontSide 
            });
            if( !isWirframe && envMap ){
                mat[name].envMap = envMap;
                mat[name].metalness = 0.5;
                mat[name].roughness = 0.5;
            }
        }

        // re-apply material

        i = meshs.length;
        while(i--){
            name = meshs[i].material.name;
            meshs[i].material = mat[name];
        };

        i = statics.length;
        while(i--){
            name = statics[i].material.name;
            statics[i].material = mat[name];
        };

        i = cars.length;
        while(i--){
            if(cars[i].material == undefined){
                k = cars[i].children.length;
                while(k--){
                    name = cars[i].children[k].material.name;
                    if( name !=='helper') cars[i].children[k].material = mat[name]
                }
            }else{
                name = cars[i].material.name;
                cars[i].material = mat[name];
            }
            
            j = cars[i].userData.w.length;
            while(j--){
                name = cars[i].userData.w[j].material.name;
                cars[i].userData.w[j].material = mat[name];
            }
        };

        i = terrains.length;
        while(i--){
            name = terrains[i].material.name;
            terrains[i].material = mat[name];
        };

        i = softs.length;
        while(i--){
            if(softs.softType!==2){
                name = softs[i].material.name;
                softs[i].material = mat[name];
            }
            
        };

    }

    view.needFocus = function () {

        canvas.addEventListener('mouseover', editor.unFocus, false );

    };

    view.haveFocus = function () {

        canvas.removeEventListener('mouseover', editor.unFocus, false );

    };

    view.initEnv = function () {

        var env = document.createElement( 'div' );
        env.className = 'env';
        var canvas = document.createElement( 'canvas' );
        canvas.width = canvas.height = 64;
        env.appendChild( canvas );
        document.body.appendChild( env );
        envcontext = canvas.getContext('2d');
        env.onclick = this.loadEnv;
        env.oncontextmenu = this.loadEnv;
        this.loadEnv();

    };

    view.loadEnv = function ( e ) {

        var b = 0;

        if(e){ 
            e.preventDefault();
            b = e.button;
            if( b === 0 ) nEnv++;
            else nEnv--;
            if( nEnv == envLists.length ) nEnv = 0;
            if( nEnv < 0 ) nEnv = envLists.length-1;
        }

        var img = new Image();
        img.onload = function(){
            
            envcontext.drawImage(img,0,0,64,64);
            
            envMap = new THREE.Texture( img );
            envMap.mapping = THREE.SphericalReflectionMapping;
            envMap.format = THREE.RGBFormat;
            envMap.needsUpdate = true;

            if( nEnv === 0 && !isWirframe ) view.changeMaterial( 0 );
            if( nEnv !== 0  ) {
                if( isWirframe ) view.changeMaterial( 1 );
                else{
                    for( var mm in mat ){
                       mat[mm].envMap = envMap;
                    }
                }
            }
        }

        img.src = 'textures/spherical/'+ envLists[nEnv] +'.jpg';

    };

    view.sh_grid = function(){

        //if(helper.visible) helper.visible = false;
        //else helper.visible = true;
    }

    view.hideGrid = function(){

        helper.visible = false;
    }

    // LOAD

    view.load = function ( name, callback ) {

        var loader = new THREE.SEA3D({});

        loader.onComplete = function( e ) {

            var i = loader.geometries.length, g;
            while(i--){
                g = loader.geometries[i];
                geo[g.name] = g;

                //console.log(g.name)
            };

            if(callback) callback();

            //console.log('loaded !! ', loader);

        };

        loader.load( 'models/'+ name +'.sea' );

    };

    //--------------------------------------
    //
    //   SRC UTILS ViewUtils
    //
    //--------------------------------------


    view.mergeMesh = function(m){

        return THREE.ViewUtils.mergeGeometryArray( m );

    };

    view.prepaGeometry = function ( g, type ) {

        return THREE.ViewUtils.prepaGeometry( g, type );

    };


    //--------------------------------------
    //
    //   CAMERA AND CONTROL
    //
    //--------------------------------------

    view.controlUpdate = function(){

        //+Math.PI90;
        //key[9] = controls.getPolarAngle();

        //key[8] = controls.getAzimuthalAngle(); 
        //key[9] = controls.getPolarAngle(); 

        //tell( key[8] * Math.radtodeg + '/' + key[9] * Math.radtodeg);

        if( isCamFollow ) this.follow();
        //else key[8] = controls.getAzimuthalAngle();

    };

    view.setFollow = function ( name ) {

        currentFollow = this.getByName(name);
        if( currentFollow !== null ) isCamFollow = true;

    };
 
    view.follow = function ( name ) {

        if( currentFollow === null ) return;

        //if( currentCar == -1 ) return;

        var mesh = currentFollow;

        if( mesh.userData.speed !== undefined && mesh.userData.type == 'car') {
            
            if( mesh.userData.speed < 10 && mesh.userData.speed > -10 ){ 
               // controls.update();
                //key[8] = controls.getAzimuthalAngle(); 
                return;
            }
        }
        //if( carsSpeed[currentCar] < 10 && carsSpeed[currentCar] > -10 ) return;
        //if( cars[currentCar] == undefined ) return;

        //cars[currentCar].body;

        var matrix = new THREE.Matrix4();
        matrix.extractRotation( mesh.matrix );

        var front = new THREE.Vector3( 0, 0, 1 );
        front.applyMatrix4( matrix );
        //matrix.multiplyVector3( front );

        var target = mesh.position;
        //var front = cars[currentCar].body.position;
        //var h = Math.atan2( front.z, front.x ) * Math.radtodeg;
        var h = (Math.atan2( front.x, front.z ) * Math.radtodeg)-180;

        view.moveCamera( h, 20, 10, 0.3, target );

    };

    view.moveCamera = function ( h, v, d, l, target ) {

        l = l || 1;
        if( target ) controls.target.set( target.x || 0, target.y || 0, target.z || 0 );
        //camera.position.copy( this.orbit( h, v, d ) );
        camera.position.lerp( this.orbit( h, v, d ), l );
        controls.update();
        
    };

    view.orbit = function( h, v, d ) {

        var offset = new THREE.Vector3();
        
        var phi = (v-90) * Math.torad;
        var theta = (h+180) * Math.torad;
        offset.x =  d * Math.sin(phi) * Math.sin(theta);
        offset.y =  d * Math.cos(phi);
        offset.z =  d * Math.sin(phi) * Math.cos(theta);

        var p = new THREE.Vector3();
        p.copy(controls.target).add(offset);
        /*
        p.x = ( d * Math.sin(phi) * Math.cos(theta)) + controls.target.x;
        p.y = ( d * Math.cos(phi)) + controls.target.y;
        p.z = ( d * Math.sin(phi) * Math.sin(theta)) + controls.target.z;*/

        //key[8] = theta;
        
        return p;

    };

    view.setDriveCar = function ( name ) {

        ammo.send('setDriveCar', { n:this.getByName(name).userData.id });

    };

    view.toRad = function ( r ) {

        var i = r.length;
        while(i--) r[i] *= Math.torad;
        return r;

    };

    //--------------------------------------
    //
    //   RESET
    //
    //--------------------------------------

    view.reset = function () {

        view.removeRay();
        view.setShadowPosY(-0.01);
        helper.visible = true;

        var c, i;

        while( meshs.length > 0 ) scene.remove( meshs.pop() );

        while( statics.length > 0 ) scene.remove( statics.pop() );
        
        while( terrains.length > 0 ) scene.remove( terrains.pop() );
        
        while( softs.length > 0 ) scene.remove( softs.pop() );

        while( heros.length > 0 ) scene.remove( heros.pop() );
        
        while( extraGeo.length > 0 ) extraGeo.pop().dispose();
        
        while( cars.length > 0 ){
            c = cars.pop();
            if( c.userData.helper ){
                c.remove( c.userData.helper );
                c.userData.helper.dispose();
            }
            i = c.userData.w.length;
            while( i-- ){
                scene.remove( c.userData.w[i] );
            }
            scene.remove( c );
        }

        meshs.length = 0;
        perlin = null;

        byName = {};

        currentFollow = null;

    };

    //--------------------------------------
    //
    //   ADD
    //
    //--------------------------------------

    view.add = function ( o ) {

        var isCustomGeometry = false;

        o.mass = o.mass == undefined ? 0 : o.mass;
        o.type = o.type == undefined ? 'box' : o.type;

        // position
        o.pos = o.pos == undefined ? [0,0,0] : o.pos;

        // size
        o.size = o.size == undefined ? [1,1,1] : o.size;
        if(o.size.length == 1){ o.size[1] = o.size[0]; }
        if(o.size.length == 2){ o.size[2] = o.size[0]; }

        if(o.geoSize){
            if(o.geoSize.length == 1){ o.geoSize[1] = o.geoSize[0]; }
            if(o.geoSize.length == 2){ o.geoSize[2] = o.geoSize[0]; }
        }

        // rotation is in degree
        o.rot = o.rot == undefined ? [0,0,0] : this.toRad(o.rot);
        o.quat = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( o.rot ) ).toArray();

        

        if(o.rotA) o.quatA = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( this.toRad( o.rotA ) ) ).toArray();
        if(o.rotB) o.quatB = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( this.toRad( o.rotB ) ) ).toArray();

        if(o.angUpper) o.angUpper = this.toRad( o.angUpper );
        if(o.angLower) o.angLower = this.toRad( o.angLower );

        var mesh = null;

        if(o.type.substring(0,5) == 'joint') {

            ammo.send( 'add', o );
            return;

        }

        if(o.type == 'plane'){
            helper.position.set( o.pos[0], o.pos[1], o.pos[2] )
            ammo.send( 'add', o ); 
            return;
        }

        if(o.type == 'softTriMesh'){
            this.softTriMesh( o ); 
            return;
        }

        if(o.type == 'softConvex'){
            this.softConvex( o ); 
            return;
        }

        if(o.type == 'cloth'){
            this.cloth( o ); 
            return;
        }

        if(o.type == 'rope'){
            this.rope( o ); 
            return;
        }

        if(o.type == 'ellipsoid'){
            this.ellipsoid( o ); 
            return;
        }

        if(o.type == 'terrain'){
            this.terrain( o ); 
            return;
        }

        
        

        var material;
        if(o.material !== undefined) material = mat[o.material];
        else material = o.mass ? mat.move : mat.statique;
        
        if( o.type == 'capsule' ){
            var g = new THREE.CapsuleBufferGeometry( o.size[0] , o.size[1]*0.5 );
            //g.applyMatrix(new THREE.Matrix4().makeRotationY(-Math.PI*0.5));
            mesh = new THREE.Mesh( g, material );
            extraGeo.push(mesh.geometry);
            isCustomGeometry = true;

        } else if( o.type == 'mesh' || o.type == 'convex' ){ 
            o.v = view.prepaGeometry( o.shape, o.type );
            if(o.geometry){
                mesh = new THREE.Mesh( o.geometry, material );
                extraGeo.push(o.geometry);
                extraGeo.push(o.shape);
            } else {
                mesh = new THREE.Mesh( o.shape, material );
                extraGeo.push(mesh.geometry);
            }
        /*} else if( o.type == 'convex' ){ 
            o.v = view.prepaGeometry( o.shape, true, false );
            if(o.geometry){
                mesh = new THREE.Mesh( o.geometry, material );
                extraGeo.push(o.geometry);
                extraGeo.push(o.shape);
            } else {
                mesh = new THREE.Mesh( o.shape, material );
                extraGeo.push(mesh.geometry);
            }
            //mesh = new THREE.Mesh( o.shape, material );
            //extraGeo.push(mesh.geometry);*/
        } else {
            if(o.geometry){
                if(o.geoRot || o.geoScale) o.geometry = o.geometry.clone();
                // rotation only geometry
                if(o.geoRot){ o.geometry.applyMatrix(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler().fromArray(this.toRad(o.geoRot))));}

            
                // scale only geometry
                if(o.geoScale){ 
                    o.geometry.applyMatrix( new THREE.Matrix4().makeScale( o.geoScale[0], o.geoScale[1], o.geoScale[2] ) );
                    //material = mat['back'];//material.clone();
                    //material.side = THREE.BackSide;
                }
            }
            

            mesh = new THREE.Mesh( o.geometry || geo[o.type], material );

            if( o.geometry ){
                extraGeo.push(o.geometry);
                mesh.scale.fromArray( o.geoSize );
                isCustomGeometry = true;
            }

        }


        if(mesh){

            if( !isCustomGeometry ) mesh.scale.fromArray( o.size );

            mesh.position.fromArray( o.pos );
            mesh.quaternion.fromArray( o.quat );

            mesh.receiveShadow = true;
            mesh.castShadow = true;
            
            this.setName( o, mesh );

            scene.add(mesh);

            // push 
            if( o.mass ) meshs.push( mesh );
            else statics.push( mesh );
        }

        if( o.shape ) delete(o.shape);
        if( o.geometry ) delete(o.geometry);
        if( o.material ) delete(o.material);

        //console.log(o)
        

        // send to worker
        ammo.send( 'add', o );

    };

    

    view.getGeoByName = function ( name, Buffer ) {

        var g;
        var i = geo.length;
        var buffer = Buffer || false;
        while(i--){
            if( name == geo[i].name) g = geo[i];
        }
        if( buffer ) g = new THREE.BufferGeometry().fromGeometry( g );
        return g;

    };

    view.character = function ( o ) {

        o.size = o.size == undefined ? [0.5,1,1] : o.size;
        if(o.size.length == 1){ o.size[1] = o.size[0]; }
        if(o.size.length == 2){ o.size[2] = o.size[0]; }

        //var pos = o.pos || [0,3,0];
        o.pos = o.pos == undefined ? [0,3,0] : pos;
        //var rot = o.rot || [0,0,0];

        o.rot = o.rot == undefined ? [0,0,0] : this.toRad(o.rot);
        o.quat = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( o.rot ) ).toArray();

        var g = new THREE.CapsuleBufferGeometry( o.size[0] , o.size[1]*0.5 );
        var mesh = new THREE.Mesh( g, mat.hero );
        extraGeo.push( mesh.geometry );

        //mesh.position.set( pos[0], pos[1], pos[2] );
        //mesh.rotation.set( rot[0], rot[1], rot[2] );

        mesh.position.fromArray( o.pos );
        mesh.quaternion.fromArray( o.quat );

        // copy rotation quaternion
        //o.quat = mesh.quaternion.toArray();
        //o.pos = pos;

        mesh.userData.speed = 0;
        mesh.userData.type = 'hero';

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add(mesh);
        heros.push(mesh);



        this.setName( o, mesh );

        if( o.mesh ) delete( o.mesh );

        // send to worker
        ammo.send( 'character', o );

    };

    view.vehicle = function ( o ) {

        //var type = o.type || 'box';
        var size = o.size || [2,0.5,4];
        var pos = o.pos || [0,0,0];
        var rot = o.rot || [0,0,0];

        var wPos = o.wPos || [1, 0, 1.6];

        var massCenter = o.massCenter || [0,0.25,0];

        this.toRad( rot );

        // chassis
        var mesh;
        if( o.mesh ){ 
            mesh = o.mesh;
            var k = mesh.children.length;
                while(k--){
                    mesh.children[k].position.set( massCenter[0], massCenter[1], massCenter[2] );
                    //mesh.children[k].geometry.translate( massCenter[0], massCenter[1], massCenter[2] );
                    mesh.children[k].castShadow = true;
                    mesh.children[k].receiveShadow = true;
                }
        } else {
            var g = new THREE.BufferGeometry().fromGeometry( new THREE.BoxGeometry(size[0], size[1], size[2]) );//geo.box;
            g.translate( massCenter[0], massCenter[1], massCenter[2] );
            extraGeo.push( g );
            mesh = new THREE.Mesh( g, mat.move );
        } 
        

        //mesh.scale.set( size[0], size[1], size[2] );
        mesh.position.set( pos[0], pos[1], pos[2] );
        mesh.rotation.set( rot[0], rot[1], rot[2] );

        // copy rotation quaternion
        o.quat = mesh.quaternion.toArray();

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        

        scene.add( mesh );

        this.setName( o, mesh );

        mesh.userData.speed = 0;
        mesh.userData.steering = 0;
        mesh.userData.NumWheels = o.nw || 4;
        mesh.userData.type = 'car';

        if(o.helper){
            mesh.userData.helper = new THREE.CarHelper( wPos );
            mesh.add( mesh.userData.helper );
        }

        // wheels

        var radius = o.radius || 0.4;
        var deep = o.deep || 0.3;
        var wPos = o.wPos || [1, -0.25, 1.6];

        var w = [];

        var needScale = o.wheel == undefined ? true : false;

        var gw = o.wheel || geo['wheel'];
        var gwr = gw.clone();
        gwr.rotateY( Math.Pi );
        extraGeo.push( gwr );

        var i = o.nw || 4;
        while(i--){
            if(i==1 || i==2) w[i] = new THREE.Mesh( gw, mat.move );
            else w[i] = new THREE.Mesh( gwr, mat.move );
            if( needScale ) w[i].scale.set( deep, radius, radius );
            else w[i].material = mat.cars;

            w[i].castShadow = true;
            w[i].receiveShadow = true;

            scene.add( w[i] );
        }

        mesh.userData.w = w;

        //var car = { body:mesh, w:w, axe:helper.mesh, nw:o.nw || 4, helper:helper, speed:0 };

        cars.push( mesh );

        mesh.userData.id = cars.length-1;
        //carsSpeed.push( 0 );



        if( o.mesh ) o.mesh = null;
        if( o.wheel ) o.wheel = null;

        if ( o.type == 'mesh' || o.type == 'convex' ) o.v = view.prepaGeometry( o.shape, o.type );

        if( o.shape ) delete(o.shape);
        if( o.mesh ) delete(o.mesh);

        // send to worker
        ammo.send( 'vehicle', o );

    };

    //--------------------------------------
    //   SOFT TRI MESH
    //--------------------------------------

    view.softTriMesh = function ( o ) {

        //console.log(o.shape)

        //if(o.shape.bones) 

        var g = o.shape.clone();
        var pos = o.pos || [0,0,0];
        var size = o.size || [1,1,1];
        var rot = o.rot || [0,0,0];

        g.translate( pos[0], pos[1], pos[2] );
        g.scale( size[0], size[1], size[2] );

        //g.rotateX( rot[0] *= Math.degtorad );
        //g.rotateY( rot[1] *= Math.degtorad );
        //g.rotateZ( rot[2] *= Math.degtorad );
        g.applyMatrix( new THREE.Matrix4().makeRotationY(rot[1] *= Math.torad ));

        
        

        //console.log('start', g.getIndex().count);

        view.prepaGeometry( g );

        extraGeo.push( g );

        //console.log('mid', g.realIndices.length);

        // extra color
        /*var color = new Float32Array( g.maxi*3 );
        var i = g.maxi*3;
        while(i--){
            color[i] = 1;
        }
        g.addAttribute( 'color', new THREE.BufferAttribute( color, 3 ) );*/

        o.v = g.realVertices;
        o.i = g.realIndices;
        o.ntri = g.numFaces;

        var material = o.material === undefined ? mat.cloth : mat[o.material];
        var mesh = new THREE.Mesh( g, material );

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        mesh.softType = 5;

        scene.add( mesh );
        softs.push( mesh );

        if( o.shape ) delete(o.shape);
        if( o.material ) delete(o.material);

        // send to worker
        ammo.send( 'add', o );
        
    }

    //--------------------------------------
    //   SOFT CONVEX
    //--------------------------------------

    view.softConvex = function ( o ) {

        var g = o.shape;
        var pos = o.pos || [0,0,0];

        g.translate( pos[0], pos[1], pos[2] );

        view.prepaGeometry(g);

        o.v = g.realVertices;

        var mesh = new THREE.Mesh( g, mat.cloth );
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        mesh.softType = 4;

        scene.add( mesh );
        softs.push( mesh );

        // send to worker
        ammo.send( 'add', o );

    }

    //--------------------------------------
    //   CLOTH
    //--------------------------------------

    view.cloth = function ( o ) {

        var i, x, y, n;

        var div = o.div || [16,16];
        var size = o.size || [100,0,100];
        var pos = o.pos || [0,0,0];

        var max = div[0] * div[1];

        var g = new THREE.PlaneBufferGeometry( size[0], size[2], div[0] - 1, div[1] - 1 );
        g.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( max*3 ), 3 ) );
        g.rotateX( -Math.PI90 );
        //g.translate( -size[0]*0.5, 0, -size[2]*0.5 );

        var numVerts = g.attributes.position.array.length / 3;

        var mesh = new THREE.Mesh( g, mat.cloth );

        this.setName( o, mesh );

       // mesh.material.needsUpdate = true;
        mesh.position.set( pos[0], pos[1], pos[2] );

        mesh.castShadow = true;
        mesh.receiveShadow = true;//true;
        //mesh.frustumCulled = false;

        mesh.softType = 1;

        scene.add( mesh );
        softs.push( mesh );

        o.size = size;
        o.div = div;
        o.pos = pos;

        // send to worker
        ammo.send( 'add', o );

    }

    //--------------------------------------
    //   ROPE
    //--------------------------------------

    view.rope = function ( o ) {

        var max = o.numSegment || 10;
        var start = o.start || [0,0,0];
        var end = o.end || [0,10,0];

        max += 2;
        var ropeIndices = [];

        //var n;
        //var pos = new Float32Array( max * 3 );
        for(var i=0; i<max-1; i++){

            ropeIndices.push( i, i + 1 );

        }

        var g = new THREE.BufferGeometry();
        g.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
        g.addAttribute('position', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
        g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));

        //var mesh = new THREE.LineSegments( g, new THREE.LineBasicMaterial({ vertexColors: true }));
        var mesh = new THREE.LineSegments( g, new THREE.LineBasicMaterial({ color: 0xFFFF00 }));

        this.setName( o, mesh );


        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.softType = 2;
        //mesh.frustumCulled = false;

        scene.add( mesh );
        softs.push( mesh );

        // send to worker
        ammo.send( 'add', o );

    }

    //--------------------------------------
    //   ELLIPSOID 
    //--------------------------------------

    view.ellipsoid = function ( o ) {

        // send to worker
        ammo.send( 'add', o );

    }

    view.ellipsoidMesh = function ( o ) {

        var max = o.lng;
        var points = [];
        var ar = o.a;
        var i, j, k, v, n;
        
        // create temp convex geometry and convert to buffergeometry
        for( i = 0; i<max; i++ ){
            n = i*3;
            points.push(new THREE.Vector3(ar[n], ar[n+1], ar[n+2]));
        }
        var gt = new THREE.ConvexGeometry( points );

        
        var indices = new Uint32Array( gt.faces.length * 3 );
        var vertices = new Float32Array( max * 3 );
        var order = new Float32Array( max );
        //var normals = new Float32Array( max * 3 );
        //var uvs  = new Float32Array( max * 2 );

        

         // get new order of vertices
        var v = gt.vertices;
        var i = max, j, k;
        while(i--){
            j = max;
            while(j--){
                n = j*3;
                if(ar[n]==v[i].x && ar[n+1]==v[i].y && ar[n+2]==v[i].z) order[j] = i;
            }
        }

       
        i = max
        while(i--){
            n = i*3;
            k = order[i]*3;

            /*vertices[n] = v[i].x;
            vertices[n+1] = v[i].y;
            vertices[n+2] = v[i].z;*/

            vertices[k] = ar[n];
            vertices[k+1] = ar[n+1];
            vertices[k+2] = ar[n+2];

        }

        // get indices of faces
        var i = gt.faces.length;
        while(i--){
            n = i*3;
            var face = gt.faces[i];
            indices[n] = face.a;
            indices[n+1] = face.b;
            indices[n+2] = face.c;
        }

        //console.log(gtt.vertices.length)
        var g = new THREE.BufferGeometry();
        g.setIndex( new THREE.BufferAttribute( indices, 1 ) );
        g.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
        g.addAttribute('order', new THREE.BufferAttribute( order, 1 ));
        
        //g.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
        //g.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );

        g.computeVertexNormals();

        extraGeo.push( g );


        gt.dispose();


        //g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
        var mesh = new THREE.Mesh( g, mat.ball );

        this.setName( o, mesh );

        mesh.softType = 3;

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add( mesh );
        softs.push( mesh );

    }

    //--------------------------------------
    //
    //   TERRAIN
    //
    //--------------------------------------

    view.terrain = function ( o ) {

        var i, x, y, n, c;

        o.div = o.div == undefined ? [64,64] : o.div;
        o.size = o.size == undefined ? [100,10,100] : o.size;
        o.pos = o.pos == undefined ? [0,0,0] : o.pos;
        o.dpos = o.dpos == undefined ? [0,0,0] : o.dpos;
        o.complexity = o.complexity == undefined ? 30 : o.complexity;
        o.lng = o.div[0] * o.div[1];
        o.hdata =  new Float32Array( o.lng );
        
        if( !perlin ) perlin = new Perlin();

        var sc = 1 / o.complexity;
        var r = 1 / o.div[0];
        var rx = (o.div[0] - 1) / o.size[0];
        var rz = (o.div[1] - 1) / o.size[2];

        var colors = new Float32Array( o.lng * 3 );
        var g = new THREE.PlaneBufferGeometry( o.size[0], o.size[2], o.div[0] - 1, o.div[1] - 1 );
        g.rotateX( -Math.PI90 );
        var vertices = g.attributes.position.array;


        i = o.lng;
        while(i--){
            n = i * 3;
            x = i % o.div[0];
            y = ~~ ( i * r );
            c = 0.5 + ( perlin.noise( (x+(o.dpos[0]*rx))*sc, (y+(o.dpos[2]*rz))*sc ) * 0.5); // from 0 to 1
            o.hdata[ i ] = c * o.size[ 1 ]; // final h size
            vertices[ n + 1 ] = o.hdata[i];
            colors[ n ] = c;
            colors[ n + 1 ] = c;
            colors[ n + 2 ] = c;
        }
        
        g.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
        g.computeBoundingSphere();
        g.computeVertexNormals();

        extraGeo.push( g );
        
        var mesh = new THREE.Mesh( g, mat.terrain );
        mesh.position.set( o.pos[0], o.pos[1], o.pos[2] );

        mesh.castShadow = false;
        mesh.receiveShadow = true;

        this.setName( o, mesh );

        scene.add( mesh );
        terrains.push( mesh );

        // send to worker
        ammo.send( 'add', o );

        if(shadowGround) scene.remove( shadowGround );

    };

    view.moveTerrain = function ( o ) {



    };

    //--------------------------------------
    //
    //   OBJECT NAME
    //
    //--------------------------------------

    view.setName = function ( o, mesh ) {

        if( o.name !== undefined ){ 
            byName[o.name] = mesh;
            mesh.name = o.name;
        }

    };

    view.getByName = function (name){

        return byName[name] || null;

    };


    //--------------------------------------
    //
    //   UPDATE OBJECT
    //
    //--------------------------------------

    view.update = function(){

        this.bodyStep();
        this.heroStep();
        this.carsStep();
        this.softStep();

    }

    view.bodyStep = function(){

        if( !meshs.length ) return;

        meshs.forEach( function( b, id ) {
            var n = id * 8;
            var s = Br[n];
            if ( s > 0 ) {

                if ( b.material.name == 'sleep' ) b.material = mat.move;
                if( s > 50 && b.material.name == 'move' ) b.material = mat.movehigh;
                else if( s < 50 && b.material.name == 'movehigh') b.material = mat.move;
                
                b.position.set( Br[n+1], Br[n+2], Br[n+3] );
                b.quaternion.set( Br[n+4], Br[n+5], Br[n+6], Br[n+7] );

            } else {
                if ( b.material.name == 'move' || b.material.name == 'movehigh' ) b.material = mat.sleep;
            }
        });

    };

    view.heroStep = function(){

        if(heros.length == 0 ) return;

        heros.forEach( function( b, id ) {
            var n = id * 8;
            b.userData.speed = Hr[n] * 100;
            b.position.set( Hr[n+1], Hr[n+2], Hr[n+3] );
            b.quaternion.set( Hr[n+4], Hr[n+5], Hr[n+6], Hr[n+7] );
        });

    };

    view.carsStep = function(){

        if( !cars.length ) return;

        cars.forEach( function( b, id ) {
            var n = id * 56;
            //carsSpeed[id] = Cr[n];
            b.userData.speed = Cr[n];

            b.position.set( Cr[n+1], Cr[n+2], Cr[n+3] );
            b.quaternion.set( Cr[n+4], Cr[n+5], Cr[n+6], Cr[n+7] );

            //b.axe.position.copy( b.body.position );
            //b.axe.quaternion.copy( b.body.quaternion );

            var j = b.userData.NumWheels, w;

            if(b.userData.helper){
                if( j == 4 ){
                    w = 8 * ( 4 + 1 );
                    b.userData.helper.updateSuspension(Cr[n+w+0], Cr[n+w+1], Cr[n+w+2], Cr[n+w+3]);
                }
            }
            
            while(j--){

                w = 8 * ( j + 1 );
                //if( j == 1 ) steering = a[n+w];// for drive wheel
                //if( j == 1 ) b.axe.position.x = Cr[n+w];
                //if( j == 2 ) b.axe.position.y = Cr[n+w];
                //if( j == 3 ) b.axe.position.z = Cr[n+w];

                b.userData.w[j].position.set( Cr[n+w+1], Cr[n+w+2], Cr[n+w+3] );
                b.userData.w[j].quaternion.set( Cr[n+w+4], Cr[n+w+5], Cr[n+w+6], Cr[n+w+7] );
            }
        });

    };

    view.getSofts = function(){

        return softs;

    };

    view.softStep = function(){

        if( !softs.length ) return;

        var softPoints = 0;

        softs.forEach( function( b, id ) {

            var n, c, cc, p, j, k;

            var t = b.softType; // type of softBody
            var order = null;
            var isWithColor = b.geometry.attributes.color ? true : false;
            var isWithNormal = b.geometry.attributes.normal ? true : false;

            p = b.geometry.attributes.position.array;
            if(isWithColor) c = b.geometry.attributes.color.array;

            if( t == 5 || t == 4 ){ // softTriMesh // softConvex

                var max = b.geometry.numVertices;
                var maxi = b.geometry.maxi;
                var pPoint = b.geometry.pPoint;
                var lPoint = b.geometry.lPoint;

                j = max;
                while(j--){
                    n = (j*3) + softPoints;
                    if( j == max-1 ) k = maxi - pPoint[j];
                    else k = pPoint[j+1] - pPoint[j];
                    var d = pPoint[j];
                    while(k--){
                        var id = lPoint[d+k]*3;
                        p[id] = Sr[n];
                        p[id+1] = Sr[n+1]; 
                        p[id+2] = Sr[n+2];
                    }
                }

            }else{


                if( b.geometry.attributes.order ) order = b.geometry.attributes.order.array;
                //if( m.geometry.attributes.same ) same = m.geometry.attributes.same.array;
                j = p.length;

                n = 2;

                if( order !== null ) {

                    j = order.length;
                    while(j--){
                        k = order[j] * 3;
                        n = j*3 + softPoints;
                        p[k] = Sr[n];
                        p[k+1] = Sr[n+1];
                        p[k+2] = Sr[n+2];

                        cc = Math.abs(Sr[n+1]/10);
                        c[k] = cc;
                        c[k+1] = cc;
                        c[k+2] = cc;
                    }

                } else {
                     while(j--){
                         
                        p[j] = Sr[j+softPoints];
                        if(n==1){ 
                            cc = Math.abs(p[j]/10);
                            c[j-1] = cc;
                            c[j] = cc;
                            c[j+1] = cc;
                        }
                        n--;
                        n = n<0 ? 2 : n;
                    }

                }

            }

            if(t!==2) b.geometry.computeVertexNormals();

            b.geometry.attributes.position.needsUpdate = true;

            if(isWithNormal){

                var norm = b.geometry.attributes.normal.array;

                j = max;
                while(j--){
                    if( j == max-1 ) k = maxi - pPoint[j];
                    else k = pPoint[j+1] - pPoint[j];
                    var d = pPoint[j];
                    var ref = lPoint[d]*3;
                    while(k--){
                        var id = lPoint[d+k]*3;
                        norm[id] = norm[ref];
                        norm[id+1] = norm[ref+1]; 
                        norm[id+2] = norm[ref+2];
                    }
                }

                b.geometry.attributes.normal.needsUpdate = true;
            }

            if(isWithColor) b.geometry.attributes.color.needsUpdate = true;
            
            b.geometry.computeBoundingSphere();

            if( t == 5 ) softPoints += b.geometry.numVertices * 3;
            else softPoints += p.length;
        });

    };
    









    

    //--------------------------------------
    //   SHADOW
    //--------------------------------------

    view.removeShadow = function(){

        if(!isWithShadow) return;

        isWithShadow = false;
        renderer.shadowMap.enabled = false;
        //light.shadowMap.enabled = false;

        if( shadowGround ) scene.remove(shadowGround);
        //scene.remove(light);
        //scene.remove(ambient);

    };

    view.setShadowPosY = function( y ){

        spy = y;
        if(shadowGround) shadowGround.position.y = spy;

    }

    view.addLights = function(){

        light = new THREE.DirectionalLight( 0xffffff, 1 );
        light.position.set( -3, 50, 5 );
        light.lookAt( new THREE.Vector3() );
        scene.add( light );

        ambient = new THREE.AmbientLight( 0x444444 );
        scene.add( ambient );

    }

    view.addShadow = function(){

       if( isWithShadow ) return;

        isWithShadow = true;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.soft = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        //renderer.shadowMap.renderReverseSided = false;

        if( !terrains.length ){
            var planemat = new THREE.ShaderMaterial( THREE.ShaderShadow );
            shadowGround = new THREE.Mesh( new THREE.PlaneBufferGeometry( 200, 200, 1, 1 ), planemat );
            shadowGround.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI*0.5));
            shadowGround.position.y = spy;
            shadowGround.castShadow = false;
            shadowGround.receiveShadow = true;
            scene.add( shadowGround );
        }

        light.castShadow = true;
        var d = 70;
        var camShadow = new THREE.OrthographicCamera( d, -d, d, -d,  25, 170 );
        light.shadow = new THREE.LightShadow( camShadow );

        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        //light.shadow.bias = 0.0001;


    }

    return view;

})();


