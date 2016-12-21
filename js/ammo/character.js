
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

    var shape = new Ammo.btCapsuleShape( o.size[0], o.size[1]*0.5 );

    var body = new Ammo.btPairCachingGhostObject();
    body.setCollisionShape( shape );
    body.setCollisionFlags( FLAGS.CHARACTER_OBJECT );

    tmpPos.fromArray( o.pos );
    tmpQuat.fromArray( o.quat );
    
    tmpTrans.setIdentity();
    tmpTrans.setOrigin( tmpPos );
    tmpTrans.setRotation( tmpQuat );

    body.setWorldTransform( tmpTrans );
    
    body.setFriction( o.friction || 0.1 );
    body.setRestitution( o.restitution || 0 );

    body.setActivationState( 4 );
    body.activate();

    var hero = new Ammo.btKinematicCharacterController( body, shape, o.stepH || 0.35, o.upAxis || 1 );
    //var hero = new Ammo.btKinematicCharacterController( body, shape, o.stepH || 0.3 )
    hero.setUseGhostSweepTest(shape);

   // hero.getGhostObject().getWorldTransform().setRotation(q4( o.quat ));

    hero.setGravity( gravity );
    hero.setFallSpeed(30);
    //hero.setUpAxis(1);

    hero.rotation = 0;
    hero.speed = 0;
    hero.wasJumping = false;
    hero.verticalVelocity = 0;
    
    hero.setMaxJumpHeight(200);
    hero.setJumpSpeed(1000)
    /*
    
     
    hero.jump();
    */
    //hero.canJump( true );

    //console.log(hero, tmpQuat.w(), tmpQuat )

    // The max slope determines the maximum angle that the controller can walk
    if( o.slopeRadians ) hero.setMaxSlope ( o.slopeRadians );//45

    


    // hero.warp(v3(o.pos));
    
    tmpPos2.setValue( 0, 0, 0 );
    hero.setVelocityForTimeInterval( tmpPos2, 1 );

    world.addCollisionObject( body, o.group || 1, o.mask || -1 );
    world.addAction( hero ); 

    heros.push( hero );

    o = null;

};

function setHeroRotation( id, angle ){

    var t = heros[id].getGhostObject().getWorldTransform();
    quatW.setFromAxisAngle( [0,1,0], angle );
    t.setRotation( quatW );

    heros[id].rotation = angle;

};

function move ( id ) {

    var id = id || 0;
    if( !heros[id] ) return;

    var hero = heros[id];

    //btScalar walkVelocity = btScalar(1.1) * 4.0; // 4 km/h -> 1.1 m/s
    //btScalar walkSpeed = walkVelocity * dt;

    var walkSpeed = 0.3;
    var rotationSpeed = 0.1;

    var x=0,y=0,z=0;

    //transW = hero.getGhostObject().getWorldTransform();

    //console.log(transW.getOrigin().y())

    //y = transW.getOrigin().y();

    //if(key[0] == 1 || key[1] == 1 ) heros[id].speed += 0.1;
    //if(key[0] == 0 && key[1] == 0 ) heros[id].speed -= 0.1;


    //if(heros[id].speed>1) heros[id].speed = 1;
    //if(heros[id].speed<0) heros[id].speed = 0;

    //if( key[1] == -1 ) z=-heros[id].speed * walkSpeed;
    //if( key[1] == 1 ) z=heros[id].speed * walkSpeed;

    //if( key[0] == -1 ) x=-heros[id].speed * walkSpeed;
    //if( key[0] == 1 ) x=heros[id].speed * walkSpeed;

    if( key[4] == 1 && hero.onGround()){//h.canJump() ){ 
        hero.wasJumping = true;
        hero.verticalVelocity = 0;
        
        //hero.jump();

        //y = transW.getOrigin().y()



        //y+=10;

        
    } //console.log(hero.jump())
    //console.log(h.onGround())

    if( hero.wasJumping ){
        hero.verticalVelocity += 0.04;
       // y = hero.verticalVelocity;
        if(hero.verticalVelocity > 1.3) {
            hero.verticalVelocity = 0
            hero.wasJumping = false;
        }
    }

  //  if( hero.onGround() ){
        z = walkSpeed * -key[1];
        x = walkSpeed * -key[0];
    

    


    hero.speed = z+x;

    // rotation

    hero.rotation -= key[2] * rotationSpeed;

    setHeroRotation( id, hero.rotation );

   // var angle = hero.rotation;//key[8]; //heros[id].rotation

    // change rotation
   // quatW.setFromAxisAngle( [0,1,0], angle );
    //hero.getGhostObject().getWorldTransform().setRotation( quatW );
   // transW.setRotation( quatW );

    // walkDirection
    posW.setValue( x, y+hero.verticalVelocity, z );
    posW.direction( quatW );

    hero.setWalkDirection( posW );
//}

   // heros[id].preStep ( world );
   //heros[id].setVelocityForTimeInterval(vec3(), 1);


}
