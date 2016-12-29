
function demo () {

    cam ( 0, 60, 40 );

    gravity([0,0,0]);

    view.hideGrid();
    view.hideGroundShadow();

    var geo = view.getGeo();

    add({ type:'sphere', name:'planete', geometry:geo.highsphere, size:[10], pos:[0,0,0], mass:0, friction:0.5, restitution:0.6 });
    
    var s, x, y, z;
    for(var i = 0; i<100; i++){
        x = Math.rand(-100, 100);
        y = Math.rand(-100, 100);
        z = Math.rand(-100, 100);
        s = Math.rand(0.5, 2);
        add({ type:'box', geometry:geo.dice, size:[s,s,s], pos:[x,y,z], mass:s, friction:0.5, restitution:0.6 });
    }

    postUpdate = postUp

};

function postUp() {

    var bodys = view.getBody();
    var p, m;

    var r = [];

    bodys.forEach( function( b, id ) {

        p = b.position.clone().negate().normalize().multiplyScalar(9.8);
        r.push( [ id, 'centralForce', [p.x,p.y,p.z], [0,0,0] ] )

    });

    ammo.send( 'multyApplys', {r:r} );

};