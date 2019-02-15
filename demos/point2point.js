function demo() {

    view.moveCam({ theta:0, phi:20, distance:100, target:[0,2,0] });

    physic.add({type:'plane', friction:0.6, restitution:0.1 }); // infinie plane

    var i, x, y, z, s;
    var geo = view.getGeo();
    
    for( i = 0; i < 250; i++){

        x = Math.sin(i*0.025) * 40;
        y = 60 + Math.sin(i*0.5) * 15;
        z = Math.cos(i*0.025) * 40;

        physic.add({ type:'sphere', size:[1], pos:[x, y, z], mass:0.25, state:4, name:i });

        if(i>0) physic.add({ type:'joint_p2p', b1:(i-1), b2:i, pos1:[0,-1,0], pos2:[0,1,0], collision:true });

    }

    physic.add({ type:'joint_p2p', b1:0, b2:249, pos1:[0,-2,0], pos2:[0,2,0], collision:true });


    for( i = 0; i<40; i++ ){
        x = Math.rand(-50, 50);
        z = Math.rand(-50, 50);
        s = Math.rand(5, 15);
        physic.add({ type:'box', geometry:geo.dice, size:[s,s,s], pos:[x,s*0.5,z], mass:s });
    }

}