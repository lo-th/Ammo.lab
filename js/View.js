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
    var vs = { w:1, h:1, l:400 };

    var helper;
    
    var meshs = [];
    var terrains = [];
    var cars = [];
    var heros = [];
    var extraGeo = [];

    var geo = {};
    var mat = {};

    var key = [ 0,0,0,0,0,0,0,0 ];

    var environment, envcontext, nEnv = 0, isWirframe = true;
    var envLists = ['wireframe', 'ceramic','plastic','smooth', 'metal','chrome','brush','black','glow','red','sky'];


    view = function () {};

    view.init = function () {

        debug = document.getElementById('debug');

        canvas = document.getElementById('canvas3d');
        canvas.oncontextmenu = function(e){ e.preventDefault(); };
        canvas.ondrop = function(e) { e.preventDefault(); };

        // RENDERER

        try {
            renderer = new THREE.WebGLRenderer({canvas:canvas, precision:"mediump", antialias:true, alpha:true });
        } catch( error ) {
            view.errorMsg('<p>Sorry, your browser does not support WebGL.</p>'
                        + '<p>This application uses WebGL to quickly draw'
                        + ' AMMO Physics.</p>'
                        + '<p>AMMO Physics can be used without WebGL, but unfortunately'
                        + ' this application cannot.</p>'
                        + '<p>Have a great day!</p>');
            return;
        }

        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.gammaInput = true;
        renderer.gammaOutput = true;

        // SCENE

        scene = new THREE.Scene();

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
        geo['wheel'] =  new THREE.BufferGeometry().fromGeometry( new THREE.CylinderGeometry( 1,1,1 ) );
        geo['wheel'].rotateZ( -Math.PI90 );

        // MATERIAL

        mat['terrain'] = new THREE.MeshBasicMaterial({ vertexColors: true, name:'terrain', wireframe:true });
        mat['move'] = new THREE.MeshBasicMaterial({ color:0x999999, name:'move', wireframe:true });
        mat['movehigh'] = new THREE.MeshBasicMaterial({ color:0xffffff, name:'movehigh', wireframe:true });
        mat['sleep'] = new THREE.MeshBasicMaterial({ color:0x383838, name:'sleep', wireframe:true });

        console.log(mat.sleep.vertexColors)

        // GROUND

        helper = new THREE.GridHelper( 200, 50 );
        helper.setColors( 0x999999, 0x999999 );
        helper.material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors, transparent:true, opacity:0.1 } );
        scene.add( helper );

        // EVENT

        window.addEventListener( 'resize', view.resize, false );

        document.addEventListener( 'keydown', view.keyDown, false );
        document.addEventListener( 'keyup', view.keyUp, false );

        canvas.addEventListener('mouseover', function () { editor.unFocus(); } );

        this.resize();
        this.initEnv()

    };

    view.changeMaterial = function ( type ) {

        var m, matType, name, i, j;

        if( type == 0 ) {
            isWirframe = true;
            matType = 'MeshBasicMaterial';
        }else{
            isWirframe = false;
            matType = 'MeshStandardMaterial';
        }

        // create new material

        for( var old in mat ) {
            m = mat[old];
            name = m.name;
            mat[name] = new THREE[matType]({ vertexColors:m.vertexColors, color:m.color.getHex(), name:name, wireframe:isWirframe, transparent:m.transparent, opacity:m.opacity });
            if(!isWirframe){
                mat[name].envMap = envMap;
                mat[name].metalness = 0.8;
                mat[name].roughness = 0.4;
            }
        }

        // re-apply material

        i = meshs.length;
        while(i--){
            name = meshs[i].material.name;
            meshs[i].material = mat[name];
        }

        i = cars.length;
        while(i--){
            name = cars[i].body.material.name;
            cars[i].body.material = mat[name];
            j = 4;
            while(j--){
                name = cars[i].w[j].material.name;
                cars[i].w[j].material = mat[name];
            }
        }

        i = terrains.length;
        while(i--){
            name = terrains[i].material.name;
            terrains[i].material = mat[name];
        }

    }

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
        }

        // send to worker
        ammo.send( 'key', key );

        //console.log( String.fromCharCode(e.which) );

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
        ammo.send( 'key', key );

    };

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

    view.moveCamera = function( h, v, d, target ){

        if( target ) controls.target.set( target.x || 0, target.y || 0, target.z || 0 );
        camera.position.copy( this.orbit( h, v-90, d ) );
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

        var c, i;

        while( meshs.length > 0 ){
            scene.remove( meshs.pop() );
        }

        while( terrains.length > 0 ){ 
            scene.remove( terrains.pop() );
        }

        while( extraGeo.length > 0 ){ 
            extraGeo.pop().dispose();
        }

        while( cars.length > 0 ){
            c = cars.pop();
            scene.remove( c.body );
            i = 4;
            while(i--){
                scene.remove( c.w[i] );
            }
        }

    };

    view.findRotation = function ( r ) {

        if( r[0] > Math.TwoPI || r[1] > Math.TwoPI || r[2] > Math.TwoPI ){
            // is in degree
            r[0] *= Math.degtorad;
            r[1] *= Math.degtorad;
            r[2] *= Math.degtorad;

        }

        return r;

    };

    view.add = function ( o ) {

        var type = o.type || 'box';
        var size = o.size || [1,1,1];
        var pos = o.pos || [0,0,0];
        var rot = o.rot || [0,0,0];
        var mesh = null;

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

        if(type == 'capsule'){
            var g = this.capsuleGeo( size[0] , size[1]*0.5 );
            extraGeo.push(g);
            mesh = new THREE.Mesh( g, mat.move );
        }
        else{ 
            mesh = new THREE.Mesh( geo[type], mat.move );
            mesh.scale.set( size[0], size[1], size[2] );
        }

        
        mesh.position.set( pos[0], pos[1], pos[2] );
        mesh.rotation.set( rot[0], rot[1], rot[2] );

        // force physics type of shape
        if( o.shape ) o.type = o.shape;

        // color
        //this.meshColor( mesh, 1, 0.5, 0 );

        // copy rotation quaternion
        o.quat = mesh.quaternion.toArray();

        scene.add(mesh);

        // push only dynamique
        if( o.mass !== 0 ) meshs.push( mesh );

        // send to worker
        ammo.send( 'add', o );

    };

    view.vehicle = function( o ) {

        var type = o.type || 'box';
        var size = o.size || [2,0.5,4];
        var pos = o.pos || [0,0,0];
        var rot = o.rot || [0,0,0];

        var massCenter = o.massCenter || [0,0.25,0];

        this.findRotation( rot );

        // chassis
        var g = new THREE.BufferGeometry().fromGeometry( new THREE.BoxGeometry(size[0], size[1], size[2]) );//geo.box;
        g.translate( massCenter[0], massCenter[1], massCenter[2] );
        extraGeo.push( g );
        var mesh = new THREE.Mesh( g, mat.move );

        //mesh.scale.set( size[0], size[1], size[2] );
        mesh.position.set( pos[0], pos[1], pos[2] );
        mesh.rotation.set( rot[0], rot[1], rot[2] );

        // copy rotation quaternion
        o.quat = mesh.quaternion.toArray();

        

        scene.add( mesh );

        // wheels

        var radius = o.radius || 0.4;
        var deep = o.deep || 0.3;
        var wPos = o.wPos || [1, -0.25, 1.6];

        var w = [];

        var i = 4;
        while(i--){
            w[i] = new THREE.Mesh( geo['wheel'], mat.move );
            w[i].scale.set( deep, radius, radius );

            //w[i].position.set( pos[0], pos[1], pos[2] );
            //w[i].rotation.set( rot[0], rot[1], rot[2] );
            scene.add( w[i] );
        }

        var car = { body:mesh, w:w };

        cars.push( car );

        // send to worker
        ammo.send( 'vehicle', o );

    };

    view.meshColor = function( m, r,g,b ){

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


    };

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
            colors[ n + 1 ] = data[ i ] * 0.5;    // green color
        }

        g.computeVertexNormals();

        var mesh = new THREE.Mesh( g, mat.terrain );
        mesh.position.set( pos[0], pos[1], pos[2] );

        scene.add( mesh );
        terrains.push( mesh );

        o.hdata = hdata;
        o.size = size;
        o.div = div;
        o.pos = pos;

        // send to worker
        ammo.send( 'add', o ); 

    };

    view.update = function(ar, dr){

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

        // update car
        i = cars.length;
        a = dr;

        while(i--){
            m = cars[i];
            n = i * 40;

            m.body.position.set( a[n+1], a[n+2], a[n+3] );
            m.body.quaternion.set( a[n+4], a[n+5], a[n+6], a[n+7] );

            j = 4;
            while(j--){

               w = 8 * ( j + 1 );
               m.w[j].position.set( a[n+w+1], a[n+w+2], a[n+w+3] );
               m.w[j].quaternion.set( a[n+w+4], a[n+w+5], a[n+w+6], a[n+w+7] );

            }

        }

    };

    view.setLeft = function ( x ) { vs.x = x; };

    view.errorMsg = function ( msg ) {

        var er = document.createElement('div');
        er.style.textAlign = 'center';
        er.innerHTML = msg;
        document.body.appendChild(er);

    };

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

        renderer.render( scene, camera );

    };

    return view;

})();