function demo() {

    cam ( -90, 20, 30 );
    load ( 'meca', afterLoad );

   
    
};
function afterLoad () {

    //ammo.send('gravity', {g:[0,0,0]});

    // infinie plane
    add({type:'plane'});

    // load cars map
    view.addMap('meca_chassis.jpg', 'cars');

    // mecanum car
    meca();

}

// set car speed

var speed = 5;
var lateral = false;
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
var geo = view.getGeo();
var mat = view.getMat();
var wheelRadius = 50*size;
var useSteering = false;

var buggyGroup = 4;
var buggyMask = -1;//1|2;

function meca () {

    // body

    add({ 
        name:'chassis',
        type:'mesh', 
        //material:'tmp1',
        geometry:geo['meca_chassis'],
        shape:geo['meca_chassis_shape'],
        mass:100,
        size:[size],
        pos:[0, 0, 0],
        state:4, //4,
        group:buggyGroup, 
        mask:buggyMask, 
        material:'cars',
    })

     add({type:'box', name:'boyA', mass:10, pos:[0,5,0], size:[3], group:buggyGroup, 
        mask:buggyMask,
        size:[5,1,8]
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
    var massPadtop = 2;
    var massAxis = 2;

    var rot = [10, 0, 0];
    var ext, ext2;
    var front = 1;
    
    var gr = [0,0,0];

    var side = 1; 
    if(n==1 || n==3) side = -1;

    var front = 1; 
    if(n==2 || n==3) front = -1;

    switch(n){
        case 0 : ext = '_av'; ext2 = '_avl'; rot = [10, 0, 0 ];  gr=[0,0,180]; break;
        case 1 : ext = '_av'; ext2 = '_avr'; rot = [10, 0, 0];  gr=[180,0,180]; break;
        case 2 : ext = '_ar'; ext2 = '_arl'; rot = [10, 0, 0 ];   break;
        case 3 : ext = '_ar'; ext2 = '_arr'; rot = [10, 0, 0];  gr=[180,0,0]; break;
    }

    var pos0 = [120*front, 50, 60*side ].map(function(x) { return x * size; });
    var pos1 = [120*front, 84, 54.5*side ].map(function(x) { return x * size; });
    var pos2 = [120*front, 50, 91*side ].map(function(x) { return x * size; });

    var decal0 = [-40*side, -40*side].map(function(x) { return x * size; });
    var decal1 = [-31.5*side, -31.5*side].map(function(x) { return x * size; });
    var decal2 = [8*side, -5.957*side].map(function(x) { return x * size; });

    //var decal3 = [136.5*front, 102, 24*side].map(function(x) { return x * size; });
    //var decal4 = [16.5*front, 0, 15*side].map(function(x) { return x * size; });


    add({ 
        name:'paddel'+n,
        type:'box', 

        mass:massPaddel,
        size:[50*size, 7*size, 70*size],

        geometry:geo['meca_paddel_ar'],//+ext],
        geoRot:gr,
        geoSize:[size],
        
        pos:pos0,
        rot:rot,
        state:4,
        group:buggyGroup, 
        mask:buggyMask, 
    });

    joint({
        name:'ax_1_'+n,
        type:'joint_hinge',
        body1:'chassis',
        body2:'paddel'+n,
        pos1:[pos0[0], pos0[1], pos0[2]+decal0[0] ],
        pos2:[ 0, 0, decal0[1]],
        axe1:[1,0,0],
        axe2:[1,0,0],
        //motor:[true, 3, 100],
    });

    add({ 
        name:'padtop'+n,
        type:'box',

        mass:massPadtop,
        size:[3*size, 5*size, 63*size],

        geometry:geo['meca_padtop'],
        geoSize:[size],
        
        pos:pos1,
        rot:rot,
        state:4,
        group:buggyGroup, 
        mask:buggyMask, 
    })

    joint({
        name:'ax_2_'+n,
        type:'joint_hinge',
        body1:'chassis',
        body2:'padtop'+n,
        pos1:[pos1[0], pos1[1], pos1[2]+decal1[0] ],
        pos2:[ 0, 0, decal1[1]],
        axe1:[1,0,0],
        axe2:[1,0,0],
        //motor:[true, 3, 100],
    });

    if(!useSteering){
        if(ext2 == '_avr') ext2 = '_arr';
        if(ext2 == '_avl') ext2 = '_arl';
    }

    
    if(ext2 == '_avr' || ext2 == '_avl') massAxis *= 0.5;

    add({ 
        name:'axis'+n,
        type:'box',

        mass:massAxis,
        size:[16*size, 23*size, 23*size],

        geometry:geo['meca_axis'+ext2],
        geoSize:[size],
        
        pos:pos2,
        state:4,
        group:buggyGroup, 
        mask:buggyMask, 
    });

    joint({
        name:'ax_1e_'+n,
        type:'joint_hinge',
        body1:'axis'+n,
        body2:'paddel'+n,
        pos1:[0, -14*size, decal2[0] ],
        pos2:[ 0, 0, -decal0[1]],
        axe1:[1,0,0],
        axe2:[1,0,0],
    })

    joint({
        name:'ax_2e_'+n,
        type:'joint_hinge',
        body1:'axis'+n,
        body2:'padtop'+n,
        pos1:[0, 23.06*size, decal2[1] ],
        pos2:[ 0, 0, -decal1[1]],
        axe1:[1,0,0],
        axe2:[1,0,0],
    });

    if(ext2 == '_avr' || ext2 == '_avl'){
        if(useSteering){
            add({ 
                name:'axis_s_'+n,
                type:'box', 

                mass:massAxis,
                size:[16*size, 23*size, 23*size],

                geometry:geo['meca_axis'+ext2+'2'],
                geoSize:[size],

                pos:pos2,
                state:4,
                group:buggyGroup, 
                mask:buggyMask, 
            });

            joint({
                name:'ax_3s_'+n,
                type:'joint_hinge',
                body1:'axis'+n,
                body2:'axis_s_'+n,
                pos1:[0,0,0],
                pos2:[0,0,0],
                axe1:[0,1,0],
                axe2:[0,1,0],
            });
        }
    }

    

    


};

function spring ( n ) {

    var side = 1; 
    if(n==1 || n==3) side = -1;

    var front = 1; 
    if(n==2 || n==3) front = -1;

    var p1 = [136.5*front, 102, 24*side].map(function(x) { return x * size; });
    //var p2 = [(136.5+16.5)*front, 102,(24+15)*side].map(function(x) { return x * size; });
    var p2 = [16.5*front, 0, 15*side].map(function(x) { return x * size; });

    var gr = [0,0,0];
    if(side==-1) gr = [0,180,0];

    var gr2 = [0,0,0];
    if(side==-1) gr2 = [0,180,0];

    // mass 
    var massTop = 2;
    var massLow = 2;

    add({ 
        name:'bA'+n,
        type:'box',

        mass:massTop,
        size:[17*size, 17*size, 17*size],

        geometry:geo['meca_stop'],
        geoSize:[size],
        geoRot:gr,

        state:4,
        pos:p1,
        group:buggyGroup, 
        mask:buggyMask, 
    });

    add({ 
        name:'bB'+n,
        type:'box',

        mass:massLow,
        size:[10*size, 10*size, 10*size],

        geometry:geo['meca_slow'],
        geoSize:[size],
        geoRot:gr2,

        state:4,
        pos:[p1[0]+p2[0], 50*size,  p1[2]+p2[2]],
        group:buggyGroup, 
        mask:buggyMask, 
    });

    joint({
        name:'jj_1e_'+n,
        type:'joint_hinge',
        body1:'chassis',
        body2:'bA'+n,
        pos1:p1,
        pos2:[0,0,0],
        axe1:[1,0,0],
        axe2:[1,0,0],
    });

    joint({
        name:'jj_2e_'+n,
        type:'joint_hinge',
        body1:'paddel'+n,
        body2:'bB'+n,
        pos1:p2,
        pos2:[0,0,0],
        axe1:[1,0,0],
        axe2:[1,0,0],
    });



    var springRange = 10*size;
    var springRestLen = -80*size;
    

    joint({
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

        enableSpring:[0,true],
        damping:[0,39],// period 1 sec for !kG body
        stiffness:[0,0.01],
        //feedback:true,
    });

    

}




function wheel ( n ) {

    // mass 
    var massWheel = 10;
    var massRoller = 2; // *8

    var ext;
    var wSpeed = speed;
    var pz;// = -15*size;

    //if(n==0 || n==2) pz*=-1;

    if(n==1 || n==3) pz=-19*size;
    else pz = 19*size;

    var wpos = [120*size, 100*size, 110*size];

    var position = [0,0,0];

    if(n==0) position = [wpos[0],wpos[1],wpos[2]]
    if(n==1) position = [wpos[0],wpos[1],-wpos[2]]
    if(n==2) position = [-wpos[0],wpos[1],wpos[2]]
    if(n==3) position = [-wpos[0],wpos[1],-wpos[2]]

    var GR;
    if(n==0 || n==3){ ext='L'; GR=undefined }
    else{ ext='R'; GR = [1,-1, 1]; }

    if(lateral){ if(n==0 || n==3) wSpeed*=-1; }
    if(rotation){ if(n==1 || n==3) wSpeed*=-1; }


    add({ 
        name:'axe'+n,
        type:'box',
        //type:'cylinder', 

        mass:massWheel,
        size:[56*size, 56*size, 14*size],
        //rot:[0,0,90],
        //material:'tmp1',
        geometry:geo['meca_wheel_'+ext],
        geoSize:[size],
        //geoRot:[0,R,0],
        //geoScale:GR,

        //shape:geo['meca_wheel_shape'],
        
        //size:[size],
        pos:position,
        state:4,
        group:buggyGroup, 
        mask:buggyMask, 
    });


    var radius = 39*size;
    var i = 8, angle, y, x, z;
    var axis = [];
    var axe = [];

    while(i--){
        angle = -(45*i)*Math.degtorad;
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

        add({ 
            name:n+'_rr_'+i,
            type:'mesh',
            geometry:geo['meca_roller'],
            shape:geo['meca_roller_shape'],
            mass:massRoller,
            //friction:0.9,
            size:[size],
            rot:axe,
            state:4,
            pos:[x+ position[0], y+ position[1], z],
            margin:0.01,
            group:buggyGroup, 
            mask:buggyMask, 
        })

        joint({
            name:'jr'+i,
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



    var link;
    if( (n==0 || n==1) && useSteering ) {link = 'axis_s_'+n;  }
    else link = 'axis'+n;

    joint({
        name:'jh'+n,
        type:'joint_hinge',
        body1:link,
        body2:'axe'+n,
        pos1:[ 0, 0, pz],
        pos2:[ 0, 0, 0],
        axe1:[0,0,1],
        axe2:[0,0,1],
        motor:[true, wSpeed, 100],
    })


}