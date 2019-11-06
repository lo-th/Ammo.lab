// ROOT reference of engine worker

export var root = {

	Ar: null,
	ArPos: null,

	constraintDebug: false,

	matrix:[],
	force:[],
	option:[],

	flow:{
		//matrix:{},
		//force:{},
		//option:{},
		ray:[],
		terrain:[],
		vehicle:[],
		
	},

	world: null,
	gravity: null,
	scale: 1,
	invscale: 1,
	angle: 0,

	key:[ 0, 0, 0, 0, 0, 0, 0, 0 ],

	post:null,

};

// ROW map

export var map = new Map();
