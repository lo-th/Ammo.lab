function demo() {

    //substep( 1 )

    cam ({ azim:0, polar:20, distance:40 });
    load ( 'avatar_low', afterLoad )
    view.addMap('avatar.jpg', 'avatar');

}

function afterLoad () {

    //add({type:'plane' }); // infinie plane

    add({ type:'box', size:[40,2,40], pos:[0,2.5,0], rot:[0,0,0], mass:0, group:1 });
    
    //add({ type:'box', size:[40,10,1], pos:[0,4.6,0], rot:[45,0,0], mass:0 });
    //add({ type:'box', size:[40,2,40], pos:[0,1,-10], rot:[0,0,0], mass:0 });

    var geo = view.getGeo();

    var i = 4;



    while(i--){

        var y = 90+(i*90);
        var x = 0;//-5+(i*2.5);
        var r = Math.randInt(0,360);
        var t = Math.randInt(0,1)

        add({ 
            type:'softMesh',
            shape: t == 0 ? geo['woman']: geo['man'],
            material: 'avatar', 
            //shape:geo['cubic'],
            //shape:geo['spheric'],

            pos:[x,y,0],
            size:[0.1,0.1,0.1],
            rot:[0,r,0],

            mass:75,
            state:4,

            viterations: 7,
            piterations: 1,
            //citerations: 1,
            //diterations: 0,

            friction: 0.5,
            damping: 0.1,
            pressure: 500,
            stiffness: 1,

            margin:0.1,
            fromfaces:false,

        });

    }

}