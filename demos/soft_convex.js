function demo() {

    cam ({ azim:90, polar:20, distance:40 });
    load ( 'test', afterLoad );

}

function afterLoad () {

    add({type:'plane'}); // infinie plane
    //add({ type:'box', size:[40,10,1], pos:[0,4.6,0], rot:[45,0,0], mass:0 });
    //add({ type:'box', size:[40,2,40], pos:[0,1,-10], rot:[0,0,0], mass:0 });

    var geo = view.getGeo();

    add({ 
        type:'softConvex',
        shape:geo['m6'],

        pos:[0,5,0],

        mass:2,
        state:4,

        viterations: 10,
        piterations: 10,
        //citerations:4,
        //diterations:0,

        kdf: 0.1,// friction
        kdp: 0.01,// Damping
        kpr: 200,// Pressure

        // Stiffness
        klst: 0.5,
        kast: 0.5,

        margin:0.05,
    });




}