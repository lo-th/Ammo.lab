/**
 * ammo.js and Worker for three.js 2014
 * @author LoTh / http://3dflashlo.wordpress.com/
 */

'use strict';

var world;
var bodys = [];
var vehicles = [];
var characters = [];
var matrix = [];

var infos = [];

var fps=0, time, time_prev=0, fpsint = 0;
var dt = 1/60;
var iteration = 2;
var isTimout = false;
var timer, delay, timerStep, timeStart=0;

var ToRad = Math.PI / 180;

self.onmessage = function (e) {
	var phase = e.data.tell;
	if(phase === "INIT"){
		importScripts(e.data.AmmoUrl);
		//importScripts("ammo.js");
		importScripts("AMMO.Three.js");

		INITWORLD();
	}
	
	if(phase === "ADD") {
		var id = AMMO.ID++;
		bodys[id] = new AMMO.Rigid(e.data.obj);
	    matrix[id] = new Float32Array(8);
	}
	if(phase === "SET") {
		if(bodys[e.data.id])bodys[e.data.id].set(e.data.obj);
	}
	if(phase === "CLEAR") CLEARWORLD();
	if(phase === "START") STARTWORLD(e.data.option || {});
		
	


}


//--------------------------------------------------
//   WORLD UPDATE
//--------------------------------------------------

var update = function(){

	if(isTimout) timeStart = Date.now();

	world.stepSimulation(dt, iteration);
	
	var i = AMMO.ID;
	
    while (i--) {
        bodys[i].getMatrix(i);
    }

	worldInfo();
	self.postMessage({tell:"RUN", infos:infos, matrix:matrix });

	if(isTimout){
        delay = timerStep - (Date.now()-timeStart);
        timer = setTimeout(update, delay);
    }

}

var worldInfo = function(){
	time = Date.now();
    if (time - 1000 > time_prev) { time_prev = time; fpsint = fps; fps = 0; } fps++;
    infos[0] = fpsint;
    infos[1] = bodys.length;
}

var INITWORLD = function(){
	var solver = new Ammo.btSequentialImpulseConstraintSolver();
	var collisionConfig = new Ammo.btDefaultCollisionConfiguration();
	var dispatcher = new Ammo.btCollisionDispatcher(collisionConfig);
	
    // var broadPhase = new Ammo.btAxisSweep3(new Ammo.btVector3(-1000,-1000,-1000),new Ammo.btVector3(1000,1000,1000), 16384); //4096;
    var broadPhase = new Ammo.btDbvtBroadphase();

	world = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadPhase, solver, collisionConfig);
	world.setGravity(new Ammo.btVector3(0, -100, 0));
	
	self.postMessage({tell:"INIT"});
}

var STARTWORLD = function(option){
	if(option.isTimout) isTimout = option.isTimout;
	if(option.interation) iteration = option.interation;
	if(option.timerstep) dt = option.timerstep;
	if(option.G)world.setGravity(new Ammo.btVector3(0, option.G, 0));


	timerStep = dt * 1000;
	if(isTimout) update(); else timer = setInterval(update, timerStep);
}

var CLEARWORLD = function(){
	if(isTimout)clearTimeout(timer);
	else clearInterval(timer);
	AMMO.Clear();

	self.postMessage({tell:"CLEAR"});
}


