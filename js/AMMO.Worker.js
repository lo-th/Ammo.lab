
'use strict';
var Module = { TOTAL_MEMORY: 256*1024*1024 };

var world = null;
var solver, collision, dispatcher, broadphase, trans;
var bodys, joints, cars;

var dt = 0.01667;
var it = 10;

var ar, dr;
var terrainData = null;
var first = true;

self.onmessage = function ( e ) {

    var m = e.data.m;

    

    if(m == 'init'){

        importScripts( e.data.blob );
        init();

    }

    if(m == 'reset'){

        reset();

    }

    if(m == 'add'){

        add( e.data.o );

    }

    if(m == 'step'){

        ar = e.data.ar;
        dr = e.data.dr;

        step();

        self.postMessage({ m:m, ar:ar, dr:dr },[ ar.buffer, dr.buffer ]);
        

    }

    

};

var vec3 = function(x, y, z){
    return new Ammo.btVector3(x || 0, y || 0, z || 0);
}

var v3 = function( a ){
    return new Ammo.btVector3( a[0], a[1], a[2] );
}

var copyV3 = function (a,b) { b.setX(a[0]); b.setY(a[1]); b.setZ(a[2]); }

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
    world.setGravity( vec3(0, -10, 0) );

    bodys = [];
    joints = [];
    cars = [];

    /*add({type:'plane'});

    var i = 300;
    while(i--){
        add({ type:'box', pos:[0,1+(i*2),0], mass:0.2 });
    }

    var i = 300;
    while(i--){
        add({ type:'sphere', pos:[3,1+(i*2),0], mass:0.2 });
    }*/


    self.postMessage({ m:'init' });
    

};

function reset () {

    var b;
    while( bodys.length > 0 ){

        b = bodys.pop();
        world.removeRigidBody( b );
        Ammo.destroy( b );

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


function step () {

    world.stepSimulation( dt, it );

    var i = bodys.length, a = ar, n, b, p, r;

    while(i--){

        n = i * 8;
        b = bodys[i];
        
        a[n] = b.isActive() ? 1 : 0;
        //if(i==4 && first){ first = false;  console.log( b ) }

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

}

function add ( o ) {

    var type = o.type || 'box';

    var shape = null;

    var mass = o.mass || 0;
    var size = o.size || [1,1,1];
    var dir = o.dir || [0,1,0]; // for infinite plane
    
    var pos = o.pos || [0,0,0];
    var rot = o.rot || [0,0,0];
    var margin = o.margin || 0.05;

    if(type=='terrain'){
        var div = o.div || [64,64];

        // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
        var upAxis = 1;

        // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
        var hdt = o.hdt || "PHY_FLOAT";

        // Set this to your needs (inverts the triangles)
        var flipEdge = o.flipEdge || false;

        var lng = div[0] * div[1];
        var localScaling = vec3( size[0]/div[0] ,1, size[2]/div[1] );

        // Creates height data buffer in Ammo heap
        terrainData = Ammo._malloc( 4 * lng );

        // Copy the javascript height data array to the Ammo one.
        var dt = o.hdata;

        var i = lng, n;
        while(i--){
            n = i * 4;
            Ammo.HEAPF32[terrainData + n >> 2] = dt[i];
        }

    }

        

    

    switch( type ){
        case 'plane': shape = new Ammo.btStaticPlaneShape( v3(dir), 0 );break;
        case 'box': shape = new Ammo.btBoxShape( vec3( size[0]*0.5, size[1]*0.5, size[2]*0.5 ) ); break;
        case 'sphere': shape = new Ammo.btSphereShape(size[0]); break;  
        case 'cylinder': shape = new Ammo.btCylinderShape(vec3(size[0], size[1]*0.5, size[2]*0.5)); break;
        case 'cone': shape = new Ammo.btConeShape(size[0], size[1]*0.5); break;
        case 'capsule': shape = new Ammo.btCapsuleShape(size[0], size[1]*0.5); break;
        
        case 'compound': shape = new Ammo.btCompoundShape(); break;

        case 'mesh':
            var mTriMesh = new Ammo.btTriangleMesh();
            var removeDuplicateVertices = true;
            var v0 = vec3();
            var v1 = vec3(); 
            var v2 = vec3();
            var vx = obj.v;
            for (var i = 0, fMax = vx.length; i < fMax; i+=9){
                v0.setValue( vx[i+0], vx[i+1], vx[i+2] );
                v1.setValue( vx[i+3], vx[i+4], vx[i+5] );
                v2.setValue( vx[i+6], vx[i+7], vx[i+8] );
                mTriMesh.addTriangle(v0,v1,v2, removeDuplicateVertices);
            }
            if(mass == 0){ 
                // btScaledBvhTriangleMeshShape -- if scaled instances
                shape = new Ammo.btBvhTriangleMeshShape(mTriMesh, true, true);
            }else{ 
                // btGimpactTriangleMeshShape -- complex?
                // btConvexHullShape -- possibly better?
                shape = new Ammo.btConvexTriangleMeshShape(mTriMesh,true);
            }
        break;

        case 'convex':
            shape = new Ammo.btConvexHullShape();
            var v = vec3(0,0,0);
            var vx = obj.v;
            for (var i = 0, fMax = vx.length; i < fMax; i+=3){
                copyV3([vx[i+0], vx[i+1], vx[i+2]], v);
                shape.addPoint(v);
            }
        break;

        case 'terrain': 
            shape = new Ammo.btHeightfieldTerrainShape( div[0], div[1], terrainData, o.heightScale || 1, o.minHeight || 0, o.maxHeight || 100, upAxis, hdt, flipEdge ); 
            shape.setLocalScaling( localScaling );
        break;

    }

    if(shape.setMargin){ shape.setMargin( margin ); }

    var startTransform = new Ammo.btTransform();
    startTransform.setIdentity();

    startTransform.setOrigin( v3(pos) );

    var localInertia = vec3();
    shape.calculateLocalInertia( mass, localInertia );
    var motionState = new Ammo.btDefaultMotionState(startTransform);

    var rb = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, localInertia );
    rb.set_m_friction( o.friction || 0.5 );
    rb.set_m_restitution( o.restitution || 0 );

    var body = new Ammo.btRigidBody( rb );
    world.addRigidBody( body );
    body.activate();

    body.isKinematic = o.kinematic || false;

    /*AMMO.ACTIVE = 1;
    AMMO.ISLAND_SLEEPING = 2;
    AMMO.WANTS_DEACTIVATION = 3;
    AMMO.DISABLE_DEACTIVATION = 4;
    AMMO.DISABLE_SIMULATION = 5;*/
    body.setActivationState(1);
    //body.setCollisionFlags();

    //if ( mass !== 0 ) bodys.unshift( body );
    if ( mass !== 0 ) bodys.push( body );

}