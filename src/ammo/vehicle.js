/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*    AMMO VEHICLE
*/

function stepVehicle ( N  ) {

    cars.forEach( function ( car, id ) {

        var n = N + (id * 56);
        car.step( n );

    });

};

function clearVehicle () {

    while( cars.length > 0) cars.pop().clear();
    cars = [];

};

function setVehicle ( o ) {

    var id = o.id || 0;
    if( !cars[id] ) return;

    cars[id].set( o );

}

function addVehicle ( o ) {

    var car = new Vehicle( o );
    cars.push( car );

};

function drive ( id ) {

    id = id || 0;
    if( !cars[id] ) return;

    cars[id].drive();

};

//--------------------------------------------------
//
//  VEHICLE CLASS
//
//--------------------------------------------------

function Vehicle ( o ) {

    this.car = null;
    this.body = null;
    this.steering = 0; 
    this.breaking = 0;
    this.engine = 0;
    this.gearRatio = [-1, 0, 2.3, 1.8, 1.3, 0.9, 0.5 ];

    this.data = {

        mass: 100,
        // wheels
        radius: 0.5,
        nWheel: 4,
        wPos:[1, 0, 1.6], // wheels position on chassis
        // drive setting
        engine:1000,
        acceleration:10,
        steering: 0.3,//Math.PI/6,
        breaking : 100,
        incSteering: 0.04, 
        
        // position / rotation / size
        pos: [0,0,0],
        quat: [0,0,0,1],
        //size:[ 1.5, 0.4, 3.6 ],
        // local center of mass (best is on chassis bottom)
        masscenter:[ 0, -0.6, 0 ], 
        // car body physics
        friction: 0.6, 
        restitution: 0.1,
        linear: 0, 
        angular: 0,
        // auto compess
        auto: false,
        compValue: 0.2, //(lower than damp!)
        dampValue: 0.3,
        // suspension
        s_stiffness: 20,
        s_compression: 2.3,
        s_damping: 4.4,//2.4
        s_travel: 5,
        s_force: 6000,
        s_length: 0.2,
        // wheel
        w_friction: 10.5,//1000,
        w_roll: 0.1,

    }

    this.init( o );

}

Vehicle.prototype = {

    step: function ( n ){

        // speed km/h
        Ar[ n ] = this.car.getCurrentSpeedKmHour();

        this.body.getMotionState().getWorldTransform( trans );
        trans.toArray( Ar, n + 1 );

        var j = this.data.nWheel, w, t;

        if( j === 4 ){
            w = 8 * ( 4 + 1 );
            Ar[n+w+0] = this.car.getWheelInfo(0).get_m_raycastInfo().get_m_suspensionLength();
            Ar[n+w+1] = this.car.getWheelInfo(1).get_m_raycastInfo().get_m_suspensionLength();
            Ar[n+w+2] = this.car.getWheelInfo(2).get_m_raycastInfo().get_m_suspensionLength();
            Ar[n+w+3] = this.car.getWheelInfo(3).get_m_raycastInfo().get_m_suspensionLength();
        }

        while(j--){

            this.car.updateWheelTransform( j, true );
            t = this.car.getWheelTransformWS( j );

            w = 8 * ( j + 1 );
            t.toArray( Ar, n + w + 1 );
           
            if( j === 0 ) Ar[ n + w ] = this.car.getWheelInfo(0).get_m_steering();

        }

    },

    drive: function (){

        var data = this.data;

        this.steering -= data.incSteering * key[0];

        if( this.steering < -data.steering ) this.steering = -data.steering;
        if( this.steering > data.steering ) this.steering = data.steering;

        this.steering *= 0.9;

        this.engine -= data.acceleration * key[1];
        if( this.engine > data.engine ) this.engine = data.engine;
        if( this.engine < -data.engine ) this.engine = -data.engine;
        
        if( key[1] == 0  ){// && key[1] == 0 ){
            if( this.engine > 1 ) this.engine *= 0.9;
            else if ( this.engine < -1 ) this.engine *= 0.9;
            else { this.engine = 0; this.breaking = data.breaking; }
        }

        var i = data.nWheel;
        while(i--){
            if( i == 0 ) this.car.setSteeringValue( this.steering, i );
            if( data.nWheel !== 2 && i == 1 ) this.car.setSteeringValue( this.steering, i );
            this.car.applyEngineForce( this.engine, i );
            this.car.setBrake( this.breaking, i );
        }

    },

    clear: function (){

        world.removeRigidBody( this.body );
        world.removeAction( this.car );

        Ammo.destroy( this.body );
        Ammo.destroy( this.car );

        this.body = null;
        this.car = null;

    },

    init: function ( o ){

        var data = this.data;

        var type = o.type || 'box';

        data.mass = o.mass === undefined ? 800 : o.mass;
        o.masscenter = o.masscenter === undefined ? [0,0,0] : o.masscenter;
        o.size = o.size === undefined ? [2,0.5,4] : o.size;
        data.pos = o.pos === undefined ? [0,0,0] : o.pos;
        data.quat = o.quat === undefined ? [0,0,0,1] : o.quat;

        // car shape 
        var shape;
        if( type == 'mesh' ) shape = addRigidBody( { type:'mesh', v:o.v, mass:1 }, 'isShape');
        else if( type == 'convex' ) shape = addRigidBody( { type:'convex', v:o.v }, 'isShape');
        else shape = addRigidBody( { type:'box', size:o.size }, 'isShape');

        if( o.v !== undefined ) delete( o.v );

        // move center of mass
        tmpPos4.fromArray( o.masscenter ).negate();
        tmpTrans1.setIdentity();
        tmpTrans1.setOrigin( tmpPos4 );
        var compound = new Ammo.btCompoundShape();
        compound.addChildShape( tmpTrans1, shape );

        // position rotation of car 
        tmpPos.fromArray( data.pos );
        tmpQuat.fromArray( data.quat );
        tmpTrans.setIdentity();
        tmpTrans.setOrigin( tmpPos );
        tmpTrans.setRotation( tmpQuat );

        // mass of vehicle in kg
        //tmpPos1.setValue( 0,0,0 );
        compound.calculateLocalInertia( data.mass, tmpPos1 );
        var motionState = new Ammo.btDefaultMotionState( tmpTrans );
        var rbInfo = new Ammo.btRigidBodyConstructionInfo( data.mass, motionState, compound, tmpPos1 );

        // car body
        this.body = new Ammo.btRigidBody( rbInfo );
        this.body.setActivationState( 4 );

        Ammo.destroy( rbInfo );

        var tuning = new Ammo.btVehicleTuning();
        var vehicleRay = new Ammo.btDefaultVehicleRaycaster( world );
        this.car = new Ammo.btRaycastVehicle( tuning, this.body, vehicleRay );
        this.car.setCoordinateSystem( 0, 1, 2 );


        // wheels
        var radius = o.radius || 0.4;
        var wPos = o.wPos || [1, 0, 1.6];
        wPos[1] -= o.masscenter[1];

        var n = o.nWheel || 4, p, fw;

        for( var i = 0; i < n; i++ ){
            
            if( i===2 && wPos[4] ) wPos[0] += wPos[4]; 
            if(i===0){ p = [ wPos[0], wPos[1],  wPos[2] ]; fw = true; }
            if(i===1){ p = [-wPos[0], wPos[1],  wPos[2] ]; fw = true; }
            if(i===2){ p = [-wPos[0], wPos[1], -wPos[2] ]; fw = false; }
            if(i===3){ p = [ wPos[0], wPos[1], -wPos[2] ]; fw = false; }
            if(i===4){ p = [-wPos[0], wPos[1], -wPos[3] ]; fw = false; }
            if(i===5){ p = [ wPos[0], wPos[1], -wPos[3] ]; fw = false; }

            if( n === 2 ){ // moto
                if(i==1){ p = [ -wPos[0], wPos[1], -wPos[2] ]; fw = false; }
            }

            tmpPos1.fromArray( p ); // position
            tmpPos2.setValue( 0,-1,0 ); // wheelDir
            tmpPos3.setValue( -1,0,0 ); // wheelAxe
            this.car.addWheel( tmpPos1, tmpPos2, tmpPos3, 1, radius, tuning, fw );
            this.car.setBrake( o.breaking || 100, i );
        
        };

        this.set( o );

        world.addAction( this.car );
        world.addRigidBody( this.body );
        //this.body.activate();

             

    },

    setMass: function ( m ){

        this.data.mass = m;
        //tmpPos1.setValue( 0,0,0 );
        this.body.getCollisionShape().calculateLocalInertia( this.data.mass, tmpPos1 );
        this.body.setMassProps( m, tmpPos1 );
        this.body.updateInertiaTensor();

    },

    setPosition: function (){

        this.steering = 0; 
        this.breaking = 0;
        this.engine = 0;

        tmpPos.fromArray( this.data.pos );
        tmpQuat.fromArray( this.data.quat );

        tmpTrans.setIdentity();
        tmpTrans.setOrigin( tmpPos );
        tmpTrans.setRotation( tmpQuat );

        this.body.setAngularVelocity( tmpZero );
        this.body.setLinearVelocity( tmpZero );
        this.body.setWorldTransform( tmpTrans );
        //this.body.activate();

        //world.getBroadphase().getOverlappingPairCache().cleanProxyFromPairs( this.body.getBroadphaseHandle(), world.getDispatcher() );

        this.car.resetSuspension();
        var n = this.data.nWheel;
        while( n-- ) this.car.updateWheelTransform( n, true );


        //console.log( world, world.getPairCache(), world.getDispatcher() )

    },

    set: function ( o ) {

        var data = this.data;

        // mass
        if( o.mass !== undefined ){
            if( o.mass !== data.mass ) this.setMass( o.mass );
        }

        // copy value
        for( var i in o ){
            if( data[i] ) data[i] = o[i]; 
        }

        // body
        this.body.setFriction( data.friction );
        this.body.setRestitution( data.restitution );
        this.body.setDamping( data.linear, data.angular );

        if( data.auto ){
            var sqrt = Math.sqrt( data.s_stiffness );
            data.s_compression = data.compValue * 2 * sqrt;
            data.s_damping = data.dampValue * 2 * sqrt;
        }

        var n = data.nWheel, w;

        while( n-- ){

            w = this.car.getWheelInfo(n);

            w.set_m_suspensionStiffness( data.s_stiffness );
            w.set_m_wheelsDampingCompression( data.s_compression );
            w.set_m_wheelsDampingRelaxation( data.s_damping );

            w.set_m_maxSuspensionTravelCm( data.s_travel * 100 );
            w.set_m_maxSuspensionForce( data.s_force );
            w.set_m_suspensionRestLength1( data.s_length );

            w.set_m_rollInfluence( data.w_roll );
            w.set_m_frictionSlip( data.w_friction );

            w.set_m_wheelsRadius( data.radius );
            //w.set_m_chassisConnectionPointCS( tmpPos1.fromArray(o.w_position) );

        }

        if( o.reset ) this.setPosition();

    },

    get: function (){



    },

}


// google bullet maxSuspensionForce
// https://github.com/jMonkeyEngine/jmonkeyengine/blob/master/jme3-examples/src/main/java/jme3test/bullet/TestFancyCar.java
// https://github.com/david-sabata/UniversityRacer