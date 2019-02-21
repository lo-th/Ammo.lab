function demo() {

    view.moveCam({ azim:45, polar:30, distance:50, target:[0,0,0] });

    physic.set();

    addTower({ radius:9, height:20, detail:15, pos:[0,0,0], mass:0.4 });

    physic.add({ type:'sphere', mass:3, size:[3], pos:[-40,60,0], restitution:0.1, friction:0.5 });
    physic.add({ type:'sphere', mass:3, size:[3], pos:[-40,500,0], restitution:0.1, friction:0.5 });
    physic.add({ type:'sphere', mass:3, size:[3], pos:[-40,2000,0], restitution:0.1, friction:0.5 });
    physic.add({ size:[ 2, 40, 20], pos:[-35,10,0], rot:[0,0,60], mass:0, restitution:0.2 });
    physic.add({ size:[70, 2, 70], pos:[0,-1,0], rot:[0,0,0], mass:0, restitution:0.5  });

};

function addTower( o ){

    if( o.radius > 45 ) return;

    var tx, ty, tz;
    var detail =  o.detail === "undefined" ? 10 : o.detail;
    var mass =  o.mass === "undefined" ? 1 : o.mass;

    if(o.pos instanceof Array){
        tx = o.pos[0] || 0;
        ty = o.pos[1] || 0;
        tz = o.pos[2] || 0;
    } else {
        tx = ty = tz = 0;
    }

    var px, py, pz, angle, rad;
    var radius = o.radius || 1;
    var height = o.height || 1;
    var sx = o.thickness || 1, sy = o.sy || 1, sz = radius * 5 / detail;

    for(var j = 0; j < height; j++){
        for(var i = 0; i < detail; i++){

            rad = radius;
            angle = (Math.PI * 2 / detail * (i + (j & 1) * 0.5));
            px = tx + Math.cos(angle) * rad;
            py = (ty + (sy) + j * sy) - (sy*0.5);
            pz = tz + -Math.sin(angle) * rad;

            physic.add({

                type:"box",
                size:[sx,sy,sz],
                pos:[px,py,pz],
                rot:[0,angle*(180 / Math.PI),0],
                mass:mass,
                restitution:0.1, 
                friction:0.5,
                //interval:0,
                state:2,

            });
        }
    }
}