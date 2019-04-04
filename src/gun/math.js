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


export { math };

export function mathExtend() {

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
