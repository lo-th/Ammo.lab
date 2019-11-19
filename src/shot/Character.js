/*global THREE*/
import { root, map } from './root.js';
import { Capsule } from './Geometry.js';
/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    SHOT - CHARACTER
*/

function Character() {

	this.ID = 0;
	this.heroes = [];

}

Object.assign( Character.prototype, {

	step: function ( AR, N ) {

		var n;

		this.heroes.forEach( function ( b, id ) {

			n = N + ( id * 8 );
	        var s = AR[ n ] * 3.33;
	        b.userData.speed = s * 100;
	        b.position.fromArray( AR, n + 1 );
	        b.quaternion.fromArray( AR, n + 4 );

	        if ( b.skin ) {

	            if ( s === 0 ) b.skin.play( 0, 0.3 );
	            else {

	                b.skin.play( 1, 0.3 );
	                b.skin.setTimeScale( s );

	            }

	            //console.log(s)

	        }

		} );



	},

	clear: function () {

		while ( this.heroes.length > 0 ) this.destroy( this.heroes.pop() );
		this.ID = 0;

	},

	destroy: function ( b ) {

		if ( b.parent ) b.parent.remove( b );
		map.delete( b.name );

	},

	remove: function ( name ) {

		if ( ! map.has( name ) ) return;
		var b = map.get( name );

		var n = this.heroes.indexOf( b );
		if ( n !== - 1 ) {

			this.heroes.splice( n, 1 );
			this.destroy( b );

		}

	},

	add: function ( o ) {


		var name = o.name !== undefined ? o.name : o.type + this.ID ++;

		// delete old if same name
		this.remove( name );

		o.scale  = o.scale || 1;

		o.size = o.size !== undefined ? o.size : [ 0.25, 2 ];

		
	    /*if ( o.size.length == 1 ) {

			o.size[ 1 ] = o.size[ 0 ];

		}
	    if ( o.size.length == 2 ) {

			o.size[ 2 ] = o.size[ 0 ];

		}*/

		if ( o.mesh ) {

			var gm = o.mesh.geometry;
	    	var h = (Math.abs(gm.boundingBox.max.y)+Math.abs(gm.boundingBox.min.y))*o.scale;
	    	var py = -(Math.abs(gm.boundingBox.max.y)-Math.abs(gm.boundingBox.min.y))*o.scale*0.5; // ?
	        o.size[ 1 ] = h;

	    }

	    // The total height is height+2*radius, so the height is just the height between the center of each 'sphere' of the capsule caps
	    o.size[ 1 ] = o.size[ 1 ] - ( o.size[ 0 ]*2 );

	    o.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
	    o.rot = o.rot == undefined ? [ 0, 0, 0 ] : Math.vectorad( o.rot );
	    o.quat = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( o.rot ) ).toArray();

	    var material;
	    if ( o.material !== undefined ) {

	    	if ( o.material.constructor === String ) material = root.mat[ o.material ];
	    	else material = o.material;

		} else {

	    	material = root.mat.hero;

		}

	    var g = new Capsule( o.size[ 0 ], o.size[ 1 ], 6 );

	    var mesh = new THREE.Group();//o.mesh || new THREE.Mesh( g );

	    if ( o.debug ) {

	        var mm = new THREE.Mesh( g, root.mat.debug );
	        root.extraGeo.push( g );
	        mesh.add( mm );

	    }


	    if ( o.mesh ) {

	        var model = o.mesh;
	        model.material = material;
	        model.scale.multiplyScalar( o.scale );
	        model.position.set( 0, py, 0 );

	        model.setTimeScale( 0.5 );
	        model.play( 0 );

	        mesh.add( model );
	        mesh.skin = model;

	        



	        //this.extraGeo.push( mesh.skin.geometry );

	    } else {

	        var mx = new THREE.Mesh( g, material );
	        root.extraGeo.push( g );
	        mesh.add( mx );

	    }





	    mesh.userData.speed = 0;
	    mesh.userData.type = 'hero';
	    //mesh.userData.id = this.heros.length;

	     // copy rotation quaternion
	    mesh.position.fromArray( o.pos );
	    mesh.quaternion.fromArray( o.quat );



	    mesh.castShadow = true;
	    mesh.receiveShadow = true;
	    mesh.name = name;

	    if ( o.material ) delete ( o.material );
	    if ( o.mesh ) delete ( o.mesh );
	    if ( o.scale ) delete ( o.scale );
	    


	    root.container.add( mesh );
		this.heroes.push( mesh );

		map.set( name, mesh );

		root.post( 'add', o );

		return mesh;

	},

	/////



} );


export { Character };
