function demo() {

    cam ({ azim:0, polar:10, distance:40 });

    // basic geometry body

    water({ g:[0,-10,0], normal:[0,1,0], density:1000, offset:10 })

    add({type:'plane', pos : [0,-10,0]}); // infinie plane

    var geo = view.getGeo();

    add({ type:'box', size:[40,2,40], pos:[0,-9,0], rot:[0,0,0], mass:0, group:1 });

    var i = 10;

    while(i--){

        var y = 15+(i*15);
        var x = 0;//-5+(i*2.5);
        var r = Math.randInt(0,360)

        add({ 
            type:'softTriMesh',
            //shape:geo['pig'],
            //shape:geo['cubic'],
            shape:geo['box'],

            pos:[x,y,0],
            size:[2,2,2],
            rot:[0,r,0],

            mass:0.2,
            state:4,

            /*viterations: 10,
            piterations: 10,
            citerations: 10,
            diterations: 10,*/

            kdf: 0.3,// friction
            kdp: 0.01,// Damping
            kpr: 100,// Pressure

            // Stiffness
            klst: 0.6,
            kast: 0.6,

            margin:0.05,
            fromfaces:true,
        });

    }

};