/*global THREE*/
import { Capsule, geometryInfo } from './Geometry.js';
import { root, map } from './root.js';

function RigidBody() {

	this.ID = 0;
	this.solids = [];
	this.bodys = [];
	this.torad = 0.0174532925199432957;

}

Object.assign( RigidBody.prototype, {

	step: function ( AR, N ) {

		//var AR = root.Ar;
		//var N = root.ArPos[ 0 ];

		var n;

		this.bodys.forEach( function ( b, id ) {

			n = N + ( id * 8 );
			var s = AR[n];// speed km/h
	        if ( s > 0 ) {

	            if ( b.material.name == 'sleep' ) b.material = root.mat.move;
	            if( s > 50 && b.material.name == 'move' ) b.material = root.mat.speed;
	            else if( s < 50 && b.material.name == 'speed') b.material = root.mat.move;
	      
	        } else {
	            if ( b.material.name == 'move' || b.material.name == 'speed' ) b.material = root.mat.sleep;
	        }
			b.position.fromArray( AR, n + 1 );
            b.quaternion.fromArray( AR, n + 4 );

		} );

	},

	clear: function () {

		while ( this.bodys.length > 0 ) this.destroy( this.bodys.pop() );
		while ( this.solids.length > 0 ) this.destroy( this.solids.pop() );
		this.ID = 0;

	},

	destroy: function ( b ) {


		if ( b.parent ) b.parent.remove( b );
		map.delete( b.name );

	},

	remove: function ( name ) {



		if ( ! map.has( name ) ) return;
		var b = map.get( name );
		var solid = b.isSolid ? true : false;
		var n = solid ? this.solids.indexOf( b ) : this.bodys.indexOf( b );

		if ( n !== - 1 ) {

			if ( solid ) {

				this.solids.splice( n, 1 );
				this.destroy( b );

			} else {

				this.bodys.splice( n, 1 );
				this.destroy( b );

			}

		}

	},

	vectorad: function ( r ) {

	    var i = r.length;
	    while(i--) r[i] *= this.torad;
	    return r;

	},

	add: function ( o, extra ) {

		o.name = o.name !== undefined ? o.name : 'body' + this.ID ++;
		// delete old if same name
		this.remove( o.name );

		if ( o.density !== undefined ) o.mass = o.density;
		if ( o.bounce !== undefined ) o.restitution = o.bounce

		o.mass = o.mass === undefined ? 0 : o.mass;
		o.kinematic = o.kinematic || false;

		o.type = o.type === undefined ? 'box' : o.type;
		o.size = o.size === undefined ? [ 1, 1, 1 ] : o.size;
		o.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
		//o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;

	


	    var customGeo = false;
	   
	    // size
	    o.size = o.size == undefined ? [1,1,1] : o.size;
	    if( o.size.length === 1 ){ o.size[1] = o.size[0]; }
	    if( o.size.length === 2 ){ o.size[2] = o.size[0]; }

	    if( o.geoSize ){
	        if(o.geoSize.length === 1){ o.geoSize[1] = o.geoSize[0]; }
	        if(o.geoSize.length === 2){ o.geoSize[2] = o.geoSize[0]; }
	    }

	    // rotation is in degree
	    o.rot = o.rot === undefined ? [0,0,0] : this.vectorad(o.rot);
	    o.quat = o.quat === undefined ? new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( o.rot ) ).toArray() : o.quat;

	    if( o.rotA ) o.quatA = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( this.vectorad( o.rotA ) ) ).toArray();
	    if( o.rotB ) o.quatB = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( this.vectorad( o.rotB ) ) ).toArray();

	    if( o.angUpper ) o.angUpper = this.vectorad( o.angUpper );
	    if( o.angLower ) o.angLower = this.vectorad( o.angLower );

	    var mesh = null;


	    if(o.type === 'plane'){
	        //this.grid.position.set( o.pos[0], o.pos[1], o.pos[2] )
	        root.post( 'add', o ); 
	        return;
	    }
	    
	    // material

	    var material;
	    if( o.material !== undefined ){ 

	    	if( o.material.constructor === String ) material = root.mat[o.material];
	    	else material = o.material;
	    
	    } else { 

	    	if( o.mass === 0 && ! o.kinematic ) material = root.mat.static;
	    	else material = root.mat.move;
	    	if( o.kinematic ) material = root.mat.kinematic;

	    }

	    // geometry
	    
	    if ( o.type === 'mesh' || o.type === 'convex' ){

	        if( o.shape ) {
	            o.v = geometryInfo( o.shape, o.type );
	            root.extraGeo.push( o.shape );
	        }

	        if( o.geometry ){

	            mesh = new THREE.Mesh( o.geometry, material );
	            root.extraGeo.push( o.geometry );
	            
	        } else {
	            mesh = new THREE.Mesh( o.shape, material );
	            //extraGeo.push(mesh.geometry);
	        }

	    } else {

	    	if( o.type === 'box' && o.mass === 0 && ! o.kinematic ) o.type = 'hardbox';
	    	if( o.type === 'capsule' ) o.geometry = new Capsule( o.size[0] , o.size[1]*0.5 );

	        if( o.geometry ){

	            if( o.geoRot || o.geoScale ) o.geometry = o.geometry.clone();
	            // rotation only geometry
	            if( o.geoRot ) o.geometry.applyMatrix(new THREE.Matrix4().makeRotationFromEuler( new THREE.Euler().fromArray(this.vectorad(o.geoRot))));
	            // scale only geometry
	            if( o.geoScale ) o.geometry.applyMatrix( new THREE.Matrix4().makeScale( o.geoScale[0], o.geoScale[1], o.geoScale[2] ) );
	            
	        }

	        mesh = new THREE.Mesh( o.geometry || root.geo[o.type], material );

	        if( o.geometry ){
	            root.extraGeo.push( o.geometry );
	            if( o.geoSize ) mesh.scale.fromArray( o.geoSize );
	            if( !o.geoSize && o.size && o.type !== 'capsule' ) mesh.scale.fromArray( o.size );
	            customGeo = true;
	        }

	    }


	    if( mesh ){

	        if( !customGeo ) mesh.scale.fromArray( o.size );
	        mesh.position.fromArray( o.pos );
	        mesh.quaternion.fromArray( o.quat );

	        mesh.receiveShadow = true;
	        mesh.castShadow = o.mass === 0 && ! o.kinematic ? false : true;

	        mesh.name = o.name;

	        if( o.parent !== undefined ) o.parent.add( mesh );
	        else root.container.add( mesh );

	    }

	    if( o.shape ) delete( o.shape );
	    if( o.geometry ) delete( o.geometry );
	    if( o.material ) delete( o.material );
	    
	    if( o.noPhy === undefined ){

	        // push 
	        if( mesh ){

	            if( o.mass === 0 && ! o.kinematic ) this.solids.push( mesh );// static
	            else this.bodys.push( mesh );// dynamique

	        }

	        // send to worker
	        root.post( 'add', o );

	    }

	    if( mesh ){ 
	    	if( o.mass === 0 && ! o.kinematic ) mesh.isSolid = true;
	    	if( o.kinematic ) mesh.isKinemmatic = true;
	    	else mesh.isBody = true;
	        map.set( o.name, mesh );
	        return mesh;
	    }


	}

} );


export { RigidBody };