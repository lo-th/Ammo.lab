function demo() {

    cam ( 90, 20, 40 );
    load ( 'avatar_low', afterLoad )
    view.addMap('avatar.jpg', 'cars');

}

function afterLoad () {

    //add({type:'plane' }); // infinie plane

    add({ type:'box', size:[40,2,40], pos:[0,2.5,0], rot:[0,0,0], mass:0, group:1 });
    
    //add({ type:'box', size:[40,10,1], pos:[0,4.6,0], rot:[45,0,0], mass:0 });
    //add({ type:'box', size:[40,2,40], pos:[0,1,-10], rot:[0,0,0], mass:0 });

    var geo = view.getGeo();

    var i = 6;



    while(i--){

        var y = 90+(i*90);
        var x = 0;//-5+(i*2.5);
        var r = Math.randInt(0,360);
        var t = Math.randInt(0,1)

        add({ 
            type:'softTriMesh',
            shape: t == 0 ? geo['woman']: geo['man'],
            material: view.getMat()['cars'], 
            //shape:geo['cubic'],
            //shape:geo['spheric'],

            pos:[x,y,0],
            size:[0.1,0.1,0.1],
            //rot:[0,r,0],

            mass:10,
            state:4,

            viterations: 2,
            piterations: 2,
            //citerations: 1,
            //diterations: 1,

            kdf: 0.1,// friction
            kdp: 0.01,// Damping
            kpr: 50,// Pressure
            //kvc: 20,

            // Stiffness
            klst: 0.9,
            kast: 0.9,

            margin:0.1,
            fromfaces:true,
        });

    }

}