var crowd = ( function () {

    'use strict';

    var worker = null;
    var blob = null;
    var callbackInit = null, callback = null;
    var useTransferrable = false;

    // transfer array
    var ar = new Float32Array( 100 * 5 );

    crowd = {

        load: function ( CallbackInit, Callback ) {

            callbackInit = CallbackInit === undefined ? function(){} : CallbackInit;
            callback = Callback === undefined ? function(){} : Callback;

            var xml = new XMLHttpRequest();
            xml.responseType = 'arraybuffer';
            xml.onload = this.start;
            xml.open( 'GET', './js/worker/crowd.z', true );
            xml.send( null );

        },

        start: function ( e ) {

            var result = new TextDecoder("utf-8").decode( SEA3D.File.LZMAUncompress( e.target.response ) );
            blob = URL.createObjectURL( new Blob( [ result ], { type: 'application/javascript' } ) );

            worker = new Worker( './js/worker/worker.crowd.js' );
            worker.onmessage = crowd.onmessage;
            worker.postMessage = worker.webkitPostMessage || worker.postMessage;

            crowd.post( { message: 'init', blob: blob, fps:30, iteration:1, timeStep:0.5 } );

        },

        post: function ( o, buffer ) {

            if( useTransferrable ) worker.postMessage( o, buffer );
            else worker.postMessage( o );

        },

        onmessage: function ( e ) {

            var data = e.data;

            switch( data.message ){
                case 'init':
                    URL.revokeObjectURL( blob );
                    callbackInit( 'crowd init' );
                    if( useTransferrable ) crowd.post( { message: 'start', useTransferrable: true, ar: ar }, [ ar.buffer ] );
                    else crowd.post( { message: 'start', useTransferrable: false, ar: ar } );
                break;
                case 'run':
                    ar = data.ar;
                    callback( ar );
                    if( useTransferrable ) crowd.post( { message: 'run', ar: ar }, [ ar.buffer ] );
                break;
            }

        }

    }

    

    return crowd;

})();