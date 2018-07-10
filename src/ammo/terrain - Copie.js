
var tmpData = {};
var terrainData = {};
var terrainList = [];
var terrainNeedUpdate = false;

//--------------------------------------------------
//
//  AMMO TERRAIN
//
//--------------------------------------------------

function terrainPostStep ( o ){

    var name = o.name;
    terrainList.push( name );
    tmpData[ name ] = o.heightData;
    terrainNeedUpdate = true;

}

function terrainUpdate ( o ){

    if( terrainNeedUpdate ){
        while( terrainList.length ) terrain_data( terrainList.pop() );
        terrainNeedUpdate = false;
    }

}

/*function updateTerrain ( o ) {

        this.byName[ o.name ].setHeightData( o.heightData );

}*/

function addTerrain ( o ) {

    // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
    var upAxis = 1;

    o.name = o.name == undefined ? 'terrain' : o.name;
    o.size = o.size == undefined ? [1,1,1] : o.size;
    o.sample = o.sample == undefined ? [64,64] : o.sample;
    o.pos = o.pos == undefined ? [0,0,0] : o.pos;
    o.quat = o.quat == undefined ? [0,0,0,1] : o.quat;
    o.mass = o.mass == undefined ? 0 : o.mass;

    // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
    var hdt = o.hdt || "PHY_FLOAT";

    // Set this to your needs (inverts the triangles)
    var flipEdge =  o.flipEdge !== undefined ? o.flipEdge : true;

    // Creates height data buffer in Ammo heap
    //terrainData = Ammo._malloc( 4 * lng );
    //hdata = o.hdata;

    tmpData[o.name] = o.heightData;

    terrain_data( o.name );

    

    var shape = new Ammo.btHeightfieldTerrainShape( o.sample[0], o.sample[1], terrainData[o.name], o.heightScale || 1, -o.size[1], o.size[1], upAxis, hdt, flipEdge ); 

    tmpPos2.setValue( o.size[0]/o.sample[0], 1, o.size[2]/o.sample[1] );
    shape.setLocalScaling( tmpPos2 );

    if( o.margin !== undefined && shape.setMargin !== undefined ) shape.setMargin( o.margin );

    tmpPos.fromArray(o.pos);
    tmpQuat.fromArray(o.quat);

    tmpTrans.setIdentity();
    tmpTrans.setOrigin( tmpPos );
    tmpTrans.setRotation( tmpQuat );

    tmpPos1.setValue( 0,0,0 );
    //shape.calculateLocalInertia( o.mass, tmpPos1 );
    var motionState = new Ammo.btDefaultMotionState( tmpTrans );

    var rbInfo = new Ammo.btRigidBodyConstructionInfo( o.mass, motionState, shape, tmpPos1 );
    o.friction = o.friction == undefined ? 0.5 : o.friction;
    o.restitution = o.restitution == undefined ? 0 : o.restitution;
    rbInfo.set_m_friction( o.friction || 0.5 );
    rbInfo.set_m_restitution( o.restitution || 0 );
    var body = new Ammo.btRigidBody( rbInfo );


    body.setCollisionFlags(o.flag || 1);
    world.addCollisionObject( body, o.group || 1, o.mask || -1 );

    solids.push( body );

    Ammo.destroy( rbInfo );

    o = null;

}


function terrain_data ( name ){

    var d = tmpData[ name ];
    var i = d.length, n;
    // Creates height data buffer in Ammo heap
    if( terrainData[name] === null ) terrainData[name] = Ammo._malloc( 4 * i );
    // Copy the javascript height data array to the Ammo one.
    
    while(i--){
        n = i * 4;
        Ammo.HEAPF32[ terrainData[name] + n >> 2 ] = d[i];
    }

    //self.postMessage({ m:'terrain', o:{ name:name } });

};