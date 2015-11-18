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

    // main transphere array
    var ar, dr;

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
        worker.postMessage( { m:'init', blob: extract.get('ammo')  });

    };

    ammo.message = function( e ) {

        var m = e.data.m;
       

        if(m == 'init'){

            extract.clearBlob('ammo');
            if(callback) callback();

        }

        if(m == 'step'){
            
            ar = e.data.ar;
            dr = e.data.dr;

            view.update( ar, dr );

            time = now();

            // delay
            delay = (16.67 - ( time - sendTime )).toFixed(2);
            if(delay < 0) delay = 0;

            // fps
            if ( (time - 1000) > temp ){ temp = time; fps = count; count = 0; }; count++;

            tell( delay +' ms<br>' + fps +' fps');

            //timer = setTimeout( this.post , delay );
            timer = setInterval( sendData, delay );

        }

    };

    function sendData(){

        //clearTimeout(timer);
        clearInterval( timer );
        sendTime = now();
        worker.postMessage( { m:'step', ar:ar, dr:dr } , [ ar.buffer, dr.buffer ] );

    };

    ammo.send = function ( m, o ) {

        worker.postMessage( { m:m, o:o });

    }

    ammo.reset = function() {

        worker.postMessage( { m:'reset' });

    };

    return ammo;

})();