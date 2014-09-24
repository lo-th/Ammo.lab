CLEAR({broadphase:"BVT", timer:false, timestep:1/60, iteration:2, G:-10});

function initDemo()
{
    NAME("Ragdoll");
    // ground
    ADD({type:"ground", size:[100,5,100], pos:[0,-2.5,0]});

    var Max = 20;
    var s = 0.2;
    var collision = true;
    var distribution = 1;
    var l = 0;
    var m = 0;
    var j = 0;
    var px,py,pz;
    var jtype = "hinge";
    var spring = [2, 0.3, 0.1];
        

    while (Max--){
        l++;

        if(distribution===1){
            px = -4.5+(l);
            py = 2;
            pz = -3.5+(m); 
            if(l>7){m++; l=0}
        }else {
            px = 0;
            py = 2 + (Max*1.5);
            pz = 0;
        }

        ADD({type:"box", size:[0.2,0.1,0.15], pos:[px,py-0.2,pz], mass:s, name:'pelvis'+j });
        ADD({type:"box", size:[0.2,0.1,0.15], pos:[px,py-0.1,pz], mass:s, name:'spine1_'+j });
        ADD({type:"box", size:[0.2,0.1,0.15], pos:[px,py,pz], mass:s, name:'spine2_'+j });
        ADD({type:"box", size:[0.2,0.1,0.15], pos:[px,py+0.1,pz], mass:s, name:'spine3_'+j });
        ADD({type:"sphere", size:[0.1], pos:[px,py+0.3,pz], mass:s, name:'head'+j });

        JOINT({type:jtype, body1:'pelvis'+j, body2:'spine1_'+j, pos1:[0,0.05,0], pos2:[0,-0.05,0], min:2, max:20, collision:collision, spring:spring});
        JOINT({type:jtype, body1:'spine1_'+j, body2:'spine2_'+j, pos1:[0,0.05,0], pos2:[0,-0.05,0], min:2, max:20, collision:collision, spring:spring});
        JOINT({type:jtype, body1:'spine2_'+j, body2:'spine3_'+j, pos1:[0,0.05,0], pos2:[0,-0.05,0], min:2, max:20, collision:collision, spring:spring});
        JOINT({type:jtype, body1:'spine3_'+j, body2:'head'+j, pos1:[0,0.05,0], pos2:[0,-0.1,0], min:2, max:20, collision:collision, spring:spring});

        // arm

        ADD({type:"box", size:[0.2,0.1,0.1], pos:[px-0.2,py+0.08,pz], rot:[0,0,20], mass:s, name:'L_arm'+j });
        ADD({type:"box", size:[0.2,0.08,0.08], pos:[px-0.4,py,pz], rot:[0,0,20], mass:s, name:'LF_arm'+j });

        ADD({type:"box", size:[0.2,0.1,0.1], pos:[px+0.2,py+0.08,pz], rot:[0,0,-20], mass:s, name:'R_arm'+j });
        ADD({type:"box", size:[0.2,0.08,0.08], pos:[px+0.4,py,pz], rot:[0,0,-20], mass:s, name:'RF_arm'+j });

        JOINT({type:jtype, body1:'spine3_'+j, body2:'L_arm'+j, pos1:[-0.1,0,0], pos2:[0.1,0,0], axe1:[0,1,1], axe2:[0,1,1], collision:collision});
        JOINT({type:jtype, body1:'spine3_'+j, body2:'R_arm'+j, pos1:[0.1,0,0], pos2:[-0.1,0,0], axe1:[0,1,1], axe2:[0,1,1], collision:collision});

        JOINT({type:jtype, body1:'L_arm'+j, body2:'LF_arm'+j, pos1:[-0.1,0,0], pos2:[0.1,0,0], axe1:[0,1,0], axe2:[0,1,0], collision:collision});
        JOINT({type:jtype, body1:'R_arm'+j, body2:'RF_arm'+j, pos1:[0.1,0,0], pos2:[-0.1,0,0], axe1:[0,1,0], axe2:[0,1,0], collision:collision});

        // leg

        ADD({type:"box", size:[0.1,0.2,0.1], pos:[px-0.06,py-0.4,pz], rot:[0,0,-20], mass:s, name:'L_leg'+j });
        ADD({type:"box", size:[0.08,0.2,0.08], pos:[px-0.15,py-0.7,pz], rot:[0,0,-20], mass:s, name:'LF_leg'+j });

        ADD({type:"box", size:[0.1,0.2,0.1], pos:[px+0.06,py-0.4,pz], rot:[0,0,20], mass:s, name:'R_leg'+j });
        ADD({type:"box", size:[0.08,0.2,0.08], pos:[px+0.15,py-0.7,pz], rot:[0,0,20], mass:s, name:'RF_leg'+j });

        JOINT({type:jtype, body1:'pelvis'+j, body2:'L_leg'+j, pos1:[-0.06,-0.05,0], pos2:[0,0.1,0], min:2, max:60, collision:collision});
        JOINT({type:jtype, body1:'pelvis'+j, body2:'R_leg'+j, pos1:[0.06,-0.05,0], pos2:[0,0.1,0], min:2, max:60, collision:collision});

        JOINT({type:jtype, body1:'L_leg'+j, body2:'LF_leg'+j, pos1:[0,-0.1,0], pos2:[0,0.1,0], axe1:[1,0,0], axe2:[1,0,0], min:2, max:60, collision:collision});
        JOINT({type:jtype, body1:'R_leg'+j, body2:'RF_leg'+j, pos1:[0,-0.1,0], pos2:[0,0.1,0], axe1:[1,0,0], axe2:[1,0,0], min:2, max:60, collision:collision});

        j+=11;
    }
}