function demo() {

    cam ( 0, 20, 30 );
    load ( 'drone', afterLoadGeometry );

};

var debug = false;
var drone, rotor = [], rpos = [];
var force;

var tmpMatrix, tmpPos;

function afterLoadGeometry () {

    // load drone map
    view.addMap('drone.jpg', 'drone');

    // infinie plane
    add({type:'plane'});

    var geo = view.getGeo();
    var mat = view.getMat();

    drone = add({ 
        
        name:'drone',
        type:'convex',
        shape:geo['drone_shape'],

        mass:10,
        pos:[0, 0, 0],

        geometry:debug ? undefined : geo['drone_chassis'],
        material:debug ? undefined : 'drone',
        state:4,

    });

    var sx=1, sz=1;

    for( var i=0; i<4; i++ ){
        sx = (i===0 || i===2) ? -1:1;
        sz = (i===0 || i===1) ? -1:1;

        rpos[i] = new THREE.Vector3(1.5*sx, 0.93, 1.5*sz);
        rotor[i] = add({
            parent: drone,
            pos:rpos[i].toArray(),
            geometry: geo['drone_rotor'],
            material:debug ? undefined : 'drone',
            noPhy:true,

        }) 

         rpos[i].y = 0;
    }

    add({

        parent: drone,
        geometry: geo['drone_side'],
        material:debug ? undefined : 'drone',
        noPhy:true,

    })

    force = new THREE.Vector3();
    tmpPos = new THREE.Vector3();
    tmpMatrix = new THREE.Matrix4();


    //follow ('drone');


    postUpdate = postUp;

}

function postUp() {

    tmpMatrix.extractRotation( drone.matrix );
    tmpPos.set( 0, 1, 0 );
    tmpPos.applyMatrix4( tmpMatrix );

    force.y = 26.3;//0.435;
    //var p = drone.position.clone();//.negate().normalize().multiplyScalar(9.8);
    var r = [];
    var p;

    for( var i=0; i<4; i++ ){
        rotor[i].rotation.y += 0.0174533 * 30;//0.523599;
        p = tmpPos.clone().add(rpos[i]);
        r.push( [ 'drone', 'force',  force.toArray(), p.toArray() ] );
        //r.push( [ 'drone', 'impulse',  force.toArray(), p.toArray() ] );
    }

     //r.push( [ 'drone', 'centralForce', force.toArray() ] )



    ammo.send( 'forces', { r:r } );
}