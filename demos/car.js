function demo() {

    cam ( 0, 10, 40 );

    load ( 'track', afterLoad );

}

function afterLoad () {

    add({type:'plane'}); // infinie plane

    add({ type:'track', shape:'mesh', size:[1,1,1], pos:[0,0,0], mass:0 });

    // ammo car shape

    // ! \\ click on view and use key to controle car

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
        pos:[0,2,0], // start position of car 
        rot:[0,90,0], // start rotation of car
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