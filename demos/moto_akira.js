
var debug = false;

var option = {

    restart:false,
    follow: true,
    hour:9,

    name:'moto',

    gravity:-10,

    mass:500,
    engine:2000,
    acceleration:100,
    // car body physics
    friction: 0.1, 
    restitution: 0,
    linear: 0, 
    angular: 0,
    rolling: 0,
    // suspension
    autoSuspension:true,
    s_stiffness: 153,
    s_compression: 2.3,
    s_damping: 2.4,//2.4
    s_force: 6000,
    s_length: 0.03,
    s_travel: 0.06,

    //linearFactor:[0.9,0.9,0.9],

    //auto:true,
    // wheel
    w_friction: 100,//10.5,//1000,
    w_roll: 0.3,

    susp_av:0,
    susp_ar:0,
    open_shell:1,

}

//0.331  // 0.662

var mat = {};
var axis_front, axis_back, front_shell, front_rim, back_rim, tire_front, tire_back, extra_susp, extra_link;
var bike, kaneda;
var decalBikeY = 0.21;
var base_q;//, q_steering = new THREE.Quaternion()
var m1 = new THREE.Matrix4(), m2 = new THREE.Matrix4();
var hour = option.hour;


function demo() {

    //view.hideGrid();

    //view.moveCam({ theta:135, phi:10, distance:3, target:[0,0,0] });

    view.addJoystick({ sameAxis:true });

    view.addSky({ hour:option.hour, hdr:true, cloud_covr:0.6, cloud_dens:60, groundColor:0x373737 });
    //view.addSky({  url:'photo.jpg', hdr:true, visible:false });

    view.setShadowRange( 10, 195, 205, debug );

    physic.set({
        fps:60,
        numStep:8,// more numStep = more accurate simulation default set to 2
        gravity:[ 0, option.gravity ,0 ],
    })

    //view.load ( ['track.sea'], afterLoad, true, true );
    view.load ( [ 'kaneda.sea', 'track.sea' ], afterLoad, true, true );
    //load ( 'gaz', afterLoad );

    

};

function afterLoad () {

    // infinie plan
    physic.add({ type:'plane', friction:0.6, restitution:0 });

    // basic track
    physic.add({ type:'mesh', shape:view.getGeometry('track', 'track'), pos:[5,0,0], mass:0, friction:0.6, restitution:0.1 });
    //physic.add({ type:'mesh', shape:view.geo.track, mass:0, friction:0.6, restitution:0.1 });


    initMaterials();

    initBike();

    initKaneda();

    

    // add option setting
    ui ({

        base:option,
        function: applyOption,

        hour: { min:0, max:24, precision:2, color:0xFFFF44 },

        restart: { type:'button', p:0, h:30, radius:10 },
        follow: { type:'bool' },

        gravity : { min:-20, max:20, color:0x8888FF },

        mass : { min:100, max:10000, precision:0, color:0xFF8844 },
        engine : { min:100, max:10000, precision:0, color:0xFF8844 },
        acceleration : { min:1, max:1000, precision:0, color:0xFF8844 },

        friction: { min:0, max:1, precision:2, color:0x88FF88 }, 
        restitution: { min:0, max:1, precision:2, color:0x88FF88 }, 
        linear: { min:0, max:1, precision:2, color:0x88FF88 },  
        angular: { min:0, max:1, precision:2, color:0x88FF88 },
        rolling: { min:0, max:1, precision:2, color:0x88FF88 },

        s_stiffness: { min:0, max:200, precision:0, color:0xCC88FF },
        autoSuspension: { type:'bool' },
        s_compression: { min:0, max:5, precision:2, color:0xCC88FF },
        s_damping: { min:0, max:5, precision:2, color:0xCC88FF },
        s_travel: { min:0.01, max:5, precision:2, color:0xCC88FF },
        s_force: { min:0, max:10000, precision:0, color:0xCC88FF },
        s_length: { min:0.01, max:1, precision:2, color:0xCC88FF },

        w_friction: { min:0, max:1000, precision:2, color:0xCCCC44 },
        w_roll: { min:0, max:1, precision:2, color:0xCCCC44 },

        //susp_av: { min:-0.783, max:0.783, precision:2, color:0x44CCCC },
        //susp_av: { min:-0.3, max:0.3, precision:2, color:0x44CCCC },
        //susp_ar: { min:-0.3, max:0.3, precision:2, color:0x44CCCC },
        open_shell: { min:0, max:1, precision:2, color:0xCC4444 },

    });


    view.update = update;

    physic.drive( option.name );

    follow ( option.follow ? option.name : 'none', { distance:4, decal:[0,0.3,0] } );

};

function update () {

    var data = bike.userData;

    option.susp_av = -data.suspension[0]*10;
    option.susp_ar = -data.suspension[1]*10;

    var r = data.steering * 0.5;

    m1.makeRotationY( r );
    m2.makeRotationFromQuaternion(base_q);
    m2.multiply(m1);
    axis_front.setRotationFromMatrix(m2);

    var frame = 24 - (Math.round( r * THREE.Math.RAD2DEG )+12);

    kaneda.playFrame( frame, 24 );

    //console.log( frame );

    //var r = (data.speed*THREE.Math.DEG2RAD*0.8)

    tire_front.rotation.x = data.wr[0];
    tire_back.rotation.z = -data.wr[1];

    //tire_front.rotation.x += r;
    //tire_back.rotation.z -= r;

    var sav = option.susp_av*2.61;

    front_rim.position.y = -7.172 + sav;
    back_rim.position.y = -option.susp_ar;

    axis_back.setWeight( 'ak_axis_back_low', ((-option.susp_ar+0.3)*1.66666) );
    extra_susp.setWeight( 'ak_extra_susp_low', 1-((sav+0.783)*0.638) );

}

function frontShell ( n ) {

    // range -75 / -90
    front_shell.rotation.x = - (75 + ( n * 15 )) * THREE.Math.DEG2RAD;
    extra_link.setWeight( 'ak_link_low', n );

}

function applyOption () {//1.566

    
    option.reset = option.restart ? true : false;

    if( hour !== option.hour ){ hour = option.hour; view.updateSky({hour:hour}); }

    if( option.reset ){
        physic.matrix( [{ name: option.name, pos:[0,1,0], rot:[0,90,0] }] );
        option.reset = false;
    }

    frontShell( option.open_shell );

    follow ( option.follow ? option.name : 'none', { distance:4, decal:[0,0.3,0] } );
    
    physic.post( 'setGravity', { gravity:[ 0, option.gravity, 0 ] });
    physic.post( 'setVehicle', option );
    physic.drive( option.name );

}

//----------------------------
//  INIT
//----------------------------

function initKaneda () {

    kaneda = view.getMesh( 'kaneda', 'ka_body' );
    kaneda.material = mat.kaneda;

    kaneda.castShadow = true;
    kaneda.receiveShadow = true;

    kaneda.play( "turn", .5 );


    var hair = view.getMesh( 'kaneda', 'ka_hair' );
    var lunette = view.getMesh( 'kaneda', 'ka_lunette' );
    var glass = view.getMesh( 'kaneda', 'ka_glass' );
    var eye_l = view.getMesh( 'kaneda', 'ka_eye_l' );
    var eye_r = view.getMesh( 'kaneda', 'ka_eye_r' );

    hair.castShadow = true;
    lunette.castShadow = false;
    glass.castShadow = false;
    eye_l.castShadow = false;
    eye_r.castShadow = false;

    hair.material = mat.kaneda;
    lunette.material = mat.kaneda;
    glass.material = mat.glass;
    eye_l.material = mat.eye;
    eye_r.material = mat.eye;

    hair.skeleton = kaneda.skeleton;
    lunette.skeleton = kaneda.skeleton;

    hair.frustumCulled = false;
    lunette.frustumCulled = false;
    //view.getMesh( 'kaneda', 'ka_body' );

    //view.getScene().add( kaneda );

    kaneda.scale.set( 0.1, 0.1, 0.1 );
    kaneda.position.set(0,decalBikeY+0.38,-0.3);
    kaneda.rotation.y = -90 * THREE.Math.DEG2RAD;

    bike.add( kaneda );

}

function initBike () {

    var mesh = view.getMesh( 'kaneda', 'ak_chassis_base' );

    var k = mesh.children.length, m, m2, name, j, back, tmpName;

    while( k-- ){

        m = mesh.children[k];
        name = mesh.children[k].name;
        m.material = mat.bike_1;

        if( name === 'ak_axis_back' || name === 'ak_axis_front' ){

            m.material = mat.bike_2;

            back = name === 'ak_axis_back' ? true : false;
 
            j = m.children.length;
            while( j-- ){

                m2 = m.children[j];
                m2.material = mat.bike_2;

                if( back ){

                    axis_back = m;
                    axis_back.material = mat.bike_1_m;
                    back_rim = m2;

                    if(m2.children[0].name === 'ak_tire_ar'){
                        tire_back = m2.children[0];
                        tire_back.material = mat.tires;
                        m2.children[1].material = mat.glass_colors;
                        m2.children[1].castShadow = false;
                        m2.children[1].receiveShadow = false;
                    } else {
                        tire_back = m2.children[1];
                        tire_back.material = mat.tires;
                        m2.children[0].material = mat.glass_colors;
                        m2.children[0].castShadow = false;
                        m2.children[0].receiveShadow = false;
                    }
                    

                } else {

                    axis_front = m;

                    if( m2.name === 'ak_front_shell' ){

                        front_shell = m2;

                        tmpName = front_shell.children[0].name;

                        if( tmpName === 'ak_glass' ){
                            front_shell.children[0].material = mat.glass;
                            front_shell.children[1].material = mat.bike_3;
                            front_shell.children[1].children[0].material = mat.glass_colors;
                            front_shell.children[0].castShadow = false;
                            front_shell.children[0].receiveShadow = false;
                        } else {
                            front_shell.children[1].material = mat.glass;
                            front_shell.children[0].material = mat.bike_3;
                            front_shell.children[0].children[0].material = mat.glass_colors;
                            front_shell.children[1].castShadow = false;
                            front_shell.children[1].receiveShadow = false;
                        }
                        
                        //

                    } else if ( m2.name === 'ak_rim_av' ){

                        front_rim = m2;
                        tire_front = front_rim.children[0];
                        tire_front.material = mat.tires;

                        if(m2.children[0].name === 'ak_tire_ar'){
                            tire_front = front_rim.children[0];
                            tire_front.material = mat.tires;
                            front_rim.children[1].material = mat.glass_colors;
                            front_rim.children[1].castShadow = false;
                            front_rim.children[1].receiveShadow = false;
                        } else {
                            tire_front = front_rim.children[1];
                            tire_front.material = mat.tires;
                            front_rim.children[0].material = mat.glass_colors;
                            front_rim.children[0].castShadow = false;
                            front_rim.children[0].receiveShadow = false;
                        }

                    } else if ( m2.name === 'ak_extra_susp' ) {

                        extra_susp = m2;
                        extra_susp.material = mat.bike_1_m;

                    } else {

                        extra_link = m2;
                        extra_link.material = mat.bike_1_m;

                    }

                } 

            }

        } else if( name === 'ak_chassis_shell' ) {

            j = m.children.length;
            while( j-- ){

                m2 = m.children[j];
                m2.material = m2.name ==='ak_panel' ? mat.bike_3 : mat.bike_1;
                if( m2.name ==='ak_panel' ) m2.children[0].material = mat.glass_colors;

            } 

        }

    }

    //front_shell.visible = false

    base_q = axis_front.quaternion.clone();


    mesh.material = mat.bike_1;
    mesh.scale.set( 0.1, 0.1, 0.1 );
    mesh.rotation.y = -90 * THREE.Math.DEG2RAD;
    mesh.position.y = decalBikeY;




    // range -75 / -90
    frontShell( option.open_shell );

    var o = option;

    physic.add({ 

        type:'car',
        name: o.name,
        shapeType:'box',

        wheelMaterial: mat.debugWheel,

        mesh: mesh,//debug ? null : mesh,

        helper: debug,
        pos:[0,1,0], // start position of car 
        rot:[0,90,0], // start rotation of car
        size:[ 0.6, 0.5, 2.0 ], // chassis size y 0.6
        //size:[ 1.2, 0.6, 3.8 ], // chassis size
        masscenter:[ 0, -0.6, 0 ], // local center of mass (best is on chassis bottom)

        friction: o.friction,
        restitution: o.restitution,
        linear: o.linear, 
        angular: o.angular,
        limitAngular: [0.8,1,0.8],

        nWheel:2,
        radius:0.36,// wheels radius
        radiusBack:0.39,// wheels radius
        deep:0.19, // wheels deep only for three cylinder
        wPos:[ 0.1, -0.02, 1.1 ], // wheels position on chassis
        decalYBack:0.02,

        // car setting
        mass: o.mass,// mass of vehicle in kg
        engine: o.engine, // Maximum driving force of the vehicle
        acceleration: o.acceleration, // engine increment 

        // suspension setting

        // Damping relaxation should be slightly larger than compression
        autoSuspension: o.autoSuspension,
        s_compression: o.s_compression,// 0.1 to 0.3 are real values default 0.84 // 4.4
        s_damping: o.s_damping,//2.4, // The damping coefficient for when the suspension is expanding. default : 0.88 // 2.3

        s_stiffness: o.s_stiffness,// 10 = Offroad buggy, 50 = Sports car, 200 = F1 Car 
        s_travel: o.s_travel, // The maximum distance the suspension can be compressed in meter
        s_force: o.s_force, // Maximum suspension force
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

    bike = physic.byName( option.name );

    bike.userData.w[0].visible = debug;
    bike.userData.w[1].visible = debug;

    bike.userData.w[0].castShadow = false;
    bike.userData.w[0].receiveShadow = false;
    bike.userData.w[1].castShadow = false;
    bike.userData.w[1].receiveShadow = false;

}

function initMaterials () {

    var ao = 1.5;

    mat['debugWheel'] = view.material({
        name:'debugWheel',
        color: 0x3c7cff,
        wireframe:true,
        transparent:true,
        opacity:0.5,
    }, 'Basic' );

	mat['glass'] = view.material({
        name:'glass',
        roughness: 0.1,
        metalness: 1.0,
        color: 0xeeefff,
        transparent:true,
        opacity:0.3,
        side:THREE.DoubleSide,
        //depthTest:false,
        depthWrite:false,

    });

    mat['glass_colors'] = view.material({
        name:'glass_colors',
        roughness: 0.1,
        metalness: 1.0,
        map: view.texture( 'kaneda/bike_3_l.jpg'),
        emissive: 0xAAAAAA,
        emissiveIntensity:1,
        emissiveMap: view.texture( 'kaneda/bike_3_l.jpg'),
        transparent:true,
        opacity:0.66,
    });

    mat['bike_1'] = view.material({
        name:'bike_1',
        roughness: 1.0,
        metalness: 1.0,
        //color:0xffffff,
        map: view.texture( 'kaneda/bike_1_c.jpg'),
        metalnessMap: view.texture( 'kaneda/bike_1_m.jpg'),
        roughnessMap: view.texture( 'kaneda/bike_1_r.jpg'),
        normalMap: view.texture( 'kaneda/bike_1_n.jpg'),
        aoMap: view.texture( 'kaneda/bike_1_a.jpg'),
        aoMapIntensity:ao,
    });

    mat['bike_1_m'] = view.material({
        name:'bike_1_m',
        roughness: 1.0,
        metalness: 1.0,
        map: view.texture( 'kaneda/bike_1_c.jpg'),
        metalnessMap: view.texture( 'kaneda/bike_1_m.jpg'),
        roughnessMap: view.texture( 'kaneda/bike_1_r.jpg'),
        normalMap: view.texture( 'kaneda/bike_1_n.jpg'),
        aoMap: view.texture( 'kaneda/bike_1_a.jpg' ),
        aoMapIntensity:ao,
        morphTargets:true,
    });

    mat['bike_2'] = view.material({
        name:'bike_2',
        roughness: 1.0,
        metalness: 1.0,
        map: view.texture( 'kaneda/bike_2_c.jpg'),
        metalnessMap: view.texture( 'kaneda/bike_2_m.jpg'),
        roughnessMap: view.texture( 'kaneda/bike_2_r.jpg'),
        aoMap: view.texture( 'kaneda/bike_2_a.jpg'),
        aoMapIntensity:ao,
        //normalMap: view.texture( 'kaneda/bike_2_n.jpg'),
    });

    mat['bike_3'] = view.material({
        name:'bike_3',
        roughness: 1.0,
        metalness: 1.0,
        map: view.texture( 'kaneda/bike_3_c.jpg'),
        normalMap: view.texture( 'kaneda/bike_3_n.jpg'),
        metalnessMap: view.texture( 'kaneda/bike_3_m.jpg'),
        roughnessMap: view.texture( 'kaneda/bike_3_r.jpg'),
        aoMap: view.texture( 'kaneda/bike_3_a.jpg'),
        aoMapIntensity:ao,
    });

    mat['tires'] = view.material({
        name:'tires',
        roughness: 0.6,
        metalness: 0.5,
        map: view.texture( 'kaneda/tires_c.jpg'),
        normalMap: view.texture( 'kaneda/tires_n.jpg'),
        //normalScale:new THREE.Vector2( 2, 2 ),         
    });

    mat['kaneda'] = view.material({
        name:'kaneda',
        skinning: true,
        roughness: 1.0,
        metalness: 1.0,
        map: view.texture( 'kaneda/kaneda_c.jpg'),
        normalMap: view.texture( 'kaneda/kaneda_n.jpg'),
        //normalScale:new THREE.Vector2( 0.5, 0.5 ), 
        metalnessMap: view.texture( 'kaneda/kaneda_m.jpg'),
        roughnessMap: view.texture( 'kaneda/kaneda_r.jpg'),
        aoMap: view.texture( 'kaneda/kaneda_a.jpg'), 
        aoMapIntensity:ao,
    });

    mat['eye'] = view.material({
        name:'eye',
        roughness: 0.0,
        metalness: 1.0,
        map: view.texture( 'kaneda/kaneda_c.jpg'),
        normalMap: view.texture( 'kaneda/kaneda_n.jpg'),   
    });

}