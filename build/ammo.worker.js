/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    AMMO worker ultimate
*
*    By default, Bullet assumes units to be in meters and time in seconds. 
*    Moving objects are assumed to be in the range of 0.05 units, about the size of a pebble, 
*    to 10, the size of a truck. 
*    The simulation steps in fraction of seconds (1/60 sec or 60 hertz), 
*    and gravity in meters per square second (9.8 m/s^2).
*/

var Module = { TOTAL_MEMORY: 256*1024*1024 };

var Ammo, start, terrains;

//var Module = { TOTAL_MEMORY: 256*1024*1024 };
//var Module = { TOTAL_MEMORY: 256*1024*1024 };
//var isFirst = true;

var world = null;
var worldInfo = null;
var solver, solverSoft, collision, dispatcher, broadphase, ghostPairCallback;
var isSoft = true;


var trans, pos, quat, posW, quatW, transW, gravity;
var tmpTrans, tmpPos, tmpQuat;
var tmpPos1, tmpPos2, tmpPos3, tmpPos4, tmpZero;
var tmpTrans1, tmpTrans2;

// forces
var tmpForce = [];//null;

// kinematic
var tmpMatrix = [];

//var tmpset = null;

// array
var bodys, solids, softs, joints, cars, heros, carsInfo, contacts, contactGroups;
// object
var byName;

var timeStep = 1/60;
//var timerStep = timeStep * 1000;

var numStep = 2;//4//3;// default is 1. 2 or more make simulation more accurate.
var ddt = 1;
var key = [ 0,0,0,0,0,0,0,0 ];
var tmpKey = [ 0,0,0,0,0,0,0,0 ];

//var pause = true;

//var timer = 0;
var isBuffer = false;



var currentCar = 0;

// main transphere array
var Ar, aAr;
var ArLng, ArPos, ArMax;


//var Br, Cr, Jr, Hr, Sr;
 // ArrayBuffer
//var aBr, aCr, aJr, aHr, aSr;

var fixedTime = 0.01667;
var last_step = Date.now();
var timePassed = 0;

var STATE = {
    ACTIVE : 1,
    ISLAND_SLEEPING : 2,
    WANTS_DEACTIVATION : 3,
    DISABLE_DEACTIVATION : 4,
    DISABLE_SIMULATION : 5
}

var FLAGS = {
    STATIC_OBJECT : 1,
    KINEMATIC_OBJECT : 2,
    NO_CONTACT_RESPONSE : 4,
    CUSTOM_MATERIAL_CALLBACK : 8,
    CHARACTER_OBJECT : 16,
    DISABLE_VISUALIZE_OBJECT : 32,
    DISABLE_SPU_COLLISION_PROCESSING : 64 
};

var GROUP = { 
    DEFAULT : 1, 
    STATIC : 2, 
    KINEMATIC : 4, 
    DEBRIS : 8, 
    SENSORTRIGGER : 16, 
    NOCOLLISION : 32,
    GROUP0 : 64,
    GROUP1 : 128,
    GROUP2 : 256,
    GROUP3 : 512,
    GROUP4 : 1024,
    GROUP5 : 2048,
    GROUP6 : 4096,
    GROUP7 : 8192,
    ALL : -1 
}




self.onmessage = function ( e ) {

    var data = e.data;
    var m = data.m;
    var o = data.o;

    // ------- buffer data
    if( data.Ar ) Ar = data.Ar;
    
    switch( m ){

        case 'init': init( data ); break;
        case 'step': step( data ); break;
        case 'start': start( data ); break;
        case 'reset': reset( data ); break;
        case 'set': set( o ); break;

        case 'key': tmpKey = o.key; break;
        case 'setDriveCar': currentCar = o.n; break;
        //case 'set': tmpset = data.o; break;

        case 'moveSoftBody': moveSoftBody( o ); break;

        case 'heroRotation': setHeroRotation( o.id, o.angle ); break;

        case 'add': add( o ); break;
        case 'vehicle': addVehicle( o ); break;
        case 'character': addCharacter( o ); break;
        case 'terrain': terrainPostStep( o ); break;
        case 'gravity': setGravity( o ); break;
        case 'anchor': anchor( o ); break;
        //case 'apply': apply( data.o ); break;

        case 'force': tmpForce.push( o ); break;
        case 'forceArray': tmpForce = o; break;

        case 'matrix': tmpMatrix.push( o ); break;
        case 'matrixArray': tmpMatrix = o; break;

        case 'setVehicle': setVehicle( o ); break;

        case 'contact': addContact( o ); break;

    }

};


function preStep(){



};

function step( o ){

    // ------- pre step

    key = o.key;

    // update matrix

    updateMatrix();

    // update forces

    updateForce();

    // terrain update

    terrainUpdate();

    // ------- step

    world.stepSimulation( timeStep, numStep );
    //world.stepSimulation( o.delay, numStep, timeStep );
    //world.stepSimulation( dt, it, dt );

    drive( currentCar );
    move( 0 );

    stepCharacter( ArPos[0] );
    stepVehicle( ArPos[1] );
    
    stepRigidBody( Ar, ArPos[2] );
    stepSoftBody( Ar, ArPos[3] );

    stepConstraint( Ar, ArPos[4] );

    stepContact();

    if( isBuffer ) self.postMessage({ m:'step', Ar:Ar, contacts:contacts },[ Ar.buffer ]);
    else self.postMessage( { m:'step', Ar:Ar, contacts:contacts } );

};


//--------------------------------------------------
//
//  WORLD
//
//--------------------------------------------------

function init ( o ) {

    isBuffer = o.isBuffer || false;

    //timeStep = o.timeStep !== undefined ? o.timeStep : timeStep;
    //timerStep = timeStep * 1000;
    //numStep = o.numStep || 2;

    //

    ArLng = o.settings[0];
    ArPos = o.settings[1];
    ArMax = o.settings[2];

    //

    importScripts( o.blob );

    Ammo().then( function( Ammo ) { 

        initMath();

        // active transform

        trans = new Ammo.btTransform();
        quat = new Ammo.btQuaternion();
        pos = new Ammo.btVector3();

        // hero Transform

        posW = new Ammo.btVector3();
        quatW = new Ammo.btQuaternion();
        transW = new Ammo.btTransform();

        // tmp Transform

        tmpTrans = new Ammo.btTransform()
        tmpPos = new Ammo.btVector3();
        tmpQuat = new Ammo.btQuaternion();

        // extra vector

        tmpPos1 = new Ammo.btVector3();
        tmpPos2 = new Ammo.btVector3();
        tmpPos3 = new Ammo.btVector3();
        tmpPos4 = new Ammo.btVector3();

        tmpZero = new Ammo.btVector3( 0,0,0 );

        // extra transform

        tmpTrans1 = new Ammo.btTransform();
        tmpTrans2 = new Ammo.btTransform();

        // gravity
        gravity = new Ammo.btVector3();

        addWorld();

        bodys = []; // 0
        softs = []; // 1
        joints = []; // 2
        cars = []; 
        carsInfo = [];
        heros = [];
        solids = [];

        contacts = [];
        contactGroups = [];

        // use for get object by name
        byName = {};

        self.postMessage( { m:'initEngine' } );

    });
    
};

function set( o ){

    o = o || {};


    timeStep = o.timeStep !== undefined ? o.timeStep : 0.016;
    numStep = o.numStep !== undefined ? o.numStep : 2;

    // gravity
    var g = o.gravity !== undefined ? o.gravity : [ 0, -9.81, 0 ];
    gravity.fromArray( g );
    world.setGravity( gravity );

}

function reset ( o ) {


    tmpForce = [];
    tmpMatrix = [];

    clearContact();
    clearJoint();
    clearRigidBody();
    clearVehicle();
    clearCharacter();
    clearSoftBody();

    // clear body name object
    byName = {};

    if( o.full ){

        clearWorld();
        addWorld();

    }

    setGravity();

    // create self tranfere array if no buffer
    if( !isBuffer ) Ar = new Float32Array( ArMax );

    self.postMessage({ m:'start' });

};



function wipe (obj) {
    for (var p in obj) {
        if ( obj.hasOwnProperty( p ) ) delete obj[p];
    }
};

//--------------------------------------------------
//
//  ADD
//
//--------------------------------------------------

function add ( o, extra ) {

    o.type = o.type === undefined ? 'box' : o.type;

    var type = o.type;
    var prev = o.type.substring( 0, 4 );

    if( prev === 'join' ) addJoint( o );
    else if( prev === 'soft' || type === 'ellipsoid'  || type === 'rope'  || type === 'cloth' ) addSoftBody( o );
    else if( type === 'terrain' ) addTerrain( o );
    else addRigidBody( o, extra );

};


function anchor( o ){

    getByName(o.soft).appendAnchor( o.pos, getByName(o.body), false, o.influence || 0.5 );

};

//--------------------------------------------------
//
//  RAY
//
//--------------------------------------------------

function addRay ( o ) {

    if( o.p1 !== undefined ) tmpPos1.fromArray( o.p1 );
    if( o.p2 !== undefined ) tmpPos2.fromArray( o.p2 );

    var rayCallback = new Ammo.ClosestRayResultCallback( tmpPos1, tmpPos2 );
    world.rayTest( tmpPos1, tmpPos2, rayCallback );

    //if(rayCallback.hasHit()){
       // printf("Collision at: <%.2f, %.2f, %.2f>\n", rayCallback.m_hitPointWorld.getX(), rayCallback.m_hitPointWorld.getY(), rayCallback.m_hitPointWorld.getZ());
   // }

};

//--------------------------------------------------
//
//  GET OBJECT
//
//--------------------------------------------------

function getByName( n ){

    return byName[ n ] || null;

}

function getByIdx( n ){

    var u = n.toFixed(1);
    var id = parseInt( u );
    var range = Number( u.substring( u.lastIndexOf('.') + 1 ));

    switch( range ){

        case 1 : return heros[id]; break;
        case 2 : return cars[id]; break;
        case 3 : return bodys[id]; break;
        case 4 : return solids[id]; break;
        case 5 : return terrains[id]; break;
        case 6 : return softs[id]; break;
        case 7 : return joints[id]; break;

    }

}


//---------------------
// FORCES
//---------------------

function updateForce () {

    while( tmpForce.length > 0 ) applyForce( tmpForce.pop() );

}

function applyForce ( r ) {

    var b = getByName( r[0] );

    if( b === null ) return;

    var type = r[1] || 'force';

    if( r[2] !== undefined ) tmpPos1.fromArray( r[2] );
    if( r[3] !== undefined ) tmpPos2.fromArray( r[3] );
    else tmpPos2.zero();

    switch( type ){
        case 'force' : case 0 : b.applyForce( tmpPos1, tmpPos2 ); break;// force , rel_pos 
        case 'torque' : case 1 : b.applyTorque( tmpPos1 ); break;
        case 'localTorque' : case 2 : b.applyLocalTorque( tmpPos1 ); break;
        case 'forceCentral' :case 3 :  b.applyCentralForce( tmpPos1 ); break;
        case 'forceLocal' : case 4 : b.applyCentralLocalForce( tmpPos1 ); break;
        case 'impulse' : case 5 : b.applyImpulse( tmpPos1, tmpPos2 ); break;// impulse , rel_pos 
        case 'impulseCentral' : case 6 : b.applyCentralImpulse( tmpPos1 ); break;

        // joint

        case 'motor' : case 7 : b.enableAngularMotor( true, r[2][0], r[2][1] ); break; // bool, targetVelocity, maxMotorImpulse

    }
    

}

//---------------------
// MATRIX
//---------------------

function updateMatrix () {

    while( tmpMatrix.length > 0 ) applyMatrix( tmpMatrix.pop() );

}

function applyMatrix ( r ) {

    var b = getByName( r[0] );

    if( b === undefined ) return;
    if( b === null ) return;

    var isK = b.isKinematic || false;

    tmpTrans.setIdentity();

    if( r[1] !== undefined ) { tmpPos.fromArray( r[1] ); tmpTrans.setOrigin( tmpPos ); }
    if( r[2] !== undefined ) { tmpQuat.fromArray( r[2] ); tmpTrans.setRotation( tmpQuat ); }
    //else { tmpQuat.fromArray( [2] ); tmpTrans.setRotation( tmpQuat ); }

    if(!isK){

       // zero force
       b.setAngularVelocity( tmpZero );
       b.setLinearVelocity( tmpZero );

    }

    if(!isK){
        b.setWorldTransform( tmpTrans );
        b.activate();
     } else{
        b.getMotionState().setWorldTransform( tmpTrans );
     }

}

//--------------------------------------------------
//
//  WORLD
//
//--------------------------------------------------

function clearWorld () {

    //world.getBroadphase().resetPool( world.getDispatcher() );
    //world.getConstraintSolver().reset();

    Ammo.destroy( world );
    Ammo.destroy( solver );
    Ammo.destroy( solverSoft );
    Ammo.destroy( collision );
    Ammo.destroy( dispatcher );
    Ammo.destroy( broadphase );

    world = null;

};

function addWorld ( o ) {

    o = o || {};

    if( world !== null ) return;

    isSoft = o.soft === undefined ? true : o.soft;

    solver = new Ammo.btSequentialImpulseConstraintSolver();
    solverSoft = isSoft ? new Ammo.btDefaultSoftBodySolver() : null;
    collision = isSoft ? new Ammo.btSoftBodyRigidBodyCollisionConfiguration() : new Ammo.btDefaultCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher( collision );

    switch( o.broadphase === undefined ? 2 : o.broadphase ){

        //case 0: broadphase = new Ammo.btSimpleBroadphase(); break;
        case 1: var s = 1000; broadphase = new Ammo.btAxisSweep3( new Ammo.btVector3(-s,-s,-s), new Ammo.btVector3(s,s,s), 4096 ); break;//16384;
        case 2: broadphase = new Ammo.btDbvtBroadphase(); break;
        
    }

    world = isSoft ? new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collision, solverSoft ) : new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collision );

    //console.log(world.getSolverInfo())
    

    /*
    ghostPairCallback = new Ammo.btGhostPairCallback();
    world.getPairCache().setInternalGhostPairCallback( ghostPairCallback );
    */
    
    var dInfo = world.getDispatchInfo();

    if( o.penetration !== undefined ) dInfo.set_m_allowedCcdPenetration( o.penetration );// default 0.0399


    //console.log(world)



    //console.log(dInfo.get_m_convexConservativeDistanceThreshold())

    /*

    dInfo.set_m_convexConservativeDistanceThreshold() // 0
    dInfo.set_m_dispatchFunc() // 1
    dInfo.set_m_enableSPU() // true
    dInfo.set_m_enableSatConvex() // false
    dInfo.set_m_stepCount() // 0
    dInfo.set_m_timeOfImpact() // 1
    dInfo.set_m_timeStep() // 0
    dInfo.set_m_useContinuous() // true
    dInfo.set_m_useConvexConservativeDistanceUtil() // false
    dInfo.set_m_useEpa() // true

    */


    setGravity( o );
    
};

function setGravity ( o ) {

    o = o || {};

    if( world === null ) return;

    gravity.fromArray( o.g || [0,-10, 0] );
    world.setGravity( gravity );



    if( isSoft ){
        worldInfo = world.getWorldInfo();
        worldInfo.set_m_gravity( gravity );

        //worldInfo.set_air_density( o.air || 1.2 );//1.275
        //setWater( o );
    }

};

function setWater ( o ) {

    if( isSoft ){
        worldInfo = world.getWorldInfo();
        worldInfo.set_water_density( o.density || 0 );
        worldInfo.set_water_offset( o.offset || 0 );
        //worldInfo.set_water_offset( new Ammo.btVector3().fromArray( o.offset || [0,0,0] ) );
        worldInfo.set_water_normal( new Ammo.btVector3().fromArray( o.normal || [0,0,0] ) );
    }

};




//--------------------------------------------------
//
//  AMMO MATH
//
//--------------------------------------------------

var torad = 0.0174532925199432957;
var todeg = 57.295779513082320876;

//--------------------------------------------------
//
//  btTransform extend
//
//--------------------------------------------------

function initMath(){



    Ammo.btTransform.prototype.toArray = function( array, offset ){

        //if ( offset === undefined ) offset = 0;
        offset = offset || 0;

        this.getOrigin().toArray( array , offset );
        this.getRotation().toArray( array , offset + 3 );

        //return array;

    };

    //--------------------------------------------------
    //
    //  btVector3 extend
    //
    //--------------------------------------------------

    Ammo.btVector3.prototype.zero = function( v ){

        this.setValue( 0, 0, 0 );
        return this;

    };

    Ammo.btVector3.prototype.negate = function( v ){

        this.setValue( -this.x(), -this.y(), -this.z() );
        return this;

    };

    Ammo.btVector3.prototype.add = function( v ){

        this.setValue( this.x() + v.x(), this.y() + v.y(), this.z() + v.z() );
        return this;

    };

    Ammo.btVector3.prototype.fromArray = function( array, offset ){

        //if ( offset === undefined ) offset = 0;
        offset = offset || 0;

        this.setValue( array[ offset ], array[ offset + 1 ], array[ offset + 2 ] );

        return this;

    };

    Ammo.btVector3.prototype.toArray = function( array, offset ){

        //if ( array === undefined ) array = [];
        //if ( offset === undefined ) offset = 0;
        offset = offset || 0;

        array[ offset ] = this.x();
        array[ offset + 1 ] = this.y();
        array[ offset + 2 ] = this.z();

        //return array;

    };

    Ammo.btVector3.prototype.direction = function( q ){

        // quaternion 
        
        var qx = q.x();
        var qy = q.y();
        var qz = q.z();
        var qw = q.w();

        var x = this.x();
        var y = this.y();
        var z = this.z();

        // calculate quat * vector

        var ix =  qw * x + qy * z - qz * y;
        var iy =  qw * y + qz * x - qx * z;
        var iz =  qw * z + qx * y - qy * x;
        var iw = - qx * x - qy * y - qz * z;

        // calculate result * inverse quat

        var xx = ix * qw + iw * - qx + iy * - qz - iz * - qy;
        var yy = iy * qw + iw * - qy + iz * - qx - ix * - qz;
        var zz = iz * qw + iw * - qz + ix * - qy - iy * - qx;

        this.setValue( xx, yy, zz );

    };

    //--------------------------------------------------
    //
    //  btQuaternion extend
    //
    //--------------------------------------------------

    Ammo.btQuaternion.prototype.fromArray = function( array, offset ){

        //if ( offset === undefined ) offset = 0;
        offset = offset || 0;
        this.setValue( array[ offset ], array[ offset + 1 ], array[ offset + 2 ], array[ offset + 3 ] );

    };

    Ammo.btQuaternion.prototype.toArray = function( array, offset ){

        //if ( array === undefined ) array = [];
        //if ( offset === undefined ) offset = 0;
        offset = offset || 0;

        array[ offset ] = this.x();
        array[ offset + 1 ] = this.y();
        array[ offset + 2 ] = this.z();
        array[ offset + 3 ] = this.w();

        //return array;

    };

    Ammo.btQuaternion.prototype.setFromAxisAngle = function( axis, angle ){

        var halfAngle = angle * 0.5, s = Math.sin( halfAngle );
        this.setValue( axis[0] * s, axis[1] * s, axis[2] * s, Math.cos( halfAngle ) );

    };

    /*Ammo.btTypedConstraint.prototype.getA = function( v ){

        return 1

    };*/


}

//--------------------------------------------------
//
//  M3
//
//--------------------------------------------------
/*
var multiplyTransforms = function (tr1, tr2) {

    var tr = new Ammo.btTransform();
    tr.setIdentity();

    var q1 = tr1.getRotation();
    var q2 = tr2.getRotation();


    var qax = q1.x(), qay = q1.y(), qaz = q1.z(), qaw = q1.w();
    var qbx = q2.x(), qby = q2.y(), qbz = q2.z(), qbw = q2.w();

    var q = q4([ 
        qax * qbw + qaw * qbx + qay * qbz - qaz * qby,
        qay * qbw + qaw * qby + qaz * qbx - qax * qbz,
        qaz * qbw + qaw * qbz + qax * qby - qay * qbx,
        qaw * qbw - qax * qbx - qay * qby - qaz * qbz
    ]);

    var o1 = tr1.getOrigin();
    var o2 = tr2.getOrigin();

    var p = v3([
        o1.x()+o2.x(),
        o1.y()+o2.y(),
        o1.z()+o2.z()
    ])

    tr.setOrigin( p );
    tr.setRotation( q );

    return tr;

};*/

/*

var barycentricCoordinates = function( pos, p1, p2, p3 ) {

    var edge1 = v3( [ p2.x-p1.x, p2.y-p1.y, p2.z-p1.z ]);
    var edge2 = v3( [ p3.x-p1.x, p3.y-p1.y, p3.z-p1.z ]);

    // Area of triangle ABC              
    var p1p2p3 = edge1.cross(edge2).length2();              
    // Area of BCP              
    var p2p3p = (p3 - p2).cross(pos - p2).length2();              
    // Area of CAP              
    var p3p1p = edge2.cross(pos - p3).length2(); 

    var s = Math.sqrt(p2p3p / p1p2p3);              
    var t = Math.sqrt(p3p1p / p1p2p3);              
    var w = 1 - s - t;

    return v3([s,t,w])

};

*/
/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*    AMMO CHARACTER
*/

function addCharacter ( o ) {

    var c = new Character( o );
    heros.push( c );

};

function move ( id ) {

    id = id || 0;
    if( !heros[id] ) return;

    heros[id].move();

}

function stepCharacter( N ) {

    heros.forEach( function ( hero, id ) {

        var n = N + (id * 8);
        hero.step( n );

    });

};

function clearCharacter() {

    while( heros.length > 0) heros.pop().clear();
    heros = [];

}

function setHeroRotation( id, angle ){

    id = id || 0;
    if( !heros[id] ) return;
    heros[id].setRotation( angle );

};


//--------------------------------------------------
//
//  CHARACTER CLASS
//
//--------------------------------------------------


function Character ( o ) {

    this.body = null;
    this.hero = null;

    this.angle = 0;
    this.speed = 0;
    this.wasJumping = false;
    this.verticalVelocity = 0;
    this.angleInc = 

    this.init( o );

}

Character.prototype = {

    step: function ( n ){

        Ar[n] = this.speed;
        //Hr[n] = b.onGround ? 1 : 0;

        var t = this.body.getWorldTransform();
        pos = t.getOrigin();
        quat = t.getRotation();

        Ar[n+1] = pos.x();
        Ar[n+2] = pos.y();
        Ar[n+3] = pos.z();

        Ar[n+4] = quat.x();
        Ar[n+5] = quat.y();
        Ar[n+6] = quat.z();
        Ar[n+7] = quat.w();

    },

    move: function (){

        var hero = this.hero;

        //btScalar walkVelocity = btScalar(1.1) * 4.0; // 4 km/h -> 1.1 m/s
        //btScalar walkSpeed = walkVelocity * dt;

        var walkSpeed = 0.3;
        var angleInc = 0.1;

        var x=0,y=0,z=0;

        //transW = hero.getGhostObject().getWorldTransform();

        //console.log(transW.getOrigin().y())

        //y = transW.getOrigin().y();

        //if(key[0] == 1 || key[1] == 1 ) heros[id].speed += 0.1;
        //if(key[0] == 0 && key[1] == 0 ) heros[id].speed -= 0.1;


        //if(heros[id].speed>1) heros[id].speed = 1;
        //if(heros[id].speed<0) heros[id].speed = 0;

        //if( key[1] == -1 ) z=-heros[id].speed * walkSpeed;
        //if( key[1] == 1 ) z=heros[id].speed * walkSpeed;

        //if( key[0] == -1 ) x=-heros[id].speed * walkSpeed;
        //if( key[0] == 1 ) x=heros[id].speed * walkSpeed;

        if( key[4] == 1 && hero.onGround()){//h.canJump() ){ 
            this.wasJumping = true;
            this.verticalVelocity = 0;
            
            //hero.jump();

            //y = transW.getOrigin().y()



            //y+=10;

            
        } //console.log(hero.jump())
        //console.log(h.onGround())

        if( this.wasJumping ){
            this.verticalVelocity += 0.04;
           // y = hero.verticalVelocity;
            if(this.verticalVelocity > 1.3) {
                this.verticalVelocity = 0
                this.wasJumping = false;
            }
        }

      //  if( hero.onGround() ){
            z = walkSpeed * -key[1];
            x = walkSpeed * -key[0];
        

        


        this.speed = z + x;

        // rotation

        this.angle -= key[2] * angleInc;

        this.setRotation( this.angle );

       // var angle = hero.rotation;//key[8]; //heros[id].rotation

        // change rotation
       // quatW.setFromAxisAngle( [0,1,0], angle );
        //hero.getGhostObject().getWorldTransform().setRotation( quatW );
       // transW.setRotation( quatW );

        // walkDirection
        posW.setValue( x, y+this.verticalVelocity, z );
        posW.direction( quatW );

        hero.setWalkDirection( posW );
    //}

       // heros[id].preStep ( world );
       //heros[id].setVelocityForTimeInterval(vec3(), 1);
    },

    clear: function (){

        world.removeCollisionObject( this.body );
        world.removeAction( this.hero );

        Ammo.destroy( this.body );
        Ammo.destroy( this.hero );

        this.body = null;
        this.hero = null;

    },

    init: function ( o ){

        o.size = o.size == undefined ? [1,1,1] : o.size;
        o.pos = o.pos == undefined ? [0,0,0] : o.pos;
        o.quat = o.quat == undefined ? [0,0,0,1] : o.quat;

        var shape = new Ammo.btCapsuleShape( o.size[0], o.size[1]*0.5 );

        var body = new Ammo.btPairCachingGhostObject();
        body.setCollisionShape( shape );
        body.setCollisionFlags( FLAGS.CHARACTER_OBJECT );



        tmpPos.fromArray( o.pos );
        tmpQuat.fromArray( o.quat );
        
        tmpTrans.setIdentity();
        tmpTrans.setOrigin( tmpPos );
        tmpTrans.setRotation( tmpQuat );

        body.setWorldTransform( tmpTrans );
        
        body.setFriction( o.friction || 0.1 );
        body.setRestitution( o.restitution || 0 );

        body.setActivationState( 4 );
        body.activate();

        var hero = new Ammo.btKinematicCharacterController( body, shape, o.stepH || 0.35, o.upAxis || 1 );
        //var hero = new Ammo.btKinematicCharacterController( body, shape, o.stepH || 0.3 )
        hero.setUseGhostSweepTest( shape );

       // hero.getGhostObject().getWorldTransform().setRotation(q4( o.quat ));

        hero.setGravity( gravity );
        hero.setFallSpeed( 30 );
        //hero.setUpAxis(1);
        hero.setMaxJumpHeight( 200 );
        hero.setJumpSpeed( 1000 )
        /*
        
         
        hero.jump();
        */
        //hero.canJump( true );

        //console.log(hero, tmpQuat.w(), tmpQuat )

        // The max slope determines the maximum angle that the controller can walk
        if( o.slopeRadians ) hero.setMaxSlope ( o.slopeRadians );//45

        


        // hero.warp(v3(o.pos));
        
        tmpPos2.setValue( 0, 0, 0 );
        hero.setVelocityForTimeInterval( tmpPos2, 1 );

        world.addCollisionObject( body, o.group || 1, o.mask || -1 );
        world.addAction( hero );

        this.body = body;
        this.hero = hero; 

       // world.getPairCache().setInternalGhostPairCallback( new Ammo.btGhostPairCallback() );

    },

    setRotation: function ( angle ){

        var t = this.body.getWorldTransform();
        quatW.setFromAxisAngle( [0,1,0], angle );
        t.setRotation( quatW );
        this.angle = angle;

    }

}





/*

function contactHero () {


};
*/



//--------------------------------------------------
//
//  AMMO CONSTRAINT JOINT
//
//--------------------------------------------------


/*Ammo.btTypedConstraint.prototype.getA = function( v ){

    return 1

};*/

function stepConstraint ( AR, N ) {

    //if( !joints.length ) return;

    joints.forEach( function ( b, id ) {

        var n = N + (id * 4);

        if( b.type ){

            AR[ n ] = b.type;

        }
        

        

            /*b.getMotionState().getWorldTransform( trans );
            pos = trans.getOrigin();
            quat = trans.getRotation();

            Br[n+1] = pos.x();
            Br[n+2] = pos.y();
            Br[n+3] = pos.z();

            Br[n+4] = quat.x();
            Br[n+5] = quat.y();
            Br[n+6] = quat.z();
            Br[n+7] = quat.w();
            */

        

    });

};

function clearJoint () {

    var j;

    while( joints.length > 0 ){

        j = joints.pop();
        world.removeConstraint( j );
        Ammo.destroy( j );

    }

    joints = [];

};


function addJoint ( o ) {

    var noAllowCollision = true;
    var collision = o.collision || false;
    if( collision ) noAllowCollision = false;

    if(o.body1) o.b1 = o.body1;
    if(o.body2) o.b2 = o.body2;

    var b1 = getByName( o.b1 );
    var b2 = getByName( o.b2 );

    tmpPos1.fromArray( o.pos1 || [0,0,0] );
    tmpPos2.fromArray( o.pos2 || [0,0,0] );
    tmpPos3.fromArray( o.axe1 || [1,0,0] );
    tmpPos4.fromArray( o.axe2 || [1,0,0] );

    
    if(o.type !== "joint_p2p" && o.type !== "joint_hinge" && o.type !== "joint" ){

        
        /* 
        // test force local
        var tmpA = new Ammo.btTransform();
        tmpA.setIdentity();
        tmpA.setOrigin( point1 );
        if(o.quatA) tmpA.setRotation( q4( o.quatA ) )

        var frameInA = multiplyTransforms( b1.getWorldTransform(), tmpA );

        var tmpB = new Ammo.btTransform();
        tmpB.setIdentity();
        tmpB.setOrigin( point2 );
        if(o.quatB) tmpB.setRotation( q4( o.quatB ) )

        var frameInB = multiplyTransforms( b2.getWorldTransform(), tmpB );
        */

        // frame A

        tmpTrans1.setIdentity();
        tmpTrans1.setOrigin( tmpPos1 );
        if( o.quatA ){
            tmpQuat.fromArray( o.quatA ); 
            tmpTrans1.setRotation( tmpQuat );
        }
        
        // frame B

        tmpTrans2.setIdentity();
        tmpTrans2.setOrigin( tmpPos2 );
        if( o.quatB ){ 
            tmpQuat.fromArray( o.quatB );
            tmpTrans2.setRotation( tmpQuat );
        }

    }

    // use fixed frame A for linear llimits
    var useA =  o.useA !== undefined ? o.useA : true;

    var joint = null;
    var t = 0;

    switch(o.type){
        case "joint_p2p":
            t = 1;
            joint = new Ammo.btPoint2PointConstraint( b1, b2, tmpPos1, tmpPos2 );
            if(o.strength) joint.get_m_setting().set_m_tau( o.strength );
            if(o.damping) joint.get_m_setting().set_m_damping( o.damping ); 
            if(o.impulse) joint.get_m_setting().set_m_impulseClamp( o.impulse );
        break;
        case "joint_hinge": case "joint": t = 2; joint = new Ammo.btHingeConstraint( b1, b2, tmpPos1, tmpPos2, tmpPos3, tmpPos4, useA ); break;
        case "joint_slider": t = 3; joint = new Ammo.btSliderConstraint( b1, b2, tmpTrans1, tmpTrans2, useA ); break;
        case "joint_conetwist": t = 4; joint = new Ammo.btConeTwistConstraint( b1, b2, tmpTrans1, tmpTrans2 ); break;
        case "joint_dof": t = 5; joint = new Ammo.btGeneric6DofConstraint( b1, b2, tmpTrans1, tmpTrans2, useA );  break;
        case "joint_spring_dof": t = 6; joint = new Ammo.btGeneric6DofSpringConstraint( b1, b2, tmpTrans1, tmpTrans2, useA ); break;
        //case "joint_gear": joint = new Ammo.btGearConstraint( b1, b2, point1, point2, o.ratio || 1); break;
    }

    // EXTRA SETTING

    if(o.breaking) joint.setBreakingImpulseThreshold( o.breaking );

    // hinge

    // limite min, limite max, softness, bias, relaxation
    if(o.limit){ 
        if(o.type === 'joint_hinge' || o.type === 'joint' ) joint.setLimit( o.limit[0]*torad, o.limit[1]*torad, o.limit[2] || 0.9, o.limit[3] || 0.3, o.limit[4] || 1.0 );
        else if(o.type === 'joint_conetwist' ) joint.setLimit( o.limit[0]*torad, o.limit[1]*torad, o.limit[2]*torad, o.limit[3] || 0.9, o.limit[4] || 0.3, o.limit[5] || 1.0 );
    }
    if(o.motor) joint.enableAngularMotor( o.motor[0], o.motor[1], o.motor[2] );


    // slider & dof

    if(o.linLower){ tmpPos.fromArray(o.linLower); joint.setLinearLowerLimit( tmpPos ); }
    if(o.linUpper){ tmpPos.fromArray(o.linUpper); joint.setLinearUpperLimit( tmpPos ); }
    
    if(o.angLower){ tmpPos.fromArray(o.angLower); joint.setAngularLowerLimit( tmpPos ); }
    if(o.angUpper){ tmpPos.fromArray(o.angUpper); joint.setAngularUpperLimit( tmpPos ); }

    // spring dof

    if(o.feedback) joint.enableFeedback( o.feedback );
    if(o.enableSpring) joint.enableSpring( o.enableSpring[0], o.enableSpring[1] );
    if(o.damping) joint.setDamping( o.damping[0], o.damping[1] );
    if(o.stiffness) joint.setStiffness( o.stiffness[0], o.stiffness[1] );

    if(o.angularOnly) joint.setAngularOnly( o.angularOnly );
    if(o.enableMotor) joint.enableMotor( o.enableMotor );
    if(o.maxMotorImpulse) joint.setMaxMotorImpulse( o.maxMotorImpulse );
    if(o.motorTarget) joint.setMotorTarget( tmpQuat.fromArray( o.motorTarget ) );


    // debug test 
    joint.type = 0;
    if( o.debug ){
        joint.type = t
        joint.bodyA = b1;
        joint.bodyB = b2;
    }
    
    world.addConstraint( joint, noAllowCollision );

    if( o.name ) byName[o.name] = joint;

    joints.push( joint );

    //console.log( joint );

    o = null;

};




/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*    AMMO CONTACT
*/

function stepContact () {

    var i = contactGroups.length;
    while( i-- ) contactGroups[i].step();

};

function clearContact () {

    while( contactGroups.length > 0) contactGroups.pop().clear();
    contactGroups = [];
    contacts = [];

};

function addContact ( o ) {

    var id = contactGroups.length;
    var c = new Contact( o, id );
    if( c.valide ){
        contactGroups.push( c );
        contacts.push(0);
    }

};

//--------------------------------------------------
//
//  CONTACT CLASS
//
//--------------------------------------------------

function Contact ( o, id ) {

    this.a = getByName( o.b1 );
    this.b = o.b2 !== undefined ? getByName( o.b2 ) : null;

    if( this.a !== null ){

        this.id = id;
        this.f = new Ammo.ConcreteContactResultCallback();
        this.f.addSingleResult = function(){ contacts[id] = 1; }
        this.valide = true;

    } else {

        this.valide = false;

    }

}

Contact.prototype = {

    step: function () {

        contacts[ this.id ] = 0;
        if( this.b !== null ) world.contactPairTest( this.a, this.b, this.f );
        else world.contactTest( this.a, this.f );

    },

    clear: function () {

        this.a = null;
        this.b = null;
        Ammo.destroy( this.f );

    }

}

//--------------------------------------------------
//
//  AMMO RIGIDBODY
//
//--------------------------------------------------

function stepRigidBody( AR, N ) {

    //if( !bodys.length ) return;

    bodys.forEach( function ( b, id ) {

        var n = N + (id * 8);
        AR[n] = b.getLinearVelocity().length() * 9.8;//b.isActive() ? 1 : 0;

        if ( AR[n] > 0 ) {

            b.getMotionState().getWorldTransform( trans );
            
            trans.toArray( AR, n + 1 );

            //trans.getOrigin().toArray( Br , n + 1 );
            //trans.getRotation().toArray( Br ,n + 4 );

        }

    });

};

function clearRigidBody () {

    var b;
    
    while( bodys.length > 0 ){

        b = bodys.pop();
        world.removeRigidBody( b );
        Ammo.destroy( b );

    }

    while( solids.length > 0 ){

        b = solids.pop();
        //world.removeRigidBody( b );
        world.removeCollisionObject( b );
        Ammo.destroy( b );

    }

    bodys = [];
    solids = [];

};

function addRigidBody ( o, extra ) {

    var isKinematic = false;
    
    if( o.density !== undefined ) o.mass = o.density;
    if( o.kinematic ){ 

        o.flag = 2;
        o.state = 4;
        //o.mass = 0;
        isKinematic = true;

    }

    o.mass = o.mass == undefined ? 0 : o.mass;
    o.size = o.size == undefined ? [1,1,1] : o.size;
    o.pos = o.pos == undefined ? [0,0,0] : o.pos;
    o.quat = o.quat == undefined ? [0,0,0,1] : o.quat;

    var shape = null;
    switch( o.type ){

        case 'plane': 
            tmpPos4.fromArray( o.dir || [0,1,0] ); 
            shape = new Ammo.btStaticPlaneShape( tmpPos4, 0 );
        break;

        case 'box': 
            tmpPos4.setValue( o.size[0]*0.5, o.size[1]*0.5, o.size[2]*0.5 );  
            shape = new Ammo.btBoxShape( tmpPos4 );
        break;

        case 'sphere': 
            shape = new Ammo.btSphereShape( o.size[0] ); 
        break;  

        case 'cylinder': 
            tmpPos4.setValue( o.size[0], o.size[1]*0.5, o.size[2]*0.5 );
            shape = new Ammo.btCylinderShape( tmpPos4 );
        break;

        case 'cone': 
            shape = new Ammo.btConeShape( o.size[0], o.size[1]*0.5 );
        break;

        case 'capsule': 
            shape = new Ammo.btCapsuleShape( o.size[0], o.size[1]*0.5 ); 
        break;
        
        case 'compound': 
            shape = new Ammo.btCompoundShape(); 
        break;

        case 'mesh':
            var mTriMesh = new Ammo.btTriangleMesh();
            var removeDuplicateVertices = true;
            var vx = o.v;
            for (var i = 0, fMax = vx.length; i < fMax; i+=9){
                tmpPos1.setValue( vx[i+0]*o.size[0], vx[i+1]*o.size[1], vx[i+2]*o.size[2] );
                tmpPos2.setValue( vx[i+3]*o.size[0], vx[i+4]*o.size[1], vx[i+5]*o.size[2] );
                tmpPos3.setValue( vx[i+6]*o.size[0], vx[i+7]*o.size[1], vx[i+8]*o.size[2] );
                mTriMesh.addTriangle( tmpPos1, tmpPos2, tmpPos3, removeDuplicateVertices );
            }
            if(o.mass == 0){ 
                // btScaledBvhTriangleMeshShape -- if scaled instances
                shape = new Ammo.btBvhTriangleMeshShape( mTriMesh, true, true );
            }else{ 
                // btGimpactTriangleMeshShape -- complex?
                // btConvexHullShape -- possibly better?
                shape = new Ammo.btConvexTriangleMeshShape( mTriMesh, true );
            }
        break;

        case 'convex':
            shape = new Ammo.btConvexHullShape();
            var vx = o.v;
            for (var i = 0, fMax = vx.length; i < fMax; i+=3){
                vx[i]*=o.size[0];
                vx[i+1]*=o.size[1];
                vx[i+2]*=o.size[2];

                tmpPos1.fromArray( vx , i );
                shape.addPoint( tmpPos1 );
            };
        break;
    }

    if( o.margin !== undefined && shape.setMargin !== undefined ) shape.setMargin( o.margin );

    if( extra == 'isShape' ) return shape;
    
    if( extra == 'isGhost' ){ 
        var ghost = new Ammo.btGhostObject();
        ghost.setCollisionShape( shape );
        ghost.setCollisionFlags( o.flag || 1 ); 
        //o.f = new Ammo.btGhostPairCallback();
        //world.getPairCache().setInternalGhostPairCallback( o.f );
        return ghost;
    }

    tmpPos.fromArray( o.pos );
    tmpQuat.fromArray( o.quat );

    tmpTrans.setIdentity();
    tmpTrans.setOrigin( tmpPos );
    tmpTrans.setRotation( tmpQuat );

    tmpPos1.setValue( 0,0,0 );
    shape.calculateLocalInertia( o.mass, tmpPos1 );
    var motionState = new Ammo.btDefaultMotionState( tmpTrans );

    var rbInfo = new Ammo.btRigidBodyConstructionInfo( o.mass, motionState, shape, tmpPos1 );

    //console.log(rbInfo.get_m_friction(), rbInfo.get_m_restitution());

    if( o.friction !== undefined ) rbInfo.set_m_friction( o.friction );
    if( o.restitution !== undefined ) rbInfo.set_m_restitution( o.restitution );
    //Damping is the proportion of velocity lost per second.
    if( o.linear !== undefined ) rbInfo.set_m_linearDamping( o.linear );
    if( o.angular !== undefined ) rbInfo.set_m_angularDamping( o.angular );
    // revents rounded shapes, such as spheres, cylinders and capsules from rolling forever.
    if( o.rolling !== undefined ) rbInfo.set_m_rollingFriction( o.rolling );
    
    var body = new Ammo.btRigidBody( rbInfo );
    body.isKinematic = isKinematic;

    if( o.name ) byName[ o.name ] = body;
    else if ( o.mass !== 0 ) byName[ bodys.length ] = body;

    if ( o.mass === 0 && !isKinematic){

        body.setCollisionFlags( o.flag || 1 ); 
        world.addCollisionObject( body, o.group || 1, o.mask || -1 );
        solids.push( body );

    } else {

       // body.isKinematic = isKinematic;
        body.setCollisionFlags( o.flag || 0 );
        world.addRigidBody( body, o.group || 1, o.mask || -1 );


        /*var n = bodys.length;
        tmpPos.toArray( Br, n + 1 );
        tmpQuat.toArray( Br, n + 4 );*/

        //body.activate();
        /*
        AMMO.ACTIVE = 1;
        AMMO.ISLAND_SLEEPING = 2;
        AMMO.WANTS_DEACTIVATION = 3;
        AMMO.DISABLE_DEACTIVATION = 4;
        AMMO.DISABLE_SIMULATION = 5;
        */
        body.setActivationState( o.state || 1 );
        bodys.push( body );
        
    }
    
    

    //if ( o.mass === 0  && !isKinematic) solids.push( body );
    //else bodys.push( body );


    //console.log(body)

    //Ammo.destroy( startTransform );
    //Ammo.destroy( localInertia );
    Ammo.destroy( rbInfo );

    o = null;

};

//--------------------------------------------------
//
//  AMMO SOFTBODY
//
//--------------------------------------------------

//var softPoints;

function stepSoftBody ( AR, N ) {

    //if( !softs.length ) return;

    var softPoints = N;

    softs.forEach( function ( b ) {

        var s = b.get_m_nodes(); // get vertrices list
        var j = s.size();
        var n;
                
        while(j--){
            n = softPoints + ( j * 3 );
            s.at( j ).get_m_x().toArray( AR, n );
            //pos = s.at( j ).get_m_x();
            
            //Sr[n] = pos.x();
            //Sr[n+1] = pos.y();
            //Sr[n+2] = pos.z();
        }

        softPoints += s.size()*3;

    });

};

function moveSoftBody( o ) {

    var soft = softs[o.id];
    var s = soft.get_m_nodes();
    //console.log(s)
    var j = s.size();
    while(j--){
        //pos = s.at( j ).get_m_x().add( new Ammo.btVector3(0, 10, 0) );
    }

    soft.set_m_nodes( s );

};



function clearSoftBody () {

    var b;

    while( softs.length > 0){

        b = softs.pop();
        world.removeSoftBody( b );
        Ammo.destroy( b );

    }

    softs = [];

};


function addSoftBody ( o ) {

    var gendiags = o.gendiags || true;
    //var fixed = o.fixed || 0;

    o.size = o.size == undefined ? [1,1,1] : o.size;
    o.div = o.div == undefined ? [64,64] : o.div;

    var softBodyHelpers = new Ammo.btSoftBodyHelpers();

    var body;

    switch( o.type ){
        case 'cloth':
            var mw = o.size[0] * 0.5;
            var mh = o.size[2] * 0.5;

            tmpPos1.fromArray( [ -mw, 0, -mh ] );
            tmpPos2.fromArray( [  mw, 0, -mh ] );
            tmpPos3.fromArray( [ -mw, 0,  mh ] );
            tmpPos4.fromArray( [  mw, 0,  mh ] );
            
            body = softBodyHelpers.CreatePatch( worldInfo, tmpPos1, tmpPos2, tmpPos3, tmpPos4, o.div[0], o.div[1], o.fixed || 0, gendiags  );
            body.softType = 1;
        break;
        case 'rope':
            tmpPos1.fromArray( o.start || [ -10, 0, 0 ] );
            tmpPos2.fromArray( o.end || [ 10, 0, 0 ] );

            var nseg = o.numSegment || 10;
            nseg -= 2;

            o.margin = (o.radius || 0.2);//*2;

            body = softBodyHelpers.CreateRope( worldInfo, tmpPos1, tmpPos2, nseg, o.fixed || 0 );
            //body.setTotalMass(o.mass);

            //console.log(body)


            //console.log(body.get_m_nodes().size())
            
            body.softType = 2;
        break;
        case 'ellipsoid':
            var center = o.center || [ 0, 0, 0]; // start
            var p1 = o.radius || [ 3, 3, 3]; // end

            tmpPos1.fromArray( o.center || [ 0, 0, 0 ] );
            tmpPos2.fromArray( o.radius || [ 3, 3, 3 ] );

            body = softBodyHelpers.CreateEllipsoid( worldInfo, tmpPos1, tmpPos2, o.vertices || 128  );
            body.softType = 3;

            var a = [];
            var b = body.get_m_nodes();
            var j = b.size(), n, node, p;
            while(j--){
                n = (j*3);
                node = b.at( j );
                p = node.get_m_x();
                a[n] = p.x();
                a[n+1] = p.y();
                a[n+2] = p.z();
            }

            o.lng = b.size();
            o.a = a;

            self.postMessage({ m:'ellipsoid', o:o });
        break;
        case 'softConvex': // BUG !!

            body = softBodyHelpers.CreateFromConvexHull( worldInfo, o.v, o.v.length/3, o.randomize || false );
            body.softType = 4;

            // force nodes
            var i = o.v.length/3, n;
            while(i--){
                n = i*3;
                tmpPos.fromArray( o.v, n );
                body.get_m_nodes().at( i ).set_m_x( tmpPos );
                //body.get_m_nodes().at( i ).set_m_x(new Ammo.btVector3(o.v[n], o.v[n+1], o.v[n+2]));
            }

        break;
        case 'softTriMesh':

            body = softBodyHelpers.CreateFromTriMesh( world.getWorldInfo(), o.v, o.i, o.ntri, o.randomize || true );
            body.softType = 5;

        break;
    }

    var sb = body.get_m_cfg();

    if( o.viterations !== undefined ) sb.set_viterations( o.viterations );//10
    if( o.piterations !== undefined ) sb.set_piterations( o.piterations );//10
    if( o.citerations !== undefined ) sb.set_citerations( o.citerations );//4
    if( o.diterations !== undefined ) sb.set_diterations( o.diterations );//0

    sb.set_collisions( 0x11 );

    // Friction
    if( o.friction !== undefined ) sb.set_kDF(o.friction);
    // Damping
    if( o.damping !== undefined ) sb.set_kDP(o.damping);
    // Pressure
    if( o.pressure !== undefined ) sb.set_kPR( o.pressure );

    //if( o.kvc !== undefined ) sb.set_kVC(o.kvc);

    if( o.stiffness !== undefined ){
        var mat = body.get_m_materials().at( 0 );
        mat.set_m_kLST( o.stiffness );
        mat.set_m_kAST( o.stiffness );
        mat.set_m_kVST( o.stiffness );
    }
    

    
    // Stiffness
    /*
    if( o.klst !== undefined ) body.get_m_materials().at(0).set_m_kLST(o.klst);
    if( o.kast !== undefined ) body.get_m_materials().at(0).set_m_kAST(o.kast);
    if( o.kvst !== undefined ) body.get_m_materials().at(0).set_m_kVST(o.kvst);
    -*/


    body.setTotalMass( o.mass, o.fromfaces || false );
    //body.setPose( true, true );

    //console.log(body)


    if(o.margin !== undefined ) Ammo.castObject( body, Ammo.btCollisionObject ).getCollisionShape().setMargin( o.margin );


    // Soft-soft and soft-rigid collisions
    world.addSoftBody( body, o.group || 1, o.mask || -1 );

    body.points = body.get_m_nodes().size();

    if( o.name ) byName[o.name] = body;

    softs.push( body );

    o = null;

};

var tmpData = {};
var terrainData = {};
var terrainList = [];
var terrainNeedUpdate = false;

//--------------------------------------------------
//
//  AMMO TERRAIN
//
//--------------------------------------------------

function terrainPostStep ( o ){

    var name = o.name;
    terrainList.push( name );
    tmpData[ name ] = o.heightData;
    terrainNeedUpdate = true;

}

function terrainUpdate ( o ){

    if( terrainNeedUpdate ){
        while( terrainList.length ) terrain_data( terrainList.pop() );
        terrainNeedUpdate = false;
    }

}

/*function updateTerrain ( o ) {

        this.byName[ o.name ].setHeightData( o.heightData );

}*/

function addTerrain ( o ) {

    // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
    var upAxis = 1;

    o.name = o.name == undefined ? 'terrain' : o.name;
    o.size = o.size == undefined ? [1,1,1] : o.size;
    o.sample = o.sample == undefined ? [64,64] : o.sample;
    o.pos = o.pos == undefined ? [0,0,0] : o.pos;
    o.quat = o.quat == undefined ? [0,0,0,1] : o.quat;
    o.mass = o.mass == undefined ? 0 : o.mass;

    // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
    var hdt = o.hdt || "PHY_FLOAT";

    // Set this to your needs (inverts the triangles)
    var flipEdge =  o.flipEdge !== undefined ? o.flipEdge : true;

    // Creates height data buffer in Ammo heap
    //terrainData = Ammo._malloc( 4 * lng );
    //hdata = o.hdata;

    tmpData[o.name] = o.heightData;

    terrain_data(o.name);

    

    var shape = new Ammo.btHeightfieldTerrainShape( o.sample[0], o.sample[1], terrainData[o.name], o.heightScale || 1, -o.size[1], o.size[1], upAxis, hdt, flipEdge ); 

    tmpPos2.setValue( o.size[0]/o.sample[0], 1, o.size[2]/o.sample[1] );
    shape.setLocalScaling( tmpPos2 );

    if( o.margin !== undefined && shape.setMargin !== undefined ) shape.setMargin( o.margin );

    tmpPos.fromArray(o.pos);
    tmpQuat.fromArray(o.quat);

    tmpTrans.setIdentity();
    tmpTrans.setOrigin( tmpPos );
    tmpTrans.setRotation( tmpQuat );

    tmpPos1.setValue( 0,0,0 );
    //shape.calculateLocalInertia( o.mass, tmpPos1 );
    var motionState = new Ammo.btDefaultMotionState( tmpTrans );

    var rbInfo = new Ammo.btRigidBodyConstructionInfo( o.mass, motionState, shape, tmpPos1 );
    o.friction = o.friction == undefined ? 0.5 : o.friction;
    o.restitution = o.restitution == undefined ? 0 : o.restitution;
    rbInfo.set_m_friction( o.friction || 0.5 );
    rbInfo.set_m_restitution( o.restitution || 0 );
    var body = new Ammo.btRigidBody( rbInfo );


    body.setCollisionFlags(o.flag || 1);
    world.addCollisionObject( body, o.group || 1, o.mask || -1 );

    solids.push( body );

    Ammo.destroy( rbInfo );

    o = null;

}


function terrain_data(name){

    var d = tmpData[name];
    var i = d.length, n;
    // Creates height data buffer in Ammo heap
    if( terrainData[name] == null ) terrainData[name] = Ammo._malloc( 4 * i );
    // Copy the javascript height data array to the Ammo one.
    
    while(i--){
        n = i * 4;
        Ammo.HEAPF32[ terrainData[name] + n >> 2 ] = d[i];
    }

};
/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*    AMMO VEHICLE
*/

function stepVehicle ( N  ) {

    cars.forEach( function ( car, id ) {

        var n = N + (id * 56);
        car.step( n );

    });

};

function clearVehicle () {

    while( cars.length > 0) cars.pop().clear();
    cars = [];

};

function setVehicle ( o ) {

    var id = o.id || 0;
    if( !cars[id] ) return;

    cars[id].set( o );

}

function addVehicle ( o ) {

    var car = new Vehicle( o );
    cars.push( car );

};

function drive ( id ) {

    id = id || 0;
    if( !cars[id] ) return;

    cars[id].drive();

};

//--------------------------------------------------
//
//  VEHICLE CLASS
//
//--------------------------------------------------

function Vehicle ( o ) {

    this.car = null;
    this.body = null;
    this.steering = 0; 
    this.breaking = 0;
    this.engine = 0;
    this.gearRatio = [-1, 0, 2.3, 1.8, 1.3, 0.9, 0.5 ];

    this.data = {

        mass: 100,
        // wheels
        radius: 0.5,
        nWheel: 4,
        wPos:[1, 0, 1.6], // wheels position on chassis
        // drive setting
        engine:1000,
        acceleration:10,
        steering: 0.3,//Math.PI/6,
        breaking : 100,
        incSteering: 0.04, 
        
        // position / rotation / size
        pos: [0,0,0],
        quat: [0,0,0,1],
        //size:[ 1.5, 0.4, 3.6 ],
        // local center of mass (best is on chassis bottom)
        masscenter:[ 0, -0.6, 0 ], 
        // car body physics
        friction: 0.6, 
        restitution: 0.1,
        linear: 0, 
        angular: 0,
        // auto compess
        auto: false,
        compValue: 0.2, //(lower than damp!)
        dampValue: 0.3,
        // suspension
        s_stiffness: 20,
        s_compression: 2.3,
        s_damping: 4.4,//2.4
        s_travel: 5,
        s_force: 6000,
        s_length: 0.2,
        // wheel
        w_friction: 10.5,//1000,
        w_roll: 0.1,

    }

    this.init( o );

}

Vehicle.prototype = {

    step: function ( n ){

        // speed km/h
        Ar[ n ] = this.car.getCurrentSpeedKmHour();

        this.body.getMotionState().getWorldTransform( trans );
        trans.toArray( Ar, n + 1 );

        var j = this.data.nWheel, w, t;

        if( j === 4 ){
            w = 8 * ( 4 + 1 );
            Ar[n+w+0] = this.car.getWheelInfo(0).get_m_raycastInfo().get_m_suspensionLength();
            Ar[n+w+1] = this.car.getWheelInfo(1).get_m_raycastInfo().get_m_suspensionLength();
            Ar[n+w+2] = this.car.getWheelInfo(2).get_m_raycastInfo().get_m_suspensionLength();
            Ar[n+w+3] = this.car.getWheelInfo(3).get_m_raycastInfo().get_m_suspensionLength();
        }

        while(j--){

            this.car.updateWheelTransform( j, true );
            t = this.car.getWheelTransformWS( j );

            w = 8 * ( j + 1 );
            t.toArray( Ar, n + w + 1 );
           
            if( j === 0 ) Ar[ n + w ] = this.car.getWheelInfo(0).get_m_steering();

        }

    },

    drive: function (){

        var data = this.data;

        this.steering -= data.incSteering * key[0];

        if( this.steering < -data.steering ) this.steering = -data.steering;
        if( this.steering > data.steering ) this.steering = data.steering;

        this.steering *= 0.9;

        this.engine -= data.acceleration * key[1];
        if( this.engine > data.engine ) this.engine = data.engine;
        if( this.engine < -data.engine ) this.engine = -data.engine;
        
        if( key[1] == 0  ){// && key[1] == 0 ){
            if( this.engine > 1 ) this.engine *= 0.9;
            else if ( this.engine < -1 ) this.engine *= 0.9;
            else { this.engine = 0; this.breaking = data.breaking; }
        }

        var i = data.nWheel;
        while(i--){
            if( i == 0 ) this.car.setSteeringValue( this.steering, i );
            if( data.nWheel !== 2 && i == 1 ) this.car.setSteeringValue( this.steering, i );
            this.car.applyEngineForce( this.engine, i );
            this.car.setBrake( this.breaking, i );
        }

    },

    clear: function (){

        world.removeRigidBody( this.body );
        world.removeAction( this.car );

        Ammo.destroy( this.body );
        Ammo.destroy( this.car );

        this.body = null;
        this.car = null;

    },

    init: function ( o ){

        var data = this.data;

        var type = o.type || 'box';

        data.mass = o.mass === undefined ? 800 : o.mass;
        o.masscenter = o.masscenter === undefined ? [0,0,0] : o.masscenter;
        o.size = o.size === undefined ? [2,0.5,4] : o.size;
        data.pos = o.pos === undefined ? [0,0,0] : o.pos;
        data.quat = o.quat === undefined ? [0,0,0,1] : o.quat;

        // car shape 
        var shape;
        if( type == 'mesh' ) shape = addRigidBody( { type:'mesh', v:o.v, mass:1 }, 'isShape');
        else if( type == 'convex' ) shape = addRigidBody( { type:'convex', v:o.v }, 'isShape');
        else shape = addRigidBody( { type:'box', size:o.size }, 'isShape');

        if( o.v !== undefined ) delete( o.v );

        // move center of mass
        tmpPos4.fromArray( o.masscenter ).negate();
        tmpTrans1.setIdentity();
        tmpTrans1.setOrigin( tmpPos4 );
        var compound = new Ammo.btCompoundShape();
        compound.addChildShape( tmpTrans1, shape );

        // position rotation of car 
        tmpPos.fromArray( data.pos );
        tmpQuat.fromArray( data.quat );
        tmpTrans.setIdentity();
        tmpTrans.setOrigin( tmpPos );
        tmpTrans.setRotation( tmpQuat );

        // mass of vehicle in kg
        //tmpPos1.setValue( 0,0,0 );
        compound.calculateLocalInertia( data.mass, tmpPos1 );
        var motionState = new Ammo.btDefaultMotionState( tmpTrans );
        var rbInfo = new Ammo.btRigidBodyConstructionInfo( data.mass, motionState, compound, tmpPos1 );

        // car body
        this.body = new Ammo.btRigidBody( rbInfo );
        this.body.setActivationState( 4 );

        Ammo.destroy( rbInfo );

        var tuning = new Ammo.btVehicleTuning();
        var vehicleRay = new Ammo.btDefaultVehicleRaycaster( world );
        this.car = new Ammo.btRaycastVehicle( tuning, this.body, vehicleRay );
        this.car.setCoordinateSystem( 0, 1, 2 );


        // wheels
        var radius = o.radius || 0.4;
        var wPos = o.wPos || [1, 0, 1.6];
        wPos[1] -= o.masscenter[1];

        var n = o.nWheel || 4, p, fw;

        for( var i = 0; i < n; i++ ){
            
            if( i===2 && wPos[4] ) wPos[0] += wPos[4]; 
            if(i===0){ p = [ wPos[0], wPos[1],  wPos[2] ]; fw = true; }
            if(i===1){ p = [-wPos[0], wPos[1],  wPos[2] ]; fw = true; }
            if(i===2){ p = [-wPos[0], wPos[1], -wPos[2] ]; fw = false; }
            if(i===3){ p = [ wPos[0], wPos[1], -wPos[2] ]; fw = false; }
            if(i===4){ p = [-wPos[0], wPos[1], -wPos[3] ]; fw = false; }
            if(i===5){ p = [ wPos[0], wPos[1], -wPos[3] ]; fw = false; }

            if( n === 2 ){ // moto
                if(i==1){ p = [ -wPos[0], wPos[1], -wPos[2] ]; fw = false; }
            }

            tmpPos1.fromArray( p ); // position
            tmpPos2.setValue( 0,-1,0 ); // wheelDir
            tmpPos3.setValue( -1,0,0 ); // wheelAxe
            this.car.addWheel( tmpPos1, tmpPos2, tmpPos3, 1, radius, tuning, fw );
            this.car.setBrake( o.breaking || 100, i );
        
        };

        this.set( o );

        world.addAction( this.car );
        world.addRigidBody( this.body );
        //this.body.activate();

             

    },

    setMass: function ( m ){

        this.data.mass = m;
        //tmpPos1.setValue( 0,0,0 );
        this.body.getCollisionShape().calculateLocalInertia( this.data.mass, tmpPos1 );
        this.body.setMassProps( m, tmpPos1 );
        this.body.updateInertiaTensor();

    },

    setPosition: function (){

        this.steering = 0; 
        this.breaking = 0;
        this.engine = 0;

        tmpPos.fromArray( this.data.pos );
        tmpQuat.fromArray( this.data.quat );

        tmpTrans.setIdentity();
        tmpTrans.setOrigin( tmpPos );
        tmpTrans.setRotation( tmpQuat );

        this.body.setAngularVelocity( tmpZero );
        this.body.setLinearVelocity( tmpZero );
        this.body.setWorldTransform( tmpTrans );
        //this.body.activate();

        //world.getBroadphase().getOverlappingPairCache().cleanProxyFromPairs( this.body.getBroadphaseHandle(), world.getDispatcher() );

        this.car.resetSuspension();
        var n = this.data.nWheel;
        while( n-- ) this.car.updateWheelTransform( n, true );


        //console.log( world, world.getPairCache(), world.getDispatcher() )

    },

    set: function ( o ) {

        var data = this.data;

        // mass
        if( o.mass !== undefined ){
            if( o.mass !== data.mass ) this.setMass( o.mass );
        }

        // copy value
        for( var i in o ){
            if( data[i] ) data[i] = o[i]; 
        }

        // body
        this.body.setFriction( data.friction );
        this.body.setRestitution( data.restitution );
        this.body.setDamping( data.linear, data.angular );

        if( data.auto ){
            var sqrt = Math.sqrt( data.s_stiffness );
            data.s_compression = data.compValue * 2 * sqrt;
            data.s_damping = data.dampValue * 2 * sqrt;
        }

        var n = data.nWheel, w;

        while( n-- ){

            w = this.car.getWheelInfo(n);

            w.set_m_suspensionStiffness( data.s_stiffness );
            w.set_m_wheelsDampingCompression( data.s_compression );
            w.set_m_wheelsDampingRelaxation( data.s_damping );

            w.set_m_maxSuspensionTravelCm( data.s_travel * 100 );
            w.set_m_maxSuspensionForce( data.s_force );
            w.set_m_suspensionRestLength1( data.s_length );

            w.set_m_rollInfluence( data.w_roll );
            w.set_m_frictionSlip( data.w_friction );

            w.set_m_wheelsRadius( data.radius );
            //w.set_m_chassisConnectionPointCS( tmpPos1.fromArray(o.w_position) );

        }

        if( o.reset ) this.setPosition();

    },

    get: function (){

        self.postMessage({ m:'carData', o:this.data });

    },

}


// google bullet maxSuspensionForce
// https://github.com/jMonkeyEngine/jmonkeyengine/blob/master/jme3-examples/src/main/java/jme3test/bullet/TestFancyCar.java
// https://github.com/david-sabata/UniversityRacer
