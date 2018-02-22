
//--------------------------------------------------
//
//  AMMO CONSTRAINT JOINT
//
//--------------------------------------------------


/*Ammo.btTypedConstraint.prototype.getA = function( v ){

    return 1

};*/

function stepConstraint ( AR, N ) {

    //if( !joints.length ) return;

    joints.forEach( function ( b, id ) {

        var n = N + (id * 4);

        if( b.type ){

            AR[ n ] = b.type;

        }
        

        

            /*b.getMotionState().getWorldTransform( trans );
            pos = trans.getOrigin();
            quat = trans.getRotation();

            Br[n+1] = pos.x();
            Br[n+2] = pos.y();
            Br[n+3] = pos.z();

            Br[n+4] = quat.x();
            Br[n+5] = quat.y();
            Br[n+6] = quat.z();
            Br[n+7] = quat.w();
            */

        

    });

};

function clearJoint () {

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
    if( collision ) noAllowCollision = false;

    if(o.body1) o.b1 = o.body1;
    if(o.body2) o.b2 = o.body2;

    var b1 = getByName( o.b1 );
    var b2 = getByName( o.b2 );

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

        var frameInA = multiplyTransforms( b1.getWorldTransform(), tmpA );

        var tmpB = new Ammo.btTransform();
        tmpB.setIdentity();
        tmpB.setOrigin( point2 );
        if(o.quatB) tmpB.setRotation( q4( o.quatB ) )

        var frameInB = multiplyTransforms( b2.getWorldTransform(), tmpB );
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
    var t = 0;

    switch(o.type){
        case "joint_p2p":
            t = 1;
            joint = new Ammo.btPoint2PointConstraint( b1, b2, tmpPos1, tmpPos2 );
            if(o.strength) joint.get_m_setting().set_m_tau( o.strength );
            if(o.damping) joint.get_m_setting().set_m_damping( o.damping ); 
            if(o.impulse) joint.get_m_setting().set_m_impulseClamp( o.impulse );
        break;
        case "joint_hinge": case "joint": t = 2; joint = new Ammo.btHingeConstraint( b1, b2, tmpPos1, tmpPos2, tmpPos3, tmpPos4, useA ); break;
        case "joint_slider": t = 3; joint = new Ammo.btSliderConstraint( b1, b2, tmpTrans1, tmpTrans2, useA ); break;
        case "joint_conetwist": t = 4; joint = new Ammo.btConeTwistConstraint( b1, b2, tmpTrans1, tmpTrans2 ); break;
        case "joint_dof": t = 5; joint = new Ammo.btGeneric6DofConstraint( b1, b2, tmpTrans1, tmpTrans2, useA );  break;
        case "joint_spring_dof": t = 6; joint = new Ammo.btGeneric6DofSpringConstraint( b1, b2, tmpTrans1, tmpTrans2, useA ); break;
        //case "joint_gear": joint = new Ammo.btGearConstraint( b1, b2, point1, point2, o.ratio || 1); break;
    }

    // EXTRA SETTING

    if(o.breaking) joint.setBreakingImpulseThreshold( o.breaking );

    // hinge

    // limite min, limite max, softness, bias, relaxation
    if(o.limit){ 
        if(o.type === 'joint_hinge' || o.type === 'joint' ) joint.setLimit( o.limit[0]*torad, o.limit[1]*torad, o.limit[2] || 0.9, o.limit[3] || 0.3, o.limit[4] || 1.0 );
        else if(o.type === 'joint_conetwist' ) joint.setLimit( o.limit[0]*torad, o.limit[1]*torad, o.limit[2]*torad, o.limit[3] || 0.9, o.limit[4] || 0.3, o.limit[5] || 1.0 );
    }
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

    if(o.angularOnly) joint.setAngularOnly( o.angularOnly );
    if(o.enableMotor) joint.enableMotor( o.enableMotor );
    if(o.maxMotorImpulse) joint.setMaxMotorImpulse( o.maxMotorImpulse );
    if(o.motorTarget) joint.setMotorTarget( tmpQuat.fromArray( o.motorTarget ) );


    // debug test 
    joint.type = 0;
    if( o.debug ){
        joint.type = t
        joint.bodyA = b1;
        joint.bodyB = b2;
    }
    
    world.addConstraint( joint, noAllowCollision );

    if( o.name ) byName[o.name] = joint;

    joints.push( joint );

    //console.log( joint );

    o = null;

};



