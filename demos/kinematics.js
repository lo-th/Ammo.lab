function demo () {

    cam ( 0, 60, 40 );

    // infinie plane
    add({type:'plane', group:1});

    add({ type:'box', name:'bob', size:[2,2,2], pos:[0,1,0], mass:10, flag:2, state:4, friction:0.01 });

    
    var s, x, y;
    for(var i = 0; i<40; i++){
        x = Math.rand(-50, 50);
        z = Math.rand(-50, 50);
        s = Math.rand(0.5, 5);
        add({ type:'box', size:[s,s,s], pos:[x,s*0.5,z], mass:s });
    }

    view.activeRay( rayMove );

};

function rayMove ( m ) {

    var o = {
        name:'bob',
        pos:[ m.position.x, m.position.y+1.1, m.position.z ],
        quat: m.quaternion.toArray()
    }

    ammo.send( 'set', o );

};