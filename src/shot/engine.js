/*global THREE*/
import { RigidBody } from './RigidBody.js';
import { SoftBody } from './SoftBody.js';
import { Terrain } from './Terrain.js';
import { Vehicle } from './Vehicle.js';
import { Character } from './Character.js';
import { Collision } from './Collision.js';
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
    
    var t = { now:0, delta:0, then:0, inter:0, tmp:0, n:0, timerate:0 };
    var timer = undefined;
    var stepNext = false;
    var refView = null;
    var isBuffer = false;
    var isPause = false;

    var PI90 = 1.570796326794896;

    var rigidBody, softBody, constraint, terrains, vehicles, character, collision;

    var option = {

        worldscale: 1,
        gravity: [0,-10,0],
        fps: 60,

        substep: 2,
        broadphase: 2,
        soft: true,

    }

    engine = {

        init: function ( Callback, Type, Option, Counts ) {

            this.initArray( Counts );
            this.defaultRoot();

            Option = Option || {};

            callback = Callback;

            option = {
                fps: Option.fps || 60,
                worldscale: Option.worldscale || 1,
                gravity: Option.gravity || [0,-10,0],
                substep: Option.substep || 2,
                broadphase: Option.broadphase || 2,
                soft: Option.soft !== undefined ? Option.soft : true,

                //penetration: Option.penetration || 0.0399,

            };

            t.timerate = ( 1 / option.fps ) * 1000;

            type = Type || 'LZMA';
            if( type === 'LZMA' ){ 
                engine.load( option );
            } else {
                blob = document.location.href.replace(/\/[^/]*$/,"/") + ( type === 'WASM' ? "./build/ammo.wasm.js" : "./build/ammo.js" );
                engine.startWorker();
            }

        },

        load: function () {

            var xhr = new XMLHttpRequest(); 
            xhr.responseType = "arraybuffer";
            xhr.open( 'GET', "./build/ammo.hex", true );

            xhr.onreadystatechange = function () {

                if ( xhr.readyState === 4 ) {
                    if ( xhr.status === 200 || xhr.status === 0 ){
                        blob = URL.createObjectURL( new Blob([ LZMAdecompact( xhr.response ) ], { type: 'application/javascript' }));
                        engine.startWorker();
                    }else{ 
                        console.error( "Couldn't load ["+ "./build/ammo.hex" + "] [" + xhr.status + "]" );
                    }
                }
            }

            xhr.send( null );

        },

        startWorker: function () {

           //blob = document.location.href.replace(/\/[^/]*$/,"/") + "./build/ammo.js" ;

            worker = new Worker('./build/gun.js');
            worker.postMessage = worker.webkitPostMessage || worker.postMessage;
            worker.onmessage = engine.message;

            // test transferrables
            var ab = new ArrayBuffer(1);
            worker.postMessage( { m:'test', ab:ab }, [ab] );
            isBuffer = ab.byteLength ? false : true;

            // start engine worker
            engine.post( 'init', { blob:blob, ArPos:root.ArPos, ArMax:root.ArMax, isBuffer:isBuffer, option:option } );
            root.post = engine.post;

        },

        initArray : function ( Counts ) {

            Counts = Counts || {}

            var counts = {
                maxBody: Counts.maxBody || 1000,
                maxContact: Counts.maxContact || 200,
                maxCharacter: Counts.maxCharacter || 10, 
                maxCar: Counts.maxCar || 14,
                maxSoftPoint: Counts.maxSoftPoint || 8192,
            }

            root.ArLng = [ 
                counts.maxBody * 8, // rigidbody
                counts.maxContact , // contact
                counts.maxCharacter * 8, // hero
                counts.maxCar * 56, // cars
                counts.maxSoftPoint * 3,  // soft point
            ];

            root.ArPos = [ 
                0, 
                root.ArLng[0], 
                root.ArLng[0] + root.ArLng[1],
                root.ArLng[0] + root.ArLng[1] + root.ArLng[2],
                root.ArLng[0] + root.ArLng[1] + root.ArLng[2] + root.ArLng[3],
            ];

            root.ArMax = root.ArLng[0] + root.ArLng[1] + root.ArLng[2] + root.ArLng[3] + root.ArLng[4];

        },

        message: function( e ) {

            var data = e.data;
            if( data.Ar ) root.Ar = data.Ar;
            //if( data.contacts ) contacts = data.contacts;

            switch( data.m ){
                case 'initEngine': engine.initEngine(); break;
                case 'start': engine.start( data ); break;
                case 'step': engine.step(); break;
                //
                //case 'terrain': terrains.upGeo( data.o.name ); break;

                case 'moveSolid': engine.moveSolid( data.o ); break;
                case 'ellipsoid': engine.ellipsoidMesh( data.o ); break;
            }

        },


        initEngine: function () {

            URL.revokeObjectURL( blob );
            blob = null;

            this.initObject();

            console.log( 'AMMO.Worker '+ REVISION + ( isBuffer ? ' with ':' without ' ) + 'Buffer #'+ type );

            if( callback ) callback();

        },

        start: function ( o ) {

            stepNext = true;

            // create tranfere array if buffer
            if( isBuffer ) root.Ar = new Float32Array( root.ArMax );

            engine.sendData( 0 );

            //if ( !timer ) timer = requestAnimationFrame( engine.sendData );
           
        },

        postUpdate: function () {},

        step: function () {

            if ( t.now - 1000 > t.tmp ){ t.tmp = t.now; t.fps = t.n; t.n = 0; }; t.n++; // FPS

            // TODO
            
            engine.postUpdate();
            engine.steps();
            if( refView ) refView.needUpdate( true );
            //engine.updateContact();

            stepNext = true;
            
        },

        sendData: function ( time ){

            if( refView ){
                if( refView.pause ){ timer = null; return; }
            }

            timer = requestAnimationFrame( engine.sendData );
            t.now = time;
            t.delta = t.now - t.then;

            if ( t.delta > t.timerate ) {

                t.then = t.now - ( t.delta % t.timerate );

                if( stepNext ){

                    if( isBuffer ) worker.postMessage( { m:'step',  o:{ key: engine.getKey() }, Ar:root.Ar }, [ root.Ar.buffer ] );
                    else worker.postMessage( { m:'step', o:{ key: engine.getKey() } } );
                    
                    stepNext = false;

                }

                engine.tell();

            }

        },

        setView: function ( v ) { 

            refView = v; 

            root.mat = v.getMat();
            root.geo = v.getGeo();
            root.container = v.getScene();

        },

        getFps: function () { return t.fps; },

        tell: function () {},
        
        getKey: function () { return [0,0,0,0,0,0,0,0]; },

        set: function ( o ) {

            o = o || option;
            t.timerate = o.fps !== undefined ? (  1 / o.fps ) * 1000 : t.timerate;
            this.post( 'set', o );

        },

        post: function ( m, o ) {

            worker.postMessage( { m:m, o:o } );

        },

        reset: function( full ) {

            console.log('reset', full);

            if ( timer ) {
               window.cancelAnimationFrame( timer );
               timer = undefined;
            }

            // remove all mesh
            engine.clear();

            // remove tmp material
            while ( root.tmpMat.length > 0 ) root.tmpMat.pop().dispose();

            engine.postUpdate = function (){};
            
            if( refView ) refView.reset( full );

            // clear physic object;
            engine.post( 'reset', { full:full } );

        },

        stop: function () {

            if ( timer ) {
               window.cancelAnimationFrame( timer );
               timer = undefined;
            }

        },

        destroy: function (){

            worker.terminate();
            worker = undefined;

        },



        ////////////////////////////

        addMat : function ( m ) { root.tmpMat.push( m ); },

        ellipsoidMesh: function ( o ) {

            softBody.createEllipsoid( o );

        },

        updateTmpMat : function ( envmap, hdr ) {
            var i = root.tmpMat.length, m;
            while( i-- ){
                m = root.tmpMat[i];
                if( m.envMap !== undefined ){
                    if( m.type === 'MeshStandardMaterial' ) m.envMap = envmap;
                    else m.envMap =  hdr ? null : envmap;
                    m.needsUpdate = true;
                }
            }
        },




        drive: function ( name ) { this.post('setDrive', { name:name } ); },
        move: function ( name ) { this.post('setMove', { name:name } ); },


        forces: function ( o ) { this.post('setForces', o ); },
        option: function ( o ) { this.post('setOption', o ); },
        remove: function ( o ) { this.post('setRemove', o ); },
        matrix: function ( o ) { this.post('setMatrix', o ); },//if( o.constructor !== Array ) o = [ o ]; 

        anchor: function ( o ) { this.post('addAnchor', o ); },

        moveSolid: function ( o ) {

            if ( ! map.has( o.name ) ) return;
            var b = map.get( o.name );
            if( o.pos !== undefined ) b.position.fromArray( o.pos );
            if( o.quat !== undefined ) b.quaternion.fromArray( o.quat );

        },

        getBodys: function () {

            return rigidBody.bodys;

        },

        byName: function ( name ) {

            return map.get( name );

        },

        initObject: function () {

            rigidBody = new RigidBody();
            constraint = new Collision();
            //constraint = new Constraint();
            softBody = new SoftBody();
            terrains = new Terrain();
            vehicles = new Vehicle();
            character = new Character();
            collision = new Collision();

            // auto define basic function
            //if(!refView) this.defaultRoot();

        },

        steps: function () {

            terrains.step();
            rigidBody.step( root.Ar, root.ArPos[ 0 ] );
            collision.step( root.Ar, root.ArPos[ 1 ] );
            character.step( root.Ar, root.ArPos[ 2 ] );
            vehicles.step( root.Ar, root.ArPos[ 3 ] );
            softBody.step( root.Ar, root.ArPos[ 4 ] );

        },

        clear: function ( o ) {

            rigidBody.clear();
            collision.clear();
            terrains.clear();
            vehicles.clear();
            character.clear();
            softBody.clear();

            while( root.extraGeo.length > 0 ) root.extraGeo.pop().dispose();

        },


        addGroup: function ( list ) {

            for( var i = 0, lng = list.length; i < lng; i++ ){
                this.add( list[i] );
            }

        },

        add: function ( o ) {

            o = o || {};
            var type = o.type === undefined ? 'box' : o.type;
            var prev = type.substring( 0, 4 );

            if( prev === 'join' ) root.post( 'add', o );
            else if( prev === 'soft' ) softBody.add( o );
            else if( type === 'terrain' ) terrains.add( o );
            else if( type === 'character' ) character.add( o );
            else if( type === 'collision' ) collision.add( o );
            else if( type === 'car' ) vehicles.add( o );
            else return rigidBody.add( o );

        },

        defaultRoot: function () {

            // geometry

            var geo = {
                circle:     new THREE.CircleBufferGeometry( 1,6 ),
                plane:      new THREE.PlaneBufferGeometry(1,1,1,1),
                box:        new THREE.BoxBufferGeometry(1,1,1),
                hardbox:    new THREE.BoxBufferGeometry(1,1,1),
                cone:       new THREE.CylinderBufferGeometry( 0,1,0.5 ),
                wheel:      new THREE.CylinderBufferGeometry( 1,1,1, 18 ),
                sphere:     new THREE.SphereBufferGeometry( 1, 16, 12 ),
                highsphere: new THREE.SphereBufferGeometry( 1, 32, 24 ),
                cylinder:   new THREE.CylinderBufferGeometry( 1,1,1,12,1 ),
                hardcylinder: new THREE.CylinderBufferGeometry( 1,1,1,12,1 ),
            };

            geo.circle.rotateX( -PI90 );
            geo.plane.rotateX( -PI90 );
            geo.wheel.rotateZ( -PI90 );

            root.geo = geo;

            // material

            var wire = false;
            root.mat = {

                move: new THREE.MeshLambertMaterial({ color:0xFF8811, name:'move', wireframe:wire }),
                speed: new THREE.MeshLambertMaterial({ color:0xFFFF11, name:'speed', wireframe:wire }),
                sleep: new THREE.MeshLambertMaterial({ color:0x1188FF, name:'sleep', wireframe:wire }),
                basic: new THREE.MeshLambertMaterial({ color:0x111111, name:'basic', wireframe:wire }),
                static: new THREE.MeshLambertMaterial({ color:0x1111FF, name:'static', wireframe:wire }),
                kinematic: new THREE.MeshLambertMaterial({ color:0x11FF11, name:'kinematic', wireframe:wire }),

            };

            root.container = new THREE.Group();

        },

        getContainer: function () {

            return root.container;

        },
        
    }

    return engine;

})();