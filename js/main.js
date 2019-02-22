/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    AMMO LAB MAIN
*/

'use strict';

var demos = [ 
    'basic', 'terrain', 'terrainPlus', 'supermaket', 'collision', 'ragdoll',
    'car_advanced', 'car_basic','car_multy', 'car_Breakers',
    'kinematics', 'kineBody',
    'soft_cloth', 'soft_rope', 'soft_rope2', 'soft_box', 'soft_pig', 'soft_ball', 'soft_convex',// 'soft_basic', // ,
    'character', 'joints', 'empty',  'asteroid', 'point2point', 'contact', 'testmesh', 'water',
    'mecanum', 'drone', 'millions', 'basketball',
    'compound', 'tower', 
    'break_glass', 'break_round'
];

demos.sort();

var view, demo, physic;
var demoName = 'basic';

//////////////////////////////

var isWithCode = false;

function init(){

    view = new View();
    view.init( initAmmo );

}

function initAmmo () {

    physic = SHOT.engine;
    physic.init( next );

    // test
    //view.updateIntern = physic.update;
    
}

function next(){

    //intro.clear();
    physic.setView( view );
    physic.tell = function () { editor.tell( 'three '+ view.getFps() + ' / physic ' + physic.getFps() );  }
    physic.getKey = function () { return user.key;  }

    // for update envmap
    view.extraUpdateMat = physic.updateTmpMat;

    editor.init( launch, isWithCode, '#308AFF', 'Ammo.lab' );

    //physic.setView( view );
    //physic.tell = function () { editor.tell( 'three '+ view.getFps() + ' / physic ' + physic.getFps() );  }
    //physic.getKey = function () { return user.key;  }

    physic.start();

    ready();

}

function unPause () {

    physic.start();

}

function ready () {

    var hash = location.hash.substr( 1 );
    if(hash !=='') demoName = hash;
    editor.load('demos/' + demoName + '.js');

}

function launch ( name, full ) {

    physic.reset( full );
    demo = new window['demo'];

}

function cam ( o ) { 
    o = o || {};
    o.x = o.x === undefined ? 0 : o.x;
    o.y = o.y === undefined ? 0 : o.y;
    o.z = o.z === undefined ? 0 : o.z;
    view.moveCam( o ); 
};

function follow ( name, o ) { 

    var target = physic.byName( name );
    if( target !== undefined ) view.getControls().initFollow( target, o );
    else view.getControls().resetFollow();

};

function ui ( option ) { editor.setOption( option ); };


/*function remove ( o ) {

    
    physic.post( 'remove', o );
   // view.removeList( o );

};*/