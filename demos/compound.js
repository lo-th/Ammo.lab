function demo() {

    //view.hideGrid();

    view.moveCam({ theta:40, phi:40, distance:60, target:[0,1,0] });

    physic.set({

        fps:60,
        substep:2,// more substep = more accurate default set to 2
        gravity:[0,-9.8,0],
        worldscale:1,

    })

    physic.add({ type:'plane', friction:0.5, restitution:0.2 }); // infinie plane

    var i = 100;
    while(i--){

        physic.add({
            type:'compound',
            mass:1,
            pos:[Math.rand(-5,5),Math.rand(10,50),Math.rand(-5,5)],
            shapes:[
               { type:'box', pos:[0,-2,0], size:[ 0.2,4,0.2 ] },
               { type:'sphere', pos:[0,0.5,0], size:[ 0.5 ] },
            ]
        })
    }

};