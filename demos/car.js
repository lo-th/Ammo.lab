
// ! \\ go on view and use keyboard WSAD to controle car

var option = {

    restart:false,
    follow:false,

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
    s_stiffness: 50,//20,
    s_compression: 2.3,
    s_damping: 2.4,//2.4
    s_force: 6000,
    s_travel: 5,
    s_length: 0.2,
    // wheel
    w_friction: 10.5,//1000,
    w_roll: 0.1,

}

function demo() {

	cam ({ azim:0, polar:25, distance:5 });

    // world setting
    set({

        fps:60,
        numStep:2,// more numStep = more accurate simulation default set to 2
        gravity:[ 0, option.gravity ,0 ],

    })

    // infinie plan
    add({ type:'plane', friction:0.6, restitution:0.1 });

    // load 3d model
    view.load ( ['hog.sea', 'track.sea', 'buggy/wheel_c.jpg', 'buggy/wheel_n.jpg'], afterLoad, true );

};

function afterLoad () {

	// top box
	//add({ type:'box', size:[1,1,1], pos:[0,2,0], mass:1000 });

	// bottom box
	//add({ type:'box', size:[0.2,1,0.2], pos:[0,0.5,0] });

	// basic track
    add({ type:'mesh', shape:view.getGeometry('track', 'track'), pos:[5,0,0], mass:0, friction:0.6, restitution:0.1 });

    // car material / texture

    var txColor = view.getTexture('wheel_c')
    var txNorm =  view.getTexture('wheel_n');

    view.mat['wheel'] = new THREE.MeshStandardMaterial({ map:txColor, normalMap:txNorm, normalScale:new THREE.Vector2( 1, 1 ), envMap:view.envmap, metalness:0.5, roughness:0.4, shadowSide:false, envMapIntensity: 0.8 });
    view.mat['pneu'] = new THREE.MeshStandardMaterial({ map:txColor, normalMap:txNorm, normalScale:new THREE.Vector2( 2, 2 ), envMap:view.envmap, metalness:0.5, roughness:0.7, shadowSide:false, envMapIntensity: 0.6 });

    // car mesh

    var mesh = view.getMesh( 'hog', 'h_chassis' );
    var wheel = view.getMesh( 'hog', 'h_wheel' );

    var k = mesh.children.length, m;

    while(k--){

        m = mesh.children[k];
    	if( m.name === 'h_glasses' ) m.material = view.mat.statique;
    	else m.material = view.mat.move;

    	m.castShadow = false;
        m.receiveShadow = false;

    }

    k = wheel.children.length;

    while(k--){
        m = wheel.children[k];
        if( m.name === 'h_pneu' ) m.material = view.mat.pneu;
        else m.material = view.mat.wheel;

        m.castShadow = false;
        m.receiveShadow = false;

    }

    mesh.material = view.mat.move;
    wheel.material = view.mat.wheel;

    mesh.receiveShadow = false;
    wheel.receiveShadow = false;
    mesh.castShadow = false;
    wheel.castShadow = false;

    // car physics

    var o = option;

    car ({ 

    	debug: false,

        type:'convex',
        shape: view.getGeometry( 'hog', 'h_shape' ),
        mesh: mesh,
        meshWheel: wheel,


        name:'car',
        helper: true,
        pos:[0,0,0], // start position of car 
        rot:[0,90,0], // start rotation of car
        size:[ 1.3, 0.4, 3.5 ], // chassis size
        //size:[ 1.2, 0.6, 3.8 ], // chassis size
        masscenter:[ 0, 0, 0 ], // local center of mass (best is on chassis bottom)

        friction: o.friction,
        restitution: o.restitution,
        linear: o.linear, 
        angular: o.angular,

        radius:0.43,// wheels radius
        deep:0.3, // wheels deep only for three cylinder
        wPos:[ 0.838, 0.43+0.2, 1.37 ], // wheels position on chassis

        // car setting

        mass: o.mass,// mass of vehicle in kg
        engine: o.engine, // Maximum driving force of the vehicle
        acceleration: o.acceleration, // engine increment 

        // suspension setting

        // Damping relaxation should be slightly larger than compression
        s_compression: o.s_compression,// 0.1 to 0.3 are real values default 0.84 // 4.4
        s_damping: o.s_damping,//2.4, // The damping coefficient for when the suspension is expanding. default : 0.88 // 2.3

        s_stiffness: o.s_stiffness,// 10 = Offroad buggy, 50 = Sports car, 200 = F1 Car 
        s_force: o.s_force, // Maximum suspension force
        
        s_travel: o.s_travel, // The maximum distance the suspension can be compressed in meter
        s_length: o.s_length,//0.1, // The maximum length of the suspension in meter

        // wheel setting

        // friction: The constant friction of the wheels on the surface.
        // For realistic TS It should be around 0.8. 
        // But may be greatly increased to improve controllability (1000 and more)
        // Set large (10000.0) for kart racers
        w_friction: o.w_friction,
        // roll: reduces torque from the wheels
        // reducing vehicle barrel chance
        // 0 - no torque, 1 - the actual physical behavior
        w_roll: o.w_roll,

    });

    follow (option.follow ? 'car':'none' );

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
        s_force: { min:0, max:50000, precision:0, color:0xCC88FF },
        s_travel: { min:0, max:5, precision:2, color:0xCC88FF },
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