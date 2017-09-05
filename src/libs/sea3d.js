// variable undeclared 
var THREE, Ammo, TextDecoder, performance;
/**
 * 	SEA3D SDK
 * 	@author Sunag / http://www.sunag.com.br/
 */



var SEA3D = { VERSION: 18110 };

//'use strict';

SEA3D.getVersion = function () {

	// Max = 16777215 - VV.S.S.BB  | V = Version | S = Subversion | B = Buildversion
	var v = SEA3D.VERSION.toString(), l = v.length;
	return v.substring( 0, l - 4 ) + "." + v.substring( l - 4, l - 3 ) + "." + v.substring( l - 3, l - 2 ) + "." + parseFloat( v.substring( l - 2, l ) ).toString();

};

console.log( 'SEA3D ' + SEA3D.getVersion() );

//
//	STREAM : STANDARD DATA-IO ( LITTLE-ENDIAN )
//

SEA3D.Stream = function ( buffer ) {

	this.position = 0;
	this.buffer = buffer || new ArrayBuffer();

};

SEA3D.Stream.NONE = 0;

// 1D = 0 at 31
SEA3D.Stream.BOOLEAN = 1;

SEA3D.Stream.BYTE = 2;
SEA3D.Stream.UBYTE = 3;

SEA3D.Stream.SHORT = 4;
SEA3D.Stream.USHORT = 5;

SEA3D.Stream.INT24 = 6;
SEA3D.Stream.UINT24 = 7;

SEA3D.Stream.INT = 8;
SEA3D.Stream.UINT = 9;

SEA3D.Stream.FLOAT = 10;
SEA3D.Stream.DOUBLE = 11;
SEA3D.Stream.DECIMAL = 12;

// 2D = 32 at 63

// 3D = 64 at 95
SEA3D.Stream.VECTOR3D = 74;

// 4D = 96 at 127
SEA3D.Stream.VECTOR4D = 106;

// Undefined Size = 128 at 255
SEA3D.Stream.STRING_TINY = 128;
SEA3D.Stream.STRING_SHORT = 129;
SEA3D.Stream.STRING_LONG = 130;

SEA3D.Stream.ASSET = 200;
SEA3D.Stream.GROUP = 255;

SEA3D.Stream.BLEND_MODE = [
	"normal", "add", "subtract", "multiply", "dividing", "mix", "alpha", "screen", "darken",
	"overlay", "colorburn", "linearburn", "lighten", "colordodge", "lineardodge",
	"softlight", "hardlight", "pinlight", "spotlight", "spotlightblend", "hardmix",
	"average", "difference", "exclusion", "hue", "saturation", "color", "value",
	"linearlight", "grainextract", "reflect", "glow", "darkercolor", "lightercolor", "phoenix", "negation"
];

SEA3D.Stream.INTERPOLATION_TABLE =	[
	"normal", "linear",
	"sine.in", "sine.out", "sine.inout",
	"cubic.in", "cubic.out", "cubic.inout",
	"quint.in", "quint.out", "quint.inout",
	"circ.in", "circ.out", "circ.inout",
	"back.in", "back.out", "back.inout",
	"quad.in", "quad.out", "quad.inout",
	"quart.in", "quart.out", "quart.inout",
	"expo.in", "expo.out", "expo.inout",
	"elastic.in", "elastic.out", "elastic.inout",
	"bounce.in", "bounce.out", "bounce.inout"
];

SEA3D.Stream.sizeOf = function ( kind ) {

	if ( kind == 0 ) return 0;
	else if ( kind >= 1 && kind <= 31 ) return 1;
	else if ( kind >= 32 && kind <= 63 ) return 2;
	else if ( kind >= 64 && kind <= 95 ) return 3;
	else if ( kind >= 96 && kind <= 125 ) return 4;
	return - 1;

};

SEA3D.Stream.prototype = {

	constructor: SEA3D.Stream,

	set buffer( val ) {

		this.buf = val;
		this.data = new DataView( val );

	},

	get buffer() {

		return this.buf;

	},

	get bytesAvailable() {

		return this.length - this.position;

	},

	get length() {

		return this.buf.byteLength;

	}

};

SEA3D.Stream.prototype.getByte = function ( pos ) {

	return this.data.getInt8( pos );

};

SEA3D.Stream.prototype.readBytes = function ( len ) {

	var buf = this.buf.slice( this.position, this.position + len );
	this.position += len;
	return buf;

};

SEA3D.Stream.prototype.readByte = function () {

	return this.data.getInt8( this.position ++ );

};

SEA3D.Stream.prototype.readUByte = function () {

	return this.data.getUint8( this.position ++ );

};

SEA3D.Stream.prototype.readBool = function () {

	return this.data.getInt8( this.position ++ ) != 0;

};

SEA3D.Stream.prototype.readShort = function () {

	var v = this.data.getInt16( this.position, true );
	this.position += 2;
	return v;

};

SEA3D.Stream.prototype.readUShort = function () {

	var v = this.data.getUint16( this.position, true );
	this.position += 2;
	return v;

};

SEA3D.Stream.prototype.readUInt24 = function () {

	var v = this.data.getUint32( this.position, true ) & 0xFFFFFF;
	this.position += 3;
	return v;

};

SEA3D.Stream.prototype.readUInt24F = function () {

	return this.readUShort() | ( this.readUByte() << 16 );

};

SEA3D.Stream.prototype.readInt = function () {

	var v = this.data.getInt32( this.position, true );
	this.position += 4;
	return v;

};

SEA3D.Stream.prototype.readUInt = function () {

	var v = this.data.getUint32( this.position, true );
	this.position += 4;
	return v;

};

SEA3D.Stream.prototype.readFloat = function () {

	var v = this.data.getFloat32( this.position, true );
	this.position += 4;
	return v;

};

SEA3D.Stream.prototype.readUInteger = function () {

	var v = this.readUByte(),
		r = v & 0x7F;

	if ( ( v & 0x80 ) != 0 ) {

		v = this.readUByte();
		r |= ( v & 0x7F ) << 7;

		if ( ( v & 0x80 ) != 0 ) {

			v = this.readUByte();
			r |= ( v & 0x7F ) << 13;

		}

	}

	return r;

};

SEA3D.Stream.prototype.readVector2 = function () {

	return { x: this.readFloat(), y: this.readFloat() };

};

SEA3D.Stream.prototype.readVector3 = function () {

	return { x: this.readFloat(), y: this.readFloat(), z: this.readFloat() };

};

SEA3D.Stream.prototype.readVector4 = function () {

	return { x: this.readFloat(), y: this.readFloat(), z: this.readFloat(), w: this.readFloat() };

};

SEA3D.Stream.prototype.readMatrix = function () {

	var mtx = new Float32Array( 16 );

	mtx[ 0 ] = this.readFloat();
	mtx[ 1 ] = this.readFloat();
	mtx[ 2 ] = this.readFloat();
	mtx[ 3 ] = 0.0;
	mtx[ 4 ] = this.readFloat();
	mtx[ 5 ] = this.readFloat();
	mtx[ 6 ] = this.readFloat();
	mtx[ 7 ] = 0.0;
	mtx[ 8 ] = this.readFloat();
	mtx[ 9 ] = this.readFloat();
	mtx[ 10 ] = this.readFloat();
	mtx[ 11 ] = 0.0;
	mtx[ 12 ] = this.readFloat();
	mtx[ 13 ] = this.readFloat();
	mtx[ 14 ] = this.readFloat();
	mtx[ 15 ] = 1.0;

	return mtx;

};

SEA3D.Stream.prototype.readUTF8 = function ( len ) {

	var buffer = this.readBytes( len );

	if ( window.TextDecoder ) {

		return new TextDecoder().decode( buffer );

	} else {

		return decodeURIComponent( escape( String.fromCharCode.apply( null, new Uint8Array( buffer ) ) ) );

	}

};

SEA3D.Stream.prototype.readExt = function () {

	return this.readUTF8( 4 ).replace( /\0/g, "" );

};

SEA3D.Stream.prototype.readUTF8Tiny = function () {

	return this.readUTF8( this.readUByte() );

};

SEA3D.Stream.prototype.readUTF8Short = function () {

	return this.readUTF8( this.readUShort() );

};

SEA3D.Stream.prototype.readUTF8Long = function () {

	return this.readUTF8( this.readUInt() );

};

SEA3D.Stream.prototype.readUByteArray = function ( length ) {

	var v = new Uint8Array( length );

	SEA3D.Stream.memcpy(
		v.buffer,
		0,
		this.buffer,
		this.position,
		length
	);

	this.position += length;

	return v;

};

SEA3D.Stream.prototype.readUShortArray = function ( length ) {

	var v = new Uint16Array( length ),
		len = length * 2;

	SEA3D.Stream.memcpy(
		v.buffer,
		0,
		this.buffer,
		this.position,
		len
	);

	this.position += len;

	return v;

};


SEA3D.Stream.prototype.readUInt24Array = function ( length ) {

	var v = new Uint32Array( length );

	for ( var i = 0; i < length; i ++ ) {

		v[ i ] = this.readUInt24();

	}

	return v;

};


SEA3D.Stream.prototype.readUIntArray = function ( length ) {

	var v = new Uint32Array( length ),
		len = length * 4;

	SEA3D.Stream.memcpy(
		v.buffer,
		0,
		this.buffer,
		this.position,
		len
	);

	this.position += len;

	return v;

};

SEA3D.Stream.prototype.readFloatArray = function ( length ) {

	var v = new Float32Array( length ),
		len = length * 4;

	SEA3D.Stream.memcpy(
		v.buffer,
		0,
		this.buffer,
		this.position,
		len
	);

	this.position += len;

	return v;

};


SEA3D.Stream.prototype.readBlendMode = function () {

	return SEA3D.Stream.BLEND_MODE[ this.readUByte() ];

};

SEA3D.Stream.prototype.readInterpolation = function () {

	return SEA3D.Stream.INTERPOLATION_TABLE[ this.readUByte() ];

};

SEA3D.Stream.prototype.readTags = function ( callback ) {

	var numTag = this.readUByte();

	for ( var i = 0; i < numTag; ++ i ) {

		var kind = this.readUShort();
		var size = this.readUInt();
		var pos = this.position;

		callback( kind, this, size );

		this.position = pos += size;

	}

};

SEA3D.Stream.prototype.readProperties = function ( sea3d ) {

	var count = this.readUByte(),
		props = {}, types = {};

	props.__type = types;

	for ( var i = 0; i < count; i ++ ) {

		var name = this.readUTF8Tiny(),
			type = this.readUByte();

		types[ name ] = type;
		props[ name ] = type == SEA3D.Stream.GROUP ? this.readProperties( sea3d ) : this.readToken( type, sea3d );

	}

	return props;

};

SEA3D.Stream.prototype.readAnimationList = function ( sea3d ) {

	var list = [],
		count = this.readUByte();

	var i = 0;
	while ( i < count ) {

		var attrib = this.readUByte(),
			anm = {};

		anm.relative = ( attrib & 1 ) != 0;

		if ( attrib & 2 ) anm.timeScale = this.readFloat();

		anm.tag = sea3d.getObject( this.readUInt() );

		list[ i ++ ] = anm;

	}

	return list;

};

SEA3D.Stream.prototype.readScriptList = function ( sea3d ) {

	var list = [],
		count = this.readUByte();

	var i = 0;
	while ( i < count ) {

		var attrib = this.readUByte(),
			script = {};

		script.priority = ( attrib & 1 ) | ( attrib & 2 );

		if ( attrib & 4 ) {

			var numParams = this.readUByte();

			script.params = {};

			for ( var j = 0; j < numParams; j ++ ) {

				var name = this.readUTF8Tiny();

				script.params[ name ] = this.readObject( sea3d );

			}

		}

		if ( attrib & 8 ) {

			script.method = this.readUTF8Tiny();

		}

		script.tag = sea3d.getObject( this.readUInt() );

		list[ i ++ ] = script;

	}

	return list;

};

SEA3D.Stream.prototype.readObject = function ( sea3d ) {

	return this.readToken( this.readUByte(), sea3d );

};

SEA3D.Stream.prototype.readToken = function ( type, sea3d ) {

	switch ( type )	{

		// 1D
		case SEA3D.Stream.BOOLEAN:
			return this.readBool();
			break;

		case SEA3D.Stream.UBYTE:
			return this.readUByte();
			break;

		case SEA3D.Stream.USHORT:
			return this.readUShort();
			break;

		case SEA3D.Stream.UINT24:
			return this.readUInt24();
			break;

		case SEA3D.Stream.INT:
			return this.readInt();
			break;

		case SEA3D.Stream.UINT:
			return this.readUInt();
			break;

		case SEA3D.Stream.FLOAT:
			return this.readFloat();
			break;

		// 3D
		case SEA3D.Stream.VECTOR3D:
			return this.readVector3();
			break;

		// 4D
		case SEA3D.Stream.VECTOR4D:
			return this.readVector4();
			break;

		// Undefined Values
		case SEA3D.Stream.STRING_TINY:
			return this.readUTF8Tiny();
			break;

		case SEA3D.Stream.STRING_SHORT:
			return this.readUTF8Short();
			break;

		case SEA3D.Stream.STRING_LONG:
			return this.readUTF8Long();
			break;

		case SEA3D.Stream.ASSET:
			var asset = this.readUInt();
			return asset > 0 ? sea3d.getObject( asset - 1 ) : null;
			break;

		default:
			console.error( "DataType not found!" );

	}

	return null;

};

SEA3D.Stream.prototype.readVector = function ( type, length, offset ) {

	var size = SEA3D.Stream.sizeOf( type ),
		i = offset * size,
		count = i + ( length * size );

	switch ( type )	{

		// 1D
		case SEA3D.Stream.BOOLEAN:

			return this.readUByteArray( count );


		case SEA3D.Stream.UBYTE:

			return this.readUByteArray( count );


		case SEA3D.Stream.USHORT:

			return this.readUShortArray( count );


		case SEA3D.Stream.UINT24:

			return this.readUInt24Array( count );


		case SEA3D.Stream.UINT:

			return this.readUIntArray( count );


		case SEA3D.Stream.FLOAT:

			return this.readFloatArray( count );


		// 3D
		case SEA3D.Stream.VECTOR3D:

			return this.readFloatArray( count );


		// 4D
		case SEA3D.Stream.VECTOR4D:

			return this.readFloatArray( count );

	}

};

SEA3D.Stream.prototype.append = function ( data ) {

	var buffer = new ArrayBuffer( this.data.byteLength + data.byteLength );

	SEA3D.Stream.memcpy( buffer, 0, this.data.buffer, 0, this.data.byteLength );
	SEA3D.Stream.memcpy( buffer, this.data.byteLength, data, 0, data.byteLength );

	this.buffer = buffer;

};

SEA3D.Stream.prototype.concat = function ( position, length ) {

	return new SEA3D.Stream( this.buffer.slice( position, position + length ) );

};

/**
 * @author DataStream.js
 */

SEA3D.Stream.memcpy = function ( dst, dstOffset, src, srcOffset, byteLength ) {

	var dstU8 = new Uint8Array( dst, dstOffset, byteLength );
	var srcU8 = new Uint8Array( src, srcOffset, byteLength );

	dstU8.set( srcU8 );

};

//
//	UByteArray
//

SEA3D.UByteArray = function () {

	this.ubytes = [];
	this.length = 0;

};

SEA3D.UByteArray.prototype = {

	constructor: SEA3D.UByteArray,

	add: function ( ubytes ) {

		this.ubytes.push( ubytes );
		this.length += ubytes.byteLength;

	},

	toBuffer: function () {

		var memcpy = new Uint8Array( this.length );

		for ( var i = 0, offset = 0; i < this.ubytes.length; i ++ ) {

			memcpy.set( this.ubytes[ i ], offset );
			offset += this.ubytes[ i ].byteLength;

		}

		return memcpy.buffer;

	}
};

//
//	Math
//

SEA3D.Math = {
	RAD_TO_DEG: 180 / Math.PI,
	DEG_TO_RAD: Math.PI / 180
};

SEA3D.Math.angle = function ( val ) {

	var ang = 180,
		inv = val < 0;

	val = ( inv ? - val : val ) % 360;

	if ( val > ang ) {

		val = - ang + ( val - ang );

	}

	return ( inv ? - val : val );

};

SEA3D.Math.angleDiff = function ( a, b ) {

	a *= this.DEG_TO_RAD;
	b *= this.DEG_TO_RAD;

	return Math.atan2( Math.sin( a - b ), Math.cos( a - b ) ) * this.RAD_TO_DEG;

};

SEA3D.Math.angleArea = function ( angle, target, area ) {

	return Math.abs( this.angleDiff( angle, target ) ) <= area;

};

SEA3D.Math.direction = function ( x1, y1, x2, y2 ) {

	return Math.atan2( y2 - y1, x2 - x1 );

};

SEA3D.Math.physicalLerp = function ( val, to, deltaTime, duration ) {

	var t = deltaTime / duration;

	if ( t > 1 ) t = 1;

	return val + ( ( to - val ) * t );

};

SEA3D.Math.physicalAngle = function ( val, to, deltaTime, duration ) {

	if ( Math.abs( val - to ) > 180 ) {

		if ( val > to ) {

			to += 360;

		} else {

			to -= 360;

		}

	}

	var t = deltaTime / duration;

	if ( t > 1 ) t = 1;

	return this.angle( val + ( ( to - val ) * t ) );

};

SEA3D.Math.zero = function ( value, precision ) {

	precision = precision || 1.0E-3;

	var pValue = value < 0 ? - value : value;

	if ( pValue - precision < 0 ) value = 0;

	return value;

};

SEA3D.Math.round = function ( value, precision ) {

	precision = Math.pow( 10, precision );

	return Math.round( value * precision ) / precision;

};

SEA3D.Math.lerpAngle = function ( val, tar, t ) {

	if ( Math.abs( val - tar ) > 180 ) {

		if ( val > tar ) {

			tar += 360;

		} else {

			tar -= 360;

		}

	}

	val += ( tar - val ) * t;

	return SEA3D.Math.angle( val );

};

SEA3D.Math.lerpColor = function ( val, tar, t ) {

	var a0 = val >> 24 & 0xff,
		r0 = val >> 16 & 0xff,
		g0 = val >> 8 & 0xff,
		b0 = val & 0xff;

	var a1 = tar >> 24 & 0xff,
		r1 = tar >> 16 & 0xff,
		g1 = tar >> 8 & 0xff,
		b1 = tar & 0xff;

	a0 += ( a1 - a0 ) * t;
	r0 += ( r1 - r0 ) * t;
	g0 += ( g1 - g0 ) * t;
	b0 += ( b1 - b0 ) * t;

	return a0 << 24 | r0 << 16 | g0 << 8 | b0;

};

SEA3D.Math.lerp = function ( val, tar, t ) {

	return val + ( ( tar - val ) * t );

};

//
//	Timer
//

SEA3D.Timer = function () {

	this.time = this.start = Date.now();

};

SEA3D.Timer.prototype = {

	constructor: SEA3D.Timer,

	get now() {

		return Date.now();

	},

	get deltaTime() {

		return Date.now() - this.time;

	},

	get elapsedTime() {

		return Date.now() - this.start;

	},

	update: function () {

		this.time = Date.now();

	}
};

//
//	Object
//

SEA3D.Object = function ( name, data, type, sea3d ) {

	this.name = name;
	this.data = data;
	this.type = type;
	this.sea3d = sea3d;

};

//
//	Geometry Base
//

SEA3D.GeometryBase = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.attrib = data.readUShort();

	this.isBig = ( this.attrib & 1 ) != 0;

	// variable uint
	data.readVInt = this.isBig ? data.readUInt : data.readUShort;

	this.numVertex = data.readVInt();

	this.length = this.numVertex * 3;

};

//
//	Geometry
//

SEA3D.Geometry = function ( name, data, sea3d ) {

	SEA3D.GeometryBase.call( this, name, data, sea3d );

	var i, j, len;

	// NORMAL
	if ( this.attrib & 4 ) {

		this.normal = data.readFloatArray( this.length );

	}

	// TANGENT
	if ( this.attrib & 8 ) {

		this.tangent = data.readFloatArray( this.length );

	}

	// UV
	if ( this.attrib & 32 ) {

		var uvCount = data.readUByte();

		if ( uvCount ) {

			this.uv = [];

			len = this.numVertex * 2;

			i = 0;
			while ( i < uvCount ) {

				// UV VERTEX DATA
				this.uv[ i ++ ] = data.readFloatArray( len );

			}

		}

	}

	// JOINT-INDEXES / WEIGHTS
	if ( this.attrib & 64 ) {

		this.jointPerVertex = data.readUByte();

		var jntLen = this.numVertex * this.jointPerVertex;

		this.joint = data.readUShortArray( jntLen );
		this.weight = data.readFloatArray( jntLen );

	}

	// VERTEX_COLOR
	if ( this.attrib & 128 ) {

		var colorAttrib = data.readUByte();

		var colorCount = data.readUByte();

		if ( colorCount ) {

			this.numColor = ( ( ( colorAttrib & 64 ) >> 6 ) | ( ( colorAttrib & 128 ) >> 6 ) ) + 1;

			this.color = [];

			for ( i = 0 & 15; i < colorCount; i ++ ) {

				this.color.push( data.readFloatArray( this.numVertex * this.numColor ) );

			}

		}

	}

	// VERTEX
	this.vertex = data.readFloatArray( this.length );

	// SUB-MESHES
	var count = data.readUByte();

	this.groups = [];

	if ( this.attrib & 1024 ) {

		// INDEXES
		for ( i = 0, len = 0; i < count; i ++ ) {

			j = data.readVInt() * 3;

			this.groups.push( {
				start: len,
				count: j
			} );

			len += j;

		}

		if ( ! ( this.attrib & 2048 ) ) {

			this.indexes = this.isBig ? data.readUIntArray( len ) : data.readUShortArray( len );

		}

	} else {

		// INDEXES
		var stride = this.isBig ? 4 : 2,
			bytearray = new SEA3D.UByteArray();

		for ( i = 0, j = 0; i < count; i ++ ) {

			len = data.readVInt() * 3;

			this.groups.push( {
				start: j,
				count: len
			} );

			j += len;

			bytearray.add( data.readUByteArray( len * stride ) );

		}

		this.indexes = this.isBig ? new Uint32Array( bytearray.toBuffer() ) : new Uint16Array( bytearray.toBuffer() );

	}

};

SEA3D.Geometry.prototype = Object.create( SEA3D.GeometryBase.prototype );
SEA3D.Geometry.prototype.constructor = SEA3D.Geometry;

SEA3D.Geometry.prototype.type = "geo";

//
//	Object3D
//

SEA3D.Object3D = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.isStatic = false;
	this.visible = true;

	this.attrib = data.readUShort();

	if ( this.attrib & 1 ) this.parent = sea3d.getObject( data.readUInt() );

	if ( this.attrib & 2 ) this.animations = data.readAnimationList( sea3d );

	if ( this.attrib & 4 ) this.scripts = data.readScriptList( sea3d );

	if ( this.attrib & 16 ) this.attributes = sea3d.getObject( data.readUInt() );

	if ( this.attrib & 32 ) {

		var objectType = data.readUByte();

		this.isStatic = ( objectType & 1 ) != 0;
		this.visible = ( objectType & 2 ) == 0;

	}

};

SEA3D.Object3D.prototype.readTag = function ( kind, data, size ) {

};

//
//	Entity3D
//

SEA3D.Entity3D = function ( name, data, sea3d ) {

	SEA3D.Object3D.call( this, name, data, sea3d );

	this.castShadows = true;

	if ( this.attrib & 64 ) {

		var lightType = data.readUByte();

		this.castShadows = ( lightType & 1 ) == 0;

	}

};

SEA3D.Entity3D.prototype = Object.create( SEA3D.Object3D.prototype );
SEA3D.Entity3D.prototype.constructor = SEA3D.Entity3D;

//
//	Sound3D
//

SEA3D.Sound3D = function ( name, data, sea3d ) {

	SEA3D.Object3D.call( this, name, data, sea3d );

	this.autoPlay = ( this.attrib & 64 ) != 0;

	if ( this.attrib & 128 ) this.mixer = sea3d.getObject( data.readUInt() );

	this.sound = sea3d.getObject( data.readUInt() );
	this.volume = data.readFloat();

};

SEA3D.Sound3D.prototype = Object.create( SEA3D.Object3D.prototype );
SEA3D.Sound3D.prototype.constructor = SEA3D.Sound3D;

//
//	Sound Point
//

SEA3D.SoundPoint = function ( name, data, sea3d ) {

	SEA3D.Sound3D.call( this, name, data, sea3d );

	this.position = data.readVector3();
	this.distance = data.readFloat();

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.SoundPoint.prototype = Object.create( SEA3D.Sound3D.prototype );
SEA3D.SoundPoint.prototype.constructor = SEA3D.SoundPoint;

SEA3D.SoundPoint.prototype.type = "sp";

//
//	Container3D
//

SEA3D.Container3D = function ( name, data, sea3d ) {

	SEA3D.Object3D.call( this, name, data, sea3d );

	this.transform = data.readMatrix();

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.Container3D.prototype = Object.create( SEA3D.Object3D.prototype );
SEA3D.Container3D.prototype.constructor = SEA3D.Container3D;

SEA3D.Container3D.prototype.type = "c3d";

//
//	Script URL
//

SEA3D.ScriptURL = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.url = data.readUTF8( data.length );

};

SEA3D.ScriptURL.prototype.type = "src";

//
//	Texture URL
//

SEA3D.TextureURL = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.url = sea3d.config.path + data.readUTF8( data.length );

};

SEA3D.TextureURL.prototype.type = "urlT";

//
//	CubeMap URL
//

SEA3D.CubeMapURL = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.faces = [];

	for ( var i = 0; i < 6; i ++ ) {

		this.faces[ i ] = data.readUTF8Tiny();

	}

};

SEA3D.CubeMapURL.prototype.type = "cURL";

//
//	Actions
//

SEA3D.Actions = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.count = data.readUInt();
	this.actions = [];

	for ( var i = 0; i < this.count; i ++ ) {

		var flag = data.readUByte();
		var kind = data.readUShort();

		var size = data.readUShort();

		var position = data.position;
		var act = this.actions[ i ] = { kind: kind };

		// range of animation
		if ( flag & 1 ) {

			// start and count in frames
			act.range = [ data.readUInt(), data.readUInt() ];

		}

		// time
		if ( flag & 2 ) {

			act.time = data.readUInt();

		}

		// easing
		if ( flag & 4 ) {

			act.intrpl = data.readInterpolation();

			if ( act.intrpl.indexOf( 'back.' ) == 0 ) {

				act.intrplParam0 = data.readFloat();

			} else if ( act.intrpl.indexOf( 'elastic.' ) == 0 ) {

				act.intrplParam0 = data.readFloat();
				act.intrplParam1 = data.readFloat();

			}

		}

		switch ( kind ) {

			case SEA3D.Actions.RTT_TARGET:
				act.source = sea3d.getObject( data.readUInt() );
				act.target = sea3d.getObject( data.readUInt() );
				break;

			case SEA3D.Actions.LOOK_AT:
				act.source = sea3d.getObject( data.readUInt() );
				act.target = sea3d.getObject( data.readUInt() );
				break;

			case SEA3D.Actions.PLAY_SOUND:
				act.sound = sea3d.getObject( data.readUInt() );
				act.offset = data.readUInt();
				break;

			case SEA3D.Actions.PLAY_ANIMATION:
				act.object = sea3d.getObject( data.readUInt() );
				act.name = data.readUTF8Tiny();
				break;

			case SEA3D.Actions.FOG:
				act.color = data.readUInt24();
				act.min = data.readFloat();
				act.max = data.readFloat();
				break;

			case SEA3D.Actions.ENVIRONMENT:
				act.texture = sea3d.getObject( data.readUInt() );
				break;

			case SEA3D.Actions.ENVIRONMENT_COLOR:
				act.color = data.readUInt24F();
				break;

			case SEA3D.Actions.CAMERA:
				act.camera = sea3d.getObject( data.readUInt() );
				break;

			case SEA3D.Actions.SCRIPTS:
				act.scripts = data.readScriptList( sea3d );
				break;

			case SEA3D.Actions.CLASS_OF:
				act.classof = sea3d.getObject( data.readUInt() );
				break;

			case SEA3D.Actions.ATTRIBUTES:
				act.attributes = sea3d.getObject( data.readUInt() );
				break;

			default:
				console.log( "Action \"" + kind + "\" not found." );
				break;

		}

		data.position = position + size;

	}

};

SEA3D.Actions.SCENE = 0;
SEA3D.Actions.ENVIRONMENT_COLOR = 1;
SEA3D.Actions.ENVIRONMENT = 2;
SEA3D.Actions.FOG = 3;
SEA3D.Actions.PLAY_ANIMATION = 4;
SEA3D.Actions.PLAY_SOUND = 5;
SEA3D.Actions.ANIMATION_AUDIO_SYNC = 6;
SEA3D.Actions.LOOK_AT = 7;
SEA3D.Actions.RTT_TARGET = 8;
SEA3D.Actions.CAMERA = 9;
SEA3D.Actions.SCRIPTS = 10;
SEA3D.Actions.CLASS_OF = 11;
SEA3D.Actions.ATTRIBUTES = 12;

SEA3D.Actions.prototype.type = "act";

//
//	Properties
//

SEA3D.Properties = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.props = data.readProperties( sea3d );
	this.props.__name = name;

};

SEA3D.Properties.prototype.type = "prop";

//
//	File Info
//

SEA3D.FileInfo = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.info = data.readProperties( sea3d );
	this.info.__name = name;

	sea3d.info = this.info;

};

SEA3D.FileInfo.prototype.type = "info";

//
//	Java Script
//

SEA3D.JavaScript = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.src = data.readUTF8( data.length );

};

SEA3D.JavaScript.prototype.type = "js";

//
//	Java Script Method
//

SEA3D.JavaScriptMethod = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	var count = data.readUShort();

	this.methods = {};

	for ( var i = 0; i < count; i ++ ) {

		var flag = data.readUByte();
		var method = data.readUTF8Tiny();

		this.methods[ method ] = {
			src: data.readUTF8Long()
		};

	}

};

SEA3D.JavaScriptMethod.prototype.type = "jsm";

//
//	GLSL
//

SEA3D.GLSL = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.src = data.readUTF8( data.length );

};

SEA3D.GLSL.prototype.type = "glsl";

//
//	Dummy
//

SEA3D.Dummy = function ( name, data, sea3d ) {

	SEA3D.Object3D.call( this, name, data, sea3d );

	this.transform = data.readMatrix();

	this.width = data.readFloat();
	this.height = data.readFloat();
	this.depth = data.readFloat();

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.Dummy.prototype = Object.create( SEA3D.Object3D.prototype );
SEA3D.Dummy.prototype.constructor = SEA3D.Dummy;

SEA3D.Dummy.prototype.type = "dmy";

//
//	Line
//

SEA3D.Line = function ( name, data, sea3d ) {

	SEA3D.Object3D.call( this, name, data, sea3d );

	this.count = ( this.attrib & 64 ? data.readUInt() : data.readUShort() ) * 3;
	this.closed = ( this.attrib & 128 ) != 0;
	this.transform = data.readMatrix();

	this.vertex = [];

	var i = 0;
	while ( i < this.count ) {

		this.vertex[ i ++ ] = data.readFloat();

	}

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.Line.prototype = Object.create( SEA3D.Object3D.prototype );
SEA3D.Line.prototype.constructor = SEA3D.Line;

SEA3D.Line.prototype.type = "line";

//
//	Sprite
//

SEA3D.Sprite = function ( name, data, sea3d ) {

	SEA3D.Object3D.call( this, name, data, sea3d );

	if ( this.attrib & 256 ) {

		this.material = sea3d.getObject( data.readUInt() );

	}

	this.position = data.readVector3();

	this.width = data.readFloat();
	this.height = data.readFloat();

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.Sprite.prototype = Object.create( SEA3D.Object3D.prototype );
SEA3D.Sprite.prototype.constructor = SEA3D.Sprite;

SEA3D.Sprite.prototype.type = "m2d";

//
//	Mesh
//

SEA3D.Mesh = function ( name, data, sea3d ) {

	SEA3D.Entity3D.call( this, name, data, sea3d );

	// MATERIAL
	if ( this.attrib & 256 ) {

		this.material = [];

		var len = data.readUByte();

		if ( len == 1 ) this.material[ 0 ] = sea3d.getObject( data.readUInt() );
		else {

			var i = 0;
			while ( i < len ) {

				var matIndex = data.readUInt();

				if ( matIndex > 0 ) this.material[ i ++ ] = sea3d.getObject( matIndex - 1 );
				else this.material[ i ++ ] = undefined;

			}

		}

	}

	if ( this.attrib & 512 ) {

		this.modifiers = [];

		var len = data.readUByte();

		for ( var i = 0; i < len; i ++ ) {

			this.modifiers[ i ] = sea3d.getObject( data.readUInt() );

		}

	}

	if ( this.attrib & 1024 ) {

		this.reference = {
			type: data.readUByte(),
			ref: sea3d.getObject( data.readUInt() )
		};

	}

	this.transform = data.readMatrix();

	this.geometry = sea3d.getObject( data.readUInt() );

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.Mesh.prototype = Object.create( SEA3D.Entity3D.prototype );
SEA3D.Mesh.prototype.constructor = SEA3D.Mesh;

SEA3D.Mesh.prototype.type = "m3d";

//
//	Skeleton
//

SEA3D.Skeleton = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	var length = data.readUShort();

	this.joint = [];

	for ( var i = 0; i < length; i ++ ) {

		this.joint[ i ] = {
			name: data.readUTF8Tiny(),
			parentIndex: data.readUShort() - 1,
			inverseBindMatrix: data.readMatrix()
		};

	}

};

SEA3D.Skeleton.prototype.type = "skl";

//
//	Skeleton Local
//

SEA3D.SkeletonLocal = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	var length = data.readUShort();

	this.joint = [];

	for ( var i = 0; i < length; i ++ ) {

		this.joint[ i ] = {
			name: data.readUTF8Tiny(),
			parentIndex: data.readUShort() - 1,
			// POSITION XYZ
			x: data.readFloat(),
			y: data.readFloat(),
			z: data.readFloat(),
			// QUATERNION XYZW
			qx: data.readFloat(),
			qy: data.readFloat(),
			qz: data.readFloat(),
			qw: data.readFloat()
		};

	}

};

SEA3D.SkeletonLocal.prototype.type = "sklq";

//
//	Animation Base
//

SEA3D.AnimationBase = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	var flag = data.readUByte();

	this.sequence = [];

	if ( flag & 1 ) {

		var count = data.readUShort();

		for ( var i = 0; i < count; i ++ ) {

			var seqFlag = data.readUByte();

			this.sequence[ i ] = {
				name: data.readUTF8Tiny(),
				start: data.readUInt(),
				count: data.readUInt(),
				repeat: ( seqFlag & 1 ) != 0,
				intrpl: ( seqFlag & 2 ) == 0
			};

		}

	}

	this.frameRate = data.readUByte();
	this.numFrames = data.readUInt();

	// no contains sequence
	if ( this.sequence.length == 0 ) {

		this.sequence[ 0 ] = { name: "root", start: 0, count: this.numFrames, repeat: true, intrpl: true };

	}

};

//
//	Animation
//

SEA3D.Animation = function ( name, data, sea3d ) {

	SEA3D.AnimationBase.call( this, name, data, sea3d );

	this.dataList = [];

	for ( var i = 0, l = data.readUByte(); i < l; i ++ ) {

		var kind = data.readUShort(),
			type = data.readUByte();

		var anmRaw = data.readVector( type, this.numFrames, 0 );

		this.dataList.push( {
			kind: kind,
			type: type,
			blockSize: SEA3D.Stream.sizeOf( type ),
			data: anmRaw
		} );

	}

};

SEA3D.Animation.POSITION = 0;
SEA3D.Animation.ROTATION = 1;
SEA3D.Animation.SCALE = 2;
SEA3D.Animation.COLOR = 3;
SEA3D.Animation.MULTIPLIER = 4;
SEA3D.Animation.ATTENUATION_START = 5;
SEA3D.Animation.ATTENUATION_END = 6;
SEA3D.Animation.FOV = 7;
SEA3D.Animation.OFFSET_U = 8;
SEA3D.Animation.OFFSET_V = 9;
SEA3D.Animation.SCALE_U = 10;
SEA3D.Animation.SCALE_V = 11;
SEA3D.Animation.ANGLE = 12;
SEA3D.Animation.ALPHA = 13;
SEA3D.Animation.VOLUME = 14;

SEA3D.Animation.prototype = Object.create( SEA3D.AnimationBase.prototype );
SEA3D.Animation.prototype.constructor = SEA3D.Animation;

SEA3D.Animation.prototype.type = "anm";

//
//	Skeleton Animation
//

SEA3D.SkeletonAnimation = function ( name, data, sea3d ) {

	SEA3D.AnimationBase.call( this, name, data, sea3d );

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.numJoints = data.readUShort();

	this.raw = data.readFloatArray( this.numFrames * this.numJoints * 7 );

};

SEA3D.SkeletonAnimation.prototype.type = "skla";

//
//	Morph
//

SEA3D.Morph = function ( name, data, sea3d ) {

	SEA3D.GeometryBase.call( this, name, data, sea3d );

	var useVertex = ( this.attrib & 2 ) != 0;
	var useNormal = ( this.attrib & 4 ) != 0;

	var nodeCount = data.readUShort();

	this.node = [];

	for ( var i = 0; i < nodeCount; i ++ ) {

		var nodeName = data.readUTF8Tiny(),
			verts, norms;

		if ( useVertex ) verts = data.readFloatArray( this.length );
		if ( useNormal ) norms = data.readFloatArray( this.length );

		this.node[ i ] = { vertex: verts, normal: norms, name: nodeName };

	}

};

SEA3D.Morph.prototype = Object.create( SEA3D.GeometryBase.prototype );
SEA3D.Morph.prototype.constructor = SEA3D.Morph;

SEA3D.Morph.prototype.type = "mph";

//
//	Vertex Animation
//

SEA3D.VertexAnimation = function ( name, data, sea3d ) {

	SEA3D.AnimationBase.call( this, name, data, sea3d );

	var flags = data.readUByte();

	this.isBig = ( flags & 1 ) != 0;

	data.readVInt = this.isBig ? data.readUInt : data.readUShort;

	this.numVertex = data.readVInt();

	this.length = this.numVertex * 3;

	var useVertex = ( flags & 2 ) != 0;
	var useNormal = ( flags & 4 ) != 0;

	this.frame = [];

	var i, verts, norms;

	for ( i = 0; i < this.numFrames; i ++ ) {

		if ( useVertex ) verts = data.readFloatArray( this.length );
		if ( useNormal ) norms = data.readFloatArray( this.length );

		this.frame[ i ] = { vertex: verts, normal: norms };

	}

};

SEA3D.VertexAnimation.prototype = Object.create( SEA3D.AnimationBase.prototype );
SEA3D.VertexAnimation.prototype.constructor = SEA3D.VertexAnimation;

SEA3D.VertexAnimation.prototype.type = "vtxa";

//
//	Camera
//

SEA3D.Camera = function ( name, data, sea3d ) {

	SEA3D.Object3D.call( this, name, data, sea3d );

	if ( this.attrib & 64 ) {

		this.dof = {
			distance: data.readFloat(),
			range: data.readFloat()
		};

	}

	this.transform = data.readMatrix();

	this.fov = data.readFloat();

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.Camera.prototype = Object.create( SEA3D.Object3D.prototype );
SEA3D.Camera.prototype.constructor = SEA3D.Camera;

SEA3D.Camera.prototype.type = "cam";

//
//	Orthographic Camera
//

SEA3D.OrthographicCamera = function ( name, data, sea3d ) {

	SEA3D.Object3D.call( this, name, data, sea3d );

	this.transform = data.readMatrix();

	this.height = data.readFloat();

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.OrthographicCamera.prototype = Object.create( SEA3D.Object3D.prototype );
SEA3D.OrthographicCamera.prototype.constructor = SEA3D.OrthographicCamera;

SEA3D.OrthographicCamera.prototype.type = "camo";

//
//	Joint Object
//

SEA3D.JointObject = function ( name, data, sea3d ) {

	SEA3D.Object3D.call( this, name, data, sea3d );

	this.target = sea3d.getObject( data.readUInt() );
	this.joint = data.readUShort();

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.JointObject.prototype = Object.create( SEA3D.Object3D.prototype );
SEA3D.JointObject.prototype.constructor = SEA3D.JointObject;

SEA3D.JointObject.prototype.type = "jnt";

//
//	Light
//

SEA3D.Light = function ( name, data, sea3d ) {

	SEA3D.Object3D.call( this, name, data, sea3d );

	this.attenStart = Number.MAX_VALUE;
	this.attenEnd = Number.MAX_VALUE;

	if ( this.attrib & 64 ) {

		var shadowHeader = data.readUByte();

		this.shadow = {};

		this.shadow.opacity = shadowHeader & 1 ? data.readFloat() : 1;
		this.shadow.color = shadowHeader & 2 ? data.readUInt24() : 0x000000;

	}

	if ( this.attrib & 512 ) {

		this.attenStart = data.readFloat();
		this.attenEnd = data.readFloat();

	}

	this.color = data.readUInt24();
	this.multiplier = data.readFloat();

};

SEA3D.Light.prototype = Object.create( SEA3D.Object3D.prototype );
SEA3D.Light.prototype.constructor = SEA3D.Light;

//
//	Point Light
//

SEA3D.PointLight = function ( name, data, sea3d ) {

	SEA3D.Light.call( this, name, data, sea3d );

	if ( this.attrib & 128 ) {

		this.attenuation = {
			start: data.readFloat(),
			end: data.readFloat()
		};

	}

	this.position = data.readVector3();

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.PointLight.prototype = Object.create( SEA3D.Light.prototype );
SEA3D.PointLight.prototype.constructor = SEA3D.PointLight;

SEA3D.PointLight.prototype.type = "plht";

//
//	Hemisphere Light
//

SEA3D.HemisphereLight = function ( name, data, sea3d ) {

	SEA3D.Light.call( this, name, data, sea3d );

	if ( this.attrib & 128 ) {

		this.attenuation = {
			start: data.readFloat(),
			end: data.readFloat()
		};

	}

	this.secondColor = data.readUInt24();

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.HemisphereLight.prototype = Object.create( SEA3D.Light.prototype );
SEA3D.HemisphereLight.prototype.constructor = SEA3D.HemisphereLight;

SEA3D.HemisphereLight.prototype.type = "hlht";

//
//	Ambient Light
//

SEA3D.AmbientLight = function ( name, data, sea3d ) {

	SEA3D.Light.call( this, name, data, sea3d );

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.AmbientLight.prototype = Object.create( SEA3D.Light.prototype );
SEA3D.AmbientLight.prototype.constructor = SEA3D.AmbientLight;

SEA3D.AmbientLight.prototype.type = "alht";

//
//	Directional Light
//

SEA3D.DirectionalLight = function ( name, data, sea3d ) {

	SEA3D.Light.call( this, name, data, sea3d );

	this.transform = data.readMatrix();

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.DirectionalLight.prototype = Object.create( SEA3D.Light.prototype );
SEA3D.DirectionalLight.prototype.constructor = SEA3D.DirectionalLight;

SEA3D.DirectionalLight.prototype.type = "dlht";

//
//	Material
//

SEA3D.Material = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.technique = [];
	this.tecniquesDict = {};

	this.attrib = data.readUShort();

	this.alpha = 1;
	this.blendMode = "normal";

	this.doubleSided = ( this.attrib & 1 ) != 0;

	this.receiveLights = ( this.attrib & 2 ) == 0;
	this.receiveShadows = ( this.attrib & 4 ) == 0;
	this.receiveFog = ( this.attrib & 8 ) == 0;

	this.repeat = ( this.attrib & 16 ) == 0;

	if ( this.attrib & 32 )
		this.alpha = data.readFloat();

	if ( this.attrib & 64 )
		this.blendMode = data.readBlendMode();

	if ( this.attrib & 128 )
		this.animations = data.readAnimationList( sea3d );

	this.depthWrite = ( this.attrib & 256 ) == 0;
	this.depthTest = ( this.attrib & 512 ) == 0;

	this.premultipliedAlpha = ( this.attrib & 1024 ) != 0;

	var count = data.readUByte();

	for ( var i = 0; i < count; ++ i ) {

		var kind = data.readUShort();
		var size = data.readUShort();
		var pos = data.position;
		var tech, methodAttrib;

		switch ( kind ) {

			case SEA3D.Material.PHONG:
			
				tech = {
					ambientColor: data.readUInt24(),
					diffuseColor: data.readUInt24(),
					specularColor: data.readUInt24(),

					specular: data.readFloat(),
					gloss: data.readFloat()
				};
				
				break;

			case SEA3D.Material.PHYSICAL:
			
				tech = {
					color: data.readUInt24(),
					roughness: data.readFloat(),
					metalness: data.readFloat()
				};
				
				break;

			case SEA3D.Material.ANISOTROPIC:
				break;

			case SEA3D.Material.COMPOSITE_TEXTURE:
			
				tech = {
					composite: sea3d.getObject( data.readUInt() )
				};
				
				break;

			case SEA3D.Material.DIFFUSE_MAP:
			case SEA3D.Material.SPECULAR_MAP:
			case SEA3D.Material.NORMAL_MAP:
			case SEA3D.Material.AMBIENT_MAP:
			case SEA3D.Material.ALPHA_MAP:
			case SEA3D.Material.EMISSIVE_MAP:
			case SEA3D.Material.ROUGHNESS_MAP:
			case SEA3D.Material.METALNESS_MAP:
			
				tech = {
					texture: sea3d.getObject( data.readUInt() )
				};
				
				break;

			case SEA3D.Material.REFLECTION:
			case SEA3D.Material.FRESNEL_REFLECTION:
			
				tech = {
					texture: sea3d.getObject( data.readUInt() ),
					alpha: data.readFloat()
				};

				if ( kind == SEA3D.Material.FRESNEL_REFLECTION ) {

					tech.power = data.readFloat();
					tech.normal = data.readFloat();

				}
				
				break;

			case SEA3D.Material.REFRACTION:
			
				tech = {
					texture: sea3d.getObject( data.readUInt() ),
					alpha: data.readFloat(),
					ior: data.readFloat()
				};
				
				break;

			case SEA3D.Material.RIM:
			
				tech = {
					color: data.readUInt24(),
					strength: data.readFloat(),
					power: data.readFloat(),
					blendMode: data.readBlendMode()
				};
				
				break;

			case SEA3D.Material.LIGHT_MAP:
			
				tech = {
					texture: sea3d.getObject( data.readUInt() ),
					channel: data.readUByte(),
					blendMode: data.readBlendMode()
				};
				
				break;

			case SEA3D.Material.DETAIL_MAP:
			
				tech = {
					texture: sea3d.getObject( data.readUInt() ),
					scale: data.readFloat(),
					blendMode: data.readBlendMode()
				};
				
				break;

			case SEA3D.Material.CEL:
			
				tech = {
					color: data.readUInt24(),
					levels: data.readUByte(),
					size: data.readFloat(),
					specularCutOff: data.readFloat(),
					smoothness: data.readFloat()
				};
				
				break;

			case SEA3D.Material.TRANSLUCENT:
			
				tech = {
					translucency: data.readFloat(),
					scattering: data.readFloat()
				};
				
				break;

			case SEA3D.Material.BLEND_NORMAL_MAP:
			
				methodAttrib = data.readUByte();

				tech = {
					texture: sea3d.getObject( data.readUInt() ),
					secondaryTexture: sea3d.getObject( data.readUInt() )
				};

				if ( methodAttrib & 1 ) {

					tech.offsetX0 = data.readFloat();
					tech.offsetY0 = data.readFloat();

					tech.offsetX1 = data.readFloat();
					tech.offsetY1 = data.readFloat();

				} else {

					tech.offsetX0 = tech.offsetY0 =
					tech.offsetX1 = tech.offsetY1 = 0;

				}

				tech.animate = methodAttrib & 2;
				
				break;

			case SEA3D.Material.MIRROR_REFLECTION:
			
				tech = {
					texture: sea3d.getObject( data.readUInt() ),
					alpha: data.readFloat()
				};
				break;

			
				/*tech = {
					texture: sea3d.getObject( data.readUInt() )
				};
				
				break;*/

			case SEA3D.Material.EMISSIVE:
			
				tech = {
					color: data.readUInt24F()
				};
				
				break;

			case SEA3D.Material.VERTEX_COLOR:
			
				tech = {
					blendMode: data.readBlendMode()
				};
				
				break;

			case SEA3D.Material.WRAP_LIGHTING:
			
				tech = {
					color: data.readUInt24(),
					strength: data.readFloat()
				};
				
				break;

			case SEA3D.Material.COLOR_REPLACE:
			
				methodAttrib = data.readUByte();

				tech = {
					red: data.readUInt24(),
					green: data.readUInt24(),
					blue: data.readUInt24F()
				};

				if ( methodAttrib & 1 ) tech.mask = sea3d.getObject( data.readUInt() );

				if ( methodAttrib & 2 ) tech.alpha = data.readFloat();

				break;

			case SEA3D.Material.REFLECTION_SPHERICAL:
			
				tech = {
					texture: sea3d.getObject( data.readUInt() ),
					alpha: data.readFloat()
				};
				
				break;

			case SEA3D.Material.REFLECTIVITY:
			
				methodAttrib = data.readUByte();

				tech = {
					strength: data.readFloat()
				};

				if ( methodAttrib & 1 ) tech.mask = sea3d.getObject( data.readUInt() );

				break;

			case SEA3D.Material.CLEAR_COAT:
			
				tech = {
					strength: data.readFloat(),
					roughness: data.readFloat()
				};
				
				break;

			case SEA3D.Material.FLACCIDITY:
			
				methodAttrib = data.readUByte();

				tech = {
					target: sea3d.getObject( data.readUInt() ),
					scale: data.readFloat(),
					spring: data.readFloat(),
					damping: data.readFloat()
				};

				if ( methodAttrib & 1 ) tech.mask = sea3d.getObject( data.readUInt() );

				break;
				
			default:
			
				console.warn( "SEA3D: MaterialTechnique not found:", kind.toString( 16 ) );

				data.position = pos += size;
				
				continue;

		}

		tech.kind = kind;

		this.technique.push( tech );
		this.tecniquesDict[ kind ] = tech;

		data.position = pos += size;

	}

};

SEA3D.Material.PHONG = 0;
SEA3D.Material.COMPOSITE_TEXTURE = 1;
SEA3D.Material.DIFFUSE_MAP = 2;
SEA3D.Material.SPECULAR_MAP = 3;
SEA3D.Material.REFLECTION = 4;
SEA3D.Material.REFRACTION = 5;
SEA3D.Material.NORMAL_MAP = 6;
SEA3D.Material.FRESNEL_REFLECTION = 7;
SEA3D.Material.RIM = 8;
SEA3D.Material.LIGHT_MAP = 9;
SEA3D.Material.DETAIL_MAP = 10;
SEA3D.Material.CEL = 11;
SEA3D.Material.TRANSLUCENT = 12;
SEA3D.Material.BLEND_NORMAL_MAP = 13;
SEA3D.Material.MIRROR_REFLECTION = 14;
SEA3D.Material.AMBIENT_MAP = 15;
SEA3D.Material.ALPHA_MAP = 16;
SEA3D.Material.EMISSIVE_MAP = 17;
SEA3D.Material.VERTEX_COLOR = 18;
SEA3D.Material.WRAP_LIGHTING = 19;
SEA3D.Material.COLOR_REPLACE = 20;
SEA3D.Material.REFLECTION_SPHERICAL = 21;
SEA3D.Material.ANISOTROPIC = 22;
SEA3D.Material.EMISSIVE = 23;
SEA3D.Material.PHYSICAL = 24;
SEA3D.Material.ROUGHNESS_MAP = 25;
SEA3D.Material.METALNESS_MAP = 26;
SEA3D.Material.REFLECTIVITY = 27;
SEA3D.Material.CLEAR_COAT = 28;
SEA3D.Material.FLACCIDITY = 29;

SEA3D.Material.prototype.type = "mat";

//
//	Composite
//

SEA3D.Composite = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	var layerCount = data.readUByte();

	this.layer = [];

	for ( var i = 0; i < layerCount; i ++ ) {

		this.layer[ i ] = new SEA3D.Composite.prototype.Layer( data, sea3d );

	}

};

SEA3D.Composite.prototype.getLayerByName = function ( name ) {

	for ( var i = 0; i < this.layer.length; i ++ ) {

		if ( this.layer[ i ].name == name ) {

			return this.layer[ i ];

		}

	}

};

SEA3D.Composite.prototype.Layer = function ( data, sea3d ) {

	var attrib = data.readUShort();

	if ( attrib & 1 ) this.texture = new SEA3D.Composite.LayerBitmap( data, sea3d );
	else this.color = data.readUInt24();

	if ( attrib & 2 ) {

		this.mask = new SEA3D.Composite.LayerBitmap( data, sea3d );

	}

	if ( attrib & 4 ) {

		this.name = data.readUTF8Tiny();

	}

	this.blendMode = attrib & 8 ? data.readBlendMode() : "normal";

	this.opacity = attrib & 16 ? data.readFloat() : 1;

};

SEA3D.Composite.LayerBitmap = function ( data, sea3d ) {

	this.map = sea3d.getObject( data.readUInt() );

	var attrib = data.readUShort();

	this.channel = attrib & 1 ? data.readUByte() : 0;
	this.repeat = attrib & 2 == 0;
	this.offsetU = attrib & 4 ? data.readFloat() : 0;
	this.offsetV = attrib & 8 ? data.readFloat() : 0;
	this.scaleU = attrib & 16 ? data.readFloat() : 1;
	this.scaleV = attrib & 32 ? data.readFloat() : 1;
	this.rotation = attrib & 64 ? data.readFloat() : 0;

	if ( attrib & 128 ) this.animation = data.readAnimationList( sea3d );

};

SEA3D.Composite.prototype.type = "ctex";

//
//	Planar Render
//

SEA3D.PlanarRender = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.attrib = data.readUByte();

	this.quality = ( this.attrib & 1 ) | ( this.attrib & 2 );
	this.transform = data.readMatrix();

};

SEA3D.PlanarRender.prototype.type = "rttp";

//
//	Cube Render
//

SEA3D.CubeRender = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.attrib = data.readUByte();

	this.quality = ( this.attrib & 1 ) | ( this.attrib & 2 );
	this.position = data.readVector3();

};

SEA3D.CubeRender.prototype.type = "rttc";

//
//	Cube Maps
//

SEA3D.CubeMap = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.transparent = false;

	this.extension = data.readExt();

	this.faces = [];

	for ( var i = 0; i < 6; i ++ ) {

		var size = data.readUInt();

		this.faces[ i ] = data.concat( data.position, size );

		data.position += size;

	}

};

SEA3D.CubeMap.prototype.type = "cmap";

//
//	JPEG
//

SEA3D.JPEG = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.transparent = false;

};

SEA3D.JPEG.prototype.type = "jpg";

//
//	JPEG_XR
//

SEA3D.JPEG_XR = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.transparent = true;

};

SEA3D.JPEG_XR.prototype.type = "wdp";

//
//	PNG
//

SEA3D.PNG = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.transparent = data.getByte( 25 ) == 0x06;

};

SEA3D.PNG.prototype.type = "png";

//
//	GIF
//

SEA3D.GIF = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.transparent = data.getByte( 11 ) > 0;

};

SEA3D.GIF.prototype.type = "gif";

//
//	OGG
//

SEA3D.OGG = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

};

SEA3D.OGG.prototype.type = "ogg";

//
//	MP3
//

SEA3D.MP3 = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

};

SEA3D.MP3.prototype.type = "mp3";

//
//	Texture Update
//

SEA3D.TextureUpdate = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.index = data.readUInt();
	this.bytes = data.concat( data.position, data.length - data.position );

};

SEA3D.TextureUpdate.prototype.type = "uTex";

//
//	FILE FORMAT
//

SEA3D.File = function ( config ) {

	this.config = {
		streaming: true,
		timeLimit: 60,
		progressive: false
	};

	if ( config ) {

		if ( config.streaming !== undefined ) this.config.streaming = config.streaming;
		if ( config.timeLimit !== undefined ) this.config.timeLimit = config.timeLimit;
		if ( config.progressive !== undefined ) this.config.progressive = config.progressive;
		if ( config.path !== undefined ) this.config.path = config.path;

	}

	this.version = SEA3D.VERSION;
	this.objects = [];
	this.typeClass = {};
	this.typeRead = {};
	this.typeUnique = {};
	this.position =
	this.dataPosition = 0;
	this.scope = this;

	// SEA3D
	this.addClass( SEA3D.FileInfo, true );
	this.addClass( SEA3D.Geometry, true );
	this.addClass( SEA3D.Mesh );
	this.addClass( SEA3D.Sprite );
	this.addClass( SEA3D.Material );
	this.addClass( SEA3D.Composite );
	this.addClass( SEA3D.PointLight );
	this.addClass( SEA3D.DirectionalLight );
	this.addClass( SEA3D.HemisphereLight );
	this.addClass( SEA3D.AmbientLight );
	this.addClass( SEA3D.Skeleton, true );
	this.addClass( SEA3D.SkeletonLocal, true );
	this.addClass( SEA3D.SkeletonAnimation, true );
	this.addClass( SEA3D.JointObject );
	this.addClass( SEA3D.Camera );
	this.addClass( SEA3D.OrthographicCamera );
	this.addClass( SEA3D.Morph, true );
	this.addClass( SEA3D.VertexAnimation, true );
	this.addClass( SEA3D.CubeMap, true );
	this.addClass( SEA3D.Animation, true );
	this.addClass( SEA3D.Dummy );
	this.addClass( SEA3D.Line );
	this.addClass( SEA3D.SoundPoint );
	this.addClass( SEA3D.PlanarRender );
	this.addClass( SEA3D.CubeRender );
	this.addClass( SEA3D.Actions );
	this.addClass( SEA3D.Container3D );
	this.addClass( SEA3D.Properties );

	// URL BASED
	this.addClass( SEA3D.ScriptURL, true );
	this.addClass( SEA3D.TextureURL, true );
	this.addClass( SEA3D.CubeMapURL, true );

	// UNIVERSAL
	this.addClass( SEA3D.JPEG, true );
	this.addClass( SEA3D.JPEG_XR, true );
	this.addClass( SEA3D.PNG, true );
	this.addClass( SEA3D.GIF, true );
	this.addClass( SEA3D.OGG, true );
	this.addClass( SEA3D.MP3, true );
	this.addClass( SEA3D.JavaScript, true );
	this.addClass( SEA3D.JavaScriptMethod, true );
	this.addClass( SEA3D.GLSL, true );

	// Updaters
	this.addClass( SEA3D.TextureUpdate, true );

	// Extensions
	var i = SEA3D.File.Extensions.length;

	while ( i -- ) {

		SEA3D.File.Extensions[ i ].call( this );

	}

};

SEA3D.File.Extensions = [];
SEA3D.File.CompressionLibs = {};
SEA3D.File.DecompressionMethod = {};

SEA3D.File.setExtension = function ( callback ) {

	SEA3D.File.Extensions.push( callback );

};

SEA3D.File.setDecompressionEngine = function ( id, name, method ) {

	SEA3D.File.CompressionLibs[ id ] = name;
	SEA3D.File.DecompressionMethod[ id ] = method;

};

SEA3D.File.prototype.addClass = function ( clazz, unique ) {

	this.typeClass[ clazz.prototype.type ] = clazz;
	this.typeUnique[ clazz.prototype.type ] = unique === true;

};

SEA3D.File.prototype.readHead = function () {

	if ( this.stream.bytesAvailable < 16 )
		return false;

	if ( this.stream.readUTF8( 3 ) != "SEA" )
		throw new Error( "Invalid SEA3D format." );

	this.sign = this.stream.readUTF8( 3 );

	this.version = this.stream.readUInt24();

	if ( this.stream.readUByte() != 0 ) {

		throw new Error( "Protection algorithm not compatible." );

	}

	this.compressionID = this.stream.readUByte();

	this.compressionAlgorithm = SEA3D.File.CompressionLibs[ this.compressionID ];
	this.decompressionMethod = SEA3D.File.DecompressionMethod[ this.compressionID ];

	if ( this.compressionID > 0 && ! this.decompressionMethod ) {

		throw new Error( "Compression algorithm not compatible." );

	}

	this.length = this.stream.readUInt();

	this.dataPosition = this.stream.position;

	this.objects.length = 0;

	this.state = this.readBody;

	if ( this.onHead ) {

		this.onHead( {
			file: this,
			sign: this.sign
		} );

	}

	return true;

};

SEA3D.File.prototype.getObject = function ( index ) {

	return this.objects[ index ];

};

SEA3D.File.prototype.getObjectByName = function ( name ) {

	return this.objects[ name ];

};

SEA3D.File.prototype.readSEAObject = function () {

	if ( this.stream.bytesAvailable < 4 )
		return null;

	var size = this.stream.readUInt(),
		position = this.stream.position;

	if ( this.stream.bytesAvailable < size )
		return null;

	var flag = this.stream.readUByte(),
		type = this.stream.readExt(),
		meta = null;

	var name = flag & 1 ? this.stream.readUTF8Tiny() : "",
		compressed = ( flag & 2 ) != 0,
		streaming = ( flag & 4 ) != 0;

	if ( flag & 8 ) {

		var metalen = this.stream.readUShort();
		var metabytes = this.stream.concat( this.stream.position, metalen );

		this.stream.position += metalen;

		if ( compressed && this.decompressionMethod ) {

			metabytes.buffer = this.decompressionMethod( metabytes.buffer );

		}

		meta = metabytes.readProperties( this );

	}

	size -= this.stream.position - position;
	position = this.stream.position;

	var data = this.stream.concat( position, size ),
		obj;

	if ( this.typeClass[ type ] ) {

		if ( compressed && this.decompressionMethod ) {

			data.buffer = this.decompressionMethod( data.buffer );

		}

		obj = new this.typeClass[ type ]( name, data, this );

		if ( ( this.config.streaming && streaming || this.config.forceStreaming ) && this.typeRead[ type ] ) {

			this.typeRead[ type ].call( this.scope, obj );

		}

	} else {

		obj = new SEA3D.Object( name, data, type, this );

		console.warn( "SEA3D: Unknown format \"" + type + "\" of file \"" + name + "\". Add a module referring for this format." );

	}

	obj.streaming = streaming;
	obj.metadata = meta;

	this.objects.push( this.objects[ obj.name + "." + obj.type ] = obj );

	this.dataPosition = position + size;

	++ this.position;

	return obj;

};

SEA3D.File.prototype.isDone = function () {

	return this.position == this.length;

};

SEA3D.File.prototype.readBody = function () {

	this.timer.update();

	if ( ! this.resume ) return false;

	while ( this.position < this.length ) {

		if ( this.timer.deltaTime < this.config.timeLimit ) {

			this.stream.position = this.dataPosition;

			var sea = this.readSEAObject();

			if ( sea ) this.dispatchCompleteObject( sea );
			else return false;

		} else return false;

	}

	this.state = this.readComplete;

	return true;

};

SEA3D.File.prototype.initParse = function () {

	this.timer = new SEA3D.Timer();
	this.position = 0;
	this.resume = true;

};

SEA3D.File.prototype.parse = function () {

	this.initParse();

	if ( isFinite( this.config.timeLimit ) ) requestAnimationFrame( this.parseObject.bind( this ) );
	else this.parseObject();

};

SEA3D.File.prototype.parseObject = function () {

	this.timer.update();

	while ( this.position < this.length && this.timer.deltaTime < this.config.timeLimit ) {

		var obj = this.objects[ this.position ++ ],
			type = obj.type;

		if ( ! this.typeUnique[ type ] ) delete obj.tag;

		if ( ( obj.streaming || this.config.forceStreaming ) && this.typeRead[ type ] ) {

			if ( obj.tag == undefined ) {

				this.typeRead[ type ].call( this.scope, obj );

			}

		}

	}

	if ( this.position == this.length ) {

		var elapsedTime = this.timer.elapsedTime;
		var message = elapsedTime + "ms, " + this.objects.length + " objects";

		if ( this.onParseComplete ) {

			this.onParseComplete( {
				file: this,
				timeTotal: elapsedTime,
				message: message
			} );

		} else console.log( "SEA3D Parse Complete:", message );

	} else {

		if ( this.onParseProgress ) {

			this.onParseProgress( {
				file: this,
				loaded: this.position,
				total: this.length
			} );

		}

		setTimeout( this.parseObject.bind( this ), 10 );

	}

};

SEA3D.File.prototype.readComplete = function () {

	this.stream.position = this.dataPosition;

	if ( this.stream.readUInt24F() != 0x5EA3D1 )
		console.warn( "SEA3D file is corrupted." );

	delete this.state;

	return false;

};

SEA3D.File.prototype.readState = function () {

	while ( this.state() ) continue;

	if ( this.state ) {

		requestAnimationFrame( this.readState.bind( this ) );

		this.dispatchProgress();

	} else {

		this.dispatchComplete();

	}

};

SEA3D.File.prototype.append = function( buffer ) {

	if (this.state) {

		this.stream.append( buffer );

	} else {

		this.read( buffer );

	}

};

SEA3D.File.prototype.read = function ( buffer ) {

	if ( ! buffer ) throw new Error( "No data found." );

	this.initParse();

	this.stream = new SEA3D.Stream( buffer );
	this.state = this.readHead;

	this.readState();

};

SEA3D.File.prototype.dispatchCompleteObject = function ( obj ) {

	if ( ! this.onCompleteObject ) return;

	this.onCompleteObject( {
		file: this,
		object: obj
	} );

};

SEA3D.File.prototype.dispatchProgress = function () {

	if ( ! this.onProgress ) return;

	this.onProgress( {
		file: this,
		loaded: this.position,
		total: this.length
	} );

};

SEA3D.File.prototype.dispatchDownloadProgress = function ( position, length ) {

	if ( ! this.onDownloadProgress ) return;

	this.onDownloadProgress( {
		file: this,
		loaded: position,
		total: length
	} );

};

SEA3D.File.prototype.dispatchComplete = function () {

	var elapsedTime = this.timer.elapsedTime;
	var message = elapsedTime + "ms, " + this.objects.length + " objects";

	if ( this.onComplete ) this.onComplete( {
		file: this,
		timeTotal: elapsedTime,
		message: message
	} );
	else console.log( "SEA3D:", message );

};

SEA3D.File.prototype.dispatchError = function ( id, message ) {

	if ( this.onError ) this.onError( { file: this, id: id, message: message } );
	else console.error( "SEA3D: #" + id, message );

};

SEA3D.File.prototype.load = function ( url ) {

	var self = this,
		xhr = new XMLHttpRequest();

	xhr.open( "GET", url, true );

	if (!this.config.path) {

		this.config.path = THREE.Loader.prototype.extractUrlBase( url );

	}

	if ( self.config.progressive ) {

		var position = 0;

		xhr.overrideMimeType( 'text/plain; charset=x-user-defined' );

	} else {

		xhr.responseType = 'arraybuffer';

	}

	xhr.onprogress = function ( e ) {

		if ( self.config.progressive ) {

			var binStr = xhr.responseText.substring( position ),
				bytes = new Uint8Array( binStr.length );

			for ( var i = 0; i < binStr.length; i ++ ) {

				bytes[ i ] = binStr.charCodeAt( i ) & 0xFF;

			}

			position += binStr.length;

			self.append( bytes.buffer );

		}

		self.dispatchDownloadProgress( e.loaded, e.total );

	};

	if ( ! self.config.progressive ) {

		xhr.onreadystatechange = function () {

			if ( xhr.readyState === 4 ) {

				if ( xhr.status === 200 || xhr.status === 0 ) {

					self.read( this.response );

				} else {

					this.dispatchError( 1001, "Couldn't load [" + url + "] [" + xhr.status + "]" );

				}

			}

		};

	}

	xhr.send();

};

/*
Copyright (c) 2011 Juan Mellado

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
References:
- "LZMA SDK" by Igor Pavlov
  http://www.7-zip.org/sdk.html
*/

//'use strict';

SEA3D.LZMA = function () {

	var LZMA = LZMA || {};

	LZMA.OutWindow = function () {

		this._windowSize = 0;

	};

	LZMA.OutWindow.prototype.create = function ( windowSize ) {

		if ( ( ! this._buffer ) || ( this._windowSize !== windowSize ) ) {

			this._buffer = [];

		}
		this._windowSize = windowSize;
		this._pos = 0;
		this._streamPos = 0;

	};

	LZMA.OutWindow.prototype.flush = function () {

		var size = this._pos - this._streamPos;
		if ( size !== 0 ) {

			while ( size -- ) {

				this._stream.writeByte( this._buffer[ this._streamPos ++ ] );

			}
			if ( this._pos >= this._windowSize ) {

				this._pos = 0;

			}
			this._streamPos = this._pos;

		}

	};

	LZMA.OutWindow.prototype.releaseStream = function () {

		this.flush();
		this._stream = null;

	};

	LZMA.OutWindow.prototype.setStream = function ( stream ) {

		this.releaseStream();
		this._stream = stream;

	};

	LZMA.OutWindow.prototype.init = function ( solid ) {

		if ( ! solid ) {

			this._streamPos = 0;
			this._pos = 0;

		}

	};

	LZMA.OutWindow.prototype.copyBlock = function ( distance, len ) {

		var pos = this._pos - distance - 1;
		if ( pos < 0 ) {

			pos += this._windowSize;

		}
		while ( len -- ) {

			if ( pos >= this._windowSize ) {

				pos = 0;

			}
			this._buffer[ this._pos ++ ] = this._buffer[ pos ++ ];
			if ( this._pos >= this._windowSize ) {

				this.flush();

			}

		}

	};

	LZMA.OutWindow.prototype.putByte = function ( b ) {

		this._buffer[ this._pos ++ ] = b;
		if ( this._pos >= this._windowSize ) {

			this.flush();

		}

	};

	LZMA.OutWindow.prototype.getByte = function ( distance ) {

		var pos = this._pos - distance - 1;
		if ( pos < 0 ) {

			pos += this._windowSize;

		}
		return this._buffer[ pos ];

	};

	LZMA.RangeDecoder = function () {
	};

	LZMA.RangeDecoder.prototype.setStream = function ( stream ) {

		this._stream = stream;

	};

	LZMA.RangeDecoder.prototype.releaseStream = function () {

		this._stream = null;

	};

	LZMA.RangeDecoder.prototype.init = function () {

		var i = 5;

		this._code = 0;
		this._range = - 1;

		while ( i -- ) {

			this._code = ( this._code << 8 ) | this._stream.readByte();

		}

	};

	LZMA.RangeDecoder.prototype.decodeDirectBits = function ( numTotalBits ) {

		var result = 0, i = numTotalBits, t;

		while ( i -- ) {

			this._range >>>= 1;
			t = ( this._code - this._range ) >>> 31;
			this._code -= this._range & ( t - 1 );
			result = ( result << 1 ) | ( 1 - t );

			if ( ( this._range & 0xff000000 ) === 0 ) {

				this._code = ( this._code << 8 ) | this._stream.readByte();
				this._range <<= 8;

			}

		}

		return result;

	};

	LZMA.RangeDecoder.prototype.decodeBit = function ( probs, index ) {

		var prob = probs[ index ],
			newBound = ( this._range >>> 11 ) * prob;

		if ( ( this._code ^ 0x80000000 ) < ( newBound ^ 0x80000000 ) ) {

			this._range = newBound;
			probs[ index ] += ( 2048 - prob ) >>> 5;
			if ( ( this._range & 0xff000000 ) === 0 ) {

				this._code = ( this._code << 8 ) | this._stream.readByte();
				this._range <<= 8;

			}
			return 0;

		}

		this._range -= newBound;
		this._code -= newBound;
		probs[ index ] -= prob >>> 5;
		if ( ( this._range & 0xff000000 ) === 0 ) {

			this._code = ( this._code << 8 ) | this._stream.readByte();
			this._range <<= 8;

		}
		return 1;

	};

	LZMA.initBitModels = function ( probs, len ) {

		while ( len -- ) {

			probs[ len ] = 1024;

		}

	};

	LZMA.BitTreeDecoder = function ( numBitLevels ) {

		this._models = [];
		this._numBitLevels = numBitLevels;

	};

	LZMA.BitTreeDecoder.prototype.init = function () {

		LZMA.initBitModels( this._models, 1 << this._numBitLevels );

	};

	LZMA.BitTreeDecoder.prototype.decode = function ( rangeDecoder ) {

		var m = 1, i = this._numBitLevels;

		while ( i -- ) {

			m = ( m << 1 ) | rangeDecoder.decodeBit( this._models, m );

		}
		return m - ( 1 << this._numBitLevels );

	};

	LZMA.BitTreeDecoder.prototype.reverseDecode = function ( rangeDecoder ) {

		var m = 1, symbol = 0, i = 0, bit;

		for ( ; i < this._numBitLevels; ++ i ) {

			bit = rangeDecoder.decodeBit( this._models, m );
			m = ( m << 1 ) | bit;
			symbol |= bit << i;

		}
		return symbol;

	};

	LZMA.reverseDecode2 = function ( models, startIndex, rangeDecoder, numBitLevels ) {

		var m = 1, symbol = 0, i = 0, bit;

		for ( ; i < numBitLevels; ++ i ) {

			bit = rangeDecoder.decodeBit( models, startIndex + m );
			m = ( m << 1 ) | bit;
			symbol |= bit << i;

		}
		return symbol;

	};

	LZMA.LenDecoder = function () {

		this._choice = [];
		this._lowCoder = [];
		this._midCoder = [];
		this._highCoder = new LZMA.BitTreeDecoder( 8 );
		this._numPosStates = 0;

	};

	LZMA.LenDecoder.prototype.create = function ( numPosStates ) {

		for ( ; this._numPosStates < numPosStates; ++ this._numPosStates ) {

			this._lowCoder[ this._numPosStates ] = new LZMA.BitTreeDecoder( 3 );
			this._midCoder[ this._numPosStates ] = new LZMA.BitTreeDecoder( 3 );

		}

	};

	LZMA.LenDecoder.prototype.init = function () {

		var i = this._numPosStates;
		LZMA.initBitModels( this._choice, 2 );
		while ( i -- ) {

			this._lowCoder[ i ].init();
			this._midCoder[ i ].init();

		}
		this._highCoder.init();

	};

	LZMA.LenDecoder.prototype.decode = function ( rangeDecoder, posState ) {

		if ( rangeDecoder.decodeBit( this._choice, 0 ) === 0 ) {

			return this._lowCoder[ posState ].decode( rangeDecoder );

		}
		if ( rangeDecoder.decodeBit( this._choice, 1 ) === 0 ) {

			return 8 + this._midCoder[ posState ].decode( rangeDecoder );

		}
		return 16 + this._highCoder.decode( rangeDecoder );

	};

	LZMA.Decoder2 = function () {

		this._decoders = [];

	};

	LZMA.Decoder2.prototype.init = function () {

		LZMA.initBitModels( this._decoders, 0x300 );

	};

	LZMA.Decoder2.prototype.decodeNormal = function ( rangeDecoder ) {

		var symbol = 1;

		do {

			symbol = ( symbol << 1 ) | rangeDecoder.decodeBit( this._decoders, symbol );

		}while ( symbol < 0x100 );

		return symbol & 0xff;

	};

	LZMA.Decoder2.prototype.decodeWithMatchByte = function ( rangeDecoder, matchByte ) {

		var symbol = 1, matchBit, bit;

		do {

			matchBit = ( matchByte >> 7 ) & 1;
			matchByte <<= 1;
			bit = rangeDecoder.decodeBit( this._decoders, ( ( 1 + matchBit ) << 8 ) + symbol );
			symbol = ( symbol << 1 ) | bit;
			if ( matchBit !== bit ) {

				while ( symbol < 0x100 ) {

					symbol = ( symbol << 1 ) | rangeDecoder.decodeBit( this._decoders, symbol );

				}
				break;

			}

		}while ( symbol < 0x100 );

		return symbol & 0xff;

	};

	LZMA.LiteralDecoder = function () {
	};

	LZMA.LiteralDecoder.prototype.create = function ( numPosBits, numPrevBits ) {

		var i;

		if ( this._coders
			&& ( this._numPrevBits === numPrevBits )
			&& ( this._numPosBits === numPosBits ) ) {

			return;

		}
		this._numPosBits = numPosBits;
		this._posMask = ( 1 << numPosBits ) - 1;
		this._numPrevBits = numPrevBits;

		this._coders = [];

		i = 1 << ( this._numPrevBits + this._numPosBits );
		while ( i -- ) {

			this._coders[ i ] = new LZMA.Decoder2();

		}

	};

	LZMA.LiteralDecoder.prototype.init = function () {

		var i = 1 << ( this._numPrevBits + this._numPosBits );
		while ( i -- ) {

			this._coders[ i ].init();

		}

	};

	LZMA.LiteralDecoder.prototype.getDecoder = function ( pos, prevByte ) {

		return this._coders[ ( ( pos & this._posMask ) << this._numPrevBits )
			+ ( ( prevByte & 0xff ) >>> ( 8 - this._numPrevBits ) ) ];

	};

	LZMA.Decoder = function () {

		this._outWindow = new LZMA.OutWindow();
		this._rangeDecoder = new LZMA.RangeDecoder();
		this._isMatchDecoders = [];
		this._isRepDecoders = [];
		this._isRepG0Decoders = [];
		this._isRepG1Decoders = [];
		this._isRepG2Decoders = [];
		this._isRep0LongDecoders = [];
		this._posSlotDecoder = [];
		this._posDecoders = [];
		this._posAlignDecoder = new LZMA.BitTreeDecoder( 4 );
		this._lenDecoder = new LZMA.LenDecoder();
		this._repLenDecoder = new LZMA.LenDecoder();
		this._literalDecoder = new LZMA.LiteralDecoder();
		this._dictionarySize = - 1;
		this._dictionarySizeCheck = - 1;

		this._posSlotDecoder[ 0 ] = new LZMA.BitTreeDecoder( 6 );
		this._posSlotDecoder[ 1 ] = new LZMA.BitTreeDecoder( 6 );
		this._posSlotDecoder[ 2 ] = new LZMA.BitTreeDecoder( 6 );
		this._posSlotDecoder[ 3 ] = new LZMA.BitTreeDecoder( 6 );

	};

	LZMA.Decoder.prototype.setDictionarySize = function ( dictionarySize ) {

		if ( dictionarySize < 0 ) {

			return false;

		}
		if ( this._dictionarySize !== dictionarySize ) {

			this._dictionarySize = dictionarySize;
			this._dictionarySizeCheck = Math.max( this._dictionarySize, 1 );
			this._outWindow.create( Math.max( this._dictionarySizeCheck, 4096 ) );

		}
		return true;

	};

	LZMA.Decoder.prototype.setLcLpPb = function ( lc, lp, pb ) {

		var numPosStates = 1 << pb;

		if ( lc > 8 || lp > 4 || pb > 4 ) {

			return false;

		}

		this._literalDecoder.create( lp, lc );

		this._lenDecoder.create( numPosStates );
		this._repLenDecoder.create( numPosStates );
		this._posStateMask = numPosStates - 1;

		return true;

	};

	LZMA.Decoder.prototype.init = function () {

		var i = 4;

		this._outWindow.init( false );

		LZMA.initBitModels( this._isMatchDecoders, 192 );
		LZMA.initBitModels( this._isRep0LongDecoders, 192 );
		LZMA.initBitModels( this._isRepDecoders, 12 );
		LZMA.initBitModels( this._isRepG0Decoders, 12 );
		LZMA.initBitModels( this._isRepG1Decoders, 12 );
		LZMA.initBitModels( this._isRepG2Decoders, 12 );
		LZMA.initBitModels( this._posDecoders, 114 );

		this._literalDecoder.init();

		while ( i -- ) {

			this._posSlotDecoder[ i ].init();

		}

		this._lenDecoder.init();
		this._repLenDecoder.init();
		this._posAlignDecoder.init();
		this._rangeDecoder.init();

	};

	LZMA.Decoder.prototype.decode = function ( inStream, outStream, outSize ) {

		var state = 0, rep0 = 0, rep1 = 0, rep2 = 0, rep3 = 0, nowPos64 = 0, prevByte = 0,
			posState, decoder2, len, distance, posSlot, numDirectBits;

		this._rangeDecoder.setStream( inStream );
		this._outWindow.setStream( outStream );

		this.init();

		while ( outSize < 0 || nowPos64 < outSize ) {

			posState = nowPos64 & this._posStateMask;

			if ( this._rangeDecoder.decodeBit( this._isMatchDecoders, ( state << 4 ) + posState ) === 0 ) {

				decoder2 = this._literalDecoder.getDecoder( nowPos64 ++, prevByte );

				if ( state >= 7 ) {

					prevByte = decoder2.decodeWithMatchByte( this._rangeDecoder, this._outWindow.getByte( rep0 ) );

				} else {

					prevByte = decoder2.decodeNormal( this._rangeDecoder );

				}
				this._outWindow.putByte( prevByte );

				state = state < 4 ? 0 : state - ( state < 10 ? 3 : 6 );

			} else {

				if ( this._rangeDecoder.decodeBit( this._isRepDecoders, state ) === 1 ) {

					len = 0;
					if ( this._rangeDecoder.decodeBit( this._isRepG0Decoders, state ) === 0 ) {

						if ( this._rangeDecoder.decodeBit( this._isRep0LongDecoders, ( state << 4 ) + posState ) === 0 ) {

							state = state < 7 ? 9 : 11;
							len = 1;

						}

					} else {

						if ( this._rangeDecoder.decodeBit( this._isRepG1Decoders, state ) === 0 ) {

							distance = rep1;

						} else {

							if ( this._rangeDecoder.decodeBit( this._isRepG2Decoders, state ) === 0 ) {

								distance = rep2;

							} else {

								distance = rep3;
								rep3 = rep2;

							}
							rep2 = rep1;

						}
						rep1 = rep0;
						rep0 = distance;

					}
					if ( len === 0 ) {

						len = 2 + this._repLenDecoder.decode( this._rangeDecoder, posState );
						state = state < 7 ? 8 : 11;

					}

				} else {

					rep3 = rep2;
					rep2 = rep1;
					rep1 = rep0;

					len = 2 + this._lenDecoder.decode( this._rangeDecoder, posState );
					state = state < 7 ? 7 : 10;

					posSlot = this._posSlotDecoder[ len <= 5 ? len - 2 : 3 ].decode( this._rangeDecoder );
					if ( posSlot >= 4 ) {

						numDirectBits = ( posSlot >> 1 ) - 1;
						rep0 = ( 2 | ( posSlot & 1 ) ) << numDirectBits;

						if ( posSlot < 14 ) {

							rep0 += LZMA.reverseDecode2( this._posDecoders,
								rep0 - posSlot - 1, this._rangeDecoder, numDirectBits );

						} else {

							rep0 += this._rangeDecoder.decodeDirectBits( numDirectBits - 4 ) << 4;
							rep0 += this._posAlignDecoder.reverseDecode( this._rangeDecoder );
							if ( rep0 < 0 ) {

								if ( rep0 === - 1 ) {

									break;

								}
								return false;

							}

						}

					} else {

						rep0 = posSlot;

					}

				}

				if ( rep0 >= nowPos64 || rep0 >= this._dictionarySizeCheck ) {

					return false;

				}

				this._outWindow.copyBlock( rep0, len );
				nowPos64 += len;
				prevByte = this._outWindow.getByte( 0 );

			}

		}

		this._outWindow.flush();
		this._outWindow.releaseStream();
		this._rangeDecoder.releaseStream();

		return true;

	};

	LZMA.Decoder.prototype.setDecoderProperties = function ( properties ) {

		var value, lc, lp, pb, dictionarySize;

		if ( properties.size < 5 ) {

			return false;

		}

		value = properties.readByte();
		lc = value % 9;
		value = ~~ ( value / 9 );
		lp = value % 5;
		pb = ~~ ( value / 5 );

		if ( ! this.setLcLpPb( lc, lp, pb ) ) {

			return false;

		}

		dictionarySize = properties.readByte();
		dictionarySize |= properties.readByte() << 8;
		dictionarySize |= properties.readByte() << 16;
		dictionarySize += properties.readByte() * 16777216;

		return this.setDictionarySize( dictionarySize );

	};

	LZMA.decompress = function ( properties, inStream, outStream, outSize ) {

		var decoder = new LZMA.Decoder();

		if ( ! decoder.setDecoderProperties( properties ) ) {

			throw "Incorrect stream properties";

		}

		if ( ! decoder.decode( inStream, outStream, outSize ) ) {

			throw "Error in data stream";

		}

		return true;

	};

	LZMA.decompressFile = function ( inStream, outStream ) {

		var decoder = new LZMA.Decoder(), outSize;

		if ( ! decoder.setDecoderProperties( inStream ) ) {

			throw "Incorrect stream properties";

		}

		outSize = inStream.readByte();
		outSize |= inStream.readByte() << 8;
		outSize |= inStream.readByte() << 16;
		outSize += inStream.readByte() * 16777216;

		inStream.readByte();
		inStream.readByte();
		inStream.readByte();
		inStream.readByte();

		if ( ! decoder.decode( inStream, outStream, outSize ) ) {

			throw "Error in data stream";

		}

		return true;

	};

	return LZMA;

}();


/**
 * 	SEA3D LZMA
 * 	@author Sunag / http://www.sunag.com.br/
 */

SEA3D.File.LZMAUncompress = function ( data ) {

	data = new Uint8Array( data );

	var inStream = {
		data: data,
		position: 0,
		readByte: function () {

			return this.data[ this.position ++ ];

		}
	};

	var outStream = {
		data: [],
		position: 0,
		writeByte: function ( value ) {

			this.data[ this.position ++ ] = value;

		}
	};

	SEA3D.LZMA.decompressFile( inStream, outStream );

	return new Uint8Array( outStream.data ).buffer;

};

SEA3D.File.setDecompressionEngine( 2, "lzma", SEA3D.File.LZMAUncompress );

/**
 * 	SEA3D for Three.JS
 * 	@author Sunag / http://www.sunag.com.br/
 */

//'use strict';

//
//
//	SEA3D
//

THREE.SEA3D = function ( config ) {

	this.config = {
		id: "",
		scripts: true,
		runScripts: true,
		autoPlay: false,
		dummys: true,
		multiplier: 1,
		bounding: true,
		audioRolloffFactor: 10,
		lights: true,
		useEnvironment: true,
		useVertexTexture: true,
		forceStatic: false,
		streaming: true,
		async: true,
		paths: {},
		timeLimit: 10
	};

	if ( config ) this.loadConfig( config );

};

//
//	Polyfills
//

if ( THREE.Float32BufferAttribute === undefined ) {

	THREE.Float32BufferAttribute = THREE.Float32Attribute;

}

THREE.SEA3D.useMultiMaterial = THREE.MultiMaterial.prototype.isMultiMaterial;

//
//	Config
//

THREE.SEA3D.MTXBUF = new THREE.Matrix4();
THREE.SEA3D.VECBUF = new THREE.Vector3();
THREE.SEA3D.QUABUF = new THREE.Quaternion();

THREE.SEA3D.BACKGROUND_COLOR = 0x333333;
THREE.SEA3D.HELPER_COLOR = 0x9AB9E5;
THREE.SEA3D.RTT_SIZE = 512;

THREE.SEA3D.identityMatrixScale = function () {
		
	var scl = new THREE.Vector3();
	
	return function identityMatrixScale( matrix ) {
		
		scl.setFromMatrixScale( matrix );
		
		return matrix.scale( scl.set( 1 / scl.x, 1 / scl.y, 1 / scl.z ) );

	}

}();

THREE.SEA3D.prototype = Object.assign( Object.create( THREE.EventDispatcher.prototype ), {

	constructor: THREE.SEA3D,

	setShadowMap: function ( light ) {

		light.shadow.mapSize.width = 2048;
		light.shadow.mapSize.height = 1024;

		light.castShadow = true;

		light.shadow.camera.left = - 200;
		light.shadow.camera.right = 200;
		light.shadow.camera.top = 200;
		light.shadow.camera.bottom = - 200;

		light.shadow.camera.near = 1;
		light.shadow.camera.far = 3000;
		light.shadow.camera.fov = 45;

		light.shadow.bias = - 0.001;

	}

} );

Object.defineProperties( THREE.SEA3D.prototype, {

	container: {

		set: function ( val ) {

			this.config.container = val;

		},

		get: function () {

			return this.config.container;

		}

	},

	elapsedTime: {

		get: function () {

			return this.file.timer.elapsedTime;

		}

	}

} );

//
//	Domain
//

THREE.SEA3D.Domain = function ( id, objects, container ) {

	this.id = id;
	this.objects = objects;
	this.container = container;

	this.sources = [];
	this.local = {};

	this.scriptTargets = [];

	this.events = new THREE.EventDispatcher();

};

THREE.SEA3D.Domain.global = {};

THREE.SEA3D.Domain.prototype = Object.assign( Object.create( THREE.EventDispatcher.prototype ), {

	constructor: THREE.SEA3D.Domain,

	add: function ( src ) {

		this.sources.push( src );

	},

	remove: function ( src ) {

		this.sources.splice( this.sources.indexOf( src ), 1 );

	},

	contains: function ( src ) {

		return this.sources.indexOf( src ) != - 1;

	},

	addEventListener: function ( type, listener ) {

		this.events.addEventListener( type, listener );

	},

	hasEventListener: function ( type, listener ) {

		return this.events.hasEventListener( type, listener );

	},

	removeEventListener: function ( type, listener ) {

		this.events.removeEventListener( type, listener );

	},

	print: function () {

		console.log.apply( console, arguments );

	},

	watch: function () {

		console.log.apply( console, 'watch:', arguments );

	},

	runScripts: function () {

		for ( var i = 0; i < this.scriptTargets.length; i ++ ) {

			this.runJSMList( this.scriptTargets[ i ] );

		}

	},

	runJSMList: function ( target ) {

		var scripts = target.scripts;

		for ( var i = 0; i < scripts.length; i ++ ) {

			this.runJSM( target, scripts[ i ] );

		}

		return scripts;

	},

	runJSM: function ( target, script ) {

		var include = {
			print: this.print,
			watch: this.watch,
			sea3d: this,
			scene: this.container,
			source: new THREE.SEA3D.ScriptDomain( this, target instanceof THREE.SEA3D.Domain )
		};

		Object.freeze( include.source );

		THREE.SEA3D.ScriptHandler.add( include.source );

		try {

			this.methods[ script.method ](
				include,
				this.getReference,
				THREE.SEA3D.Domain.global,
				this.local,
				target,
				script.params
			);

		} catch ( e ) {

			console.error( 'SEA3D JavaScript: Error running method "' + script.method + '".' );
			console.error( e );

		}

	},

	getReference: function ( ns ) {

		return eval( ns );

	},

	disposeList: function ( list ) {

		if ( ! list || ! list.length ) return;

		list = list.concat();

		var i = list.length;

		while ( i -- ) {

			list[ i ].dispose();

		}

	},

	dispatchEvent: function ( event ) {

		event.domain = this;

		var sources = this.sources.concat(),
			i = sources.length;

		while ( i -- ) {

			sources[ i ].dispatchEvent( event );

		}

		this.events.dispatchEvent( event );

	},

	dispose: function () {

		this.disposeList( this.sources );

		while ( this.container.children.length ) {

			this.container.remove( this.container.children[ 0 ] );

		}

		var i = THREE.SEA3D.EXTENSIONS_DOMAIN.length;

		while ( i -- ) {

			var domain = THREE.SEA3D.EXTENSIONS_DOMAIN[ i ];

			if ( domain.dispose ) domain.dispose.call( this );

		}

		this.disposeList( this.materials );
		this.disposeList( this.dummys );

		this.dispatchEvent( { type: "dispose" } );

	}
} );

//
//	Domain Manager
//

THREE.SEA3D.DomainManager = function ( autoDisposeRootDomain ) {

	this.domains = [];
	this.autoDisposeRootDomain = autoDisposeRootDomain !== undefined ? autoDisposeRootDomain : true;

};

Object.assign( THREE.SEA3D.DomainManager.prototype, {

	onDisposeDomain: function ( e ) {

		this.remove( e.domain );

		if ( this.autoDisposeRootDomain && this.domains.length == 1 ) {

			this.dispose();

		}

	},

	add: function ( domain ) {

		this._onDisposeDomain = this._onDisposeDomain || this.onDisposeDomain.bind( this );

		domain.on( "dispose", this._onDisposeDomain );

		this.domains.push( domain );

		this.textures = this.textures || domain.textures;
		this.cubemaps = this.cubemaps || domain.cubemaps;
		this.geometries = this.geometries || domain.geometries;

	},

	remove: function ( domain ) {

		domain.removeEvent( "dispose", this._onDisposeDomain );

		this.domains.splice( this.domains.indexOf( domain ), 1 );

	},

	contains: function ( domain ) {

		return this.domains.indexOf( domain ) != - 1;

	},

	disposeList: function ( list ) {

		if ( ! list || ! list.length ) return;

		list = list.concat();

		var i = list.length;

		while ( i -- ) {

			list[ i ].dispose();

		}

	},

	dispose: function () {

		this.disposeList( this.domains );
		this.disposeList( this.textures );
		this.disposeList( this.cubemaps );
		this.disposeList( this.geometries );

	}

} );

//
//	Script ( closure for private functions )
//

THREE.SEA3D.ScriptDomain = function ( domain, root ) {

	domain = domain || new THREE.SEA3D.Domain();
	domain.add( this );

	var events = new THREE.EventDispatcher();

	this.getId = function () {

		return domain.id;

	};

	this.isRoot = function () {

		return root;

	};

	this.addEventListener = function ( type, listener ) {

		events.addEventListener( type, listener );

	};

	this.hasEventListener = function ( type, listener ) {

		return events.hasEventListener( type, listener );

	};

	this.removeEventListener = function ( type, listener ) {

		events.removeEventListener( type, listener );

	};

	this.dispatchEvent = function ( event ) {

		event.script = this;

		events.dispatchEvent( event );

	};

	this.dispose = function () {

		domain.remove( this );

		if ( root ) domain.dispose();

		this.dispatchEvent( { type: "dispose" } );

	};

};

//
//	Script Manager ( closure for private functions )
//

THREE.SEA3D.ScriptManager = function () {

	this.scripts = [];

	var onDisposeScript = ( function ( e ) {

		this.remove( e.script );

	} ).bind( this );

	this.add = function ( src ) {

		src.addEventListener( "dispose", onDisposeScript );

		this.scripts.push( src );

	};

	this.remove = function ( src ) {

		src.removeEventListener( "dispose", onDisposeScript );

		this.scripts.splice( this.scripts.indexOf( src ), 1 );

	};

	this.contains = function ( src ) {

		return this.scripts.indexOf( src ) > - 1;

	};

	this.dispatchEvent = function ( event ) {

		var scripts = this.scripts.concat(),
			i = scripts.length;

		while ( i -- ) {

			scripts[ i ].dispatchEvent( event );

		}

	};

};

//
//	Script Handler
//

THREE.SEA3D.ScriptHandler = new THREE.SEA3D.ScriptManager();

THREE.SEA3D.ScriptHandler.dispatchUpdate = function ( delta ) {

	this.dispatchEvent( {
		type: "update",
		delta: delta
	} );

};

//
//	Animation Clip
//

THREE.SEA3D.AnimationClip = function ( name, duration, tracks, repeat ) {

	THREE.AnimationClip.call( this, name, duration, tracks );

	this.repeat = repeat !== undefined ? repeat : true;

};

THREE.SEA3D.AnimationClip.fromClip = function ( clip, repeat ) {

	return new THREE.SEA3D.AnimationClip( clip.name, clip.duration, clip.tracks, repeat );

};

THREE.SEA3D.AnimationClip.prototype = Object.assign( Object.create( THREE.AnimationClip.prototype ), {

	constructor: THREE.SEA3D.AnimationClip

} );

//
//	Animation
//

THREE.SEA3D.Animation = function ( clip, timeScale ) {

	this.clip = clip;
	this.timeScale = timeScale !== undefined ? timeScale : 1;

};

THREE.SEA3D.Animation.COMPLETE = "animationComplete";

THREE.SEA3D.Animation.prototype = Object.assign( Object.create( THREE.EventDispatcher.prototype ), {

	constructor: THREE.SEA3D.Animation,

	onComplete: function ( scope ) {

		this.dispatchEvent( { type: THREE.SEA3D.Animation.COMPLETE, target: this } );


	}

} );

Object.defineProperties( THREE.SEA3D.Animation.prototype, {

	name: {

		get: function () {

			return this.clip.name;

		}

	},

	repeat: {

		get: function () {

			return this.clip.repeat;

		}

	},

	duration: {

		get: function () {

			return this.clip.duration;

		}

	},
	
	mixer: {

		set: function ( val ) {

			if ( this.mx ) {

				this.mx.uncacheClip( this.clip );
				delete this.mx;

			}

			if ( val ) {

				this.mx = val;
				this.mx.clipAction( this.clip );

			}

		},

		get: function () {

			return this.mx;

		}

	}

} );

//
//	Animator
//

THREE.SEA3D.Animator = function ( clips, mixer ) {

	this.updateAnimations( clips, mixer );

	this.clone = function ( scope ) {

		return new this.constructor( this.clips, new THREE.AnimationMixer( scope ) ).copyFrom( this );

	}.bind( this );

};

Object.assign( THREE.SEA3D.Animator.prototype, {

	update: function ( dt ) {

		this.mixer.update( dt || 0 );

		if ( this.currentAnimationAction && this.currentAnimationAction.paused ) {

			this.pause();

			if ( this.currentAnimation ) {

				this.currentAnimation.onComplete( this );

			}

		}

		return this;

	},

	updateAnimations: function ( clips, mixer ) {

		if ( this.playing ) this.stop();

		if ( this.mixer ) THREE.SEA3D.AnimationHandler.remove( this );

		this.mixer = mixer;

		this.relative = false;
		this.playing = false;
		this.paused = false;

		this.timeScale = 1;

		this.animations = [];
		this.animation = {};

		this.clips = [];

		if ( clips ) {

			for ( var i = 0; i < clips.length; i ++ ) {

				this.addAnimation( clips[ i ] );

			}

		}

		return this;

	},

	addAnimation: function ( animation ) {

		if ( animation instanceof THREE.AnimationClip ) {

			this.clips.push( animation );

			animation = new THREE.SEA3D.Animation( animation );

		}

		this.animations.push( animation );
		this.animation[ animation.name ] = animation;

		animation.mixer = this.mixer;

		return animation;

	},

	removeAnimation: function ( animation ) {

		if ( animation instanceof THREE.AnimationClip ) {

			animation = this.getAnimationByClip( animation );

		}

		this.clips.splice( this.clips.indexOf( animation.clip ), 1 );

		delete this.animation[ animation.name ];
		this.animations.splice( this.animations.indexOf( animation ), 1 );

		animation.mixer = null;

		return animation;

	},

	getAnimationByClip: function ( clip ) {

		for ( var i = 0; i < this.animations.length; i ++ ) {

			if ( this.animations[ i ].clip === clip ) return clip;

		}

	},

	getAnimationByName: function ( name ) {

		return typeof name === "number" ? this.animations[ name ] : this.animation[ name ];

	},

	setAnimationWeight: function ( name, val ) {

		this.mixer.clipAction( this.getAnimationByName( name ).clip ).setEffectiveWeight( val );

	},

	getAnimationWeight: function ( name ) {

		return this.mixer.clipAction( this.getAnimationByName( name ).clip ).getEffectiveWeight();

	},

	pause: function () {

		if ( this.playing && this.currentAnimation ) {

			THREE.SEA3D.AnimationHandler.remove( this );

			this.playing = false;

		}

		return this;

	},

	resume: function () {

		if ( ! this.playing && this.currentAnimation ) {

			THREE.SEA3D.AnimationHandler.add( this );

			this.playing = true;

		}

		return this;

	},

	setTimeScale: function ( val ) {

		this.timeScale = val;

		if ( this.currentAnimationAction ) this.updateTimeScale();

		return this;

	},

	getTimeScale: function () {

		return this.timeScale;

	},

	updateTimeScale: function () {

		this.currentAnimationAction.setEffectiveTimeScale( this.timeScale * ( this.currentAnimation ? this.currentAnimation.timeScale : 1 ) );

		return this;

	},

	play: function ( name, crossfade, offset, weight ) {

		var animation = this.getAnimationByName( name );

		if ( ! animation ) throw new Error( 'Animation "' + name + '" not found.' );

		if ( animation == this.currentAnimation ) {

			if ( offset !== undefined || ! animation.repeat ) this.currentAnimationAction.time = offset !== undefined ? offset :
				( this.currentAnimationAction.timeScale >= 0 ? 0 : this.currentAnimation.duration );

			this.currentAnimationAction.setEffectiveWeight( weight !== undefined ? weight : 1 );
			this.currentAnimationAction.paused = false;

			return this.resume();

		} else {

			this.previousAnimation = this.currentAnimation;
			this.currentAnimation = animation;

			this.previousAnimationAction = this.currentAnimationAction;
			this.currentAnimationAction = this.mixer.clipAction( animation.clip ).setLoop( animation.repeat ? THREE.LoopRepeat : THREE.LoopOnce, Infinity ).reset();
			this.currentAnimationAction.clampWhenFinished = ! animation.repeat;
			this.currentAnimationAction.paused = false;

			this.updateTimeScale();

			if ( offset !== undefined || ! animation.repeat ) this.currentAnimationAction.time = offset !== undefined ? offset :
				( this.currentAnimationAction.timeScale >= 0 ? 0 : this.currentAnimation.duration );

			this.currentAnimationAction.setEffectiveWeight( weight !== undefined ? weight : 1 );

			this.currentAnimationAction.play();

			if ( ! this.playing ) this.mixer.update( 0 );

			this.playing = true;

			if ( this.previousAnimation ) this.previousAnimationAction.crossFadeTo( this.currentAnimationAction, crossfade || 0, false );

			THREE.SEA3D.AnimationHandler.add( this );

		}

		return this;

	},

	stop: function () {

		if ( this.playing ) THREE.SEA3D.AnimationHandler.remove( this );

		if ( this.currentAnimation ) {

			this.currentAnimationAction.stop();

			this.previousAnimation = this.currentAnimation;
			this.previousAnimationAction = this.currentAnimationAction;

			delete this.currentAnimationAction;
			delete this.currentAnimation;

			this.playing = false;

		}

		return this;

	},

	playw: function ( name, weight ) {

		if ( ! this.playing && ! this.paused ) THREE.SEA3D.AnimationHandler.add( this );

		var animation = this.getAnimationByName( name );

		this.playing = true;

		var clip = this.mixer.clipAction( animation.clip );
		clip.setLoop( animation.repeat ? THREE.LoopRepeat : THREE.LoopOnce, Infinity ).reset();
		clip.clampWhenFinished = ! animation.repeat;
		clip.paused = false;

		clip.setEffectiveWeight( weight ).play();

		return clip;

	},

	crossFade: function ( fromAnimName, toAnimName, duration, wrap ) {

		this.mixer.stopAllAction();

		var fromAction = this.playw( fromAnimName, 1 );
		var toAction = this.playw( toAnimName, 1 );

		fromAction.crossFadeTo( toAction, duration, wrap !== undefined ? wrap : false );

		return this;

	},

	stopAll: function () {

		this.stop().mixer.stopAllAction();

		this.playing = false;

		return this;

	},

	unPauseAll: function () {

		this.mixer.timeScale = 1;

		this.playing = true;
		this.paused = false;

		return this;

	},

	pauseAll: function () {

		this.mixer.timeScale = 0;

		this.playing = false;
		this.paused = true;

		return this;

	},

	setRelative: function ( val ) {

		if ( this.relative == val ) return;

		this.stop();

		this.relative = val;

		return this;

	},

	getRelative: function () {

		return this.relative;

	},

	copyFrom: function ( scope ) {

		for ( var i = 0; i < this.animations.length; i ++ ) {

			this.animations[ i ].timeScale = scope.animations[ i ].timeScale;

		}

		return this;

	}

} );

//
//	Object3D Animator
//

THREE.SEA3D.Object3DAnimator = function ( clips, object3d ) {

	this.object3d = object3d;

	THREE.SEA3D.Animator.call( this, clips, new THREE.AnimationMixer( object3d ) );

	this.clone = function ( scope ) {

		return new this.constructor( this.clips, scope ).copyFrom( this );

	}.bind( this );

};

THREE.SEA3D.Object3DAnimator.prototype = Object.assign( Object.create( THREE.SEA3D.Animator.prototype ), {

	constructor: THREE.SEA3D.Object3DAnimator,

	stop: function () {

		if ( this.currentAnimation ) {

			var animate = this.object3d.animate;

			if ( animate && this instanceof THREE.SEA3D.Object3DAnimator ) {

				animate.position.set( 0, 0, 0 );
				animate.quaternion.set( 0, 0, 0, 1 );
				animate.scale.set( 1, 1, 1 );

			}

		}

		THREE.SEA3D.Animator.prototype.stop.call( this );

	},

	setRelative: function ( val ) {

		THREE.SEA3D.Animator.prototype.setRelative.call( this, val );

		this.object3d.setAnimator( this.relative );

		this.updateAnimations( this.clips, new THREE.AnimationMixer( this.relative ? this.object3d.animate : this.object3d ) );

	}

} );

//
//	Camera Animator
//

THREE.SEA3D.CameraAnimator = function ( clips, object3d ) {

	THREE.SEA3D.Object3DAnimator.call( this, clips, object3d );

};

THREE.SEA3D.CameraAnimator.prototype = Object.assign( Object.create( THREE.SEA3D.Object3DAnimator.prototype ), {

	constructor: THREE.SEA3D.CameraAnimator

} );

//
//	Sound Animator
//

THREE.SEA3D.SoundAnimator = function ( clips, object3d ) {

	THREE.SEA3D.Object3DAnimator.call( this, clips, object3d );

};

THREE.SEA3D.SoundAnimator.prototype = Object.assign( Object.create( THREE.SEA3D.Object3DAnimator.prototype ), {

	constructor: THREE.SEA3D.SoundAnimator

} );

//
//	Light Animator
//

THREE.SEA3D.LightAnimator = function ( clips, object3d ) {

	THREE.SEA3D.Object3DAnimator.call( this, clips, object3d );

};

THREE.SEA3D.LightAnimator.prototype = Object.assign( Object.create( THREE.SEA3D.Object3DAnimator.prototype ), {

	constructor: THREE.SEA3D.LightAnimator

} );

//
//	Container
//

THREE.SEA3D.Object3D = function ( ) {

	THREE.Object3D.call( this );

};

THREE.SEA3D.Object3D.prototype = Object.assign( Object.create( THREE.Object3D.prototype ), {

	constructor: THREE.SEA3D.Object3D,

	// Relative Animation Extension ( Only used if relative animation is enabled )
	// TODO: It can be done with shader

	updateAnimateMatrix: function ( force ) {

		if ( this.matrixAutoUpdate === true ) this.updateMatrix();

		if ( this.matrixWorldNeedsUpdate === true || force === true ) {

			if ( this.parent === null ) {

				this.matrixWorld.copy( this.matrix );

			} else {

				this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

			}

			this.animate.updateMatrix();

			this.matrixWorld.multiplyMatrices( this.matrixWorld, this.animate.matrix );

			this.matrixWorldNeedsUpdate = false;

			force = true;

		}

		// update children

		for ( var i = 0, l = this.children.length; i < l; i ++ ) {

			this.children[ i ].updateMatrixWorld( force );

		}

	},

	setAnimator: function ( val ) {

		if ( this.getAnimator() == val )
			return;

		if ( val ) {

			this.animate = new THREE.Object3D();

			this.updateMatrixWorld = THREE.SEA3D.Object3D.prototype.updateAnimateMatrix;

		} else {

			delete this.animate;

			this.updateMatrixWorld = THREE.Object3D.prototype.updateMatrixWorld;

		}

		this.matrixWorldNeedsUpdate = true;

	},

	getAnimator: function () {

		return this.animate != undefined;

	},

	copy: function ( source ) {

		THREE.Object3D.prototype.copy.call( this, source );

		this.attribs = source.attribs;
		this.scripts = source.scripts;

		if ( source.animator ) this.animator = source.animator.clone( this );

		return this;

	}

} );

//
//	Dummy
//

THREE.SEA3D.Dummy = function ( width, height, depth ) {

	this.width = width != undefined ? width : 100;
	this.height = height != undefined ? height : 100;
	this.depth = depth != undefined ? depth : 100;

	var geo = new THREE.BoxGeometry( this.width, this.height, this.depth, 1, 1, 1 );

	geo.computeBoundingBox();
	geo.computeBoundingSphere();

	THREE.Mesh.call( this, geo, THREE.SEA3D.Dummy.MATERIAL );

};

THREE.SEA3D.Dummy.MATERIAL = new THREE.MeshBasicMaterial( { wireframe: true, color: THREE.SEA3D.HELPER_COLOR } );

THREE.SEA3D.Dummy.prototype = Object.assign( Object.create( THREE.Mesh.prototype ), THREE.SEA3D.Object3D.prototype, {

	constructor: THREE.SEA3D.Dummy,

	copy: function ( source ) {

		THREE.Mesh.prototype.copy.call( this, source );

		this.attribs = source.attribs;
		this.scripts = source.scripts;

		if ( source.animator ) this.animator = source.animator.clone( this );

		return this;

	},

	dispose: function () {

		this.geometry.dispose();

	}

} );

//
//	Mesh
//

THREE.SEA3D.Mesh = function ( geometry, material ) {

	THREE.Mesh.call( this, geometry, material );

};

THREE.SEA3D.Mesh.prototype = Object.assign( Object.create( THREE.Mesh.prototype ), THREE.SEA3D.Object3D.prototype, {

	constructor: THREE.SEA3D.Mesh,

	setWeight: function ( name, val ) {

		var index = typeof name === "number" ? name : this.morphTargetDictionary[ name ];

		this.morphTargetInfluences[ index ] = val;

	},

	getWeight: function ( name ) {

		var index = typeof name === "number" ? name : this.morphTargetDictionary[ name ];

		return this.morphTargetInfluences[ index ];

	},

	copy: function ( source ) {

		THREE.Mesh.prototype.copy.call( this, source );

		this.attribs = source.attribs;
		this.scripts = source.scripts;

		if ( source.animator ) this.animator = source.animator.clone( this );

		return this;

	}

} );

//
//	Skinning
//

THREE.SEA3D.SkinnedMesh = function ( geometry, material, useVertexTexture ) {

	THREE.SkinnedMesh.call( this, geometry, material, useVertexTexture );

	this.updateAnimations( geometry.animations, new THREE.AnimationMixer( this ) );

};

THREE.SEA3D.SkinnedMesh.prototype = Object.assign( Object.create( THREE.SkinnedMesh.prototype ), THREE.SEA3D.Mesh.prototype, THREE.SEA3D.Animator.prototype, {

	constructor: THREE.SEA3D.SkinnedMesh,

	boneByName: function ( name ) {

		var bones = this.skeleton.bones;

		for ( var i = 0, bl = bones.length; i < bl; i ++ ) {

			if ( name == bones[ i ].name )
				return bones[ i ];

		}

	},

	copy: function ( source ) {

		THREE.SkinnedMesh.prototype.copy.call( this, source );

		this.attribs = source.attribs;
		this.scripts = source.scripts;

		if ( source.animator ) this.animator = source.animator.clone( this );

		return this;

	}

} );

//
//	Vertex Animation
//

THREE.SEA3D.VertexAnimationMesh = function ( geometry, material ) {

	THREE.Mesh.call( this, geometry, material );

	this.type = 'MorphAnimMesh';

	this.updateAnimations( geometry.animations, new THREE.AnimationMixer( this ) );

};

THREE.SEA3D.VertexAnimationMesh.prototype = Object.assign( Object.create( THREE.Mesh.prototype ), THREE.SEA3D.Mesh.prototype, THREE.SEA3D.Animator.prototype, {

	constructor: THREE.SEA3D.VertexAnimationMesh,

	copy: function ( source ) {

		THREE.Mesh.prototype.copy.call( this, source );

		this.attribs = source.attribs;
		this.scripts = source.scripts;

		if ( source.animator ) this.animator = source.animator.clone( this );

		return this;

	}

} );

//
//	Camera
//

THREE.SEA3D.Camera = function ( fov, aspect, near, far ) {

	THREE.PerspectiveCamera.call( this, fov, aspect, near, far );

};

THREE.SEA3D.Camera.prototype = Object.assign( Object.create( THREE.PerspectiveCamera.prototype ), THREE.SEA3D.Object3D.prototype, {

	constructor: THREE.SEA3D.Camera,

	copy: function ( source ) {

		THREE.PerspectiveCamera.prototype.copy.call( this, source );

		this.attribs = source.attribs;
		this.scripts = source.scripts;

		if ( source.animator ) this.animator = source.animator.clone( this );

		return this;

	}

} );

//
//	Orthographic Camera
//

THREE.SEA3D.OrthographicCamera = function ( left, right, top, bottom, near, far ) {

	THREE.OrthographicCamera.call( this, left, right, top, bottom, near, far );

};

THREE.SEA3D.OrthographicCamera.prototype = Object.assign( Object.create( THREE.OrthographicCamera.prototype ), THREE.SEA3D.Object3D.prototype, {

	constructor: THREE.SEA3D.OrthographicCamera,

	copy: function ( source ) {

		THREE.OrthographicCamera.prototype.copy.call( this, source );

		this.attribs = source.attribs;
		this.scripts = source.scripts;

		if ( source.animator ) this.animator = source.animator.clone( this );

		return this;

	}

} );

//
//	PointLight
//

THREE.SEA3D.PointLight = function ( hex, intensity, distance, decay ) {

	THREE.PointLight.call( this, hex, intensity, distance, decay );

};

THREE.SEA3D.PointLight.prototype = Object.assign( Object.create( THREE.PointLight.prototype ), THREE.SEA3D.Object3D.prototype, {

	constructor: THREE.SEA3D.PointLight,

	copy: function ( source ) {

		THREE.PointLight.prototype.copy.call( this, source );

		this.attribs = source.attribs;
		this.scripts = source.scripts;

		if ( source.animator ) this.animator = source.animator.clone( this );

		return this;

	}

} );

//
//	Point Sound
//

THREE.SEA3D.PointSound = function ( listener, sound ) {

	THREE.PositionalAudio.call( this, listener );

	this.setSound( sound );
	
};

THREE.SEA3D.PointSound.prototype = Object.assign( Object.create( THREE.PositionalAudio.prototype ), THREE.SEA3D.Object3D.prototype, {

	constructor: THREE.SEA3D.PointSound,

	setSound: function( sound ) {
		
		this.sound = sound;
		
		if (sound) {
			
			if (sound.buffer) {
				
				this.setBuffer( sound.buffer );
				
			} else {
				
				sound.addEventListener("complete", function(e) {

					this.setBuffer( sound.buffer );
					
				}.bind( this ) );
				
			}
			
		}
		
		return this;
		
	},
	
	copy: function ( source ) {

		THREE.PositionalAudio.prototype.copy.call( this, source );

		this.attribs = source.attribs;
		this.scripts = source.scripts;

		if ( source.animator ) this.animator = source.animator.clone( this );

		return this;

	}

} );

//
//	Animation Handler
//

THREE.SEA3D.AnimationHandler = {

	animators: [],

	update: function ( dt ) {

		var i = 0;

		while ( i < this.animators.length ) {

			this.animators[ i ++ ].update( dt );

		}

	},

	add: function ( animator ) {

		var index = this.animators.indexOf( animator );

		if ( index === - 1 ) this.animators.push( animator );

	},

	remove: function ( animator ) {

		var index = this.animators.indexOf( animator );

		if ( index !== - 1 ) this.animators.splice( index, 1 );

	}

};

//
//	Sound
//

THREE.SEA3D.Sound = function ( src ) {

	this.uuid = THREE.Math.generateUUID();

	this.src = src;

	new THREE.AudioLoader().load( src, function ( buffer ) {

		this.buffer = buffer;
		
		this.dispatchEvent( { type:"complete" } );

	}.bind( this ) );

};

THREE.SEA3D.Sound.prototype = Object.assign( Object.create( THREE.EventDispatcher.prototype ), {

	constructor: THREE.SEA3D.Sound

} );

//
//	Output
//

THREE.SEA3D.Domain.prototype.getMesh = THREE.SEA3D.prototype.getMesh = function ( name ) {

	return this.objects[ "m3d/" + name ];

};

THREE.SEA3D.Domain.prototype.getDummy = THREE.SEA3D.prototype.getDummy = function ( name ) {

	return this.objects[ "dmy/" + name ];

};

THREE.SEA3D.Domain.prototype.getLine = THREE.SEA3D.prototype.getLine = function ( name ) {

	return this.objects[ "line/" + name ];

};

THREE.SEA3D.Domain.prototype.getSound3D = THREE.SEA3D.prototype.getSound3D = function ( name ) {

	return this.objects[ "sn3d/" + name ];

};

THREE.SEA3D.Domain.prototype.getMaterial = THREE.SEA3D.prototype.getMaterial = function ( name ) {

	return this.objects[ "mat/" + name ];

};

THREE.SEA3D.Domain.prototype.getLight = THREE.SEA3D.prototype.getLight = function ( name ) {

	return this.objects[ "lht/" + name ];

};

THREE.SEA3D.Domain.prototype.getGLSL = THREE.SEA3D.prototype.getGLSL = function ( name ) {

	return this.objects[ "glsl/" + name ];

};

THREE.SEA3D.Domain.prototype.getCamera = THREE.SEA3D.prototype.getCamera = function ( name ) {

	return this.objects[ "cam/" + name ];

};

THREE.SEA3D.Domain.prototype.getTexture = THREE.SEA3D.prototype.getTexture = function ( name ) {

	return this.objects[ "tex/" + name ];

};

THREE.SEA3D.Domain.prototype.getCubeMap = THREE.SEA3D.prototype.getCubeMap = function ( name ) {

	return this.objects[ "cmap/" + name ];

};

THREE.SEA3D.Domain.prototype.getJointObject = THREE.SEA3D.prototype.getJointObject = function ( name ) {

	return this.objects[ "jnt/" + name ];

};

THREE.SEA3D.Domain.prototype.getContainer3D = THREE.SEA3D.prototype.getContainer3D = function ( name ) {

	return this.objects[ "c3d/" + name ];

};

THREE.SEA3D.Domain.prototype.getSprite = THREE.SEA3D.prototype.getSprite = function ( name ) {

	return this.objects[ "m2d/" + name ];

};

THREE.SEA3D.Domain.prototype.getProperties = THREE.SEA3D.prototype.getProperties = function ( name ) {

	return this.objects[ "prop/" + name ];

};

//
//	Utils
//

THREE.SEA3D.prototype.isPowerOfTwo = function ( num ) {

	return num ? ( ( num & - num ) == num ) : false;

};

THREE.SEA3D.prototype.nearestPowerOfTwo = function ( num ) {

	return Math.pow( 2, Math.round( Math.log( num ) / Math.LN2 ) );

};

THREE.SEA3D.prototype.updateTransform = function ( obj3d, sea ) {

	var mtx = THREE.SEA3D.MTXBUF, vec = THREE.SEA3D.VECBUF;

	if ( sea.transform ) mtx.fromArray( sea.transform );
	else mtx.makeTranslation( sea.position.x, sea.position.y, sea.position.z );

	// matrix

	obj3d.position.setFromMatrixPosition( mtx );
	obj3d.scale.setFromMatrixScale( mtx );

	// ignore rotation scale

	obj3d.rotation.setFromRotationMatrix( THREE.SEA3D.identityMatrixScale( mtx ) );

	// optimize if is static

	if ( this.config.forceStatic || sea.isStatic ) {

		obj3d.updateMatrix();
		obj3d.matrixAutoUpdate = false;

	}

};

THREE.SEA3D.prototype.toVector3 = function ( data ) {

	return new THREE.Vector3( data.x, data.y, data.z );

};

THREE.SEA3D.prototype.toFaces = function ( faces ) {

	// xyz(- / +) to xyz(+ / -) sequence
	var f = [];

	f[ 0 ] = faces[ 1 ];
	f[ 1 ] = faces[ 0 ];
	f[ 2 ] = faces[ 3 ];
	f[ 3 ] = faces[ 2 ];
	f[ 4 ] = faces[ 5 ];
	f[ 5 ] = faces[ 4 ];

	return f;

};

THREE.SEA3D.prototype.updateScene = function () {

	if ( this.materials != undefined ) {

		for ( var i = 0, l = this.materials.length; i < l; ++ i ) {

			this.materials[ i ].needsUpdate = true;

		}

	}

};

THREE.SEA3D.prototype.addSceneObject = function ( sea, obj3d ) {

	obj3d = obj3d || sea.tag;

	obj3d.visible = sea.visible;

	if ( sea.parent ) sea.parent.tag.add( obj3d );
	else if ( this.config.container ) this.config.container.add( obj3d );

	if ( sea.attributes ) obj3d.attribs = sea.attributes.tag;

	if ( sea.scripts ) {

		obj3d.scripts = this.getJSMList( obj3d, sea.scripts );

		if ( this.config.scripts && this.config.runScripts ) this.domain.runJSMList( obj3d );

	}

};

THREE.SEA3D.prototype.createObjectURL = function ( raw, mime ) {

	return ( window.URL || window.webkitURL ).createObjectURL( new Blob( [ raw ], { type: mime } ) );

};

THREE.SEA3D.prototype.parsePath = function ( url ) {

	var paths = this.config.paths;

	for ( var name in paths ) {

		url = url.replace( new RegExp( "%" + name + "%", "g" ), paths[ name ] );

	}

	return url;

};

THREE.SEA3D.prototype.addDefaultAnimation = function ( sea, animatorClass ) {

	var scope = sea.tag;

	for ( var i = 0, count = sea.animations ? sea.animations.length : 0; i < count; i ++ ) {

		var anm = sea.animations[ i ];

		switch ( anm.tag.type ) {

			case SEA3D.Animation.prototype.type:

				var animation = anm.tag.tag || this.getAnimationType( {
					sea: anm.tag,
					scope: scope,
					relative: anm.relative
				} );

				scope.animator = new animatorClass( animation, scope );
				scope.animator.setRelative( anm.relative );

				if ( this.config.autoPlay ) {

					scope.animator.play( 0 );

				}

				return scope.animator;

				break;

		}

	}

};

//
//	Geometry
//

THREE.SEA3D.prototype.readGeometryBuffer = function ( sea ) {

	var geo = sea.tag || new THREE.BufferGeometry();

	for ( var i = 0; i < sea.groups.length; i ++ ) {

		var g = sea.groups[ i ];

		geo.addGroup( g.start, g.count, i );

	}

	geo.setIndex( new THREE.BufferAttribute( sea.indexes, 1 ) );
	geo.addAttribute( 'position', new THREE.BufferAttribute( sea.vertex, 3 ) );

	if ( sea.uv ) {

		geo.addAttribute( 'uv', new THREE.BufferAttribute( sea.uv[ 0 ], 2 ) );
		if ( sea.uv.length > 1 ) geo.addAttribute( 'uv2', new THREE.BufferAttribute( sea.uv[ 1 ], 2 ) );

	}

	if ( sea.normal ) geo.addAttribute( 'normal', new THREE.BufferAttribute( sea.normal, 3 ) );
	else geo.computeVertexNormals();

	if ( sea.tangent4 ) geo.addAttribute( 'tangent', new THREE.BufferAttribute( sea.tangent4, 4 ) );

	if ( sea.color ) geo.addAttribute( 'color', new THREE.BufferAttribute( sea.color[ 0 ], sea.numColor ) );

	if ( sea.joint ) {

		geo.addAttribute( 'skinIndex', new THREE.Float32BufferAttribute( sea.joint, sea.jointPerVertex ) );
		geo.addAttribute( 'skinWeight', new THREE.Float32BufferAttribute( sea.weight, sea.jointPerVertex ) );

	}

	if ( this.config.bounding ) {

		geo.computeBoundingBox();
		geo.computeBoundingSphere();

	}

	geo.name = sea.name;

	this.domain.geometries = this.geometries = this.geometries || [];
	this.geometries.push( this.objects[ "geo/" + sea.name ] = sea.tag = geo );

};

//
//	Dummy
//

THREE.SEA3D.prototype.readDummy = function ( sea ) {

	var dummy = new THREE.SEA3D.Dummy( sea.width, sea.height, sea.depth );
	dummy.name = sea.name;

	this.domain.dummys = this.dummys = this.dummys || [];
	this.dummys.push( this.objects[ "dmy/" + sea.name ] = sea.tag = dummy );

	this.addSceneObject( sea );
	this.updateTransform( dummy, sea );

	this.addDefaultAnimation( sea, THREE.SEA3D.Object3DAnimator );

};

//
//	Line
//

THREE.SEA3D.prototype.readLine = function ( sea ) {

	var	geo = new THREE.BufferGeometry();

	if ( sea.closed )
		sea.vertex.push( sea.vertex[ 0 ], sea.vertex[ 1 ], sea.vertex[ 2 ] );

	geo.addAttribute( 'position', new THREE.Float32BufferAttribute( sea.vertex, 3 ) );

	var line = new THREE.Line( geo, new THREE.LineBasicMaterial( { color: THREE.SEA3D.HELPER_COLOR, linewidth: 3 } ) );
	line.name = sea.name;

	this.lines = this.lines || [];
	this.lines.push( this.objects[ "line/" + sea.name ] = sea.tag = line );

	this.addSceneObject( sea );
	this.updateTransform( line, sea );

	this.addDefaultAnimation( sea, THREE.SEA3D.Object3DAnimator );

};

//
//	Container3D
//

THREE.SEA3D.prototype.readContainer3D = function ( sea ) {

	var container = new THREE.SEA3D.Object3D();

	this.domain.containers = this.containers = this.containers || [];
	this.containers.push( this.objects[ "c3d/" + sea.name ] = sea.tag = container );

	this.addSceneObject( sea );
	this.updateTransform( container, sea );

	this.addDefaultAnimation( sea, THREE.SEA3D.Object3DAnimator );

};

//
//	Sprite
//

THREE.SEA3D.prototype.readSprite = function ( sea ) {

	var mat;

	if ( sea.material ) {

		if ( ! sea.material.tag.sprite ) {

			mat = sea.material.tag.sprite = new THREE.SpriteMaterial();

			this.setBlending( mat, sea.blendMode );

			mat.map = sea.material.tag.map;
			mat.map.flipY = true;

			mat.color.set( sea.material.tag.color );
			mat.opacity = sea.material.tag.opacity;
			mat.fog = sea.material.receiveFog;

		} else mat = sea.material.tag.sprite;

	}

	var sprite = new THREE.Sprite( mat );
	sprite.name = sea.name;

	this.domain.sprites = this.sprites = this.sprites || [];
	this.sprites.push( this.objects[ "m2d/" + sea.name ] = sea.tag = sprite );

	this.addSceneObject( sea );
	this.updateTransform( sprite, sea );

	sprite.scale.set( sea.width, sea.height, 1 );

};

//
//	Mesh
//

THREE.SEA3D.prototype.readMesh = function ( sea ) {

	var i, count, geo = sea.geometry.tag, mesh, mat, skeleton, skeletonAnimation, vertexAnimation, morpher;

	for ( i = 0, count = sea.modifiers ? sea.modifiers.length : 0; i < count; i ++ ) {

		var mod = sea.modifiers[ i ];

		switch ( mod.type ) {

			case SEA3D.Skeleton.prototype.type:
			case SEA3D.SkeletonLocal.prototype.type:

				skeleton = mod;

				geo.bones = skeleton.tag;

				break;

			case SEA3D.Morph.prototype.type:

				morpher = mod;

				geo.morphAttributes = morpher.tag.attribs;
				geo.morphTargets = morpher.tag.targets;

				break;

		}

	}

	for ( i = 0, count = sea.animations ? sea.animations.length : 0; i < count; i ++ ) {

		var anm = sea.animations[ i ];

		switch ( anm.tag.type ) {

			case SEA3D.SkeletonAnimation.prototype.type:

				skeletonAnimation = anm.tag;

				geo.animations = skeletonAnimation.tag || this.getAnimationType( {
					sea: skeletonAnimation,
					skeleton: skeleton,
					relative: true
				} );

				break;

			case SEA3D.VertexAnimation.prototype.type:

				vertexAnimation = anm.tag;

				geo.morphAttributes = vertexAnimation.tag.attribs;
				geo.morphTargets = vertexAnimation.tag.targets;
				geo.animations = vertexAnimation.tag.animations;

				break;

		}

	}

	var uMorph = morpher != undefined || vertexAnimation != undefined,
		uMorphNormal =
					( morpher && morpher.tag.attribs.normal != undefined ) ||
					( vertexAnimation && vertexAnimation.tag.attribs.normal != undefined );

	if ( sea.material ) {

		if ( sea.material.length > 1 ) {

			var mats = [];

			for ( i = 0; i < sea.material.length; i ++ ) {

				mats[ i ] = sea.material[ i ].tag;

				mats[ i ].skinning = skeleton != undefined;
				mats[ i ].morphTargets = uMorph;
				mats[ i ].morphNormals = uMorphNormal;
				mats[ i ].vertexColors = sea.geometry.color ? THREE.VertexColors : THREE.NoColors;

			}

			mat = THREE.SEA3D.useMultiMaterial ? new THREE.MultiMaterial( mats ) : mats;

		} else {

			mat = sea.material[ 0 ].tag;

			mat.skinning = skeleton != undefined;
			mat.morphTargets = uMorph;
			mat.morphNormals = uMorphNormal;
			mat.vertexColors = sea.geometry.color ? THREE.VertexColors : THREE.NoColors;

		}

	}

	if ( skeleton ) {

		mesh = new THREE.SEA3D.SkinnedMesh( geo, mat, this.config.useVertexTexture );

		if ( this.config.autoPlay && skeletonAnimation ) {

			mesh.play( 0 );

		}

	} else if ( vertexAnimation ) {

		mesh = new THREE.SEA3D.VertexAnimationMesh( geo, mat );

		if ( this.config.autoPlay ) {

			mesh.play( 0 );

		}

	} else {

		mesh = new THREE.SEA3D.Mesh( geo, mat );

	}


	mesh.name = sea.name;

	mesh.castShadow = sea.castShadows;
	mesh.receiveShadow = sea.material ? sea.material[ 0 ].receiveShadows : true;

	this.domain.meshes = this.meshes = this.meshes || [];
	this.meshes.push( this.objects[ "m3d/" + sea.name ] = sea.tag = mesh );

	this.addSceneObject( sea );
	this.updateTransform( mesh, sea );

	this.addDefaultAnimation( sea, THREE.SEA3D.Object3DAnimator );

};

//
//	Sound Point
//

THREE.SEA3D.prototype.readSoundPoint = function ( sea ) {

	if ( ! this.audioListener ) {

		 this.audioListener = new THREE.AudioListener();

		 if ( this.config.container ) {

			this.config.container.add( this.audioListener );

		}

	}

	var sound3d = new THREE.SEA3D.PointSound( this.audioListener );
	sound3d.autoplay = sea.autoPlay;
	sound3d.setLoop( sea.autoPlay );
	sound3d.setVolume( sea.volume );
	sound3d.setRefDistance( sea.distance );
	sound3d.setRolloffFactor( this.config.audioRolloffFactor );
	sound3d.setSound( sea.sound.tag );

	sound3d.name = sea.name;

	this.domain.sounds3d = this.sounds3d = this.sounds3d || [];
	this.sounds3d.push( this.objects[ "sn3d/" + sea.name ] = sea.tag = sound3d );

	this.addSceneObject( sea );
	this.updateTransform( sound3d, sea );

	this.addDefaultAnimation( sea, THREE.SEA3D.SoundAnimator );

};

//
//	Cube Render
//

THREE.SEA3D.prototype.readCubeRender = function ( sea ) {

	var cube = new THREE.CubeCamera( 0.1, 5000, THREE.SEA3D.RTT_SIZE );
	cube.renderTarget.cubeCamera = cube;

	sea.tag = cube.renderTarget;

	this.domain.cubeRenderers = this.cubeRenderers = this.cubeRenderers || [];
	this.cubeRenderers.push( this.objects[ "rttc/" + sea.name ] = cube );

	this.addSceneObject( sea, cube );
	this.updateTransform( cube, sea );

};

//
//	Texture (WDP, JPEG, PNG and GIF)
//

THREE.SEA3D.prototype.readTexture = function ( sea ) {

	var image = new Image(),
		texture = new THREE.Texture();

	texture.name = sea.name;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.flipY = false;
	texture.image = image;

	if ( this.config.anisotropy !== undefined ) texture.anisotropy = this.config.anisotropy;

	image.onload = function () {

		texture.needsUpdate = true;

	};

	image.src = this.createObjectURL( sea.data.buffer, "image/" + sea.type );

	this.domain.textures = this.textures = this.textures || [];
	this.textures.push( this.objects[ "tex/" + sea.name ] = sea.tag = texture );

};

//
//	Cube Map
//

THREE.SEA3D.prototype.readCubeMap = function ( sea ) {

	var faces = this.toFaces( sea.faces ), texture = new THREE.CubeTexture( [] );

	var loaded = 0;

	texture.name = sea.name;
	texture.flipY = false;
	texture.format = THREE.RGBFormat;

	var onLoaded = function () {

		if ( ++ loaded == 6 ) {

			texture.needsUpdate = true;

			if ( ! this.config.async ) this.file.resume = true;

		}

	}.bind( this );

	for ( var i = 0; i < faces.length; ++ i ) {

		var cubeImage = new Image();
		cubeImage.onload = onLoaded;
		cubeImage.src = this.createObjectURL( faces[ i ].buffer, "image/" + sea.extension );

		texture.images[ i ] = cubeImage;

	}

	if ( ! this.config.async ) this.file.resume = false;

	this.domain.cubemaps = this.cubemaps = this.cubemaps || [];
	this.cubemaps.push( this.objects[ "cmap/" + sea.name ] = sea.tag = texture );

};

//
//	Updaters
//

THREE.SEA3D.prototype.readTextureUpdate = function ( sea ) {

	var obj = this.file.objects[ sea.index ],
		tex = obj.tag;

	var image = new Image();

	image.onload = function () {

		tex.image = image;
		tex.needsUpdate = true;

	};

	image.src = this.createObjectURL( sea.bytes.buffer, "image/" + obj.type );

};

//
//	Sound (MP3, OGG)
//

THREE.SEA3D.prototype.readSound = function ( sea ) {

	var sound = new THREE.SEA3D.Sound( this.createObjectURL( sea.data.buffer, "audio/" + sea.type ) );
	sound.name = sea.name;

	this.domain.sounds = this.sounds = this.sounds || [];
	this.sounds.push( this.objects[ "snd/" + sea.name ] = sea.tag = sound );

};

//
//	Script URL
//

THREE.SEA3D.prototype.readScriptURL = function ( sea ) {

	this.file.resume = false;

	var loader = new THREE.FileLoader();

	loader.setResponseType( "text" ).load( sea.url, function ( src ) {

		this.file.resume = true;

		this.domain.scripts = this.scripts = this.scripts || [];
		this.scripts.push( this.objects[ "src/" + sea.name ] = sea.tag = src );

	}.bind( this ) );

};

//
//	Texture URL
//

THREE.SEA3D.prototype.readTextureURL = function ( sea ) {

	var texture = new THREE.TextureLoader().load( this.parsePath( sea.url ) );

	texture.name = sea.name;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.flipY = false;

	if ( this.config.anisotropy !== undefined ) texture.anisotropy = this.config.anisotropy;

	this.domain.textures = this.textures = this.textures || [];
	this.textures.push( this.objects[ "tex/" + sea.name ] = sea.tag = texture );

};

//
//	CubeMap URL
//

THREE.SEA3D.prototype.readCubeMapURL = function ( sea ) {

	var faces = this.toFaces( sea.faces );

	for ( var i = 0; i < faces.length; i ++ ) {

		faces[ i ] = this.parsePath( faces[ i ] );

	}

	var texture, format = faces[ 0 ].substr( - 3 );

	if ( format == "hdr" ) {

		var usePMREM = THREE.PMREMGenerator != null;

		this.file.resume = ! usePMREM;

		texture = new THREE.HDRCubeTextureLoader().load( THREE.UnsignedByteType, faces, function ( texture ) {

			if ( usePMREM ) {

				var pmremGenerator = new THREE.PMREMGenerator( texture );
				pmremGenerator.update( this.config.renderer );

				var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker( pmremGenerator.cubeLods );
				pmremCubeUVPacker.update( this.config.renderer );

				texture.dispose();

				this.objects[ "cmap/" + sea.name ] = sea.tag = pmremCubeUVPacker.CubeUVRenderTarget.texture;

				this.file.resume = true;

			}

		}.bind( this ) );

	} else {

		texture = new THREE.CubeTextureLoader().load( faces );

	}

	texture.name = sea.name;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.flipY = false;

	if ( this.config.anisotropy !== undefined ) texture.anisotropy = this.config.anisotropy;

	this.domain.cubemaps = this.cubemaps = this.cubemaps || [];
	this.cubemaps.push( this.objects[ "cmap/" + sea.name ] = sea.tag = texture );

};

//
//	Runtime
//

THREE.SEA3D.prototype.getJSMList = function ( target, scripts ) {

	var scriptTarget = [];

	for ( var i = 0; i < scripts.length; i ++ ) {

		var script = scripts[ i ];

		if ( script.tag.type == SEA3D.JavaScriptMethod.prototype.type ) {

			scriptTarget.push( script );

		}

	}

	this.domain.scriptTargets = this.scriptTargets = this.scriptTargets || [];
	this.scriptTargets.push( target );

	return scriptTarget;

};

THREE.SEA3D.prototype.readJavaScriptMethod = function ( sea ) {

	try {

		var src =
			'(function() {\n' +
			'var $METHOD = {}\n';

		var declare =
			'function($INC, $REF, global, local, self, $PARAM) {\n' +
			'var watch = $INC["watch"],\n' +
			'scene = $INC["scene"],\n' +
			'sea3d = $INC["sea3d"],\n' +
			'print = $INC["print"];\n';

		declare +=
			'var $SRC = $INC["source"],\n' +
			'addEventListener = $SRC.addEventListener.bind( $SRC ),\n' +
			'hasEventListener = $SRC.hasEventListener.bind( $SRC ),\n' +
			'removeEventListener = $SRC.removeEventListener.bind( $SRC ),\n' +
			'dispatchEvent = $SRC.dispatchEvent.bind( $SRC ),\n' +
			'dispose = $SRC.dispose.bind( $SRC );\n';

		for ( var name in sea.methods ) {

			src += '$METHOD["' + name + '"] = ' + declare + sea.methods[ name ].src + '}\n';

		}

		src += 'return $METHOD; })';

		this.domain.methods = eval( src )();

	} catch ( e ) {

		console.error( 'SEA3D JavaScriptMethod: Error running "' + sea.name + '".' );
		console.error( e );

	}

};

//
//	GLSL
//

THREE.SEA3D.prototype.readGLSL = function ( sea ) {

	this.domain.glsl = this.glsl = this.glsl || [];
	this.glsl.push( this.objects[ "glsl/" + sea.name ] = sea.tag = sea.src );

};

//
//	Material
//

THREE.SEA3D.prototype.materialTechnique =
( function () {

	var techniques = {};

	// FINAL
	techniques.onComplete = function ( mat, sea ) {

		if ( sea.alpha < 1 || mat.blending > THREE.NormalBlending ) {

			mat.opacity = sea.alpha;
			mat.transparent = true;

		}

	};

	// PHYSICAL
	techniques[ SEA3D.Material.PHYSICAL ] =
	function ( mat, tech ) {

		mat.color.setHex( tech.color );
		mat.roughness = tech.roughness;
		mat.metalness = tech.metalness;

	};

	// REFLECTIVITY
	techniques[ SEA3D.Material.REFLECTIVITY ] =
	function ( mat, tech ) {

		mat.reflectivity = tech.strength;

	};

	// CLEAR_COAT
	techniques[ SEA3D.Material.CLEAR_COAT ] =
	function ( mat, tech ) {

		mat.clearCoat = tech.strength;
		mat.clearCoatRoughness = tech.roughness;

	};

	// PHONG
	techniques[ SEA3D.Material.PHONG ] =
	function ( mat, tech ) {

		mat.color.setHex( tech.diffuseColor );
		mat.specular.setHex( tech.specularColor ).multiplyScalar( tech.specular );
		mat.shininess = tech.gloss;

	};

	// DIFFUSE_MAP
	techniques[ SEA3D.Material.DIFFUSE_MAP ] =
	function ( mat, tech, sea ) {

		mat.map = tech.texture.tag;
		mat.color.setHex( 0xFFFFFF );

		mat.map.wrapS = mat.map.wrapT = sea.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;

		if ( tech.texture.transparent ) {

			mat.transparent = true;

		}

	};

	// ROUGHNESS_MAP
	techniques[ SEA3D.Material.ROUGHNESS_MAP ] =
	function ( mat, tech ) {

		mat.roughnessMap = tech.texture.tag;

	};

	// METALNESS_MAP
	techniques[ SEA3D.Material.METALNESS_MAP ] =
	function ( mat, tech ) {

		mat.metalnessMap = tech.texture.tag;

	};

	// SPECULAR_MAP
	techniques[ SEA3D.Material.SPECULAR_MAP ] =
	function ( mat, tech ) {

		if ( mat.specular ) {

			mat.specularMap = tech.texture.tag;
			mat.specular.setHex( 0xFFFFFF );

		}

	};

	// NORMAL_MAP
	techniques[ SEA3D.Material.NORMAL_MAP ] =
	function ( mat, tech ) {

		mat.normalMap = tech.texture.tag;

	};

	// REFLECTION
	techniques[ SEA3D.Material.REFLECTION ] =
	techniques[ SEA3D.Material.FRESNEL_REFLECTION ] =
	function ( mat, tech ) {

		mat.envMap = tech.texture.tag;
		mat.envMap.mapping = THREE.CubeReflectionMapping;
		mat.combine = THREE.MixOperation;

		mat.reflectivity = tech.alpha;

	};

	// REFLECTION_SPHERICAL
	techniques[ SEA3D.Material.REFLECTION_SPHERICAL ] =
	function ( mat, tech ) {

		mat.envMap = tech.texture.tag;
		mat.envMap.mapping = THREE.SphericalReflectionMapping;
		mat.combine = THREE.MixOperation;

		mat.reflectivity = tech.alpha;

	};

	// REFRACTION
	techniques[ SEA3D.Material.REFRACTION_MAP ] =
	function ( mat, tech ) {

		mat.envMap = tech.texture.tag;
		mat.envMap.mapping = THREE.CubeRefractionMapping;

		mat.refractionRatio = tech.ior;
		mat.reflectivity = tech.alpha;

	};

	// LIGHT_MAP
	techniques[ SEA3D.Material.LIGHT_MAP ] =
	function ( mat, tech ) {

		if ( tech.blendMode == "multiply" ) mat.aoMap = tech.texture.tag;
		else mat.lightMap = tech.texture.tag;

	};

	// EMISSIVE
	techniques[ SEA3D.Material.EMISSIVE ] =
	function ( mat, tech ) {

		mat.emissive.setHex( tech.color );

	};

	// EMISSIVE_MAP
	techniques[ SEA3D.Material.EMISSIVE_MAP ] =
	function ( mat, tech ) {

		mat.emissiveMap = tech.texture.tag;

	};

	// ALPHA_MAP
	techniques[ SEA3D.Material.ALPHA_MAP ] =
	function ( mat, tech, sea ) {

		mat.alphaMap = tech.texture.tag;
		mat.transparent = true;

		mat.alphaMap.wrapS = mat.alphaMap.wrapT = sea.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;

	};

	return techniques;

} )();

THREE.SEA3D.prototype.createMaterial = function ( sea ) {

	if ( sea.tecniquesDict[ SEA3D.Material.REFLECTIVITY ] || sea.tecniquesDict[ SEA3D.Material.CLEAR_COAT ] ) {

		return new THREE.MeshPhysicalMaterial();

	} else if ( sea.tecniquesDict[ SEA3D.Material.PHYSICAL ] ) {

		return new THREE.MeshStandardMaterial();

	}

	return new THREE.MeshPhongMaterial();

};

THREE.SEA3D.prototype.setBlending = function ( mat, blendMode ) {

	if ( blendMode === "normal" ) return;

	switch ( blendMode ) {

		case "add":

			mat.blending = THREE.AdditiveBlending;

			break;

		case "subtract":

			mat.blending = THREE.SubtractiveBlending;

			break;

		case "multiply":

			mat.blending = THREE.MultiplyBlending;

			break;

		case "screen":

			mat.blending = THREE.CustomBlending;
			mat.blendSrc = THREE.OneFactor;
			mat.blendDst = THREE.OneMinusSrcColorFactor;
			mat.blendEquation = THREE.AddEquation;

			break;

	}

	mat.transparent = true;

};

THREE.SEA3D.prototype.readMaterial = function ( sea ) {

	var mat = this.createMaterial( sea );
	mat.name = sea.name;

	mat.lights = sea.receiveLights;
	mat.fog = sea.receiveFog;

	mat.depthWrite = sea.depthWrite;
	mat.depthTest = sea.depthTest;

	mat.premultipliedAlpha = sea.premultipliedAlpha;

	mat.side = sea.doubleSided ? THREE.DoubleSide : THREE.FrontSide;

	this.setBlending( mat, sea.blendMode );

	for ( var i = 0; i < sea.technique.length; i ++ ) {

		var tech = sea.technique[ i ];

		if ( this.materialTechnique[ tech.kind ] ) {

			this.materialTechnique[ tech.kind ].call( this, mat, tech, sea );

		}

	}

	if ( this.materialTechnique.onComplete ) {

		this.materialTechnique.onComplete.call( this, mat, sea );

	}

	this.domain.materials = this.materials = this.materials || [];
	this.materials.push( this.objects[ "mat/" + sea.name ] = sea.tag = mat );

};

//
//	Point Light
//

THREE.SEA3D.prototype.readPointLight = function ( sea ) {

	var light = new THREE.SEA3D.PointLight( sea.color, sea.multiplier * this.config.multiplier );
	light.name = sea.name;

	if ( sea.attenuation ) {

		light.distance = sea.attenuation.end;

	}

	if ( sea.shadow ) this.setShadowMap( light );

	this.domain.lights = this.lights = this.lights || [];
	this.lights.push( this.objects[ "lht/" + sea.name ] = sea.tag = light );

	this.addSceneObject( sea );

	this.updateTransform( light, sea );

	this.addDefaultAnimation( sea, THREE.SEA3D.LightAnimator );

	this.updateScene();

};

//
//	Hemisphere Light
//

THREE.SEA3D.prototype.readHemisphereLight = function ( sea ) {

	var light = new THREE.HemisphereLight( sea.color, sea.secondColor, sea.multiplier * this.config.multiplier );
	light.position.set( 0, 500, 0 );
	light.name = sea.name;

	this.domain.lights = this.lights = this.lights || [];
	this.lights.push( this.objects[ "lht/" + sea.name ] = sea.tag = light );

	this.addSceneObject( sea );

	this.addDefaultAnimation( sea, THREE.SEA3D.LightAnimator );

	this.updateScene();

};

//
//	Ambient Light
//

THREE.SEA3D.prototype.readAmbientLight = function ( sea ) {

	var light = new THREE.AmbientLight( sea.color, sea.multiplier * this.config.multiplier );
	light.name = sea.name;

	this.domain.lights = this.lights = this.lights || [];
	this.lights.push( this.objects[ "lht/" + sea.name ] = sea.tag = light );

	this.addSceneObject( sea );

	this.addDefaultAnimation( sea, THREE.SEA3D.LightAnimator );

	this.updateScene();

};

//
//	Directional Light
//

THREE.SEA3D.prototype.readDirectionalLight = function ( sea ) {

	var light = new THREE.DirectionalLight( sea.color, sea.multiplier * this.config.multiplier );
	light.name = sea.name;

	if ( sea.shadow ) {

		this.setShadowMap( light );

	}

	this.domain.lights = this.lights = this.lights || [];
	this.lights.push( this.objects[ "lht/" + sea.name ] = sea.tag = light );

	this.addSceneObject( sea );

	this.updateTransform( light, sea );

	this.addDefaultAnimation( sea, THREE.SEA3D.LightAnimator );

	this.updateScene();

};

//
//	Camera
//

THREE.SEA3D.prototype.readCamera = function ( sea ) {

	var camera = new THREE.SEA3D.Camera( sea.fov );
	camera.name = sea.name;

	this.domain.cameras = this.cameras = this.cameras || [];
	this.cameras.push( this.objects[ "cam/" + sea.name ] = sea.tag = camera );

	this.addSceneObject( sea );
	this.updateTransform( camera, sea );

	this.addDefaultAnimation( sea, THREE.SEA3D.CameraAnimator );

};

//
//	Orthographic Camera
//

THREE.SEA3D.prototype.readOrthographicCamera = function ( sea ) {

	var aspect, width, height;

	var stageWidth = this.config.stageWidth !== undefined ? this.config.stageWidth : ( window ? window.innerWidth : 1024 );
	var stageHeight = this.config.stageHeight !== undefined ? this.config.stageHeight : ( window ? window.innerHeight : 1024 );

	if ( stageWidth > stageHeight ) {

		aspect = stageWidth / stageHeight;

		width = sea.height * aspect;
		height = sea.height;

	} else {

		aspect = stageHeight / stageWidth;

		width = sea.height;
		height = sea.height * aspect;

	}

	var camera = new THREE.SEA3D.OrthographicCamera( - width, width, height, - height );
	camera.name = sea.name;

	this.domain.cameras = this.cameras = this.cameras || [];
	this.cameras.push( this.objects[ "cam/" + sea.name ] = sea.tag = camera );

	this.addSceneObject( sea );
	this.updateTransform( camera, sea );

	this.addDefaultAnimation( sea, THREE.SEA3D.CameraAnimator );

};

//
//	Skeleton
//

THREE.SEA3D.prototype.getSkeletonFromBones = function(bonesData) {

	var bones = [], bone, gbone;
	var i, il;
	
	for ( i = 0, il = bonesData.length; i < il; i ++ ) {

		gbone = bonesData[ i ];

		bone = new THREE.Bone();
		bones.push( bone );

		bone.name = gbone.name;
		bone.position.fromArray( gbone.pos );
		bone.quaternion.fromArray( gbone.rotq );
		
		if ( gbone.scl !== undefined ) bone.scale.fromArray( gbone.scl );

	}

	for ( i = 0, il = bonesData.length; i < il; i ++ ) {

		gbone = bonesData[ i ];

		if ( ( gbone.parent !== - 1 ) && ( gbone.parent !== null ) && ( bones[ gbone.parent ] !== undefined ) ) {

			bones[ gbone.parent ].add( bones[ i ] );

		}

	}
	
	return new THREE.Skeleton( bones );
	
};

THREE.SEA3D.prototype.readSkeletonLocal = function ( sea ) {

	var bones = [];

	for ( var i = 0; i < sea.joint.length; i ++ ) {

		var bone = sea.joint[ i ];

		bones[ i ] = {
			name: bone.name,
			pos: [ bone.x, bone.y, bone.z ],
			rotq: [ bone.qx, bone.qy, bone.qz, bone.qw ],
			parent: bone.parentIndex
		};

	}

	this.domain.bones = this.bones = this.bones || [];
	this.bones.push( this.objects[ sea.name + '.sklq' ] = sea.tag = bones );

};

//
//	Joint Object
//

THREE.SEA3D.prototype.readJointObject = function ( sea ) {

	var mesh = sea.target.tag,
		bone = mesh.skeleton.bones[ sea.joint ];

	this.domain.joints = this.joints = this.joints || [];
	this.joints.push( this.objects[ "jnt/" + sea.name ] = sea.tag = bone );

};

//
//	Morpher
//

THREE.SEA3D.prototype.readMorpher = function ( sea ) {

	var attribs = { position: [] }, targets = [];

	for ( var i = 0; i < sea.node.length; i ++ ) {

		var node = sea.node[ i ];

		attribs.position[ i ] = new THREE.Float32BufferAttribute( node.vertex, 3 );

		if ( node.normal ) {

			attribs.normal = attribs.normal || [];
			attribs.normal[ i ] = new THREE.Float32BufferAttribute( node.normal, 3 );

		}

		targets[ i ] = { name: node.name };

	}

	sea.tag = {
		attribs: attribs,
		targets: targets
	};

};

//
//	Animation
//

THREE.SEA3D.prototype.readAnimation = function ( sea ) {

	var animations = [], delta = ( 1000 / sea.frameRate ) / 1000;

	for ( var i = 0; i < sea.sequence.length; i ++ ) {

		var seq = sea.sequence[ i ];

		var tracks = [];

		for ( var j = 0; j < sea.dataList.length; j ++ ) {

			var anm = sea.dataList[ j ],
				t, k, times, values,
				data = anm.data,
				start = seq.start * anm.blockSize,
				end = start + ( seq.count * anm.blockSize ),
				intrpl = seq.intrpl ? THREE.InterpolateLinear : false,
				name = null;

			switch ( anm.kind ) {

				case SEA3D.Animation.POSITION:

					name = '.position';

					break;

				case SEA3D.Animation.ROTATION:

					name = '.quaternion';

					break;

				case SEA3D.Animation.SCALE:

					name = '.scale';

					break;

				case SEA3D.Animation.COLOR:

					name = '.color';

					break;

				case SEA3D.Animation.MULTIPLIER:

					name = '.intensity';

					break;

				case SEA3D.Animation.FOV:

					name = '.fov';

					break;

			}

			if ( ! name ) continue;

			switch ( anm.type ) {

				case SEA3D.Stream.BYTE:
				case SEA3D.Stream.UBYTE:
				case SEA3D.Stream.INT:
				case SEA3D.Stream.UINT:
				case SEA3D.Stream.FLOAT:
				case SEA3D.Stream.DOUBLE:
				case SEA3D.Stream.DECIMAL:

					values = data.subarray( start, end );
					times = new Float32Array( values.length );
					t = 0;

					for ( k = 0; k < times.length; k ++ ) {

						times[ k ] = t;
						t += delta;

					}

					tracks.push( new THREE.VectorKeyframeTrack( name, times, values, intrpl ) );

					break;

				case SEA3D.Stream.VECTOR3D:

					values = data.subarray( start, end );
					times = new Float32Array( values.length / anm.blockSize );
					t = 0;

					for ( k = 0; k < times.length; k ++ ) {

						times[ k ] = t;
						t += delta;

					}

					tracks.push( new THREE.VectorKeyframeTrack( name, times, values, intrpl ) );

					break;

				case SEA3D.Stream.VECTOR4D:

					values = data.subarray( start, end );
					times = new Float32Array( values.length / anm.blockSize );
					t = 0;

					for ( k = 0; k < times.length; k ++ ) {

						times[ k ] = t;
						t += delta;

					}

					tracks.push( new THREE.QuaternionKeyframeTrack( name, times, values, intrpl ) );

					break;

				case SEA3D.Stream.INT24:
				case SEA3D.Stream.UINT24:

					values = new Float32Array( ( end - start ) * 3 );
					times = new Float32Array( values.length / 3 );
					t = 0;

					for ( k = 0; k < times.length; k ++ ) {

						values[ ( k * 3 ) ] = ( ( data[ k ] >> 16 ) & 0xFF ) / 255;
						values[ ( k * 3 ) + 1 ] = ( ( data[ k ] >> 8 ) & 0xFF ) / 255;
						values[ ( k * 3 ) + 2 ] = ( data[ k ] & 0xFF ) / 255;
						times[ k ] = t;
						t += delta;

					}

					tracks.push( new THREE.VectorKeyframeTrack( name, times, values, intrpl ) );//ColorKeyframeTrack

					break;

			}

		}

		animations.push( new THREE.SEA3D.AnimationClip( seq.name, - 1, tracks, seq.repeat ) );

	}

	this.domain.clips = this.clips = this.clips || [];
	this.clips.push( this.objects[ sea.name + '.anm' ] = sea.tag = animations );

};

//
//	Skeleton Animation
//

THREE.SEA3D.prototype.readSkeletonAnimation = function ( sea, skl ) {

	skl = !skl && sea.metadata && sea.metadata.skeleton ? sea.metadata.skeleton : skl;

	if (!skl || sea.tag) return sea.tag;
	
	var animations = [], delta = ( 1000 / sea.frameRate ) / 1000;

	for ( var i = 0; i < sea.sequence.length; i ++ ) {

		var seq = sea.sequence[ i ];

		var start = seq.start;
		var end = start + seq.count;

		var animation = {
			name: seq.name,
			fps: sea.frameRate,
			length: delta * seq.count,
			hierarchy: []
		};

		var numJoints = sea.numJoints,
			raw = sea.raw;

		for ( var j = 0; j < numJoints; j ++ ) {

			var bone = skl.joint[ j ],
				node = { parent: bone.parentIndex, keys: [] },
				keys = node.keys,
				time = 0;

			for ( var frame = start; frame < end; frame ++ ) {

				var idx = ( frame * numJoints * 7 ) + ( j * 7 );

				keys.push( {
					time: time,
					pos: [ raw[ idx ], raw[ idx + 1 ], raw[ idx + 2 ] ],
					rot: [ raw[ idx + 3 ], raw[ idx + 4 ], raw[ idx + 5 ], raw[ idx + 6 ] ],
					scl: [ 1, 1, 1 ]
				} );

				time += delta;

			}

			animation.hierarchy[ j ] = node;

		}

		animations.push( THREE.SEA3D.AnimationClip.fromClip( THREE.AnimationClip.parseAnimation( animation, skl.tag ), seq.repeat ) );

	}

	this.domain.clips = this.clips = this.clips || [];
	this.clips.push( this.objects[ sea.name + '.skla' ] = sea.tag = animations );

};

//
//	Vertex Animation
//

THREE.SEA3D.prototype.readVertexAnimation = function ( sea ) {

	var attribs = { position: [] }, targets = [], animations = [], i, j, l;

	for ( i = 0, l = sea.frame.length; i < l; i ++ ) {

		var frame = sea.frame[ i ];

		attribs.position[ i ] = new THREE.Float32BufferAttribute( frame.vertex, 3 );

		if ( frame.normal ) {

			attribs.normal = attribs.normal || [];
			attribs.normal[ i ] = new THREE.Float32BufferAttribute( frame.normal, 3 );

		}

		targets[ i ] = { name: i };

	}

	for ( i = 0; i < sea.sequence.length; i ++ ) {

		var seq = sea.sequence[ i ];
		var seqTargets = [];

		for ( j = 0; j < seq.count; j ++ ) {

			seqTargets[ j ] = targets[ seq.start + j ];

		}

		animations.push( THREE.SEA3D.AnimationClip.fromClip( THREE.AnimationClip.CreateFromMorphTargetSequence( seq.name, seqTargets, sea.frameRate ), seq.repeat ) );

	}

	sea.tag = {
		attribs: attribs,
		targets: targets,
		animations: animations
	};

	this.domain.clips = this.clips = this.clips || [];
	this.clips.push( this.objects[ sea.name + '.vtxa' ] = sea.tag );

};

//
//	Animation Selector
//

THREE.SEA3D.prototype.getAnimationType = function ( req ) {

	var sea = req.sea;

	switch ( sea.type ) {

		case SEA3D.SkeletonAnimation.prototype.type:

			this.readSkeletonAnimation( sea, req.skeleton );

			break;

	}

	return sea.tag;

};

//
//	Actions
//

THREE.SEA3D.prototype.applyEnvironment = function ( envMap ) {

	for ( var j = 0, l = this.materials.length; j < l; ++ j ) {

		var mat = this.materials[ j ];

		if ( mat instanceof THREE.MeshStandardMaterial ) {

			if ( mat.envMap ) continue;

			mat.envMap = envMap;
			mat.envMap.mapping = THREE.CubeReflectionMapping;

			mat.needsUpdate = true;

		}

	}

};

THREE.SEA3D.prototype.readActions = function ( sea ) {

	for ( var i = 0; i < sea.actions.length; i ++ ) {

		var act = sea.actions[ i ];

		switch ( act.kind ) {

			case SEA3D.Actions.ATTRIBUTES:

				this.attribs = this.domain.attribs = act.attributes.tag;

				break;

			case SEA3D.Actions.SCRIPTS:

				this.domain.scripts = this.getJSMList( this.domain, act.scripts );

				if ( this.config.scripts && this.config.runScripts ) this.domain.runJSMList( this.domain );

				break;

			case SEA3D.Actions.ENVIRONMENT_COLOR:

				this.domain.background = this.background = this.background || {};

				this.background.color = new THREE.Color( act.color );

				break;

			case SEA3D.Actions.ENVIRONMENT:

				this.domain.background = this.background = this.background || {};

				this.background.texture = act.texture.tag;

				if ( this.config.useEnvironment && this.materials != undefined ) {

					this.applyEnvironment( act.texture.tag );

				}

				break;

		}

	}

};

//
//	Properties
//

THREE.SEA3D.prototype.updatePropertiesAssets = function ( sea, props ) {
	
	for(var name in props) {
		
		switch(props.__type[name]) {
			
			case SEA3D.Stream.ASSET:
			
				if (!props.__asset) props.__asset = {};
				if (!props.__asset[name]) props.__asset[name] = props[name];
				
				props[name] = props.__asset[name].tag;
				
				break;
			
			case SEA3D.Stream.GROUP:
			
				props[name] = this.updatePropertiesAssets( sea, props[name] );
				
				break;
			
		}
		
	}
	
	return props;
	
};

THREE.SEA3D.prototype.readProperties = function ( sea ) {

	var props = this.updatePropertiesAssets( sea, sea.props );
	
	this.domain.properties = this.properties = this.properties || [];
	this.properties.push( this.objects[ "prop/" + sea.name ] = sea.tag = props );

};

THREE.SEA3D.prototype.readFileInfo = function ( sea ) {

	this.domain.info = this.updatePropertiesAssets( sea, sea.info );

};

//
//	Events
//

THREE.SEA3D.Event = {
	PROGRESS: "sea3d_progress",
	LOAD_PROGRESS: "sea3d_load",
	DOWNLOAD_PROGRESS: "sea3d_download",
	COMPLETE: "sea3d_complete",
	OBJECT_COMPLETE: "sea3d_object",
	PARSE_PROGRESS: "parse_progress",
	PARSE_COMPLETE: "parse_complete",
	ERROR: "sea3d_error"
};

THREE.SEA3D.prototype.onProgress = function ( e ) {

	e.status = e.type;
	e.progress = e.loaded / e.total;
	e.type = THREE.SEA3D.Event.PROGRESS;

	this.dispatchEvent( e );

};

THREE.SEA3D.prototype.onLoadProgress = function ( e ) {

	e.type = THREE.SEA3D.Event.LOAD_PROGRESS;
	this.dispatchEvent( e );

	this.onProgress( e );

};

THREE.SEA3D.prototype.onDownloadProgress = function ( e ) {

	e.type = THREE.SEA3D.Event.DOWNLOAD_PROGRESS;
	this.dispatchEvent( e );

	this.onProgress( e );

};

THREE.SEA3D.prototype.onComplete = function ( e ) {

	e.type = THREE.SEA3D.Event.COMPLETE;
	this.dispatchEvent( e );

};

THREE.SEA3D.prototype.onCompleteObject = function ( e ) {

	e.type = THREE.SEA3D.Event.OBJECT_COMPLETE;
	this.dispatchEvent( e );

};

THREE.SEA3D.prototype.onParseProgress = function ( e ) {

	e.type = THREE.SEA3D.Event.PARSE_PROGRESS;
	this.dispatchEvent( e );

};

THREE.SEA3D.prototype.onParseComplete = function ( e ) {

	e.type = THREE.SEA3D.Event.PARSE_COMPLETE;
	this.dispatchEvent( e );

};

THREE.SEA3D.prototype.onError = function ( e ) {

	e.type = THREE.SEA3D.Event.ERROR;
	this.dispatchEvent( e );

};

//
//	Loader
//

THREE.SEA3D.prototype.createDomain = function () {

	return this.domain = new THREE.SEA3D.Domain(
		this.config.id,
		this.objects = {},
		this.config.container
	);

};

THREE.SEA3D.prototype.clone = function ( config, onParseComplete, onParseProgress ) {

	if ( ! this.file.isDone() ) throw new Error( "Previous parse is not completed." );

	this.config.container = config && config.container !== undefined ? config.container : new THREE.Object3D();

	if ( config ) this.loadConfig( config );

	var timeLimit = this.config.timeLimit;

	this.config.timeLimit = config && config.timeLimit !== undefined ? config.timeLimit : Infinity;

	this.parse( onParseComplete, onParseProgress );

	this.config.timeLimit = timeLimit;

	return this.domain;

};

THREE.SEA3D.prototype.loadConfig = function ( config ) {

	for ( var name in config ) {

		this.config[ name ] = config[ name ];

	}

};

THREE.SEA3D.prototype.parse = function ( onParseComplete, onParseProgress ) {

	delete this.cameras;
	delete this.containers;
	delete this.lights;
	delete this.joints;
	delete this.meshes;
	delete this.materials;
	delete this.sprites;
	delete this.sounds3d;
	delete this.cubeRenderers;
	delete this.sounds;
	delete this.glsl;
	delete this.dummy;
	delete this.background;
	delete this.properties;
	delete this.scriptTargets;

	delete this.domain;

	this.createDomain();

	this.setTypeRead();

	this.file.onParseComplete = ( function ( e ) {

		if ( this.config.manager ) this.config.manager.add( this.domain );

		( onParseComplete || this.onParseComplete ).call( this, e );

	} ).bind( this );

	this.file.onParseProgress = onParseProgress || this.onParseProgress;

	// EXTENSIONS

	var i = THREE.SEA3D.EXTENSIONS_LOADER.length;

	while ( i -- ) {

		var loader = THREE.SEA3D.EXTENSIONS_LOADER[ i ];

		if ( loader.parse ) loader.parse.call( this );

	}

	this.file.parse();

	return this.domain;

};

THREE.SEA3D.prototype.onHead = function ( args ) {

	if ( args.sign != 'TJS' ) {

		throw new Error( "Sign '" + args.sign + "' not supported! Use SEA3D Studio to publish or SEA3DLegacy.js" );

	}

};

THREE.SEA3D.EXTENSIONS_LOADER = [];
THREE.SEA3D.EXTENSIONS_DOMAIN = [];

THREE.SEA3D.prototype.setTypeRead = function () {

	this.file.typeRead = {};

	this.file.typeRead[ SEA3D.Geometry.prototype.type ] = this.readGeometryBuffer;
	this.file.typeRead[ SEA3D.Mesh.prototype.type ] = this.readMesh;
	this.file.typeRead[ SEA3D.Sprite.prototype.type ] = this.readSprite;
	this.file.typeRead[ SEA3D.Container3D.prototype.type ] = this.readContainer3D;
	this.file.typeRead[ SEA3D.Line.prototype.type ] = this.readLine;
	this.file.typeRead[ SEA3D.Material.prototype.type ] = this.readMaterial;
	this.file.typeRead[ SEA3D.Camera.prototype.type ] = this.readCamera;
	this.file.typeRead[ SEA3D.OrthographicCamera.prototype.type ] = this.readOrthographicCamera;
	this.file.typeRead[ SEA3D.SkeletonLocal.prototype.type ] = this.readSkeletonLocal;
	this.file.typeRead[ SEA3D.SkeletonAnimation.prototype.type ] = this.readSkeletonAnimation;
	this.file.typeRead[ SEA3D.JointObject.prototype.type ] = this.readJointObject;
	this.file.typeRead[ SEA3D.CubeMap.prototype.type ] = this.readCubeMap;
	this.file.typeRead[ SEA3D.CubeRender.prototype.type ] = this.readCubeRender;
	this.file.typeRead[ SEA3D.Animation.prototype.type ] = this.readAnimation;
	this.file.typeRead[ SEA3D.SoundPoint.prototype.type ] = this.readSoundPoint;
	this.file.typeRead[ SEA3D.TextureURL.prototype.type ] = this.readTextureURL;
	this.file.typeRead[ SEA3D.CubeMapURL.prototype.type ] = this.readCubeMapURL;
	this.file.typeRead[ SEA3D.TextureUpdate.prototype.type ] = this.readTextureUpdate;
	this.file.typeRead[ SEA3D.Morph.prototype.type ] = this.readMorpher;
	this.file.typeRead[ SEA3D.VertexAnimation.prototype.type ] = this.readVertexAnimation;
	this.file.typeRead[ SEA3D.Actions.prototype.type ] = this.readActions;
	this.file.typeRead[ SEA3D.FileInfo.prototype.type ] = this.readFileInfo;
	this.file.typeRead[ SEA3D.Properties.prototype.type ] = this.readProperties;

	if ( this.config.dummys ) {

		this.file.typeRead[ SEA3D.Dummy.prototype.type ] = this.readDummy;

	}

	if ( this.config.scripts ) {

		this.file.typeRead[ SEA3D.ScriptURL.prototype.type ] = this.readScriptURL;
		this.file.typeRead[ SEA3D.JavaScriptMethod.prototype.type ] = this.readJavaScriptMethod;

	}

	if ( this.config.lights ) {

		this.file.typeRead[ SEA3D.PointLight.prototype.type ] = this.readPointLight;
		this.file.typeRead[ SEA3D.DirectionalLight.prototype.type ] = this.readDirectionalLight;
		this.file.typeRead[ SEA3D.HemisphereLight.prototype.type ] = this.readHemisphereLight;
		this.file.typeRead[ SEA3D.AmbientLight.prototype.type ] = this.readAmbientLight;

	}

	// UNIVERSAL

	this.file.typeRead[ SEA3D.JPEG.prototype.type ] =
	this.file.typeRead[ SEA3D.JPEG_XR.prototype.type ] =
	this.file.typeRead[ SEA3D.PNG.prototype.type ] =
	this.file.typeRead[ SEA3D.GIF.prototype.type ] = this.readTexture;
	this.file.typeRead[ SEA3D.MP3.prototype.type ] = this.readSound;
	this.file.typeRead[ SEA3D.GLSL.prototype.type ] = this.readGLSL;

	// EXTENSIONS

	var i = THREE.SEA3D.EXTENSIONS_LOADER.length;

	while ( i -- ) {

		var loader = THREE.SEA3D.EXTENSIONS_LOADER[ i ];

		if ( loader.setTypeRead ) loader.setTypeRead.call( this );

	}

};

THREE.SEA3D.prototype.load = function ( data ) {

	this.file = new SEA3D.File();
	this.file.scope = this;
	this.file.config = this.config;
	this.file.onProgress = this.onLoadProgress.bind( this );
	this.file.onCompleteObject = this.onCompleteObject.bind( this );
	this.file.onDownloadProgress = this.onDownloadProgress.bind( this );
	this.file.onParseProgress = this.onParseProgress.bind( this );
	this.file.onParseComplete = this.onParseComplete.bind( this );
	this.file.onError = this.onError.bind( this );
	this.file.onHead = this.onHead.bind( this );

	this.file.onComplete = ( function ( e ) {

		if ( this.config.manager ) this.config.manager.add( this.domain );

		this.onComplete.call( this, e );

	} ).bind( this );

	// SEA3D

	this.createDomain();

	this.setTypeRead();

	if ( data === undefined ) return;

	if ( typeof data === "string" ) this.file.load( data );
	else this.file.read( data );

};

/**
 * 	SEA3D Legacy for Three.JS
 * 	@author Sunag / http://www.sunag.com.br/
 */

//'use strict';

//
//	Header
//

Object.assign( THREE.SEA3D.prototype, {

	_onHead: THREE.SEA3D.prototype.onHead,
	_updateTransform: THREE.SEA3D.prototype.updateTransform,
	_readVertexAnimation: THREE.SEA3D.prototype.readVertexAnimation,
	_readGeometryBuffer: THREE.SEA3D.prototype.readGeometryBuffer,
	_readLine: THREE.SEA3D.prototype.readLine,
	_getAnimationType: THREE.SEA3D.prototype.getAnimationType,
	_readAnimation: THREE.SEA3D.prototype.readAnimation

} );

//
//	Utils
//

THREE.SEA3D.prototype.isLegacy = function ( sea ) {

	var sea3d = sea.sea3d;

	if ( sea3d.sign == 'S3D' && ! sea._legacy ) {

		sea._legacy = sea3d.typeUnique[ sea.type ] == true;

		return sea3d.config.legacy;

	}

	return false;

};

THREE.SEA3D.prototype.flipVec3 = function ( v ) {

	if ( ! v ) return;

	var i = 2;

	while ( i < v.length ) {

		v[ i ] = - v[ i ];

		i += 3;

	}

	return v;

};

THREE.SEA3D.prototype.expandJoints = function ( sea ) {

	var numJoints = sea.numVertex * 4;

	var joint = sea.isBig ? new Uint32Array( numJoints ) : new Uint16Array( numJoints );
	var weight = new Float32Array( numJoints );

	var w = 0, jpv = sea.jointPerVertex;

	for ( var i = 0; i < sea.numVertex; i ++ ) {

		var tjsIndex = i * 4;
		var seaIndex = i * jpv;

		joint[ tjsIndex ] = sea.joint[ seaIndex ];
		if ( jpv > 1 ) joint[ tjsIndex + 1 ] = sea.joint[ seaIndex + 1 ];
		if ( jpv > 2 ) joint[ tjsIndex + 2 ] = sea.joint[ seaIndex + 2 ];
		if ( jpv > 3 ) joint[ tjsIndex + 3 ] = sea.joint[ seaIndex + 3 ];

		weight[ tjsIndex ] = sea.weight[ seaIndex ];
		if ( jpv > 1 ) weight[ tjsIndex + 1 ] = sea.weight[ seaIndex + 1 ];
		if ( jpv > 2 ) weight[ tjsIndex + 2 ] = sea.weight[ seaIndex + 2 ];
		if ( jpv > 3 ) weight[ tjsIndex + 3 ] = sea.weight[ seaIndex + 3 ];

		w = weight[ tjsIndex ] + weight[ tjsIndex + 1 ] + weight[ tjsIndex + 2 ] + weight[ tjsIndex + 3 ];

		weight[ tjsIndex ] += 1 - w;

	}

	sea.joint = joint;
	sea.weight = weight;

	sea.jointPerVertex = 4;

};

THREE.SEA3D.prototype.compressJoints = function ( sea ) {

	var numJoints = sea.numVertex * 4;

	var joint = sea.isBig ? new Uint32Array( numJoints ) : new Uint16Array( numJoints );
	var weight = new Float32Array( numJoints );

	var w = 0, jpv = sea.jointPerVertex;

	for ( var i = 0; i < sea.numVertex; i ++ ) {

		var tjsIndex = i * 4;
		var seaIndex = i * jpv;

		joint[ tjsIndex ] = sea.joint[ seaIndex ];
		joint[ tjsIndex + 1 ] = sea.joint[ seaIndex + 1 ];
		joint[ tjsIndex + 2 ] = sea.joint[ seaIndex + 2 ];
		joint[ tjsIndex + 3 ] = sea.joint[ seaIndex + 3 ];

		weight[ tjsIndex ] = sea.weight[ seaIndex ];
		weight[ tjsIndex + 1 ] = sea.weight[ seaIndex + 1 ];
		weight[ tjsIndex + 2 ] = sea.weight[ seaIndex + 2 ];
		weight[ tjsIndex + 3 ] = sea.weight[ seaIndex + 3 ];

		w = weight[ tjsIndex ] + weight[ tjsIndex + 1 ] + weight[ tjsIndex + 2 ] + weight[ tjsIndex + 3 ];

		weight[ tjsIndex ] += 1 - w;

	}

	sea.joint = joint;
	sea.weight = weight;

	sea.jointPerVertex = 4;

};

THREE.SEA3D.prototype.flipIndexes = function ( v ) {

	var i = 1; // y >-< z

	while ( i < v.length ) {

		var idx = v[ i + 1 ];
		v[ i + 1 ] = v[ i ];
		v[ i ] = idx;

		i += 3;

	}

	return v;

};

THREE.SEA3D.prototype.flipBoneMatrix = function () {

	var zero = new THREE.Vector3();

	return function ( mtx ) {

		var pos = THREE.SEA3D.VECBUF.setFromMatrixPosition( mtx );
		pos.z = - pos.z;

		mtx.setPosition( zero );
		mtx.multiplyMatrices( THREE.SEA3D.MTXBUF.makeRotationZ( THREE.Math.degToRad( 180 ) ), mtx );
		mtx.setPosition( pos );

		return mtx;

	};

}();

THREE.SEA3D.prototype.flipScaleMatrix = function () {

	var pos = new THREE.Vector3();
	var qua = new THREE.Quaternion();
	var slc = new THREE.Vector3();

	return function ( local, rotate, parent, parentRotate ) {

		if ( parent ) local.multiplyMatrices( parent, local );

		local.decompose( pos, qua, slc );

		slc.z = - slc.z;

		local.compose( pos, qua, slc );

		if ( rotate ) {

			local.multiplyMatrices( local, THREE.SEA3D.MTXBUF.makeRotationZ( THREE.Math.degToRad( 180 ) ) );

		}

		if ( parent ) {

			parent = parent.clone();

			this.flipScaleMatrix( parent, parentRotate );

			local.multiplyMatrices( parent.getInverse( parent ), local );

		}

		return local;

	};

}();

//
//	Legacy
//

THREE.SEA3D.prototype.flipDefaultAnimation = function () {

	var buf1 = new THREE.Matrix4();
	var buf2 = new THREE.Matrix4();

	var pos = new THREE.Vector3();
	var qua = new THREE.Quaternion();
	var slc = new THREE.Vector3();

	var to_pos = new THREE.Vector3();
	var to_qua = new THREE.Quaternion();
	var to_slc = new THREE.Vector3();

	return function ( animation, obj3d, relative ) {

		if ( animation.isFliped ) return;

		var dataList = animation.dataList,
			t_anm = [];

		for ( var i = 0; i < dataList.length; i ++ ) {

			var data = dataList[ i ],
				raw = data.data,
				kind = data.kind,
				numFrames = raw.length / data.blockSize;

			switch ( kind ) {

				case SEA3D.Animation.POSITION:
				case SEA3D.Animation.ROTATION:
				case SEA3D.Animation.SCALE:

					t_anm.push( {
						kind: kind,
						numFrames: numFrames,
						raw: raw
					} );

					break;

			}

		}

		if ( t_anm.length > 0 ) {

			var numFrames = t_anm[ 0 ].numFrames,
				parent = undefined;

			if ( relative ) {

				buf1.identity();
				parent = this.flipScaleMatrix( buf2.copy( obj3d.matrixWorld ) );

			} else {

				if ( obj3d.parent ) {

					parent = this.flipScaleMatrix( buf2.copy( obj3d.parent.matrixWorld ) );

				}

				this.flipScaleMatrix( buf1.copy( obj3d.matrix ), false, parent );

			}

			buf1.decompose( pos, qua, slc );

			for ( var f = 0, t, c; f < numFrames; f ++ ) {

				for ( t = 0; t < t_anm.length; t ++ ) {

					var raw = t_anm[ t ].raw,
						kind = t_anm[ t ].kind;

					switch ( kind ) {

						case SEA3D.Animation.POSITION:

							c = f * 3;

							pos.set(
								raw[ c ],
								raw[ c + 1 ],
								raw[ c + 2 ]
							);

							break;

						case SEA3D.Animation.ROTATION:

							c = f * 4;

							qua.set(
								raw[ c ],
								raw[ c + 1 ],
								raw[ c + 2 ],
								raw[ c + 3 ]
							);

							break;

						case SEA3D.Animation.SCALE:

							c = f * 4;

							slc.set(
								raw[ c ],
								raw[ c + 1 ],
								raw[ c + 2 ]
							);

							break;

					}

				}

				buf1.compose( pos, qua, slc );

				this.flipScaleMatrix( buf1, false, buf2 );

				buf1.decompose( to_pos, to_qua, to_slc );

				for ( t = 0; t < t_anm.length; t ++ ) {

					var raw = t_anm[ t ].raw,
						kind = t_anm[ t ].kind;

					switch ( kind ) {

						case SEA3D.Animation.POSITION:

							c = f * 3;

							raw[ c ] = to_pos.x;
							raw[ c + 1 ] = to_pos.y;
							raw[ c + 2 ] = to_pos.z;

							break;

						case SEA3D.Animation.ROTATION:

							c = f * 4;

							raw[ c ] = to_qua.x;
							raw[ c + 1 ] = to_qua.y;
							raw[ c + 2 ] = to_qua.z;
							raw[ c + 3 ] = to_qua.w;

							break;

						case SEA3D.Animation.SCALE:

							c = f * 3;

							raw[ c ] = to_slc.x;
							raw[ c + 1 ] = to_slc.y;
							raw[ c + 2 ] = to_slc.z;

							break;

					}

				}

			}

		}

		animation.isFliped = true;

	};

}();

THREE.SEA3D.prototype.readAnimation = function ( sea ) {

	if ( ! this.isLegacy( sea ) ) {

		this._readAnimation( sea );

	}

};

THREE.SEA3D.prototype.getAnimationType = function ( req ) {

	var sea = req.sea;

	if ( this.isLegacy( sea ) ) {

		switch ( sea.type ) {

			case SEA3D.SkeletonAnimation.prototype.type:

				this.readSkeletonAnimationLegacy( sea, req.skeleton );

				return sea.tag;

				break;

			case SEA3D.Animation.prototype.type:

				if ( req.scope instanceof THREE.Object3D ) {

					this.flipDefaultAnimation( sea, req.scope, req.relative );

				}

				this._readAnimation( sea );

				return sea.tag;

				break;

		}

	}

	return this._getAnimationType( req );

};

THREE.SEA3D.prototype.updateTransform = function () {

	var buf1 = new THREE.Matrix4();
	var identity = new THREE.Matrix4();

	return function ( obj3d, sea ) {

		if ( this.isLegacy( sea ) ) {

			if ( sea.transform ) buf1.fromArray( sea.transform );
			else buf1.makeTranslation( sea.position.x, sea.position.y, sea.position.z );

			this.flipScaleMatrix(
				buf1, false,
				obj3d.parent ? obj3d.parent.matrixWorld : identity,
				obj3d.parent instanceof THREE.Bone
			);

			obj3d.position.setFromMatrixPosition( buf1 );
			obj3d.scale.setFromMatrixScale( buf1 );

			// ignore rotation scale

			buf1.scale( THREE.SEA3D.VECBUF.set( 1 / obj3d.scale.x, 1 / obj3d.scale.y, 1 / obj3d.scale.z ) );
			obj3d.rotation.setFromRotationMatrix( buf1 );

			obj3d.updateMatrixWorld();

		} else {

			this._updateTransform( obj3d, sea );

		}

	};

}();

THREE.SEA3D.prototype.readSkeleton = function () {

	var mtx_tmp_inv = new THREE.Matrix4(),
		mtx_local = new THREE.Matrix4(),
		mtx_parent = new THREE.Matrix4(),
		pos = new THREE.Vector3(),
		qua = new THREE.Quaternion();

	return function ( sea ) {

		var bones = [],
			isLegacy = sea.sea3d.config.legacy;

		for ( var i = 0; i < sea.joint.length; i ++ ) {

			var bone = sea.joint[ i ];

			// get world inverse matrix

			mtx_tmp_inv.fromArray( bone.inverseBindMatrix );

			// convert to world matrix

			mtx_local.getInverse( mtx_tmp_inv );

			// convert to three.js order

			if ( isLegacy ) this.flipBoneMatrix( mtx_local );

			if ( bone.parentIndex > - 1 ) {

				// to world

				mtx_tmp_inv.fromArray( sea.joint[ bone.parentIndex ].inverseBindMatrix );
				mtx_parent.getInverse( mtx_tmp_inv );

				// convert parent to three.js order

				if ( isLegacy ) this.flipBoneMatrix( mtx_parent );

				// to local

				mtx_parent.getInverse( mtx_parent );

				mtx_local.multiplyMatrices( mtx_parent, mtx_local );

			}

			// apply matrix

			pos.setFromMatrixPosition( mtx_local );
			qua.setFromRotationMatrix( mtx_local );

			bones[ i ] = {
				name: bone.name,
				pos: [ pos.x, pos.y, pos.z ],
				rotq: [ qua.x, qua.y, qua.z, qua.w ],
				parent: bone.parentIndex
			};

		}

		this.domain.bones = this.bones = this.bones || [];
		this.bones.push( this.objects[ sea.name + '.sklq' ] = sea.tag = bones );

		return bones;

	};

}();

THREE.SEA3D.prototype.readSkeletonAnimationLegacy = function () {

	var mtx_tmp_inv = new THREE.Matrix4(),
		mtx_local = new THREE.Matrix4(),
		mtx_global = new THREE.Matrix4(),
		mtx_parent = new THREE.Matrix4();

	return function ( sea, skl ) {

		if ( sea.tag ) return sea.tag;

		var animations = [],
			delta = ( 1000 / sea.frameRate ) / 1000,
			scale = [ 1, 1, 1 ];

		for ( var i = 0; i < sea.sequence.length; i ++ ) {

			var seq = sea.sequence[ i ];

			var start = seq.start;
			var end = start + seq.count;

			var animation = {
				name: seq.name,
				repeat: seq.repeat,
				fps: sea.frameRate,
				JIT: 0,
				length: delta * seq.count,
				hierarchy: []
			};

			var numJoints = sea.numJoints,
				raw = sea.raw;

			for ( var j = 0; j < numJoints; j ++ ) {

				var bone = skl.joint[ j ],
					node = { parent: bone.parentIndex, keys: [] },
					keys = node.keys,
					time = 0;

				for ( var frame = start; frame < end; frame ++ ) {

					var idx = ( frame * numJoints * 7 ) + ( j * 7 );

					mtx_local.makeRotationFromQuaternion( THREE.SEA3D.QUABUF.set( raw[ idx + 3 ], raw[ idx + 4 ], raw[ idx + 5 ], raw[ idx + 6 ] ) );
					mtx_local.setPosition( THREE.SEA3D.VECBUF.set( raw[ idx ], raw[ idx + 1 ], raw[ idx + 2 ] ) );

					if ( bone.parentIndex > - 1 ) {

						// to global

						mtx_tmp_inv.fromArray( skl.joint[ bone.parentIndex ].inverseBindMatrix );

						mtx_parent.getInverse( mtx_tmp_inv );

						mtx_global.multiplyMatrices( mtx_parent, mtx_local );

						// convert to three.js matrix

						this.flipBoneMatrix( mtx_global );

						// flip parent inverse

						this.flipBoneMatrix( mtx_parent );

						// to local

						mtx_parent.getInverse( mtx_parent );

						mtx_local.multiplyMatrices( mtx_parent, mtx_global );

					} else {

						this.flipBoneMatrix( mtx_local );

					}

					var posQ = THREE.SEA3D.VECBUF.setFromMatrixPosition( mtx_local );
					var newQ = THREE.SEA3D.QUABUF.setFromRotationMatrix( mtx_local );

					keys.push( {
						time: time,
						pos: [ posQ.x, posQ.y, posQ.z ],
						rot: [ newQ.x, newQ.y, newQ.z, newQ.w ],
						scl: scale
					} );

					time += delta;

				}

				animation.hierarchy[ j ] = node;

			}

			animations.push( THREE.SEA3D.AnimationClip.fromClip( THREE.AnimationClip.parseAnimation( animation, skl.tag ), seq.repeat ) );

		}

		this.domain.clips = this.clips = this.clips || [];
		this.clips.push( this.objects[ sea.name + '.anm' ] = sea.tag = animations );

	};

}();

THREE.SEA3D.prototype.readVertexAnimation = function ( sea ) {

	if ( this.isLegacy( sea ) ) {

		for ( var i = 0, l = sea.frame.length; i < l; i ++ ) {

			var frame = sea.frame[ i ];

			this.flipVec3( frame.vertex );
			this.flipVec3( frame.normal );

		}

	}

	this._readVertexAnimation( sea );

};

THREE.SEA3D.prototype.readGeometryBuffer = function ( sea ) {

	if ( this.isLegacy( sea ) ) {

		this.flipVec3( sea.vertex, true );
		this.flipVec3( sea.normal, true );

		this.flipIndexes( sea.indexes );

		if ( sea.jointPerVertex > 4 ) this.compressJoints( sea );
		else if ( sea.jointPerVertex < 4 ) this.expandJoints( sea );

	}

	this._readGeometryBuffer( sea );

};

THREE.SEA3D.prototype.readLines = function ( sea ) {

	if ( this.isLegacy( sea ) ) {

		this.flipVec3( sea.vertex );

	}

	this._readLines( sea );

};

THREE.SEA3D.prototype.onHead = function ( args ) {

	if ( args.sign != "S3D" && args.sign != "TJS" ) {

		throw new Error( "Sign '" + args.sign + "' unknown." );

	}

};

THREE.SEA3D.EXTENSIONS_LOADER.push( { setTypeRead: function () {

	// CONFIG

	this.config.legacy = this.config.legacy == undefined ? true : this.config.legacy;

	this.file.typeRead[ SEA3D.Skeleton.prototype.type ] = this.readSkeleton;

} } );

/*global ArrayBuffer, Uint32Array, Int32Array, Float32Array, Int8Array, Uint8Array, window, performance, Console*/

/*
Copyright (c) 2013 Khaled Mammou - Advanced Micro Devices, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var o3dgc = (function () {
    "use strict";
    var module, local;
    module = {};
    local = {};
    local.O3DGC_BINARY_STREAM_BITS_PER_SYMBOL0 = 7;
    local.O3DGC_BINARY_STREAM_MAX_SYMBOL0 = 127; // ((1 << O3DGC_BINARY_STREAM_BITS_PER_SYMBOL0) >>> 0) - 1;
    local.O3DGC_BINARY_STREAM_BITS_PER_SYMBOL1 = 6;
    local.O3DGC_BINARY_STREAM_MAX_SYMBOL1 = 63; // ((1 << O3DGC_BINARY_STREAM_BITS_PER_SYMBOL1) >>> 0) - 1;
    local.O3DGC_BINARY_STREAM_NUM_SYMBOLS_UINT32 = 5; // Math.floor((32 + O3DGC_BINARY_STREAM_BITS_PER_SYMBOL0 - 1) / O3DGC_BINARY_STREAM_BITS_PER_SYMBOL0);
    local.O3DGC_BIG_ENDIAN = 0;
    local.O3DGC_LITTLE_ENDIAN = 1;
    local.O3DGC_MAX_DOUBLE = 1.79769e+308;
    local.O3DGC_MIN_LONG = -2147483647;
    local.O3DGC_MAX_LONG = 2147483647;
    local.O3DGC_MAX_UCHAR8 = 255;
    local.O3DGC_MAX_TFAN_SIZE = 256;
    local.O3DGC_MAX_ULONG = 4294967295;
    local.O3DGC_SC3DMC_START_CODE = 0x00001F1;
    local.O3DGC_DV_START_CODE = 0x00001F2;
    local.O3DGC_SC3DMC_MAX_NUM_FLOAT_ATTRIBUTES = 256;
    local.O3DGC_SC3DMC_MAX_NUM_INT_ATTRIBUTES = 256;
    local.O3DGC_SC3DMC_MAX_DIM_ATTRIBUTES = 32;
    local.O3DGC_SC3DMC_MAX_PREDICTION_NEIGHBORS = 2;
    local.O3DGC_SC3DMC_BINARIZATION_FL = 0; // Fixed Length (not supported)
    local.O3DGC_SC3DMC_BINARIZATION_BP = 1; // BPC (not supported)
    local.O3DGC_SC3DMC_BINARIZATION_FC = 2; // 4 bits Coding (not supported)
    local.O3DGC_SC3DMC_BINARIZATION_AC = 3; // Arithmetic Coding (not supported)
    local.O3DGC_SC3DMC_BINARIZATION_AC_EGC = 4; // Arithmetic Coding & EGCk
    local.O3DGC_SC3DMC_BINARIZATION_ASCII = 5; // Arithmetic Coding & EGCk
    local.O3DGC_STREAM_TYPE_UNKOWN = 0;
    local.O3DGC_STREAM_TYPE_ASCII = 1;
    local.O3DGC_STREAM_TYPE_BINARY = 2;
    local.O3DGC_SC3DMC_NO_PREDICTION = 0; // supported
    local.O3DGC_SC3DMC_DIFFERENTIAL_PREDICTION = 1; // supported
    local.O3DGC_SC3DMC_XOR_PREDICTION = 2; // not supported
    local.O3DGC_SC3DMC_ADAPTIVE_DIFFERENTIAL_PREDICTION = 3; // not supported
    local.O3DGC_SC3DMC_CIRCULAR_DIFFERENTIAL_PREDICTION = 4; // not supported
    local.O3DGC_SC3DMC_PARALLELOGRAM_PREDICTION = 5; // supported
    local.O3DGC_SC3DMC_SURF_NORMALS_PREDICTION = 6; // supported
    local.O3DGC_SC3DMC_ENCODE_MODE_QBCR = 0; // not supported
    local.O3DGC_SC3DMC_ENCODE_MODE_SVA = 1; // not supported
    local.O3DGC_SC3DMC_ENCODE_MODE_TFAN = 2; // supported
    local.O3DGC_DYNAMIC_VECTOR_ENCODE_MODE_LIFT = 0;
    local.O3DGC_MIN_NEIGHBORS_SIZE = 128;
    local.O3DGC_MIN_NUM_NEIGHBORS_SIZE = 16;
    local.O3DGC_TFANS_MIN_SIZE_ALLOCATED_VERTICES_BUFFER = 128;
    local.O3DGC_TFANS_MIN_SIZE_TFAN_SIZE_BUFFER = 8;
    local.O3DGC_DEFAULT_VECTOR_SIZE = 32;

    module.O3DGC_IFS_FLOAT_ATTRIBUTE_TYPE_UNKOWN = 0;
    module.O3DGC_IFS_FLOAT_ATTRIBUTE_TYPE_POSITION = 1;
    module.O3DGC_IFS_FLOAT_ATTRIBUTE_TYPE_NORMAL = 2;
    module.O3DGC_IFS_FLOAT_ATTRIBUTE_TYPE_COLOR = 3;
    module.O3DGC_IFS_FLOAT_ATTRIBUTE_TYPE_TEXCOORD = 4;
    module.O3DGC_IFS_FLOAT_ATTRIBUTE_TYPE_WEIGHT = 5;
    module.O3DGC_IFS_INT_ATTRIBUTE_TYPE_UNKOWN = 0;
    module.O3DGC_IFS_INT_ATTRIBUTE_TYPE_INDEX = 1;
    module.O3DGC_IFS_INT_ATTRIBUTE_TYPE_JOINT_ID = 2;
    module.O3DGC_IFS_INT_ATTRIBUTE_TYPE_INDEX_BUFFER_ID = 3;

    module.O3DGC_OK = 0;
    module.O3DGC_ERROR_BUFFER_FULL = 1;
    module.O3DGC_ERROR_CORRUPTED_STREAM = 5;
    module.O3DGC_ERROR_NON_SUPPORTED_FEATURE = 6;
    module.O3DGC_ERROR_AC = 7;

    function SystemEndianness() {
        var a, b, c;
        b = new ArrayBuffer(4);
        a = new Uint32Array(b);
        c = new Uint8Array(b);
        a[0] = 1;
        if (c[0] === 1) {
            return local.O3DGC_LITTLE_ENDIAN;
        }
        return local.O3DGC_BIG_ENDIAN;
    }
    // SC3DMCStats class
    module.SC3DMCStats = function () {
        this.m_timeCoord = 0;
        this.m_timeNormal = 0;
        this.m_timeCoordIndex = 0;
        this.m_timeFloatAttribute = new Float32Array(local.O3DGC_SC3DMC_MAX_NUM_FLOAT_ATTRIBUTES);
        this.m_timeIntAttribute = new Float32Array(local.O3DGC_SC3DMC_MAX_NUM_INT_ATTRIBUTES);
        this.m_timeReorder = 0;
        this.m_streamSizeCoord = 0;
        this.m_streamSizeNormal = 0;
        this.m_streamSizeCoordIndex = 0;
        this.m_streamSizeFloatAttribute = new Uint32Array(local.O3DGC_SC3DMC_MAX_NUM_FLOAT_ATTRIBUTES);
        this.m_streamSizeIntAttribute = new Uint32Array(local.O3DGC_SC3DMC_MAX_NUM_INT_ATTRIBUTES);
    };
    // SC3DMCTriplet class
    module.SC3DMCTriplet = function (a, b, c) {
        this.m_a = a;
        this.m_b = b;
        this.m_c = c;
    };
    module.SC3DMCTriplet.prototype.Less = function (rhs) {
        var res;
        if (this.m_c !== rhs.m_c) {
            res = (this.m_c < rhs.m_c);
        } else if (this.m_b !== rhs.m_b) {
            res = (this.m_b < rhs.m_b);
        } else {
            res = (this.m_a < rhs.m_a);
        }
        return res;
    };
    module.SC3DMCTriplet.prototype.Equal = function (rhs) {
        return (this.m_c === rhs.m_c && this.m_b === rhs.m_b && this.m_a === rhs.m_a);
    };
    // SC3DMCPredictor class
    module.SC3DMCPredictor = function () {
        this.m_id = new module.SC3DMCTriplet(-1, -1, -1);
        this.m_pred = new Float32Array(local.O3DGC_SC3DMC_MAX_DIM_ATTRIBUTES);
    };
    // fix me: optimize this function (e.g., binary search)
    function InsertPredictor(e, nPred, list, dimFloatArray) {
        var pos, foundOrInserted, j, j1, j0, h, i;
        pos = -1;
        foundOrInserted = false;
        j1 = nPred.m_value;
        j0 = 0;
        for (j = j0; j < j1; ++j) {
            if (e.Equal(list[j].m_id)) {
                foundOrInserted = true;
                break;
            } else if (e.Less(list[j].m_id)) {
                if (nPred.m_value < local.O3DGC_SC3DMC_MAX_PREDICTION_NEIGHBORS) {
                    ++nPred.m_value;
                }
                for (h = nPred.m_value - 1; h > j; --h) {
                    list[h].m_id.m_a = list[h - 1].m_id.m_a;
                    list[h].m_id.m_b = list[h - 1].m_id.m_b;
                    list[h].m_id.m_c = list[h - 1].m_id.m_c;
                    for (i = 0; i < dimFloatArray; ++i) {
                        list[h].m_pred[i] = list[h - 1].m_pred[i];
                    }
                }
                list[j].m_id.m_a = e.m_a;
                list[j].m_id.m_b = e.m_b;
                list[j].m_id.m_c = e.m_c;
                pos = j;
                foundOrInserted = true;
                break;
            }
        }
        if (!foundOrInserted && nPred.m_value < local.O3DGC_SC3DMC_MAX_PREDICTION_NEIGHBORS) {
            pos = nPred.m_value++;
            list[pos].m_id.m_a = e.m_a;
            list[pos].m_id.m_b = e.m_b;
            list[pos].m_id.m_c = e.m_c;
        }
        return pos;
    }
    // Timer class
    if (typeof window.performance === 'undefined') {
        window.performance = {};
    }
    if (!window.performance.now) {
        local.nowOffset = Date.now();
        if (performance.timing && performance.timing.navigationStart) {
            local.nowOffset = performance.timing.navigationStart;
        }
        window.performance.now = function now() {
            return Date.now() - local.nowOffset;
        };
    }
    module.Timer = function () {
        this.m_start = 0;
        this.m_end = 0;
    };
    module.Timer.prototype.Tic = function () {
        this.m_start = window.performance.now();
    };
    module.Timer.prototype.Toc = function () {
        this.m_end = window.performance.now();
    };
    module.Timer.prototype.GetElapsedTime = function () {
        return this.m_end - this.m_start;
    };
    // Vec3 class
    module.Vec3 = function (x, y, z) {
        this.m_x = x;
        this.m_y = y;
        this.m_z = z;
    };
    module.Vec3.prototype.Set = function (x, y, z) {
        this.m_x = x;
        this.m_y = y;
        this.m_z = z;
    };
    module.Vec3.prototype.Sub = function (lhs, rhs) {
        this.m_x = lhs.m_x - rhs.m_x;
        this.m_y = lhs.m_y - rhs.m_y;
        this.m_z = lhs.m_z - rhs.m_z;
    };
    module.Vec3.prototype.Add = function (lhs, rhs) {
        this.m_x = lhs.m_x + rhs.m_x;
        this.m_y = lhs.m_y + rhs.m_y;
        this.m_z = lhs.m_z + rhs.m_z;
    };
    module.Vec3.prototype.SelfAdd = function (v) {
        this.m_x += v.m_x;
        this.m_y += v.m_y;
        this.m_z += v.m_z;
    };
    module.Vec3.prototype.Cross = function (lhs, rhs) {
        this.m_x = lhs.m_y * rhs.m_z - lhs.m_z * rhs.m_y;
        this.m_y = lhs.m_z * rhs.m_x - lhs.m_x * rhs.m_z;
        this.m_z = lhs.m_x * rhs.m_y - lhs.m_y * rhs.m_x;
    };
    module.Vec3.prototype.GetNorm = function () {
        return Math.sqrt(this.m_x * this.m_x + this.m_y * this.m_y + this.m_z * this.m_z);
    };
    function SphereToCube(vin, vout) {
        var ax, ay, az;
        ax = Math.abs(vin.m_x);
        ay = Math.abs(vin.m_y);
        az = Math.abs(vin.m_z);
        if (az >= ax && az >= ay) {
            if (vin.m_z >= 0) {
                vout.m_z = 0;
                vout.m_x = vin.m_x;
                vout.m_y = vin.m_y;
            } else {
                vout.m_z = 1;
                vout.m_x = -vin.m_x;
                vout.m_y = -vin.m_y;
            }
        } else if (ay >= ax && ay >= az) {
            if (vin.m_y >= 0) {
                vout.m_z = 2;
                vout.m_x = vin.m_z;
                vout.m_y = vin.m_x;
            } else {
                vout.m_z = 3;
                vout.m_x = -vin.m_z;
                vout.m_y = -vin.m_x;
            }
        } else {
            if (vin.m_x >= 0) {
                vout.m_z = 4;
                vout.m_x = vin.m_y;
                vout.m_y = vin.m_z;
            } else {
                vout.m_z = 5;
                vout.m_x = -vin.m_y;
                vout.m_y = -vin.m_z;
            }
        }
    }
    local.CubeToSphere = {
        0: function (vin, vout) {
            vout.m_x = vin.m_x;
            vout.m_y = vin.m_y;
            vout.m_z = Math.sqrt(Math.max(0.0, 1.0 - vout.m_x * vout.m_x - vout.m_y * vout.m_y));
        },
        1: function (vin, vout) {
            vout.m_x = -vin.m_x;
            vout.m_y = -vin.m_y;
            vout.m_z = -Math.sqrt(Math.max(0.0, 1.0 - vout.m_x * vout.m_x - vout.m_y * vout.m_y));
        },
        2: function (vin, vout) {
            vout.m_z = vin.m_x;
            vout.m_x = vin.m_y;
            vout.m_y = Math.sqrt(Math.max(0.0, 1.0 - vout.m_x * vout.m_x - vout.m_z * vout.m_z));
        },
        3: function (vin, vout) {
            vout.m_z = -vin.m_x;
            vout.m_x = -vin.m_y;
            vout.m_y = -Math.sqrt(Math.max(0.0, 1.0 - vout.m_x * vout.m_x - vout.m_z * vout.m_z));
        },
        4: function (vin, vout) {
            vout.m_y = vin.m_x;
            vout.m_z = vin.m_y;
            vout.m_x = Math.sqrt(Math.max(0.0, 1.0 - vout.m_y * vout.m_y - vout.m_z * vout.m_z));
        },
        5: function (vin, vout) {
            vout.m_y = -vin.m_x;
            vout.m_z = -vin.m_y;
            vout.m_x = -Math.sqrt(Math.max(0.0, 1.0 - vout.m_y * vout.m_y - vout.m_z * vout.m_z));
        }
    };
    function IntToUInt(value) {
        return (value < 0) ? (-1 - (2 * value)) : (2 * value);
    }
    function UIntToInt(uiValue) {
        return (uiValue & 1) ? -((uiValue + 1) >>> 1) : ((uiValue >>> 1));
    }
    module.Iterator = function () {
        this.m_count = 0;
    };
    module.NumberRef = function () {
        this.m_value = 0;
    };
    // BinaryStream class
    module.BinaryStream = function (buffer) {
        this.m_endianness = SystemEndianness();
        this.m_buffer = buffer;
        this.m_stream = new Uint8Array(this.m_buffer);
        this.m_localBuffer = new ArrayBuffer(4);
        this.m_localBufferViewUChar8 = new Uint8Array(this.m_localBuffer);
        this.m_localBufferViewFloat32 = new Float32Array(this.m_localBuffer);
        this.m_localBufferViewUInt32 = new Uint32Array(this.m_localBuffer);
    };
    module.BinaryStream.prototype.ReadFloat32Bin = function (bsIterator) {
        if (this.m_endianness === local.O3DGC_BIG_ENDIAN) {
            this.m_localBufferViewUChar8[3] = this.m_stream[bsIterator.m_count++];
            this.m_localBufferViewUChar8[2] = this.m_stream[bsIterator.m_count++];
            this.m_localBufferViewUChar8[1] = this.m_stream[bsIterator.m_count++];
            this.m_localBufferViewUChar8[0] = this.m_stream[bsIterator.m_count++];
        } else {
            this.m_localBufferViewUChar8[0] = this.m_stream[bsIterator.m_count++];
            this.m_localBufferViewUChar8[1] = this.m_stream[bsIterator.m_count++];
            this.m_localBufferViewUChar8[2] = this.m_stream[bsIterator.m_count++];
            this.m_localBufferViewUChar8[3] = this.m_stream[bsIterator.m_count++];
        }
        return this.m_localBufferViewFloat32[0];
    };
    module.BinaryStream.prototype.ReadUInt32Bin = function (bsIterator) {
        if (this.m_endianness === local.O3DGC_BIG_ENDIAN) {
            this.m_localBufferViewUChar8[3] = this.m_stream[bsIterator.m_count++];
            this.m_localBufferViewUChar8[2] = this.m_stream[bsIterator.m_count++];
            this.m_localBufferViewUChar8[1] = this.m_stream[bsIterator.m_count++];
            this.m_localBufferViewUChar8[0] = this.m_stream[bsIterator.m_count++];
        } else {
            this.m_localBufferViewUChar8[0] = this.m_stream[bsIterator.m_count++];
            this.m_localBufferViewUChar8[1] = this.m_stream[bsIterator.m_count++];
            this.m_localBufferViewUChar8[2] = this.m_stream[bsIterator.m_count++];
            this.m_localBufferViewUChar8[3] = this.m_stream[bsIterator.m_count++];
        }
        return this.m_localBufferViewUInt32[0];
    };
    module.BinaryStream.prototype.ReadUChar8Bin = function (bsIterator) {
        return this.m_stream[bsIterator.m_count++];
    };
    module.BinaryStream.prototype.ReadUInt32ASCII = function (bsIterator) {
        var value, shift, i;
        value = 0;
        shift = 0;
        for (i = 0; i < local.O3DGC_BINARY_STREAM_NUM_SYMBOLS_UINT32; ++i) {
            value += (this.m_stream[bsIterator.m_count++] << shift) >>> 0;
            shift += local.O3DGC_BINARY_STREAM_BITS_PER_SYMBOL0;
        }
        return value;
    };
    module.BinaryStream.prototype.ReadFloat32ASCII = function (bsIterator) {
        var value = this.ReadUInt32ASCII(bsIterator);
        if (this.m_endianness === local.O3DGC_BIG_ENDIAN) {
            this.m_localBufferViewUChar8[3] = value & local.O3DGC_MAX_UCHAR8;
            value >>>= 8;
            this.m_localBufferViewUChar8[2] = value & local.O3DGC_MAX_UCHAR8;
            value >>>= 8;
            this.m_localBufferViewUChar8[1] = value & local.O3DGC_MAX_UCHAR8;
            value >>>= 8;
            this.m_localBufferViewUChar8[0] = value & local.O3DGC_MAX_UCHAR8;
        } else {
            this.m_localBufferViewUChar8[0] = value & local.O3DGC_MAX_UCHAR8;
            value >>>= 8;
            this.m_localBufferViewUChar8[1] = value & local.O3DGC_MAX_UCHAR8;
            value >>>= 8;
            this.m_localBufferViewUChar8[2] = value & local.O3DGC_MAX_UCHAR8;
            value >>>= 8;
            this.m_localBufferViewUChar8[3] = value & local.O3DGC_MAX_UCHAR8;
        }
        return this.m_localBufferViewFloat32[0];
    };
    module.BinaryStream.prototype.ReadIntASCII = function (bsIterator) {
        return UIntToInt(this.ReadUIntASCII(bsIterator));
    };
    module.BinaryStream.prototype.ReadUIntASCII = function (bsIterator) {
        var i, x, value;
        value = this.m_stream[bsIterator.m_count++];
        if (value === local.O3DGC_BINARY_STREAM_MAX_SYMBOL0) {
            i = 0;
            do {
                x = this.m_stream[bsIterator.m_count++];
                value += ((x >>> 1) << i) >>> 0;
                i += local.O3DGC_BINARY_STREAM_BITS_PER_SYMBOL1;
            } while (x & 1);
        }
        return value;
    };
    module.BinaryStream.prototype.ReadUCharASCII = function (bsIterator) {
        return this.m_stream[bsIterator.m_count++];
    };
    module.BinaryStream.prototype.ReadFloat32 = function (bsIterator, streamType) {
        if (streamType === local.O3DGC_STREAM_TYPE_ASCII) {
            return this.ReadFloat32ASCII(bsIterator);
        }
        return this.ReadFloat32Bin(bsIterator);
    };
    module.BinaryStream.prototype.ReadUInt32 = function (bsIterator, streamType) {
        if (streamType === local.O3DGC_STREAM_TYPE_ASCII) {
            return this.ReadUInt32ASCII(bsIterator);
        }
        return this.ReadUInt32Bin(bsIterator);
    };
    module.BinaryStream.prototype.ReadUChar = function (bsIterator, streamType) {
        if (streamType === local.O3DGC_STREAM_TYPE_ASCII) {
            return this.ReadUCharASCII(bsIterator);
        }
        return this.ReadUChar8Bin(bsIterator);
    };
    module.BinaryStream.prototype.GetBuffer = function (bsIterator, size) {
        return new Uint8Array(this.m_buffer, bsIterator.m_count, size);
    };

    // Copyright (c) 2004 Amir Said (said@ieee.org) & William A. Pearlman (pearlw@ecse.rpi.edu)
    // All rights reserved.

    local.O3DGC_AC_MIN_LENGTH = 0x01000000;   // threshold for renormalization
    local.O3DGC_AC_MAX_LENGTH = 0xFFFFFFFF;      // maximum AC interval length
    local.O3DGC_AC_BM_LENGTH_SHIFT = 13;     // Maximum values for binary models length bits discarded before mult.
    local.O3DGC_AC_BM_MAX_COUNT = (1 << local.O3DGC_AC_BM_LENGTH_SHIFT) >>> 0;  // for adaptive models
    local.O3DGC_AC_DM_LENGTH_SHIFT = 15; // Maximum values for general models length bits discarded before mult.
    local.O3DGC_AC_DM_MAX_COUNT = (1 << local.O3DGC_AC_DM_LENGTH_SHIFT) >>> 0;  // for adaptive models
    // StaticBitModel class 
    module.StaticBitModel = function () {
        this.m_bit0Prob = (1 << (local.O3DGC_AC_BM_LENGTH_SHIFT - 1)) >>> 0; // p0 = 0.5
    };
    module.StaticBitModel.prototype.SetProbability = function (p) {
        this.m_bit0Prob = Math.floor(p * ((1 << local.O3DGC_AC_BM_LENGTH_SHIFT) >>> 0));
    };
    // AdaptiveBitModel class 
    module.AdaptiveBitModel = function () {
        // initialization to equiprobable model
        this.m_updateCycle = 4;
        this.m_bitsUntilUpdate = 4;
        this.m_bit0Prob = (1 << (local.O3DGC_AC_BM_LENGTH_SHIFT - 1)) >>> 0;
        this.m_bit0Count = 1;
        this.m_bitCount = 2;
    };
    module.AdaptiveBitModel.prototype.Reset = function () {
        this.m_updateCycle = 4;
        this.m_bitsUntilUpdate = 4;
        this.m_bit0Prob = (1 << (local.O3DGC_AC_BM_LENGTH_SHIFT - 1)) >>> 0;
        this.m_bit0Count = 1;
        this.m_bitCount = 2;
    };
    module.AdaptiveBitModel.prototype.Update = function () {
        // halve counts when a threshold is reached
        if ((this.m_bitCount += this.m_updateCycle) > local.O3DGC_AC_BM_MAX_COUNT) {
            this.m_bitCount = (this.m_bitCount + 1) >>> 1;
            this.m_bit0Count = (this.m_bit0Count + 1) >>> 1;
            if (this.m_bit0Count === this.m_bitCount) {
                ++this.m_bitCount;
            }
        }
        // compute scaled bit 0 probability
        var scale = Math.floor(0x80000000 / this.m_bitCount);
        this.m_bit0Prob = (this.m_bit0Count * scale) >>> (31 - local.O3DGC_AC_BM_LENGTH_SHIFT);
        // set frequency of model updates
        this.m_updateCycle = (5 * this.m_updateCycle) >>> 2;
        if (this.m_updateCycle > 64) {
            this.m_updateCycle = 64;
        }
        this.m_bitsUntilUpdate = this.m_updateCycle;
    };
    // AdaptiveDataModel class 
    module.AdaptiveDataModel = function () {
        this.m_buffer = {};
        this.m_distribution = {};
        this.m_symbolCount = {};
        this.m_decoderTable = {};
        this.m_totalCount = 0;
        this.m_updateCycle = 0;
        this.m_symbolsUntilUpdate = 0;
        this.m_dataSymbols = 0;
        this.m_lastSymbol = 0;
        this.m_tableSize = 0;
        this.m_tableShift = 0;
    };
    module.AdaptiveDataModel.prototype.Update = function () {
        var n, sum, s, scale, k, max_cycle, w;
        // halve counts when a threshold is reached
        if ((this.m_totalCount += this.m_updateCycle) > local.O3DGC_AC_DM_MAX_COUNT) {
            this.m_totalCount = 0;
            for (n = 0; n < this.m_dataSymbols; ++n) {
                this.m_totalCount += (this.m_symbolCount[n] = (this.m_symbolCount[n] + 1) >>> 1);
            }
        }
        // compute cumulative distribution, decoder table
        sum = 0;
        s = 0;
        scale = Math.floor(0x80000000 / this.m_totalCount);
        if (this.m_tableSize === 0) {
            for (k = 0; k < this.m_dataSymbols; ++k) {
                this.m_distribution[k] = (scale * sum) >>> (31 - local.O3DGC_AC_DM_LENGTH_SHIFT);
                sum += this.m_symbolCount[k];
            }
        } else {
            for (k = 0; k < this.m_dataSymbols; ++k) {
                this.m_distribution[k] = (scale * sum) >>> (31 - local.O3DGC_AC_DM_LENGTH_SHIFT);
                sum += this.m_symbolCount[k];
                w = this.m_distribution[k] >>> this.m_tableShift;
                while (s < w) {
                    this.m_decoderTable[++s] = k - 1;
                }
            }
            this.m_decoderTable[0] = 0;
            while (s <= this.m_tableSize) {
                this.m_decoderTable[++s] = this.m_dataSymbols - 1;
            }
        }
        // set frequency of model updates
        this.m_updateCycle = (5 * this.m_updateCycle) >>> 2;
        max_cycle = ((this.m_dataSymbols + 6) << 3) >>> 0;
        if (this.m_updateCycle > max_cycle) {
            this.m_updateCycle = max_cycle;
        }
        this.m_symbolsUntilUpdate = this.m_updateCycle;
    };
    module.AdaptiveDataModel.prototype.Reset = function () {
        var k;
        if (this.m_dataSymbols === 0) {
            return;
        }
        // restore probability estimates to uniform distribution
        this.m_totalCount = 0;
        this.m_updateCycle = this.m_dataSymbols;
        for (k = 0; k < this.m_dataSymbols; ++k) {
            this.m_symbolCount[k] = 1;
        }
        this.Update();
        this.m_symbolsUntilUpdate = this.m_updateCycle = (this.m_dataSymbols + 6) >>> 1;
    };
    module.AdaptiveDataModel.prototype.SetAlphabet = function (number_of_symbols) {
        if ((number_of_symbols < 2) || (number_of_symbols > (1 << 11))) {
            Console.log("invalid number of data symbols");
            return module.O3DGC_ERROR_AC;
        }
        if (this.m_dataSymbols !== number_of_symbols) { // assign memory for data model
            this.m_dataSymbols = number_of_symbols;
            this.m_lastSymbol = this.m_dataSymbols - 1;
            // define size of table for fast decoding
            if (this.m_dataSymbols > 16) {
                var table_bits = 3;
                while (this.m_dataSymbols > ((1 << (table_bits + 2)) >>> 0)) {
                    ++table_bits;
                }
                this.m_tableSize = (1 << table_bits) >>> 0;
                this.m_tableShift = local.O3DGC_AC_DM_LENGTH_SHIFT - table_bits;
                this.m_buffer = new ArrayBuffer(4 * (2 * this.m_dataSymbols + this.m_tableSize + 2));
                this.m_distribution = new Uint32Array(this.m_buffer, 0, this.m_dataSymbols);
                this.m_symbolCount = new Uint32Array(this.m_buffer, 4 * this.m_dataSymbols, this.m_dataSymbols);
                this.m_decoderTable = new Uint32Array(this.m_buffer, 8 * this.m_dataSymbols, this.m_tableSize + 2);
            } else {// small alphabet: no table needed
                this.m_tableSize = this.m_tableShift = 0;
                this.m_buffer = new ArrayBuffer(4 * 2 * this.m_dataSymbols);
                this.m_distribution = new Uint32Array(this.m_buffer, 0, this.m_dataSymbols);
                this.m_symbolCount = new Uint32Array(this.m_buffer, 4 * this.m_dataSymbols, this.m_dataSymbols);
                this.m_decoderTable = {};
            }
        }
        this.Reset(); // initialize model
        return module.O3DGC_OK;
    };
    // ArithmeticDecoder class
    module.ArithmeticDecoder = function () {
        this.m_codeBuffer = {};
        this.m_acShift = 0;
        this.m_base = 0;
        this.m_value = 0;
        this.m_length = 0; // arithmetic coding state
        this.m_bufferSize = 0;
        this.m_mode = 0; // mode: 0 = undef, 1 = encoder, 2 = decoder
    };
    module.ArithmeticDecoder.prototype.SetBuffer = function (max_code_bytes, user_buffer) {
        if (max_code_bytes === 0) {
            Console.log("invalid codec buffer size");
            return module.O3DGC_ERROR_AC;
        }
        if (this.m_mode !== 0) {
            Console.log("cannot set buffer while encoding or decoding");
            return module.O3DGC_ERROR_AC;
        }
        this.m_bufferSize = max_code_bytes;
        this.m_codeBuffer = user_buffer;
    };
    module.ArithmeticDecoder.prototype.StartDecoder = function () {
        if (this.m_mode !== 0) {
            Console.log("cannot start decoder");
            return module.O3DGC_ERROR_AC;
        }
        if (this.m_bufferSize === 0) {
            Console.log("no code buffer set");
            return module.O3DGC_ERROR_AC;
        }
        // initialize decoder: interval, pointer, initial code value
        this.m_mode = 2;
        this.m_length = local.O3DGC_AC_MAX_LENGTH;
        this.m_acShift = 3;
        this.m_value = ((this.m_codeBuffer[0] << 24) | (this.m_codeBuffer[1] << 16) | (this.m_codeBuffer[2] << 8) | (this.m_codeBuffer[3])) >>> 0;
    };
    module.ArithmeticDecoder.prototype.StopDecoder = function () {
        if (this.m_mode !== 2) {
            Console.log("invalid to stop decoder");
            return module.O3DGC_ERROR_AC;
        }
        this.m_mode = 0;
    };
    module.ArithmeticDecoder.prototype.GetBit = function () {
        this.m_length >>>= 1; // halve interval
        var bit = (this.m_value >= this.m_length); // decode bit
        if (bit) {
            this.m_value -= this.m_length; // move base
        }
        if (this.m_length < local.O3DGC_AC_MIN_LENGTH) {
            this.RenormDecInterval(); // renormalization
        }
        return bit;
    };
    module.ArithmeticDecoder.prototype.GetBits = function (bits) {
        var s = Math.floor(this.m_value / (this.m_length >>>= bits)); // decode symbol, change length
        this.m_value -= this.m_length * s; // update interval
        if (this.m_length < local.O3DGC_AC_MIN_LENGTH) {
            this.RenormDecInterval(); // renormalization
        }
        return s;
    };
    module.ArithmeticDecoder.prototype.DecodeStaticBitModel = function (M) {
        var x, bit;
        x = M.m_bit0Prob * (this.m_length >>> local.O3DGC_AC_BM_LENGTH_SHIFT); // product l x p0
        bit = (this.m_value >= x); // decision
        // update & shift interval
        if (!bit) {
            this.m_length = x;
        } else {
            this.m_value -= x; // shifted interval base = 0
            this.m_length -= x;
        }
        if (this.m_length < local.O3DGC_AC_MIN_LENGTH) {
            this.RenormDecInterval(); // renormalization
        }
        return bit; // return data bit value
    };
    module.ArithmeticDecoder.prototype.DecodeAdaptiveBitModel = function (M) {
        var x, bit;
        x = M.m_bit0Prob * (this.m_length >>> local.O3DGC_AC_BM_LENGTH_SHIFT);   // product l x p0
        bit = (this.m_value >= x); // decision
        // update interval
        if (!bit) {
            this.m_length = x;
            ++M.m_bit0Count;
        } else {
            this.m_value -= x;
            this.m_length -= x;
        }
        if (this.m_length < local.O3DGC_AC_MIN_LENGTH) {
            this.RenormDecInterval(); // renormalization
        }
        if (--M.m_bitsUntilUpdate === 0) {
            M.Update(); // periodic model update
        }
        return bit; // return data bit value
    };
    module.ArithmeticDecoder.prototype.DecodeAdaptiveDataModel = function (M) {
        var n, s, x, y, t, dv, z, m;
        y = this.m_length;
        if (M.m_tableSize > 0) { // use table look-up for faster decoding
            dv = Math.floor(this.m_value / (this.m_length >>>= local.O3DGC_AC_DM_LENGTH_SHIFT));
            t = dv >>> M.m_tableShift;
            s = M.m_decoderTable[t];         // initial decision based on table look-up
            n = M.m_decoderTable[t + 1] + 1;
            while (n > s + 1) { // finish with bisection search
                m = (s + n) >>> 1;
                if (M.m_distribution[m] > dv) {
                    n = m;
                } else {
                    s = m;
                }
            }
            // compute products
            x = M.m_distribution[s] * this.m_length;
            if (s !== M.m_lastSymbol) {
                y = M.m_distribution[s + 1] * this.m_length;
            }
        } else { // decode using only multiplications
            x = s = 0;
            this.m_length >>>= local.O3DGC_AC_DM_LENGTH_SHIFT;
            m = (n = M.m_dataSymbols) >>> 1;
            // decode via bisection search
            do {
                z = this.m_length * M.m_distribution[m];
                if (z > this.m_value) {
                    n = m;
                    y = z; // value is smaller
                } else {
                    s = m;
                    x = z; // value is larger or equal
                }
            } while ((m = (s + n) >>> 1) !== s);
        }
        this.m_value -= x; // update interval
        this.m_length = y - x;
        if (this.m_length < local.O3DGC_AC_MIN_LENGTH) {
            this.RenormDecInterval(); // renormalization
        }
        ++M.m_symbolCount[s];
        if (--M.m_symbolsUntilUpdate === 0) {
            M.Update(false); // periodic model update
        }
        return s;
    };
    module.ArithmeticDecoder.prototype.ExpGolombDecode = function (k, bModel0, bModel1) {
        var symbol, binary_symbol, l;
        symbol = 0;
        binary_symbol = 0;
        do {
            l = this.DecodeAdaptiveBitModel(bModel1);
            if (l) {
                symbol += (1 << k) >>> 0;
                k++;
            }
        } while (l);
        while (k--) { //next binary part
            if (this.DecodeStaticBitModel(bModel0)) {
                binary_symbol = (binary_symbol | (1 << k)) >>> 0;
            }
        }
        return (symbol + binary_symbol);
    };
    module.ArithmeticDecoder.prototype.RenormDecInterval = function () {
        do { // read least-significant byte
            this.m_value = ((this.m_value << 8) | this.m_codeBuffer[++this.m_acShift]) >>> 0;
            this.m_length = (this.m_length << 8) >>> 0;
        } while (this.m_length < local.O3DGC_AC_MIN_LENGTH); // length multiplied by 256
    };
    module.ArithmeticDecoder.prototype.DecodeIntACEGC = function (mModelValues, bModel0, bModel1, exp_k, M) {
        var uiValue = this.DecodeAdaptiveDataModel(mModelValues);
        if (uiValue === M) {
            uiValue += this.ExpGolombDecode(exp_k, bModel0, bModel1);
        }
        return UIntToInt(uiValue);
    };
    module.ArithmeticDecoder.prototype.DecodeUIntACEGC = function (mModelValues, bModel0, bModel1, exp_k, M) {
        var uiValue = this.DecodeAdaptiveDataModel(mModelValues);
        if (uiValue === M) {
            uiValue += this.ExpGolombDecode(exp_k, bModel0, bModel1);
        }
        return uiValue;
    };

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -    
    // FIFO class
    module.FIFO = function () {
        this.m_data = {};
        this.m_allocated = 0;
        this.m_size = 0;
        this.m_start = 0;
        this.m_end = 0;
    };
    module.FIFO.prototype.Clear = function () {
        this.m_start = this.m_end = this.m_size = 0;
    };
    module.FIFO.prototype.GetAllocatedSize = function () {
        return this.m_allocated;
    };
    module.FIFO.prototype.GetSize = function () {
        return this.m_size;
    };
    module.FIFO.prototype.Allocate = function (size) {
        if (size > this.m_allocated) {
            this.m_allocated = size;
            this.m_data = new Int32Array(this.m_allocated);
        }
        this.Clear();
        return module.O3DGC_OK;
    };
    module.FIFO.prototype.PopFirst = function () {
        --this.m_size;
        var current = this.m_start++;
        if (this.m_start === this.m_allocated) {
            this.m_end = 0;
        }
        return this.m_data[current];
    };
    module.FIFO.prototype.PushBack = function (value) {
        --this.m_size;
        this.m_data[this.m_end] = value;
        ++this.m_size;
        ++this.m_end;
        if (this.m_end === this.m_allocated) {
            this.m_end = 0;
        }
    };
    // IndexedFaceSet class
    module.IndexedFaceSet = function () {
        this.m_nCoordIndex = 0;
        this.m_nCoord = 0;
        this.m_nNormal = 0;
        this.m_numFloatAttributes = 0;
        this.m_numIntAttributes = 0;
        this.m_creaseAngle = 30.0;
        this.m_ccw = true;
        this.m_solid = true;
        this.m_convex = true;
        this.m_isTriangularMesh = true;
        this.m_coordMin = new Float32Array(3);
        this.m_coordMax = new Float32Array(3);
        this.m_normalMin = new Float32Array(3);
        this.m_normalMax = new Float32Array(3);
        this.m_nFloatAttribute = new Uint32Array(local.O3DGC_SC3DMC_MAX_NUM_FLOAT_ATTRIBUTES);
        this.m_nIntAttribute = new Uint32Array(local.O3DGC_SC3DMC_MAX_NUM_INT_ATTRIBUTES);
        this.m_dimFloatAttribute = new Uint32Array(local.O3DGC_SC3DMC_MAX_NUM_FLOAT_ATTRIBUTES);
        this.m_dimIntAttribute = new Uint32Array(local.O3DGC_SC3DMC_MAX_NUM_INT_ATTRIBUTES);
        this.m_typeFloatAttribute = new Uint32Array(local.O3DGC_SC3DMC_MAX_NUM_FLOAT_ATTRIBUTES);
        this.m_typeIntAttribute = new Uint32Array(local.O3DGC_SC3DMC_MAX_NUM_INT_ATTRIBUTES);
        this.m_minFloatAttributeBuffer = new ArrayBuffer(4 * local.O3DGC_SC3DMC_MAX_NUM_FLOAT_ATTRIBUTES * local.O3DGC_SC3DMC_MAX_DIM_ATTRIBUTES);
        this.m_minFloatAttribute = new Float32Array(this.m_minFloatAttributeBuffer);
        this.m_maxFloatAttributeBuffer = new ArrayBuffer(4 * local.O3DGC_SC3DMC_MAX_NUM_FLOAT_ATTRIBUTES * local.O3DGC_SC3DMC_MAX_DIM_ATTRIBUTES);
        this.m_maxFloatAttribute = new Float32Array(this.m_maxFloatAttributeBuffer);
        this.m_coordIndex = {};
        this.m_coord = {};
        this.m_normal = {};
        this.m_floatAttribute = [];
        this.m_intAttribute = [];
    };
    module.IndexedFaceSet.prototype.GetNCoordIndex = function () {
        return this.m_nCoordIndex;
    };
    module.IndexedFaceSet.prototype.GetNCoordIndex = function () {
        return this.m_nCoordIndex;
    };
    module.IndexedFaceSet.prototype.GetNCoord = function () {
        return this.m_nCoord;
    };
    module.IndexedFaceSet.prototype.GetNNormal = function () {
        return this.m_nNormal;
    };
    module.IndexedFaceSet.prototype.GetNFloatAttribute = function (a) {
        return this.m_nFloatAttribute[a];
    };
    module.IndexedFaceSet.prototype.GetNIntAttribute = function (a) {
        return this.m_nIntAttribute[a];
    };
    module.IndexedFaceSet.prototype.GetNumFloatAttributes = function () {
        return this.m_numFloatAttributes;
    };
    module.IndexedFaceSet.prototype.GetNumIntAttributes = function () {
        return this.m_numIntAttributes;
    };
    module.IndexedFaceSet.prototype.GetCoordMinArray = function () {
        return this.m_coordMin;
    };
    module.IndexedFaceSet.prototype.GetCoordMaxArray = function () {
        return this.m_coordMax;
    };
    module.IndexedFaceSet.prototype.GetNormalMinArray = function () {
        return this.m_normalMin;
    };
    module.IndexedFaceSet.prototype.GetNormalMaxArray = function () {
        return this.m_normalMax;
    };
    module.IndexedFaceSet.prototype.GetFloatAttributeMinArray = function (a) {
        return (new Float32Array(this.m_minFloatAttributeBuffer, a * local.O3DGC_SC3DMC_MAX_DIM_ATTRIBUTES * 4, this.GetFloatAttributeDim(a)));
    };
    module.IndexedFaceSet.prototype.GetFloatAttributeMaxArray = function (a) {
        return (new Float32Array(this.m_maxFloatAttributeBuffer, a * local.O3DGC_SC3DMC_MAX_DIM_ATTRIBUTES * 4, this.GetFloatAttributeDim(a)));
    };
    module.IndexedFaceSet.prototype.GetFloatAttributeDim = function (a) {
        return this.m_dimFloatAttribute[a];
    };
    module.IndexedFaceSet.prototype.GetIntAttributeDim = function (a) {
        return this.m_dimIntAttribute[a];
    };
    module.IndexedFaceSet.prototype.GetFloatAttributeType = function (a) {
        return this.m_typeFloatAttribute[a];
    };
    module.IndexedFaceSet.prototype.GetIntAttributeType = function (a) {
        return this.m_typeIntAttribute[a];
    };
    module.IndexedFaceSet.prototype.GetFloatAttributeMax = function (a, dim) {
        return this.m_maxFloatAttribute[a * local.O3DGC_SC3DMC_MAX_DIM_ATTRIBUTES + dim];
    };
    module.IndexedFaceSet.prototype.GetCreaseAngle = function () {
        return this.m_creaseAngle;
    };
    module.IndexedFaceSet.prototype.GetCreaseAngle = function () {
        return this.m_creaseAngle;
    };
    module.IndexedFaceSet.prototype.GetCCW = function () {
        return this.m_ccw;
    };
    module.IndexedFaceSet.prototype.GetSolid = function () {
        return this.m_solid;
    };
    module.IndexedFaceSet.prototype.GetConvex = function () {
        return this.m_convex;
    };
    module.IndexedFaceSet.prototype.GetIsTriangularMesh = function () {
        return this.m_isTriangularMesh;
    };
    module.IndexedFaceSet.prototype.GetCoordIndex = function () {
        return this.m_coordIndex;
    };
    module.IndexedFaceSet.prototype.GetCoordIndex = function () {
        return this.m_coordIndex;
    };
    module.IndexedFaceSet.prototype.GetCoord = function () {
        return this.m_coord;
    };
    module.IndexedFaceSet.prototype.GetNormal = function () {
        return this.m_normal;
    };
    module.IndexedFaceSet.prototype.GetFloatAttribute = function (a) {
        return this.m_floatAttribute[a];
    };
    module.IndexedFaceSet.prototype.GetIntAttribute = function (a) {
        return this.m_intAttribute[a];
    };
    module.IndexedFaceSet.prototype.SetNCoordIndex = function (nCoordIndex) {
        this.m_nCoordIndex = nCoordIndex;
    };
    module.IndexedFaceSet.prototype.SetNNormalIndex = function (nNormalIndex) {
    };
    module.IndexedFaceSet.prototype.SetNormalPerVertex = function (perVertex) {
    };
    module.IndexedFaceSet.prototype.SetNFloatAttributeIndex = function (nFloatAttributeIndex) {
    };
    module.IndexedFaceSet.prototype.SetNIntAttributeIndex = function (nIntAttributeIndex) {
    };
    module.IndexedFaceSet.prototype.SetFloatAttributePerVertex = function (perVertex) {
    };
    module.IndexedFaceSet.prototype.SetIntAttributePerVertex = function (perVertex) {
    };
    module.IndexedFaceSet.prototype.SetNCoord = function (nCoord) {
        this.m_nCoord = nCoord;
    };
    module.IndexedFaceSet.prototype.SetNNormal = function (nNormal) {
        this.m_nNormal = nNormal;
    };
    module.IndexedFaceSet.prototype.SetNumFloatAttributes = function (numFloatAttributes) {
        this.m_numFloatAttributes = numFloatAttributes;
    };
    module.IndexedFaceSet.prototype.SetNumIntAttributes = function (numIntAttributes) {
        this.m_numIntAttributes = numIntAttributes;
    };
    module.IndexedFaceSet.prototype.SetCreaseAngle = function (creaseAngle) {
        this.m_creaseAngle = creaseAngle;
    };
    module.IndexedFaceSet.prototype.SetCCW = function (ccw) {
        this.m_ccw = ccw;
    };
    module.IndexedFaceSet.prototype.SetSolid = function (solid) {
        this.m_solid = solid;
    };
    module.IndexedFaceSet.prototype.SetConvex = function (convex) {
        this.m_convex = convex;
    };
    module.IndexedFaceSet.prototype.SetIsTriangularMesh = function (isTriangularMesh) {
        this.m_isTriangularMesh = isTriangularMesh;
    };
    module.IndexedFaceSet.prototype.SetCoordMin = function (j, min) {
        this.m_coordMin[j] = min;
    };
    module.IndexedFaceSet.prototype.SetCoordMax = function (j, max) {
        this.m_coordMax[j] = max;
    };
    module.IndexedFaceSet.prototype.SetNormalMin = function (j, min) {
        this.m_normalMin[j] = min;
    };
    module.IndexedFaceSet.prototype.SetNormalMax = function (j, max) {
        this.m_normalMax[j] = max;
    };
    module.IndexedFaceSet.prototype.SetNFloatAttribute = function (a, nFloatAttribute) {
        this.m_nFloatAttribute[a] = nFloatAttribute;
    };
    module.IndexedFaceSet.prototype.SetNIntAttribute = function (a, nIntAttribute) {
        this.m_nIntAttribute[a] = nIntAttribute;
    };
    module.IndexedFaceSet.prototype.SetFloatAttributeDim = function (a, d) {
        this.m_dimFloatAttribute[a] = d;
    };
    module.IndexedFaceSet.prototype.SetIntAttributeDim = function (a, d) {
        this.m_dimIntAttribute[a] = d;
    };
    module.IndexedFaceSet.prototype.SetFloatAttributeType = function (a, d) {
        this.m_typeFloatAttribute[a] = d;
    };
    module.IndexedFaceSet.prototype.SetIntAttributeType = function (a, d) {
        this.m_typeIntAttribute[a] = d;
    };
    module.IndexedFaceSet.prototype.SetFloatAttributeMin = function (a, dim, min) {
        this.m_minFloatAttribute[a * local.O3DGC_SC3DMC_MAX_DIM_ATTRIBUTES + dim] = min;
    };
    module.IndexedFaceSet.prototype.SetFloatAttributeMax = function (a, dim, max) {
        this.m_maxFloatAttribute[a * local.O3DGC_SC3DMC_MAX_DIM_ATTRIBUTES + dim] = max;
    };
    module.IndexedFaceSet.prototype.SetCoordIndex = function (coordIndex) {
        this.m_coordIndex = coordIndex;
    };
    module.IndexedFaceSet.prototype.SetCoord = function (coord) {
        this.m_coord = coord;
    };
    module.IndexedFaceSet.prototype.SetNormal = function (normal) {
        this.m_normal = normal;
    };
    module.IndexedFaceSet.prototype.SetFloatAttribute = function (a, floatAttribute) {
        this.m_floatAttribute[a] = floatAttribute;
    };
    module.IndexedFaceSet.prototype.SetIntAttribute = function (a, intAttribute) {
        this.m_intAttribute[a] = intAttribute;
    };

    // SC3DMCEncodeParams class
    module.SC3DMCEncodeParams = function () {
        var a;
        this.m_numFloatAttributes = 0;
        this.m_numIntAttributes = 0;
        this.m_floatAttributeQuantBits = new Uint32Array(local.O3DGC_SC3DMC_MAX_NUM_FLOAT_ATTRIBUTES);
        this.m_floatAttributePredMode = new Uint32Array(local.O3DGC_SC3DMC_MAX_NUM_FLOAT_ATTRIBUTES);
        this.m_intAttributePredMode = new Uint32Array(local.O3DGC_SC3DMC_MAX_NUM_INT_ATTRIBUTES);
        this.m_encodeMode = local.O3DGC_SC3DMC_ENCODE_MODE_TFAN;
        this.m_streamTypeMode = local.O3DGC_STREAM_TYPE_ASCII;
        this.m_coordQuantBits = 14;
        this.m_normalQuantBits = 8;
        this.m_coordPredMode = local.O3DGC_SC3DMC_PARALLELOGRAM_PREDICTION;
        this.m_normalPredMode = local.O3DGC_SC3DMC_SURF_NORMALS_PREDICTION;
        for (a = 0; a < local.O3DGC_SC3DMC_MAX_NUM_FLOAT_ATTRIBUTES; ++a) {
            this.m_floatAttributePredMode[a] = local.O3DGC_SC3DMC_PARALLELOGRAM_PREDICTION;
        }
        for (a = 0; a < local.O3DGC_SC3DMC_MAX_NUM_INT_ATTRIBUTES; ++a) {
            this.m_intAttributePredMode[a] = local.O3DGC_SC3DMC_DIFFERENTIAL_PREDICTION;
        }
    };
    module.SC3DMCEncodeParams.prototype.GetStreamType = function () {
        return this.m_streamTypeMode;
    };
    module.SC3DMCEncodeParams.prototype.GetEncodeMode = function () {
        return this.m_encodeMode;
    };
    module.SC3DMCEncodeParams.prototype.GetNumFloatAttributes = function () {
        return this.m_numFloatAttributes;
    };
    module.SC3DMCEncodeParams.prototype.GetNumIntAttributes = function () {
        return this.m_numIntAttributes;
    };
    module.SC3DMCEncodeParams.prototype.GetCoordQuantBits = function () {
        return this.m_coordQuantBits;
    };
    module.SC3DMCEncodeParams.prototype.GetNormalQuantBits = function () {
        return this.m_normalQuantBits;
    };
    module.SC3DMCEncodeParams.prototype.GetFloatAttributeQuantBits = function (a) {
        return this.m_floatAttributeQuantBits[a];
    };
    module.SC3DMCEncodeParams.prototype.GetCoordPredMode = function () {
        return this.m_coordPredMode;
    };
    module.SC3DMCEncodeParams.prototype.GetNormalPredMode = function () {
        return this.m_normalPredMode;
    };
    module.SC3DMCEncodeParams.prototype.GetFloatAttributePredMode = function (a) {
        return this.m_floatAttributePredMode[a];
    };
    module.SC3DMCEncodeParams.prototype.GetIntAttributePredMode = function (a) {
        return this.m_intAttributePredMode[a];
    };
    module.SC3DMCEncodeParams.prototype.GetCoordPredMode = function () {
        return this.m_coordPredMode;
    };
    module.SC3DMCEncodeParams.prototype.GetNormalPredMode = function () {
        return this.m_normalPredMode;
    };
    module.SC3DMCEncodeParams.prototype.GetFloatAttributePredMode = function (a) {
        return this.m_floatAttributePredMode[a];
    };
    module.SC3DMCEncodeParams.prototype.GetIntAttributePredMode = function (a) {
        return this.m_intAttributePredMode[a];
    };
    module.SC3DMCEncodeParams.prototype.SetStreamType = function (streamTypeMode) {
        this.m_streamTypeMode = streamTypeMode;
    };
    module.SC3DMCEncodeParams.prototype.SetEncodeMode = function (encodeMode) {
        this.m_encodeMode = encodeMode;
    };
    module.SC3DMCEncodeParams.prototype.SetNumFloatAttributes = function (numFloatAttributes) {
        this.m_numFloatAttributes = numFloatAttributes;
    };
    module.SC3DMCEncodeParams.prototype.SetNumIntAttributes = function (numIntAttributes) {
        this.m_numIntAttributes = numIntAttributes;
    };
    module.SC3DMCEncodeParams.prototype.SetCoordQuantBits = function (coordQuantBits) {
        this.m_coordQuantBits = coordQuantBits;
    };
    module.SC3DMCEncodeParams.prototype.SetNormalQuantBits = function (normalQuantBits) {
        this.m_normalQuantBits = normalQuantBits;
    };
    module.SC3DMCEncodeParams.prototype.SetFloatAttributeQuantBits = function (a, q) {
        this.m_floatAttributeQuantBits[a] = q;
    };
    module.SC3DMCEncodeParams.prototype.SetCoordPredMode = function (coordPredMode) {
        this.m_coordPredMode = coordPredMode;
    };
    module.SC3DMCEncodeParams.prototype.SetNormalPredMode = function (normalPredMode) {
        this.m_normalPredMode = normalPredMode;
    };
    module.SC3DMCEncodeParams.prototype.SetFloatAttributePredMode = function (a, p) {
        this.m_floatAttributePredMode[a] = p;
    };
    module.SC3DMCEncodeParams.prototype.SetIntAttributePredMode = function (a, p) {
        this.m_intAttributePredMode[a] = p;
    };
    // AdjacencyInfo class
    module.AdjacencyInfo = function () {
        this.m_neighborsSize = 0;    // actual allocated size for m_neighbors
        this.m_numNeighborsSize = 0; // actual allocated size for m_numNeighbors
        this.m_numElements = 0;      // number of elements 
        this.m_neighbors = {};
        this.m_numNeighbors = {};
    };
    module.AdjacencyInfo.prototype.Allocate = function (numNeighborsSize, neighborsSize) {
        this.m_numElements = numNeighborsSize;
        if (neighborsSize > this.m_neighborsSize) {
            this.m_neighborsSize = neighborsSize;
            this.m_neighbors = new Int32Array(this.m_neighborsSize);
        }
        if (numNeighborsSize > this.m_numNeighborsSize) {
            this.m_numNeighborsSize = numNeighborsSize;
            this.m_numNeighbors = new Int32Array(this.m_numNeighborsSize);
        }
        return module.O3DGC_OK;
    };
    module.AdjacencyInfo.prototype.AllocateNumNeighborsArray = function (numElements) {
        if (numElements > this.m_numNeighborsSize) {
            this.m_numNeighborsSize = numElements;
            this.m_numNeighbors = new Int32Array(this.m_numNeighborsSize);
        }
        this.m_numElements = numElements;
        return module.O3DGC_OK;
    };
    module.AdjacencyInfo.prototype.AllocateNeighborsArray = function () {
        var i;
        for (i = 1; i < this.m_numElements; ++i) {
            this.m_numNeighbors[i] += this.m_numNeighbors[i - 1];
        }
        if (this.m_numNeighbors[this.m_numElements - 1] > this.m_neighborsSize) {
            this.m_neighborsSize = this.m_numNeighbors[this.m_numElements - 1];
            this.m_neighbors = new Int32Array(this.m_neighborsSize);
        }
        return module.O3DGC_OK;
    };
    module.AdjacencyInfo.prototype.ClearNumNeighborsArray = function () {
        var i;
        for (i = 0; i < this.m_numElements; ++i) {
            this.m_numNeighbors[i] = 0;
        }
        return module.O3DGC_OK;
    };
    module.AdjacencyInfo.prototype.ClearNeighborsArray = function () {
        var i;
        for (i = 0; i < this.m_neighborsSize; ++i) {
            this.m_neighbors[i] = -1;
        }
        return module.O3DGC_OK;
    };
    module.AdjacencyInfo.prototype.Begin = function (element) {
        return (element > 0) ? this.m_numNeighbors[element - 1] : 0;
    };
    module.AdjacencyInfo.prototype.End = function (element) {
        return this.m_numNeighbors[element];
    };
    module.AdjacencyInfo.prototype.AddNeighbor = function (element, neighbor) {
        var p, p0, p1;
        p0 = this.Begin(element);
        p1 = this.End(element);
        for (p = p0; p < p1; ++p) {
            if (this.m_neighbors[p] === -1) {
                this.m_neighbors[p] = neighbor;
                return module.O3DGC_OK;
            }
        }
        return module.O3DGC_ERROR_BUFFER_FULL;
    };
    module.AdjacencyInfo.prototype.GetNeighbor = function (element) {
        return this.m_neighbors[element];
    };
    module.AdjacencyInfo.prototype.GetNumNeighbors = function (element) {
        return this.End(element) - this.Begin(element);
    };
    module.AdjacencyInfo.prototype.GetNumNeighborsBuffer = function () {
        return this.m_numNeighbors;
    };
    module.AdjacencyInfo.prototype.GetNeighborsBuffer = function () {
        return this.m_neighbors;
    };
    // Vector class
    module.Vector = function () {
        this.m_data = {};
        this.m_allocated = 0;
        this.m_size = 0;
    };
    module.Vector.prototype.Clear = function () {
        this.m_size = 0;
    };
    module.Vector.prototype.Get = function (i) {
        return this.m_data[i];
    };
    module.Vector.prototype.GetAllocatedSize = function () {
        return this.m_allocated;
    };
    module.Vector.prototype.GetSize = function () {
        return this.m_size;
    };
    module.Vector.prototype.GetBuffer = function () {
        return this.m_data;
    };
    module.Vector.prototype.SetSize = function (size) {
        this.m_size = size;
    };
    module.Vector.prototype.Allocate = function (size) {
        var i, tmp_data;
        if (size > this.m_allocated) {
            this.m_allocated = size;
            tmp_data = new Int32Array(this.m_allocated);
            if (this.m_size > 0) {
                for (i = 0; i < this.m_size; ++i) {
                    tmp_data[i] = this.m_data[i];
                }
            }
            this.m_data = tmp_data;
        }
    };
    module.Vector.prototype.PushBack = function (value) {
        var i, tmp_data;
        if (this.m_size === this.m_allocated) {
            this.m_allocated *= 2;
            if (this.m_allocated < local.O3DGC_DEFAULT_VECTOR_SIZE) {
                this.m_allocated = local.O3DGC_DEFAULT_VECTOR_SIZE;
            }
            tmp_data = new Int32Array(this.m_allocated);
            if (this.m_size > 0) {
                for (i = 0; i < this.m_size; ++i) {
                    tmp_data[i] = this.m_data[i];
                }
            }
            this.m_data = tmp_data;
        }
        this.m_data[this.m_size++] = value;
    };
    // CompressedTriangleFans class
    module.CompressedTriangleFans = function () {
        this.m_numTFANs = new module.Vector();
        this.m_degrees = new module.Vector();
        this.m_configs = new module.Vector();
        this.m_operations = new module.Vector();
        this.m_indices = new module.Vector();
        this.m_trianglesOrder = new module.Vector();
        this.m_streamType = local.O3DGC_STREAM_TYPE_UNKOWN;
    };
    module.CompressedTriangleFans.prototype.GetStreamType = function () {
        return this.m_streamType;
    };
    module.CompressedTriangleFans.prototype.SetStreamType = function (streamType) {
        this.m_streamType = streamType;
    };
    module.CompressedTriangleFans.prototype.Clear = function () {
        this.m_numTFANs.Clear();
        this.m_degrees.Clear();
        this.m_configs.Clear();
        this.m_operations.Clear();
        this.m_indices.Clear();
        return module.O3DGC_OK;
    };
    module.CompressedTriangleFans.prototype.Allocate = function (numVertices, numTriangles) {
        this.m_numTFANs.Allocate(numVertices);
        this.m_degrees.Allocate(2 * numVertices);
        this.m_configs.Allocate(2 * numVertices);
        this.m_operations.Allocate(2 * numVertices);
        this.m_indices.Allocate(2 * numVertices);
        this.m_trianglesOrder.Allocate(numTriangles);
        this.Clear();
        return module.O3DGC_OK;
    };
    module.CompressedTriangleFans.prototype.PushNumTFans = function (numTFans) {
        this.m_numTFANs.PushBack(numTFans);
    };
    module.CompressedTriangleFans.prototype.ReadNumTFans = function (it) {
        return this.m_numTFANs.Get(it.m_count++);
    };
    module.CompressedTriangleFans.prototype.PushDegree = function (degree) {
        this.m_degrees.PushBack(degree);
    };
    module.CompressedTriangleFans.prototype.ReadDegree = function (it) {
        return this.m_degrees.Get(it.m_count++);
    };
    module.CompressedTriangleFans.prototype.PushConfig = function (config) {
        this.m_configs.PushBack(config);
    };
    module.CompressedTriangleFans.prototype.ReadConfig = function (it) {
        return this.m_configs.Get(it.m_count++);
    };
    module.CompressedTriangleFans.prototype.PushOperation = function (op) {
        this.m_operations.PushBack(op);
    };
    module.CompressedTriangleFans.prototype.ReadOperation = function (it) {
        return this.m_operations.Get(it.m_count++);
    };
    module.CompressedTriangleFans.prototype.PushIndex = function (index) {
        this.m_indices.PushBack(index);
    };
    module.CompressedTriangleFans.prototype.ReadIndex = function (it) {
        return this.m_indices.Get(it.m_count++);
    };
    module.CompressedTriangleFans.prototype.PushTriangleIndex = function (index) {
        this.m_trianglesOrder.PushBack(IntToUInt(index));
    };
    module.CompressedTriangleFans.prototype.ReadTriangleIndex = function (it) {
        return UIntToInt(this.m_trianglesOrder.Get(it.m_count++));
    };
    module.CompressedTriangleFans.prototype.LoadUIntData = function (data, bstream, it) {
        var size, i;
        bstream.ReadUInt32ASCII(it);
        size = bstream.ReadUInt32ASCII(it);
        data.Allocate(size);
        data.Clear();
        for (i = 0; i < size; ++i) {
            data.PushBack(bstream.ReadUIntASCII(it));
        }
        return module.O3DGC_OK;
    };
    module.CompressedTriangleFans.prototype.LoadIntData = function (data, bstream, it) {
        var size, i;
        bstream.ReadUInt32ASCII(it);
        size = bstream.ReadUInt32ASCII(it);
        data.Allocate(size);
        data.Clear();
        for (i = 0; i < size; ++i) {
            data.PushBack(bstream.ReadIntASCII(it));
        }
        return module.O3DGC_OK;
    };
    module.CompressedTriangleFans.prototype.LoadBinData = function (data, bstream, it) {
        var size, symbol, i, h;
        bstream.ReadUInt32ASCII(it);
        size = bstream.ReadUInt32ASCII(it);
        data.Allocate(size * local.O3DGC_BINARY_STREAM_BITS_PER_SYMBOL0);
        data.Clear();
        i = 0;
        while (i < size) {
            symbol = bstream.ReadUCharASCII(it);
            for (h = 0; h < local.O3DGC_BINARY_STREAM_BITS_PER_SYMBOL0; ++h) {
                data.PushBack(symbol & 1);
                symbol >>>= 1;
                ++i;
            }
        }
        return module.O3DGC_OK;
    };
    module.CompressedTriangleFans.prototype.LoadUIntAC = function (data, M, bstream, it) {

        var sizeSize, size, minValue, buffer, acd, mModelValues, i;
        sizeSize = bstream.ReadUInt32Bin(it) - 12;
        size = bstream.ReadUInt32Bin(it);
        if (size === 0) {
            return module.O3DGC_OK;
        }
        minValue = bstream.ReadUInt32Bin(it);
        buffer = bstream.GetBuffer(it, sizeSize);
        it.m_count += sizeSize;
        data.Allocate(size);
        acd = new module.ArithmeticDecoder();
        acd.SetBuffer(sizeSize, buffer);
        acd.StartDecoder();
        mModelValues = new module.AdaptiveDataModel();
        mModelValues.SetAlphabet(M + 1);
        for (i = 0; i < size; ++i) {
            data.PushBack(acd.DecodeAdaptiveDataModel(mModelValues) + minValue);
        }
        return module.O3DGC_OK;
    };
    module.CompressedTriangleFans.prototype.LoadIntACEGC = function (data, M, bstream, it) {
        var sizeSize, size, minValue, buffer, acd, mModelValues, bModel0, bModel1, value, i;
        sizeSize = bstream.ReadUInt32Bin(it) - 12;
        size = bstream.ReadUInt32Bin(it);
        if (size === 0) {
            return module.O3DGC_OK;
        }
        minValue = bstream.ReadUInt32Bin(it) - local.O3DGC_MAX_LONG;
        buffer = bstream.GetBuffer(it, sizeSize);
        it.m_count += sizeSize;
        data.Allocate(size);
        acd = new module.ArithmeticDecoder();
        acd.SetBuffer(sizeSize, buffer);
        acd.StartDecoder();
        mModelValues = new module.AdaptiveDataModel();
        mModelValues.SetAlphabet(M + 2);
        bModel0 = new module.StaticBitModel();
        bModel1 = new module.AdaptiveBitModel();
        for (i = 0; i < size; ++i) {
            value = acd.DecodeAdaptiveDataModel(mModelValues);
            if (value === M) {
                value += acd.ExpGolombDecode(0, bModel0, bModel1);
            }
            data.PushBack(value + minValue);
        }
        return module.O3DGC_OK;
    };
    module.CompressedTriangleFans.prototype.LoadBinAC = function (data, bstream, it) {
        var sizeSize, size, buffer, acd, bModel, i;
        sizeSize = bstream.ReadUInt32Bin(it) - 8;
        size = bstream.ReadUInt32Bin(it);
        if (size === 0) {
            return module.O3DGC_OK;
        }
        buffer = bstream.GetBuffer(it, sizeSize);
        it.m_count += sizeSize;
        data.Allocate(size);
        acd = new module.ArithmeticDecoder();
        acd.SetBuffer(sizeSize, buffer);
        acd.StartDecoder();
        bModel = new module.AdaptiveBitModel();
        for (i = 0; i < size; ++i) {
            data.PushBack(acd.DecodeAdaptiveBitModel(bModel));
        }
        return module.O3DGC_OK;
    };
    module.CompressedTriangleFans.prototype.Load = function (bstream, iterator, decodeTrianglesOrder, streamType) {
        if (streamType === local.O3DGC_STREAM_TYPE_ASCII) {
            this.LoadUIntData(this.m_numTFANs, bstream, iterator);
            this.LoadUIntData(this.m_degrees, bstream, iterator);
            this.LoadUIntData(this.m_configs, bstream, iterator);
            this.LoadBinData(this.m_operations, bstream, iterator);
            this.LoadIntData(this.m_indices, bstream, iterator);
            if (decodeTrianglesOrder) {
                this.LoadUIntData(this.m_trianglesOrder, bstream, iterator);
            }
        } else {
            this.LoadIntACEGC(this.m_numTFANs, 4, bstream, iterator);
            this.LoadIntACEGC(this.m_degrees, 16, bstream, iterator);
            this.LoadUIntAC(this.m_configs, 10, bstream, iterator);
            this.LoadBinAC(this.m_operations, bstream, iterator);
            this.LoadIntACEGC(this.m_indices, 8, bstream, iterator);
            if (decodeTrianglesOrder) {
                this.LoadIntACEGC(this.m_trianglesOrder, 16, bstream, iterator);
            }
        }
        return module.O3DGC_OK;
    };
    // TriangleFans class
    module.TriangleFans = function () {
        this.m_verticesAllocatedSize = 0;
        this.m_sizeTFANAllocatedSize = 0;
        this.m_numTFANs = 0;
        this.m_numVertices = 0;
        this.m_sizeTFAN = {};
        this.m_vertices = {};
    };
    module.TriangleFans.prototype.Allocate = function (sizeTFAN, verticesSize) {
        this.m_numTFANs = 0;
        this.m_numVertices = 0;
        if (this.m_verticesAllocatedSize < verticesSize) {
            this.m_verticesAllocatedSize = verticesSize;
            this.m_vertices = new Int32Array(this.m_verticesAllocatedSize);
        }
        if (this.m_sizeTFANAllocatedSize < sizeTFAN) {
            this.m_sizeTFANAllocatedSize = sizeTFAN;
            this.m_sizeTFAN = new Int32Array(this.m_sizeTFANAllocatedSize);
        }
        return module.O3DGC_OK;
    };
    module.TriangleFans.prototype.Clear = function () {
        this.m_numTFANs = 0;
        this.m_numVertices = 0;
        return module.O3DGC_OK;
    };
    module.TriangleFans.prototype.AddVertex = function (vertex) {
        var i, tmp_vertices;
        ++this.m_numVertices;
        if (this.m_numVertices > this.m_verticesAllocatedSize) {
            this.m_verticesAllocatedSize *= 2;
            tmp_vertices = new Int32Array(this.m_verticesAllocatedSize);
            for (i = 0; i < this.m_numVertices; ++i) {
                tmp_vertices[i] = this.m_vertices[i];
            }
            this.m_vertices = tmp_vertices;
        }
        this.m_vertices[this.m_numVertices - 1] = vertex;
        ++this.m_sizeTFAN[this.m_numTFANs - 1];
        return module.O3DGC_OK;
    };
    module.TriangleFans.prototype.AddTFAN = function () {
        var i, tmp_sizeTFAN;
        ++this.m_numTFANs;
        if (this.m_numTFANs > this.m_sizeTFANAllocatedSize) {
            this.m_sizeTFANAllocatedSize *= 2;
            tmp_sizeTFAN = new Int32Array(this.m_sizeTFANAllocatedSize);
            for (i = 0; i < this.m_numTFANs; ++i) {
                tmp_sizeTFAN[i] = this.m_sizeTFAN[i];
            }
            this.m_sizeTFAN = tmp_sizeTFAN;
        }
        this.m_sizeTFAN[this.m_numTFANs - 1] = (this.m_numTFANs > 1) ? this.m_sizeTFAN[this.m_numTFANs - 2] : 0;
        return module.O3DGC_OK;
    };
    module.TriangleFans.prototype.Begin = function (tfan) {
        return (tfan > 0) ? this.m_sizeTFAN[tfan - 1] : 0;
    };
    module.TriangleFans.prototype.End = function (tfan) {
        return this.m_sizeTFAN[tfan];
    };
    module.TriangleFans.prototype.GetVertex = function (vertex) {
        return this.m_vertices[vertex];
    };
    module.TriangleFans.prototype.GetTFANSize = function (tfan) {
        return this.End(tfan) - this.Begin(tfan);
    };
    module.TriangleFans.prototype.GetNumTFANs = function () {
        return this.m_numTFANs;
    };
    module.TriangleFans.prototype.GetNumVertices = function () {
        return this.m_numVertices;
    };
    // TriangleListDecoder class
    module.TriangleListDecoder = function () {
        this.m_itNumTFans = new module.Iterator();
        this.m_itDegree = new module.Iterator();
        this.m_itConfig = new module.Iterator();
        this.m_itOperation = new module.Iterator();
        this.m_itIndex = new module.Iterator();
        this.m_maxNumVertices = 0;
        this.m_maxNumTriangles = 0;
        this.m_numTriangles = 0;
        this.m_numVertices = 0;
        this.m_tempTrianglesSize = 0;
        this.m_vertexCount = 0;
        this.m_triangleCount = 0;
        this.m_numConqueredTriangles = 0;
        this.m_numVisitedVertices = 0;
        this.m_triangles = {};
        this.m_tempTriangles = {};
        this.m_visitedVertices = {};
        this.m_visitedVerticesValence = {};
        this.m_vertexToTriangle = new module.AdjacencyInfo();
        this.m_ctfans = new module.CompressedTriangleFans();
        this.m_tfans = new module.TriangleFans();
        this.m_streamType = local.O3DGC_STREAM_TYPE_ASCII;
        this.m_decodeTrianglesOrder = false;
        this.m_decodeVerticesOrder = false;
        this.m_processConfig = {
            0: function (decoder, degree) { // ops: 1000001 vertices: -1 -2
                var u;
                decoder.m_tfans.AddVertex(decoder.m_visitedVertices[0]);
                for (u = 1; u < degree - 1; ++u) {
                    decoder.m_visitedVertices[decoder.m_numVisitedVertices++] = decoder.m_vertexCount;
                    decoder.m_tfans.AddVertex(decoder.m_vertexCount++);
                }
                decoder.m_tfans.AddVertex(decoder.m_visitedVertices[1]);
            },
            1: function (decoder, degree, focusVertex) { // ops: 1xxxxxx1 vertices: -1 x x x x x -2
                var u, op, index;
                decoder.m_tfans.AddVertex(decoder.m_visitedVertices[0]);
                for (u = 1; u < degree - 1; ++u) {
                    op = decoder.m_ctfans.ReadOperation(decoder.m_itOperation);
                    if (op === 1) {
                        index = decoder.m_ctfans.ReadIndex(decoder.m_itIndex);
                        if (index < 0) {
                            decoder.m_tfans.AddVertex(decoder.m_visitedVertices[-index - 1]);
                        } else {
                            decoder.m_tfans.AddVertex(index + focusVertex);
                        }
                    } else {
                        decoder.m_visitedVertices[decoder.m_numVisitedVertices++] = decoder.m_vertexCount;
                        decoder.m_tfans.AddVertex(decoder.m_vertexCount++);
                    }
                }
                decoder.m_tfans.AddVertex(decoder.m_visitedVertices[1]);
            },
            2: function (decoder, degree) { // ops: 00000001 vertices: -1
                var u;
                for (u = 0; u < degree - 1; ++u) {
                    decoder.m_visitedVertices[decoder.m_numVisitedVertices++] = decoder.m_vertexCount;
                    decoder.m_tfans.AddVertex(decoder.m_vertexCount++);
                }
                decoder.m_tfans.AddVertex(decoder.m_visitedVertices[0]);
            },
            3: function (decoder, degree) { // ops: 00000001 vertices: -2
                var u;
                for (u = 0; u < degree - 1; ++u) {
                    decoder.m_visitedVertices[decoder.m_numVisitedVertices++] = decoder.m_vertexCount;
                    decoder.m_tfans.AddVertex(decoder.m_vertexCount++);
                }
                decoder.m_tfans.AddVertex(decoder.m_visitedVertices[1]);
            },
            4: function (decoder, degree) {// ops: 10000000 vertices: -1
                var u;
                decoder.m_tfans.AddVertex(decoder.m_visitedVertices[0]);
                for (u = 1; u < degree; ++u) {
                    decoder.m_visitedVertices[decoder.m_numVisitedVertices++] = decoder.m_vertexCount;
                    decoder.m_tfans.AddVertex(decoder.m_vertexCount++);
                }
            },
            5: function (decoder, degree) { // ops: 10000000 vertices: -2
                var u;
                decoder.m_tfans.AddVertex(decoder.m_visitedVertices[1]);
                for (u = 1; u < degree; ++u) {
                    decoder.m_visitedVertices[decoder.m_numVisitedVertices++] = decoder.m_vertexCount;
                    decoder.m_tfans.AddVertex(decoder.m_vertexCount++);
                }
            },
            6: function (decoder, degree) { // ops: 00000000 vertices:
                var u;
                for (u = 0; u < degree; ++u) {
                    decoder.m_visitedVertices[decoder.m_numVisitedVertices++] = decoder.m_vertexCount;
                    decoder.m_tfans.AddVertex(decoder.m_vertexCount++);
                }
            },
            7: function (decoder, degree) { // ops: 1000001 vertices: -2 -1
                var u;
                decoder.m_tfans.AddVertex(decoder.m_visitedVertices[1]);
                for (u = 1; u < degree - 1; ++u) {
                    decoder.m_visitedVertices[decoder.m_numVisitedVertices++] = decoder.m_vertexCount;
                    decoder.m_tfans.AddVertex(decoder.m_vertexCount++);
                }
                decoder.m_tfans.AddVertex(decoder.m_visitedVertices[0]);
            },
            8: function (decoder, degree, focusVertex) { // ops: 1xxxxxx1 vertices: -2 x x x x x -1
                var u, op, index;
                decoder.m_tfans.AddVertex(decoder.m_visitedVertices[1]);
                for (u = 1; u < degree - 1; ++u) {
                    op = decoder.m_ctfans.ReadOperation(decoder.m_itOperation);
                    if (op === 1) {
                        index = decoder.m_ctfans.ReadIndex(decoder.m_itIndex);
                        if (index < 0) {
                            decoder.m_tfans.AddVertex(decoder.m_visitedVertices[-index - 1]);
                        } else {
                            decoder.m_tfans.AddVertex(index + focusVertex);
                        }
                    } else {
                        decoder.m_visitedVertices[decoder.m_numVisitedVertices++] = decoder.m_vertexCount;
                        decoder.m_tfans.AddVertex(decoder.m_vertexCount++);
                    }
                }
                decoder.m_tfans.AddVertex(decoder.m_visitedVertices[0]);
            },
            9: function (decoder, degree, focusVertex) { // general case
                var u, op, index;
                for (u = 0; u < degree; ++u) {
                    op = decoder.m_ctfans.ReadOperation(decoder.m_itOperation);
                    if (op === 1) {
                        index = decoder.m_ctfans.ReadIndex(decoder.m_itIndex);
                        if (index < 0) {
                            decoder.m_tfans.AddVertex(decoder.m_visitedVertices[-index - 1]);
                        } else {
                            decoder.m_tfans.AddVertex(index + focusVertex);
                        }
                    } else {
                        decoder.m_visitedVertices[decoder.m_numVisitedVertices++] = decoder.m_vertexCount;
                        decoder.m_tfans.AddVertex(decoder.m_vertexCount++);
                    }
                }
            }
        };
    };
    module.TriangleListDecoder.prototype.GetStreamType = function () {
        return this.m_streamType;
    };
    module.TriangleListDecoder.prototype.GetReorderTriangles = function () {
        return this.m_decodeTrianglesOrder;
    };
    module.TriangleListDecoder.prototype.GetReorderVertices = function () {
        return this.m_decodeVerticesOrder;
    };
    module.TriangleListDecoder.prototype.SetStreamType = function (streamType) {
        this.m_streamType = streamType;
    };
    module.TriangleListDecoder.prototype.GetVertexToTriangle = function () {
        return this.m_vertexToTriangle;
    };
    module.TriangleListDecoder.prototype.Reorder = function () {
        var triangles, numTriangles, order, it, prevTriangleIndex, tempTriangles, t, i;
        if (this.m_decodeTrianglesOrder) {
            triangles = this.m_triangles;
            numTriangles = this.m_numTriangles;
            order = this.m_ctfans.m_trianglesOrder.m_data;
            tempTriangles = this.m_tempTriangles;
            tempTriangles.set(triangles);
            it = 0;
            prevTriangleIndex = 0;
            for (i = 0; i < numTriangles; ++i) {
                t = UIntToInt(order[it++]) + prevTriangleIndex;
                triangles[3 * t] = tempTriangles[3 * i];
                triangles[3 * t + 1] = tempTriangles[3 * i + 1];
                triangles[3 * t + 2] = tempTriangles[3 * i + 2];
                prevTriangleIndex = t + 1;
            }
        }
        return module.O3DGC_OK;
    };
    module.TriangleListDecoder.prototype.CompueLocalConnectivityInfo = function (focusVertex) {
        var visitedVertices, visitedVerticesValence, triangles, vertexToTriangle, beginV2T, endV2T, numConqueredTriangles, foundOrInserted, numVisitedVertices, tmp, i, j, k, h, x, y, t, p, v;
        visitedVertices = this.m_visitedVertices;
        visitedVerticesValence = this.m_visitedVerticesValence;
        triangles = this.m_triangles;
        vertexToTriangle = this.m_vertexToTriangle;
        beginV2T = vertexToTriangle.Begin(focusVertex);
        endV2T = vertexToTriangle.End(focusVertex);
        numConqueredTriangles = 0;
        numVisitedVertices = 0;
        t = 0;
        for (i = beginV2T; (t >= 0) && (i < endV2T); ++i) {
            t = vertexToTriangle.GetNeighbor(i);
            if (t >= 0) {
                ++numConqueredTriangles;
                p = 3 * t;
                // extract visited vertices
                for (k = 0; k < 3; ++k) {
                    v = triangles[p + k];
                    if (v > focusVertex) { // vertices are insertices by increasing traversal order
                        foundOrInserted = false;
                        for (j = 0; j < numVisitedVertices; ++j) {
                            if (v === visitedVertices[j]) {
                                visitedVerticesValence[j]++;
                                foundOrInserted = true;
                                break;
                            } else if (v < visitedVertices[j]) {
                                ++numVisitedVertices;
                                for (h = numVisitedVertices - 1; h > j; --h) {
                                    visitedVertices[h] = visitedVertices[h - 1];
                                    visitedVerticesValence[h] = visitedVerticesValence[h - 1];
                                }
                                visitedVertices[j] = v;
                                visitedVerticesValence[j] = 1;
                                foundOrInserted = true;
                                break;
                            }
                        }
                        if (!foundOrInserted) {
                            visitedVertices[numVisitedVertices] = v;
                            visitedVerticesValence[numVisitedVertices] = 1;
                            numVisitedVertices++;
                        }
                    }
                }
            }
        }
        // re-order visited vertices by taking into account their valence (i.e., # of conquered triangles incident to each vertex)
        // in order to avoid config. 9
        if (numVisitedVertices > 2) {
            for (x = 1; x < numVisitedVertices; ++x) {
                if (visitedVerticesValence[x] === 1) {
                    y = x;
                    while ((y > 0) && (visitedVerticesValence[y] < visitedVerticesValence[y - 1])) {
                        tmp = visitedVerticesValence[y];
                        visitedVerticesValence[y] = visitedVerticesValence[y - 1];
                        visitedVerticesValence[y - 1] = tmp;
                        tmp = visitedVertices[y];
                        visitedVertices[y] = visitedVertices[y - 1];
                        visitedVertices[y - 1] = tmp;
                        --y;
                    }
                }
            }
        }
        this.m_numConqueredTriangles = numConqueredTriangles;
        this.m_numVisitedVertices = numVisitedVertices;
        return module.O3DGC_OK;
    };
    module.TriangleListDecoder.prototype.DecompressTFAN = function (focusVertex) {
        var vertexToTriangle, triangles, itDegree, itConfig, tfans, ntfans, processConfig, ctfans, triangleCount, numConqueredTriangles, degree, config, k0, k1, b, c, t, f, k;
        vertexToTriangle = this.m_vertexToTriangle;
        triangles = this.m_triangles;
        itDegree = this.m_itDegree;
        itConfig = this.m_itConfig;
        tfans = this.m_tfans;
        processConfig = this.m_processConfig;
        ctfans = this.m_ctfans;
        triangleCount = this.m_triangleCount;
        numConqueredTriangles = this.m_numConqueredTriangles;
        ntfans = ctfans.ReadNumTFans(this.m_itNumTFans);
        if (ntfans > 0) {
            for (f = 0; f < ntfans; ++f) {
                tfans.AddTFAN();
                degree = ctfans.ReadDegree(itDegree) + 2 - numConqueredTriangles;
                config = ctfans.ReadConfig(itConfig);
                k0 = tfans.GetNumVertices();
                tfans.AddVertex(focusVertex);
                processConfig[config](this, degree, focusVertex);
                k1 = tfans.GetNumVertices();
                b = tfans.GetVertex(k0 + 1);
                for (k = k0 + 2; k < k1; ++k) {
                    c = tfans.GetVertex(k);
                    t = triangleCount * 3;
                    triangles[t++] = focusVertex;
                    triangles[t++] = b;
                    triangles[t] = c;
                    vertexToTriangle.AddNeighbor(focusVertex, triangleCount);
                    vertexToTriangle.AddNeighbor(b, triangleCount);
                    vertexToTriangle.AddNeighbor(c, triangleCount);
                    b = c;
                    triangleCount++;
                }
            }
        }
        this.m_triangleCount = triangleCount;
        return module.O3DGC_OK;
    };
    module.TriangleListDecoder.prototype.Decompress = function () {
        var focusVertex;
        for (focusVertex = 0; focusVertex < this.m_numVertices; ++focusVertex) {
            if (focusVertex === this.m_vertexCount) {
                this.m_vertexCount++; // insert focusVertex
            }
            this.CompueLocalConnectivityInfo(focusVertex);
            this.DecompressTFAN(focusVertex);
        }
        return module.O3DGC_OK;
    };
    module.TriangleListDecoder.prototype.Init = function (triangles, numTriangles, numVertices, maxSizeV2T) {
        var i, numNeighbors;
        this.m_numTriangles = numTriangles;
        this.m_numVertices = numVertices;
        this.m_triangles = triangles;
        this.m_vertexCount = 0;
        this.m_triangleCount = 0;
        this.m_itNumTFans.m_count = 0;
        this.m_itDegree.m_count = 0;
        this.m_itConfig.m_count = 0;
        this.m_itOperation.m_count = 0;
        this.m_itIndex.m_count = 0;
        if (this.m_numVertices > this.m_maxNumVertices) {
            this.m_maxNumVertices = this.m_numVertices;
            this.m_visitedVerticesValence = new Int32Array(this.m_numVertices);
            this.m_visitedVertices = new Int32Array(this.m_numVertices);
        }
        if (this.m_decodeTrianglesOrder && this.m_tempTrianglesSize < this.m_numTriangles) {
            this.m_tempTrianglesSize = this.m_numTriangles;
            this.m_tempTriangles = new Int32Array(3 * this.m_tempTrianglesSize);
        }
        this.m_ctfans.SetStreamType(this.m_streamType);
        this.m_ctfans.Allocate(this.m_numVertices, this.m_numTriangles);
        this.m_tfans.Allocate(2 * this.m_numVertices, 8 * this.m_numVertices);
        // compute vertex-to-triangle adjacency information
        this.m_vertexToTriangle.AllocateNumNeighborsArray(numVertices);
        numNeighbors = this.m_vertexToTriangle.GetNumNeighborsBuffer();
        for (i = 0; i < numVertices; ++i) {
            numNeighbors[i] = maxSizeV2T;
        }
        this.m_vertexToTriangle.AllocateNeighborsArray();
        this.m_vertexToTriangle.ClearNeighborsArray();
        return module.O3DGC_OK;
    };
    module.TriangleListDecoder.prototype.Decode = function (triangles, numTriangles, numVertices, bstream, it) {
        var compressionMask, maxSizeV2T;
        compressionMask = bstream.ReadUChar(it, this.m_streamType);
        this.m_decodeTrianglesOrder = ((compressionMask & 2) !== 0);
        this.m_decodeVerticesOrder = ((compressionMask & 1) !== 0);
        if (this.m_decodeVerticesOrder) { // vertices reordering not supported
            return module.O3DGC_ERROR_NON_SUPPORTED_FEATURE;
        }
        maxSizeV2T = bstream.ReadUInt32(it, this.m_streamType);
        this.Init(triangles, numTriangles, numVertices, maxSizeV2T);
        this.m_ctfans.Load(bstream, it, this.m_decodeTrianglesOrder, this.m_streamType);
        this.Decompress();
        return module.O3DGC_OK;
    };
    // SC3DMCDecoder class
    module.SC3DMCDecoder = function () {
        var i;
        this.m_iterator = new module.Iterator();
        this.m_streamSize = 0;
        this.m_params = new module.SC3DMCEncodeParams();
        this.m_triangleListDecoder = new module.TriangleListDecoder();
        this.m_quantFloatArray = {};
        this.m_orientation = {};
        this.m_normals = {};
        this.m_quantFloatArraySize = 0;
        this.m_normalsSize = 0;
        this.m_orientationSize = 0;
        this.m_stats = new module.SC3DMCStats();
        this.m_streamType = local.O3DGC_STREAM_TYPE_UNKOWN;
        this.m_neighbors = [];
        this.m_idelta = new Float32Array(local.O3DGC_SC3DMC_MAX_DIM_ATTRIBUTES);
        this.m_minNormal = new Float32Array(2);
        this.m_maxNormal = new Float32Array(2);
        this.m_minNormal[0] = this.m_minNormal[1] = -2;
        this.m_maxNormal[0] = this.m_maxNormal[1] = 2;
        for (i = 0; i < local.O3DGC_SC3DMC_MAX_DIM_ATTRIBUTES; ++i) {
            this.m_neighbors[i] = new module.SC3DMCPredictor();
        }
    };
    module.SC3DMCDecoder.prototype.GetStats = function () {
        return this.m_stats;
    };
    module.SC3DMCDecoder.prototype.DecodeHeader = function (ifs, bstream) {
        var c0, start_code, mask, j, a, d;
        c0 = this.m_iterator.m_count;
        start_code = bstream.ReadUInt32(this.m_iterator, local.O3DGC_STREAM_TYPE_BINARY);
        if (start_code !== local.O3DGC_SC3DMC_START_CODE) {
            this.m_iterator.m_count = c0;
            start_code = bstream.ReadUInt32(this.m_iterator, local.O3DGC_STREAM_TYPE_ASCII);
            if (start_code !== local.O3DGC_SC3DMC_START_CODE) {
                return module.O3DGC_ERROR_CORRUPTED_STREAM;
            }
            this.m_streamType = local.O3DGC_STREAM_TYPE_ASCII;
        } else {
            this.m_streamType = local.O3DGC_STREAM_TYPE_BINARY;
        }
        this.m_streamSize = bstream.ReadUInt32(this.m_iterator, this.m_streamType);
        this.m_params.SetEncodeMode(bstream.ReadUChar(this.m_iterator, this.m_streamType));

        ifs.SetCreaseAngle(bstream.ReadFloat32(this.m_iterator, this.m_streamType));
        mask = bstream.ReadUChar(this.m_iterator, this.m_streamType);
        ifs.SetCCW((mask & 1) === 1);
        ifs.SetSolid((mask & 2) === 1);
        ifs.SetConvex((mask & 4) === 1);
        ifs.SetIsTriangularMesh((mask & 8) === 1);

        ifs.SetNCoord(bstream.ReadUInt32(this.m_iterator, this.m_streamType));
        ifs.SetNNormal(bstream.ReadUInt32(this.m_iterator, this.m_streamType));
        ifs.SetNumFloatAttributes(bstream.ReadUInt32(this.m_iterator, this.m_streamType));
        ifs.SetNumIntAttributes(bstream.ReadUInt32(this.m_iterator, this.m_streamType));

        if (ifs.GetNCoord() > 0) {
            ifs.SetNCoordIndex(bstream.ReadUInt32(this.m_iterator, this.m_streamType));
            for (j = 0; j < 3; ++j) {
                ifs.SetCoordMin(j, bstream.ReadFloat32(this.m_iterator, this.m_streamType));
                ifs.SetCoordMax(j, bstream.ReadFloat32(this.m_iterator, this.m_streamType));
            }
            this.m_params.SetCoordQuantBits(bstream.ReadUChar(this.m_iterator, this.m_streamType));
        }
        if (ifs.GetNNormal() > 0) {
            ifs.SetNNormalIndex(bstream.ReadUInt32(this.m_iterator, this.m_streamType));
            for (j = 0; j < 3; ++j) {
                ifs.SetNormalMin(j, bstream.ReadFloat32(this.m_iterator, this.m_streamType));
                ifs.SetNormalMax(j, bstream.ReadFloat32(this.m_iterator, this.m_streamType));
            }
            ifs.SetNormalPerVertex(bstream.ReadUChar(this.m_iterator, this.m_streamType) === 1);
            this.m_params.SetNormalQuantBits(bstream.ReadUChar(this.m_iterator, this.m_streamType));
        }
        for (a = 0; a < ifs.GetNumFloatAttributes(); ++a) {
            ifs.SetNFloatAttribute(a, bstream.ReadUInt32(this.m_iterator, this.m_streamType));
            if (ifs.GetNFloatAttribute(a) > 0) {
                ifs.SetNFloatAttributeIndex(a, bstream.ReadUInt32(this.m_iterator, this.m_streamType));
                d = bstream.ReadUChar(this.m_iterator, this.m_streamType);
                ifs.SetFloatAttributeDim(a, d);
                for (j = 0; j < d; ++j) {
                    ifs.SetFloatAttributeMin(a, j, bstream.ReadFloat32(this.m_iterator, this.m_streamType));
                    ifs.SetFloatAttributeMax(a, j, bstream.ReadFloat32(this.m_iterator, this.m_streamType));
                }
                ifs.SetFloatAttributePerVertex(a, bstream.ReadUChar(this.m_iterator, this.m_streamType) === 1);
                ifs.SetFloatAttributeType(a, bstream.ReadUChar(this.m_iterator, this.m_streamType));
                this.m_params.SetFloatAttributeQuantBits(a, bstream.ReadUChar(this.m_iterator, this.m_streamType));
            }
        }
        for (a = 0; a < ifs.GetNumIntAttributes(); ++a) {
            ifs.SetNIntAttribute(a, bstream.ReadUInt32(this.m_iterator, this.m_streamType));
            if (ifs.GetNIntAttribute(a) > 0) {
                ifs.SetNIntAttributeIndex(a, bstream.ReadUInt32(this.m_iterator, this.m_streamType));
                ifs.SetIntAttributeDim(a, bstream.ReadUChar(this.m_iterator, this.m_streamType));
                ifs.SetIntAttributePerVertex(a, bstream.ReadUChar(this.m_iterator, this.m_streamType) === 1);
                ifs.SetIntAttributeType(a, bstream.ReadUChar(this.m_iterator, this.m_streamType));
            }
        }
        return module.O3DGC_OK;
    };
    function DeltaPredictors(triangles, ta, v, nPred, neighbors, dimFloatArray, quantFloatArray, stride) {
        var ws, k, p, w, i, id;
        id = new module.SC3DMCTriplet(-1, -1, -1);
        for (k = 0; k < 3; ++k) {
            w = triangles[ta * 3 + k];
            if (w < v) {
                id.m_a = -1;
                id.m_b = -1;
                id.m_c = w;
                p = InsertPredictor(id, nPred, neighbors, dimFloatArray);
                if (p !== -1) {
                    ws = w * stride;
                    for (i = 0; i < dimFloatArray; ++i) {
                        neighbors[p].m_pred[i] = quantFloatArray[ws + i];
                    }
                }
            }
        }
    }
    function ParallelogramPredictors(triangles, ta, v, nPred, neighbors, dimFloatArray, quantFloatArray, stride, v2T, v2TNeighbors) {
        var ta3, tb3, as, bs, cs, a, b, c, x, i, k, u1_begin, u1_end, u1, tb, foundB, p, id;
        ta3 = ta * 3;
        id = new module.SC3DMCTriplet(-1, -1, -1);
        if (triangles[ta3] === v) {
            a = triangles[ta3 + 1];
            b = triangles[ta3 + 2];
        } else if (triangles[ta3 + 1] === v) {
            a = triangles[ta3];
            b = triangles[ta3 + 2];
        } else {
            a = triangles[ta3];
            b = triangles[ta3 + 1];
        }
        if (a < v && b < v) {
            u1_begin = v2T.Begin(a);
            u1_end = v2T.End(a);
            for (u1 = u1_begin; u1 < u1_end; ++u1) {
                tb = v2TNeighbors[u1];
                if (tb < 0) {
                    break;
                }
                tb3 = tb * 3;
                c = -1;
                foundB = false;
                for (k = 0; k < 3; ++k) {
                    x = triangles[tb3 + k];
                    if (x === b) {
                        foundB = true;
                    } else if (x < v && x !== a) {
                        c = x;
                    }
                }
                if (c !== -1 && foundB) {
                    if (a < b) {
                        id.m_a = a;
                        id.m_b = b;
                    } else {
                        id.m_a = b;
                        id.m_b = a;
                    }
                    id.m_c = (-c - 1);
                    p = InsertPredictor(id, nPred, neighbors, dimFloatArray);
                    if (p !== -1) {
                        as = a * stride;
                        bs = b * stride;
                        cs = c * stride;
                        for (i = 0; i < dimFloatArray; ++i) {
                            neighbors[p].m_pred[i] = quantFloatArray[as + i] + quantFloatArray[bs + i] - quantFloatArray[cs + i];
                        }
                    }
                }
            }
        }
    }
    module.SC3DMCDecoder.prototype.DecodeIntArrayBinary = function (intArray,
                                                                    numIntArray,
                                                                    dimIntArray,
                                                                    stride,
                                                                    ifs,
                                                                    predMode,
                                                                    bstream) {
        var testPredEnabled, bestPred, i, u, ta, u_begin, u_end, buffer, iterator, streamType, predResidual, acd, bModel0, bModel1, mModelPreds, v2T, v2TNeighbors, triangles, size, start, streamSize, mask, binarization, iteratorPred, exp_k, M, id, mModelValues, neighbors, normals, nPred, v;
        iterator = this.m_iterator;
        streamType = this.m_streamType;
        acd = new module.ArithmeticDecoder();
        bModel0 = new module.StaticBitModel();
        bModel1 = new module.AdaptiveBitModel();
        mModelPreds = new module.AdaptiveDataModel();
        mModelPreds.SetAlphabet(local.O3DGC_SC3DMC_MAX_PREDICTION_NEIGHBORS + 1);
        v2T = this.m_triangleListDecoder.GetVertexToTriangle();
        v2TNeighbors = v2T.m_neighbors;
        triangles = ifs.GetCoordIndex();
        size = numIntArray * dimIntArray;
        start = iterator.m_count;
        streamSize = bstream.ReadUInt32(iterator, streamType);        // bitsream size
        mask = bstream.ReadUChar(iterator, streamType);
        binarization = (mask >>> 4) & 7;
        predMode.m_value = mask & 7;
        streamSize -= (iterator.m_count - start);
        iteratorPred = new module.Iterator();
        iteratorPred.m_count = iterator.m_count + streamSize;
        exp_k = 0;
        M = 0;
        id = new module.SC3DMCTriplet(-1, -1, -1);
        if (binarization !== local.O3DGC_SC3DMC_BINARIZATION_AC_EGC) {
            return module.O3DGC_ERROR_CORRUPTED_STREAM;
        }
        buffer = bstream.GetBuffer(iterator, streamSize);
        iterator.m_count += streamSize;
        acd.SetBuffer(streamSize, buffer);
        acd.StartDecoder();
        exp_k = acd.ExpGolombDecode(0, bModel0, bModel1);
        M = acd.ExpGolombDecode(0, bModel0, bModel1);
        mModelValues = new module.AdaptiveDataModel();
        mModelValues.SetAlphabet(M + 2);
        neighbors = this.m_neighbors;
        normals = this.m_normals;
        nPred = new module.NumberRef();
        testPredEnabled = predMode.m_value !== local.O3DGC_SC3DMC_NO_PREDICTION;
        for (v = 0; v < numIntArray; ++v) {
            nPred.m_value = 0;
            if (v2T.GetNumNeighbors(v) > 0 && testPredEnabled) {
                u_begin = v2T.Begin(v);
                u_end = v2T.End(v);
                for (u = u_begin; u < u_end; ++u) {
                    ta = v2TNeighbors[u];
                    if (ta < 0) {
                        break;
                    }
                    DeltaPredictors(triangles, ta, v, nPred, neighbors, dimIntArray, intArray, stride);
                }
            }
            if (nPred.m_value > 1) {
                bestPred = acd.DecodeAdaptiveDataModel(mModelPreds);
                for (i = 0; i < dimIntArray; ++i) {
                    predResidual = acd.DecodeIntACEGC(mModelValues, bModel0, bModel1, exp_k, M);
                    intArray[v * stride + i] = predResidual + neighbors[bestPred].m_pred[i];
                }
            } else if (v > 0 && predMode.m_value !== local.O3DGC_SC3DMC_NO_PREDICTION) {
                for (i = 0; i < dimIntArray; ++i) {
                    predResidual = acd.DecodeIntACEGC(mModelValues, bModel0, bModel1, exp_k, M);
                    intArray[v * stride + i] = predResidual + intArray[(v - 1) * stride + i];
                }
            } else {
                for (i = 0; i < dimIntArray; ++i) {
                    predResidual = acd.DecodeUIntACEGC(mModelValues, bModel0, bModel1, exp_k, M);
                    intArray[v * stride + i] = predResidual;
                }
            }
        }
        iterator.m_count = iteratorPred.m_count;
        return module.O3DGC_OK;
    };
    module.SC3DMCDecoder.prototype.DecodeIntArrayASCII = function (intArray,
                                                                   numIntArray,
                                                                   dimIntArray,
                                                                   stride,
                                                                   ifs,
                                                                   predMode,
                                                                   bstream) {
        var testPredEnabled, iterator, streamType, predResidual, v2T, v2TNeighbors, triangles, size, start, streamSize, mask, binarization, iteratorPred, id, neighbors, normals, nPred, v, u_begin, u_end, u, ta, i, bestPred;
        iterator = this.m_iterator;
        streamType = this.m_streamType;
        v2T = this.m_triangleListDecoder.GetVertexToTriangle();
        v2TNeighbors = v2T.m_neighbors;
        triangles = ifs.GetCoordIndex();
        size = numIntArray * dimIntArray;
        start = iterator.m_count;
        streamSize = bstream.ReadUInt32(iterator, streamType);        // bitsream size
        mask = bstream.ReadUChar(iterator, streamType);
        binarization = (mask >>> 4) & 7;
        predMode.m_value = mask & 7;
        streamSize -= (iterator.m_count - start);
        iteratorPred = new module.Iterator();
        iteratorPred.m_count = iterator.m_count + streamSize;
        id = new module.SC3DMCTriplet(-1, -1, -1);
        if (binarization !== local.O3DGC_SC3DMC_BINARIZATION_ASCII) {
            return module.O3DGC_ERROR_CORRUPTED_STREAM;
        }
        bstream.ReadUInt32(iteratorPred, streamType);        // predictors bitsream size
        neighbors = this.m_neighbors;
        normals = this.m_normals;
        nPred = new module.NumberRef();
        testPredEnabled = predMode.m_value !== local.O3DGC_SC3DMC_NO_PREDICTION;
        for (v = 0; v < numIntArray; ++v) {
            nPred.m_value = 0;
            if (v2T.GetNumNeighbors(v) > 0 && testPredEnabled) {
                u_begin = v2T.Begin(v);
                u_end = v2T.End(v);
                for (u = u_begin; u < u_end; ++u) {
                    ta = v2TNeighbors[u];
                    if (ta < 0) {
                        break;
                    }
                    DeltaPredictors(triangles, ta, v, nPred, neighbors, dimIntArray, intArray, stride);
                }
            }
            if (nPred.m_value > 1) {
                bestPred = bstream.ReadUCharASCII(iteratorPred);
                for (i = 0; i < dimIntArray; ++i) {
                    predResidual = bstream.ReadIntASCII(iterator);
                    intArray[v * stride + i] = predResidual + neighbors[bestPred].m_pred[i];
                }
            } else if (v > 0 && predMode.m_value !== local.O3DGC_SC3DMC_NO_PREDICTION) {
                for (i = 0; i < dimIntArray; ++i) {
                    predResidual = bstream.ReadIntASCII(iterator);
                    intArray[v * stride + i] = predResidual + intArray[(v - 1) * stride + i];
                }
            } else {
                for (i = 0; i < dimIntArray; ++i) {
                    predResidual = bstream.ReadUIntASCII(iterator);
                    intArray[v * stride + i] = predResidual;
                }
            }
        }
        iterator.m_count = iteratorPred.m_count;
        return module.O3DGC_OK;
    };
    module.SC3DMCDecoder.prototype.DecodeIntArray = function (intArray,
                                                              numIntArray,
                                                              dimIntArray,
                                                              stride,
                                                              ifs,
                                                              predMode,
                                                              bstream) {
        if (this.m_streamType === local.O3DGC_STREAM_TYPE_ASCII) {
            return this.DecodeIntArrayASCII(intArray, numIntArray, dimIntArray, stride, ifs, predMode, bstream);
        }
        return this.DecodeIntArrayBinary(intArray, numIntArray, dimIntArray, stride, ifs, predMode, bstream);
    };
    function ComputeNormals(triangles, ntris, coords, nvert, normals) {
        var t3, v, n, t, a, b, c, d1, d2, n0;
        n0 = new module.Vec3();
        d1 = new module.Vec3();
        d2 = new module.Vec3();
        n = nvert * 3;
        for (v = 0; v < n; ++v) {
            normals[v] = 0;
        }
        for (t = 0; t < ntris; ++t) {
            t3 = t * 3;
            a = triangles[t3] * 3;
            b = triangles[t3 + 1] * 3;
            c = triangles[t3 + 2] * 3;
            d1.m_x = coords[b] - coords[a];
            d1.m_y = coords[b + 1] - coords[a + 1];
            d1.m_z = coords[b + 2] - coords[a + 2];
            d2.m_x = coords[c] - coords[a];
            d2.m_y = coords[c + 1] - coords[a + 1];
            d2.m_z = coords[c + 2] - coords[a + 2];
            n0.m_x = d1.m_y * d2.m_z - d1.m_z * d2.m_y;
            n0.m_y = d1.m_z * d2.m_x - d1.m_x * d2.m_z;
            n0.m_z = d1.m_x * d2.m_y - d1.m_y * d2.m_x;
            normals[a] += n0.m_x;
            normals[a + 1] += n0.m_y;
            normals[a + 2] += n0.m_z;
            normals[b] += n0.m_x;
            normals[b + 1] += n0.m_y;
            normals[b + 2] += n0.m_z;
            normals[c] += n0.m_x;
            normals[c + 1] += n0.m_y;
            normals[c + 2] += n0.m_z;
        }
    }
    module.SC3DMCDecoder.prototype.ProcessNormals = function (ifs) {
        var v3, v2, nvert, normalSize, normals, quantFloatArray, orientation, triangles, n0, n1, v, rna0, rnb0, ni1, norm0;
        nvert = ifs.GetNNormal();

        normalSize = ifs.GetNNormal() * 3;
        if (this.m_normalsSize < normalSize) {
            this.m_normalsSize = normalSize;
            this.m_normals = new Float32Array(this.m_normalsSize);
        }
        normals = this.m_normals;
        quantFloatArray = this.m_quantFloatArray;
        orientation = this.m_orientation;
        triangles = ifs.GetCoordIndex();
        ComputeNormals(triangles, ifs.GetNCoordIndex(), quantFloatArray, nvert, normals);
        n0 = new module.Vec3();
        n1 = new module.Vec3();
        for (v = 0; v < nvert; ++v) {
            v3 = 3 * v;
            n0.m_x = normals[v3];
            n0.m_y = normals[v3 + 1];
            n0.m_z = normals[v3 + 2];
            norm0 = Math.sqrt(n0.m_x * n0.m_x + n0.m_y * n0.m_y + n0.m_z * n0.m_z);
            if (norm0 === 0.0) {
                norm0 = 1.0;
            }
            SphereToCube(n0, n1);
            rna0 = n1.m_x / norm0;
            rnb0 = n1.m_y / norm0;
            ni1 = n1.m_z + orientation[v];
            orientation[v] = ni1;
            if ((ni1 >>> 1) !== (n1.m_z >>> 1)) {
                rna0 = 0.0;
                rnb0 = 0.0;
            }
            v2 = v * 2;
            normals[v2] = rna0;
            normals[v2 + 1] = rnb0;
        }
        return module.O3DGC_OK;
    };
    module.SC3DMCDecoder.prototype.IQuantize = function (floatArray,
                                                         numFloatArray,
                                                         dimFloatArray,
                                                         stride,
                                                         minFloatArray,
                                                         maxFloatArray,
                                                         nQBits,
                                                         predMode) {
        var v, nin, nout, orientation, normals, CubeToSphere;
        if (predMode.m_value === local.O3DGC_SC3DMC_SURF_NORMALS_PREDICTION) {
            CubeToSphere = local.CubeToSphere;
            orientation = this.m_orientation;
            normals = this.m_normals;
            nin = new module.Vec3(0, 0, 0);
            nout = new module.Vec3(0, 0, 0);
            this.IQuantizeFloatArray(floatArray, numFloatArray, dimFloatArray, stride, this.m_minNormal, this.m_maxNormal, nQBits + 1);
            for (v = 0; v < numFloatArray; ++v) {
                nin.m_x = floatArray[stride * v] + normals[2 * v];
                nin.m_y = floatArray[stride * v + 1] + normals[2 * v + 1];
                nin.m_z = orientation[v];
                CubeToSphere[nin.m_z](nin, nout);
                floatArray[stride * v] = nout.m_x;
                floatArray[stride * v + 1] = nout.m_y;
                floatArray[stride * v + 2] = nout.m_z;
            }
        } else {
            this.IQuantizeFloatArray(floatArray, numFloatArray, dimFloatArray, stride, minFloatArray, maxFloatArray, nQBits);
        }
    };
    module.SC3DMCDecoder.prototype.DecodeFloatArrayBinary = function (floatArray,
                                                                      numFloatArray,
                                                                      dimFloatArray,
                                                                      stride,
                                                                      minFloatArray,
                                                                      maxFloatArray,
                                                                      nQBits,
                                                                      ifs,
                                                                      predMode,
                                                                      bstream) {
        var maxNPred, testPredEnabled, testParaPredEnabled, bestPred, dModel, buffer, quantFloatArray, neighbors, normals, nPred, ta, i, v, u, u_begin, u_end, iterator, orientation, streamType, predResidual, acd, bModel0, bModel1, mModelPreds, v2T, v2TNeighbors, triangles, size, start, streamSize, mask, binarization, iteratorPred, exp_k, M, mModelValues;
        iterator = this.m_iterator;
        orientation = this.m_orientation;
        streamType = this.m_streamType;
        acd = new module.ArithmeticDecoder();
        bModel0 = new module.StaticBitModel();
        bModel1 = new module.AdaptiveBitModel();
        mModelPreds = new module.AdaptiveDataModel();
        maxNPred = local.O3DGC_SC3DMC_MAX_PREDICTION_NEIGHBORS;
        mModelPreds.SetAlphabet(maxNPred + 1);
        v2T = this.m_triangleListDecoder.GetVertexToTriangle();
        v2TNeighbors = v2T.m_neighbors;
        triangles = ifs.GetCoordIndex();
        size = numFloatArray * dimFloatArray;
        start = iterator.m_count;
        streamSize = bstream.ReadUInt32(iterator, streamType);
        mask = bstream.ReadUChar(iterator, streamType);
        binarization = (mask >>> 4) & 7;
        predMode.m_value = mask & 7;
        streamSize -= (iterator.m_count - start);
        iteratorPred = new module.Iterator();
        iteratorPred.m_count = iterator.m_count + streamSize;
        exp_k = 0;
        M = 0;
        if (binarization !== local.O3DGC_SC3DMC_BINARIZATION_AC_EGC) {
            return module.O3DGC_ERROR_CORRUPTED_STREAM;
        }
        buffer = bstream.GetBuffer(iterator, streamSize);
        iterator.m_count += streamSize;
        acd.SetBuffer(streamSize, buffer);
        acd.StartDecoder();
        exp_k = acd.ExpGolombDecode(0, bModel0, bModel1);
        M = acd.ExpGolombDecode(0, bModel0, bModel1);
        mModelValues = new module.AdaptiveDataModel();
        mModelValues.SetAlphabet(M + 2);
        if (predMode.m_value === local.O3DGC_SC3DMC_SURF_NORMALS_PREDICTION) {
            if (this.m_orientationSize < size) {
                this.m_orientationSize = size;
                this.m_orientation = new Int8Array(this.m_orientationSize);
                orientation = this.m_orientation;
            }
            dModel = new module.AdaptiveDataModel();
            dModel.SetAlphabet(12);
            for (i = 0; i < numFloatArray; ++i) {
                orientation[i] = UIntToInt(acd.DecodeAdaptiveDataModel(dModel));
            }
            this.ProcessNormals(ifs);
            dimFloatArray = 2;
        }
        if (this.m_quantFloatArraySize < size) {
            this.m_quantFloatArraySize = size;
            this.m_quantFloatArray = new Int32Array(this.m_quantFloatArraySize);
        }
        quantFloatArray = this.m_quantFloatArray;
        neighbors = this.m_neighbors;
        normals = this.m_normals;
        nPred = new module.NumberRef();
        testPredEnabled = predMode.m_value !== local.O3DGC_SC3DMC_NO_PREDICTION;
        testParaPredEnabled = predMode.m_value === local.O3DGC_SC3DMC_PARALLELOGRAM_PREDICTION;
        for (v = 0; v < numFloatArray; ++v) {
            nPred.m_value = 0;
            if (v2T.GetNumNeighbors(v) > 0 && testPredEnabled) {
                u_begin = v2T.Begin(v);
                u_end = v2T.End(v);
                if (testParaPredEnabled) {
                    for (u = u_begin; u < u_end; ++u) {
                        ta = v2TNeighbors[u];
                        if (ta < 0) {
                            break;
                        }
                        ParallelogramPredictors(triangles, ta, v, nPred, neighbors, dimFloatArray, quantFloatArray, stride, v2T, v2TNeighbors);
                    }
                }
                if (nPred.m_value < maxNPred) {
                    for (u = u_begin; u < u_end; ++u) {
                        ta = v2TNeighbors[u];
                        if (ta < 0) {
                            break;
                        }
                        DeltaPredictors(triangles, ta, v, nPred, neighbors, dimFloatArray, quantFloatArray, stride);
                    }
                }
            }
            if (nPred.m_value > 1) {
                bestPred = acd.DecodeAdaptiveDataModel(mModelPreds);
                for (i = 0; i < dimFloatArray; ++i) {
                    predResidual = acd.DecodeIntACEGC(mModelValues, bModel0, bModel1, exp_k, M);
                    quantFloatArray[v * stride + i] = predResidual + neighbors[bestPred].m_pred[i];
                }
            } else if (v > 0 && testPredEnabled) {
                for (i = 0; i < dimFloatArray; ++i) {
                    predResidual = acd.DecodeIntACEGC(mModelValues, bModel0, bModel1, exp_k, M);
                    quantFloatArray[v * stride + i] = predResidual + quantFloatArray[(v - 1) * stride + i];
                }
            } else {
                for (i = 0; i < dimFloatArray; ++i) {
                    predResidual = acd.DecodeUIntACEGC(mModelValues, bModel0, bModel1, exp_k, M);
                    quantFloatArray[v * stride + i] = predResidual;
                }
            }
        }
        iterator.m_count = iteratorPred.m_count;
        this.IQuantize(floatArray, numFloatArray, dimFloatArray, stride, minFloatArray, maxFloatArray, nQBits, predMode);
        return module.O3DGC_OK;
    };
    module.SC3DMCDecoder.prototype.DecodeFloatArrayASCII = function (floatArray,
                                                                     numFloatArray,
                                                                     dimFloatArray,
                                                                     stride,
                                                                     minFloatArray,
                                                                     maxFloatArray,
                                                                     nQBits,
                                                                     ifs,
                                                                     predMode,
                                                                     bstream) {
        var maxNPred, testPredEnabled, testParaPredEnabled, iterator, orientation, streamType, predResidual, v2T, v2TNeighbors, triangles, size, start, streamSize, mask, binarization, iteratorPred, quantFloatArray, neighbors, normals, nPred, v, u, u_begin, u_end, ta, i, bestPred;
        maxNPred = local.O3DGC_SC3DMC_MAX_PREDICTION_NEIGHBORS;
        iterator = this.m_iterator;
        orientation = this.m_orientation;
        streamType = this.m_streamType;
        v2T = this.m_triangleListDecoder.GetVertexToTriangle();
        v2TNeighbors = v2T.m_neighbors;
        triangles = ifs.GetCoordIndex();
        size = numFloatArray * dimFloatArray;
        start = iterator.m_count;
        streamSize = bstream.ReadUInt32(iterator, streamType);
        mask = bstream.ReadUChar(iterator, streamType);
        binarization = (mask >>> 4) & 7;
        predMode.m_value = mask & 7;
        streamSize -= (iterator.m_count - start);
        iteratorPred = new module.Iterator();
        iteratorPred.m_count = iterator.m_count + streamSize;
        if (binarization !== local.O3DGC_SC3DMC_BINARIZATION_ASCII) {
            return module.O3DGC_ERROR_CORRUPTED_STREAM;
        }
        bstream.ReadUInt32(iteratorPred, streamType);
        if (predMode.m_value === local.O3DGC_SC3DMC_SURF_NORMALS_PREDICTION) {
            if (this.m_orientationSize < numFloatArray) {
                this.m_orientationSize = numFloatArray;
                this.m_orientation = new Int8Array(this.m_orientationSize);
                orientation = this.m_orientation;
            }
            for (i = 0; i < numFloatArray; ++i) {
                orientation[i] = bstream.ReadIntASCII(iterator);
            }
            this.ProcessNormals(ifs);
            dimFloatArray = 2;
        }
        if (this.m_quantFloatArraySize < size) {
            this.m_quantFloatArraySize = size;
            this.m_quantFloatArray = new Int32Array(this.m_quantFloatArraySize);
        }
        quantFloatArray = this.m_quantFloatArray;
        neighbors = this.m_neighbors;
        normals = this.m_normals;
        nPred = new module.NumberRef();
        testPredEnabled = predMode.m_value !== local.O3DGC_SC3DMC_NO_PREDICTION;
        testParaPredEnabled = predMode.m_value === local.O3DGC_SC3DMC_PARALLELOGRAM_PREDICTION;
        for (v = 0; v < numFloatArray; ++v) {
            nPred.m_value = 0;
            if (v2T.GetNumNeighbors(v) > 0 && testPredEnabled) {
                u_begin = v2T.Begin(v);
                u_end = v2T.End(v);
                if (testParaPredEnabled) {
                    for (u = u_begin; u < u_end; ++u) {
                        ta = v2TNeighbors[u];
                        if (ta < 0) {
                            break;
                        }
                        ParallelogramPredictors(triangles, ta, v, nPred, neighbors, dimFloatArray, quantFloatArray, stride, v2T, v2TNeighbors);
                    }
                }
                if (nPred.m_value < maxNPred) {
                    for (u = u_begin; u < u_end; ++u) {
                        ta = v2TNeighbors[u];
                        if (ta < 0) {
                            break;
                        }
                        DeltaPredictors(triangles, ta, v, nPred, neighbors, dimFloatArray, quantFloatArray, stride);
                    }
                }
            }
            if (nPred.m_value > 1) {
                bestPred = bstream.ReadUCharASCII(iteratorPred);
                for (i = 0; i < dimFloatArray; ++i) {
                    predResidual = bstream.ReadIntASCII(iterator);
                    quantFloatArray[v * stride + i] = predResidual + neighbors[bestPred].m_pred[i];
                }
            } else if (v > 0 && predMode.m_value !== local.O3DGC_SC3DMC_NO_PREDICTION) {
                for (i = 0; i < dimFloatArray; ++i) {
                    predResidual = bstream.ReadIntASCII(iterator);
                    quantFloatArray[v * stride + i] = predResidual + quantFloatArray[(v - 1) * stride + i];
                }
            } else {
                for (i = 0; i < dimFloatArray; ++i) {
                    predResidual = bstream.ReadUIntASCII(iterator);
                    quantFloatArray[v * stride + i] = predResidual;
                }
            }
        }
        iterator.m_count = iteratorPred.m_count;
        this.IQuantize(floatArray, numFloatArray, dimFloatArray, stride, minFloatArray, maxFloatArray, nQBits, predMode);
        return module.O3DGC_OK;
    };
    module.SC3DMCDecoder.prototype.DecodeFloatArray = function (floatArray,
                                                                numFloatArray,
                                                                dimFloatArray,
                                                                stride,
                                                                minFloatArray,
                                                                maxFloatArray,
                                                                nQBits,
                                                                ifs,
                                                                predMode,
                                                                bstream) {
        if (this.m_streamType === local.O3DGC_STREAM_TYPE_ASCII) {
            return this.DecodeFloatArrayASCII(floatArray, numFloatArray, dimFloatArray, stride, minFloatArray, maxFloatArray, nQBits, ifs, predMode, bstream);
        }
        return this.DecodeFloatArrayBinary(floatArray, numFloatArray, dimFloatArray, stride, minFloatArray, maxFloatArray, nQBits, ifs, predMode, bstream);
    };
    module.SC3DMCDecoder.prototype.IQuantizeFloatArray = function (floatArray, numFloatArray, dimFloatArray, stride, minFloatArray, maxFloatArray, nQBits) {
        var idelta, quantFloatArray, d, r, v;
        idelta = this.m_idelta;
        quantFloatArray = this.m_quantFloatArray;
        for (d = 0; d < dimFloatArray; ++d) {
            r = maxFloatArray[d] - minFloatArray[d];
            if (r > 0.0) {
                idelta[d] = r / (((1 << nQBits) >>> 0) - 1);
            } else {
                idelta[d] = 1.0;
            }
        }
        for (v = 0; v < numFloatArray; ++v) {
            for (d = 0; d < dimFloatArray; ++d) {
                floatArray[v * stride + d] = quantFloatArray[v * stride + d] * idelta[d] + minFloatArray[d];
            }
        }
        return module.O3DGC_OK;
    };
    module.SC3DMCDecoder.prototype.DecodePlayload = function (ifs, bstream) {
        var params, iterator, stats, predMode, timer, ret, a;
        params = this.m_params;
        iterator = this.m_iterator;
        stats = this.m_stats;
        predMode = new module.NumberRef();
        timer = new module.Timer();
        ret = module.O3DGC_OK;
        this.m_triangleListDecoder.SetStreamType(this.m_streamType);
        stats.m_streamSizeCoordIndex = iterator.m_count;
        timer.Tic();
        this.m_triangleListDecoder.Decode(ifs.GetCoordIndex(), ifs.GetNCoordIndex(), ifs.GetNCoord(), bstream, iterator);
        timer.Toc();
        stats.m_timeCoordIndex = timer.GetElapsedTime();
        stats.m_streamSizeCoordIndex = iterator.m_count - stats.m_streamSizeCoordIndex;
        // decode coord
        stats.m_streamSizeCoord = iterator.m_count;
        timer.Tic();
        if (ifs.GetNCoord() > 0) {
            ret = this.DecodeFloatArray(ifs.GetCoord(), ifs.GetNCoord(), 3, 3, ifs.GetCoordMinArray(), ifs.GetCoordMaxArray(), params.GetCoordQuantBits(), ifs, predMode, bstream);
            params.SetCoordPredMode(predMode.m_value);
        }
        if (ret !== module.O3DGC_OK) {
            return ret;
        }
        timer.Toc();
        stats.m_timeCoord = timer.GetElapsedTime();
        stats.m_streamSizeCoord = iterator.m_count - stats.m_streamSizeCoord;

        // decode Normal
        stats.m_streamSizeNormal = iterator.m_count;
        timer.Tic();
        if (ifs.GetNNormal() > 0) {
            ret = this.DecodeFloatArray(ifs.GetNormal(), ifs.GetNNormal(), 3, 3, ifs.GetNormalMinArray(), ifs.GetNormalMaxArray(), params.GetNormalQuantBits(), ifs, predMode, bstream);
            params.SetNormalPredMode(predMode.m_value);
        }
        if (ret !== module.O3DGC_OK) {
            return ret;
        }
        timer.Toc();
        stats.m_timeNormal = timer.GetElapsedTime();
        stats.m_streamSizeNormal = iterator.m_count - stats.m_streamSizeNormal;

        // decode FloatAttributes
        for (a = 0; a < ifs.GetNumFloatAttributes(); ++a) {
            stats.m_streamSizeFloatAttribute[a] = iterator.m_count;
            timer.Tic();
            ret = this.DecodeFloatArray(ifs.GetFloatAttribute(a), ifs.GetNFloatAttribute(a), ifs.GetFloatAttributeDim(a), ifs.GetFloatAttributeDim(a), ifs.GetFloatAttributeMinArray(a), ifs.GetFloatAttributeMaxArray(a), params.GetFloatAttributeQuantBits(a), ifs, predMode, bstream);
            params.SetFloatAttributePredMode(a, predMode.m_value);
            timer.Toc();
            stats.m_timeFloatAttribute[a] = timer.GetElapsedTime();
            stats.m_streamSizeFloatAttribute[a] = iterator.m_count - stats.m_streamSizeFloatAttribute[a];
        }
        if (ret !== module.O3DGC_OK) {
            return ret;
        }
        // decode IntAttributes
        for (a = 0; a < ifs.GetNumIntAttributes(); ++a) {
            stats.m_streamSizeIntAttribute[a] = iterator.m_count;
            timer.Tic();
            ret = this.DecodeIntArray(ifs.GetIntAttribute(a), ifs.GetNIntAttribute(a), ifs.GetIntAttributeDim(a), ifs.GetIntAttributeDim(a), ifs, predMode, bstream);
            params.SetIntAttributePredMode(a, predMode.m_value);
            timer.Toc();
            stats.m_timeIntAttribute[a] = timer.GetElapsedTime();
            stats.m_streamSizeIntAttribute[a] = iterator.m_count - stats.m_streamSizeIntAttribute[a];
        }
        if (ret !== module.O3DGC_OK) {
            return ret;
        }
        timer.Tic();
        this.m_triangleListDecoder.Reorder();
        timer.Toc();
        stats.m_timeReorder = timer.GetElapsedTime();
        return ret;
    };
    // DVEncodeParams class
    module.DVEncodeParams = function () {
        this.m_encodeMode = local.O3DGC_DYNAMIC_VECTOR_ENCODE_MODE_LIFT;
        this.m_streamTypeMode = local.O3DGC_STREAM_TYPE_ASCII;
        this.m_quantBits = 10;
    };
    module.DVEncodeParams.prototype.GetStreamType = function () {
        return this.m_streamTypeMode;
    };
    module.DVEncodeParams.prototype.GetEncodeMode = function () {
        return this.m_encodeMode;
    };
    module.DVEncodeParams.prototype.GetQuantBits = function () {
        return this.m_quantBits;
    };
    module.DVEncodeParams.prototype.SetStreamType = function (streamTypeMode) {
        this.m_streamTypeMode = streamTypeMode;
    };
    module.DVEncodeParams.prototype.SetEncodeMode = function (encodeMode) {
        this.m_encodeMode = encodeMode;
    };
    module.DVEncodeParams.prototype.SetQuantBits = function (quantBits) {
        this.m_quantBits = quantBits;
    };
    // DynamicVector class
    module.DynamicVector = function () {
        this.m_num = 0;
        this.m_dim = 0;
        this.m_stride = 0;
        this.m_max = {};
        this.m_min = {};
        this.m_vectors = {};
    };
    module.DynamicVector.prototype.GetNVector = function () {
        return this.m_num;
    };
    module.DynamicVector.prototype.GetDimVector = function () {
        return this.m_dim;
    };
    module.DynamicVector.prototype.GetStride = function () {
        return this.m_stride;
    };
    module.DynamicVector.prototype.GetMinArray = function () {
        return this.m_min;
    };
    module.DynamicVector.prototype.GetMaxArray = function () {
        return this.m_max;
    };
    module.DynamicVector.prototype.GetVectors = function () {
        return this.m_vectors;
    };
    module.DynamicVector.prototype.GetMin = function (j) {
        return this.m_min[j];
    };
    module.DynamicVector.prototype.GetMax = function (j) {
        return this.m_max[j];
    };
    module.DynamicVector.prototype.SetNVector = function (num) {
        this.m_num = num;
    };
    module.DynamicVector.prototype.SetDimVector = function (dim) {
        this.m_dim = dim;
    };
    module.DynamicVector.prototype.SetStride = function (stride) {
        this.m_stride = stride;
    };
    module.DynamicVector.prototype.SetMinArray = function (min) {
        this.m_min = min;
    };
    module.DynamicVector.prototype.SetMaxArray = function (max) {
        this.m_max = max;
    };
    module.DynamicVector.prototype.SetMin = function (j, min) {
        this.m_min[j] = min;
    };
    module.DynamicVector.prototype.SetMax = function (j, max) {
        this.m_max[j] = max;
    };
    module.DynamicVector.prototype.SetVectors = function (vectors) {
        this.m_vectors = vectors;
    };
    // DynamicVectorDecoder class
    module.DynamicVectorDecoder = function () {
        this.m_streamSize = 0;
        this.m_maxNumVectors = 0;
        this.m_numVectors = 0;
        this.m_dimVectors = 0;
        this.m_quantVectors = {};
        this.m_iterator = new module.Iterator();
        this.m_streamType = local.O3DGC_STREAM_TYPE_UNKOWN;
        this.m_params = new module.DVEncodeParams();
    };
    module.DynamicVectorDecoder.prototype.GetStreamType = function () {
        return this.m_streamType;
    };
    module.DynamicVectorDecoder.prototype.GetIterator = function () {
        return this.m_iterator;
    };
    module.DynamicVectorDecoder.prototype.SetStreamType = function (streamType) {
        this.m_streamType = streamType;
    };
    module.DynamicVectorDecoder.prototype.SetIterator = function (iterator) {
        this.m_iterator = iterator;
    };
    module.DynamicVectorDecoder.prototype.IUpdate = function (data, shift, size) {
        var p, size1;
        size1 = size - 1;
        p = 2;
        data[shift] -= data[shift + 1] >> 1;
        while (p < size1) {
            data[shift + p] -= (data[shift + p - 1] + data[shift + p + 1] + 2) >> 2;
            p += 2;
        }
        if (p === size1) {
            data[shift + p] -= data[shift + p - 1] >> 1;
        }
        return module.O3DGC_OK;
    };
    module.DynamicVectorDecoder.prototype.IPredict = function (data, shift, size) {
        var p, size1;
        size1 = size - 1;
        p = 1;
        while (p < size1) {
            data[shift + p] += (data[shift + p - 1] + data[shift + p + 1] + 1) >> 1;
            p += 2;
        }
        if (p === size1) {
            data[shift + p] += data[shift + p - 1];
        }
        return module.O3DGC_OK;
    };
    module.DynamicVectorDecoder.prototype.Merge = function (data, shift, size) {
        var i, h, a, b, tmp;
        h = (size >> 1) + (size & 1);
        a = h - 1;
        b = h;
        while (a > 0) {
            for (i = a; i < b; i += 2) {
                tmp = data[shift + i];
                data[shift + i] = data[shift + i + 1];
                data[shift + i + 1] = tmp;
            }
            --a;
            ++b;
        }
        return module.O3DGC_OK;
    };
    module.DynamicVectorDecoder.prototype.ITransform = function (data, shift, size) {
        var n, even, k, i;
        n = size;
        even = 0;
        k = 0;
        even += ((n & 1) << k++) >>> 0;
        while (n > 1) {
            n = (n >> 1) + ((n & 1) >>> 0);
            even += ((n & 1) << k++) >>> 0;
        }
        for (i = k - 2; i >= 0; --i) {
            n = ((n << 1) >>> 0) - (((even >>> i) & 1)) >>> 0;
            this.Merge(data, shift, n);
            this.IUpdate(data, shift, n);
            this.IPredict(data, shift, n);
        }
        return module.O3DGC_OK;
    };
    module.DynamicVectorDecoder.prototype.IQuantize = function (floatArray,
                                                       numFloatArray,
                                                       dimFloatArray,
                                                       stride,
                                                       minFloatArray,
                                                       maxFloatArray,
                                                       nQBits) {
        var quantVectors, r, idelta, size, d, v;
        quantVectors = this.m_quantVectors;
        size = numFloatArray * dimFloatArray;
        for (d = 0; d < dimFloatArray; ++d) {
            r = maxFloatArray[d] - minFloatArray[d];
            if (r > 0.0) {
                idelta = r / (((1 << nQBits) >>> 0) - 1);
            } else {
                idelta = 1.0;
            }
            for (v = 0; v < numFloatArray; ++v) {
                floatArray[v * stride + d] = quantVectors[v + d * numFloatArray] * idelta + minFloatArray[d];
            }
        }
        return module.O3DGC_OK;
    };
    module.DynamicVectorDecoder.prototype.DecodeHeader = function (dynamicVector, bstream) {
        var iterator, c0, start_code, streamType;
        iterator = this.m_iterator;
        c0 = iterator.m_count;
        start_code = bstream.ReadUInt32(iterator, local.O3DGC_STREAM_TYPE_BINARY);
        if (start_code !== local.O3DGC_DV_START_CODE) {
            iterator.m_count = c0;
            start_code = bstream.ReadUInt32(iterator, local.O3DGC_STREAM_TYPE_ASCII);
            if (start_code !== local.O3DGC_DV_START_CODE) {
                return module.O3DGC_ERROR_CORRUPTED_STREAM;
            }
            this.m_streamType = local.O3DGC_STREAM_TYPE_ASCII;
        } else {
            this.m_streamType = local.O3DGC_STREAM_TYPE_BINARY;
        }
        streamType = this.m_streamType;
        this.m_streamSize = bstream.ReadUInt32(iterator, streamType);
        this.m_params.SetEncodeMode(bstream.ReadUChar(iterator, streamType));
        dynamicVector.SetNVector(bstream.ReadUInt32(iterator, streamType));
        if (dynamicVector.GetNVector() > 0) {
            dynamicVector.SetDimVector(bstream.ReadUInt32(iterator, streamType));
            this.m_params.SetQuantBits(bstream.ReadUChar(iterator, streamType));
        }
        return module.O3DGC_OK;
    };
    module.DynamicVectorDecoder.prototype.DecodePlayload = function (dynamicVector, bstream) {
        var size, iterator, streamType, ret, start, streamSize, dim, num, j, acd, bModel0, bModel1, exp_k, M, buffer, mModelValues, quantVectors, v, d;
        iterator = this.m_iterator;
        streamType = this.m_streamType;
        ret = module.O3DGC_OK;
        start = iterator.m_count;
        streamSize = bstream.ReadUInt32(iterator, streamType);
        dim = dynamicVector.GetDimVector();
        num = dynamicVector.GetNVector();
        size = dim * num;
        for (j = 0; j < dynamicVector.GetDimVector(); ++j) {
            dynamicVector.SetMin(j, bstream.ReadFloat32(iterator, streamType));
            dynamicVector.SetMax(j, bstream.ReadFloat32(iterator, streamType));
        }
        acd = new module.ArithmeticDecoder();
        bModel0 = new module.StaticBitModel();
        bModel1 = new module.AdaptiveBitModel();
        streamSize -= (iterator.m_count - start);
        exp_k = 0;
        M = 0;
        if (streamType === local.O3DGC_STREAM_TYPE_BINARY) {
            buffer = bstream.GetBuffer(iterator, streamSize);
            iterator.m_count += streamSize;
            acd.SetBuffer(streamSize, buffer);
            acd.StartDecoder();
            exp_k = acd.ExpGolombDecode(0, bModel0, bModel1);
            M = acd.ExpGolombDecode(0, bModel0, bModel1);
        }
        mModelValues = new module.AdaptiveDataModel();
        mModelValues.SetAlphabet(M + 2);
        if (this.m_maxNumVectors < size) {
            this.m_maxNumVectors = size;
            this.m_quantVectors = new Int32Array(this.m_maxNumVectors);
        }
        quantVectors = this.m_quantVectors;
        if (streamType === local.O3DGC_STREAM_TYPE_ASCII) {
            for (v = 0; v < num; ++v) {
                for (d = 0; d < dim; ++d) {
                    quantVectors[d * num + v] = bstream.ReadIntASCII(iterator);
                }
            }
        } else {
            for (v = 0; v < num; ++v) {
                for (d = 0; d < dim; ++d) {
                    quantVectors[d * num + v] = acd.DecodeIntACEGC(mModelValues, bModel0, bModel1, exp_k, M);
                }
            }
        }
        for (d = 0; d < dim; ++d) {
            this.ITransform(quantVectors, d * num, num);
        }
        this.IQuantize(dynamicVector.GetVectors(), num, dim,
                       dynamicVector.GetStride(), dynamicVector.GetMinArray(),
                       dynamicVector.GetMaxArray(), this.m_params.GetQuantBits());
        return ret;
    };

    return module;
})();


/**
 * 	SEA3D - o3dgc
 * 	@author Sunag / http://www.sunag.com.br/
 */

//'use strict';

//
//	Lossy Compression
//

SEA3D.GeometryGC = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	var i;
	var attrib = data.readUShort();
	var uvIDs = [], jointID, weightID;

	this.isBig = ( attrib & 1 ) != 0;

	data.readVInt = this.isBig ? data.readUInt : data.readUShort;

	// Geometry Flags
	// ..
	// 1 isBig
	// 2 groups
	// 4 uv
	// 8 tangent
	// 16 colors
	// 32 joints
	// 64 morph
	// 128 vertex-animation
	// ..

	if ( attrib & 2 ) {

		this.groups = [];

		var numGroups = data.readUByte(),
			groupOffset = 0;

		for ( i = 0; i < numGroups; i ++ )		{

			var groupLength = data.readVInt() * 3;

			this.groups.push( {
				start: groupOffset,
				count: groupLength,
			} );

			groupOffset += groupLength;

		}

	} else {

		this.groups = [];

	}

	if ( attrib & 4 ) {

		this.uv = [];

		var uvCount = data.readUByte();

		for ( i = 0; i < uvCount; i ++ ) {

			uvIDs[ i ] = data.readUByte();

		}

	}

	if ( attrib & 32 ) {

		jointID = data.readUByte();
		weightID = data.readUByte();

	}

	var size = data.readUInt();
	var bytes = data.concat( data.position, size );

	var bstream = new o3dgc.BinaryStream( bytes.buffer );

	var decoder = new o3dgc.SC3DMCDecoder();
	var ifs = new o3dgc.IndexedFaceSet();

	decoder.DecodeHeader( ifs, bstream );

	var numIndexes = ifs.GetNCoordIndex();
	var numVertex = ifs.GetNCoord();

	if ( ! this.groups.length ) this.groups.push( { start: 0, count: numIndexes * 3 } );

	this.indexes = this.isBig ? new Uint32Array( numIndexes * 3 ) : new Uint16Array( numIndexes * 3 );
	this.vertex = new Float32Array( numVertex * 3 );

	ifs.SetCoordIndex( this.indexes );
	ifs.SetCoord( this.vertex );

	if ( ifs.GetNNormal() > 0 ) {

		this.normal = new Float32Array( numVertex * 3 );
		ifs.SetNormal( this.normal );

	}

	for ( i = 0; i < uvIDs.length; i ++ ) {

		this.uv[ i ] = new Float32Array( numVertex * 2 );
		ifs.SetFloatAttribute( uvIDs[ i ], this.uv[ i ] );

	}

	if ( jointID !== undefined ) {

		this.jointPerVertex = ifs.GetIntAttributeDim( jointID );

		this.joint = new Uint16Array( numVertex * this.jointPerVertex );
		this.weight = new Float32Array( numVertex * this.jointPerVertex );

		ifs.SetIntAttribute( jointID, this.joint );
		ifs.SetFloatAttribute( weightID, this.weight );

	}

	// decode mesh

	decoder.DecodePlayload( ifs, bstream );

};

SEA3D.GeometryGC.prototype.type = "s3D";

//
//	Geometry Update
//

SEA3D.GeometryUpdateGC = function ( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.index = data.readUInt();
	this.bytes = data.concat( data.position, data.length - data.position );

};

SEA3D.GeometryUpdateGC.prototype.type = "us3D";

//
//	Updaters
//

THREE.SEA3D.prototype.readGeometryUpdateGC = function ( sea ) {

	var obj = this.file.objects[ sea.index ],
		geo = obj.tag;

	var seaUpdate = new SEA3D.GeometryGC( "", sea.bytes, sea.sea3d );
	seaUpdate.tag = geo;

	this.readGeometryBuffer( seaUpdate );

};

//
//	Extension
//

THREE.SEA3D.EXTENSIONS_LOADER.push( {

	setTypeRead: function () {

		this.file.addClass( SEA3D.GeometryGC, true );
		this.file.addClass( SEA3D.GeometryUpdateGC, true );

		this.file.typeRead[ SEA3D.GeometryGC.prototype.type ] = this.readGeometryBuffer;
		this.file.typeRead[ SEA3D.GeometryUpdateGC.prototype.type ] = this.readGeometryUpdateGC;

	}

} );

