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
    'car_advanced', 'car_basic','car_multy', 'car_Breakers', 'car_terrain',
    'moto_basic','moto_akira',
    'kinematics', 'kineBody',
    'soft_cloth', 'soft_rope', 'soft_rope2', 'soft_box', 'soft_pig', 'soft_ball', 'soft_convex',// 'soft_basic', // ,
    'character', 'joints', 'empty',  'asteroid', 'point2point', 'contact', 'testmesh', 'water',
    'mecanum', 'drone', 'millions', 'basketball',
    'compound', 'tower', 
    'break_glass', 'break_round',
    'rayTest',
    'ghost', 'fps',
    'test_kinect',
];

demos.sort();

var view, demo, physic;
var demoName = 'basic';
var currentMode = '';

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
    physic.log = editor.log;
    physic.tell = function () { editor.tell( 'three '+ view.getFps() + ' / ammo ' + physic.getFps() );  }
    //physic.tell = function () { editor.tell( 'three '+ view.getFps() + ' / ammo ' + Math.floor(physic.getDelta()*1000) );  }
    physic.getKey = function () { return user.key; }



    // for update envmap
    //view.extraUpdateMat = physic.updateTmpMat;

    editor.init( launch, isWithCode, '#308AFF', 'Ammo.lab' );
    editor.addExtraOption( physic.setMode );
    view.setRefEditor( editor );

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

function follow ( name, o ) { 

    physic.setCurrentFollow( name, o );

};

function ui ( option ) { editor.setOption( option ); };
