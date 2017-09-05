
//--------------------------------------------------
//
//  AMMO MATH
//
//--------------------------------------------------

var torad = 0.0174532925199432957;
var todeg = 57.295779513082320876;

//--------------------------------------------------
//
//  btTransform extend
//
//--------------------------------------------------

function initMath(){



    Ammo.btTransform.prototype.toArray = function( array, offset ){

        //if ( offset === undefined ) offset = 0;
        offset = offset || 0;

        this.getOrigin().toArray( array , offset );
        this.getRotation().toArray( array , offset + 3 );

        //return array;

    };

    //--------------------------------------------------
    //
    //  btVector3 extend
    //
    //--------------------------------------------------

    Ammo.btVector3.prototype.negate = function( v ){

        this.setValue( -this.x(), -this.y(), -this.z() );
        return this;

    };

    Ammo.btVector3.prototype.add = function( v ){

        this.setValue( this.x() + v.x(), this.y() + v.y(), this.z() + v.z() );
        return this;

    };

    Ammo.btVector3.prototype.fromArray = function( array, offset ){

        //if ( offset === undefined ) offset = 0;
        offset = offset || 0;

        this.setValue( array[ offset ], array[ offset + 1 ], array[ offset + 2 ] );

        return this;

    };

    Ammo.btVector3.prototype.toArray = function( array, offset ){

        //if ( array === undefined ) array = [];
        //if ( offset === undefined ) offset = 0;
        offset = offset || 0;

        array[ offset ] = this.x();
        array[ offset + 1 ] = this.y();
        array[ offset + 2 ] = this.z();

        //return array;

    };

    Ammo.btVector3.prototype.direction = function( q ){

        // quaternion 
        
        var qx = q.x();
        var qy = q.y();
        var qz = q.z();
        var qw = q.w();

        var x = this.x();
        var y = this.y();
        var z = this.z();

        // calculate quat * vector

        var ix =  qw * x + qy * z - qz * y;
        var iy =  qw * y + qz * x - qx * z;
        var iz =  qw * z + qx * y - qy * x;
        var iw = - qx * x - qy * y - qz * z;

        // calculate result * inverse quat

        var xx = ix * qw + iw * - qx + iy * - qz - iz * - qy;
        var yy = iy * qw + iw * - qy + iz * - qx - ix * - qz;
        var zz = iz * qw + iw * - qz + ix * - qy - iy * - qx;

        this.setValue( xx, yy, zz );

    };

    //--------------------------------------------------
    //
    //  btQuaternion extend
    //
    //--------------------------------------------------

    Ammo.btQuaternion.prototype.fromArray = function( array, offset ){

        //if ( offset === undefined ) offset = 0;
        offset = offset || 0;
        this.setValue( array[ offset ], array[ offset + 1 ], array[ offset + 2 ], array[ offset + 3 ] );

    };

    Ammo.btQuaternion.prototype.toArray = function( array, offset ){

        //if ( array === undefined ) array = [];
        //if ( offset === undefined ) offset = 0;
        offset = offset || 0;

        array[ offset ] = this.x();
        array[ offset + 1 ] = this.y();
        array[ offset + 2 ] = this.z();
        array[ offset + 3 ] = this.w();

        //return array;

    };

    Ammo.btQuaternion.prototype.setFromAxisAngle = function( axis, angle ){

        var halfAngle = angle * 0.5, s = Math.sin( halfAngle );
        this.setValue( axis[0] * s, axis[1] * s, axis[2] * s, Math.cos( halfAngle ) );

    };

    /*Ammo.btTypedConstraint.prototype.getA = function( v ){

        return 1

    };*/


}

//--------------------------------------------------
//
//  M3
//
//--------------------------------------------------
/*
var multiplyTransforms = function (tr1, tr2) {

    var tr = new Ammo.btTransform();
    tr.setIdentity();

    var q1 = tr1.getRotation();
    var q2 = tr2.getRotation();


    var qax = q1.x(), qay = q1.y(), qaz = q1.z(), qaw = q1.w();
    var qbx = q2.x(), qby = q2.y(), qbz = q2.z(), qbw = q2.w();

    var q = q4([ 
        qax * qbw + qaw * qbx + qay * qbz - qaz * qby,
        qay * qbw + qaw * qby + qaz * qbx - qax * qbz,
        qaz * qbw + qaw * qbz + qax * qby - qay * qbx,
        qaw * qbw - qax * qbx - qay * qby - qaz * qbz
    ]);

    var o1 = tr1.getOrigin();
    var o2 = tr2.getOrigin();

    var p = v3([
        o1.x()+o2.x(),
        o1.y()+o2.y(),
        o1.z()+o2.z()
    ])

    tr.setOrigin( p );
    tr.setRotation( q );

    return tr;

};*/

/*

var barycentricCoordinates = function( pos, p1, p2, p3 ) {

    var edge1 = v3( [ p2.x-p1.x, p2.y-p1.y, p2.z-p1.z ]);
    var edge2 = v3( [ p3.x-p1.x, p3.y-p1.y, p3.z-p1.z ]);

    // Area of triangle ABC              
    var p1p2p3 = edge1.cross(edge2).length2();              
    // Area of BCP              
    var p2p3p = (p3 - p2).cross(pos - p2).length2();              
    // Area of CAP              
    var p3p1p = edge2.cross(pos - p3).length2(); 

    var s = Math.sqrt(p2p3p / p1p2p3);              
    var t = Math.sqrt(p3p1p / p1p2p3);              
    var w = 1 - s - t;

    return v3([s,t,w])

};

*/