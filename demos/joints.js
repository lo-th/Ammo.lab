function demo() {

    cam ( 40, 20, 60, [0,30, 0] );

    // infinie plane
    add({type:'plane'});

    var i, y, b1, b2;

    for ( i = 0; i < 10; i++) {
        y = 30 - (i*2.5);
        if(i===0) add({type:'box', name:'base', mass:0, pos:[0,y,0], size:[2]});
        else add({ type:'box', name:i, mass:0.1, pos:[0,y,0], size:[2]});
    }

    // joint full test

    var quat = new THREE.Quaternion();
    quat.setFromAxisAngle({x: 0, y: 1, z: 0}, Math.PI);

    // DOF
    /*

    for ( i = 1; i < 10; i++) {

        b1 = i === 1 ? 'base': i-1;
        b2 = i;

        add({ 
            type:'joint_spring_dof', body1:b1, body2:b2, 
            pos1:[-1.01,-1.01,-1.01], pos2:[1.01,1.01,1.01], 
            quatA:quat.toArray(), quatB:quat.toArray(), collision:true 
        });

    } 
    */

    // CONE
    
    for ( i = 1; i < 10; i++) {

        b1 = i === 1 ? 'base': i-1;
        b2 = i;

        add({ 
            type:'joint_conetwist', body1:b1, body2:b2, 
            pos1:[0,0,0], pos2:[2.1,0,0], 
            quatA:quat.toArray(), quatB:quat.toArray(), 
            collision:true, angularOnly:true, enableMotor:true, 
            limit:[22, 22, 0],
            maxMotorImpulse:100000000, 
            motorTarget:quat.toArray()  
        });
   
    }
   



    
};