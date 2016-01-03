function demo() {

    cam ( -90, 20, 30 );
    load ( 'meca', afterLoad );

   
    
};

function afterLoad () {

    ammo.send('gravity', {g:[0,-10,0]});

    // infinie plane
    add({type:'plane'});

    var size = 0.05;
    var wheelRadius = 50*size;

    // body

    add({ 
        name:'body',
        type:'box', 
        //material:'tmp1',
        //geometry:view.getGeo()['base_frame'],
        //shape:view.getGeo()['base_frame_S'],
        mass:20,
        size:[16, 2, 7],
        pos:[0, wheelRadius, 0],
        state:4,
    })

    // wheels

    
    var wpos = [7, wheelRadius, 5];

    wheel( size, 0, 'L', [wpos[0],wpos[1],wpos[2]], -4);
    wheel( size, 1, 'R', [wpos[0],wpos[1],-wpos[2]], 4);
    wheel( size, 2, 'R', [-wpos[0],wpos[1],wpos[2]], 4);
    wheel( size, 3, 'L', [-wpos[0],wpos[1],-wpos[2]], -4);

}

function wheel ( s, n, side, position, speed ) {

    add({ 
        name:'axe'+n,
        type:'mesh', 
        //material:'tmp1',
        geometry:view.getGeo()['meca_wheel_'+side],
        shape:view.getGeo()['meca_wheel_shape'],
        mass:1,
        size:[s],
        pos:position,
        state:4,
    });

    var radius = 39*s;
    var i = 8, angle, y, x, z;
    var axis = [];
    var axe = [];

    while(i--){
        angle = -(45*i)*Math.degtorad;
        x = (radius * Math.cos(angle));
        y = (radius * Math.sin(angle));
        z = position[2];

        if(side=='R'){
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
            name:n+'_r_'+i,
            type:'mesh',
            geometry:view.getGeo()['meca_roller'],
            shape:view.getGeo()['meca_roller_shape'],
            mass:1,
            friction:0.9,
            size:[s],
            rot:axe,
            state:4,
            pos:[x+ position[0], y+ position[1], z],
            margin:0.01,
        })

        add({
            name:'j'+i,
            type:'joint_hinge',
            body1:'axe'+n,
            body2:n+'_r_'+i,
            pos1:[ x, y, 0],
            pos2:[ 0, 0, 0],
            axe1: axis,
            axe2:[0,0,1],

            //motor:[true, -speed, 100],
        })

    }

    add({
        name:'j'+n,
        type:'joint_hinge',
        body1:'body',
        body2:'axe'+n,
        pos1:[position[0], 0, position[2]],
        pos2:[ 0, 0, 0],
        axe1:[0,0,1],
        axe2:[0,0,1],
        motor:[true, speed, 100],
    })


}