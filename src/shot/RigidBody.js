/*global THREE*/
import { Capsule, geometryInfo } from './Geometry.js';
import { root, map } from './root.js';

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    SHOT - RIGIDBODY
*/

function RigidBody() {

	this.ID = 0;
	this.solids = [];
	this.bodys = [];

}

Object.assign( RigidBody.prototype, {

	step: function ( AR, N ) {

		//var AR = root.Ar;
		//var N = root.ArPos[ 0 ];

		var n;

		this.bodys.forEach( function ( b, id ) {


			n = N + ( id * 8 );

			//if( AR[n] + AR[n+1] + AR[n+2] + AR[n+3] !== 0 || b.isKinemmatic ) {

			var s = AR[ n ];// speed km/h
		        if ( s > 0 ) {

		            if ( b.material.name == 'sleep' ) b.material = root.mat.move;
		            if ( s > 50 && b.material.name == 'move' ) b.material = root.mat.speed;
		            else if ( s < 50 && b.material.name == 'speed' ) b.material = root.mat.move;

		        } else {

		            if ( b.material.name == 'move' || b.material.name == 'speed' ) b.material = root.mat.sleep;

			}

			if( b.enabled ){
				b.position.fromArray( AR, n + 1 );
	            b.quaternion.fromArray( AR, n + 4 );

	            //if( !b.matrixAutoUpdate ) b.updateMatrix();
	            //b.updateMatrixWorld( true );
	            //b.updateWorldMatrix( true,true)
			}

			
	        //}

		} );

	},

	clear: function () {

		while ( this.bodys.length > 0 ) this.destroy( this.bodys.pop() );
		while ( this.solids.length > 0 ) this.destroy( this.solids.pop() );
		this.ID = 0;

	},

	destroy: function ( b ) {

		map.delete( b.name );
		root.destroy( b );

	},

	remove: function ( name ) {

		if ( ! map.has( name ) ) return;
		var b = map.get( name );
		var solid = b.type === 'solid' ? true : false;
		var n = solid ? this.solids.indexOf( b ) : this.bodys.indexOf( b );



		//console.log('remove SHOT', name, n )

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

	add: function ( o, extra ) {

		if ( o.density !== undefined ) o.mass = o.density;
		if ( o.bounce !== undefined ) o.restitution = o.bounce;

		o.mass = o.mass === undefined ? 0 : o.mass;
		o.kinematic = o.kinematic || false;

		var autoName = 'body';
		if ( o.mass === 0 && ! o.kinematic ) autoName = 'static';

		o.name = o.name !== undefined ? o.name : autoName + this.ID ++;

		// delete old if same name
		this.remove( o.name );

		if ( o.breakable ) {

			if ( o.type === 'hardbox' || o.type === 'box' || o.type === 'sphere' || o.type === 'cylinder' || o.type === 'cone' ) o.type = 'real' + o.type;

		}

		var customGeo = false;

		o.type = o.type === undefined ? 'box' : o.type;

		// position
		o.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
	    // size
	    o.size = o.size == undefined ? [ 1, 1, 1 ] : o.size;
	    o.size = root.correctSize( o.size );
	    if ( o.geoSize ) o.geoSize = root.correctSize( o.geoSize );
	    // rotation is in degree or Quaternion
	    o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;
	    if( o.rot !== undefined ){ o.quat = root.toQuatArray( o.rot ); delete ( o.rot ); }

	    
	    

	    var mesh = null;
	    var noMesh = o.noMesh !== undefined ? o.noMesh : false; 

	    var isDirectGeometry = false;

	    if ( o.type === 'plane' ) {

	        //this.grid.position.set( o.pos[0], o.pos[1], o.pos[2] )
	        root.post( 'add', o );
	        return;

		}



	    // material

	    var material;
	    if ( o.material !== undefined ) {

	    	if ( o.material.constructor === String ) material = root.mat[ o.material ];
	    	else material = o.material;

	    } else {

	    	if ( o.mass === 0 && ! o.kinematic ) material = root.mat.static;
	    	else material = root.mat.move;
	    	if ( o.kinematic ) material = root.mat.kinematic;

	    }

	    // geometry

	    var m, g;

	    if ( o.type === 'compound' ) {

		    for ( var i = 0; i < o.shapes.length; i ++ ) {

	    		g = o.shapes[ i ];
	    		g.size = g.size === undefined ? [ 1, 1, 1 ] : g.size;
	    		if ( g.size.length === 1 ) {

					g.size[ 1 ] = g.size[ 0 ];

				}
	            if ( g.size.length === 2 ) {

					g.size[ 2 ] = g.size[ 0 ];

				}
	            g.pos = g.pos === undefined ? [ 0, 0, 0 ] : g.pos;
	    		g.rot = g.rot === undefined ? [ 0, 0, 0 ] : root.vectorad( g.rot );
				g.quat = g.quat === undefined ? new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( g.rot ) ).toArray() : g.quat;

	    	}

	    	mesh = o.geometry ? new THREE.Mesh( o.geometry, material ) : new THREE.Group();

	    	if ( o.geometry ) root.extraGeo.push( o.geometry );

	    	if ( ! o.geometry || o.debug ) {

	    		//mesh = new THREE.Group();
	    		mesh.material = material;// TODO fix
		    	
		    	for ( var i = 0; i < o.shapes.length; i ++ ) {

		    		g = o.shapes[ i ];

		    		var geom = null;

		    		if( g.type === 'capsule' ) geom = new Capsule( o.size[ 0 ], o.size[ 1 ] );
		    		else if( g.type === 'convex' ){ 
		    			geom = g.shape; 
		    			g.v = geometryInfo( g.shape, g.type );
		    			delete ( g.shape );
		    		}
		    		else geom = root.geo[ g.type ];

		    		if( g.type === 'capsule' || g.type === 'convex' ) root.extraGeo.push( geom );

		    		m = new THREE.Mesh( geom, o.debug ? root.mat.debug : material );
		    		m.scale.fromArray( g.size );
		    		m.position.fromArray( g.pos );
	                m.quaternion.fromArray( g.quat );

		    		mesh.add( m );

		    	}

			}

	    } else if ( o.type === 'mesh' || o.type === 'convex' ) {

	    	isDirectGeometry = true;
	    	customGeo = true;

	        if ( o.shape ) {

	            o.v = geometryInfo( o.shape, o.type );
	            root.extraGeo.push( o.shape );

			}

	        if ( o.geometry ) {

	        	
	        	if ( o.geoScale ){ 
	        		o.geometry = o.geometry.clone();
	        		o.geometry.applyMatrix( new THREE.Matrix4().makeScale( o.geoScale[ 0 ], o.geoScale[ 0 ], o.geoScale[ 0 ] ) );
	        	}


	            mesh = new THREE.Mesh( o.geometry, material );
	            root.extraGeo.push( o.geometry );

	        } else {

	            if ( !noMesh ) mesh = new THREE.Mesh( o.shape, material );
	            //extraGeo.push(mesh.geometry);

			}

	    } else {

	    	//if ( o.type === 'box' && o.mass === 0 && ! o.kinematic ) o.type = 'hardbox';
	    	if ( o.type === 'capsule' ) o.geometry = new Capsule( o.size[ 0 ], o.size[ 1 ] );
	    	
	    	// breakable
	    	if ( o.type === 'realbox' || o.type === 'realhardbox' ) o.geometry = new THREE.BoxBufferGeometry( o.size[ 0 ], o.size[ 1 ], o.size[ 2 ] );
	    	if ( o.type === 'realsphere' ) o.geometry = new THREE.SphereBufferGeometry( o.size[ 0 ], 16, 12 );
	    	if ( o.type === 'realcylinder' ) o.geometry = new THREE.CylinderBufferGeometry( o.size[ 0 ], o.size[ 0 ], o.size[ 1 ] * 0.5, 12, 1 );
	    	if ( o.type === 'realcone' ) o.geometry = new THREE.CylinderBufferGeometry( 0, o.size[ 0 ] * 0.5, o.size[ 1 ] * 0.55, 12, 1 );
	    	

	    	// new Geometry
	    	if( o.radius !== undefined && root.isRefView ){

	    		if ( o.type === 'box' ) o.geometry = new THREE.ChamferBox( o.size[ 0 ], o.size[ 1 ], o.size[ 2 ], o.radius );
	    		if ( o.type === 'cylinder' ) o.geometry = new THREE.ChamferCyl( o.size[ 0 ], o.size[ 0 ], o.size[ 1 ] * 0.5, o.radius );
	    		if ( o.type === 'cone' ) o.geometry = new THREE.ChamferCyl( o.radius, o.size[ 0 ], o.size[ 1 ] * 0.5, o.radius );

	    	}


	        if ( o.geometry ) {

	            if ( o.geoRot || o.geoScale ) o.geometry = o.geometry.clone();
	            // rotation only geometry
	            if ( o.geoRot ) o.geometry.applyMatrix( new THREE.Matrix4().makeRotationFromEuler( new THREE.Euler().fromArray( root.vectorad( o.geoRot ) ) ) );
	            // scale only geometry
	            if ( o.geoScale ) o.geometry.applyMatrix( new THREE.Matrix4().makeScale( o.geoScale[ 0 ], o.geoScale[ 1 ], o.geoScale[ 2 ] ) );

	        }

	        mesh = new THREE.Mesh( o.geometry || root.geo[ o.type ], material );

	        if ( o.geometry ) {

	            root.extraGeo.push( o.geometry );
	            if ( o.geoSize ) mesh.scale.fromArray( o.geoSize );// ??
	            //if( !o.geoSize && o.size && o.type !== 'capsule' ) mesh.scale.fromArray( o.size );
	            customGeo = true;

			}

	    }

	    if ( o.type === 'highsphere' ) o.type = 'sphere';


	    if ( extra == 'isGeometry' ) return g;





	    if ( mesh ) {

	        if ( !customGeo && !mesh.isGroup ){ 

	        	mesh.scale.fromArray( o.size );
	        	// ! add to group to avoid matrix scale
	        	var tmp = mesh;
	        	mesh = new THREE.Group();
	        	mesh.add( tmp );
	        	
	        }

	        // mesh remplacement 
	        if( o.mesh ){

		    	mesh = new THREE.Group();
		        mesh.add( o.mesh );

		    }

	        // out of view on start
	        //mesh.position.set(0,-1000000,0);
	        mesh.position.fromArray( o.pos );
	        mesh.quaternion.fromArray( o.quat );

	        mesh.updateMatrix();

	        mesh.name = o.name;
	        mesh.enabled = true;
	        //mesh.type = 'rigidbody';

	        if ( o.parent !== undefined ){ 

	        	o.parent.add( mesh );
	        	o.parent = null;

	        } else { 

	        	root.container.add( mesh );
	        	
	        }

	        // shadow
	        if( o.noShadow === undefined ){

	        	if( mesh.isGroup ){

	        		/*Object.defineProperty( mesh, 'material', {
					    get: function() { return this.children[0].material; },
					    set: function( value ) { 
					    	var i = this.children.length;
					    	while(i--) this.children[i].material = value; 
					    }
					});*/

					Object.defineProperty( mesh, 'receiveShadow', {
					    get: function() { return this.children[0].receiveShadow; },
					    set: function( value ) { 
					    	var i = this.children.length;
					    	while(i--) this.children[i].receiveShadow = value; 
					    }
					});

					Object.defineProperty( mesh, 'castShadow', {
					    get: function() { return this.children[0].castShadow; },
					    set: function( value ) { 
					    	var i = this.children.length;
					    	while(i--) this.children[i].castShadow = value; 
					    }
					});

	        		/*var j = mesh.children.length;
	        		while(j--){
	        			mesh.children[j].receiveShadow = true;
	        			mesh.children[j].castShadow = o.mass === 0 && !o.kinematic ? false : true;
	        		}*/

	        	} 

	        	
	        	mesh.receiveShadow = true;
	        	mesh.castShadow = o.mass === 0 && !o.kinematic ? false : true;
	        	

	        	//console.log('??')

	        	
	        }

	    }

	    if ( o.shape ) delete ( o.shape );
	    if ( o.geometry ) delete ( o.geometry );
	    if ( o.material ) delete ( o.material );
	    if ( o.mesh ) { delete ( o.mesh ); }

	    if ( o.noPhy === undefined ) {

	        // push
	        if ( mesh ) {

	            if ( o.mass === 0 && ! o.kinematic ) this.solids.push( mesh );// static
	            else this.bodys.push( mesh );// dynamique

	        }

	        // send to worker
	        root.post( 'add', o );

	    }

	    if ( mesh ) {

	    	mesh.type = o.mass === 0 && !o.kinematic ? 'solid' : 'body';
	    	//if( o.kinematic ) mesh.type = 'kinematic';

	    	//if ( o.mass === 0 && ! o.kinematic ) mesh.isSolid = true;
	    	//if ( o.kinematic ) mesh.isKinemmatic = true;
	    	//else mesh.isBody = true;
	    	//mesh.userData.mass = o.mass;
	    	mesh.userData.mass = o.mass;
	        map.set( o.name, mesh );

	        if( o.autoMatrix !== undefined ) mesh.matrixAutoUpdate = o.autoMatrix; 



	        return mesh;

		}


	}

} );


export { RigidBody };
