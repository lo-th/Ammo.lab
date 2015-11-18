function demo() {

    cam ( 0, 20, 100 );

    // ammo terrain shape

    add ({ 
        type:'terrain', 
        pos : [0,-5,0], // terrain position
        size : [100,10,100], // terrain size in meter
        div : [64,64], // number of subdivision
        complexity : 30, // complexity of noise
        flipEdge : false, // inverse the triangle
        hdt : 'PHY_FLOAT', // height data type PHY_FLOAT, PHY_UCHAR, PHY_SHORT
        friction: 0.4, 
        restitution: 0.0,
    });

    add ({ type:'sphere', size:[1], pos:[0,20,0], mass:0.2 });
    add ({ type:'sphere', size:[1], pos:[5,20,5], mass:0.2 });
    add ({ type:'sphere', size:[1], pos:[-5,20,-5], mass:0.2 });

    // ammo car shape

    var carSetup = {
        mass:400,
        engine:600, 
        stiffness: 20,// 10 = Offroad buggy, 50 = Sports car, 200 = F1 Car 
        damping: 2.3,// 0.1 to 0.3 are good values 
        compression: 4.4,//0.82, 
        travel: 500, 
        force: 6000, 
        frictionSlip: 1000,//20.5, 
        reslength: 0.1,  // suspension Length
        roll: 0//0.1 // vehicle barrel chance
    };

    car ({ 
        type:'box', 
        pos:[0,10,0], // start position of car 
        rot:[0,0,0], // start rotation of car
        size:[2,0.5,4], // chassis size
        massCenter:[0,0.25,0], // local center of mass (best is on chassis bottom)

        friction: 0.6, 
        restitution: 0.0, 
        linearDamping: 0.3, 
        angularDamping: 0.3,

        radius:0.4,// wheels radius
        deep:0.3, // wheels deep
        wPos:[1, 0, 1.6], // wheels position on chassis

        setting : carSetup 

    });

};