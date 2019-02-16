
// this demo is about randomness and accuracy
// if you win euromillion with this send me one million ;)

// ball 65 gramme caoutchouc Diameter  50 mm
// STRESA Mixing system  1 metre diam
// 2 sets of pales turning opposite side.

var r = 0;
var game = 'start';
var ball = [];

function demo() {

    view.hideGrid();

    view.addSky({url:'photo.jpg', hdr:true });

    view.moveCam({ theta:-15, phi:0, distance:160, target:[34,-16,0] });

    physic.set({

        fps:60,
        substep:2,// more substep = more accurate simulation default set to 2
        gravity:[0,-9.8,0],
        worldscale:10,


    })

    view.load ( ['million.sea'], afterLoadGeometry, true, true );

};

function afterLoadGeometry () {

    makeBigMAchine();
    makeLittleMAchine();

    addBall();
    startSimulation();

}

//

function makeBigMAchine () {

    var friction = 0.5;
    var bounce = 0.0;

    physic.add({ 
        name:'roll', type:'mesh', mass:0,
        shape:view.getGeometry( 'million', 'L_roll' ),
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'back', type:'mesh', mass:0,
        shape:view.getGeometry( 'million', 'L_back' ),
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'front', type:'mesh', mass:0,
        shape:view.getGeometry( 'million', 'L_front' ),
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'rampe', type:'mesh', mass:0,
        shape:view.getGeometry( 'million', 'L_rampe' ),
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'pale1', type:'mesh', mass:0, kinematic: true,
        shape:view.getGeometry( 'million', 'L_pale1' ),
        rot:[0,0,45],
        material:'static',
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'pale2', type:'mesh', mass:0, kinematic: true,
        shape:view.getGeometry( 'million', 'L_pale2' ),
        material:'static',
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'block', type:'box', mass:0, material:'hide',
        size:[10,2,10], pos:[0,-48.7,0],
        friction: 0, restitution: 0,
    });

}

function makeLittleMAchine () {

    var friction = 0.5;
    var bounce = 0.0;

    physic.add({ 
        name:'roll2', type:'mesh', mass:0, pos:[85,-18,0],
        shape:view.getGeometry( 'million', 'M_roll' ),
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'back2', type:'mesh', mass:0, pos:[85,-18,0],
        shape:view.getGeometry( 'million', 'M_back' ),
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'front2', type:'mesh', mass:0, pos:[85,-18,0],
        shape:view.getGeometry( 'million', 'M_front' ),
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'rampe2', type:'mesh', mass:0, pos:[85,0,0],
        shape:view.getGeometry( 'million', 'M_rampe' ),
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'pale3', type:'mesh', mass:0, kinematic: true, rot:[0,0,45], pos:[85,-18,0],
        shape:view.getGeometry( 'million', 'M_pale1' ),
        material:'static',
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'pale4', type:'mesh', mass:0, kinematic: true, pos:[85,-18,0],
        shape:view.getGeometry( 'million', 'M_pale2' ),
        material:'static',
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'block2', type:'box', mass:0, material:'hide',
        size:[10,2,10], pos:[85,-48.7,0],
        friction: 0, restitution: 0,
    });

}

function addBall () {

    // add red balls
    
    var i, x, y, l, tmpMat, j = 0;
    for( i = 0; i < 50; i++){

    	tmpMat = view.mat.move.clone();
    	tmpMat.name = 'loto'+i;
    	tmpMat.map = createTexture( i+1 );

        physic.addMat( tmpMat );

        l = Math.floor(i/10);
        x = -27 + (j*6);
        y = 75 - (l*5.);

        physic.add({ 
        	name:(i+1), type:'sphere', material: tmpMat,
        	geometry:view.getGeometry( 'million', 'ball' ),
        	size:[2.5], pos:[x, y, -11.6], mass:0.65, state:4, 
        	friction: 0.5, restitution: 0.3, 
        });
        j++;
        if(j===10) j = 0;

    }

    // add yellow balls
    
    j = 0;
    for( i = 0; i < 12; i++){

        tmpMat = view.mat.move.clone();
        tmpMat.name = 'loto'+i;
        tmpMat.map = createTexture( i+1, true );

        physic.addMat( tmpMat );

        l = Math.floor(i/6);
        x = 70 + (j*6);
        y = 25 - (l*5);

        physic.add({ 
            name:'x'+(i+1), type:'sphere', material: tmpMat,
            geometry:view.getGeometry( 'million', 'ball' ),
            size:[2.5], pos:[x, y, -9.75], mass:0.65, state:4, 
            friction: 0.5, restitution: 0.3, 
        });
        j++;
        if(j===6) j = 0;

    }

    

};

function startSimulation () {
    
    setTimeout( function(){ 

        physic.add({ 
            name:'close', type:'mesh', mass:0, material:'static',//, material:'hide',
            shape:view.getGeometry( 'million', 'L_close' ),
            friction: 0.5, restitution: 0.0
        });

        physic.postUpdate = update; 

    }, 2000 );

    setTimeout( wantBall, 8000 );

}

var yellow = false;

function wantBall () {
    
	if( yellow ) physic.matrix( [['block2', [ 85, -48.7, -10 ] ]] );
    else physic.matrix( [['block', [ 0, -48.7, -10 ] ]] );
	game = 'wantBall';

}

function haveBall ( name ) {

	if( yellow ) physic.matrix( [['block2', [ 85, -48.7, 0 ] ]] );
    else physic.matrix( [['block', [ 0, -48.7, 0 ] ]] );
	game = 'haveBall';
	ball.push(name);

	if(ball.length<5){
		setTimeout( wantBall, 4000 );
	} else if(ball.length<7){
        yellow = true;
        setTimeout( wantBall, 4000 );
    } else {
		console.log( ball );
	}


}

function update () {

	r+=1;

    physic.matrix([

        ['pale1', [0,0,0], [0,0,r+45], true ],
        ['pale2', [0,0,0], [0,0,-r], true ],
        ['pale3', [85,-18,0], [0,0,r+45], true ],
        ['pale4', [85,-18,0], [0,0,-r], true ],

    ]);

    var x = [];
    // get list of rigidbody
    var bodys = physic.getBodys();

    bodys.forEach( function ( b, id ) {

    	if( game === 'wantBall' && b.isBody && ball.indexOf(b.name) === -1 ){
    		if( b.position.y < -54 ) haveBall( b.name );
    	}

    });

}

function createTexture ( n, y ){

	var c = document.createElement('canvas');
	c.width = c.height = 128;

	ctx = c.getContext("2d");

	ctx.beginPath();
	ctx.rect(0, 0, 128, 128);
	ctx.fillStyle = y ? "#e1c75f" : "#c35839";
	ctx.fill();
    
    ctx.beginPath();
	ctx.arc(55, 64, 40, 0, 2 * Math.PI);
	ctx.fillStyle = "#FFFFFF";
	ctx.fill();

	ctx.beginPath();
	ctx.arc(73, 64, 40, 0, 2 * Math.PI);
	ctx.fill();

	ctx.beginPath();
	ctx.rect(55, 24, 18, 80);
	ctx.fill();

	ctx.beginPath();
	ctx.fillStyle = "#000000";
	ctx.textAlign = "center";
	ctx.font = 'bold 48px Arial';
	ctx.fillText(n, 64, 80);

	t = new THREE.Texture( c );
	t.needsUpdate = true;
	t.flipY = false;

	return t;

}