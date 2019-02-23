function demo() {

    view.moveCam({ theta:90, phi:20, distance:40, target:[0,1,0] });
    physic.set(); // reset default setting
    view.load ( 'pig.sea', afterLoad, true );

}

function afterLoad () {

    physic.add({ type:'plane' }); // infinie plane

    physic.add({ type:'box', size:[40,2,40], pos:[0,-1,0], rot:[0,0,0], mass:0 });

    physic.add({ type:'cylinder', size:[2,10,2], rot:[0,1,90], pos:[0,0,0], mass:0 });
    physic.add({ type:'cylinder', size:[2,10,2], rot:[0,1,90], pos:[0,0,4], mass:0 });
    physic.add({ type:'cylinder', size:[2,10,2], rot:[0,1,90], pos:[0,0,-4], mass:0 });

    var geo = view.getGeo();

    var i = 6;

    while(i--){

        var y = 15+(i*15);
        var r = Math.randInt(0,360);

        physic.add({

            type:'softMesh',
            shape:view.getGeometry( 'pig', 'pig' ),
            
            pos:[0,y,0],
            size:[2,2,2],
            rot:[0,r,0],

            mass:8,
            state:4,

            viterations: 1,
            piterations: 1,
            citerations: 1,
            diterations: 2,

            friction: 0.6,
            dmping: 0.01,
            pressure: 260,
            stiffness: 0.6,

            margin:0.05,
            fromfaces:true,

        });

    }

}