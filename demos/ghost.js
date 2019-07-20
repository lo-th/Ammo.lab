var speed = 10;
var linear = new THREE.Vector3();
var angular = new THREE.Vector3();
var axis = new THREE.Vector3(0,1,0);

function demo() {

	view.moveCam({ theta:-90, phi:20, distance:20, target:[0,2.5,0] });

	physic.set({

        fps:60,
        substep:2,
        gravity:[0,-10,0],
        fixed: true,

    })

    physic.add({ type:'plane', friction:1 }); // infinie plane

    physic.add({ type:'box', name:'zone', size:[5,5,5], pos:[0,2.5,0], ghost:true });

    physic.add({ type:'sphere', name:'ball', size:[1], pos:[0,20,0], mass:1, state:4 });

    physic.prevUpdate = up;


}

function up () {

    var rs = (user.key[0] ? user.key[0] : user.key[2]) * speed; // Q-D or A-D
    var ts = (user.key[1] ? user.key[1] : user.key[3]) * speed; // Z-S or W-S // front-back
    //var rx = user.key[2] * speed; // left-right
    
    linear.set( rs, 0 , ts ).applyAxisAngle( axis, -view.getAzimuthal() );

    //physic.options( [{name:'ball', linearVelocity:linear.toArray(), angularVelocity:[0, -rx, 0] }] );
    physic.forces( [{name:'ball', type:'forceCentral', direction:linear.toArray() }] );

}