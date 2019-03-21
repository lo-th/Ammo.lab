function demo () {

    view.moveCam({ theta:0, phi:60, distance:100, target:[0,0,0] });

    physic.set(); // reset default setting

    // infinie plane
    physic.add({type:'plane', group:1});

    // side wall
    physic.add({type:'box', group:1, size:[100,20,1], pos:[0,10,50.5] });
    physic.add({type:'box', group:1, size:[100,20,1], pos:[0,10,-50.5] });
    physic.add({type:'box', group:1, size:[1,20,100], pos:[50.5,10,0] });
    physic.add({type:'box', group:1, size:[1,20,100], pos:[-50.5,10,0] });

    physic.add({ type:'cylinder', name:'bob', size:[2,8,2], pos:[0,2,0], mass:10, flag:2, kinematic:true, friction:0.01 });
    
    var i, s, x, y, t;
    for( i = 0; i < 80; i++){
        t = Math.randInt(0,1)
        x = Math.rand(-50, 50);
        z = Math.rand(-50, 50);
        s = Math.rand(0.5, 5);
        physic.add({ type:t===1 ?'box':'sphere', size:[s,s,s], pos:[x,s*0.5,z], mass:s, state:4 });
    }

    view.activeRay( rayMove );

};

function rayMove ( m ) {

    physic.matrix( [{ name:'bob', pos:[ m.x, m.y+4, m.z ] }] );

};