function demo() {

    view.moveCam({ theta:45, phi:30, distance:20, target:[0,2,0] });

    physic.set(); // reset default setting

    // infinie plane
    physic.add({type:'plane'});

    // static box
   // physic.add({ type:'box', size:[10,10,1], pos:[0,4.6,8.2], rot:[45,0,0], mass:0, group:1, mask:4 });
    physic.add({ type:'box', size:[10,1,16], pos:[0,1,0], rot:[0,0,0], mass:0});
    physic.add({ type:'box', size:[0.5,7,16], pos:[-5.25,4,0], rot:[0,0,0], mass:0});
    physic.add({ type:'box', size:[0.5,7,16], pos:[5.25,4,0], rot:[0,0,0], mass:0});

    physic.add({ type:'box', size:[11,0.5,16], pos:[0,7.75,0], rot:[0,0,0], mass:0});
    // box filter
    physic.add({ type:'box', size:[10,6,2], pos:[0,4.5,-7], rot:[0,0,0], mass:0 });

    setTimeout( function (){ launchBullet(); }, 2000)

}

function launchBullet () {

    var i = 50, r = 0.2, d = 0.4, x;
    while(i--){
        x = Math.rand(-4,4);
        physic.add({ 
            type:'capsule', size:[r,r*2,r], pos:[x, 5 ,100+(i*3)], mass:0.2, linearVelocity:[0,0,-1000],
            ccdThreshold:0.0000001,
            ccdRadius:0.1,
            rollingFriction:0.9,
        });
    }

}