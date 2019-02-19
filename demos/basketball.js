
var debug =  false;

function demo() {

    view.hideGrid();

    view.addSky({url:'photo.jpg', hdr:true });

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

    var debugMat = view.mat.move.clone();
    debugMat.color.setHex( 0x111111);
    debugMat.wireframe = true;

    var basic = view.mat.move.clone();
    basic.color.setHex( 0x111111);
    basic.roughness = 0.4;
    basic.metalness = 0.6;

    var circle = view.mat.move.clone();
    circle.color.setHex( 0xbd2b1c);
    circle.roughness = 0.2;
    circle.metalness = 0.8;

    view.addMap('basket.png', 'basket');
    //view.addMap('net.png', 'net');
    view.addMap('basketball.jpg', 'bball');

    var netMat = view.mat.move.clone();
    netMat.color.setHex( 0xffffff);
    netMat.side = THREE.DoubleSide;
    netMat.depthWrite = false;
    netMat.transparent = true;
    netMat.roughness = 0.9;
    netMat.metalness = 0.1;
    netMat.map = view.makeTexture( 'net256.png', { repeat:[12,1], flip:false });
    netMat.normalMap = view.makeTexture( 'net256.png', { repeat:[12,1], flip:false });

    view.mat.basket.transparent = true;

    physic.addMat( debugMat );
    physic.addMat( basic );
    physic.addMat( circle );

    var bounce = 0.6;
    var friction = 0.5

    physic.add({ type:'plane', friction:0.5, restitution:bounce }); // infinie plane

    physic.add({ 
        name:'foot', type:'mesh', mass:0,
        shape:view.getGeometry( 'basket', 'B_foot' ),
        friction: friction, restitution: bounce,
        material: basic,
    });

    physic.add({ 
        name:'panel', type:'mesh', mass:0,
        shape:view.getGeometry( 'basket', 'B_panel' ),
        friction: friction, restitution: bounce,
        material:view.mat.basket,
    });

    physic.add({ 
        name:'base', type:'mesh', mass:0,
        shape:view.getGeometry( 'basket', 'B_base' ),
        pos:[0,305,-37.5],
        friction: friction, restitution: bounce,
        material:circle,
    });

    physic.add({ 
        name:'circle', type:'mesh', mass:0,
        shape:view.getGeometry( 'basket', 'B_circle' ),
        pos:[0,305,-28],
        friction: friction, restitution: bounce,
        material:circle,
    });




    // ball

    physic.add({ type:'highsphere', name:'ball',  size:[12.4], pos:[0,400,0], mass:6.24, friction: friction, restitution:bounce, material:view.mat.bball });

    // net

    var customGeomtry = true;
    var max = 24;
    var netGeometry;

    var tmpGeometry = new THREE.CylinderGeometry( 22.5, 22.5, -35, max, 5, true );
    tmpGeometry.mergeVertices();

    if( customGeomtry ){

        var netGeometry = new THREE.BufferGeometry().fromGeometry( tmpGeometry );
        netGeometry.translate(0,-17.5,0);
        netGeometry.rotateY( Math.PI );
        var v = netGeometry.attributes.position.array;
        var lng = v.length/3;

        for( var i = 0; i<lng; i++ ) {
            n = i*3;
            y = Math.floor( v[n+1] );
            if(y === -7 ) { v[n] *= 0.92; v[n+2] *= 0.92; }
            if(y === -14 ) { v[n] *= 0.72; v[n+2] *= 0.72; }
            if(y === -21 ) { v[n] *= 0.5; v[n+2] *= 0.5; }
            if(y === -28 ) { v[n] *= 0.5; v[n+2] *= 0.5; }
            if(y === -35 ) { v[n] *= 0.54; v[n+2] *= 0.54; }

            //if(y>-1) console.log('r', i)
        }

        netGeometry.attributes.position.needsUpdate = true;

        tmpGeometry.dispose();

    } else {

        netGeometry = view.getGeometry( 'basket', 'B_net' );

    }

    //

    physic.add({

        name: 'net',
        type:'softMesh',
        shape: netGeometry,
        material: debug ? debugMat : netMat,
        
        pos:[0,305.5,0],

        mass:1,
        state:4,

        viterations: 10,// Velocities solver iterations 10
        piterations: 5,// Positions solver iterations 10
        citerations: 4,// Cluster solver iterations 4
        diterations: 0,// Drift solver iterations 0
       
        friction: 0.5,// Dynamic friction coefficient [0,1]
        damping: 0.3,// Damping coefficient [0,1]
        pressure: 0,// Pressure coefficient [-inf,+inf]

        drag:0.5,// Drag coefficient [0,+inf]
        lift:0.5,// Lift coefficient [0,+inf]
        matching: 0.3, // Pose matching coefficient [0,1]
        vc: 0,// Volume conversation coefficient [0,+inf] def:0

        hardbess: 0,
        stiffness: 0.3,

        margin:2.5,
        //fromfaces:true,

    });


    var n, topPoint = [];
    var v = physic.byName('net').geometry.realVertices;
    var lng = v.length/3;
    for( var i = 0; i<lng; i++ ){
        n = i * 3;
        if( v[n+1] > 305 ) topPoint.push( i );
    }


    // attach to circle
    for( var i = 0, l = topPoint.length; i<l; i++ ){
        physic.anchor({ node:topPoint[i], soft:'net', body:'circle' });
    }

    physic.postUpdate = update;


}

function update () {

    var r = [];
    // get list of rigidbody
    var bodys = physic.getBodys();

    bodys.forEach( function ( b, id ) {

        if( b.name==='ball' && b.position.y < 80 ){
            r.push( { name:b.name, pos: [ Math.rand(-20,20), 360, Math.rand(-20,20)], noVelocity:true } );
        }

    });

    // apply new matrix to bodys
    physic.matrix( r );

}