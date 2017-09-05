/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    AMMO worker launcher
*/


// transphere array for AMMO worker

var Ar;

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



//var Br, Cr, Jr, Hr, Sr;

var ammo = ( function () {

    'use strict';

    var pause = false;

    var worker, callback, blob;
    var isDirect, isBuffer, isDynamic;

    var timestep = 1/60;
    var timerate = timestep * 1000;
    var substep = 2;//7;
    var time = 0;
    var then = 0;
    var delta = 0;
    var temp = 0;
    var count = 0;
    var fps = 0;

    //var sendTime = 0;
    //var delay = 0;

    var timer;

   // var sab, ia;

    var buff;

    ammo = {

        init: function ( Callback, direct, buff ) {

            // test buffer
            //sab = new SharedArrayBuffer( Float32Array.BYTES_PER_ELEMENT * 1024 );
            //sab = new ArrayBuffer( Float32Array.BYTES_PER_ELEMENT * 1024 );
            //ia = new Float32Array(sab);

            //ia[37] = 0.123456;
            //Atomics.store(ia, 37, 123456);

            //console.log(Float32Array.BYTES_PER_ELEMENT)

            isBuffer = buff || false;
            isDirect = direct || false;

            callback = Callback;

            //worker = new Worker('./js/ammo.worker.js');
            worker = new Worker('./build/ammo.worker.min.js');
            worker.onmessage = this.message;
            worker.postMessage = worker.webkitPostMessage || worker.postMessage;

            if( isDirect ) blob = document.location.href.replace(/\/[^/]*$/,"/") + "./libs/ammo.js";
            else blob = extract.get('ammo');

            // test transferrables
            /*var ab = new ArrayBuffer(1);
            worker.postMessage(ab, [ab]);
            if (ab.byteLength) isBuffer = false;
            else{ isBuffer = true; isDynamic = false }*/

            worker.postMessage( { m:'init', blob:blob, isBuffer: isBuffer, isDynamic: isDynamic, timestep:timestep, substep:substep, settings:[ ArLng, ArPos, ArMax ] });
            
        },

        onInit: function () {

            window.URL.revokeObjectURL( blob );
            if( !isDirect ) extract.clearBlob('ammo');
            blob = null;

            if( callback ) callback();

        },

        start: function ( o ) {

            if( isBuffer ){ 

                buff = o.aAr;
                Ar = new Float32Array( buff );

                //Ar = o.Ar;
                
                /*Br = o.Br;
                Cr = o.Cr;
                Hr = o.Hr;
                Jr = o.Jr;
                Sr = o.Sr;*/

            }

            pause = false;
            //if( isBuffer ) timer = setTimeout( ammo.sendData, 10 );
            //else timer = setInterval( ammo.sendData, timerate );
            //timer = requestAnimationFrame( ammo.sendData );

            // start loop
            ammo.sendData();
           
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

            /*if(o.n === 0 ) Ar = [];

            Ar.push(o.result);

            if (o.n === ArMax-1 ) {

                time = Date.now();//now();
                if ( (time - 1000) > temp ){ temp = time; fps = count; count = 0; }; count++;

                view.needUpdate( true );
            }*/

            

            //time = Date.now();//now();
            if ( (time - 1000) > temp ){ temp = time; fps = count; count = 0; }; count++;

            /*
            Br = new Float32Array( o.Br );
            Cr = new Float32Array( o.Cr );
            Hr = new Float32Array( o.Hr );
            Jr = new Float32Array( o.Jr );
            Sr = new Float32Array( o.Sr );
            */
            //Ar = [];
            //Ar.push( JSON.parse( o.Ar ) );

            

            //if (Ar.length === o.len) {
                //console.debug("Complete!");
          //      view.needUpdate( true );
            //}

            //Ar = o.Ar;

            /*Br = o.Br;
            Cr = o.Cr;
            Hr = o.Hr;
            Jr = o.Jr;
            Sr = o.Sr;*/

            if( isBuffer ){ 
                buff = o.aAr;
                Ar = new Float32Array( buff );
            }

            else Ar = o.Ar;

            //Ar = JSON.parse( o.Ar );
            
            //Ar = new Float32Array( o.Ar );

            view.needUpdate( true );

            /*if( isBuffer ){

                delay = ( timerate - ( time - sendTime ));
                delay = delay < 0 ? 0 : delay;
                timer = setTimeout( ammo.sendData, delay );

            }*/
            
        },

        sendData: function ( stamp ){

            if (pause) return;

            timer = requestAnimationFrame( ammo.sendData );
            time = stamp === undefined ? now() : stamp;
            delta = time - then;

            if ( delta > timerate ) {

                then = time - ( delta % timerate );

                if( isBuffer ) worker.postMessage( { m:'step',  key:user.getKey(), aAr:buff }, [ buff ] );
                else worker.postMessage( { m:'step',  key:user.getKey() });

                tell( 'THREE '+ view.getFps() + ' | AMMO ' + fps );

            }

            
            /*if( isBuffer ){
                sendTime = Date.now();
                //if( isDynamic ) worker.postMessage( { m:'step', key:user.getKey() });
                //else worker.postMessage( { m:'step', key:user.getKey(), Br:Br, Cr:Cr, Hr:Hr, Jr:Jr, Sr:Sr }, [ Br.buffer, Cr.buffer, Hr.buffer, Jr.buffer, Sr.buffer ]);
                //else worker.postMessage( { m:'step', key:user.getKey(), Ar:Ar }, [ Ar.buffer ]);

                worker.postMessage( { m:'step', stamp:stamp,  key:user.getKey(), aAr:buff }, [ buff ]);
                tell( 'THREE '+ view.getFps() + ' | AMMO ' + fps +' | '+ delay.toFixed(1) +' ms' );
            } else { 
                worker.postMessage( { m:'step', stamp:stamp, key:user.getKey() });
                tell( 'THREE '+ view.getFps() + ' | AMMO ' + fps );
            }*/
            
            
        },

        send: function ( m, o ) {

            worker.postMessage( { m:m, o:o });

        },

        reset: function( full ) {

            pause = true;

            if (timer) cancelAnimationFrame(timer);
            

            //if( isBuffer ) clearTimeout( timer );
            //else clearInterval( timer )

            
            view.needUpdate( false );

            view.reset();

            //sendTime = 0;
            //delay = 0;
            worker.postMessage( { m:'reset', full:full });

        },
    }

    return ammo;

})();