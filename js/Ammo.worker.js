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
// array
var bodys, joints, cars, solids, heros, carsInfo;
// object
var rigids;

var dt = 0.01667;//6;//7;
var it = 1;// default is 1. 2 or more make simulation more accurate.
var ddt = 1;
var key = [ 0,0,0,0,0,0,0,0 ];

var terrainData = null;

var timer = 0;
var isBuffer;

var tmpset = null;

var currentCar = 0;

// main transphere array
var ar = new Float32Array( 1000*8 ); // rigid buffer max 1000
var dr = new Float32Array( 14*56 ); // car buffer max 14 / 6 wheels
var jr = new Float32Array( 100*4 ); // joint buffer max 100
var hr = new Float32Array( 10*8 ); // hero buffer max 10

// for terrain
var hdata = null;
var terrainNeedUpdate = false;

var fixedTime = 0.01667;
var last_step = Date.now();
var timePassed = 0;

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
  DEFAULT_FILTER : 1, 
  STATIC_FILTER : 2, 
  KINEMATIC_FILTER : 4, 
  DEBRIS_FILTER : 8, 
  SENSOR_TRIGGER : 16, 
  CHARACTER_FILTER : 32, 
  ALL_FILTER : -1 
}

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

        isBuffer = e.data.isBuffer;
        dt = e.data.framerate;
        it = e.data.iteration || 1;
        importScripts( e.data.blob );
        self.postMessage({ m:'init' });
        init();

    }

    if(m == 'reset') reset();

    if(m == 'key') key = e.data.o;

    if(m == 'setDriveCar') currentCar = e.data.o.n;

    if(m == 'add') add( e.data.o );

    //if(m == 'set') set( e.data.o );
    if(m == 'set') tmpset = e.data.o;

    if(m == 'vehicle') vehicle( e.data.o );

    if(m == 'character') character( e.data.o );

    if(m == 'gravity') gravity( e.data.g );

    if(m == 'apply') apply( e.data.o );

    if(m == 'terrain'){

        hdata = e.data.hdata;
        terrainNeedUpdate = true;
        
    }

    if(m == 'step'){

        // ------- pre step

        key = e.data.key;

        drive( currentCar );
        move( 0 );

        if(tmpset!==null) set();

        if( terrainNeedUpdate ) terrain_data();

        // ------- buffer data

        if( isBuffer ){

            ar = e.data.ar;
            dr = e.data.dr;
            hr = e.data.hr;
            jr = e.data.jr;
            
        }

        // ------- step

        //world.stepSimulation( dt, it );
        world.stepSimulation( dt, 0, dt );

        var i = bodys.length, a = ar, n, b, p, r;
        var j, w, t;

        while(i--){

            n = i * 8;
            b = bodys[i];
            
            a[n] = b.getLinearVelocity().length() * 9.8;//b.isActive() ? 1 : 0;

            if ( a[n] ) {

                //b.getMotionState().getWorldTransform( trans );
                trans = b.getWorldTransform();
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

        i = heros.length;
        a = hr;

        while(i--){

            n = i*8;
            b = heros[i];

            

            //b.playerStep( world, dt );

            //b.getGhostObject().getWorldTransform( trans );
            trans = b.getGhostObject().getWorldTransform();
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


        i = cars.length;
        a = dr;

        while(i--){

            n = i * 56;
            b = cars[i];

            // speed km/h
            a[n+0] = b.getCurrentSpeedKmHour();//getRigidBody().getLinearVelocity().length() * 9.8;

            //b.getRigidBody().getMotionState().getWorldTransform( trans );
            trans = b.getRigidBody().getWorldTransform();
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
            a[n+8] = b.getNumWheels();
            j = a[n+8];//2, 4 or 6;
            while(j--){
                b.updateWheelTransform( j, true );
                t = b.getWheelTransformWS( j );
                p = t.getOrigin();
                r = t.getRotation();
               
                w = 8 * ( j + 1 );

                if( j == 1 ) a[n+w] = b.getWheelInfo(0).get_m_steering();
                //else a[n+w] = i;
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

        if( isBuffer ) self.postMessage({ m:'step', ar:ar, dr:dr, hr:hr, jr:jr },[ ar.buffer, dr.buffer, hr.buffer, jr.buffer ]);
        else self.postMessage( { m:'step', ar:ar, dr:dr, hr:hr, jr:jr } );
        
    }

};


function postStep(){

    if( isBuffer ) self.postMessage({ m:'step', ar:ar, dr:dr, hr:hr, jr:jr },[ ar.buffer, dr.buffer, hr.buffer, jr.buffer ]);
    else self.postMessage( { m:'step', ar:ar, dr:dr } );

};

function control( o ){

    key = o;
    drive( 0 );
    move( 0 );

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

    var type = 2;
    var s = 1000;

    switch( type ){

        //case 1: broadphase = new Ammo.btSimpleBroadphase(); break;
        case 2: broadphase = new Ammo.btAxisSweep3( vec3(-s,-s,-s), vec3(s,s,s), 4096 ); break;//16384;
        case 3: broadphase = new Ammo.btDbvtBroadphase(); break;
        
    }

    world = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collision );
    world.setGravity( vec3(0, -9.8, 0) );
    //broadphase.getOverlappingPairCache().setInternalGhostPairCallback( new Ammo.btGhostPairCallback() );

    //console.log(world);

    bodys = [];
    joints = [];
    cars = [];
    carsInfo = [];
    heros = [];
    solids = [];

    // use for get object by name
    rigids = {};


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

    while( heros.length > 0){

        b = heros.pop();
        //carsInfo.pop();
        //Ammo.destroy( b );
        world.removeRigidBody( b.getGhostObject() );
        Ammo.destroy( b.getGhostObject() );
        world.removeAction(b);
        
    }

    // clear body name object
    rigids = {};

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

function set ( o ) {

    o = tmpset;

    //console.log('yyy')

    var b = getByName( o.name );

    var t = new Ammo.btTransform();
    t.setIdentity();
    t.setOrigin( v3( o.pos ) );
    t.setRotation( q4( o.quat ) );

    //b.setWorldTransform(t);
    b.getMotionState().setWorldTransform(t);

    tmpset = null;

};

function add ( o, extra ) {

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
    var margin = o.margin || 0.04; // 0.04 is default // 0.005

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
        case 'cone': shape = new Ammo.btConeShape( size[0], size[1]*0.5 ); break;
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

    if(shape.setMargin !== undefined ){ shape.setMargin( margin ); }

    if( extra == 'isShape' ) return shape;
    if( extra == 'isGhost' ){ 
        var ghost = new Ammo.btGhostObject();
        ghost.setCollisionShape( shape );
        return ghost;
    }

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
    if ( mass !== 0 ){
        body.setCollisionFlags(o.flag || 0);
        //body.setCollisionFlags(1); 
        world.addRigidBody( body, o.group || 1, o.mask || -1 );
        
    } else {
        body.setCollisionFlags(o.flag || 1); 
        //body.setCollisionFlags( FLAGS.STATIC_OBJECT | FLAGS.KINEMATIC_OBJECT ) ;
        world.addCollisionObject( body, o.group || 2, o.mask || -1 );
    }

    //console.log(body.getMotionState())


    

    //body.setContactProcessingThreshold ??

    body.activate();

    //body.name = o.name || '';
    var name = o.name || '';
    if(name) rigids[name] = body;

    //body.isKinematic = o.kinematic || false;

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

    return rigids[name];

    /*var i = bodys.length, b;
    while(i--){
        b = bodys[i];
        if(name == b.name) return b;
    }*/

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
        case "joint_hinge": case "joint":
            joint = new Ammo.btHingeConstraint( body1, body2, point1, point2, axe1, axe2, false);
            if( min!==0 || max!==0 ) joint.setLimit( min, max, softness, bias, relaxation);
        break;
        case "joint_slider": joint = new Ammo.btSliderConstraint( body1, body2, point1, point2); break;
        case "joint_conetwist": joint = new Ammo.btConeTwistConstraint( body1, body2, point1, point2 ); break;
        case "joint_gear": joint = new Ammo.btGearConstraint( body1, body2, point1, point2, ratio); break;
        case "joint_dof": joint = new Ammo.btGeneric6DofConstraint( body1, body2, point1, point2); break;
    }

    world.addConstraint( joint, noAllowCollision );
    joints.name = o.name || '';
    joints.push( joint );

};



/*
 enum   CollisionFlags { 
  CF_STATIC_OBJECT = 1, 
  CF_KINEMATIC_OBJECT = 2, 
  CF_NO_CONTACT_RESPONSE = 4, 
  CF_CUSTOM_MATERIAL_CALLBACK = 8, 
  CF_CHARACTER_OBJECT = 16, 
  CF_DISABLE_VISUALIZE_OBJECT = 32, 
  CF_DISABLE_SPU_COLLISION_PROCESSING = 64 
}
 
enum    CollisionObjectTypes { 
  CO_COLLISION_OBJECT =1, 
  CO_RIGID_BODY =2, 
  CO_GHOST_OBJECT =4, 
  CO_SOFT_BODY =8, 
  CO_HF_FLUID =16, 
  CO_USER_TYPE =32, 
  CO_FEATHERSTONE_LINK =64 
}
 
enum    AnisotropicFrictionFlags { 
  CF_ANISOTROPIC_FRICTION_DISABLED =0, 
  CF_ANISOTROPIC_FRICTION = 1, 
  CF_ANISOTROPIC_ROLLING_FRICTION = 2 
}

enum    CollisionFilterGroups { 
  DefaultFilter = 1, 
  StaticFilter = 2, 
  KinematicFilter = 4, 
  DebrisFilter = 8, 
  SensorTrigger = 16, 
  CharacterFilter = 32, 
  AllFilter = -1 
}
*/

//--------------------------------------------------
//
//  CHARACTER
//
//--------------------------------------------------

function character ( o ) {

    var stepHeight = 0.3;

    var startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin( v3( o.pos ) );
    startTransform.setRotation( q4( o.quat ) );

    var size = o.size || [1,1,1];
    var shape = new Ammo.btCapsuleShape(size[0], size[1]*0.5);
    //var shape = new Ammo.btBoxShape( vec3( size[0]*0.5, size[1]*0.5, size[2]*0.5 ) );
    //var localInertia = vec3();
    //shape.calculateLocalInertia( 10, localInertia );
    //var body = new Ammo.btGhostObject();
    var localInertia = vec3(0, 0, 0);
    shape.calculateLocalInertia( 1, localInertia );
    //shape.calculateLocalInertia( mass, localInertia );
    //var motionState = new Ammo.btDefaultMotionState( startTransform );

    //var rb = new Ammo.btRigidBodyConstructionInfo( 1, motionState, shape, localInertia);
    //var body = new Ammo.btRigidBody( rb );
    var body = new Ammo.btPairCachingGhostObject();
    body.setCollisionShape(shape);
    body.setCollisionFlags( o.flag || 16 );
    console.log(body);
    ///body.setWorldTransform( startTransform );
    
    //
   /* 
    
    body.setCollisionFlags( FLAGS.CHARACTER_OBJECT );
    body.setFriction( o.friction || 0.1 );
    body.setRestitution( o.restitution || 0 );
   
    ///ghostObject.collisionFlags = AWPCollisionFlags.CF_CHARACTER_OBJECT;*/
    body.setActivationState( 4 );
    body.activate();

    var hero = new Ammo.btKinematicCharacterController( body, shape, stepHeight);
    //hero.setUseGhostSweepTest(true);

    console.log(hero);
    //hero.setGravity( vec3(0, -9.8, 0) );
    hero.setFallSpeed(0.1);
    hero.warp(v3(o.pos));
    hero.setVelocityForTimeInterval(vec3(), 1);

    //world.addCollisionObject( ghostObject, o.group || 1, o.mask || -1 );
    //world.addAction( hero ); 
    /*world.addCollisionObject( body, GROUP.CHARACTER_FILTER, GROUP.STATIC_FILTER | GROUP.DEFAULT_FILTER );
    //world.addCollisionObject( body );
    //world.addRigidBody( body );*/
    

    
    world.addCollisionObject( body, o.group || 32, o.mask || -1 );
    //world.addRigidBody( body)//, o.group || 32, o.mask || 1|2 );
    world.addAction( hero ); 

    //console.log( body, hero, body.getCollisionFlags() );

    heros.push( hero );

}

function move ( id ) {

    var id = id || 0;
    if( !heros[id] ) return;

    var walkDirection = vec3(0,0,0);
    var walkSpeed = 1;

    var xform = heros[id].getGhostObject().getWorldTransform();

    var forwardDir = xform.getBasis().getRow(2);
    var upDir  = xform.getBasis().getRow(1);
    var strafeDir = xform.getBasis().getRow(0);

    forwardDir.normalize();
    upDir.normalize();
    strafeDir.normalize();

    if( key[0] == 1 ) walkDirection.op_add(forwardDir);
    if( key[1] == 1 ) walkDirection.op_sub(forwardDir);

    if( key[2] == 1 ) walkDirection.op_add(strafeDir);
    if( key[3] == 1 ) walkDirection.op_sub(strafeDir);

    walkDirection.op_mul(walkSpeed);


    //console.log(heros[id].onGround())




    heros[id].setWalkDirection(walkDirection);
   // heros[id].preStep ( world );
   //heros[id].setVelocityForTimeInterval(vec3(), 1);


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

    var carInfo = {
        steering:0, 
        engine:0, 
        breaking:0, 

        incSteering:0.01, 
        maxSteering:Math.PI/6, 
        incEngine:5, 
        maxEngine:600 
    };

    //----------------------------
    // car shape 

    var shape;
    if( type == 'mesh' ) shape = add( { type:'mesh', v:o.v, mass:1 }, 'isShape');
    else if( type == 'convex' ) shape = add( { type:'convex', v:o.v }, 'isShape');
    else shape = add( { type:'box', size:size }, 'isShape');

    //----------------------------
    // move center of mass

    var massCenter = o.massCenter || [0,0.25,0];
    var localTransform = new Ammo.btTransform();
    localTransform.setIdentity();
    localTransform.setOrigin( v3( massCenter ) );
    var compound = new Ammo.btCompoundShape();
    compound.addChildShape( localTransform, shape );

    //----------------------------
    // position rotation of car 

    var startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin( v3( pos ) );
    startTransform.setRotation( q4( quat ) );

    //----------------------------
    // physics setting

    // mass of vehicle in kg
    var mass = o.mass || 1000
    var localInertia = vec3();
    compound.calculateLocalInertia( mass, localInertia );
    var motionState = new Ammo.btDefaultMotionState( startTransform );

    var rb = new Ammo.btRigidBodyConstructionInfo( mass, motionState, compound, localInertia);
    rb.set_m_friction( o.friction || 0.5 );
    rb.set_m_restitution( o.restitution || 0 );
    rb.set_m_linearDamping( o.linearDamping || 0 );
    rb.set_m_angularDamping( o.angularDamping || 0 );

    //----------------------------
    // car body

    var body = new Ammo.btRigidBody( rb );
    //body.setCenterOfMassTransform( localTransform );
    body.setAngularVelocity( vec3() );
    body.setLinearVelocity( vec3() );
    body.setActivationState( 4 );

    //----------------------------
    // suspension setting

    var tuning = new Ammo.btVehicleTuning();
    // 10 = Offroad buggy, 50 = Sports car, 200 = F1 Car
    tuning.set_m_suspensionStiffness( o.s_stiffness || 40 );
    // The damping coefficient for when the suspension is compressed. Set
    // to k * 2.0 * btSqrt(m_suspensionStiffness) so k is proportional to critical damping.
    // k = 0.0 undamped & bouncy, k = 1.0 critical damping
    // k = 0.1 to 0.3 are good values , default 0.84
    tuning.set_m_suspensionCompression( o.s_compression || 2.4 );
    // The damping coefficient for when the suspension is expanding.
    // m_suspensionDamping should be slightly larger than set_m_suspensionCompression, eg k = 0.2 to 0.5, default : 0.88
    tuning.set_m_suspensionDamping( o.s_relaxation || 2.8 );

     // The maximum distance the suspension can be compressed in Cm
    tuning.set_m_maxSuspensionTravelCm( o.s_travel || 40 );
    // Maximum suspension force
    tuning.set_m_maxSuspensionForce( o.s_force || 6000 );
    // suspension resistance Length
    // The maximum length of the suspension (metres)
    var s_length = o.s_length || 0.1;

    //----------------------------
    // wheel setting

    var radius = o.radius || 0.4;
    var wPos = o.wPos || [1, 0, 1.6];
    // friction: The constant friction of the wheels on the surface.
    // For realistic TS It should be around 0.8. default 10.5
    // But may be greatly increased to improve controllability (1000 and more)
    // Set large (10000.0) for kart racers
    tuning.set_m_frictionSlip( o.w_friction || 1000 );
    // roll: reduces torque from the wheels
    // reducing vehicle barrel chance
    // 0 - no torque, 1 - the actual physical behavior
    var w_roll = o.w_roll || 0.1;

    //----------------------------
    // create vehicle

    var vehicleRayCaster = new Ammo.btDefaultVehicleRaycaster( world );
    var car = new Ammo.btRaycastVehicle(tuning, body, vehicleRayCaster);
    car.setCoordinateSystem( 0, 1, 2 );

    var numWheels = o.nw || 4, p, fw;

    for( var i = 0; i < numWheels; i++ ){
        
        if( i==2 && wPos[4]) wPos[0]+=wPos[4]; 

        if(i==0){ p = vec3(  wPos[0], wPos[1],  wPos[2] ); fw = true; }
        if(i==1){ p = vec3( -wPos[0], wPos[1],  wPos[2] ); fw = true; }
        if(i==2){ p = vec3( -wPos[0], wPos[1], -wPos[2] ); fw = false; }
        if(i==3){ p = vec3(  wPos[0], wPos[1], -wPos[2] ); fw = false; }
        if(i==4){ p = vec3( -wPos[0], wPos[1], -wPos[3] ); fw = false; }
        if(i==5){ p = vec3(  wPos[0], wPos[1], -wPos[3] ); fw = false; }

        if( numWheels == 2 ){ // moto
            if(i==1){ p = vec3( -wPos[0], wPos[1],  -wPos[2] ); fw = false; }
        }

        addWheel( car, p, radius, tuning, s_length, w_roll, fw );
    
    };

    world.addAction( car );
    world.addRigidBody( body );

    //console.log( car );
    //console.log( body );
    console.log( tuning );
    //console.log( car.getWheelInfo(0).get_m_wheelsDampingRelaxation() );
    //console.log( car.getWheelInfo(0).get_m_wheelsDampingCompression() );
    console.log( car.getWheelInfo(0).get_m_suspensionRestLength1() );

    body.activate();

    cars.push( car );
    carsInfo.push( carInfo );

};

function addWheel ( car, p, radius, tuning, s_length, w_roll, isFrontWheel ) {

    var wheelDir = vec3(0, -1, 0);
    var wheelAxe = vec3(-1, 0, 0);

    var wheel = car.addWheel( p, wheelDir, wheelAxe, s_length, radius, tuning, isFrontWheel );
    wheel.set_m_rollInfluence( w_roll );

};

function drive ( id ) {

    var id = id || 0;
    if( !cars[id] ) return;

    var car = cars[id];
    var u = carsInfo[id];
    var wn = car.getNumWheels();

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

    var i = wn;
    while(i--){
        if( i == 0 ) car.setSteeringValue( u.steering, i );
        if(wn !== 2 && i == 1 ) car.setSteeringValue( u.steering, i );
        car.applyEngineForce( u.engine, i );
        car.setBrake( u.breaking, i );
    }

};