
var settings = {

    massChassis: 20,//100
    massAxis: 20,
    massArmtop: 20,
    massArmlow: 20,
    massSpring: 10,
    massWheel: 20,
    massRoller: 1.25,
    massPneu: 10,

    frictionRoller: 1,

}

var size = 0.05;
var debug = false;

var isMeca = true;

var mat = {};

// ! \\ set car speed and direction
var acc = 5;
var speed = 0;
var translation = false;
var rotation = true;

var springs = [];
var springsTop = [];
var springsDown = [];
var springDecal = 66*size//( 26 + 15.5 ) * size;
var springRatio =  1/(34 * size);
// spring min = 66 / max = 100
//
//34

//38.487n // 58.487
var nodes = [];


var geo = view.getGeo();
var mat = view.getMat();
//var useSteering = false;

//var steeringAxis = [1,1,1,1];
//var steeringAxis = [0,0,0,0];

// center of mass position y
var decalY = (62.5 * size); 

var buggyGroup = 1;
var buggyMask = -1;//1|2;
var noCollision = 32;
var ground;

function demo() {

    view.hideGrid();
    view.addFog({exp:0.0025});
    view.addSky({ hour:9, hdr:true });


    physic.set({
        fps:60,
        substep:10,
        gravity:[0,-10,0],
    })


    //physic.add({type:'plane', friction:1 });// infinie plane

    //physic.add({type:'box', size:[30, 10, 30], pos:[0,-25,0], friction:1 });

    // physic terrain shape

    physic.add ({ 
        type:'terrain',
        name:'ground',
        uv:50,
        pos : [ 0, -30, 0 ], // terrain position
        size : [ 1200, 30, 1200 ], // terrain size in meter
        sample : [ 512, 512 ], // number of subdivision
        frequency : [0.016,0.05,0.2], // frequency of noise
        level : [ 1, 0.2, 0.05 ], // influence of octave
        expo: 2,
       // flipEdge : true, // inverse the triangle
        hdt : 'PHY_FLOAT', // height data type PHY_FLOAT, PHY_UCHAR, PHY_SHORT
        friction: 1, 
        restitution: 0.2,
        margin:0.05,
    });

    ground = physic.byName('ground');


    view.moveCam({ theta:45, phi:20, distance:30, target:[0,-20,0] });
    view.load ( ['mecanum.sea'], afterLoad, true, true );

};

function afterLoad () {

    view.addJoystick();
    
    

    //return

    // make meca material
    initMaterials();

    // mecanum buggy
    buildMecanum();

    //physic.add({type:'box', name:'boyA', mass:100, pos:[0,15,0], size:[5] });

    //follow ('chassis', {distance:20, theta:-90});

    view.update = update;

}

function initMaterials () {

    // note: material is not recreated on code edit

    mat['meca1'] = view.material({
        name:'meca1',
        roughness: 0.4,
        metalness: 0.6,
        map: view.texture( 'meca_chassis.jpg' ),
    });

    mat['meca2'] = view.material({
        name:'meca2',
        roughness: 0.7,
        metalness: 0.3,
        map: view.texture( 'meca_wheel.jpg' ),
        normalMap: view.texture( 'meca_wheel_n.jpg' )
    });

    mat['meca3'] = view.material({
        name:'meca3',
        roughness: 0.2,
        metalness: 0.8,
        map: view.texture( 'meca_tools.jpg' ),
    });

    mat['meca4'] = view.material({
        name:'meca4',
        roughness: 0.2,
        metalness: 0.8,
        map: view.texture( 'meca_tire.jpg' ),
    });

    mat['spring'] = view.material({
        name:'spring',
        color: 0x333333,
        roughness: 0.2,
        metalness: 0.8,
        morphTargets: true,
    });

    // debug

    mat['red'] = view.material({
        name:'red',
        roughness: 0.2,
        metalness: 0.8,
        color: 0xff0000,
    });

    mat['green'] = view.material({
        name:'green',
        roughness: 0.2,
        metalness: 0.8,
        color: 0x00FF00,
    });

    mat['blue'] = view.material({
        name:'blue',
        roughness: 0.2,
        metalness: 0.8,
        color: 0x0055FF,
    });
    
}

function update() {

    var d;
    var ts = user.key[1] * acc;
    var rs = user.key[0] * acc;
    var rx = user.key[2] * acc;

    if(ts===0) var ts = user.key[3] * acc;

    //console.log(rx)

   // speed = user.key[0] * 5 + user.key[1] * 5;

    var i = 4, r=[];
    while(i--){
        
        if(Math.abs(ts)>Math.abs(rs)){
            s = ts;// translation
            //if(i==0 || i==3) s*=-1; 
        } else { 
            s = rs;// rotation
            if(i==1 || i==3) s*=-1; 
        }

        if(Math.abs(rx)>0){
            if(i==0 || i==3) s=rx;
            else s=-rx;
        }
        //r.push( [ 'jh'+i, 'motor', [ s, 100] ] );
        r.push( { name:'jh'+i, type:'motor', targetVelocity:s, maxMotor:100 } );
        
    }

    // apply forces to bodys
    physic.forces( r );

    springsDistance();

};

// springs morph update

function springsDistance () {
    
    var i = 4, d = [];
    while(i--){

        d[i] = (springsTop[i].position.distanceTo( springsDown[i].position )) - springDecal;
        springs[i].morphTargetInfluences[ 0 ] = ( 'max', d[i]*springRatio  ); 

    }

}

// -----------------------
//    MECANUM BUGGY 
//  
//      3 ----- 1  :R
//      |  >>>  )
//      2 ----- 0  :L
//
// -----------------------

function buildMecanum () {

    var posY = 0//ground.getHeight(0,0);

    // chassis

    physic.add({ 

        name:'chassis',
        type:'convex',
        shape:view.getGeometry( 'mecanum', 'meca_chassis_shape' ),

        mass:settings.massChassis,
        size:[size],
        pos:[0, posY+decalY, 0],

        geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_chassis' ),
        material:debug ? undefined : mat.meca1,
        
        state:4,
        group:buggyGroup, 
        mask:buggyMask, 

        friction: 0.5, 
        restitution: 0,
        //linear:0.5,
        //angular:1,

    });

    

    // wheelAxis

    var i = 4;
    while(i--){

        wheelAxis( i );
        // add suspensions
        spring ( i );
        // add wheels
        wheel( i );

    }
    

};



function wheelAxis ( n ) {

    // mass 
    var massPaddel = 20;
    var massPadtop = 20;//2;
    var massAxis = 20;//2;

    var rot = [10, 0, 0];
    var ext2;
    var front = 1;
    
    var gr = undefined;
    var gr2 = undefined;

    var side = 1; 
    if(n==1 || n==3) side = -1;

    var front = 1; 
    if(n==2 || n==3) front = -1;

    var ext = n==0 || n==3 ? 'L' : 'R';

    switch(n){
        case 0 : ext2 = '_av'; gr = [0,0,180]; break;
        case 1 : ext2 = '_av'; gr = [180,0,180]; gr2 = [0,180,0]; break;
        case 2 : ext2 = '_ar'; break;
        case 3 : ext2 = '_ar'; gr = [180,0,0]; gr2 = [0,180,0]; break;
    }

    var pos0 = [120*front, 50, 60*side ].map(function(x) { return x * size; });
    var pos1 = [120*front, 84, 54.5*side ].map(function(x) { return x * size; });
    var pos2 = [120*front, 50, 91*side ].map(function(x) { return x * size; });
    var pos3 = [120*front, 50, 91*side ].map(function(x) { return x * size; });

    var decal0 = [-40*side, -40*side].map(function(x) { return x * size; });
    var decal1 = [-31.5*side, -31.5*side].map(function(x) { return x * size; });
    var decal2 = [8*side, -5.957*side].map(function(x) { return x * size; });

    physic.add({ 
        name:'armlow'+n,
        type:'hardbox', 

        mass:settings.massArmlow,
        size:[28*size, 10*size, 80*size],
        //size:[28*size, 7*size, 80*size],

        geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_paddel' ),
        material:debug ? mat.green : mat.meca3,
        geoRot:gr,
        geoSize:[size],
        
        pos:pos0,
        state:4,
        group:buggyGroup, 
        mask:noCollision,
        //linear:0.5,
        angular:1,
    });

    physic.add({ 
        name:'armtop'+n,
        type:'hardbox',

        mass:settings.massArmlow,
        size:[28*size, 10*size, 80*size],
        //size:[10*size, 10*size, 63*size],
        //size:[3*size, 5*size, 63*size],

        geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_padtop' ),
        material:debug ? mat.green : mat.meca3,
        geoSize:[size],
        
        pos:pos1,
        //rot:rot,
        state:4,
        group:buggyGroup, 
        mask:noCollision,  
        //linear:0.5,
        angular:1,
    });

    if( isMeca || front === -1 ){

        physic.add({ 
            name:'axis'+n,
            type:'hardbox',

            mass:settings.massAxis,
            friction:0.1,
            size:[23*size, 23*size, 23*size],

            geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_axis_ar' ),
            material:debug ? mat.blue : mat.meca3,
            geoRot:gr2,
            geoSize:[size],
            
            pos:pos2,
            state:4,
            group:buggyGroup, 
            mask:buggyMask,
        });

    } else {

        physic.add({ 
            name:'axis'+ n,
            type:'box',

            mass:settings.massAxis*0.5,
            size:[23*size, 23*size, 23*size],

            geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_axis_av' ),
            material:debug ? undefined : mat.meca3,
            geoRot:gr2,
            geoSize:[size],
            
            pos:pos2,
            state:4,
            group:buggyGroup, 
            mask:noCollision,
            angular:1,
        });

        physic.add({ 
            name:'axis_s_'+ n,
            type:'box', 

            mass:settings.massAxis*0.5,
            friction:0.1,
            size:[23*size, 23*size, 23*size],

            geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_axis_av2_'  + ext),
            material:debug ? undefined : mat.meca3,
            geoRot:gr2,
            geoSize:[size],

            pos:pos3,
            state:4,
            group:buggyGroup, 
            mask:buggyMask, 
            angular:1,
        });

        physic.add({
            name:'j_steering_'+n,
            type:'joint_hinge',
            body1:'axis'+n,
            body2:'axis_s_'+n,
            pos1:[0,0,0],
            pos2:[0,0,0],
            axe1:[0,1,0],
            axe2:[0,1,0],
            limit:[0, 0],
            //motor:[true, 3, 10],
        });


    }

    
    // joint

    var limit = [ side>0 ? 0 : -15, side>0 ? 15 : 0, ,0.9,0.3,1 ];

    physic.add({
        name:'ax_1_'+n,
        type:'joint_hinge',
        body1:'chassis',
        body2:'armlow'+n,
        pos1:[pos0[0], pos0[1]-decalY, pos0[2]+decal0[0] ],
        pos2:[ 0, 0, decal0[1]],
        axe1:[1,0,0],
        axe2:[1,0,0],
        limit:limit,
    });

    physic.add({
        name:'ax_2_'+n,
        type:'joint_hinge',
        body1:'chassis',
        body2:'armtop'+n,
        pos1:[pos1[0], pos1[1]-decalY, pos1[2]+decal1[0] ],
        pos2:[ 0, 0, decal1[1]],
        axe1:[1,0,0],
        axe2:[1,0,0],
        limit:limit,
    });

    physic.add({
        name:'ax_1e_'+n,
        type:'joint_hinge',
        body1:'axis'+n,
        body2:'armlow'+n,
        pos1:[0, -14*size, decal2[0] ],
        pos2:[ 0, 0, -decal0[1]],
        axe1:[1,0,0],
        axe2:[1,0,0],
        limit:limit,
    });

    physic.add({
        name:'ax_2e_'+n,
        type:'joint_hinge',
        body1:'axis'+n,
        body2:'armtop'+n,
        pos1:[0, 23*size, decal2[1] ],
        pos2:[ 0, 0, -decal1[1]],
        axe1:[1,0,0],
        axe2:[1,0,0],
        limit:limit,
    });

};

function spring ( n ) {

    var side = 1; 
    if(n==1 || n==3) side = -1;

    var front = n==2 || n==3 ? -1 : 1; 

    var p1 = [136.5*front, 102, 24*side].map(function(x) { return x * size; });
    var p2 = [16.5*front, 0, 15*side].map(function(x) { return x * size; });

    var gr = [0,0,0];
    if(side==-1) gr = [0,180,0];

    var gr2 = [0,0,0];
    if(side==-1) gr2 = [0,180,0];

    // mass 
    var massTop = 2;
    var massLow = 2;

    // object

    springsTop[n] = physic.add({ 
        name:'bA'+n,
        type:'hardbox',

        mass: settings.massSpring * 0.5,
        size:[17*size, 17*size, 22*size],

        geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_stop' ),
        material:debug ? mat.red : mat.meca3,
        geoSize:[size],
        geoRot:gr,

        state:4,
        pos:p1,
        group:buggyGroup, 
        mask:noCollision,
    });

    springsDown[n] = physic.add({ 
        name:'bB'+n,
        type:'hardbox',

        mass:settings.massSpring * 0.5,
        size:[17*size, 17*size, 22*size],
        //size:[10*size, 10*size, 10*size],

        geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_slow' ),
        material:debug ? mat.red : mat.meca3,
        geoSize:[size],
        geoRot:gr2,

        state:4,
        pos:[p1[0]+p2[0], 50*size,  p1[2]+p2[2]],
        group:buggyGroup, 
        mask:noCollision,
    });

    springs[n] = new THREE.Mesh( view.getGeometry( 'mecanum', 'meca_spring' ), mat.spring );
    springsTop[n].add( springs[n] );
    if( side===-1 ) springs[n].rotation.x = 180*THREE.Math.DEG2RAD;

    // joint

    physic.add({
        name:'jj_1e_'+n,
        type:'joint_hinge',
        body1:'chassis',
        body2:'bA'+n,
        pos1:[p1[0], p1[1]-decalY,  p1[2]],
        pos2:[0,0,0],
        axe1:[1,0,0],
        axe2:[1,0,0],
    });

    physic.add({
        name:'jj_2e_'+n,
        type:'joint_hinge',
        body1:'armlow'+n,
        body2:'bB'+n,
        pos1:p2,
        pos2:[0,0,0],
        axe1:[1,0,0],
        axe2:[1,0,0],
    });

    // spring joint

    var springRange = 10*size;
    var springRestLen = -85*size;  

    physic.add({

        type:'joint_spring_dof',
        name:'jj'+n,
        body1:'bA'+n,
        body2:'bB'+n,
        pos1:[0, 0, 0],
        pos2:[0, 0, (springRestLen-springRange)*side],

        angLower: [0, 0, 0],
        angUpper: [0, 0, 0],
        
        linLower: [ 0, 0, -springRange ],
        linUpper: [ 0, 0, springRange ],

        // [ x, y, z, rx, ry, rz ]
        spring:[0,0,200,0,0,0],//stiffness // rigidité
        damping:[0,0,1000,0,0,0],// period 1 sec for !kG body // amortissement

        //feedback:true,
    });

    

}




function wheel ( n ) {

    var ext = n==0 || n==3 ? 'L' : 'R';
    var front = n==2 || n==3 ? -1 : 1; 
    var wSpeed = speed;
    var pz;

    

    if(n==1 || n==3) pz=-19*size;
    else pz = 19*size;

    var wpos = [120*size, 50*size, 109.5*size];
    var position = [n<2? wpos[0] : -wpos[0], wpos[1], (n==1 || n==3) ? -wpos[2] : wpos[2] ];

    var positionTT = [n<2? wpos[0]*2 : -wpos[0]*2, wpos[1], (n==1 || n==3) ? -wpos[2]*2 : wpos[2]*2];

    if(translation){ if(n==0 || n==3) wSpeed*=-1; }
    if(rotation){ if(n==1 || n==3) wSpeed*=-1; }

    var shape = view.getGeometry( 'mecanum', isMeca ? 'meca_wheel_shape' : 'meca_wheel_shape_jante' );
    var geometry = view.getGeometry( 'mecanum', isMeca ? 'meca_wheel_' + ext : 'meca_jante_' + ext )
    var material = isMeca ? mat.meca2 : mat.meca4;

    physic.add({ 

        name:'axe'+n,
        
        //type:'box',
        //size:[56*size, 56*size, 14*size],

        type:'convex',
        shape:shape,
        geometry:debug ? undefined : geometry,
        material:debug ? undefined : material,
        size:[size],

        mass:settings.massWheel,
        friction:0.1,
        pos:position,
        state:4,
        group:buggyGroup, 
        mask:buggyMask, 

        //linear:1,
        //angular:1,
        
    });

    // roller X8

    // joint wheels

    var link = isMeca || front === -1 ? 'axis'+n : 'axis_s_'+n;

    physic.add({
        name:'jh'+n,
        type:'joint_hinge',
        body1:link,
        body2:'axe'+n,
        pos1:[ 0, 0, pz],
        pos2:[ 0, 0, 0],
        axe1:[0,0,1],
        axe2:[0,0,1],
        motor:[true, wSpeed, 100],
        collision:true,
        
    })

    if( ! isMeca ){ 

        /*physic.add({ 

            name:'pneu'+n,
            type:'convex',
            shape:view.getGeometry( 'mecanum', 'meca_pneu' ),
            material:debug ? undefined : material,
            size:[size],
            mass:settings.massPneu,
            pos:position,
            state:4,
            group:buggyGroup, 
            mask:2, 
            
        });*/

        physic.add({ 

            name:'pneuX'+n,
            type:'softMesh',
            shape:view.getGeometry( 'mecanum', 'meca_pneu' ),
            material:debug ? undefined : material,
            size:[size],
            mass:settings.massPneu,
            pos:position,
            state:4,
            group:buggyGroup, 
            mask:2, 

            viterations: 10,
            piterations: 40,
            //citerations: 20,
            //diterations: 20,
            friction: 1,
            //damping: 0.1,// amortissement
            pressure: 200,
            matching:1,
            //timescale:2,
            //maxvolume:0.1,
            //stiffness:0.99,//rigidité
            //hardness:1,
            //volume:1,
            //margin:0.05,
            //drag:0.5,
            //lift:0.5,
            //fromfaces:true,
            //bendingConstraint:2,
            //cluster: 64,
            //restitution: 0.2,
            //bodyAnchor:'axe'+n,
            
        });

        // get final vertrices
        if(n===3){
            var v = physic.byName('pneuX'+n).geometry.realVertices;
            var lng = v.length/3;
            for( var i = 0; i<lng; i++ ){
                x = Math.abs( Math.round( v[i * 3] ));
                if( x === 20 * size ) nodes.push( i );
            }

            //console.log(nodes.length)
        }


        // attach to circle
        physic.anchor({ nodes:nodes, soft:'pneuX'+n, body:'axe'+n });

        /*physic.add({

            name:'jhp'+n,
            type:'joint_fixe',
            body1:'axe'+n,
            body2:'pneu'+n,
            collision:false,
            
        })*/


        return;
    }

    var radius = 39*size;
    var i = 8, angle, y, x, z;
    var axis = [];
    var axe = [];

    while(i--){

        angle = -(45*i)*Math.torad;
        x = (radius * Math.cos(angle));
        y = (radius * Math.sin(angle));
        z = position[2];

        if(ext=='R'){
            if(i==0) { axe = [-45, 0, 0 ];             axis = [0,1,1]; }
            if(i==1) { axe = [-35.264, 30, -35.264 ];  axis = [0.783,0.783,1]; }
            if(i==2) { axe = [0, 45, -90 ];            axis = [1,0,1]; }
            if(i==3) { axe = [35.264, 30, 215.264 ];   axis = [0.783,-0.783,1]; }
            if(i==4) { axe = [45, 0, -180 ];           axis = [0,-1,1]; }
            if(i==5) { axe = [35.264, -30, -215.264 ]; axis = [-0.783,-0.783,1]; }
            if(i==6) { axe = [0, -45, -270 ];          axis = [-1,0,1]; }
            if(i==7) { axe = [-35.264, -30, 35.264 ];  axis = [-0.783,0.783,1]; }
        } else {
            if(i==0) { axe = [45, 0, 0 ];             axis = [0,-1,1]; }
            if(i==1) { axe = [35.264, -30, 35.264 ];  axis = [-0.783,-0.783,1]; }
            if(i==2) { axe = [0, -45, -90 ];            axis = [-1,0,1]; }
            if(i==3) { axe = [-35.264, -30, -215.264 ];   axis = [-0.783,0.783,1]; }
            if(i==4) { axe = [-45, 0, -180 ];           axis = [0,1,1]; }
            if(i==5) { axe = [-35.264, 30, 215.264 ]; axis = [0.783,0.783,1]; }
            if(i==6) { axe = [0, 45, -270 ];          axis = [1,0,1]; }
            if(i==7) { axe = [35.264, 30, -35.264 ];  axis = [0.783,-0.783,1]; }
        }

        physic.add({ 

            name:n+'_rr_'+i,
            type:'convex',
            shape:view.getGeometry( 'mecanum', 'meca_roller_shape' ),
            mass:settings.massRoller,
            friction:settings.frictionRoller,
            size:[size],
            rot:axe,
            pos:[x+ position[0], y+ position[1], z],

            geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_roller' ),
            material:debug ? undefined : mat.meca2,
            
            state:4,
            
            //margin:0.01,
            group:buggyGroup, 
            mask:buggyMask,
            
        })

        physic.add({

            name:'jr'+i+n,
            type:'joint_hinge',
            body1:'axe'+n,
            body2:n+'_rr_'+i,
            pos1:[ x, y, 0],
            pos2:[ 0, 0, 0],
            axe1: axis,
            axe2:[0,0,1],

            //motor:[true, -speed, 100],
        })

    }

    


}