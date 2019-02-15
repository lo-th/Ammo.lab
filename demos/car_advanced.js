
// ! \\ go on view and use keyboard WSAD to controle car

var option = {

    restart:false,
    follow:true,

    hour:9,
    gravity:-10,

    mass:1300,
    engine:1600,
    acceleration:50,
    // car body physics
    friction: 0.6, 
    restitution: 0,
    linear: 0, 
    angular: 0,
    // suspension
    s_stiffness: 15,
    s_compression: 2.3,
    s_damping: 2.4,
    s_force: 16000,
    s_travel: 0.4,
    s_length: 0.2,
    // wheel
    w_friction: 10.5,//1000,
    w_roll: 0.1,

}

var hour = option.hour;
var buggyCar = null;
var engineSound = 'engine4';
var isStart = true;

function demo() {

	//cam ([-90, 0, 5]);
    view.moveCam({ theta:-90, phi:0, distance:5, target:[0,1,0] });

    view.addSky({  hour:hour });

    view.addJoystick();

    // world setting
    physic.set({

        fps:60,
        substep:2,// more numStep = more accurate simulation default set to 2
        gravity:[ 0, option.gravity ,0 ],

    })

    // infinie plan
    physic.add({ type:'plane', friction:0.6, restitution:0.1 });

    // load buggy 3d model
    view.load ( ['buggy.sea', 'track.sea', engineSound+'.mp3', 'buggy/wheel_c.jpg', 'buggy/wheel_n.jpg', 'buggy/suspension.jpg', 'buggy/body.jpg', 'buggy/extra.jpg', 'buggy/extra_n.jpg', 'buggy/pilote.jpg'], afterLoad, true, true );

};

function afterLoad () {

    physic.add({ type:'box', size:[0.5,0.2,4], pos:[0,0.1,0] });

    // top box
    //add({ type:'box', size:[0.5,0.5,0.5], pos:[0,2,0], mass:1000 });

    // bottom box
    //add({ type:'box', size:[0.2,1,0.2], pos:[0,0.5,0] });

    // basic track
    physic.add({ type:'mesh', shape:view.getGeometry('track', 'track'), pos:[5,0,0], mass:0, friction:0.6, restitution:0.1 });

    makeBuggy()
    //drive('buggy')

    physic.drive( 'buggy' );

    view.update = update;

}

function makeBuggy () {

    // car material / texture

    var txColor = view.getTexture('wheel_c' );
    var txNorm =  view.getTexture('wheel_n' );
    var txSusp = view.getTexture('suspension' );
    var txBody = view.getTexture('body' );
    var txExtra =  view.getTexture('extra' );
    var txExtraN = view.getTexture('extra_n' );
    var txPilote = view.getTexture('pilote' );

    var env = view.envmap;

    view.mat['glass'] = new THREE.MeshStandardMaterial({ color:0x3366ff, envMap:env, metalness:1, roughness:0.3, shadowSide:false, envMapIntensity: 1, transparent:true, opacity:0.2 });

    view.mat['body'] = new THREE.MeshStandardMaterial({ map:txBody, envMap:env, metalness:0.8, roughness:0.2, shadowSide:false, envMapIntensity: 1 });
    view.mat['extra'] = new THREE.MeshStandardMaterial({ map:txExtra, normalMap:txExtraN, normalScale:new THREE.Vector2( 1, 1 ), envMap:env, metalness:0.6, roughness:0.4, shadowSide:false, envMapIntensity: 0.8 });
    view.mat['pilote'] = new THREE.MeshStandardMaterial({ map:txPilote, envMap:env, metalness:0.6, roughness:0.4, shadowSide:false, envMapIntensity: 0.8 });

    view.mat['wheel'] = new THREE.MeshStandardMaterial({ map:txColor, normalMap:txNorm, normalScale:new THREE.Vector2( 1, 1 ), envMap:env, metalness:0.6, roughness:0.4, shadowSide:false, envMapIntensity: 0.8 });
    view.mat['pneu'] = new THREE.MeshStandardMaterial({ map:txColor, normalMap:txNorm, normalScale:new THREE.Vector2( 2, 2 ), envMap:env, metalness:0.5, roughness:0.7, shadowSide:false, envMapIntensity: 0.6 });
    view.mat['susp'] = new THREE.MeshStandardMaterial({ map:txSusp, envMap:env, metalness:0.6, roughness:0.4, shadowSide:false, envMapIntensity: 0.8 });
    view.mat['suspM'] = new THREE.MeshStandardMaterial({ map:txSusp, envMap:env, metalness:0.6, roughness:0.4, shadowSide:false, envMapIntensity: 0.8, morphTargets:true });
    view.mat['brake'] = new THREE.MeshBasicMaterial({ color:0xdd3f03, transparent:true, opacity:0.1 });

    view.mat['cshadow'] = new THREE.MeshBasicMaterial({ color:0xdd3f03, transparent:true, opacity:0, depthTest:false, depthWrite:false  });

    // car mesh

    var mesh = view.getMesh( 'buggy', 'h_chassis' );
    var wheel = view.getMesh( 'buggy', 'h_wheel' );
    var susp = view.getMesh( 'buggy', 'h_susp_base' );
    var brake = view.getMesh( 'buggy', 'h_brake' );
    var steeringWheel;

    brake.material = view.mat.wheel;
    brake.receiveShadow = false;
    brake.castShadow = false;

    brake.children[0].material = view.mat.brake;
    brake.children[0].receiveShadow = false;
    brake.children[0].castShadow = false;

    //

    susp.material = view.mat.susp;
    susp.receiveShadow = false;
    susp.castShadow = false;

    susp.children[0].material = view.mat.suspM;
    susp.children[0].receiveShadow = false;
    susp.children[0].castShadow = false;

    var k = mesh.children.length, m;

    while(k--){

        m = mesh.children[k];
    	if( m.name === 'h_glasses' ) m.material = view.mat.glass;
        else if( m.name === 'h_pilote' ) m.material = view.mat.pilote;
        else if( m.name === 'h_steering_wheel' || m.name === 'h_sit_R' || m.name === 'h_sit_L' || m.name === 'h_extra' || m.name === 'h_pot' || m.name === 'h_license') m.material = view.mat.extra;
    	else m.material = view.mat.body;

        if( m.name === 'h_steering_wheel' ) steeringWheel = m;

    	m.castShadow = false;
        m.receiveShadow = false;

        if( m.name === 'h_shadow' ){  m.material = view.mat.cshadow; m.castShadow = true; m.receiveShadow = false; }

    }

    k = wheel.children.length;

    while(k--){
        m = wheel.children[k];
        if( m.name === 'h_pneu' ) m.material = view.mat.pneu;
        else m.material = view.mat.wheel;

        m.castShadow = false;
        m.receiveShadow = false;

    }

    mesh.material = view.mat.body;
    mesh.receiveShadow = false;
    mesh.castShadow = false;

    wheel.material = view.mat.wheel;
    wheel.receiveShadow = false;
    wheel.castShadow = false;

    // car physics

    var o = option;

    physic.add ({ 

        type: 'car',
        name:'buggy',
        shapeType:'convex',

    	debug: false,

        
        shape: view.getGeometry( 'buggy', 'h_shape' ),
        mesh: mesh,
        meshWheel: wheel,
        meshSusp: susp,
        meshBrake: brake,
        meshSteeringWheel: steeringWheel,
        extraWeels:true,
        
        helper: true,
        pos:[0,1,0], // start position of car 
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
        wPos:[ 0.838, 0.43, 1.37 ], // wheels position on chassis

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

    follow( option.follow ? 'buggy' : 'none' );

    // add option setting
    ui ({

        base:option,
        function: applyOption,

        restart: { type:'button', p:0, h:30, radius:10 },
        follow: { type:'bool' },

        hour: { min:0, max:24, precision:2, color:0xFFFF44 },

        gravity : { min:-20, max:20, color:0x8888FF },

        mass : { min:100, max:10000, precision:0, color:0xFF8844 },
        engine : { min:100, max:10000, precision:0, color:0xFF8844 },
        acceleration : { min:1, max:1000, precision:0, color:0xFF8844 },

        friction: { min:0, max:1, precision:2, color:0x88FF88 }, 
        restitution: { min:0, max:1, precision:2, color:0x88FF88 }, 
        linear: { min:0, max:1, precision:2, color:0x88FF88 },  
        angular: { min:0, max:1, precision:2, color:0x88FF88 },

        s_stiffness: { min:1, max:200, precision:0, color:0xCC88FF }, 
        s_compression: { min:0.01, max:5, precision:2, color:0xCC88FF },
        s_damping: { min:0.01, max:5, precision:2, color:0xCC88FF },
        s_force: { min:1, max:50000, precision:0, color:0xCC88FF },
        s_travel: { min:0.01, max:5, precision:2, color:0xCC88FF },
        s_length: { min:0.01, max:1, precision:2, color:0xCC88FF },

        w_friction: { min:0, max:1000, precision:2, color:0xCCCC44 },
        w_roll: { min:0, max:1, precision:2, color:0xCCCC44 },

    });

    buggyCar = physic.byName( 'buggy' );

    // sound test
    /*var enginAudio = view.addSound( engineSound );
    enginAudio.setLoop( true );
    buggyCar.add( enginAudio );
    buggyCar.userData.sound = enginAudio;*/

};

function applyOption () {

    if( hour !== option.hour ){ hour = option.hour; view.updateSky({hour:hour}); }

    
    option.reset = option.restart ? true : false;
    if( option.reset ){
        physic.matrix( [[ 'buggy_body', [0,4,0], [0,90,0] ]] );
        option.reset = false;
    }

    physic.post( 'setGravity', { gravity:[ 0, option.gravity, 0 ] });
    physic.post( 'setVehicle', option );

    follow( option.follow ? 'buggy' : 'none' );

}

function update () {

    // sound

    /*if( buggyCar === null ) return;

    var speed = buggyCar.userData.speed;
    var sound = buggyCar.userData.sound;

    var v = speed/10;
    v = v<0?-v:v;
    v = v<0.1?0:v;

    v = isStart ? 0 : v;

    if( v === 0 ){ 
        if( sound.source ) sound.stop();
    } else {    
        sound.setPlaybackRate( v/10 );
        if( !sound.isPlaying ) sound.play();
    }

    if( !isStart ) return;
    if( user.key[1]!==0 ) isStart = false;*/

}