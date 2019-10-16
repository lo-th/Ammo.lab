/*global THREE*/
import { root, map, vectorad } from './root.js';

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    SHOT - CONSTRAINT JOINT
*/

function Constraint() {

	this.ID = 0;
	this.joint = [];

	this.mat0 =new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors, depthTest: false, depthWrite: false, transparent: true });
	this.mat1 = new THREE.MeshBasicMaterial({ wireframe:true, color:0x00ff00, depthTest:false, depthWrite:true }); 
	this.mat2 = new THREE.MeshBasicMaterial({ wireframe:true, color:0xffff00, depthTest:false, depthWrite:true }); 

	this.g = new THREE.ConeBufferGeometry(0.1,0.2,6);
	this.g.translate( 0, 0.1, 0 );
	this.g.rotateZ( -Math.PI*0.5 );

}

Object.assign( Constraint.prototype, {

	step: function ( AR, N ) {

		var n;

		this.joint.forEach( function ( b, id ) {
			
			n = N + ( id * 14 );
			b.visible = true;

			var p = b.userData.pos.array;

			p[0] = AR[n];
			p[1] = AR[n+1];
			p[2] = AR[n+2];

			p[3] = AR[n+7];
			p[4] = AR[n+8];
			p[5] = AR[n+9];

			b.userData.pos.needsUpdate = true;

			//var b1 = map.get( b.userData.b1 );

			//b.position.copy( b1.position );
	        //b.quaternion.copy( b1.quaternion );

	        b.userData.p1.position.fromArray( AR, n );
	        b.userData.p1.quaternion.fromArray( AR, n + 3 );

	        b.userData.p2.position.fromArray( AR, n + 7 );
	        b.userData.p2.quaternion.fromArray( AR, n + 10 )

	        //b.userData.p1.position.fromArray( AR, n )
	        //b.userData.p2.position.fromArray( AR, n+3 )


		});

	},

	clear: function () {

		while ( this.joint.length > 0 ) this.destroy( this.joint.pop() );
		this.ID = 0;

	},

	destroy: function ( b ) {

		map.delete( b.name );
		root.destroy( b );

	},

	remove: function ( name ) {

		if ( ! map.has( name ) ) return;
		var b = map.get( name );

		var n = this.joint.indexOf( b );
		this.joint.splice( n, 1 );
		this.destroy( b );

	},

	add: function ( o ) {

		o.name = o.name !== undefined ? o.name : 'joint' + this.ID ++;
		// delete old if same name
		this.remove( o.name );

		var vertices = new Float32Array([ 0, 0, 0,	1, 0, 0 ]);
		var colors = new Float32Array([ 0, 1, 0, 1, 1, 0 ]);

		var geometry = new THREE.BufferGeometry();
		geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
		geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );


		var mesh = new THREE.Line( geometry, this.mat0 );//new THREE.Group();
		mesh.name = o.name;

		var p1 = new THREE.Mesh( this.g, this.mat1 );
		//p1.position.fromArray(o.pos1 || [0,0,0]);
		mesh.add(p1);

		var p2 = new THREE.Mesh( this.g, this.mat2 );
		//p2.position.fromArray(o.pos2 || [0,0,0]);
		mesh.add( p2 );
         
        //mesh.frustumCulled = false;
		//p1.frustumCulled = false;
		//p2.frustumCulled = false;

		//mesh.userData.b1 = o.b1;
		//mesh.userData.b2 = o.b2;

		mesh.userData.p1 = p1;
		mesh.userData.p2 = p2;
		mesh.userData.pos = mesh.geometry.attributes.position;

		mesh.visible = false;

		if ( o.parent !== undefined ){ 

			o.parent.add( mesh );
			o.parent = null;

		} else {

	    	root.container.add( mesh );

	    }

		// send to worker
	    root.post( 'add', o );

	    this.joint.push( mesh );

	    map.set( o.name, mesh );

	    return mesh;

	},

});

export { Constraint };