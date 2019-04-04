
var debug = false;
var mat = {};
var ball;

function demo() {

    view.hideGrid();

    view.addSky({ url:'photo.jpg', hdr:true });

    view.moveCam({ theta:-20, phi:0, distance:150, target:[0,305,0] });

    physic.set({

        fps:60,
        substep:2,// more substep = more accurate default set to 2
        gravity:[0,-9.8,0],
        worldscale:10,

    })

    view.load ( ['basket.sea'], afterLoadGeometry, true, true );

};

function afterLoadGeometry () {

    initMaterials();

    var bounce = 0.6;
    var friction = 0.5;

    physic.add({ type:'plane', friction:0.5, restitution:bounce }); // infinie plane

    physic.add({ 
        name:'foot', type:'mesh', mass:0,
        shape:view.getGeometry( 'basket', 'B_foot' ),
        friction: friction, restitution: bounce,
        material: mat.base,
    });

    physic.add({ 
        name:'panel', type:'mesh', mass:0,
        shape:view.getGeometry( 'basket', 'B_panel' ),
        friction: friction, restitution: bounce,
        material:mat.panel,
    });

    physic.add({ 
        name:'base', type:'mesh', mass:0,
        shape:view.getGeometry( 'basket', 'B_base' ),
        pos:[0,305,-37.5],
        friction: friction, restitution: bounce,
        material: mat.metal,
    });

    /*physic.add({ 
        name:'circle', type:'mesh', mass:10,
        shape:view.getGeometry( 'basket', 'B_circle' ),
        pos:[0,305,-28],
        friction: friction, restitution: bounce,
        material: mat.metal,
    });*/

    var shapes = [ {type:'box', pos:[0,0,2.7], size:[11.6, 2 , 5.4 ]} ];
    var r = 360 / 24;
    var ra = (Math.PI*2) / 24;
    var x, z, a, radius = 22.3;

    for(var i = 0; i < 24; i++ ){

        a = (ra*i) + (ra*0.5);
        x = 0 + (radius * Math.cos( a ));
        z = 28 + (radius * Math.sin( a ));
        shapes.push(  {type:'cylinder', pos:[x,0,z], size:[1, 5.87, 1 ], rot:[0,90-((r*i) + (r*0.5)),90 ] } )

    }

    physic.add({ 
        name:'circle', type:'compound', mass:10,
        geometry:view.getGeometry( 'basket', 'B_circle' ),
        shapes:shapes,
        debug:false,
        pos:[0,305,-28],
        friction: friction, restitution: bounce,
        material: mat.metal,
    });

    // pivot joint
    physic.add({ type:'joint_hinge', name:'joint', b1:'base', b2:'circle', pos1:[0,0,8.5], pos2:[0,0,0], axe1:[1,0,0], axe2:[1,0,0], collision:false, limit:[-5,5, 0.9, 0.3, 0.1 ], useA:true })

    // ball

    ball = physic.add({ 
        name:'ball', type:'highsphere', mass:6.24, 
        size:[12.4], pos:[0,400,0], 
        friction: friction, restitution:bounce, 
        material: mat.bball 
    });

    // net geometry

    var max = 24;
    var netGeometry;

    var tmpGeometry = new THREE.CylinderGeometry( 22.5, 22.5, -35, max, 5, true );
    tmpGeometry.mergeVertices();

    netGeometry = new THREE.BufferGeometry().fromGeometry( tmpGeometry );
    tmpGeometry.dispose();
    netGeometry.translate(0,-17.5,0);
    netGeometry.rotateY( Math.PI );
    var v = netGeometry.attributes.position.array;
    var lng = v.length/3;

    for( var i = 0; i < lng; i++ ) {
        n = i*3;
        y = Math.floor( v[n+1] );
        if(y === -7 ) { v[n] *= 0.92; v[n+2] *= 0.92; }
        if(y === -14 ) { v[n] *= 0.72; v[n+2] *= 0.72; }
        if(y === -21 ) { v[n] *= 0.5; v[n+2] *= 0.5; }
        if(y === -28 ) { v[n] *= 0.5; v[n+2] *= 0.5; }
        if(y === -35 ) { v[n] *= 0.54; v[n+2] *= 0.54; }
    }

    netGeometry.attributes.position.needsUpdate = true;
    
    //

    physic.add({

        name: 'net',
        type:'softMesh',
        shape: netGeometry,
        material: debug ? mat.debugMat : mat.net,
        
        pos:[0,305.5,0],

        mass:1,
        state:4,

        viterations: 30,// Velocities solver iterations 10
        piterations: 30,// Positions solver iterations 10
        citerations: 10,// Cluster solver iterations 4
        diterations: 0,// Drift solver iterations 0
       
        friction: 0.3,// Dynamic friction coefficient [0,1]
        damping: 0.3,// Damping coefficient [0,1]
        pressure: 0,// Pressure coefficient [-inf,+inf]

        drag:0.5,// Drag coefficient [0,+inf]
        lift:0.5,// Lift coefficient [0,+inf]
        matching: 0.3, // Pose matching coefficient [0,1]
        volume: 0,// Volume conversation coefficient [0,+inf] def:0

        hardbess: 0,
        stiffness: 0.3,

        margin:2.5,
        //fromfaces:true,

    });

    // get final vertrices
    var n, nodes = [];
    var v = physic.byName('net').geometry.realVertices;
    var lng = v.length/3;
    for( var i = 0; i<lng; i++ ){
        n = i * 3;
        if( v[n+1] > -0.5 ) nodes.push( i );
        //if( v[n+1] > 17 ) topPoint.push( i );
    }


    // attach to circle
    physic.anchor({ nodes:nodes, soft:'net', body:'circle' });

    physic.postUpdate = update;

}

function update () {

    //var ball = physic.byName('ball');
    if( ball.position.y < 80 ) physic.matrix( [ { name:'ball', pos: [ Math.rand(-20,20), 360, Math.rand(-20,20)], noVelocity:true } ] );

}

function initMaterials () {

    // note: material is not recreated on code edit

    mat['debugMat'] = view.material({
        name:'debugMat',
        color: 0x000000,
        wireframe:true
    }, 'Basic' );

    mat['base'] = view.material({
        name:'base',
        color: 0x111111,
        roughness: 0.4,
        metalness: 0.6,
    });

    mat['metal'] = view.material({
        name:'metal',
        color: 0xbd2b1c,
        roughness: 0.2,
        metalness: 0.8,
    });

    mat['panel'] = view.material({
        name:'panel',
        roughness: 0.5,
        metalness: 0.6,
        map: view.texture( 'basket.png', { flip:false }),
        transparent: true,
        depthWrite: false,
    });

    mat['bball'] = view.material({
        name:'bball',
        roughness: 0.4,
        metalness: 0.7,
        map: view.texture( 'bball.jpg', { repeat:[2,1], flip:false }),
        normalMap: view.texture( 'bball_n.jpg', { repeat:[2,1], flip:false }),
    });

    mat['net'] = view.material({
        name:'net',
        roughness: 0.9,
        metalness: 0.2,
        map: view.texture( 'net256.png', { repeat:[12,1], flip:false }),
        bumpMap: view.texture( 'net256_n.png', { repeat:[12,1], flip:false }),
        transparent: true,
        depthWrite: false,
        alphaTest: 0.1,
        side: THREE.DoubleSide,
    });

}