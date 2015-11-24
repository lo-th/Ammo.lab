function demo () {

    cam ( 90, 10, 10 );

    // infinie plane
    add({type:'plane', group:1});

    for(var i = 0; i<20; i++){

        ragdoll(i, 0, 2+(1.5*i), 0 );

    }
};

function ragdoll (id, x, y, z) {

    var mass = 0.2;
    var collision = true;
    var p = {x:x, y:y, z:z};
    var spring = [2, 0.3, 0.1]; // softness, bias, relaxation
    var type = 'box';

    // joint is default joint_hinge
    // joint can be :
    // joint_hinge, joint_p2p, joint_slider, joint_conetwist, joint_gear, joint_dof

    // body

    add({type:type, size:[0.2,0.1,0.15], pos:[p.x,p.y-0.2,p.z], mass:mass,  name:'pelvis'+id });
    add({type:type, size:[0.2,0.1,0.15], pos:[p.x,p.y-0.1,p.z], mass:mass,  name:'spine1_'+id });
    add({type:type, size:[0.2,0.1,0.15], pos:[p.x,p.y,p.z], mass:mass, name:'spine2_'+id, noSleep:true });
    add({type:type, size:[0.2,0.1,0.15], pos:[p.x,p.y+0.1,p.z], mass:mass,  name:'spine3_'+id });
    add({type:"sphere", size:[0.1,0.1,0.1], pos:[p.x,p.y+0.3,p.z], mass:mass,  name:'head'+id });

    add({type:"joint", body1:'pelvis'+id, body2:'spine1_'+id, pos1:[0,0.05,0], pos2:[0,-0.05,0], min:2, max:20, collision:collision, spring:spring });
    add({type:"joint", body1:'spine1_'+id, body2:'spine2_'+id, pos1:[0,0.05,0], pos2:[0,-0.05,0], min:2, max:20, collision:collision, spring:spring });
    add({type:"joint", body1:'spine2_'+id, body2:'spine3_'+id, pos1:[0,0.05,0], pos2:[0,-0.05,0], min:2, max:20, collision:collision, spring:spring });
    add({type:"joint", body1:'spine3_'+id, body2:'head'+id,   pos1:[0,0.05,0], pos2:[0,-0.1,0], min:2, max:20, collision:collision, spring:spring });

    //arm

    add({type:type, size:[0.2,0.1,0.1], pos:[p.x-0.2,p.y+0.08,p.z], rot:[0,0,20], mass:mass,  name:'L_arm'+id });
    add({type:type, size:[0.2,0.08,0.08], pos:[p.x-0.4,p.y,p.z], rot:[0,0,20], mass:mass,  name:'LF_arm'+id });

    add({type:type, size:[0.2,0.1,0.1], pos:[p.x+0.2,p.y+0.08,p.z], rot:[0,0,-20], mass:mass,  name:'R_arm'+id });
    add({type:type, size:[0.2,0.08,0.08], pos:[p.x+0.4,p.y,p.z], rot:[0,0,-20], mass:mass,  name:'RF_arm'+id });

    add({type:"joint", body1:'spine3_'+id, body2:'L_arm'+id, pos1:[-0.1,0,0], pos2:[0.1,0,0], axe1:[0,1,1], axe2:[0,1,1], collision:collision});
    add({type:"joint", body1:'spine3_'+id, body2:'R_arm'+id, pos1:[0.1,0,0], pos2:[-0.1,0,0], axe1:[0,1,1], axe2:[0,1,1], collision:collision});

    add({type:"joint", body1:'L_arm'+id, body2:'LF_arm'+id, pos1:[-0.1,0,0], pos2:[0.1,0,0], axe1:[0,1,0], axe2:[0,1,0], collision:collision});
    add({type:"joint", body1:'R_arm'+id, body2:'RF_arm'+id, pos1:[0.1,0,0], pos2:[-0.1,0,0], axe1:[0,1,0], axe2:[0,1,0], collision:collision});

    // leg

    add({type:type, size:[0.1,0.2,0.1], pos:[p.x-0.06,p.y-0.4,p.z], rot:[0,0,-20], mass:mass, name:'L_leg'+id });
    add({type:type, size:[0.08,0.2,0.08], pos:[p.x-0.15,p.y-0.7,p.z], rot:[0,0,-20], mass:mass, name:'LF_leg'+id });

    add({type:type, size:[0.1,0.2,0.1], pos:[p.x+0.06,p.y-0.4,p.z], rot:[0,0,20], mass:mass, name:'R_leg'+id });
    add({type:type, size:[0.08,0.2,0.08], pos:[p.x+0.15,p.y-0.7,p.z], rot:[0,0,20], mass:mass, name:'RF_leg'+id });

    add({type:"joint", body1:'pelvis'+id, body2:'L_leg'+id, pos1:[-0.06,-0.05,0], pos2:[0,0.1,0], min:2, max:60, collision:collision }); 
    add({type:"joint", body1:'pelvis'+id, body2:'R_leg'+id, pos1:[0.06,-0.05,0], pos2:[0,0.1,0], min:2, max:60, collision:collision });

    add({type:"joint", body1:'L_leg'+id, body2:'LF_leg'+id, pos1:[0,-0.1,0], pos2:[0,0.1,0], axe1:[1,0,0], axe2:[1,0,0], min:2, max:60, collision:collision});
    add({type:"joint", body1:'R_leg'+id, body2:'RF_leg'+id, pos1:[0,-0.1,0], pos2:[0,0.1,0], axe1:[1,0,0], axe2:[1,0,0], min:2, max:60, collision:collision});

};