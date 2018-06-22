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

       // console.log(worldInfo.get_m_maxDisplacement())

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


