var option = {

    restart:false,
    follow:true,

    gravity:-10,

    mass:600,
    engine:1000,
    acceleration:10,
    // car body physics
    friction: 0.6, 
    restitution: 0,
    linear: 0, 
    angular: 0,
    // suspension
    s_stiffness: 20,
    s_compression: 2.3,
    s_damping: 2.4,//2.4
    s_travel: 5,
    s_force: 6000,
    s_length: 0.2,
    // wheel
    w_friction: 1000,
    w_roll: 0.1,

}

function demo() {

    cam ([0, 20, 100]);
    view.hideGrid();

    set({
        fps:60,
        numStep:8,
        gravity:[0,-10,0],
    })

    // ammo terrain shape

    add ({ 
        type:'terrain', 
        pos : [0,-10,0], // terrain position
        size : [400,20,400], // terrain size in meter
        sample : [256,256], // number of subdivision
        frequency : [0.016,0.05,0.2], // frequency of noise
        level : [1,0.2,0.05], // influence of octave
        expo: 3,
        flipEdge : true, // inverse the triangle
        hdt : 'PHY_FLOAT', // height data type PHY_FLOAT, PHY_UCHAR, PHY_SHORT
        friction: 0.6, 
        restitution: 0.2,
    });

    add ({ type:'sphere', size:[1], pos:[0,20,5], mass:0.2 });
    add ({ type:'sphere', size:[1], pos:[5,20,5], mass:0.2 });
    add ({ type:'sphere', size:[1], pos:[-5,20,-5], mass:0.2 });

    // ammo car shape

    // ! \\ click on view and use key to controle car

    var o = option;

    car ({ 
        
        type:'box',
        name:'car',
        helper: true,
        pos:[0,10,0], // start position of car 
        rot:[0,0,0], // start rotation of car
        size:[ 1.3, 0.4, 3.5 ], // chassis size
        masscenter:[ 0, -0.6 ,0 ], // local center of mass (best is on chassis bottom)

        friction: o.friction,
        restitution: o.restitution,
        linear: o.linear, 
        angular: o.angular,

        radius:0.43,// wheels radius
        deep:0.3, // wheels deep
        wPos:[0.838, 0, 1.37], // wheels position on chassis

        mass: o.mass,// mass of vehicle in kg
        engine: o.engine, // Maximum driving force of the vehicle
        acceleration: o.acceleration, // engine increment 

        // suspension setting

        // Damping relaxation should be slightly larger than compression
        s_compression: o.s_compression,// 0.1 to 0.3 are real values default 0.84 // 4.4
        s_damping: o.s_damping,//2.4, // The damping coefficient for when the suspension is expanding. default : 0.88 // 2.3

        s_stiffness: o.s_stiffness,// 10 = Offroad buggy, 50 = Sports car, 200 = F1 Car 
        s_travel: o.s_travel, // The maximum distance the suspension can be compressed in meter
        s_force: o.s_force, // Maximum suspension force
        s_length: o.s_length,

        w_roll: o.w_roll,
        w_friction: o.w_friction,

    });

    follow ( 'car' );

    // add option setting
    ui ({

        base:option,
        function: applyOption,

        restart: { type:'button', p:0 },
        follow: { type:'bool' },

        gravity : { min:-20, max:20, color:0x8888FF },

        mass : { min:100, max:10000, precision:0, color:0xFF8844 },
        engine : { min:100, max:10000, precision:0, color:0xFF8844 },
        acceleration : { min:1, max:1000, precision:0, color:0xFF8844 },

        friction: { min:0, max:1, precision:2, color:0x88FF88 }, 
        restitution: { min:0, max:1, precision:2, color:0x88FF88 }, 
        linear: { min:0, max:1, precision:2, color:0x88FF88 },  
        angular: { min:0, max:1, precision:2, color:0x88FF88 },

        s_stiffness: { min:0, max:200, precision:0, color:0xCC88FF }, 
        s_compression: { min:0, max:5, precision:2, color:0xCC88FF },
        s_damping: { min:0, max:5, precision:2, color:0xCC88FF },
        s_travel: { min:0, max:5, precision:2, color:0xCC88FF },
        s_force: { min:0, max:10000, precision:0, color:0xCC88FF },
        s_length: { min:0, max:1, precision:2, color:0xCC88FF },

        w_friction: { min:0, max:1000, precision:2, color:0xCCCC44 },
        w_roll: { min:0, max:1, precision:2, color:0xCCCC44 },

    });

};

function applyOption () {

    
    option.reset = option.restart ? true : false;
    gravity( [ 0, option.gravity, 0 ] );
    ammo.send( 'setVehicle', option );
    follow (option.follow ? 'car':'none');

}