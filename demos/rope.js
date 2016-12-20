function demo() {

    cam ( 90, 20, 60 );

    add({type:'plane', friction:0.6, restitution:0.1 }); // infinie plane

    var z = 0;
    
    for( var i = 0; i < 20; i++){

        z = -20 + i*2;

        add({ 
            type:'rope', name:'r1', 
            radius:0.5,
            mass:1,
            state:4, 
            start:[-40,10,z],
            end:[40,10,z], 
            numSegment:20,
            viterations:10,
            piterations:10,
            citerations:4,
            diterations:0,
            fixed: 1+2,
            //margin:0.1,
        });
    }

    add({ type:'sphere', size:[3], pos:[-20, 40, 0], mass:0.2});
    add({ type:'sphere', size:[3], pos:[-10, 50, 0], mass:0.2});
    add({ type:'sphere', size:[3], pos:[0, 60, 0], mass:0.2});
    add({ type:'sphere', size:[3], pos:[10, 70, 0], mass:0.2});
    add({ type:'sphere', size:[3], pos:[20, 80, 0], mass:0.2});

}