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

    var canvas, renderer, scene, camera, controls;
    var vs = { w:1, h:1, l:400 };
    var meshs = [];

    var geo = {};
    var mat = {};

    var extraGeo = [];

    view = function () {};

    view.init = function () {

        canvas = document.getElementById('canvas');//createElement('canvas');
        canvas.oncontextmenu = function(e){ e.preventDefault(); };
        canvas.ondrop = function(e) { e.preventDefault(); };
        //document.body.appendChild( canvas );

        camera = new THREE.PerspectiveCamera(60 , 1 , 1, 1000);
        camera.position.set(0, 0, 30);
        controls = new THREE.OrbitControls( camera, canvas );
        controls.target.set(0, 0, 0);

        controls.update();

        try {
            renderer = new THREE.WebGLRenderer({canvas:canvas, precision:"mediump", antialias: true,  alpha: true });
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

        scene = new THREE.Scene();

        geo['box'] =  new THREE.BufferGeometry().fromGeometry( new THREE.BoxGeometry(1,1,1) );
        geo['sphere'] = new THREE.SphereBufferGeometry(1);
        geo['cylinder'] =  new THREE.BufferGeometry().fromGeometry( new THREE.CylinderGeometry(1,1,1) );
        geo['cone'] =  new THREE.BufferGeometry().fromGeometry( new THREE.CylinderGeometry(0,1,0.5) );
       // geo['capsule'] =  this.capsuleGeo( 1 , 1 );


        //mat['statique'] = new THREE.MeshBasicMaterial({ color:0x444444, name:'statique' });
        mat['move'] = new THREE.MeshBasicMaterial({ color:0xFF8800, name:'move', wireframe:true });
        mat['sleep'] = new THREE.MeshBasicMaterial({ color:0x888888, name:'sleep', wireframe:true });

        var helper = new THREE.GridHelper( 200, 50 );
        helper.setColors( 0x999999, 0x999999 );
        helper.material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors, transparent:true, opacity:0.1 } );
        scene.add( helper );

        // event

        window.addEventListener( 'resize', view.resize, false );
        this.resize();

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
        var mtx0 = new THREE.Matrix4().makeTranslation(0, 0,0);
        var mtx1 = new THREE.Matrix4().makeTranslation(0, height*0.5,0);
        var mtx2 = new THREE.Matrix4().makeTranslation(0, -height*0.5,0);
        g.merge( m0, mtx0);
        g.merge( m1, mtx1);
        g.merge( m2, mtx2);
        return new THREE.BufferGeometry().fromGeometry( g );
    
    };

    view.reset = function () {

        var m;
        while( meshs.length > 0 ){ 
            m = meshs.pop();
            scene.remove( m );
        }

        while( extraGeo.length > 0 ){ 
            extraGeo.pop().dispose();
        }

        

    };

    view.add = function ( o ) {

        var type = o.type || 'box';
        var mesh = null;

        if(type == 'plane') return;

        var size = o.size || [1,1,1];
        var pos = o.pos || [0,0,0];
        var rot = o.rot || [0,0,0];

        if(type == 'capsule'){
            var g = this.capsuleGeo( size[0] , size[1]*0.5 );
            extraGeo.push(g)
            mesh = new THREE.Mesh( g, mat.move );
        }
        else{ 
            mesh = new THREE.Mesh( geo[type], mat.move );
            mesh.scale.set( size[0], size[1], size[2] );
        }

        
        mesh.position.set( pos[0], pos[1], pos[2] );

        scene.add(mesh);

        //meshs.unshift( mesh );
        if( o.mass !== 0 ) meshs.push( mesh );

    };

    view.update = function(ar){

        var i = meshs.length, a = ar, n, m;

        while(i--){
            m = meshs[i];
            n = i * 8;

            if ( a[n] ) {
                
                m.position.set( a[n+1], a[n+2], a[n+3] );
                m.quaternion.set( a[n+4], a[n+5], a[n+6], a[n+7] );
                if ( m.material.name == 'sleep' ) m.material = mat.move;

            } else {

                if ( m.material.name == 'move' ) m.material = mat.sleep;
            
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

    view.resize = function () {

        vs.h = window.innerHeight;
        vs.w = window.innerWidth - vs.x;

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