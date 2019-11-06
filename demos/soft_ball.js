function demo() {

    view.moveCam({ theta:120, phi:30, distance:40, target:[0,2,0] });

    physic.set();

    physic.add({type:'plane' }); // infinie plane
    physic.add({ type:'box', size:[40,10,1], pos:[0,4.6,15], rot:[45,0,0], mass:0 });
    physic.add({ type:'box', size:[40,2,40], pos:[0,-1,0], rot:[0,0,0], mass:0 });

    var spheroid = view.material({
        name:'spheroid',
        roughness: 0.75,
        metalness: 0.5,
        sheen: new THREE.Color( 0.9, 0.8, 0.6 ),
        color: new THREE.Color( 0.3, 0.1, 0.1 ),
        side:'Double',
        transparency:0.5,
        reflectivity:0.9,
        transparent:true,
    });

    physic.add({ 
        type:'softEllips',
        material: spheroid,
        center:[0, 20, 15],
        radius:[3, 5, 3],
        vertices:512,
        mass:20, state:4,
        viterations:10,
        piterations:10,
        citerations:4,
        diterations:0,
        
        friction:1,
        damping:0.001,
        pressure:2500,
        stiffness:0.05,
        
        margin:0.1,

    });

    physic.add({ 
        type:'softEllips',
        material: spheroid,
        center:[10, 20, 15],
        radius:[3, 3, 3],
        vertices:128,
        mass:20, state:4,
        viterations:10,
        piterations:10,
        citerations:4,
        diterations:0,

        friction:1,
        damping:0.001,
        pressure:2500,
        stiffness:0.05,

        margin:0.1,
    });

    physic.add({ 
        type:'softEllips',
        material: spheroid,
        center:[-10, 20, 15],
        radius:[2, 1, 2],
        vertices:64,
        mass:20, state:4,
        viterations:10,
        piterations:10,
        citerations:4,
        diterations:0,

        friction:1,
        damping:0.001,
        pressure:2500,
        stiffness:0.05,
        
        margin:0.1,
    });

    /*add({ type:'sphere', size:[3], pos:[-20, 40, 0], mass:1});
    add({ type:'sphere', size:[3], pos:[-10, 50, 0], mass:1});
    add({ type:'sphere', size:[3], pos:[0, 60, 0], mass:1});
    add({ type:'sphere', size:[3], pos:[10, 70, 0], mass:1});
    add({ type:'sphere', size:[3], pos:[20, 80, 0], mass:1});*/

}