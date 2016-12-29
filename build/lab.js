var THREE;
var list;
var extensions;
var numDiv;
var data;
var TextDecoder;

var ammo, intro, UIL, esprima, CodeMirror, update, postUpdate;

var Br, Cr, Jr, Hr, Sr;
var demos;

// tween
var module, exports, process, define;
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
 * Tween.js - Licensed under the MIT license
 * https://github.com/tweenjs/tween.js
 * ----------------------------------------------
 *
 * See https://github.com/tweenjs/tween.js/graphs/contributors for the full list of contributors.
 * Thank you all, you're awesome!
 */

var TWEEN = TWEEN || (function () {

	var _tweens = [];

	return {

		getAll: function () {

			return _tweens;

		},

		removeAll: function () {

			_tweens = [];

		},

		add: function (tween) {

			_tweens.push(tween);

		},

		remove: function (tween) {

			var i = _tweens.indexOf(tween);

			if (i !== -1) {
				_tweens.splice(i, 1);
			}

		},

		update: function (time, preserve) {

			if (_tweens.length === 0) {
				return false;
			}

			var i = 0;

			time = time !== undefined ? time : TWEEN.now();

			while (i < _tweens.length) {

				if (_tweens[i].update(time) || preserve) {
					i++;
				} else {
					_tweens.splice(i, 1);
				}

			}

			return true;

		}
	};

})();


// Include a performance.now polyfill.
// In node.js, use process.hrtime.
if (typeof (window) === 'undefined' && typeof (process) !== 'undefined') {
	TWEEN.now = function () {
		var time = process.hrtime();

		// Convert [seconds, nanoseconds] to milliseconds.
		return time[0] * 1000 + time[1] / 1000000;
	};
}
// In a browser, use window.performance.now if it is available.
else if (typeof (window) !== 'undefined' &&
         window.performance !== undefined &&
		 window.performance.now !== undefined) {
	// This must be bound, because directly assigning this function
	// leads to an invocation exception in Chrome.
	TWEEN.now = window.performance.now.bind(window.performance);
}
// Use Date.now if it is available.
else if (Date.now !== undefined) {
	TWEEN.now = Date.now;
}
// Otherwise, use 'new Date().getTime()'.
else {
	TWEEN.now = function () {
		return new Date().getTime();
	};
}


TWEEN.Tween = function (object) {

	var _object = object;
	var _valuesStart = {};
	var _valuesEnd = {};
	var _valuesStartRepeat = {};
	var _duration = 1000;
	var _repeat = 0;
	var _repeatDelayTime;
	var _yoyo = false;
	var _isPlaying = false;
	var _reversed = false;
	var _delayTime = 0;
	var _startTime = null;
	var _easingFunction = TWEEN.Easing.Linear.None;
	var _interpolationFunction = TWEEN.Interpolation.Linear;
	var _chainedTweens = [];
	var _onStartCallback = null;
	var _onStartCallbackFired = false;
	var _onUpdateCallback = null;
	var _onCompleteCallback = null;
	var _onStopCallback = null;

	this.to = function (properties, duration) {

		_valuesEnd = properties;

		if (duration !== undefined) {
			_duration = duration;
		}

		return this;

	};

	this.start = function (time) {

		TWEEN.add(this);

		_isPlaying = true;

		_onStartCallbackFired = false;

		_startTime = time !== undefined ? time : TWEEN.now();
		_startTime += _delayTime;

		for (var property in _valuesEnd) {

			// Check if an Array was provided as property value
			if (_valuesEnd[property] instanceof Array) {

				if (_valuesEnd[property].length === 0) {
					continue;
				}

				// Create a local copy of the Array with the start value at the front
				_valuesEnd[property] = [_object[property]].concat(_valuesEnd[property]);

			}

			// If `to()` specifies a property that doesn't exist in the source object,
			// we should not set that property in the object
			if (_object[property] === undefined) {
				continue;
			}

			// Save the starting value.
			_valuesStart[property] = _object[property];

			if ((_valuesStart[property] instanceof Array) === false) {
				_valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
			}

			_valuesStartRepeat[property] = _valuesStart[property] || 0;

		}

		return this;

	};

	this.stop = function () {

		if (!_isPlaying) {
			return this;
		}

		TWEEN.remove(this);
		_isPlaying = false;

		if (_onStopCallback !== null) {
			_onStopCallback.call(_object, _object);
		}

		this.stopChainedTweens();
		return this;

	};

	this.end = function () {

		this.update(_startTime + _duration);
		return this;

	};

	this.stopChainedTweens = function () {

		for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
			_chainedTweens[i].stop();
		}

	};

	this.delay = function (amount) {

		_delayTime = amount;
		return this;

	};

	this.repeat = function (times) {

		_repeat = times;
		return this;

	};

	this.repeatDelay = function (amount) {

		_repeatDelayTime = amount;
		return this;

	};

	this.yoyo = function (yoyo) {

		_yoyo = yoyo;
		return this;

	};


	this.easing = function (easing) {

		_easingFunction = easing;
		return this;

	};

	this.interpolation = function (interpolation) {

		_interpolationFunction = interpolation;
		return this;

	};

	this.chain = function () {

		_chainedTweens = arguments;
		return this;

	};

	this.onStart = function (callback) {

		_onStartCallback = callback;
		return this;

	};

	this.onUpdate = function (callback) {

		_onUpdateCallback = callback;
		return this;

	};

	this.onComplete = function (callback) {

		_onCompleteCallback = callback;
		return this;

	};

	this.onStop = function (callback) {

		_onStopCallback = callback;
		return this;

	};

	this.update = function (time) {

		var property;
		var elapsed;
		var value;

		if (time < _startTime) {
			return true;
		}

		if (_onStartCallbackFired === false) {

			if (_onStartCallback !== null) {
				_onStartCallback.call(_object, _object);
			}

			_onStartCallbackFired = true;
		}

		elapsed = (time - _startTime) / _duration;
		elapsed = elapsed > 1 ? 1 : elapsed;

		value = _easingFunction(elapsed);

		for (property in _valuesEnd) {

			// Don't update properties that do not exist in the source object
			if (_valuesStart[property] === undefined) {
				continue;
			}

			var start = _valuesStart[property] || 0;
			var end = _valuesEnd[property];

			if (end instanceof Array) {

				_object[property] = _interpolationFunction(end, value);

			} else {

				// Parses relative end values with start as base (e.g.: +10, -3)
				if (typeof (end) === 'string') {

					if (end.charAt(0) === '+' || end.charAt(0) === '-') {
						end = start + parseFloat(end);
					} else {
						end = parseFloat(end);
					}
				}

				// Protect against non numeric properties.
				if (typeof (end) === 'number') {
					_object[property] = start + (end - start) * value;
				}

			}

		}

		if (_onUpdateCallback !== null) {
			_onUpdateCallback.call(_object, value);
		}

		if (elapsed === 1) {

			if (_repeat > 0) {

				if (isFinite(_repeat)) {
					_repeat--;
				}

				// Reassign starting values, restart by making startTime = now
				for (property in _valuesStartRepeat) {

					if (typeof (_valuesEnd[property]) === 'string') {
						_valuesStartRepeat[property] = _valuesStartRepeat[property] + parseFloat(_valuesEnd[property]);
					}

					if (_yoyo) {
						var tmp = _valuesStartRepeat[property];

						_valuesStartRepeat[property] = _valuesEnd[property];
						_valuesEnd[property] = tmp;
					}

					_valuesStart[property] = _valuesStartRepeat[property];

				}

				if (_yoyo) {
					_reversed = !_reversed;
				}

				if (_repeatDelayTime !== undefined) {
					_startTime = time + _repeatDelayTime;
				} else {
					_startTime = time + _delayTime;
				}

				return true;

			} else {

				if (_onCompleteCallback !== null) {

					_onCompleteCallback.call(_object, _object);
				}

				for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
					// Make the chained tweens start exactly at the time they should,
					// even if the `update()` method was called way past the duration of the tween
					_chainedTweens[i].start(_startTime + _duration);
				}

				return false;

			}

		}

		return true;

	};

};


TWEEN.Easing = {

	Linear: {

		None: function (k) {

			return k;

		}

	},

	Quadratic: {

		In: function (k) {

			return k * k;

		},

		Out: function (k) {

			return k * (2 - k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k;
			}

			return - 0.5 * (--k * (k - 2) - 1);

		}

	},

	Cubic: {

		In: function (k) {

			return k * k * k;

		},

		Out: function (k) {

			return --k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k + 2);

		}

	},

	Quartic: {

		In: function (k) {

			return k * k * k * k;

		},

		Out: function (k) {

			return 1 - (--k * k * k * k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k;
			}

			return - 0.5 * ((k -= 2) * k * k * k - 2);

		}

	},

	Quintic: {

		In: function (k) {

			return k * k * k * k * k;

		},

		Out: function (k) {

			return --k * k * k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k * k * k + 2);

		}

	},

	Sinusoidal: {

		In: function (k) {

			return 1 - Math.cos(k * Math.PI / 2);

		},

		Out: function (k) {

			return Math.sin(k * Math.PI / 2);

		},

		InOut: function (k) {

			return 0.5 * (1 - Math.cos(Math.PI * k));

		}

	},

	Exponential: {

		In: function (k) {

			return k === 0 ? 0 : Math.pow(1024, k - 1);

		},

		Out: function (k) {

			return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k);

		},

		InOut: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			if ((k *= 2) < 1) {
				return 0.5 * Math.pow(1024, k - 1);
			}

			return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);

		}

	},

	Circular: {

		In: function (k) {

			return 1 - Math.sqrt(1 - k * k);

		},

		Out: function (k) {

			return Math.sqrt(1 - (--k * k));

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return - 0.5 * (Math.sqrt(1 - k * k) - 1);
			}

			return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);

		}

	},

	Elastic: {

		In: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			return -Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);

		},

		Out: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;

		},

		InOut: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			k *= 2;

			if (k < 1) {
				return -0.5 * Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
			}

			return 0.5 * Math.pow(2, -10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI) + 1;

		}

	},

	Back: {

		In: function (k) {

			var s = 1.70158;

			return k * k * ((s + 1) * k - s);

		},

		Out: function (k) {

			var s = 1.70158;

			return --k * k * ((s + 1) * k + s) + 1;

		},

		InOut: function (k) {

			var s = 1.70158 * 1.525;

			if ((k *= 2) < 1) {
				return 0.5 * (k * k * ((s + 1) * k - s));
			}

			return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);

		}

	},

	Bounce: {

		In: function (k) {

			return 1 - TWEEN.Easing.Bounce.Out(1 - k);

		},

		Out: function (k) {

			if (k < (1 / 2.75)) {
				return 7.5625 * k * k;
			} else if (k < (2 / 2.75)) {
				return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
			} else if (k < (2.5 / 2.75)) {
				return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
			} else {
				return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
			}

		},

		InOut: function (k) {

			if (k < 0.5) {
				return TWEEN.Easing.Bounce.In(k * 2) * 0.5;
			}

			return TWEEN.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;

		}

	}

};

TWEEN.Interpolation = {

	Linear: function (v, k) {

		var m = v.length - 1;
		var f = m * k;
		var i = Math.floor(f);
		var fn = TWEEN.Interpolation.Utils.Linear;

		if (k < 0) {
			return fn(v[0], v[1], f);
		}

		if (k > 1) {
			return fn(v[m], v[m - 1], m - f);
		}

		return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);

	},

	Bezier: function (v, k) {

		var b = 0;
		var n = v.length - 1;
		var pw = Math.pow;
		var bn = TWEEN.Interpolation.Utils.Bernstein;

		for (var i = 0; i <= n; i++) {
			b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
		}

		return b;

	},

	CatmullRom: function (v, k) {

		var m = v.length - 1;
		var f = m * k;
		var i = Math.floor(f);
		var fn = TWEEN.Interpolation.Utils.CatmullRom;

		if (v[0] === v[m]) {

			if (k < 0) {
				i = Math.floor(f = m * (1 + k));
			}

			return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);

		} else {

			if (k < 0) {
				return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
			}

			if (k > 1) {
				return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
			}

			return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);

		}

	},

	Utils: {

		Linear: function (p0, p1, t) {

			return (p1 - p0) * t + p0;

		},

		Bernstein: function (n, i) {

			var fc = TWEEN.Interpolation.Utils.Factorial;

			return fc(n) / fc(i) / fc(n - i);

		},

		Factorial: (function () {

			var a = [1];

			return function (n) {

				var s = 1;

				if (a[n]) {
					return a[n];
				}

				for (var i = n; i > 1; i--) {
					s *= i;
				}

				a[n] = s;
				return s;

			};

		})(),

		CatmullRom: function (p0, p1, p2, p3, t) {

			var v0 = (p2 - p0) * 0.5;
			var v1 = (p3 - p1) * 0.5;
			var t2 = t * t;
			var t3 = t * t2;

			return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (- 3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;

		}

	}

};

// UMD (Universal Module Definition)
(function (root) {

	if (typeof define === 'function' && define.amd) {

		// AMD
		define([], function () {
			return TWEEN;
		});

	} else if (typeof module !== 'undefined' && typeof exports === 'object') {

		// Node.js
		module.exports = TWEEN;

	} else if (root !== undefined) {

		// Global variable
		root.TWEEN = TWEEN;

	}

})(this);

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
//    Pan - right mouse, or arrow keys / touch: three finger swipe

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

		return spherical.phi;

	};

	this.getAzimuthalAngle = function () {

		return spherical.theta;

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
	this.update = function () {

		var offset = new THREE.Vector3();

		// so camera.up is the orbit axis
		var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
		var quatInverse = quat.clone().inverse();

		var lastPosition = new THREE.Vector3();
		var lastQuaternion = new THREE.Quaternion();

		return function update() {

			var position = scope.object.position;

			offset.copy( position ).sub( scope.target );

			// rotate offset to "y-axis-is-up" space
			offset.applyQuaternion( quat );

			// angle from z-axis around y-axis
			spherical.setFromVector3( offset );

			if ( scope.autoRotate && state === STATE.NONE ) {

				rotateLeft( getAutoRotationAngle() );

			}

			spherical.theta += sphericalDelta.theta;
			spherical.phi += sphericalDelta.phi;

			// restrict theta to be between desired limits
			spherical.theta = Math.max( scope.minAzimuthAngle, Math.min( scope.maxAzimuthAngle, spherical.theta ) );

			// restrict phi to be between desired limits
			spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );

			spherical.makeSafe();


			spherical.radius *= scale;

			// restrict radius to be between desired limits
			spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

			// move target to panned location
			scope.target.add( panOffset );

			offset.setFromSpherical( spherical );

			// rotate offset back to "camera-up-vector-is-up" space
			offset.applyQuaternion( quatInverse );

			position.copy( scope.target ).add( offset );

			scope.object.lookAt( scope.target );

			if ( scope.enableDamping === true ) {

				sphericalDelta.theta *= ( 1 - scope.dampingFactor );
				sphericalDelta.phi *= ( 1 - scope.dampingFactor );

			} else {

				sphericalDelta.set( 0, 0, 0 );

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

	this.dispose = function () {

		scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
		scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		scope.domElement.removeEventListener( 'wheel', onMouseWheel, false );

		scope.domElement.removeEventListener( 'touchstart', onTouchStart, false );
		scope.domElement.removeEventListener( 'touchend', onTouchEnd, false );
		scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

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

	var STATE = { NONE: - 1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY: 4, TOUCH_PAN: 5 };

	var state = STATE.NONE;

	var EPS = 0.000001;

	// current position in spherical coordinates
	var spherical = new THREE.Spherical();
	var sphericalDelta = new THREE.Spherical();

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

		sphericalDelta.theta -= angle;

	}

	function rotateUp( angle ) {

		sphericalDelta.phi -= angle;

	}

	var panLeft = function () {

		var v = new THREE.Vector3();

		return function panLeft( distance, objectMatrix ) {

			v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
			v.multiplyScalar( - distance );

			panOffset.add( v );

		};

	}();

	var panUp = function () {

		var v = new THREE.Vector3();

		return function panUp( distance, objectMatrix ) {

			v.setFromMatrixColumn( objectMatrix, 1 ); // get Y column of objectMatrix
			v.multiplyScalar( distance );

			panOffset.add( v );

		};

	}();

	// deltaX and deltaY are in pixels; right and down are positive
	var pan = function () {

		var offset = new THREE.Vector3();

		return function pan( deltaX, deltaY ) {

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
				panLeft( deltaX * ( scope.object.right - scope.object.left ) / scope.object.zoom / element.clientWidth, scope.object.matrix );
				panUp( deltaY * ( scope.object.top - scope.object.bottom ) / scope.object.zoom / element.clientHeight, scope.object.matrix );

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

		// console.log( 'handleMouseUp' );

	}

	function handleMouseWheel( event ) {

		// console.log( 'handleMouseWheel' );

		if ( event.deltaY < 0 ) {

			dollyOut( getZoomScale() );

		} else if ( event.deltaY > 0 ) {

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

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false || scope.enableZoom === false || ( state !== STATE.NONE && state !== STATE.ROTATE ) ) return;

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
	scope.domElement.addEventListener( 'wheel', onMouseWheel, false );

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

	staticMoving: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
			return ! this.enableDamping;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
			this.enableDamping = ! value;

		}

	},

	dynamicDampingFactor: {

		get: function () {

			console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
			return this.dampingFactor;

		},

		set: function ( value ) {

			console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
			this.dampingFactor = value;

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
    if(SRadius===6) mtx0.makeRotationY(30*0.0174532925199432957);
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


/**
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Creates a tube which extrudes along a 3d spline.
 *
 */

THREE.Tubex = function ( pp, tubularSegments, radius, radialSegments, closed, CurveType ) {

    THREE.BufferGeometry.call( this );

    this.type = 'Tubex';

    this.tubularSegments = tubularSegments || 64;
    this.radius = radius || 1;
    this.radialSegments = radialSegments || 8;
    this.closed = closed || false;

    if( pp instanceof Array ) this.positions = pp;
    else {

        this.positions = [];

        var start = new THREE.Vector3().fromArray(pp.start);
        var end = new THREE.Vector3().fromArray(pp.end);
        var mid = end.clone().sub(start);
        var lng = pp.numSegment-1;

        this.positions.push( start );

        for( var i = 1; i < lng; i++ ){

            this.positions.push( new THREE.Vector3( (mid.x/lng)*i, (mid.y/lng)*i, (mid.z/lng)*i).add(start) );

        }

        this.positions.push( end );

    }

    this.path = new THREE.CatmullRomCurve3( this.positions );
    // 'catmullrom', 'centripetal', 'chordal'
    var curveType = CurveType || 'catmullrom'; 
    this.path.type = curveType;
    this.path.closed = this.closed;

    this.frames = this.path.computeFrenetFrames( this.tubularSegments, this.closed );

    // helper variables

    this.vertex = new THREE.Vector3();
    this.normal = new THREE.Vector3();
    this.uv = new THREE.Vector2();

    // buffer

    this.vertices = [];
    this.colors = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];

    // create buffer data

    this.generateBufferData();

    // build geometry

    this.setIndex( new ( this.indices.length > 65535 ? THREE.Uint32BufferAttribute : THREE.Uint16BufferAttribute )( this.indices, 1 ) );
    this.addAttribute( 'position', new THREE.Float32BufferAttribute( this.vertices, 3 ) );
    this.addAttribute( 'color', new THREE.Float32BufferAttribute( this.colors, 3 ) );
    this.addAttribute( 'normal', new THREE.Float32BufferAttribute( this.normals, 3 ) );
    this.addAttribute( 'uv', new THREE.Float32BufferAttribute( this.uvs, 2 ) );

}

THREE.Tubex.prototype = Object.create( THREE.BufferGeometry.prototype );
THREE.Tubex.prototype.constructor = THREE.Tubex;

THREE.Tubex.prototype.generateBufferData = function () {

    for ( var i = 0; i < this.tubularSegments; i ++ ) {

        this.generateSegment( i );

    }

    // if the geometry is not closed, generate the last row of vertices and normals
    // at the regular position on the given path
    //
    // if the geometry is closed, duplicate the first row of vertices and normals (uvs will differ)

    this.generateSegment( ( this.closed === false ) ? this.tubularSegments : 0 );

    // uvs are generated in a separate function.
    // this makes it easy compute correct values for closed geometries

    this.generateIndicesAndUv();

    // finally create faces

    //this.generateIndices();

};

THREE.Tubex.prototype.generateSegment = function ( i ) {

    // we use getPointAt to sample evenly distributed points from the given path

    var P = this.path.getPointAt( i / this.tubularSegments );

    // retrieve corresponding normal and binormal

    var N = this.frames.normals[ i ];
    var B = this.frames.binormals[ i ];

    // generate normals and vertices for the current segment

    for ( var j = 0; j <= this.radialSegments; j ++ ) {

        var v = j / this.radialSegments * Math.PI * 2;

        var sin =   Math.sin( v );
        var cos = - Math.cos( v );

        // normal

        this.normal.x = ( cos * N.x + sin * B.x );
        this.normal.y = ( cos * N.y + sin * B.y );
        this.normal.z = ( cos * N.z + sin * B.z );
        this.normal.normalize();

        this.normals.push( this.normal.x, this.normal.y, this.normal.z );

        // vertex

        this.vertex.x = P.x + this.radius * this.normal.x;
        this.vertex.y = P.y + this.radius * this.normal.y;
        this.vertex.z = P.z + this.radius * this.normal.z;

        this.vertices.push( this.vertex.x, this.vertex.y, this.vertex.z );

        // colors

        this.colors.push( 1, 1, 1 );

    }

}

THREE.Tubex.prototype.generateIndicesAndUv = function (  ) {

    for ( var i = 0; i <= this.tubularSegments; i ++ ) {

        for ( var j = 0; j <= this.radialSegments; j ++ ) {

            if( j > 0 && i > 0 ) {

                var a = ( this.radialSegments + 1 ) * ( i - 1 ) + ( j - 1 );
                var b = ( this.radialSegments + 1 ) * i + ( j - 1 );
                var c = ( this.radialSegments + 1 ) * i + j;
                var d = ( this.radialSegments + 1 ) * ( i - 1 ) + j;

                // faces

                this.indices.push( a, b, d );
                this.indices.push( b, c, d );
            }

            // uv

            this.uv.x = i / this.tubularSegments;
            this.uv.y = j / this.radialSegments;

            this.uvs.push( this.uv.x, this.uv.y );

        }

    }

}

THREE.Tubex.prototype.updatePath = function ( path ) {

    //this.path = path;

    this.frames = this.path.computeFrenetFrames( this.tubularSegments, this.closed );

    this.normals = this.attributes.normal.array;
    this.vertices = this.attributes.position.array;
    this.colors = this.attributes.color.array;
    

    for ( var i = 0; i < this.tubularSegments; i ++ ) {

        this.updateSegment( i );

    }

    // if the geometry is not closed, generate the last row of vertices and normals
    // at the regular position on the given path
    //
    // if the geometry is closed, duplicate the first row of vertices and normals (uvs will differ)

    this.updateSegment( ( this.closed === false ) ? this.tubularSegments : 0 );

    


    this.attributes.color.needsUpdate = true;
    this.attributes.position.needsUpdate = true;
    this.attributes.normal.needsUpdate = true;
   

}

THREE.Tubex.prototype.updateUV = function () {

    this.uvs = this.attributes.uv.array;

    var n, n2;

    for ( var i = 0; i <= this.tubularSegments; i ++ ) {

        n = (i*2) * (this.radialSegments+1);

        for ( var j = 0; j <= this.radialSegments; j ++ ) {

            n2 = j * 2;

            this.uv.x = i / this.tubularSegments;
            this.uv.y = j / this.radialSegments;

            this.uvs[n + n2] = this.uv.x
            this.uvs[n + n2 + 1] = this.uv.y;

        }

    }

     this.attributes.uv.needsUpdate = true;

}

THREE.Tubex.prototype.updateSegment = function ( i ) {

    // we use getPointAt to sample evenly distributed points from the given path

    var n = (i*3) * (this.radialSegments+1), n2;

    var P = this.path.getPointAt( i / this.tubularSegments );

    // retrieve corresponding normal and binormal

    var N = this.frames.normals[ i ];
    var B = this.frames.binormals[ i ];

    // generate normals and vertices for the current segment

    for ( var j = 0; j <= this.radialSegments; j ++ ) {

        var v = j / this.radialSegments * Math.PI * 2;

        n2 = j * 3;

        var sin =   Math.sin( v );
        var cos = - Math.cos( v );

        // normal

        this.normal.x = ( cos * N.x + sin * B.x );
        this.normal.y = ( cos * N.y + sin * B.y );
        this.normal.z = ( cos * N.z + sin * B.z );
        this.normal.normalize();

        this.normals[n + n2] =  this.normal.x;
        this.normals[n + n2 +1] =  this.normal.y;
        this.normals[n + n2 +2] =  this.normal.z;

        // vertex

        this.vertices[n + n2] =  P.x + this.radius * this.normal.x;
        this.vertices[n + n2 +1] =  P.y + this.radius * this.normal.y;
        this.vertices[n + n2 +2] =  P.z + this.radius * this.normal.z;

        // color

        this.colors[n + n2] = Math.abs(this.normal.x);
        this.colors[n + n2 +1] = Math.abs(this.normal.y);
        this.colors[n + n2 +2] = Math.abs(this.normal.z);

    }

    

}

THREE.ShaderShadow = {

    uniforms: Object.assign( {}, //[

        //THREE.UniformsLib[ "lights" ],
        THREE.UniformsLib.lights,

        {

            "diffuse": { value: new THREE.Color( 0xeeeeee ) },
            "specular": { value: new THREE.Color( 0x111111 ) },
            "emissive": { value: new THREE.Color( 0x000000 ) },
            "opacity": { value: 0.4 },

        }

    //] 
    ),

    fragmentShader: [

        "uniform float opacity;",
        "varying vec2 vUv;",

        THREE.ShaderChunk[ "common" ],
        THREE.ShaderChunk[ "packing" ],
        THREE.ShaderChunk[ "bsdfs" ],
        
        THREE.ShaderChunk[ "lights_pars" ],
        THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
        THREE.ShaderChunk[ "shadowmask_pars_fragment" ],

        "void main() {",

            "   float mask = getShadowMask();",
            "   vec4 pp = vec4(1.0);",
            "   vec4 mapping = vec4( pp.rgb, pp.a * opacity );",
            //"   mapping.a *= mapAlpha;",
            "   vec4 shadowing = vec4( vec3(0.0), opacity * (1.0 - mask) );",
            "   gl_FragColor = mix( mapping, shadowing, 1.0 - mask );",
            "   gl_FragColor = shadowing;",
            //"   gl_FragColor += mapping;",

        "}"

    ].join( "\n" ),

    vertexShader: [

        "varying vec2 vUv;",

        THREE.ShaderChunk[ "common" ],
        THREE.ShaderChunk[ "bsdfs" ],
        THREE.ShaderChunk[ "lights_pars" ],
        THREE.ShaderChunk[ "shadowmap_pars_vertex" ],
        

        "void main() {",

            "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
            "vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",

            "vUv = uv;",

            "gl_Position = projectionMatrix * mvPosition;",

            //THREE.ShaderChunk[ "lights_lambert_vertex" ],
            THREE.ShaderChunk[ "shadowmap_vertex" ],

        "}"

    ].join( "\n" ),

    lights: true,
    transparent:true,
    //depthTest:false,
    depthWrite:false,

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
/**
 * @author lth / https://github.com/lo-th/
 */

THREE.ViewUtils = {

    mergeGeometryArray : function( geos ){

        var tmp = [];
        var i = geos.length;
        while(i--){
            tmp[i] = new THREE.Geometry().fromBufferGeometry( geos[i] );
            //tmp[i].mergeVertices();
        }

        var g = new THREE.Geometry();

        while( tmp.length > 0 ){
            i = tmp.pop();
            g.merge(i);
            i.dispose();
        }

        g.mergeVertices();

        var geometry = new THREE.BufferGeometry().fromGeometry( g );
        g.dispose();

        return geometry;

    },



    prepaGeometry : function ( g, type ) {

        var verticesOnly = false;
        var facesOnly = false;

        if(type == 'mesh') facesOnly = true;
        if(type == 'convex') verticesOnly = true;

        var i, j, n, p, n2;

        var tmpGeo = new THREE.Geometry().fromBufferGeometry( g );
        tmpGeo.mergeVertices();

        var totalVertices = g.attributes.position.array.length/3;
        var numVertices = tmpGeo.vertices.length;
        var numFaces = tmpGeo.faces.length;

        g.realVertices = new Float32Array( numVertices * 3 );
        g.realIndices = new ( numFaces * 3 > 65535 ? Uint32Array : Uint16Array )( numFaces * 3 );

        i = numVertices;
        while(i--){
            p = tmpGeo.vertices[ i ];
            n = i * 3;
            g.realVertices[ n ] = p.x;
            g.realVertices[ n + 1 ] = p.y;
            g.realVertices[ n + 2 ] = p.z;
        }

        if(verticesOnly){ 
            tmpGeo.dispose();
            return g.realVertices;
        }

        i = numFaces;
        while(i--){
            p = tmpGeo.faces[ i ];
            n = i * 3;
            g.realIndices[ n ] = p.a;
            g.realIndices[ n + 1 ] = p.b;
            g.realIndices[ n + 2 ] = p.c;
        }

        tmpGeo.dispose();

        //g.realIndices = g.getIndex();
        //g.setIndex(g.realIndices);

        if(facesOnly){ 
            var faces = [];
            i = g.realIndices.length;
            while(i--){
                n = i * 3;
                p = g.realIndices[i]*3;
                faces[n] = g.realVertices[ p ];
                faces[n+1] = g.realVertices[ p+1 ];
                faces[n+2] = g.realVertices[ p+2 ];
            }
            return faces;
        }

        // find same point
        var ar = [];
        var pos = g.attributes.position.array;
        i = numVertices;
        while(i--){
            n = i*3;
            ar[i] = [];
            j = totalVertices;
            while(j--){
                n2 = j*3;
                if( pos[n2] == g.realVertices[n] && pos[n2+1] == g.realVertices[n+1] && pos[n2+2] == g.realVertices[n+2] ) ar[i].push(j);
            }
        }

        // generate same point index
        var pPoint = new ( numVertices > 65535 ? Uint32Array : Uint16Array )( numVertices );
        var lPoint = new ( totalVertices > 65535 ? Uint32Array : Uint16Array )( totalVertices );

        p = 0;
        for(i=0; i<numVertices; i++){
            n = ar[i].length;
            pPoint[i] = p;
            j = n;
            while(j--){ lPoint[p+j] = ar[i][j]; }
            p += n;
        }

        g.numFaces = numFaces;
        g.numVertices = numVertices;
        g.maxi = totalVertices;
        g.pPoint = pPoint;
        g.lPoint = lPoint;

    },





}
var user = ( function () {

    "use strict";

    // key map
    // 0 : axe L | left:right  -1>1
    // 1 : axe L | top:down    -1>1
    // 2 : axe R | left:right  -1>1
    // 3 : axe R | top:down    -1>1
    // 4 : bouton A             0-1  jump / space
    // 5 : bouton B             0-1
    // 6 : bouton X             0-1
    // 7 : bouton Y             0-1
    // 8 : gachette L up        0-1
    // 9 : gachette R up        0-1
    // 10 : gachette L down     0>1
    // 11 : gachette R down     0>1
    // 12 : bouton setup        0-1
    // 13 : bouton menu         0-1
    // 14 : axe button left     0-1
    // 15 : axe button right    0-1
    // 16 : Xcross axe top      0-1
    // 17 : Xcross axe down     0-1
    // 18 : Xcross axe left     0-1
    // 19 : Xcross axe right    0-1

    // 20 : Keyboard or Gamepad    0-1

    var key = new Float32Array( 20 );
    var gamepad;
    var useGamepad = false;

    user = {

        init: function ( callback ) {

            gamepad = new user.Gamepad( key ); 

            document.addEventListener( 'keydown', user.keyDown, false );
            document.addEventListener( 'keyup', user.keyUp, false );


        },

        update: function ( full ) {

            gamepad.update();

            if( gamepad.ready ) gamepad.getValue(0);
            // else { if() useGamepad = true; }

            //if( full ) ammo.send( 'key', { key:key } );

        },


        keyDown: function ( e ) {

            if( editor.getFocus() ) return;
            e = e || window.event;
            switch ( e.which ) {
                // axe L
                case 65: case 81: key[0] = -1;break;//key[0]<=-1 ? -1:key[0]-= 0.1; break; // left, A, Q
                case 68:          key[0] = 1;  break; // right, D
                case 87: case 90: key[1] = -1; break; // up, W, Z
                case 83:          key[1] = 1;  break; // down, S
                // axe R
                case 37:          key[2] = -1; break; // left
                case 39:          key[2] = 1;  break; // right
                case 38:          key[3] = -1; break; // up
                case 40:          key[3] = 1;  break; // down
                

                case 17: case 67: key[5] = 1; break; // ctrl, C
                case 69:          key[5] = 1; break; // E
                case 32:          key[4] = 1; break; // space
                case 16:          key[7] = 1; break; // shift

                case 71:          view.hideGrid(); break; // G
            }

            gamepad.reset();

            //if(useGamepad){ useGamepad = false;  }

            // send to worker
            //ammo.send( 'key', key );

            //console.log( e.which, String.fromCharCode(e.which) );

        },

        keyUp: function ( e ) {

            if( editor.getFocus() ) return;
            e = e || window.event;
            switch( e.which ) {
                // axe L
                case 65: case 81: key[0] = key[0]<0 ? 0:key[0]; break; // left, A, Q
                case 68:          key[0] = key[0]>0 ? 0:key[0]; break; // right, D
                case 87: case 90: key[1] = key[1]<0 ? 0:key[1]; break; // up, W, Z
                case 83:          key[1] = key[1]>0 ? 0:key[1]; break; // down, S
                // axe R
                case 37:          key[2] = key[2]<0 ? 0:key[2]; break; // left
                case 39:          key[2] = key[2]>0 ? 0:key[2]; break; // right
                case 38:          key[3] = key[3]<0 ? 0:key[3]; break; // up
                case 40:          key[3] = key[3]>0 ? 0:key[3]; break; // down
                




                case 17: case 67: key[5] = 0; break; // ctrl, C
                case 69:          key[5] = 0; break; // E
                case 32:          key[4] = 0; break; // space
                case 16:          key[7] = 0; break; // shift
            }

            //if(!useGamepad)useGamepad = true;

            // send to worker
            //ammo.send( 'key', key );

        },

        getKey: function () {

            return key;

        },
    }


    //--------------------------------------
    //
    //   GAMEPAD
    //
    //--------------------------------------

    user.Gamepad = function( key ){

        this.values = []; 
        this.key = key;
        this.ready = 0;

    };

    user.Gamepad.prototype = {

        update:function(){

            var i,j,k,l, v, pad;
            //var info = '';
            var fix = this.fix;
            var gamepads = navigator.getGamepads();

            for (i = 0; i < gamepads.length; i++) {
                pad = gamepads[i];
                if(pad){
                    k = pad.axes.length;
                    l = pad.buttons.length;
                    if(l){
                        if(!this.values[i]) this.values[i] = [];
                        // axe
                        for (j = 0; j < k; j++) {
                            v = fix(pad.axes[j], 0.08 );
                            if(this.ready == 0 && v !== 0 ) this.ready = 1;
                            this.values[i][j] = v;
                            //if(i==0) this.key[j] = fix( pad.axes[j], 0.08 );
                        }
                        // button
                        for (j = 0; j < l; j++) {
                            v = fix(pad.buttons[j].value); 
                            if(this.ready == 0 && v !== 0 ) this.ready = 1;
                            this.values[i][k+j] = v;
                            //if(i==0) this.key[k+j] = fix( pad.buttons[j].value );
                        }
                        //info += 'gamepad '+i+'| ' + this.values[i]+ '<br>';
                    } else {
                        if(this.values[i]) this.values[i] = null;
                    }
                }
            }

            //document.getElementById("info").innerHTML = info
        },

        getValue:function(n){

            var i = 19, v;
            while(i--){
                v = this.values[n][i];
                if(this.ready == 0 && v !== 0 ) this.ready = 1;
                this.key[i] = v;
            }

        },

        reset:function(){
            //this.values = [];
            this.ready = 0;
        },

        fix:function(v, dead){
            var n = Number((v.toString()).substring(0, 5));
            if(dead && n<dead && n>-dead) n = 0;
            return n;
        }

    };




    return user;

})();



var gui = ( function () {
    
    'use strict';

    var content;

    var g;
    var settings = {

        flat_shading: false,
        trader_map: true,

        debug: false,
        
    }

    gui = {

        init: function () {

            content = document.createElement('div');
            document.body.appendChild( content );



            /*g = new UIL.Gui( { width:150, bg:'rgba(30,30,30,0.1)' } );
            var f = g.add( 'fps', { res:70 } );

            g.add(settings, 'flat_shading', { type:'Bool', p:60, inh:16 } ).onChange( view.setShading );
            g.add(settings, 'trader_map', { type:'Bool', p:60, inh:16 } ).onChange( view.setTraderMap );

            g.add(settings, 'DEBUG', { type:'Bool', p:60, inh:16 } ).onChange( view.setDebug );

            g.add('button', { name:'PEOPLES', p:0 }).onChange( function(){ view.initCrowd() } );
            g.add('button', { name:'PHYSICS', p:0 }).onChange( function(){ view.initAmmo() } );

            f.show();*/

        },
        initJoysticks: function() {

            var j = UIL.add('joystick', {  target:content, pos:{ left:'auto', right:'100px', top:'auto', bottom:'10px' }, name:'JOY', width:100, multiplicator:1, precision:2, fontColor:'#D4B87B' });



        }

    }

    return gui;

})();
'use strict';


// performance.now

var now;

(function(w){
    var perfNow;
    var perfNowNames = ['now', 'webkitNow', 'msNow', 'mozNow'];
    if(!!w['performance']) for(var i = 0; i < perfNowNames.length; ++i){
        var n = perfNowNames[i];
        if(!!w['performance'][n]){
            perfNow = function(){return w['performance'][n]()};
            break;
        }
    }
    if(!perfNow) perfNow = Date.now;
    now = perfNow;
})(window);


/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    CODEMIRROR ultimate editor
*/

'use strict';

var editor = ( function () {

var content, codeContent, code, separator, menuCode, debug, title; 
var callback = function(){};
var isSelfDrag = false;
var isFocus = false;
var errorLines = [];
var widgets = [];
var interval = null;
var left = 0;
var oldleft = 0;
var fileName = '';
var nextDemo = null;
var selectColor = '#3998d6';
var scrollOn = false;
//var menuPins;
var bigmenu;
var bigButton = [];
var bigContent;
var isMenu = false;
var isWithCode = true;
var isMidDown = false;

var octo, octoArm;

var icon_Github = [
    "<svg width='80' height='80' viewBox='0 0 250 250' style='fill:rgba(255,255,255,0.2); color:#2B2A2D; position: absolute; top: 0; border: 0; right: 0;'>",
    "<path d='M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z' id='octo' onmouseover='editor.Gover();' onmouseout='editor.Gout();' onmousedown='editor.Gdown();'></path>",
    "<path d='M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2' fill='currentColor' style='transform-origin: 130px 106px;' id='octo-arm'></path>",
    "<path d='M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z' fill='currentColor' id='octo-body'></path></svg>",
].join("\n");


editor = {

    init: function ( Callback, withCode ) {

        if(Callback) callback = Callback;

        isWithCode = withCode || false;

        // big menu

        bigmenu = document.createElement( 'div' );
        bigmenu.className = 'bigmenu';
        document.body.appendChild( bigmenu );


        this.makeBigMenu();

        // github logo

        var github = document.createElement( 'div' );
        github.style.cssText = "position:absolute; right:0; top:0; width:1px; height:1px; pointer-events:none;";
        github.innerHTML = icon_Github; 
        document.body.appendChild( github );

        octo = document.getElementById('octo');
        octoArm = document.getElementById('octo-arm');

        // debug

        debug = document.createElement( 'div' );
        debug.className = 'debug';
        document.body.appendChild( debug );

        // title

        title = document.createElement( 'div' );
        title.className = 'title';
        document.body.appendChild( title );

        // editor

        content = document.createElement('div');
        content.className = 'editor';
        document.body.appendChild( content );

        codeContent = document.createElement('div');
        codeContent.className = 'codeContent';
        //document.body.appendChild( codeContent );
        content.appendChild( codeContent );

        code = CodeMirror( codeContent, {
            lineNumbers: true, matchBrackets: true, indentWithTabs: false, styleActiveLine: true,
            theme:'monokai', mode:'text/javascript',
            tabSize: 4, indentUnit: 4, highlightSelectionMatches: {showToken: /\w/}
        });

        separator = document.createElement('div');
        separator.className = 'separator';
        document.body.appendChild( separator );

        menuCode = document.createElement('div');
        menuCode.className = 'menuCode';
        content.appendChild( menuCode );

        content.style.display = 'none';
        separator.style.display = 'none';

        code.on('change', function () { editor.onChange() } );
        code.on('focus', function () { isFocus = true; view.needFocus(); } );
        code.on('blur', function () { isFocus = false; } );
        code.on('drop', function () { if ( !isSelfDrag ) code.setValue(''); else isSelfDrag = false; } );
        code.on('dragstart', function () { isSelfDrag = true; } );

        if(isWithCode){
            left = ~~ (window.innerWidth*0.4);
            content.style.display = 'block';
            separator.style.display = 'block';
            this.addSeparatorEvent();
            this.resize();
        }

        bigmenu.style.width =  window.innerWidth - left +'px';

    },

    addSeparatorEvent: function(){

        separator.addEventListener('mouseover', editor.mid_over, false );
        separator.addEventListener('mouseout', editor.mid_out, false );
        separator.addEventListener('mousedown', editor.mid_down, false );
        
    },

    removeSeparatorEvent: function(){

        separator.removeEventListener('mouseover', editor.mid_over, false );
        separator.removeEventListener('mouseout', editor.mid_out, false );
        separator.removeEventListener('mousedown', editor.mid_down, false );
        
    },

    selectCode: function (){

        if(isWithCode) editor.hide();
        else editor.show();

    },

    hide: function (){

        isWithCode = false;
        content.style.display = 'none';
        separator.style.display = 'none';
        oldleft = left;
        left = 0;

        this.removeSeparatorEvent();

        editor.Bdefault(bigButton[1]);
        editor.resize();

    },

    show: function (){

        isWithCode = true;
        content.style.display = 'block';
        separator.style.display = 'block';
        if( oldleft ) left = oldleft;
        else left = ~~ (window.innerWidth*0.4);

        this.addSeparatorEvent();

        editor.resize();

    },

    resizeMenu: function ( w ) {

        if( bigmenu ) bigmenu.style.width = w +'px';

    },

    resize: function ( e ) {

        if( e ) left = e.clientX + 10;

        if(view){
            view.setLeft( left );
            view.resize();
        }
        bigmenu.style.left = left +'px';
        title.style.left = left +'px';
        debug.style.left = left +'px';
        separator.style.left = (left-10) + 'px';
        content.style.width = (left-10) + 'px';
        code.refresh();

    },

    tell: function ( str ) { 

        debug.innerHTML = str; 

    },

    // bigmenu

    makeBigMenu: function(){

        bigmenu.style.width = window.innerWidth - left +'px';

        bigButton[0] = document.createElement( 'div' );
        bigButton[0].className = 'bigButton';
        bigmenu.appendChild( bigButton[0] );
        bigButton[0].innerHTML = "DEMO";
        bigButton[0].addEventListener('mousedown', editor.selectBigMenu, false );
        bigButton[0].name = 'demo';

        bigButton[1] = document.createElement( 'div' );
        bigButton[1].className = 'bigButton';
        bigmenu.appendChild( bigButton[1] );
        bigButton[1].innerHTML = "CODE";
        bigButton[1].addEventListener('mousedown', editor.selectCode, false );
        bigButton[1].name = 'code';


        bigContent = document.createElement( 'div' );
        bigContent.className = 'bigContent';
        bigmenu.appendChild( bigContent );
        //bigContent.style.display = "none";




        var i = bigButton.length;
        while(i--){
            bigButton[i].addEventListener('mouseover', editor.Bover, false );
            bigButton[i].addEventListener('mouseout', editor.Bout, false );
        }

    },

    selectBigMenu: function( e ){

        if(isMenu) editor.hideBigMenu();
        else editor.showBigMenu();

    },

    showBigMenu: function( e ){

        //bigContent.style.display = "block";
        bigmenu.style.background = "#252525";
        bigmenu.style.borderBottom = "1px solid #3f3f3f";
        isMenu = true;



        var lng = demos.length, name, n=1;
        for( var i = 0; i < lng ; i++ ) {
            name = demos[i];
            if( name !== fileName ) editor.addButtonBig( demos[i] );
        }
    },

    hideBigMenu: function( e ){

        bigmenu.style.background = "rgba(0,0,0,0)";
        bigmenu.style.borderBottom = "1px solid rgba(255, 255, 255, 0)";
        isMenu = false;

        var i = bigContent.childNodes.length, b;
        while(i--){
            b = bigContent.childNodes[i];
            b.removeEventListener('mousedown', editor.bigDown );
            bigContent.removeChild( b );
        }

        editor.Bdefault(bigButton[0]);

    },

    addButtonBig: function ( name ) {

        var b = document.createElement('div');
        b.className = 'menuButtonBig';
        bigContent.appendChild( b );
        b.innerHTML = '&bull; ' + name.charAt(0).toUpperCase() + name.substring(1).toLowerCase();
        b.name = name;
        b.addEventListener('mousedown', editor.bigDown, false );

    },

    bigDown: function( e ){

        editor.hideBigMenu();
        editor.load('demos/' + e.target.name + '.js');

    },

    Bover: function( e ){

        e.target.style.border = "1px solid "+selectColor;
        e.target.style.background = selectColor;;
        e.target.style.color = "#FFFFFF";

    },

    Bout: function( e ){

        var style = 0;
        if(e.target.name == 'code' && isWithCode) style = 1;
        if(e.target.name == 'demo' && isMenu) style = 1;

        if(!style){
            editor.Bdefault(e.target);
        } else {
            e.target.style.border = "1px solid #3f3f3f";
            e.target.style.background = "#3f3f3f";
            e.target.style.color = "#999999";
        }
        
    },

    Bdefault: function( b ){

        b.style.border = "1px solid #3f3f3f";
        b.style.background = "#252525";
        b.style.color = selectColor;

    },

    // github logo

    Gover: function(){

        octo.setAttribute('fill', '#105AE2'); 
        octoArm.style.webkitAnimationName = 'octocat-wave'; 
        octoArm.style.webkitAnimationDuration = '560ms';

    },

    Gout: function(){

        octo.setAttribute('fill','rgba(255,255,255,0.2)');  
        octoArm.style.webkitAnimationName = 'none';

    },

    Gdown: function(){

        window.location.assign('https://github.com/lo-th/Ammo.lab');

    },

    // separator

    mid_over: function () { 

        separator.style.background = '#3f3f3f';

    },

    mid_out: function () { 

        if( !isMidDown ) separator.style.background = 'none';

    },

    mid_down: function () {

        isMidDown = true;
        document.addEventListener('mouseup', editor.mid_up, false );
        document.addEventListener('mousemove', editor.resize, false );

    },

    mid_up: function () {

        isMidDown = false;
        document.removeEventListener('mouseup', editor.mid_up, false );
        document.removeEventListener('mousemove', editor.resize, false );

    },

    // code

    load: function ( url ) {

        fileName = url.substring(url.indexOf("/")+1, url.indexOf("."));

        var xhr = new XMLHttpRequest();
        xhr.overrideMimeType('text/plain; charset=x-user-defined'); 
        xhr.open('GET', url, true);
        xhr.onload = function(){ 

            code.setValue( xhr.responseText ); 

        }
        
        xhr.send();

    },

    unFocus: function () {

        code.getInputField().blur();
        view.haveFocus();

    },

    refresh: function () {

        code.refresh();

    },

    getFocus: function () {

        return isFocus;

    },

    validate: function ( value ) {

        return code.operation( function () {
            while ( errorLines.length > 0 ) code.removeLineClass( errorLines.shift(), 'background', 'errorLine' );
            var i = widgets.length;
            while(i--) code.removeLineWidget( widgets[ i ] );
            widgets.length = 0;
            var string = value;
            try {
                var result = esprima.parse( string, { tolerant: true } ).errors;
                i = result.length;
                while(i--){
                    var error = result[ i ];
                    var m = document.createElement( 'div' );
                    m.className = 'esprima-error';
                    m.textContent = error.message.replace(/Line [0-9]+: /, '');
                    var l = error.lineNumber - 1;
                    errorLines.push( l );
                    code.addLineClass( l, 'background', 'errorLine' );
                    var widget = code.addLineWidget( l, m );
                    widgets.push( widget );
                }
            } catch ( error ) {
                var m = document.createElement( 'div' );
                m.className = 'esprima-error';
                m.textContent = error.message.replace(/Line [0-9]+: /, '');
                var l = error.lineNumber - 1;
                errorLines.push( l );
                code.addLineClass( l, 'background', 'errorLine' );
                var widget = code.addLineWidget( l, m );
                widgets.push( widget );
            }
            return errorLines.length === 0;
        });

    },

    onChange: function () {

        clearTimeout( interval );
        var value = code.getValue();
        if( this.validate( value ) ) interval = setTimeout( function() { editor.inject( value ); }, 500);

    },

    inject: function ( value ) {

        var oScript = document.createElement("script");
        oScript.language = "javascript";
        oScript.type = "text/javascript";
        oScript.text = value;
        document.getElementsByTagName('BODY').item(0).appendChild(oScript);

        menuCode.innerHTML = '&bull; ' + fileName;
        title.innerHTML = fileName.charAt(0).toUpperCase() + fileName.substring(1).toLowerCase();

        callback( fileName );

    },

}


return editor;

})();
/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    THREE ultimate manager
*/

'use strict';
// MATH ADD
Math.torad = 0.0174532925199432957;
Math.todeg = 57.295779513082320876;
Math.degtorad = 0.0174532925199432957;
Math.radtodeg = 57.295779513082320876;
Math.Pi = 3.141592653589793;
Math.TwoPI = 6.283185307179586;
Math.PI90 = 1.570796326794896;
Math.PI270 = 4.712388980384689;
Math.lerp = function (a, b, percent) { return a + (b - a) * percent; };
Math.rand = function (a, b) { return Math.lerp(a, b, Math.random()); };
Math.randInt = function (a, b, n) { return Math.lerp(a, b, Math.random()).toFixed(n || 0)*1; };
Math.int = function(x) { return ~~x; };

var view = ( function () {

'use strict';

var _V;

var time = 0;
var temp = 0;
var count = 0;
var fps = 0;

var canvas, renderer, scene, camera, controls, debug;
var ray, mouse, content, targetMouse, rayCallBack, moveplane, isWithRay = false;;
var vs = { w:1, h:1, l:0, x:0 };

var helper;

var meshs = [];
var statics = [];
var terrains = [];
var softs = [];
var cars = [];
var heros = [];
var extraGeo = [];

var byName = {};

var isNeedUpdate = false;
var isNeedCrowdUpdate = false;

// camera
var isCamFollow = false;
var currentFollow = null;
var cameraGroup;

//var azimut = 0, oldAzimut = 0;
//var polar = 0, oldPolar = 0;

var cam = { theta:0, phi:0, oTheta:0, oPhi:0 };

var geo, mat;

var urls = [];
var callback_load = null;
//var seaLoader = null;
var results = {};



var imagesLoader;
//var currentCar = -1;

var isWithShadow = false;
var shadowGround, light, ambient;
var spy = -0.01;

var perlin = null;

var environment, envcontext, nEnv = 1, isWirframe = true;
var envLists = [ 'wireframe','ceramic','plastic','smooth','metal','chrome','brush','black','glow','red','sky' ];
var envMap;


view = {

    //--------------------------------------
    //
    //   LOOP
    //
    //--------------------------------------

    render: function () {

        requestAnimationFrame( _V.render );

        TWEEN.update();
        THREE.SEA3D.AnimationHandler.update( 0.017 );

        update();

        if( isNeedUpdate ){

            _V.bodyStep();
            _V.heroStep();
            _V.carsStep();
            _V.softStep();

            _V.controlUpdate();

            isNeedUpdate = false;

        }

        postUpdate();

        renderer.render( scene, camera );

        time = now();
        if ( (time - 1000) > temp ){ temp = time; fps = count; count = 0; }; count++;

    },

    needUpdate: function (){ isNeedUpdate = true; },
    needCrowdUpdate: function (){ isNeedCrowdUpdate = true; },


    //--------------------------------------
    //
    //   RESET
    //
    //--------------------------------------

    reset: function () {

        this.removeRay();
        this.resetCamera();
        this.setShadowPosY(-0.01);
        helper.visible = true;

        var c, i;

        while( meshs.length > 0 ) scene.remove( meshs.pop() );
        while( statics.length > 0 ) scene.remove( statics.pop() );
        while( terrains.length > 0 ) scene.remove( terrains.pop() );
        while( softs.length > 0 ) scene.remove( softs.pop() );
        while( heros.length > 0 ) scene.remove( heros.pop() );
        while( extraGeo.length > 0 ) extraGeo.pop().dispose();
        
        while( cars.length > 0 ){
            c = cars.pop();
            if( c.userData.helper ){
                c.remove( c.userData.helper );
                c.userData.helper.dispose();
            }
            i = c.userData.w.length;
            while( i-- ){
                scene.remove( c.userData.w[i] );
            }
            scene.remove( c );
        }

        //meshs.length = 0;
        perlin = null;
        byName = {};

        postUpdate = function () {};
        update = function () {};

    },

    init: function ( callback ) {

        canvas = document.createElement("canvas");
        canvas.className = 'canvas3d';
        canvas.oncontextmenu = function(e){ e.preventDefault(); };
        canvas.ondrop = function(e) { e.preventDefault(); };
        document.body.appendChild( canvas );


        _V = this;



        // RENDERER

        try {
            renderer = new THREE.WebGLRenderer({ canvas:canvas, antialias:true, alpha:false });
            //renderer = new THREE.WebGLRenderer({ canvas:canvas, precision:"mediump", antialias:true, alpha:false });
        } catch( error ) {
            if(intro !== null ) intro.message('<p>Sorry, your browser does not support WebGL.</p>'
                        + '<p>This application uses WebGL to quickly draw'
                        + ' AMMO Physics.</p>'
                        + '<p>AMMO Physics can be used without WebGL, but unfortunately'
                        + ' this application cannot.</p>'
                        + '<p>Have a great day!</p>');
            return;
        }

        if( intro !== null ) intro.clear();

        renderer.setClearColor(0x252525, 1);
        renderer.setPixelRatio( window.devicePixelRatio );

        // TONE MAPPING

        renderer.gammaInput = true;
        renderer.gammaOutput = true;

        renderer.toneMapping = THREE.Uncharted2ToneMapping;
        renderer.toneMappingExposure = 3.0;
        renderer.toneMappingWhitePoint = 5.0;

        // SCENE

        scene = new THREE.Scene();

        content = new THREE.Group();
        scene.add( content );

        // CAMERA / CONTROLER

        camera = new THREE.PerspectiveCamera( 60 , 1 , 1, 1000 );
        camera.position.set( 0, 0, 30 );

        controls = new THREE.OrbitControls( camera, canvas );
        controls.target.set( 0, 0, 0 );
        controls.enableKeys = false;
        controls.update();

        cameraGroup = new THREE.Group();
        scene.add( cameraGroup );
        cameraGroup.add( camera );

        // LIGHTS

        this.addLights();

        // IMAGE LOADER

        imagesLoader = new THREE.TextureLoader();

        // RAYCAST

        ray = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        // GEOMETRY

        geo = {

            box:      new THREE.BoxBufferGeometry(1,1,1),
            hardbox:  new THREE.BoxBufferGeometry(1,1,1),
            cone:     new THREE.CylinderBufferGeometry( 0,1,0.5 ),
            wheel:    new THREE.CylinderBufferGeometry( 1,1,1, 18 ),
            sphere:   new THREE.SphereBufferGeometry( 1, 16, 12 ),
            cylinder: new THREE.CylinderBufferGeometry( 1,1,1,12,1 ),

        }

        geo.wheel.rotateZ( -Math.PI90 );

        // MATERIAL

        mat = {

            terrain: new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, name:'terrain', wireframe:true }),
            cloth: new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, name:'cloth', wireframe:true, transparent:true, opacity:0.9, side: THREE.DoubleSide }),
            ball: new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors, name:'ball', wireframe:true }),
            statique: new THREE.MeshBasicMaterial({ color:0x333399, name:'statique', wireframe:true, transparent:true, opacity:0.6 }),
            move: new THREE.MeshBasicMaterial({ color:0x999999, name:'move', wireframe:true }),
            movehigh: new THREE.MeshBasicMaterial({ color:0xff9999, name:'movehigh', wireframe:true }),
            sleep: new THREE.MeshBasicMaterial({ color:0x9999FF, name:'sleep', wireframe:true }),

            debug: new THREE.MeshBasicMaterial({ color:0x11ff11, name:'debug', wireframe:true, opacity:0.1, transparent:true }),

            hero: new THREE.MeshBasicMaterial({ color:0x993399, name:'hero', wireframe:true }),
            cars: new THREE.MeshBasicMaterial({ color:0xffffff, name:'cars', wireframe:true, transparent:true, side: THREE.DoubleSide }),
            tmp1: new THREE.MeshBasicMaterial({ color:0xffffff, name:'tmp1', wireframe:true, transparent:true }),
            tmp2: new THREE.MeshBasicMaterial({ color:0xffffff, name:'tmp2', wireframe:true, transparent:true }),
            
            meca1: new THREE.MeshBasicMaterial({ color:0xffffff, name:'meca1', wireframe:true }),
            meca2: new THREE.MeshBasicMaterial({ color:0xffffff, name:'meca2', wireframe:true }),
            meca3: new THREE.MeshBasicMaterial({ color:0xffffff, name:'meca3', wireframe:true }),

            pig: new THREE.MeshBasicMaterial({ color:0xd3a790, name:'pig', wireframe:true, transparent:false }),
            avatar: new THREE.MeshBasicMaterial({ color:0xd3a790, name:'avatar', wireframe:true, transparent:false }),

            both: new THREE.MeshBasicMaterial({ color:0xffffff, name:'both', wireframe:true, side:THREE.DoubleSide  }),
            back: new THREE.MeshBasicMaterial({ color:0xffffff, name:'back', wireframe:true, side:THREE.BackSide  }),

        }

        // GROUND

        helper = new THREE.GridHelper( 50, 20, 0xFFFFFF, 0x333333 );
        helper.material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors, transparent:true, opacity:0.1 } );
        scene.add( helper );

        this.resize();
        this.initEnv();



        

        

        window.addEventListener( 'resize', _V.resize, false );

        this.render();

        this.load ( 'basic', callback );

        //if( callback ) callback();

    },

    addLights: function(){

        light = new THREE.DirectionalLight( 0xffffff, 1 );
        light.position.set( -3, 50, 5 );
        light.lookAt( new THREE.Vector3() );
        scene.add( light );

        ambient = new THREE.AmbientLight( 0x444444 );
        scene.add( ambient );

    },

    resize: function () {

        vs.h = window.innerHeight;
        vs.w = window.innerWidth - vs.x;

        canvas.style.left = vs.x +'px';
        camera.aspect = vs.w / vs.h;
        camera.updateProjectionMatrix();
        renderer.setSize( vs.w, vs.h );

        if( editor ) editor.resizeMenu( vs.w );

    },

    setLeft: function ( x ) { 

        vs.x = x; 

    },

    getFps: function () {

        return fps;

    },

    getInfo: function () {

        return renderer.info.programs.length;

    },

    

    addMap: function( name, matName ) {

        var map = imagesLoader.load( './assets/textures/' + name );
        //map.wrapS = THREE.RepeatWrapping;
        //map.wrapT = THREE.RepeatWrapping;
        map.flipY = false;
        mat[matName].map = map;

    },

    getGeo: function () {

        return geo;

    },

    getMat: function () {

        return mat;

    },

    getScene: function () {

        return scene;

    },

    // RAYCAST

    removeRay: function(){
        if(isWithRay){
            isWithRay = false;

            canvas.removeEventListener( 'mousemove', _V.rayTest, false );
            rayCallBack = null;

            content.remove(moveplane);
            scene.remove(targetMouse);

        }
    },

    activeRay: function ( callback ) {

        isWithRay = true;

        var g = new THREE.PlaneBufferGeometry(100,100);
        g.rotateX( -Math.PI90 );
        moveplane = new THREE.Mesh( g,  new THREE.MeshBasicMaterial({ color:0xFFFFFF, transparent:true, opacity:0 }));
        content.add(moveplane);
        //moveplane.visible = false;

        targetMouse = new THREE.Mesh( geo['box'] ,  new THREE.MeshBasicMaterial({color:0xFF0000}));
        scene.add(targetMouse);

        canvas.addEventListener( 'mousemove', _V.rayTest, false );

        rayCallBack = callback;

    },

    rayTest: function (e) {

        mouse.x = ( (e.clientX- vs.x )/ vs.w ) * 2 - 1;
        mouse.y = - ( e.clientY / vs.h ) * 2 + 1;

        ray.setFromCamera( mouse, camera );
        var intersects = ray.intersectObjects( content.children, true );
        if ( intersects.length) {
            targetMouse.position.copy( intersects[0].point )
            //paddel.position.copy( intersects[0].point.add(new THREE.Vector3( 0, 20, 0 )) );

            rayCallBack( targetMouse );
        }
    },

    // MATERIAL

    changeMaterial: function ( type ) {

        var m, matType, name, i, j, k;

        if( type === 0 ) {
            isWirframe = true;
            matType = 'MeshBasicMaterial';
            this.removeShadow();
        }else{
            isWirframe = false;
            matType = 'MeshStandardMaterial';
            this.addShadow();
        }

        // create new material

        for( var old in mat ) {

            m = mat[ old ];
            name = m.name;
            if(name!=='debug'){


                mat[ name ] = new THREE[ matType ]({ 
                    name:name, 
                    envMap:null,
                    map:m.map || null, 
                    vertexColors:m.vertexColors || false, 
                    color: m.color === undefined ? 0xFFFFFF : m.color.getHex(),
                    wireframe:isWirframe, 
                    transparent: m.transparent || false, 
                    opacity: m.opacity || 1, 
                    side: m.side || THREE.FrontSide 
                });
                if( !isWirframe ){
                    mat[name].envMap = envMap;
                    mat[name].metalness = 0.6;
                    mat[name].roughness = 0.4;
                }

                m.dispose();
            }

        }

        // re-apply material

        i = meshs.length;
        while(i--){
            name = meshs[i].material.name;
            meshs[i].material = mat[name];
        };

        i = statics.length;
        while(i--){
            name = statics[i].material.name;
            statics[i].material = mat[name];
        };

        i = cars.length;
        while(i--){
            if(cars[i].material == undefined){
                k = cars[i].children.length;
                while(k--){
                    name = cars[i].children[k].material.name;
                    if( name !=='helper') cars[i].children[k].material = mat[name]
                }
            }else{
                name = cars[i].material.name;
                cars[i].material = mat[name];
            }
            
            j = cars[i].userData.w.length;
            while(j--){
                name = cars[i].userData.w[j].material.name;
                cars[i].userData.w[j].material = mat[name];
            }
        };

        i = terrains.length;
        while(i--){
            name = terrains[i].material.name;
            terrains[i].material = mat[name];
        };

        i = softs.length;
        while(i--){
            if(softs.softType!==2){
                name = softs[i].material.name;
                softs[i].material = mat[name];
            }
            
        };

    },

    needFocus: function () {

        canvas.addEventListener('mouseover', editor.unFocus, false );

    },

    haveFocus: function () {

        canvas.removeEventListener('mouseover', editor.unFocus, false );

    },

    // ENVMAP

    initEnv: function () {

        var env = document.createElement( 'div' );
        env.className = 'env';
        var canvas = document.createElement( 'canvas' );
        canvas.width = canvas.height = 64;
        env.appendChild( canvas );
        document.body.appendChild( env );
        envcontext = canvas.getContext('2d');
        env.onclick = this.loadEnv;
        env.oncontextmenu = this.loadEnv;
        this.loadEnv();

    },

    loadEnv: function ( e ) {

        var b = 0;

        if(e){ 
            e.preventDefault();
            b = e.button;
            if( b === 0 ) nEnv++;
            else nEnv--;
            if( nEnv == envLists.length ) nEnv = 0;
            if( nEnv < 0 ) nEnv = envLists.length-1;
        }

        var img = new Image();
        img.onload = function(){
            
            envcontext.drawImage(img,0,0,64,64);
            
            envMap = new THREE.Texture( img );
            envMap.mapping = THREE.SphericalReflectionMapping;
            envMap.format = THREE.RGBFormat;
            envMap.needsUpdate = true;

            if( nEnv === 0 && !isWirframe ) _V.changeMaterial( 0 );
            if( nEnv !== 0  ) {
                if( isWirframe ) _V.changeMaterial( 1 );
                else{
                    for( var mm in mat ){
                       mat[mm].envMap = envMap;
                    }
                }
            }
        }

        img.src = './assets/textures/spherical/'+ envLists[nEnv] +'.jpg';

    },

    // GRID

    hideGrid: function(){

        if( helper.visible ) helper.visible = false;
        else helper.visible = true;

    },

    //--------------------------------------
    //
    //   LOAD SEA3D
    //
    //--------------------------------------

    load: function( Urls, Callback ){

        if ( typeof Urls == 'string' || Urls instanceof String ) urls.push( Urls );
        else urls = urls.concat( Urls );

        callback_load = Callback || function(){};

        _V.load_sea( urls[0] );

    },

    load_next: function () {

        urls.shift();
        if( urls.length === 0 ) callback_load();
        else _V.load_sea( urls[0] );

    },

    load_sea: function ( n ) {

        var l = new THREE.SEA3D();

        l.onComplete = function( e ) {

            results[ n ] = l.meshes;

            var i = l.geometries.length, g;
            while( i-- ){
                g = l.geometries[i];
                geo[ g.name ] = g;
            };

            _V.load_next();

        };

        l.load( './assets/models/'+ n +'.sea' );

    },

    getResult : function(){

        return results;

    },

    //--------------------------------------
    //
    //   SRC UTILS ViewUtils
    //
    //--------------------------------------


    mergeMesh: function(m){

        return THREE.ViewUtils.mergeGeometryArray( m );

    },

    prepaGeometry: function ( g, type ) {

        return THREE.ViewUtils.prepaGeometry( g, type );

    },


    //--------------------------------------
    //
    //   CAMERA AND CONTROL
    //
    //--------------------------------------

    controlUpdate: function(){

        

        if( !isCamFollow ) return;
        if( currentFollow === null ) return;

        var h, v;
        var mesh = currentFollow;
        var type = mesh.userData.type;
        var speed = mesh.userData.speed;

        v = (-70) * Math.torad;

        if( type === 'car' ) {

            
            
            if( speed < 10 && speed > -10 ){ 

                this.setControle( true );
                return;

            } else {

                this.setControle( false );

            }
        }



        if( type === 'hero' ){

            //if( speed === 0 ){
                this.setControle( true );

                cam.theta = controls.getAzimuthalAngle() + Math.Pi;
                cam.phi = -controls.getPolarAngle();// - Math.PI90;



                if( cam.phi !== cam.oPhi ) {
                    cam.oPhi = cam.phi;
                    v = cam.phi;
                }
                if( cam.theta !== cam.oTheta ) {
                    cam.oTheta = cam.theta;
                    ammo.send('heroRotation', { id:mesh.userData.id, angle:cam.theta })
                }

                // - (90*Math.torad);
                //return;
           // }

        }

        //console.log(cam.phi*Math.todeg)

        //view.setControle( false );

        var matrix = new THREE.Matrix4();
        matrix.extractRotation( mesh.matrix );

        var front = new THREE.Vector3( 0, 0, 1 );
        front.applyMatrix4( matrix );
        //matrix.multiplyVector3( front );

        var target = mesh.position;
        h = Math.atan2( front.x, front.z );// * Math.radtodeg ) - 180;
        //v = (20-90) * Math.torad;


        this.autoCamera( h, v, 10, 0.3, target );

        //if( type === 'car' ) 
        //else view.setTarget(target);

    },

    setFollow: function ( name ) {

        currentFollow = this.getByName( name );
        if( currentFollow !== null ) {
            isCamFollow = true;
        }

    },

    setTarget: function ( target ) {

        controls.target.copy( target );
        controls.update();

    },

    autoCamera:function ( h, v, d, l, target ) {

        l = l || 1;
        //if( target ) controls.target.set( target.x || 0, target.y || 0, target.z || 0 );
        //camera.position.copy( this.orbit( h, v, d ) );
        camera.position.lerp( this.orbit( h, v, d ), l );

        if( target ) this.setTarget( target );
        //controls.update();

    },

    moveCamera: function ( h, v, d, target ) {

        /*l = l || 1;
       // if( target ) controls.target.set( target.x || 0, target.y || 0, target.z || 0 );
        camera.position.lerp( this.orbit( (h+180) * Math.torad, (v-90) * Math.torad, d ), l );
        //controls.update();



        if( target ) this.setTarget( target );*/

        var dest = this.orbit( (h+180) * Math.torad, (v-90) * Math.torad, d );


        new TWEEN.Tween( camera.position ).to( { x: dest.x, y: dest.y, z: dest.z }, 400 )
                    .easing( TWEEN.Easing.Quadratic.Out )
                    //.onUpdate( function(){ isMove = true; } )
                    //.onComplete( function(){ current = rubrique; isMove = false; } )
                    .start();


        new TWEEN.Tween( controls.target ).to( { x: target[0], y: target[1], z: target[2] }, 400 )
                    .easing( TWEEN.Easing.Quadratic.Out )
                    .onUpdate( function(){ controls.update(); } )
                    //.onComplete( function(){ current = rubrique; isMove = false; } )
                    .start();
        
    },

    orbit: function( h, v, d ) {

        var offset = new THREE.Vector3();
        
        var phi = v;
        var theta = h;
        offset.x =  d * Math.sin(phi) * Math.sin(theta);
        offset.y =  d * Math.cos(phi);
        offset.z =  d * Math.sin(phi) * Math.cos(theta);

        var p = new THREE.Vector3();
        p.copy( controls.target ).add( offset );
        /*
        p.x = ( d * Math.sin(phi) * Math.cos(theta)) + controls.target.x;
        p.y = ( d * Math.cos(phi)) + controls.target.y;
        p.z = ( d * Math.sin(phi) * Math.sin(theta)) + controls.target.z;*/

        //key[8] = theta;
        
        return p;

    },

    setControle: function( b ){

        if( controls.enableRotate === b ) return;
        
        controls.enableRotate = b;
        controls.enableZoom = b;
        controls.enablePan = b;

    },



    resetCamera: function(){

        _V.setControle( true );
        currentFollow = null;

    },

    setDriveCar: function ( name ) {

        ammo.send('setDriveCar', { n:this.getByName(name).userData.id });

    },

    toRad: function ( r ) {

        var i = r.length;
        while(i--) r[i] *= Math.torad;
        return r;

    },



    //--------------------------------------
    //
    //   ADD
    //
    //--------------------------------------

    add: function ( o ) {

        var isCustomGeometry = false;

        o.mass = o.mass == undefined ? 0 : o.mass;
        o.type = o.type == undefined ? 'box' : o.type;

        // position
        o.pos = o.pos == undefined ? [0,0,0] : o.pos;

        // size
        o.size = o.size == undefined ? [1,1,1] : o.size;
        if(o.size.length == 1){ o.size[1] = o.size[0]; }
        if(o.size.length == 2){ o.size[2] = o.size[0]; }

        if(o.geoSize){
            if(o.geoSize.length == 1){ o.geoSize[1] = o.geoSize[0]; }
            if(o.geoSize.length == 2){ o.geoSize[2] = o.geoSize[0]; }
        }

        // rotation is in degree
        o.rot = o.rot == undefined ? [0,0,0] : this.toRad(o.rot);
        o.quat = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( o.rot ) ).toArray();

        if(o.rotA) o.quatA = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( this.toRad( o.rotA ) ) ).toArray();
        if(o.rotB) o.quatB = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( this.toRad( o.rotB ) ) ).toArray();

        if(o.angUpper) o.angUpper = this.toRad( o.angUpper );
        if(o.angLower) o.angLower = this.toRad( o.angLower );

        var mesh = null;

        if(o.type.substring(0,5) === 'joint') {

            ammo.send( 'add', o );
            return;

        }

        if(o.type === 'plane'){
            helper.position.set( o.pos[0], o.pos[1], o.pos[2] )
            ammo.send( 'add', o ); 
            return;
        }

        if(o.type === 'softTriMesh'){
            this.softTriMesh( o ); 
            return;
        }

        if(o.type === 'softConvex'){
            this.softConvex( o ); 
            return;
        }

        if(o.type === 'cloth'){
            this.cloth( o ); 
            return;
        }

        if(o.type === 'rope'){
            this.rope( o ); 
            return;
        }

        if(o.type === 'ellipsoid'){
            this.ellipsoid( o ); 
            return;
        }

        if(o.type === 'terrain'){
            this.terrain( o ); 
            return;
        }

        
        

        var material;
        if(o.material !== undefined) material = mat[o.material];
        else material = o.mass ? mat.move : mat.statique;
        
        if( o.type === 'capsule' ){
            var g = new THREE.CapsuleBufferGeometry( o.size[0] , o.size[1]*0.5 );
            //g.applyMatrix(new THREE.Matrix4().makeRotationY(-Math.PI*0.5));
            mesh = new THREE.Mesh( g, material );
            extraGeo.push(mesh.geometry);
            isCustomGeometry = true;

        } else if( o.type === 'mesh' || o.type === 'convex' ){ 
            o.v = _V.prepaGeometry( o.shape, o.type );
            if(o.geometry){
                mesh = new THREE.Mesh( o.geometry, material );
                extraGeo.push(o.geometry);
                extraGeo.push(o.shape);
            } else {
                mesh = new THREE.Mesh( o.shape, material );
                extraGeo.push(mesh.geometry);
            }
        } else {
            if(o.geometry){
                if(o.geoRot || o.geoScale) o.geometry = o.geometry.clone();
                // rotation only geometry
                if(o.geoRot){ o.geometry.applyMatrix(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler().fromArray(this.toRad(o.geoRot))));}

            
                // scale only geometry
                if(o.geoScale){ 
                    o.geometry.applyMatrix( new THREE.Matrix4().makeScale( o.geoScale[0], o.geoScale[1], o.geoScale[2] ) );
                    //material = mat['back'];//material.clone();
                    //material.side = THREE.BackSide;
                }
            }

            if(o.mass === 0 && o.type === 'box' ) mesh = new THREE.Mesh( o.geometry || geo['hardbox'], material );
            else mesh = new THREE.Mesh( o.geometry || geo[o.type], material );

            if( o.geometry ){
                extraGeo.push(o.geometry);
                if(o.geoSize) mesh.scale.fromArray( o.geoSize );
                if(!o.geoSize && o.size) mesh.scale.fromArray( o.size );
                isCustomGeometry = true;
            }

        }


        if(mesh){

            if( !isCustomGeometry ) mesh.scale.fromArray( o.size );

            mesh.position.fromArray( o.pos );
            mesh.quaternion.fromArray( o.quat );

            mesh.receiveShadow = true;
            mesh.castShadow = true;
            
            this.setName( o, mesh );

            scene.add( mesh );

            // push 
            if( o.mass ) meshs.push( mesh );
            else statics.push( mesh );
        }

        if( o.shape ) delete( o.shape );
        if( o.geometry ) delete( o.geometry );
        if( o.material ) delete( o.material );

        // send to worker
        ammo.send( 'add', o );

    },

    

    getGeoByName: function ( name, Buffer ) {

        var g;
        var i = geo.length;
        var buffer = Buffer || false;
        while(i--){
            if( name == geo[i].name) g = geo[i];
        }
        if( buffer ) g = new THREE.BufferGeometry().fromGeometry( g );
        return g;

    },

    character: function ( o ) {

        o.size = o.size == undefined ? [0.25,2,2] : o.size;
        if(o.size.length == 1){ o.size[1] = o.size[0]; }
        if(o.size.length == 2){ o.size[2] = o.size[0]; }

        o.pos = o.pos === undefined ? [0,0,0] : o.pos;
        o.rot = o.rot == undefined ? [0,0,0] : this.toRad( o.rot );
        o.quat = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( o.rot ) ).toArray();

        var g = new THREE.CapsuleBufferGeometry( o.size[0], o.size[1]*0.5, 6 );

        var mesh = new THREE.Group();//o.mesh || new THREE.Mesh( g );

        if( o.debug ){
            var mm = new THREE.Mesh( g, mat.debug );
            extraGeo.push( g );
            mesh.add( mm )


        }

        //mesh.material = mat.hero;
        if( o.mesh ){

            mat.hero.skinning = true;
            //mesh.userData.skin = true;

            o.mesh.material = mat.hero;
            o.mesh.scale.multiplyScalar( o.scale || 1 );
            o.mesh.position.set(0,0,0);
            o.mesh.play(0);

            mesh.add( o.mesh );
            mesh.skin = o.mesh;

            extraGeo.push( mesh.skin.geometry );
            
        } else {

            var mx = new THREE.Mesh( g, mat.hero );
            extraGeo.push( g );
            mesh.add( mx );

        }
        


        

        mesh.userData.speed = 0;
        mesh.userData.type = 'hero';
        mesh.userData.id = heros.length;

         // copy rotation quaternion
        mesh.position.fromArray( o.pos );
        mesh.quaternion.fromArray( o.quat );

        

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add( mesh );
        heros.push( mesh );

        this.setName( o, mesh );

        if( o.mesh ) delete( o.mesh );

        // send to worker
        ammo.send( 'character', o );

    },

    vehicle: function ( o ) {

        //var type = o.type || 'box';
        var size = o.size || [2,0.5,4];
        var pos = o.pos || [0,0,0];
        var rot = o.rot || [0,0,0];

        var wPos = o.wPos || [1, 0, 1.6];

        var massCenter = o.massCenter || [0,0.25,0];

        this.toRad( rot );

        // chassis
        var mesh;
        if( o.mesh ){ 
            mesh = o.mesh;
            var k = mesh.children.length;
                while(k--){
                    mesh.children[k].position.set( massCenter[0], massCenter[1], massCenter[2] );
                    //mesh.children[k].geometry.translate( massCenter[0], massCenter[1], massCenter[2] );
                    mesh.children[k].castShadow = true;
                    mesh.children[k].receiveShadow = true;
                }
        } else {
            var g = new THREE.BufferGeometry().fromGeometry( new THREE.BoxGeometry(size[0], size[1], size[2]) );//geo.box;
            g.translate( massCenter[0], massCenter[1], massCenter[2] );
            extraGeo.push( g );
            mesh = new THREE.Mesh( g, mat.move );
        } 
        

        //mesh.scale.set( size[0], size[1], size[2] );
        mesh.position.set( pos[0], pos[1], pos[2] );
        mesh.rotation.set( rot[0], rot[1], rot[2] );

        // copy rotation quaternion
        o.quat = mesh.quaternion.toArray();

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        

        scene.add( mesh );

        this.setName( o, mesh );

        mesh.userData.speed = 0;
        mesh.userData.steering = 0;
        mesh.userData.NumWheels = o.nw || 4;
        mesh.userData.type = 'car';

        if(o.helper){
            mesh.userData.helper = new THREE.CarHelper( wPos );
            mesh.add( mesh.userData.helper );
        }

        // wheels

        var radius = o.radius || 0.4;
        var deep = o.deep || 0.3;
        wPos = o.wPos || [1, -0.25, 1.6];

        var w = [];

        var needScale = o.wheel == undefined ? true : false;

        var gw = o.wheel || geo['wheel'];
        var gwr = gw.clone();
        gwr.rotateY( Math.Pi );
        extraGeo.push( gwr );

        var i = o.nw || 4;
        while(i--){
            if(i==1 || i==2) w[i] = new THREE.Mesh( gw, mat.move );
            else w[i] = new THREE.Mesh( gwr, mat.move );
            if( needScale ) w[i].scale.set( deep, radius, radius );
            else w[i].material = mat.cars;

            w[i].castShadow = true;
            w[i].receiveShadow = true;

            scene.add( w[i] );
        }

        mesh.userData.w = w;

        //var car = { body:mesh, w:w, axe:helper.mesh, nw:o.nw || 4, helper:helper, speed:0 };

        cars.push( mesh );

        mesh.userData.id = cars.length-1;
        //carsSpeed.push( 0 );



        if( o.mesh ) o.mesh = null;
        if( o.wheel ) o.wheel = null;

        if ( o.type == 'mesh' || o.type == 'convex' ) o.v = _V.prepaGeometry( o.shape, o.type );

        if( o.shape ) delete(o.shape);
        if( o.mesh ) delete(o.mesh);

        // send to worker
        ammo.send( 'vehicle', o );

    },

    //--------------------------------------
    //   SOFT TRI MESH
    //--------------------------------------

    softTriMesh: function ( o ) {

        //console.log(o.shape)

        //if(o.shape.bones) 

        var g = o.shape.clone();
        var pos = o.pos || [0,0,0];
        var size = o.size || [1,1,1];
        var rot = o.rot || [0,0,0];

        g.translate( pos[0], pos[1], pos[2] );
        g.scale( size[0], size[1], size[2] );

        //g.rotateX( rot[0] *= Math.degtorad );
        //g.rotateY( rot[1] *= Math.degtorad );
        //g.rotateZ( rot[2] *= Math.degtorad );
        g.applyMatrix( new THREE.Matrix4().makeRotationY(rot[1] *= Math.torad ));

        
        

        //console.log('start', g.getIndex().count);

        _V.prepaGeometry( g );

        extraGeo.push( g );

        //console.log('mid', g.realIndices.length);


        o.v = g.realVertices;
        o.i = g.realIndices;
        o.ntri = g.numFaces;

        var material = o.material === undefined ? mat.cloth : mat[o.material];
        var mesh = new THREE.Mesh( g, material );

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        mesh.softType = 5;

        scene.add( mesh );
        softs.push( mesh );

        if( o.shape ) delete(o.shape);
        if( o.material ) delete(o.material);

        // send to worker
        ammo.send( 'add', o );
        
    },

    //--------------------------------------
    //   SOFT CONVEX
    //--------------------------------------

    softConvex: function ( o ) {

        var g = o.shape;
        var pos = o.pos || [0,0,0];

        g.translate( pos[0], pos[1], pos[2] );

        _V.prepaGeometry(g);

        o.v = g.realVertices;

        var mesh = new THREE.Mesh( g, mat.cloth );
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        mesh.softType = 4;

        scene.add( mesh );
        softs.push( mesh );

        // send to worker
        ammo.send( 'add', o );

    },

    //--------------------------------------
    //   CLOTH
    //--------------------------------------

    cloth: function ( o ) {

        var i, x, y, n;

        var div = o.div || [16,16];
        var size = o.size || [100,0,100];
        var pos = o.pos || [0,0,0];

        var max = div[0] * div[1];

        var g = new THREE.PlaneBufferGeometry( size[0], size[2], div[0] - 1, div[1] - 1 );
        g.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( max*3 ), 3 ) );
        g.rotateX( -Math.PI90 );
        //g.translate( -size[0]*0.5, 0, -size[2]*0.5 );

        var numVerts = g.attributes.position.array.length / 3;

        var mesh = new THREE.Mesh( g, mat.cloth );

        this.setName( o, mesh );

       // mesh.material.needsUpdate = true;
        mesh.position.set( pos[0], pos[1], pos[2] );

        mesh.castShadow = true;
        mesh.receiveShadow = true;//true;
        //mesh.frustumCulled = false;

        mesh.softType = 1;

        scene.add( mesh );
        softs.push( mesh );

        o.size = size;
        o.div = div;
        o.pos = pos;

        // send to worker
        ammo.send( 'add', o );

    },

    //--------------------------------------
    //   ROPE
    //--------------------------------------

    rope: function ( o ) {

        //var max = o.numSegment || 10;
        //var start = o.start || [0,0,0];
        //var end = o.end || [0,10,0];

       // max += 2;
        /*var ropeIndices = [];

        //var n;
        //var pos = new Float32Array( max * 3 );
        for(var i=0; i<max-1; i++){

            ropeIndices.push( i, i + 1 );

        }*/

        if( o.numSeg === undefined ) o.numSeg = o.numSegment;

        /*var g = new THREE.BufferGeometry();
        g.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
        g.addAttribute('position', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
        g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));

        //var mesh = new THREE.LineSegments( g, new THREE.LineBasicMaterial({ vertexColors: true }));
        var mesh = new THREE.LineSegments( g, new THREE.LineBasicMaterial({ color: 0xFFFF00 }));*/

        var g = new THREE.Tubex( o, o.numSeg || 10, o.radius || 0.2, o.numRad || 6, false );

        //console.log(g.positions.length)

        var mesh = new THREE.Mesh( g, mat.ball );

        this.setName( o, mesh );


        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.softType = 2;
        //mesh.frustumCulled = false;

        scene.add( mesh );
        softs.push( mesh );

        // send to worker
        ammo.send( 'add', o );

    },

    //--------------------------------------
    //   ELLIPSOID 
    //--------------------------------------

    ellipsoid: function ( o ) {

        // send to worker
        ammo.send( 'add', o );

    },

    ellipsoidMesh: function ( o ) {

        var max = o.lng;
        var points = [];
        var ar = o.a;
        var i, j, k, v, n;
        
        // create temp convex geometry and convert to buffergeometry
        for( i = 0; i<max; i++ ){
            n = i*3;
            points.push(new THREE.Vector3(ar[n], ar[n+1], ar[n+2]));
        }
        var gt = new THREE.ConvexGeometry( points );

        
        var indices = new Uint32Array( gt.faces.length * 3 );
        var vertices = new Float32Array( max * 3 );
        var order = new Float32Array( max );
        //var normals = new Float32Array( max * 3 );
        //var uvs  = new Float32Array( max * 2 );

        

         // get new order of vertices
        v = gt.vertices;
        i = max;
        //var v = gt.vertices;
        //var i = max, j, k;
        while(i--){
            j = max;
            while(j--){
                n = j*3;
                if(ar[n]==v[i].x && ar[n+1]==v[i].y && ar[n+2]==v[i].z) order[j] = i;
            }
        }

       
        i = max
        while(i--){
            n = i*3;
            k = order[i]*3;

            vertices[k] = ar[n];
            vertices[k+1] = ar[n+1];
            vertices[k+2] = ar[n+2];

        }

        // get indices of faces
        i = gt.faces.length;
        while(i--){
            n = i*3;
            var face = gt.faces[i];
            indices[n] = face.a;
            indices[n+1] = face.b;
            indices[n+2] = face.c;
        }

        //console.log(gtt.vertices.length)
        var g = new THREE.BufferGeometry();
        g.setIndex( new THREE.BufferAttribute( indices, 1 ) );
        g.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
        g.addAttribute('order', new THREE.BufferAttribute( order, 1 ));
        
        //g.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
        //g.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );

        g.computeVertexNormals();

        extraGeo.push( g );


        gt.dispose();


        //g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
        var mesh = new THREE.Mesh( g, mat.ball );

        this.setName( o, mesh );

        mesh.softType = 3;

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add( mesh );
        softs.push( mesh );

    },

    //--------------------------------------
    //
    //   TERRAIN
    //
    //--------------------------------------

    terrain: function ( o ) {

        var i, x, y, n, c;

        o.div = o.div == undefined ? [64,64] : o.div;
        o.size = o.size == undefined ? [100,10,100] : o.size;
        o.pos = o.pos == undefined ? [0,0,0] : o.pos;
        o.dpos = o.dpos == undefined ? [0,0,0] : o.dpos;
        o.complexity = o.complexity == undefined ? 30 : o.complexity;
        o.lng = o.div[0] * o.div[1];
        o.hdata =  new Float32Array( o.lng );
        
        if( !perlin ) perlin = new Perlin();

        var sc = 1 / o.complexity;
        var r = 1 / o.div[0];
        var rx = (o.div[0] - 1) / o.size[0];
        var rz = (o.div[1] - 1) / o.size[2];

        var colors = new Float32Array( o.lng * 3 );
        var g = new THREE.PlaneBufferGeometry( o.size[0], o.size[2], o.div[0] - 1, o.div[1] - 1 );
        g.rotateX( -Math.PI90 );
        var vertices = g.attributes.position.array;


        i = o.lng;
        while( i-- ){
            n = i * 3;
            x = i % o.div[0];
            y = ~~ ( i * r );
            c = 0.5 + ( perlin.noise( (x+(o.dpos[0]*rx))*sc, (y+(o.dpos[2]*rz))*sc ) * 0.5); // from 0 to 1
            o.hdata[ i ] = c * o.size[ 1 ]; // final h size
            vertices[ n + 1 ] = o.hdata[i];
            colors[ n ] = c;
            colors[ n + 1 ] = c;
            colors[ n + 2 ] = c;
        }
        
        g.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
        g.computeBoundingSphere();
        g.computeVertexNormals();

        extraGeo.push( g );
        
        var mesh = new THREE.Mesh( g, mat.terrain );
        //mesh.position.set( o.pos[0], o.pos[1], o.pos[2] );
        mesh.position.fromArray( o.pos );

        mesh.castShadow = false;
        mesh.receiveShadow = true;

        this.setName( o, mesh );

        scene.add( mesh );
        terrains.push( mesh );

        // send to worker
        ammo.send( 'add', o );

        if( shadowGround ) scene.remove( shadowGround );

    },

    moveTerrain: function ( o ) {



    },

    //--------------------------------------
    //
    //   OBJECT NAME
    //
    //--------------------------------------

    setName: function ( o, mesh ) {

        if( o.name !== undefined ){ 
            byName[o.name] = mesh;
            mesh.name = o.name;
        }

    },

    getByName: function (name){

        return byName[name] || null;

    },


    //--------------------------------------
    //
    //   UPDATE OBJECT
    //
    //--------------------------------------

    getBody: function(){ return meshs },

    bodyStep: function(){

        if( !meshs.length ) return;

        meshs.forEach( function( b, id ) {

            var n = id * 8;
            var s = Br[n];
            if ( s > 0 ) {

                if ( b.material.name == 'sleep' ) b.material = mat.move;
                if( s > 50 && b.material.name == 'move' ) b.material = mat.movehigh;
                else if( s < 50 && b.material.name == 'movehigh') b.material = mat.move;
                
                b.position.fromArray( Br, n + 1 );
                b.quaternion.fromArray( Br, n + 4 );

            } else {
                if ( b.material.name == 'move' || b.material.name == 'movehigh' ) b.material = mat.sleep;
            }
        });

    },

    heroStep: function(){

        if( !heros.length ) return;

        heros.forEach( function( b, id ) {

            var n = id * 8;
            var s = Hr[n] * 3.33;
            b.userData.speed = s * 100;
            b.position.fromArray( Hr, n + 1 );
            b.quaternion.fromArray( Hr, n + 4 );

            if(b.skin){



                if( s === 0 ) b.skin.play( 0, 0.3 );
                else{ 
                    b.skin.play( 1, 0.3 );
                    b.skin.setTimeScale( s );

                }

                //console.log(s)
                
            }

        });

    },

    carsStep: function(){

        if( !cars.length ) return;

        cars.forEach( function( b, id ) {

            var n = id * 56;
            //carsSpeed[id] = Cr[n];
            b.userData.speed = Cr[n];

            b.position.fromArray( Cr, n + 1 );
            b.quaternion.fromArray( Cr, n + 4 );

            //b.position.set( Cr[n+1], Cr[n+2], Cr[n+3] );
            //b.quaternion.set( Cr[n+4], Cr[n+5], Cr[n+6], Cr[n+7] );

            //b.axe.position.copy( b.body.position );
            //b.axe.quaternion.copy( b.body.quaternion );

            var j = b.userData.NumWheels, w;

            if(b.userData.helper){
                if( j == 4 ){
                    w = 8 * ( 4 + 1 );
                    b.userData.helper.updateSuspension(Cr[n+w+0], Cr[n+w+1], Cr[n+w+2], Cr[n+w+3]);
                }
            }
            
            while(j--){

                w = 8 * ( j + 1 );
                //if( j == 1 ) steering = a[n+w];// for drive wheel
                //if( j == 1 ) b.axe.position.x = Cr[n+w];
                //if( j == 2 ) b.axe.position.y = Cr[n+w];
                //if( j == 3 ) b.axe.position.z = Cr[n+w];

                b.userData.w[j].position.fromArray( Cr, n + w + 1 );
                b.userData.w[j].quaternion.fromArray( Cr, n + w + 4 );

                //b.userData.w[j].position.set( Cr[n+w+1], Cr[n+w+2], Cr[n+w+3] );
                //b.userData.w[j].quaternion.set( Cr[n+w+4], Cr[n+w+5], Cr[n+w+6], Cr[n+w+7] );
            }
        });

    },

    getSofts: function(){

        return softs;

    },

    softStep: function(){

        if( !softs.length ) return;

        var softPoints = 0;

        softs.forEach( function( b, id ) {

            var n, c, cc, p, j, k, u;

            var t = b.softType; // type of softBody
            var order = null;
            var isWithColor = b.geometry.attributes.color ? true : false;
            var isWithNormal = b.geometry.attributes.normal ? true : false;


            if( t === 2 ){ // rope

                j = b.geometry.positions.length;
                while( j-- ){
                    n = softPoints + ( j * 3 );
                    b.geometry.positions[j].set( Sr[n], Sr[n+1], Sr[n+2] );
                }

                b.geometry.updatePath();
                softPoints += b.geometry.positions.length*3;

            } else {

                p = b.geometry.attributes.position.array;
                if(isWithColor) c = b.geometry.attributes.color.array;

                if( t === 5 || t === 4 ){ // softTriMesh // softConvex

                    var max = b.geometry.numVertices;
                    var maxi = b.geometry.maxi;
                    var pPoint = b.geometry.pPoint;
                    var lPoint = b.geometry.lPoint;

                    j = max;
                    while(j--){
                        n = (j*3) + softPoints;
                        if( j == max-1 ) k = maxi - pPoint[j];
                        else k = pPoint[j+1] - pPoint[j];
                        var d = pPoint[j];
                        while(k--){
                            u = lPoint[d+k]*3;
                            p[u] = Sr[n];
                            p[u+1] = Sr[n+1]; 
                            p[u+2] = Sr[n+2];
                        }
                    }

                /*}else if( t === 2 ){ // new rope

                    j = b.geometry.positions.length;// * 3;
                    while(j--){
                        n = (j*3) + softPoints;
                        b.geometry.positions[j].set( Sr[n], Sr[n+1], Sr[n+2] );

                    }

                    b.geometry.updatePath();
                    softPoints += b.geometry.positions.length*3;*/

                }else{




                    if( b.geometry.attributes.order ) order = b.geometry.attributes.order.array;
                    //if( m.geometry.attributes.same ) same = m.geometry.attributes.same.array;
                    j = p.length;

                    n = 2;

                    if( order !== null ) {

                        j = order.length;
                        while(j--){
                            k = order[j] * 3;
                            n = j*3 + softPoints;
                            p[k] = Sr[n];
                            p[k+1] = Sr[n+1];
                            p[k+2] = Sr[n+2];

                            cc = Math.abs(Sr[n+1]/10);
                            c[k] = cc;
                            c[k+1] = cc;
                            c[k+2] = cc;
                        }

                    } else {
                         while(j--){
                             
                            p[j] = Sr[j+softPoints];
                            if(n==1){ 
                                cc = Math.abs(p[j]/10);
                                c[j-1] = cc;
                                c[j] = cc;
                                c[j+1] = cc;
                            }
                            n--;
                            n = n<0 ? 2 : n;
                        }

                    }

                }

                if(t!==2) b.geometry.computeVertexNormals();

                b.geometry.attributes.position.needsUpdate = true;

                if(isWithNormal){

                    var norm = b.geometry.attributes.normal.array;

                    j = max;
                    while(j--){
                        if( j == max-1 ) k = maxi - pPoint[j];
                        else k = pPoint[j+1] - pPoint[j];
                        var d = pPoint[j];
                        var ref = lPoint[d]*3;
                        while(k--){
                            u = lPoint[d+k]*3;
                            norm[u] = norm[ref];
                            norm[u+1] = norm[ref+1]; 
                            norm[u+2] = norm[ref+2];
                        }
                    }

                    b.geometry.attributes.normal.needsUpdate = true;
                }

                if(isWithColor) b.geometry.attributes.color.needsUpdate = true;
                
                b.geometry.computeBoundingSphere();

                if( t === 5 ) softPoints += b.geometry.numVertices * 3;
                else softPoints += p.length;
            }
        });

    },
    



    //--------------------------------------
    //   SHADOW
    //--------------------------------------

    removeShadow: function(){

        if(!isWithShadow) return;

        isWithShadow = false;
        renderer.shadowMap.enabled = false;
        //light.shadowMap.enabled = false;

        if( shadowGround ) scene.remove( shadowGround );
        //scene.remove(light);
        //scene.remove(ambient);

    },

    hideGroundShadow: function(){

        shadowGround.visible = false;

    },

    setShadowPosY: function( y ){

        spy = y;
        if( shadowGround ){ 
            shadowGround.position.y = spy;
            shadowGround.visible = true;
        }

    },

    addShadow: function(){

       if( isWithShadow ) return;

        isWithShadow = true;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.soft = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.renderReverseSided = false;

        if( !terrains.length ){
            var planemat = new THREE.ShaderMaterial( THREE.ShaderShadow );
            shadowGround = new THREE.Mesh( new THREE.PlaneBufferGeometry( 200, 200, 1, 1 ), planemat );
            shadowGround.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI*0.5));
            shadowGround.position.y = spy;
            shadowGround.castShadow = false;
            shadowGround.receiveShadow = true;
            scene.add( shadowGround );
        }

        light.castShadow = true;
        var d = 70;
        var camShadow = new THREE.OrthographicCamera( d, -d, d, -d,  25, 170 );
        light.shadow = new THREE.LightShadow( camShadow );

        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        //light.shadow.bias = 0.0001;


    },

}

return view;

})();
