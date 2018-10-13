/**   _  _____ _   _   
*    | ||_   _| |_| |
*    | |_ | | |  _  |
*    |___||_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    AMMO worker launcher
*/


// transphere array for AMMO worker

var Ar;
var contacts = [];
var contactCallback = [];

var ArLng = [ 
    10 * 8, // hero
    14 * 56, // cars
    1000 * 8, // rigid
    8192 * 3,  // soft
    100 * 4, // joint
];

var ArPos = [ 
    0, 
    ArLng[0], 
    ArLng[0] + ArLng[1],
    ArLng[0] + ArLng[1] + ArLng[2],
    ArLng[0] + ArLng[1] + ArLng[2] + ArLng[3],
];

var ArMax = ArLng[0] + ArLng[1] + ArLng[2] + ArLng[3] + ArLng[4];



var ammo = ( function () {

    'use strict';

    var worker, callback, blob;
    var isBuffer = false;

    var isPause = false;

    var timerate = (1/60) * 1000;

    var time = 0;
    var then = 0;
    var delta = 0;
    var temp = 0;
    var count = 0;
    var fps = 0;

    var isWasm = true;

    var stepNext = false;
    var timer = undefined;


    ammo = {

        init: function ( Callback, wasm, Option ) {

            isWasm = wasm !== undefined ? wasm : true;
            Option = Option || {};

            callback = Callback;

            var option = {

                worldscale: Option.worldscale || 1,
                gravity: Option.gravity || [0,-10,0],
                fps: Option.fps || 60,

                substep: Option.substep || 2,
                broadphase: Option.broadphase || 2,
                soft: Option.soft !== undefined ? Option.soft : true,

                //penetration: Option.penetration || 0.0399,

            };

            if( option.fps !== undefined ) timerate = (1/option.fps) * 1000;

            worker = new Worker('./build/ammo.worker.min.js');
            worker.onmessage = this.message;
            worker.postMessage = worker.webkitPostMessage || worker.postMessage;

            blob = document.location.href.replace(/\/[^/]*$/,"/") + ( isWasm ? "./build/ammo.wasm.js" : "./build/ammo.js" );

            // test transferrables
            var ab = new ArrayBuffer(1);
            worker.postMessage( ab, [ab] );
            isBuffer = ab.byteLength ? false : true;

            // start physics worker
            worker.postMessage( { m:'init', blob:blob, settings:[ ArLng, ArPos, ArMax ], isBuffer:isBuffer, option:option });
            
        },

        message: function( e ) {

            var data = e.data;
            if( data.Ar ) Ar = data.Ar;
            if( data.contacts ) contacts = data.contacts;

            switch( data.m ){
                case 'initEngine': ammo.initEngine(); break;
                case 'start': ammo.start( data ); break;
                case 'step': ammo.step(); break;
                case 'ellipsoid': view.ellipsoidMesh( data.o ); break;
                case 'terrain': view.completeTerrain( data.o.name ); break;
            }

        },

        updateContact: function () {

            contactCallback.forEach( function ( callb, id ) {

                callb( contacts[id] || 0 );

            });

        },

        initEngine: function () {

            window.URL.revokeObjectURL( blob );
            blob = null;

            console.log( "AMMO worker init with Buffer: " + isBuffer + " | Wasm version: " + isWasm );

            if( callback ) callback();

        },

        start: function ( o ) {

            stepNext = true;

            // create tranfere array if buffer
            if( isBuffer ) Ar = new Float32Array( ArMax );

            if ( !timer ) timer = requestAnimationFrame( ammo.sendData );
           
        },

        step: function () {

            if ( (time - 1000) > temp ){ temp = time; fps = count; count = 0; }; count++;

            view.needUpdate( true );

            ammo.updateContact();

            stepNext = true;
            
        },

        sendData: function ( stamp ){

            if( view.pause ){ timer = null; return; }

            timer = requestAnimationFrame( ammo.sendData );
            time = stamp === undefined ? now() : stamp;
            delta = time - then;

            if ( delta > timerate ) {

                then = time - ( delta % timerate );

                if( stepNext ){

                    if( isBuffer ) worker.postMessage( { m:'step',  key:user.key, Ar:Ar }, [ Ar.buffer ] );
                    else worker.postMessage( { m:'step',  key:user.key } );
                    
                    stepNext = false;

                }

                tell( 'three '+ view.getFps() + ' / ammo ' + fps );

            }

        },

        send: function ( m, o ) {

            if( m === 'contact' ){ contactCallback.push(o.f); delete(o.f); }

            if( m === 'set' ){ 
                o = o || {};
                if( o.fps !== undefined ) timerate = (1/o.fps) * 1000;
            }

            worker.postMessage( { m:m, o:o } );

        },

        reset: function( full ) {

            if ( timer ) {
               window.cancelAnimationFrame( timer );
               timer = undefined;
            }

            contactCallback = [];
            
            view.reset();

            worker.postMessage( { m:'reset', full:full });

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
        
    }

    return ammo;

})();