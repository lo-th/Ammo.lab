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

'use strict';

var Module = { TOTAL_MEMORY: 256*1024*1024 };

var trans, pos, quat, posW, quatW, transW, gravity;
var tmpTrans, tmpPos, tmpQuat;
var tmpPos1, tmpPos2, tmpPos3, tmpPos4;
var tmpTrans1, tmpTrans2;
// array
var bodys, softs, joints, cars, solids, heros, carsInfo;
// object
var byName;

var timestep = 0.017;//6;//7;
var substep = 10;//4//3;// default is 1. 2 or more make simulation more accurate.
var ddt = 1;
var key = [ 0,0,0,0,0,0,0,0 ];

var pause = false;

var timer = 0;
var isBuffer;

var tmpset = null;

var currentCar = 0;

// main transphere array
/*var Br, Cr, Jr, Hr, Sr;*/

var Br = new Float32Array( 1000*8 ); // rigid buffer max 1000
var Cr = new Float32Array( 14*56 ); // car buffer max 14 / 6 wheels
var Jr = new Float32Array( 100*4 ); // joint buffer max 100
var Hr = new Float32Array( 10*8 ); // hero buffer max 10
var Sr = new Float32Array( 8192*3 ); // soft buffer nVertices x,y,z

// for terrain
//var hdata = null;
var tmpData = {};
var terrainData = {};
var terrainList = [];
var terrainNeedUpdate = false;

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

function stepAdvanced () {

    var time = Date.now();
    var seconds = ( time - last_step ) * 0.001;
    last_step = time;

    var maxSubSteps = 1;
    var fixedTimeStep = seconds;

    timePassed += seconds;
    //timeStep < maxSubSteps * fixedTimeStep

    if ( timePassed >= fixedTime ) {
        maxSubSteps = ~~ ( seconds * 60 ); //Math.ceil ( seconds / fixedTime );
        fixedTimeStep = seconds / maxSubSteps;
    }

    world.stepSimulation( seconds, maxSubSteps, fixedTimeStep );

}

function stepDelta () {

    var time = Date.now();
    var seconds = ( time - last_step ) * 0.001;
    last_step = time;

    //console.log(seconds)

    world.stepSimulation( seconds, 1, seconds );

}

self.onmessage = function ( e ) {

    var m = e.data.m;

    var center;
    var centerPoint;

    if(m === 'init'){

        isBuffer = e.data.isBuffer;
        timestep = e.data.timestep;
        substep = e.data.substep || 1;

        importScripts( e.data.blob );

        importScripts( 'ammo/math.js' );
        importScripts( 'ammo/world.js' );
        importScripts( 'ammo/character.js' );
        importScripts( 'ammo/constraint.js' );
        importScripts( 'ammo/rigidBody.js' );
        importScripts( 'ammo/softBody.js' );
        importScripts( 'ammo/terrain.js' );
        importScripts( 'ammo/vehicle.js' );
        
        self.postMessage({ m:'init' });
        init();

    }

    if(m === 'reset') reset();

    if(m === 'key') key = e.data.o;

    if(m === 'setDriveCar') currentCar = e.data.o.n;

    if(m === 'substep') substep = e.data.o.substep;

    if(m === 'add') add( e.data.o );

    if(m === 'set') tmpset = e.data.o;

    if(m === 'vehicle') addVehicle( e.data.o );

    if(m === 'character') addCharacter( e.data.o );

    if(m === 'gravity') gravity( e.data.o );

    if(m === 'anchor') anchor( e.data.o );

    if(m === 'apply') apply( e.data.o );

    if(m === 'terrain'){

        var name = e.data.name;
        terrainList.push(name);
        tmpData[name] = e.data.hdata;

        //hdata = e.data.hdata;
        terrainNeedUpdate = true;
        
    }

    if(m === 'step'){

        if(pause) return;

        // ------- pre step

        key = e.data.key;

        //drive( currentCar );
        move( 0 );

        if(tmpset!==null) set();

        if( terrainNeedUpdate ){
            while(terrainList.length){
                terrain_data(terrainList.pop());
            }

            terrainNeedUpdate = false;
        }

        // ------- buffer data

        if( isBuffer ){

            Br = e.data.Br;
            Cr = e.data.Cr;
            Hr = e.data.Hr;
            Jr = e.data.Jr;
            Sr = e.data.Sr;
            
        }

        // ------- step

        world.stepSimulation( timestep, substep );
        //world.stepSimulation( dt, it, dt );

        drive( currentCar );

        stepRigidBody();
        stepCharacter();
        stepVehicle();
        stepSoftBody();

        //softPoints = 0;
        //softs.forEach( softUp )

        // ------- post step

        postStep();
        
    }

};

function preStep(){



};

function postStep(){

    if( isBuffer ) self.postMessage({ m:'step', Br:Br, Cr:Cr, Hr:Hr, Jr:Jr, Sr:Sr },[ Br.buffer, Cr.buffer, Hr.buffer, Jr.buffer, Sr.buffer ]);
    else self.postMessage( { m:'step', Br:Br, Cr:Cr, Hr:Hr, Jr:Jr, Sr:Sr } );

};


//--------------------------------------------------
//
//  INTERN CONTROL
//
//--------------------------------------------------


function control( o ){

    key = o;
    drive( 0 );
    move( 0 );

};



//--------------------------------------------------
//
//  WORLD
//
//--------------------------------------------------

function init () {

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

    // extra transform

    tmpTrans1 = new Ammo.btTransform();
    tmpTrans2 = new Ammo.btTransform();

    // gravity
    gravity = new Ammo.btVector3();



    addWorld();

    bodys = [];
    softs = [];
    joints = [];
    cars = [];
    carsInfo = [];
    heros = [];
    solids = [];

    // use for get object by name
    byName = {};


    //self.postMessage({ m:'init' });

    //timer = setInterval( step, 16.667 );

    postStep();
    
};



function resetARRAY(){

    var i = Br.length;
    while(i--) Br[i] = 0;
    i = Cr.length;
    while(i--) Cr[i] = 0;
    i = Jr.length;
    while(i--) Jr[i] = 0;
    i = Hr.length;
    while(i--) Hr[i] = 0;
    i = Sr.length;
    while(i--) Sr[i] = 0;

};

function reset ( fullReset ) {

    pause = true;

    resetARRAY();

    clearJoint();
    clearRigidBody();
    clearVehicle();
    clearCharacter();
    clearSoftBody();

    // clear body name object
    byName = {};

    

    if( fullReset ){

        clearWorld();
        addWorld();

    }

    pause = false;

};



function wipe (obj) {
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) delete obj[p];
    }
};

//--------------------------------------------------
//
//  RIGIDBODY
//
//--------------------------------------------------

function set ( ) {

    var o = tmpset;

    var b = getByName( o.name );
    if(b == null) return;

    tmpPos.fromArray( o.pos );
    tmpQuat.fromArray( o.quat );
    tmpTrans.setIdentity();
    if(o.pos) tmpTrans.setOrigin( tmpPos );
    if(o.quat) tmpTrans.setRotation( tmpQuat );

    b.getMotionState().setWorldTransform(tmpTrans);

    tmpset = null;

};

function getByName(name){

    return byName[name] || null;

};

//--------------------------------------------------
//
//  ADD
//
//--------------------------------------------------

function add ( o, extra ) {

    o.type = o.type == undefined ? 'box' : o.type;

    // CONSTRAINT
    if(o.type.substring(0,5) == 'joint') {

        addJoint( o );
        return;

    }

    // SOFTBODY
    if(o.type.substring(0,4) == 'soft' || o.type == 'ellipsoid'  || o.type == 'rope'  || o.type == 'cloth' ) {

        addSoftBody( o );
        return;

    }

    // TERRAIN
    if(o.type == 'terrain') {

        addTerrain( o );
        return;

    }

    // RIGIDBODY
    addRigidBody( o, extra );

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
//  FORCE
//
//--------------------------------------------------

function apply ( o ) {

    var b = getByName( o.name );

    if( b !== null ){

        if( o.v1 !== undefined ) tmpPos1.fromArray( o.v1 );
        if( o.v2 !== undefined ) tmpPos2.fromArray( o.v2 );

        switch(o.type){
            case 'force' : b.applyForce( tmpPos1, tmpPos2 ); break;
            case 'torque' : b.applyTorque( tmpPos1 ); break;
            case 'localTorque' : b.applyLocalTorque( tmpPos1 ); break;
            case 'centralForce' : b.applyCentralForce( tmpPos1 ); break;
            case 'centralLocalForce' : b.applyCentralLocalForce( tmpPos1 ); break;
            case 'impulse' : b.applyImpulse( tmpPos1, tmpPos2 ); break;
            case 'centralImpulse' : b.applyCentralImpulse( tmpPos1 ); break;

            // joint

            case 'motor' : b.enableAngularMotor( o.motor[0], o.motor[1], o.motor[2] ); break;

        }
    }

};