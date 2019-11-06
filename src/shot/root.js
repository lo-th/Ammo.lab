// ROOT reference of engine

export var REVISION = '004';

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


};

// ROW map

export var map = new Map();


export function vectorad( r ) {

	var i = r.length;
	while ( i -- ) r[ i ] *= root.torad;
	return r;

}