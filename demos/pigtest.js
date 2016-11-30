function demo() {

    cam ( 90, 20, 40 );
    load ( 'pig', afterLoad );

}

function afterLoad () {

    add({type:'plane' }); // infinie plane

    //add({ type:'box', size:[40,2,40], pos:[0,2.5,0], rot:[0,0,0], mass:0, group:1 });
    
    //add({ type:'box', size:[40,10,1], pos:[0,4.6,0], rot:[45,0,0], mass:0 });
    //add({ type:'box', size:[40,2,40], pos:[0,1,-10], rot:[0,0,0], mass:0 });

    var geo = view.getGeo();

    var i = 6;

    while(i--){

        var y = 15+(i*15);
        var x = 0;//-5+(i*2.5);
        var r = Math.randInt(0,360);

        add({

            type:'softTriMesh',
            shape:geo['pig'],
            material:'pig',

            pos:[x,y,0],
            size:[2,2,2],
            rot:[0,r,0],

            mass:8,
            state:4,

            viterations: 1,
            piterations: 1,
            citerations: 1,
            diterations: 2,

            kdf: 0.6,// friction
            kdp: 0.01,// Damping
            kpr: 260,// Pressure
            //kvc: 20,

            // Stiffness
            klst: 0.6,
            kast: 0.6,

            margin:0.05,
            fromfaces:true,
        });

    }

}

/*function update () {

    var softs = view.getSofts();

    softs.forEach( function( b, id ) {

        if( id===1 ) ammo.send( 'moveSoftBody', {id:id } ) ;

        //console.log(b.position.y)
    });

}*/