CLEAR({broadphase:"BVT", timer:false, timestep:1/60, iteration:2, G:-10});

function initDemo()
{
    NAME("Dice Pool");
    // ground
    ADD({ type:"ground", size:[20,3,20], pos:[0,-1.5,0] });
    // wall
    ADD({ type:"boxbasic", size:[20,10,1], pos:[0,5,-9.5] });
    ADD({ type:"boxbasic", size:[20,10,1], pos:[0,5,9.5] });
    ADD({ type:"boxbasic", size:[1,10,18], pos:[-9.5,5,0] });
    ADD({ type:"boxbasic", size:[1,10,18], pos:[ 9.5,5,0] });

    var max = 333;
    var px, pz, py, s;
    
    // phy = [friction, restitution];

    for (var i=0; i!==max; ++i ){
        s = 0.1+Math.random();
        px = -1+Math.random()*2;
        pz = -1+Math.random()*2;
        py = 1+i;
        ADD({ type:"dice", size:[s,s,s], pos:[px,py,pz], phy:[0.5, 0], mass:s });
    }
}