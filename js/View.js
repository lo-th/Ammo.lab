/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    THREE ultimate manager
*/

// MATH ADD
Math.degtorad = 0.0174532925199432957;
Math.radtodeg = 57.295779513082320876;
Math.PI = 3.141592653589793;
Math.TwoPI = 6.283185307179586;
Math.PI90 = 1.570796326794896;
Math.PI270 = 4.712388980384689;
Math.lerp = function (a, b, percent) { return a + (b - a) * percent; };
Math.rand = function (a, b) { return Math.lerp(a, b, Math.random()); };
Math.randInt = function (a, b, n) { return Math.lerp(a, b, Math.random()).toFixed(n || 0)*1; };
Math.int = function(x) { return ~~x; };

var view = ( function () {

    var canvas, renderer, scene, camera, controls, clock, debug;
    var ray, mouse, content, targetMouse, rayCallBack, moveplane, isWithRay = false;;
    var vs = { w:1, h:1, l:400 };

    var helper;
    
    var meshs = [];
    var statics = [];
    var terrains = [];
    var cars = [];
    var carsSpeed = [];
    var heros = [];
    var extraGeo = [];

    var geo = {};
    var mat = {};

    var key = [ 0,0,0,0,0,0,0,0 ];

    var imagesLoader;
    var currentCar = -1;
    var isCamFollow = false;
    var isWithShadow = false;
    var shadowGround, light, ambient;

    var environment, envcontext, nEnv = 0, isWirframe = true;
    var envLists = ['wireframe','ceramic','plastic','smooth','metal','chrome','brush','black','glow','red','sky'];


    view = function () {};

    view.init = function ( callback ) {

        clock = new THREE.Clock();

        debug = document.getElementById('debug');

        canvas = document.getElementById('canvas3d');
        canvas.oncontextmenu = function(e){ e.preventDefault(); };
        canvas.ondrop = function(e) { e.preventDefault(); };

        // RENDERER

        try {
            renderer = new THREE.WebGLRenderer({canvas:canvas, precision:"mediump", antialias:true, alpha:false });
        } catch( error ) {
            intro.message('<p>Sorry, your browser does not support WebGL.</p>'
                        + '<p>This application uses WebGL to quickly draw'
                        + ' AMMO Physics.</p>'
                        + '<p>AMMO Physics can be used without WebGL, but unfortunately'
                        + ' this application cannot.</p>'
                        + '<p>Have a great day!</p>');
            return;
        }

        intro.clear();

        renderer.setClearColor(0x2A2A2A, 1);
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.sortObjects = true;
        renderer.gammaInput = true;
        renderer.gammaOutput = true;

        // SCENE

        scene = new THREE.Scene();

        content = new THREE.Object3D();
        scene.add(content);

        // CAMERA / CONTROLER

        camera = new THREE.PerspectiveCamera( 60 , 1 , 0.1, 1000 );
        camera.position.set( 0, 0, 30 );
        controls = new THREE.OrbitControls( camera, canvas );
        controls.target.set( 0, 0, 0 );
        controls.enableKeys = false;
        controls.update();

        // GEOMETRY

        geo['box'] =  new THREE.BufferGeometry().fromGeometry( new THREE.BoxGeometry(1,1,1) );
        geo['sphere'] = new THREE.SphereBufferGeometry( 1, 12, 10 );
        geo['cylinder'] =  new THREE.BufferGeometry().fromGeometry( new THREE.CylinderGeometry( 1,1,1,12,1 ) );
        geo['cone'] =  new THREE.BufferGeometry().fromGeometry( new THREE.CylinderGeometry( 0,1,0.5 ) );
        geo['wheel'] =  new THREE.BufferGeometry().fromGeometry( new THREE.CylinderGeometry( 1,1,1, 18 ) );
        geo['wheel'].rotateZ( -Math.PI90 );

        // MATERIAL

        mat['terrain'] = new THREE.MeshBasicMaterial({ vertexColors: true, name:'terrain', wireframe:true });
        mat['statique'] = new THREE.MeshBasicMaterial({ color:0x333399, name:'statique', wireframe:true, transparent:true, opacity:0.6 });
        mat['hero'] = new THREE.MeshBasicMaterial({ color:0x993399, name:'hero', wireframe:true });
        mat['move'] = new THREE.MeshBasicMaterial({ color:0x999999, name:'move', wireframe:true });
        mat['cars'] = new THREE.MeshBasicMaterial({ color:0xffffff, name:'cars', wireframe:true, transparent:true });
        mat['movehigh'] = new THREE.MeshBasicMaterial({ color:0xffffff, name:'movehigh', wireframe:true });
        mat['sleep'] = new THREE.MeshBasicMaterial({ color:0x383838, name:'sleep', wireframe:true });

        // GROUND

        helper = new THREE.GridHelper( 50, 2 );
        helper.setColors( 0xFFFFFF, 0x666666 );
        helper.material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors, transparent:true, opacity:0.1 } );
        scene.add( helper );

        // RAYCAST

        ray = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        // EVENT

        window.addEventListener( 'resize', view.resize, false );

        document.addEventListener( 'keydown', view.keyDown, false );
        document.addEventListener( 'keyup', view.keyUp, false );

        imagesLoader = new THREE.TextureLoader();

        

        this.resize();
        this.initEnv();

        // charge basic geometry
        this.load ( 'basic', callback );

    };

    view.addMap = function(name, matName) {
        var map = imagesLoader.load( "textures/"+ name );
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
    }

    view.changeMaterial = function ( type ) {

        var m, matType, name, i, j, k;

        if( type == 0 ) {
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
            mat[name] = new THREE[matType]({ map:m.map, vertexColors:m.vertexColors, color:m.color.getHex(), name:name, wireframe:isWirframe, transparent:m.transparent, opacity:m.opacity });
            if(!isWirframe){
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
            if(cars[i].body.material == undefined){
                k = cars[i].body.children.length;
                while(k--){
                    name = cars[i].body.children[k].material.name;
                    cars[i].body.children[k].material = mat[name]
                }
            }else{
                name = cars[i].body.material.name;
                cars[i].body.material = mat[name];
            }
            
            j = cars[i].w.length;
            while(j--){
                name = cars[i].w[j].material.name;
                cars[i].w[j].material = mat[name];
            }
        };

        i = terrains.length;
        while(i--){
            name = terrains[i].material.name;
            terrains[i].material = mat[name];
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

    view.loadEnv = function (e) {

        var b = 0;

        if(e){ 
            e.preventDefault();
            b = e.button;
            if( b == 0 ) nEnv++;
            else nEnv--;
            if( nEnv == envLists.length ) nEnv = 0;
            if( nEnv < 0 ) nEnv = envLists.length-1;
        }

        var img = new Image();
        img.onload = function(){
            
            envcontext.drawImage(img,0,0,64,64);
            
            envMap = new THREE.Texture(img);
            envMap.mapping = THREE.SphericalReflectionMapping;
            envMap.format = THREE.RGBFormat;
            envMap.needsUpdate = true;

            if( nEnv == 0 && !isWirframe ) view.changeMaterial( 0 );
            if( nEnv !== 0  ) {
                if(isWirframe) view.changeMaterial( 1 );
                else{
                    for( var mm in mat ){
                       mat[mm].envMap = envMap;
                    }
                }
            }
        }

        img.src = 'textures/spherical/'+ envLists[nEnv] +'.jpg';

    };

    view.keyDown = function ( e ) {

        if( editor.getFocus() ) return;
        e = e || window.event;
        switch ( e.keyCode ) {
            case 38: case 87: case 90: key[0] = 1; break; // up, W, Z
            case 40: case 83:          key[1] = 1; break; // down, S
            case 37: case 65: case 81: key[2] = 1; break; // left, A, Q
            case 39: case 68:          key[3] = 1; break; // right, D
            case 17: case 67:          key[4] = 1; break; // ctrl, C
            case 69:                   key[5] = 1; break; // E
            case 32:                   key[6] = 1; break; // space
            case 16:                   key[7] = 1; break; // shift

            case 71:                   view.sh_grid(); break; // shift
        }

        // send to worker
        //ammo.send( 'key', key );

        //console.log( e.which, String.fromCharCode(e.which) );

    };

    view.keyUp = function ( e ) {

        if( editor.getFocus() ) return;
        e = e || window.event;
        switch( e.keyCode ) {
            case 38: case 87: case 90: key[0] = 0; break; // up, W, Z
            case 40: case 83:          key[1] = 0; break; // down, S
            case 37: case 65: case 81: key[2] = 0; break; // left, A, Q
            case 39: case 68:          key[3] = 0; break; // right, D
            case 17: case 67:          key[4] = 0; break; // ctrl, C
            case 69:                   key[5] = 0; break; // E
            case 32:                   key[6] = 0; break; // space
            case 16:                   key[7] = 0; break; // shift
        }

        // send to worker
        //ammo.send( 'key', key );

    };

    view.getKey = function () {

        return key;

    };

    view.sh_grid = function(){

        if(helper.visible) helper.visible = false;
        else helper.visible = true;
    }

    // LOAD

    view.load = function ( name, callback ) {

        var loader = new THREE.SEA3D();

        loader.onComplete = function( e ) {

            var i = loader.geometries.length, g;
            while(i--){
                g = loader.geometries[i];
                //console.log(g.name);
                geo[g.name] = g;
            };

            if(callback) callback();

            //console.log('loaded !! ', loader);

        };

        loader.load( 'models/'+ name +'.sea' );

    };

    // CAMERA

    view.activeFollow = function () {

        isCamFollow = true;

    };

    view.follow = function () {

        if (currentCar == -1) return;
        if( carsSpeed[currentCar] < 10 && carsSpeed[currentCar] > -10 ) return;
        if(cars[currentCar] == undefined ) return;

        var mesh = cars[currentCar].body;

        var matrix = new THREE.Matrix4();
        matrix.extractRotation( mesh.matrix );

        var front = new THREE.Vector3( 0, 0, 1 );
        front.applyMatrix4( matrix );
        //matrix.multiplyVector3( front );

        var target = mesh.position;
        //var front = cars[currentCar].body.position;
        var h = Math.atan2( front.z, front.x ) * Math.radtodeg;

        view.moveCamera( h, 20, 10, 0.3, target );

    };

    view.moveCamera = function ( h, v, d, l, target ) {

        l = l || 1;
        if( target ) controls.target.set( target.x || 0, target.y || 0, target.z || 0 );
        //camera.position.copy( this.orbit( h, v-90, d ) );
        camera.position.lerp( this.orbit( h, v-90, d ), l );
        controls.update();

    };

    view.orbit = function( h, v, d ) {

        var p = new THREE.Vector3();
        var phi = v * Math.degtorad;
        var theta = h * Math.degtorad;
        p.x = ( d * Math.sin(phi) * Math.cos(theta)) + controls.target.x;
        p.z = ( d * Math.sin(phi) * Math.sin(theta)) + controls.target.z;
        p.y = ( d * Math.cos(phi)) + controls.target.y;
        return p;

    };

    view.setDriveCar = function ( n ) {

        currentCar = n;
        ammo.send('setDriveCar', { n:n });

    };

    view.capsuleGeo = function( radius, height, SRadius, SHeight ) {

        var sRadius = SRadius || 12;
        var sHeight = SHeight || 6;
        var o0 = Math.PI * 2;
        var o1 = Math.PI * 0.5;
        var g = new THREE.Geometry();
        var m0 = new THREE.CylinderGeometry(radius, radius, height, sRadius, 1, true);
        var m1 = new THREE.SphereGeometry(radius, sRadius, sHeight, 0, o0, 0, o1);
        var m2 = new THREE.SphereGeometry(radius, sRadius, sHeight, 0, o0, o1, o1);
        var mtx0 = new THREE.Matrix4().makeTranslation(0,0,0);
        var mtx1 = new THREE.Matrix4().makeTranslation(0, height*0.5,0);
        var mtx2 = new THREE.Matrix4().makeTranslation(0, -height*0.5,0);
        g.merge( m0, mtx0);
        g.merge( m1, mtx1);
        g.merge( m2, mtx2);
        return new THREE.BufferGeometry().fromGeometry( g );
    
    };

    view.reset = function () {

        view.removeRay();

        var c, i;

        while( meshs.length > 0 ){
            scene.remove( meshs.pop() );
        }

        while( statics.length > 0 ){
            scene.remove( statics.pop() );
        }

        while( terrains.length > 0 ){ 
            scene.remove( terrains.pop() );
        }

        while( heros.length > 0 ){ 
            scene.remove( heros.pop() );
        }

        while( extraGeo.length > 0 ){ 
            extraGeo.pop().dispose();
        }

        while( cars.length > 0 ){
            c = cars.pop();
            carsSpeed.pop();
            scene.remove( c.body );
            scene.remove( c.axe );
            i = c.w.length;
            while(i--){
                scene.remove( c.w[i] );
            }
        }

    };

    view.findRotation = function ( r ) {

        if( Math.abs(r[0]) > Math.TwoPI || Math.abs(r[1]) > Math.TwoPI || Math.abs(r[2]) > Math.TwoPI ){
            // is in degree
            r[0] *= Math.degtorad;
            r[1] *= Math.degtorad;
            r[2] *= Math.degtorad;

        }

        return r;

    };

    view.add = function ( o ) {

        var statique = o.mass == 0 ? true : false;
        var material = statique ? mat.statique : mat.move;

        var type = o.type || 'box';
        var size = o.size || [1,1,1];
        var pos = o.pos || [0,0,0];
        var rot = o.rot || [0,0,0];
        var mesh = null;

        if(type.substring(0,5) == 'joint') {

            if( ( Math.abs(o.min) > Math.TwoPI || Math.abs(o.max) > Math.TwoPI ) && type !== 'jointDistance' ){
                // is in degree
                o.min *= Math.degtorad;
                o.max *= Math.degtorad;

            } 

            ammo.send( 'add', o );
            return;

        }

        if(type == 'plane'){
            helper.position.set( pos[0], pos[1], pos[2] )
            ammo.send( 'add', o ); 
            return;
        }

        if(type == 'terrain'){
            this.terrain( o ); 
            return;
        }

        
        if(size.length == 1){ size[1] = size[0]; }
        if(size.length == 2){ size[2] = size[0]; }

        this.findRotation( rot );

        
        
        if( type == 'capsule' ){
            var g = this.capsuleGeo( size[0] , size[1]*0.5 );
            extraGeo.push(g);
            mesh = new THREE.Mesh( g, material );
        }
        else{ 
            mesh = new THREE.Mesh( geo[type], material );
            mesh.scale.set( size[0], size[1], size[2] );
        }

        
        mesh.position.set( pos[0], pos[1], pos[2] );
        mesh.rotation.set( rot[0], rot[1], rot[2] );

        // force physics type of shape
        if( o.shape ) o.type = o.shape;


        if(o.type == 'mesh') o.v = view.getFaces( geo[type] );
        if(o.type == 'convex') o.v = view.getVertex( geo[type] );

        // color
        //this.meshColor( mesh, 1, 0.5, 0 );

        // copy rotation quaternion
        o.quat = mesh.quaternion.toArray();

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add(mesh);

        // push 
        if( statique ) statics.push( mesh );
        else meshs.push( mesh );

        // send to worker
        ammo.send( 'add', o );

    };

    view.getVertex = function ( Geometry, Name ) {

        var v = [];
        var pp, i, n;
        var geometry = Geometry ? Geometry : this.getGeoByName( Name );
        pp = geometry.vertices;

        if( pp == undefined ) { // is BufferGeometry
            v = geometry.attributes.position.array;
        } else {
            i = pp.length;
            while(i--){
                n = i * 3;
                v[n+0] = pp[i].x;
                v[n+1] = pp[i].y;
                v[n+2] = pp[i].z;
            }
        }

        //console.log(v)
        return v;

    };

    view.getFaces = function ( Geometry, Name ) {

        var v = [];
        var n, face, va, vb, vc;
        var geometry = Geometry ? Geometry : this.getGeoByName( Name );

        var pp = geometry.faces;
        if( pp == undefined ) { // is BufferGeometry
            v = geometry.attributes.position.array;
        } else {
            var pv = geometry.vertices;
            var i = pp.length;
            while(i--){
                n = i * 9;
                face = pp[i];
                va = pv[face.a]; vb = pv[face.b]; vc = pv[face.c];
                v[n+0] = va.x; v[n+1]=va.y; v[n+2]=va.z;
                v[n+3] = vb.x; v[n+4]=vb.y; v[n+5]=vb.z;
                v[n+6] = vc.x; v[n+7]=vc.y; v[n+8]=vc.z;
            }
        }
        
        return v;

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

        var size = o.size || [0.5,1,1];
        var pos = o.pos || [0,3,0];
        var rot = o.rot || [0,0,0];

        var g = this.capsuleGeo( size[0] , size[1]*0.5 );
        extraGeo.push(g);
        var mesh = new THREE.Mesh( g, mat.hero );

        mesh.position.set( pos[0], pos[1], pos[2] );
        mesh.rotation.set( rot[0], rot[1], rot[2] );

        // copy rotation quaternion
        o.quat = mesh.quaternion.toArray();
        o.pos = pos;
        o.size = size;

        scene.add(mesh);
        heros.push(mesh);


        // send to worker
        ammo.send( 'character', o );

    };

    view.vehicle = function ( o ) {

        var type = o.type || 'box';
        var size = o.size || [2,0.5,4];
        var pos = o.pos || [0,0,0];
        var rot = o.rot || [0,0,0];

        var massCenter = o.massCenter || [0,0.25,0];

        this.findRotation( rot );

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

        // center of mass

        var axe = new THREE.AxisHelper(1);
        scene.add( axe );

        // wheels

        var radius = o.radius || 0.4;
        var deep = o.deep || 0.3;
        var wPos = o.wPos || [1, -0.25, 1.6];

        var w = [];

        var needScale = o.wheel==undefined ? true : false;

        var gw = o.wheel || geo['wheel'];
        var gwr = gw.clone();
        gwr.rotateY( Math.PI );
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

        var car = { body:mesh, w:w, axe:axe, nw:o.nw || 4 };

        cars.push( car );
        carsSpeed.push( 0 );

        if( o.mesh ) o.mesh = null;
        if( o.wheel ) o.wheel = null;

        // send to worker
        ammo.send( 'vehicle', o );

    };

    /*view.meshColor = function( m, r,g,b ){

        var g = m.geometry;
        if(!g.attributes.color){ 
            //console.log('no color')
            var l = g.attributes.position.array.length;
            g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( l ), 3 ));
        }
        var colors = g.attributes.color.array;

        var i = colors.length/3, n;
        while(i--){
            n = i * 3;
            colors[ n  ] = r;
            colors[ n + 1 ] = g;
            colors[ n + 2 ] = b;
        }

        g.attributes.color.needsUpdate = true;


    };*/

    view.terrain = function ( o ) {

        var i, x, y, n;

        var div = o.div || [64,64];
        var size = o.size || [100,10,100];
        var pos = o.pos || [0,0,0];

        var complexity = o.complexity || 30;

        var lng = div[0] * div[1]
        var data = new Float32Array( lng );
        var hdata =  new Float32Array( lng );
        var perlin = new Perlin();
        var sc = 1 / complexity;

        i = lng;
        while(i--){
            var x = i % div[0], y = ~~ ( i / div[0] );
            data[ i ] = 0.5 + ( perlin.noise( x * sc, y * sc ) * 0.5); // 0,1
        }

        var g = new THREE.PlaneBufferGeometry( size[0], size[2], div[0] - 1, div[1] - 1 );
        g.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array(lng*3), 3 ) );
        g.rotateX( -Math.PI90 );

        extraGeo.push( g );

        var vertices = g.attributes.position.array;
        var colors = g.attributes.color.array;

        i = lng;
        while(i--){
            n = i * 3;
            hdata[i] = data[ i ] * size[1]; // final size
            vertices[ n + 1 ] = hdata[i];   // pos y
            colors[ n + 1 ] = data[ i ] * 0.5; // green color
        }

        g.computeVertexNormals();

        var mesh = new THREE.Mesh( g, mat.terrain );
        mesh.position.set( pos[0], pos[1], pos[2] );

        mesh.castShadow = false;
        mesh.receiveShadow = true;

        scene.add( mesh );
        terrains.push( mesh );

        o.hdata = hdata;
        o.size = size;
        o.div = div;
        o.pos = pos;

        // send to worker
        ammo.send( 'add', o ); 

        if(shadowGround) scene.remove(shadowGround);

    };

    view.update = function(ar, dr, hr, jr){

        var i = meshs.length, a = ar, n, m, j, w;

        while(i--){
            m = meshs[i];
            n = i * 8;

            if ( a[n] > 0 ) {
                //if(i == 2) tell(a[n]* 9.8)

                if( a[n] > 50 && m.material.name == 'move' ) m.material = mat.movehigh;
                else if(a[n] < 50 && m.material.name !== 'move') m.material = mat.move;
                
                m.position.set( a[n+1], a[n+2], a[n+3] );
                m.quaternion.set( a[n+4], a[n+5], a[n+6], a[n+7] );

                if ( m.material.name == 'sleep' ) m.material = mat.move;

            } else {

                if ( m.material.name == 'move' || m.material.name == 'movehigh' ) m.material = mat.sleep;
            
            }

        }
        // updtae character
        i = heros.length;
        a = hr;

        while(i--){
            m = heros[i];
            n = i * 8;

            m.position.set( a[n+1], a[n+2], a[n+3] );
            m.quaternion.set( a[n+4], a[n+5], a[n+6], a[n+7] );

        }

        // update car
        i = cars.length;
        a = dr;

        while(i--){
            m = cars[i];
            n = i * 56;

            carsSpeed[i] = a[n];

            m.body.position.set( a[n+1], a[n+2], a[n+3] );
            m.body.quaternion.set( a[n+4], a[n+5], a[n+6], a[n+7] );

           

            j = m.nw;//a[n+8];
            while(j--){

                w = 8 * ( j + 1 );
                //if( j == 1 ) steering = a[n+w];// for drive wheel
                if( j == 1 ) m.axe.position.x = a[n+w];
                if( j == 2 ) m.axe.position.y = a[n+w];
                if( j == 3 ) m.axe.position.z = a[n+w];

                m.w[j].position.set( a[n+w+1], a[n+w+2], a[n+w+3] );
                m.w[j].quaternion.set( a[n+w+4], a[n+w+5], a[n+w+6], a[n+w+7] );

            }

        }

    };

    view.setLeft = function ( x ) { vs.x = x; };

    /*view.errorMsg = function ( msg ) {

        var er = document.createElement('div');
        er.style.textAlign = 'center';
        er.innerHTML = msg;
        document.body.appendChild(er);

    };*/

    view.tell = function ( str ) { debug.innerHTML = str; };

    view.resize = function () {

        vs.h = window.innerHeight;
        vs.w = window.innerWidth - vs.x;

        debug.style.left = vs.x +'px';
        canvas.style.left = vs.x +'px';
        camera.aspect = vs.w / vs.h;
        camera.updateProjectionMatrix();
        renderer.setSize( vs.w, vs.h );

    };

    view.render = function () {

        var delta = clock.getDelta();
        if( isCamFollow ) this.follow();
        renderer.render( scene, camera );

    };

    //--------------------------------------
    //   SHADOW
    //--------------------------------------

    view.removeShadow = function(){

        if(!isWithShadow) return;
        isWithShadow = false;

        renderer.shadowMap.enabled = false;

        if(shadowGround) scene.remove(shadowGround);
        scene.remove(light);
        scene.remove(ambient);

    };

    view.addShadow = function(){

        if(isWithShadow) return;

        isWithShadow = true;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.soft = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.cullFace = THREE.CullFaceBack;

        if(!terrains.length){
            shadowGround = new THREE.Mesh( new THREE.PlaneBufferGeometry( 100, 100, 8, 8 ), new THREE.MeshBasicMaterial({ color:0X070707 }) );
            shadowGround.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI*0.5));
            shadowGround.position.y = -0.01;
            shadowGround.castShadow = false;
            shadowGround.receiveShadow = true;
            scene.add( shadowGround );
        }

        

        light = new THREE.DirectionalLight( 0xffffff, 1 );
        light.position.set( -3, 50, 5 );
        


        //light = new THREE.SpotLight( 0xffffff, 1, 0, Math.PI / 2, 10, 2 );
        //light.position.set(  0, 100, 0 );
        light.target.position.set( 0, 0, 0 );

        light.castShadow = true;
        light.shadowMapWidth = 1024;
        light.shadowMapHeight = 1024;
        light.shadowCameraNear = 25;
        light.shadowCameraFar = 70;
        light.shadowDarkness = 1;
        light.shadowBias =  -0.005;

        var c = 70;
        light.shadowCameraRight = c;
        light.shadowCameraLeft = -c;
        light.shadowCameraTop    = c;
        light.shadowCameraBottom = -c;

        //light.shadowCameraFov = 80;
        
        //light.shadowCameraFov = 70;

        //scene.add( new THREE.CameraHelper( light.shadow.camera ) );
        scene.add( light );

        ambient = new THREE.AmbientLight( 0x444444 );
        scene.add( ambient );

        /*ambient = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.8 );
        ambient.color.setHSL( 0.6, 1, 0.6 );
        ambient.groundColor.setHSL( 0.095, 1, 0.75 );
        ambient.position.set( 0, 10, 0 );
        scene.add( ambient );*/


    }

    return view;

})();


