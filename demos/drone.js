var debug = false;
var drone = null, rotor = [], rpos = [];
var force;

var tmpMatrix, tmpPos;

function demo() {

    view.moveCam({ theta:0, phi:20, distance:30, target:[0,1,0] });
    
    physic.set();

    view.load ( 'drone.sea', afterLoadGeometry, true, true );

};


function afterLoadGeometry () {

    // drone material

    var droneMat = view.material({
        name:'drone',
        roughness: 0.4,
        metalness: 0.6,
        map: { url:'drone.jpg' },
    });

    // infinie plane
    physic.add({type:'plane'});

    var geo = view.getGeo();
    var mat = view.getMat();

    drone = physic.add({ 
        
        name:'drone',
        type:'convex',
        shape:view.getGeometry( 'drone', 'drone_shape' ),//geo['drone_shape'],



        mass:10,
        pos:[0, 0, 0],

        geometry:debug ? undefined : view.getGeometry( 'drone', 'drone_chassis' ),//geo['drone_chassis'],
        material:debug ? undefined : droneMat,
        state:4,

    });


    var sx=1, sz=1;

    for( var i=0; i<4; i++ ){
        sx = (i===0 || i===2) ? -1:1;
        sz = (i===0 || i===1) ? -1:1;

        rpos[i] = new THREE.Vector3(1.5*sx, 0.93, 1.5*sz);
        rotor[i] = physic.add({
            parent: drone,
            pos:rpos[i].toArray(),
            geometry: view.getGeometry( 'drone', 'drone_rotor' ),//geo['drone_rotor'],
            material:debug ? undefined : droneMat,
            noPhy:true,

        }) 

         rpos[i].y = 0;
    }

    physic.add({

        parent: drone,
        geometry: view.getGeometry( 'drone', 'drone_side' ),//geo['drone_side'],
        material:debug ? undefined : droneMat,
        noPhy:true,

    })

    force = new THREE.Vector3();
    tmpPos = new THREE.Vector3();
    tmpMatrix = new THREE.Matrix4();


    follow ('drone');

    physic.postUpdate = update;

}

function update() {

    tmpMatrix.extractRotation( drone.matrix );
    tmpPos.set( 0, 1, 0 );
    tmpPos.applyMatrix4( tmpMatrix );

    force.y = 25//24.52;//0.435;
    //var p = drone.position.clone();//.negate().normalize().multiplyScalar(9.8);
    var r = [];
    var p;

    for( var i=0; i<4; i++ ){
        rotor[i].rotation.y += 0.0174533 * 30;//0.523599;
        p = tmpPos.clone().add(rpos[i]);
        r.push( { name:'drone', type:'force', direction:force.toArray(), distance:p.toArray() } );
        //r.push( [ 'drone', 'impulse',  force.toArray(), p.toArray() ] );
    }

    // apply forces to bodys
    physic.forces( r );

}