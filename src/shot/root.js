// ROOT reference of engine

export var REVISION = '002';

export var root = {

	Ar: null,
	ArLng: [],
	ArPos: [],
	ArMax: 0,
	key: [ 0, 0, 0, 0, 0, 0, 0, 0 ],

	post: null, // send to worker
	extraGeo: [], // array of extra geometry to delete

	container: null, // THREE scene or group
	tmpMat: [], // tmp materials
	mat: {}, // materials object
	geo: {}, // geometrys object

	torad: 0.0174532925199432957,

};

// ROW map

export var map = new Map();


export function vectorad( r ) {

	var i = r.length;
	while ( i -- ) r[ i ] *= root.torad;
	return r;

}
