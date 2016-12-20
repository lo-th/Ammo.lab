var THREE;
var list;
var extensions;
var numDiv;
var data;
var TextDecoder;
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
    this.normals = [];
    this.uvs = [];
    this.indices = [];

    // create buffer data

    this.generateBufferData();

    // build geometry

    this.setIndex( new ( this.indices.length > 65535 ? THREE.Uint32BufferAttribute : THREE.Uint16BufferAttribute )( this.indices, 1 ) );
    this.addAttribute( 'position', new THREE.Float32BufferAttribute( this.vertices, 3 ) );
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
    

    for ( var i = 0; i < this.tubularSegments; i ++ ) {

        this.updateSegment( i );

    }

    // if the geometry is not closed, generate the last row of vertices and normals
    // at the regular position on the given path
    //
    // if the geometry is closed, duplicate the first row of vertices and normals (uvs will differ)

    this.updateSegment( ( this.closed === false ) ? this.tubularSegments : 0 );

    



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

        this.normals[n+ n2] =  this.normal.x;
        this.normals[n + n2 +1] =  this.normal.y;
        this.normals[n + n2 +2] =  this.normal.z;

        // vertex

        this.vertices[n + n2] =  P.x + this.radius * this.normal.x;
        this.vertices[n + n2 +1] =  P.y + this.radius * this.normal.y;
        this.vertices[n + n2 +2] =  P.z + this.radius * this.normal.z;

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
