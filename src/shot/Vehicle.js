/*global THREE*/
import { geometryInfo } from './Geometry.js';
import { root, map } from './root.js';

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    SHOT - VEHICLE
*/

function Vehicle() {

	this.ID = 0;
	this.cars = [];

}

Object.assign( Vehicle.prototype, {

	step: function ( AR, N ) {

		var n, num;

		this.cars.forEach( function ( b, id ) {

			//num = b.userData.NumWheels;
			var j = b.userData.NumWheels, w = 56, k, v;

			n = N + ( id * 64 );//( id * ( num + 2 ) );//( id * 56 );
	        b.userData.speed = AR[ n ];

	        b.userData.wr = [ AR[ n + 62 ], AR[ n + 63 ] ];




	        b.position.fromArray( AR, n + 1 );
	        b.quaternion.fromArray( AR, n + 4 );


	        
	        
	        var decal = 0.2;
	        var ratio = 1 / decal;
	        var radius = b.userData.radius;
	        var steering = AR[ n + 8 ];

	        b.userData.steering = steering;
	        
	        if ( b.userData.steeringWheel ) {

	            b.userData.steeringWheel.rotation.y = - steering * 15;

			}

	        if ( b.userData.isWithBrake ) {

	        	var steeringR = AR[ n + 8 ];
	            var steeringL = AR[ n + 16 ];

	            k = j;

	            while ( k -- ) {

	                if ( k === 0 ) b.userData.b[ k ].rotation.y = steeringL;
	                if ( k === 1 ) b.userData.b[ k ].rotation.y = Math.Pi - steeringR;
	                b.userData.b[ k ].position.y = radius - AR[ n + w + k ];

	            }

	        }

	        if ( b.userData.isWithSusp ) {

	            k = j;

	            while ( k -- ) {

	                v = ( AR[ n + w + k ] ) * ratio;
	                v = v > 1 ? 1 : v;
	                v = v < - 1 ? - 1 : v;

	                if ( v > 0 ) {

	                    b.userData.s[ k ].setWeight( 'low', v );
	                    b.userData.s[ k ].setWeight( 'top', 0 );

	                } else {

	                    b.userData.s[ k ].setWeight( 'low', 0 );
	                    b.userData.s[ k ].setWeight( 'top', - v );

	                }

	            }

	        }


	        if ( b.userData.helper ) {

	        	if ( j === 2 ) {

	                b.userData.helper.updateSuspension( AR[ n + w + 0 ], AR[ n + w + 0 ], AR[ n + w + 1 ], AR[ n + w + 1 ] );

				}

	            if ( j === 4 ) {

	                b.userData.helper.updateSuspension( AR[ n + w + 0 ], AR[ n + w + 1 ], AR[ n + w + 2 ], AR[ n + w + 3 ] );

				}

			}

	        while ( j -- ) {

	        	// suspension info
	            b.userData.suspension[ j ] = AR[ n + 56 + j ];

	            w = 8 * ( j + 1 );
	            b.userData.w[ j ].position.fromArray( AR, n + w + 1 );
	            b.userData.w[ j ].quaternion.fromArray( AR, n + w + 4 );

	        }


		} );

	},

	clear: function () {

		while ( this.cars.length > 0 ) this.destroy( this.cars.pop() );
		this.ID = 0;

	},

	destroy: function ( b ) {

		var wheel;
		for ( var i = 0, lng = b.userData.w.length; i < lng; i ++ ) {

			wheel = b.userData.w[ i ];
			if ( wheel.parent ) wheel.parent.remove( wheel );

		}

		if ( b.parent ) b.parent.remove( b );
		map.delete( b.name );

	},

	remove: function ( name ) {

		if ( ! map.has( name ) ) return;
		var car = map.get( name );

		var n = this.cars.indexOf( car );
		if ( n !== - 1 ) {

			this.cars.splice( n, 1 );
			this.destroy( car );

		}

	},

	add: function ( o ) {


		var name = o.name !== undefined ? o.name : o.type + this.ID ++;

		// delete old if same name
		this.remove( name );




		var size = o.size || [ 2, 0.5, 4 ];
	    var pos = o.pos || [ 0, 0, 0 ];
	    var rot = o.rot || [ 0, 0, 0 ];

	    var wPos = o.wPos || [ 1, 0, 1.6 ];

	    o.masscenter = o.masscenter === undefined ? [ 0, 0, 0 ] : o.masscenter;

	    //var masscenter = o.masscenter || [0,0.25,0];

	    Math.vectorad( rot );

	    // chassis
	    var mesh;
	    if ( o.mesh ) {

	        mesh = new THREE.Group();//o.mesh;
	        mesh.add( o.mesh );
	        /*var k = mesh.children.length;
	            while(k--){
	                //mesh.children[k].position.fromArray( o.masscenter ).negate();//.set( -masscenter[0], -masscenter[1], -masscenter[2] );
	                //mesh.children[k].geometry.translate( masscenter[0], masscenter[1], masscenter[2] );
	                //mesh.children[k].castShadow = true;
	                //mesh.children[k].receiveShadow = true;
	            }*/

		} else if ( o.geometry ) {

	            mesh = new THREE.Mesh( o.geometry, o.material );
	            root.extraGeo.push( o.geometry );

	    } else {

	        var g = new THREE.BufferGeometry().fromGeometry( new THREE.BoxGeometry( size[ 0 ], size[ 1 ], size[ 2 ] ) );//geo.box;
	        g.translate( - o.masscenter[ 0 ], - o.masscenter[ 1 ], - o.masscenter[ 2 ] );
	        root.extraGeo.push( g );
	        mesh = new THREE.Mesh( g, root.mat.move );

	    }


	    if ( o.debug && o.shape ) {

	        mesh = new THREE.Mesh( o.shape, root.mat.debug );

		}

	    //mesh.scale.set( size[0], size[1], size[2] );
	    mesh.position.set( pos[ 0 ], pos[ 1 ], pos[ 2 ] );
	    mesh.rotation.set( rot[ 0 ], rot[ 1 ], rot[ 2 ] );

	    // copy rotation quaternion
	    o.quat = mesh.quaternion.toArray();

	    //mesh.castShadow = true;
	    //mesh.receiveShadow = true;

	    root.container.add( mesh );

	    //mesh.idx = view.setIdx( cars.length, 'cars' );
	    //view.setName( o, mesh );

	    //this.byName[ o.name ] = mesh;

	    mesh.userData.speed = 0;
	    //mesh.userData.steering = 0;
	    mesh.userData.NumWheels = o.nWheel || 4;
	    mesh.userData.suspension = [0,0,0,0,0,0];
	    mesh.userData.wr = [0,0];
	    mesh.userData.steering = 0;
	    mesh.userData.type = 'car';

	    mesh.userData.steeringWheel = o.meshSteeringWheel || null;



	    // wheels

	    var radius = o.radius || 0.4;
	    var radiusBack = o.radiusBack || radius;
	    var deep = o.deep || 0.3;
	    wPos = o.wPos || [ 1, - 0.25, 1.6 ];

	    var w = [];
	    var s = [];
	    var b = [];
	    var m;
	    var isWithSusp = o.meshSusp === undefined ? false : true;
	    var isWithBrake = o.meshBrake === undefined ? false : true;


	    var needScale = o.wheel == undefined ? true : false;

	    var gw = o.wheel || root.geo[ 'wheel' ];
	    var gwr = gw.clone();
	    gwr.rotateY( Math.Pi );
	    root.extraGeo.push( gwr );

	    var wheelmat = root.mat.move;
	    if ( o.wheelMaterial !== undefined ) {

        	if ( o.wheelMaterial.constructor === String ) wheelmat = root.mat[ o.wheelMaterial ];
        	else wheelmat = o.wheelMaterial;

		}

	    //var i = o.nWheel || 4;
	    var n = o.nWheel || 4, p, fw;
	    var by = o.decalYBack || 0;

		for ( var i = 0; i < n; i ++ ) {

			if ( i === 0 ) {

				p = [ wPos[ 0 ], wPos[ 1 ], wPos[ 2 ] ]; fw = true;

			}
			if ( i === 1 ) {

				p = [ - wPos[ 0 ], wPos[ 1 ], wPos[ 2 ] ]; fw = true;

			}
			if ( i === 2 ) {

				p = [ - wPos[ 0 ], wPos[ 1 ], - wPos[ 2 ] ]; fw = false;

			}
			if ( i === 3 ) {

				p = [ wPos[ 0 ], wPos[ 1 ], - wPos[ 2 ] ]; fw = false;

			}
			if ( i === 4 ) {

				p = [ - wPos[ 0 ], wPos[ 1 ], - wPos[ 3 ] ]; fw = false;

			}
			if ( i === 5 ) {

				p = [ wPos[ 0 ], wPos[ 1 ], - wPos[ 3 ] ]; fw = false;

			}

			if ( n === 2 ) { // moto

				if ( i === 0 ) {

					p = [ 0, wPos[ 1 ],  wPos[ 2 ] ]; fw = true;

				}

				if ( i === 1 ) {

					p = [ 0, wPos[ 1 ] + by, - wPos[ 2 ] ]; fw = false;

				}

			}

			if ( n === 3 ) { // moto

				if ( i === 0 ) {

					p = [ 0, wPos[ 1 ], wPos[ 2 ] ]; fw = true;

				}

				if ( i === 1 ) {

					p = [ wPos[ 0 ], wPos[ 1 ] + by, - wPos[ 2 ] ]; fw = false;

				}

				if ( i === 2 ) {

					p = [ -wPos[ 0 ], wPos[ 1 ] + by, - wPos[ 2 ] ]; fw = false;

				}

			}


	        if ( o.meshBrake ) {

	            m = o.meshBrake.clone();
	           // this.scene.add( m );
	            mesh.add( m );
	            m.position.y = radius;
	            if ( i == 1 || i == 2 ) {

					m.rotation.y = Math.Pi; m.position.x = wPos[ 0 ]; m.rotation.x = Math.Pi;

				} else {

					m.position.x = - wPos[ 0 ];

				}
	            if ( i == 0 || i == 1 ) m.position.z = wPos[ 2 ];
	            else m.position.z = - wPos[ 2 ];

	            b[ i ] = m;//.children[0];

	        }

	        if ( o.meshSusp ) {

	            m = o.meshSusp.clone();
	            mesh.add( m );
	            m.position.y = radius;
	            if ( i == 1 || i == 2 ) m.rotation.y = Math.Pi;
	            if ( i == 0 || i == 1 ) m.position.z = wPos[ 2 ];
	            else m.position.z = - wPos[ 2 ];

	            s[ i ] = m.children[ 0 ];

	        }

	        if ( o.meshWheel ) {

	            w[ i ] = o.meshWheel.clone();
	            needScale = false;
	            if ( i == 1 || i == 2 ) {

	                w[ i ] = new THREE.Group();
	                var ww = o.meshWheel.clone();
	                ww.rotation.y = Math.Pi;
	                w[ i ].add( ww );

				} else {

	                w[ i ] = o.meshWheel.clone();
	                var k = w[ i ].children.length;
	                while ( k -- ) {

	                    if ( w[ i ].children[ k ].name === 'h_pneu' ) w[ i ].children[ k ].rotation.y = Math.Pi;

					}

				}


	        } else {

	            if ( i == 1 || i == 2 ) w[ i ] = new THREE.Mesh( gw, root.mat.move );
	            else w[ i ] = new THREE.Mesh( gwr, root.mat.move );

			}



	        if ( needScale ){

	        	w[ i ].scale.set( deep, fw ? radius : radiusBack, fw ? radius : radiusBack );

	        }

	        //else w[i].material = this.mat.move;//mat.cars;

	        w[ i ].material = wheelmat;
	        w[ i ].castShadow = true;
	        w[ i ].receiveShadow = true;

	        root.container.add( w[ i ] );

	    }

	    if ( o.extraWeels ) {

	        var www = o.meshWheel.clone();
	        www.children[ 0 ].visible = false;
	        www.rotation.z = - Math.Pi * 0.5;
	        www.position.set( 0, 1.25, - 1.11 );
	        mesh.add( www );

		}

	    mesh.userData.radius = radius;
	    mesh.userData.w = w;
	    mesh.userData.s = s;
	    mesh.userData.b = b;
	    mesh.userData.isWithSusp = isWithSusp;
	    mesh.userData.isWithBrake = isWithBrake;

	    if( o.noShadow === undefined ){
	    	mesh.castShadow = true;
	        mesh.receiveShadow = true;
	    }
	    
	    mesh.name = name;

	    if ( o.helper ) {

	        mesh.userData.helper = new THREE.CarHelper( wPos, o.masscenter, deep );
	        mesh.add( mesh.userData.helper );

		}



	    if ( o.mesh ) o.mesh = null;
	    if ( o.wheel ) o.wheel = null;

	    if ( o.shapeType == 'mesh' || o.shapeType == 'convex' ) o.v = geometryInfo( o.shape, o.shapeType );

	    if ( o.shape ) delete ( o.shape );
	    if ( o.geometry ) delete ( o.geometry );
	    if ( o.material ) delete ( o.material );
	    if ( o.mesh ) delete ( o.mesh );
	    if ( o.meshWheel ) delete ( o.meshWheel );
	    if ( o.meshSusp ) delete ( o.meshSusp );
	    if ( o.meshBrake ) delete ( o.meshBrake );
	    if ( o.meshSteeringWheel ) delete ( o.meshSteeringWheel );
	    if ( o.wheelMaterial ) delete ( o.wheelMaterial );

		this.cars.push( mesh );

		//map.set( name + '_body', mesh );

		map.set( name , mesh );

		root.post( 'add', o );

	}

} );


export { Vehicle };
