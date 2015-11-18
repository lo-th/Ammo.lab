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

    //var ar, dr;
    var ar;// = new Float32Array( 1000*8 );
    var dr;// = new Float32Array( 20*40 );

    //var d = [16.667, 0, 0];
    var d = [16, 0, 0];
    var delta = 0;

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

            //ammo.post( 'step' );

            return;

        }

        if(m == 'step'){

            
            
            ar = e.data.ar;
            dr = e.data.dr;

            view.update( ar, dr );

            delta = now() - d[2];
            d[1] = Math.max(0, d[0] - ( delta ) );

            ammo.post( m );

            //view.update(ar);

            

            //delta = now() - d[2];

            //d[1] = Math.max(0, d[0] - ( delta ) );
            //d[1] = d[0] - ( delta );
            //d[1] = d[1] < 0 ? 0 : d[1];
            
            //setTimeout( function(){ ammo.post( m ); } , d[1] );

            //ammo.post( m );

        }

    };

    ammo.post = function( m ) {

        d[2] = now();

        //console.log(d[1]*0.001)
        
        //worker.postMessage( { m:m, time:d[1]*0.001, ar:ar, dr:dr } , [ ar.buffer, dr.buffer ] );
        worker.postMessage( { m:m, t:d[1], ar:ar, dr:dr } , [ ar.buffer, dr.buffer ] );

        //view.update(ar);

    };

    ammo.send = function ( m, o ) {

        worker.postMessage( { m:m, o:o });

    }

    ammo.reset = function() {

        //ar = new Float32Array( 1000*8 );
        //dr = new Float32Array( 20*40 );

        worker.postMessage( { m:'reset' });

    };

    return ammo;

})();