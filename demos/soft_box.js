function demo() {

    view.moveCam({ theta:90, phi:20, distance:40, target:[0,1,0] });
    view.load ( 'pig.sea', afterLoad, true );

}

function afterLoad () {

    physic.add({ type:'plane' }); // infinie plane

    physic.add({ type:'box', size:[40,2,40], pos:[0,-1,0], rot:[0,0,0], mass:0, group:1 });
    
    //add({ type:'box', size:[40,10,1], pos:[0,4.6,0], rot:[45,0,0], mass:0 });
    //add({ type:'box', size:[40,2,40], pos:[0,1,-10], rot:[0,0,0], mass:0 });

    var i = 10;

    while(i--){

        var y = 15+(i*15);
        var x = 0;//-5+(i*2.5);
        var r = Math.randInt(0,360)

        physic.add({ 
            type:'softMesh',
            shape:view.getGeometry( 'pig', 'cubic' ),

            pos:[x,y,0],
            size:[1,1,1],
            rot:[0,r,0],

            mass:2,
            state:4,

            viterations: 10,
            piterations: 10,
            //citerations:4,
            //diterations:0,

            friction: 0.3,
            damping: 0.01,
            pressure: 100,
            stiffness: 0.6,

            margin:0.05,
            fromfaces:true,
            
        });

    }




}