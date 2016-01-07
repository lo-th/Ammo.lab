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

    var canvas, renderer, scene, camera, controls, debug;
    var ray, mouse, content, targetMouse, rayCallBack, moveplane, isWithRay = false;;
    var vs = { w:1, h:1, l:400 };

    var helper;
    
    var meshs = [];
    var statics = [];
    var terrains = [];
    var softs = [];
    var cars = [];
    var carsSpeed = [];
    var heros = [];
    var extraGeo = [];

    var byName = {};

    //var softsPoints = [];

    var geo = {};
    var mat = {};

    var key = [ 0,0,0,0,0,0,0,0 ];

    var imagesLoader;
    var currentCar = -1;
    var isCamFollow = false;
    var isWithShadow = false;
    var shadowGround, light, ambient;
    var spy = -0.01;

    var perlin = null;//new Perlin();

    var environment, envcontext, nEnv = 0, isWirframe = true;
    var envLists = ['wireframe','ceramic','plastic','smooth','metal','chrome','brush','black','glow','red','sky'];


    view = function () {};

    view.init = function ( callback ) {

        debug = document.getElementById('debug');

        canvas = document.getElementById('canvas3d');
        canvas.oncontextmenu = function(e){ e.preventDefault(); };
        canvas.ondrop = function(e) { e.preventDefault(); };

        // RENDERER

        try {
            renderer = new THREE.WebGLRenderer({ canvas:canvas, precision:"mediump", antialias:true, alpha:false });
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

        renderer.setClearColor(0x2A2A2A, 1);
        renderer.setPixelRatio( window.devicePixelRatio );
        //renderer.sortObjects = true;
        renderer.gammaInput = true;
        renderer.gammaOutput = true;

        // SCENE

        scene = new THREE.Scene();

        content = new THREE.Object3D();
        scene.add(content);

        // CAMERA / CONTROLER

        camera = new THREE.PerspectiveCamera( 60 , 1 , 1, 1000 );
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

        mat['terrain'] = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, name:'terrain', wireframe:true });
        mat['cloth'] = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, name:'cloth', wireframe:true, transparent:true, opacity:0.9, side: THREE.DoubleSide });
        mat['ball'] = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, name:'ball', wireframe:true });
        mat['statique'] = new THREE.MeshBasicMaterial({ color:0x333399, name:'statique', wireframe:true, transparent:true, opacity:0.6 });
        mat['hero'] = new THREE.MeshBasicMaterial({ color:0x993399, name:'hero', wireframe:true });
        mat['move'] = new THREE.MeshBasicMaterial({ color:0x999999, name:'move', wireframe:true });
        mat['cars'] = new THREE.MeshBasicMaterial({ color:0xffffff, name:'cars', wireframe:true, transparent:true });
        mat['tmp1'] = new THREE.MeshBasicMaterial({ color:0xffffff, name:'tmp1', wireframe:true, transparent:true });
        mat['tmp2'] = new THREE.MeshBasicMaterial({ color:0xffffff, name:'tmp2', wireframe:true, transparent:true });
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

    view.addMap = function( name, matName ) {
        var map = imagesLoader.load( 'textures/'+name );
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
            mat[name] = new THREE[matType]({ map:m.map, vertexColors:m.vertexColors, color:m.color.getHex(), name:name, wireframe:isWirframe, transparent:m.transparent, opacity:m.opacity, side:m.side });
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
            };

            if(callback) callback();

            //console.log('loaded !! ', loader);

        };

        loader.load( 'models/'+ name +'.sea' );

    };

    view.mergeMesh = function(m){

        var tmp = [];
        var i = m.length;
        while(i--){
            tmp[i] = new THREE.Geometry().fromBufferGeometry( m[i] );
            tmp[i].mergeVertices();
        }

        var g = new THREE.Geometry();

        while( tmp.length > 0 ){
            i = tmp.pop();
            g.merge(i);
            i.dispose();
        }

        g.mergeVertices();

        var geometry = new THREE.BufferGeometry().fromGeometry( g );
        g.dispose();

        return geometry;

    }

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

    view.toRad = function ( r ) {

        var i = r.length;
        while(i--) r[i] *= Math.degtorad;
        return r;

    };

    /*view.findRotation = function ( r ) {

        //if( Math.abs(r[0]) > Math.PI || Math.abs(r[1]) > Math.PI || Math.abs(r[2]) > Math.PI ){
            // is in degree
            r[0] *= Math.degtorad;
            r[1] *= Math.degtorad;
            r[2] *= Math.degtorad;
        //}
        return r;

    };*/

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

        while( meshs.length > 0 ){
            scene.remove( meshs.pop() );
        }

        while( statics.length > 0 ){
            scene.remove( statics.pop() );
        }

        while( terrains.length > 0 ){ 
            scene.remove( terrains.pop() );
        }

        while( softs.length > 0 ){ 
            scene.remove( softs.pop() );
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
            c.helper.clear();
            i = c.w.length;
            while(i--){
                scene.remove( c.w[i] );
            }
        }

        meshs.length = 0;
        perlin = null;
        byName = {};

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

            //if( ( Math.abs(o.min) > Math.PI || Math.abs(o.max) > Math.PI ) && o.type !== 'jointDistance' ){
                // is in degree
            if(o.min) o.min *= Math.degtorad;
            if(o.max) o.max *= Math.degtorad;

            //} 

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
            mesh = new THREE.Mesh( g, material );
            extraGeo.push(mesh.geometry);
            isCustomGeometry = true;

        } else if( o.type == 'mesh' ){ 
            o.v = view.prepaGeometry( o.shape, false, true );
            if(o.geometry){
                console.log(o.geometry.name)
                mesh = new THREE.Mesh( o.geometry, material );
                extraGeo.push(o.geometry);
                extraGeo.push(o.shape);
            } else {
                mesh = new THREE.Mesh( o.shape, material );
                extraGeo.push(mesh.geometry);
            }
        } else if( o.type == 'convex' ){ 
            o.v = view.prepaGeometry( o.shape, true );
            mesh = new THREE.Mesh( o.shape, material );
            extraGeo.push(mesh.geometry);
        } else {

            mesh = new THREE.Mesh( o.geometry || geo[o.type], material );

            if( o.geometry ){
                extraGeo.push(o.geometry);
                mesh.scale.fromArray( o.geoSize );
                isCustomGeometry = true;
            }

        }


        if(mesh){

            if( !isCustomGeometry ) mesh.scale.fromArray( o.size );//.set( o.size[0], o.size[1], o.size[2] );

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
        

        // send to worker
        ammo.send( 'add', o );

    };

    view.prepaGeometry = function ( g, verticesOnly, facesOnly ) {

        var i, j, n, p, n2;

        var tmpGeo = new THREE.Geometry().fromBufferGeometry( g );
        tmpGeo.mergeVertices();

        var totalVertices = g.attributes.position.array.length/3;
        var numVertices = tmpGeo.vertices.length;
        var numFaces = tmpGeo.faces.length;

        g.realVertices = new Float32Array( numVertices * 3 );
        g.realIndices = new ( numFaces * 3 > 65535 ? Uint32Array : Uint16Array )( numFaces * 3 );

        i = numVertices;
        while(i--){
            p = tmpGeo.vertices[ i ];
            n = i * 3;
            g.realVertices[ n ] = p.x;
            g.realVertices[ n + 1 ] = p.y;
            g.realVertices[ n + 2 ] = p.z;
        }

        if(verticesOnly){ 
            tmpGeo.dispose();
            return g.realVertices;
        }

        i = numFaces;
        while(i--){
            p = tmpGeo.faces[ i ];
            n = i * 3;
            g.realIndices[ n ] = p.a;
            g.realIndices[ n + 1 ] = p.b;
            g.realIndices[ n + 2 ] = p.c;
        }

        tmpGeo.dispose();

        //g.realIndices = g.getIndex();
        //g.setIndex(g.realIndices);

        if(facesOnly){ 
            var faces = [];
            i = g.realIndices.length;
            while(i--){
                n = i * 3;
                p = g.realIndices[i]*3;
                faces[n] = g.realVertices[ p ];
                faces[n+1] = g.realVertices[ p+1 ];
                faces[n+2] = g.realVertices[ p+2 ];
            }
            return faces;
        }

        // find same point
        var ar = [];
        var pos = g.attributes.position.array;
        i = numVertices;
        while(i--){
            n = i*3;
            ar[i] = [];
            j = totalVertices;
            while(j--){
                n2 = j*3;
                if( pos[n2] == g.realVertices[n] && pos[n2+1] == g.realVertices[n+1] && pos[n2+2] == g.realVertices[n+2] ) ar[i].push(j);
            }
        }

        // generate same point index
        var pPoint = new ( numVertices > 65535 ? Uint32Array : Uint16Array )( numVertices );
        var lPoint = new ( totalVertices > 65535 ? Uint32Array : Uint16Array )( totalVertices );

        var p = 0;
        for(i=0; i<numVertices; i++){
            n = ar[i].length;
            pPoint[i] = p;
            j = n;
            while(j--){ lPoint[p+j] = ar[i][j]; }
            p += n;
        }

        g.numFaces = numFaces;
        g.numVertices = numVertices;
        g.maxi = totalVertices;
        g.pPoint = pPoint;
        g.lPoint = lPoint;

    };

    /*view.getVertex = function ( Geometry, Name ) {

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

    };*/

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

        // center of mass

        var helper = new carHelper( wPos );

        //var axe = //THREE.AxisHelper(1);
        scene.add( helper.mesh );

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

        var car = { body:mesh, w:w, axe:helper.mesh, nw:o.nw || 4, helper:helper };

        cars.push( car );
        carsSpeed.push( 0 );

        if( o.mesh ) o.mesh = null;
        if( o.wheel ) o.wheel = null;

        if ( o.type == 'mesh' ) o.v = view.prepaGeometry( o.shape, false, true );
        if ( o.type == 'convex' ) o.v = view.prepaGeometry( o.shape, true );

        // send to worker
        ammo.send( 'vehicle', o );

    };

    //--------------------------------------
    //   SOFT TRI MESH
    //--------------------------------------

    view.softTriMesh = function ( o ) {

        var g = o.shape.clone();
        var pos = o.pos || [0,0,0];
        var size = o.size || [1,1,1];
        var rot = o.rot || [0,0,0];

        g.rotateX( rot[0] *= Math.degtorad );
        g.rotateY( rot[1] *= Math.degtorad );
        g.rotateZ( rot[2] *= Math.degtorad );

        g.translate( pos[0], pos[1], pos[2] );
        g.scale( size[0], size[1], size[2] );

        //console.log('start', g.getIndex().count);

        view.prepaGeometry(g);

        extraGeo.push( g );

        //console.log('mid', g.realIndices.length);

        // extra color
        var color = new Float32Array( g.maxi*3 );
        var i = g.maxi*3;
        while(i--){
            color[i] = 1;
        }
        g.addAttribute( 'color', new THREE.BufferAttribute( color, 3 ) );

        o.v = g.realVertices;
        o.i = g.realIndices;
        o.ntri = g.numFaces;


        var mesh = new THREE.Mesh( g, mat.cloth );

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        mesh.softType = 5;

        scene.add( mesh );
        softs.push( mesh );

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
            byName[name] = mesh;
            mesh.name = name;
        }

    };

    view.getByName = function (name){

        return byName[name];

    };


    //--------------------------------------
    //
    //   UPDATE OBJECT
    //
    //--------------------------------------
    var ff=false;

    view.update = function(ar, dr, hr, jr, cr ){

        var i = meshs.length, a = ar, n, m, j, w,k, l, c, cc, t, order, isWithColor, isWithNormal;

        meshs.forEach( function( m, id ) {
            var n = id * 8;
            if ( a[n] > 0 ) {

                if ( m.material.name == 'sleep' ) m.material = mat.move;
                if( a[n] > 50 && m.material.name == 'move' ) m.material = mat.movehigh;
                else if(a[n] < 50 && m.material.name == 'movehigh') m.material = mat.move;
                
                m.position.set( a[n+1], a[n+2], a[n+3] );
                m.quaternion.set( a[n+4], a[n+5], a[n+6], a[n+7] );

            } else {
                if ( m.material.name == 'move' || m.material.name == 'movehigh' ) m.material = mat.sleep;
            }
        });

        /*while(i--){
            m = meshs[i];
            n = i * 8;

            if ( a[n] > 0 ) {
                if( a[n] > 50 && m.material.name == 'move' ) m.material = mat.movehigh;
                else if(a[n] < 50 && m.material.name !== 'move') m.material = mat.move;
                
                m.position.set( a[n+1], a[n+2], a[n+3] );
                m.quaternion.set( a[n+4], a[n+5], a[n+6], a[n+7] );

                if ( m.material.name == 'sleep' ) m.material = mat.move;

            } else {

                if ( m.material.name == 'move' || m.material.name == 'movehigh' ) m.material = mat.sleep;
            
            }

        }*/

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

            m.axe.quaternion.copy( m.body.quaternion );

           

            j = m.nw;//a[n+8];

            if(j==4){
                w = 8 * ( 4 + 1 );
                m.helper.updateSuspension(a[n+w+0], a[n+w+1], a[n+w+2], a[n+w+3]);
            }
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

        // update cloth
        l = softs.length;
        a = cr;
        w = 0;
        k = 0;

        //console.log(a[1+3])

        //while(i--){

        for( i = 0; i<l; i++ ){

            m = softs[i];
            t = m.softType; // type of softBody
            order = null;
            same = null;
            isWithColor = m.geometry.attributes.color ? true : false;
            isWithNormal = m.geometry.attributes.normal ? true : false;

            p = m.geometry.attributes.position.array;
            if(isWithColor) c = m.geometry.attributes.color.array;

            if( t == 5 || t == 4){ // softTriMesh // softConvex

                var max = m.geometry.numVertices;
                var maxi = m.geometry.maxi;
                var pPoint = m.geometry.pPoint;
                var lPoint = m.geometry.lPoint;
               

                j = max;
                while(j--){
                    n = (j*3) + w;
                    if( j == max-1 ) k = maxi - pPoint[j];
                    else k = pPoint[j+1] - pPoint[j];
                    var d = pPoint[j];
                    while(k--){
                        var id = lPoint[d+k]*3;
                        p[id] = a[n];
                        p[id+1] = a[n+1]; 
                        p[id+2] = a[n+2];
                    }
                }
                // update normal
                m.geometry.computeVertexNormals();
                var norm = m.geometry.attributes.normal.array;

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




            }else{


                if( m.geometry.attributes.order ) order = m.geometry.attributes.order.array;
                //if( m.geometry.attributes.same ) same = m.geometry.attributes.same.array;
                j = p.length;

                n = 2;

                /*if(same!==null) {
                    //a = poooo
                    //a[6]+=0.02
                    var j = same.length/4;
                    while(j--){
                        var n4 = j*4;
                        n = j*3;// + w;
                        var x = a[n] || 0;
                        var y = a[n+1] || 0; 
                        var z = a[n+2] || 0;  
                        var i0 = same[n4]*3;
                        var i1 = same[n4+1]*3;
                        var i2 = same[n4+2]*3;
                        var i3 = same[n4+3]*3;

                        if(!ff){
                            ff=true;
                            console.log(a[0], poooo[0])
                        }
                        
                        p[i0] = p[i1] = p[i2] = p[i3] = x;
                        p[i0+1] = p[i1+1] = p[i2+1] = p[i3+1] = y;
                        p[i0+2] = p[i1+2] = p[i2+2] = p[i3+2] = z;
                    }

                } else {*/

                    if(order!==null) {
                        j = order.length;
                        while(j--){
                            k = order[j] * 3;
                            n = j*3 + w;
                            p[k] = a[n];
                            p[k+1] = a[n+1];
                            p[k+2] = a[n+2];

                            cc = Math.abs(a[n+1]/10);
                            c[k] = cc;
                            c[k+1] = cc;
                            c[k+2] = cc;


                        }

                    } else {
                         while(j--){
                             
                            p[j] = a[j+w];
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

                //}

            }
            if(t==1 || t==3) m.geometry.computeVertexNormals();
            m.geometry.attributes.position.needsUpdate = true;
            if(isWithNormal) m.geometry.attributes.normal.needsUpdate = true;
            if(isWithColor) m.geometry.attributes.color.needsUpdate = true;

           // if(t==1 || t==3)
             
           // else m.geometry.computeFaceNormals();
            
            m.geometry.computeBoundingSphere();

            if(t==5) w += m.geometry.numVertices * 3;
            else w += p.length;

        }

    };

    view.setLeft = function ( x ) { vs.x = x; };

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

    view.setShadowPosY = function( y ){

        spy = y;
        if(shadowGround) shadowGround.position.y = spy;

    }

    view.addShadow = function(){

        if(isWithShadow) return;

        isWithShadow = true;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.soft = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.cullFace = THREE.CullFaceBack;

        if(!terrains.length){
            shadowGround = new THREE.Mesh( new THREE.PlaneBufferGeometry( 200, 200, 1, 1 ), TransparentShadow(0x040205, 0.5) );
            shadowGround.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI*0.5));
            shadowGround.position.y = spy;
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
        light.shadowCameraFar = 170;
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

    //--------------------------------------
    //
    //   CAR HELPER
    //
    //--------------------------------------

    var carHelper = function ( p ) {

        var s = 0.2;
        var d = 0.5;

        this.py = p[1];

        var vertices = new Float32Array( [
            -s, 0, 0,  s, 0, 0,
            0, 0, 0,  0, s*2, 0,
            0, 0, -s,  0, 0, s,

            p[0]*d, p[1], p[2],    p[0]*d, p[1]+1, p[2],
            -p[0]*d, p[1], p[2],   -p[0]*d, p[1]+1, p[2],
            -p[0]*d, p[1],-p[2],   -p[0]*d, p[1]+1, -p[2],
            p[0]*d, p[1], -p[2],    p[0]*d, p[1]+1, -p[2],
        ] );

        var colors = new Float32Array( [
            1, 1, 0,  1, 1, 0,
            1, 1, 0,  0, 1, 0,
            1, 1, 0,  1, 1, 0,

            1,1,0,    1,1,0,
            1,1,0,    1,1,0,
            1,1,0,    1,1,0,
            1,1,0,    1,1,0,
        ] );

        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

        this.positions = geometry.attributes.position.array;

        var material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors } );

        this.mesh = new THREE.LineSegments( geometry, material);

    }

    carHelper.prototype = {

        updateSuspension : function ( s0, s1, s2, s3 ) {

            this.positions[22] = this.py-s0;
            this.positions[28] = this.py-s1;
            this.positions[34] = this.py-s2;
            this.positions[40] = this.py-s3;

            this.mesh.geometry.attributes.position.needsUpdate = true;

        },
        clear : function(){

            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.mesh = null;

        }

    };

    return view;

})();


