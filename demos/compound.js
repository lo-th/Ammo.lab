function demo() {

    view.moveCam({ theta:40, phi:40, distance:60, target:[0,1,0] });

    view.hideGrid( true );

    physic.set({

        fps:60,
        substep:2,
        gravity:[0,-9.8,0],
        worldscale:1,

    })

    view.addSky({ url:'photo.jpg', visible:true });

    var mat = view.material({ name:'mobil',
        color:0xcbad7b,
        roughness: 0.4,
        metalness: 0.5
    });

    physic.add({ type:'plane', friction:0.5, restitution:0.5 }); // infinie plane

    var s = (6*0.5) - 0.3; 
    var tableShape = [
        { type:'box', pos:[0,0,0], size:[ 6,0.5,6 ] },
        { type:'box', pos:[s,-2.25,s], size:[ 0.6,4,0.6 ] },
        { type:'box', pos:[-s,-2.25,s], size:[ 0.6,4,0.6 ] },
        { type:'box', pos:[s,-2.25,-s], size:[ 0.6,4,0.6 ] },
        { type:'box', pos:[-s,-2.25,-s], size:[ 0.6,4,0.6 ] },
    ]

    var chairShape = [
        { type:'box', pos:[0,0,0], size:[ 3,0.5,3 ] },
        { type:'box', pos:[1.2,-1.6,1.2], size:[ 0.4,3,0.4 ] },
        { type:'box', pos:[-1.2,-1.6,1.2], size:[ 0.4,3,0.4 ] },
        { type:'box', pos:[1.2,-1.6,-1.2], size:[ 0.4,3,0.4 ] },
        { type:'box', pos:[-1.2,-1.6,-1.2], size:[ 0.4,3,0.4 ] },
        { type:'box', pos:[1.2,1.6,-1.2], size:[ 0.4,3,0.4 ] },
        { type:'box', pos:[-1.2,1.6,-1.2], size:[ 0.4,3,0.4 ] },
        { type:'box', pos:[0,2.5,-1.2], size:[ 2.3,1,0.3 ] },
    ]

    var i = 200, t;
    while(i--){

        t = Math.randInt(0,5);

        physic.add({
            type:'compound',
            mass:1,
            pos:[Math.rand(-5,5),(i+1)*6,Math.rand(-5,5)],
            shapes:t===5 ? tableShape : chairShape,
            friction:0.5, 
            restitution:0.5,
            material:mat
        })
    }

};