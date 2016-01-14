var THREE;
var list;
var extensions;
var numDiv;
var data;
//var ARRAY32
//if(!ARRAY32) ARRAY32 = (typeof Float32Array !== 'undefined') ? Float32Array : Array;

var ARRAY8
if(!ARRAY8) ARRAY8 = (typeof Uint8Array !== 'undefined') ? Uint8Array : Array;


function Perlin(random) {
    this.F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    this.G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    if (!random) random = Math.random;
    this.p = new ARRAY8(256);
    this.perm = new ARRAY8(512);
    this.permMod12 = new ARRAY8(512);
    for (var i = 0; i < 256; i++) {
        this.p[i] = random() * 256;
    }
    for (i = 0; i < 512; i++) {
        this.perm[i] = this.p[i & 255];
        this.permMod12[i] = this.perm[i] % 12;
    }
};

Perlin.prototype = {
    grad3: new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]),
    noise: function (xin, yin) {
        var permMod12 = this.permMod12, perm = this.perm, grad3 = this.grad3;
        var n0=0, n1=0, n2=0;
        var s = (xin + yin) * this.F2;
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var t = (i + j) * this.G2;
        var X0 = i - t;
        var Y0 = j - t;
        var x0 = xin - X0;
        var y0 = yin - Y0;
        var i1, j1;
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        }
        else {
            i1 = 0;
            j1 = 1;
        }
        var x1 = x0 - i1 + this.G2;
        var y1 = y0 - j1 + this.G2;
        var x2 = x0 - 1.0 + 2.0 * this.G2;
        var y2 = y0 - 1.0 + 2.0 * this.G2;
        var ii = i & 255;
        var jj = j & 255;
        var t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
            var gi0 = permMod12[ii + perm[jj]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0);
        }
        var t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) {
            var gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
        }
        var t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) {
            var gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
        }
        // return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2);
    }
};
/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.MorphAnimMesh = function ( geometry, material ) {

	THREE.Mesh.call( this, geometry, material );

	this.type = 'MorphAnimMesh';

	this.mixer = new THREE.AnimationMixer( this );
	this.activeAction = null;
};

THREE.MorphAnimMesh.prototype = Object.create( THREE.Mesh.prototype );
THREE.MorphAnimMesh.prototype.constructor = THREE.MorphAnimMesh;

THREE.MorphAnimMesh.prototype.setDirectionForward = function () {

	this.mixer.timeScale = 1.0;

};

THREE.MorphAnimMesh.prototype.setDirectionBackward = function () {

	this.mixer.timeScale = -1.0;

};

THREE.MorphAnimMesh.prototype.playAnimation = function ( label, fps ) {

	if( this.activeAction ) {

		this.activeAction.stop();
		this.activeAction = null;
		
	}

	var clip = THREE.AnimationClip.findByName( this.geometry.animations, label );

	if ( clip ) {

		var action = this.mixer.clipAction( clip );
		action.timeScale = ( clip.tracks.length * fps ) / clip.duration;
		this.activeAction = action.play();

	} else {

		throw new Error( 'THREE.MorphAnimMesh: animations[' + label + '] undefined in .playAnimation()' );

	}

};

THREE.MorphAnimMesh.prototype.updateAnimation = function ( delta ) {

	this.mixer.update( delta );

};

THREE.MorphAnimMesh.prototype.copy = function ( source ) {

	THREE.Mesh.prototype.copy.call( this, source );

	this.mixer = new THREE.AnimationMixer( this );

	return this;

};

/**
 * @author mikael emtinger / http://gomo.se/
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 */

THREE.Animation = function ( root, data ) {

	this.root = root;
	this.data = THREE.AnimationHandler.init( data );
	this.hierarchy = THREE.AnimationHandler.parse( root );

	this.currentTime = 0;
	this.timeScale = 1;

	this.isPlaying = false;
	this.loop = true;
	this.weight = 0;

	this.interpolationType = THREE.AnimationHandler.LINEAR;

};

THREE.Animation.prototype = {

	constructor: THREE.Animation,

	keyTypes:  [ "pos", "rot", "scl" ],

	play: function ( startTime, weight ) {

		this.currentTime = startTime !== undefined ? startTime : 0;
		this.weight = weight !== undefined ? weight : 1;

		this.isPlaying = true;

		this.reset();

		THREE.AnimationHandler.play( this );

	},

	stop: function() {

		this.isPlaying = false;

		THREE.AnimationHandler.stop( this );

	},

	reset: function () {

		for ( var h = 0, hl = this.hierarchy.length; h < hl; h ++ ) {

			var object = this.hierarchy[ h ];

			if ( object.animationCache === undefined ) {

				object.animationCache = {
					animations: {},
					blending: {
						positionWeight: 0.0,
						quaternionWeight: 0.0,
						scaleWeight: 0.0
					}
				};

			}

			var name = this.data.name;
			var animations = object.animationCache.animations;
			var animationCache = animations[ name ];

			if ( animationCache === undefined ) {

				animationCache = {
					prevKey: { pos: 0, rot: 0, scl: 0 },
					nextKey: { pos: 0, rot: 0, scl: 0 },
					originalMatrix: object.matrix
				};

				animations[ name ] = animationCache;

			}

			// Get keys to match our current time

			for ( var t = 0; t < 3; t ++ ) {

				var type = this.keyTypes[ t ];

				var prevKey = this.data.hierarchy[ h ].keys[ 0 ];
				var nextKey = this.getNextKeyWith( type, h, 1 );

				while ( nextKey.time < this.currentTime && nextKey.index > prevKey.index ) {

					prevKey = nextKey;
					nextKey = this.getNextKeyWith( type, h, nextKey.index + 1 );

				}

				animationCache.prevKey[ type ] = prevKey;
				animationCache.nextKey[ type ] = nextKey;

			}

		}

	},

	resetBlendWeights: function () {

		for ( var h = 0, hl = this.hierarchy.length; h < hl; h ++ ) {

			var object = this.hierarchy[ h ];
			var animationCache = object.animationCache;

			if ( animationCache !== undefined ) {

				var blending = animationCache.blending;

				blending.positionWeight = 0.0;
				blending.quaternionWeight = 0.0;
				blending.scaleWeight = 0.0;

			}

		}

	},

	update: ( function() {

		var points = [];
		var target = new THREE.Vector3();
		var newVector = new THREE.Vector3();
		var newQuat = new THREE.Quaternion();

		// Catmull-Rom spline

		var interpolateCatmullRom = function ( points, scale ) {

			var c = [], v3 = [],
			point, intPoint, weight, w2, w3,
			pa, pb, pc, pd;

			point = ( points.length - 1 ) * scale;
			intPoint = Math.floor( point );
			weight = point - intPoint;

			c[ 0 ] = intPoint === 0 ? intPoint : intPoint - 1;
			c[ 1 ] = intPoint;
			c[ 2 ] = intPoint > points.length - 2 ? intPoint : intPoint + 1;
			c[ 3 ] = intPoint > points.length - 3 ? intPoint : intPoint + 2;

			pa = points[ c[ 0 ] ];
			pb = points[ c[ 1 ] ];
			pc = points[ c[ 2 ] ];
			pd = points[ c[ 3 ] ];

			w2 = weight * weight;
			w3 = weight * w2;

			v3[ 0 ] = interpolate( pa[ 0 ], pb[ 0 ], pc[ 0 ], pd[ 0 ], weight, w2, w3 );
			v3[ 1 ] = interpolate( pa[ 1 ], pb[ 1 ], pc[ 1 ], pd[ 1 ], weight, w2, w3 );
			v3[ 2 ] = interpolate( pa[ 2 ], pb[ 2 ], pc[ 2 ], pd[ 2 ], weight, w2, w3 );

			return v3;

		};

		var interpolate = function ( p0, p1, p2, p3, t, t2, t3 ) {

			var v0 = ( p2 - p0 ) * 0.5,
				v1 = ( p3 - p1 ) * 0.5;

			return ( 2 * ( p1 - p2 ) + v0 + v1 ) * t3 + ( - 3 * ( p1 - p2 ) - 2 * v0 - v1 ) * t2 + v0 * t + p1;

		};

		return function ( delta ) {

			if ( this.isPlaying === false ) return;

			this.currentTime += delta * this.timeScale;

			if ( this.weight === 0 )
				return;

			//

			var duration = this.data.length;

			if ( this.currentTime > duration || this.currentTime < 0 ) {

				if ( this.loop ) {

					this.currentTime %= duration;

					if ( this.currentTime < 0 )
						this.currentTime += duration;

					this.reset();

				} else {

					this.stop();

				}

			}

			for ( var h = 0, hl = this.hierarchy.length; h < hl; h ++ ) {

				var object = this.hierarchy[ h ];
				var animationCache = object.animationCache.animations[ this.data.name ];
				var blending = object.animationCache.blending;

				// loop through pos/rot/scl

				for ( var t = 0; t < 3; t ++ ) {

					// get keys

					var type    = this.keyTypes[ t ];
					var prevKey = animationCache.prevKey[ type ];
					var nextKey = animationCache.nextKey[ type ];

					if ( ( this.timeScale > 0 && nextKey.time <= this.currentTime ) ||
						( this.timeScale < 0 && prevKey.time >= this.currentTime ) ) {

						prevKey = this.data.hierarchy[ h ].keys[ 0 ];
						nextKey = this.getNextKeyWith( type, h, 1 );

						while ( nextKey.time < this.currentTime && nextKey.index > prevKey.index ) {

							prevKey = nextKey;
							nextKey = this.getNextKeyWith( type, h, nextKey.index + 1 );

						}

						animationCache.prevKey[ type ] = prevKey;
						animationCache.nextKey[ type ] = nextKey;

					}

					var scale = ( this.currentTime - prevKey.time ) / ( nextKey.time - prevKey.time );

					var prevXYZ = prevKey[ type ];
					var nextXYZ = nextKey[ type ];

					if ( scale < 0 ) scale = 0;
					if ( scale > 1 ) scale = 1;

					// interpolate

					if ( type === "pos" ) {

						if ( this.interpolationType === THREE.AnimationHandler.LINEAR ) {

							newVector.x = prevXYZ[ 0 ] + ( nextXYZ[ 0 ] - prevXYZ[ 0 ] ) * scale;
							newVector.y = prevXYZ[ 1 ] + ( nextXYZ[ 1 ] - prevXYZ[ 1 ] ) * scale;
							newVector.z = prevXYZ[ 2 ] + ( nextXYZ[ 2 ] - prevXYZ[ 2 ] ) * scale;

							// blend
							var proportionalWeight = this.weight / ( this.weight + blending.positionWeight );
							object.position.lerp( newVector, proportionalWeight );
							blending.positionWeight += this.weight;

						} else if ( this.interpolationType === THREE.AnimationHandler.CATMULLROM ||
									this.interpolationType === THREE.AnimationHandler.CATMULLROM_FORWARD ) {

							points[ 0 ] = this.getPrevKeyWith( "pos", h, prevKey.index - 1 )[ "pos" ];
							points[ 1 ] = prevXYZ;
							points[ 2 ] = nextXYZ;
							points[ 3 ] = this.getNextKeyWith( "pos", h, nextKey.index + 1 )[ "pos" ];

							scale = scale * 0.33 + 0.33;

							var currentPoint = interpolateCatmullRom( points, scale );
							var proportionalWeight = this.weight / ( this.weight + blending.positionWeight );
							blending.positionWeight += this.weight;

							// blend

							var vector = object.position;

							vector.x = vector.x + ( currentPoint[ 0 ] - vector.x ) * proportionalWeight;
							vector.y = vector.y + ( currentPoint[ 1 ] - vector.y ) * proportionalWeight;
							vector.z = vector.z + ( currentPoint[ 2 ] - vector.z ) * proportionalWeight;

							if ( this.interpolationType === THREE.AnimationHandler.CATMULLROM_FORWARD ) {

								var forwardPoint = interpolateCatmullRom( points, scale * 1.01 );

								target.set( forwardPoint[ 0 ], forwardPoint[ 1 ], forwardPoint[ 2 ] );
								target.sub( vector );
								target.y = 0;
								target.normalize();

								var angle = Math.atan2( target.x, target.z );
								object.rotation.set( 0, angle, 0 );

							}

						}

					} else if ( type === "rot" ) {

						THREE.Quaternion.slerp( prevXYZ, nextXYZ, newQuat, scale );

						// Avoid paying the cost of an additional slerp if we don't have to
						if ( blending.quaternionWeight === 0 ) {

							object.quaternion.copy( newQuat );
							blending.quaternionWeight = this.weight;

						} else {

							var proportionalWeight = this.weight / ( this.weight + blending.quaternionWeight );
							THREE.Quaternion.slerp( object.quaternion, newQuat, object.quaternion, proportionalWeight );
							blending.quaternionWeight += this.weight;

						}

					} else if ( type === "scl" ) {

						newVector.x = prevXYZ[ 0 ] + ( nextXYZ[ 0 ] - prevXYZ[ 0 ] ) * scale;
						newVector.y = prevXYZ[ 1 ] + ( nextXYZ[ 1 ] - prevXYZ[ 1 ] ) * scale;
						newVector.z = prevXYZ[ 2 ] + ( nextXYZ[ 2 ] - prevXYZ[ 2 ] ) * scale;

						var proportionalWeight = this.weight / ( this.weight + blending.scaleWeight );
						object.scale.lerp( newVector, proportionalWeight );
						blending.scaleWeight += this.weight;

					}

				}

			}

			return true;

		};

	} )(),

	getNextKeyWith: function ( type, h, key ) {

		var keys = this.data.hierarchy[ h ].keys;

		if ( this.interpolationType === THREE.AnimationHandler.CATMULLROM ||
			 this.interpolationType === THREE.AnimationHandler.CATMULLROM_FORWARD ) {

			key = key < keys.length - 1 ? key : keys.length - 1;

		} else {

			key = key % keys.length;

		}

		for ( ; key < keys.length; key ++ ) {

			if ( keys[ key ][ type ] !== undefined ) {

				return keys[ key ];

			}

		}

		return this.data.hierarchy[ h ].keys[ 0 ];

	},

	getPrevKeyWith: function ( type, h, key ) {

		var keys = this.data.hierarchy[ h ].keys;

		if ( this.interpolationType === THREE.AnimationHandler.CATMULLROM ||
			this.interpolationType === THREE.AnimationHandler.CATMULLROM_FORWARD ) {

			key = key > 0 ? key : 0;

		} else {

			key = key >= 0 ? key : key + keys.length;

		}


		for ( ; key >= 0; key -- ) {

			if ( keys[ key ][ type ] !== undefined ) {

				return keys[ key ];

			}

		}

		return this.data.hierarchy[ h ].keys[ keys.length - 1 ];

	}

};

/**
 * @author mikael emtinger / http://gomo.se/
 */

THREE.AnimationHandler = {

	LINEAR: 0,
	CATMULLROM: 1,
	CATMULLROM_FORWARD: 2,

	//

	add: function () {

		console.warn( 'THREE.AnimationHandler.add() has been deprecated.' );

	},
	get: function () {

		console.warn( 'THREE.AnimationHandler.get() has been deprecated.' );

	},
	remove: function () {

		console.warn( 'THREE.AnimationHandler.remove() has been deprecated.' );

	},

	//

	animations: [],

	init: function ( data ) {

		if ( data.initialized === true ) return data;

		// loop through all keys

		for ( var h = 0; h < data.hierarchy.length; h ++ ) {

			for ( var k = 0; k < data.hierarchy[ h ].keys.length; k ++ ) {

				// remove minus times

				if ( data.hierarchy[ h ].keys[ k ].time < 0 ) {

					 data.hierarchy[ h ].keys[ k ].time = 0;

				}

				// create quaternions

				if ( data.hierarchy[ h ].keys[ k ].rot !== undefined &&
				  ! ( data.hierarchy[ h ].keys[ k ].rot instanceof THREE.Quaternion ) ) {

					var quat = data.hierarchy[ h ].keys[ k ].rot;
					data.hierarchy[ h ].keys[ k ].rot = new THREE.Quaternion().fromArray( quat );

				}

			}

			// prepare morph target keys

			if ( data.hierarchy[ h ].keys.length && data.hierarchy[ h ].keys[ 0 ].morphTargets !== undefined ) {

				// get all used

				var usedMorphTargets = {};

				for ( var k = 0; k < data.hierarchy[ h ].keys.length; k ++ ) {

					for ( var m = 0; m < data.hierarchy[ h ].keys[ k ].morphTargets.length; m ++ ) {

						var morphTargetName = data.hierarchy[ h ].keys[ k ].morphTargets[ m ];
						usedMorphTargets[ morphTargetName ] = - 1;

					}

				}

				data.hierarchy[ h ].usedMorphTargets = usedMorphTargets;


				// set all used on all frames

				for ( var k = 0; k < data.hierarchy[ h ].keys.length; k ++ ) {

					var influences = {};

					for ( var morphTargetName in usedMorphTargets ) {

						for ( var m = 0; m < data.hierarchy[ h ].keys[ k ].morphTargets.length; m ++ ) {

							if ( data.hierarchy[ h ].keys[ k ].morphTargets[ m ] === morphTargetName ) {

								influences[ morphTargetName ] = data.hierarchy[ h ].keys[ k ].morphTargetsInfluences[ m ];
								break;

							}

						}

						if ( m === data.hierarchy[ h ].keys[ k ].morphTargets.length ) {

							influences[ morphTargetName ] = 0;

						}

					}

					data.hierarchy[ h ].keys[ k ].morphTargetsInfluences = influences;

				}

			}


			// remove all keys that are on the same time

			for ( var k = 1; k < data.hierarchy[ h ].keys.length; k ++ ) {

				if ( data.hierarchy[ h ].keys[ k ].time === data.hierarchy[ h ].keys[ k - 1 ].time ) {

					data.hierarchy[ h ].keys.splice( k, 1 );
					k --;

				}

			}


			// set index

			for ( var k = 0; k < data.hierarchy[ h ].keys.length; k ++ ) {

				data.hierarchy[ h ].keys[ k ].index = k;

			}

		}

		data.initialized = true;

		return data;

	},

	parse: function ( root ) {

		var parseRecurseHierarchy = function ( root, hierarchy ) {

			hierarchy.push( root );

			for ( var c = 0; c < root.children.length; c ++ )
				parseRecurseHierarchy( root.children[ c ], hierarchy );

		};

		// setup hierarchy

		var hierarchy = [];

		if ( root instanceof THREE.SkinnedMesh ) {

			for ( var b = 0; b < root.skeleton.bones.length; b ++ ) {

				hierarchy.push( root.skeleton.bones[ b ] );

			}

		} else {

			parseRecurseHierarchy( root, hierarchy );

		}

		return hierarchy;

	},

	play: function ( animation ) {

		if ( this.animations.indexOf( animation ) === - 1 ) {

			this.animations.push( animation );

		}

	},

	stop: function ( animation ) {

		var index = this.animations.indexOf( animation );

		if ( index !== - 1 ) {

			this.animations.splice( index, 1 );

		}

	},

	update: function ( deltaTimeMS ) {

		for ( var i = 0; i < this.animations.length; i ++ ) {

			this.animations[ i ].resetBlendWeights();

		}

		for ( var i = 0; i < this.animations.length; i ++ ) {

			this.animations[ i ].update( deltaTimeMS );

		}

	}

};

/**
 * @author mikael emtinger / http://gomo.se/
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author khang duong
 * @author erik kitson
 */

THREE.KeyFrameAnimation = function ( data ) {

	this.root = data.node;
	this.data = THREE.AnimationHandler.init( data );
	this.hierarchy = THREE.AnimationHandler.parse( this.root );
	this.currentTime = 0;
	this.timeScale = 0.001;
	this.isPlaying = false;
	this.isPaused = true;
	this.loop = true;

	// initialize to first keyframes

	for ( var h = 0, hl = this.hierarchy.length; h < hl; h ++ ) {

		var keys = this.data.hierarchy[ h ].keys,
			sids = this.data.hierarchy[ h ].sids,
			obj = this.hierarchy[ h ];

		if ( keys.length && sids ) {

			for ( var s = 0; s < sids.length; s ++ ) {

				var sid = sids[ s ],
					next = this.getNextKeyWith( sid, h, 0 );

				if ( next ) {

					next.apply( sid );

				}

			}

			obj.matrixAutoUpdate = false;
			this.data.hierarchy[ h ].node.updateMatrix();
			obj.matrixWorldNeedsUpdate = true;

		}

	}

};

THREE.KeyFrameAnimation.prototype = {

	constructor: THREE.KeyFrameAnimation,

	play: function ( startTime ) {

		this.currentTime = startTime !== undefined ? startTime : 0;

		if ( this.isPlaying === false ) {

			this.isPlaying = true;

			// reset key cache

			var h, hl = this.hierarchy.length,
				object,
				node;

			for ( h = 0; h < hl; h ++ ) {

				object = this.hierarchy[ h ];
				node = this.data.hierarchy[ h ];

				if ( node.animationCache === undefined ) {

					node.animationCache = {};
					node.animationCache.prevKey = null;
					node.animationCache.nextKey = null;
					node.animationCache.originalMatrix = object.matrix;

				}

				var keys = this.data.hierarchy[ h ].keys;

				if ( keys.length > 1 ) {

					node.animationCache.prevKey = keys[ 0 ];
					node.animationCache.nextKey = keys[ 1 ];

					this.startTime = Math.min( keys[ 0 ].time, this.startTime );
					this.endTime = Math.max( keys[ keys.length - 1 ].time, this.endTime );

				}

			}

			this.update( 0 );

		}

		this.isPaused = false;
	},

	stop: function () {

		this.isPlaying = false;
		this.isPaused  = false;

		// reset JIT matrix and remove cache

		for ( var h = 0; h < this.data.hierarchy.length; h ++ ) {

			var obj = this.hierarchy[ h ];
			var node = this.data.hierarchy[ h ];

			if ( node.animationCache !== undefined ) {

				var original = node.animationCache.originalMatrix;

				original.copy( obj.matrix );
				obj.matrix = original;

				delete node.animationCache;

			}

		}

	},

	update: function ( delta ) {

		if ( this.isPlaying === false ) return;

		this.currentTime += delta * this.timeScale;

		//

		var duration = this.data.length;

		if ( this.loop === true && this.currentTime > duration ) {

			this.currentTime %= duration;

		}

		this.currentTime = Math.min( this.currentTime, duration );

		for ( var h = 0, hl = this.hierarchy.length; h < hl; h ++ ) {

			var object = this.hierarchy[ h ];
			var node = this.data.hierarchy[ h ];

			var keys = node.keys,
				animationCache = node.animationCache;


			if ( keys.length ) {

				var prevKey = animationCache.prevKey;
				var nextKey = animationCache.nextKey;

				if ( nextKey.time <= this.currentTime ) {

					while ( nextKey.time < this.currentTime && nextKey.index > prevKey.index ) {

						prevKey = nextKey;
						nextKey = keys[ prevKey.index + 1 ];

					}

					animationCache.prevKey = prevKey;
					animationCache.nextKey = nextKey;

				}

				if ( nextKey.time >= this.currentTime ) {

					prevKey.interpolate( nextKey, this.currentTime );

				} else {

					prevKey.interpolate( nextKey, nextKey.time );

				}

				this.data.hierarchy[ h ].node.updateMatrix();
				object.matrixWorldNeedsUpdate = true;

			}

		}

	},

	getNextKeyWith: function ( sid, h, key ) {

		var keys = this.data.hierarchy[ h ].keys;
		key = key % keys.length;

		for ( ; key < keys.length; key ++ ) {

			if ( keys[ key ].hasTarget( sid ) ) {

				return keys[ key ];

			}

		}

		return keys[ 0 ];

	},

	getPrevKeyWith: function ( sid, h, key ) {

		var keys = this.data.hierarchy[ h ].keys;
		key = key >= 0 ? key : key + keys.length;

		for ( ; key >= 0; key -- ) {

			if ( keys[ key ].hasTarget( sid ) ) {

				return keys[ key ];

			}

		}

		return keys[ keys.length - 1 ];

	}

};

/**
 * 	SEA3D SDK
 * 	@author Sunag / http://www.sunag.com.br/
 */

'use strict';

var SEA3D = { VERSION : 17000 }

SEA3D.getVersion = function() {

	// Max = 16777215 - VVSSBB  | V = Version | S = Subversion | B = Buildversion
	var v = SEA3D.VERSION.toString(), l = v.length;
	return v.substring( 0, l - 4 ) + "." + v.substring( l - 4, l - 3 ) + "." + v.substring( l - 3, l - 2 ) + "." + parseFloat( v.substring( l - 2, l ) ).toString();

};

console.log( 'SEA3D ' + SEA3D.getVersion() );

//
//	STREAM : STANDARD DATA-IO ( LITTLE-ENDIAN )
//

SEA3D.Stream = function( buffer ) {

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
	"normal", "add", "subtract", "multiply", "dividing", "alpha", "screen", "darken",
	"overlay", "colorburn", "linearburn", "lighten", "colordodge", "lineardodge",
	"softlight", "hardlight", "pinlight", "spotlight", "spotlightblend", "hardmix",
	"average", "difference", "exclusion", "hue", "saturation", "color", "value"
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

SEA3D.Stream.sizeOf = function( kind ) {

	if ( kind == 0 ) return 0;
	else if ( kind >= 1 && kind <= 31 ) return 1;
	else if ( kind >= 32 && kind <= 63 ) return 2;
	else if ( kind >= 64 && kind <= 95 ) return 3;
	else if ( kind >= 96 && kind <= 125 ) return 4;
	return - 1;

};

SEA3D.Stream.prototype = {
	constructor: SEA3D.Stream,

	set buffer ( val ) {

		this.buf = val;
		this.length = val.byteLength;
		this.data = new DataView( val );

	},

	get buffer () {

		return this.buf;

	},

	get bytesAvailable () {

		return this.length - this.position;

	}
};

SEA3D.Stream.prototype.getByte = function( pos ) {

	return this.data.getInt8( pos );

};

SEA3D.Stream.prototype.readBytes = function( len ) {

	var buf = this.buf.slice( this.position, this.position + len );
	this.position += len;
	return buf;

};

SEA3D.Stream.prototype.readByte = function() {

	return this.data.getInt8( this.position ++ );

};

SEA3D.Stream.prototype.readUByte = function() {

	return this.data.getUint8( this.position ++ );

};

SEA3D.Stream.prototype.readBool = function() {

	return this.data.getInt8( this.position ++ ) != 0;

};

SEA3D.Stream.prototype.readShort = function() {

	var v = this.data.getInt16( this.position, true );
	this.position += 2;
	return v;

};

SEA3D.Stream.prototype.readUShort = function() {

	var v = this.data.getUint16( this.position, true );
	this.position += 2;
	return v;

};

SEA3D.Stream.prototype.readUInt24 = function() {

	var v = this.data.getUint32( this.position, true ) & 0xFFFFFF;
	this.position += 3;
	return v;

};

SEA3D.Stream.prototype.readUInt24F = function() {

	return this.readUShort() | ( this.readUByte() << 16 );

};

SEA3D.Stream.prototype.readInt = function() {

	var v = this.data.getInt32( this.position, true );
	this.position += 4;
	return v;

};

SEA3D.Stream.prototype.readUInt = function() {

	var v = this.data.getUint32( this.position, true );
	this.position += 4;
	return v;

};

SEA3D.Stream.prototype.readFloat = function() {

	var v = this.data.getFloat32( this.position, true );
	this.position += 4;
	return v;

};

SEA3D.Stream.prototype.readUInteger = function() {

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

SEA3D.Stream.prototype.readVector2 = function() {

	return { x: this.readFloat(), y: this.readFloat() }

};

SEA3D.Stream.prototype.readVector3 = function() {

	return { x: this.readFloat(), y: this.readFloat(), z: this.readFloat() }

};

SEA3D.Stream.prototype.readVector4 = function() {

	return { x: this.readFloat(), y: this.readFloat(), z: this.readFloat(), w: this.readFloat() }

};

SEA3D.Stream.prototype.readMatrix = function() {

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

SEA3D.Stream.prototype.readUTF = function( len ) {

	return String.fromCharCode.apply( undefined, new Uint16Array( new Uint8Array( this.readBytes( len ) ) ) );

};

SEA3D.Stream.prototype.readExt = function() {

	return this.readUTF( 4 ).replace( /\0/g, "" );

};

SEA3D.Stream.prototype.readUTF8 = function() {

	return this.readUTF( this.readUByte() );

};

SEA3D.Stream.prototype.readUTF8Short = function() {

	return this.readUTF( this.readUShort() );

};

SEA3D.Stream.prototype.readUTF8Long = function() {

	return this.readUTF( this.readUInt() );

};

SEA3D.Stream.prototype.readUByteArray = function( length ) {

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

SEA3D.Stream.prototype.readUShortArray = function( length ) {

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

SEA3D.Stream.prototype.readUIntArray = function( length ) {

	var v = new Uint32Array( length ),
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

SEA3D.Stream.prototype.readFloatArray = function( length ) {

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


SEA3D.Stream.prototype.readBlendMode = function() {

	return SEA3D.Stream.BLEND_MODE[ this.readUByte() ];

};

SEA3D.Stream.prototype.readInterpolation = function() {

	return SEA3D.Stream.INTERPOLATION_TABLE[ this.readUByte() ];

};

SEA3D.Stream.prototype.readTags = function( callback ) {

	var numTag = this.readUByte();

	for ( var i = 0; i < numTag; ++ i ) {

		var kind = this.readUShort();
		var size = this.readUInt();
		var pos = this.position;

		callback( kind, data, size );

		this.position = pos += size;

	}

};

SEA3D.Stream.prototype.readProperties = function( sea3d ) {

	var count = this.readUByte(),
		props = {}, types = {};

	props.__type = types;

	for ( var i = 0; i < count; i ++ ) {

		var name = this.readUTF8(),
			type = this.readUByte();

		props[ name ] = this.readToken( type, sea3d );
		types[ name ] = type;

	}

	return props;

};

SEA3D.Stream.prototype.readAnimationList = function( sea3d ) {

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

SEA3D.Stream.prototype.readScriptList = function( sea3d ) {

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

				var name = this.readUTF8();

				script.params[ name ] = this.readObject( sea3d );

			}

		}

		if ( attrib & 8 ) {

			script.method = this.readUTF8();

		}

		script.tag = sea3d.getObject( this.readUInt() );

		list[ i ++ ] = script;

	}

	return list;

};

SEA3D.Stream.prototype.readObject = function( sea3d ) {

	return this.readToken( this.readUByte(), sea3d );

};

SEA3D.Stream.prototype.readToken = function( type, sea3d ) {

	switch ( type )
	{
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
			return this.readUTF8();
			break;

		case SEA3D.Stream.STRING_SHORT:
			return this.readUTF8Short();
			break;

		case SEA3D.Stream.STRING_LONG:
			return this.readUTF8Long();
			break

		case SEA3D.Stream.ASSET:
			var asset = this.readUInt();
			return asset > 0 ? sea3d.getObject( asset - 1 ).tag : null;
			break;

		default:
			console.error( "DataType not found!" );
			break;
	}

	return null;

};

SEA3D.Stream.prototype.readVector = function( type, length, offset ) {

	var size = SEA3D.Stream.sizeOf( type ),
		i = offset * size,
		count = i + ( length * size );

	switch ( type )
	{
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

SEA3D.Stream.prototype.append = function( data ) {

	var tmp = new ArrayBuffer( this.data.byteLength + data.byteLength );
	tmp.set( new ArrayBuffer( this.data ), 0 );
	tmp.set( new ArrayBuffer( data ), this.data.byteLength );
	this.data = tmp;

};

SEA3D.Stream.prototype.concat = function( position, length ) {

	return new SEA3D.Stream( this.buffer.slice( position, position + length ) );

};

/**
 * @author DataStream.js
 */

SEA3D.Stream.memcpy = function( dst, dstOffset, src, srcOffset, byteLength ) {

	var dstU8 = new Uint8Array( dst, dstOffset, byteLength );
	var srcU8 = new Uint8Array( src, srcOffset, byteLength );

	dstU8.set( srcU8 );

};

//
//	UByteArray
//

SEA3D.UByteArray = function() {

	this.ubytes = [];
	this.length = 0;

};

SEA3D.UByteArray.prototype = {
	constructor: SEA3D.UByteArray,

	add : function ( ubytes ) {

		this.ubytes.push( ubytes );
		this.length += ubytes.byteLength;

	},

	toBuffer : function () {

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
	DEGREES : 180 / Math.PI,
	RADIANS : Math.PI / 180
};

SEA3D.Math.angle = function( val ) {

	var ang = 180,
		inv = val < 0;

	val = ( inv ? - val : val ) % 360;

	if ( val > ang ) {

		val = - ang + ( val - ang );

	}

	return ( inv ? - val : val );

};

SEA3D.Math.lerpAngle = function( val, tar, t ) {

	if ( Math.abs( val - tar ) > 180 ) {

		if ( val > tar ) {

			tar += 360;

		}
		else {

			tar -= 360;

		}

	}

	val += ( tar - val ) * t;

	return SEA3D.Math.angle( val );

};

SEA3D.Math.lerpColor = function( val, tar, t ) {

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

SEA3D.Math.lerp = function( val, tar, t ) {

	return val + ( ( tar - val ) * t );

};

SEA3D.Math.lerp1x = function( val, tar, t ) {

	val[ 0 ] += ( tar[ 0 ] - val[ 0 ] ) * t;

};

SEA3D.Math.lerp3x = function( val, tar, t ) {

	val[ 0 ] += ( tar[ 0 ] - val[ 0 ] ) * t;
	val[ 1 ] += ( tar[ 1 ] - val[ 1 ] ) * t;
	val[ 2 ] += ( tar[ 2 ] - val[ 2 ] ) * t;

};

SEA3D.Math.lerpAng1x = function( val, tar, t ) {

	val[ 0 ] = SEA3D.Math.lerpAngle( val[ 0 ], tar[ 0 ], t );

};

SEA3D.Math.lerpColor1x = function( val, tar, t ) {

	val[ 0 ] = SEA3D.Math.lerpColor( val[ 0 ], tar[ 0 ], t );

};

SEA3D.Math.lerpQuat4x = function( val, tar, t ) {

	var x1 = val[ 0 ],
		y1 = val[ 1 ],
		z1 = val[ 2 ],
		w1 = val[ 3 ];

	var x2 = tar[ 0 ],
		y2 = tar[ 1 ],
		z2 = tar[ 2 ],
		w2 = tar[ 3 ];

	var x, y, z, w, l;

	// shortest direction
	if ( x1 * x2 + y1 * y2 + z1 * z2 + w1 * w2 < 0 ) {

		x2 = - x2;
		y2 = - y2;
		z2 = - z2;
		w2 = - w2;

	}

	x = x1 + t * ( x2 - x1 );
	y = y1 + t * ( y2 - y1 );
	z = z1 + t * ( z2 - z1 );
	w = w1 + t * ( w2 - w1 );

	l = 1.0 / Math.sqrt( w * w + x * x + y * y + z * z );
	val[ 0 ] = x * l;
	val[ 1 ] = y * l;
	val[ 2 ] = z * l;
	val[ 3 ] = w * l;

};

//
//	Timer
//

SEA3D.Timer = function() {

	this.time = this.start = Date.now();

};

SEA3D.Timer.prototype = {
	constructor: SEA3D.Timer,

	get now () {

		return Date.now();

	},

	get deltaTime () {

		return Date.now() - this.time;

	},

	get elapsedTime () {

		return Date.now() - this.start;

	},

	update: function () {

		this.time = Date.now();

	}
};

//
//	Blend Method
//

SEA3D.AnimationBlendMethod = {
	LINEAR : 'linear',
	EASING : 'easing'
};

//
//	Domain
//

SEA3D.Domain = function( id ) {

	this.id = id;
	this.scripts = [];
	this.global = {};
	this.events = new SEA3D.EventDispatcher();

};

SEA3D.Domain.prototype = {
	constructor: SEA3D.Domain,

	add : function( src ) {

		this.scripts.push( src );

	},

	remove : function( src ) {

		this.scripts.splice( this.scripts.indexOf( src ), 1 );

	},

	contains : function( src ) {

		return this.scripts.indexOf( src ) != - 1;

	},

	addEvent : function( type, listener ) {

		this.events.addEventListener( type, listener );

	},

	hasEvent : function( type, listener ) {

		return this.events.hasEventListener( type, listener );

	},

	removeEvent : function( type, listener ) {

		this.events.removeEventListener( type, listener );

	},

	print : function() {

		console.log.apply( console, arguments );

	},

	watch : function() {

		console.log.apply( console, 'watch:', arguments );

	},

	getReference : function( ns ) {

		return eval( ns );

	},

	dispatchEvent : function( event ) {

		event.domain = this;

		var scripts = this.scripts.concat(),
			i = scripts.length;

		while ( i -- ) {

			scripts[ i ].dispatchEvent( event );

		}

		this.events.dispatchEvent( event );

	},

	dispose : function() {

		var scripts = this.scripts.concat(),
			i = scripts.length;

		while ( i -- ) {

			scripts[ i ].dispose();

		}

		this.dispatchEvent( { type : "dispose" } );

	}
};

//
//	Domain Manager
//

SEA3D.DomainManager = function( autoDisposeRootDomain ) {

	this.domains = [];
	this.autoDisposeRootDomain = autoDisposeRootDomain == undefined ? true : false;

};

SEA3D.DomainManager.prototype = {
	constructor: SEA3D.DomainManager,

	onDisposeDomain : function( e ) {

		this.remove( e.domain );

		if ( this.autoDisposeRootDomain && this.domains.length == 1 ) {

			this.dispose();

		}

	},

	add : function( domain ) {

		this._onDisposeDomain = this._onDisposeDomain || this.onDisposeDomain.bind( this );

		domain.addEvent( "dispose", this._onDisposeDomain );

		this.domains.push( domain );

	},

	remove : function( domain ) {

		domain.removeEvent( "dispose", this._onDisposeDomain );

		this.domains.splice( this.domains.indexOf( domain ), 1 );

	},

	contains : function( domain ) {

		return this.domains.indexOf( domain ) != - 1;

	},

	dispose : function() {

		var domains = this.domains.concat(),
			i = domains.length;

		while ( i -- ) {

			domains[ i ].dispose();

		}

	}
};


//
//	Script
//

SEA3D.Script = function( domain, root ) {

	domain = domain || new SEA3D.Domain();
	domain.add( this );

	var events = new SEA3D.EventDispatcher();

	this.getId = function() {

		return domain.id;

	}

	this.isRoot = function() {

		return root;

	}

	this.addEvent = function( type, listener ) {

		events.addEventListener( type, listener );

	}

	this.hasEvent = function( type, listener ) {

		return events.hasEventListener( type, listener );

	}

	this.removeEvent = function( type, listener ) {

		events.removeEventListener( type, listener );

	}

	this.dispatchEvent = function( event ) {

		event.script = this;

		events.dispatchEvent( event );

	}

	this.dispose = function() {

		domain.remove( this );

		if ( root ) domain.dispose();

		this.dispatchEvent( { type : "dispose" } );

	}

};

//
//	Script Manager
//

SEA3D.ScriptManager = function() {

	this.scripts = [];

	var onDisposeScript = ( function( e ) {

		this.remove( e.script );

	} ).bind( this );

	this.add = function( src ) {

		src.addEvent( "dispose", onDisposeScript );

		this.scripts.push( src );

	}

	this.remove = function( src ) {

		src.removeEvent( "dispose", onDisposeScript );

		this.scripts.splice( this.scripts.indexOf( src ), 1 );

	}

	this.contains = function( src ) {

		return this.scripts.indexOf( src ) > - 1;

	}

	this.dispatchEvent = function( event ) {

		var scripts = this.scripts.concat(),
			i = scripts.length;

		while ( i -- ) {

			scripts[ i ].dispatchEvent( event );

		}

	}

};

//
//	AnimationFrame
//

SEA3D.AnimationFrame = function() {

	this.data = [ 0, 0, 0, 0 ];

};

SEA3D.AnimationFrame.prototype.toVector = function() {

	return { x: this.data[ 0 ], y: this.data[ 1 ], z: this.data[ 2 ], w: this.data[ 3 ] };

};

SEA3D.AnimationFrame.prototype.toAngles = function( d ) {

	var x = this.data[ 0 ],
		y = this.data[ 1 ],
		z = this.data[ 2 ],
		w = this.data[ 3 ];

	var a = 2 * ( w * y - z * x );

	if ( a < - 1 ) a = - 1;
	else if ( a > 1 ) a = 1;

	return {
		x : Math.atan2( 2 * ( w * x + y * z ), 1 - 2 * ( x * x + y * y ) ) * d,
		y : Math.asin( a ) * d,
		z : Math.atan2( 2 * ( w * z + x * y ), 1 - 2 * ( y * y + z * z ) ) * d
	}

};

SEA3D.AnimationFrame.prototype.toEuler = function() {

	return this.toAngles( SEA3D.Math.DEGREES );

};

SEA3D.AnimationFrame.prototype.toRadians = function() {

	return this.toAngles( 1 );

};

SEA3D.AnimationFrame.prototype.setX = function( val ) {

	this.data[ 0 ] = val;

};

SEA3D.AnimationFrame.prototype.getX = function() {

	return this.data[ 0 ];

};

SEA3D.AnimationFrame.prototype.setY = function( val ) {

	this.data[ 1 ] = val;

};

SEA3D.AnimationFrame.prototype.getY = function() {

	return this.data[ 1 ];

};

SEA3D.AnimationFrame.prototype.setZ = function( val ) {

	this.data[ 2 ] = val;

};

SEA3D.AnimationFrame.prototype.getZ = function() {

	return this.data[ 2 ];

};

SEA3D.AnimationFrame.prototype.setW = function( val ) {

	this.data[ 3 ] = val;

};

SEA3D.AnimationFrame.prototype.getW = function() {

	return this.data[ 3 ];

};

//
//	AnimationData
//

SEA3D.AnimationData = function( kind, dataType, data, offset ) {

	this.kind = kind;
	this.type = dataType;
	this.blockLength = SEA3D.Stream.sizeOf( dataType );
	this.data = data;
	this.offset = offset == undefined ? 0 : offset;

	switch ( this.blockLength )
	{
		case 1: this.getData = this.getData1x; break;
		case 2: this.getData = this.getData2x; break;
		case 3: this.getData = this.getData3x; break;
		case 4: this.getData = this.getData4x; break;
	}

};

SEA3D.AnimationData.prototype.getData1x = function( frame, data ) {

	frame = this.offset + frame * this.blockLength;

	data[ 0 ] = this.data[ frame ];

};

SEA3D.AnimationData.prototype.getData2x = function( frame, data ) {

	frame = this.offset + frame * this.blockLength;

	data[ 0 ] = this.data[ frame ];
	data[ 1 ] = this.data[ frame + 1 ];

};

SEA3D.AnimationData.prototype.getData3x = function( frame, data ) {

	frame = this.offset + frame * this.blockLength;

	data[ 0 ] = this.data[ frame ];
	data[ 1 ] = this.data[ frame + 1 ];
	data[ 2 ] = this.data[ frame + 2 ];

};

SEA3D.AnimationData.prototype.getData4x = function( frame, data ) {

	frame = this.offset + frame * this.blockLength;

	data[ 0 ] = this.data[ frame ];
	data[ 1 ] = this.data[ frame + 1 ];
	data[ 2 ] = this.data[ frame + 2 ];
	data[ 3 ] = this.data[ frame + 3 ];

};

//
//	AnimationNode
//

SEA3D.AnimationNode = function( name, frameRate, numFrames, repeat, intrpl ) {

	this.name = name;
	this.frameRate = frameRate;
	this.frameMill = 1000 / frameRate;
	this.numFrames = numFrames;
	this.length = numFrames - 1;
	this.time = 0;
	this.duration = this.length * this.frameMill;
	this.repeat = repeat;
	this.intrpl = intrpl;
	this.invalidState = true;
	this.dataList = [];
	this.dataListId = {};
	this.buffer = new SEA3D.AnimationFrame();
	this.percent = 0;
	this.prevFrame = 0;
	this.nextFrame = 0;
	this.frame = 0;

};

SEA3D.AnimationNode.prototype.setTime = function( value ) {

	this.frame = this.validFrame( value / this.frameMill );
	this.time = this.frame * this.frameRate;
	this.invalidState = true;

};

SEA3D.AnimationNode.prototype.getTime = function() {

	return this.time;

};

SEA3D.AnimationNode.prototype.setFrame = function( value ) {

	this.setTime( value * this.frameMill );

};

SEA3D.AnimationNode.prototype.getRealFrame = function() {

	return Math.floor( this.frame );

};

SEA3D.AnimationNode.prototype.getFrame = function() {

	return this.frame;

};

SEA3D.AnimationNode.prototype.setPosition = function( value ) {

	this.setFrame( value * ( this.numFrames - 1 ) );

};

SEA3D.AnimationNode.prototype.getPosition = function() {

	return this.frame / ( this.numFrames - 1 );

};

SEA3D.AnimationNode.prototype.validFrame = function( value ) {

	var inverse = value < 0;

	if ( inverse ) value = - value;

	if ( value > this.length ) {

		value = this.repeat ? value % this.length : this.length;

	}

	if ( inverse ) value = this.length - value;

	return value;

};

SEA3D.AnimationNode.prototype.addData = function( animationData ) {

	this.dataListId[ animationData.kind ] = animationData;
	this.dataList[ this.dataList.length ] = animationData;

};

SEA3D.AnimationNode.prototype.removeData = function( animationData ) {

	delete this.dataListId[ animationData.kind ];
	this.dataList.splice( this.dataList.indexOf( animationData ), 1 );

};

SEA3D.AnimationNode.prototype.getDataByKind = function( kind ) {

	return this.dataListId[ kind ];

};

SEA3D.AnimationNode.prototype.getFrameAt = function( frame, id ) {

	this.dataListId[ id ].getFrameData( frame, this.buffer.data );
	return this.buffer;

};

SEA3D.AnimationNode.prototype.getFrame = function( id ) {

	this.dataListId[ id ].getFrameData( this.getRealFrame(), this.buffer.data );
	return this.buffer;

};

SEA3D.AnimationNode.prototype.getInterpolationFrame = function( animationData, iFunc ) {

	if ( this.numFrames == 0 ) return this.buffer;

	if ( this.invalidState ) {

		this.prevFrame = this.getRealFrame();
		this.nextFrame = this.validFrame( this.prevFrame + 1 );
		this.percent = this.frame - this.prevFrame;
		this.invalidState = false;

	}

	animationData.getData( this.prevFrame, this.buffer.data );

	if ( this.percent > 0 ) {

		animationData.getData( this.nextFrame, SEA3D.AnimationNode.FRAME_BUFFER );

		// interpolation function
		iFunc( this.buffer.data, SEA3D.AnimationNode.FRAME_BUFFER, this.percent );

	}

	return this.buffer;

};

SEA3D.AnimationNode.FRAME_BUFFER = [ 0, 0, 0, 0 ];

//
//	AnimationSet
//

SEA3D.AnimationSet = function() {

	this.animations = [];
	this.dataCount = - 1;

};

SEA3D.AnimationSet.prototype.addAnimation = function( node ) {

	if ( this.dataCount == - 1 ) this.dataCount = node.dataList.length;

	this.animations[ node.name ] = node;
	this.animations.push( node );

};

SEA3D.AnimationSet.prototype.getAnimationByName = function( name ) {

	return this.animations[ name ];

};

//
//	AnimationState
//

SEA3D.AnimationState = function( node ) {

	this.node = node;
	this.offset = 0;
	this.weight = 0;
	this.time = 0;

};

SEA3D.AnimationState.prototype.setTime = function( val ) {

	this.node.time = this.time = val;

};

SEA3D.AnimationState.prototype.getTime = function() {

	return this.time;

};

SEA3D.AnimationState.prototype.setFrame = function( val ) {

	this.node.setFrame( val );

	this.time = this.node.time;

};

SEA3D.AnimationState.prototype.getFrame = function() {

	this.update();

	return this.node.getFrame();

};

SEA3D.AnimationState.prototype.setPosition = function( val ) {

	this.node.setPosition( val );

	this.time = this.node.time;

};

SEA3D.AnimationState.prototype.getPosition = function() {

	this.update();

	return this.node.getPosition();

};

SEA3D.AnimationState.prototype.update = function() {

	if ( this.node.time != this.time )
		this.node.setTime( this.time );

};

//
//	Animation Handler
//

SEA3D.AnimationHandler = function( animationSet ) {

	this.animationSet = animationSet;
	this.states = SEA3D.AnimationHandler.stateFromAnimations( animationSet.animations );
	this.timeScale = 1;
	this.time = 0;
	this.numAnimation = animationSet.animations.length;
	this.relative = false;
	this.playing = false;
	this.delta = 0;
	this.easeSpeed = 2;
	this.crossfade = 0;
	this.updateAllStates = false;
	this.blendMethod = SEA3D.AnimationBlendMethod.LINEAR;

};

SEA3D.AnimationHandler.prototype.update = function( delta ) {

	this.delta = delta;
	this.time += delta * this.timeScale;

	this.updateState();
	this.updateAnimation();

};

SEA3D.AnimationHandler.prototype.updateState = function() {

	var i, l, state;

	this.currentState.node.setTime( this.time - this.currentState.offset );

	if ( this.currentState.weight < 1 && this.crossfade > 0 ) {

		var delta = Math.abs( this.delta ) / ( this.crossfade * 1000 );
		var weight = 1;

		if ( this.blendMethod === SEA3D.AnimationBlendMethod.EASING ) {

			delta *= this.easeSpeed;

		}

		for ( i = 0, l = this.states.length; i < l; ++ i ) {

			state = this.states[ i ];

			if ( state.weight > 0 && state !== this.currentState ) {

				if ( this.blendMethod === SEA3D.AnimationBlendMethod.LINEAR ) {

					state.weight -= delta;

				}
				else if ( this.blendMethod === SEA3D.AnimationBlendMethod.EASING ) {

					state.weight -= state.weight * delta;

				}

				if ( state.weight < 0 ) state.weight = 0;

				weight -= state.weight;

				if ( this.updateAllStates ) {

					state.node.setTime( this.time - state.offset );

				}

			}

		}

		if ( weight < 0 ) weight = 0;

		this.currentState.weight = weight;

	} else {

		for ( i = 0; i < this.states.length; ++ i ) {

			state = this.states[ i ];

			if ( state === this.currentState ) state.weight = 1;
			else {

				state.weight = 0;

				if ( this.updateAllStates ) {

					state.node.setTime( this.time );

				}

			}

		}

	}

};

SEA3D.AnimationHandler.prototype.updateAnimation = function() {

	var dataCount = this.animationSet.dataCount;
	var nodes = this.animationSet.animations;
	var currentNode = this.currentState.node;

	for ( var i = 0; i < dataCount; i ++ ) {

		for ( var n = 0; n < nodes.length; n ++ ) {

			var node = nodes[ n ],
				state = this.states[ n ],
				data = node.dataList[ i ],
				iFunc = SEA3D.Animation.DefaultLerpFuncs[ data.kind ],
				frame;

			if ( n == 0 ) {

				frame = currentNode.getInterpolationFrame( currentNode.dataList[ i ], iFunc );

				if ( ! currentNode.repeat && currentNode.frame == currentNode.numFrames - 1 ) {

					if ( this.onComplete )
						this.onComplete( this );

				}

			}

			if ( node != currentNode ) {

				if ( state.weight > 0 ) {

					iFunc(
						frame.data,
						node.getInterpolationFrame( data, iFunc ).data,
						state.weight
					);

				}

			}

			if ( this.updateAnimationFrame ) {

				this.updateAnimationFrame( frame, data.kind );

			}

		}

	}

};

SEA3D.AnimationHandler.prototype.getStateByName = function( name ) {

	return this.states[ name ];

};

SEA3D.AnimationHandler.prototype.getStateNameByIndex = function( index ) {

	return this.animationSet.animations[ index ].name;

};

SEA3D.AnimationHandler.prototype.play = function( name, crossfade, offset ) {

	this.currentState = this.getStateByName( name );

	if ( ! this.currentState )
		throw new Error( 'Animation "' + name + '" not found.' );

	this.crossfade = crossfade;
	this.currentState.offset = this.time;

	if ( offset !== undefined ) {

		this.currentState.time = offset;

	}

	if ( ! this.playing ) {

		// Add in animation collector

		SEA3D.AnimationHandler.add( this );

		this.playing = true;

	}

};

SEA3D.AnimationHandler.prototype.resume = function() {

	if ( ! this.playing ) {

		SEA3D.AnimationHandler.add( this );
		this.playing = true;

	}

};

SEA3D.AnimationHandler.prototype.pause = function() {

	if ( this.playing ) {

		SEA3D.AnimationHandler.remove( this );
		this.playing = false;

	}

};

SEA3D.AnimationHandler.prototype.stop = function() {

	this.time = 0;

	this.pause();

};

SEA3D.AnimationHandler.prototype.setRelative = function( val ) {

	this.relative = val;

};

SEA3D.AnimationHandler.prototype.getRelative = function() {

	return this.relative;

};

//
//	Manager
//

SEA3D.AnimationHandler.add = function( animation ) {

	SEA3D.AnimationHandler.animations.push( animation );

};

SEA3D.AnimationHandler.remove = function( animation ) {

	SEA3D.AnimationHandler.animations.splice( SEA3D.AnimationHandler.animations.indexOf( animation ), 1 );

};

SEA3D.AnimationHandler.stateFromAnimations = function( anms ) {

	var states = [];
	for ( var i = 0; i < anms.length; i ++ ) {

		states[ anms[ i ].name ] = states[ i ] = new SEA3D.AnimationState( anms[ i ] );

	}
	return states;

};

SEA3D.AnimationHandler.update = function( delta ) {

	for ( var i = 0, len = SEA3D.AnimationHandler.animations.length; i < len; i ++ ) {

		SEA3D.AnimationHandler.animations[ i ].update( delta * 1000 );

	}

};

SEA3D.AnimationHandler.setTime = function( time ) {

	for ( var i = 0, len = SEA3D.AnimationHandler.animations.length; i < len; i ++ ) {

		SEA3D.AnimationHandler.animations[ i ].time = time;

	}

};

SEA3D.AnimationHandler.stop = function() {

	while ( SEA3D.AnimationHandler.animations.length ) {

		SEA3D.AnimationHandler.animations[ 0 ].stop();

	}

};

SEA3D.AnimationHandler.animations = [];

//
//	Object
//

SEA3D.Object = function( name, data, type, sea3d ) {

	this.name = name;
	this.data = data;
	this.type = type;
	this.sea3d = sea3d;

};

//
//	Geometry Base
//

SEA3D.GeometryBase = function( name, data, sea3d ) {

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

SEA3D.Geometry = function( name, data, sea3d ) {

	SEA3D.GeometryBase.call( this, name, data, sea3d );

	var i, j, vec, len;

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

		this.uv = [];
		this.uv.length = data.readUByte();

		len = this.numVertex * 2;

		i = 0;
		while ( i < this.uv.length ) {

			// UV VERTEX DATA
			this.uv[ i ++ ] = data.readFloatArray( len );

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

		this.numColor = ( ( ( colorAttrib & 64 ) >> 6 ) | ( ( colorAttrib & 128 ) >> 6 ) ) + 1;

		this.color = [];

		for ( i = 0, len = colorAttrib & 15; i < len; i ++ ) {

			this.color.push( data.readFloatArray( this.numVertex * this.numColor ) );

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
				start : len,
				count : j,
			} );

			len += j;

		}

		this.indexes = this.isBig ? data.readUIntArray( len ) : data.readUShortArray( len );

	} else {

		// INDEXES
		var stride = this.isBig ? 4 : 2,
			bytearray = new SEA3D.UByteArray();

		for ( i = 0, j = 0; i < count; i ++ ) {

			len = data.readVInt() * 3;

			this.groups.push( {
				start : j,
				count : len,
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
//	Geometry Delta Base
//

SEA3D.GeometryDeltaBase = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.attrib = data.readUShort();

	this.numVertex = data.readUInteger();

	this.length = this.numVertex * 3;

	if ( this.attrib & 1 ) {

		data.readNumber = data.readByte;
		this.numDiv = 0xFF / 2;

	}
	else {

		data.readNumber = data.readShort;
		numDiv = 0xFFFF / 2;

	}

};

//
//	Geometry Delta
//

SEA3D.GeometryDelta = function( name, data, sea3d ) {

	SEA3D.GeometryDeltaBase.call( this, name, data, sea3d );

	var i, j, start, delta, len, vec;

	// NORMAL
	if ( this.attrib & 4 ) {

		delta = data.readFloat();

		this.normal = new Float32Array( this.length );

		i = 0;
		while ( i < this.length ) {

			this.normal[ i ++ ] = ( data.readNumber() / this.numDiv ) * delta;

		}

	}

	// TANGENT
	if ( this.attrib & 8 ) {

		delta = data.readFloat();

		this.tangent = new Float32Array( this.length );

		i = 0;
		while ( i < this.length ) {

			this.tangent[ i ++ ] = ( data.readNumber() / this.numDiv ) * delta;

		}

	}

	// UV
	if ( this.attrib & 32 ) {

		this.uv = [];
		this.uv.length = data.readUByte();

		var uvLen = this.numVertex * 2;

		i = 0;
		while ( i < this.uv.length ) {

			// UV VERTEX DATA
			delta = data.readFloat();
			this.uv[ i ++ ] = vec = new Float32Array( uvLen );

			j = 0;
			while ( j < uvLen ) {

				vec[ j ++ ] = ( data.readNumber() / this.numDiv ) * delta;

			}

		}

	}

	// JOINT-INDEXES / WEIGHTS
	if ( this.attrib & 64 ) {

		this.jointPerVertex = data.readUByte();

		var jntLen = this.numVertex * this.jointPerVertex;

		this.joint = new Uint16Array( jntLen );
		this.weight = new Float32Array( jntLen );

		i = 0;
		while ( i < jntLen ) {

			this.joint[ i ++ ] = data.readUInteger();

		}

		i = 0;
		while ( i < jntLen ) {

			this.weight[ i ++ ] = ( data.readNumber() / this.numDiv ) * 1;

		}

	}

	// VERTEX_COLOR
	if ( this.attrib & 128 ) {

		var colorAttrib = data.readUByte(),
			numColorData = ( ( ( colorAttrib & 64 ) >> 6 ) | ( ( colorAttrib & 128 ) >> 6 ) ) + 1,
			colorCount = this.numVertex * 4;

		this.color = [];
		this.color.length = colorAttrib & 15;

		this.numColor = 4;

		for ( i = 0; i < this.color.length; i ++ ) {

			var vColor = new Float32Array( colorCount );

			switch ( numColorData )
			{
				case 1:
					j = 0;
					while ( j < colorCount ) {

						vColor[ j ++ ] = data.readUByte() / 0xFF;
						vColor[ j ++ ] = 0;
						vColor[ j ++ ] = 0;
						vColor[ j ++ ] = 1;

					}
					break;

				case 2:
					j = 0;
					while ( j < colorCount ) {

						vColor[ j ++ ] = data.readUByte() / 0xFF;
						vColor[ j ++ ] = data.readUByte() / 0xFF;
						vColor[ j ++ ] = 0;
						vColor[ j ++ ] = 1;

					}
					break;

				case 3:
					j = 0;
					while ( j < colorCount ) {

						vColor[ j ++ ] = data.readUByte() / 0xFF;
						vColor[ j ++ ] = data.readUByte() / 0xFF;
						vColor[ j ++ ] = data.readUByte() / 0xFF;
						vColor[ j ++ ] = 1;

					}
					break;

				case 4:
					j = 0;
					while ( j < colorCount ) {

						vColor[ j ++ ] = data.readUByte() / 0xFF;
						vColor[ j ++ ] = data.readUByte() / 0xFF;
						vColor[ j ++ ] = data.readUByte() / 0xFF;
						vColor[ j ++ ] = data.readUByte() / 0xFF;

					}
					break;
			}

			this.color[ i ] = vColor;

		}

	}

	// VERTEX
	delta = data.readFloat();

	this.vertex = new Float32Array( this.length );

	i = 0;
	while ( i < this.length ) {

		this.vertex[ i ++ ] = ( data.readNumber() / this.numDiv ) * delta;

	}

	// SUB-MESHES
	var count = data.readUByte();

	this.indexes = vec = [];
	this.groups = [];

	// INDEXES
	j = 0;
	for ( i = 0; i < count; i ++ ) {

		len = data.readVInt() * 3;

		this.groups.push( {
			start : j,
			count : len,
		} );

		len += j;
		while ( j < len ) {

			vec[ j ++ ] = data.readVInt();

		}

	}

	// SUB-MESHES
	var count = data.readUByte();

	this.indexes = vec = [];
	this.groups = [];

	// INDEXES
	if ( this.attrib & 2 ) {

		// POLYGON
		for ( i = 0; i < count; i ++ ) {

			len = data.readUInteger();

			start = vec.length;

			for ( j = 0; j < len; j ++ ) {

				var a = data.readUInteger(),
					b = data.readUInteger(),
					c = data.readUInteger(),
					d = data.readUInteger();


				vec.push( a );
				vec.push( b );
				vec.push( c );

				if ( d > 0 )
				{

					vec.push( c );
					vec.push( d + 1 );
					vec.push( a );

				}
				else continue;

			}

			this.groups.push( {
				start : start,
				count : vec.length - start,
			} );

		}

	} else {

		// TRIANGLE
		j = 0;
		for ( i = 0; i < count; i ++ ) {

			len = data.readUInteger() * 3;

			this.groups.push( {
				start : j,
				count : len,
			} );

			len += j;
			while ( j < len ) {

				vec[ j ++ ] = data.readUInteger();

			}

		}

	}

};

SEA3D.GeometryDeltaBase.prototype = Object.create( SEA3D.GeometryDeltaBase.prototype );
SEA3D.GeometryDeltaBase.prototype.constructor = SEA3D.GeometryDelta;

SEA3D.GeometryDelta.prototype.type = "geDL";

//
//	Object3D
//

SEA3D.Object3D = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.isStatic = false;
	this.visible = true;

	this.attrib = data.readUShort();

	if ( this.attrib & 1 ) this.parent = sea3d.getObject( data.readUInt() );

	if ( this.attrib & 2 ) this.animations = data.readAnimationList( sea3d );

	if ( this.attrib & 4 ) this.scripts = data.readScriptList( sea3d );

	if ( this.attrib & 16 ) this.properties = sea3d.getObject( data.readUInt() );

	if ( this.attrib & 32 ) {

		var objectType = data.readUByte();
		this.isStatic = ( objectType & 1 ) != 0;
		this.visible = ( objectType & 2 ) != 0;

	}

};

SEA3D.Object3D.prototype.readTag = function( kind, data, size ) {

};

//
//	Entity3D
//

SEA3D.Entity3D = function( name, data, sea3d ) {

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

SEA3D.Sound3D = function( name, data, sea3d ) {

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

SEA3D.SoundPoint = function( name, data, sea3d ) {

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

SEA3D.Container3D = function( name, data, sea3d ) {

	SEA3D.Object3D.call( this, name, data, sea3d );

	this.transform = data.readMatrix();

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.Container3D.prototype = Object.create( SEA3D.Object3D.prototype );
SEA3D.Container3D.prototype.constructor = SEA3D.Container3D;

SEA3D.Container3D.prototype.type = "c3d";

//
//	Texture URL
//

SEA3D.TextureURL = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.url = data.readUTF( data.length );

};

SEA3D.TextureURL.prototype.type = "urlT";

//
//	Actions
//

SEA3D.Actions = function( name, data, sea3d ) {

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

			}
			else if ( act.intrpl.indexOf( 'elastic.' ) == 0 ) {

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
				act.name = data.readUTF8();
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

SEA3D.Actions.prototype.type = "act";

//
//	Properties
//

SEA3D.Properties = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.tag = data.readProperties( sea3d );
	this.tag.__name = name;

};

SEA3D.Properties.prototype.type = "prop";

//
//	File Info
//

SEA3D.FileInfo = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.tag = data.readProperties( sea3d );
	this.tag.__name = name;

	sea3d.info = this.tag;

};

SEA3D.FileInfo.prototype.type = "info";

//
//	Java Script
//

SEA3D.JavaScript = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.src = data.readUTF( data.length );

};

SEA3D.JavaScript.prototype.type = "js";

//
//	Java Script Method
//

SEA3D.JavaScriptMethod = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	var count = data.readUShort();

	this.methods = {};

	for ( var i = 0; i < count; i ++ ) {

		var flag = data.readUByte();
		var method = data.readUTF8();

		this.methods[ method ] = {
			src : data.readUTF8Long()
		}

	}

};

SEA3D.JavaScriptMethod.prototype.type = "jsm";

//
//	GLSL
//

SEA3D.GLSL = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.src = data.readUTF( data.length );

};

SEA3D.GLSL.prototype.type = "glsl";

//
//	Dummy
//

SEA3D.Dummy = function( name, data, sea3d ) {

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

SEA3D.Line = function( name, data, sea3d ) {

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
//	Mesh2D
//

SEA3D.Mesh2D = function( name, data, sea3d ) {

	SEA3D.Object3D.call( this, name, data, sea3d );

	if ( this.attrib & 256 ) {

		this.material = sea3d.getObject( data.readUInt() );

	}

	this.position = data.readVector3();

	this.width = data.readFloat();
	this.height = data.readFloat();

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.Mesh2D.prototype = Object.create( SEA3D.Object3D.prototype );
SEA3D.Mesh2D.prototype.constructor = SEA3D.Mesh2D;

SEA3D.Mesh2D.prototype.type = "m2d";

//
//	Mesh
//

SEA3D.Mesh = function( name, data, sea3d ) {

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
			type : data.readUByte(),
			ref : sea3d.getObject( data.readUInt() )
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

SEA3D.Skeleton = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	var length = data.readUShort();

	this.joint = [];

	for ( var i = 0; i < length; i ++ ) {

		this.joint[ i ] = {
			name: data.readUTF8(),
			parentIndex: data.readUShort() - 1,
			inverseBindMatrix: data.readMatrix()
		};

	}

};

SEA3D.Skeleton.prototype.type = "skl";

//
//	Skeleton Local
//

SEA3D.SkeletonLocal = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	var length = data.readUShort();

	this.joint = [];

	for ( var i = 0; i < length; i ++ ) {

		this.joint[ i ] = {
			name: data.readUTF8(),
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

SEA3D.AnimationBase = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	var flag = data.readUByte();

	this.sequence = [];

	if ( flag & 1 ) {

		var count = data.readUShort();

		for ( var i = 0; i < count; i ++ ) {

			flag = data.readUByte();

			this.sequence[ i ] = {
				name: data.readUTF8(),
				start: data.readUInt(),
				count: data.readUInt(),
				repeat: ( flag & 1 ) != 0,
				intrpl: ( flag & 2 ) != 0
			}

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

SEA3D.Animation = function( name, data, sea3d ) {

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

SEA3D.Animation.DefaultLerpFuncs = [
	SEA3D.Math.lerp3x, // POSITION
	SEA3D.Math.lerpQuat4x, // ROTATION
	SEA3D.Math.lerp3x, // SCALE
	SEA3D.Math.lerpColor1x, // COLOR
	SEA3D.Math.lerp1x, // MULTIPLIER
	SEA3D.Math.lerp1x, // ATTENUATION_START
	SEA3D.Math.lerp1x, // ATTENUATION_END
	SEA3D.Math.lerp1x, // FOV
	SEA3D.Math.lerp1x, // OFFSET_U
	SEA3D.Math.lerp1x, // OFFSET_V
	SEA3D.Math.lerp1x, // SCALE_U
	SEA3D.Math.lerp1x, // SCALE_V
	SEA3D.Math.lerpAng1x, // ANGLE
	SEA3D.Math.lerp1x, // ALPHA
	SEA3D.Math.lerp1x // VOLUME
];

SEA3D.Animation.prototype = Object.create( SEA3D.AnimationBase.prototype );
SEA3D.Animation.prototype.constructor = SEA3D.Animation;

SEA3D.Animation.prototype.type = "anm";

//
//	Skeleton Animation
//

SEA3D.SkeletonAnimation = function( name, data, sea3d ) {

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

SEA3D.Morph = function( name, data, sea3d ) {

	SEA3D.GeometryBase.call( this, name, data, sea3d );

	var useVertex = ( this.attrib & 2 ) != 0;
	var useNormal = ( this.attrib & 4 ) != 0;

	var nodeCount = data.readUShort();

	this.node = [];

	for ( var i = 0; i < nodeCount; i ++ ) {

		var nodeName = data.readUTF8(),
			verts, norms;

		if ( useVertex ) verts = data.readFloatArray( this.length );
		if ( useNormal ) norms = data.readFloatArray( this.length );

		this.node[ i ] = { vertex: verts, normal: norms, name: nodeName }

	}

};

SEA3D.Morph.prototype = Object.create( SEA3D.GeometryBase.prototype );
SEA3D.Morph.prototype.constructor = SEA3D.Morph;

SEA3D.Morph.prototype.type = "mph";

//
//	Vertex Animation
//

SEA3D.VertexAnimation = function( name, data, sea3d ) {

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

		this.frame[ i ] = { vertex: verts, normal: norms }

	}

};

SEA3D.VertexAnimation.prototype = Object.create( SEA3D.AnimationBase.prototype );
SEA3D.VertexAnimation.prototype.constructor = SEA3D.VertexAnimation;

SEA3D.VertexAnimation.prototype.type = "vtxa";

//
//	Camera
//

SEA3D.Camera = function( name, data, sea3d ) {

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
//	Joint Object
//

SEA3D.JointObject = function( name, data, sea3d ) {

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

SEA3D.Light = function( name, data, sea3d ) {

	SEA3D.Object3D.call( this, name, data, sea3d );

	this.attenStart = Number.MAX_VALUE;
	this.attenEnd = Number.MAX_VALUE;

	if ( this.attrib & 64 ) {

		var shadowHeader = data.readUByte();

		this.shadow = {}

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

SEA3D.PointLight = function( name, data, sea3d ) {

	SEA3D.Light.call( this, name, data, sea3d );

	if ( this.attrib & 128 ) {

		this.attenuation = {
			start: data.readFloat(),
			end: data.readFloat()
		}

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

SEA3D.HemisphereLight = function( name, data, sea3d ) {

	SEA3D.Light.call( this, name, data, sea3d );

	if ( this.attrib & 128 ) {

		this.attenuation = {
				start: data.readFloat(),
				end: data.readFloat()
			}

	}

	this.secondColor = data.readUInt24();

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.HemisphereLight.prototype = Object.create( SEA3D.Light.prototype );
SEA3D.HemisphereLight.prototype.constructor = SEA3D.HemisphereLight;

SEA3D.HemisphereLight.prototype.type = "hlht";

//
//	Directional Light
//

SEA3D.DirectionalLight = function( name, data, sea3d ) {

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

SEA3D.Material = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.technique = [];

	this.attrib = data.readUShort();

	this.alpha = 1;
	this.blendMode = "normal";
	this.alphaThreshold = .5;

	this.bothSides = ( this.attrib & 1 ) != 0;

	this.receiveLights = ( this.attrib & 2 ) == 0;
	this.receiveShadows = ( this.attrib & 4 ) == 0;
	this.receiveFog = ( this.attrib & 8 ) == 0;

	this.smooth = ( this.attrib & 16 ) == 0;

	if ( this.attrib & 32 )
		this.alpha = data.readFloat();

	if ( this.attrib & 64 )
		this.blendMode = data.readBlendMode();

	if ( this.attrib & 128 )
		this.animations = data.readAnimationList( sea3d );

	this.depthMask = ( this.attrib & 256 ) == 0;

	var count = data.readUByte();

	for ( var i = 0; i < count; ++ i ) {

		var kind = data.readUShort();
		var size = data.readUShort();
		var pos = data.position;
		var tech, methodAttrib;

		switch ( kind ) {
			case SEA3D.Material.DEFAULT:
				tech = {
					ambientColor: data.readUInt24(),
					diffuseColor: data.readUInt24(),
					specularColor: data.readUInt24(),

					specular: data.readFloat(),
					gloss: data.readFloat()
				};
				break;
			case SEA3D.Material.COMPOSITE_TEXTURE:
				tech = {
					composite: sea3d.getObject( data.readUInt() )
				};
				break;
			case SEA3D.Material.DIFFUSE_MAP:
				tech = {
					texture: sea3d.getObject( data.readUInt() )
				};
				break;
			case SEA3D.Material.SPECULAR_MAP:
				tech = {
					texture: sea3d.getObject( data.readUInt() )
				};
				break;
			case SEA3D.Material.NORMAL_MAP:
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
					color: data.readUInt24(),
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

				}
				else {

					tech.offsetX0 = tech.offsetY0 =
					tech.offsetX1 = tech.offsetY1 = 0

				}

				tech.animate = methodAttrib & 2;
				break;
			case SEA3D.Material.MIRROR_REFLECTION:
				tech = {
					texture: sea3d.getObject( data.readUInt() ),
					alpha: data.readFloat()
				};
				break;

			case SEA3D.Material.AMBIENT_MAP:
				tech = {
						texture: sea3d.getObject( data.readUInt() )
					}
				break;

			case SEA3D.Material.ALPHA_MAP:
				tech = {
					texture: sea3d.getObject( data.readUInt() )
				};
				break;

			case SEA3D.Material.EMISSIVE_MAP:
				tech = {
					texture: sea3d.getObject( data.readUInt() )
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
					blue: data.readUInt24()
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

			default:
				console.warn( "SEA3D: MaterialTechnique not found:", kind.toString( 16 ) );

				data.position = pos += size;
				continue;
		}

		tech.kind = kind;

		this.technique.push( tech );

		data.position = pos += size;

	}

};

SEA3D.Material.DEFAULT = 0;
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

SEA3D.Material.prototype.type = "mat";

//
//	Composite
//

SEA3D.Composite = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	var layerCount = data.readUByte();

	this.layer = [];

	for ( var i = 0; i < layerCount; i ++ ) {

		this.layer[ i ] = new SEA3D.Composite.prototype.Layer( data, sea3d );

	}

};

SEA3D.Composite.prototype.getLayerByName = function( name ) {

	for ( var i = 0; i < this.layer.length; i ++ ) {

		if ( this.layer[ i ].name == name ) {

			return this.layer[ i ];

		}

	}

};

SEA3D.Composite.prototype.Layer = function( data, sea3d ) {

	var attrib = data.readUShort();

	if ( attrib & 1 ) this.texture = new SEA3D.Composite.LayerBitmap( data, sea3d );
	else this.color = data.readUInt24();

	if ( attrib & 2 ) {

		this.mask = new SEA3D.Composite.LayerBitmap( data, sea3d );

	}

	if ( attrib & 4 ) {

		this.name = data.readUTF8();

	}

	this.blendMode = attrib & 8 ? data.readBlendMode() : "normal";

	this.opacity = attrib & 16 ? data.readFloat() : 1;

};

SEA3D.Composite.LayerBitmap = function( data, sea3d ) {

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
//	Sphere
//

SEA3D.Sphere = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.radius = data.readFloat();

};

SEA3D.Sphere.prototype.type = "sph";

//
//	Box
//

SEA3D.Box = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.width = data.readFloat();
	this.height = data.readFloat();
	this.depth = data.readFloat();

};

SEA3D.Box.prototype.type = "box";

//
//	Cone
//

SEA3D.Cone = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.radius = data.readFloat();
	this.height = data.readFloat();

};

SEA3D.Cone.prototype.type = "cone";

//
//	Capsule
//

SEA3D.Capsule = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.radius = data.readFloat();
	this.height = data.readFloat();

};

SEA3D.Capsule.prototype.type = "cap";

//
//	Cylinder
//

SEA3D.Cylinder = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.radius = data.readFloat();
	this.height = data.readFloat();

};

SEA3D.Cylinder.prototype.type = "cyl";

//
//	Convex Geometry
//

SEA3D.ConvexGeometry = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.geometry = sea3d.getObject( data.readUInt() );
	this.subGeometryIndex = data.readUByte();

};

SEA3D.ConvexGeometry.prototype.type = "gs";

//
//	Triangle Geometry
//

SEA3D.TriangleGeometry = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.geometry = sea3d.getObject( data.readUInt() );
	this.subGeometryIndex = data.readUByte();

};

SEA3D.TriangleGeometry.prototype.type = "sgs";

//
//	Compound
//

SEA3D.Compound = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.compounds = [];

	var count = data.readUByte();

	for ( var i = 0; i < count; i ++ ) {

		this.compounds.push( {
			shape : sea3d.getObject( data.readUInt() ),
			transform : data.readMatrix()
		} );

	}

};

SEA3D.Compound.prototype.type = "cmps";

//
//	Physics
//

SEA3D.Physics = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.attrib = data.readUShort();

	this.shape = sea3d.getObject( data.readUInt() );

	if ( this.attrib & 1 ) this.target = sea3d.getObject( data.readUInt() );
	else this.transform = data.readMatrix();

};

SEA3D.Physics.prototype.readTag = function( kind, data, size ) {

};

//
//	Rigidy Body Base
//

SEA3D.RigidBodyBase = function( name, data, sea3d ) {

	SEA3D.Physics.call( this, name, data, sea3d );

	if ( this.attrib & 32 ) {

		this.linearDamping = data.readFloat();
		this.angularDamping = data.readFloat();

	} else {

		this.linearDamping = 0;
		this.angularDamping = 0;

	}

	this.mass = data.readFloat();
	this.friction = data.readFloat();
	this.restitution = data.readFloat();

};

SEA3D.RigidBodyBase.prototype = Object.create( SEA3D.Physics.prototype );
SEA3D.RigidBodyBase.prototype.constructor = SEA3D.RigidBodyBase;

//
//	Rigidy Body
//

SEA3D.RigidBody = function( name, data, sea3d ) {

	SEA3D.RigidBodyBase.call( this, name, data, sea3d );

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.RigidBody.prototype = Object.create( SEA3D.RigidBodyBase.prototype );
SEA3D.RigidBody.prototype.constructor = SEA3D.RigidBody;

SEA3D.RigidBody.prototype.type = "rb";

//
//	Car Controller
//

SEA3D.CarController = function( name, data, sea3d ) {

	SEA3D.RigidBodyBase.call( this, name, data, sea3d );

	this.suspensionStiffness = data.readFloat();
	this.suspensionCompression = data.readFloat();
	this.suspensionDamping = data.readFloat();
	this.maxSuspensionTravelCm = data.readFloat();
	this.frictionSlip = data.readFloat();
	this.maxSuspensionForce = data.readFloat();

	this.dampingCompression = data.readFloat();
	this.dampingRelaxation = data.readFloat();

	var count = data.readUByte();

	this.wheel = [];

	for ( var i = 0; i < count; i ++ ) {

		this.wheel[ i ] = new SEA3D.CarController.Wheel( data, sea3d );

	}

	data.readTags( this.readTag.bind( this ) );

};

SEA3D.CarController.Wheel = function( data, sea3d ) {

	this.data = data;
	this.sea3d = sea3d;

	var attrib = data.readUShort();

	this.isFront = ( attrib & 1 ) != 0,

	this.target = sea3d.getObject( data.readUInt() );

	this.pos = data.readVector3();
	this.dir = data.readVector3();
	this.axle = data.readVector3();

	this.radius = data.readFloat();
	this.suspensionRestLength = data.readFloat();

};

SEA3D.CarController.prototype = Object.create( SEA3D.RigidBodyBase.prototype );
SEA3D.CarController.prototype.constructor = SEA3D.CarController;

SEA3D.CarController.prototype.type = "carc";

//
//	Constraints
//

SEA3D.Constraints = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.attrib = data.readUShort();

	this.disableCollisionsBetweenBodies = this.attrib & 1 != 0;

	this.targetA = sea3d.getObject( data.readUInt() );
	this.pointA = data.readVector3();

	if ( this.attrib & 2 ) {

		this.targetB = sea3d.getObject( data.readUInt() );
		this.pointB = data.readVector3();

	}

};

//
//	P2P Constraint
//

SEA3D.P2PConstraint = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	SEA3D.Constraints.call( this, name, data, sea3d );

};

SEA3D.P2PConstraint.prototype = Object.create( SEA3D.Constraints.prototype );
SEA3D.P2PConstraint.prototype.constructor = SEA3D.P2PConstraint;

SEA3D.P2PConstraint.prototype.type = "p2pc";

//
//	Hinge Constraint
//

SEA3D.HingeConstraint = function( name, data, sea3d ) {

	SEA3D.Constraints.call( this, name, data, sea3d );

	this.axisA = data.readVector3();

	if ( this.attrib & 1 ) {

		this.axisB = data.readVector3();

	}

	if ( this.attrib & 4 ) {

		this.limit = {
			low : data.readFloat(),
			high : data.readFloat(),
			softness : data.readFloat(),
			biasFactor : data.readFloat(),
			relaxationFactor : data.readFloat()
		}

	}

	if ( this.attrib & 8 ) {

		this.angularMotor = {
			velocity : data.readFloat(),
			impulse : data.readFloat()
		}

	}

};

SEA3D.HingeConstraint.prototype = Object.create( SEA3D.Constraints.prototype );
SEA3D.HingeConstraint.prototype.constructor = SEA3D.HingeConstraint;

SEA3D.HingeConstraint.prototype.type = "hnec";

//
//	Cone Twist Constraint
//

SEA3D.ConeTwistConstraint = function( name, data, sea3d ) {

	SEA3D.Constraints.call( this, name, data, sea3d );

	this.axisA = data.readVector3();

	if ( this.attrib & 1 ) {

		this.axisB = data.readVector3();

	}

	if ( this.attrib & 4 ) {

		this.limit = {
			swingSpan1 : data.readFloat(),
			swingSpan2 : data.readFloat(),
			twistSpan : data.readFloat(),
			softness : data.readFloat(),
			biasFactor : data.readFloat(),
			relaxationFactor : data.readFloat()
		};

	}

};

SEA3D.ConeTwistConstraint.prototype = Object.create( SEA3D.Constraints.prototype );
SEA3D.ConeTwistConstraint.prototype.constructor = SEA3D.ConeTwistConstraint;

SEA3D.ConeTwistConstraint.prototype.type = "ctwc";

//
//	Planar Render
//

SEA3D.PlanarRender = function( name, data, sea3d ) {

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

SEA3D.CubeRender = function( name, data, sea3d ) {

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

SEA3D.CubeMap = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.transparent = false;

	var ext = data.readExt();

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

SEA3D.JPEG = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.transparent = false;

};

SEA3D.JPEG.prototype.type = "jpg";

//
//	JPEG_XR
//

SEA3D.JPEG_XR = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.transparent = true;

};

SEA3D.JPEG_XR.prototype.type = "wdp";

//
//	PNG
//

SEA3D.PNG = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.transparent = data.getByte( 25 )  == 0x06;

};

SEA3D.PNG.prototype.type = "png";

//
//	GIF
//

SEA3D.GIF = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

	this.transparent = data.getByte( 11 ) > 0;

};

SEA3D.GIF.prototype.type = "gif";

//
//	OGG
//

SEA3D.OGG = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

};

SEA3D.OGG.prototype.type = "ogg";

//
//	MP3
//

SEA3D.MP3 = function( name, data, sea3d ) {

	this.name = name;
	this.data = data;
	this.sea3d = sea3d;

};

SEA3D.MP3.prototype.type = "mp3";

//
//	FILE FORMAT
//

SEA3D.File = function( data ) {

	this.version = SEA3D.VERSION;
	this.objects = [];
	this.typeClass = {};
	this.typeRead = {};
	this.typeUnique = {};
	this.position =
	this.dataPosition = 0;
	this.scope = this;
	this.streaming = true;
	this.timeLimit = 60;

	// SEA3D
	this.addClass( SEA3D.FileInfo, true );
	this.addClass( SEA3D.Geometry, true );
	this.addClass( SEA3D.GeometryDelta, true );
	this.addClass( SEA3D.Mesh );
	this.addClass( SEA3D.Mesh2D );
	this.addClass( SEA3D.Material );
	this.addClass( SEA3D.Composite );
	this.addClass( SEA3D.PointLight );
	this.addClass( SEA3D.DirectionalLight );
	this.addClass( SEA3D.HemisphereLight );
	this.addClass( SEA3D.Skeleton, true );
	this.addClass( SEA3D.SkeletonLocal, true );
	this.addClass( SEA3D.SkeletonAnimation, true );
	this.addClass( SEA3D.JointObject );
	this.addClass( SEA3D.Camera );
	this.addClass( SEA3D.Morph, true );
	this.addClass( SEA3D.VertexAnimation, true );
	this.addClass( SEA3D.CubeMap, true );
	this.addClass( SEA3D.Animation );
	this.addClass( SEA3D.Dummy );
	this.addClass( SEA3D.Line );
	this.addClass( SEA3D.SoundPoint );
	this.addClass( SEA3D.PlanarRender );
	this.addClass( SEA3D.CubeRender );
	this.addClass( SEA3D.Actions );
	this.addClass( SEA3D.Container3D );
	this.addClass( SEA3D.Properties );

	// URL
	this.addClass( SEA3D.TextureURL, true );

	// PHYSICS
	this.addClass( SEA3D.Sphere );
	this.addClass( SEA3D.Box );
	this.addClass( SEA3D.Cone );
	this.addClass( SEA3D.Capsule );
	this.addClass( SEA3D.Cylinder );
	this.addClass( SEA3D.ConvexGeometry );
	this.addClass( SEA3D.TriangleGeometry );
	this.addClass( SEA3D.Compound );
	this.addClass( SEA3D.RigidBody );
	this.addClass( SEA3D.P2PConstraint );
	this.addClass( SEA3D.HingeConstraint );
	this.addClass( SEA3D.ConeTwistConstraint );
	this.addClass( SEA3D.CarController );

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

};

SEA3D.File.CompressionLibs = {};
SEA3D.File.DecompressionMethod = {}

SEA3D.File.setDecompressionEngine = function( id, name, method ) {

	SEA3D.File.CompressionLibs[ id ] = name;
	SEA3D.File.DecompressionMethod[ id ] = method;

};

SEA3D.File.prototype.addClass = function( clazz, unique ) {

	this.typeClass[ clazz.prototype.type ] = clazz;
	this.typeUnique[ clazz.prototype.type ] = unique === true;

};

SEA3D.File.prototype.readHead = function() {

	if ( this.stream.bytesAvailable < 16 )
		return false;

	if ( this.stream.readUTF( 3 ) != "SEA" )
		throw new Error( "Invalid SEA3D format." );

	this.sign = this.stream.readUTF( 3 );

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

	if ( this.onHead )
		this.onHead( {
			file: this,
			sign: this.sign
		} );

	return true;

};

SEA3D.File.prototype.getObject = function( index ) {

	return this.objects[ index ];

};

SEA3D.File.prototype.readSEAObject = function() {

	if ( this.stream.bytesAvailable < 4 )
		return null;

	var size = this.stream.readUInt();
	var position = this.stream.position;

	if ( this.stream.bytesAvailable < size )
		return null;

	var flag = this.stream.readUByte();
	var type = this.stream.readExt();
	var meta = null;

	var name = flag & 1 ? this.stream.readUTF8() : "",
		compressed = ( flag & 2 ) != 0,
		streaming = ( flag & 4 ) != 0;

	if ( flag & 8 ) {

		var metalen = this.stream.readUShort();
		var metabytes = this.stream.concat( this.stream.position, metalen );

		this.stream.position += metalen;

		if ( compressed && this.decompressionMethod ) {

			metabytes.set( this.decompressionMethod( metabytes.buffer ) );

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

		if ( this.streaming && streaming && this.typeRead[ type ] ) {

			this.typeRead[ type ].call( this.scope, obj );

		}

	}
	else {

		obj = new SEA3D.Object( name, data, type, this );

		console.warn( "SEA3D: Unknown format \"" + type + "\" of file \"" + name + "\". Add a module referring for this format." );

	}

	obj.streaming = streaming;
	obj.metadata = meta;

	this.objects.push( this.objects[ obj.type + "/" + obj.name ] = obj );

	this.dataPosition = position + size;

	++ this.position;

	return obj;

};

SEA3D.File.prototype.readBody = function() {

	this.timer.update();

	while ( this.position < this.length ) {

		if ( this.timer.deltaTime < this.timeLimit ) {

			this.stream.position = this.dataPosition;

			var sea = this.readSEAObject();

			if ( sea ) this.dispatchCompleteObject( sea );
			else return false;

		}
		else return false;

	}

	this.state = this.readComplete;

	return true;

};

SEA3D.File.prototype.parse = function() {

	this.timer = new SEA3D.Timer();
	this.position = 0;

	setTimeout( this.parseObject.bind( this ), 10 );

};

SEA3D.File.prototype.parseObject = function() {

	this.timer.update();

	while ( this.position < this.length && this.timer.deltaTime < this.timeLimit ) {

		var obj = this.objects[ this.position ++ ],
			type = obj.type;

		if ( ! this.typeUnique[ type ] ) delete obj.tag;

		if ( obj.streaming && this.typeRead[ type ] ) {

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
				total: this.length,
				progress: this.position / this.length
			} );

		}

		setTimeout( this.parseObject.bind( this ), 10 );

	}

};

SEA3D.File.prototype.readComplete = function() {

	this.stream.position = this.dataPosition;

	if ( this.stream.readUInt24F() != 0x5EA3D1 )
		console.warn( "SEA3D file is corrupted." );

	delete this.state;

	this.dispatchComplete();

};

SEA3D.File.prototype.readState = function() {

	while ( this.state && this.state() );

	if ( this.state ) {

		setTimeout( this.readState.bind( this ), 10 );
		this.dispatchProgress();

	}

};

SEA3D.File.prototype.read = function( data ) {

	this.stream = new SEA3D.Stream( data );
	this.timer = new SEA3D.Timer();
	this.state = this.readHead;

	this.readState();

};

SEA3D.File.prototype.dispatchCompleteObject = function( obj ) {

	if ( ! this.onCompleteObject ) return;

	this.onCompleteObject( {
		file: this,
		object: obj
	} );

};

SEA3D.File.prototype.dispatchProgress = function() {

	if ( ! this.onProgress ) return;

	this.onProgress( {
		file: this,
		loaded: this.position,
		total: this.length,
		progress: this.position / this.length
	} );

};

SEA3D.File.prototype.dispatchDownloadProgress = function( position, length ) {

	if ( ! this.onDownloadProgress ) return;

	this.onDownloadProgress( {
		file: this,
		loaded: position,
		total: length,
		progress: position / length
	} );

};

SEA3D.File.prototype.dispatchComplete = function() {

	var elapsedTime = this.timer.elapsedTime;
	var message = elapsedTime + "ms, " + this.objects.length + " objects";

	if ( this.onComplete ) this.onComplete( {
			file: this,
			timeTotal: elapsedTime,
			message: message
		} );
	else console.log( "SEA3D:", message );

};

SEA3D.File.prototype.dispatchError = function( id, message ) {

	if ( this.onError ) this.onError( { file: this, id: id, message: message } );
	else console.error( "SEA3D: #" + id, message );

};

SEA3D.File.prototype.load = function( url ) {

	var file = this,
		xhr = new XMLHttpRequest();

	xhr.open( "GET", url, true );
	xhr.responseType = 'arraybuffer';

	xhr.onprogress = function( e ) {

		if ( e.lengthComputable ) {

			file.dispatchDownloadProgress( e.loaded, e.total );

		}

	}

	xhr.onreadystatechange = function() {

		if ( xhr.readyState === 2 ) {
			//xhr.getResponseHeader("Content-Length");
		} else if ( xhr.readyState === 3 ) {
			//	progress
		} else if ( xhr.readyState === 4 ) {

			if ( xhr.status === 200 || xhr.status === 0 ) {

				// complete
				file.read( this.response );

			} else {

				this.dispatchError( 1001, "Couldn't load [" + url + "] [" + xhr.status + "]" );

			}

		}

	}

	xhr.send();

};

/**
 * EventDispatcher.js
 * @author mrdoob / http://mrdoob.com/
 * @sunag sunag / http://www.sunag.com.br/
 */

SEA3D.EventDispatcher = function () {}

SEA3D.EventDispatcher.prototype = {

	constructor: SEA3D.EventDispatcher,

	addEventListener: function ( type, listener ) {

		if ( this._listeners === undefined ) this._listeners = {};

		var listeners = this._listeners;

		if ( listeners[ type ] === undefined ) {

			listeners[ type ] = [];

		}

		if ( listeners[ type ].indexOf( listener ) === - 1 ) {

			listeners[ type ].push( listener );

		}

	},

	hasEventListener: function ( type, listener ) {

		if ( this._listeners === undefined ) return false;

		var listeners = this._listeners;

		if ( listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1 ) {

			return true;

		}

		return false;

	},

	removeEventListener: function ( type, listener ) {

		if ( this._listeners === undefined ) return;

		var listeners = this._listeners;
		var listenerArray = listeners[ type ];

		if ( listenerArray !== undefined ) {

			var index = listenerArray.indexOf( listener );

			if ( index !== - 1 ) {

				listenerArray.splice( index, 1 );

			}

		}

	},

	dispatchEvent: function ( event ) {

		if ( this._listeners === undefined ) return;

		var listeners = this._listeners;
		var listenerArray = listeners[ event.type ];

		if ( listenerArray !== undefined ) {

			event.target = this;

			var array = [];
			var length = listenerArray.length;

			for ( var i = 0; i < length; i ++ ) {

				array[ i ] = listenerArray[ i ];

			}

			for ( var i = 0; i < length; i ++ ) {

				array[ i ].call( this, event );

			}

		}

	}

};

SEA3D.EventDispatcher.apply = function ( object ) {

	object.addEventListener = SEA3D.EventDispatcher.prototype.addEvenListener;
	object.hasEventListener = SEA3D.EventDispatcher.prototype.hasEventListener;
	object.removeEventListener = SEA3D.EventDispatcher.prototype.removeEventListener;
	object.dispatchEvent = SEA3D.EventDispatcher.prototype.dispatchEvent;

};

/**
 * 	SEA3D for Three.JS
 * 	@author Sunag / http://www.sunag.com.br/
 */

'use strict';

//
//	SEA3D
//

THREE.SEA3D = function( config ) {

	this.config = config || {};

	if ( this.config.script == undefined ) this.config.script = true;
	if ( this.config.autoPlay == undefined ) this.config.autoPlay = false;
	if ( this.config.multiplier == undefined ) this.config.multiplier = 1;
	if ( this.config.bounding == undefined ) this.config.bounding = true;
	if ( this.config.standardMaterial == undefined ) this.config.standardMaterial = true;
	if ( this.config.audioRolloffFactor == undefined ) this.config.audioRolloffFactor = 10;
	if ( this.config.timeLimit == undefined ) this.config.timeLimit = 10;
	if ( this.config.streaming == undefined ) this.config.streaming = true;
	if ( this.config.lights == undefined ) this.config.lights = true;
	if ( this.config.useVertexTexture == undefined ) this.config.useVertexTexture = true;

};

THREE.SEA3D.prototype = {
	constructor: THREE.SEA3D,

	addEventListener: THREE.EventDispatcher.prototype.addEventListener,
	hasEventListener: THREE.EventDispatcher.prototype.hasEventListener,
	removeEventListener: THREE.EventDispatcher.prototype.removeEventListener,
	dispatchEvent: THREE.EventDispatcher.prototype.dispatchEvent,

	set container ( val ) {

		this.config.container = val;

	},

	get container () {

		return this.config.container;

	}
};

//
//	Defaults
//

THREE.SEA3D.BACKGROUND_COLOR = 0x333333;
THREE.SEA3D.HELPER_COLOR = 0x9AB9E5;
THREE.SEA3D.RTT_SIZE = 512;

//
//	Shader
//

//
//	Shader
//

THREE.SEA3D.ShaderLib = {};

THREE.SEA3D.ShaderLib.replaceCode = function( src, target, replace ) {

	for ( var i = 0; i < target.length; i ++ ) {

		var tar = target[ i ],
			rep = replace[ i ],
			index = src.indexOf( tar );

		if ( index > - 1 ) {

			src = src.substring( 0, index ) + rep + src.substring( index + tar.length );

		}

	}

	return src;

};

// TODO: Emissive to Ambient Color Extension

THREE.SEA3D.ShaderLib.fragStdMtl = THREE.SEA3D.ShaderLib.replaceCode( THREE.ShaderLib.phong.fragmentShader, [
	//	Target
	'vec3 outgoingLight = ( reflectedLight.directDiffuse + reflectedLight.indirectDiffuse ) * specular + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveLight;', // METAL
	'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveLight;'
], [
	//	Replace To
	'vec3 outgoingLight = ( reflectedLight.directDiffuse + reflectedLight.indirectDiffuse ) * specular + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveLight * specular;', // METAL
	'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveLight * diffuse;'
] );

//
//	Standard Material
//

THREE.SEA3D.StandardMaterial = function () {

	THREE.MeshPhongMaterial.call( this );

};

THREE.SEA3D.StandardMaterial.prototype = Object.create( THREE.MeshPhongMaterial.prototype );
THREE.SEA3D.StandardMaterial.prototype.constructor = THREE.SEA3D.StandardMaterial;

THREE.SEA3D.StandardMaterial.prototype.lightMapUV = 1;


THREE.SEA3D.StandardMaterial.prototype.__defineSetter__( "__webglShader", function( val ) {

	val.fragmentShader = THREE.SEA3D.ShaderLib.fragStdMtl;

	if ( this.lightMapUV == 0 ) {

		val.fragmentShader = THREE.SEA3D.ShaderLib.replaceCode( val.fragmentShader, "texture2D( aoMap, vUv2 )", "texture2D( aoMap, vUv )" );

	}

	this.__webglShader__ = val;

} );

THREE.SEA3D.StandardMaterial.prototype.__defineGetter__( "__webglShader", function() {

	return this.__webglShader__;

} );

THREE.SEA3D.StandardMaterial.prototype.copy = function ( source ) {

	THREE.MeshPhongMaterial.prototype.copy.call( this, source );

	return this;

};

THREE.SEA3D.StandardMaterial.prototype.clone = function() {

	return new this.constructor().copy( this );

};

//
//	Container
//

THREE.SEA3D.Object3D = function ( ) {

	THREE.Object3D.call( this );

};

THREE.SEA3D.Object3D.prototype = Object.create( THREE.Object3D.prototype );
THREE.SEA3D.Object3D.prototype.constructor = THREE.SEA3D.Object3D;

// Relative Animation Extension
// TODO: It can be done with shader

THREE.SEA3D.Object3D.prototype.updateAnimateMatrix = function( force ) {

	if ( this.matrixAutoUpdate === true ) this.updateMatrix();

	if ( this.matrixWorldNeedsUpdate === true || force === true ) {

		if ( this.parent === null ) {

			this.matrixWorld.copy( this.matrix );

		} else {

			this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

		}

		this.animateMatrix.compose( this.animatePosition, this.animateQuaternion, this.animateScale );

		this.matrixWorld.multiplyMatrices( this.matrixWorld, this.animateMatrix );

		this.matrixWorldNeedsUpdate = false;

		force = true;

	}

	// update children

	for ( var i = 0, l = this.children.length; i < l; i ++ ) {

		this.children[ i ].updateMatrixWorld( force );

	}

};

THREE.SEA3D.Object3D.prototype.setAnimateMatrix = function( val ) {

	if ( this.getAnimateMatrix() == val )
		return;

	if ( val ) {

		this.animateMatrix = new THREE.Matrix4();

		this.animatePosition = new THREE.Vector3();
		this.animateQuaternion = new THREE.Quaternion();
		this.animateScale = new THREE.Vector3( 1, 1, 1 );

		this.updateMatrixWorld = THREE.SEA3D.Object3D.prototype.updateAnimateMatrix;

	} else {

		delete this.animateMatrix;

		delete this.animatePosition;
		delete this.animateQuaternion;
		delete this.animateScale;

		this.updateMatrixWorld = THREE.Object3D.prototype.updateMatrixWorld;

	}

	this.matrixWorldNeedsUpdate = true;

};

THREE.SEA3D.Object3D.prototype.getAnimateMatrix = function() {

	return this.animateMatrix != undefined;

};

//
//	Dummy
//

THREE.SEA3D.Dummy = function ( width, height, depth ) {

	this.width = width != undefined ? width : 100;
	this.height = height != undefined ? height : 100;
	this.depth = depth != undefined ? depth : 100;

	var geo = new THREE.BoxGeometry( this.width, this.height, this.depth, 1, 1, 1 );

	THREE.Mesh.call( this, geo, THREE.SEA3D.Dummy.MATERIAL );

};

THREE.SEA3D.Dummy.prototype = Object.create( THREE.Mesh.prototype );
THREE.SEA3D.Dummy.prototype.constructor = THREE.Dummy;

THREE.SEA3D.Dummy.prototype.setAnimateMatrix = THREE.SEA3D.Object3D.prototype.setAnimateMatrix;
THREE.SEA3D.Dummy.prototype.getAnimateMatrix = THREE.SEA3D.Object3D.prototype.getAnimateMatrix;

THREE.SEA3D.Dummy.MATERIAL = new THREE.MeshBasicMaterial( { wireframe: true, color: THREE.SEA3D.HELPER_COLOR } );

THREE.SEA3D.Dummy.prototype.clone = function ( object ) {

	return new this.constructor( this.width, this.height, this.depth ).copy( this );

};

THREE.SEA3D.Dummy.prototype.dispose = function () {

	this.geometry.dispose();

};

//
//	Mesh
//

THREE.SEA3D.Mesh = function ( geometry, material ) {

	THREE.Mesh.call( this, geometry, material );

};

THREE.SEA3D.Mesh.prototype = Object.create( THREE.Mesh.prototype );
THREE.SEA3D.Mesh.prototype.constructor = THREE.Mesh;

THREE.SEA3D.Mesh.prototype.setAnimateMatrix = THREE.SEA3D.Object3D.prototype.setAnimateMatrix;
THREE.SEA3D.Mesh.prototype.getAnimateMatrix = THREE.SEA3D.Object3D.prototype.getAnimateMatrix;

THREE.SEA3D.Mesh.prototype.setWeight = function( name, val ) {

	this.morphTargetInfluences[ this.morphTargetDictionary[ name ] ] = val;

};

THREE.SEA3D.Mesh.prototype.getWeight = function( name ) {

	return this.morphTargetInfluences[ this.morphTargetDictionary[ name ] ];

};

THREE.SEA3D.Mesh.prototype.copy = function ( source ) {

	THREE.Mesh.prototype.copy.call( this, source );

	if ( this.animation )
		this.animation = source.animation.clone( this );

	return this;

};

THREE.SEA3D.Mesh.prototype.clone = function ( object ) {

	return new this.constructor( this.geometry, this.material ).copy( this );

};

//
//	Skinning
//

THREE.SEA3D.SkinnedMesh = function ( geometry, material, useVertexTexture ) {

	THREE.SkinnedMesh.call( this, geometry, material, useVertexTexture );

};

THREE.SEA3D.SkinnedMesh.prototype = Object.create( THREE.SkinnedMesh.prototype );
THREE.SEA3D.SkinnedMesh.prototype.constructor = THREE.SEA3D.SkinnedMesh;

THREE.SEA3D.SkinnedMesh.prototype.setAnimateMatrix = THREE.SEA3D.Object3D.prototype.setAnimateMatrix;
THREE.SEA3D.SkinnedMesh.prototype.getAnimateMatrix = THREE.SEA3D.Object3D.prototype.getAnimateMatrix;

THREE.SEA3D.SkinnedMesh.prototype.setWeight = THREE.SEA3D.Mesh.prototype.setWeight;
THREE.SEA3D.SkinnedMesh.prototype.getWeight = THREE.SEA3D.Mesh.prototype.getWeight;

THREE.SEA3D.SkinnedMesh.prototype.isPlaying = false;

THREE.SEA3D.SkinnedMesh.prototype.stop = function() {

	if ( this.currentAnimation ) {

		this.currentAnimation.stop();

		delete this.currentAnimation;

		this.isPlaying = false;

	}

};

THREE.SEA3D.SkinnedMesh.prototype.pause = function() {

	if ( this.isPlaying ) {

		this.currentAnimation.pause();
		this.isPlaying = false;

	}

};

THREE.SEA3D.SkinnedMesh.prototype.resume = function() {

	if ( ! this.isPlaying && this.currentAnimation ) {

		this.currentAnimation.pause();
		this.isPlaying = true;

	}

};

THREE.SEA3D.SkinnedMesh.prototype.play = function( name, crossfade, offset ) {

	var animation = this.animations[ name ];

	if ( ! animation )
		throw new Error( 'Animation "' + name + '" not found.' );

	animation.play( offset !== undefined ? offset : animation.currentTime, animation.weight );

	this.currentAnimation = animation;

	this.isPlaying = true;

	THREE.SEA3D.AnimationHandler.addCrossfade( this, crossfade !== undefined ? crossfade : 0 );

};

THREE.SEA3D.SkinnedMesh.prototype.setAnimations = function( animations ) {

	var nsIndex = animations[ 0 ].name.indexOf( "/" ) + 1;

	this.animations = [];
	this.easeSpeed = 2;
	this.blendMethod = SEA3D.AnimationBlendMethod.LINEAR;
	this.animationNamespace = animations[ 0 ].name.substring( 0, nsIndex );

	for ( var i = 0; i < animations.length; i ++ ) {

		var ns = animations[ i ].name;
		var name = ns.substring( nsIndex );

		this.animations[ i ] = new THREE.SEA3D.Animation( this, animations[ i ] );
		this.animations[ i ].loop = animations[ i ].repeat;
		this.animations[ i ].name = name;

		this.animations[ name ] = this.animations[ i ];

	}

};

THREE.SEA3D.SkinnedMesh.prototype.boneByName = function( name ) {

	var bones = this.skeleton.bones;

	for ( var i = 0, bl = bones.length; i < bl; i ++ ) {

		if ( name == bones[ i ].name )
			return bones[ i ];

	}

};

THREE.SEA3D.SkinnedMesh.prototype.copy = function ( source ) {

	THREE.SkinnedMesh.prototype.copy.call( this, source );

	if ( this.animation )
		this.animation = source.animation.clone( this );

	if ( this.geometry.animations ) {

		this.setAnimations( this.geometry.animations );

	}

	return this;

};

THREE.SEA3D.SkinnedMesh.prototype.clone = function ( object ) {

	return new this.constructor( this.geometry, this.material, this.useVertexTexture ).copy( this );

};

//
//	Vertex Animation
//

THREE.SEA3D.VertexAnimationMesh = function ( geometry, material, fps ) {

	THREE.MorphAnimMesh.call( this, geometry, material );

	this.fps = fps !== undefined ? fps : 30;
	this.animations = geometry.animations;

	this.isPlaying = false;

	this.totalTime = 0;

	this.playingCallback = this.updateAnimation.bind( this );

};

THREE.SEA3D.VertexAnimationMesh.prototype = Object.create( THREE.MorphAnimMesh.prototype );
THREE.SEA3D.VertexAnimationMesh.prototype.constructor = THREE.SEA3D.VertexAnimationMesh;

THREE.SEA3D.VertexAnimationMesh.prototype.setAnimateMatrix = THREE.SEA3D.Object3D.prototype.setAnimateMatrix;
THREE.SEA3D.VertexAnimationMesh.prototype.getAnimateMatrix = THREE.SEA3D.Object3D.prototype.getAnimateMatrix;

THREE.SEA3D.VertexAnimationMesh.prototype.play = function( name, offset ) {

	var animation = this.animations[ name ];

	this.setFrameRange( animation.start ? animation.start : 1, animation.end - 1 );

	this.duration = ( animation.end - animation.start ) / this.fps;
	this.time = offset !== undefined ? offset : this.time;

	this.resume();

};

THREE.SEA3D.VertexAnimationMesh.prototype.pause = function() {

	if ( this.isPlaying ) {

		this.isPlaying = false;

		THREE.SEA3D.AnimationHandler.removeUpdate( this.playingCallback );

	}

};

THREE.SEA3D.VertexAnimationMesh.prototype.resume = function() {

	if ( ! this.isPlaying ) {

		this.isPlaying = true;

		THREE.SEA3D.AnimationHandler.addUpdate( this.playingCallback );

	}

};

THREE.SEA3D.VertexAnimationMesh.prototype.stop = function() {

	this.pause();

	this.time = 0;

};

THREE.SEA3D.VertexAnimationMesh.prototype.clone = function ( object ) {

	return new this.constructor( this.geometry, this.material, this.fps ).copy( this );

};

//
//	Camera
//

THREE.SEA3D.Camera = function ( fov, aspect, near, far ) {

	THREE.PerspectiveCamera.call( this, fov, aspect, near, far );

};

THREE.SEA3D.Camera.prototype = Object.create( THREE.PerspectiveCamera.prototype );
THREE.SEA3D.Camera.prototype.constructor = THREE.SEA3D.Camera;

THREE.SEA3D.Camera.prototype.setAnimateMatrix = THREE.SEA3D.Object3D.prototype.setAnimateMatrix;
THREE.SEA3D.Camera.prototype.getAnimateMatrix = THREE.SEA3D.Object3D.prototype.getAnimateMatrix;

THREE.SEA3D.Camera.prototype.copy = function ( source ) {

	THREE.PerspectiveCamera.prototype.copy.call( this, source );

	return this;

};

//
//	Animation Update
//

THREE.SEA3D.AnimationHandler = {

	crossfade : [],
	updates : [],

	update : function( dt ) {

		var i, j, cf = THREE.SEA3D.AnimationHandler.crossfade, ups = THREE.SEA3D.AnimationHandler.updates;

		// crossfade

		i = 0;
		while ( i < cf.length ) {

			var mesh = cf[ i ],
				len = mesh.animations.length,
				weight = 1,
				delta = Math.abs( dt ) / mesh.crossfade;

			if ( mesh.blendMethod === SEA3D.AnimationBlendMethod.EASING ) {

				delta *= mesh.easeSpeed;

			}

			while ( len ) {

				var state = mesh.animations[ -- len ];

				if ( state.weight > 0 && state != mesh.currentAnimation ) {

					if ( mesh.blendMethod === SEA3D.AnimationBlendMethod.LINEAR ) {

						state.weight -= delta;

					}
					else if ( mesh.blendMethod === SEA3D.AnimationBlendMethod.EASING ) {

						state.weight -= state.weight * delta;

					}

					if ( state.weight < 0 ) state.weight = 0;

					weight -= state.weight;

				}

			}

			if ( weight < 0 ) weight = 0;

			mesh.currentAnimation.weight = weight;

			if ( weight == 1 ) {

				cf.splice( i, 1 );

				delete mesh.crossfade;

				if ( mesh.onCrossfadeComplete ) mesh.onCrossfadeComplete( mesh );

			}
			else ++ i;

		}

		// updates
		i = 0;
		while ( i < ups.length ) {

			ups[ i ++ ]( dt );

		}

		SEA3D.AnimationHandler.update( dt );

	},

	addCrossfade : function( mesh, crossfade ) {

		var fadelist = THREE.SEA3D.AnimationHandler.crossfade;

		if ( crossfade > 0 )
		{

			if ( ! mesh.crossfade ) fadelist.push( mesh );

			mesh.crossfade = crossfade;

		}
		else
		{

			var len = mesh.animations.length;

			while ( len ) {

				mesh.animations[ -- len ].weight = 0;

			}

			if ( mesh.crossfade ) {

				fadelist.splice( fadelist.indexOf( mesh ), 1 );

				delete mesh.crossfade;

				if ( mesh.onCrossfadeComplete ) mesh.onCrossfadeComplete( mesh );

			}

			mesh.currentAnimation.weight = 1;

		}

	},

	addUpdate : function( func ) {

		THREE.SEA3D.AnimationHandler.updates.push( func );

	},

	removeUpdate : function( func ) {

		var index = THREE.SEA3D.AnimationHandler.updates.indexOf( func );

		if ( index !== - 1 ) {

			THREE.SEA3D.AnimationHandler.updates.splice( THREE.SEA3D.AnimationHandler.updates.indexOf( func ), 1 );

		}

	}

};

//
//	Animation Event
//

THREE.SEA3D.Animation = function ( root, data ) {

	THREE.Animation.call( this, root, data );

};

THREE.SEA3D.Animation.prototype = Object.create( THREE.Animation.prototype );
THREE.SEA3D.Animation.prototype.constructor = THREE.SEA3D.Animation;

THREE.SEA3D.Animation.prototype.stop = function() {

	if ( this.onComplete ) this.onComplete( this );

	THREE.Animation.prototype.stop.call( this );

};

THREE.SEA3D.Animation.prototype.reset = function() {

	if ( this.onReset ) this.onReset( this );

	THREE.Animation.prototype.reset.call( this );

};

//
//	Config
//

THREE.SEA3D.MTXBUF = new THREE.Matrix4();
THREE.SEA3D.VECBUF = new THREE.Vector3();
THREE.SEA3D.QUABUF = new THREE.Quaternion();

THREE.SEA3D.prototype.setShadowMap = function( light, opacity ) {

	light.shadowMapWidth =
	light.shadowMapHeight = 2048;

	light.castShadow = true;
	light.shadowDarkness = opacity == undefined ? 1 : opacity;

};

//
//	Output
//

THREE.SEA3D.prototype.getMesh = function( name ) {

	return this.objects[ "m3d/" + name ];

};

THREE.SEA3D.prototype.getDummy = function( name ) {

	return this.objects[ "dmy/" + name ];

};

THREE.SEA3D.prototype.getLine = function( name ) {

	return this.objects[ "line/" + name ];

};

THREE.SEA3D.prototype.getSound3D = function( name ) {

	return this.objects[ "sn3d/" + name ];

};

THREE.SEA3D.prototype.getMaterial = function( name ) {

	return this.objects[ "mat/" + name ];

};

THREE.SEA3D.prototype.getLight = function( name ) {

	return this.objects[ "lht/" + name ];

};

THREE.SEA3D.prototype.getGLSL = function( name ) {

	return this.objects[ "glsl/" + name ];

};

THREE.SEA3D.prototype.getCamera = function( name ) {

	return this.objects[ "cam/" + name ];

};

THREE.SEA3D.prototype.getTexture = function( name ) {

	return this.objects[ "tex/" + name ];

};

THREE.SEA3D.prototype.getCubeMap = function( name ) {

	return this.objects[ "cmap/" + name ];

};

THREE.SEA3D.prototype.getJointObject = function( name ) {

	return this.objects[ "jnt/" + name ];

};

THREE.SEA3D.prototype.getContainer3D = function( name ) {

	return this.objects[ "c3d/" + name ];

};

THREE.SEA3D.prototype.getSprite = function( name ) {

	return this.objects[ "m2d/" + name ];

};

THREE.SEA3D.prototype.getProperty = function( name ) {

	return this.objects[ "prop/" + name ];

};

//
//	Utils
//

THREE.SEA3D.prototype.isPowerOfTwo = function( num ) {

	return num ? ( ( num & - num ) == num ) : false;

};

THREE.SEA3D.prototype.nearestPowerOfTwo = function( num ) {

	return Math.pow( 2, Math.round( Math.log( num ) / Math.LN2 ) );

};

THREE.SEA3D.prototype.updateTransform = function( obj3d, sea ) {

	var mtx = THREE.SEA3D.MTXBUF, vec = THREE.SEA3D.VECBUF;

	if ( sea.transform ) mtx.elements.set( sea.transform );
	else mtx.makeTranslation( sea.position.x, sea.position.y, sea.position.z );

	// matrix

	obj3d.position.setFromMatrixPosition( mtx );
	obj3d.scale.setFromMatrixScale( mtx );

	// ignore rotation scale

	mtx.scale( vec.set( 1 / obj3d.scale.x, 1 / obj3d.scale.y, 1 / obj3d.scale.z ) );
	obj3d.rotation.setFromRotationMatrix( mtx );

	// optimize if is static

	if ( sea.isStatic ) {

		obj3d.updateMatrixWorld();
		obj3d.matrixAutoUpdate = false;

	}

};

THREE.SEA3D.prototype.toVector3 = function( data ) {

	return new THREE.Vector3( data.x, data.y, data.z );

};

THREE.SEA3D.prototype.scaleColor = function( color, scale ) {

	var r = ( color >> 16 ) * scale;
	var g = ( color >> 8 & 0xFF ) * scale;
	var b = ( color & 0xFF ) * scale;

	return ( r << 16 | g << 8 | b );

};

THREE.SEA3D.prototype.updateScene = function() {

	if ( this.materials != undefined ) {

		for ( var i = 0, l = this.materials.length; i < l; ++ i ) {

			this.materials[ i ].needsUpdate = true;

		}

	}

};

THREE.SEA3D.prototype.addSceneObject = function( sea ) {

	var obj3d = sea.tag;

	obj3d.userData = sea.properties;

	if ( this.config.script && sea.scripts ) {

		this.runJSMList( obj3d, sea.scripts );

	}

	if ( sea.parent )
		sea.parent.tag.add( obj3d );
	else if ( this.config.container )
		this.config.container.add( obj3d );

	obj3d.visible = sea.visible;

};

THREE.SEA3D.prototype.createObjectURL = function( raw, mime ) {

	return ( window.URL || window.webkitURL ).createObjectURL( new Blob( [ raw ], { type: mime } ) );

};

THREE.SEA3D.prototype.bufferToTexture = function( raw ) {

	return this.createObjectURL( raw, "image" );

};

THREE.SEA3D.prototype.bufferToSound = function( raw ) {

	return this.createObjectURL( raw, "audio" );

};

THREE.SEA3D.prototype.applyDefaultAnimation = function( sea, animatorClass ) {

	var obj = sea.tag;

	for ( var i = 0, count = sea.animations ? sea.animations.length : 0; i < count; i ++ ) {

		var anm = sea.animations[ i ];

		switch ( anm.tag.type ) {
			case SEA3D.Animation.prototype.type:
				obj.animation = new animatorClass( obj, anm.tag.tag );
				obj.animation.setRelative( anm.relative );

				if ( this.config.autoPlay ) {

					obj.animation.play( obj.animation.getStateNameByIndex( 0 ) );

				}

				return obj.animation;
				break;
		}

	}

};

//
//	Animation
//

THREE.SEA3D.prototype.readAnimation = function( sea ) {

	var anmSet = new SEA3D.AnimationSet();

	for ( var i = 0; i < sea.sequence.length; i ++ ) {

		var seq = sea.sequence[ i ],
			node = new SEA3D.AnimationNode( seq.name, sea.frameRate, seq.count, seq.repeat, seq.intrpl );

		for ( var j = 0; j < sea.dataList.length; j ++ ) {

			var anmData = sea.dataList[ j ];

			node.addData( new SEA3D.AnimationData( anmData.kind, anmData.type, anmData.data, seq.start * anmData.blockSize ) );

		}

		anmSet.addAnimation( node );

	}

	this.domain.animationSets = this.animationSets = this.animationSets || [];
	this.animationSets.push( this.objects[ sea.name + '.#anm' ] = sea.tag = anmSet );

};

//
//	Object3D Animator
//

THREE.SEA3D.Object3DAnimator = function( object3d, animationSet ) {

	SEA3D.AnimationHandler.call( this, animationSet );

	this.object3d = object3d;

};

THREE.SEA3D.Object3DAnimator.prototype = Object.create( SEA3D.AnimationHandler.prototype );
THREE.SEA3D.Object3DAnimator.prototype.constructor = THREE.SEA3D.Object3DAnimator;

THREE.SEA3D.Object3DAnimator.prototype.stop = function() {

	if ( this.relative ) {

		this.object3d.animatePosition = new THREE.Vector3();
		this.object3d.animateQuaternion = new THREE.Quaternion();
		this.object3d.animateScale = new THREE.Vector3( 1, 1, 1 );

	}

	SEA3D.AnimationHandler.prototype.stop.call( this );

};

THREE.SEA3D.Object3DAnimator.prototype.setRelative = function( val ) {

	this.object3d.setAnimateMatrix( this.relative = val );

};

THREE.SEA3D.Object3DAnimator.prototype.updateAnimationFrame = function( frame, kind ) {

	if ( this.relative ) {

		switch ( kind ) {
			case SEA3D.Animation.POSITION:
				var v = frame.toVector();

				this.object3d.animatePosition.set( v.x, v.y, v.z );
				break;

			case SEA3D.Animation.ROTATION:
				var v = frame.toVector();

				this.object3d.animateQuaternion.set( v.x, v.y, v.z, v.w );
				break;

			case SEA3D.Animation.SCALE:
				var v = frame.toVector();

				this.object3d.animateScale.set( v.x, v.y, v.z );
				break;
		}

		this.object3d.matrixWorldNeedsUpdate = true;

	} else {

		switch ( kind ) {
			case SEA3D.Animation.POSITION:
				var v = frame.toVector();

				this.object3d.position.set( v.x, v.y, v.z );
				break;

			case SEA3D.Animation.ROTATION:
				var v = frame.toVector();

				this.object3d.quaternion.set( v.x, v.y, v.z, v.w );
				break;

			case SEA3D.Animation.SCALE:
				var v = frame.toVector();

				this.object3d.scale.set( v.x, v.y, v.z );
				break;
		}

	}

};

//
//	Camera Animator
//

THREE.SEA3D.CameraAnimator = function( object3d, animationSet ) {

	THREE.SEA3D.Object3DAnimator.call( this, object3d, animationSet );

};

THREE.SEA3D.CameraAnimator.prototype = Object.create( THREE.SEA3D.Object3DAnimator.prototype );
THREE.SEA3D.CameraAnimator.prototype.constructor = THREE.SEA3D.Object3DAnimator;

THREE.SEA3D.CameraAnimator.prototype.updateAnimationFrame = function( frame, kind ) {

	switch ( kind ) {
		case SEA3D.Animation.FOV:
			this.object3d.fov = frame.getX();
			break;

		default:
			THREE.SEA3D.Object3DAnimator.prototype.updateAnimationFrame.call( this, frame, kind );
			break;
	}

};

//
//	Light Animator
//

THREE.SEA3D.LightAnimator = function( object3d, animationSet ) {

	THREE.SEA3D.Object3DAnimator.call( this, object3d, animationSet );

};

THREE.SEA3D.LightAnimator.prototype = Object.create( THREE.SEA3D.Object3DAnimator.prototype );
THREE.SEA3D.LightAnimator.prototype.constructor = THREE.SEA3D.Object3DAnimator;

THREE.SEA3D.LightAnimator.prototype.updateAnimationFrame = function( frame, kind ) {

	switch ( kind ) {
		case SEA3D.Animation.COLOR:
			this.object3d.color.setHex( frame.getX() );
			break;

		case SEA3D.Animation.MULTIPLIER:
			this.object3d.intensity = frame.getX();
			break;

		default:
			THREE.SEA3D.Object3DAnimator.prototype.updateAnimationFrame.call( this, frame, kind );
			break;
	}

};

//
//	Geometry
//

THREE.SEA3D.prototype.readGeometryBuffer = function( sea ) {

	var	geo = new THREE.BufferGeometry();

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

		geo.addAttribute( 'skinIndex', new THREE.Float32Attribute( sea.joint, sea.jointPerVertex ) );
		geo.addAttribute( 'skinWeight', new THREE.Float32Attribute( sea.weight, sea.jointPerVertex ) );

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

THREE.SEA3D.prototype.readDummy = function( sea ) {

	var dummy = new THREE.SEA3D.Dummy( sea.width, sea.height, sea.depth );
	dummy.name = sea.name;

	this.domain.dummys = this.dummys = this.dummys || [];
	this.dummys.push( this.objects[ "dmy/" + sea.name ] = sea.tag = dummy );

	this.addSceneObject( sea );
	this.updateTransform( dummy, sea );

	this.applyDefaultAnimation( sea, THREE.SEA3D.Object3DAnimator );

};

//
//	Line
//

THREE.SEA3D.prototype.readLine = function( sea ) {

	var	geo = new THREE.BufferGeometry();

	if ( sea.closed )
		sea.vertex.push( sea.vertex[ 0 ], sea.vertex[ 1 ], sea.vertex[ 2 ] );

	geo.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( sea.vertex ), 3 ) );

	var line = new THREE.Line( geo, new THREE.LineBasicMaterial( { color: THREE.SEA3D.HELPER_COLOR, linewidth: 3 } ) );
	line.name = sea.name;

	this.lines = this.lines || [];
	this.lines.push( this.objects[ "line/" + sea.name ] = sea.tag = line );

	this.addSceneObject( sea );
	this.updateTransform( line, sea );

	this.applyDefaultAnimation( sea, THREE.SEA3D.Object3DAnimator );

};

//
//	Container3D
//

THREE.SEA3D.prototype.readContainer3D = function( sea ) {

	var container = new THREE.SEA3D.Object3D();

	this.domain.containers = this.containers = this.containers || [];
	this.containers.push( this.objects[ "c3d/" + sea.name ] = sea.tag = container );

	this.addSceneObject( sea );
	this.updateTransform( container, sea );

	this.applyDefaultAnimation( sea, THREE.SEA3D.Object3DAnimator );

};

//
//	Mesh2D | Sprite
//

THREE.SEA3D.prototype.readMesh2D = function( sea ) {

	var material;

	if ( sea.material ) {

		if ( ! sea.material.tag.sprite ) {

			material = sea.material.tag.sprite = new THREE.SpriteMaterial();

			material.map = sea.material.tag.map;
			material.map.flipY = true;

			material.color = sea.material.tag.emissive;
			material.opacity = sea.material.tag.opacity;
			material.blending = sea.material.tag.blending;

		}
		else material = sea.material.tag.sprite;

	}

	var sprite = new THREE.Sprite( material );
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

THREE.SEA3D.prototype.readMesh = function( sea ) {

	var i, count, geo = sea.geometry.tag,
		mesh, mat, skeleton, skeletonAnimation, vertexAnimation, morpher;

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

				geo.animations = this.getSkeletonAnimation( skeletonAnimation, skeleton );
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

			mat = new THREE.MultiMaterial( mats );

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

		if ( skeletonAnimation ) {

			mesh.setAnimations( geo.animations );

			if ( this.config.autoPlay ) {

				mesh.play( mesh.animations[ 0 ].name );

			}

		}

	} else if ( vertexAnimation ) {

		mesh = new THREE.SEA3D.VertexAnimationMesh( geo, mat, vertexAnimation.frameRate );

		if ( this.config.autoPlay ) {

			mesh.play( mesh.animations[ 0 ].name );

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

	this.applyDefaultAnimation( sea, THREE.SEA3D.Object3DAnimator );

};

//
//	Sound Point
//

THREE.SEA3D.prototype.readSoundPoint = function( sea ) {

	if ( ! this.audioListener ) {

		 this.audioListener = new THREE.AudioListener();

		 if ( this.config.container ) {

			this.config.container.add( this.audioListener );

		}

	}

	var sound3d = new THREE.PositionalAudio( this.audioListener );

	sound3d.load( sea.sound.tag );
	sound3d.autoplay = sea.autoPlay;
	sound3d.setLoop( sea.autoPlay );
	sound3d.setVolume( sea.volume );
	sound3d.setRefDistance( sea.distance );
	sound3d.setRolloffFactor( this.config.audioRolloffFactor );

	sound3d.name = sea.name;

	this.domain.sounds3d = this.sounds3d = this.sounds3d || [];
	this.sounds3d.push( this.objects[ "sn3d/" + sea.name ] = sea.tag = sound3d );

	this.addSceneObject( sea );
	this.updateTransform( sound3d, sea );

	this.applyDefaultAnimation( sea, THREE.SEA3D.Object3DAnimator );

};

//
//	Cube Render
//

THREE.SEA3D.prototype.readCubeRender = function( sea ) {

	var cube = new THREE.CubeCamera( 0.1, 5000, THREE.SEA3D.RTT_SIZE );
	cube.renderTarget.cubeCamera = cube;

	this.domain.cubeRenderers = this.cubeRenderers = this.cubeRenderers || [];
	this.cubeRenderers.push( this.objects[ "rttc/" + sea.name ] = sea.tag = cube.renderTarget );

	this.addSceneObject( sea );
	this.updateTransform( cube, sea );

	this.applyDefaultAnimation( sea, THREE.SEA3D.Object3DAnimator );

};

//
//	Images (WDP, JPEG, PNG and GIF)
//

THREE.SEA3D.prototype.readImage = function( sea ) {

	var image = new Image(), texture = new THREE.Texture();
	image.src = this.bufferToTexture( sea.data.buffer );
	
	texture.name = sea.name;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.flipY = false;
	texture.image = image;
	texture.needsUpdate = true;

	this.domain.textures = this.textures = this.textures || [];
	this.textures.push( this.objects[ "tex/" + sea.name ] = sea.tag = texture );

};

//
//	Cube Map
//

THREE.SEA3D.prototype.readCubeMap = function( sea ) {

	var images = [],
		texture = new THREE.Texture();

	// xyz(- / +) to xyz(+ / -) sequence
	var faces = [];

	faces[ 0 ] = sea.faces[ 1 ];
	faces[ 1 ] = sea.faces[ 0 ];
	faces[ 2 ] = sea.faces[ 3 ];
	faces[ 3 ] = sea.faces[ 2 ];
	faces[ 4 ] = sea.faces[ 5 ];
	faces[ 5 ] = sea.faces[ 4 ];

	images.loadedCount = 0;

	texture.name = sea.name;
	texture.image = images;
	texture.flipY = false;

	for ( var i = 0, il = faces.length; i < il; ++ i ) {

		var cubeImage = new Image();

		images[ i ] = cubeImage;

		cubeImage.onload = function () {

			if ( ++ images.loadedCount == 6 ) {

				texture.needsUpdate = true;

			}

		}

		cubeImage.src = this.bufferToTexture( faces[ i ].buffer );

	}

	this.domain.cubemaps = this.cubemaps = this.cubemaps || [];
	this.cubemaps.push( this.objects[ "cmap/" + sea.name ] = sea.tag = texture );

};

//
//	Sound (MP3, OGG)
//

THREE.SEA3D.prototype.readSound = function( sea ) {

	var sound = this.bufferToSound( sea.data.buffer );

	this.domain.sounds = this.sounds = this.sounds || [];
	this.sounds.push( this.objects[ "snd/" + sea.name ] = sea.tag = sound );

};

//
//	Texture URL
//

THREE.SEA3D.prototype.readTextureURL = function( sea ) {

	var texture = THREE.ImageUtils.loadTexture( sea.url );

	texture.name = sea.name;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.flipY = false;

	this.domain.textures = this.textures = this.textures || [];
	this.textures.push( this.objects[ "tex/" + sea.name ] = sea.tag = texture );

};

//
//	Java Script
//

THREE.SEA3D.SCRIPT = new SEA3D.ScriptManager();

THREE.SEA3D.SCRIPT.dispatchUpdate = function( delta ) {

	this.dispatchEvent( {
		type : "update",
		delta : delta
	} );

};

THREE.SEA3D.Domain = function( id, objects, container, extensions ) {

	SEA3D.Domain.call( this, id );

	this.objects = objects;
	this.container = container;
	this.extensions = extensions || [];

};

THREE.SEA3D.Domain.prototype = Object.create( SEA3D.Domain.prototype );
THREE.SEA3D.Domain.prototype.constructor = THREE.SEA3D.Domain;

THREE.SEA3D.Domain.prototype.disposeExtensions = function() {

	extensions = extensions.concat();

	var i = list.length;

	while ( i -- ) list[ i ].dispose();

};

THREE.SEA3D.Domain.prototype.disposeList = function( list ) {

	if ( ! list || ! list.length ) return;

	list = list.concat();

	var i = list.length;
	while ( i -- ) list[ i ].dispose();

};

THREE.SEA3D.Domain.prototype.dispose = function() {

	SEA3D.Domain.prototype.dispose.call( this );

	while ( this.container.children.length ) {

		this.container.remove( this.container.children[ 0 ] );

	}

	var i = this.extensions.length;
	while ( i -- ) this.extensions[ i ].dispose.call( this );

	this.disposeList( this.materials );
	this.disposeList( this.dummys );

};

SEA3D.Domain.prototype.getMesh = THREE.SEA3D.prototype.getMesh;
SEA3D.Domain.prototype.getDummy = THREE.SEA3D.prototype.getDummy;
SEA3D.Domain.prototype.getLine = THREE.SEA3D.prototype.getLine;
SEA3D.Domain.prototype.getSound3D = THREE.SEA3D.prototype.getSound3D;
SEA3D.Domain.prototype.getMaterial = THREE.SEA3D.prototype.getMaterial;
SEA3D.Domain.prototype.getLight = THREE.SEA3D.prototype.getLight;
SEA3D.Domain.prototype.getGLSL = THREE.SEA3D.prototype.getGLSL;
SEA3D.Domain.prototype.getCamera = THREE.SEA3D.prototype.getCamera;
SEA3D.Domain.prototype.getTexture = THREE.SEA3D.prototype.getTexture;
SEA3D.Domain.prototype.getCubeMap = THREE.SEA3D.prototype.getCubeMap;
SEA3D.Domain.prototype.getJointObject = THREE.SEA3D.prototype.getJointObject;
SEA3D.Domain.prototype.getContainer3D = THREE.SEA3D.prototype.getContainer3D;
SEA3D.Domain.prototype.getSprite = THREE.SEA3D.prototype.getSprite;
SEA3D.Domain.prototype.getProperty = THREE.SEA3D.prototype.getProperty;

THREE.SEA3D.DomainManager = function( autoDisposeRootDomain ) {

	SEA3D.DomainManager.call( this, autoDisposeRootDomain );

};

THREE.SEA3D.DomainManager.prototype = Object.create( SEA3D.DomainManager.prototype );
THREE.SEA3D.DomainManager.prototype.constructor = THREE.SEA3D.DomainManager;

THREE.SEA3D.DomainManager.prototype.add = function( domain ) {

	SEA3D.DomainManager.prototype.add.call( this, domain );

	this.textures = this.textures || domain.textures;
	this.cubemaps = this.cubemaps || domain.cubemaps;
	this.geometries = this.geometries || domain.geometries;

};

THREE.SEA3D.DomainManager.prototype.disposeList = THREE.SEA3D.Domain.prototype.disposeList;

THREE.SEA3D.DomainManager.prototype.dispose = function() {

	SEA3D.DomainManager.prototype.dispose.call( this );

	this.disposeList( this.textures );
	this.disposeList( this.cubemaps );
	this.disposeList( this.geometries );

};

//
//	Runtime
//

THREE.SEA3D.prototype.runJSMList = function( target, scripts, root ) {

	for ( var i = 0; i < scripts.length; i ++ ) {

		var script = scripts[ i ];

		if ( script.tag.type == SEA3D.JavaScriptMethod.prototype.type ) {

			this.runJSM( target, script, root );

		}

	}

};

THREE.SEA3D.prototype.runJSM = function( target, script, root ) {

	if ( target.local == undefined ) target.local = {};

	var include = {
		print : this.domain.print,
		watch : this.domain.watch,
		sea3d : this.domain,
		scene : this.config.container,
		source : new SEA3D.Script( this.domain, root == true )
	};

	Object.freeze( include.source );

	THREE.SEA3D.SCRIPT.add( include.source );

	try {

		this.script[ script.method ] (
			include,
			this.domain.getReference,
			this.domain.global,
			target.local,
			target,
			script.params
		);

	}
	catch ( e ) {

		console.error( 'SEA3D JavaScript: Error running method "' + script.method + '".' );
		console.error( e );

	}

};

THREE.SEA3D.prototype.readJavaScriptMethod = function( sea ) {

	try {

		var src =
			'(function() {\n' +
			'var $METHOD = {}\n';

		var declare =
			'function($INC, $REF, global, local, $his, $PARAM) {\n' +
			'var watch = $INC["watch"],\n' +
			'scene = $INC["scene"],\n' +
			'sea3d = $INC["sea3d"],\n' +
			'print = $INC["print"];\n';

		declare +=
			'var $SRC = $INC["source"],\n' +
			'addEvent = $SRC.addEvent.bind( $SRC ),\n' +
			'hasEvent = $SRC.hasEvent.bind( $SRC ),\n' +
			'dispatchEvent = $SRC.dispatchEvent.bind( $SRC ),\n' +
			'removeEvent = $SRC.removeEvent.bind( $SRC ),\n' +
			'dispose = $SRC.dispose.bind( $SRC );\n'

		for ( var name in sea.methods ) {

			src += '$METHOD["' + name + '"] = ' + declare + sea.methods[ name ].src + '}\n';

		}

		src += 'return $METHOD; })'

		this.script = eval( src )();

	}
	catch ( e ) {

		console.error( 'SEA3D JavaScriptMethod: Error running "' + sea.name + '".' );
		console.error( e );

	}

};

//
//	GLSL
//

THREE.SEA3D.prototype.readGLSL = function( sea ) {

	this.domain.glsl = this.glsl = this.glsl || [];
	this.glsl.push( this.objects[ "glsl/" + sea.name ] = sea.tag = sea.src );

};

//
//	Material
//

THREE.SEA3D.prototype.blendMode = {
	normal: THREE.NormalBlending,
	add: THREE.AdditiveBlending,
	subtract: THREE.SubtractiveBlending,
	multiply: THREE.MultiplyBlending,
	screen: THREE.AdditiveBlending
};

THREE.SEA3D.prototype.materialTechnique =
( function() {

	var techniques = {}

	// DEFAULT
	techniques[ SEA3D.Material.DEFAULT ] =
	function( tech, mat ) {

		mat.emissive.setHex( tech.ambientColor );
		mat.color.setHex( tech.diffuseColor );
		mat.specular.setHex( this.scaleColor( tech.specularColor, tech.specular ) );
		mat.shininess = tech.gloss;

	}

	// DIFFUSE_MAP
	techniques[ SEA3D.Material.DIFFUSE_MAP ] =
	function( tech, mat ) {

		mat.map = tech.texture.tag;
		mat.transparent = tech.texture.transparent;
		mat.color.setHex( 0xFFFFFF );

	}

	// SPECULAR_MAP
	techniques[ SEA3D.Material.SPECULAR_MAP ] =
	function( tech, mat ) {

		mat.specularMap = tech.texture.tag;

	}

	// NORMAL_MAP
	techniques[ SEA3D.Material.NORMAL_MAP ] =
	function( tech, mat ) {

		mat.normalMap = tech.texture.tag;

	}

	// REFLECTION
	techniques[ SEA3D.Material.REFLECTION ] =
	techniques[ SEA3D.Material.FRESNEL_REFLECTION ] =
	function( tech, mat ) {

		mat.envMap = tech.texture.tag;
		mat.envMap.mapping = THREE.CubeReflectionMapping;
		mat.combine = THREE.MixOperation;

		mat.reflectivity = tech.alpha;

		//if (tech.kind == SEA3D.Material.FRESNEL_REFLECTION) {
		// not implemented
		//}

	}

	// REFLECTION_SPHERICAL
	techniques[ SEA3D.Material.REFLECTION_SPHERICAL ] =
	function( tech, mat ) {

		mat.envMap = tech.texture.tag;
		mat.envMap.mapping = THREE.SphericalReflectionMapping;
		mat.combine = THREE.MixOperation;

		mat.reflectivity = tech.alpha;

	}

	// REFRACTION
	techniques[ SEA3D.Material.REFRACTION_MAP ] =
	function( tech, mat ) {

		mat.envMap = tech.texture.tag;
		mat.envMap.mapping = THREE.CubeRefractionMapping();

		mat.refractionRatio = tech.ior;
		mat.reflectivity = tech.alpha;

	}

	// LIGHT_MAP
	techniques[ SEA3D.Material.LIGHT_MAP ] =
	function( tech, mat ) {

		if ( tech.blendMode == "multiply" ) mat.aoMap = tech.texture.tag;
		else mat.lightMap = tech.texture.tag;

		mat.lightMapUV = tech.channel;

	}

	return techniques;

} )();

THREE.SEA3D.prototype.readMaterial = function( sea ) {

	var mat = this.config.standardMaterial ? new THREE.SEA3D.StandardMaterial() : new THREE.MeshPhongMaterial();
	mat.emissiveToAmbientColor = this.config.ambientColor;
	mat.name = sea.name;

	mat.side = sea.bothSides ? THREE.DoubleSide : THREE.FrontSide;
	mat.shading = sea.smooth ? THREE.SmoothShading : THREE.FlatShading;

	if ( sea.blendMode != "normal" && this.blendMode[ sea.blendMode ] ) {

		mat.blending = this.blendMode[ sea.blendMode ];

	}

	if ( sea.alpha < 1 || mat.blending > THREE.NormalBlending ) {

		mat.opacity = sea.alpha;
		mat.transparent = true;

	}

	for ( var i = 0; i < sea.technique.length; i ++ ) {

		var tech = sea.technique[ i ];

		if ( this.materialTechnique[ tech.kind ] ) {

			this.materialTechnique[ tech.kind ].call( this, tech, mat );

		}

	}

	if ( mat.transparent ) {

		mat.alphaTest = sea.alphaThreshold;

	}

	this.domain.materials = this.materials = this.materials || [];
	this.materials.push( this.objects[ "mat/" + sea.name ] = sea.tag = mat );

};

//
//	Point Light
//

THREE.SEA3D.prototype.readPointLight = function( sea ) {

	var light = new THREE.PointLight( sea.color, sea.multiplier * this.config.multiplier );
	light.name = sea.name;

	if ( sea.attenuation ) {

		light.distance = sea.attenuation.end;

	}

	if ( sea.shadow ) {

		this.setShadowMap( light, sea.shadow.opacity );

	}

	this.domain.lights = this.lights = this.lights || [];
	this.lights.push( this.objects[ "lht/" + sea.name ] = sea.tag = light );

	if ( this.config.lights ) this.addSceneObject( sea );

	this.updateTransform( light, sea );

	this.applyDefaultAnimation( sea, THREE.SEA3D.LightAnimator );

	this.updateScene();

};

//
//	Hemisphere Light
//

THREE.SEA3D.prototype.readHemisphereLight = function( sea ) {

	var light = new THREE.HemisphereLight( sea.color, sea.secondColor, sea.multiplier * this.config.multiplier );
	light.name = sea.name;

	this.domain.lights = this.lights = this.lights || [];
	this.lights.push( this.objects[ "lht/" + sea.name ] = sea.tag = light );

	if ( this.config.lights ) this.addSceneObject( sea );

	this.applyDefaultAnimation( sea, THREE.SEA3D.LightAnimator );

	this.updateScene();

};

//
//	Directional Light
//

THREE.SEA3D.prototype.readDirectionalLight = function( sea ) {

	var light = new THREE.DirectionalLight( sea.color, sea.multiplier * this.config.multiplier );
	light.name = sea.name;

	if ( sea.shadow ) {

		this.setShadowMap( light, sea.shadow.opacity );

	}

	this.domain.lights = this.lights = this.lights || [];
	this.lights.push( this.objects[ "lht/" + sea.name ] = sea.tag = light );

	if ( this.config.lights ) this.addSceneObject( sea );

	this.updateTransform( light, sea );

	this.applyDefaultAnimation( sea, THREE.SEA3D.LightAnimator );

	this.updateScene();

};

//
//	Camera
//

THREE.SEA3D.prototype.readCamera = function( sea ) {

	var camera = new THREE.SEA3D.Camera( sea.fov );
	camera.name = sea.name;

	this.domain.cameras = this.cameras = this.cameras || [];
	this.cameras.push( this.objects[ "cam/" + sea.name ] = sea.tag = camera );

	this.addSceneObject( sea );
	this.updateTransform( camera, sea );

	this.applyDefaultAnimation( sea, THREE.SEA3D.CameraAnimator );

};

//
//	Skeleton
//

THREE.SEA3D.prototype.readSkeletonLocal = function( sea ) {

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

	sea.tag = bones;

};

//
//	Joint Object
//

THREE.SEA3D.prototype.readJointObject = function( sea ) {

	var mesh = sea.target.tag,
		bone = mesh.skeleton.bones[ sea.joint ];

	this.domain.joints = this.joints = this.joints || [];
	this.joints.push( this.objects[ "jnt/" + sea.name ] = sea.tag = bone );

};

//
//	Skeleton Animation
//

THREE.SEA3D.prototype.getSkeletonAnimation = function( sea, skl ) {

	if ( sea.tag ) return sea.tag;

	var animations = [],
		delta = ( 1000 / sea.frameRate ) / 1000;

	for ( var i = 0; i < sea.sequence.length; i ++ ) {

		var seq = sea.sequence[ i ];

		var start = seq.start;
		var end = start + seq.count;
		var ns = sea.name + "/" + seq.name;

		var animation = {
			name: ns,
			repeat: seq.repeat,
			fps: sea.frameRate,
			JIT: 0,
			length: delta * ( seq.count - 1 ),
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

		animations.push( animation );

	}

	return sea.tag = animations;

};

//
//	Morpher
//

THREE.SEA3D.prototype.readMorpher = function( sea ) {

	var attribs = {
			position : []
		},
		targets = [];

	for ( var i = 0; i < sea.node.length; i ++ ) {

		var node = sea.node[ i ];

		attribs.position[ i ] = new THREE.Float32Attribute( new Float32Array( node.vertex ), 3 );

		if ( node.normal ) {

			attribs.normal = attribs.normal || [];
			attribs.normal[ i ] = new THREE.Float32Attribute( new Float32Array( node.normal ), 3 );

		}

		targets[ i ] = { name: node.name };

	}

	sea.tag = {
		attribs : attribs,
		targets : targets
	}

};

//
//	Vertex Animation
//

THREE.SEA3D.prototype.readVertexAnimation = function( sea ) {

	var attribs = {
			position : []
		},
		targets = [],
		animations = [];

	for ( var i = 0, l = sea.frame.length; i < l; i ++ ) {

		var frame = sea.frame[ i ];

		attribs.position[ i ] = new THREE.Float32Attribute( new Float32Array( frame.vertex ), 3 );

		if ( frame.normal ) {

			attribs.normal = attribs.normal || [];
			attribs.normal[ i ] = new THREE.Float32Attribute( new Float32Array( frame.normal ), 3 );

		}

		targets[ i ] = { name: i };

	}

	for ( var i = 0; i < sea.sequence.length; i ++ ) {

		var seq = sea.sequence[ i ];

		animations[ i ] = animations[ seq.name ] = {
			name : seq.name,
			start : seq.start,
			end : seq.start + seq.count,
			repeat : seq.repeat
		}

	}

	sea.tag = {
		attribs : attribs,
		targets : targets,
		animations : animations,
		frameRate : sea.frameRate
	};

};

//
//	Actions
//

THREE.SEA3D.prototype.readActions = function( sea ) {

	for ( var i = 0; i < sea.actions.length; i ++ ) {

		var act = sea.actions[ i ];

		switch ( act.kind ) {

			case SEA3D.Actions.SCRIPTS:

				this.runJSMList( this.domain, act.scripts, true );

				break;

		}

	}

};

//
//	Events
//

THREE.SEA3D.Event = {
	LOAD_PROGRESS: "sea3d_progress",
	DOWNLOAD_PROGRESS: "sea3d_download",
	COMPLETE: "sea3d_complete",
	OBJECT_COMPLETE: "sea3d_object",
	PARSE_PROGRESS: "parse_progress",
	PARSE_COMPLETE: "parse_complete",
	ERROR: "sea3d_error"
};

THREE.SEA3D.prototype.onProgress = undefined;

THREE.SEA3D.prototype.onComplete = function( args ) {

	args.file = this.scope; args.type = THREE.SEA3D.Event.COMPLETE;
	args.file.dispatchEvent( args );

};

THREE.SEA3D.prototype.onLoadProgress = function( args ) {

	args.file = this.scope; args.type = THREE.SEA3D.Event.LOAD_PROGRESS;
	args.file.dispatchEvent( args );
	if ( args.file.onProgress ) args.file.onProgress( args );

};

THREE.SEA3D.prototype.onDownloadProgress = function( args ) {

	args.file = this.scope; args.type = THREE.SEA3D.Event.DOWNLOAD_PROGRESS;
	args.file.dispatchEvent( args );
	if ( args.file.onProgress ) args.file.onProgress( args );

};

THREE.SEA3D.prototype.onCompleteObject = function( args ) {

	args.file = this.scope; args.type = THREE.SEA3D.Event.OBJECT_COMPLETE;
	args.file.dispatchEvent( args );

};

THREE.SEA3D.prototype.onParseProgress = function( args ) {

	args.file = this.scope; args.type = THREE.SEA3D.Event.PARSE_PROGRESS;
	args.file.dispatchEvent( args );

};

THREE.SEA3D.prototype.onParseComplete = function( args ) {

	args.file = this.scope; args.type = THREE.SEA3D.Event.PARSE_COMPLETE;
	args.file.dispatchEvent( args );

};

THREE.SEA3D.prototype.onError = function( args ) {

	args.file = this.scope; args.type = THREE.SEA3D.Event.ERROR;
	args.file.dispatchEvent( args );

};

//
//	Loader
//

THREE.SEA3D.prototype.newDomain = function() {

	this.domain = new THREE.SEA3D.Domain(
		this.config.id,
		this.objects = {},
		this.config.container,
		THREE.SEA3D.EXTENSIONS_DOMAIN
	);

}

THREE.SEA3D.prototype.parse = function( onParseComplete, onParseProgress ) {

	delete this.cameras;
	delete this.containers;
	delete this.lights;
	delete this.joints;
	delete this.meshes;
	delete this.materials;
	delete this.animationSets;
	delete this.sprites;
	delete this.sounds3d;
	delete this.cubeRenderers;
	delete this.sounds;
	delete this.glsl;
	delete this.dummy;

	delete this.domain;

	this.newDomain();

	this.file.onParseComplete = ( function( e ) {

		if ( this.config.manager ) this.config.manager.add( this.domain );

		( onParseComplete || this.onParseComplete ).call( this.file, e );

	} ).bind( this );

	this.file.onParseProgress = onParseProgress || this.onParseProgress;

	// EXTENSIONS

	for ( var i = 0; i < THREE.SEA3D.EXTENSIONS_PARSE.length; i ++ ) {

		THREE.SEA3D.EXTENSIONS_PARSE[ i ].call( this );

	}

	this.file.parse();

	return this;

};

THREE.SEA3D.prototype.load = function( url ) {

	this.loadBytes();
	this.file.load( url );

};

THREE.SEA3D.prototype.onHead = function( args ) {

	if ( args.sign != 'TJS' ) {

		throw new Error( "Sign '" + args.sign + "' not supported! Use SEA3D Studio to publish or SEA3DLegacy.js" );

	}

};

THREE.SEA3D.EXTENSIONS = [];
THREE.SEA3D.EXTENSIONS_PARSE = [];
THREE.SEA3D.EXTENSIONS_DOMAIN = [];

THREE.SEA3D.prototype.loadBytes = function( data ) {

	this.file = new SEA3D.File();
	this.file.scope = this;
	this.file.config = this.config;
	this.file.streaming = this.config.streaming;
	this.file.timeLimit = this.config.timeLimit;
	this.file.onProgress = this.onLoadProgress;
	this.file.onCompleteObject = this.onCompleteObject;
	this.file.onDownloadProgress = this.onDownloadProgress;
	this.file.onParseProgress = this.onParseProgress;
	this.file.onParseComplete = this.onParseComplete;
	this.file.onError = this.onError;
	this.file.onHead = this.onHead;

	this.file.onComplete = ( function( e ) {

		if ( this.config.manager ) this.config.manager.add( this.domain );

		this.onComplete.call( this.file, e );

	} ).bind( this );

	// SEA3D

	this.newDomain();

	this.file.typeRead[ SEA3D.Geometry.prototype.type ] =
	this.file.typeRead[ SEA3D.GeometryDelta.prototype.type ] = this.readGeometryBuffer;
	this.file.typeRead[ SEA3D.Mesh.prototype.type ] = this.readMesh;
	this.file.typeRead[ SEA3D.Mesh2D.prototype.type ] = this.readMesh2D;
	this.file.typeRead[ SEA3D.Container3D.prototype.type ] = this.readContainer3D;
	this.file.typeRead[ SEA3D.Dummy.prototype.type ] = this.readDummy;
	this.file.typeRead[ SEA3D.Line.prototype.type ] = this.readLine;
	this.file.typeRead[ SEA3D.Material.prototype.type ] = this.readMaterial;
	this.file.typeRead[ SEA3D.Camera.prototype.type ] = this.readCamera;
	this.file.typeRead[ SEA3D.SkeletonLocal.prototype.type ] = this.readSkeletonLocal;
	this.file.typeRead[ SEA3D.JointObject.prototype.type ] = this.readJointObject;
	this.file.typeRead[ SEA3D.CubeMap.prototype.type ] = this.readCubeMap;
	this.file.typeRead[ SEA3D.CubeRender.prototype.type ] = this.readCubeRender;
	this.file.typeRead[ SEA3D.Animation.prototype.type ] = this.readAnimation;
	this.file.typeRead[ SEA3D.SoundPoint.prototype.type ] = this.readSoundPoint;
	this.file.typeRead[ SEA3D.TextureURL.prototype.type ] = this.readTextureURL;
	this.file.typeRead[ SEA3D.Morph.prototype.type ] = this.readMorpher;
	this.file.typeRead[ SEA3D.VertexAnimation.prototype.type ] = this.readVertexAnimation;
	this.file.typeRead[ SEA3D.PointLight.prototype.type ] = this.readPointLight;
	this.file.typeRead[ SEA3D.DirectionalLight.prototype.type ] = this.readDirectionalLight;
	this.file.typeRead[ SEA3D.HemisphereLight.prototype.type ] = this.readHemisphereLight;
	this.file.typeRead[ SEA3D.Actions.prototype.type ] = this.readActions;

	// UNIVERSAL

	this.file.typeRead[ SEA3D.JPEG.prototype.type ] =
	this.file.typeRead[ SEA3D.JPEG_XR.prototype.type ] =
	this.file.typeRead[ SEA3D.PNG.prototype.type ] =
	this.file.typeRead[ SEA3D.GIF.prototype.type ] = this.readImage;
	this.file.typeRead[ SEA3D.MP3.prototype.type ] = this.readSound;
	this.file.typeRead[ SEA3D.GLSL.prototype.type ] = this.readGLSL;
	this.file.typeRead[ SEA3D.JavaScriptMethod.prototype.type ] = this.readJavaScriptMethod;

	// EXTENSIONS

	for ( var i = 0; i < THREE.SEA3D.EXTENSIONS.length; i ++ ) {

		THREE.SEA3D.EXTENSIONS[ i ].call( this );

	}

	this.file.read( data );

};

/**
 * 	SEA3D Legacy for Three.JS
 * 	@author Sunag / http://www.sunag.com.br/
 */

'use strict';

//
//	Header
//

THREE.SEA3D.prototype._onHead = THREE.SEA3D.prototype.onHead;
THREE.SEA3D.prototype._updateTransform = THREE.SEA3D.prototype.updateTransform;
THREE.SEA3D.prototype._readVertexAnimation = THREE.SEA3D.prototype.readVertexAnimation;
THREE.SEA3D.prototype._readGeometryBuffer = THREE.SEA3D.prototype.readGeometryBuffer;
THREE.SEA3D.prototype._readLine = THREE.SEA3D.prototype.readLine;
THREE.SEA3D.prototype._getSkeletonAnimation = THREE.SEA3D.prototype.getSkeletonAnimation;
THREE.SEA3D.prototype._applyDefaultAnimation = THREE.SEA3D.prototype.applyDefaultAnimation;

//
//	Utils
//

THREE.SEA3D.prototype.isLegacy = function( sea ) {

	var sea3d = sea.sea3d;

	if ( sea3d.sign == 'S3D' && ! sea._legacy ) {

		sea._legacy = sea3d.typeUnique[ sea.type ] == true;

		return sea3d.config.legacy;

	}

	return false;

};

THREE.SEA3D.prototype.flipZVec3 = function( v ) {

	if ( ! v ) return;

	var i = 2; // z

	while ( i < v.length ) {

		v[ i ] = - v[ i ];

		i += 3;

	}

	return v;

};

THREE.SEA3D.prototype.expandJoints = function( sea ) {

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

THREE.SEA3D.prototype.compressJoints = function( sea ) {

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

THREE.SEA3D.prototype.flipZIndex = function( v ) {

	var i = 1; // y >-< z

	while ( i < v.length ) {

		var idx = v[ i + 1 ];
		v[ i + 1 ] = v[ i ];
		v[ i ] = idx;

		i += 3;

	}

	return v;

};

THREE.SEA3D.prototype.flipMatrixBone = function( mtx ) {

	var zero = new THREE.Vector3();
	var buf1 = new THREE.Matrix4();

	return function( mtx ) {

		buf1.copy( mtx );

		mtx.setPosition( zero );
		mtx.multiplyMatrices( THREE.SEA3D.MTXBUF.makeRotationZ( THREE.Math.degToRad( 180 ) ), mtx );
		mtx.makeRotationFromQuaternion( THREE.SEA3D.QUABUF.setFromRotationMatrix( mtx ) );

		var pos = THREE.SEA3D.VECBUF.setFromMatrixPosition( buf1 );
		pos.z = - pos.z;
		mtx.setPosition( pos );

		return mtx;

	};

}();

THREE.SEA3D.prototype.flipMatrixScale = function( local, global, parent, parentGlobal ) {

	var pos = new THREE.Vector3();
	var qua = new THREE.Quaternion();
	var slc = new THREE.Vector3();

	return function( local, global, parent, parentGlobal ) {

		if ( parent ) local.multiplyMatrices( parent, local );

		local.decompose( pos, qua, slc );

		slc.z = - slc.z;

		if ( global ) {

			slc.y = - slc.y;
			slc.x = - slc.x;

		}

		local.compose( pos, qua, slc );

		if ( parent ) {

			parent = parent.clone();

			this.flipMatrixScale( parent, parentGlobal );

			local.multiplyMatrices( parent.getInverse( parent ), local );

		}

		return local;

	};

}();

//
//	Legacy
//

THREE.SEA3D.prototype.updateAnimationSet = function( obj3d ) {

	var buf1 = new THREE.Matrix4();
	var buf2 = new THREE.Matrix4();

	var pos = new THREE.Vector3();
	var qua = new THREE.Quaternion();
	var slc = new THREE.Vector3();

	var to_pos = new THREE.Vector3();
	var to_qua = new THREE.Quaternion();
	var to_slc = new THREE.Vector3();

	return function( obj3d ) {

		var anmSet = obj3d.animation.animationSet;
		var relative = obj3d.animation.relative;
		var anms = anmSet.animations;

		if ( anmSet.flip && ! anms.length )
			return;

		var dataList = anms[ 0 ].dataList,
			t_anm = [];

		for ( var i = 0; i < dataList.length; i ++ ) {

			var data = dataList[ i ];
			var raw = dataList[ i ].data;
			var kind = data.kind;
			var numFrames = raw.length / data.blockLength;

			switch ( kind ) {
				case SEA3D.Animation.POSITION:
				case SEA3D.Animation.ROTATION:
				case SEA3D.Animation.SCALE:
					t_anm.push( {
						kind : kind,
						numFrames : numFrames,
						raw : raw
					} );
					break;
			}

		}

		if ( t_anm.length > 0 ) {

			var numFrames = t_anm[ 0 ].numFrames,
				parent = undefined;

			if ( obj3d.animation.relative ) {

				buf1.identity();
				parent = this.flipMatrixScale( buf2.copy( obj3d.matrixWorld ) );

			}
			else {

				if ( obj3d.parent ) {

					parent = this.flipMatrixScale( buf2.copy( obj3d.parent.matrixWorld ) );

				}

				this.flipMatrixScale( buf1.copy( obj3d.matrix ), false, parent );

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

				this.flipMatrixScale( buf1, false, buf2 );

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

		anmSet.flip = true;

	};

}();


THREE.SEA3D.prototype.applyDefaultAnimation = function( sea, animatorClass ) {

	this._applyDefaultAnimation( sea, animatorClass );

	if ( this.isLegacy( sea ) && sea.tag.animation ) {

		this.updateAnimationSet( sea.tag );

	}

};

THREE.SEA3D.prototype.updateTransform = function( obj3d, sea ) {

	var buf1 = new THREE.Matrix4();
	var identity = new THREE.Matrix4();

	return function( obj3d, sea ) {

		if ( this.isLegacy( sea ) ) {

			if ( sea.transform ) buf1.elements.set( sea.transform );
			else buf1.makeTranslation( sea.position.x, sea.position.y, sea.position.z );

			this.flipMatrixScale(
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

		}
		else {

			this._updateTransform( obj3d, sea );

		}

	};

}();

THREE.SEA3D.prototype.readSkeleton = function( sea ) {

	var mtx_tmp_inv = new THREE.Matrix4(),
		mtx_local = new THREE.Matrix4(),
		mtx_parent = new THREE.Matrix4(),
		pos = new THREE.Vector3(),
		qua = new THREE.Quaternion();

	return function( sea ) {

		var bones = [],
			isLegacy = sea.sea3d.config.legacy;

		for ( var i = 0; i < sea.joint.length; i ++ ) {

			var bone = sea.joint[ i ]

			// get world inverse matrix

			mtx_tmp_inv.elements = bone.inverseBindMatrix;

			// convert to world matrix

			mtx_local.getInverse( mtx_tmp_inv );

			// convert to three.js order

			if ( isLegacy ) this.flipMatrixBone( mtx_local );

			if ( bone.parentIndex > - 1 ) {

				// to world

				mtx_tmp_inv.elements = sea.joint[ bone.parentIndex ].inverseBindMatrix;
				mtx_parent.getInverse( mtx_tmp_inv );

				// convert parent to three.js order

				if ( isLegacy ) this.flipMatrixBone( mtx_parent );

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

		return sea.tag = bones;

	};

}();

THREE.SEA3D.prototype.getSkeletonAnimation = function( sea, skl ) {

	if ( this.isLegacy( sea ) ) return this.getSkeletonAnimationLegacy( sea, skl );
	else return this._getSkeletonAnimation( sea, skl );

};

THREE.SEA3D.prototype.getSkeletonAnimationLegacy = function( sea, skl ) {

	var mtx_tmp_inv = new THREE.Matrix4(),
		mtx_local = new THREE.Matrix4(),
		mtx_global = new THREE.Matrix4(),
		mtx_parent = new THREE.Matrix4();

	return function( sea, skl ) {

		if ( sea.tag ) return sea.tag;

		var animations = [],
			delta = sea.frameRate / 1000,
			scale = [ 1, 1, 1 ];

		for ( var i = 0; i < sea.sequence.length; i ++ ) {

			var seq = sea.sequence[ i ];

			var start = seq.start;
			var end = start + seq.count;
			var ns = sea.name + "/" + seq.name;

			var animation = {
				name: ns,
				repeat: seq.repeat,
				fps: sea.frameRate,
				JIT: 0,
				length: delta * ( seq.count - 1 ),
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

						mtx_tmp_inv.elements = skl.joint[ bone.parentIndex ].inverseBindMatrix;

						mtx_parent.getInverse( mtx_tmp_inv );

						mtx_global.multiplyMatrices( mtx_parent, mtx_local );

						// convert to three.js matrix

						this.flipMatrixBone( mtx_global );

						// flip parent inverse

						this.flipMatrixBone( mtx_parent );

						// to local

						mtx_parent.getInverse( mtx_parent );

						mtx_local.multiplyMatrices( mtx_parent, mtx_global );

					}
					else {

						this.flipMatrixBone( mtx_local );

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

			animations.push( animation );

		}

		return sea.tag = animations;

	};

}();

THREE.SEA3D.prototype.readVertexAnimation = function( sea ) {

	if ( this.isLegacy( sea ) ) {

		for ( var i = 0, l = sea.frame.length; i < l; i ++ ) {

			var frame = sea.frame[ i ];

			this.flipZVec3( frame.vertex );
			this.flipZVec3( frame.normal );

		}

	}

	this._readVertexAnimation( sea );

};

THREE.SEA3D.prototype.readGeometryBuffer = function( sea ) {

	if ( this.isLegacy( sea ) ) {

		this.flipZVec3( sea.vertex );
		this.flipZVec3( sea.normal );

		this.flipZIndex( sea.indexes );

		if ( sea.jointPerVertex > 4 ) this.compressJoints( sea );
		else if ( sea.jointPerVertex < 4 ) this.expandJoints( sea );

	}

	this._readGeometryBuffer( sea );

};

THREE.SEA3D.prototype.readLines = function( sea ) {

	if ( this.isLegacy( sea ) ) {

		this.flipZVec3( sea.vertex );

	}

	this._readLines( sea );

};

THREE.SEA3D.prototype.onHead = function( args ) {

	// TODO: Ignore sign

};

THREE.SEA3D.EXTENSIONS.push( function() {

	// CONFIG

	this.config.legacy = this.config.legacy == undefined ? true : this.config.legacy;

	this.file.typeRead[ SEA3D.Skeleton.prototype.type ] = this.readSkeleton;

} );

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

var LZMA = LZMA || {};

LZMA.OutWindow = function(){
  this._windowSize = 0;
};

LZMA.OutWindow.prototype.create = function(windowSize){
  if ( (!this._buffer) || (this._windowSize !== windowSize) ){
    this._buffer = [];
  }
  this._windowSize = windowSize;
  this._pos = 0;
  this._streamPos = 0;
};

LZMA.OutWindow.prototype.flush = function(){
  var size = this._pos - this._streamPos;
  if (size !== 0){
    while(size --){
      this._stream.writeByte(this._buffer[this._streamPos ++]);
    }
    if (this._pos >= this._windowSize){
      this._pos = 0;
    }
    this._streamPos = this._pos;
  }
};

LZMA.OutWindow.prototype.releaseStream = function(){
  this.flush();
  this._stream = null;
};

LZMA.OutWindow.prototype.setStream = function(stream){
  this.releaseStream();
  this._stream = stream;
};

LZMA.OutWindow.prototype.init = function(solid){
  if (!solid){
    this._streamPos = 0;
    this._pos = 0;
  }
};

LZMA.OutWindow.prototype.copyBlock = function(distance, len){
  var pos = this._pos - distance - 1;
  if (pos < 0){
    pos += this._windowSize;
  }
  while(len --){
    if (pos >= this._windowSize){
      pos = 0;
    }
    this._buffer[this._pos ++] = this._buffer[pos ++];
    if (this._pos >= this._windowSize){
      this.flush();
    }
  }
};

LZMA.OutWindow.prototype.putByte = function(b){
  this._buffer[this._pos ++] = b;
  if (this._pos >= this._windowSize){
    this.flush();
  }
};

LZMA.OutWindow.prototype.getByte = function(distance){
  var pos = this._pos - distance - 1;
  if (pos < 0){
    pos += this._windowSize;
  }
  return this._buffer[pos];
};

LZMA.RangeDecoder = function(){
};

LZMA.RangeDecoder.prototype.setStream = function(stream){
  this._stream = stream;
};

LZMA.RangeDecoder.prototype.releaseStream = function(){
  this._stream = null;
};

LZMA.RangeDecoder.prototype.init = function(){
  var i = 5;

  this._code = 0;
  this._range = -1;
  
  while(i --){
    this._code = (this._code << 8) | this._stream.readByte();
  }
};

LZMA.RangeDecoder.prototype.decodeDirectBits = function(numTotalBits){
  var result = 0, i = numTotalBits, t;

  while(i --){
    this._range >>>= 1;
    t = (this._code - this._range) >>> 31;
    this._code -= this._range & (t - 1);
    result = (result << 1) | (1 - t);

    if ( (this._range & 0xff000000) === 0){
      this._code = (this._code << 8) | this._stream.readByte();
      this._range <<= 8;
    }
  }

  return result;
};

LZMA.RangeDecoder.prototype.decodeBit = function(probs, index){
  var prob = probs[index],
      newBound = (this._range >>> 11) * prob;

  if ( (this._code ^ 0x80000000) < (newBound ^ 0x80000000) ){
    this._range = newBound;
    probs[index] += (2048 - prob) >>> 5;
    if ( (this._range & 0xff000000) === 0){
      this._code = (this._code << 8) | this._stream.readByte();
      this._range <<= 8;
    }
    return 0;
  }

  this._range -= newBound;
  this._code -= newBound;
  probs[index] -= prob >>> 5;
  if ( (this._range & 0xff000000) === 0){
    this._code = (this._code << 8) | this._stream.readByte();
    this._range <<= 8;
  }
  return 1;
};

LZMA.initBitModels = function(probs, len){
  while(len --){
    probs[len] = 1024;
  }
};

LZMA.BitTreeDecoder = function(numBitLevels){
  this._models = [];
  this._numBitLevels = numBitLevels;
};

LZMA.BitTreeDecoder.prototype.init = function(){
  LZMA.initBitModels(this._models, 1 << this._numBitLevels);
};

LZMA.BitTreeDecoder.prototype.decode = function(rangeDecoder){
  var m = 1, i = this._numBitLevels;

  while(i --){
    m = (m << 1) | rangeDecoder.decodeBit(this._models, m);
  }
  return m - (1 << this._numBitLevels);
};

LZMA.BitTreeDecoder.prototype.reverseDecode = function(rangeDecoder){
  var m = 1, symbol = 0, i = 0, bit;

  for (; i < this._numBitLevels; ++ i){
    bit = rangeDecoder.decodeBit(this._models, m);
    m = (m << 1) | bit;
    symbol |= bit << i;
  }
  return symbol;
};

LZMA.reverseDecode2 = function(models, startIndex, rangeDecoder, numBitLevels){
  var m = 1, symbol = 0, i = 0, bit;

  for (; i < numBitLevels; ++ i){
    bit = rangeDecoder.decodeBit(models, startIndex + m);
    m = (m << 1) | bit;
    symbol |= bit << i;
  }
  return symbol;
};

LZMA.LenDecoder = function(){
  this._choice = [];
  this._lowCoder = [];
  this._midCoder = [];
  this._highCoder = new LZMA.BitTreeDecoder(8);
  this._numPosStates = 0;
};

LZMA.LenDecoder.prototype.create = function(numPosStates){
  for (; this._numPosStates < numPosStates; ++ this._numPosStates){
    this._lowCoder[this._numPosStates] = new LZMA.BitTreeDecoder(3);
    this._midCoder[this._numPosStates] = new LZMA.BitTreeDecoder(3);
  }
};

LZMA.LenDecoder.prototype.init = function(){
  var i = this._numPosStates;
  LZMA.initBitModels(this._choice, 2);
  while(i --){
    this._lowCoder[i].init();
    this._midCoder[i].init();
  }
  this._highCoder.init();
};

LZMA.LenDecoder.prototype.decode = function(rangeDecoder, posState){
  if (rangeDecoder.decodeBit(this._choice, 0) === 0){
    return this._lowCoder[posState].decode(rangeDecoder);
  }
  if (rangeDecoder.decodeBit(this._choice, 1) === 0){
    return 8 + this._midCoder[posState].decode(rangeDecoder);
  }
  return 16 + this._highCoder.decode(rangeDecoder);
};

LZMA.Decoder2 = function(){
  this._decoders = [];
};

LZMA.Decoder2.prototype.init = function(){
  LZMA.initBitModels(this._decoders, 0x300);
};

LZMA.Decoder2.prototype.decodeNormal = function(rangeDecoder){
  var symbol = 1;

  do{
    symbol = (symbol << 1) | rangeDecoder.decodeBit(this._decoders, symbol);
  }while(symbol < 0x100);

  return symbol & 0xff;
};

LZMA.Decoder2.prototype.decodeWithMatchByte = function(rangeDecoder, matchByte){
  var symbol = 1, matchBit, bit;

  do{
    matchBit = (matchByte >> 7) & 1;
    matchByte <<= 1;
    bit = rangeDecoder.decodeBit(this._decoders, ( (1 + matchBit) << 8) + symbol);
    symbol = (symbol << 1) | bit;
    if (matchBit !== bit){
      while(symbol < 0x100){
        symbol = (symbol << 1) | rangeDecoder.decodeBit(this._decoders, symbol);
      }
      break;
    }
  }while(symbol < 0x100);

  return symbol & 0xff;
};

LZMA.LiteralDecoder = function(){
};

LZMA.LiteralDecoder.prototype.create = function(numPosBits, numPrevBits){
  var i;

  if (this._coders
    && (this._numPrevBits === numPrevBits)
    && (this._numPosBits === numPosBits) ){
    return;
  }
  this._numPosBits = numPosBits;
  this._posMask = (1 << numPosBits) - 1;
  this._numPrevBits = numPrevBits;

  this._coders = [];

  i = 1 << (this._numPrevBits + this._numPosBits);
  while(i --){
    this._coders[i] = new LZMA.Decoder2();
  }
};

LZMA.LiteralDecoder.prototype.init = function(){
  var i = 1 << (this._numPrevBits + this._numPosBits);
  while(i --){
    this._coders[i].init();
  }
};

LZMA.LiteralDecoder.prototype.getDecoder = function(pos, prevByte){
  return this._coders[( (pos & this._posMask) << this._numPrevBits)
    + ( (prevByte & 0xff) >>> (8 - this._numPrevBits) )];
};

LZMA.Decoder = function(){
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
  this._posAlignDecoder = new LZMA.BitTreeDecoder(4);
  this._lenDecoder = new LZMA.LenDecoder();
  this._repLenDecoder = new LZMA.LenDecoder();
  this._literalDecoder = new LZMA.LiteralDecoder();
  this._dictionarySize = -1;
  this._dictionarySizeCheck = -1;

  this._posSlotDecoder[0] = new LZMA.BitTreeDecoder(6);
  this._posSlotDecoder[1] = new LZMA.BitTreeDecoder(6);
  this._posSlotDecoder[2] = new LZMA.BitTreeDecoder(6);
  this._posSlotDecoder[3] = new LZMA.BitTreeDecoder(6);
};

LZMA.Decoder.prototype.setDictionarySize = function(dictionarySize){
  if (dictionarySize < 0){
    return false;
  }
  if (this._dictionarySize !== dictionarySize){
    this._dictionarySize = dictionarySize;
    this._dictionarySizeCheck = Math.max(this._dictionarySize, 1);
    this._outWindow.create( Math.max(this._dictionarySizeCheck, 4096) );
  }
  return true;
};

LZMA.Decoder.prototype.setLcLpPb = function(lc, lp, pb){
  var numPosStates = 1 << pb;

  if (lc > 8 || lp > 4 || pb > 4){
    return false;
  }

  this._literalDecoder.create(lp, lc);

  this._lenDecoder.create(numPosStates);
  this._repLenDecoder.create(numPosStates);
  this._posStateMask = numPosStates - 1;

  return true;
};

LZMA.Decoder.prototype.init = function(){
  var i = 4;

  this._outWindow.init(false);

  LZMA.initBitModels(this._isMatchDecoders, 192);
  LZMA.initBitModels(this._isRep0LongDecoders, 192);
  LZMA.initBitModels(this._isRepDecoders, 12);
  LZMA.initBitModels(this._isRepG0Decoders, 12);
  LZMA.initBitModels(this._isRepG1Decoders, 12);
  LZMA.initBitModels(this._isRepG2Decoders, 12);
  LZMA.initBitModels(this._posDecoders, 114);

  this._literalDecoder.init();

  while(i --){
    this._posSlotDecoder[i].init();
  }

  this._lenDecoder.init();
  this._repLenDecoder.init();
  this._posAlignDecoder.init();
  this._rangeDecoder.init();
};

LZMA.Decoder.prototype.decode = function(inStream, outStream, outSize){
  var state = 0, rep0 = 0, rep1 = 0, rep2 = 0, rep3 = 0, nowPos64 = 0, prevByte = 0,
      posState, decoder2, len, distance, posSlot, numDirectBits;

  this._rangeDecoder.setStream(inStream);
  this._outWindow.setStream(outStream);

  this.init();

  while(outSize < 0 || nowPos64 < outSize){
    posState = nowPos64 & this._posStateMask;

    if (this._rangeDecoder.decodeBit(this._isMatchDecoders, (state << 4) + posState) === 0){
      decoder2 = this._literalDecoder.getDecoder(nowPos64 ++, prevByte);

      if (state >= 7){
        prevByte = decoder2.decodeWithMatchByte(this._rangeDecoder, this._outWindow.getByte(rep0) );
      }else{
        prevByte = decoder2.decodeNormal(this._rangeDecoder);
      }
      this._outWindow.putByte(prevByte);

      state = state < 4? 0: state - (state < 10? 3: 6);

    }else{

      if (this._rangeDecoder.decodeBit(this._isRepDecoders, state) === 1){
        len = 0;
        if (this._rangeDecoder.decodeBit(this._isRepG0Decoders, state) === 0){
          if (this._rangeDecoder.decodeBit(this._isRep0LongDecoders, (state << 4) + posState) === 0){
            state = state < 7? 9: 11;
            len = 1;
          }
        }else{
          if (this._rangeDecoder.decodeBit(this._isRepG1Decoders, state) === 0){
            distance = rep1;
          }else{
            if (this._rangeDecoder.decodeBit(this._isRepG2Decoders, state) === 0){
              distance = rep2;
            }else{
              distance = rep3;
              rep3 = rep2;
            }
            rep2 = rep1;
          }
          rep1 = rep0;
          rep0 = distance;
        }
        if (len === 0){
          len = 2 + this._repLenDecoder.decode(this._rangeDecoder, posState);
          state = state < 7? 8: 11;
        }
      }else{
        rep3 = rep2;
        rep2 = rep1;
        rep1 = rep0;

        len = 2 + this._lenDecoder.decode(this._rangeDecoder, posState);
        state = state < 7? 7: 10;

        posSlot = this._posSlotDecoder[len <= 5? len - 2: 3].decode(this._rangeDecoder);
        if (posSlot >= 4){

          numDirectBits = (posSlot >> 1) - 1;
          rep0 = (2 | (posSlot & 1) ) << numDirectBits;

          if (posSlot < 14){
            rep0 += LZMA.reverseDecode2(this._posDecoders,
                rep0 - posSlot - 1, this._rangeDecoder, numDirectBits);
          }else{
            rep0 += this._rangeDecoder.decodeDirectBits(numDirectBits - 4) << 4;
            rep0 += this._posAlignDecoder.reverseDecode(this._rangeDecoder);
            if (rep0 < 0){
              if (rep0 === -1){
                break;
              }
              return false;
            }
          }
        }else{
          rep0 = posSlot;
        }
      }

      if (rep0 >= nowPos64 || rep0 >= this._dictionarySizeCheck){
        return false;
      }

      this._outWindow.copyBlock(rep0, len);
      nowPos64 += len;
      prevByte = this._outWindow.getByte(0);
    }
  }

  this._outWindow.flush();
  this._outWindow.releaseStream();
  this._rangeDecoder.releaseStream();

  return true;
};

LZMA.Decoder.prototype.setDecoderProperties = function(properties){
  var value, lc, lp, pb, dictionarySize;

  if (properties.size < 5){
    return false;
  }

  value = properties.readByte();
  lc = value % 9;
  value = ~~(value / 9);
  lp = value % 5;
  pb = ~~(value / 5);

  if ( !this.setLcLpPb(lc, lp, pb) ){
    return false;
  }

  dictionarySize = properties.readByte();
  dictionarySize |= properties.readByte() << 8;
  dictionarySize |= properties.readByte() << 16;
  dictionarySize += properties.readByte() * 16777216;

  return this.setDictionarySize(dictionarySize);
};

LZMA.decompress = function(properties, inStream, outStream, outSize){
  var decoder = new LZMA.Decoder();

  if ( !decoder.setDecoderProperties(properties) ){
    throw "Incorrect stream properties";
  }

  if ( !decoder.decode(inStream, outStream, outSize) ){
    throw "Error in data stream";
  }

  return true;
};

LZMA.decompressFile = function(inStream, outStream){
  var decoder = new LZMA.Decoder(), outSize;

  if ( !decoder.setDecoderProperties(inStream) ){
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

  if ( !decoder.decode(inStream, outStream, outSize) ){
    throw "Error in data stream";
  }

  return true;
};

/**
 * 	SEA3D LZMA
 * 	@author Sunag / http://www.sunag.com.br/
 */

SEA3D.File.LZMAUncompress = function( data ) {

	data = new Uint8Array( data );

	var inStream = {
		data: data,
		position: 0,
		readByte: function() {

			return this.data[ this.position ++ ];

		}
	}

	var outStream = {
		data: [],
		position: 0,
		writeByte: function( value ) {

			this.data[ this.position ++ ] = value;

		}
	}

	LZMA.decompressFile( inStream, outStream );

	return new Uint8Array( outStream.data ).buffer;

}

SEA3D.File.setDecompressionEngine( 2, "lzma", SEA3D.File.LZMAUncompress );

/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finter swipe

THREE.OrbitControls = function ( object, domElement ) {

	this.object = object;

	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// Set to false to disable this control
	this.enabled = true;

	// "target" sets the location of focus, where the object orbits around
	this.target = new THREE.Vector3();

	// How far you can dolly in and out ( PerspectiveCamera only )
	this.minDistance = 0;
	this.maxDistance = Infinity;

	// How far you can zoom in and out ( OrthographicCamera only )
	this.minZoom = 0;
	this.maxZoom = Infinity;

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	this.minAzimuthAngle = - Infinity; // radians
	this.maxAzimuthAngle = Infinity; // radians

	// Set to true to enable damping (inertia)
	// If damping is enabled, you must call controls.update() in your animation loop
	this.enableDamping = false;
	this.dampingFactor = 0.25;

	// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
	// Set to false to disable zooming
	this.enableZoom = true;
	this.zoomSpeed = 1.0;

	// Set to false to disable rotating
	this.enableRotate = true;
	this.rotateSpeed = 1.0;

	// Set to false to disable panning
	this.enablePan = true;
	this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

	// Set to true to automatically rotate around the target
	// If auto-rotate is enabled, you must call controls.update() in your animation loop
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	// Set to false to disable use of the keys
	this.enableKeys = true;

	// The four arrow keys
	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

	// Mouse buttons
	this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };

	// for reset
	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.zoom0 = this.object.zoom;

	//
	// public methods
	//

	this.getPolarAngle = function () {

		return phi;

	};

	this.getAzimuthalAngle = function () {

		return theta;

	};

	this.reset = function () {

		scope.target.copy( scope.target0 );
		scope.object.position.copy( scope.position0 );
		scope.object.zoom = scope.zoom0;

		scope.object.updateProjectionMatrix();
		scope.dispatchEvent( changeEvent );

		scope.update();

		state = STATE.NONE;

	};

	// this method is exposed, but perhaps it would be better if we can make it private...
	this.update = function() {

		var offset = new THREE.Vector3();

		// so camera.up is the orbit axis
		var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
		var quatInverse = quat.clone().inverse();

		var lastPosition = new THREE.Vector3();
		var lastQuaternion = new THREE.Quaternion();

		return function () {

			var position = scope.object.position;

			offset.copy( position ).sub( scope.target );

			// rotate offset to "y-axis-is-up" space
			offset.applyQuaternion( quat );

			// angle from z-axis around y-axis

			theta = Math.atan2( offset.x, offset.z );

			// angle from y-axis

			phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

			if ( scope.autoRotate && state === STATE.NONE ) {

				rotateLeft( getAutoRotationAngle() );

			}

			theta += thetaDelta;
			phi += phiDelta;

			// restrict theta to be between desired limits
			theta = Math.max( scope.minAzimuthAngle, Math.min( scope.maxAzimuthAngle, theta ) );

			// restrict phi to be between desired limits
			phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, phi ) );

			// restrict phi to be betwee EPS and PI-EPS
			phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

			var radius = offset.length() * scale;

			// restrict radius to be between desired limits
			radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, radius ) );

			// move target to panned location
			scope.target.add( panOffset );

			offset.x = radius * Math.sin( phi ) * Math.sin( theta );
			offset.y = radius * Math.cos( phi );
			offset.z = radius * Math.sin( phi ) * Math.cos( theta );

			// rotate offset back to "camera-up-vector-is-up" space
			offset.applyQuaternion( quatInverse );

			position.copy( scope.target ).add( offset );

			scope.object.lookAt( scope.target );

			if ( scope.enableDamping === true ) {

				thetaDelta *= ( 1 - scope.dampingFactor );
				phiDelta *= ( 1 - scope.dampingFactor );

			} else {

				thetaDelta = 0;
				phiDelta = 0;

			}

			scale = 1;
			panOffset.set( 0, 0, 0 );

			// update condition is:
			// min(camera displacement, camera rotation in radians)^2 > EPS
			// using small-angle approximation cos(x/2) = 1 - x^2 / 8

			if ( zoomChanged ||
				lastPosition.distanceToSquared( scope.object.position ) > EPS ||
				8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {

				scope.dispatchEvent( changeEvent );

				lastPosition.copy( scope.object.position );
				lastQuaternion.copy( scope.object.quaternion );
				zoomChanged = false;

				return true;

			}

			return false;

		};

	}();

	this.dispose = function() {

		scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
		scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		scope.domElement.removeEventListener( 'mousewheel', onMouseWheel, false );
		scope.domElement.removeEventListener( 'MozMousePixelScroll', onMouseWheel, false ); // firefox

		scope.domElement.removeEventListener( 'touchstart', onTouchStart, false );
		scope.domElement.removeEventListener( 'touchend', onTouchEnd, false );
		scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );
		document.removeEventListener( 'mouseout', onMouseUp, false );

		window.removeEventListener( 'keydown', onKeyDown, false );

		//scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?

	};

	//
	// internals
	//

	var scope = this;

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start' };
	var endEvent = { type: 'end' };

	var STATE = { NONE : - 1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

	var state = STATE.NONE;

	var EPS = 0.000001;

	// current position in spherical coordinates
	var theta;
	var phi;

	var phiDelta = 0;
	var thetaDelta = 0;
	var scale = 1;
	var panOffset = new THREE.Vector3();
	var zoomChanged = false;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var panStart = new THREE.Vector2();
	var panEnd = new THREE.Vector2();
	var panDelta = new THREE.Vector2();

	var dollyStart = new THREE.Vector2();
	var dollyEnd = new THREE.Vector2();
	var dollyDelta = new THREE.Vector2();

	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow( 0.95, scope.zoomSpeed );

	}

	function rotateLeft( angle ) {

		thetaDelta -= angle;

	}

	function rotateUp( angle ) {

		phiDelta -= angle;

	}

	var panLeft = function() {

		var v = new THREE.Vector3();

		return function panLeft( distance, objectMatrix ) {

			var te = objectMatrix.elements;

			// get X column of objectMatrix
			v.set( te[ 0 ], te[ 1 ], te[ 2 ] );

			v.multiplyScalar( - distance );

			panOffset.add( v );

		};

	}();

	var panUp = function() {

		var v = new THREE.Vector3();

		return function panUp( distance, objectMatrix ) {

			var te = objectMatrix.elements;

			// get Y column of objectMatrix
			v.set( te[ 4 ], te[ 5 ], te[ 6 ] );

			v.multiplyScalar( distance );

			panOffset.add( v );

		};

	}();

	// deltaX and deltaY are in pixels; right and down are positive
	var pan = function() {

		var offset = new THREE.Vector3();

		return function( deltaX, deltaY ) {

			var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

			if ( scope.object instanceof THREE.PerspectiveCamera ) {

				// perspective
				var position = scope.object.position;
				offset.copy( position ).sub( scope.target );
				var targetDistance = offset.length();

				// half of the fov is center to top of screen
				targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

				// we actually don't use screenWidth, since perspective camera is fixed to screen height
				panLeft( 2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix );
				panUp( 2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix );

			} else if ( scope.object instanceof THREE.OrthographicCamera ) {

				// orthographic
				panLeft( deltaX * ( scope.object.right - scope.object.left ) / element.clientWidth, scope.object.matrix );
				panUp( deltaY * ( scope.object.top - scope.object.bottom ) / element.clientHeight, scope.object.matrix );

			} else {

				// camera neither orthographic nor perspective
				console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
				scope.enablePan = false;

			}

		};

	}();

	function dollyIn( dollyScale ) {

		if ( scope.object instanceof THREE.PerspectiveCamera ) {

			scale /= dollyScale;

		} else if ( scope.object instanceof THREE.OrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom * dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			scope.enableZoom = false;

		}

	}

	function dollyOut( dollyScale ) {

		if ( scope.object instanceof THREE.PerspectiveCamera ) {

			scale *= dollyScale;

		} else if ( scope.object instanceof THREE.OrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			scope.enableZoom = false;

		}

	}

	//
	// event callbacks - update the object state
	//

	function handleMouseDownRotate( event ) {

		//console.log( 'handleMouseDownRotate' );

		rotateStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownDolly( event ) {

		//console.log( 'handleMouseDownDolly' );

		dollyStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownPan( event ) {

		//console.log( 'handleMouseDownPan' );

		panStart.set( event.clientX, event.clientY );

	}

	function handleMouseMoveRotate( event ) {

		//console.log( 'handleMouseMoveRotate' );

		rotateEnd.set( event.clientX, event.clientY );
		rotateDelta.subVectors( rotateEnd, rotateStart );

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		// rotating across whole screen goes 360 degrees around
		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleMouseMoveDolly( event ) {

		//console.log( 'handleMouseMoveDolly' );

		dollyEnd.set( event.clientX, event.clientY );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		if ( dollyDelta.y > 0 ) {

			dollyIn( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyOut( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

	function handleMouseMovePan( event ) {

		//console.log( 'handleMouseMovePan' );

		panEnd.set( event.clientX, event.clientY );

		panDelta.subVectors( panEnd, panStart );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

		scope.update();

	}

	function handleMouseUp( event ) {

		//console.log( 'handleMouseUp' );

	}

	function handleMouseWheel( event ) {

		//console.log( 'handleMouseWheel' );

		var delta = 0;

		if ( event.wheelDelta !== undefined ) {

			// WebKit / Opera / Explorer 9

			delta = event.wheelDelta;

		} else if ( event.detail !== undefined ) {

			// Firefox

			delta = - event.detail;

		}

		if ( delta > 0 ) {

			dollyOut( getZoomScale() );

		} else if ( delta < 0 ) {

			dollyIn( getZoomScale() );

		}

		scope.update();

	}

	function handleKeyDown( event ) {

		//console.log( 'handleKeyDown' );

		switch ( event.keyCode ) {

			case scope.keys.UP:
				pan( 0, scope.keyPanSpeed );
				scope.update();
				break;

			case scope.keys.BOTTOM:
				pan( 0, - scope.keyPanSpeed );
				scope.update();
				break;

			case scope.keys.LEFT:
				pan( scope.keyPanSpeed, 0 );
				scope.update();
				break;

			case scope.keys.RIGHT:
				pan( - scope.keyPanSpeed, 0 );
				scope.update();
				break;

		}

	}

	function handleTouchStartRotate( event ) {

		//console.log( 'handleTouchStartRotate' );

		rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

	}

	function handleTouchStartDolly( event ) {

		//console.log( 'handleTouchStartDolly' );

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		dollyStart.set( 0, distance );

	}

	function handleTouchStartPan( event ) {

		//console.log( 'handleTouchStartPan' );

		panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

	}

	function handleTouchMoveRotate( event ) {

		//console.log( 'handleTouchMoveRotate' );

		rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
		rotateDelta.subVectors( rotateEnd, rotateStart );

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		// rotating across whole screen goes 360 degrees around
		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleTouchMoveDolly( event ) {

		//console.log( 'handleTouchMoveDolly' );

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		dollyEnd.set( 0, distance );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		if ( dollyDelta.y > 0 ) {

			dollyOut( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyIn( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

	function handleTouchMovePan( event ) {

		//console.log( 'handleTouchMovePan' );

		panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		panDelta.subVectors( panEnd, panStart );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

		scope.update();

	}

	function handleTouchEnd( event ) {

		//console.log( 'handleTouchEnd' );

	}

	//
	// event handlers - FSM: listen for events and reset state
	//

	function onMouseDown( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		if ( event.button === scope.mouseButtons.ORBIT ) {

			if ( scope.enableRotate === false ) return;

			handleMouseDownRotate( event );

			state = STATE.ROTATE;

		} else if ( event.button === scope.mouseButtons.ZOOM ) {

			if ( scope.enableZoom === false ) return;

			handleMouseDownDolly( event );

			state = STATE.DOLLY;

		} else if ( event.button === scope.mouseButtons.PAN ) {

			if ( scope.enablePan === false ) return;

			handleMouseDownPan( event );

			state = STATE.PAN;

		}

		if ( state !== STATE.NONE ) {

			document.addEventListener( 'mousemove', onMouseMove, false );
			document.addEventListener( 'mouseup', onMouseUp, false );
			document.addEventListener( 'mouseout', onMouseUp, false );

			scope.dispatchEvent( startEvent );

		}

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		if ( state === STATE.ROTATE ) {

			if ( scope.enableRotate === false ) return;

			handleMouseMoveRotate( event );

		} else if ( state === STATE.DOLLY ) {

			if ( scope.enableZoom === false ) return;

			handleMouseMoveDolly( event );

		} else if ( state === STATE.PAN ) {

			if ( scope.enablePan === false ) return;

			handleMouseMovePan( event );

		}

	}

	function onMouseUp( event ) {

		if ( scope.enabled === false ) return;

		handleMouseUp( event );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );
		document.removeEventListener( 'mouseout', onMouseUp, false );

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false || scope.enableZoom === false || state !== STATE.NONE ) return;

		event.preventDefault();
		event.stopPropagation();

		handleMouseWheel( event );

		scope.dispatchEvent( startEvent ); // not sure why these are here...
		scope.dispatchEvent( endEvent );

	}

	function onKeyDown( event ) {

		if ( scope.enabled === false || scope.enableKeys === false || scope.enablePan === false ) return;

		handleKeyDown( event );

	}

	function onTouchStart( event ) {

		if ( scope.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:	// one-fingered touch: rotate

				if ( scope.enableRotate === false ) return;

				handleTouchStartRotate( event );

				state = STATE.TOUCH_ROTATE;

				break;

			case 2:	// two-fingered touch: dolly

				if ( scope.enableZoom === false ) return;

				handleTouchStartDolly( event );

				state = STATE.TOUCH_DOLLY;

				break;

			case 3: // three-fingered touch: pan

				if ( scope.enablePan === false ) return;

				handleTouchStartPan( event );

				state = STATE.TOUCH_PAN;

				break;

			default:

				state = STATE.NONE;

		}

		if ( state !== STATE.NONE ) {

			scope.dispatchEvent( startEvent );

		}

	}

	function onTouchMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

			case 1: // one-fingered touch: rotate

				if ( scope.enableRotate === false ) return;
				if ( state !== STATE.TOUCH_ROTATE ) return; // is this needed?...

				handleTouchMoveRotate( event );

				break;

			case 2: // two-fingered touch: dolly

				if ( scope.enableZoom === false ) return;
				if ( state !== STATE.TOUCH_DOLLY ) return; // is this needed?...

				handleTouchMoveDolly( event );

				break;

			case 3: // three-fingered touch: pan

				if ( scope.enablePan === false ) return;
				if ( state !== STATE.TOUCH_PAN ) return; // is this needed?...

				handleTouchMovePan( event );

				break;

			default:

				state = STATE.NONE;

		}

	}

	function onTouchEnd( event ) {

		if ( scope.enabled === false ) return;

		handleTouchEnd( event );

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onContextMenu( event ) {

		event.preventDefault();

	}

	//

	scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );

	scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
	scope.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
	scope.domElement.addEventListener( 'MozMousePixelScroll', onMouseWheel, false ); // firefox

	scope.domElement.addEventListener( 'touchstart', onTouchStart, false );
	scope.domElement.addEventListener( 'touchend', onTouchEnd, false );
	scope.domElement.addEventListener( 'touchmove', onTouchMove, false );

	window.addEventListener( 'keydown', onKeyDown, false );

	// force an update at start

	this.update();

};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;

Object.defineProperties( THREE.OrbitControls.prototype, {

	center: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .center has been renamed to .target' );
			return this.target;

		}

	},

	// backward compatibility

	noZoom: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
			return ! this.enableZoom;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
			this.enableZoom = ! value;

		}

	},

	noRotate: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
			return ! this.enableRotate;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
			this.enableRotate = ! value;

		}

	},

	noPan: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
			return ! this.enablePan;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
			this.enablePan = ! value;

		}

	},

	noKeys: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
			return ! this.enableKeys;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
			this.enableKeys = ! value;

		}

	},

	staticMoving : {

		get: function () {

			console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
			return ! this.constraint.enableDamping;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
			this.constraint.enableDamping = ! value;

		}

	},

	dynamicDampingFactor : {

		get: function () {

			console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
			return this.constraint.dampingFactor;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
			this.constraint.dampingFactor = value;

		}

	}

} );

THREE.CapsuleBufferGeometry = function( Radius, Height, SRadius, H) {

    THREE.BufferGeometry.call( this );

    this.type = 'CapsuleBufferGeometry';

    

    var radius = Radius || 1;
    var height = Height || 1;

    var sRadius = SRadius || 12;
    var sHeight = ~~ sRadius*0.5;// SHeight || 6;
    var h = H || 1;
    var o0 = Math.PI * 2;
    var o1 = Math.PI * 0.5;
    var g = new THREE.Geometry();
    var m0 = new THREE.CylinderGeometry(radius, radius, height, sRadius, h, true);
    var m1 = new THREE.SphereGeometry(radius, sRadius, sHeight, 0, o0, 0, o1);
    var m2 = new THREE.SphereGeometry(radius, sRadius, sHeight, 0, o0, o1, o1);
    var mtx0 = new THREE.Matrix4().makeTranslation(0,0,0);
    var mtx1 = new THREE.Matrix4().makeTranslation(0, height*0.5,0);
    var mtx2 = new THREE.Matrix4().makeTranslation(0, -height*0.5,0);
    g.merge( m0, mtx0);
    g.merge( m1, mtx1);
    g.merge( m2, mtx2);
    g.mergeVertices();

    this.fromGeometry( g );

    /*

    var i, n, n2, n3, face, vertice, uv, uv2, norm;
    var faceVertexUvs = g.faceVertexUvs;

    var hasFaceVertexUv = faceVertexUvs[ 0 ] && faceVertexUvs[ 0 ].length > 0;
    var hasFaceVertexUv2 = faceVertexUvs[ 1 ] && faceVertexUvs[ 1 ].length > 0;

    var v = g.vertices.length;
    var f = g.faces.length;
    var u = g.faceVertexUvs[0].length;

    console.log(v, g.faceVertexUvs[0].length);

    var vertices = new Float32Array( v * 3 );
    var normals = new Float32Array( f * 9 );
    var uvs = new Float32Array( u * 6 );
    //var uvs2 = new Float32Array( v * 2 );

    // get vertice
    i = v;
    while(i--){
        
        n3 = i*3;
        vertice = g.vertices[i]
        vertices[n3] = vertice.x;
        vertices[n3+1] = vertice.y;
        vertices[n3+2] = vertice.z;
    }

    i = u;
    while(i--){
        n = i*6;
        uv = g.faceVertexUvs[0][i];
        uvs[n] = uv[0].x;
        uvs[n+1] = uv[0].y;
        uvs[n+2] = uv[1].x;
        uvs[n+3] = uv[1].y;
        uvs[n+4] = uv[2].x;
        uvs[n+5] = uv[2].y;
    }

    // get indices of faces
    var indices = new ( ( f ) > 65535 ? Uint32Array : Uint16Array )( f * 3 );
    //var normals = new Float32Array( f * 3 );
    i = f;
    while(i--){
        n3 = i*3;
        face = g.faces[i];
        indices[n3] = face.a;
        indices[n3+1] = face.b;
        indices[n3+2] = face.c;

        n=i*9;
        norm = face.vertexNormals;
        normals[n] = norm[0].x;
        normals[n+1] = norm[0].y;
        normals[n+2] = norm[0].z;
        normals[n+3] = norm[1].x;
        normals[n+4] = norm[1].y;
        normals[n+5] = norm[1].z;
        normals[n+6] = norm[2].x;
        normals[n+7] = norm[2].y;
        normals[n+8] = norm[2].z;


        

        //uv2 = g.faceVertexUvs[1][i];
    }

    console.log(g.faces[3]);

    


   
    this.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    this.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
    this.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
     this.setIndex( new THREE.BufferAttribute( indices, 1 ) );
    //this.addAttribute( 'uv2', new THREE.BufferAttribute( uvs, 2 ) )
    //this.computeVertexNormals();
    this.computeBoundingSphere();

    g.dispose();*/

}

THREE.CapsuleBufferGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
THREE.CapsuleBufferGeometry.prototype.constructor = THREE.CapsuleBufferGeometry;
/**
 * @author qiao / https://github.com/qiao
 * @fileoverview This is a convex hull generator using the incremental method. 
 * The complexity is O(n^2) where n is the number of vertices.
 * O(nlogn) algorithms do exist, but they are much more complicated.
 *
 * Benchmark: 
 *
 *  Platform: CPU: P7350 @2.00GHz Engine: V8
 *
 *  Num Vertices	Time(ms)
 *
 *     10           1
 *     20           3
 *     30           19
 *     40           48
 *     50           107
 */

THREE.ConvexGeometry = function( vertices ) {

	THREE.Geometry.call( this );

	var faces = [ [ 0, 1, 2 ], [ 0, 2, 1 ] ]; 

	for ( var i = 3; i < vertices.length; i ++ ) {

		addPoint( i );

	}


	function addPoint( vertexId ) {

		var vertex = vertices[ vertexId ].clone();

		var mag = vertex.length();
		vertex.x += mag * randomOffset();
		vertex.y += mag * randomOffset();
		vertex.z += mag * randomOffset();

		var hole = [];

		for ( var f = 0; f < faces.length; ) {

			var face = faces[ f ];

			// for each face, if the vertex can see it,
			// then we try to add the face's edges into the hole.
			if ( visible( face, vertex ) ) {

				for ( var e = 0; e < 3; e ++ ) {

					var edge = [ face[ e ], face[ ( e + 1 ) % 3 ] ];
					var boundary = true;

					// remove duplicated edges.
					for ( var h = 0; h < hole.length; h ++ ) {

						if ( equalEdge( hole[ h ], edge ) ) {

							hole[ h ] = hole[ hole.length - 1 ];
							hole.pop();
							boundary = false;
							break;

						}

					}

					if ( boundary ) {

						hole.push( edge );

					}

				}

				// remove faces[ f ]
				faces[ f ] = faces[ faces.length - 1 ];
				faces.pop();

			} else {

				// not visible

				f ++;

			}

		}

		// construct the new faces formed by the edges of the hole and the vertex
		for ( var h = 0; h < hole.length; h ++ ) {

			faces.push( [ 
				hole[ h ][ 0 ],
				hole[ h ][ 1 ],
				vertexId
			] );

		}

	}

	/**
	 * Whether the face is visible from the vertex
	 */
	function visible( face, vertex ) {

		var va = vertices[ face[ 0 ] ];
		var vb = vertices[ face[ 1 ] ];
		var vc = vertices[ face[ 2 ] ];

		var n = normal( va, vb, vc );

		// distance from face to origin
		var dist = n.dot( va );

		return n.dot( vertex ) >= dist; 

	}

	/**
	 * Face normal
	 */
	function normal( va, vb, vc ) {

		var cb = new THREE.Vector3();
		var ab = new THREE.Vector3();

		cb.subVectors( vc, vb );
		ab.subVectors( va, vb );
		cb.cross( ab );

		cb.normalize();

		return cb;

	}

	/**
	 * Detect whether two edges are equal.
	 * Note that when constructing the convex hull, two same edges can only
	 * be of the negative direction.
	 */
	function equalEdge( ea, eb ) {

		return ea[ 0 ] === eb[ 1 ] && ea[ 1 ] === eb[ 0 ]; 

	}

	/**
	 * Create a random offset between -1e-6 and 1e-6.
	 */
	function randomOffset() {

		return ( Math.random() - 0.5 ) * 2 * 1e-6;

	}


	/**
	 * XXX: Not sure if this is the correct approach. Need someone to review.
	 */
	function vertexUv( vertex ) {

		var mag = vertex.length();
		return new THREE.Vector2( vertex.x / mag, vertex.y / mag );

	}

	// Push vertices into `this.vertices`, skipping those inside the hull
	var id = 0;
	var newId = new Array( vertices.length ); // map from old vertex id to new id

	for ( var i = 0; i < faces.length; i ++ ) {

		 var face = faces[ i ];

		 for ( var j = 0; j < 3; j ++ ) {

			if ( newId[ face[ j ] ] === undefined ) {

				newId[ face[ j ] ] = id ++;
				this.vertices.push( vertices[ face[ j ] ] );

			}

			face[ j ] = newId[ face[ j ] ];

		 }

	}

	// Convert faces into instances of THREE.Face3
	for ( var i = 0; i < faces.length; i ++ ) {

		this.faces.push( new THREE.Face3( 
				faces[ i ][ 0 ],
				faces[ i ][ 1 ],
				faces[ i ][ 2 ]
		) );

	}

	// Compute UVs
	for ( var i = 0; i < this.faces.length; i ++ ) {

		var face = this.faces[ i ];

		this.faceVertexUvs[ 0 ].push( [
			vertexUv( this.vertices[ face.a ] ),
			vertexUv( this.vertices[ face.b ] ),
			vertexUv( this.vertices[ face.c ] )
		] );

	}

	this.computeFaceNormals();
	this.computeVertexNormals();

};

THREE.ConvexGeometry.prototype = Object.create( THREE.Geometry.prototype );
THREE.ConvexGeometry.prototype.constructor = THREE.ConvexGeometry;



var TransparentShadow = function ( color, opacity ) {

    color = color || 0x040205;
    opacity = opacity || 0.3;
    //THREE.ShaderMaterial.call( this, parameters );
    //this.type = 'TransparentShadow';

    var fragment = [

    "uniform vec3 diffuse;",
    "uniform float opacity;",

    "#ifndef FLAT_SHADED",

    "   varying vec3 vNormal;",

    "#endif",

    THREE.ShaderChunk[ "common" ],
    //THREE.ShaderChunk[ "color_pars_fragment" ],
    THREE.ShaderChunk[ "uv_pars_fragment" ],
   // THREE.ShaderChunk[ "uv2_pars_fragment" ],
    //THREE.ShaderChunk[ "map_pars_fragment" ],
    THREE.ShaderChunk[ "alphamap_pars_fragment" ],
    //THREE.ShaderChunk[ "aomap_pars_fragment" ],
    //THREE.ShaderChunk[ "envmap_pars_fragment" ],
    //THREE.ShaderChunk[ "fog_pars_fragment" ],
    THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
    //THREE.ShaderChunk[ "specularmap_pars_fragment" ],
    THREE.ShaderChunk[ "logdepthbuf_pars_fragment" ],

    "void main() {",

    "   vec4 diffuseColor = vec4( diffuse, opacity );",

        THREE.ShaderChunk[ "logdepthbuf_fragment" ],
      //  THREE.ShaderChunk[ "map_fragment" ],
       // THREE.ShaderChunk[ "color_fragment" ],
        THREE.ShaderChunk[ "alphamap_fragment" ],
        THREE.ShaderChunk[ "alphatest_fragment" ],
     //   THREE.ShaderChunk[ "specularmap_fragment" ],

    //"   ReflectedLight reflectedLight;",
    //"   reflectedLight.directDiffuse = vec3( 0.0 );",
    //"   reflectedLight.directSpecular = vec3( 0.0 );",
    //"   reflectedLight.indirectDiffuse = diffuseColor.rgb;",
    //"   reflectedLight.indirectSpecular = vec3( 0.0 );",

       //THREE.ShaderChunk[ "aomap_fragment" ],
        THREE.ShaderChunk[ "shadowmap_fragment" ],

      //  "reflectedLight.indirectDiffuse *= shadowMask;",

       //"vec3 outgoingLight = vec3( 0.0 );",//reflectedLight.indirectDiffuse;",

        //THREE.ShaderChunk[ "envmap_fragment" ],
       // THREE.ShaderChunk[ "linear_to_gamma_fragment" ],
        //THREE.ShaderChunk[ "fog_fragment" ],

    //"   gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
    "   gl_FragColor = vec4( diffuseColor.xyz, diffuseColor.a - shadowMask );",

    "}"

].join( "\n" );

    var mat = new THREE.ShaderMaterial({
        uniforms: THREE.ShaderLib['basic'].uniforms,
        vertexShader: THREE.ShaderLib['basic'].vertexShader,
        fragmentShader: fragment,
        transparent:true,
        depthWrite: false, 
        fog:false
    });

    mat.uniforms.diffuse.value = new THREE.Color(color);
    mat.uniforms.opacity.value = opacity;

    return mat; 

}

THREE.CarHelper = function ( p ) {

    var s = 0.2;
    var d = 0.5;

    this.py = p[1];

    var vertices = new Float32Array( [
        -s, 0, 0,  s, 0, 0,
        0, 0, 0,  0, s*2, 0,
        0, 0, -s,  0, 0, s,

        p[0]*d, p[1], p[2],    p[0]*d, p[1]+1, p[2],
        -p[0]*d, p[1], p[2],   -p[0]*d, p[1]+1, p[2],
        -p[0]*d, p[1],-p[2],   -p[0]*d, p[1]+1, -p[2],
        p[0]*d, p[1], -p[2],    p[0]*d, p[1]+1, -p[2],
    ] );

    var colors = new Float32Array( [
        1, 1, 0,  1, 1, 0,
        1, 1, 0,  0, 1, 0,
        1, 1, 0,  1, 1, 0,

        1,1,0,    1,1,0,
        1,1,0,    1,1,0,
        1,1,0,    1,1,0,
        1,1,0,    1,1,0,
    ] );

    this.geometry = new THREE.BufferGeometry();
    this.geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    this.geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

    this.positions = this.geometry.attributes.position.array;

    this.material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors, name:'helper' } );

    THREE.LineSegments.call( this, this.geometry, this.material );

};

THREE.CarHelper.prototype = Object.create( THREE.LineSegments.prototype );
THREE.CarHelper.prototype.constructor = THREE.CarHelper;

THREE.CarHelper.prototype.dispose = function () {

    this.geometry.dispose();
    this.material.dispose();

};

THREE.CarHelper.prototype.updateSuspension = function ( s0, s1, s2, s3 ) {

    this.positions[22] = this.py-s0;
    this.positions[28] = this.py-s1;
    this.positions[34] = this.py-s2;
    this.positions[40] = this.py-s3;

    this.geometry.attributes.position.needsUpdate = true;

};
THREE.Terrain = function ( o, perlin ) {

    o = o == undefined ? {} : o;

    this.div = o.div == undefined ? [64,64] : o.div;
    this.size = o.size == undefined ? [100,10,100] : o.size;

    this.colorBase = { r:1, g:0.7, b:0 };

    // for perlin
    this.complexity = o.complexity == undefined ? 30 : o.complexity;
    this.complexity2 = o.complexity2 == undefined ? 60 : o.complexity2;

    this.local = new THREE.Vector3();
    if(o.local) this.local.fromArray( o.local );

    this.lng = this.div[0] * this.div[1];
    this.hdata = new Float32Array( this.lng );

    this.perlin = perlin == undefined ? new Perlin() : perlin;

    this.colors = new Float32Array( this.lng * 3 );
    this.geometry = new THREE.PlaneBufferGeometry( this.size[0], this.size[2], this.div[0] - 1, this.div[1] - 1 );
    this.geometry.rotateX( -Math.PI * 0.5 );
    this.geometry.computeBoundingSphere();

    this.geometry.addAttribute( 'color', new THREE.BufferAttribute( this.colors, 3 ) );
    this.vertices = this.geometry.attributes.position.array;

    this.material = new THREE.MeshStandardMaterial({ vertexColors: THREE.VertexColors, name:'terrain', metalness:1, roughness:0.3, wireframe:false });

    this.update();


    THREE.Mesh.call( this, this.geometry, this.material );

    this.castShadow = false;
    this.receiveShadow = true;

};

THREE.Terrain.prototype = Object.create( THREE.Mesh.prototype );
THREE.Terrain.prototype.constructor = THREE.Terrain;

THREE.Terrain.prototype.dispose = function () {

    this.geometry.dispose();
    this.material.dispose();
    
}

THREE.Terrain.prototype.setEnvMap = function ( map ) {

    this.material.envMap = map;
}

THREE.Terrain.prototype.move = function () {

    this.update();
}

THREE.Terrain.prototype.clamp = function (v, min, max) {
    v = v < min ? min : v;
    v = v > max ? max : v;
    return v;
}

THREE.Terrain.prototype.norm = function (v, min, max) {
    //v = v < min ? min : v;
    //v = v > max ? max : v;
    return (v - min) / (max - min);
}
THREE.Terrain.prototype.linear = function (a, n0, n1) {
    return ((1.0 - a) * (n0)) + (a * (n1));
}
THREE.Terrain.prototype.cubicSCurve = function (a) {
     a = (a);
        return (a * a * (3.0 - 2.0 * a));
}
THREE.Terrain.prototype.quinticSCurve = function (a) {
     a = (a);
        var a3 = (a * a * a);
        var a4 = (a3 * a);
        var a5 = (a4 * a);
        return ((6.0 * a5) - (15.0 * a4) + (10.0 * a3));
}

THREE.Terrain.prototype.update = function () {

    var sc = 1 / this.complexity;
    var sc2 = 1 / this.complexity2;
    var r = 1 / this.div[0];
    var rx = (this.div[0] - 1) / this.size[0];
    var rz = (this.div[1] - 1) / this.size[2];

    var i = this.lng, n, x, y, c, c1, c2;
    while(i--){
        n = i * 3;
        x = i % this.div[0];
        y = ~~ ( i * r );

        /*
        // from -1 to 1
        c1 = this.perlin.noise( (x+(this.local.x*rx))*sc, (y+(this.local.z*rz))*sc ); 
        c2 = this.perlin.noise( (x+100+(this.local.x*rx))*sc2, (y+100+(this.local.z*rz))*sc2 );
        c = 0.5 + ((c1*c2) * 0.5);
        */
        
        
        // from 0 to 1
        c1 = 0.5 + ( this.perlin.noise( (x+(this.local.x*rx))*sc, (y+(this.local.z*rz))*sc ) * 0.5); 
        c2 = 0.5 + ( this.perlin.noise( (x+100+(this.local.x*rx))*sc2, (y+100+(this.local.z*rz))*sc2 ) * 0.5);
        //c = c1*c2;

        c = Math.min(c1,c2);
        //c = Math.max(c1,c2);
        //c = Math.pow(c1,c2);

        //c = this.norm(c, 0.3, 0.5);
        c = this.linear(c, 0, 0.7);
        //c = this.cubicSCurve(c);
        c = this.quinticSCurve(c);

         //c = this.clamp(c, 0, 1);
        
        this.hdata[ i ] = c * this.size[ 1 ]; // final h size
        this.vertices[ n + 1 ] = this.hdata[i];
        this.colors[ n ] = c * this.colorBase.r;
        this.colors[ n + 1 ] = c * this.colorBase.g;
        this.colors[ n + 2 ] = c * this.colorBase.b;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    
    //this.geometry.computeBoundingSphere();
    this.geometry.computeVertexNormals();



}
