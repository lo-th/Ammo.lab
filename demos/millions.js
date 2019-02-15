// ball 65 gramme caoutchouc Diameter  50 //: 40, 50, 70, 83 mm
 
// machine Ryo-Catteau STRESA Mixing system
// 1 metre diam
// 2 sets of pales turning opposite side.

var r = 0;
var game = 'start';
var ball = [];

function demo() {

    view.hideGrid();

    //view.addSky({url:'photo.jpg', hdr:true });

    view.moveCam({ theta:-30, phi:0, distance:160, target:[0,-20,0] });

    physic.set({

        fps:60,
        substep:2,// more substep = more accurate simulation default set to 2
        gravity:[0,-9.8,0],
        worldscale:10,


    })

    view.load ( ['million.sea'], afterLoadGeometry, true, true );

};

function afterLoadGeometry () {

    var friction = 0.5;
    var bounce = 0.0;

    physic.add({ 
        name:'roll',
        type:'mesh',
        shape:view.getGeometry( 'million', 'L_roll' ),
        mass:0,
        //geometry: view.getGeometry( 'million', '' ),
        friction: friction, 
        restitution: bounce,
        group:2,
    });

    physic.add({ 
        name:'back',
        type:'mesh',
        shape:view.getGeometry( 'million', 'L_back' ),
        mass:0,
        //geometry: view.getGeometry( 'million', '' ),
        friction: friction, 
        restitution: bounce,
        group:2,
    });

    physic.add({ 
        name:'front',
        type:'mesh',
        shape:view.getGeometry( 'million', 'L_front' ),
        mass:0,
        //geometry: view.getGeometry( 'million', '' ),
        friction: friction, 
        restitution: bounce,
        group:2,
    });

    physic.add({ 
        name:'rampe',
        type:'mesh',
        shape:view.getGeometry( 'million', 'L_rampe' ),
        mass:0,
        //geometry: view.getGeometry( 'million', '' ),
        friction: friction, 
        restitution: bounce,
        group:2,
    });

    physic.add({ 
        name:'pale1',
        type:'mesh',
        shape:view.getGeometry( 'million', 'L_pale1' ),
        mass:0,
        rot:[0,0,45],
        //geometry: view.getGeometry( 'million', '' ),
        material:'static',
        friction: friction, 
        restitution: bounce,
        kinematic: true,
        group:4,
    });

    physic.add({ 
        name:'pale2',
        type:'mesh',
        shape:view.getGeometry( 'million', 'L_pale2' ),
        mass:0,
        //geometry: view.getGeometry( 'million', '' ),
        material:'static',
        friction: friction, 
        restitution: bounce,
        kinematic: true,
        group:4,
    });

    physic.add({ 
        name:'block',
        type:'box',
        size:[10,2,10],
        pos:[0,-48.7,0],
        mass:0,
        material:'hide',
        friction: 0, 
        restitution: 0,
    });

    // add balls
    
    var i, x, y, c, l, tmpMat, j = 0;
    for( i = 0; i < 50; i++){

    	tmpMat = view.mat.move.clone();
    	tmpMat.name = 'loto'+i;
    	tmpMat.map = createTexture( i+1 );
        l = Math.floor(i/10);
    	c = Math.floor(i/5);

        x = -27 + (j*6);
        y = 75 - (l*5.);

        physic.add({ 
        	name:i+i,
        	type:'sphere', 
        	material: tmpMat,
        	geometry:view.getGeometry( 'million', 'ball' ),
        	size:[2.5], pos:[x, y, -11.6], mass:0.65, state:4, 
        	friction: 0.5, 
        	restitution: 0.3, 
        });
        j++;
        if(j===10) j = 0;
    }

    setTimeout( function(){ 

    	physic.add({ 
	        name:'close',
	        type:'mesh',
	        shape:view.getGeometry( 'million', 'L_close' ),
	        mass:0,
	        material:'hide',
	        friction: friction, 
	        restitution: bounce
	    });

    	physic.postUpdate = update; 

    }, 2000 );

    setTimeout( wantBall, 8000 );

    


};

function wantBall () {
    
	physic.matrix( [['block', [ 0, -48.7, -10 ] ]] );
	game = 'wantBall';

}

function haveBall ( name ) {

	physic.matrix( [['block', [ 0, -48.7, 0 ] ]] );
	game = 'haveBall';
	ball.push(name);

	if(ball.length<5){
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