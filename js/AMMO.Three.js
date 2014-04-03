/**
 * ammo.js and Worker for three.js 2014
 * @author LoTh / http://3dflashlo.wordpress.com/
 */
 
'use strict';
var AMMO={ REVISION: 'DEV.0.1' };

AMMO.ID = 0;


AMMO.Clear = function(){
	var i = AMMO.ID;
    while (i--) {
        world.removeRigidBody(bodys[i].body);
        Ammo.destroy( bodys[i].body );
    }
    world.clearForces();

    if(terrain!== null) terrain = null;
    bodys.length = 0;
    matrix.length = 0;
    AMMO.ID = 0;
}

//--------------------------------------------------
//  RIGIDBODY
//--------------------------------------------------

AMMO.Rigid = function(obj){
	this.body = null;
	this.forceUpdate = false;
	this.add(obj);
}

AMMO.Rigid.prototype = {
    constructor: AMMO.Rigid,
    add:function(obj){
    	var size = obj.size || [1,1,1];
    	var div = obj.div || [64,64];
		var pos = obj.pos || [0,0,0];
		var rot = obj.rot || [0,0,0];
		// phy = [friction, restitution];
		var phy = obj.phy || [0.5,0];
		var noSleep = obj.noSleep || false;

		var shape;
		
		switch(obj.type){
			case 'box':case 'boxbasic':case 'dice':case 'ground': shape = new Ammo.btBoxShape(new Ammo.btVector3(size[0]*0.5, size[1]*0.5, size[2]*0.5)); break;
			case 'sphere': shape = new Ammo.btSphereShape(size[0]); break;
			case 'capsule': shape = new Ammo.btCapsuleShape(size[0]*0.5, size[1]*0.5); break;
			case 'cylinder': shape = new Ammo.btCylinderShape(new Ammo.btVector3(size[0], size[1]*0.5, size[2]*0.5)); break;
			case 'cone': shape = new Ammo.btConeShape(size[0]*0.5, size[1]*0.5); break;
			case 'mesh': shape = new Ammo.btBoxShape(new Ammo.btVector3(size[0]*0.5, size[1]*0.5, size[2]*0.5)); break;
			case 'convex': shape = new Ammo.btBoxShape(new Ammo.btVector3(size[0]*0.5, size[1]*0.5, size[2]*0.5)); break;
			case 'terrain': 
			    terrain = new AMMO.Terrain(div, size);
			    shape = terrain.shape;
			break;
		}

		var transform = new Ammo.btTransform();
		transform.setIdentity();
		// position
		transform.setOrigin(new Ammo.btVector3(pos[0], pos[1], pos[2]));
		// rotation
		var q = new Ammo.btQuaternion();
		q.setEulerZYX(rot[2]*ToRad,rot[1]*ToRad,rot[0]*ToRad);
		transform.setRotation(q);

		var mass = obj.mass || 0;
		// static
		if(mass == 0) this.forceUpdate = true;

		var localInertia = new Ammo.btVector3(0, 0, 0);
		shape.calculateLocalInertia(mass, localInertia);
		var myMotionState = new Ammo.btDefaultMotionState(transform);
		var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, shape, localInertia);

		this.body = new Ammo.btRigidBody(rbInfo);
		this.body.setFriction(phy[0]);
		this.body.setRestitution(phy[1]);
		if(noSleep)this.body.setActivationState(Ammo.DISABLE_DEACTIVATION);//this.body.setFlags(4);

		world.addRigidBody(this.body);
		this.body.activate();
    },
    set:function(obj){
    	var v = new Ammo.btVector3(0,0,0);
    	this.body.setLinearVelocity(v);
    	this.body.setAngularVelocity(v);
    	this.body.clearForces();
    	if(obj.pos){ this.body.getCenterOfMassTransform().setOrigin(new Ammo.btVector3(obj.pos[0], obj.pos[1], obj.pos[2]));}
    	if(obj.rot){
    		var q = new Ammo.btQuaternion();
    		q.setEulerZYX(obj.rot[2]*ToRad,obj.rot[1]*ToRad,obj.rot[0]*ToRad);
    		this.body.getCenterOfMassTransform().setRotation(q);
    	}
    },
    getMatrix:function(id){
    	var m = matrix[id];
    	if(this.forceUpdate){ m[0] = 1; this.forceUpdate=false;}
		else m[0] = this.body.getActivationState();

		if(m[0]==2) return;

	    var t = this.body.getWorldTransform();
	    var r = t.getRotation();
	    var p = t.getOrigin();

	    m[1] = r.x();
	    m[2] = r.y();
	    m[3] = r.z();
	    m[4] = r.w();

	    m[5] = p.x();
	    m[6] = p.y();
	    m[7] = p.z();
    }
}

//--------------------------------------------------
//  TERRAIN
//--------------------------------------------------

AMMO.Terrain = function(div, size){
	this.div = div;
	this.size = size;
	this.fMax = div[0]*div[1];
	this.maxHeight = 100;
	this.ptr = Ammo.allocate(this.fMax*4, "float", Ammo.ALLOC_NORMAL);
    this.shape = new Ammo.btHeightfieldTerrainShape(this.div[0], this.div[1], this.ptr, 1, -this.maxHeight, this.maxHeight, 1, 0, false);
	this.shape.setUseDiamondSubdivision(true);
	var localScaling = new Ammo.btVector3(this.size[0]/this.div[0],1,this.size[2]/this.div[1]);
	this.shape.setLocalScaling(localScaling);
}

AMMO.Terrain.prototype = {
	constructor: AMMO.Terrain,
    update:function(Hdata){
    	var i = this.fMax;
    	while(i--){
	    	Ammo.setValue(this.ptr+(i<<2), Hdata[i], 'float');
	    }
    }
}

//--------------------------------------------------
//  VEHICLE
//--------------------------------------------------

AMMO.Vehicle = function(obj){

}

AMMO.Vehicle.prototype = {
	constructor: AMMO.Vehicle,
    add:function(obj){

    }
}