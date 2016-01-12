
//--------------------------------------------------
//
//  AMMO CHARACTER
//
//--------------------------------------------------

function stepCharacter() {

    if( !heros.length ) return;

    heros.forEach( function ( b, id ) {

        var n = id * 8;
        Hr[n] = b.speed;
        //Hr[n] = b.onGround ? 1 : 0;

        var t = b.getGhostObject().getWorldTransform();
        pos = t.getOrigin();
        quat = t.getRotation();

        Hr[n+1] = pos.x();
        Hr[n+2] = pos.y();
        Hr[n+3] = pos.z();

        Hr[n+4] = quat.x();
        Hr[n+5] = quat.y();
        Hr[n+6] = quat.z();
        Hr[n+7] = quat.w();

    });

};

function clearCharacter() {

    var b;
    while( heros.length > 0){

        b = heros.pop();
        world.removeCollisionObject( b.getGhostObject() );
        Ammo.destroy( b.getGhostObject() );
        world.removeAction( b );
        Ammo.destroy( b );
        
    }

    heros = [];

}

function addCharacter ( o ) {

    o.size = o.size == undefined ? [1,1,1] : o.size;
    o.pos = o.pos == undefined ? [0,0,0] : o.pos;
    o.quat = o.quat == undefined ? [0,0,0,1] : o.quat;

    var shape = new Ammo.btCapsuleShape(o.size[0], o.size[1]*0.5);

    var body = new Ammo.btPairCachingGhostObject();
    body.setCollisionShape(shape);

    tmpPos.fromArray( o.pos );
    tmpQuat.fromArray( o.quat );
    
    tmpTrans.setIdentity();
    tmpTrans.setOrigin( tmpPos );
    tmpTrans.setRotation( tmpQuat );

    body.setWorldTransform( tmpTrans );

    body.setCollisionFlags( FLAGS.CHARACTER_OBJECT );
    
    body.setFriction( o.friction || 0.1 );
    body.setRestitution( o.restitution || 0 );

    body.setActivationState( 4 );
    body.activate();

    var hero = new Ammo.btKinematicCharacterController( body, shape, o.stepH || 0.3, o.upAxis || 1 );
    //var hero = new Ammo.btKinematicCharacterController( body, shape, o.stepH || 0.3 )
    hero.setUseGhostSweepTest(shape);

   // hero.getGhostObject().getWorldTransform().setRotation(q4( o.quat ));

    tmpPos1.setValue( 0, -9.8, 0 );

    hero.setGravity( tmpPos1 );
    hero.setFallSpeed(10);
    hero.setUpAxis(1);

    hero.rotation = 0;
    hero.speed = 0;

    hero.setJumpSpeed(10);
    hero.setMaxJumpHeight(100);
    /*
    
     
    hero.jump();
    */
    //hero.canJump( true );

    console.log(hero)

    // The max slope determines the maximum angle that the controller can walk
    if( o.slopeRadians ) hero.setMaxSlope ( o.slopeRadians );

    


    // hero.warp(v3(o.pos));
    
    tmpPos2.setValue( 0, 0, 0 );
    hero.setVelocityForTimeInterval( tmpPos2, 1 );

    world.addCollisionObject( body, o.group || 1, o.mask || -1 );
    world.addAction( hero ); 

    heros.push( hero );

    o = null;

};

function move ( id ) {

    var id = id || 0;
    if( !heros[id] ) return;

    var h = heros[id];

    var walkSpeed = 0.3;
    var rotationSpeed = 0.1;

    var x=0,y=0,z=0;

    //if(key[0] == 1 || key[1] == 1 ) heros[id].speed += 0.1;
    //if(key[0] == 0 && key[1] == 0 ) heros[id].speed -= 0.1;


    //if(heros[id].speed>1) heros[id].speed = 1;
    //if(heros[id].speed<0) heros[id].speed = 0;

    //if( key[1] == -1 ) z=-heros[id].speed * walkSpeed;
    //if( key[1] == 1 ) z=heros[id].speed * walkSpeed;

    //if( key[0] == -1 ) x=-heros[id].speed * walkSpeed;
    //if( key[0] == 1 ) x=heros[id].speed * walkSpeed;

    if( key[4] && h.onGround() ) h.jump();

    z = walkSpeed * -key[1];
    x = walkSpeed * -key[0];


    h.speed = z+x;

    h.rotation -= key[2] * rotationSpeed;

    var angle = h.rotation;//key[8]; //heros[id].rotation

    // change rotation
    quatW.setFromAxisAngle( [0,1,0], angle );
    h.getGhostObject().getWorldTransform().setRotation( quatW );

    // walkDirection
    posW.setValue( x, y, z );
    posW.direction( quatW );

    h.setWalkDirection( posW );

   // heros[id].preStep ( world );
   //heros[id].setVelocityForTimeInterval(vec3(), 1);


}
