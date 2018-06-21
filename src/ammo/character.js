/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*    AMMO CHARACTER
*/

function addCharacter ( o ) {

    var c = new Character( o );
    heros.push( c );

};

function move ( id ) {

    id = id || 0;
    if( !heros[id] ) return;

    heros[id].move();

}

function stepCharacter( N ) {

    heros.forEach( function ( hero, id ) {

        var n = N + (id * 8);
        hero.step( n );

    });

};

function clearCharacter() {

    while( heros.length > 0) heros.pop().clear();
    heros = [];

}

function setHeroRotation( id, angle ){

    id = id || 0;
    if( !heros[id] ) return;
    heros[id].setRotation( angle );

};


//--------------------------------------------------
//
//  CHARACTER CLASS
//
//--------------------------------------------------


function Character ( o ) {

    this.body = null;
    this.hero = null;

    this.angle = 0;
    this.speed = 0;
    this.wasJumping = false;
    this.verticalVelocity = 0;
    this.angleInc = 

    this.init( o );

}

Character.prototype = {

    step: function ( n ){

        Ar[n] = this.speed;
        //Hr[n] = b.onGround ? 1 : 0;

        var t = this.body.getWorldTransform();
        pos = t.getOrigin();
        quat = t.getRotation();

        Ar[n+1] = pos.x();
        Ar[n+2] = pos.y();
        Ar[n+3] = pos.z();

        Ar[n+4] = quat.x();
        Ar[n+5] = quat.y();
        Ar[n+6] = quat.z();
        Ar[n+7] = quat.w();

    },

    move: function (){

        var hero = this.hero;

        //btScalar walkVelocity = btScalar(1.1) * 4.0; // 4 km/h -> 1.1 m/s
        //btScalar walkSpeed = walkVelocity * dt;

        var walkSpeed = 0.3;
        var angleInc = 0.1;

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
            this.wasJumping = true;
            this.verticalVelocity = 0;
            
            //hero.jump();

            //y = transW.getOrigin().y()



            //y+=10;

            
        } //console.log(hero.jump())
        //console.log(h.onGround())

        if( this.wasJumping ){
            this.verticalVelocity += 0.04;
           // y = hero.verticalVelocity;
            if(this.verticalVelocity > 1.3) {
                this.verticalVelocity = 0
                this.wasJumping = false;
            }
        }

      //  if( hero.onGround() ){
            z = walkSpeed * -key[1];
            x = walkSpeed * -key[0];
        

        


        this.speed = z + x;

        // rotation

        this.angle -= key[2] * angleInc;

        this.setRotation( this.angle );

       // var angle = hero.rotation;//key[8]; //heros[id].rotation

        // change rotation
       // quatW.setFromAxisAngle( [0,1,0], angle );
        //hero.getGhostObject().getWorldTransform().setRotation( quatW );
       // transW.setRotation( quatW );

        // walkDirection
        posW.setValue( x, y+this.verticalVelocity, z );
        posW.direction( quatW );

        hero.setWalkDirection( posW );
    //}

       // heros[id].preStep ( world );
       //heros[id].setVelocityForTimeInterval(vec3(), 1);
    },

    clear: function (){

        world.removeCollisionObject( this.body );
        world.removeAction( this.hero );

        Ammo.destroy( this.body );
        Ammo.destroy( this.hero );

        this.body = null;
        this.hero = null;

    },

    init: function ( o ){

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
        hero.setUseGhostSweepTest( shape );

       // hero.getGhostObject().getWorldTransform().setRotation(q4( o.quat ));

        hero.setGravity( gravity );
        hero.setFallSpeed( 30 );
        //hero.setUpAxis(1);
        hero.setMaxJumpHeight( 200 );
        hero.setJumpSpeed( 1000 )
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

        this.body = body;
        this.hero = hero; 

       // world.getPairCache().setInternalGhostPairCallback( new Ammo.btGhostPairCallback() );

    },

    setRotation: function ( angle ){

        var t = this.body.getWorldTransform();
        quatW.setFromAxisAngle( [0,1,0], angle );
        t.setRotation( quatW );
        this.angle = angle;

    }

}





/*

function contactHero () {


};
*/

