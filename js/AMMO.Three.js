'use strict';
var AMMO={ REVISION: 'DEV.0.1' };

AMMO.nextID = 0;

//--------------------------------------------------
//  RIGIDBODY
//--------------------------------------------------

AMMO.Rigid = function(obj){
	this.id = AMMO.nextID++;
	
	this.body = null;
	this.forceUpdate = false;

	this.add(obj);

	bodys[this.id] = this;
	matrix[this.id] = new Float32Array(8);

}

AMMO.Rigid.prototype = {
    constructor: AMMO.Rigid,
    add:function(obj){
    	var size = obj.size || [1,1,1];
		var pos = obj.pos || [0,0,0];
		var rot = obj.rot || [0,0,0];

		var shape;
		
		switch(obj.type){
			case 'box': shape = new Ammo.btBoxShape(new Ammo.btVector3(size[0]*0.5, size[1]*0.5, size[2]*0.5)); break;
			case 'sphere': shape = new Ammo.btSphereShape(size[0]*0.5); break;
			case 'capsule': shape = new Ammo.btCapsuleShape(size[0]*0.5, size[1]*0.5); break;
			case 'cylinder': shape = new Ammo.btCylinderShape(new Ammo.btVector3(size[0]*0.5, size[1]*0.5, size[2]*0.5)); break;
			case 'cone': shape = new Ammo.btConeShape(size[0]*0.5, size[1]*0.5); break;
			case 'mesh': shape = new Ammo.btBoxShape(new Ammo.btVector3(size[0]*0.5, size[1]*0.5, size[2]*0.5)); break;
			case 'convex': shape = new Ammo.btBoxShape(new Ammo.btVector3(size[0]*0.5, size[1]*0.5, size[2]*0.5)); break;
			case 'terrain': shape = new Ammo.btBoxShape(new Ammo.btVector3(size[0]*0.5, size[1]*0.5, size[2]*0.5)); break;
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
		world.addRigidBody(this.body);
		//body.activate();
    },
    clear:function(){

    },
    set:function(obj){
    	var v = new Ammo.btVector3(0,0,0);
    	this.body.setLinearVelocity(v);
    	this.body.setAngularVelocity(v);
    	if(obj.pos){ this.body.getCenterOfMassTransform().setOrigin(new Ammo.btVector3(obj.pos[0], obj.pos[1], obj.pos[2]));}
    	if(obj.rot){
    		var q = new Ammo.btQuaternion();
    		q.setEulerZYX(obj.rot[2]*ToRad,obj.rot[1]*ToRad,obj.rot[0]*ToRad);
    		this.body.getCenterOfMassTransform().setRotation(q);
    	}
    },
    getMatrix:function(){
    	var m = matrix[this.id];
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
//  VEHICLE
//--------------------------------------------------

AMMO.Vehicle = function(obj){

}

AMMO.Vehicle.prototype = {
	constructor: AMMO.Vehicle,
    add:function(obj){

    }
}