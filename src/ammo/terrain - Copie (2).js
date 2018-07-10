
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

function addTerrain ( o ) {

    var name = o.name === undefined ? 'terrain' : o.name;
    var size = o.size === undefined ? [1,1,1] : o.size;
    var sample = o.sample === undefined ? [64,64] : o.sample;
    var pos = o.pos === undefined ? [0,0,0] : o.pos;
    var quat = o.quat === undefined ? [0,0,0,1] : o.quat;

    var mass = o.mass === undefined ? 0 : o.mass;
    var margin = o.margin === undefined ? 0.02 : o.margin;
    var friction = o.friction === undefined ? 0.5 : o.friction;
    var restitution = o.restitution === undefined ? 0 : o.restitution;

    var flag = o.flag === undefined ? 1 : o.flag;
    var group = o.group === undefined ? 1 : o.group;
    var mask = o.mask === undefined ? -1 : o.mask;

    // This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
    var heightScale =  o.heightScale === undefined ? 1 : o.heightScale;

    // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
    var upAxis =  o.upAxis === undefined ? 1 : o.upAxis;

    // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
    var hdt = o.hdt || "PHY_FLOAT";

    // Set this to your needs (inverts the triangles)
    var flipEdge =  o.flipEdge !== undefined ? o.flipEdge : false;

    // Creates height data buffer in Ammo heap
    tmpData[name] = o.heightData;
    terrain_data( name );

    //var shape = new Ammo.btHeightfieldTerrainShape( sample[0], sample[1], terrainData[name], heightScale, -size[1], size[1], upAxis, hdt, flipEdge );
    var shape = new Ammo.btHeightfieldTerrainShape( sample[0], sample[1], terrainData[name], heightScale, -size[1], size[1], upAxis, hdt, flipEdge );

    //console.log(shape.getMargin())

    tmpPos2.setValue( size[0]/sample[0], 1, size[2]/sample[1] );
    shape.setLocalScaling( tmpPos2 );

    shape.setMargin( margin );

    tmpPos.fromArray( pos );
    tmpQuat.fromArray( quat );

    tmpTrans.setIdentity();
    tmpTrans.setOrigin( tmpPos );
    tmpTrans.setRotation( tmpQuat );

    tmpPos1.setValue( 0,0,0 );
    //shape.calculateLocalInertia( mass, tmpPos1 );
    var motionState = new Ammo.btDefaultMotionState( tmpTrans );

    var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, tmpPos1 );

    rbInfo.set_m_friction( friction );
    rbInfo.set_m_restitution( restitution );

    var body = new Ammo.btRigidBody( rbInfo );
    body.setCollisionFlags( flag );
    world.addCollisionObject( body, group, mask );

    solids.push( body );

    Ammo.destroy( rbInfo );

    o = null;

}

function terrain_data ( name ){

    var d = tmpData[name];
    terrainData[name] = Malloc_Float( d, terrainData[name] );

    /*
    var i = d.length, n;
    // Creates height data buffer in Ammo heap
    if( terrainData[name] == null ) terrainData[name] = Ammo._malloc( 4 * i );
    // Copy the javascript height data array to the Ammo one.

    while(i--){
        n = (i * 4);
        Ammo.HEAPF32[ terrainData[name] + n >> 2 ] = d[i];
    }
    */

    self.postMessage({ m:'terrain', o:{ name:name } });

};



function Malloc_Float( f, q ) {

    var nDataBytes = f.length * f.BYTES_PER_ELEMENT;
    if( q === undefined ) q = Ammo._malloc( nDataBytes );
    var dataHeap = new Uint8Array( Ammo.HEAPU8.buffer, q, nDataBytes );
    dataHeap.set( new Uint8Array( f.buffer ) );
    return q;

}