function demo() {

    cam ( 90, 30, 40 );

    view.setShadowPosY(-10.1)

    // infinie plane
    add({type:'plane', name:'ground', pos:[0,-10,0]});

    // static box
    add({ type:'box', size:[10,10,4], pos:[0,-5,8.2], rot:[45,0,0], mass:0 });
    add({ type:'box', size:[10,10,10], pos:[0,-9,0], rot:[0,0,0], mass:0 });
    // box filter
    add({ type:'box', size:[10,6,4], pos:[0,-5,-4.8], rot:[0,0,0], mass:0 });

    add({ 
        type:'cloth', name:'cloth', 
        mass:20, state:4, pos:[0,0,0], 
        size:[100,0,100],
        div:[64,64],
        viterations:10,
        piterations:60,
        citerations:4,
        diterations:0,
        fixed: 1+2+4+8,
        gendiags:true,
    });

    //anchor({soft:'cloth', body:'ground', pos:0});
    //anchor({soft:'cloth', body:'ground', pos:100});



}