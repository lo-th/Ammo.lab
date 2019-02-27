function demo() {

    view.moveCam({ theta:0, phi:30, distance:40, target:[0,1,0] });

    physic.set({

        fps:60,
        substep:2,// more substep = more accurate simulation default set to 2
        gravity:[0,-10,0],
        fixed: true,

    })

    // basic geometry body

    physic.add({ type:'plane', friction:1 }); // infinie plane

    var i = 200, pos = [], s, d, rot = [0,0,90];
    
    while( i-- ) {

        h = Math.rand(0.1,4);
        d = Math.rand(0.1,1);

        pos[0] = Math.rand(-5,5); 
        pos[1] = Math.rand(2,20) + ( i*h );
        pos[2] = Math.rand(-5,5);

        switch( Math.randInt(0,4) ){

            case 0 : physic.add({ type:'sphere',   size:[d,d,d], pos:pos, mass:2, friction:1, angular:0.1 }); break;
            case 1 : physic.add({ type:'box',      size:[d,h,d], pos:pos, mass:2 }); break;
            case 2 : physic.add({ type:'cone',     size:[d,h,d], pos:pos, mass:2, friction:1, rolling:0.3, angular:0.1 }); break;
            case 3 : physic.add({ type:'capsule',  size:[d,h,d], rot:rot, pos:pos, mass:2, friction:1, rolling:0.3, angular:0.1 }); break;
            case 4 : physic.add({ type:'cylinder', size:[d,h,d], rot:rot, pos:pos, mass:2, friction:1, rolling:0.3, angular:0.1 }); break;

        }
    }

};