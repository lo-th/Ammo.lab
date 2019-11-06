function demo() {

    view.moveCam({ theta:90, phi:20, distance:40, target:[0,1,0] });
    
    physic.set({
        fps:60,
        substep:10,
        gravity:[0,-10,0],
    })

    view.load ( 'pig.sea', afterLoad, true );

}

function afterLoad () {

    var matPig = view.material({
        name:'pig',
        color: 0xF9A195,
        roughness: 0.9,
        metalness: 0.1,
        sheen: new THREE.Color( 0.9, 0, 0 ),
        //vertexColors:THREE.VertexColors,
    });

    physic.add({ type:'plane' }); // infinie plane

    physic.add({ type:'box', size:[40,2,40], pos:[0,-1,0], rot:[0,0,0], mass:0 });

    physic.add({ type:'cylinder', size:[2,10,2], rot:[0,1,90], pos:[0,0,0], mass:0 });
    physic.add({ type:'cylinder', size:[2,10,2], rot:[0,1,90], pos:[0,0,4], mass:0 });
    physic.add({ type:'cylinder', size:[2,10,2], rot:[0,1,90], pos:[0,0,-4], mass:0 });

    var geo = view.getGeo();

    var i = 6;

    while(i--){

        var y = 15+(i*15);
        var r = Math.randInt(0,360);

        physic.add({

            type:'softMesh',
            shape:view.getGeometry( 'pig', 'pig' ),
            material: matPig,
            
            pos:[0,y,0],
            size:[2.5],
            rot:[0,r,0],

            mass:2,
            state:4,

            viterations: 10,
            piterations: 2,
            citerations: 1,
            diterations: 4,

            friction: 0.8,
           //damping: 0.001,
            pressure: 250,
            stiffness: 0.9,

            margin:0.05,
            //fromfaces:true,
            bendingConstraint:2,
            cluster: 16,

        });

    }

}