
var chess = ['king', 'queen', 'bishop', 'knight', 'rook', 'pawn'];
var h = [ 3.785, 3.4, 2.716, 2.648, 2.138, 1.973 ];
var chessSize = 2;

var chess_black, chess_white;

function demo() {

    view.moveCam({ theta:25, phi:20, distance:80, target:[0,1,0] });

    view.addSky({ url:'photo.jpg', visible:true });

    view.initGrid({s1:64,s2:8, c1:0x000000, c2:0x000000})
    
    physic.set({

        fps:60,
        substep:2,// more substep = more accurate default set to 2
        gravity:[0,-9.8,0],
        worldscale:10,

    })

    view.load ( 'chess.sea', afterLoadGeometry, true, true );

};

function afterLoadGeometry () {

	// infinie plane
    physic.add({type:'plane'});

	chess_black = view.material({
        name:'chess_black',
        color:0x343434,
        roughness: 0.4,
        metalness: 0.5,
        aoMap: { url:'chess.jpg' },
    });

    chess_white = view.material({
        name:'chess_white',
        color:0xcbad7b,
        roughness: 0.4,
        metalness: 0.5,
        aoMap: { url:'chess.jpg' },
    });

    var p = [

        { "type":"rook" },
		{ "type":"knight", "rot":[0,90,0] },
		{ "type":"bishop" },
		{ "type":"queen" },
		{ "type":"king", "rot":[0,90,0] },
		{ "type":"bishop"},
		{ "type":"knight", "rot":[0,-90,0] },
		{ "type":"rook" },

		{ "type":"pawn" },
		{ "type":"pawn" },
		{ "type":"pawn" },
		{ "type":"pawn" },
		{ "type":"pawn" },
		{ "type":"pawn" },
		{ "type":"pawn" },
		{ "type":"pawn" },

		{ "type":"pawn", "black":true, "decal":[-4*8,0] },
		{ "type":"pawn", "black":true },
		{ "type":"pawn", "black":true },
		{ "type":"pawn", "black":true },
		{ "type":"pawn", "black":true },
		{ "type":"pawn", "black":true },
		{ "type":"pawn", "black":true },
		{ "type":"pawn", "black":true },

		{ "type":"rook", "black":true },
		{ "type":"knight", "black":true, "rot":[0,90,0] },
		{ "type":"bishop", "black":true, "rot":[0,180,0] },
		{ "type":"queen", "black":true },
		{ "type":"king", "black":true, "rot":[0,90,0] },
		{ "type":"bishop", "black":true, "rot":[0,180,0] },
		{ "type":"knight", "black":true, "rot":[0,-90,0] },
		{ "type":"rook", "black":true }

	];

	calculatePosition( p );

	var i = p.length;

	while(i--){
		physic.add( addPiece( p[i], i ) );
	}




};

function calculatePosition ( items ) {

	var cell = [4,8]
	var space = [8,8]
	var center = [-14,0]


    var x = cell[0];
	var z = cell[1];
	var sx = space[0];
	var sz = space[1];
	var dx = ((x*sx)*0.5) - x*0.5;
	var dz = ((z*sz)*0.5) - z*0.5;
	var n = 0;
	var item;

	for(var i = 0; i < x; i++){
		for(var j = 0; j < z; j++){

			item = items[n];

			if( item.decal !== undefined ){
				dx += item.decal[0];
				dz += item.decal[1];
			}

			item.pos = [ (i*sx)+center[0]-dx, 2, (j*sz)+center[1]-dz ];

			//if( item.name === undefined ) item.name = 'p'+ n;

			n++;
		}
	}
}

function addPiece ( o, i ) {

	var n = chess.indexOf( o.type );

	var m = {

		shape: view.getGeometry( 'chess', o.type + '_shape' ),//geometry( o.type + '_shape'),
		geometry: view.getGeometry( 'chess', o.type, true ),
	    name: o.name || 'p' + n + i, 
	    material: o.black ? chess_black : chess_white,
		type: 'convex', 
		size: [ chessSize ], 
		geoScale: [ chessSize ], 
		pos: [ o.pos[0] || 0,( o.pos[1] || 0) + h[n]*chessSize, o.pos[2] || 0 ], 
		rot: o.rot || [0,0,0],
		mass: o.mass || 10, 
		friction:o.friction || 1,
		rolling:0.9,
		angular:0.5,
		margin:0.03
	}

	return m;

};
