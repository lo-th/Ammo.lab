/*global THREE*/
import { RigidBody } from './RigidBody.js';
import { SoftBody } from './SoftBody.js';
import { Terrain } from './Terrain.js';
import { Vehicle } from './Vehicle.js';
import { Character } from './Character.js';
import { Collision } from './Collision.js';
import { RayCaster } from './RayCaster.js';
import { ConvexObjectBreaker } from './ConvexObjectBreaker.js';
import { LZMAdecompact } from './lzma.js';
import { root, map, REVISION } from './root.js';

/**   _  _____ _   _
*    | ||_   _| |_| |
*    | |_ | | |  _  |
*    |___||_| |_| |_|
*    @author lth / https://github.com/lo-th/
*    Shoutgun Ammo worker launcher
*/

export var engine = ( function () {

	'use strict';

	var type = 'LZMA'; // LZMA / WASM / ASM

	var worker, callback, blob = null;

	var URL = window.URL || window.webkitURL;
	var Time = typeof performance === 'undefined' ? Date : performance;
	var t = { now: 0, delta: 0, then: 0, inter: 0, tmp: 0, n: 0, timerate: 0, autoFps: false };

	//var timer = undefined;
	var interval = null;
	var refView = null;

	var isBuffer = false;
	var isPause = false;
	//var isPause = false;
	var stepNext = false;

	var currentMode = '';
	var oldMode = '';

	var PI90 = 1.570796326794896;
	var torad = 0.0174532925199432957;
	var todeg = 57.295779513082320876;

	var rigidBody, softBody, terrains, vehicles, character, collision, rayCaster;

	var convexBreaker = null;
	var ray = null;
	var mouseMode = 'free';

	var tmpRemove = [];
	var tmpAdd = [];

	var oldFollow = '';

	//var needUpdate = false;

	var option = {

		worldscale: 1,
		gravity: [ 0, - 10, 0 ],
		fps: 60,

		substep: 2,
		broadphase: 2,
		soft: true,

	};

	engine = {

		init: function ( Callback, Type, Option, Counts ) {

			this.initArray( Counts );
			this.defaultRoot();

			Option = Option || {};

			callback = Callback;

			option = {

				fps: Option.fps || 60,
				worldscale: Option.worldscale || 1,
				gravity: Option.gravity || [ 0, - 10, 0 ],
				substep: Option.substep || 2,
				broadphase: Option.broadphase || 2,
				soft: Option.soft !== undefined ? Option.soft : true,
				fixed: Option.fixed !== undefined ? Option.fixed : false,
				//autoFps : Option.autoFps !== undefined ? Option.autoFps : false,

				//penetration: Option.penetration || 0.0399,

			};

			t.timerate = ( 1 / option.fps ) * 1000;
			t.autoFps = option.autoFps;

			type = Type || 'LZMA';
			if ( type === 'LZMA' ) {

				engine.load( option );

			} else {

				blob = document.location.href.replace( /\/[^/]*$/, "/" ) + ( type === 'WASM' ? "./build/ammo.wasm.js" : "./build/ammo.js" );
				engine.startWorker();

			}

		},

		load: function () {

			var xhr = new XMLHttpRequest();
			xhr.responseType = "arraybuffer";
			xhr.open( 'GET', "./build/ammo.hex", true );

			xhr.onreadystatechange = function () {

				if ( xhr.readyState === 4 ) {

					if ( xhr.status === 200 || xhr.status === 0 ) {

						blob = URL.createObjectURL( new Blob( [ LZMAdecompact( xhr.response ) ], { type: 'application/javascript' } ) );
						engine.startWorker();

					} else {

						console.error( "Couldn't load [" + "./build/ammo.hex" + "] [" + xhr.status + "]" );

					}

				}

			};

			xhr.send( null );

		},

		startWorker: function () {

			//blob = document.location.href.replace(/\/[^/]*$/,"/") + "./build/ammo.js" ;

			worker = new Worker( './build/gun.js' );
			worker.postMessage = worker.webkitPostMessage || worker.postMessage;
			worker.onmessage = engine.message;

			// test transferrables
			var ab = new ArrayBuffer( 1 );
			worker.postMessage( { m: 'test', ab: ab }, [ ab ] );
			isBuffer = ab.byteLength ? false : true;

			// start engine worker
			engine.post( 'init', { blob: blob, ArPos: root.ArPos, ArMax: root.ArMax, isBuffer: isBuffer, option: option } );
			root.post = engine.post;

		},

		initArray: function ( Counts ) {

			Counts = Counts || {};

			var counts = {
				maxBody: Counts.maxBody || 1400,
				maxContact: Counts.maxContact || 200,
				maxCharacter: Counts.maxCharacter || 10,
				maxCar: Counts.maxCar || 14,
				maxSoftPoint: Counts.maxSoftPoint || 8192,
			};

			root.ArLng = [
				counts.maxBody * 8, // rigidbody
				counts.maxContact, // contact
				counts.maxCharacter * 8, // hero
				counts.maxCar * 64, // cars
				counts.maxSoftPoint * 3, // soft point
			];

			root.ArPos = [
				0,
				root.ArLng[ 0 ],
				root.ArLng[ 0 ] + root.ArLng[ 1 ],
				root.ArLng[ 0 ] + root.ArLng[ 1 ] + root.ArLng[ 2 ],
				root.ArLng[ 0 ] + root.ArLng[ 1 ] + root.ArLng[ 2 ] + root.ArLng[ 3 ],
			];

			root.ArMax = root.ArLng[ 0 ] + root.ArLng[ 1 ] + root.ArLng[ 2 ] + root.ArLng[ 3 ] + root.ArLng[ 4 ];

		},

		message: function ( e ) {

			var data = e.data;
			if ( data.Ar ) root.Ar = data.Ar;
			//if( data.contacts ) contacts = data.contacts;

			switch ( data.m ) {

				case 'initEngine': engine.initEngine(); break;
				case 'start': engine.start(); break;
				case 'step': engine.step(); break;
					//
					//case 'terrain': terrains.upGeo( data.o.name ); break;

				case 'moveSolid': engine.moveSolid( data.o ); break;
				case 'ellipsoid': engine.ellipsoidMesh( data.o ); break;

				case 'makeBreak': engine.makeBreak( data.o ); break;

				case 'rayCast': rayCaster.receive( data.o ); break;

			}

		},


		initEngine: function () {

			URL.revokeObjectURL( blob );
			blob = null;

			this.initObject();

			console.log( 'AMMO.Worker ' + REVISION + ( isBuffer ? ' with ' : ' without ' ) + 'Buffer #' + type );

			if ( callback ) callback();

		},

		start: function () {

			if( isPause ) return;

			//console.log('start', t.timerate );

			stepNext = true;

			// create tranfere array if buffer
			if ( isBuffer ) root.Ar = new Float32Array( root.ArMax );

			//engine.sendData( 0 );

			//if ( !timer ) timer = requestAnimationFrame( engine.sendData );
			t.then = Time.now();
			if ( interval ) clearInterval( interval );
			interval = setInterval( engine.sendData, t.timerate );


			// test ray
			engine.setMode( oldMode );
			//this.addRayCamera();

		},

		postUpdate: function () {},
		pastUpdate: function () {},

		update: function () {

			engine.postUpdate();

			terrains.step();
			rayCaster.step();

			rigidBody.step( root.Ar, root.ArPos[ 0 ] );
			collision.step( root.Ar, root.ArPos[ 1 ] );
			character.step( root.Ar, root.ArPos[ 2 ] );
			vehicles.step( root.Ar, root.ArPos[ 3 ] );
			softBody.step( root.Ar, root.ArPos[ 4 ] );

		},

		step: function () {

			//engine.stepRemove();

			if ( t.now - 1000 > t.tmp ) {

				t.tmp = t.now; t.fps = t.n; t.n = 0;

			} t.n ++; // FPS
			engine.tell();

			engine.update();
			engine.pastUpdate();

			if ( refView ){
			    //refView.update();
			    refView.updateIntern();
                refView.controler.follow(); 
				//refView.needUpdate( true );
			}
			
			
			engine.stepRemove();
        	engine.stepAdd();

			stepNext = true;

		},

		sendData: function () {

			if ( refView ) if ( refView.pause ) engine.stop();

        	if ( ! stepNext ) return;

			t.now = Time.now();
			t.delta = ( t.now - t.then ) * 0.001;
        	t.then = t.now;

        	if ( isBuffer ) worker.postMessage( { m: 'step', o: { delta: t.delta, key: engine.getKey() }, Ar: root.Ar }, [ root.Ar.buffer ] );
			else worker.postMessage( { m: 'step', o: { delta: t.delta, key: engine.getKey() } } );

			stepNext = false;

		},

		stepRemove: function () {

			if( tmpRemove.length === 0 ) return;
			this.post( 'setRemove', tmpRemove );
			while ( tmpRemove.length > 0 ) this.remove( tmpRemove.pop(), true );

		},

		stepAdd: function () {

			if( tmpAdd.length === 0 ) return;
			//this.post( 'setAdd', tmpAdd );
			while ( tmpAdd.length > 0 ) this.add( tmpAdd.pop() );

		},

		setView: function ( v ) {

			refView = v;
			root.mat = v.getMat();
			root.geo = v.getGeo();
			root.container = v.getScene();

		},

		getFps: function () {

			return t.fps;

		},
		getDelta: function () {

			return t.delta;

		},

		tell: function () {},
		log: function () {},

		getKey: function () {

			return [ 0, 0, 0, 0, 0, 0, 0, 0 ];

		},

		set: function ( o ) {

			o = o || option;
			t.timerate = o.fps !== undefined ? ( 1 / o.fps ) * 1000 : t.timerate;
			t.autoFps = o.autoFps !== undefined ? o.autoFps : false;
			this.post( 'set', o );

		},

		post: function ( m, o ) {

			worker.postMessage( { m:m, o:o } );

		},

		reset: function ( full ) {

			//console.log('reset', full);

			isPause = false;

			oldMode = currentMode;
			engine.setMode( '' );

			engine.stop();

			// remove all mesh
			engine.clear();

			// remove tmp material
			while ( root.tmpMat.length > 0 ) root.tmpMat.pop().dispose();

			engine.postUpdate = function () {};

			tmpRemove = [];
			tmpAdd = [];
			oldFollow = '';

			if ( refView ) refView.reset( full );


			// clear physic object;
			engine.post( 'reset', { full: full } );

		},

		pause: function () {

			isPause = true;

		},

		play: function () {

			if(isPause){
				
				isPause = false;
				engine.start();

			}
		}, 

		stop: function () {

			if ( interval ) {

				clearInterval( interval );
				interval = null;

			}

		},

		destroy: function () {

			worker.terminate();
			worker = undefined;

		},



		////////////////////////////

		addMat: function ( m ) {

			root.tmpMat.push( m );

		},

		ellipsoidMesh: function ( o ) {

			softBody.createEllipsoid( o );

		},

		updateTmpMat: function ( envmap, hdr ) {

			var i = root.tmpMat.length, m;
			while ( i -- ) {

				m = root.tmpMat[ i ];
				if ( m.envMap !== undefined ) {

					if ( m.type === 'MeshStandardMaterial' ) m.envMap = envmap;
					else m.envMap = hdr ? null : envmap;
					m.needsUpdate = true;

				}

			}

		},

		drive: function ( name ) {

			this.post( 'setDrive', name );

		},
		move: function ( name ) {

			this.post( 'setMove', name );

		},


		forces: function ( o ) {

			this.post( 'setForces', o );

		},
		option: function ( o ) {

			this.post( 'setOption', o );

		},
		removes: function ( o ) {

			tmpRemove = tmpRemove.concat( o );

		},
		matrix: function ( o ) {

			this.post( 'setMatrix', o );

		}, //if( o.constructor !== Array ) o = [ o ];

		anchor: function ( o ) {

			this.post( 'addAnchor', o );

		},

		break: function ( o ) {

			this.post( 'addBreakable', o );

		},

		//rayCast: function ( o ) { this.post('rayCast', o ); },

		moveSolid: function ( o ) {

			if ( ! map.has( o.name ) ) return;
			var b = map.get( o.name );
			if ( o.pos !== undefined ) b.position.fromArray( o.pos );
			if ( o.quat !== undefined ) b.quaternion.fromArray( o.quat );

		},

		getBodys: function () {

			return rigidBody.bodys;

		},

		

		

		initObject: function () {

			rigidBody = new RigidBody();
			//constraint = new Constraint();
			softBody = new SoftBody();
			terrains = new Terrain();
			vehicles = new Vehicle();
			character = new Character();
			collision = new Collision();
			rayCaster = new RayCaster();

			// auto define basic function
			//if(!refView) this.defaultRoot();

		},




		clear: function () {

			rigidBody.clear();
			collision.clear();
			terrains.clear();
			vehicles.clear();
			character.clear();
			softBody.clear();
			rayCaster.clear();

			while ( root.extraGeo.length > 0 ) root.extraGeo.pop().dispose();

		},

		//-----------------------------
		// REMOVE
		//-----------------------------

		remove: function ( name, phy ) {

			//if ( ! map.has( name ) ) return;
			var b = engine.byName( name );
			if( b === null ) return;

			switch( b.type ){

				case 'solid': case 'body' :
				    rigidBody.remove( name );
				break;

				case 'soft' :
				    softBody.remove( name );
				break;

				case 'terrain' :
				    terrains.remove( name );
				break;

			}

			// remove physics 
			if( !phy ) this.post( 'remove', name );

		},

		removeConstraint: function ( name ) {

			this.post( 'remove', name );

		},

		removeRay: function ( name ) {

			rayCaster.remove( name );

		},

		//-----------------------------
		// FIND OBJECT
		//-----------------------------

		byName: function ( name ) {

			if ( ! map.has( name ) ) { engine.tell('no find object !!' ); return null; }
			else return map.get( name );

		},

		//-----------------------------
		// ADD
		//-----------------------------

		addGroup: function ( list ) {

			tmpAdd = tmpAdd.concat( list );

		},

		add: function ( o ) {

			o = o || {};
			var type = o.type === undefined ? 'box' : o.type;
			var prev = type.substring( 0, 4 );

			if ( prev === 'join' ) root.post( 'add', o );
			else if ( prev === 'soft' ) softBody.add( o );
			else if ( type === 'terrain' ) terrains.add( o );
			else if ( type === 'character' ) character.add( o );
			else if ( type === 'collision' ) collision.add( o );
			else if ( type === 'car' ) vehicles.add( o );
			else if ( type === 'ray' ) return rayCaster.add( o );
			else return rigidBody.add( o );

		},

		defaultRoot: function () {

			// geometry

			var geo = {
				circle: new THREE.CircleBufferGeometry( 1, 6 ),
				plane: new THREE.PlaneBufferGeometry( 1, 1, 1, 1 ),
				box: new THREE.BoxBufferGeometry( 1, 1, 1 ),
				hardbox: new THREE.BoxBufferGeometry( 1, 1, 1 ),
				cone: new THREE.CylinderBufferGeometry( 0, 1, 0.5 ),
				wheel: new THREE.CylinderBufferGeometry( 1, 1, 1, 18 ),
				sphere: new THREE.SphereBufferGeometry( 1, 16, 12 ),
				highsphere: new THREE.SphereBufferGeometry( 1, 32, 24 ),
				cylinder: new THREE.CylinderBufferGeometry( 1, 1, 1, 12, 1 ),
				hardcylinder: new THREE.CylinderBufferGeometry( 1, 1, 1, 12, 1 ),
			};

			geo.circle.rotateX( - PI90 );
			geo.plane.rotateX( - PI90 );
			geo.wheel.rotateZ( - PI90 );

			root.geo = geo;

			// material

			var wire = false;
			root.mat = {

				move: new THREE.MeshLambertMaterial( { color: 0xFF8811, name: 'move', wireframe: wire } ),
				speed: new THREE.MeshLambertMaterial( { color: 0xFFFF11, name: 'speed', wireframe: wire } ),
				sleep: new THREE.MeshLambertMaterial( { color: 0x1188FF, name: 'sleep', wireframe: wire } ),
				basic: new THREE.MeshLambertMaterial( { color: 0x111111, name: 'basic', wireframe: wire } ),
				static: new THREE.MeshLambertMaterial( { color: 0x1111FF, name: 'static', wireframe: wire } ),
				kinematic: new THREE.MeshLambertMaterial( { color: 0x11FF11, name: 'kinematic', wireframe: wire } ),

			};

			root.container = new THREE.Group();

		},

		getContainer: function () {

			return root.container;

		},

		// BREAKABLE

		makeBreak: function ( o ) {

			var name = o.name;
			if ( ! map.has( name ) ) return;

			if ( convexBreaker === null ) convexBreaker = new ConvexObjectBreaker();

			var mesh = map.get( name );
			// breakOption: [ maxImpulse, maxRadial, maxRandom, levelOfSubdivision ]
			var breakOption = o.breakOption;

			var debris = convexBreaker.subdivideByImpact( mesh, o.pos, o.normal, breakOption[ 1 ], breakOption[ 2 ] ); // , 1.5 ??
			// remove one level
			breakOption[ 3 ] -= 1;
			
			
			// remove original object
			tmpRemove.push( name );

			var i = debris.length;
			while ( i -- ) tmpAdd.push( this.addDebris( name, i, debris[ i ], breakOption ) );

		},

		addDebris: function ( name, id, mesh, breakOption ) {

			var o = {
				name: name + '_debris' + id,
				material: mesh.material,
				type: 'convex',
				shape: mesh.geometry,
				//size: mesh.scale.toArray(),
				pos: mesh.position.toArray(),
				quat: mesh.quaternion.toArray(),
				mass: mesh.userData.mass,
				linearVelocity: mesh.userData.velocity.toArray(),
				angularVelocity: mesh.userData.angularVelocity.toArray(),
				margin: 0.05,
			};

			// if levelOfSubdivision > 0 make debris breakable !!
			if ( breakOption[ 3 ] > 0 ) {

				o.breakable = true;
				o.breakOption = breakOption;

			}

			//this.add( o );

			return o;

		},

		// EXTRA MODE



		setMode: function ( mode ) {

			if ( mode !== currentMode ) {

				if ( currentMode === 'picker' ) engine.removeRayCamera();
				if ( currentMode === 'shoot' ) engine.removeShootCamera();

			}

			currentMode = mode;

			if ( currentMode === 'picker' ) engine.addRayCamera();
			if ( currentMode === 'shoot' ) engine.addShootCamera();

		},

		// CAMERA SHOOT

		addShootCamera: function () {

		},

		removeShootCamera: function () {

		},

		// CAMERA RAY

		removeRayCamera: function () {

			if ( ! refView ) return;
			engine.removeRay( 'cameraRay' );
			refView.removeRay();
			engine.log();

		},

		addRayCamera: function () {

			if ( ! refView ) return;

			ray = engine.add( { name: 'cameraRay', type: 'ray', callback: engine.onRay, mask: 1, visible: false } );// only move body
			refView.activeRay( engine.updateRayCamera, false );

		},

		updateRayCamera: function ( offset ) {

			//ray.setFromCamera( refView.getMouse(), refView.getCamera() );
			if ( mouseMode === 'drag' ) engine.matrix( [{ name:'dragger', pos: offset.toArray(), keepRot:true }] );

		},

		onRay: function ( o ) {

			var mouse = refView.getMouse();
			var control = refView.getControls();
			var name = o.name === undefined ? '' : o.name;

			ray.setFromCamera( mouse, control.object );

			if ( mouse.z === 0 ) {

				if ( mouseMode === 'drag' ){ 
					control.enableRotate = true;
					engine.removeConnector();
				}

				mouseMode = 'free';

			} else {

				if ( mouseMode === 'free' ) {

					if ( name ) {

						if( mouseMode !== 'drag' ){

							refView.setDragPlane( o.point );
						    control.enableRotate = false;
						    engine.addConnector( o );
						    mouseMode = 'drag';

						} 

					} else {

						mouseMode = 'rotate';

					}

				}

				/*if ( mouseMode === 'drag' ){

					physic.matrix( [{ name:'dragger', pos: refView.getOffset().toArray() }] );

				}*/

			}

			// debug
			engine.log( mouseMode + '   ' + name );

		},

		addConnector: function ( o ) {

			//if ( ! map.has( o.name ) ) { console.log('no find !!'); return;}
			//var mesh = map.get( o.name );

			var mesh = engine.byName( o.name );
			if( mesh === null ) return;

			// reste follow on drag
			engine.testCurrentFollow( o.name );  


			var p0 = new THREE.Vector3().fromArray( o.point );
			var qB = mesh.quaternion.toArray();
			var pos = engine.getLocalPoint( p0, mesh ).toArray();

			engine.add({ 
				name:'dragger', type:'sphere', size:[0.1], 
				pos:o.point,
				quat: qB, 
				mass:0, 
				kinematic: true,
				group:32,
				mask:32, 
			});

			engine.add({ 
				name:'connector', 
				type:'joint_fixe', 
				b1:'dragger', b2:o.name, 
				pos1:[0,0,0], pos2:pos,
				collision:false 
			});
		},

		removeConnector: function () {

			engine.remove( 'dragger');
			engine.removeConstraint( 'connector');

			if( oldFollow !== '' ) engine.setCurrentFollow( oldFollow );

		},

		getLocalPoint: function (vector, mesh) {
			
			mesh.updateMatrix();
			//mesh.updateMatrixWorld(true);
			var m1 = new THREE.Matrix4();
			var s = new THREE.Vector3(1,1,1);
			var m0 = new THREE.Matrix4().compose( mesh.position, mesh.quaternion, s );
			m1.getInverse( m0 );
			return vector.applyMatrix4( m1 );

		},

		setCurrentFollow: function ( name, o ) {

			if( !refView ) return;
			var target = engine.byName( name );
            if( target !== null ) refView.getControls().initFollow( target, o );
            else refView.getControls().resetFollow();
            oldFollow = '';

		},


		testCurrentFollow: function ( name ) {

			oldFollow = '';
			if( !refView ) return;
			if( !refView.getControls().followTarget ) return;
			if( refView.getControls().followTarget.name === name ){ 
				refView.getControls().resetFollow();
				oldFollow = name;
			}

		},



	};

	return engine;

} )();
