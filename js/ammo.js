/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    AMMO worker launcher
*/


// transphere array for AMMO worker
var Br, Cr, Jr, Hr, Sr;

var ammo = ( function () {

    'use strict';

    var pause = false;

    var worker, callback, blob;
    var isDirect, isBuffer, isDynamic;

    var timestep = 1/60;//0.017;//1/60;
    var substep = 2;//7;

    var timerate = timestep * 1000;
    
    
    var sendTime = 0;
    var delay = 0;

    var time = 0;
    var temp = 0;
    var count = 0;
    var fps = 0;

    var timer = 0;

    ammo = {

        init: function ( Callback, direct, buff ) {

            isBuffer = buff || false;
            isDirect = direct || false;

            callback = Callback;

            worker = new Worker('./js/ammo.worker.js');
            worker.onmessage = this.message;
            worker.postMessage = worker.webkitPostMessage || worker.postMessage;

            if( isDirect ) blob = document.location.href.replace(/\/[^/]*$/,"/") + "./libs/ammo3.js";
            else blob = extract.get('ammo3');

            // test transferrables
            /*var ab = new ArrayBuffer(1);
            worker.postMessage(ab, [ab]);
            if (ab.byteLength) isBuffer = false;
            else{ isBuffer = true; isDynamic = true }*/

            worker.postMessage( { m:'init', blob:blob, isBuffer: isBuffer, isDynamic: isDynamic, timestep:timestep, substep:substep });
            
        },

        onInit: function () {

            window.URL.revokeObjectURL( blob );
            if( !isDirect ) extract.clearBlob('ammo3');
            blob = null;

            if( callback ) callback();

        },

        start: function ( o ) {

            if( isBuffer ){ 
                
                Br = o.Br;
                Cr = o.Cr;
                Hr = o.Hr;
                Jr = o.Jr;
                Sr = o.Sr;

            }

            pause = false;
            if(isBuffer) timer = setTimeout( ammo.sendData, 10 );
            else timer = setInterval( ammo.sendData, timerate );
           
        },

        message: function( e ) {

            var data = e.data;

            switch( data.m ){
                case 'init': ammo.onInit(); break;
                case 'step': ammo.step( data ); break;
                case 'ellipsoid': view.ellipsoidMesh( data.o ); break;
                case 'start': ammo.start( data ); break;
            }

        },

        step: function ( o ) {

            if( pause ) return;

            time = Date.now();//now();
            if ( (time - 1000) > temp ){ temp = time; fps = count; count = 0; }; count++;

            Br = o.Br;
            Cr = o.Cr;
            Hr = o.Hr;
            Jr = o.Jr;
            Sr = o.Sr;

            view.needUpdate( true );

            if( isBuffer ){
                delay = ( timerate - ( time - sendTime ));
                delay = delay < 0 ? 0 : delay;
                timer = setTimeout( ammo.sendData, delay );
            }
            
        },

        sendData: function (){

            
            if( isBuffer ){
                sendTime = Date.now();
                if( isDynamic ) worker.postMessage( { m:'step', key:user.getKey() });
                else worker.postMessage( { m:'step', key:user.getKey(), Br:Br, Cr:Cr, Hr:Hr, Jr:Jr, Sr:Sr }, [ Br.buffer, Cr.buffer, Hr.buffer, Jr.buffer, Sr.buffer ]);
                tell( 'THREE '+ view.getFps() + ' | AMMO ' + fps +' | '+ delay.toFixed(1) +' ms' );
            } else { 
                worker.postMessage( { m:'step', key:user.getKey() });
                tell( 'THREE '+ view.getFps() + ' | AMMO ' + fps );
            }
            
            
        },

        send: function ( m, o ) {

            worker.postMessage( { m:m, o:o });

        },

        reset: function( full ) {

            if( isBuffer ) clearTimeout( timer );
            else clearInterval( timer )

            pause = true;
            view.needUpdate( false );

            view.reset();

            sendTime = 0;
            delay = 0;
            worker.postMessage( { m:'reset', full:full });

        },
    }

    return ammo;

})();