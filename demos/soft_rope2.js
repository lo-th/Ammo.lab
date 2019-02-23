function demo() {

    view.moveCam({ theta:40, phi:20, distance:70, target:[0,0,0] });

    physic.set(); // reset default setting

    view.hideGrid();

    physic.add({type:'plane', friction:0.6, restitution:0.1 }); // infinie plane

    var x, y, z;
    
    for( var i = 0; i < 3; i++){

        y = 30 + i*10;
        z = -2 + i*2; 

        physic.add({ 
            type:'softRope',
            name:'rope'+i, 
            radius:0.5,
            mass:10,
            state:4, 
            start:[-40,y,z],
            end:[40,y,z], 
            numSegment:22,
            numSeg:22*3,
            viterations:10,
            piterations:10,
            citerations:10,
            diterations:10,
            fixed: 0,
            margin:0.5,
        });
    }
    
    for( var i = 0; i < 30; i++){

        x = Math.randInt( -30, 30 );
        y = Math.randInt( 2, 20 ); 
        physic.add({ type:'cylinder', size:[2,10,2], rot:[90,0,0], pos:[x,y,0], mass:0 });

    }

}