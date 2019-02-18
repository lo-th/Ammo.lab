
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
    view.addMap('net.png', 'net');

    view.mat.net.side = THREE.DoubleSide;
    view.mat.net.transparent = true;
    view.mat.net.alphaTest = 0.1;
    view.mat.net.roughness = 0.9;
    view.mat.net.metalness = 0.1;
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

    physic.add({ type:'sphere', name:'ball', size:[12.4], pos:[0,400,0], mass:6.24, friction: friction, restitution:bounce });

    // net

    physic.add({

        name: 'net',
        type:'softMesh',
        shape:view.getGeometry( 'basket', 'B_net' ),
        material: debug ? debugMat : view.mat.net,
        
        pos:[0,305,0],

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

    // attach to circle
    physic.anchor({ node:60, soft:'net', body:'circle' });
    physic.anchor({ node:61, soft:'net', body:'circle' });
    physic.anchor({ node:62, soft:'net', body:'circle' });
    physic.anchor({ node:63, soft:'net', body:'circle' });
    physic.anchor({ node:64, soft:'net', body:'circle' });
    physic.anchor({ node:65, soft:'net', body:'circle' });
    physic.anchor({ node:66, soft:'net', body:'circle' });
    physic.anchor({ node:67, soft:'net', body:'circle' });
    physic.anchor({ node:68, soft:'net', body:'circle' });
    physic.anchor({ node:69, soft:'net', body:'circle' });
    physic.anchor({ node:70, soft:'net', body:'circle' });
    physic.anchor({ node:71, soft:'net', body:'circle' });



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