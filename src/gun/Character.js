/*global Ammo*/
import { math } from './math.js';
import { root, map } from './root.js';

/**
* @author lth / https://github.com/lo-th/
*/

//--------------------------------------------------
//  AMMO CHARACTER
//--------------------------------------------------

function Character() {

	this.ID = 0;
	this.heroes = [];

}

Object.assign( Character.prototype, {

	step: function ( AR, N ) {

		var n;

		this.heroes.forEach( function ( hero, id ) {

			n = N + ( id * 8 );
			hero.step( AR, n );

		} );

	},

	control: function ( name ) {

		if ( ! map.has( name ) ) return;
		var hero = map.get( name );
		hero.move( root.key );
		hero.setAngle( root.angle );

	},

	clear: function () {

		while ( this.heroes.length > 0 ) this.destroy( this.heroes.pop() );
		this.ID = 0;

	},

	destroy: function ( hero ) {

		root.world.removeCollisionObject( hero.body );
		root.world.removeAction( hero.controller );
		hero.clear();
		map.delete( hero.name );

	},

	remove: function ( name ) {

		if ( ! map.has( name ) ) return;
		var hero = map.get( name );

		var n = this.heroes.indexOf( hero );
		if ( n !== - 1 ) {

			this.heroes.splice( n, 1 );
			this.destroy( hero );

		}

	},

	add: function ( o ) {

		var name = o.name !== undefined ? o.name : 'hero' + this.ID ++;

		// delete old if same name
		this.remove( name );

		var hero = new Hero( name, o );

		hero.controller.setGravity( root.gravity );
		root.world.addCollisionObject( hero.body, o.group || 1, o.mask || - 1 );
		root.world.addAction( hero.controller );


		this.heroes.push( hero );
		map.set( name, hero );

	}

} );


export { Character };





function Hero( name, o ) {

	this.name = name;

	this.body = null;
	this.controller = null;

	this.angle = 0;
	this.speed = 0;
	this.wasJumping = false;
	this.verticalVelocity = 0;
	this.angleInc = 0.1;

	this.q = new Ammo.btQuaternion();
	this.position = new Ammo.btVector3();

	this.init( o );

}

Object.assign( Hero.prototype, {

	step: function ( Ar, n ) {

		Ar[ n ] = this.speed;
		//Hr[n] = b.onGround ? 1 : 0;

		var t = this.body.getWorldTransform();
		var pos = t.getOrigin();
		var quat = t.getRotation();

		Ar[ n + 1 ] = pos.x();
		Ar[ n + 2 ] = pos.y();
		Ar[ n + 3 ] = pos.z();

		Ar[ n + 4 ] = quat.x();
		Ar[ n + 5 ] = quat.y();
		Ar[ n + 6 ] = quat.z();
		Ar[ n + 7 ] = quat.w();

	},

	move: function ( key ) {

		//var hero = this.controller;

		//btScalar walkVelocity = btScalar(1.1) * 4.0; // 4 km/h -> 1.1 m/s
		//btScalar walkSpeed = walkVelocity * dt;

		var walkSpeed = 0.3;
		var angleInc = 0.1;

		var x = 0, y = 0, z = 0;

		//transW = hero.getGhostObject().getWorldTransform();

		//console.log(transW.getOrigin().y())

		//y = transW.getOrigin().y();

		//if(key[0] == 1 || key[1] == 1 ) heros[id].speed += 0.1;
		//if(key[0] == 0 && key[1] == 0 ) heros[id].speed -= 0.1;


		//if(heros[id].speed>1) heros[id].speed = 1;
		//if(heros[id].speed<0) heros[id].speed = 0;

		//if( key[1] == -1 ) z=-heros[id].speed * walkSpeed;
		//if( key[1] == 1 ) z=heros[id].speed * walkSpeed;

		//if( key[0] == -1 ) x=-heros[id].speed * walkSpeed;
		//if( key[0] == 1 ) x=heros[id].speed * walkSpeed;

		if ( key[ 4 ] == 1 && this.controller.onGround() ) { //h.canJump() ){

			this.wasJumping = true;
			this.verticalVelocity = 0;

			//this.controller.jump();

			//y = transW.getOrigin().y()



			//y+=10;


		} //console.log(hero.jump())
		//console.log(h.onGround())

		if ( this.wasJumping ) {

			this.verticalVelocity += 0.04;
			// y = this.controller.verticalVelocity;
			if ( this.verticalVelocity > 1.3 ) {

				this.verticalVelocity = 0;
				this.wasJumping = false;

			}

		}

		//  if( hero.onGround() ){
		z = walkSpeed * - key[ 1 ];
		x = walkSpeed * - key[ 0 ];





		this.speed = z + x;

		// rotation

		this.angle -= key[ 2 ] * angleInc;

		this.setAngle( this.angle );

		// var angle = hero.rotation;//key[8]; //heros[id].rotation

		// change rotation
		// quatW.setFromAxisAngle( [0,1,0], angle );
		//hero.getGhostObject().getWorldTransform().setRotation( quatW );
		// transW.setRotation( quatW );

		// walkDirection
		this.position.setValue( x, y + this.verticalVelocity, z );
		this.position.direction( this.q );

		this.controller.setWalkDirection( this.position );
		//}

		// heros[id].preStep ( world );
		//heros[id].setVelocityForTimeInterval(vec3(), 1);

	},

	clear: function () {



		Ammo.destroy( this.body );
		Ammo.destroy( this.controller );

		this.body = null;
		this.controller = null;

	},

	init: function ( o ) {

		var p0 = math.vector3();
		var trans = math.transform();

		o.size = o.size == undefined ? [ 1, 1, 1 ] : o.size;
		o.pos = o.pos == undefined ? [ 0, 0, 0 ] : o.pos;
		o.quat = o.quat == undefined ? [ 0, 0, 0, 1 ] : o.quat;

		var shape = new Ammo.btCapsuleShape( o.size[ 0 ], o.size[ 1 ] * 0.5 );

		var body = new Ammo.btPairCachingGhostObject();
		body.setCollisionShape( shape );
		body.setCollisionFlags( 16 );//CHARACTER_OBJECT

		trans.identity().fromArray( o.pos.concat( o.quat ) );

		body.setWorldTransform( trans );

		body.setFriction( o.friction || 0.1 );
		body.setRestitution( o.restitution || 0 );

		body.setActivationState( 4 );
		body.activate();

		var controller = new Ammo.btKinematicCharacterController( body, shape, o.stepH || 0.35, o.upAxis || 1 );
		//var hero = new Ammo.btKinematicCharacterController( body, shape, o.stepH || 0.3 )
		controller.setUseGhostSweepTest( shape );

		// hero.getGhostObject().getWorldTransform().setRotation(q4( o.quat ));

		//controller.setGravity( engine.getGravity() );
		controller.setFallSpeed( 30 );
		//hero.setUpAxis(1);
		controller.setMaxJumpHeight( 200 );
		controller.setJumpSpeed( 1000 );
		/*


        hero.jump();
        */
		//hero.canJump( true );

		//console.log(hero, tmpQuat.w(), tmpQuat )

		// The max slope determines the maximum angle that the controller can walk
		if ( o.slopeRadians ) controller.setMaxSlope( o.slopeRadians );//45




		// controller.warp(v3(o.pos));

		p0.setValue( 0, 0, 0 );
		controller.setVelocityForTimeInterval( p0, 1 );



		this.body = body;
		this.controller = controller;

		// world.getPairCache().setInternalGhostPairCallback( new Ammo.btGhostPairCallback() );

	},

	setAngle: function ( angle ) {

		var t = this.body.getWorldTransform();
		this.q.setFromAxisAngle( [ 0, 1, 0 ], angle );
		t.setRotation( this.q );
		this.angle = angle;

	}

} );


export { Hero };
