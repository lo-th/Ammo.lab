/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    AMMO worker ultimate manager
*/

'use strict';

var ammo = ( function () {

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

    ammo = function () {};

    ammo.init = function ( Callback, direct ) {

        callback = Callback;

        worker = new Worker('js/Ammo.worker.js');

        worker.onmessage = this.message;
        worker.postMessage = worker.webkitPostMessage || worker.postMessage;

        var blob;

        if(direct){
            var blob = document.location.href.replace(/\/[^/]*$/,"/") + "libs/ammo.js";
            needDelete = false;
            //worker.postMessage( { m: 'init', blob:blob, isBuffer: isBuffer, timestep:timestep, substep:substep });
        }else{
            blob = extract.get('ammo');
        }

        //worker.postMessage( { m: 'init', blob:blob, isBuffer: isBuffer, timestep:timestep, substep:substep, Br:Br, Cr:Cr, Hr:Hr, Jr:Jr, Sr:Sr });
        worker.postMessage( { m: 'init', blob:blob, isBuffer: isBuffer, timestep:timestep, substep:substep });
        
    };

    ammo.message = function( e ) {

        var m = e.data.m;
       

        if(m === 'init'){

            if( needDelete ) extract.clearBlob('ammo');
            if( callback ) callback();

        }

        if(m === 'ellipsoid'){
            view.ellipsoidMesh( e.data.o );
        }

        if(m === 'step'){

            time = now();
            if ( (time - 1000) > temp ){ temp = time; fps = count; count = 0; }; count++;
            
            Br = e.data.Br;
            Cr = e.data.Cr;
            Hr = e.data.Hr;
            Jr = e.data.Jr;
            Sr = e.data.Sr;

            // delay
            //delay = ( timerate - ( time - sendTime ) ).toFixed(2);
            //if(delay < 0) delay = 0;



            //delay = ~~ ( timerate - ( time - sendTime ));
            //delay = delay < 0 ? 0 : delay;

            

            

            view.update();

            //view.update( ar, dr, hr, jr, sr );
            if( isBuffer ){ 
                delay = ~~ ( timerate - ( time - sendTime ));
                delay = delay < 0 ? 0 : delay;
                timer = setInterval( sendData, delay );
            } else {

                user.update();
                worker.postMessage( { m:'key', key:user.getKey() } );
                tell( 'THREE '+ view.getFps() + ' | AMMO ' + fps +' | '+ delay +'ms' );

            } 

            

            //view.bodyStep();
            //view.heroStep();
            //view.carsStep();
            //view.softStep();

            //timer = setTimeout( sendData , delay );

        }

    };

    function sendData(){

        clearTimeout(timer);
        //clearInterval( timer );
        sendTime = now();

        user.update();
        var key = user.getKey();

        //if( isBuffer ) 
        worker.postMessage( { m:'step', key:key, Br:Br, Cr:Cr, Hr:Hr, Jr:Jr, Sr:Sr } , [ Br.buffer, Cr.buffer, Hr.buffer, Jr.buffer, Sr.buffer ] );
        //else worker.postMessage( { m:'step', key:key } );

        var f = view.getFps();
        tell( 'THREE '+ f + ' | AMMO ' + fps +' | '+ delay +'ms' );

        //tell( key );
        
    };

    ammo.send = function ( m, o ) {

        worker.postMessage( { m:m, o:o });

    }

    ammo.reset = function( full ) {

        worker.postMessage( { m:'reset', full:full });

    };

    return ammo;

})();