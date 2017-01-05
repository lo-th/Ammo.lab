function demo () {

    cam ( 0, 60, 100 );

    // infinie plane
    add({type:'plane', group:1});

    // side wall
    add({type:'box', group:1, size:[100,20,1], pos:[0,10,50.5] });
    add({type:'box', group:1, size:[100,20,1], pos:[0,10,-50.5] });
    add({type:'box', group:1, size:[1,20,100], pos:[50.5,10,0] });
    add({type:'box', group:1, size:[1,20,100], pos:[-50.5,10,0] });

    add({ type:'cylinder', name:'bob', size:[2,4,2], pos:[0,2,0], mass:10, flag:2, state:4, friction:0.01 });
    
    var i, s, x, y, t;
    for( i = 0; i < 80; i++){
        t = Math.randInt(0,1)
        x = Math.rand(-50, 50);
        z = Math.rand(-50, 50);
        s = Math.rand(0.5, 5);
        add({ type:t===1 ?'box':'sphere', size:[s,s,s], pos:[x,s*0.5,z], mass:s });
    }

    view.activeRay( rayMove );

};

function rayMove ( m ) {

    var r = [];
    r.push( [ 'bob', [ m.position.x, m.position.y+2, m.position.z ], m.quaternion.toArray() ] );
    ammo.send( 'matrix', { r:r } );

};