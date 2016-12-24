/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    AMMO worker launcher
*/

var ammo = ( function () {

    'use strict';

    var worker, callback;

    var isBuffer = false;
    var timestep = 1/60;//0.017;//1/60;
    var substep = 2;//7;

    // main transphere array
    //var ar, dr, hr, jr, sr;

    var timerate = timestep * 1000;
    
    
    var sendTime = 0;
    var delay = 0;

    var time = 0;
    var temp = 0;
    var count = 0;
    var fps = 0;

    var timer = 0;
    var needDelete = true;

    ammo = {//function () {};

        init: function ( Callback, direct, buff ) {

            isBuffer = buff || false;

            callback = Callback;

            worker = new Worker('./js/ammo.worker.js');

            worker.onmessage = this.message;
            worker.postMessage = worker.webkitPostMessage || worker.postMessage;

            var blob;

            if( direct ){
                var blob = document.location.href.replace(/\/[^/]*$/,"/") + "libs/ammo.js";
                needDelete = false;
                //worker.postMessage( { m: 'init', blob:blob, isBuffer: isBuffer, timestep:timestep, substep:substep });
            }else{
                blob = extract.get('ammo');
            }

            //worker.postMessage( { m: 'init', blob:blob, isBuffer: isBuffer, timestep:timestep, substep:substep, Br:Br, Cr:Cr, Hr:Hr, Jr:Jr, Sr:Sr });
            worker.postMessage( { m: 'init', blob:blob, isBuffer: isBuffer, timestep:timestep, substep:substep });
            
        },

        onInit: function () {

            if( needDelete ) extract.clearBlob('ammo');
            if( callback ) callback();

        },

        start: function () {

            ammo.send('start');

        },

        message: function( e ) {

            var data = e.data;

            switch( data.m ){
                case 'init': ammo.onInit( data ); break;
                case 'step': ammo.step( data ); break;
                case 'ellipsoid': view.ellipsoidMesh( data.o ); break;
            }

        },

        step: function ( data ) {

            if(!isBuffer) ammo.send( 'key', { key:user.getKey() } );

            time = now();
            if ( (time - 1000) > temp ){ temp = time; fps = count; count = 0; }; count++;
            
            Br = data.Br;
            Cr = data.Cr;
            Hr = data.Hr;
            Jr = data.Jr;
            Sr = data.Sr;

            view.needUpdate();

            if( isBuffer ){ 

                delay = ~~ ( timerate - ( time - sendTime ));
                delay = delay < 0 ? 0 : delay;
                timer = setTimeout( ammo.sendData, delay );

            } else {

                //user.update();
                //worker.postMessage( { m:'key', key:user.getKey() } );
                
                tell( 'THREE '+ view.getFps() + ' | AMMO ' + fps +' | '+ delay +'ms' );

            } 

        },

        sendData: function (){

            clearTimeout( timer );
            //clearInterval( timer );
            sendTime = now();

            user.update();
            var key = user.getKey();

            worker.postMessage( { m:'step', key:key, Br:Br, Cr:Cr, Hr:Hr, Jr:Jr, Sr:Sr } , [ Br.buffer, Cr.buffer, Hr.buffer, Jr.buffer, Sr.buffer ] );
            //else worker.postMessage( { m:'step', key:key } );

            var f = view.getFps();
            tell( 'THREE '+ f + ' | AMMO ' + fps +' | '+ delay +'ms' );

            //tell( key );
            
        },

        send: function ( m, o ) {

            worker.postMessage( { m:m, o:o });

        },
        //ammo.send( 'key', { key:user.getKey() } );


        reset: function( full ) {

            if( isBuffer ) clearTimeout( timer );
            worker.postMessage( { m:'reset', full:full });

        },
    }

    return ammo;

})();