
//--------------------------------------------------
//
//  AMMO CONSTRAINT JOINT
//
//--------------------------------------------------

function clearJoint (){

    var j;

    while( joints.length > 0 ){

        j = joints.pop();
        world.removeConstraint( j );
        Ammo.destroy( j );

    }

    joints = [];

};


function addJoint ( o ) {

    var noAllowCollision = true;
    var collision = o.collision || false;
    if(collision) noAllowCollision = false;

    var body1 = getByName(o.body1);
    var body2 = getByName(o.body2);

    tmpPos1.fromArray( o.pos1 || [0,0,0] );
    tmpPos2.fromArray( o.pos2 || [0,0,0] );
    tmpPos3.fromArray( o.axe1 || [1,0,0] );
    tmpPos4.fromArray( o.axe2 || [1,0,0] );

    
    if(o.type !== "joint_p2p" && o.type !== "joint_hinge" && o.type !== "joint" ){

        
        /* 
        // test force local
        var tmpA = new Ammo.btTransform();
        tmpA.setIdentity();
        tmpA.setOrigin( point1 );
        if(o.quatA) tmpA.setRotation( q4( o.quatA ) )

        var frameInA = multiplyTransforms( body1.getWorldTransform(), tmpA );

        var tmpB = new Ammo.btTransform();
        tmpB.setIdentity();
        tmpB.setOrigin( point2 );
        if(o.quatB) tmpB.setRotation( q4( o.quatB ) )

        var frameInB = multiplyTransforms( body2.getWorldTransform(), tmpB );
        */

        // frame A

        tmpTrans1.setIdentity();
        tmpTrans1.setOrigin( tmpPos1 );
        if( o.quatA ){
            tmpQuat.fromArray( o.quatA ); 
            tmpTrans1.setRotation( tmpQuat );
        }
        
        // frame B

        tmpTrans2.setIdentity();
        tmpTrans2.setOrigin( tmpPos2 );
        if( o.quatB ){ 
            tmpQuat.fromArray( o.quatB );
            tmpTrans2.setRotation( tmpQuat );
        }

    }

    // use fixed frame A for linear llimits
    var useA =  o.useA !== undefined ? o.useA : true;

    var joint = null;

    switch(o.type){
        case "joint_p2p": 
            joint = new Ammo.btPoint2PointConstraint( body1, body2, tmpPos1, tmpPos2 );
            if(o.strength) joint.get_m_setting().set_m_tau( o.strength );
            if(o.damping) joint.get_m_setting().set_m_damping( o.damping ); 
            if(o.impulse) joint.get_m_setting().set_m_impulseClamp( o.impulse );
        break;
        case "joint_hinge": case "joint": joint = new Ammo.btHingeConstraint( body1, body2, tmpPos1, tmpPos2, tmpPos3, tmpPos4, useA ); break;
        case "joint_slider": joint = new Ammo.btSliderConstraint( body1, body2, tmpTrans1, tmpTrans2, useA ); break;
        case "joint_conetwist": joint = new Ammo.btConeTwistConstraint( body1, body2, tmpTrans1, tmpTrans2 ); break;
        case "joint_dof": joint = new Ammo.btGeneric6DofConstraint( body1, body2, tmpTrans1, tmpTrans2, useA );  break;
        case "joint_spring_dof": joint = new Ammo.btGeneric6DofSpringConstraint( body1, body2, tmpTrans1, tmpTrans2, useA ); break;
        //case "joint_gear": joint = new Ammo.btGearConstraint( body1, body2, point1, point2, o.ratio || 1); break;
    }

    // EXTRA SETTING

    if(o.breaking) joint.setBreakingImpulseThreshold(o.breaking);

    // hinge

    // limite min, limite max, softness, bias, relaxation
    if(o.limit) joint.setLimit( o.limit[0]*torad, o.limit[1]*torad, o.limit[2] || 0.9, o.limit[3] || 0.3, o.limit[4] || 0.1);
    if(o.motor) joint.enableAngularMotor( o.motor[0], o.motor[1], o.motor[2] );


    // slider & dof

    if(o.linLower){ tmpPos.fromArray(o.linLower); joint.setLinearLowerLimit( tmpPos ); }
    if(o.linUpper){ tmpPos.fromArray(o.linUpper); joint.setLinearUpperLimit( tmpPos ); }
    
    if(o.angLower){ tmpPos.fromArray(o.angLower); joint.setAngularLowerLimit( tmpPos ); }
    if(o.angUpper){ tmpPos.fromArray(o.angUpper); joint.setAngularUpperLimit( tmpPos ); }

    // spring dof

    if(o.feedback) joint.enableFeedback( o.feedback );
    if(o.enableSpring) joint.enableSpring( o.enableSpring[0], o.enableSpring[1] );
    if(o.damping) joint.setDamping( o.damping[0], o.damping[1] );
    if(o.stiffness) joint.setStiffness( o.stiffness[0], o.stiffness[1] );


    // console.log(joint);

    world.addConstraint( joint, noAllowCollision );

    if(o.name) byName[o.name] = joint;

    joints.push( joint );

    o = null;

};
