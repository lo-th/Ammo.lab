/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    AMMO worker ultimate
*/

'use strict';
//var Module = { TOTAL_MEMORY: 256*1024*1024 };

var world = null;
var solver, collision, dispatcher, broadphase, trans;
var bodys, joints, cars, solide;

var dm = 0.033
var dt = 0.01667;//6;//7;
var it = 1;//1;//2;
var ddt = 1;

var terrainData = null;

var timer = 0;

// main transphere array
var ar = new Float32Array( 1000*8 );
var dr = new Float32Array( 20*40 );

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

        //console.log('physics init')

        importScripts( e.data.blob );

        

        self.postMessage({ m:'init' });


        init();

      //n = 'step'



    }

    if(m == 'reset') reset();

    if(m == 'add') add( e.data.o );

    if(m == 'vehicle') vehicle( e.data.o );

    if(m == 'gravity') gravity( e.data.g );

    if(m == 'terrain'){

        hdata = e.data.hdata;
        terrainNeedUpdate = true;

        

    }

    if(m == 'step'){

        // ------- pre step

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
            
            a[n] = b.isActive() ? 1 : 0;

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
            a[n+0] = b.getRigidBody().getLinearVelocity().length() * 9.8;

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
    solide = [];


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

    while( solide.length > 0 ){

        b = solide.pop();
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
        //Ammo.destroy( b );
        world.removeRigidBody( b.getRigidBody() );
        Ammo.destroy( b.getRigidBody() );
        
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
                v0.setValue( vx[i+0], vx[i+1], vx[i+2] );
                v1.setValue( vx[i+3], vx[i+4], vx[i+5] );
                v2.setValue( vx[i+6], vx[i+7], vx[i+8] );
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
                copyV3([vx[i+0], vx[i+1], vx[i+2]], v);
                shape.addPoint(v);
            }
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

    // push only dynamique
    if ( mass !== 0 ) bodys.push( body );
    else solide.push( body );

}

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

function getByName(name){

    var i = bodys.length, b;
    while(i--){
        b = bodys[i];
        if(name == b.name) return b;
    }

}



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



//--------------------------------------------------
//
//  VEHICLE
//
//--------------------------------------------------

function vehicle ( o ) {

    var type = o.type || 'basic';

    var size = o.size || [2,0.5,4];
    var pos = o.pos || [0,0,0];
    var quat = o.quat || [0,0,0,1];

    //var limiteY = o.limiteY || 20;
    var massCenter = o.massCenter || [0,0.25,0];

    // wheels
    var radius = o.radius || 0.4;
    var deep = o.deep || 0.3;
    var wPos = o.wPos || [1, 0, 1.6];

    var settings = o.setting || {
        engine:600, 
        stiffness: 20,//40, 
        relaxation: 2.3,//0.85, 
        compression: 4.4,//0.82, 
        travel: 500, 
        force: 6000, 
        frictionSlip: 1000,//20.5, 
        reslength: 0.1,  // suspension Length
        roll: 0//0.1 // basculement du vehicle  
    };

    var maxEngineForce = settings.engine;
    var maxBreakingForce = o.maxBreakingForce || 125.0;
    var steeringClamp = o.steeringClamp || 0.51;

    var engine = 0.0;
    var breaking = 0.0;
    var steering = 0.0;
    var gas = 0;

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

    var mass = o.mass || 400;

    var localInertia = vec3(0, 0, 0);
    compound.calculateLocalInertia( mass, localInertia );
    //shape.calculateLocalInertia( mass, localInertia );
    var motionState = new Ammo.btDefaultMotionState( startTransform );

    var rb = new Ammo.btRigidBodyConstructionInfo(mass, motionState, compound, localInertia);
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
    tuning.set_m_suspensionStiffness(settings.stiffness); //100;
    // 0.1 to 0.3 are good values
    tuning.set_m_suspensionDamping(settings.relaxation);//0.87
    tuning.set_m_suspensionCompression(settings.compression);//0.82
    tuning.set_m_maxSuspensionTravelCm(settings.travel);//500
    tuning.set_m_maxSuspensionForce(settings.force);//6000
    tuning.set_m_frictionSlip(settings.frictionSlip);//10.5

    var car = new Ammo.btRaycastVehicle(tuning, body, vehicleRayCaster);
    car.setCoordinateSystem( 0, 1, 2 );

    addWheel( car, wPos[0], wPos[1], wPos[2], radius, tuning, settings, true);
    addWheel( car, -wPos[0], wPos[1], wPos[2], radius, tuning, settings, true);
    addWheel( car, -wPos[0], wPos[1], -wPos[2], radius, tuning, settings, false);
    addWheel( car, wPos[0], wPos[1], -wPos[2], radius, tuning, settings, false);
    
    world.addAction( car );
    world.addRigidBody( body );

    //console.log( car );
    //console.log( car.getWheelInfo(0) );

    body.activate();

    cars.push( car );

};

function addWheel ( car, x,y,z,radius,tuning,settings, isFrontWheel ) {

    var wheelDir = vec3(0, -1, 0);
    var wheelAxe = vec3(-1, 0, 0);

    var wheel = car.addWheel( vec3(x, y, z), wheelDir, wheelAxe, settings.reslength, radius, tuning, isFrontWheel);
    wheel.set_m_rollInfluence(settings.roll);

};

function drive () {


};

/*vehicle.prototype = {
    constructor: vehicle,

    addWheel:function( x,y,z, isFrontWheel ){
        var wheelDir = vec3(0, -1, 0);
        var wheelAxe = vec3(-1, 0, 0);

        var wheel = this.vehicle.addWheel( vec3(x, y, z), wheelDir, wheelAxe, this.settings.reslength, this.radius, this.tuning, isFrontWheel);
        wheel.set_m_rollInfluence(this.settings.roll);
    },

    getMatrix:function(id){
        //var trans = this.parent.transform;
        var m = dr;
        var n = id*40;

        m[n+0] = 0//this.vehicle.getCurrentSpeedKmHour().toFixed(0)*1;//this.body.getActivationState();

        //var t = this.body.getCenterOfMassTransform();
        //var t = this.vehicle.getChassisWorldTransform(); 

        this.body.getMotionState().getWorldTransform( trans );
        var pos = trans.getOrigin();
        var rot = trans.getRotation();

        if(this.type==='basic'){
            m[n+1] = pos.x()+this.massCenter[0];
            m[n+2] = pos.y()+this.massCenter[1];
            m[n+3] = pos.z()+this.massCenter[2];
        }else{
            m[n+1] = pos.x();
            m[n+2] = pos.y();
            m[n+3] = pos.z();
        }
        m[n+4] = rot.x();
        m[n+5] = rot.y();
        m[n+6] = rot.z();
        m[n+7] = rot.w();

        var i = this.nWheels;
        var w, t;
        while(i--){
            this.vehicle.updateWheelTransform( i, true );
            t = this.vehicle.getWheelTransformWS( i );
            pos = t.getOrigin();
            rot = t.getRotation();
           
            w = 8*(i+1);
            if(i==0) m[n+w] = this.steering;
            else m[n+w] = i;
            m[n+w+1] = pos.x();
            m[n+w+2] = pos.y();
            m[n+w+3] = pos.z();
            m[n+w+4] = rot.x();
            m[n+w+5] = rot.y();
            m[n+w+6] = rot.z();
            m[n+w+7] = rot.w();
        }
    },
    drive:function(){
        

        if(key.left===1)this.steering+=this.incSteering;
        if(key.right===1)this.steering-=this.incSteering;
        if(key.left===0 && key.right==0) this.steering *= 0.9;//this.steering = 0;
        if (this.steering < -this.maxSteering) this.steering = -this.maxSteering;
        if (this.steering > this.maxSteering) this.steering = this.maxSteering;

        if(key.up===1)this.engine+=this.incEngine;//this.gas = 1; //
        if(key.down===1)this.engine-=this.incEngine;//this.gas = -1; //
        if (this.engine > this.maxEngineForce) this.engine = this.maxEngineForce;
        if (this.engine < -this.maxEngineForce) this.engine = -this.maxEngineForce;
        
        if(key.up===0 && key.down===0){
            if(this.engine>1) this.engine *= 0.9;
            else if (this.engine<-1)this.engine *= 0.9;
            else {this.engine = 0; this.breaking=10;}
        }

        
        var i = this.nWheels;
        while(i--){
            this.vehicle.applyEngineForce( this.engine, i );
            this.vehicle.setBrake( this.breaking, i );
            if(i==0 || i==1) this.vehicle.setSteeringValue( this.steering, i );
        }
        //this.steering *= 0.9;

    }
}*/