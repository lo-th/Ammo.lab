var speed = 10;
var linear = new THREE.Vector3();
var angular = new THREE.Vector3();
var axis = new THREE.Vector3(0,1,0);

var p = new THREE.Vector3();
var s = new THREE.Vector3();
var q = new THREE.Quaternion();

var base, arm;

var test = 0;

function demo() {

	view.moveCam({ theta:-90, phi:20, distance:20, target:[0,2.5,0] });

	physic.set({

        fps:60,
        substep:2,
        gravity:[0,-10,0],
        fixed: true,

    })

    physic.add({ type:'plane', friction:1 }); // infinie plane

    var g = new THREE.BoxBufferGeometry(5,2,5);
    var matBase = view.material({name:'base', color:0xaaaaaa });

    base = physic.add({ 
        type:'box', name:'base', 
        size:[5,2,5], 
        pos:[0,1,0], 
        mass:10, 
        state:4,
        geometry:g,
        material:matBase,
    });

    var mat = view.material({name:'truc', color:0x00ff00, transparent:true, opacity:0.5 });
    
    arm = new THREE.Mesh( new THREE.BoxBufferGeometry(2,5,2), mat );
    arm.position.set(0,3.5,0);
    base.add(arm);

    var matkin = view.material({name:'kin', color:0xff0000, wireframe:true }, 'Basic' );

    physic.add({ type:'hardbox', name:'follow', size:[2,5,2], pos:[0,5,0], mass:1, state:4, kinematic:true, material:matkin });

    
    physic.prevUpdate = up;
  //  view.update = up;

    /*if(test===1) physic.postUpdate = go;d
    if(test===2) physic.pastUpdate = go;
    if(test===3) physic.prevUpdate = go;
    if(test===4) arm.updateMatrixWorld = updateMatrixWorld;/*/


}

function up () {

   // var rs = (user.key[0] ? user.key[0] : user.key[2]) * speed; // Q-D or A-D
    var rs = user.key[0] * speed; // Q-D or A-D
    var ts = (user.key[1] ? user.key[1] : user.key[3]) * speed; // Z-S or W-S // front-back
    var rx = user.key[2] * speed; // left-right
    
    linear.set( rs, 0 , ts ).applyAxisAngle( axis, -view.getAzimuthal() );

    physic.options( {name:'base', linearVelocity:linear.toArray(), angularVelocity:[0, -rx, 0] } );
    //physic.forces( [{name:'base', type:'forceCentral', direction:linear.toArray() }] );

    if(test===0) go();
    
}

function go () {

    arm.matrixWorld.decompose( p, q, s );

    physic.matrix( { name:'follow', pos:p.toArray(), quat:q.toArray() } )//, noVelocity:true
    //physic.matrix( { name:'follow', pos:p.toArray(), quat:q.toArray() } )//, noVelocity:true

}

function updateMatrixWorld ( force ) {

    THREE.Object3D.prototype.updateMatrixWorld.call( this, force );

    this.matrixWorld.decompose( p, q, s );
    physic.matrix( [{ name:'follow', pos:p.toArray(), quat:q.toArray(), noVelocity:true }] )

}