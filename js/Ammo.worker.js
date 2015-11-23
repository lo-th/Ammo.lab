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

var world = null;
var solver, collision, dispatcher, broadphase, trans;
var bodys, joints, cars, solids, heros, carsInfo;

var dm = 0.033
var dt = 0.01667;//6;//7;
var it = 1;//1;//2;
var ddt = 1;
var key = [ 0,0,0,0,0,0,0,0 ];

var terrainData = null;

var timer = 0;

// main transphere array
var ar = new Float32Array( 1000*8 ); // rigid buffer max 1000
var dr = new Float32Array( 20*40 ); // car buffer max 20
var jr = new Float32Array( 400*4 ); // joint buffer 400

// for terrain
var hdata = null;
var terrainNeedUpdate = false;

var fixedTime = 0.01667;
var last_step = Date.now();
var timePassed = 0;

function stepAdvanced () {

    var time = Date.now();
    var seconds = ( time - last_step ) * 0.001;
    last_step = time;

    var maxSubSteps = 1;
    var fixedTimeStep = seconds;

    timePassed += seconds;
    //timeStep < maxSubSteps * fixedTimeStep

    if ( timePassed > fixedTime ) {
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

    

    if(m == 'init'){

        importScripts( e.data.blob );
        self.postMessage({ m:'init' });
        init();

    }

    if(m == 'reset') reset();

    if(m == 'key') key = e.data.o;

    if(m == 'add') add( e.data.o );

    if(m == 'vehicle') vehicle( e.data.o );

    if(m == 'gravity') gravity( e.data.g );

    if(m == 'apply') apply( e.data.o );

    if(m == 'terrain'){

        hdata = e.data.hdata;
        terrainNeedUpdate = true;
        
    }

    if(m == 'step'){

        // ------- pre step

        key = e.data.key;

        drive( 0 );

        if( terrainNeedUpdate ) terrain_data();

        // ------- buffer data

        ar = e.data.ar;
        dr = e.data.dr;

        // ------- step

        world.stepSimulation( dt, it );

        var i = bodys.length, a = ar, n, b, p, r;
        var j, w, t;

        while(i--){

            n = i * 8;
            b = bodys[i];
            
            a[n] = b.getLinearVelocity().length() * 9.8;//b.isActive() ? 1 : 0;

            if ( a[n] ) {

                b.getMotionState().getWorldTransform( trans );

                p = trans.getOrigin();
                r = trans.getRotation();

                a[n+1] = p.x();
                a[n+2] = p.y();
                a[n+3] = p.z();

                a[n+4] = r.x();
                a[n+5] = r.y();
                a[n+6] = r.z();
                a[n+7] = r.w();

            }

        }

        i = cars.length;
        a = dr;

        while(i--){

            n = i * 40;
            b = cars[i];

            // speed km/h
            a[n+0] = b.getCurrentSpeedKmHour();//getRigidBody().getLinearVelocity().length() * 9.8;

            b.getRigidBody().getMotionState().getWorldTransform( trans );
            p = trans.getOrigin();
            r = trans.getRotation();

            // chassis pos / rot
            a[n+1] = p.x();
            a[n+2] = p.y();
            a[n+3] = p.z();

            a[n+4] = r.x();
            a[n+5] = r.y();
            a[n+6] = r.z();
            a[n+7] = r.w();

            // wheels pos / rot
            j = 4;
            while(j--){
                b.updateWheelTransform( j, true );
                t = b.getWheelTransformWS( j );
                p = t.getOrigin();
                r = t.getRotation();
               
                w = 8 * ( j + 1 );

                if( j == 0 ) a[n+w] = b.getWheelInfo(0).get_m_steering();
                else a[n+w] = i;
                a[n+w+1] = p.x();
                a[n+w+2] = p.y();
                a[n+w+3] = p.z();

                a[n+w+4] = r.x();
                a[n+w+5] = r.y();
                a[n+w+6] = r.z();
                a[n+w+7] = r.w();
            }

        }

        // ------- post step

        self.postMessage({ m:'step', ar:ar, dr:dr },[ ar.buffer, dr.buffer ]);
        
    }

};


function postStep(){

    self.postMessage({ m:'step', ar:ar, dr:dr },[ ar.buffer, dr.buffer ]);

};

function control( o ){

    key = o;
    drive( 0 );

};


//--------------------------------------------------
//
//  AMMO MATH
//
//--------------------------------------------------

var vec3 = function(x, y, z){
    return new Ammo.btVector3(x || 0, y || 0, z || 0);
};

var v3 = function( a ){
    return new Ammo.btVector3( a[0], a[1], a[2] );
};

var q4 = function( a ){
    return new Ammo.btQuaternion( a[0], a[1], a[2], a[3] );
};

var copyV3 = function (a,b) { b.setX(a[0]); b.setY(a[1]); b.setZ(a[2]); };


//--------------------------------------------------
//
//  WORLD
//
//--------------------------------------------------

function init () {

    if( world !== null ) return;

    solver = new Ammo.btSequentialImpulseConstraintSolver();
    collision = new Ammo.btDefaultCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher( collision );
    trans = new Ammo.btTransform();

    var type = 3;

    switch( type ){

        //case 1: broadphase = new Ammo.btSimpleBroadphase(); break;
        case 2: broadphase = new Ammo.btAxisSweep3( vec3(-1,-1,-1), vec3(1,1,1), 4096 ); break;//16384;
        case 3: broadphase = new Ammo.btDbvtBroadphase(); break;
        
    }

    world = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collision );
    world.setGravity( vec3(0, -9.8, 0) );

    //console.log(world);

    bodys = [];
    joints = [];
    cars = [];
    carsInfo = [];
    heros = [];
    solids = [];


    //self.postMessage({ m:'init' });

    //timer = setInterval( step, 16.667 );

    postStep();
    

};

function gravity ( g ) {

    world.setGravity( v3( g ) );

};

function reset () {

    var b;
    while( bodys.length > 0 ){

        b = bodys.pop();
        world.removeRigidBody( b );
        Ammo.destroy( b );

    }

    while( solids.length > 0 ){

        b = solids.pop();
        world.removeRigidBody( b );
        Ammo.destroy( b );

    }

    var j;
    while( joints.length > 0 ){

        j = joints.pop();
        world.removeConstraint( j );
        Ammo.destroy( j );

    }

    while( cars.length > 0){

        b = cars.pop();
        carsInfo.pop();
        //Ammo.destroy( b );
        world.removeRigidBody( b.getRigidBody() );
        Ammo.destroy( b.getRigidBody() );
        world.removeAction(b);
        
    }

    //world.getBroadphase().resetPool( world.getDispatcher() );
    //world.getConstraintSolver().reset();

};

function dispose () {

    Ammo.destroy( world );
    Ammo.destroy( solver );
    Ammo.destroy( collision );
    Ammo.destroy( dispatcher );
    Ammo.destroy( broadphase );

    world = null;

};


//--------------------------------------------------
//
//  RIGIDBODY
//
//--------------------------------------------------

function add ( o, onlyShape ) {

    var type = o.type || 'box';

    if(type.substring(0,5) == 'joint') {

        addJoint( o );
        return;

    }

    var shape = null;

    var mass = o.mass || 0;
    var size = o.size || [1,1,1];
    var dir = o.dir || [0,1,0]; // for infinite plane
    
    var pos = o.pos || [0,0,0];
    var quat = o.quat || [0,0,0,1];
    //var rot = o.rot || [0,0,0];
    var margin = o.margin || 0.05;

    if( type == 'terrain' ){
        var div = o.div || [64,64];

        // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
        var upAxis = 1;

        // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
        var hdt = o.hdt || "PHY_FLOAT";

        // Set this to your needs (inverts the triangles)
        var flipEdge = o.flipEdge || false;

        //var lng = div[0] * div[1];
        var localScaling = vec3( size[0]/div[0] ,1, size[2]/div[1] );

        //var localScaling = v3(size);

        // Creates height data buffer in Ammo heap
        //terrainData = Ammo._malloc( 4 * lng );
        hdata = o.hdata;

        terrain_data();

    }

    switch( type ){
        case 'plane': shape = new Ammo.btStaticPlaneShape( v3(dir), 0 );break;
        case 'box': shape = new Ammo.btBoxShape( vec3( size[0]*0.5, size[1]*0.5, size[2]*0.5 ) ); break;
        case 'sphere': shape = new Ammo.btSphereShape(size[0]); break;  
        case 'cylinder': shape = new Ammo.btCylinderShape(vec3(size[0], size[1]*0.5, size[1]*0.5)); break;
        case 'cone': shape = new Ammo.btConeShape(size[0], size[1]*0.5); break;
        case 'capsule': shape = new Ammo.btCapsuleShape(size[0], size[1]*0.5); break;
        
        case 'compound': shape = new Ammo.btCompoundShape(); break;

        case 'mesh':
            var mTriMesh = new Ammo.btTriangleMesh();
            var removeDuplicateVertices = true;
            var v0 = vec3();
            var v1 = vec3(); 
            var v2 = vec3();
            var vx = o.v;
            for (var i = 0, fMax = vx.length; i < fMax; i+=9){
                v0.setValue( vx[i+0]*size[0], vx[i+1]*size[1], vx[i+2]*size[2] );
                v1.setValue( vx[i+3]*size[0], vx[i+4]*size[1], vx[i+5]*size[2] );
                v2.setValue( vx[i+6]*size[0], vx[i+7]*size[1], vx[i+8]*size[2] );
                mTriMesh.addTriangle(v0,v1,v2, removeDuplicateVertices);
            }
            if(mass == 0){ 
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
            var v = vec3(0,0,0);
            var vx = o.v;
            for (var i = 0, fMax = vx.length; i < fMax; i+=3){
                copyV3([ vx[i]*size[0], vx[i+1]*size[1], vx[i+2]*size[2] ], v);
                shape.addPoint(v);
            };
        break;

        case 'terrain': 
            shape = new Ammo.btHeightfieldTerrainShape( div[0], div[1], terrainData, o.heightScale || 1, -size[1], size[1], upAxis, hdt, flipEdge ); 
            shape.setLocalScaling( localScaling );
        break;

    }

    if(shape.setMargin){ shape.setMargin( margin ); }

    if( onlyShape ) return shape;

    var startTransform = new Ammo.btTransform();
    startTransform.setIdentity();

    startTransform.setOrigin( v3( pos ) );
    startTransform.setRotation( q4( quat ) );

    var localInertia = vec3();
    shape.calculateLocalInertia( mass, localInertia );
    var motionState = new Ammo.btDefaultMotionState( startTransform );

    var rb = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, localInertia );
    rb.set_m_friction( o.friction || 0.5 );
    rb.set_m_restitution( o.restitution || 0 );

    var body = new Ammo.btRigidBody( rb );
    world.addRigidBody( body );
    body.activate();

    body.name = o.name || '';

    body.isKinematic = o.kinematic || false;

    /*
    AMMO.ACTIVE = 1;
    AMMO.ISLAND_SLEEPING = 2;
    AMMO.WANTS_DEACTIVATION = 3;
    AMMO.DISABLE_DEACTIVATION = 4;
    AMMO.DISABLE_SIMULATION = 5;
    */
    body.setActivationState( o.state || 1 );
    //body.setCollisionFlags();

    if ( mass !== 0 ) bodys.push( body ); // only dynamique
    else solids.push( body ); // only static

};

function getByName(name){

    var i = bodys.length, b;
    while(i--){
        b = bodys[i];
        if(name == b.name) return b;
    }

};


//--------------------------------------------------
//
//  FORCE
//
//--------------------------------------------------

function apply ( o ) {

    var b = getByName(o.name);
    switch(o.type){
        case 'force' : b.applyForce( v3(o.v1), v3(o.v2) ); break;
        case 'torque' : b.applyTorque( v3(o.v1) ); break;
        case 'localTorque' : b.applyLocalTorque( v3(o.v1) ); break;
        case 'centralForce' : b.applyCentralForce( v3(o.v1) ); break;
        case 'centralLocalForce' : b.applyCentralLocalForce( v3(o.v1) ); break;
        case 'impulse' : b.applyImpulse( v3(o.v1), v3(o.v2) ); break;
        case 'centralImpulse' : b.applyCentralImpulse( v3(o.v1) ); break;
    }

};


//--------------------------------------------------
//
//  TERRAIN
//
//--------------------------------------------------

function terrain_data(){

    var i = hdata.length, n;
    // Creates height data buffer in Ammo heap
    if( terrainData == null ) terrainData = Ammo._malloc( 4 * i );
    // Copy the javascript height data array to the Ammo one.
    while(i--){
        n = i * 4;
        Ammo.HEAPF32[ terrainData + n >> 2 ] = hdata[i];
    }

    terrainNeedUpdate = false;

};


//--------------------------------------------------
//
//  CONSTRAINT JOINT
//
//--------------------------------------------------

function addJoint ( o ) {

    var noAllowCollision = true;
    var collision = o.collision || false;
    if(collision) noAllowCollision = false;

    var body1 = getByName(o.body1);
    var body2 = getByName(o.body2);

    var point1 = v3( o.pos1 || [0,0,0] );
    var point2 = v3( o.pos2 || [0,0,0] );
    var axe1 = v3( o.axe1 || [0,1,0] );
    var axe2 = v3( o.axe2 || [0,1,0] );

    var min = o.min || 0;
    var max = o.max || 0;

    var spring = o.spring || [0.9, 0.3, 0.1];
    var softness = spring[0];
    var bias =  spring[1];
    var relaxation =  spring[2];

    var joint = null;

    switch(o.type){
        case "joint_p2p": 
            joint = new Ammo.btPoint2PointConstraint( body1, body2, point1, point2);
            joint.get_m_setting().set_m_tau( o.strength || 0.1 );
            joint.get_m_setting().set_m_damping( o.damping || 1 ); 
        break;
        case "joint_hinge": 
            joint = new Ammo.btHingeConstraint( body1, body2, point1, point2, axe1, axe2, false);
            if( min!==0 || max!==0 ) joint.setLimit( min, max, softness, bias, relaxation);
        break;
        case "joint_slider": joint = new Ammo.btSliderConstraint( body1, body2, point1, point2); break;
        case "joint_conetwist": joint = new Ammo.btConeTwistConstraint( body1, body2, point1, point2 ); break;
        case "joint_gear": joint = new Ammo.btGearConstraint( body1, body2, point1, point2, ratio); break;
        case "joint_dof": joint = new Ammo.btGeneric6DofConstraint( body1, body2, point1, point2); break;
    }

    world.addConstraint( joint, noAllowCollision );
    joints.name = o.name || "";
    joints.push( joint );

};


//--------------------------------------------------
//
//  CHARACTER
//
//--------------------------------------------------

function character ( o ) {

    var size = o.size || [1,1,1];
    var shape = new Ammo.btCapsuleShape(size[0], size[1]*0.5);
    var ghostObject = new Ammo.btGhostObject( shape );
    ghostObject.friction = o.friction || 0.1;
    ///ghostObject.collisionFlags = AWPCollisionFlags.CF_CHARACTER_OBJECT;

    var hero = new Ammo.btKinematicCharacterController( ghostObject, 0.1 );
    world.addAction( hero );

    heros.push( hero );

}

//--------------------------------------------------
//
//  VEHICLE
//
//--------------------------------------------------

function vehicle ( o ) {

    var type = o.type || 'box';

    var size = o.size || [2,0.5,4];
    var pos = o.pos || [0,0,0];
    var quat = o.quat || [0,0,0,1];

    //var limiteY = o.limiteY || 20;
    var massCenter = o.massCenter || [0,0.25,0];

    // wheels
    var radius = o.radius || 0.4;
    var deep = o.deep || 0.3;
    var wPos = o.wPos || [1, 0, 1.6];

    var setting = o.setting || {
        mass:400,
        engine:600, 
        stiffness: 20,//40, 
        damping: 2.3,//0.85, 
        compression: 4.4,//0.82, 
        travel: 500, 
        force: 6000, 
        frictionSlip: 1000,//20.5, 
        reslength: 0.1,  // suspension Length
        roll: 0//0.1 // basculement du vehicle  
    };

    var carInfo = {
        steering:0, 
        engine:0, 
        breaking:0, 

        incSteering:0.01, 
        maxSteering:Math.PI/6, 
        incEngine:5, 
        maxEngine:600 
    };

    var incEngine = 5;
    var maxSteering = Math.PI / 6;
    var incSteering = 0.01;

    var shape;
    if(o.carshape) shape = add( { type:'convex', v:o.carshape }, true);
    else shape = add( { type:'box', size:size }, true);
    
    var compound = new Ammo.btCompoundShape();

    // move center of mass
    var localTransform = new Ammo.btTransform();
    localTransform.setIdentity();
    localTransform.setOrigin( v3( massCenter ) );
    compound.addChildShape( localTransform, shape );

    var startTransform = new Ammo.btTransform();
    startTransform.setIdentity();

    startTransform.setOrigin( v3( pos ) );
    startTransform.setRotation( q4( quat ) );

    var localInertia = vec3(0, 0, 0);
    compound.calculateLocalInertia( setting.mass, localInertia );
    //shape.calculateLocalInertia( mass, localInertia );
    var motionState = new Ammo.btDefaultMotionState( startTransform );

    var rb = new Ammo.btRigidBodyConstructionInfo( setting.mass, motionState, compound, localInertia);
    //var rb = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
    
    rb.set_m_friction( o.friction || 0.5 );
    rb.set_m_restitution( o.restitution || 0 );
    rb.set_m_linearDamping( o.linearDamping || 0 );
    rb.set_m_angularDamping( o.angularDamping || 0 );

    var body = new Ammo.btRigidBody( rb );
    //body.setCenterOfMassTransform( localTransform );
    body.setAngularVelocity( vec3( 0, 0, 0));
    body.setLinearVelocity( vec3( 0, 0, 0));
    body.setActivationState( 4 );

    //console.log( body );

    // create vehicle
    var vehicleRayCaster = new Ammo.btDefaultVehicleRaycaster( world );
    var tuning = new Ammo.btVehicleTuning();

    // 10 = Offroad buggy, 50 = Sports car, 200 = F1 Car
    tuning.set_m_suspensionStiffness(setting.stiffness); //100;
    // 0.1 to 0.3 are good values
    tuning.set_m_suspensionDamping(setting.damping);//0.87
    tuning.set_m_suspensionCompression(setting.compression);//0.82
    tuning.set_m_maxSuspensionTravelCm(setting.travel);//500
    tuning.set_m_maxSuspensionForce(setting.force);//6000
    tuning.set_m_frictionSlip(setting.frictionSlip);//10.5

    var car = new Ammo.btRaycastVehicle(tuning, body, vehicleRayCaster);
    car.setCoordinateSystem( 0, 1, 2 );

    addWheel( car, wPos[0], wPos[1], wPos[2], radius, tuning, setting, true);
    addWheel( car, -wPos[0], wPos[1], wPos[2], radius, tuning, setting, true);
    addWheel( car, -wPos[0], wPos[1], -wPos[2], radius, tuning, setting, false);
    addWheel( car, wPos[0], wPos[1], -wPos[2], radius, tuning, setting, false);
    
    world.addAction( car );
    world.addRigidBody( body );

    //console.log( car );
    //console.log( tuning );
    //console.log( car.getWheelInfo(0) );

    body.activate();

    cars.push( car );
    carsInfo.push( carInfo );

};

function addWheel ( car, x,y,z, radius, tuning, setting, isFrontWheel ) {

    var wheelDir = vec3(0, -1, 0);
    var wheelAxe = vec3(-1, 0, 0);

    var wheel = car.addWheel( vec3(x, y, z), wheelDir, wheelAxe, setting.reslength, radius, tuning, isFrontWheel);
    wheel.set_m_rollInfluence( setting.roll );

};

function drive ( id ) {

    var id = id || 0;
    if( !cars[id] ) return;

    var car = cars[id];
    var u = carsInfo[id];

    if( key[2] == 1 ) u.steering += u.incSteering;
    if( key[3] == 1 ) u.steering -= u.incSteering;
    if( key[2] == 0 && key[3] == 0 ) u.steering *= 0.9;
    if( u.steering < -u.maxSteering ) u.steering = -u.maxSteering;
    if( u.steering > u.maxSteering ) u.steering = u.maxSteering;

    if( key[0] == 1 ) u.engine += u.incEngine;
    if( key[1] == 1 ) u.engine -= u.incEngine;
    if( u.engine > u.maxEngineForce ) u.engine = u.maxEngine;
    if( u.engine < -u.maxEngineForce ) u.engine = -u.maxEngine;
    
    if( key[0] == 0 && key[1] == 0 ){
        if( u.engine > 1 ) u.engine *= 0.9;
        else if ( u.engine < -1 ) u.engine *= 0.9;
        else { u.engine = 0; u.breaking = 10; }
    }

    var i = car.getNumWheels();
    while(i--){
        if( i == 0 || i == 1 ) car.setSteeringValue( u.steering, i );
        car.applyEngineForce( u.engine, i );
        car.setBrake( u.breaking, i );
    }

};