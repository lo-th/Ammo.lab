function demo() {

    cam ( 90, 20, 100 );

    add({type:'plane', friction:0.6, restitution:0.1 }); // infinie plane

    var i, x, y, z, s;
    var geo = view.getGeo();
    
    for( i = 0; i < 250; i++){

        x = Math.sin(i*0.025) * 40;
        y = 60 + Math.sin(i*0.5) * 15;
        z = Math.cos(i*0.025) * 40;

        add({ type:'sphere', size:[1], pos:[x, y, z], mass:0.25, state:4 });

        if(i>0) add({ type:'joint_p2p', body1:(i-1), body2:i, pos1:[0,-1,0], pos2:[0,1,0], collision:true });

    }

    add({ type:'joint_p2p', body1:0, body2:249, pos1:[0,-2,0], pos2:[0,2,0], collision:true });


    for( i = 0; i<40; i++ ){
        x = Math.rand(-50, 50);
        z = Math.rand(-50, 50);
        s = Math.rand(5, 15);
        add({ type:'box', geometry:geo.dice, size:[s,s,s], pos:[x,s*0.5,z], mass:s });
    }


}