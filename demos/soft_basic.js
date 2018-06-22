function demo() {

    cam ({ azim:90, polar:20, distance:40 });
    load ( 'pig', afterLoad );

}

function afterLoad () {

    //add({type:'plane' }); // infinie plane

    add({ type:'box', size:[40,1,40], pos:[0,-0.5,0], rot:[0,0,0], mass:0 });
    add({ type:'box', size:[10,1,4], pos:[3,1,0], rot:[0,0,30], mass:0 });
    
    //add({ type:'box', size:[40,10,1], pos:[0,4.6,0], rot:[45,0,0], mass:0 });
    //add({ type:'box', size:[40,2,40], pos:[0,1,-10], rot:[0,0,0], mass:0 });

    var geo = view.getGeo();

    var sp = new THREE.SphereGeometry( 1.5, 40, 25 )
    sp.mergeVertices();

    var i = 5;


    add({ 
        type:'softTriMesh',
        //shape:geo['pig'],
        //shape:geo['cubic'],
        shape:new THREE.BufferGeometry().fromGeometry(sp), //new THREE.SphereBufferGeometry( 1.5, 40, 25 ),

        pos:[5,5,0],
        //size:[2,2,2],
        //rot:[r,0,0],

        mass:15,
        state:4,

        viterations: 40,
        piterations: 40,
        //citerations:4,
        //diterations:0,

        friction: 0.1,
        damping: 0.01,
        pressure: 250,
        stiffness: 0.9,

        margin:0.05,
    });

    add({ 
        type:'softTriMesh',
        //shape:geo['pig'],
        //shape:geo['cubic'],
        shape:new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry( 1, 1, 5, 4, 4, 20 )),

        pos:[-2,5,0],
        //size:[2,2,2],
        //rot:[r,0,0],

        mass:15,
        state:4,

        viterations: 40,
        piterations: 40,
        //citerations:4,
        //diterations:0,

        friction: 0.1,
        damping: 0.01,
        pressure: 120,
        stiffness: 0.9,

        margin:0.05,

    });

    




}