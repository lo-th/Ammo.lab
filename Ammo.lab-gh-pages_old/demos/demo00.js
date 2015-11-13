CLEAR({broadphase:"BVT", timer:false, timestep:1/60, iteration:2, G:-10});

function initDemo()
{
    NAME("Basic shapes");
    // ground
    ADD({type:"ground", size:[20,3,20], pos:[0,-1.5,0], mass:0});

    // NOTE: 
    // you can choose broadphase BVT, SAP or SIMPLE
    // use 1 unit for one meter

    // dynamique object
    var max = 100;
    var px, pz, py, t, n = 5;
    var sx, sy, sz;

    for (var i=0; i!==max; ++i ){
        t = Math.floor(Math.random()*n)+1;
        px = -1+Math.random()*2;
        pz = -1+Math.random()*2;
        py = 2 + i;

        sx = 0.2+Math.random();
        sy = 0.2+Math.random();
        sz = 0.2+Math.random();

        switch(t){
            case 1: ADD({ type:"box", size:[sx,sy,sz], pos:[px,py,pz], mass:1 }); break;
            case 2: ADD({ type:"sphere", size:[sx*0.5], pos:[px,py,pz], mass:1 }); break;
            case 3: ADD({ type:"cylinder", size:[sx*0.5,sy,sx*0.5], pos:[px,py,pz], mass:1 }); break;
            case 4: ADD({ type:"capsule", size:[sx*0.5,sy], pos:[px,py,pz], mass:1 }); break;
            case 5: ADD({ type:"cone", size:[sx*0.5,sy], pos:[px,py,pz], mass:1 }); break;
        }
    }
}