/*global Ammo*/
import { math } from './math.js';
import { root, map } from './root.js';

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    GUN - VEHICLE
*/

function Vehicle() {

	this.ID = 0;
	this.cars = [];
	this.trans = new Ammo.btTransform();

}

Object.assign( Vehicle.prototype, {



	step: function ( AR, N ) {

		var i = root.flow.vehicle.length;
	    while( i-- ) this.setData( root.flow.vehicle[i] );
	    root.flow.vehicle = [];

		var n, trans = this.trans;

		this.cars.forEach( function ( car, id ) {

			n = N + ( id * 64 );
			//n = N + ( id * ( car.data.nWheel + 2 ) )
			car.step( AR, n, trans );

		});

	},

	control: function ( name ) {

		if ( ! map.has( name ) ) return;
		var car = map.get( name + '_constuctor' );

		car.drive( root.key );

	},

	/*setData: function ( o ) {

		if ( ! map.has( o.name ) ) return;
		var car = map.get( o.name + '_constuctor' );
		car.setData( o );

	},*/

	clear: function () {

		while ( this.cars.length > 0 ) this.destroy( this.cars.pop() );
		this.ID = 0;

	},

	destroy: function ( car ) {

		root.world.removeRigidBody( car.body );
		root.world.removeAction( car.chassis );
		Ammo.destroy( car.body );
		Ammo.destroy( car.chassis );

		//car.clear();
		//map.delete( car.name );
		//map.delete( car.name + '_body' );

		map.delete( car.name + '_constuctor' );
		map.delete( car.name  );
		map.delete( car.name + '_chassis' );

	},

	remove: function ( name ) {

		if ( ! map.has( name ) ) return;
		var car = map.get( name );

		var n = this.cars.indexOf( car );
		if ( n !== - 1 ) {

			this.cars.splice( n, 1 );
			this.destroy( car );

		}

	},

	//addExtra: function () { },

	setData: function ( o ){

		if ( ! map.has( o.name + '_constuctor' ) ) return;
		var car = map.get( o.name + '_constuctor' );
		car.setData( o );

	},

	add: function ( o ) {

		var name = o.name !== undefined ? o.name : 'car' + this.ID ++;

		// delete old if same name
		this.remove( name );

		o.size = o.size === undefined ? [ 2, 0.5, 4 ] : o.size;

		if( o.pos !== undefined ) o.pos = math.vectomult( o.pos, root.invScale );
		if( o.size !== undefined ) o.size = math.vectomult( o.size, root.invScale );
		if( o.masscenter !== undefined ) o.masscenter = math.vectomult( o.masscenter, root.invScale );

		// car shape
		var shapeType = o.shapeType || 'box';
		var shapeInfo = {};

		if ( shapeType == 'mesh' ) shapeInfo = { type: 'mesh', v: o.v, mass: 1 };
		else if ( shapeType == 'convex' ) shapeInfo = { type: 'convex', v: o.v };
		else shapeInfo = { type: 'box', size: o.size };

		var shape = root.makeShape( shapeInfo );

		if ( o.v !== undefined ) delete ( o.v );

		//var vehicleRay = new Ammo.btDefaultVehicleRaycaster( root.world );
		var car = new Car( name, o, shape );

		root.world.addAction( car.chassis );
		root.world.addRigidBody( car.body );

		this.cars.push( car );

		//map.set( name, car );
		//map.set( name + '_body', car.body );

		map.set( name + '_constuctor', car  );
		map.set( name , car.body );
		map.set( name + '_chassis', car.chassis );

	},

	// TODO
	applyOption: function ( car, o ) {



	},

} );


export { Vehicle };


function Car( name, o, shape ) {

	// http://www.asawicki.info/Mirror/Car%20Physics%20for%20Games/Car%20Physics%20for%20Games.html
	
	// https://github.com/yanzuzu/BulletPhysic_Vehicle

	//https://docs.google.com/document/d/18edpOwtGgCwNyvakS78jxMajCuezotCU_0iezcwiFQc/edit

	this.name = name;

	this.chassis = null;
	this.body = null;
	this.steering = 0;
	this.breaking = 0;
	this.motor = 0;

	this.gearRatio = [ - 1, 0, 2.3, 1.8, 1.3, 0.9, 0.5 ];
	// acceleration / topSpeed

	this.limitAngular = [1,1,1];

	this.transforms = [];

	this.wheelBody = [];
	this.wheelJoint = [];
	this.wheelRadius = [];

	this.isRay = true;

	this.data = {

		mass: 100,
		wMass: 1,
		// wheels
		//radius: 0.5,
		wWidth: 0.25,
		nWheel: o.nWheel || 4,
		wPos: [ 1, 0, 1.6 ], // wheels position on chassis
		// drive setting
		engine: 1000,
		acceleration: 10,
		maxSteering: 24*math.torad, //Math.PI/6,
		breaking: 100,
		incSteering: 0.04,

		// position / rotation / size
		pos: [ 0, 0, 0 ],
		quat: [ 0, 0, 0, 1 ],
		//size:[ 1.5, 0.4, 3.6 ],
		// local center of mass (best is on chassis bottom)
		masscenter: [ 0, - 0.6, 0 ],
		// car body physics
		friction: 0.6,
		restitution: 0.1,
		linear: 0,
		angular: 0,
		rolling: 0,
		// auto compess
		autoSuspension: false,
		compValue: 0.2, //(lower than damp!)
		dampValue: 0.3,
		// suspension
		s_stiffness: 20,
		s_compression: 2.3,
		s_damping: 4.4, //2.4
		s_travel: 5,
		s_force: 6000,
		s_length: 0.2,
		// wheel
		w_friction: 10.5, //1000,
		w_roll: 0.001,

	};

	this.init( o, shape );

}

Object.assign( Car.prototype, {

	step: function ( Ar, n, trans ) {

		var scale = root.scale;

		// speed km/h
		Ar[ n ] = this.chassis.getCurrentSpeedKmHour();

		this.body.getMotionState().getWorldTransform( trans );
		trans.toArray( Ar, n + 1, scale );

		//this.body.getWorldTransform().toArray( Ar, n + 1, scale );

		var j = this.data.nWheel, w, t;

		while ( j -- ) {

			this.chassis.updateWheelTransform( j, true );

			t = this.chassis.getWheelTransformWS( j );

			// supension info
			Ar[ n + 56 + j ] = this.chassis.getWheelInfo( j ).get_m_raycastInfo().get_m_suspensionLength() * scale;

			w = 8 * ( j + 1 );
			t.toArray( Ar, n + w + 1, scale );

			//this.transforms[j].toArray( Ar, n + w + 1, scale );

			if ( j === 0 ) Ar[ n + w ] = this.chassis.getWheelInfo( 0 ).get_m_steering();
			if ( j === 1 ) Ar[ n + w ] = this.chassis.getWheelInfo( 1 ).get_m_steering();
			if ( j === 2 ) Ar[ n + w ] = this.steering;//this.chassis.getWheelInfo( 0 ).get_m_steering();

		}

		Ar[ n + 62 ] = this.chassis.getWheelInfo( 0 ).m_rotation;
		Ar[ n + 63 ] = this.chassis.getWheelInfo( 1 ).m_rotation;

	},

	drive: function ( key ) {

		var data = this.data;

		

		// steering

        if ( key[ 0 ] === 0 ) this.steering *= 0.9;
        else this.steering -= data.incSteering * key[ 0 ];
        //this.steering -= data.incSteering * key[ 0 ];
        this.steering = math.clamp( this.steering, - data.maxSteering, data.maxSteering );

        // engine
        if ( key[ 1 ] === 0 ){ 
        	this.motor = 0; 
        	this.breaking = data.breaking;
        } else {
			this.motor -= data.acceleration * key[ 1 ];
			this.breaking = 0;
		}

		this.motor = math.clamp( this.motor, - data.engine, data.engine );
		//if ( this.motor > data.engine ) this.motor = data.engine;
		//if ( this.motor < - data.engine ) this.motor = - data.engine;

		/*if ( key[ 1 ] === 0 ) { // && key[1] == 0 ){

			if ( this.motor > 1 || this.motor < - 1 ) this.motor *= 0.9;
			else {

				this.motor = 0; this.breaking = data.breaking;

			}

		}*/

		// Ackermann steering principle
		if ( data.nWheel > 3 ){

			var lng = (this.wpos[2]*2);
			var w = this.wpos[0];
			var turn_point = lng / Math.tan( this.steering );

			var angle_l = Math.atan2( lng, w + turn_point);
			var angle_r = Math.atan2( lng, -w + turn_point);
			if(turn_point<0){
				angle_l-=Math.PI;
				angle_r-=Math.PI;
			}

		}

		var i = data.nWheel;
		while ( i -- ) {

			if ( data.nWheel < 4 ){

				if ( i === 0 ) this.chassis.setSteeringValue( this.steering, i );

			} else {

				if ( i === 0 ) this.chassis.setSteeringValue( angle_r, i );
			    if ( i === 1 ) this.chassis.setSteeringValue( angle_l, i );

			}

			this.chassis.applyEngineForce( this.motor, i );
			this.chassis.setBrake( this.breaking, i );

		}

		if(this.motor<1){
			var v = this.body.getAngularVelocity();
			v.multiplyArray( this.limitAngular );
			this.body.setAngularVelocity(v);
		}

	},

	clear: function () {

		/*this.world.removeRigidBody( this.body );
        this.world.removeAction( this.chassis );

        Ammo.destroy( this.body );
        Ammo.destroy( this.chassis );*/

		this.body = null;
		this.chassis = null;

	},

	init: function ( o, shape ) {

		var data = this.data;

		var trans = math.transform();
		var p0 = math.vector3();
		var p1 = math.vector3();
		var p2 = math.vector3();
		var p3 = math.vector3();

		this.isRay = o.isRay === undefined ? true : o.isRay;

		data.mass = o.mass === undefined ? 800 : o.mass;
		o.masscenter = o.masscenter === undefined ? [ 0, 0, 0 ] : o.masscenter;

		data.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
		data.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;

		data.nWheel = o.nWheel || 4;

		// car shape

		//console.log(o.masscenter)

		// move center of mass
		p0.fromArray( o.masscenter ).negate();
		trans.setIdentity();
		trans.setOrigin( p0 );
		var compound = new Ammo.btCompoundShape();
		compound.addChildShape( trans, shape );

		// position rotation of car
		trans.identity().fromArray( data.pos.concat( data.quat ) );

		// mass of vehicle in kg
		p0.setValue( 0, 0, 0 );
		compound.calculateLocalInertia( data.mass, p0 );
		var motionState = new Ammo.btDefaultMotionState( trans );
		var rbInfo = new Ammo.btRigidBodyConstructionInfo( data.mass, motionState, compound, p0 );

		// car body
		this.body = new Ammo.btRigidBody( rbInfo );
		this.body.name = this.name;// + '_body';
		this.body.isRigidBody = true;
		this.body.isBody = true;

		this.body.setActivationState( 4 );

		Ammo.destroy( rbInfo );

		if( this.isRay ) {

			var tuning = new Ammo.btVehicleTuning();
			var vehicleRay = new Ammo.btDefaultVehicleRaycaster( root.world );
			this.chassis = new Ammo.btRaycastVehicle( tuning, this.body, vehicleRay );
			this.chassis.setCoordinateSystem( 0, 1, 2 );

		}

		// wheels

		var radius = o.radius || 0.4;
		var radiusBack = o.radiusBack || radius;
		var wPos = o.wPos || [ 1, 0, 1.6 ];

		wPos = math.vectomult( wPos, root.invScale );
		radius = radius * root.invScale;
		radiusBack = radiusBack * root.invScale;



		wPos[ 1 ] -= o.masscenter[ 1 ];

		var n = data.nWheel, p, fw;
		var by = o.decalYBack || 0;

		for ( var i = 0; i < n; i ++ ) {



			//if ( i === 2 && wPos[ 4 ] ) wPos[ 0 ] += wPos[ 4 ];
			if ( i === 0 ) {

				p = [ wPos[ 0 ], wPos[ 1 ], wPos[ 2 ] ]; fw = true;

			}
			if ( i === 1 ) {

				p = [ - wPos[ 0 ], wPos[ 1 ], wPos[ 2 ] ]; fw = true;

			}
			if ( i === 2 ) {

				p = [ - wPos[ 0 ], wPos[ 1 ] + by, - wPos[ 2 ] ]; fw = false;

			}
			if ( i === 3 ) {

				p = [ wPos[ 0 ], wPos[ 1 ] + by, - wPos[ 2 ] ]; fw = false;

			}
			if ( i === 4 ) {

				p = [ - wPos[ 0 ], wPos[ 1 ] + by, - wPos[ 3 ] ]; fw = false;

			}
			if ( i === 5 ) {

				p = [ wPos[ 0 ], wPos[ 1 ] + by, - wPos[ 3 ] ]; fw = false;

			}

			if ( n === 2 ) { // moto

				if ( i === 0 ) {

					p = [ 0, wPos[ 1 ], wPos[ 2 ] ]; fw = true;

				}

				if ( i === 1 ) {

					p = [ 0, wPos[ 1 ] + by, - wPos[ 2 ] ]; fw = false;

				}

			}

			if ( n === 3 ) { // moto

				if ( i === 0 ) {

					p = [ 0, wPos[ 1 ], wPos[ 2 ] ]; fw = true;

				}

				if ( i === 1 ) {

					p = [ wPos[ 0 ], wPos[ 1 ] + by, - wPos[ 2 ] ]; fw = false;

				}

				if ( i === 2 ) {

					p = [ -wPos[ 0 ], wPos[ 1 ] + by, - wPos[ 2 ] ]; fw = false;

				}

			}

			//console.log(p)

			p1.fromArray( p ); // position
			p2.setValue( 0, - 1, 0 ); // wheelDir
			p3.setValue( - 1, 0, 0 ); // wheelAxe

			/*var m = i*3;
			if(o.wheelDir){
				p2.setValue( o.wheelDir[m], o.wheelDir[m+1], o.wheelDir[m+2] );
			}
			if(o.wheelAxe){
				p3.setValue( o.wheelAxe[m], o.wheelAxe[m+1], o.wheelAxe[m+2] );
			}*/

			//if( this.isRay ){

				//console.log(fw ? radius : radiusBack)
				
				this.chassis.addWheel( p1, p2, p3, 1, fw ? radius : radiusBack, tuning, fw );
			    this.chassis.setBrake( o.breaking || 100, i );

			    this.wheelRadius.push(fw ? radius : radiusBack);

			    this.transforms.push( this.chassis.getWheelTransformWS( i ) )

			/*} else {

				trans.identity();
				trans.setOrigin( p1 );

				p2.setValue( data.wWidth * root.invScale, radius, radius );
				shape = new Ammo.btCylinderShape( p2 );

				p0.setValue( 0, 0, 0 );
				shape.calculateLocalInertia( data.wMass, p0 );

				var motionState = new Ammo.btDefaultMotionState( trans );
				var rbInfo = new Ammo.btRigidBodyConstructionInfo( data.wMass, motionState, shape, p0 );

				var wheel = new Ammo.btRigidBody( rbInfo );

				wheel.setFriction( 1110 );
				wheel.setActivationState( 4 );
				root.world.addRigidBody( wheel, 1, - 1 );

				this.wheelBody[i] = wheel;

				var joint = new Ammo.btHingeConstraint( this.body, wheel, p1, p0, p2, p3, false );
				root.world.addConstraint( joint, false );

				// Drive engine.
				/*
				joint.enableMotor(3, true);
				joint.setMaxMotorForce(3, 1000);
				joint.setTargetVelocity(3, 0);

				// Steering engine.
				joint.enableMotor(5, true);
				joint.setMaxMotorForce(5, 1000);
				joint.setTargetVelocity(5, 0);

				joint.setParam( BT_CONSTRAINT_CFM, 0.15f, 2 );
				joint.setParam( BT_CONSTRAINT_ERP, 0.35f, 2 );

				joint.setDamping( 2, 2.0 );
				joint.setStiffness( 2, 40.0 );
				*/

			//	this.wheelJoint[i] = joint;


			//}
			

		}

		this.wpos = wPos;






		this.setData( o );

		//this.world.addAction( this.chassis );
		//this.world.addRigidBody( this.body );
		//this.body.activate();
		trans.free();
		p0.free();
		p1.free();
		p2.free();
		p3.free();

	},

	setMass: function ( m ) {

		var p0 = math.vector3();
		this.data.mass = m;
		p0.setValue( 0, 0, 0 );
		this.body.getCollisionShape().calculateLocalInertia( this.data.mass, p0 );
		this.body.setMassProps( m, p0 );
		this.body.updateInertiaTensor();
		p0.free();

	},

	setPosition: function () {

		this.steering = 0;
		this.breaking = 0;
		this.motor = 0;

		var trans = math.transform();
		trans.identity().fromArray( this.data.pos.concat( this.data.quat ) );
		var p0 = math.vector3().set( 0, 0, 0 );

		this.body.setAngularVelocity( p0 );
		this.body.setLinearVelocity( p0 );
		this.body.setWorldTransform( trans );
		//this.body.activate();

		//world.getBroadphase().getOverlappingPairCache().cleanProxyFromPairs( this.body.getBroadphaseHandle(), world.getDispatcher() );

		this.chassis.resetSuspension();
		var n = this.data.nWheel;
		while ( n -- ) this.chassis.updateWheelTransform( n, true );

		trans.free();
		p0.free();

		//console.log( world, world.getPairCache(), world.getDispatcher() )

	},

	setData: function ( o ) {

		var data = this.data;

		// mass
		if ( o.mass !== undefined ) {

			if ( o.mass !== data.mass ) this.setMass( o.mass );

		}

		// copy value
		for ( var i in o ) {

			if ( data[ i ] !== undefined ) data[ i ] = o[ i ];

		}

		// force value for bool
		//data.autoSuspension = o.autoSuspension || false;

		// body
		this.body.setFriction( data.friction );
		this.body.setRestitution( data.restitution );
		this.body.setDamping( data.linear, data.angular );// def 0,0
		this.body.setRollingFriction( data.rolling );

		if ( o.limitAngular !== undefined ) this.limitAngular = o.limitAngular;

		//console.log(this.body.getAngularVelocity().toArray())

		var p1 = math.vector3();
		if ( o.linearFactor !== undefined ) this.body.setLinearFactor( p1.fromArray( o.linearFactor ) );
		if ( o.angularFactor !== undefined ) this.body.setAngularFactor( p1.fromArray( o.angularFactor ) );
		p1.free();

		//console.log( o.autoSuspension )


		if ( data.autoSuspension ) {

			var sqrt = Math.sqrt( data.s_stiffness );
			data.s_compression = data.compValue * 2 * sqrt;
			data.s_damping = data.dampValue * 2 * sqrt;
            
            //console.log( data.s_damping, data.s_compression )
		}

		var n = data.nWheel, w;

		while ( n -- ) {

			w = this.chassis.getWheelInfo( n );

			w.set_m_suspensionStiffness( data.s_stiffness );
			w.set_m_wheelsDampingCompression( data.s_compression );
			w.set_m_wheelsDampingRelaxation( data.s_damping );

			w.set_m_maxSuspensionTravelCm( data.s_travel * 100 * root.invScale );
			//console.log( 'travel', w.get_m_maxSuspensionTravelCm() );
			
			w.set_m_suspensionRestLength1( data.s_length * root.invScale );
			w.set_m_maxSuspensionForce( data.s_force );

			w.set_m_rollInfluence( data.w_roll );
			w.set_m_frictionSlip( data.w_friction );

			w.set_m_wheelsRadius( this.wheelRadius[ n ] );
			//w.set_m_chassisConnectionPointCS( tmpPos1.fromArray(o.w_position) );

		}

		if ( o.reset ) this.setPosition();

	},

	get: function () {

		self.postMessage( { m: 'carData', o: this.data } );

	},

} );

export { Car };