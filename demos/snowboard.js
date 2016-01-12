function demo() {

    cam ( 90, 40, 100 );

    // ammo terrain shape

    add ({ 
        type:'terrain',
        name:'ground1',
        pos : [0,-5,0], // terrain position
        size : [100,10,100], // terrain size in meter
        div : [64,64], // number of subdivision
        complexity : 30, // complexity of noise
        flipEdge : false, // inverse the triangle
        hdt : 'PHY_FLOAT', // height data type PHY_FLOAT, PHY_UCHAR, PHY_SHORT
        friction: 0.6, 
        restitution: 0.0,
    });

    add ({ 
        type:'terrain',
        name:'ground2',
        pos : [0,-5,100], // terrain position
        dpos : [0,0,100],
        size : [100,10,100], // terrain size in meter
        div : [64,64], // number of subdivision
        complexity : 30, // complexity of noise
        flipEdge : false, // inverse the triangle
        hdt : 'PHY_FLOAT', // height data type PHY_FLOAT, PHY_UCHAR, PHY_SHORT
        friction: 0.6, 
        restitution: 0.0,
    });

    add ({ type:'sphere', size:[1], pos:[0,20,5], mass:0.2 });
    add ({ type:'sphere', size:[1], pos:[5,20,105], mass:0.2 });
    add ({ type:'sphere', size:[1], pos:[-5,20,-5], mass:0.2 });

 

};