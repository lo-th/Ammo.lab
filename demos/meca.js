function demo() {

    cam ( -90, 20, 30 );
    load ( 'meca', afterLoad );

   
    
};
function afterLoad () {

    //ammo.send('gravity', {g:[0,0,0]});

    // infinie plane
    add({type:'plane'});

    // mecanum car
    meca();

}

// -----------------------
//    MECANUM BUGGY 
//  
//      3 ----- 1  :R
//      |  >>>  )
//      2 ----- 0  :L
//
// -----------------------

var geo = view.getGeo();
var mat = view.getMat();
var speed = 0;
var size = 0.05;
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
    })

     add({type:'box', name:'boyA', mass:10, pos:[0,40,0], size:[3], group:buggyGroup, 
        mask:buggyMask
    });

    // wheelAxis

    var i = 4;
    while(i--){
        wheelAxis(i);
    }

    /*add({ 
        name:'body',
        type:'box', 
        //material:'tmp1',
        //geometry:view.getGeo()['base_frame'],
        //shape:view.getGeo()['base_frame_S'],
        mass:20,
        size:[16, 2, 7],
        pos:[0, wheelRadius, 0],
        state:4,
    })*/

    // wheels

    /*var wpos = [7, wheelRadius, 5];

    wheel( 0 [wpos[0],wpos[1],wpos[2]], -speed);
    wheel( 1 [wpos[0],wpos[1],-wpos[2]], speed);
    wheel( 2 [-wpos[0],wpos[1],wpos[2]], speed);
    wheel( 3 [-wpos[0],wpos[1],-wpos[2]], -speed);
    */
    

};



function wheelAxis ( n ) {

    var rot = [0, 0, 0];
    var ext, ext2;
    var front = 1;// 1:front -1:back
    var side = 1; // 1:left -1:right

    switch(n){
        case 0 :
        ext = '_av';
        ext2 = '_avl';
        rot = [10, 0, 0];
        front = 1;
        side = 1;
        break;
        case 1 :
        ext = '_av';
        ext2 = '_avr';
        rot = [170, 0, 0];
        front = 1;
        side = -1;
        break;
        case 2 :
        ext = '_ar';
        ext2 = '_arl';
        rot = [10, 0, 0];
        front = -1;
        side = 1;
        break;
        case 3 :
        ext = '_ar';
        ext2 = '_arr';
        rot = [170, 0, 0];
        front = -1;
        side = -1;
        break;
    }

    var pos0 = [120*front, 50, 60*side ].map(function(x) { return x * size; });
    var pos1 = [120*front, 84, 54.5*side ].map(function(x) { return x * size; });
    var pos2 = [120*front, 50, 91*side ].map(function(x) { return x * size; });

    var decal0 = [-40*side, -40].map(function(x) { return x * size; });
    var decal1 = [-31.5*side, -31.5*side].map(function(x) { return x * size; });
    var decal2 = [8*side, -5.957*side].map(function(x) { return x * size; });

    var decal3 = [136.5*front, 102, 24*side].map(function(x) { return x * size; });
    var decal4 = [16.5*front, 0, 15].map(function(x) { return x * size; });
    

    //var decal3 = [120*front, 50, 60*side ].map(function(x) { return x * size; });
    //var decal4 = [0,0,0];
    //var decal4 = [0, 0, 15*side].map(function(x) { return x * size; });

    add({ 
        name:'paddel'+n,
        type:'mesh', 
        //material:'tmp1',
        geometry:geo['meca_paddel'+ext],
        shape:geo['meca_paddel_shape'+ext],
        mass:2,
        size:[size],
        pos:pos0,
        rot:rot,
        state:4,
        group:buggyGroup, 
        mask:buggyMask, 
    });

    add({
        name:'ax_1_'+n,
        type:'joint_hinge',
        body1:'chassis',
        body2:'paddel'+n,
        pos1:[pos0[0], pos0[1], pos0[2]+decal0[0] ],
        pos2:[ 0, 0, decal0[1]],
        axe1:[1,0,0],
        axe2:[1,0,0],
        //motor:[true, 3, 100],
    })

    add({ 
        name:'padtop'+n,
        type:'mesh', 
        //material:'tmp1',
        geometry:geo['meca_padtop'],
        shape:geo['meca_padtop_shape'],
        mass:2,
        size:[size],
        pos:pos1,
        rot:rot,
        state:4,
        group:buggyGroup, 
        mask:buggyMask, 
    })

    add({
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

    var mx;
    if(ext2 == '_avr' || ext2 == '_avl') mx = 1;
    else mx = 2;

    add({ 
        name:'axis'+n,
        type:'mesh', 
        //material:'tmp1',
        geometry:geo['meca_axis'+ext2],
        shape:geo['meca_axis_shape'],
        mass:mx,
        size:[size],
        pos:pos2,
        state:4,
        group:buggyGroup, 
        mask:buggyMask, 
    });

    add({
        name:'ax_1e_'+n,
        type:'joint_hinge',
        body1:'axis'+n,
        body2:'paddel'+n,
        pos1:[0, -14*size, decal2[0] ],
        pos2:[ 0, 0, -decal0[1]],
        axe1:[1,0,0],
        axe2:[1,0,0],
    })

    add({
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
                type:'mesh', 
                //material:'tmp1',
                geometry:geo['meca_axis'+ext2+'2'],
                shape:geo['meca_axis_shape2'],
                mass:1,
                size:[size],
                pos:pos2,
                state:4,
                group:buggyGroup, 
                mask:buggyMask, 
            });

            add({
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

    // add suspensions
    spring ( n, decal3, decal4, side );

    // add wheels
    wheel( n );


};

function spring ( n, p1, p2, side ) {

    add({ 
        name:'bA'+n,
        type:'mesh',
        geometry:geo['meca_stop'],
        shape:geo['meca_stop_shape'],
        mass:2,
        size:[size],
        //pos:pos0,
        //rot:rot,
        state:4,
        //pos:[p1[0],p1[1],p1[2]],
        pos:p1,
        group:buggyGroup, 
        mask:buggyMask, 
    });

    add({ 
        name:'bB'+n,
        type:'mesh',
        geometry:geo['meca_slow'],
        shape:geo['meca_slow_shape'],
        mass:2,
        size:[size],
        //pos:pos0,
        //rot:rot,
        state:4,
        //pos:[0,80*size,0],
        //pos:[p1[0],p1[1],p1[2]-(80*size)],
      //  pos:p2,//[p1[0],p1[1]+80*size,p1[2]],
         //pos:p2,
        pos:[p1[0]+p2[0], p1[1]+p2[1],  p1[2]+p2[2]],
        group:buggyGroup, 
        mask:buggyMask, 
    });

    //add({type:'box', name:'bA'+n, mass:1, pos:[0,0,0], size:[0.2]});
    //add({type:'box', name:'bB'+n, mass:1, pos:[0,80*size,0], size:[0.1]});



    add({
        name:'jj_1e_'+n,
        type:'joint_hinge',
        body1:'chassis',
        body2:'bA'+n,
        pos1:p1,
        pos2:[0,0,0],
        axe1:[1,0,0],
        axe2:[1,0,0],
    });

    add({
        name:'jj_2e_'+n,
        type:'joint_hinge',
        body1:'paddel'+n,
        body2:'bB'+n,
        pos1:p2,
        pos2:[0,0,0],
        axe1:[1,0,0],
        axe2:[1,0,0],
    });

    var springRestLen = -80*size;
    var springRange = 10*size;

    add({
        type:'joint_spring_dof',
        name:'jj'+n,
        body1:'bA'+n,
        body2:'bB'+n,
        pos1:[0, 0, 0],
        pos2:[0, 0, springRestLen],
        //rotA:[-40*side, 0, 0],
        //rotB:[-40*side, 0, 0],

        angLower: [0, 0, 0],
        angUpper: [0, 0, 0],

        //linLower: [ 0, 0, 0 ],
        //linUpper: [ 0, 0, 0 ],
        
        linLower: [ 0, 0, 0 ],
        linUpper: [ 0, 0, springRange ],

        useA:true,

        enableSpring:[0,true],
        damping:[0,39],// period 1 sec for !kG body
        stiffness:[0,0.01],
        //feedback:true,
    });

    

}




function wheel ( n ) {

    var ext;
    var wSpeed = 0;
    var pz;// = -15*size;

    //if(n==0 || n==2) pz*=-1;

    if(n==1 || n==3) pz=-15*size;
    else pz = 15*size;

    //wheel( 0 [wpos[0],wpos[1],wpos[2]], -speed);
    //wheel( 1 [wpos[0],wpos[1],-wpos[2]], speed);
    //wheel( 2 [-wpos[0],wpos[1],wpos[2]], speed);
    //wheel( 3 [-wpos[0],wpos[1],-wpos[2]], -speed);
    var wpos = [120*size, 100*size, 112*size];

    var position = [0,0,0];

    if(n==0) position = [wpos[0],wpos[1],wpos[2]]
    if(n==1) position = [wpos[0],wpos[1],-wpos[2]]
    if(n==2) position = [-wpos[0],wpos[1],wpos[2]]
    if(n==3) position = [-wpos[0],wpos[1],-wpos[2]]

    if(n==0 || n==3){ ext='L'; wSpeed*=-1; }
    else ext='R';

    add({ 
        name:'axe'+n,
        type:'mesh', 
        //material:'tmp1',
        geometry:geo['meca_wheel_'+ext],
        shape:geo['meca_wheel_shape'],
        mass:10,
        size:[size],
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
            mass:2,
            //friction:0.9,
            size:[size],
            rot:axe,
            state:4,
            pos:[x+ position[0], y+ position[1], z],
            margin:0.01,
            group:buggyGroup, 
            mask:buggyMask, 
        })

        add({
            name:'j'+i,
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

    add({
        name:'jh'+n,
        type:'joint_hinge',
        //body1:'chassis',
        body1:link,
        body2:'axe'+n,
        pos1:[ 0, 0, pz],//position,//[position[0], position[1], position[2]],
        pos2:[ 0, 0, 0],
        axe1:[0,0,1],
        axe2:[0,0,1],
        motor:[true, wSpeed, 100],
    })


}