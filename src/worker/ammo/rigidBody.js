
//--------------------------------------------------
//
//  AMMO RIGIDBODY
//
//--------------------------------------------------

function stepRigidBody( AR, N ) {

    //if( !bodys.length ) return;

    bodys.forEach( function ( b, id ) {

        var n = N + (id * 8);
        AR[n] = b.getLinearVelocity().length() * 9.8;//b.isActive() ? 1 : 0;

        if ( AR[n] > 0 ) {

            b.getMotionState().getWorldTransform( trans );
            
            trans.toArray( AR, n + 1 );

            //trans.getOrigin().toArray( Br , n + 1 );
            //trans.getRotation().toArray( Br ,n + 4 );

        }

    });

};

function clearRigidBody () {

    var b;
    
    while( bodys.length > 0 ){

        b = bodys.pop();
        world.removeRigidBody( b );
        Ammo.destroy( b );

    }

    while( solids.length > 0 ){

        b = solids.pop();
        //world.removeRigidBody( b );
        world.removeCollisionObject( b );
        Ammo.destroy( b );

    }

    bodys = [];
    solids = [];

};

function addRigidBody ( o, extra ) {

    o.mass = o.mass == undefined ? 0 : o.mass;
    o.size = o.size == undefined ? [1,1,1] : o.size;
    o.pos = o.pos == undefined ? [0,0,0] : o.pos;
    o.quat = o.quat == undefined ? [0,0,0,1] : o.quat;

    var shape = null;
    switch( o.type ){

        case 'plane': 
            tmpPos4.fromArray( o.dir || [0,1,0] ); 
            shape = new Ammo.btStaticPlaneShape( tmpPos4, 0 );
        break;

        case 'box': 
            tmpPos4.setValue( o.size[0]*0.5, o.size[1]*0.5, o.size[2]*0.5 );  
            shape = new Ammo.btBoxShape( tmpPos4 );
        break;

        case 'sphere': 
            shape = new Ammo.btSphereShape( o.size[0] ); 
        break;  

        case 'cylinder': 
            tmpPos4.setValue( o.size[0], o.size[1]*0.5, o.size[2]*0.5 );
            shape = new Ammo.btCylinderShape( tmpPos4 );
        break;

        case 'cone': 
            shape = new Ammo.btConeShape( o.size[0], o.size[1]*0.5 );
        break;

        case 'capsule': 
            shape = new Ammo.btCapsuleShape( o.size[0], o.size[1]*0.5 ); 
        break;
        
        case 'compound': 
            shape = new Ammo.btCompoundShape(); 
        break;

        case 'mesh':
            var mTriMesh = new Ammo.btTriangleMesh();
            var removeDuplicateVertices = true;
            var vx = o.v;
            for (var i = 0, fMax = vx.length; i < fMax; i+=9){
                tmpPos1.setValue( vx[i+0]*o.size[0], vx[i+1]*o.size[1], vx[i+2]*o.size[2] );
                tmpPos2.setValue( vx[i+3]*o.size[0], vx[i+4]*o.size[1], vx[i+5]*o.size[2] );
                tmpPos3.setValue( vx[i+6]*o.size[0], vx[i+7]*o.size[1], vx[i+8]*o.size[2] );
                mTriMesh.addTriangle( tmpPos1, tmpPos2, tmpPos3, removeDuplicateVertices );
            }
            if(o.mass == 0){ 
                // btScaledBvhTriangleMeshShape -- if scaled instances
                shape = new Ammo.btBvhTriangleMeshShape( mTriMesh, true, true );
            }else{ 
                // btGimpactTriangleMeshShape -- complex?
                // btConvexHullShape -- possibly better?
                shape = new Ammo.btConvexTriangleMeshShape( mTriMesh, true );
            }
        break;

        case 'convex':
            shape = new Ammo.btConvexHullShape();
            var vx = o.v;
            for (var i = 0, fMax = vx.length; i < fMax; i+=3){
                vx[i]*=o.size[0];
                vx[i+1]*=o.size[1];
                vx[i+2]*=o.size[2];

                tmpPos1.fromArray( vx , i );
                shape.addPoint( tmpPos1 );
            };
        break;
    }

    if(o.margin !== undefined && shape.setMargin !== undefined ) shape.setMargin( o.margin );

    if( extra == 'isShape' ) return shape;
    
    if( extra == 'isGhost' ){ 
        var ghost = new Ammo.btGhostObject();
        ghost.setCollisionShape( shape );
        return ghost;
    }

    tmpPos.fromArray( o.pos );
    tmpQuat.fromArray( o.quat );

    tmpTrans.setIdentity();
    tmpTrans.setOrigin( tmpPos );
    tmpTrans.setRotation( tmpQuat );

    tmpPos1.setValue( 0,0,0 );
    shape.calculateLocalInertia( o.mass, tmpPos1 );
    var motionState = new Ammo.btDefaultMotionState( tmpTrans );

    var rbInfo = new Ammo.btRigidBodyConstructionInfo( o.mass, motionState, shape, tmpPos1 );
    o.friction = o.friction == undefined ? 0.5 : o.friction;
    o.restitution = o.restitution == undefined ? 0 : o.restitution;
    rbInfo.set_m_friction( o.friction || 0.5 );
    rbInfo.set_m_restitution( o.restitution || 0 );
    var body = new Ammo.btRigidBody( rbInfo );


    if ( o.mass !== 0 ){
        body.setCollisionFlags( o.flag || 0 );
        world.addRigidBody( body, o.group || 1, o.mask || -1 );


        /*var n = bodys.length;
        tmpPos.toArray( Br, n + 1 );
        tmpQuat.toArray( Br, n + 4 );*/

        //body.activate();
        /*
        AMMO.ACTIVE = 1;
        AMMO.ISLAND_SLEEPING = 2;
        AMMO.WANTS_DEACTIVATION = 3;
        AMMO.DISABLE_DEACTIVATION = 4;
        AMMO.DISABLE_SIMULATION = 5;
        */
        body.setActivationState( o.state || 1 );
    } else {
        body.setCollisionFlags(o.flag || 1); 
        world.addCollisionObject( body, o.group || 1, o.mask || -1 );
    }
    
    if( o.name ) byName[ o.name ] = body;
    else if ( o.mass !== 0 ) byName[ bodys.length ] = body;

    if ( o.mass !== 0 ) bodys.push( body );
    else solids.push( body );


    //console.log(body)

    //Ammo.destroy( startTransform );
    //Ammo.destroy( localInertia );
    Ammo.destroy( rbInfo );

    o = null;

};