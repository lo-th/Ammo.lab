/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    AMMO LAB MAIN
*/

'use strict';

var demos = [ 
    'basic', 'terrain', 'terrainPlus', 'supermaket', 'car', 'collision', 'ragdoll',
    'kinematics', 'multyCars', 'cloth', 'rope', 'rope2', 'ellipsoid', 'drone', 'kineBody',
    'softmesh', 'softmeshbase', 'pigtest', 'testmesh', 'meshmove',
    'character', 'mecanum', 'joints', 'empty', 'human', 'asteroid', 'point2point', 
];

demos.sort();

var view, demo;
var demoName = 'basic';

//////////////////////////////

var isWithCode = false;
var isWasm = false;

function init(){

    user.init();

    view = new View();

    intro.init();

    view.init( initAmmo );

}

function initAmmo () {

    ammo.init( next, isWasm );
    
}

function next(){

    intro.clear();

    editor.init( launch, isWithCode, '#6888FF', 'Ammo.lab' );
    ammo.start();

    ready();

}

function unPause () {

    ammo.start();

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

    ammo.reset( full );

    demo = new window['demo'];

}

function cam ( o ) { view.moveCam( o ); };

function follow ( name, o ) { view.setFollow( name, o ); };

function add ( o ) { return view.add( o ); };

function joint ( o ) { o.type = o.type == undefined ? 'joint' : o.type; view.add( o ); };

function character ( o ) { view.character( o ); };

function car ( o ) { view.vehicle( o ); };

function drive ( name ) { view.setDriveCar( name ); };

function substep ( substep ) { ammo.send( 'substep', {substep:substep} ) ; };

function tell ( str ) { editor.tell( str ); };

function load ( name, callback ) { view.loadObject( name, callback ); };

function anchor ( o ) { ammo.send( 'anchor', o ); };

function gravity ( a ) { ammo.send( 'gravity', {g:a} ); };

function water ( o ) { ammo.send( 'gravity', o ); };

function force ( o ) { ammo.send('force', o ); };
function forceArray ( o ) { ammo.send('forceArray', o ); };

function matrix ( o ) { ammo.send('matrix', o ); };
function matrixArray ( o ) { ammo.send('matrixArray', o ); };

function set ( o ) { ammo.send( 'set', o ); };