/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    CROWD worker launcher
*/

var crowd = ( function () {

    'use strict';

    var worker = null;
    var blob = null;
    var callbackInit = null, callback = null;
    var isDirect, isBuffer;

    var timestep = 1/60;

    // transfer array
    //var ar = new Float32Array( 100 * 5 );

    crowd = {

        init: function ( Callback, direct, buff ){

            isBuffer = buff || false;
            isDirect = direct || false;

            callback = Callback;

            worker = new Worker( './js/worker/worker.crowd.js' );
            worker.onmessage = this.message;
            worker.postMessage = worker.webkitPostMessage || worker.postMessage;


            if( isDirect ) blob = document.location.href.replace(/\/[^/]*$/,"/") + "./libs/crowd.js";
            else blob = extract.get('crowd');
            
            worker.postMessage( { m: 'init', blob:blob, isBuffer: isBuffer, timestep:timestep, substep:substep });
            
        },

        onInit: function () {

            window.URL.revokeObjectURL( blob );
            if( !isDirect ) extract.clearBlob('crowd');
            blob = null;
            
            if( callback ) callback();

        },

        start: function () {

            crowd.send('start');

        },

        post: function ( o, buffer ) {

            if( isBuffer ) worker.postMessage( o, buffer );
            else worker.postMessage( o );

        },

        message: function ( e ) {

            var data = e.data;

            switch( data.message ){
                case 'init':
                    crowd.onInit();
                    /*URL.revokeObjectURL( blob );
                    callbackInit( 'crowd init' );
                    if( isBuffer ) crowd.post( { message: 'start', isBuffer: true, ar: ar }, [ ar.buffer ] );
                    else crowd.post( { message: 'start', isBuffer: false, ar: ar } );*/
                break;
                case 'run':
                    Ar = data.ar;

                    view.needCrowdUpdate();
                    //callback( ar );
                    if( isBuffer ) crowd.post( { message: 'run', ar: Ar }, [ Ar.buffer ] );
                break;
            }

        },

        send: function ( m, o ) {

            worker.postMessage( { m:m, o:o });

        },

    }

    

    return crowd;

})();