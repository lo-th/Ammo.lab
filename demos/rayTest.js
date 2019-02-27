var ball;

function demo() {

    view.moveCam({ theta:-45, phi:30, distance:40, target:[0,0,0] });

    physic.set({
        worldscale:1,
    }); // reset default setting

    view.hideGrid();

    // basic geometry body

    //physic.add({ type:'plane', friction:1 }); // infinie plane
    physic.add({ type:'box', size:[10,2,60], rot:[10,0,0], pos:[0,-1.2,0], friction:0.5 });

    ball = physic.add({ type:'highsphere', name:'ball', size:[5], pos:[0,10,-25], mass:2, friction:0.5 });

    var i = 10;
    while(i--){
        physic.add({ type:'ray', pos:[i-4.5,20,0], end:[0,-20, 0], callback:Yoch });
    }
    
    physic.postUpdate = update;

};

function Yoch( o ){

    //console.log( o.name )

}

function update () {

    if(ball.position.y<-10) physic.matrix( [{ name:'ball', pos: [ Math.rand(-4,4),10,-25 ], noVelocity:true }] );

}