



function demo() {

    physic.set({
        fps:60,
        substep:8,
        gravity:[0,-10,0],
    })


    view.moveCam({ theta:0, phi:20, distance:30, target:[0,2,0] });
    view.load ( ['mecanum.sea'], afterLoadGeometry, true, true );

};

function afterLoadGeometry () {

    view.addJoystick();
    
    physic.add({type:'plane'});// infinie plane

    // physic terrain shape

    /*add ({ 
        type:'terrain', 
        uv:50,
        pos : [ 0, -10, 0 ], // terrain position
        size : [ 1000, 10, 1000 ], // terrain size in meter
        sample : [ 512, 512 ], // number of subdivision
        frequency : [0.016,0.05,0.2], // frequency of noise
        level : [ 1, 0.2, 0.05 ], // influence of octave
        expo: 3,
        flipEdge : true, // inverse the triangle
        hdt : 'PHY_FLOAT', // height data type PHY_FLOAT, PHY_UCHAR, PHY_SHORT
        friction: 1, 
        restitution: 0.2,
    });*/

    //return

    // make meca material
    initMaterials();

    // mecanum buggy
    buildMecanum();

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
    
}

function update() {

    var d;
    var ts = user.key[1] * acc;
    var rs = user.key[0] * acc;
     

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
        //r.push( [ 'jh'+i, 'motor', [ s, 100] ] );
        r.push( { name:'jh'+i, type:'motor',  targetVelocity:s, maxMotor:100 } );
        
    }

    // apply forces to bodys
    physic.forces( r );

};

var mat = {};
// ! \\ set car speed and direction
var acc = 5;
var speed = 0;
var translation = false;
var rotation = true;

// -----------------------
//    MECANUM BUGGY 
//  
//      3 ----- 1  :R
//      |  >>>  )
//      2 ----- 0  :L
//
// -----------------------

var size = 0.05;
var debug = false;

var geo = view.getGeo();
var mat = view.getMat();
//var useSteering = false;

//var steeringAxis = [1,1,1,1];
var steeringAxis = [0,0,0,0];

// center of mass position y
var decalY = 62.5 * size; 

var buggyGroup = 8;
var buggyMask = -1;//1|2;
var noCollision = 32;

function buildMecanum () {

    // body

    var bodyMass = 100;

    physic.add({ 

        name:'chassis',
        type:'convex',
        shape:view.getGeometry( 'mecanum', 'meca_chassis_shape' ),

        mass:bodyMass,
        size:[size],
        pos:[0, decalY, 0],

        geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_chassis' ),
        material:debug ? undefined : mat.meca1,
        
        state:4,
        group:buggyGroup, 
        mask:buggyMask, 

        friction: 0.6, 
        restitution: 0.2,
        //linear:0.5,
        //angular:1,


    });

    //physic.add({type:'box', name:'boyA', mass:10, pos:[0,15,0], size:[2] });

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
        name:'paddel'+n,
        type:'box', 

        mass:massPaddel,
        size:[28*size, 7*size, 80*size],

        geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_paddel' ),
        material:debug ? undefined : mat.meca3,
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
        name:'padtop'+n,
        type:'box',

        mass:massPadtop,
        size:[10*size, 10*size, 63*size],
        //size:[3*size, 5*size, 63*size],

        geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_padtop' ),
        material:debug ? undefined : mat.meca3,
        geoSize:[size],
        
        pos:pos1,
        //rot:rot,
        state:4,
        group:buggyGroup, 
        mask:noCollision,  
        //linear:0.5,
        angular:1,
    });

    physic.add({
        name:'ax_1_'+n,
        type:'joint_hinge',
        body1:'chassis',
        body2:'paddel'+n,
        pos1:[pos0[0], pos0[1]-decalY, pos0[2]+decal0[0] ],
        pos2:[ 0, 0, decal0[1]],
        axe1:[1,0,0],
        axe2:[1,0,0],
    });

    physic.add({
        name:'ax_2_'+n,
        type:'joint_hinge',
        body1:'chassis',
        body2:'padtop'+n,
        pos1:[pos1[0], pos1[1]-decalY, pos1[2]+decal1[0] ],
        pos2:[ 0, 0, decal1[1]],
        axe1:[1,0,0],
        axe2:[1,0,0],
    });



    if(steeringAxis[n]){

        physic.add({ 
            name:'axis'+n,
            type:'box',

            mass:massAxis*0.5,
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
            name:'axis_s_'+n,
            type:'box', 

            mass:massAxis*0.5,
            friction:0.1,
            size:[23*size, 23*size, 23*size],

            geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_axis_av2' ),
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
            //limit:[0, 0],
            //motor:[true, 3, 10],
        });

    } else {

        physic.add({ 
            name:'axis'+n,
            type:'box',

            mass:massAxis,
            friction:0.1,
            size:[23*size, 23*size, 23*size],

            geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_axis_ar' ),
            material:debug ? undefined : mat.meca3,
            geoRot:gr2,
            geoSize:[size],
            
            pos:pos2,
            state:4,
            group:buggyGroup, 
            mask:buggyMask,
        });

    }


    physic.add({
        name:'ax_1e_'+n,
        type:'joint_hinge',
        body1:'axis'+n,
        body2:'paddel'+n,
        pos1:[0, -14*size, decal2[0] ],
        pos2:[ 0, 0, -decal0[1]],
        axe1:[1,0,0],
        axe2:[1,0,0],
    });

    physic.add({
        name:'ax_2e_'+n,
        type:'joint_hinge',
        body1:'axis'+n,
        body2:'padtop'+n,
        pos1:[0, 23*size, decal2[1] ],
        pos2:[ 0, 0, -decal1[1]],
        axe1:[1,0,0],
        axe2:[1,0,0],
    });

    

    


};

function spring ( n ) {

    var side = 1; 
    if(n==1 || n==3) side = -1;

    var front = 1; 
    if(n==2 || n==3) front = -1;

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

    physic.add({ 
        name:'bA'+n,
        type:'box',

        mass:massTop,
        size:[17*size, 17*size, 17*size],

        geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_stop' ),
        material:debug ? undefined : mat.meca3,
        geoSize:[size],
        geoRot:gr,

        state:4,
        pos:p1,
        group:buggyGroup, 
        mask:noCollision,
    });

    physic.add({ 
        name:'bB'+n,
        type:'box',

        mass:massLow,
        size:[10*size, 10*size, 10*size],

        geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_slow' ),
        material:debug ? undefined : mat.meca3,
        geoSize:[size],
        geoRot:gr2,

        state:4,
        pos:[p1[0]+p2[0], 50*size,  p1[2]+p2[2]],
        group:buggyGroup, 
        mask:noCollision,
    });

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
        body1:'paddel'+n,
        body2:'bB'+n,
        pos1:p2,
        pos2:[0,0,0],
        axe1:[1,0,0],
        axe2:[1,0,0],
    });

    // spring joint

    var springRange = 5*size;
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

        useA:true,

        // index means 0:translationX, 1:translationY, 2:translationZ

        enableSpring:[2,true],
        damping:[2,40000],// period 1 sec for !kG body
        //stiffness:[2,0.01],

        stiffness:[2,0.01],
        //feedback:true,
    });

    

}




function wheel ( n ) {

    // mass 
    var massWheel = 10;
    var massRoller = 10/8;

    var ext;
    var wSpeed = speed;
    var pz;

    if(n==1 || n==3) pz=-19*size;
    else pz = 19*size;

    var wpos = [120*size, 50*size, 109.5*size];

    var position = [0,0,0];

    if(n==0) position = [wpos[0],wpos[1],wpos[2]]
    if(n==1) position = [wpos[0],wpos[1],-wpos[2]]
    if(n==2) position = [-wpos[0],wpos[1],wpos[2]]
    if(n==3) position = [-wpos[0],wpos[1],-wpos[2]]

    if(n==0 || n==3){ ext='L'; }
    else{ ext='R'; }

    if(translation){ if(n==0 || n==3) wSpeed*=-1; }
    if(rotation){ if(n==1 || n==3) wSpeed*=-1; }


    physic.add({ 
        name:'axe'+n,
        
        //type:'box',
        //size:[56*size, 56*size, 14*size],

        type:'convex',
        shape:view.getGeometry( 'mecanum', 'meca_wheel_shape' ),
        size:[size],

        mass:massWheel,
        friction:0.1,
        
        //rot:[0,0,90],
        //material:'tmp1',
        geometry:debug ? undefined : view.getGeometry( 'mecanum', 'meca_wheel_' + ext ),
        material:debug ? undefined : mat.meca2,
        //geoSize:[size],
        //geoRot:[0,R,0],
        //geoScale:GR,

        //,
        
        //size:[size],
        pos:position,
        state:4,
        group:buggyGroup, 
        mask:buggyMask, 

        //linear:1,
        //angular:1,
        
    });

    // roller *8

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

            mass:massRoller,
            //friction:0.7,
            friction:0.7,
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

    // joint wheels

    var link = 'axis'+n;
    if(steeringAxis[n]) link = 'axis_s_'+n;

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


}