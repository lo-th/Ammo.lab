function demo() {

    view.moveCam({ theta:90, phi:20, distance:40, target:[0,2,0] });

    physic.set();

    view.load ( ['test2.sea'], afterLoad, true );

    //load ( 'test', afterLoad );

}

function afterLoad () {

    physic.add({type:'plane'}); // infinie plane
    physic.add({ type:'box', size:[40,10,1], pos:[0,4.6,0], rot:[45,0,0], mass:0 });
    physic.add({ type:'box', size:[40,2,40], pos:[0,1,-10], rot:[0,0,0], mass:0 });

    var geo = view.getGeometry( 'test2', 'ball2' )//view.getGeo();

    physic.add({ 

        type:'softConvex',
        shape:geo,

        pos:[0,10,0],

        mass:2,
        state:4,

        viterations: 10,// Velocities solver iterations 10
        piterations: 5,// Positions solver iterations 10
       /* citerations: 4,// Cluster solver iterations 4
        diterations: 0,// Drift solver iterations 0
       
        friction: 0.1,// Dynamic friction coefficient [0,1]
        restitution: 1,
        damping: 0.3,// Damping coefficient [0,1]
        pressure: 0,// Pressure coefficient [-inf,+inf]
*/

        margin:0.05,
    });




}