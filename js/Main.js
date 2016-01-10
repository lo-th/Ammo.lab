/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    AMMO LAB MAIN
*/

'use strict';

// main transphere array
var Br, Cr, Jr, Hr, Sr;

/*
var Br = new Float32Array( 1000*8 ); // rigid buffer max 1000
var Cr = new Float32Array( 14*56 ); // car buffer max 14 / 6 wheels
var Jr = new Float32Array( 100*4 ); // joint buffer max 100
var Hr = new Float32Array( 10*8 ); // hero buffer max 10
var Sr = new Float32Array( 8192*3 ); // soft buffer nVertices x,y,z
*/


var demos = [ 
    'basic', 'terrain', 'supermaket', 'car', 'collision', 'ragdoll',
    'kinematics', 'multyCars', 'snowboard', 'cloth', 'rope', 'ellipsoid',
    'softmesh', 'softmeshbase', 'pigtest', 'testmesh', 'meshmove',
    'character', 'meca', 'joints'
];

var demo;
var demoName = 'basic';

//////////////////////////////




function loop () {

    view.render();
    requestAnimationFrame(loop);

};

function ready () {

    var hash = location.hash.substr( 1 );

    if(hash !=='') demoName = hash;
    editor.load('demos/' + demoName + '.js');

};

function launch (name) {

    location.hash = name;

    ammo.reset();
    view.reset();

    demo = new window['demo'];

};

function add ( o ) { view.add( o ); };

function joint ( o ) { if(!o.type) o.type = 'joint'; view.add( o ); };

function substep ( substep ) { ammo.send( 'substep', {substep:substep} ) ; };

function car ( o ) { view.vehicle( o ); };

function character ( o ) { view.character( o ); };

function cam ( h,v,d,t ){

    t = { x:0, y:0, z:0 }
    view.moveCamera( h, v, d, 0, t );

};

function tell ( str ) { view.tell( str ); };

function load ( name, callback ) { view.load( name, callback ); };

function anchor ( o ) { ammo.send( 'anchor', o ); };