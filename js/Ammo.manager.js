/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    AMMO worker ultimate manager
*/

var now;

(function(w){
    var perfNow;
    var perfNowNames = ['now', 'webkitNow', 'msNow', 'mozNow'];
    if(!!w['performance']) for(var i = 0; i < perfNowNames.length; ++i){
        var n = perfNowNames[i];
        if(!!w['performance'][n]){
            perfNow = function(){return w['performance'][n]()};
            break;
        }
    }
    if(!perfNow) perfNow = Date.now;
    now = perfNow;
})(window);


var ammo = ( function () {

    var worker, callback;

    var isBuffer = true;
    var timestep = 1/60;
    var substep = 7;

    // main transphere array
    var ar, dr, hr, jr, cr;

    var timerate = timestep * 1000;
    var fps = 0;
    var time = 0;
    var sendTime = 0;
    var delay = 0;
    var temp = 0;
    var count = 0;
    var timer = 0;

    ammo = function () {};

    ammo.init = function ( Callback ) {

        callback = Callback;

        worker = new Worker('js/Ammo.worker.js');

        worker.onmessage = this.message;
        worker.postMessage = worker.webkitPostMessage || worker.postMessage;
        worker.postMessage( { m: 'init', blob: extract.get('ammo'), isBuffer: isBuffer, timestep:timestep, substep:substep });

    };

    ammo.message = function( e ) {

        var m = e.data.m;
       

        if(m == 'init'){

            extract.clearBlob('ammo');
            if(callback) callback();

        }

        if(m == 'step'){

            time = now();
            
            ar = e.data.ar;
            dr = e.data.dr;
            hr = e.data.hr;
            jr = e.data.jr;
            cr = e.data.cr;

            //view.update( ar, dr );

            //time = now();

            // delay
            delay = ( timerate - ( time - sendTime ) ).toFixed(2);
            if(delay < 0) delay = 0;

            // fps
            if ( (time - 1000) > temp ){ temp = time; fps = count; count = 0; }; count++;

            

            timer = setTimeout( sendData , delay );
            view.update( ar, dr, hr, jr, cr );
            //timer = setInterval( sendData, delay );

        }

    };

    function sendData(){

        clearTimeout(timer);
        //clearInterval( timer );
        sendTime = now();

        if( isBuffer ) worker.postMessage( { m:'step', key:view.getKey(), ar:ar, dr:dr, hr:hr, jr:jr, cr:cr } , [ ar.buffer, dr.buffer, hr.buffer, jr.buffer, cr.buffer ] );
        else worker.postMessage( { m:'step', key:view.getKey() } );

        tell( delay +' ms<br>' + fps +' fps');
        

    };

    ammo.send = function ( m, o ) {

        worker.postMessage( { m:m, o:o });

    }

    ammo.reset = function() {

        worker.postMessage( { m:'reset' });

    };

    return ammo;

})();