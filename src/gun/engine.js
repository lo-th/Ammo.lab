/*global importScripts Ammo*/
import { math, mathExtend } from './math.js';
import { RigidBody } from './RigidBody.js';
import { Constraint } from './Constraint.js';
import { SoftBody } from './SoftBody.js';
import { Terrain } from './Terrain.js';
import { Vehicle } from './Vehicle.js';
import { Character } from './Character.js';
import { Collision } from './Collision.js';
import { root, map } from './root.js';

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*    source https://github.com/lo-th/Ammo.lab
*
*    AMMO worker ultimate
*
*    By default, Bullet assumes units to be in meters and time in seconds.
*    Moving objects are assumed to be in the range of 0.05 units, about the size of a pebble,
*    to 10, the size of a truck.
*    The simulation steps in fraction of seconds (1/60 sec or 60 hertz),
*    and gravity in meters per square second (9.8 m/s^2).
*/
//var Module = { TOTAL_MEMORY: 64*1024*1024 };//default // 67108864
self.Module = { TOTAL_MEMORY: 16*1024*1024 };//default // 67108864

self.onmessage = function ( e ) {

	// ------- buffer data
	if ( e.data.Ar ) engine.setAr( e.data.Ar );

	//if( engine[ e.data.m ] ) console.log(e.data.m);
	// ------- engine function
	engine[ e.data.m ]( e.data.o );

	/*
	var data = e.data;
    var m = data.m;
    var o = data.o;

    // ------- buffer data
    if( data.Ar ) engine.setAr( data.Ar );

    switch( m ){

    	case 'init': engine.init( o ); break;
        case 'step': engine.step( o ); break;
        //case 'start': engine.start( o ); break;
        case 'reset': engine.reset( o ); break;
        case 'set': engine.set( o ); break;
        case 'setGravity': engine.setGravity( o ); break;
        // CC
        case 'setForces': engine.setForces(o); break;
        case 'setMatrix': engine.setMatrix(o); break;
        case 'setOption': engine.setOption(o); break;
        case 'setRemove': engine.setRemove(o); break;
        // ADD
        case 'add': engine.add( o ); break;
        case 'addMulty': engine.addMulty( o ); break;
        case 'addCharacter': engine.addCharacter( o ); break;
        case 'addVehicle': engine.addVehicle( o ); break;
        case 'addContact': engine.addContact( o ); break;
        case 'addAnchor': engine.addAnchor( o ); break;
        // CONFIG
        case 'setVehicle': engine.setVehicle( o ); break;
        case 'setTerrain': engine.setTerrain( o ); break;
        // CONTROLE
        case 'setDrive': engine.setDrive( o ); break;
        case 'setMove': engine.setMove( o ); break;
        case 'setAngle': engine.setAngle( o ); break;

    }
    */


};

export var engine = ( function () {

	'use strict';

	//var world = null;
	var Ar, ArPos, ArMax;
	var timestep = 1 / 60;
	var substep = 2;

	var isBuffer = false;
	var isSoft = false;
	//var gravity = null;

	var solver, solverSoft, collision, dispatcher, broadphase;

	var tmpForces = [];
	var tmpMatrix = [];
	var tmpOption = [];
	var tmpRemove = [];

	var carName = "";
	var heroName = "";

	var zero = null;



	var rigidBody, softBody, constraint, terrains, vehicles, character, collision;

	engine = {

		test: function () {},

		setAr: function ( r ) {

			Ar = r;

		},
		getAr: function () {

			return Ar;

		},

		setKey: function ( r ) {

			root.key = r;

		},
		//getKey: function () { return key; },

		setDrive: function ( o ) {

			carName = o.name;

		},

		setMove: function ( o ) {

			heroName = o.name;

		},
		setAngle: function ( o ) {

			root.angle = o.angle;

		},

		step: function ( o ) {

			root.key = o.key;

			this.stepMatrix();
			this.stepOption();
			this.stepForces();
			this.stepRemove();

			terrains.step();

			root.world.stepSimulation( timestep, substep );

			vehicles.control( carName );
			character.control( heroName );

			rigidBody.step( Ar, ArPos[ 0 ] );
			collision.step( Ar, ArPos[ 1 ] );
			character.step( Ar, ArPos[ 2 ] );
			vehicles.step( Ar, ArPos[ 3 ] );
			softBody.step( Ar, ArPos[ 4 ] );
			

			//constraint.step( Ar, ArPos[4] );

			if ( isBuffer ) self.postMessage( { m: 'step', Ar: Ar }, [ Ar.buffer ] );
			else self.postMessage( { m: 'step', Ar: Ar } );

		},

		reset: function ( o ) {

			carName = "";
			heroName = "";

			tmpForces = [];
			tmpMatrix = [];
			tmpOption = [];
			tmpRemove = [];

			rigidBody.clear();
			constraint.clear();
			softBody.clear();
			terrains.clear();
			vehicles.clear();
			character.clear();
			collision.clear();

			// clear map map
			map.clear();

			// clear math manager
			math.destroy();

			if ( o.full ) {

				this.clearWorld();
				this.createWorld();

			}

			this.setGravity();

			// create self tranfere array if no buffer
			if ( ! isBuffer ) Ar = new Float32Array( ArMax );

			//console.log('worker reset !!!')

			self.postMessage( { m: 'start' } );

		},

		addMulty: function ( o ) {

			for ( var i = 0, lng = o.length; i < lng; i ++ ) this.add( o[ i ] );
			o = [];

		},



		init: function ( o ) {

			isBuffer = o.isBuffer || false;

			//ArLng = o.settings[ 0 ];
			ArPos = o.ArPos;
			ArMax = o.ArMax;

			// create tranfere array if buffer
			if ( ! isBuffer ) Ar = new Float32Array( ArMax );

			//console.log(Module)
			//var Module = { TOTAL_MEMORY: 64*1024*1024 };//default // 67108864
			//self.Module = { TOTAL_MEMORY: 16*1024*1024 };//default // 67108864

			importScripts( o.blob );



			Ammo().then( function ( Ammo ) {

				//console.log(Module)

				mathExtend();

				engine.createWorld( o.option );
				engine.set( o.option );

				self.postMessage( { m: 'initEngine' } );

			} );

		},

		//-----------------------------
		// ADD
		//-----------------------------

		/*addExtra: function ( o, extra ) {

            return rigidBody.add( o, extra );

        },*/

		add: function ( o ) {

			o.type = o.type === undefined ? 'box' : o.type;

			var type = o.type;
			var prev = o.type.substring( 0, 4 );

			if ( prev === 'join' ) constraint.add( o );
			else if ( prev === 'soft' || type === 'ellipsoid' ) softBody.add( o );
			else if ( type === 'terrain' ) terrains.add( o );
			else if ( type === 'character' ) character.add( o );
			else if ( type === 'collision' ) collision.add( o );
			else if ( type === 'car' ) vehicles.add( o );
			else rigidBody.add( o );

		},

		addAnchor: function ( o ) {

			if ( ! map.has( o.soft ) || ! map.has( o.body ) ) return;
			map.get( o.soft ).appendAnchor( o.pos, map.get( o.body ), false, o.influence || 0.5 );

		},

		//-----------------------------
		// CONFIG
		//-----------------------------

		setTerrain: function ( o ) {

			terrains.setData( o );

		},

		setVehicle: function ( o ) {

			vehicles.setData( o );

		},

		//-----------------------------
		// WORLD
		//-----------------------------

		createWorld: function ( o ) {

			if ( root.world !== null ) {

				console.error( 'World already existe !!' ); return;

			}

			o = o || {};

			zero = new Ammo.btVector3();
			zero.set( 0, 0, 0 );

			isSoft = o.soft === undefined ? true : o.soft;

			solver = new Ammo.btSequentialImpulseConstraintSolver();
			solverSoft = isSoft ? new Ammo.btDefaultSoftBodySolver() : null;
			collision = isSoft ? new Ammo.btSoftBodyRigidBodyCollisionConfiguration() : new Ammo.btDefaultCollisionConfiguration();
			dispatcher = new Ammo.btCollisionDispatcher( collision );

			switch ( o.broadphase === undefined ? 2 : o.broadphase ) {

				//case 0: broadphase = new Ammo.btSimpleBroadphase(); break;
				case 1: var s = 1000; broadphase = new Ammo.btAxisSweep3( new Ammo.btVector3( - s, - s, - s ), new Ammo.btVector3( s, s, s ), 4096 ); break;//16384;
				case 2: broadphase = new Ammo.btDbvtBroadphase(); break;

			}

			root.world = isSoft ? new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collision, solverSoft ) : new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collision );

			rigidBody = new RigidBody();
			constraint = new Constraint();
			softBody = new SoftBody();
			terrains = new Terrain();
			vehicles = new Vehicle();
			character = new Character();
			collision = new Collision();

			vehicles.addExtra = rigidBody.add;

		},

		clearWorld: function () {

			Ammo.destroy( root.world );
			Ammo.destroy( solver );
			if ( solverSoft !== null ) Ammo.destroy( solverSoft );
			Ammo.destroy( collision );
			Ammo.destroy( dispatcher );
			Ammo.destroy( broadphase );
			root.world = null;

		},

		setWorldscale: function ( n ) {

			root.scale = n;
			root.invScale = 1 / n;

		},

		setGravity: function ( o ) {

			o = o || {};

			root.gravity = new Ammo.btVector3();
			root.gravity.fromArray( o.gravity !== undefined ? o.gravity : [ 0, - 9.81, 0 ] );
			root.world.setGravity( root.gravity );

			if ( isSoft ) {

				var worldInfo = root.world.getWorldInfo();
				worldInfo.set_m_gravity( root.gravity );

			}

		},

		set: function ( o ) {

			o = o || {};

			this.setWorldscale( o.worldscale !== undefined ? o.worldscale : 1 );

			timestep = o.fps !== undefined ? 1 / o.fps : timestep;
			substep = o.substep !== undefined ? o.substep : substep;

			// penetration
			if ( o.penetration !== undefined ) {

				var worldDispatch = root.world.getDispatchInfo();
				worldDispatch.set_m_allowedCcdPenetration( o.penetration );// default 0.0399}

			}

			//var worldDispatch = root.world.getWorldInfo();

			//console.log(root.world.getDispatchInfo().get_m_allowedCcdPenetration())
			//	worldDispatch.set_m_allowedCcdPenetration( 10 );// default 0.0399}

			// gravity
			this.setGravity( o );

		},

		//-----------------------------
		// FORCES
		//-----------------------------

		setForces: function ( o ) {

			tmpForces = tmpForces.concat( o );

		},

		stepForces: function () {

			while ( tmpForces.length > 0 ) this.applyForces( tmpForces.pop() );

		},

		applyForces: function ( r ) {

			if ( ! map.has( r[ 0 ] ) ) return;
			var b = map.get( r[ 0 ] );

			var type = r[ 1 ] || 'force';
			var p1 = math.vector3();
			var p2 = math.vector3();

			if ( r[ 2 ] !== undefined ) p1.fromArray( r[ 2 ] );
			if ( r[ 3 ] !== undefined ) p2.fromArray( r[ 3 ] );
			else p2.zero();

			switch ( type ) {

				case 'force' : case 0 : b.applyForce( p1, p2 ); break;// force , rel_pos
				case 'torque' : case 1 : b.applyTorque( p1 ); break;
				case 'localTorque' : case 2 : b.applyLocalTorque( p1 ); break;
				case 'forceCentral' :case 3 : b.applyCentralForce( p1 ); break;
				case 'forceLocal' : case 4 : b.applyCentralLocalForce( p1 ); break;
				case 'impulse' : case 5 : b.applyImpulse( p1, p2 ); break;// impulse , rel_pos
				case 'impulseCentral' : case 6 : b.applyCentralImpulse( p1 ); break;

					// joint

				case 'motor' : case 7 : b.enableAngularMotor( true, r[ 2 ][ 0 ], r[ 2 ][ 1 ] ); break; // bool, targetVelocity, maxMotorImpulse

			}

			p1.free();
			p2.free();

		},

		//-----------------------------
		// MATRIX
		//-----------------------------

		setMatrix: function ( o ) {

			tmpMatrix = tmpMatrix.concat( o );

		},

		stepMatrix: function () {

			while ( tmpMatrix.length > 0 ) this.applyMatrix( tmpMatrix.pop() );

		},

		applyMatrix: function ( r ) {

			if ( ! map.has( r[ 0 ] ) ) return;
			var b = map.get( r[ 0 ] );

			var isOr = false;
			var isK = b.isKinematic || false;

			if ( r[ 4 ] ) { // keep original position

				var tr = math.transform();

				b.getMotionState().getWorldTransform( tr );
				var or = [];
				tr.toArray( or );
				tr.free();
				var i = r[ 4 ].length, a;

				isOr = true;

				while ( i -- ) {

					a = r[ 4 ][ i ];
					if ( a === 'x' ) r[ 1 ][ 0 ] = or[ 0 ] - r[ 1 ][ 0 ];
					if ( a === 'y' ) r[ 1 ][ 1 ] = or[ 1 ] - r[ 1 ][ 1 ];
					if ( a === 'z' ) r[ 1 ][ 2 ] = or[ 2 ] - r[ 1 ][ 2 ];
					if ( a === 'rot' ) r[ 2 ] = [ or[ 3 ], or[ 4 ], or[ 5 ], or[ 6 ] ];

				}

			}

			var t = math.transform().identity();

			// position and rotation
			if ( r[ 1 ] !== undefined ) {

				r[ 1 ] = math.vectomult( r[ 1 ], root.invScale );

				if ( r[ 2 ] !== undefined ){ 
					if( r[2].length === 3 ){
						// is euler degree
						r[2] = math.eulerToQuadArray( r[2], true );
					}
					r[ 1 ] = r[ 1 ].concat( r[ 2 ] );
				}

				t.fromArray( r[ 1 ] );

			}

			if(r[3]){
				b.setAngularVelocity( zero );
				b.setLinearVelocity( zero );
			}


			//else { tmpQuat.fromArray( [2] ); tmpTrans.setRotation( tmpQuat ); }

			if ( ! isK && ! isOr ) {//

				// zero force
				b.setAngularVelocity( zero );
				b.setLinearVelocity( zero );

			}

			if ( ! isK ) {

				b.setWorldTransform( t );
				b.activate();

			} else {

				b.getMotionState().setWorldTransform( t );

			}

			t.free();

		},

		//-----------------------------
		// OPTION
		//-----------------------------

		// ___________________________STATE
		//  1  : ACTIVE
		//  2  : ISLAND_SLEEPING
		//  3  : WANTS_DEACTIVATION
		//  4  : DISABLE_DEACTIVATION
		//  5  : DISABLE_SIMULATION

		// ___________________________FLAG
		//  1  : STATIC_OBJECT
		//  2  : KINEMATIC_OBJECT
		//  4  : NO_CONTACT_RESPONSE
		//  8  : CUSTOM_MATERIAL_CALLBACK
		//  16 : CHARACTER_OBJECT
		//  32 : DISABLE_VISUALIZE_OBJECT
		//  64 : DISABLE_SPU_COLLISION_PROCESSING

		// ___________________________GROUP
		//  -1   : ALL
		//  1    : DEFAULT
		//  2    : STATIC
		//  4    : KINEMATIC
		//  8    : DEBRIS
		//  16   : SENSORTRIGGER
		//  32   : NOCOLLISION
		//  64   : GROUP0
		//  128  : GROUP1
		//  256  : GROUP2
		//  512  : GROUP3
		//  1024 : GROUP4
		//  2048 : GROUP5
		//  4096 : GROUP6
		//  8192 : GROUP7

		setOption: function ( o ) {

			tmpOption = tmpOption.concat( o );

		},

		stepOption: function () {

			while ( tmpOption.length > 0 ) this.applyOption( tmpOption.pop() );

		},

		applyOption: function ( o ) {

			if ( ! map.has( o.name ) ) return;
			var b = map.get( o.name );

			if ( o.flag !== undefined ) b.setCollisionFlags( o.flag );
			if ( o.state !== undefined ) b.setMotionState( o.state );

			if ( o.friction !== undefined ) b.setFriction( o.friction );
			if ( o.restitution !== undefined ) b.setRestitution( o.restitution );
			if ( o.damping !== undefined ) b.setDamping( o.damping[ 0 ], o.damping[ 1 ] );
			if ( o.rollingFriction !== undefined ) b.setRollingFriction( o.rollingFriction );

			if ( o.linearVelocity !== undefined ) b.setLinearVelocity( o.linearVelocity );
			if ( o.angularVelocity !== undefined ) b.setAngularVelocity( o.angularVelocity );

			if ( o.linearFactor !== undefined ) b.setLinearFactor( o.linearFactor );
			if ( o.angularFactor !== undefined ) b.setAngularFactor( o.angularFactor );

			if ( o.anisotropic !== undefined ) b.setAnisotropicFriction( o.anisotropic[ 0 ], o.anisotropic[ 1 ] );
			if ( o.sleeping !== undefined ) b.setSleepingThresholds( o.sleeping[ 0 ], o.sleeping[ 1 ] );
			if ( o.massProps !== undefined ) b.setMassProps( o.massProps[ 0 ], o.massProps[ 1 ] );

			if ( o.gravity !== undefined ) {

				if ( o.gravity ) b.setGravity( root.gravity ); else b.setGravity( zero );

			}

			// change group and mask collision
			if ( o.group !== undefined ) b.getBroadphaseProxy().set_m_collisionFilterGroup( o.group );
			if ( o.mask !== undefined ) b.getBroadphaseProxy().set_m_collisionFilterMask( o.mask );


		},

		//-----------------------------
		// REMOVE
		//-----------------------------

		setRemove: function ( o ) {

			tmpRemove = tmpRemove.concat( o );

		},

		stepRemove: function () {

			while ( tmpRemove.length > 0 ) this.applyRemove( tmpRemove.pop() );

		},

		applyRemove: function ( name ) {

			if ( ! map.has( name ) ) return;
			var b = map.get( name );

			if ( b.isBody || b.isSolid ) rigidBody.remove( name );
			if ( b.isJoint ) constraint.remove( name );



		},





	};

	return engine;

} )();
