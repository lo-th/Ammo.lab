function demo() {

    view.moveCam({ theta:0, phi:20, distance:100, target:[0,0,0] });

    view.addSky({ url:'photo.jpg' });

    physic.set({

        fps:60,
        substep:10,
        gravity:[0,-9.8,0],
        worldscale:1,

    })

    view.hideGrid();

    // static box
    physic.add({ type:'box', size:[10,10,10], pos:[0,-5,0], rot:[0,0,0], density:0, material:'hide' });

    var cloth = view.material({
        name:'cloth',
        roughness: 0.9,
        metalness: 0.1,
        sheen: new THREE.Color( 0.9, 0, 0 ),
        color: new THREE.Color( 0.1, 0, 0 ),
        side:'Double',
        vertexColors:THREE.VertexColors,
    });

    physic.add({ 
        type:'softCloth', 
        name:'cloth', 
        material: cloth,
        mass:1, state:4, pos:[0,0,0], 
        size:[100,0,100],
        div:[64,64],
        viterations:10,
        piterations:10,
        citerations:10,
        diterations:10,
        fixed: 1+2+4+8,
        gendiags:true,
        margin:0.05
    });


    physic.add({ type:'sphere', size:[3], pos:[-20, 100, 0], density:0.1});
    physic.add({ type:'sphere', size:[3], pos:[20, 200, 0], density:0.1});
    physic.add({ type:'sphere', size:[3], pos:[0, 300, -20], density:0.1});
    physic.add({ type:'sphere', size:[3], pos:[0, 400, 20], density:0.1});

    //anchor({soft:'cloth', body:'ground', pos:0});
    //anchor({soft:'cloth', body:'ground', pos:100});

    physic.postUpdate = update;

}

function update () {

    var r = [];
    // get list of rigidbody
    var bodys = physic.getBodys();

    bodys.forEach( function ( b, id ) {

        if( b.position.y < -20 ){
            r.push( { name:b.name, pos: [ Math.rand(-20,20), 100, Math.rand(-20,20)], noVelocity:true } );
        }

    });

    // apply new matrix to bodys
    physic.matrix( r );

}