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
var worldInfo = null;
var solver, solverSoft, collision, dispatcher, broadphase, trans;
// array
var bodys, softs, joints, cars, solids, heros, carsInfo;
// object
var byName;

var timestep = 0.01667;//6;//7;
var substep = 4;//3;// default is 1. 2 or more make simulation more accurate.
var ddt = 1;
var key = [ 0,0,0,0,0,0,0,0 ];



var timer = 0;
var isBuffer;

var tmpset = null;

var currentCar = 0;

// main transphere array
var ar = new Float32Array( 1000*8 ); // rigid buffer max 1000
var dr = new Float32Array( 14*56 ); // car buffer max 14 / 6 wheels
var jr = new Float32Array( 100*4 ); // joint buffer max 100
var hr = new Float32Array( 10*8 ); // hero buffer max 10
var cr = new Float32Array( 8192*3 ); //cloth buffer
var tr = new Float32Array( 20 ); //soft type buffer
// for terrain
//var hdata = null;
var tmpData = {};
var terrainData = {};
var terrainList = [];
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

    

    if(m == 'init'){

        isBuffer = e.data.isBuffer;
        timestep = e.data.timestep;
        substep = e.data.substep || 1;
        importScripts( e.data.blob );
        self.postMessage({ m:'init' });
        init();

    }

    if(m == 'reset') reset();

    if(m == 'key') key = e.data.o;

    if(m == 'setDriveCar') currentCar = e.data.o.n;
    if(m == 'substep') substep = e.data.o.substep;

    if(m == 'add') add( e.data.o );

    if(m == 'set') tmpset = e.data.o;

    if(m == 'vehicle') vehicle( e.data.o );

    if(m == 'character') character( e.data.o );

    if(m == 'gravity') gravity( e.data.g );

    if(m == 'anchor') anchor( e.data.o );

    if(m == 'apply') apply( e.data.o );

    if(m == 'terrain'){

        var name = e.data.name;
        terrainList.push(name);
        tmpData[name] = e.data.hdata;

        //hdata = e.data.hdata;
        terrainNeedUpdate = true;
        
    }

    if(m == 'step'){

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

            ar = e.data.ar;
            dr = e.data.dr;
            hr = e.data.hr;
            jr = e.data.jr;
            cr = e.data.cr;
            tr = e.data.tr;
            
        }

        // ------- step

        world.stepSimulation( timestep, substep );
        //world.stepSimulation( dt, it, dt );

        drive( currentCar );

        var i = bodys.length, a = ar, n, b, p, r, l, node;
        var j, w, t;

        bodys.forEach( function( b, id ) {
            var n = id * 8;
            a[n] = b.getLinearVelocity().length() * 9.8;//b.isActive() ? 1 : 0;

            if ( a[n] > 0 ) {
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

        });

        /*while(i--){

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

        }*/

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

            center = b.getRigidBody().getCenterOfMassTransform();
            centerPoint = center.getOrigin();

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
            //a[n+8] = b.getNumWheels();
            j = b.getNumWheels(); //2, 4 or 6;
            if(j==4){
                w = 8 * ( 4 + 1 );
                a[n+w+0] = b.getWheelInfo(0).get_m_raycastInfo().get_m_suspensionLength();
                a[n+w+1] = b.getWheelInfo(1).get_m_raycastInfo().get_m_suspensionLength();
                a[n+w+2] = b.getWheelInfo(2).get_m_raycastInfo().get_m_suspensionLength();
                a[n+w+3] = b.getWheelInfo(3).get_m_raycastInfo().get_m_suspensionLength();
            }

            while(j--){
                b.updateWheelTransform( j, true );
                t = b.getWheelTransformWS( j );
                p = t.getOrigin();
                r = t.getRotation();
               
                w = 8 * ( j + 1 );

                if( j == 0 ) a[n+w] = b.getWheelInfo(0).get_m_steering();

                if( j == 1 ) a[n+w] = centerPoint.x();
                if( j == 2 ) a[n+w] = centerPoint.y();
                if( j == 3 ) a[n+w] = centerPoint.z();

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


        // softs update

        l = softs.length;
        a = cr;
        w = 0;

        for( i = 0; i<l; i++ ){

            t = softs[i].softType; // type of soft body

            //if(t==1 || t==2){ // cloth & rope

                b = softs[i].get_m_nodes();
                j = b.size();
                
                while(j--){
                    n = (j*3) + w;
                    node = b.at( j );
                    p = node.get_m_x();
                    a[n] = p.x();
                    a[n+1] = p.y();
                    a[n+2] = p.z();
                }

                w += b.size()*3;

            //}
            /*if(t==2){ // rope
                b = softs[i].get_m_nodes();
                j = b.size();

            }*/
          //  if(t==3){ // ellipsoid
           // }
            
        }

        // ------- post step

        postStep();
        
    }

};


function postStep(){

    if( isBuffer ) self.postMessage({ m:'step', ar:ar, dr:dr, hr:hr, jr:jr, cr:cr },[ ar.buffer, dr.buffer, hr.buffer, jr.buffer, cr.buffer ]);
    else self.postMessage( { m:'step', ar:ar, dr:dr, hr:hr, jr:jr, cr:cr } );

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


//--------------------------------------------------
//
//  WORLD
//
//--------------------------------------------------

function init () {

    if( world !== null ) return;

    solver = new Ammo.btSequentialImpulseConstraintSolver();
    solverSoft = new Ammo.btDefaultSoftBodySolver();

    //collision = new Ammo.btDefaultCollisionConfiguration();
    collision = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();

    dispatcher = new Ammo.btCollisionDispatcher( collision );
    trans = new Ammo.btTransform();

    var type = 3;
    var s = 1000;

    switch( type ){

        //case 1: broadphase = new Ammo.btSimpleBroadphase(); break;
        case 2: broadphase = new Ammo.btAxisSweep3( vec3(-s,-s,-s), vec3(s,s,s), 4096 ); break;//16384;
        case 3: broadphase = new Ammo.btDbvtBroadphase(); break;
        
    }

    //world = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collision );
    world = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collision, solverSoft );
    world.setGravity( vec3(0, -9.8, 0) );
    //broadphase.getOverlappingPairCache().setInternalGhostPairCallback( new Ammo.btGhostPairCallback() );

    worldInfo = world.getWorldInfo();

    /*worldInfo.set_air_density( 1.2 );
    worldInfo.set_water_density( 0 );
    worldInfo.set_water_offset( 0 );
    worldInfo.set_water_normal( vec3() );*/
    worldInfo.set_m_gravity( vec3(0, -9.8, 0) );
    //info.set_m_maxDisplacement();


    //console.log(world.getWorldInfo());

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

    while( softs.length > 0){

        b = softs.pop();
        world.removeSoftBody( b );
        Ammo.destroy( b );

    }

    bodys.length = 0;
    solids.length = 0;
    joints.length = 0;
    cars.length = 0;
    heros.length = 0;
    softs.length = 0;

    // clear body name object
    byName = {};

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

    var name = o.name || '';

    var shape = null;
    var isSoft = false;

    var mass = o.mass || 0;
    var size = o.size || [1,1,1];
    var dir = o.dir || [0,1,0]; // for infinite plane

    var div = o.div || [64,64];
    
    var pos = o.pos || [0,0,0];
    var quat = o.quat || [0,0,0,1];
    //var rot = o.rot || [0,0,0];
    var margin = o.margin || 0.04; // 0.04 is default // 0.005

    if( type == 'terrain' ){

        if(!name) name = 'terrain';

        //var div = o.div || [64,64];

        // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
        var upAxis = 1;

        // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
        var hdt = o.hdt || "PHY_FLOAT";

        // Set this to your needs (inverts the triangles)
        var flipEdge = o.flipEdge || true;

        //var lng = div[0] * div[1];
        var localScaling = vec3( size[0]/div[0], 1, size[2]/div[1] );

        //var localScaling = v3(size);

        // Creates height data buffer in Ammo heap
        //terrainData = Ammo._malloc( 4 * lng );
        //hdata = o.hdata;

        tmpData[name] = o.hdata;

        terrain_data(name);

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
            shape = new Ammo.btHeightfieldTerrainShape( div[0], div[1], terrainData[name], o.heightScale || 1, -size[1], size[1], upAxis, hdt, flipEdge ); 
            shape.setLocalScaling( localScaling );
        break;

        case 'cloth':case 'rope':case 'ellipsoid': 
            isSoft = true;
        break;

    }

    if(shape && shape.setMargin !== undefined ){ shape.setMargin( margin ); }

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

    



    var body;

    if( isSoft ){

        var gendiags = o.gendiags || true;
        var fixed = o.fixed || 0;

        var softBodyHelpers = new Ammo.btSoftBodyHelpers();

        switch( type ){
            case 'cloth':
                var mw = size[0] * 0.5;
                var mh = size[2] * 0.5;
                var p0 = v3([ -mw, 0, -mh]);
                var p1 = v3([ mw, 0, -mh]);
                var p2 = v3([ -mw, 0, mh]);
                var p3 = v3([ mw, 0, mh]);
                
                body = softBodyHelpers.CreatePatch( worldInfo, p0, p1, p2, p3, div[0], div[1], fixed, gendiags  );
                body.softType = 1;
            break;
            case 'rope':
                var p0 = o.start || [ -10, 0, 0]; // start
                var p1 = o.end || [ 10, 0, 0]; // end

                body = softBodyHelpers.CreateRope( worldInfo, v3(p0), v3(p1), o.numSegment || 10, fixed );
                
                body.softType = 2;
            break;
            case 'ellipsoid':
                var p0 = o.center || [ 0, 0, 0]; // start
                var p1 = o.radius || [ 3, 3, 3]; // end
                body = softBodyHelpers.CreateEllipsoid( worldInfo, v3(p0), v3(p1), o.vertices || 128  );
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
        }

        var sb = body.get_m_cfg();
        if( o.viterations !== undefined ) sb.set_viterations( o.viterations );//10
        if( o.piterations !== undefined ) sb.set_piterations( o.piterations );//10
        if( o.citerations !== undefined ) sb.set_citerations( o.citerations );//4
        if( o.diterations !== undefined ) sb.set_diterations( o.diterations );//0
        if( o.kdf !== undefined ) sb.set_kDF(o.kdf);
        if( o.kdp !== undefined ) sb.set_kDP(o.kdp);
        if( o.kpr !== undefined ) sb.set_kPR(o.kpr);
        

        if(o.margin !== undefined ) Ammo.castObject( body, Ammo.btCollisionObject ).getCollisionShape().setMargin( margin );
        //body.setCollisionShape(Ammo.castObject( body, Ammo.btCollisionObject ).getCollisionShape())


        //
        //console.log(body);

        if( o.klst !== undefined ) body.get_m_materials().at(0).set_m_kLST(o.klst);
        if( o.kast !== undefined ) body.get_m_materials().at(0).set_m_kAST(o.kast);
        if( o.kvst !== undefined ) body.get_m_materials().at(0).set_m_kVST(o.kvst);

        if( o.friction !== undefined ) body.setFriction(o.friction);
        if( o.rollingFriction !== undefined ) body.setRollingFriction(o.rollingFriction);
        if( o.anisotropicFriction !== undefined ) body.setAnisotropicFriction(o.anisotropicFriction);
        if( o.restitution !== undefined ) body.setRestitution(o.restitution);

        // generateClusters with k=0 will create a convex cluster for each tetrahedron or triangle otherwise an approximation will be used (better performance)
        // generateClusters (   int     k, int     maxiterations = 8192  )   
        //body.generateClusters(0);

        var fromfaces = o.fromfaces || false;
        body.setTotalMass( mass, fromfaces );

        body.setWorldTransform(startTransform);

        //console.log(body.get_m_cfg().get_viterations());

    } else {

        /*var startTransform = new Ammo.btTransform();
        startTransform.setIdentity();
        startTransform.setOrigin( v3( pos ) );
        startTransform.setRotation( q4( quat ) );*/

        var localInertia = vec3();
        shape.calculateLocalInertia( mass, localInertia );
        var motionState = new Ammo.btDefaultMotionState( startTransform );

        var rb = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, localInertia );
        rb.set_m_friction( o.friction || 0.5 );
        rb.set_m_restitution( o.restitution || 0 );
        body = new Ammo.btRigidBody( rb );

    }

    if ( mass !== 0 ){
        body.setCollisionFlags(o.flag || 0);
        //body.setCollisionFlags(1); 
        if( isSoft ) world.addSoftBody( body, o.group || 1, o.mask || -1 );
        else world.addRigidBody( body, o.group || 1, o.mask || -1 );
        
    } else {
        body.setCollisionFlags(o.flag || 1); 
        //body.setCollisionFlags( FLAGS.STATIC_OBJECT | FLAGS.KINEMATIC_OBJECT ) ;
        world.addCollisionObject( body, o.group || 2, o.mask || -1 );
    }

    //console.log(body.getMotionState())


    

    //body.setContactProcessingThreshold ??

    body.activate();

    //body.name = o.name || '';
    //var name = o.name || '';
    if(name) byName[name] = body;

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

    if ( mass !== 0 ){ // only dynamique
        if( isSoft ) softs.push( body );
        else bodys.push( body ); 
    }
    else solids.push( body ); // only static

};

function anchor( o ){

    getByName(o.soft).appendAnchor( o.pos, getByName(o.body), false, o.influence || 0.5 );

};

function getByName(name){

    return byName[name];

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
    var axe1 = v3( o.axe1 || [1,0,0] );
    var axe2 = v3( o.axe2 || [1,0,0] );

    var min = o.min || 0;
    var max = o.max || 0;

    var spring = o.spring || [0.9, 0.3, 0.1];
    var softness = spring[0];
    var bias =  spring[1];
    var relaxation =  spring[2];
    var useReferenceFrameA = false;

    var joint = null;

    switch(o.type){
        case "joint_p2p": 
            joint = new Ammo.btPoint2PointConstraint( body1, body2, point1, point2);
            joint.get_m_setting().set_m_tau( o.strength || 0.1 );
            joint.get_m_setting().set_m_damping( o.damping || 1 ); 
        break;
        case "joint_hinge": case "joint":
            joint = new Ammo.btHingeConstraint( body1, body2, point1, point2, axe1, axe2, useReferenceFrameA );
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

        incSteering: o.incSteering || 0.04, 
        maxSteering: o.maxSterring || 0.3,//Math.PI/6,
        incEngine: o.acceleration || 5, 
        maxEngine: o.engine || 1000,
        maxBreaking : o.maxBreaking || 100
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
    var mass = o.mass || 600;
    var localInertia = vec3();
    compound.calculateLocalInertia( mass, localInertia );

    //console.log(localInertia.y());
    var motionState = new Ammo.btDefaultMotionState( startTransform );

    var rb = new Ammo.btRigidBodyConstructionInfo( mass, motionState, compound, localInertia);
    rb.set_m_friction( o.friction || 0.5 );
    rb.set_m_restitution( o.restitution || 0 );
    rb.set_m_linearDamping( o.linearDamping || 0 );
    rb.set_m_angularDamping( o.angularDamping || 0 );

    //----------------------------
    // car body

    var body = new Ammo.btRigidBody( rb );

    /*var massTransform = new Ammo.btTransform();
    massTransform.setIdentity();
    massTransform.setOrigin( v3( massCenter ) );
    body.setCenterOfMassTransform( massTransform );

    body.getMotionState().setWorldTransform( startTransform );*/


    body.setAngularVelocity( vec3() );
    body.setLinearVelocity( vec3() );
    body.setActivationState( 4 );

    //----------------------------
    // suspension setting

    var tuning = new Ammo.btVehicleTuning();
    // 10 = Offroad buggy, 50 = Sports car, 200 = F1 Car
    tuning.set_m_suspensionStiffness( o.s_stiffness || 20 );
    // The damping coefficient for when the suspension is compressed. Set
    // to k * 2.0 * btSqrt(m_suspensionStiffness) so k is proportional to critical damping.
    // k = 0.0 undamped & bouncy, k = 1.0 critical damping
    // k = 0.1 to 0.3 are good values , default 0.84
    tuning.set_m_suspensionCompression( o.s_compression || 0.84);//4.4 );
    // The damping coefficient for when the suspension is expanding.
    // m_suspensionDamping should be slightly larger than set_m_suspensionCompression, eg k = 0.2 to 0.5, default : 0.88
    tuning.set_m_suspensionDamping( o.s_relaxation || 0.88);//2.3 );

     // The maximum distance the suspension can be compressed in Cm // default 500
    tuning.set_m_maxSuspensionTravelCm( o.s_travel || 100 );
    // Maximum suspension force
    tuning.set_m_maxSuspensionForce( o.s_force || 10000 );
    // suspension resistance Length
    // The maximum length of the suspension (metres)
    var s_length = o.s_length || 0.2;


    //suspensionForce = stiffness * (restLength – currentLength) + damping * (previousLength – currentLength) / deltaTime
    // http://www.digitalrune.com/Blog/Post/1697/Car-Physics-for-3D-Games

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

        car.setBrake( carInfo.maxBreaking, i );
    
    };

    world.addAction( car );
    world.addRigidBody( body );

    //console.log( car );
    //console.log( body );
    //console.log( tuning );
    //console.log( car.getWheelInfo(0).get_m_wheelsDampingRelaxation() );
    //console.log( car.getWheelInfo(0).get_m_wheelsDampingCompression() );
    //console.log( car.getWheelInfo(0).get_m_suspensionRestLength1() );
    //console.log( car.getWheelInfo(0).get_m_maxSuspensionTravelCm() );
    //console.log( car.getWheelInfo(0).get_m_raycastInfo().get_m_contactPointWS().y() )


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
        else { u.engine = 0; u.breaking = u.maxBreaking; }
    }

    var i = wn;
    while(i--){
        if( i == 0 ) car.setSteeringValue( u.steering, i );
        if(wn !== 2 && i == 1 ) car.setSteeringValue( u.steering, i );
        car.applyEngineForce( u.engine, i );
        car.setBrake( u.breaking, i );
    }

};