
//--------------------------------------------------
//
//  AMMO WORLD
//
//--------------------------------------------------

var world = null;
var worldInfo = null;
var solver, solverSoft, collision, dispatcher, broadphase;
var isSoft = true;

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

    setGravity( o );
    
};

function setGravity ( o ) {

    gravity.fromArray( o.g || [0,-9.8, 0] );
    if( isSoft ){
        worldInfo = world.getWorldInfo();
        worldInfo.set_air_density(1.2);
        worldInfo.set_water_density(0);
        worldInfo.set_water_offset(0);
        worldInfo.set_water_normal(new Ammo.btVector3(0, 0, 0));
        worldInfo.set_m_gravity( gravity );
    } else {
        world.setGravity( gravity );
    }

};