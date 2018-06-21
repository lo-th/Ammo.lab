//--------------------------------------------------
//
//  AMMO VEHICLE
//
//--------------------------------------------------

function stepVehicle ( AR, N  ) {

    //if( !cars.length ) return;

    cars.forEach( function ( b, id ) {

        var n = N + (id * 56), j, w, t;

        // speed km/h
        AR[ n + 0 ] = b.getCurrentSpeedKmHour();

        //var centerPoint = b.getRigidBody().getCenterOfMassTransform().getOrigin();

        b.getRigidBody().getMotionState().getWorldTransform( trans );

        trans.toArray( AR, n + 1 );

        // wheels pos / rot
        j = b.getNumWheels(); //2, 4 or 6;
        if( j === 4 ){
            w = 8 * ( 4 + 1 );
            AR[n+w+0] = b.getWheelInfo(0).get_m_raycastInfo().get_m_suspensionLength();
            AR[n+w+1] = b.getWheelInfo(1).get_m_raycastInfo().get_m_suspensionLength();
            AR[n+w+2] = b.getWheelInfo(2).get_m_raycastInfo().get_m_suspensionLength();
            AR[n+w+3] = b.getWheelInfo(3).get_m_raycastInfo().get_m_suspensionLength();
        }

        while(j--){

            b.updateWheelTransform( j, true );
            t = b.getWheelTransformWS( j );

            w = 8 * ( j + 1 );
            t.toArray( AR, n + w + 1 );
           
            if( j === 0 ) AR[ n + w ] = b.getWheelInfo(0).get_m_steering();

        }

    });

};

function clearVehicle () {

    var b;

    while( cars.length > 0){

        b = cars.pop();
        carsInfo.pop();
        //Ammo.destroy( b );
        world.removeRigidBody( b.getRigidBody() );
        Ammo.destroy( b.getRigidBody() );
        world.removeAction(b);
        
    }

    cars = [];

};

function resetVehicle ( o ) {

    var id = o.id || 0;

}

function setVehicle ( o ) {

    var id = o.id || 0;
    if( !cars[id] ) return;

    var car = cars[id];
    var info = carsInfo[id];
    var body = car.getRigidBody();

    info.auto = o.auto || false;

    if(o.reset){

        tmpPos.fromArray( info.startPosition );
        tmpQuat.fromArray( info.startRotation );

        tmpTrans.setIdentity();
        tmpTrans.setOrigin( tmpPos );
        tmpTrans.setRotation( tmpQuat );

        body.setAngularVelocity( tmpZero );
        body.setLinearVelocity( tmpZero );
        body.setWorldTransform( tmpTrans );
        body.activate();

    }

    if(o.engine !== undefined ) info.maxEngine = o.engine;
    if(o.acceleration !== undefined ) info.incEngine = o.acceleration;
    if(o.breaking !== undefined ) info.maxBreaking = o.breaking;

    //console.log(body)

    // body
    if( o.friction !== undefined ) body.setFriction( o.friction );
    if( o.restitution !== undefined ) body.setRestitution( o.restitution );
    if( o.linear !== undefined && o.angular !== undefined ) body.setDamping( o.linear, o.angular );
    // mass
    if(o.mass !== undefined ){
        tmpPos1.setValue( 0,0,0 );
        body.getCollisionShape().calculateLocalInertia( o.mass, tmpPos1 );
        body.setMassProps( o.mass, tmpPos1 );
        body.updateInertiaTensor();
    }

    if( info.auto && o.s_stiffness !== undefined ){

        var sqrt = Math.sqrt( o.s_stiffness );
        o.s_compression = info.compValue * 2 * sqrt;
        o.s_damping = info.dampValue * 2 * sqrt;
        //console.log( o.s_compression, o.s_damping )

    }

    var n = car.getNumWheels(), w;

    while(n--){

        w = car.getWheelInfo(n);
        //console.log(w)

        if( o.s_stiffness !== undefined ) w.set_m_suspensionStiffness( o.s_stiffness );

        if( o.s_compression !== undefined ) w.set_m_wheelsDampingCompression( o.s_compression );
        if( o.s_damping !== undefined ) w.set_m_wheelsDampingRelaxation( o.s_damping );

        if( o.s_travel !== undefined ) w.set_m_maxSuspensionTravelCm( o.s_travel );
        if( o.s_force !== undefined ) w.set_m_maxSuspensionForce( o.s_force );
        if( o.s_length !== undefined ) w.set_m_suspensionRestLength1( o.s_length );//0.2
        // extra ?
        //if( o.s_velocity !== undefined ) w.set_m_suspensionRelativeVelocity( o.s_velocity );      
        //if( o.s_contactDot !== undefined ) w.set_m_clippedInvContactDotSuspension( o.s_contactDot );//1

        if( o.w_roll !== undefined ) w.set_m_rollInfluence( o.w_roll );
        if( o.w_friction !== undefined ) w.set_m_frictionSlip( o.w_friction );
        //if( o.w_force !== undefined ) w.set_m_wheelsSuspensionForce( o.w_force );

        if( o.w_radius !== undefined ) w.set_m_wheelsRadius( o.w_radius );
        if( o.w_position !== undefined ) w.set_m_chassisConnectionPointCS( tmpPos1.fromArray(o.w_position) );

    }


}

function addVehicle ( o ) {

    var type = o.type || 'box';

    var gearRatio = [-1, 0, 2.3, 1.8, 1.3, 0.9, 0.5 ];

    o.mass = o.mass == undefined ? 800 : o.mass;
    o.masscenter = o.masscenter == undefined ? [0,0,0] : o.masscenter;
    o.size = o.size == undefined ? [2,0.5,4] : o.size;
    o.pos = o.pos == undefined ? [0,0,0] : o.pos;
    o.quat = o.quat == undefined ? [0,0,0,1] : o.quat;

    var carInfo = {

        steering:0, 
        engine:0, 
        breaking:0, 

        // auto compess
        auto: true,
        compValue: 0.2, //(lower than damp!)
        dampValue: 0.3,

        incSteering: o.incSteering || 0.04, 
        maxSteering: o.maxSterring || 0.3,//Math.PI/6,
        incEngine: o.acceleration || 10, 
        maxEngine: o.engine || 1000,
        maxBreaking : o.breaking || 100,

        startPosition: o.pos,
        startRotation: o.quat,
        
    };


    //----------------------------
    // car shape 

    var shape;
    if( type == 'mesh' ) shape = addRigidBody( { type:'mesh', v:o.v, mass:1 }, 'isShape');
    else if( type == 'convex' ) shape = addRigidBody( { type:'convex', v:o.v }, 'isShape');
    else shape = addRigidBody( { type:'box', size:o.size }, 'isShape');

    //----------------------------
    // move center of mass

    tmpPos4.fromArray( o.masscenter ).negate();
    tmpTrans1.setIdentity();
    tmpTrans1.setOrigin( tmpPos4 );

    var compound = new Ammo.btCompoundShape();
    compound.addChildShape( tmpTrans1, shape );


    //----------------------------
    // position rotation of car 

    tmpPos.fromArray( o.pos );
    tmpQuat.fromArray( o.quat );

    tmpTrans.setIdentity();
    tmpTrans.setOrigin( tmpPos );
    tmpTrans.setRotation( tmpQuat );

    //----------------------------
    // physics setting

    // mass of vehicle in kg
    tmpPos1.setValue( 0,0,0 );
    compound.calculateLocalInertia( o.mass, tmpPos1 );

    var motionState = new Ammo.btDefaultMotionState( tmpTrans );

    var rbInfo = new Ammo.btRigidBodyConstructionInfo( o.mass, motionState, compound, tmpPos1 );

    if( o.friction !== undefined ) rbInfo.set_m_friction( o.friction );
    if( o.restitution !== undefined ) rbInfo.set_m_restitution( o.restitution );
    //Damping is the proportion of velocity lost per second.
    if( o.linear !== undefined ) rbInfo.set_m_linearDamping( o.linear );
    if( o.angular !== undefined ) rbInfo.set_m_angularDamping( o.angular );
    // revents rounded shapes, such as spheres, cylinders and capsules from rolling forever.
    if( o.rolling !== undefined ) rbInfo.set_m_rollingFriction( o.rolling );

   //console.log(rbInfo.get_m_linearDamping(), rbInfo.get_m_angularDamping())

    //----------------------------
    // car body

    var body = new Ammo.btRigidBody( rbInfo );

    //console.log('body', body)

    tmpPos2.setValue( 0,0,0 );
    tmpPos3.setValue( 0,0,0 );

    body.setAngularVelocity( tmpPos2 );
    body.setLinearVelocity( tmpPos3 );
    body.setActivationState( 4 );

    //----------------------------
    // suspension setting

    var tuning = new Ammo.btVehicleTuning();

    //console.log( tuning )

    // 10 = Offroad buggy, 50 = Sports car, 200 = F1 Car
    tuning.set_m_suspensionStiffness( o.s_stiffness || 20 );
    // The damping coefficient for when the suspension is compressed. Set
    // to k * 2.0 * btSqrt(m_suspensionStiffness) so k is proportional to critical damping.
    // k = 0.0 undamped & bouncy, k = 1.0 critical damping
    // k = 0.1 to 0.3 are good values , default 0.84
    tuning.set_m_suspensionCompression( o.s_compression || 0.84);//4.4 );
    // The damping coefficient for when the suspension is expanding.
    // m_suspensionDamping should be slightly larger than set_m_suspensionCompression, eg k = 0.2 to 0.5, default : 0.88
    // = m_wheelsDampingRelaxation
    tuning.set_m_suspensionDamping( o.s_damping || 0.88);//2.3 );

     // The maximum distance the suspension can be compressed in Cm // default 500
    tuning.set_m_maxSuspensionTravelCm( o.s_travel || 100 );
    // Maximum suspension force
    tuning.set_m_maxSuspensionForce( o.s_force || 10000 );
    // suspension resistance Length
    // The start length of the suspension (metres)
    var s_length = o.s_length || 0.2;

    //suspensionForce = stiffness * (restLength – currentLength) + damping * (previousLength – currentLength) / deltaTime
    // http://www.digitalrune.com/Blog/Post/1697/Car-Physics-for-3D-Games

    //----------------------------
    // wheel setting

    var radius = o.radius || 0.4;
    var wPos = o.wPos || [1, 0, 1.6];

    //wPos[1] += o.masscenter[1];
    wPos[1] -= o.masscenter[1];

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
    var car = new Ammo.btRaycastVehicle( tuning, body, vehicleRayCaster );
    car.setCoordinateSystem( 0, 1, 2 );

    //console.log( 'car', car )

    var numWheels = o.nw || 4, p, fw;

    for( var i = 0; i < numWheels; i++ ){
        
        if( i==2 && wPos[4] ) wPos[0] += wPos[4]; 

        if(i==0){ p = [ wPos[0], wPos[1],  wPos[2] ]; fw = true; }
        if(i==1){ p = [-wPos[0], wPos[1],  wPos[2] ]; fw = true; }
        if(i==2){ p = [-wPos[0], wPos[1], -wPos[2] ]; fw = false; }
        if(i==3){ p = [ wPos[0], wPos[1], -wPos[2] ]; fw = false; }
        if(i==4){ p = [-wPos[0], wPos[1], -wPos[3] ]; fw = false; }
        if(i==5){ p = [ wPos[0], wPos[1], -wPos[3] ]; fw = false; }

        if( numWheels == 2 ){ // moto
            if(i==1){ p = [ -wPos[0], wPos[1],  -wPos[2] ]; fw = false; }
        }

        addWheel( car, p, radius, tuning, s_length, w_roll, fw );

        car.setBrake( carInfo.maxBreaking, i );
    
    };

    world.addAction( car );
    //world.addVehicle( car );
    world.addRigidBody( body );


    body.activate();

    cars.push( car );
    carsInfo.push( carInfo );

    Ammo.destroy( rbInfo );

    o = null;

};

function addWheel ( car, p, radius, tuning, s_length, w_roll, isFrontWheel ) {

    tmpPos1.fromArray( p ); // position
    tmpPos2.setValue( 0,-1,0 ); // wheelDir
    tmpPos3.setValue( -1,0,0 ); // wheelAxe

    var wheel = car.addWheel( tmpPos1, tmpPos2, tmpPos3, s_length, radius, tuning, isFrontWheel );

   // console.log('relax:'+wheel.get_m_wheelsDampingRelaxation(), 'compress:'+wheel.get_m_wheelsDampingCompression())
    wheel.set_m_rollInfluence( w_roll );



    /*
    wheel.set_m_wheelsDampingRelaxation( w_roll );
    wheel.set_m_wheelsDampingCompression( w_roll );
    wheel.set_m_frictionSlip( w_roll );
    wheel.set_m_rollInfluence( w_roll );
    */

    //wheel.set_m_frictionSlip(tuning.get_m_frictionSlip());


    //console.log(wheel.get_m_raycastInfo().get_m_suspensionLength())

};

function drive ( id ) {

    id = id || 0;
    if( !cars[id] ) return;

    var car = cars[id];
    var u = carsInfo[id];
    var wn = car.getNumWheels();

    u.steering -= u.incSteering * key[0];

    //if( key[2] == 1 ) u.steering += u.incSteering;
    //if( key[3] == 1 ) u.steering -= u.incSteering;
    //if( key[2] == 0 && key[3] == 0 ) u.steering *= 0.9;
    if( u.steering < -u.maxSteering ) u.steering = -u.maxSteering;
    if( u.steering > u.maxSteering ) u.steering = u.maxSteering;

    u.steering *= 0.9;

    u.engine -= u.incEngine * key[1];
    //if( key[0] == 1 ) u.engine += u.incEngine;
    //if( key[1] == 1 ) u.engine -= u.incEngine;
    if( u.engine > u.maxEngineForce ) u.engine = u.maxEngine;
    if( u.engine < -u.maxEngineForce ) u.engine = -u.maxEngine;
    
    if( key[1] == 0  ){// && key[1] == 0 ){
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


// google bullet maxSuspensionForce
// https://github.com/jMonkeyEngine/jmonkeyengine/blob/master/jme3-examples/src/main/java/jme3test/bullet/TestFancyCar.java