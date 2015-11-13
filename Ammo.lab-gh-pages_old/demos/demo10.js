CLEAR({broadphase:"BVT", timer:false, timestep:1/60, iteration:2, G:-10});

function initDemo()
{
    NAME("Jenga tower");
    // ground
    ADD({type:"ground", size:[20,4,20], pos:[0,-2,0]});

    // add dynamique object
    var height = 30;
    var radius = 3;
    var sx = 0.5, sy = 0.3, sz = 1.5;
    var px, py, pz, angle, rad;

    for (var j = 0; j < height; j++) {
        for (var i = 0; i < 10; i++) {
            rad = radius-(j*0.02);
            angle = (Math.PI * 2 / 10 * (i + (j & 1) * 0.5));
            px = Math.cos(angle) * rad;
            py = (sy*0.5) + j * sy;
            pz = -Math.sin(angle) * rad;

            ADD({ type:"box", size:[sx,sy,sz], pos:[px,py,pz], rot:[0,angle*(180 / Math.PI),0], mass:0.5, phy:[0.5, 0.1] });
        }
    }
}