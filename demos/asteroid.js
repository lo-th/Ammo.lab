
function demo () {

    cam ({ azim:0, polar:60, distance:40 });
    view.hideGrid();

    set({
        fps:60,
        numStep:2,
        gravity:[0,0,0],
    })


    var geo = view.getGeo();

    add({ 

        type:'planet',
        name:'planet',
        radius:10,
        height:6,
        resolution:20,
        frequency : [0.1,0.5], // frequency of noise
        level : [1,0.25], // influence of octave
        expo: 2,

        density:0, 
        friction:0.5, 
        bounce:0.2,
        isBuffer:true,
        
    });

    //add({ type:'sphere', name:'planete', geometry:geo.highsphere, size:[10], pos:[0,0,0], density:0, friction:0.5, restitution:0.6 });
    
    var s, x, y, z;
    for(var i = 0; i<100; i++){
        x = Math.rand(-100, 100);
        y = Math.rand(-100, 100);
        z = Math.rand(-100, 100);
        s = Math.rand(0.5, 2);
        add({ type:'box', geometry:geo.dice, size:[s,s,s], pos:[x,y,z], density:s, friction:0.5, restitution:0.6, name:'box'+i });
    }

    view.update = update;

};

function update() {

    var p, m, r = [];

    view.bodys.forEach( function( b, id ) {

        p = b.position.clone().negate().normalize().multiplyScalar(9.8);
        r.push( [ b.name, 'force', p.toArray() ] );

    });

   forceArray( r );

};