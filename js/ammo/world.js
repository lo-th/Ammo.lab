
//--------------------------------------------------
//
//  AMMO WORLD
//
//--------------------------------------------------

var world = null;
var worldInfo = null;
var solver, solverSoft, collision, dispatcher, broadphase;

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

function addWorld () {

    if( world !== null ) return;

    solver = new Ammo.btSequentialImpulseConstraintSolver();
    solverSoft = new Ammo.btDefaultSoftBodySolver();

    //collision = new Ammo.btDefaultCollisionConfiguration();
    collision = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();

    dispatcher = new Ammo.btCollisionDispatcher( collision );

    

    var type = 3;
    
    switch( type ){

        //case 1: broadphase = new Ammo.btSimpleBroadphase(); break;
        case 2: 
            var s = 1000;
            tmpPos.setValue(-s,-s,-s);
            tmpPos1.setValue(s,s,s);
            broadphase = new Ammo.btAxisSweep3( tmpPos, tmpPos1, 4096 ); 
        break;//16384;
        case 3: broadphase = new Ammo.btDbvtBroadphase(); break;
        
    }

    //world = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collision );
    world = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collision, solverSoft );

    tmpPos.setValue(0, -9.8, 0);
    world.setGravity( tmpPos );
    

    worldInfo = world.getWorldInfo();

    worldInfo.set_m_gravity( tmpPos );
    //worldInfo.set_air_density( 1.2 );
    //worldInfo.set_water_density( 0 );
    //worldInfo.set_water_offset( 0 );
    //worldInfo.set_water_normal( vec3() );

    //console.log(world);
};

function gravity ( o ) {

    tmpPos.fromArray(o.g);
    world.setGravity( tmpPos );
    worldInfo.set_m_gravity( tmpPos );

};