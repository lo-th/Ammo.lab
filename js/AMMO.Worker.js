/**   _     _   _     
*    | |___| |_| |__
*    | / _ \  _|    |
*    |_\___/\__|_||_|
*    @author LoTh /http://3dflashlo.wordpress.com/
*/

// ammo.js and Worker for three.js

'use strict';
var Module = { TOTAL_MEMORY: 256*1024*1024 };

var world = null;

var dt = 1/60;
var isTimout = false;
var timer, delay, timerStep, timeStart=0;

self.onmessage = function (e) {

	var phase = e.data.tell;

	if(phase == "INIT") INIT(e.data.AmmoUrl);
	if(phase == "CLEAR") CLEARWORLD();
	if(phase == "START") STARTWORLD(e.data.option || {});
	
	if(phase == "ADD") world.addBody(e.data.obj);
	if(phase == "CAR") world.addCar(e.data.obj);
	if(phase == "SET") if( world.bodys[e.data.id] ) world.bodys[e.data.id].set(e.data.obj);
	if(phase == "UPTERRAIN") if(world.terrain!== null) world.terrain.update(e.data.Hdata);
	if(phase == "KEY") world.setKey(e.data.key);
	
}

var INIT = function(url){
	importScripts(url);
	importScripts("AMMO.Three.js");
	self.postMessage({tell:"INIT"});
}

var UPDATE = function(){

	if(isTimout) timeStart = Date.now();

	world.step();

	self.postMessage({tell:"RUN", mtx:world.mtx, mtxCar:world.mtxCar, infos:world.infos });

	if(isTimout){
        delay = timerStep - (Date.now()-timeStart);
        if(delay < 0) dalay = 0;
        timer = setTimeout(update, delay);
    }

}

var STARTWORLD = function(obj){

	world = new AMMO.World(obj);

	if(obj.isTimout) isTimout = obj.isTimout;
	if(obj.timestep) dt = obj.timestep;

	timerStep = dt * 1000;
	if(isTimout) UPDATE(); 
	else timer = setInterval(UPDATE, timerStep);
	
}

var CLEARWORLD = function(){

	if(isTimout)clearTimeout(timer);
	else clearInterval(timer);

	world.clear();

	self.postMessage({tell:"CLEAR"});

}