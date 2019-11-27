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

	getLength: function () {

		return ( 'T:'+math.T.length+' Q:'+math.Q.length+' V:'+math.V3.length );

	},

	destroy: function () {

		while ( math.T.length > 0 ) Ammo.destroy( math.T.pop() );
		while ( math.Q.length > 0 ) Ammo.destroy( math.Q.pop() );
		while ( math.V3.length > 0 ) Ammo.destroy( math.V3.pop() );
		//while ( math.M3.length > 0 ) Ammo.destroy( math.M3.pop() );
		math.M3 = [];

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

		return ( math.M3.length > 0 ) ? math.M3.pop() : new Matrix3();//new Ammo.btMatrix3x3();

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

		eulerFromArrayZYX: function ( array, offset ) {

			offset = offset || 0;
			this.getBasis().setEulerZYX( array[offset], array[offset+1] ,array[offset+2] );
			return this;

		},

		getRow: function ( n ) {

			return this.getBasis().getRow( n );

		},

		/*setFromUnitVectors:  function ( axis ) {

			var center = math.vector3(0,0,0);
			var dir = math.vector3().fromArray( axis );
			var up = math.vector3(0,1,0);

			var q = math.quaternion().setFromUnitVectors( up, dir );

			this.setRotation( q );

			q.free();
			center.free();
			dir.free();
		    up.free();
		},*/

		makeRotationDir: function ( axis ) {

			var dir = math.vector3().fromArray( axis );
			var up = math.vector3(0,1,0);


			var xaxis = math.vector3().cross( up, dir ).normalize();
			var yaxis = math.vector3().cross( dir, xaxis ).normalize();

			var m3 = math.matrix3();

			var q = m3.setV3( xaxis, yaxis, dir ).toQuaternion().normalize();

			this.setRotation( q );

		    m3.free();
		    q.free();
			dir.free();
		    up.free();
		    xaxis.free();
		    yaxis.free();

		},

		setFromDirection: function ( axis ) {

			var dir = math.vector3().fromArray( axis );
			var axe = math.vector3();
			var q = math.quaternion();

		    if( dir.y() > 0.99999 ){

		        q.set( 0, 0, 0, 1 ); 

		    } else if ( dir.y() < - 0.99999 ) {

		    	q.set( 1, 0, 0, 0 );

		    } else {
		    	axe.set( dir.z(), 0, - dir.x() );
		        var radians = Math.acos( dir.y() );
		        q.setFromAxisAngle( axe.toArray(), radians );
		    }

		    this.setRotation( q );

		    dir.free();
		    axe.free();
		    q.free();

		    return this;

		},

		/*setFromDirection: function ( axis ) {

			var zAxis = math.vector3().fromArray( axis );
			var xAxis = math.vector3(1, 0, 0);
			var yAxis = math.vector3(0, 1, 0);

			// Handle the singularity (i.e. bone pointing along negative Z-Axis)...
		    if( zAxis.z() < -0.9999999 ){
		        xAxis.set(1, 0, 0); // ...in which case positive X runs directly to the right...
		        yAxis.set(0, 1, 0); // ...and positive Y runs directly upwards.
		    } else {
		        var a = 1/(1 + zAxis.z());
		        var b = -zAxis.x() * zAxis.y() * a;           
		        xAxis.set( 1 - zAxis.x() * zAxis.x() * a, b, -zAxis.x() ).normalize();
		        yAxis.set( b, 1 - zAxis.y() * zAxis.y() * a, -zAxis.y() ).normalize();
		    }

		    var m3 = math.matrix3();
		    var q = m3.setV3( xAxis, yAxis, zAxis ).toQuaternion();

		    this.setRotation( q );

		    m3.free();
		    xAxis.free();
		    yAxis.free();
		    zAxis.free();
		    q.free();

		    return this;

		},*/

		quartenionFromAxis: function ( array ) {

			var q = math.quaternion().setFromAxis( array );
			this.setRotation( q );
			q.free();

			return this;

		},

		quartenionFromAxisAngle: function ( array, angle ) {

			var q = math.quaternion().setFromAxisAngle( array, angle );
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

		copy: function ( t ) {

			
			this.setOrigin( t.getOrigin() );
			this.setRotation( t.getRotation() );
			return this;

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

		sub: function ( v ) {

			this.setValue( this.x() - v.x(), this.y() - v.y(), this.z() - v.z() );
			return this;

		},

		dot: function ( v ) {

			return this.x() * v.x() + this.y() * v.y() + this.z() * v.z();

		},

		cross: function ( a, b ) {

			var ax = a.x(), ay = a.y(), az = a.z();
		    var bx = b.x(), by = b.y(), bz = b.z();

		    this.set(  ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx );
		    return this;

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

		divideScalar: function ( scalar ) {

			return this.multiplyScalar( 1 / scalar );

		},

		length: function () {

			return Math.sqrt( this.x() * this.x() + this.y() * this.y() + this.z() * this.z() );

		},

		normalize: function () {

			return this.divideScalar( this.length() || 1 );

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

		setFromAxis: function ( axis ) {

			if (axis[ 2 ] > 0.99999) this.setValue( 0, 0, 0, 1 );
			else if (axis[ 2 ] < -0.99999) this.setValue( 1, 0, 0, 0 );
			else {
				/*var p = math.vector3().set( axis[ 1 ], axis[ 0 ], 0 ).normalize();
				var ax = p.toArray();
				p.free();*/

				var ax = [ axis[ 1 ], axis[ 0 ], 0 ];

				var r = Math.acos(axis[ 2 ]);
				this.setFromAxisAngle( ax, r );
			}


			return this;

			 

			/*var val1 = [0,0,0,1]
			var val2 = [0,0,0,1]

			var angle = Math.atan2( axis[ 0 ], axis[ 2 ] );
			var halfAngle = angle * 0.5;

			if( angle === 0 ){

				angle = Math.atan2( axis[ 1 ], axis[ 2 ] );
			    halfAngle = angle * 0.5;

			    val1 = [ 1 * Math.sin( halfAngle ), 0, 0, Math.cos( halfAngle ) ]

				//this.setValue(   1 * Math.sin( halfAngle ), 0, 0, Math.cos( halfAngle ) );

		    } else {
		    	val1 = [ 0, 1 * Math.sin( halfAngle ), 0, Math.cos( halfAngle ) ]
		    	//this.setValue(  0, 1 * Math.sin( halfAngle ), 0, Math.cos( halfAngle )  );
		    }
			
			//return this;


			var a = axis[0];
		    var b = axis[1];
		    var c = axis[2];

		    var x = 0;
		    var y = 0;
		    var z = 1;

		    var dot = a * x + b * y + c * z;
		    var w1 = b * z - c * y;
		    var w2 = c * x - a * z;
		    var w3 = a * y - b * x;

		    val2 = [ 1, w2, w3, dot + Math.sqrt(dot * dot + w1 * w1 + w2 * w2 + w3 * w3) ];

		    return this.fromArray( val1 ).normalize();*/

		},

		setFromAxisAngle: function ( axis, angle ) {

			var halfAngle = angle * 0.5;
			var s = Math.sin( halfAngle );
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

		/*setFromUnitVectors: function ( vFrom, vTo ) {

			// assumes direction vectors vFrom and vTo are normalized

			var EPS = 0.000001;

			var r = vFrom.dot( vTo ) + 1;

			if ( r < EPS ) {

				r = 0;

				if ( Math.abs( vFrom.x() ) > Math.abs( vFrom.z() ) ) {

					this.set( - vFrom.y(), vFrom.x(), 0, r );

				} else {

					this.set( 0, - vFrom.z(), vFrom.y(), r );

				}

			} else {

				// crossVectors( vFrom, vTo ); // inlined to avoid cyclic dependency on Vector3

				this.set( 
					vFrom.y() * vTo.z() - vFrom.z() * vTo.y(),
					vFrom.z() * vTo.x() - vFrom.x() * vTo.z(),
					vFrom.x() * vTo.y() - vFrom.y() * vTo.x(),
					r
				);

			}

			return this.normalize();

		},*/

		length: function () {

			return Math.sqrt( this.x() * this.x() + this.y() * this.y() + this.z() * this.z() + this.w() * this.w() );

		},

		normalize: function () {

			var l = this.length();

			if ( l === 0 ) {

				return this.set(0,0,0,1);

			} else {

				l = 1 / l;
				return this.set( this.x() * l, this.y() * l, this.z() * l, this.w() * l );

			}

		},

		multiply: function ( q ) {

			return this.multiplyQuaternions( this, q );

		},

		multiplyQuaternions: function ( a, b ) {

			var qax = a.x(), qay = a.y(), qaz = a.z(), qaw = a.w();
			var qbx = b.x(), qby = b.y(), qbz = b.z(), qbw = b.w();

			this.set( 

				qax * qbw + qaw * qbx + qay * qbz - qaz * qby, 
				qay * qbw + qaw * qby + qaz * qbx - qax * qbz,
				qaz * qbw + qaw * qbz + qax * qby - qay * qbx,
				qaw * qbw - qax * qbx - qay * qby - qaz * qbz

			);

			return this;

		},

		clone: function () {

			return math.quaternion().set( this.x(), this.y(), this.z(), this.w() );

		},

		free: function () {

			math.freeQuaternion( this );

		}

	} );


	/*Ammo.btMatrix3x3.prototype = Object.assign( Object.create( Ammo.btMatrix3x3.prototype ), {

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

	} );*/

}

// MATRIX3

function Matrix3 () {

	this.elements = [

		1, 0, 0,
		0, 1, 0,
		0, 0, 1

	];

}

Object.assign( Matrix3.prototype, {

	set: function ( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

        var te = this.elements;

        te[ 0 ] = n11; te[ 1 ] = n21; te[ 2 ] = n31;
        te[ 3 ] = n12; te[ 4 ] = n22; te[ 5 ] = n32;
        te[ 6 ] = n13; te[ 7 ] = n23; te[ 8 ] = n33;

        return this;

    },

    setV3: function ( xAxis, yAxis, zAxis ) {

		var te = this.elements;

	    te[ 0 ] = xAxis.x();
	    te[ 3 ] = xAxis.y(); 
	    te[ 6 ] = xAxis.z();
	        
	    te[ 1 ] = yAxis.x();
	    te[ 4 ] = yAxis.y(); 
	    te[ 7 ] = yAxis.z();
	        
	    te[ 2 ] = zAxis.x();
	    te[ 5 ] = zAxis.y(); 
	    te[ 8 ] = zAxis.z();

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


});

// ROOT reference of engine worker

var root = {

	Ar: null,
	ArPos: null,

	constraintDebug: false,

	matrix:[],
	force:[],
	option:[],

	flow:{
		//matrix:{},
		//force:{},
		//option:{},
		ray:[],
		terrain:[],
		vehicle:[],
		
	},

	world: null,
	gravity: null,
	scale: 1,
	invscale: 1,
	angle: 0,
	//margin: 0.04,

	key:[ 0, 0, 0, 0, 0, 0, 0, 0 ],

	post:null,

	makeShape: null,

};

// ROW map

var map = new Map();

/*global Ammo*/

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    GUN - RIGIDBODY
*/

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

			//b.getMotionState().getWorldTransform( trans );
			//trans.toArray( AR, n + 1, scale );

			//if ( b.isKinematic ){ b.getMotionState().getWorldTransform( trans ); trans.toArray( AR, n + 1, scale ); }
			//else 

			// the position at the end of the last physics tick

			b.getMotionState().getWorldTransform( trans );
            trans.toArray( AR, n + 1, scale );


			// non-interpolated position 
			//b.getWorldTransform().toArray( AR, n + 1, scale );

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
		var isGhost = o.ghost || false;

		if( isGhost ) mass = 0;

		var p0 = math.vector3();
		var p1 = math.vector3();
		var p2 = math.vector3();
		var p3 = math.vector3();
		var p4 = math.vector3();
		var trans = math.transform();

		var noMesh = o.noMesh !== undefined ? o.noMesh : false;

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
			if( o.masscenter !== undefined ) o.masscenter = math.vectomult( o.masscenter, root.invScale );

		}

		var shape = null;

		if( o.type === 'hardbox' || o.type === 'hardbox' || o.type === 'realhardbox' || o.type === 'ChamferBox' ) o.type = 'box';
		if( o.type === 'realcylinder' || o.type === 'ChamferCyl' ) o.type = 'cylinder';
		if( o.type === 'realcone' ) o.type = 'cone';
		if( o.type === 'realsphere' ) o.type = 'sphere';

		switch ( o.type ) {

			case 'plane':
				p4.fromArray( o.dir || [ 0, 1, 0 ] );
				shape = new Ammo.btStaticPlaneShape( p4, 0 );
				break;

			case 'box':
				p4.setValue( o.size[ 0 ] * 0.5, o.size[ 1 ] * 0.5, o.size[ 2 ] * 0.5 );
				shape = new Ammo.btBoxShape( p4 );
				break;

			case 'sphere': 
				shape = new Ammo.btSphereShape( o.size[ 0 ] );
				break;

			case 'cylinder':
				p4.setValue( o.size[ 0 ], o.size[ 1 ] * 0.5, o.size[ 2 ] * 0.5 );
				shape = new Ammo.btCylinderShape( p4 );
				break;

			case 'cone':
				shape = new Ammo.btConeShape( o.size[ 0 ], o.size[ 1 ] * 0.5 );
				break;

			case 'capsule':
				shape = new Ammo.btCapsuleShape( o.size[ 0 ], o.size[ 1 ] );
				break;

			case 'compound':

				shape = new Ammo.btCompoundShape();
				var g, s, tr = math.transform();

		    	for ( var i = 0; i < o.shapes.length; i ++ ) {

		    		g = o.shapes[ i ];

		    		g.quat = g.quat === undefined ? [ 0, 0, 0, 1 ] : g.quat;

		    		if ( root.scale !== 1 ) {

						g.pos = math.vectomult( g.pos, root.invScale );
						g.size = math.vectomult( g.size, root.invScale );

					}

					// apply position and rotation
		            tr.identity().fromArray( g.pos.concat( g.quat ) );

		    		switch ( g.type ) {

		    			case 'box':
							p4.setValue( g.size[ 0 ] * 0.5, g.size[ 1 ] * 0.5, g.size[ 2 ] * 0.5 );
							s = new Ammo.btBoxShape( p4 );
						break;
						case 'sphere':
							s = new Ammo.btSphereShape( g.size[ 0 ] );
						break;
						case 'cylinder':
							p4.setValue( g.size[ 0 ], g.size[ 1 ] * 0.5, g.size[ 2 ] * 0.5 );
							s = new Ammo.btCylinderShape( p4 );
						break;
						case 'cone':
							s = new Ammo.btConeShape( g.size[ 0 ], g.size[ 1 ] * 0.5 );
							break;
						case 'capsule':
							s = new Ammo.btCapsuleShape( g.size[ 0 ], g.size[ 1 ] );
						break;
						case 'convex':
							s = new Ammo.btConvexHullShape();
							var vx = g.v;
							for ( var i = 0, fMax = vx.length; i < fMax; i += 3 ) {

								vx[ i ] *= g.size[ 0 ];
								vx[ i + 1 ] *= g.size[ 1 ];
								vx[ i + 2 ] *= g.size[ 2 ];

								p4.fromArray( vx, i );
								s.addPoint( p4 );

							}
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

				if(o.optimized){
					shape.recalcLocalAabb();
					shape.initializePolyhedralFeatures(); //computation happens here
				}
				//
				break;

		}

		// margin default is 0.039
		// for sphere or capsule margin is the radius 
		// https://www.youtube.com/watch?v=BGAwRKPlpCw&hd=1

		if( shape.setMargin !== undefined && o.type!=='sphere' && o.type!=='capsule' && o.type!=='compound' ) {

			if( o.margin !== undefined ) shape.setMargin(  o.margin * root.invScale );
			else if( shape.getMargin !== undefined && root.scale !== 1 ) shape.setMargin(  shape.getMargin() * root.invScale );

			//if( shape.getMargin !== undefined ) console.log(o.type, shape.getMargin(), o.size );

		}

		

		if ( extra == 'isShape' ) return shape;


		// apply position and rotation
		trans.identity().fromArray( o.pos.concat( o.quat ) );

		if ( extra == 'isGhost' ) {

			var ghost = new Ammo.btGhostObject();
			ghost.setCollisionShape( shape );
			ghost.setCollisionFlags( o.flag || 4 );
			ghost.setWorldTransform( trans );
			//o.f = new Ammo.btGhostPairCallback();
			//world.getPairCache().setInternalGhostPairCallback( o.f );
			return ghost;

		}

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

		var body;

		if( o.masscenter ){

			// move center of mass
			p0.fromArray( o.masscenter ).negate();
			trans.setIdentity();
			trans.setOrigin( p0 );
			body = new Ammo.btCompoundShape();
			body.addChildShape( trans, shape );

			// mass of vehicle in kg
			trans.identity().fromArray( o.pos.concat( o.quat ) );
			p0.setValue( 0, 0, 0 );
			body.calculateLocalInertia( mass, p0 );
			var motionState = new Ammo.btDefaultMotionState( trans );
			var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, body, p0 );

		}  else {

			if( isGhost ){ 

				//console.log(shape)
				body = new Ammo.btGhostObject();
				body.setCollisionShape( shape );
				body.setWorldTransform( trans );
				o.flag = o.flag || 4;
				body.setCollisionFlags( o.flag );
				
				//body.callback = new Ammo.btGhostPairCallback();
				body.isGhost = true;

				//console.log( body, body.isStaticObject(), body.isKinematicObject() );
			}
			else {
				body = new Ammo.btRigidBody( rbInfo );
				if ( isKinematic ) body.isKinematic = true;
			}

		}


		//body.isRigidBody = true;

		//console.log(body)

		body.name = name;

		// TODO  body.setCenterOfMassTransform()

		if ( mass === 0 && !isKinematic ) {

			body.setCollisionFlags( o.flag || 1 );
			root.world.addCollisionObject( body, o.group || 2, o.mask || - 1 );

			//body.isSolid = true;
			body.type = 'solid';
			this.solids.push( body );

		} else {

			//console.log(body)

			body.setCollisionFlags( o.flag || 0 );
			body.setActivationState( o.state || 1 );

			if ( o.neverSleep ) body.setSleepingThresholds( 0, 0 );

			root.world.addRigidBody( body, o.group || 1, o.mask || - 1 );

			//if ( isKinematic ) body.isKinematic = true;
			//else body.isBody = true;
			if( !noMesh ) {
                body.type = 'body';
			    this.bodys.push( body );
			} else {
				body.type = 'body';
			    this.solids.push( body );
			}

		}

		// BREAKABLE

		body.breakable = o.breakable !== undefined ? o.breakable : false;

		if ( body.breakable ) {

			// breakOption: [ maxImpulse, maxRadial, maxRandom, levelOfSubdivision ]
			body.breakOption = o.breakOption !== undefined ? o.breakOption : [ 250, 1, 2, 1 ];

		}

		map.set( name, body );

		//console.log(name, body)

		Ammo.destroy( rbInfo );

		this.applyOption( body, o );

		trans.free();
		p0.free();
		p1.free();
		p2.free();
		p3.free();
		p4.free();

		o = null;

	},

	applyOption: function ( b, o ) {

		

		var p1 = math.vector3();

		if ( o.flag !== undefined ){ 
			b.setCollisionFlags( o.flag ); 
			b.isKinematic = o.flag === 2 ? true : false; 
		}

		if ( o.state !== undefined ) b.setActivationState( o.state );
		if ( o.activate !== undefined ) b.activate();

		// change group and mask collision
	    if(!b.isGhost){
	    	
			if ( o.group !== undefined ) b.getBroadphaseProxy().set_m_collisionFilterGroup( o.group );
			if ( o.mask !== undefined ) b.getBroadphaseProxy().set_m_collisionFilterMask( o.mask );
			if ( o.damping !== undefined ) b.setDamping( o.damping[ 0 ], o.damping[ 1 ] );
			if ( o.sleeping !== undefined ) b.setSleepingThresholds( o.sleeping[ 0 ], o.sleeping[ 1 ] );

        }

		if ( o.friction !== undefined ) b.setFriction( o.friction );
		if ( o.restitution !== undefined ) b.setRestitution( o.restitution );
		if ( o.rollingFriction !== undefined ) b.setRollingFriction( o.rollingFriction );
		
    

		// TODO try this setting
		if ( o.linearVelocity !== undefined ) b.setLinearVelocity( p1.fromArray( o.linearVelocity, 0, root.invScale ) );
		if ( o.angularVelocity !== undefined ) b.setAngularVelocity( p1.fromArray( o.angularVelocity ) );// radian
		if ( o.linearFactor !== undefined ) b.setLinearFactor( p1.fromArray( o.linearFactor ) );
		if ( o.angularFactor !== undefined ) b.setAngularFactor( p1.fromArray( o.angularFactor ) );
		//if ( o.linearFactor !== undefined ) b.setLinearFactor( o.linearFactor );
		//if ( o.angularFactor !== undefined ) b.setAngularFactor( o.angularFactor );



		if ( o.anisotropic !== undefined ) b.setAnisotropicFriction( o.anisotropic[ 0 ], o.anisotropic[ 1 ] );
		if ( o.massProps !== undefined ) b.setMassProps( o.massProps[ 0 ], o.massProps[ 1 ] );

		if ( o.gravity !== undefined ) {

			if ( o.gravity ) b.setGravity( root.gravity ); else b.setGravity( this.zero );

		}

		/*

		const btScalar DAMPED_TIMESCALE = 3.0 * timeInSecondPerTimeStep; // adjust this multiple as necessary, but for stability don't go below 3.0
		btScalar clampedTimeRatio = (dt > DAMPED_TIMESCALE) ? 1.0 : dt / DAMPED_TIMESCALE; // clamp to 1.0 to enforce stability
		btVector3 newLinearVelocity = (targetPosition - rigidBody->getPosition()) * clampedTimeRatio;
		rigidBody->setLinearVelocity(newLinearVelocity);

		*/


		// for high speed object like bullet
		// http://www.panda3d.org/manual/?title=Bullet_Continuous_Collision_Detection
		// Don't do continuous collision detection if the motion (in one step) is less then m_ccdMotionThreshold
		if ( o.ccdThreshold !== undefined ) b.setCcdMotionThreshold( o.ccdThreshold );// 1e-7
		if ( o.ccdRadius !== undefined ) b.setCcdSweptSphereRadius( o.ccdRadius ); // 0.2 // 0.0 by default


		p1.free();

	},

} );

/*global Ammo*/

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    GUN - CONSTRAINT JOINT
*/

function Constraint() {

	this.ID = 0;
	this.joints = [];

	this.t1 = new Ammo.btTransform();
	this.t2 = new Ammo.btTransform();

}

Object.assign( Constraint.prototype, {

	step: function ( AR, N ) {

		var n, t1 = this.t1, t2 = this.t2, scale = root.scale;

		this.joints.forEach( function ( b, id ) {

			n = N + ( id * 14 );



			t1.copy( map.get( b.b1 ).getWorldTransform() ).multiply( b.formA ).toArray( AR, n , scale );
			t2.copy( map.get( b.b2 ).getWorldTransform() ).multiply( b.formB ).toArray( AR, n + 7, scale );

			/*p1 = t1.getOrigin();
			p2 = t2.getOrigin();
			
			p1.toArray( AR, n , scale );
			p2.toArray( AR, n+3 , scale );*/

		} );

	},

	clear: function () {

		while ( this.joints.length > 0 ) this.destroy( this.joints.pop() );
		this.ID = 0;

	},

	destroy: function ( j ) {

		root.world.removeConstraint( j );
		j.formA.free();
		j.formB.free();
		//Ammo.destroy( j.formA );
		//Ammo.destroy( j.formB );
		Ammo.destroy( j );
		map.delete( j.name );

		//console.log( 'delete', j.name )

	},

	remove: function ( name ) {

		//console.log( 'remove_'+ name );

		if ( !map.has( name ) ) return;
		var j = map.get( name );
		var n = this.joints.indexOf( j );
		if ( n !== - 1 ) {

			this.joints.splice( n, 1 );
			this.destroy( j );

		}

	},

	add: function ( o ) {

		o.name = o.name !== undefined ? o.name : 'joint' + this.ID ++;

		var name = o.name;

		// delete old if same name
		this.remove( name );


		if ( o.body1 ) o.b1 = o.body1;
		if ( o.body2 ) o.b2 = o.body2;

		if ( ! map.has( o.b1 ) || ! map.has( o.b2 ) ){ console.log( '! not find body' ); return;}

		var b1 = map.get( o.b1 );
		var b2 = map.get( o.b2 );

		b1.activate();
		b2.activate();
		//console.log(b2)

		var tmpPos = math.vector3();

		var posA = math.vector3().fromArray( o.pos1 || [ 0, 0, 0 ] ).multiplyScalar( root.invScale );
		var posB = math.vector3().fromArray( o.pos2 || [ 0, 0, 0 ] ).multiplyScalar( root.invScale );

		var axeA = math.vector3().fromArray( o.axe1 || [ 1, 0, 0 ] );
		var axeB = math.vector3().fromArray( o.axe2 || [ 1, 0, 0 ] );

		var formA = math.transform().identity();
		var formB = math.transform().identity();

		//if ( o.type !== "joint_p2p" && o.type !== "joint_hinge" && o.type !== "joint" ) {

			var local = o.local !== undefined ? o.local : true;

			if ( ! local ) { // worldToLocal

				var t = math.transform();
				// frame A
				t.identity();
				t.setOrigin( posA );
				//t.quartenionFromAxis( o.axe1 || [ 1, 0, 0 ] );
				//t.setFromDirection( o.axe1 || [ 1, 0, 0 ], 90*math.torad );
				//b1.getMotionState().getWorldTransform( formA );
				formA.getInverse().multiply( t );

				// frame B
				t.identity();
				t.setOrigin( posB );

				//t.quartenionFromAxis( o.axe2 || [ 1, 0, 0 ], 90*math.torad  );
				//t.setFromDirection( o.axe2 || [ 1, 0, 0 ] );
				b2.getMotionState().getWorldTransform( formB );
				formB.getInverse().multiply( t );

				t.free();

			} else { // local

				// frame A
				formA.setOrigin( posA );
				if ( o.quatA !== undefined ) formA.quaternionFromArray( o.quatA );
				//else if ( o.axe1 ) formA.setFromUnitVectors( o.axe1 ); 
				else if ( o.axe1 ) formA.quartenionFromAxis( o.axe1 );  
				//else if ( o.axe1 ) formA.quartenionFromAxisAngle( o.axe1, 90*math.torad  );
				//else if ( o.axe1 ) formA.setFromDirection( o.axe1 );
				//else if ( o.axe1 ) formA.eulerFromArrayZYX( o.axe1 );
				//else if ( o.axe1 ) formA.makeRotationDir( o.axe1 );
				//else if ( o.axe1 ) formA.getBasis() * axeA;

				// frame B
				formB.setOrigin( posB );
				if ( o.quatB !== undefined ) formB.quaternionFromArray( o.quatB );
				//else if ( o.axe2 ) formB.setFromUnitVectors( o.axe2 );
				else if ( o.axe2 ) formB.quartenionFromAxis( o.axe2 );
				//else if ( o.axe2 ) formB.quartenionFromAxisAngle( o.axe2, 90*math.torad );
				//else if ( o.axe2 ) formB.setFromDirection( o.axe2 );
				//else if ( o.axe2 ) formB.eulerFromArrayZYX( o.axe2 );
				//else if ( o.axe2 ) formB.makeRotationDir( o.axe2 );
				//else if ( o.axe2 ) formB.getBasis() * axeB;

			}

		//}

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

		joint.b1 = o.b1;//b1;
		joint.b2 = o.b2;//b2;

		joint.formA = formA.clone();
		joint.formB = formB.clone();

		

		// EXTRA SETTING

		if ( o.breaking && joint.setBreakingImpulseThreshold ) joint.setBreakingImpulseThreshold( o.breaking );

		// hinge

		// Lowerlimit	==	Upperlimit	->	axis	is	locked.
		// Lowerlimit	>	Upperlimit	->	axis	is	free
		// Lowerlimit	<	Upperlimit	->	axis	it	limited	in	that	range	

		
		if ( o.limit && joint.setLimit ) {

			// 0 _ limite min
			// 1 _ limite max
			// 2 _ softness   0->1, recommend ~0.8->1  describes % of limits where movement is free.  beyond this softness %, the limit is gradually enforced until the "hard" (1.0) limit is reached.
			// 3 _ bias  0->1?, recommend 0.3 +/-0.3 or so.   strength with which constraint resists zeroth order (angular, not angular velocity) limit violation.
			// 4 _ relaxation  0->1, recommend to stay near 1.  the lower the value, the less the constraint will fight velocities which violate the angular limits.

			if ( o.type === 'joint_hinge' || o.type === 'joint' || o.type === 'joint_hinge_ref') joint.setLimit( o.limit[ 0 ] * math.torad, o.limit[ 1 ] * math.torad, o.limit[ 2 ] !==undefined ? o.limit[ 2 ] : 0.9, o.limit[ 3 ] !==undefined ? o.limit[ 3 ] : 0.3, o.limit[ 4 ] !==undefined ? o.limit[ 4 ] : 1.0 );

			// 0 _ swingSpan1
			// 1 _ swingSpan2
			// 2 _ twistSpan
			// 3 _ softness   0->1, recommend ~0.8->1  describes % of limits where movement is free.  beyond this softness %, the limit is gradually enforced until the "hard" (1.0) limit is reached.
			// 4 _ bias  0->1?, recommend 0.3 +/-0.3 or so.   strength with which constraint resists zeroth order (angular, not angular velocity) limit violation.
			// 5 _ relaxation  0->1, recommend to stay near 1.  the lower the value, the less the constraint will fight velocities which violate the angular limits.
			if ( o.type === 'joint_conetwist' ) {

				// don't work !!!
				//joint.setLimit( o.limit[ 0 ] * math.torad, o.limit[ 1 ] * math.torad, o.limit[ 2 ] * math.torad, o.limit[ 3 ] !==undefined ? o.limit[ 3 ] : 0.9, o.limit[ 4 ] !==undefined ? o.limit[ 4 ] : 0.3, o.limit[ 5 ] !==undefined ? o.limit[ 5 ] : 1.0 );

				joint.setLimit( 3, o.limit[ 2 ] * math.torad );//m_twistSpan // x
				joint.setLimit( 4, o.limit[ 1 ] * math.torad );//m_swingSpan2 // z
				joint.setLimit( 5, o.limit[ 0 ] * math.torad );//m_swingSpan1 // y

			}

			

		}

		if ( o.limit && o.type === 'joint_slider' ) {

			if( o.limit[ 0 ] ) joint.setLowerLinLimit( o.limit[ 0 ] * root.invScale );
            if( o.limit[ 1 ] ) joint.setUpperLinLimit( o.limit[ 1 ] * root.invScale );
	        if( o.limit[ 2 ] ) joint.setLowerAngLimit( o.limit[ 2 ] * math.torad );
	        if( o.limit[ 3 ] ) joint.setUpperAngLimit( o.limit[ 3 ] * math.torad );

		}
		

		// slider & dof

	    if( joint.setLinearLowerLimit ){

	        if( o.linLower ) joint.setLinearLowerLimit( tmpPos.fromArray( o.linLower ).multiplyScalar( root.invScale ) );
	        if( o.linUpper ) joint.setLinearUpperLimit( tmpPos.fromArray( o.linUpper ).multiplyScalar( root.invScale ) );

	    }

	    if( joint.setAngularLowerLimit ){

	        if( o.angLower ) joint.setAngularLowerLimit( tmpPos.fromArray( o.angLower ).multiplyScalar( math.torad ) );
	        if( o.angUpper ) joint.setAngularUpperLimit( tmpPos.fromArray( o.angUpper ).multiplyScalar( math.torad ) );

	    }

		// 6 dof

		/*if ( joint.setLinearLowerLimit ) {

			if ( o.linLower ) joint.setLinearLowerLimit( posA.fromArray( o.linLower ).multiplyScalar( root.invScale ));
			if ( o.linUpper ) joint.setLinearUpperLimit( posB.fromArray( o.linUpper ).multiplyScalar( root.invScale ));

		}

		if ( joint.setAngularLowerLimit ) {

			if ( o.angLower ) joint.setAngularLowerLimit( axeA.set( o.angLower[ 0 ] * math.torad, o.angLower[ 1 ] * math.torad, o.angLower[ 2 ] * math.torad ));
			if ( o.angUpper ) joint.setAngularUpperLimit( axeB.set( o.angUpper[ 0 ] * math.torad, o.angUpper[ 1 ] * math.torad, o.angUpper[ 2 ] * math.torad ));
			
		}*/


		if ( o.motor && joint.enableAngularMotor ) joint.enableAngularMotor( o.motor[ 0 ], o.motor[ 1 ], o.motor[ 2 ] );

		if ( o.feedback ) joint.enableFeedback( o.feedback );//
		//joint.enableFeedback( o.feedback );
		//if(o.param) joint.setParam( o.param[0], o.param[1], o.param[1] );//

		if ( o.angularOnly && joint.setAngularOnly ) joint.setAngularOnly( o.angularOnly ? 1 : 0 );
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

		// spring dof
	    // < 3 position 
	    // > 3 rotation
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

		// add to map
		map.set( name, joint );

		//console.log( o.type, joint );

		// free math
		tmpPos.free();
		posA.free();
		posB.free();
		axeA.free();
		axeB.free();
		formA.free();
		formB.free();
		o = null;


		//console.log( math.getLength() );

	},

	// TODO
	applyOption: function ( joint, o ) {



	},


} );


function Joint( o ) {

	this.type = 'constraint';
	this.name = o.name;



}

Object.assign( Joint.prototype, {

	step: function ( n, AR ){

	},

	init: function ( o ){


	},

	clear: function (){


	},

});

/*global Ammo*/

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    GUN - SOFTBODY
*/

function SoftBody() {

	this.ID = 0;
	this.softs = [];

}

Object.assign( SoftBody.prototype, {

	step: function ( AR, N ) {

		var softPoints = N, n, s, j;
		var scale = root.scale;

		this.softs.forEach( function ( b ) {

			s = b.get_m_nodes(); // get vertrices list
			j = s.size();

			while ( j -- ) {

				n = softPoints + ( j * 3 );
				s.at( j ).get_m_x().toArray( AR, n, scale );

			}

			softPoints += s.size() * 3;

		});

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
		while( i-- ) soft.addAeroForceToNode( p0, o.nodes[i] );
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

		//console.log(o.pos)

		var p0 = math.vector3();
		var p1 = math.vector3();
		var p2 = math.vector3();
		var p3 = math.vector3();
		var p4 = math.vector3();
		var trans = math.transform();

		var softBodyHelpers = new Ammo.btSoftBodyHelpers();

		//console.log( softBodyHelpers )

		var body;

		switch ( o.type ) {

			case 'softMesh': //case 'softConvex':

			    // scale geometry
			    if ( root.scale !== 1 ){
			    	var j = o.v.length;
			        while ( j -- ) o.v[ j ] *= root.invScale;
			    }
			    
				body = softBodyHelpers.CreateFromTriMesh( worldInfo, o.v, o.i, o.ntri, o.randomize || true );
				body.softType = 5;

			break;

			case 'softCloth':

				var mw = o.size[ 0 ] * 0.5;
				var mh = o.size[ 2 ] * 0.5;

				p1.fromArray( [ - mw, 0, - mh ] );
				p2.fromArray( [ mw, 0, - mh ] );
				p3.fromArray( [ - mw, 0, mh ] );
				p4.fromArray( [ mw, 0, mh ] );

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

			case 'softConvex': // BUG !!

			    //var j = o.v.length;
			    //while( j-- ) { o.v[ j ] *= root.invScale; }

				var lng = o.v.length / 3;
				var i = 0, n;

				//var ff = new Ammo.btVector3Array();

				for ( i = 0; i<lng; i++ ) {

					n = i * 3;
					//p1.fromArray( o.v, n, root.invScale );
					//arr.push( p1.clone() );
					//body.get_m_nodes().at( i ).set_m_x( p1 );
					//body.get_m_nodes().at( i ).set_m_x(new Ammo.btVector3(o.v[n], o.v[n+1], o.v[n+2]));

					//arr.push( new Ammo.btVector3( o.v[n], o.v[n+1], o.v[n+2]) );
					//arr[i] = new Ammo.btVector3( o.v[n], o.v[n+1], o.v[n+2]);

					//arr.push(  [o.v[n], o.v[n+1], o.v[n+2]] );

				}

				//







                var hull = new Ammo.btConvexHullShape();

                for ( i = 0; i<lng; i++ ) {

					n = i * 3;
					p1.fromArray( o.v, n, root.invScale );
					hull.addPoint( p1 );
				}

				//hull.recalcLocalAabb();
				hull.initializePolyhedralFeatures();

                //console.log(hull, hull.getNumVertices() )

                //console.log(hull.getConvexPolyhedron().m_vertices.size() )

				body = softBodyHelpers.CreateFromConvexHull( worldInfo, hull.getConvexPolyhedron(), hull.getConvexPolyhedron().m_vertices.size(), o.randomize || false );


				//body = softBodyHelpers.CreateFromConvexHull( worldInfo, hull.getConvexPolyhedron(), hull.getConvexPolyhedron().get_m_vertices().size(), o.randomize || true );

				//body.setCollisionShape( fff )
				//body = softBodyHelpers.CreateFromConvexHull( worldInfo, arr, lng, o.randomize || true );
				//body.generateBendingConstraints( hull.getNumVertices() );
				body.softType = 4;

				//console.log(body)



				// free node
				/*i = lng;
				//while ( i -- ) arr[i].free();
				// force nodes
				//var i = lng, n;
				for ( i = 0; i<lng; i++ ) {

					n = i * 3;
					p1.fromArray( o.v, n, root.invScale );
					body.get_m_nodes().at( i ).set_m_x( p1 );
					//body.get_m_nodes().at( i ).set_m_x(new Ammo.btVector3(o.v[n], o.v[n+1], o.v[n+2]));

				}
*/
				console.log( body, body.get_m_nodes().size() );

			break;

			

		}


		// apply parametre
		this.applyOption( body, o );
		

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

	},

	applyOption: function ( body, o ) {

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




	}

} );

/*global Ammo*/

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    GUN - TERRAIN
*/

function Terrain() {

	this.ID = 0;
	this.terrains = [];

}

Object.assign( Terrain.prototype, {

	step: function () {

		var i = root.flow.terrain.length;
		while( i-- ) this.setData( root.flow.terrain[i] );
		root.flow.terrain = [];

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

			    this.transforms.push( this.chassis.getWheelTransformWS( i ) );

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

/*global Ammo*/

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    GUN - CHARACTER
*/

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

		//hero.controller.setGravity( root.gravity );
		root.world.addCollisionObject( hero.body, o.group || 1, o.mask || - 1 );
		root.world.addAction( hero.controller );


		this.heroes.push( hero );
		map.set( name, hero );

	}

} );





function Hero( name, o ) {

	this.type = 'character';

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

	isCharacter: true,

	step: function ( Ar, n ) {

		Ar[ n ] = this.speed;
		//Hr[n] = b.onGround ? 1 : 0;

		/*var t = this.body.getWorldTransform();
		var pos = t.getOrigin();
		var quat = t.getRotation();

		Ar[ n + 1 ] = pos.x();
		Ar[ n + 2 ] = pos.y();
		Ar[ n + 3 ] = pos.z();

		Ar[ n + 4 ] = quat.x();
		Ar[ n + 5 ] = quat.y();
		Ar[ n + 6 ] = quat.z();
		Ar[ n + 7 ] = quat.w();*/

		this.body.getWorldTransform().toArray( Ar, n + 1, root.scale );

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

		if ( key[ 4 ] == 1 ) this.controller.canJump();

		/*if ( key[ 4 ] == 1 && this.controller.onGround() ) { //h.canJump() ){

			this.wasJumping = true;
			this.verticalVelocity = 0;

		}

		if ( this.wasJumping ) {

			this.verticalVelocity += 0.04;
			// y = this.controller.verticalVelocity;
			if ( this.verticalVelocity > 0.5 ) {//1.3

				this.verticalVelocity = 0;
				this.wasJumping = false;

			}

		}*/

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

		if ( root.scale !== 1 ) {

			o.pos = math.vectomult( o.pos, root.invScale );
			//o.size = math.vectomult( o.size, root.invScale );
			if( o.masscenter !== undefined ) o.masscenter = math.vectomult( o.masscenter, root.invScale );

		}



		//var capsule = new Ammo.btCapsuleShape( o.size[ 0 ], o.size[ 1 ] );

		var shapeInfo = o.shapeInfo || { type: 'capsule', size: o.size };

		var shape = root.makeShape( shapeInfo );

		var body = new Ammo.btPairCachingGhostObject();
		trans.identity().fromArray( o.pos.concat( o.quat ) );
		body.setWorldTransform( trans );

		body.setCollisionShape( shape );
		body.setCollisionFlags( 16 );//CHARACTER_OBJECT

		

		body.setFriction( o.friction || 0.1 );
		body.setRestitution( o.restitution || 0 );

		body.setActivationState( 4 );
		body.activate();
		this.body = body;

		var controller = new Ammo.btKinematicCharacterController( body, shape, o.stepH || 0.35, o.upAxis || 1 );
		//var hero = new Ammo.btKinematicCharacterController( body, shape, o.stepH || 0.3 )
		controller.setUseGhostSweepTest( shape );

		p0.setValue( 0, 0, 0 );
		controller.setVelocityForTimeInterval( p0, 1 );

		// hero.getGhostObject().getWorldTransform().setRotation(q4( o.quat ));
		this.controller = controller;
		this.applyOption( o );

		this.setAngle( 0 );


	    console.log( controller, body );

		// The max slope determines the maximum angle that the controller can walk
		




		// controller.warp(v3(o.pos));

		



		
		

		// world.getPairCache().setInternalGhostPairCallback( new Ammo.btGhostPairCallback() );

	},

	applyOption: function ( o ) {

		//console.log('set')

		var controller = this.controller;

		if ( o.gravity !== undefined ) controller.setGravity( o.gravity );//9.8 *3
		if ( o.upAxis !== undefined ) controller.setUpAxis( o.upAxis );
		if ( o.canJump !== undefined ) controller.canJump( o.canJump );
		if ( o.maxJumpHeight !== undefined ) controller.setMaxJumpHeight( o.maxJumpHeight   );//0.01
		if ( o.jumpSpeed !== undefined) controller.setJumpSpeed( o.jumpSpeed );//0.1
		if ( o.fallSpeed !== undefined ) controller.setFallSpeed( o.fallSpeed );//55
		if ( o.slopeRadians !== undefined ) controller.setMaxSlope( o.slopeRadians );//45

		if( o.angle !== undefined ) this.setAngle( o.angle );//45
		if( o.position !== undefined ){

			this.position.fromArray( o.position, 0, root.invScale );
			this.position.direction( this.q );
			controller.setWalkDirection( this.position );

		}

	},

	setMatrix: function ( o ){

		var p0 = math.vector3();
		o.pos = math.vectomult( o.pos, root.invScale );
		p0.fromArray( o.pos );

		this.controller.warp( p0 );

		p0.free();

	},

	setAngle: function ( angle ) {

		var t = this.body.getWorldTransform();
		this.q.setFromAxisAngle( [ 0, 1, 0 ], angle );
		t.setRotation( this.q );
		this.angle = angle;

	}

} );

/*global Ammo*/

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    GUN - COLLISION
*/

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

		});

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

	this.type = 'collision';

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

/*global Ammo*/

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    GUN - RAY
*/

function RayCaster() {

	this.ID = 0;
	this.rays = [];
	this.ray = null;
	this.results = [];

}

Object.assign( RayCaster.prototype, {

	step: function () {

		if( this.ray === null ) return;

		var i = this.rays.length;
		var j = root.flow.ray.length;

		if ( !i ) return;

		//var updated = i === root.flow.ray.length;

		if(i===j){
			//var j = root.flow.ray.length;
	        while( j-- ) this.rays[j].update( root.flow.ray[j] );
	        //root.flow.ray = [];
		}

		

		//root.responce.ray = [];
		root.flow.ray = [];

		//console.log(updated)

		var ray = this.ray;

		this.rays.forEach( function ( r, id ) {

			//if( updated ) r.update( root.flow.ray[ id ] );

			ray.set_m_closestHitFraction( r.precision );
			ray.set_m_collisionObject( null );

			// Set ray option
			ray.get_m_rayFromWorld().fromArray( r.origin, 0, root.invScale );
			ray.get_m_rayToWorld().fromArray( r.dest, 0, root.invScale );
			ray.set_m_collisionFilterGroup( r.group );
			ray.set_m_collisionFilterMask( r.mask );

			// Perform ray test
			root.world.rayTest( ray.get_m_rayFromWorld(), ray.get_m_rayToWorld(), ray );

			if ( ray.hasHit() ) {

		    	var name = Ammo.castObject( ray.get_m_collisionObject(), Ammo.btRigidBody ).name;
		    	if ( name === undefined ) name = Ammo.castObject( ray.get_m_collisionObject(), Ammo.btSoftBody ).name;

		    	var normal = ray.get_m_hitNormalWorld();
		    	normal.normalize();
		    	
		    	r.result.hit = true;
		    	r.result.name = name;
		    	r.result.point = ray.get_m_hitPointWorld().toArray( undefined, 0, root.scale );
		    	r.result.normal = normal.toArray();


		    } else {

		    	r.result.hit = false;
		    	r.result.name = '';

			}

			//root.responce.ray[ id ] = r.result;
			//root.responce.ray.push( r.result );
			root.flow.ray.push( r.result );

		});

	},

	update: function ( o ){

		var i = this.rays.length;
		if ( !i || i !== o.length ) return;
		while ( i -- ) this.rays[ i ].update( o[ i ] );

	},

	clear: function () {

		while ( this.rays.length > 0 ) this.destroy( this.rays.pop() );
		this.ID = 0;

	},

	destroy: function ( p ) {

		p.clear();
		map.delete( p.name );

	},

	remove: function ( name ) {

		if ( ! map.has( name ) ) return;
		var p = map.get( name );
		var n = this.rays.indexOf( p );
		if ( n !== - 1 ) {

			this.rays.splice( n, 1 );
			this.destroy( p );

		}

	},

	add: function ( o ) {

		if( this.ray === null ) this.ray = new Ammo.ClosestRayResultCallback();

		var name = o.name !== undefined ? o.name : 'ray' + this.ID ++;

		// delete old if same name
		this.remove( o.name );


		var p = new Ray( name, o );
		this.rays.push( p );
		map.set( name, p );

	},



});


//--------------------------------------------------
//
//  CONTACT CLASS
//
//--------------------------------------------------

function Ray( name, o ) {

	this.name = name;
	this.type = 'ray';

	this.precision = 1;

	this.update( o );

	this.result = {
		hit: false,
		name: '',
		point: [0,0,0],
		normal: [0,0,0],
	};

}

Object.assign( Ray.prototype, {

	update: function ( o ) {

		this.precision = o.precision || 1;
		this.origin = o.origin || [0,0,0];
		this.dest = o.dest || [0,1,0];
		this.group = o.group !== undefined ? o.group : 1;
		this.mask = o.mask !== undefined ? o.mask : -1;

	},

	clear: function () {

		/*this.a = null;
		this.b = null;
		Ammo.destroy( this.f );*/

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


self.onmessage = function ( e ) {

	var data = e.data;

	// ------- buffer data
	if ( data.Ar ) engine.setAr( data.Ar );
	if ( data.flow ) root.flow = data.flow;

	// ------- engine function
	engine[ data.m ]( data.o );

};

var engine = ( function () {

	var interval = null;
	var isInternUpdate = false;
	var Time = typeof performance === 'undefined' ? Date : performance;

	//var world = null;
	var Ar, ArPos, ArMax;
	var timestep = 1 / 60;
	var damped = 3.0 * timestep; // adjust this multiple as necessary, but for stability don't go below 3.0
	var fixed = false;
	var substep = 2;
	var delta = 0;

	var isBuffer = false;
	var isSoft = false;
	//var gravity = null;

	var jointDebug = false;

	var solver, solverSoft, collisionConfig, dispatcher, broadphase;

	var tmpRemove = [];

	var carName = "";
	var heroName = "";

	var zero = null;

	var numBreak = 0;

	var ray = null;

	var tmpT, tmpP;



	var t = { now: 0, delta: 0, then: 0, deltaTime:0, inter: 0, tmp: 0, n: 0, timerate: 0, last:0 };



	var rigidBody, softBody, constraint, terrains, vehicles, character, collision, raycaster;

	engine = {

		test: function () {},

		setAr: function ( r ) {

			Ar = r;

		},

		getAr: function () {

			return Ar;

		},

		setDrive: function ( name ) {

			carName = name;

		},

		setMove: function ( name ) {

			heroName = name;

		},

		setAngle: function ( o ) {

			root.angle = o.angle;

		},

		/*loop: function ( o ){

			t.now = Time.now();
		    t.delta = t.now - t.then;

		    //if ( t.delta > t.inter ) {
		    	//t.then = t.now - ( t.delta % t.inter );
		    	engine.step( { key:o.key, delta:t.delta*0.001 } )
		    //}/* else (
		    	engine.internStep( { key:o.key } )
		    //)*/

		//},

		internStep: function ( o ){

			//var now = Time.now();

			//isInternUpdate = true;

			root.key = o.key;


		    //stepNext = true; 
		    t.last = Time.now();

		    function mainLoop() {

		        t.now = Time.now();
		        engine.step( { delta: (t.now - t.last)*0.001 } );
		        t.last = t.now;

		    }

		    

			//if ( interval ) clearInterval( interval );
			//interval = setInterval( function(){ engine.loop( { key:o.key } ) }, 1000 * timestep );

			//var timx = timestep;/t.inter/ - o.steptime;

			//t.inter = 1000 * timestep


			if ( interval ) clearInterval( interval );
			interval = setInterval( mainLoop, 1000 * timestep );

			


			//if ( interval ) clearTimeout( interval );
			//interval = setTimeout( engine.step( { key:o.key } ), 1000 * timestep );

			/*interval = setTimeout( 
				function(){
					var now = Time.now();
					engine.step({ key:o.key, delta:now - last });
		            last = now;
				}
			, 1000 * timestep );*/

			console.log('is interne update');

		},

		step: function ( o ) {

			if( isInternUpdate ){

				if ( t.now - 1000 > t.tmp ) { t.tmp = t.now; t.fps = t.n; t.n = 0; } t.n ++;
				
			} else {

				root.key = o.key;
				
			}



			delta = o.delta;



			
			//delta = delta || 1;


			//if ( fixed ) root.world.stepSimulation( o.delta, substep, timestep );
			//else root.world.stepSimulation( o.delta, substep );

			


			

			//tmpRemove = tmpRemove.concat( o.remove );
			this.stepRemove();

			vehicles.control( carName );
			character.control( heroName );


			this.stepMatrix();
			this.stepOptions();
			this.stepForces();
			
			
			terrains.step();

			// breakable object
			if ( numBreak !== 0 ) this.stepBreak();



			// timeStep < maxSubSteps * fixedTimeStep if you don't want to lose time.
			//'timeStep', units in preferably in seconds
			//root.world.stepSimulation( timestep, substep );

			if ( fixed ) root.world.stepSimulation( timestep, 0 );//root.world.stepSimulation( delta, substep, timestep );
			//else root.world.stepSimulation( delta, substep, timestep );
			else root.world.stepSimulation( delta, substep, timestep );

			//if( delta > substep * timestep ) console.log('mmm')
			//else root.world.stepSimulation( delta, substep );

			rigidBody.step( Ar, ArPos[ 0 ] );
			collision.step( Ar, ArPos[ 1 ] );
			character.step( Ar, ArPos[ 2 ] );
			vehicles.step( Ar, ArPos[ 3 ] );
			softBody.step( Ar, ArPos[ 4 ] );
			if( jointDebug ) constraint.step( Ar, ArPos[ 5 ] );

			raycaster.step();

			if ( isBuffer ) self.postMessage( { m: 'step', fps:t.fps, delta:t.delta, flow: root.flow, Ar: Ar }, [ Ar.buffer ] );
			else self.postMessage( { m: 'step', fps:t.fps, delta:delta, flow: root.flow, Ar: Ar } );


			//if( isInternUpdate ) t.last = t.now;//Time.now();//now;

		},

		clearFlow: function () {

			//root.flow = { matrix:{}, force:{}, option:{}, ray:[], terrain:[], vehicle:[] };
			root.flow = { ray:[], terrain:[], vehicle:[] };

		},

		reset: function ( o ) {

			numBreak = 0;

			carName = "";
			heroName = "";

			this.clearFlow();
			
			tmpRemove = [];

			root.matrix = [];
			root.option = [];
			root.force = [];

			rigidBody.clear();
			constraint.clear();
			softBody.clear();
			terrains.clear();
			vehicles.clear();
			character.clear();
			collision.clear();
			raycaster.clear();


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

			self.postMessage( { m: 'start' } );

		},

		addMulty: function ( o ) {

			for ( var i = 0, lng = o.length; i < lng; i ++ ) this.add( o[ i ] );
			o = [];

		},

		post: function ( m, o ) {

			self.postMessage( { m:m, o:o } );

		},


		init: function ( o ) {

			isBuffer = o.isBuffer || false;

			ArPos = o.ArPos;
			ArMax = o.ArMax;

			// create tranfere array if buffer
			if ( ! isBuffer ) Ar = new Float32Array( ArMax );

			//console.log(Module)
			//var Module = { TOTAL_MEMORY: 64*1024*1024 };//default // 67108864
			//self.Module = { TOTAL_MEMORY: 16*1024*1024 };//default // 67108864

			importScripts( o.blob );



			Ammo().then( function ( Ammo ) {


				mathExtend();

				engine.createWorld( o.option );
				engine.set( o.option );

				rigidBody = new RigidBody();
				constraint = new Constraint();
				softBody = new SoftBody();
				terrains = new Terrain();
				vehicles = new Vehicle();
				character = new Character();
				collision = new Collision();
				raycaster = new RayCaster();

				ray = new Ammo.ClosestRayResultCallback();

				tmpT = math.transform();
				tmpP = math.vector3();

				root.makeShape = function ( o ) { return rigidBody.add( o, 'isShape' ); };

				//vehicles.addExtra = rigidBody.add;
				//character.addExtra = rigidBody.add;

				self.postMessage( { m: 'initEngine' } );

			} );

		},

		//-----------------------------
		//
		//   REMOVE
		//
		//-----------------------------

		remove: function ( name ) {

			if ( ! map.has( name ) ) return;
			var b = map.get( name );

			switch( b.type ){

				case 'solid': case 'body' : rigidBody.remove( name ); break;
				case 'soft': softBody.remove( name ); break;
				case 'terrain': terrains.remove( name ); break;
				case 'joint': case 'constraint' : constraint.remove( name ); break;
				case 'collision': collision.remove( name ); break;
				case 'ray': raycaster.remove( name ); break;

			}

		},

		setRemove: function ( o ) {

			tmpRemove = tmpRemove.concat( o );

		},

		stepRemove: function () {

			while ( tmpRemove.length > 0 ) this.remove( tmpRemove.pop() );

		},

		directRemoves: function ( o ) {

			this.setRemove( o );
			this.stepRemove();

		},


		//-----------------------------
		//
		//   ADD
		//
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
			else if ( type === 'ray' ) raycaster.add( o );
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

		/*setTerrain: function ( o ) {

			terrains.setData( o );

		},*/

		setVehicle: function ( o ) {

			vehicles.setData( o );

		},

		//-----------------------------
		//
		//   WORLD
		//
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

			root.post = this.post;
 
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


			t.inter = o.fps !== undefined ? 1000 / o.fps : 1000 / 60;

			isInternUpdate = o.isInternUpdate || false;

			//console.log( isInternUpdate )

			jointDebug = o.jointDebug !== undefined ? o.jointDebug : false;

			root.constraintDebug = jointDebug;

			damped = 3.0 * timestep;

			// penetration
			if ( o.penetration !== undefined ) {

				var worldDispatch = root.world.getDispatchInfo();
				worldDispatch.set_m_allowedCcdPenetration( o.penetration );// default 0.0399}

			}

			// gravity
			this.setGravity( o );

		},

		//-----------------------------
		//
		//   FORCES
		//
		//-----------------------------

		setForces: function ( o ) { 

			root.force = root.force.concat( o ); 

		},

		directForces: function ( o ) {

			this.setForces( o );
			this.stepForces();

		},

		stepForces: function () {

			var i = root.force.length;
			while( i-- ) this.applyForces( root.force[i] );
			root.force = [];

		},

		applyForces: function ( o ) {

			var name = o.name;

			if ( ! map.has( name ) ) return;
			var b = map.get( name );

			//var type = r[ 1 ] || 'force';
			var p1 = math.vector3();
			var p2 = math.vector3();
			var q = math.quaternion();

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
               // case 'motorTarget' : case 8 : b.setMotorTarget(  q.fromArray( o.target ), o.scale || 1 );
                case 'motorTarget' : case 8 : b.setMotorTarget(   o.target, o.axis || -1 );
                case 'setLimit' : case 9 : b.setLimit( o.limit[ 0 ] * math.torad, o.limit[ 1 ] * math.torad, o.limit[ 2 ] || 0.9, o.limit[ 3 ] || 0.3, o.limit[ 4 ] || 1.0 );
			}

			p1.free();
			p2.free();
			q.free();

		},

		/*
		For anyone looking how to apply a force local/relative to btRigidBody in ammo.js, here's how:
		let transform = new Ammo.btTransform();
		body.getMotionState().getWorldTransform(transform);
		let relativeForce = new Ammo.btVector3(0,0, 1000);
		let relativeTransform = new Ammo.btTransform();
		relativeTransform.setOrigin(relativeForce);
		let relativeForce = (transform.op_mul(relativeTransform)).getOrigin();
		body.applyForce(relativeForce, transform.getOrigin());
		*/

		//-----------------------------
		//
		//   MATRIX
		//
		//-----------------------------

		setMatrix: function ( o ) { 

			root.matrix = root.matrix.concat( o ); 

		},

		directMatrix: function ( o ) {

			this.setMatrix( o );
			this.stepMatrix();

		},

		stepMatrix: function () {

			var i = root.matrix.length;
			while( i-- ) this.applyMatrix( root.matrix[i] );
			root.matrix = [];

		},

		applyMatrix: function ( o ) {

			var name = o.name;

			if ( ! map.has( name ) ) return;
			var b = map.get( name );

			if( b.isCharacter ){
				b.setMatrix( o );
				return;
			}

			var t = tmpT.identity(); //math.transform();
			var p1 = tmpP; //math.vector3();

			//if ( b.isKinematic ) t = b.getMotionState().getWorldTransform();
			//else  t = b.getWorldTransform();
			//b.getWorldTransform ( t );

			if( o.rot === undefined && o.quat === undefined ) o.quat = [ 0, 0, 0, 1 ];//o.keepRot = true;

			if ( o.keepX || o.keepY || o.keepZ || o.keepRot ) { // keep original position

				b.getMotionState().getWorldTransform( t );
				var r = [];
				t.toArray( r );

				if ( o.keepX !== undefined ) o.pos[ 0 ] = r[ 0 ] - o.pos[ 0 ];
				if ( o.keepY !== undefined ) o.pos[ 1 ] = r[ 1 ] - o.pos[ 1 ];
				if ( o.keepZ !== undefined ) o.pos[ 2 ] = r[ 2 ] - o.pos[ 2 ];
				if ( o.keepRot !== undefined ) o.quat = [ r[ 3 ], r[ 4 ], r[ 5 ], r[ 6 ] ];

			}

			//t.identity();

			

			// position and rotation
			if ( o.pos !== undefined ) {

				//o.pos = math.vectomult( o.pos, root.invScale );
				if ( o.rot !== undefined ) o.quat = math.eulerToQuadArray( o.rot, true );// is euler degree
				
				o.pos = o.pos.concat( o.quat );
				
				t.fromArray( o.pos, 0, root.invScale );

				if ( b.isKinematic ) b.getMotionState().setWorldTransform( t );
			    else b.setWorldTransform( t );

			}

			//https://pybullet.org/Bullet/phpBB3/viewtopic.php?t=11079

			if( o.clamped !== undefined ){

				var clamped = ( delta > damped ) ? 1.0 : delta / damped; // clamp to 1.0 to enforce stability
				p1.fromArray( o.pos, 0, root.invScale ).sub( b.getWorldTransform().getOrigin() ).multiplyScalar( clamped );
				b.setLinearVelocity( p1 );

			}

			if ( o.velocity && !b.isGhost ) {

				if( o.velocity[0] ) b.setLinearVelocity( p1.fromArray( o.velocity[0], 0, root.invScale ) );
				if( o.velocity[1] ) b.setAngularVelocity( p1.fromArray( o.velocity[1] ) );
				
			}

			if ( o.noVelocity && !b.isGhost ) {

				b.setLinearVelocity( zero );
				b.setAngularVelocity( zero );

			}

			if ( o.noGravity ) {

				b.setGravity( zero );

			}

			if ( o.activate ) {

				b.activate();
				
			}

			if ( b.type === 'body' && !b.isKinematic ) b.activate();
			if ( b.type === 'solid' ) self.postMessage( { m: 'moveSolid', o: { name: name, pos: o.pos, quat: o.quat } } );

			//t.free();
			//p1.free();

		},

		//-----------------------------
		//
		//   OPTION
		//
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

		setOptions: function ( o ) { 

			root.option = root.option.concat( o ); 

		},

		directOptions: function ( o ) {

			this.setOptions( o );
			this.stepOptions();

		},

		stepOptions: function () {

			var i = root.option.length;
			while( i-- ) this.applyOption( root.option[i] );
			root.option = [];

		},

		applyOption: function ( o ) {

			var name = o.name;

			if ( ! map.has( name ) ) return;
			var body = map.get( name );

			switch( body.type ){
				case 'solid': case 'body' :
				    rigidBody.applyOption( body, o );
				break;
				case 'soft':
				    softBody.applyOption( body, o );
				break;
				case 'character':
				    body.applyOption( o );
				break;
			}

		},

		//-----------------------------
		//
		//   BREAKABLE
		//
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


	};

	return engine;

} )();

//export var Module = { TOTAL_MEMORY: 512*1024*1024 };

export { engine };
