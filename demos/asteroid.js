
function demo () {

    view.moveCam({ theta:0, phi:60, distance:40, target:[0,0,0] });
    
    view.hideGrid();

    view.addSky({url:'milkyway.jpg', hdr:true });

    physic.set({
        fps:60,
        substep:2,
        gravity:[0,0,0],
    })

    // make planet

    var o = { 

        type:'mesh',
        name:'planet',
        isBuffer:true,
        radius:10,
        height:6,
        resolution:20,
        frequency : [0.1,0.5], // frequency of noise
        level : [1,0.25], // influence of octave
        expo: 2,

        density:0, 
        friction:0.5,
        bounce:0.2,
        
    };

    var planet = new Planet( o );

    o.shape = planet.geometry;
    o.material = planet.material;

    physic.add( o );

    // make cube object
    
    var sx, sy, sz, x, y, z;
    for(var i = 0; i<200; i++){
        x = Math.rand(20, 100)*(Math.randInt(0, 1)? -1: 1);
        y = Math.rand(20, 100)*(Math.randInt(0, 1)? -1: 1);
        z = Math.rand(20, 100)*(Math.randInt(0, 1)? -1: 1);

        sx = Math.rand(0.6, 2);
        sy = Math.rand(0.6, 2);
        sz = Math.rand(0.6, 2);
        physic.add({ type:'box', size:[sx,sy,sz], pos:[x,y,z], density:(sx+sy+sz)/3, friction:0.5, restitution:0.6, name:'box'+i });
    }


    physic.byName( 'planet' ).castShadow = true

    physic.postUpdate = update;

};

function update() {

    var p, m, r = [];
    // get list of rigidbody
    var bodys = physic.getBodys();

    bodys.forEach( function( b, id ) {

        p = b.position.clone().negate().normalize().multiplyScalar(9.8);
        r.push( { name:b.name, type:'force', direction:p.toArray() } );

    });

    // apply forces to bodys
    physic.forces( r );

};