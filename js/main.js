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
    'soft_cloth', 'soft_rope', 'soft_rope2', 'soft_box', 'soft_pig',// 'soft_basic', 'soft_ball',// 'soft_convex',
    'character', 'joints', 'empty',  'asteroid', 'point2point', 'contact', 'testmesh', 'water',
    'mecanum', 'drone', 'millions'
];

demos.sort();

var view, demo, physic;
var demoName = 'basic';

//////////////////////////////

var isWithCode = false;

function init(){

    view = new View();

    //intro.init();

    view.init( initAmmo );

}

function initAmmo () {

    physic = SHOT.engine;
    physic.init( next );
    
}

function next(){

    //intro.clear();
    physic.setView( view );
    physic.tell = function () { editor.tell( 'three '+ view.getFps() + ' / physic ' + physic.getFps() );  }
    physic.getKey = function () { return user.key;  }

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

function launch ( name ) {

    var full = true;
    var hash = location.hash.substr( 1 );
    if( hash === name ) full = false;

    location.hash = name;

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

/*function add ( o ) { return physic.add( o ); };

//function joint ( o ) { o.type = o.type == undefined ? 'joint' : o.type; physic.add( o ); };

//function character ( o ) { view.character( o ); };
//function car ( o ) { view.vehicle( o ); };

function drive ( name ) { physic.post('setDrive', { name:name }); };
function move ( name ) { physic.post('setMove', { name:name }); };
function angle ( angle ) { physic.post('setAngle', { angle:angle }); };

function substep ( substep ) { physic.post( 'substep', {substep:substep} ) ; };

function tell ( str ) { editor.tell( str ); };



function load ( name, callback ) { view.loadObject( name, callback ); };

function anchor ( o ) { physic.post( 'addAnchor', o ); };

function gravity ( a ) { physic.post( 'setGravity', {gravity:a} ); };

//function water ( o ) { physic.send( 'gravity', o ); };

function force ( o ) { physic.post('setForces', [o] ); };
function forceArray ( o ) { physic.post('setForces', o ); };

function matrix ( o ) { physic.post('setMatrix', [o] ); };
function matrixArray ( o ) { physic.post('setMatrix', o ); };

function set ( o ) { physic.post( 'set', o ); };

//function addContact ( o ) { return physic.post( 'addContact', o ); };
*/

function remove ( o ) {

    
    physic.post( 'remove', o );
   // view.removeList( o );

};