// ROOT reference of engine

export var REVISION = '005';

export var root = {

	Ar: null,
	ArLng: [],
	ArPos: [],
	ArMax: 0,
	key: [ 0, 0, 0, 0, 0, 0, 0, 0 ],

	constraintDebug: false,

	flow:{
		//matrix:{},
		//force:{},
		//option:{},
		ray:[],
		terrain:[],
		vehicle:[],
		key:[],
	},

	post: null, // send to worker
	extraGeo: [], // array of extra geometry to delete

	container: null, // THREE scene or group
	tmpMat: [], // tmp materials
	mat: {}, // materials object
	geo: {}, // geometrys object
	controler: null,

	torad: Math.PI / 180,

	isRefView: false,

	correctSize: function ( s ) {

		if ( s.length === 1 ) s[ 1 ] = s[ 0 ];
	    if ( s.length === 2 ) s[ 2 ] = s[ 0 ];
	    return s;

	},

	// rotation

	tmpQ: new THREE.Quaternion(),
	tmpE: new THREE.Euler(),
	tmpM: new THREE.Matrix4(),

	toQuatArray: function ( rotation ) { // rotation array in degree

		return root.tmpQ.setFromEuler( root.tmpE.fromArray( root.vectorad( rotation ) ) ).toArray();

	},

	vectorad: function ( r ) {

		var i = r.length;
	    while ( i -- ) r[ i ] *= root.torad;
	    return r;

	},


};

// ROW map

export var map = new Map();