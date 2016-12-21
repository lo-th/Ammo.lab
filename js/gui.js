var gui = ( function () {
    
    'use strict';

    var content;

    var g;
    var settings = {

        flat_shading: false,
        trader_map: true,

        debug: false,
        
    }

    gui = {

        init: function () {

            content = document.createElement('div');
            document.body.appendChild( content );



            /*g = new UIL.Gui( { width:150, bg:'rgba(30,30,30,0.1)' } );
            var f = g.add( 'fps', { res:70 } );

            g.add(settings, 'flat_shading', { type:'Bool', p:60, inh:16 } ).onChange( view.setShading );
            g.add(settings, 'trader_map', { type:'Bool', p:60, inh:16 } ).onChange( view.setTraderMap );

            g.add(settings, 'DEBUG', { type:'Bool', p:60, inh:16 } ).onChange( view.setDebug );

            g.add('button', { name:'PEOPLES', p:0 }).onChange( function(){ view.initCrowd() } );
            g.add('button', { name:'PHYSICS', p:0 }).onChange( function(){ view.initAmmo() } );

            f.show();*/

        },
        initJoysticks: function() {

            var j = UIL.add('joystick', {  target:content, pos:{ left:'auto', right:'100px', top:'auto', bottom:'10px' }, name:'JOY', width:100, multiplicator:1, precision:2, fontColor:'#D4B87B' });



        }

    }

    return gui;

})();