// from three.js examples/webgl_physics_convex_break.html

function demo() {

    view.moveCam({ azim:0, polar:25, distance:30, target:[0,4,0] });

    physic.set();

    var glass = view.material({
        name:'glass',
        color: 0x3366ff,
        transparent:true,
        opacity:0.5,
        depthWrite: false,
        //side: THREE.DoubleSide,
    });


    physic.add({ 
        name:'cc1', type:'cylinder', mass:100, state:4, size:[6], pos:[0,50,0], friction:0.5, material:glass,
        breakable:true, breakOption:[ 200, 2, 4, 2 ],
        margin: 0.05,
    });

    physic.add({ 
        name:'cc2', type:'cylinder', mass:100, state:4, size:[6], pos:[0,100,0], friction:0.5, material:glass, 
        breakable:true, breakOption:[ 200, 2, 4, 2 ],
        margin: 0.05,
    });


    ///physic.add({ size:[40, 2, 40], pos:[0,-1,0], rot:[0,0,0], mass:0, restitution:0.5  });
    physic.add({ type:'plane', friction:1 }); // infinie plane



}