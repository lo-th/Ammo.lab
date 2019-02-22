/*global Ammo*/
import { math } from './math.js';
import { root, map } from './root.js';

/**
* @author lth / https://github.com/lo-th/
*/

//--------------------------------------------------
//  AMMO RIGIDBODY
//--------------------------------------------------

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

function RigidBody() {

	this.ID = 0;
	this.solids = [];
	this.bodys = [];

	this.trans = new Ammo.btTransform();
	this.zero = new Ammo.btVector3();
	this.zero.set( 0, 0, 0 );

}

Object.assign( RigidBody.prototype, {

	step: function ( AR, N ) {

		var n, trans = this.trans, scale = root.scale;

		this.bodys.forEach( function ( b, id ) {

			n = N + ( id * 8 );
			AR[ n ] = b.getLinearVelocity().length() * 9.8; // speed km/h
			b.getMotionState().getWorldTransform( trans );
			trans.toArray( AR, n + 1, scale );

		} );

	},

	clear: function () {

		while ( this.bodys.length > 0 ) this.destroy( this.bodys.pop() );
		while ( this.solids.length > 0 ) this.destroy( this.solids.pop() );
		this.ID = 0;

	},

	destroy: function ( b ) {

		//var world = this.engine.getWorld();
		if ( b.isSolid ) root.world.removeCollisionObject( b );
		else root.world.removeRigidBody( b );
		Ammo.destroy( b );
		map.delete( b.name );

	},

	remove: function ( name ) {

		if ( ! map.has( name ) ) return;
		var b = map.get( name );

		var solid = b.isSolid ? true : false;
		var n = solid ? this.solids.indexOf( b ) : this.bodys.indexOf( b );

		if ( n !== - 1 ) {

			if ( solid ) {

				this.solids.splice( n, 1 );
				this.destroy( b );

			} else {

				this.bodys.splice( n, 1 );
				this.destroy( b );

			}

		}

	},

	add: function ( o, extra ) {

		var name = o.name !== undefined ? o.name : 'body' + this.ID ++;
		// delete old if same name
		this.remove( name );

		if ( o.density !== undefined ) o.mass = o.density;
		if ( o.bounce !== undefined ) o.restitution = o.bounce;

		var mass = o.mass === undefined ? 0 : o.mass;
		var isKinematic = o.kinematic || false;

		var p1 = math.vector3();
		var p2 = math.vector3();
		var p3 = math.vector3();
		var p4 = math.vector3();
		var trans = math.transform();

		if ( isKinematic ) {

			o.flag = 2;
			o.state = 4;

		}


		o.size = o.size === undefined ? [ 1, 1, 1 ] : o.size;
		o.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
		o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;

		if ( root.scale !== 1 ) {

			o.pos = math.vectomult( o.pos, root.invScale );
			o.size = math.vectomult( o.size, root.invScale );

		}

		var shape = null;
		switch ( o.type ) {

			case 'plane':
				p4.fromArray( o.dir || [ 0, 1, 0 ] );
				shape = new Ammo.btStaticPlaneShape( p4, 0 );
				break;

			case 'box': case 'hardbox': case 'realbox': case 'realhardbox':
				p4.setValue( o.size[ 0 ] * 0.5, o.size[ 1 ] * 0.5, o.size[ 2 ] * 0.5 );
				shape = new Ammo.btBoxShape( p4 );
				break;

			case 'sphere': case 'realsphere':
				shape = new Ammo.btSphereShape( o.size[ 0 ] );
				break;

			case 'cylinder': case 'realcylinder':
				p4.setValue( o.size[ 0 ], o.size[ 1 ] * 0.5, o.size[ 2 ] * 0.5 );
				shape = new Ammo.btCylinderShape( p4 );
				break;

			case 'cone': case 'realcone':
				shape = new Ammo.btConeShape( o.size[ 0 ], o.size[ 1 ] * 0.5 );
				break;

			case 'capsule':
				shape = new Ammo.btCapsuleShape( o.size[ 0 ], o.size[ 1 ] * 0.5 );
				break;

			case 'compound':

				shape = new Ammo.btCompoundShape();
				var m, g, s, tr = math.transform();

		    	for( var i = 0; i < o.shapes.length; i++ ){

		    		g = o.shapes[i];

		    		if ( root.scale !== 1 ) {

						g.pos = math.vectomult( g.pos, root.invScale );
						g.size = math.vectomult( g.size, root.invScale );

					}

					// apply position and rotation
		            tr.identity().fromArray( g.pos.concat( g.quat ) );

		    		switch ( g.type ) {
		    			case 'box': case 'hardbox':
							p4.setValue( g.size[ 0 ] * 0.5, g.size[ 1 ] * 0.5, g.size[ 2 ] * 0.5 );
							s = new Ammo.btBoxShape( p4 );
						break;
						case 'sphere':
							s = new Ammo.btSphereShape( g.size[ 0 ] );
						break;
						case 'cylinder': case 'hardcylinder':
							p4.setValue( g.size[ 0 ], g.size[ 1 ] * 0.5, g.size[ 2 ] * 0.5 );
							s = new Ammo.btCylinderShape( p4 );
						break;
						case 'cone':
							s = new Ammo.btConeShape( g.size[ 0 ], g.size[ 1 ] * 0.5 );
						break;
						case 'capsule':
							s = new Ammo.btCapsuleShape( g.size[ 0 ], g.size[ 1 ] * 0.5 );
						break;
		    		}

		    		shape.addChildShape( tr, s );

		    	}

		    	//console.log( shape )

		    	tr.free();

			break;

			case 'mesh':
				var mTriMesh = new Ammo.btTriangleMesh();
				var removeDuplicateVertices = true;
				var vx = o.v;
				for ( var i = 0, fMax = vx.length; i < fMax; i += 9 ) {

					p1.set( vx[ i + 0 ] * o.size[ 0 ], vx[ i + 1 ] * o.size[ 1 ], vx[ i + 2 ] * o.size[ 2 ] );
					p2.set( vx[ i + 3 ] * o.size[ 0 ], vx[ i + 4 ] * o.size[ 1 ], vx[ i + 5 ] * o.size[ 2 ] );
					p3.set( vx[ i + 6 ] * o.size[ 0 ], vx[ i + 7 ] * o.size[ 1 ], vx[ i + 8 ] * o.size[ 2 ] );
					mTriMesh.addTriangle( p1, p2, p3, removeDuplicateVertices );

				}
				if ( mass === 0 ) {

					// btScaledBvhTriangleMeshShape -- if scaled instances
					shape = new Ammo.btBvhTriangleMeshShape( mTriMesh, true, true );

				} else {

					// btGimpactTriangleMeshShape -- complex?
					// btConvexHullShape -- possibly better?
					shape = new Ammo.btConvexTriangleMeshShape( mTriMesh, true );

				}
				break;

			case 'convex':
				shape = new Ammo.btConvexHullShape();
				var vx = o.v;
				for ( var i = 0, fMax = vx.length; i < fMax; i += 3 ) {

					vx[ i ] *= o.size[ 0 ];
					vx[ i + 1 ] *= o.size[ 1 ];
					vx[ i + 2 ] *= o.size[ 2 ];

					p4.fromArray( vx, i );
					shape.addPoint( p4 );

				}
				break;

		}

		if ( o.margin !== undefined && shape.setMargin !== undefined ) shape.setMargin( o.margin * root.invScale );

		//console.log(shape.getMargin())

		if ( extra == 'isShape' ) return shape;

		if ( extra == 'isGhost' ) {

			var ghost = new Ammo.btGhostObject();
			ghost.setCollisionShape( shape );
			ghost.setCollisionFlags( o.flag || 1 );
			//o.f = new Ammo.btGhostPairCallback();
			//world.getPairCache().setInternalGhostPairCallback( o.f );
			return ghost;

		}

		// apply position and rotation
		trans.identity().fromArray( o.pos.concat( o.quat ) );

		p1.setValue( 0, 0, 0 );

		if ( mass !== 0 ) shape.calculateLocalInertia( mass, p1 );

		var motionState = new Ammo.btDefaultMotionState( trans );
		var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, p1 );


		if ( o.friction !== undefined ) rbInfo.set_m_friction( o.friction );
		if ( o.restitution !== undefined ) rbInfo.set_m_restitution( o.restitution );
		//Damping is the proportion of velocity lost per second.
		if ( o.linear !== undefined ) rbInfo.set_m_linearDamping( o.linear );
		if ( o.angular !== undefined ) rbInfo.set_m_angularDamping( o.angular );
		// prevents rounded shapes, such as spheres, cylinders and capsules from rolling forever.
		if ( o.rolling !== undefined ) rbInfo.set_m_rollingFriction( o.rolling );




		var body = new Ammo.btRigidBody( rbInfo );

		body.isRigidBody = true;

		//console.log(body)

		//body.isKinematic = isKinematic;
		body.name = name;

		// TODO  body.setCenterOfMassTransform()


		if ( mass === 0 && ! isKinematic ) {

			body.setCollisionFlags( o.flag || 1 );
			root.world.addCollisionObject( body, o.group || 2, o.mask || - 1 );

			body.isSolid = true;
			this.solids.push( body );

		} else {

			body.setCollisionFlags( o.flag || 0 );
			body.setActivationState( o.state || 1 );

			if ( o.neverSleep ) body.setSleepingThresholds( 0, 0 );

			root.world.addRigidBody( body, o.group || 1, o.mask || - 1 );

			if( isKinematic ) body.isKinematic = true;
			else body.isBody = true;

			this.bodys.push( body );

		}

		// BREAKABLE

		body.breakable = o.breakable !== undefined ? o.breakable : false;

		if( body.breakable ){

			// breakOption: [ maxImpulse, maxRadial, maxRandom, levelOfSubdivision ]
			body.breakOption = o.breakOption !== undefined ? o.breakOption : [ 250, 1, 2, 1 ];

		}

	

		

		map.set( name, body );

		Ammo.destroy( rbInfo )


		this.applyOption( body, o );

		trans.free();
		p1.free();
		p2.free();
		p3.free();
		p4.free();

		o = null;

	},

	applyOption: function ( b, o ) {

		var p1 = math.vector3();

		if ( o.flag !== undefined ) b.setCollisionFlags( o.flag );
		if ( o.state !== undefined ) b.setActivationState( o.state );
		// change group and mask collision
		if ( o.group !== undefined ) b.getBroadphaseProxy().set_m_collisionFilterGroup( o.group );
		if ( o.mask !== undefined ) b.getBroadphaseProxy().set_m_collisionFilterMask( o.mask );

		if ( o.friction !== undefined ) b.setFriction( o.friction );
		if ( o.restitution !== undefined ) b.setRestitution( o.restitution );
		if ( o.damping !== undefined ) b.setDamping( o.damping[ 0 ], o.damping[ 1 ] );
		if ( o.rollingFriction !== undefined ) b.setRollingFriction( o.rollingFriction );
		if ( o.sleeping !== undefined ) b.setSleepingThresholds( o.sleeping[ 0 ], o.sleeping[ 1 ] );


        // TODO try this setting
		if ( o.linearVelocity !== undefined ) b.setLinearVelocity( p1.fromArray( o.linearVelocity ) );
		if ( o.angularVelocity !== undefined ) b.setAngularVelocity( p1.fromArray( o.angularVelocity ) );
		if ( o.linearFactor !== undefined ) b.setLinearFactor( p1.fromArray( o.linearFactor ) );
		if ( o.angularFactor !== undefined ) b.setAngularFactor( p1.fromArray( o.angularFactor ) );
		//if ( o.linearFactor !== undefined ) b.setLinearFactor( o.linearFactor );
		//if ( o.angularFactor !== undefined ) b.setAngularFactor( o.angularFactor );

		if ( o.anisotropic !== undefined ) b.setAnisotropicFriction( o.anisotropic[ 0 ], o.anisotropic[ 1 ] );
		if ( o.massProps !== undefined ) b.setMassProps( o.massProps[ 0 ], o.massProps[ 1 ] );

		if ( o.gravity !== undefined ) {

			if ( o.gravity ) b.setGravity( root.gravity ); else b.setGravity( this.zero );

		}

		p1.free();

	},

} );


export { RigidBody };
