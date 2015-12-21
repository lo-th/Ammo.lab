function demo() {

    cam ( 90, 20, 40 );

    add({type:'plane' }); // infinie plane
    add({ type:'box', size:[40,10,1], pos:[0,4.6,0], rot:[45,0,0], mass:0 });
    add({ type:'box', size:[40,2,40], pos:[0,1,-10], rot:[0,0,0], mass:0 });

    

    add({ 
        type:'ellipsoid',
        center:[10, 20, 0],
        radius:[3, 5, 3],
        vertices:512,
        mass:20, state:4,
        viterations:10,
        piterations:10,
        citerations:4,
        diterations:0,
        
        kdf:1,
        kdp:0.001,
        kpr:2500,

        // material setting ?
        klst : 0.1,
        kast : 0.1,
        kvst : 0.1,
        
        margin:0.1,
    });

    add({ 
        type:'ellipsoid',
        center:[0, 20, 0],
        radius:[3, 3, 3],
        vertices:128,
        mass:20, state:4,
        viterations:10,
        piterations:10,
        citerations:4,
        diterations:0,

        kdf:1,
        kdp:0.001,
        kpr:2500,

        margin:0.1,
    });

    add({ 
        type:'ellipsoid',
        center:[-10, 20, 0],
        radius:[2, 1, 2],
        vertices:64,
        mass:20, state:4,
        viterations:10,
        piterations:10,
        citerations:4,
        diterations:0,

        kdf:1,
        kdp:0.001,
        kpr:2500,
        
        margin:0.1,
    });

    /*add({ type:'sphere', size:[3], pos:[-20, 40, 0], mass:1});
    add({ type:'sphere', size:[3], pos:[-10, 50, 0], mass:1});
    add({ type:'sphere', size:[3], pos:[0, 60, 0], mass:1});
    add({ type:'sphere', size:[3], pos:[10, 70, 0], mass:1});
    add({ type:'sphere', size:[3], pos:[20, 80, 0], mass:1});*/

}