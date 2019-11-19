// from three.js examples/webgl_physics_convex_break.html

function demo() {

    view.moveCam({ azim:0, polar:55, distance:40, target:[0,6,-4] });

    view.addSky({ url:'photo.jpg', visible:true });
    view.setShadow({ opacity: 0.05 })
    view.showGrid( false );



    // load buggy 3d model
    view.load ( ['diamond.sea'], afterLoad, true, true );

    physic.set({
        gravity:[0,0,0],
    });

}

function afterLoad () {


    

    physic.add({ type:'plane', friction:1 }); // infinie plane


    var s = 2;

    var g1 = view.getGeometry( 'diamond', 'diam_1' );
    var g2 = view.getGeometry( 'diamond', 'diam_2' );
    var g3 = view.getGeometry( 'diamond', 'diam_4' );

    g1.applyMatrix( new THREE.Matrix4().makeScale( s, s, s ) );
    g2.applyMatrix( new THREE.Matrix4().makeScale( s, s, s ) );
    g3.applyMatrix( new THREE.Matrix4().makeScale( s, s, s ) );

    var diamondMat1 = new Diamond( g1, view.getRenderer(), view.getSkyCube() );
    var diamondMat2 = new Diamond( g2, view.getRenderer(), view.getSkyCube() );
    var diamondMat3 = new Diamond( g3, view.getRenderer(), view.getSkyCube() );

    var glass = view.material({
        name:'glass',
        color: 0x3366ff,
        transparent:true,
        metalness:1,
        roughness:0,
        opacity:0.5,
        depthWrite: false,
        premultipliedAlpha:true,
        side: 'Double',
        flatShading: true,
    });


    var D1 = physic.add({ 
        name:'D1', type:'convex',
        shape: g1, 
        geometry: g1, 
        mass:100, size:[1],  pos:[-10,10,0], friction:0.5, rot:[0,0,0],
        breakable:true, breakOption:[ 200, 1, 2, 2 ],
        margin: 0.05,
        material:diamondMat1,
        state:4,
    })

    var D2 = physic.add({ 
        name:'D2', type:'convex',
        shape: g2,
        geometry: g2, 
        mass:100, size:[1],  pos:[10,10,0], friction:0.5, 
        breakable:true, breakOption:[ 200, 1, 2, 2 ],
        margin: 0.05,
        material:diamondMat2,
        state:4,
    });

    var D3 = physic.add({ 
        name:'D3', type:'convex',
        shape: g3,
        geometry: g3, 
        mass:100, size:[1],  pos:[0,10,-15], friction:0.5, 
        breakable:true, breakOption:[ 200, 1, 2, 2 ],
        margin: 0.05,
        material:diamondMat3,
        state:4,
    });

    // physic.post( 'setGravity', { gravity:[ 0, -9.8, 0 ] } )


    setTimeout( function (){ 
        physic.post( 'setGravity', { gravity:[ 0, -9.8, 0 ] }); 
        physic.options( [
            { name:'D1', activate:true, linearVelocity:[0,-100,0], gravity:true },
            { name:'D2', activate:true, linearVelocity:[0,-100,0], gravity:true },
            { name:'D3', activate:true, linearVelocity:[0,-100,0], gravity:true }
        ])

    }, 10000 );

}