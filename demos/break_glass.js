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


    physic.add({ name:'ball1', type:'sphere', mass:35, state:4, size:[1], pos:[0,60,0], friction:0.5 });
    physic.add({ name:'ball2', type:'sphere', mass:35, state:4, size:[1], pos:[0,300,0], friction:0.5 });
    physic.add({ name:'ball3', type:'sphere', mass:35, state:4, size:[1], pos:[0,2000,0],  friction:0.5 });


    ///physic.add({ size:[40, 2, 40], pos:[0,-1,0], rot:[0,0,0], mass:0, restitution:0.5  });
    physic.add({ type:'plane', friction:1 }); // infinie plane


    var y = 1;

    for(var i = 0; i < 5; i++ ){

        physic.add({ name:'b1'+i, type:'hardbox', size:[2, 2, 2], pos:[5,y,5], rot:[0,0,0], mass:100, state:2, margin:0.05  });
        physic.add({ name:'b2'+i, type:'hardbox', size:[2, 2, 2], pos:[5,y,-5], rot:[0,0,0], mass:100, state:2, margin:0.05  });
        physic.add({ name:'b3'+i, type:'hardbox', size:[2, 2, 2], pos:[-5,y,5], rot:[0,0,0], mass:100, state:2, margin:0.05  });
        physic.add({ name:'b4'+i, type:'hardbox', size:[2, 2, 2], pos:[-5,y,-5], rot:[0,0,0], mass:100, state:2, margin:0.05 });
        y+=1.1;

        // breakOption: [ maxImpulse, maxRadial, maxRandom, levelOfSubdivision ]
        physic.add({ 
            name:'glass'+i, type:'hardbox', size:[12, 0.2, 12], pos:[0,y,0], rot:[0,0,0], mass:50, material:glass, 
            breakable:true, breakOption:[ 200, 1, 3, 2 ],
            margin: 0.05,
        });
        y+=1.1;
    }

}