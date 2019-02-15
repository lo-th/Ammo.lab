// ROOT reference of engine

export var REVISION = '001';

export var root = {

	Ar: null,
	ArLng: [],
	ArPos: [],
	ArMax: 0,
	key: [ 0, 0, 0, 0, 0, 0, 0, 0 ],

	post:null,// send to worker
	extraGeo: [], // array of extra geometry to delete

	container: null,// THREE scene or group
	mat: {}, // materials object
	geo: {}, // geometrys object

};

// ROW map

export var map = new Map();