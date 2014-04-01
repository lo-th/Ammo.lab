/**
 * ammo.js and Worker for three.js 2014
 * @author LoTh / http://3dflashlo.wordpress.com/
 */

'use strict';
var world;
var bodys=[];
var matrix = [];

var infos = [];

var fps=0, time, time_prev=0, fpsint = 0;
var dt = 1.0/60.0;
var isTimout = false;
var timer, delay, timerStep, timeStart=0;

var ToRad = Math.PI / 180;

self.onmessage = function (e) {
	var phase = e.data.tell;
	if(phase === "INIT"){
		importScripts(e.data.url);
		importScripts("AMMO.Three.js");
		INITWORLD();
	}
	if(phase === "ADD") {
		new AMMO.Rigid(e.data.obj);
	}
	if(phase === "SET") {
		bodys[e.data.id].set(e.data.obj);
	}


}


//--------------------------------------------------
//   WORLD UPDATE
//--------------------------------------------------

var update = function(){

	timeStart = Date.now();
	world.stepSimulation(dt, 10);
	
	var i =  bodys.length;
	
    while (i--) {
        //getMatrix(i);
        bodys[i].getMatrix();
    }

	worldInfo();
	self.postMessage({tell:"RUN", infos:infos, matrix:matrix });

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
	var broadPhase = new Ammo.btDbvtBroadphase();
	world = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadPhase, solver, collisionConfig);
	world.setGravity(new Ammo.btVector3(0, -100, 0));
	timerStep = dt * 1000;

	self.postMessage({tell:"START"});

	if(isTimout) update(); else timer = setInterval(update, timerStep);
}
