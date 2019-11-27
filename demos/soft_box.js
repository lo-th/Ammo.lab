function demo() {

    view.moveCam({ theta:0, phi:20, distance:60, target:[0,1,0] });

    view.addSky({ url:'photo.jpg' });
    
    physic.set();// reset physics

    physic.add({ type:'plane' }); // infinie plane

    physic.add({ type:'box', size:[60,2,40], pos:[0,-1,0], rot:[0,0,0], mass:0, group:2 });

    var geoBox = new THREE.BoxBufferGeometry( 4,4,4, 6,6,6 );

    var loucoum = view.material({
        name:'loucoum',
        roughness: 0.75,
        metalness: 0.5,
        sheen: new THREE.Color( 0.9, 0.8, 0.6 ),
        color: new THREE.Color( 0.3, 0.1, 0.1 ),
        side:'Double',
        transparency:0.5,
        reflectivity:0.9,
        transparent:true,
    });


    var i = 10, n = 0;

    while( i-- ){

    	n = i;
    	if( i >= 5 ) n = i-5;

    	

        var y = 15+(i+15);//?
        var x = -15+(n*5);
        var r = 0;

        //console.log(15+(n+15))

        physic.add({ 

        	name:'loucoum' + i,

            type: 'softMesh',
            shape: geoBox,
            material: loucoum,

            pos:[x,y,0],
            size:[1,1,1],
            rot:[0,r,0],

            mass:1,
            state:4,

            viterations: 10,
            piterations: 10,
            //citerations:4,
            //diterations:0,

            friction: 0.5,
            damping: 0.01,
            pressure: 70,
            stiffness: 0.6,

            margin:0.05,
            fromfaces:true,
            
        });

    }




}