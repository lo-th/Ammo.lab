/*global Ammo*/
import { math } from './math.js';
import { root, map } from './root.js';

/**
* @author lth / https://github.com/lo-th/
*/

//--------------------------------------------------
//  AMMO VEHICLE
//--------------------------------------------------

function Vehicle() {

	this.ID = 0;
	this.cars = [];
	this.trans = new Ammo.btTransform();

}

Object.assign( Vehicle.prototype, {

	step: function ( AR, N ) {

		var n, trans = this.trans;

		this.cars.forEach( function ( car, id ) {

			n = N + ( id * 56 );
			car.step( AR, n, trans );

		} );

	},

	control: function ( name ) {

		if ( ! map.has( name ) ) return;
		var car = map.get( name );
		car.drive( root.key );

	},

	setData: function ( o ) {

		if ( ! map.has( o.name ) ) return;
		var car = map.get( o.name );
		car.setData( o );

	},

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
		map.delete( car.name );
		map.delete( car.name + '_body' );
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

	addExtra: function () {

	},

	add: function ( o ) {

		var name = o.name !== undefined ? o.name : 'car' + this.ID ++;

		// delete old if same name
		this.remove( name );

		o.size = o.size === undefined ? [ 2, 0.5, 4 ] : o.size;

		// car shape
		var shapeType = o.shapeType || 'box';
		var sho = {};

		if ( shapeType == 'mesh' ) sho = { type: 'mesh', v: o.v, mass: 1 };
		else if ( shapeType == 'convex' ) sho = { type: 'convex', v: o.v };
		else sho = { type: 'box', size: o.size };

		var shape = this.addExtra( sho, 'isShape' );

		if ( o.v !== undefined ) delete ( o.v );

		var vehicleRay = new Ammo.btDefaultVehicleRaycaster( root.world );
		var car = new Car( name, o, shape, vehicleRay );

		root.world.addAction( car.chassis );
		root.world.addRigidBody( car.body );

		this.cars.push( car );

		map.set( name, car );
		map.set( name + '_body', car.body );
		map.set( name + '_chassis', car.chassis );

	}

} );


export { Vehicle };


function Car( name, o, shape, vehicleRay ) {

	this.name = name;

	this.chassis = null;
	this.body = null;
	this.steering = 0;
	this.breaking = 0;
	this.motor = 0;
	this.gearRatio = [ - 1, 0, 2.3, 1.8, 1.3, 0.9, 0.5 ];

	this.data = {

		mass: 100,
		// wheels
		radius: 0.5,
		nWheel: 4,
		wPos: [ 1, 0, 1.6 ], // wheels position on chassis
		// drive setting
		engine: 1000,
		acceleration: 10,
		steering: 0.3, //Math.PI/6,
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
		// auto compess
		auto: false,
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
		w_roll: 0.1,

	};

	this.init( o, shape, vehicleRay );

}

Object.assign( Car.prototype, {

	step: function ( Ar, n, trans ) {

		// speed km/h
		Ar[ n ] = this.chassis.getCurrentSpeedKmHour();

		this.body.getMotionState().getWorldTransform( trans );
		trans.toArray( Ar, n + 1 );

		var j = this.data.nWheel, w, t;

		if ( j === 4 ) {

			w = 8 * ( 4 + 1 );
			Ar[ n + w + 0 ] = this.chassis.getWheelInfo( 0 ).get_m_raycastInfo().get_m_suspensionLength();
			Ar[ n + w + 1 ] = this.chassis.getWheelInfo( 1 ).get_m_raycastInfo().get_m_suspensionLength();
			Ar[ n + w + 2 ] = this.chassis.getWheelInfo( 2 ).get_m_raycastInfo().get_m_suspensionLength();
			Ar[ n + w + 3 ] = this.chassis.getWheelInfo( 3 ).get_m_raycastInfo().get_m_suspensionLength();

		}

		while ( j -- ) {

			this.chassis.updateWheelTransform( j, true );
			t = this.chassis.getWheelTransformWS( j );

			w = 8 * ( j + 1 );
			t.toArray( Ar, n + w + 1 );

			if ( j === 0 ) Ar[ n + w ] = this.chassis.getWheelInfo( 0 ).get_m_steering();

		}

	},

	drive: function ( key ) {

		var data = this.data;

		//var key = engine.getKey();

		this.steering -= data.incSteering * key[ 0 ];

		if ( this.steering < - data.steering ) this.steering = - data.steering;
		if ( this.steering > data.steering ) this.steering = data.steering;

		this.steering *= 0.9;

		this.motor -= data.acceleration * key[ 1 ];
		if ( this.motor > data.engine ) this.motor = data.engine;
		if ( this.motor < - data.engine ) this.motor = - data.engine;

		if ( key[ 1 ] == 0 ) { // && key[1] == 0 ){

			if ( this.motor > 1 ) this.motor *= 0.9;
			else if ( this.motor < - 1 ) this.motor *= 0.9;
			else {

				this.motor = 0; this.breaking = data.breaking;

			}

		}

		var i = data.nWheel;
		while ( i -- ) {

			if ( i == 0 ) this.chassis.setSteeringValue( this.steering, i );
			if ( data.nWheel !== 2 && i == 1 ) this.chassis.setSteeringValue( this.steering, i );
			this.chassis.applyEngineForce( this.motor, i );
			this.chassis.setBrake( this.breaking, i );

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

	init: function ( o, shape, vehicleRay ) {

		var data = this.data;


		var trans = math.transform();
		var p0 = math.vector3();
		var p1 = math.vector3();
		var p2 = math.vector3();
		var p3 = math.vector3();

		data.mass = o.mass === undefined ? 800 : o.mass;
		o.masscenter = o.masscenter === undefined ? [ 0, 0, 0 ] : o.masscenter;

		data.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
		data.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;

		// car shape

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
		this.body.name = this.name + '_body';
		this.body.isRigidBody = true;
		this.body.isBody = true;

		this.body.setActivationState( 4 );

		Ammo.destroy( rbInfo );

		var tuning = new Ammo.btVehicleTuning();
		//var vehicleRay = new Ammo.btDefaultVehicleRaycaster( world );
		this.chassis = new Ammo.btRaycastVehicle( tuning, this.body, vehicleRay );
		this.chassis.setCoordinateSystem( 0, 1, 2 );

		//console.log( this.chassis , vehicleRay)


		// wheels
		var radius = o.radius || 0.4;
		var wPos = o.wPos || [ 1, 0, 1.6 ];
		wPos[ 1 ] -= o.masscenter[ 1 ];

		var n = o.nWheel || 4, p, fw;

		for ( var i = 0; i < n; i ++ ) {

			if ( i === 2 && wPos[ 4 ] ) wPos[ 0 ] += wPos[ 4 ];
			if ( i === 0 ) {

				p = [ wPos[ 0 ], wPos[ 1 ], wPos[ 2 ] ]; fw = true;

			}
			if ( i === 1 ) {

				p = [ - wPos[ 0 ], wPos[ 1 ], wPos[ 2 ] ]; fw = true;

			}
			if ( i === 2 ) {

				p = [ - wPos[ 0 ], wPos[ 1 ], - wPos[ 2 ] ]; fw = false;

			}
			if ( i === 3 ) {

				p = [ wPos[ 0 ], wPos[ 1 ], - wPos[ 2 ] ]; fw = false;

			}
			if ( i === 4 ) {

				p = [ - wPos[ 0 ], wPos[ 1 ], - wPos[ 3 ] ]; fw = false;

			}
			if ( i === 5 ) {

				p = [ wPos[ 0 ], wPos[ 1 ], - wPos[ 3 ] ]; fw = false;

			}

			if ( n === 2 ) { // moto

				if ( i == 1 ) {

					p = [ - wPos[ 0 ], wPos[ 1 ], - wPos[ 2 ] ]; fw = false;

				}

			}

			p1.fromArray( p ); // position
			p2.setValue( 0, - 1, 0 ); // wheelDir
			p3.setValue( - 1, 0, 0 ); // wheelAxe
			this.chassis.addWheel( p1, p2, p3, 1, radius, tuning, fw );
			this.chassis.setBrake( o.breaking || 100, i );

		}






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

			if ( data[ i ] ) data[ i ] = o[ i ];

		}

		// body
		this.body.setFriction( data.friction );
		this.body.setRestitution( data.restitution );
		this.body.setDamping( data.linear, data.angular );

		if ( data.auto ) {

			var sqrt = Math.sqrt( data.s_stiffness );
			data.s_compression = data.compValue * 2 * sqrt;
			data.s_damping = data.dampValue * 2 * sqrt;

		}

		var n = data.nWheel, w;

		while ( n -- ) {

			w = this.chassis.getWheelInfo( n );

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

		if ( o.reset ) this.setPosition();

	},

	get: function () {

		self.postMessage( { m: 'carData', o: this.data } );

	},

} );

export { Car };
