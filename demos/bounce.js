//https://jsfiddle.net/oz0vecfu/3/
function demo() {

    view.moveCam({ theta:0, phi:20, distance:10, target:[0,1,0] });

    physic.set({

        fps:60,
        substep:10,// more substep = more accurate simulation default set to 2
        gravity:[0,-10,0],
        worldscale:1,

    })

    // basic geometry body

    physic.add({ type:'plane', friction:0.5, restitution:2 }); // infinie plane

    physic.add({ type:'sphere', size:[1], pos:[0,2,0], state:4, mass:1, friction:0.5,  restitution:1,

        //linearVelocity:1, 
        damping:[0.8,0] 
    }); 


};