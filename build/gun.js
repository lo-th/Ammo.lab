(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.GUN = {}));
}(this, function (exports) { 'use strict';

	/*global Ammo*/

	/**
	* @author lth / https://github.com/lo-th/
	*/

	//--------------------------------------------------
	//  AMMO MATH
	//--------------------------------------------------

	var math = {

		T: [],
		Q: [],
		V3: [],
		M3: [],

		torad: Math.PI / 180,//0.0174532925199432957,
		todeg: 180 / Math.PI,//57.295779513082320876,

		clamp: function ( value, min, max ) {

			return Math.max( min, Math.min( max, value ) );

		},

		eulerToQuadArray: function ( array, deg ) {

			if ( deg ) array = math.vectomult( array, math.torad );

			var q = math.quaternion().setFromEuler( array );
			var result = q.toArray();
			q.free();

			return result;

		},

		destroy: function () {

			while ( math.T.length > 0 ) Ammo.destroy( math.T.pop() );
			while ( math.Q.length > 0 ) Ammo.destroy( math.Q.pop() );
			while ( math.V3.length > 0 ) Ammo.destroy( math.V3.pop() );
			while ( math.M3.length > 0 ) Ammo.destroy( math.M3.pop() );

		},

		transform: function () {

			return ( math.T.length > 0 ) ? math.T.pop() : new Ammo.btTransform();

		},

		freeTransform: function ( t ) {

			math.T.push( t );

		},

		quaternion: function () {

			return ( math.Q.length > 0 ) ? math.Q.pop() : new Ammo.btQuaternion();

		},

		freeQuaternion: function ( q ) {

			math.Q.push( q );

		},

		vector3: function () {

			return ( math.V3.length > 0 ) ? math.V3.pop() : new Ammo.btVector3();

		},

		freeVector3: function ( v ) {

			math.V3.push( v );

		},

		matrix3: function () {

			return ( math.M3.length > 0 ) ? math.M3.pop() : new Ammo.btMatrix3x3();

		},

		freeMatrix3: function ( v ) {

			math.M3.push( v );

		},

		vectomult: function ( r, scale ) {

			//r = r.map(x => x * scale);

			r = r.map( function (x) { return x * scale; } );

			//var i = r.length;
			//while(i--) r[i] * scale;

			return r;//[ r[ 0 ] * scale, r[ 1 ] * scale, r[ 2 ] * scale ];

		},

		distanceArray: function ( p1, p2 ) {

			var x = p2[ 0 ] - p1[ 0 ];
			var y = p2[ 1 ] - p1[ 1 ];
			var z = p2[ 2 ] - p1[ 2 ];
			return Math.sqrt( x * x + y * y + z * z );

		},

	};

	function mathExtend() {

		//--------------------------------------------------
		//  ammo btTransform extend
		//--------------------------------------------------

		Ammo.btTransform.prototype = Object.assign( Object.create( Ammo.btTransform.prototype ), {

			identity: function () {

				this.setIdentity();
				return this;

			},

			positionFromArray: function ( array, offset, scale ) {

				offset = offset || 0;

				var p = math.vector3().fromArray( array, offset, scale );
				this.setOrigin( p );
				p.free();

				return this;

			},

			eulerFromArray: function ( array, offset ) {

				offset = offset || 0;

				var q = math.quaternion().setFromEuler( array, offset );
				this.setRotation( q );
				q.free();

				return this;

			},

			quaternionFromArray: function ( array, offset ) {

				offset = offset || 0;

				var q = math.quaternion().fromArray( array, offset );
				this.setRotation( q );
				q.free();

				return this;

			},

			fromArray: function ( array, offset, scale ) {

				//if ( offset === undefined ) offset = 0;
				offset = offset || 0;

				this.positionFromArray( array, offset, scale );

				if ( array.length > 3 ) {

					this.quaternionFromArray( array, offset + 3 );

				}

				return this;

			},

			toArray: function ( array, offset, scale ) {

				//if ( offset === undefined ) offset = 0;
				offset = offset || 0;

				this.getOrigin().toArray( array, offset, scale );
				this.getRotation().toArray( array, offset + 3 );

			},

			getInverse: function () {

				var t = math.transform();
				t.setIdentity();

				var m = this.getRotation().toMatrix3().transpose();
				var o = this.getOrigin().clone().negate();
				var v = m.multiplyByVector3( o );
				var q = m.toQuaternion();

				t.setOrigin( v );
				t.setRotation( q );

				o.free();
				v.free();
				q.free();
				m.free();

				return t;

			},

			multiply: function ( t ) {

				var m1 = this.getRotation().toMatrix3();
				var m2 = t.getRotation().toMatrix3();
				var o1 = this.getOrigin().clone();
				var o2 = t.getOrigin().clone();

				var v = m1.multiplyByVector3( o2 ).add( o1 );
				this.setOrigin( v );

				m1.multiply( m2 );
				var q = m1.toQuaternion();
				this.setRotation( q );

				m1.free();
				m2.free();
				o1.free();
				o2.free();
				q.free();
				v.free();

				return this;

			},

			clone: function () {

				var t = math.transform();
				t.setIdentity();
				t.setOrigin( this.getOrigin() );
				t.setRotation( this.getRotation() );
				return t;

			},

			free: function () {

				math.freeTransform( this );

			}

		} );


		//--------------------------------------------------
		//  ammo btVector3 extend
		//--------------------------------------------------

		Ammo.btVector3.prototype = Object.assign( Object.create( Ammo.btVector3.prototype ), {

			set: function ( x, y, z ) {

				this.setValue( x, y, z );
				return this;

			},

			zero: function () {

				this.setValue( 0, 0, 0 );
				return this;

			},

			negate: function () {

				this.setValue( - this.x(), - this.y(), - this.z() );
				return this;

			},

			add: function ( v ) {

				this.setValue( this.x() + v.x(), this.y() + v.y(), this.z() + v.z() );
				return this;

			},

			dot: function ( v ) {

				return this.x() * v.x() + this.y() * v.y() + this.z() * v.z();

			},

			multiplyScalar: function ( scale ) {

				this.setValue( this.x() * scale, this.y() * scale, this.z() * scale );
				return this;

			},

			multiplyArray: function ( ary ) {

				this.setValue( this.x() * ary[0], this.y() * ary[1], this.z() * ary[2] );
				return this;

			},

			fromArray: function ( array, offset, scale ) {

				//if ( offset === undefined ) offset = 0;
				offset = offset || 0;
				scale = scale || 1;

				this.setValue( array[ offset ] * scale, array[ offset + 1 ] * scale, array[ offset + 2 ] * scale );
				return this;

			},

			toArray: function ( array, offset, scale ) {

				if ( array === undefined ) array = [];
				if ( offset === undefined ) offset = 0;

				scale = scale || 1;
				//offset = offset || 0;

				array[ offset ] = this.x() * scale;
				array[ offset + 1 ] = this.y() * scale;
				array[ offset + 2 ] = this.z() * scale;

				return array;

			},

			direction: function ( q ) {

				// quaternion

				var qx = q.x();
				var qy = q.y();
				var qz = q.z();
				var qw = q.w();

				var x = this.x();
				var y = this.y();
				var z = this.z();

				// calculate quat * vector

				var ix = qw * x + qy * z - qz * y;
				var iy = qw * y + qz * x - qx * z;
				var iz = qw * z + qx * y - qy * x;
				var iw = - qx * x - qy * y - qz * z;

				// calculate result * inverse quat

				var xx = ix * qw + iw * - qx + iy * - qz - iz * - qy;
				var yy = iy * qw + iw * - qy + iz * - qx - ix * - qz;
				var zz = iz * qw + iw * - qz + ix * - qy - iy * - qx;

				this.setValue( xx, yy, zz );
				return this;

			},

			clone: function () {

				return math.vector3().set( this.x(), this.y(), this.z() );

			},

			free: function () {

				math.freeVector3( this );

			}

		} );

		//--------------------------------------------------
		//  ammo btQuaternion extend
		//--------------------------------------------------

		Ammo.btQuaternion.prototype = Object.assign( Object.create( Ammo.btQuaternion.prototype ), {

			set: function ( x, y, z, w ) {

				this.setValue( x, y, z, w );
				return this;

			},

			fromArray: function ( array, offset ) {

				if ( offset === undefined ) offset = 0;
				//offset = offset || 0;
				this.setValue( array[ offset ], array[ offset + 1 ], array[ offset + 2 ], array[ offset + 3 ] );

				return this;

			},

			toArray: function ( array, offset ) {

				if ( array === undefined ) array = [];
				if ( offset === undefined ) offset = 0;
				//offset = offset || 0;

				array[ offset ] = this.x();
				array[ offset + 1 ] = this.y();
				array[ offset + 2 ] = this.z();
				array[ offset + 3 ] = this.w();

				return array;

			},

			setFromAxisAngle: function ( axis, angle ) {

				var halfAngle = angle * 0.5, s = Math.sin( halfAngle );
				this.setValue( axis[ 0 ] * s, axis[ 1 ] * s, axis[ 2 ] * s, Math.cos( halfAngle ) );

				return this;

			},

			setFromEuler: function ( euler ) {

				var x = euler[ 0 ], y = euler[ 1 ], z = euler[ 2 ], order = euler[ 3 ] || 'XYZ';

				var cos = Math.cos;
				var sin = Math.sin;

				var c1 = cos( x * 0.5 );
				var c2 = cos( y * 0.5 );
				var c3 = cos( z * 0.5 );

				var s1 = sin( x * 0.5 );
				var s2 = sin( y * 0.5 );
				var s3 = sin( z * 0.5 );

				var qx, qy, qz, qw;

				if ( order === 'XYZ' ) {

					qx = s1 * c2 * c3 + c1 * s2 * s3;
					qy = c1 * s2 * c3 - s1 * c2 * s3;
					qz = c1 * c2 * s3 + s1 * s2 * c3;
					qw = c1 * c2 * c3 - s1 * s2 * s3;

				} else if ( order === 'YXZ' ) {

					qx = s1 * c2 * c3 + c1 * s2 * s3;
					qy = c1 * s2 * c3 - s1 * c2 * s3;
					qz = c1 * c2 * s3 - s1 * s2 * c3;
					qw = c1 * c2 * c3 + s1 * s2 * s3;

				} else if ( order === 'ZXY' ) {

					qx = s1 * c2 * c3 - c1 * s2 * s3;
					qy = c1 * s2 * c3 + s1 * c2 * s3;
					qz = c1 * c2 * s3 + s1 * s2 * c3;
					qw = c1 * c2 * c3 - s1 * s2 * s3;

				} else if ( order === 'ZYX' ) {

					qx = s1 * c2 * c3 - c1 * s2 * s3;
					qy = c1 * s2 * c3 + s1 * c2 * s3;
					qz = c1 * c2 * s3 - s1 * s2 * c3;
					qw = c1 * c2 * c3 + s1 * s2 * s3;

				} else if ( order === 'YZX' ) {

					qx = s1 * c2 * c3 + c1 * s2 * s3;
					qy = c1 * s2 * c3 + s1 * c2 * s3;
					qz = c1 * c2 * s3 - s1 * s2 * c3;
					qw = c1 * c2 * c3 - s1 * s2 * s3;

				} else if ( order === 'XZY' ) {

					qx = s1 * c2 * c3 - c1 * s2 * s3;
					qy = c1 * s2 * c3 - s1 * c2 * s3;
					qz = c1 * c2 * s3 + s1 * s2 * c3;
					qw = c1 * c2 * c3 + s1 * s2 * s3;

				}

				this.setValue( qx, qy, qz, qw );
				return this;

			},

			toMatrix3: function () {

				var m = [];

				var x = this.x();
				var y = this.y();
				var z = this.z();
				var w = this.w();

				var xx = x * x;
				var yy = y * y;
				var zz = z * z;

				var xy = x * y;
				var yz = y * z;
				var zx = z * x;

				var xw = x * w;
				var yw = y * w;
				var zw = z * w;

				m[ 0 ] = 1 - 2 * ( yy + zz );
				m[ 1 ] = 2 * ( xy - zw );
				m[ 2 ] = 2 * ( zx + yw );
				m[ 3 ] = 2 * ( xy + zw );
				m[ 4 ] = 1 - 2 * ( zz + xx );
				m[ 5 ] = 2 * ( yz - xw );
				m[ 6 ] = 2 * ( zx - yw );
				m[ 7 ] = 2 * ( yz + xw );
				m[ 8 ] = 1 - 2 * ( xx + yy );

				return math.matrix3().fromArray( m );

			},

			clone: function () {

				return math.quaternion().set( this.x(), this.y(), this.z(), this.w() );

			},

			free: function () {

				math.freeQuaternion( this );

			}

		} );


		Ammo.btMatrix3x3.prototype = Object.assign( Object.create( Ammo.btMatrix3x3.prototype ), {

	    	set: function ( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

		        var te = this.elements;

		        te[ 0 ] = n11; te[ 1 ] = n21; te[ 2 ] = n31;
		        te[ 3 ] = n12; te[ 4 ] = n22; te[ 5 ] = n32;
		        te[ 6 ] = n13; te[ 7 ] = n23; te[ 8 ] = n33;

		        return this;

		    },

		    transpose: function () {

		        var tmp, m = this.elements;

		        tmp = m[ 1 ]; m[ 1 ] = m[ 3 ]; m[ 3 ] = tmp;
		        tmp = m[ 2 ]; m[ 2 ] = m[ 6 ]; m[ 6 ] = tmp;
		        tmp = m[ 5 ]; m[ 5 ] = m[ 7 ]; m[ 7 ] = tmp;

		        return this;

		    },

		    fromArray: function ( array, offset ) {

		        if ( offset === undefined ) offset = 0;

		        for ( var i = 0; i < 9; i ++ ) {

		            this.elements[ i ] = array[ i + offset ];

		        }

		        return this;

		    },

		    multiply: function ( mtx ) {

		        var v10 = this.row( 0 );
		        var v11 = this.row( 1 );
		        var v12 = this.row( 2 );

		        var v20 = mtx.column( 0 );
		        var v21 = mtx.column( 1 );
		        var v22 = mtx.column( 2 );

		        var m = this.elements;

		        m[ 0 ] = v10.dot( v20 );
		        m[ 1 ] = v10.dot( v21 );
		        m[ 2 ] = v10.dot( v22 );
		        m[ 3 ] = v11.dot( v20 );
		        m[ 4 ] = v11.dot( v21 );
		        m[ 5 ] = v11.dot( v22 );
		        m[ 6 ] = v12.dot( v20 );
		        m[ 7 ] = v12.dot( v21 );
		        m[ 8 ] = v12.dot( v22 );

		        v10.free();
		        v11.free();
		        v12.free();
		        v20.free();
		        v21.free();
		        v22.free();

		        return this;

		    },

		    multiplyByVector3: function ( v ) {

		        var v0 = this.row( 0 );
		        var v1 = this.row( 1 );
		        var v2 = this.row( 2 );
		        var v4 = math.vector3().set( v0.dot( v ), v1.dot( v ), v2.dot( v ) );
		        v0.free();
		        v1.free();
		        v2.free();
		        return v4;

		    },

		    toQuaternion: function () {

		        var m = this.elements;

		        var t = m[ 0 ] + m[ 4 ] + m[ 8 ];
		        var s, x, y, z, w;

		        if ( t > 0 ) {

		            s = Math.sqrt( t + 1.0 ) * 2;
		            w = 0.25 * s;
		            x = ( m[ 7 ] - m[ 5 ] ) / s;
		            y = ( m[ 2 ] - m[ 6 ] ) / s;
		            z = ( m[ 3 ] - m[ 1 ] ) / s;

		        } else if ( ( m[ 0 ] > m[ 4 ] ) && ( m[ 0 ] > m[ 8 ] ) ) {

		            s = Math.sqrt( 1.0 + m[ 0 ] - m[ 4 ] - m[ 8 ] ) * 2;
		            w = ( m[ 7 ] - m[ 5 ] ) / s;
		            x = 0.25 * s;
		            y = ( m[ 1 ] + m[ 3 ] ) / s;
		            z = ( m[ 2 ] + m[ 6 ] ) / s;

		        } else if ( m[ 4 ] > m[ 8 ] ) {

		            s = Math.sqrt( 1.0 + m[ 4 ] - m[ 0 ] - m[ 8 ] ) * 2;
		            w = ( m[ 2 ] - m[ 6 ] ) / s;
		            x = ( m[ 1 ] + m[ 3 ] ) / s;
		            y = 0.25 * s;
		            z = ( m[ 5 ] + m[ 7 ] ) / s;

		        } else {

		            s = Math.sqrt( 1.0 + m[ 8 ] - m[ 0 ] - m[ 4 ] ) * 2;
		            w = ( m[ 3 ] - m[ 1 ] ) / s;
		            x = ( m[ 2 ] + m[ 6 ] ) / s;
		            y = ( m[ 5 ] + m[ 7 ] ) / s;
		            z = 0.25 * s;

		        }

		        var q = math.quaternion().set( x, y, z, w );
		        return q;

		    },

		    row: function ( i ) {

		        var m = this.elements;
		        var n = i * 3;
		        return math.vector3().set( m[ n ], m[ n + 1 ], m[ n + 2 ] );

		    },

		    column: function ( i ) {

		        var m = this.elements;
		        return math.vector3().set( m[ i ], m[ i + 3 ], m[ i + 6 ] );

		    },

		    free: function () {

		        math.freeMatrix3( this );

		    },

		} );

	}

	// ROOT reference of engine worker

	var root = {

		Ar: null,
		ArPos: null,

		world: null,
		gravity: null,
		scale: 1,
		invscale: 1,
		key: [ 0, 0, 0, 0, 0, 0, 0, 0 ],
		angle: 0,

	};

	// ROW map

	var map = new Map();

	/*global Ammo*/

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
	//  0  : RIGIDBODY
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

			if ( b.type === 'solid' ) root.world.removeCollisionObject( b );
			else root.world.removeRigidBody( b );
			Ammo.destroy( b );
			map.delete( b.name );

		},

		remove: function ( name ) {

			if ( ! map.has( name ) ) return;
			var b = map.get( name );

			var solid = b.type === 'solid' ? true : false;
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
				if ( o.group === undefined ) o.group = 4;

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
					var g, s, tr = math.transform();

			    	for ( var i = 0; i < o.shapes.length; i ++ ) {

			    		g = o.shapes[ i ];

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

			//body.isRigidBody = true;

			//console.log(body)

			body.name = name;

			// TODO  body.setCenterOfMassTransform()

			if ( mass === 0 && ! isKinematic ) {

				body.setCollisionFlags( o.flag || 1 );
				root.world.addCollisionObject( body, o.group || 2, o.mask || - 1 );

				//body.isSolid = true;
				body.type = 'solid';
				this.solids.push( body );

			} else {

				body.setCollisionFlags( o.flag || 0 );
				body.setActivationState( o.state || 1 );

				if ( o.neverSleep ) body.setSleepingThresholds( 0, 0 );

				root.world.addRigidBody( body, o.group || 1, o.mask || - 1 );

				if ( isKinematic ) body.isKinematic = true;
				//else body.isBody = true;
				body.type = 'body';
				this.bodys.push( body );

			}

			// BREAKABLE

			body.breakable = o.breakable !== undefined ? o.breakable : false;

			if ( body.breakable ) {

				// breakOption: [ maxImpulse, maxRadial, maxRandom, levelOfSubdivision ]
				body.breakOption = o.breakOption !== undefined ? o.breakOption : [ 250, 1, 2, 1 ];

			}

			map.set( name, body );

			Ammo.destroy( rbInfo );

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

	/*global Ammo*/

	/**
	* @author lth / https://github.com/lo-th/
	*/

	//--------------------------------------------------
	//  AMMO CONSTRAINT JOINT
	//--------------------------------------------------

	function Constraint() {

		this.ID = 0;
		this.joints = [];

	}

	Object.assign( Constraint.prototype, {

		step: function ( AR, N ) {

			this.joints.forEach( function ( b, id ) {

				var n = N + ( id * 4 );
				AR[ n ] = b.ntype;

			} );

		},

		clear: function () {

			while ( this.joints.length > 0 ) this.destroy( this.joints.pop() );
			this.ID = 0;

		},

		destroy: function ( j ) {

			root.world.removeConstraint( j );
			Ammo.destroy( j );
			map.delete( j.name );

		},

		remove: function ( name ) {

			if ( ! map.has( name ) ) return;
			var j = map.get( name );
			var n = this.joints.indexOf( j );
			if ( n !== - 1 ) {

				this.joints.splice( n, 1 );
				this.destroy( j );

			}

		},

		add: function ( o ) {



			var name = o.name !== undefined ? o.name : 'joint' + this.ID ++;

			// delete old if same name
			this.remove( name );


			if ( o.body1 ) o.b1 = o.body1;
			if ( o.body2 ) o.b2 = o.body2;

			if ( ! map.has( o.b1 ) || ! map.has( o.b2 ) ) return;

			var b1 = map.get( o.b1 );
			var b2 = map.get( o.b2 );

			b1.activate();
			b2.activate();
			//console.log(b2)

			var posA = math.vector3().fromArray( o.pos1 || [ 0, 0, 0 ] ).multiplyScalar( root.invScale );
			var posB = math.vector3().fromArray( o.pos2 || [ 0, 0, 0 ] ).multiplyScalar( root.invScale );

			var axeA = math.vector3().fromArray( o.axe1 || [ 1, 0, 0 ] );
			var axeB = math.vector3().fromArray( o.axe2 || [ 1, 0, 0 ] );

			var formA = math.transform().identity();
			var formB = math.transform().identity();

			if ( o.type !== "joint_p2p" && o.type !== "joint_hinge" && o.type !== "joint" ) {

				var local = o.local !== undefined ? o.local : true;

				if ( ! local ) { // worldToLocal

					var t = math.transform();
					// frame A
					t.identity();
					t.setOrigin( posA );
					t.eulerFromArray( o.axe1 || [ 1, 0, 0 ] );
					b1.getMotionState().getWorldTransform( formA );
					formA.getInverse().multiply( t );

					// frame B
					t.identity();
					t.setOrigin( posB );
					t.eulerFromArray( o.axe2 || [ 1, 0, 0 ] );
					b2.getMotionState().getWorldTransform( formB );
					formB.getInverse().multiply( t );

					t.free();

				} else { // local

					// frame A
					formA.setOrigin( posA );
					if ( o.quatA ) formA.quaternionFromArray( o.quatA );
					else if ( o.axe1 ) formA.eulerFromArray( o.axe1 );

					// frame B
					formB.setOrigin( posB );
					if ( o.quatB ) formB.quaternionFromArray( o.quatB );
					else if ( o.axe2 ) formA.eulerFromArray( o.axe2 );

				}

			}

			// use fixed frame A for linear llimits useLinearReferenceFrameA
			var useA = o.useA !== undefined ? o.useA : true;

			var joint, n;

			switch ( o.type ) {

				case "joint_p2p":
					n = 1;
					joint = new Ammo.btPoint2PointConstraint( b1, b2, posA, posB );
					if ( o.strength ) joint.get_m_setting().set_m_tau( o.strength );
					if ( o.damping ) joint.get_m_setting().set_m_damping( o.damping );
					if ( o.impulse ) joint.get_m_setting().set_m_impulseClamp( o.impulse );
					break;
				case "joint_hinge": case "joint": n = 2; joint = new Ammo.btHingeConstraint( b1, b2, posA, posB, axeA, axeB, useA ); break;
				case "joint_hinge_ref": n = 2; joint = new Ammo.btHingeConstraint( b1, b2, formA, formB, useA ); break;
				case "joint_slider": n = 3; joint = new Ammo.btSliderConstraint( b1, b2, formA, formB, useA ); break;
				case "joint_conetwist": n = 4; joint = new Ammo.btConeTwistConstraint( b1, b2, formA, formB ); break;
				case "joint_dof": n = 5; joint = new Ammo.btGeneric6DofConstraint( b1, b2, formA, formB, useA ); break;
				case "joint_spring_dof": n = 6; joint = new Ammo.btGeneric6DofSpringConstraint( b1, b2, formA, formB, useA ); break;
				case "joint_fixe": n = 7; joint = new Ammo.btFixedConstraint( b1, b2, formA, formB ); break;
	            //case "joint_gear": joint = new Ammo.btGearConstraint( b1, b2, point1, point2, o.ratio || 1); break;// missing
	            //case "joint_universal": joint = new Ammo.btUniversalConstraint( b1, b2, point1, point2, o.ratio || 1); break;// missing

			}

			

			// EXTRA SETTING

			if ( o.breaking && joint.setBreakingImpulseThreshold ) joint.setBreakingImpulseThreshold( o.breaking );

			// hinge

			// 0 _ limite min / swingSpan1
			// 1 _ limite max / swingSpan2
			// 2 _ twistSpan
			// 2 / 3 _ softness   0->1, recommend ~0.8->1  describes % of limits where movement is free.  beyond this softness %, the limit is gradually enforced until the "hard" (1.0) limit is reached.
			// 3 / 4 _ bias  0->1?, recommend 0.3 +/-0.3 or so.   strength with which constraint resists zeroth order (angular, not angular velocity) limit violation.
			// 4 / 5 _ relaxation  0->1, recommend to stay near 1.  the lower the value, the less the constraint will fight velocities which violate the angular limits.
			if ( o.limit && joint.setLimit ) {

				if ( o.type === 'joint_hinge' || o.type === 'joint' ) joint.setLimit( o.limit[ 0 ] * math.torad, o.limit[ 1 ] * math.torad, o.limit[ 2 ] || 0.9, o.limit[ 3 ] || 0.3, o.limit[ 4 ] || 1.0 );
				if ( o.type === 'joint_conetwist' ) {

					//console.log(joint)

					joint.setLimit( 3, o.limit[ 0 ] * math.torad );//m_twistSpan // x
					joint.setLimit( 4, o.limit[ 2 ] * math.torad );//m_swingSpan2 // z
					joint.setLimit( 5, o.limit[ 1 ] * math.torad );//m_swingSpan1 // y


					//joint.setLimit( o.limit[1]*math.torad, o.limit[2]*math.torad, o.limit[0]*math.torad, o.limit[3] || 0.9, o.limit[4] || 0.3, o.limit[5] || 1.0 );

				}

			}
			if ( o.motor && joint.enableAngularMotor ) joint.enableAngularMotor( o.motor[ 0 ], o.motor[ 1 ], o.motor[ 2 ] );

			// slider

			if ( joint.setLowerLinLimit ) {

				if ( o.linLower ) joint.setLowerLinLimit( o.linLower * root.invScale );
				if ( o.linUpper ) joint.setUpperLinLimit( o.linUpper * root.invScale );

			}

			if ( joint.setLowerAngLimit ) {

				if ( o.angLower ) joint.setLowerAngLimit( o.angLower * math.torad );
				if ( o.angUpper ) joint.setUpperAngLimit( o.angUpper * math.torad );
				
			}

			// 6 dof

			if ( joint.setLinearLowerLimit ) {

				if ( o.linLower ) joint.setLinearLowerLimit( posA.fromArray( o.linLower ).multiplyScalar( root.invScale ));
				if ( o.linUpper ) joint.setLinearUpperLimit( posB.fromArray( o.linUpper ).multiplyScalar( root.invScale ));

			}

			if ( joint.setAngularLowerLimit ) {

				if ( o.angLower ) joint.setAngularLowerLimit( axeA.set( o.angLower[ 0 ] * math.torad, o.angLower[ 1 ] * math.torad, o.angLower[ 2 ] * math.torad ));
				if ( o.angUpper ) joint.setAngularUpperLimit( axeB.set( o.angUpper[ 0 ] * math.torad, o.angUpper[ 1 ] * math.torad, o.angUpper[ 2 ] * math.torad ));
				
			}

			// dof

			if ( o.feedback ) joint.enableFeedback( o.feedback );
			//if(o.param) joint.setParam( o.param[0], o.param[1], o.param[1] );//

			if ( o.angularOnly && joint.setAngularOnly ) joint.setAngularOnly( o.angularOnly );
			if ( o.enableMotor && joint.enableMotor ) joint.enableMotor( o.enableMotor );
			if ( o.maxMotorImpulse && joint.setMaxMotorImpulse ) joint.setMaxMotorImpulse( o.maxMotorImpulse );
			if ( o.motorTarget && joint.setMotorTarget ) {

				var q = math.quaternion().fromArray( o.motorTarget );
				joint.setMotorTarget( q );
				q.free();

			}



			// 6 DOF
			// < 3 position
			// > 3 rotation

			if ( o.damping && joint.setDamping ) {

				for ( var i = 0; i < 6; i ++ ) joint.setDamping( i, o.damping[ i ] );

			}

			if ( o.spring && joint.enableSpring && joint.setStiffness ) {

				for ( var i = 0; i < 6; i ++ ) {

					joint.enableSpring( i, o.spring[ i ] === 0 ? false : true );
					joint.setStiffness( i, o.spring[ i ] );

				}

			}

			if ( o.param && joint.setParam ) {

				for ( var i = 0, lng = o.param.length; i < lng; i ++ ) {

					joint.setParam( o.param[ i ][ 0 ], o.param[ i ][ 1 ], i );// 2, 0.475   //BT_CONSTRAINT_STOP_CFM, 1.0e-5f, 5 // add some damping

				}

			}

			var collision = o.collision !== undefined ? o.collision : false;


			joint.isJoint = true;
			joint.name = name;
			joint.nType = n;
			joint.type = 'joint';

			root.world.addConstraint( joint, collision ? false : true );
			this.joints.push( joint );

			map.set( name, joint );


			/*if(o.type==='joint_spring_dof'){
				var aa= []
				joint.getFrameOffsetA().toArray(aa)
				console.log( o.type, joint, aa );
			}*/

			// free math
			posA.free();
			posB.free();
			axeA.free();
			axeB.free();
			formA.free();
			formB.free();
			o = null;

		}


	} );

	/*global Ammo*/

	/**
	* @author lth / https://github.com/lo-th/
	*/

	//--------------------------------------------------
	//  AMMO SOFTBODY
	//--------------------------------------------------

	function SoftBody() {

		this.ID = 0;
		this.softs = [];

	}

	Object.assign( SoftBody.prototype, {

		step: function ( AR, N ) {

			var softPoints = N, n, s, j;

			this.softs.forEach( function ( b ) {

				s = b.get_m_nodes(); // get vertrices list
				j = s.size();

				while ( j -- ) {

					n = softPoints + ( j * 3 );
					s.at( j ).get_m_x().toArray( AR, n, root.scale );

				}

				softPoints += s.size() * 3;

			} );

		},

		getNodes: function ( b ) {

			var list = [];

			var s = b.get_m_nodes(), r; // get vertrices list
			var lng = s.size();

			for ( var j = 0; j < lng; j ++ ) {

				//n = ( j * 3 );
				r = s.at( j ).get_m_x().toArray();
				if ( r[ 1 ] > 300 ) list.push( j );
				//list.push( r );


			}

			return list;

		},

		/*move: function ( o ) {

			if ( ! map.has( o.name ) ) return;
			var soft = map.get( o.name );

			var s = soft.get_m_nodes();
			//console.log(s)
			var j = s.size();
			while ( j -- ) {
				//pos = s.at( j ).get_m_x().add( new Ammo.btVector3(0, 10, 0) );
			}

			soft.set_m_nodes( s );

		},*/

		clear: function () {

			while ( this.softs.length > 0 ) this.destroy( this.softs.pop() );
			this.ID = 0;

		},

		destroy: function ( b ) {

			root.world.removeSoftBody( b );
			Ammo.destroy( b );
			map.delete( b.name );

		},

		remove: function ( name ) {

			if ( ! map.has( name ) ) return;
			var b = map.get( name );

			var n = this.softs.indexOf( b );
			if ( n !== - 1 ) {

				this.softs.splice( n, 1 );
				this.destroy( b );

			}

		},

		addAreo: function ( o ) {

			if ( ! map.has( o.soft )) return;
			var soft = map.get( o.soft );
			var p0 = math.vector3().fromeArray( o.wind );
			var i = o.nodes.length;
			while(i--) soft.addAeroForceToNode( p0, o.nodes[i] );
			p0.free();

		},

		addAnchor: function ( o ) {

			if ( ! map.has( o.soft ) || ! map.has( o.body ) ) return;
			var collision = o.collision || false;
			var soft = map.get( o.soft );
			var body = map.get( o.body );

			var i = o.nodes.length;
			while(i--) soft.appendAnchor( o.nodes[i], body, collision ? false : true, o.influence || 1 );

		},

		add: function ( o ) {

			var name = o.name !== undefined ? o.name : 'soft' + this.ID ++;

			// delete old if same name
			this.remove( name );

			var worldInfo = root.world.getWorldInfo();

			var gendiags = o.gendiags || true;
			//var fixed = o.fixed || 0;

			o.size = o.size == undefined ? [ 1, 1, 1 ] : o.size;
			o.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
			o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;
			o.div = o.div == undefined ? [ 64, 64 ] : o.div;

			if ( root.scale !== 1 ) {

				o.pos = math.vectomult( o.pos, root.invScale );
				o.size = math.vectomult( o.size, root.invScale );

			}

			var p0 = math.vector3();
			var p1 = math.vector3();
			var p2 = math.vector3();
			var p3 = math.vector3();
			var p4 = math.vector3();
			var trans = math.transform();

			var softBodyHelpers = new Ammo.btSoftBodyHelpers();

			var body;

			switch ( o.type ) {

				case 'softCloth':

					var mw = o.size[ 0 ] * 0.5;
					var mh = o.size[ 2 ] * 0.5;

					p1.fromArray( [ - mw, 0, - mh ], 0, root.invScale );
					p2.fromArray( [ mw, 0, - mh ], 0, root.invScale );
					p3.fromArray( [ - mw, 0, mh ], 0, root.invScale );
					p4.fromArray( [ mw, 0, mh ], 0, root.invScale );

					body = softBodyHelpers.CreatePatch( worldInfo, p1, p2, p3, p4, o.div[ 0 ], o.div[ 1 ], o.fixed || 0, gendiags );
					body.softType = 1;

					break;

				case 'softRope':

					p1.fromArray( o.start || [ - 10, 0, 0 ], 0, root.invScale );
					p2.fromArray( o.end || [ 10, 0, 0 ], 0, root.invScale );

					var nseg = o.numSegment || 10;
					nseg -= 2;

					//if ( o.margin === undefined ) o.margin = o.radius || 0.2;
					body = softBodyHelpers.CreateRope( worldInfo, p1, p2, nseg, o.fixed || 0 );
					//body.setTotalMass(o.mass);
					body.softType = 2;

					break;

				case 'softEllips':

					p1.fromArray( o.center || [ 0, 0, 0 ], 0, root.invScale );
					p2.fromArray( o.radius || [ 3, 3, 3 ], 0, root.invScale );

					body = softBodyHelpers.CreateEllipsoid( worldInfo, p1, p2, o.vertices || 128 );
					body.softType = 3;

					var a = [];
					var b = body.get_m_nodes();
					var j = b.size(), n, node, p;
					while ( j -- ) {

						n = ( j * 3 );
						node = b.at( j );
						p = node.get_m_x();
						a[ n ] = p.x();
						a[ n + 1 ] = p.y();
						a[ n + 2 ] = p.z();

					}

					o.lng = b.size();
					o.a = a;

					self.postMessage( { m: 'ellipsoid', o: o } );

					break;

					/*case 'softConvex': // BUG !!

				    //var j = o.v.length;
				    //while( j-- ) { o.v[ j ] *= root.invScale; }

					var lng = o.v.length / 3;
					var arr = [];
					var i = 0, n;

					for ( i = 0; i<lng; i++ ) {

						n = i * 3;
						p1.fromArray( o.v, n, root.invScale );
						arr.push( p1.clone() );
						//body.get_m_nodes().at( i ).set_m_x( p1 );
						//body.get_m_nodes().at( i ).set_m_x(new Ammo.btVector3(o.v[n], o.v[n+1], o.v[n+2]));

					}





					body = softBodyHelpers.CreateFromConvexHull( worldInfo, arr, lng, o.randomize || false );
					//body = softBodyHelpers.CreateFromConvexHull( worldInfo, arr, lng, o.randomize || true );
					//body.generateBendingConstraints( 2 );
					body.softType = 4;



					// free node
					i = lng;
					//while ( i -- ) arr[i].free();
					// force nodes
					//var i = lng, n;
					for ( i = 0; i<lng; i++ ) {

						n = i * 3;
						p1.fromArray( o.v, n, root.invScale );
						body.get_m_nodes().at( i ).set_m_x( p1 );
						//body.get_m_nodes().at( i ).set_m_x(new Ammo.btVector3(o.v[n], o.v[n+1], o.v[n+2]));

					}

					//console.log( body.get_m_nodes().size(), lng )

					break;*/

				case 'softMesh': case 'softConvex':

				    var j = o.v.length;
				    while ( j -- ) {

						o.v[ j ] *= root.invScale;

					}

					body = softBodyHelpers.CreateFromTriMesh( worldInfo, o.v, o.i, o.ntri, o.randomize || true );
					body.softType = 5;

					break;

			}



			var sb = body.get_m_cfg();

			//console.log(sb.get_kVC())

			if ( o.viterations !== undefined ) sb.set_viterations( o.viterations );// Velocities solver iterations 0 // velocityIterations
			if ( o.piterations !== undefined ) sb.set_piterations( o.piterations );// Positions solver iterations 1 // positionIterations
			if ( o.diterations !== undefined ) sb.set_diterations( o.diterations );// Drift solver iterations 0 // driftIterations
			if ( o.citerations !== undefined ) sb.set_citerations( o.citerations );// Cluster solver iterations 4 // clusterIterations

			sb.set_collisions( 0x11 );

			if ( o.friction !== undefined ) sb.set_kDF( o.friction );// Dynamic friction coefficient [0,1] def 0.2
			if ( o.damping !== undefined ) sb.set_kDP( o.damping );// Damping coefficient [0,1] def:0
			if ( o.pressure !== undefined ) sb.set_kPR( o.pressure );// Pressure coefficient [-inf,+inf] def:0

			if ( o.drag !== undefined ) sb.set_kDG( o.drag );// Drag coefficient [0,+inf] def:0
			if ( o.lift !== undefined ) sb.set_kLF( o.lift );// Lift coefficient [0,+inf] def:0

			if ( o.volume !== undefined ) sb.set_kVC( o.volume ); // Volume conversation coefficient [0,+inf] def:0
			if ( o.matching !== undefined ) sb.set_kMT( o.matching );// Pose matching coefficient [0,1] def:0

			if ( o.hardness !== undefined ) {

				sb.set_kCHR( o.hardness );// Rigid contacts hardness [0,1] def : 1.0
				sb.set_kKHR( o.hardness );// Kinetic contacts hardness [0,1] def : 0.1
				sb.set_kSHR( o.hardness );// Soft contacts hardness [0,1] def: 1.0
				sb.set_kAHR( o.hardness );// Anchors hardness [0,1] def:0.7

			}

			if ( o.timescale !== undefined ) sb.set_timescale( o.timescale );// def:1
			if ( o.maxvolume !== undefined ) sb.set_maxvolume( o.maxvolume );// Maximum volume ratio for pose def:1
			

			/*
	        kSRHR_CL;               // Soft vs rigid hardness [0,1] (cluster only)
	        kSKHR_CL;               // Soft vs kinetic hardness [0,1] (cluster only)
	        kSSHR_CL;               // Soft vs soft hardness [0,1] (cluster only)
	        kSR_SPLT_CL;    // Soft vs rigid impulse split [0,1] (cluster only)
	        kSK_SPLT_CL;    // Soft vs rigid impulse split [0,1] (cluster only)
	        kSS_SPLT_CL;    // Soft vs rigid impulse split [0,1] (cluster only)
	        */


	        var mat = body.get_m_materials().at( 0 );

	        //mat.set_m_flags(0);// def 1


	        //console.log(body, sb, mat)



			if ( o.stiffness !== undefined ) { // range (0,1)

				
				mat.set_m_kLST( o.stiffness ); // linear
				mat.set_m_kAST( o.stiffness ); // angular
				mat.set_m_kVST( o.stiffness ); // volume

				

			}

			if( o.bendingConstraint  !== undefined  ){
				// ( int distance > 1, material )
				body.generateBendingConstraints( o.bendingConstraint, mat );

			}

			//body.set_m_cfg( sb );

			body.setTotalMass( o.mass || 0, o.fromfaces || false );

			if( o.cluster  !== undefined  ){

				body.generateClusters( o.cluster, o.maxClusterIterations || 8192 );
				
			}

			//body.setPose( true, true );
			if ( o.restitution !== undefined ) body.setRestitution( o.restitution );
			if ( o.rolling !== undefined ) body.setRollingFriction( o.rolling );
			if ( o.flag !== undefined ) body.setCollisionFlags( o.flag );
			if ( o.margin !== undefined ) Ammo.castObject( body, Ammo.btCollisionObject ).getCollisionShape().setMargin( o.margin * root.invScale );// def 0.25


			//body.translate( p0.fromArray( o.pos ) )

			// apply position and rotation
			trans.identity().fromArray( o.pos.concat( o.quat ) );
			body.transform( trans );



			// Soft-soft and soft-rigid collisions
			root.world.addSoftBody( body, o.group || 1, o.mask || - 1 );


			body.setActivationState( o.state || 4 );
			body.points = body.get_m_nodes().size();
			body.name = name;

			body.type = 'soft';

			this.softs.push( body );

			map.set( name, body );

			// free math
			p0.free();
			p1.free();
			p2.free();
			p3.free();
			p4.free();
			trans.free();
			o = null;

		}

	} );

	/*global Ammo*/

	/**
	* @author lth / https://github.com/lo-th/
	*/

	//--------------------------------------------------
	//  AMMO TERRAIN
	//--------------------------------------------------

	function Terrain() {

		this.ID = 0;
		this.terrains = [];

	}

	Object.assign( Terrain.prototype, {

		step: function () {

			this.terrains.forEach( function ( b ) {

				b.update();

			} );

		},

		clear: function () {

			while ( this.terrains.length > 0 ) this.destroy( this.terrains.pop() );
			this.ID = 0;

		},

		destroy: function ( t ) {

			root.world.removeCollisionObject( t.body );
			t.clear();
			map.delete( t.name );

		},

		remove: function ( name ) {

			if ( ! map.has( name ) ) return;
			var t = map.get( name );

			var n = this.terrains.indexOf( t );
			if ( n !== - 1 ) {

				this.terrains.splice( n, 1 );
				this.destroy( t );

			}

		},

		setData: function ( o ) {

			if ( ! map.has( o.name ) ) return;
			var t = map.get( o.name );
			t.setData( o.heightData );

		},

		add: function ( o ) {

			var name = o.name !== undefined ? o.name : 'terrain' + this.ID ++;

			// delete old if same name
			this.remove( name );

			var group = o.group === undefined ? 2 : o.group;
			var mask = o.mask === undefined ? - 1 : o.mask;

			var t = new LandScape( name, o );

			root.world.addCollisionObject( t.body, group, mask );

			this.terrains.push( t );

			map.set( name, t );

		}

	} );


	//--------------------------------------------------
	//
	//  LandScape CLASS
	//
	//--------------------------------------------------

	function LandScape( name, o ) {

		var trans = math.transform();
		var p1 = math.vector3();

		this.needsUpdate = false;
		this.data = null;
		this.tmpData = null;
		this.dataHeap = null;
		this.type = 'terrain';

		if ( root.scale !== 1 ) {

			o.pos = math.vectomult( o.pos, root.invScale );
			o.size = math.vectomult( o.size, root.invScale );

		}

		var size = o.size === undefined ? [ 1, 1, 1 ] : o.size;
		var sample = o.sample === undefined ? [ 64, 64 ] : o.sample;
		var pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
		var quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;

		var mass = o.mass === undefined ? 0 : o.mass;
		var margin = o.margin === undefined ? 0.02 : o.margin;
		var friction = o.friction === undefined ? 0.5 : o.friction;
		var restitution = o.restitution === undefined ? 0 : o.restitution;

		var flag = o.flag === undefined ? 1 : o.flag;


		// This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
		var heightScale = o.heightScale === undefined ? 1 : o.heightScale;

		// Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
		var upAxis = o.upAxis === undefined ? 1 : o.upAxis;

		// hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
		var hdt = o.hdt || "PHY_FLOAT";

		// Set this to your needs (inverts the triangles)
		var flipEdge = o.flipEdge !== undefined ? o.flipEdge : false;

		// Creates height data buffer in Ammo heap
		this.setData( o.heightData );
		this.update();

		//var shape = new Ammo.btHeightfieldTerrainShape( sample[0], sample[1], terrainData[name], heightScale, -size[1], size[1], upAxis, hdt, flipEdge );
		var shape = new Ammo.btHeightfieldTerrainShape( sample[ 0 ], sample[ 1 ], this.data, heightScale, - size[ 1 ], size[ 1 ], upAxis, hdt, flipEdge );

		//console.log(shape.getMargin())

		p1.set( size[ 0 ] / sample[ 0 ], 1, size[ 2 ] / sample[ 1 ] );
		shape.setLocalScaling( p1 );

		shape.setMargin( margin );

		trans.identity().fromArray( pos.concat( quat ) );

		p1.set( 0, 0, 0 );
		//shape.calculateLocalInertia( mass, p1 );
		var motionState = new Ammo.btDefaultMotionState( trans );
		var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, p1 );

		rbInfo.set_m_friction( friction );
		rbInfo.set_m_restitution( restitution );

		var body = new Ammo.btRigidBody( rbInfo );
		body.setCollisionFlags( flag );

		body.name = name;

		this.name = name;
		this.body = body;

		Ammo.destroy( rbInfo );

		trans.free();
		p1.free();

		o = null;

	}

	Object.assign( LandScape.prototype, {

		setData: function ( data ) {

			this.tmpData = data;
			this.nDataBytes = this.tmpData.length * this.tmpData.BYTES_PER_ELEMENT;
			this.needsUpdate = true;

		},

		update: function () {

			if ( ! this.needsUpdate ) return;

			this.malloc();
			//self.postMessage( { m:'terrain', o: { name: this.name } } );
			this.needsUpdate = false;
			this.tmpData = null;

		},

		clear: function () {


			Ammo.destroy( this.body );
			Ammo._free( this.dataHeap.byteOffset );
			//Ammo.destroy( this.data );

			this.body = null;
			this.data = null;
			this.tmpData = null;
			this.dataHeap = null;

		},

		malloc: function () {

			//var nDataBytes = this.tmpData.length * this.tmpData.BYTES_PER_ELEMENT;
			if ( this.data === null ) this.data = Ammo._malloc( this.nDataBytes );
			this.dataHeap = new Uint8Array( Ammo.HEAPU8.buffer, this.data, this.nDataBytes );
			this.dataHeap.set( new Uint8Array( this.tmpData.buffer ) );

		},

	} );

	/*global Ammo*/

	/**
	* @author lth / https://github.com/lo-th/
	*/

	// max 6 wheel
	// array structure
	// 0 _ body _ speed: 0, pos : 0,0,0, quat: 0,0,0,0 _8
	// 1 _ w0   _

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

		addExtra: function () {

		},

		setVehicle: function ( o ){

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
			var sho = {};

			if ( shapeType == 'mesh' ) sho = { type: 'mesh', v: o.v, mass: 1 };
			else if ( shapeType == 'convex' ) sho = { type: 'convex', v: o.v };
			else sho = { type: 'box', size: o.size };

			var shape = this.addExtra( sho, 'isShape' );

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

		}

	} );


	function Car( name, o, shape ) {

		// http://www.asawicki.info/Mirror/Car%20Physics%20for%20Games/Car%20Physics%20for%20Games.html
		// https://github.com/yanzuzu/BulletPhysic_Vehicle

		this.name = name;

		this.chassis = null;
		this.body = null;
		this.steering = 0;
		this.breaking = 0;
		this.motor = 0;

		this.gearRatio = [ - 1, 0, 2.3, 1.8, 1.3, 0.9, 0.5 ];
		// acceleration / topSpeed

		this.limitAngular = [1,1,1];


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

			var j = this.data.nWheel, w, t;

			while ( j -- ) {

				this.chassis.updateWheelTransform( j, true );
				t = this.chassis.getWheelTransformWS( j );

				// supension info
				Ar[ n + 56 + j ] = this.chassis.getWheelInfo( j ).get_m_raycastInfo().get_m_suspensionLength() * scale;

				w = 8 * ( j + 1 );
				t.toArray( Ar, n + w + 1, scale );

				if ( j === 0 ) Ar[ n + w ] = this.chassis.getWheelInfo( 0 ).get_m_steering();
				if ( j === 1 ) Ar[ n + w ] = this.chassis.getWheelInfo( 1 ).get_m_steering();
				if ( j === 2 ) Ar[ n + w ] = this.steering;//this.chassis.getWheelInfo( 0 ).get_m_steering();

			}

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

				if ( data[ i ] ) data[ i ] = o[ i ];

			}

			// force value for bool
			data.autoSuspension = o.autoSuspension || false;

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

	/*global Ammo*/

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

	/*global Ammo*/

	/**
	* @author lth / https://github.com/lo-th/
	*/

	//--------------------------------------------------
	//  AMMO CHARACTER
	//--------------------------------------------------

	function Collision() {

		this.ID = 0;
		this.pairs = [];
		//this.contacts = [];

	}

	Object.assign( Collision.prototype, {

		step: function ( AR, N ) {

			var n;

			this.pairs.forEach( function ( pair, id ) {

				n = N + id;

				pair.result = 0;
				if ( pair.b !== undefined ) root.world.contactPairTest( pair.a, pair.b, pair.f );
				else root.world.contactTest( pair.a, pair.f );
				AR[ n ] = pair.result;

			} );

		},

		clear: function () {

			while ( this.pairs.length > 0 ) this.destroy( this.pairs.pop() );
			//this.contacts = [];
			this.ID = 0;

		},

		destroy: function ( p ) {

			p.clear();
			map.delete( p.name );

		},

		remove: function ( name ) {

			if ( ! map.has( name ) ) return;
			var p = map.get( name );

			var n = this.pairs.indexOf( p );
			if ( n !== - 1 ) {

				this.pairs.splice( n, 1 );
				this.destroy( p );

			}

		},

		add: function ( o ) {

			var name = o.name !== undefined ? o.name : 'pair' + this.ID ++;

			if ( ! map.has( o.b1 ) ) return;

			var a = map.get( o.b1 );
			var b = o.b2 !== undefined ? ( map.has( o.b2 ) ? map.get( o.b2 ) : undefined ) : undefined;

			var p = new Pair( a, b, name );
			this.pairs.push( p );
			//this.contacts.push( 0 );

			map.set( name, p );

		}

	} );


	//--------------------------------------------------
	//
	//  CONTACT CLASS
	//
	//--------------------------------------------------

	function Pair( a, b, name ) {

		this.name = name;

		this.result = 0;

		this.pa = [ 0, 0, 0 ];
		this.pb = [ 0, 0, 0 ];
		this.nb = [ 0, 0, 0 ];
		this.distance = 0;
		this.impulse = 0;
		this.maxImpulse = 0;

		this.a = a;
		this.b = b;

		this.f = new Ammo.ConcreteContactResultCallback();
		///console.log(this.f)
		this.f.addSingleResult = function ( ) {

			//this.f.addSingleResult = function ( manifoldPoint, collisionObjectA, id0, index0, collisionObjectB, id1, index1 ) {
		    /*var manifold = Ammo.wrapPointer( manifoldPoint, Ammo.btManifoldPoint )

		    this.nb = manifold.m_normalWorldOnB.toArray();
		    this.pa = manifold.m_positionWorldOnA.toArray();
		    this.pb = manifold.m_positionWorldOnB.toArray();

		    this.distance = manifold.getDistance();
		    this.impulse = manifold.getAppliedImpulse();
		    if ( this.impulse > this.maxImpulse ) {
		    	this.maxImpulse = this.impulse;
		    }*/

		  //  console.log( this.pa, this.pb, this.nb );

		    //console.log( this.maxImpulse );



			this.result = 1;

		}.bind( this );


	}

	Object.assign( Pair.prototype, {

		clear: function () {

			this.a = null;
			this.b = null;
			Ammo.destroy( this.f );

		}

	} );

	/*global importScripts Ammo*/

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
	self.Module = { TOTAL_MEMORY: 256 * 1024 * 1024 };// TODO don't work ???

	self.onmessage = function ( e ) {

		// ------- buffer data
		if ( e.data.Ar ) exports.engine.setAr( e.data.Ar );

		//if( engine[ e.data.m ] ) console.log(e.data.m);
		// ------- engine function
		exports.engine[ e.data.m ]( e.data.o );

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

	exports.engine = ( function () {

		//var world = null;
		var Ar, ArPos, ArMax;
		var timestep = 1 / 60;
		var fixed = false;
		var substep = 2;

		var isBuffer = false;
		var isSoft = false;
		//var gravity = null;

		var solver, solverSoft, collisionConfig, dispatcher, broadphase;

		var tmpForces = [];
		var tmpMatrix = [];
		var tmpOption = [];

		var tmpRemove = [];

		var carName = "";
		var heroName = "";

		var zero = null;

		var numBreak = 0;

		var ray = null;



		var rigidBody, softBody, constraint, terrains, vehicles, character, collision;

		exports.engine = {

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

			setDrive: function ( name ) {

				carName = name;

			},

			setMove: function ( name ) {

				heroName = name;

			},
			setAngle: function ( o ) {

				root.angle = o.angle;

			},

			step: function ( o ) {

				root.key = o.key;

				//tmpRemove = tmpRemove.concat( o.remove );
				this.stepRemove();

				vehicles.control( carName );
				character.control( heroName );

				this.stepMatrix();
				this.stepOption();
				this.stepForces();
				

				terrains.step();

				// breakable object
				if ( numBreak !== 0 ) this.stepBreak();

				if ( fixed ) root.world.stepSimulation( o.delta, substep, timestep );
				else root.world.stepSimulation( o.delta, substep );

				rigidBody.step( Ar, ArPos[ 0 ] );
				collision.step( Ar, ArPos[ 1 ] );
				character.step( Ar, ArPos[ 2 ] );
				vehicles.step( Ar, ArPos[ 3 ] );
				softBody.step( Ar, ArPos[ 4 ] );

				// breakable object
				//if( numBreak !== 0 ) this.stepBreak();


				if ( isBuffer ) self.postMessage( { m: 'step', Ar: Ar }, [ Ar.buffer ] );
				else self.postMessage( { m: 'step', Ar: Ar } );

			},

			reset: function ( o ) {

				numBreak = 0;

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

					exports.engine.createWorld( o.option );
					exports.engine.set( o.option );

					rigidBody = new RigidBody();
					constraint = new Constraint();
					softBody = new SoftBody();
					terrains = new Terrain();
					vehicles = new Vehicle();
					character = new Character();
					collision = new Collision();

					ray = new Ammo.ClosestRayResultCallback();


					vehicles.addExtra = rigidBody.add;

					self.postMessage( { m: 'initEngine' } );

				} );

			},

			//-----------------------------
			// REMOVE
			//-----------------------------

			remove: function ( name ) {

				if ( ! map.has( name ) ) return;
				var b = map.get( name );

				switch( b.type ){

					case 'solid': case 'body' :
					    rigidBody.remove( name );
					break;
					case 'soft':
					    softBody.remove( name );
					break;
					case 'terrain':
					    terrains.remove( name );
					break;
					case 'joint':
					    constraint.remove( name );
					break;

				}

				//rigidBody.remove( name );

			},


			//-----------------------------
			// ADD
			//-----------------------------

			add: function ( o ) {

				o.type = o.type === undefined ? 'box' : o.type;

				if ( o.breakable !== undefined ) {

					if ( o.breakable ) numBreak ++;

				}

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

				softBody.addAnchor( o );

				//if ( ! map.has( o.soft ) || ! map.has( o.body ) ) return;
				//var collision = o.collision || false;
				//p1.fromArray(o.pos);
				//map.get( o.soft ).appendAnchor( o.node, map.get( o.body ), collision ? false : true, o.influence || 1 );
				//p1.free();

			},

			//-----------------------------
			// CONFIG
			//-----------------------------

			setTerrain: function ( o ) {

				terrains.setData( o );

			},

			setVehicle: function ( o ) {

				vehicles.setVehicle( o );

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
				collisionConfig = isSoft ? new Ammo.btSoftBodyRigidBodyCollisionConfiguration() : new Ammo.btDefaultCollisionConfiguration();
				dispatcher = new Ammo.btCollisionDispatcher( collisionConfig );



				switch ( o.broadphase === undefined ? 2 : o.broadphase ) {

					//case 0: broadphase = new Ammo.btSimpleBroadphase(); break;
					case 1: var s = 1000; broadphase = new Ammo.btAxisSweep3( new Ammo.btVector3( - s, - s, - s ), new Ammo.btVector3( s, s, s ), 4096 ); break;//16384;
					case 2: broadphase = new Ammo.btDbvtBroadphase(); break;

				}

				root.world = isSoft ? new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfig, solverSoft ) : new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfig );




				//console.log(dispatcher)
				// This is required to use btGhostObjects ??
				//root.world.getPairCache().setInternalGhostPairCallback( new Ammo.btGhostPairCallback() );
				/*
				root.world.getSolverInfo().set_m_splitImpulsePenetrationThreshold(0);
				root.world.getSolverInfo().set_m_splitImpulse( true );
				*/

			},

			clearWorld: function () {

				Ammo.destroy( root.world );
				Ammo.destroy( solver );
				if ( solverSoft !== null ) Ammo.destroy( solverSoft );
				Ammo.destroy( collisionConfig );
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

				timestep = o.fps !== undefined ? 1 / o.fps : 1 / 60;
				substep = o.substep !== undefined ? o.substep : 2;
				fixed = o.fixed !== undefined ? o.fixed : false;

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

				//if( o.constructor !== Array ) tmpForces.push(o);
				//else
				tmpForces = tmpForces.concat( o );

			},

			stepForces: function () {

				while ( tmpForces.length > 0 ) this.applyForces( tmpForces.pop() );

			},

			applyForces: function ( o ) {

				if ( ! map.has( o.name ) ) return;
				var b = map.get( o.name );

				//var type = r[ 1 ] || 'force';
				var p1 = math.vector3();
				var p2 = math.vector3();

				if ( o.direction !== undefined ) p1.fromArray( math.vectomult( o.direction, root.invScale ) );
				if ( o.distance !== undefined ) p2.fromArray( math.vectomult( o.distance, root.invScale ) );
				else p2.zero();

				switch ( o.type ) {

					case 'force' : case 0 : b.applyForce( p1, p2 ); break;// force , rel_pos
					case 'torque' : case 1 : b.applyTorque( p1 ); break;
					case 'localTorque' : case 2 : b.applyLocalTorque( p1 ); break;
					case 'forceCentral' :case 3 : b.applyCentralForce( p1 ); break;
					case 'forceLocal' : case 4 : b.applyCentralLocalForce( p1 ); break;
					case 'impulse' : case 5 : b.applyImpulse( p1, p2 ); break;// impulse , rel_pos
					case 'impulseCentral' : case 6 : b.applyCentralImpulse( p1 ); break;

						// joint

					case 'motor' : case 7 : b.enableAngularMotor( o.enable || true, o.targetVelocity, o.maxMotor ); break; // bool, targetVelocity float, maxMotorImpulse float

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

			applyMatrix: function ( o ) {

				if ( ! map.has( o.name ) ) return;
				var b = map.get( o.name );

				var t = math.transform();

				if ( o.keepX || o.keepY || o.keepZ || o.keepRot ) { // keep original position

					b.getMotionState().getWorldTransform( t );
					var r = [];
					t.toArray( r );

					if ( o.keepX !== undefined ) o.pos[ 0 ] = r[ 0 ] - o.pos[ 0 ];
					if ( o.keepY !== undefined ) o.pos[ 1 ] = r[ 1 ] - o.pos[ 1 ];
					if ( o.keepZ !== undefined ) o.pos[ 2 ] = r[ 2 ] - o.pos[ 2 ];
					if ( o.keepRot !== undefined ) o.quat = [ r[ 3 ], r[ 4 ], r[ 5 ], r[ 6 ] ];

				}

				t.identity();

				// position and rotation
				if ( o.pos !== undefined ) {

					//o.pos = math.vectomult( o.pos, root.invScale );
					if ( o.rot !== undefined ) o.quat = math.eulerToQuadArray( o.rot, true );// is euler degree
					if ( o.quat !== undefined ) o.pos = o.pos.concat( o.quat );
					
					t.fromArray( o.pos, 0, root.invScale );

				}

				if ( o.noVelocity ) {

					b.setAngularVelocity( zero );
					b.setLinearVelocity( zero );

				}



				if ( b.isKinematic ) b.getMotionState().setWorldTransform( t );
				else b.setWorldTransform( t );

				if ( b.type === 'body' ) b.activate();
				if ( b.type === 'solid' ) self.postMessage( { m: 'moveSolid', o: { name: o.name, pos: math.vectomult( o.pos, root.scale ), quat: o.quat } } );

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

				switch( b.type ){
					case 'solid': case 'body' :
					    rigidBody.applyOption( b, o );
					break;
				}

				//if ( b.isRigidBody ) rigidBody.applyOption( b, o );

				/*if ( o.flag !== undefined ) b.setCollisionFlags( o.flag );
				if ( o.state !== undefined ) b.setMotionState( o.state );

				if ( o.friction !== undefined ) b.setFriction( o.friction );
				if ( o.restitution !== undefined ) b.setRestitution( o.restitution );
				if ( o.damping !== undefined ) b.setDamping( o.damping[ 0 ], o.damping[ 1 ] );
				if ( o.rollingFriction !== undefined ) b.setRollingFriction( o.rollingFriction );

				if ( o.linearVelocity !== undefined ) b.setLinearVelocity( o.linearVelocity );
				if ( o.angularVelocity !== undefined ) b.setAngularVelocity( o.angularVelocity );

				if ( o.linearFactor !== undefined ) b.setLinearFactor( o.linearFactor );// btVector3
				if ( o.angularFactor !== undefined ) b.setAngularFactor( o.angularFactor );// btVector3

				if ( o.anisotropic !== undefined ) b.setAnisotropicFriction( o.anisotropic[ 0 ], o.anisotropic[ 1 ] );
				if ( o.sleeping !== undefined ) b.setSleepingThresholds( o.sleeping[ 0 ], o.sleeping[ 1 ] );
				if ( o.massProps !== undefined ) b.setMassProps( o.massProps[ 0 ], o.massProps[ 1 ] );

				if ( o.gravity !== undefined ) {

					if ( o.gravity ) b.setGravity( root.gravity ); else b.setGravity( zero );

				}

				// change group and mask collision
				if ( o.group !== undefined ) b.getBroadphaseProxy().set_m_collisionFilterGroup( o.group );
				if ( o.mask !== undefined ) b.getBroadphaseProxy().set_m_collisionFilterMask( o.mask );*/


			},

			//-----------------------------
			// REMOVE
			//-----------------------------

			setRemove: function ( o ) {

				tmpRemove = tmpRemove.concat( o );

			},

			stepRemove: function () {

				while ( tmpRemove.length > 0 ) this.remove( tmpRemove.pop() );

			},

			//-----------------------------
			// BREAKABLE
			//-----------------------------

			stepBreak: function () {

				var manifold, point, contact, maxImpulse, impulse;
				var pos, normal, rb0, rb1, body0, body1;

				for ( var i = 0, il = dispatcher.getNumManifolds(); i < il; i ++ ) {

					manifold = dispatcher.getManifoldByIndexInternal( i );

					body0 = Ammo.castObject( manifold.getBody0(), Ammo.btRigidBody );
					body1 = Ammo.castObject( manifold.getBody1(), Ammo.btRigidBody );

					rb0 = body0.name;
					rb1 = body1.name;

					if ( ! body0.breakable && ! body1.breakable ) continue;

					contact = false;
					maxImpulse = 0;
					for ( var j = 0, jl = manifold.getNumContacts(); j < jl; j ++ ) {

						point = manifold.getContactPoint( j );
						if ( point.getDistance() < 0 ) {

							contact = true;
							impulse = point.getAppliedImpulse();

							if ( impulse > maxImpulse ) {

								maxImpulse = impulse;
								pos = point.get_m_positionWorldOnB().toArray();
								normal = point.get_m_normalWorldOnB().toArray();

							}
							break;

						}

					}

					// If no point has contact, abort
					if ( ! contact ) continue;

					// Subdivision

					if ( body0.breakable && maxImpulse > body0.breakOption[ 0 ] ) {

						self.postMessage( { m: 'makeBreak', o: { name: rb0, pos: math.vectomult( pos, root.scale ), normal: normal, breakOption: body0.breakOption } } );
						//this.remove( rb0 );

					}

					if ( body1.breakable && maxImpulse > body1.breakOption[ 0 ] ) {

						self.postMessage( { m: 'makeBreak', o: { name: rb1, pos: math.vectomult( pos, root.scale ), normal: normal, breakOption: body1.breakOption } } );
						//this.remove( rb1 );

					}

				}

			},

			//-----------------------------
			// RAYCAST
			//-----------------------------

			rayCast: function ( o ) {

				var rayResult = [], r, result;

				for ( var i = 0, lng = o.length; i < lng; i ++ ) {

					r = o[ i ];

					result = {};

					// Reset ray
					ray.set_m_closestHitFraction( 1 );
					ray.set_m_collisionObject( null );
					// Set ray option
					if ( r.origin !== undefined ) ray.get_m_rayFromWorld().fromArray( r.origin, 0, root.invScale );
					if ( r.dest !== undefined ) ray.get_m_rayToWorld().fromArray( r.dest, 0, root.invScale );
					if ( r.group !== undefined ) ray.set_m_collisionFilterGroup( r.group );
				    if ( r.mask !== undefined ) ray.set_m_collisionFilterMask( r.mask );

					// Perform ray test
				    root.world.rayTest( ray.get_m_rayFromWorld(), ray.get_m_rayToWorld(), ray );

				    if ( ray.hasHit() ) {

				    	//console.log(ray)

				    	var name = Ammo.castObject( ray.get_m_collisionObject(), Ammo.btRigidBody ).name;
				    	if ( name === undefined ) name = Ammo.castObject( ray.get_m_collisionObject(), Ammo.btSoftBody ).name;

				    	var normal = ray.get_m_hitNormalWorld();
				    	normal.normalize();
				    	
				    	result = {
				    		hit: true,
				    		name: name,
				    		point: ray.get_m_hitPointWorld().toArray( undefined, 0, root.scale ),
				    		normal: normal.toArray(),
				    	};

				    } else {

				    	result = { hit: false };

					}

				    rayResult.push( result );

				}

			    self.postMessage( { m: 'rayCast', o: rayResult } );

			},





		};

		return exports.engine;

	} )();

	//export var Module = { TOTAL_MEMORY: 512*1024*1024 };

	Object.defineProperty(exports, '__esModule', { value: true });

}));
