
// this demo is about randomness and accuracy

// ball 65 gramme caoutchouc Diameter  50 mm
// STRESA Mixing system  1 metre diam
// 2 sets of pales turning opposite side.

var r = 0;
var game = 'start';
var ball = [];
var tmpCanvas = document.createElement('canvas');
tmpCanvas.width = tmpCanvas.height = 128;
var yellow = false;
var open1 = false;
var open2 = false;

var glassMat;

var timer;

function demo() {

    view.hideGrid();

    view.addSky({url:'photo.jpg', hdr:true, visible:true });

    view.moveCam({ theta:-15, phi:0, distance:200, target:[34,-16,0] });

    physic.set({

        fps:60,
        substep:2,// more substep = more accurate default set to 2
        gravity:[0,-9.8,0],
        worldscale:10,


    })

    physic.pause();

    view.resetCallBack = extraReset;

    glassMat = view.material({ name:'glassMat', color:0xCCCCCF, transparent:true, opacity:0.3, depthTest:true, depthWrite:false, metalness:0.8, roughness:0.2, premultipliedAlpha:true })

    view.load ( ['million.sea'], afterLoadGeometry, true, true );

}

function extraReset () {

    clearTimeout( timer );

}

function afterLoadGeometry () {

    makeBigMAchine();
    makeLittleMAchine();
    makeBall();

    timer = setTimeout( startSimulation, 3000 );

}

//

function makeBigMAchine () {

    var friction = 0.5;
    var bounce = 0.0;

    physic.add({ 
        name:'roll', type:'mesh', mass:0,
        shape:view.getGeometry( 'million', 'L_roll' ),
        material:glassMat,
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'back', type:'mesh', mass:0,
        shape:view.getGeometry( 'million', 'L_back' ),
        material:glassMat,
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'front', type:'mesh', mass:0,
        shape:view.getGeometry( 'million', 'L_front' ),
        material:glassMat,
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'rampe', type:'mesh', mass:0,
        shape:view.getGeometry( 'million', 'L_rampe' ),
        material:glassMat,
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'pale1', type:'mesh', mass:0, kinematic: true,
        shape:view.getGeometry( 'million', 'L_pale1' ),
        rot:[0,0,45],
        material:glassMat,
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'pale2', type:'mesh', mass:0, kinematic: true,
        shape:view.getGeometry( 'million', 'L_pale2' ),
        material:glassMat,
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'block', type:'box', mass:0, material:glassMat,
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
        material:glassMat,
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'back2', type:'mesh', mass:0, pos:[85,-18,0],
        shape:view.getGeometry( 'million', 'M_back' ),
        material:glassMat,
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'front2', type:'mesh', mass:0, pos:[85,-18,0],
        shape:view.getGeometry( 'million', 'M_front' ),
        material:glassMat,
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'rampe2', type:'mesh', mass:0, pos:[85,0,0],
        shape:view.getGeometry( 'million', 'M_rampe' ),
        material:glassMat,
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'pale3', type:'mesh', mass:0, kinematic: true, rot:[0,0,45], pos:[85,-18,0],
        shape:view.getGeometry( 'million', 'M_pale1' ),
        material:glassMat,
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'pale4', type:'mesh', mass:0, kinematic: true, pos:[85,-18,0],
        shape:view.getGeometry( 'million', 'M_pale2' ),
        material:glassMat,
        friction: friction, restitution: bounce
    });

    physic.add({ 
        name:'block2', type:'box', mass:0, material:glassMat,
        size:[10,2,10], pos:[85,-48.7,0],
        friction: 0, restitution: 0,
    });

}

function makeBall () {

    // add red balls
    
    var i, x, y, l, tmpMat, j = 0;
    for( i = 0; i < 50; i++){

        tmpMat = view.material({
            name:'loto'+i,
            roughness: 0.4,
            metalness: 0.6,
            map: createTexture( i+1 )
        });

        l = Math.floor(i/10);
        x = -27 + (j*6);
        y = 75 - (l*5.);

        physic.add({ 
        	name:(i+1), type:'sphere', material: tmpMat,
        	geometry:view.getGeometry( 'million', 'ball' ),
        	size:[2.5], geoSize:[2.5], pos:[x, y, -11.6], mass:0.65, state:4, 
        	friction: 0.5, restitution: 0.3, 
        });
        j++;
        if(j===10) j = 0;

    }

    // add yellow balls
    
    j = 0;
    for( i = 0; i < 12; i++){

        tmpMat = view.material({
            name:'lotox'+i,
            roughness: 0.4,
            metalness: 0.6,
            map: createTexture(  i+1, true )
        });

        l = Math.floor(i/6);
        x = 70 + (j*6);
        y = 25 - (l*5);

        physic.add({ 
            name:'x'+(i+1), type:'sphere', material: tmpMat,
            geometry:view.getGeometry( 'million', 'ball' ),
            size:[2.5], geoSize:[2.5], pos:[x, y, -9.75], mass:0.65, state:4, 
            friction: 0.5, restitution: 0.3, 
        });
        j++;
        if(j===6) j = 0;

    }

    

};

function startSimulation () {

    physic.play();
    
    timer = setTimeout( function(){ 

        physic.add({ 
            name:'close', type:'mesh', mass:0, material:glassMat,//, material:'hide',
            shape:view.getGeometry( 'million', 'L_close' ),
            friction: 0.5, restitution: 0.0
        });

        physic.postUpdate = update; 

        timer = setTimeout( wantBall, 6000 );

    }, 6000 );

}

function wantBall () {

	game = 'wantBall';

    if( yellow ) open2 = true;
    else open1 = true;
	

}

function haveBall ( name ) {

	game = 'haveBall';

	open1 = false;
	open2 = false;
	
	ball.push(name);

	if( ball.length<5 ){
		timer = setTimeout( wantBall, 6000 );
	} else if(ball.length<7){
        yellow = true;
        timer = setTimeout( wantBall, 6000 );
    } else {
		console.log( ball );
	}

}

function update () {

	r+=1;

	var mtx = [

        { name:'pale1', pos:[0,0,0],    rot:[0,0,r+45], noVelocity:true },
        { name:'pale2', pos:[0,0,0],    rot:[0,0,-r],   noVelocity:true },
        { name:'pale3', pos:[85,-18,0], rot:[0,0,r+45], noVelocity:true },
        { name:'pale4', pos:[85,-18,0], rot:[0,0,-r],   noVelocity:true },

        { name:'block', pos:[ 0, -48.7, open1 ? -10 : 0 ] },
        { name:'block2', pos:[ 85, -48.7, open2 ? -10 : 0  ]}

    ];

    physic.matrix( mtx );

    var x = [];
    // get list of rigidbody
    var bodys = physic.getBodys();

    bodys.forEach( function ( b, id ) {

    	if( game === 'wantBall' && b.type === 'body' && ball.indexOf(b.name) === -1 ){
    		if( b.position.y < -54 ) haveBall( b.name );
    	}

    });

}

function createTexture ( n, y ){

    var old = view.getTexture('ball_' + n + (y ? 'R':'Y'));
    if( old !== null ) return old;

	ctx = tmpCanvas.getContext("2d");

    ctx.clearRect(0, 0, 128, 128);

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
	ctx.fillText( n, 64, 80 );

    var img = new Image(128, 128);
    img.src = tmpCanvas.toDataURL( 'image/png' );

	var t = new THREE.Texture( img );
	t.needsUpdate = true;
	t.flipY = false;
    t.name = 'ball_' + n + (y ? 'R':'Y');

	return t;

}