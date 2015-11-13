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
    var ar = new Float32Array( 1000*8 );
    var dr = new Float32Array( 20*40 );

    var d = [16.666, 0, 0];

    ammo = function () {};

    ammo.init = function ( Callback ) {

        callback = Callback;

        console.log('init Engine')

        worker = new Worker('js/Ammo.worker.js');
        worker.onmessage = this.message;
        worker.postMessage = worker.webkitPostMessage || worker.postMessage;
        worker.postMessage( { m:'init', blob: extract.get('ammo') });

    };

    ammo.message = function( e ) {

        var m = e.data.m;
       

        if(m == 'init'){

            //extract.clearBlob('ammo');
            if(callback) callback();

            ammo.post( 'step' );

            return;

        }

        if(m == 'step'){
            
            ar = e.data.ar;
            dr = e.data.dr;

            view.update(ar);


            d[1] = d[0]-(now()-d[2]);
            d[1] = d[1]<0 ? 0 : d[1];
            
            setTimeout(function(){ ammo.post( m ); } , d[1] );

        }

    };

    ammo.post = function( m ) {

        d[2] = now();
        worker.postMessage( { m:m, ar:ar, dr:dr } , [ ar.buffer, dr.buffer ] );

    };

    ammo.add = function( o ) {

        worker.postMessage( { m:'add', o:o });

    };

    ammo.reset = function() {
        ar = new Float32Array( 1000*8 );
        dr = new Float32Array( 20*40 );

        worker.postMessage( { m:'reset' });

    };

    return ammo;

})();