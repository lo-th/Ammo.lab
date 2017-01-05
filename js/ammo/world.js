
//--------------------------------------------------
//
//  AMMO WORLD
//
//--------------------------------------------------

var world = null;
var worldInfo = null;
var solver, solverSoft, collision, dispatcher, broadphase, ghostPairCallback;
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

    //console.log(world.getSolverInfo())
    

    /*
    ghostPairCallback = new Ammo.btGhostPairCallback();
    world.getPairCache().setInternalGhostPairCallback( ghostPairCallback );
    */
    var dInfo = world.getDispatchInfo();


    dInfo.set_m_allowedCcdPenetration(0.001);// default 0.0399
    // dInfo.set_m_enableSPU(false);// true
    //dInfo.get_m_enableSatConvex( false );

    //console.log(dInfo)
    

    setGravity( o );
    
};

function setGravity ( o ) {

    o = o || {};

    gravity.fromArray( o.g || [0,-10, 0] );
    world.setGravity( gravity );



    if( isSoft ){
        worldInfo = world.getWorldInfo();

        //console.log(worldInfo)
        worldInfo.set_air_density( o.air || 1.2 );//1.275
        worldInfo.set_m_gravity( gravity );
        setWater( o );
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