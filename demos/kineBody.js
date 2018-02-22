var mixer, bones, skeletonHelper, mid, boneContainer, loaded = false, scale = 0.5;

var matrixWorldInv = new THREE.Matrix4();
var pm = new THREE.Matrix4();
var rm0 = new THREE.Matrix4().makeRotationZ( Math.PI );
var rm1 = new THREE.Matrix4().makeRotationZ( Math.PI*0.5 );
var rm2 = new THREE.Matrix4().makeRotationZ( -Math.PI*0.5 );
var rm3 = new THREE.Matrix4().makeRotationZ( -1*Math.torad );
var rm4 = new THREE.Matrix4().makeRotationZ( 1*Math.torad );
var m = new THREE.Matrix4();
var p = new THREE.Vector3();
var s = new THREE.Vector3();
var q = new THREE.Quaternion();

function demo() {

    cam ( [20, 40, 100, [0,20,0]] );

    set({});

    pool.load( 'assets/bvh/action.z', initAnimation );

    //view.load_bvh( 'action', initAnimation );

};

function initAnimation ( result ){

    var bvhLoader = new THREE.BVHLoader();
    var result = bvhLoader.parse( pool.get('action'));

    var skeleton = result.skeleton;
    bones = skeleton.bones;

    skeletonHelper = new THREE.SkeletonHelper( bones[ 0 ] );
    skeletonHelper.skeleton = skeleton; // allow animation mixer to bind to SkeletonHelper directly

    skeletonHelper.visible = false;

    boneContainer = new THREE.Group();
    boneContainer.add( bones[ 0 ] );
    boneContainer.scale.multiplyScalar( scale );

    view.addMesh( skeletonHelper );
    view.addMesh( boneContainer );

    initSkeleton();

    // play animation
    mixer = new THREE.AnimationMixer( skeletonHelper );
    mixer.clipAction( result.clip ).setEffectiveWeight( 1.0 ).play();

};

function initSkeleton () {

    mid = [];

    var p1 = new THREE.Vector3();
    var p2 = new THREE.Vector3();
    var i, lng = bones.length, name, bone, child, o, d, w, z, type;

    for( i = 0; i<lng; i++ ){

        bone = bones[i];
        name = bone.name;
        if( name==='ENDSITE' ) name = 'ENDSITE'+i



        d = 1;
        p1.copy(bone.getWorldPosition());

        if( i===0 || i===1 || i===2 || i===4 ) w = 3.5;
        else w = 2;


        

        if( bone.children.length > 0 ) child = bone.children[0];
        else child = null;

        if( child !== null ){

            p2.copy( child.getWorldPosition() );
            d = Math.distanceVector( p1, p2 ) * scale;

        }

        if( i===4 ) d*=2;

        mid[i] = d * 0.5;

        

        type = 'box';
        // legs
        /*if(name==='rThigh' || name==='lThigh'){ type = 'capsule';  d+=w*4; w = w*0.75;}
        if(name==='rShin' || name==='lShin'){ type = 'capsule'; w = w*0.65; d+=w*4; }
        // arms
        if(name==='lShldr' || name==='rShldr'){ type = 'capsule'; w = w*0.5; d+=w*4; }
        if(name==='rForeArm' || name==='lForeArm'){ type = 'capsule'; w = w*0.5; d+=w*4; }
        */

        if(name==='rThigh' || name==='lThigh'){ type = 'cylinder';   w = w*0.75;}
        if(name==='rShin' || name==='lShin'){ type = 'cylinder'; w = w*0.65; }
        // arms
        if(name==='lShldr' || name==='rShldr'){ type = 'cylinder'; w = w*0.5;  }
        if(name==='rForeArm' || name==='lForeArm'){ type = 'cylinder'; w = w*0.5;  }

        if(name==='lCollar' || name==='rCollar'){ type = 'sphere'; w*=0.75; d=w; }

        if(name==='neck'){ type = 'cylinder'; w = w*0.5; d*=2 }
        if(name==='head'){ type = 'sphere'; d*=0.85; w=d; }
        if(name==='hip' ){ type = 'sphere'; w*=0.85; d=w; mid[i]-=1; }
        if(name==='chest' ){ type = 'sphere'; d=w; mid[i]-=1; }
        if(name==='abdomen' ){ type = 'sphere'; w*=0.75;  d=w; }

        if(name==='lFoot' || name==='rFoot'){ type = 'sphere'; w*=0.65;  d=w; mid[i]-=0.5; }
        if(name==='lHand' || name==='rHand'){ type = 'sphere'; w*=0.5;  d=w; }

        z = w;

        if(name==='ENDSITE19' || name==='ENDSITE23'){  z*=2;  mid[i]-=0.5;}// TOE
        if(name==='ENDSITE15' || name==='ENDSITE10'){  w*=1.5; mid[i]-=0.7;}// FINGER

        //console.log(i, name)

        o = {
            type:type,
            name:name,
            size:[w,d,z],
            pos:p1.toArray(),
            kinematic: true,
            //density:0.3, 
            material:'kinematic',
            friction:0.2, 
            restitution:0.2
        }

        add( o );

    }

    loaded = true;

    //addHair()
    addExtra();

    // extra loop
    view.update = update;

}

function addHair () {

    var b;
    var spring = [0.1, 0.1];
    var p = bodys[4].position;

    for( i = 0; i < 5; i++){

        b = add({ type:'box', size:[2, 3, 2], pos:[p.x, p.y-(i*4), p.z-3], move:1, density:0.3, restitution:0 });

        if( i===0 ) add({ type:'jointHinge', body1:bodys[4], body2:b.name, pos1:[0,0,-3], pos2:[0,-2,0], axe1:[1,0,0], axe2:[1,0,0], collision:true, spring:spring, min:60, max:90 });
        else add({ type:'jointHinge', body1:b.name-1, body2:b.name, pos1:[0,2,0], pos2:[0,-2,0], axe1:[1,0,0], axe2:[1,0,0], collision:true, spring:spring, min:-10, max:0 });

    }
}

function addExtra () {

    var i = 300, d, w, h, m,  x, z, y;

    w = 60;
    h = 60;
    m = 4;

    // basic box wall
    add({type:'box', size:[w-(2*m), m, w-(2*m)], pos:[0,m*0.5, 0], friction:0.2, restitution:0.2 });
    add({type:'box', size:[m,h,w-(2*m)], pos:[(w*0.5)-(m*0.5),h*0.5,0], friction:0.2, restitution:0.2 });
    add({type:'box', size:[m,h,w-(2*m)], pos:[(-w*0.5)+(m*0.5),h*0.5,0], friction:0.2, restitution:0.2 });
    add({type:'box', size:[w,h,m], pos:[0,h*0.5,(w*0.5)-(m*0.5)], friction:0.2, restitution:0.2 });
    add({type:'box', size:[w,h,m], pos:[0,h*0.5,(-w*0.5)+(m*0.5)], friction:0.2, restitution:0.2 });

    add({type:'box', size:[w-(2*m), m, w-(2*m)], pos:[0,h-(m*0.5), 0], friction:0.2, restitution:0.2 });

   /* add({
        type:[ 'box', 'box', 'box', 'box', 'box' ],
        Rsize:[ [w-(2*m), m, w-(m)], [m,h, w-(2*m)], [m,h, w-(2*m)], [w,h, m], [w,h, m] ],
        Rpos:[ [0,m*0.5, 0], [(w*0.5)-(m*0.5),h*0.5,0], [(-w*0.5)+(m*0.5),h*0.5,0], [0,h*0.5,(w*0.5)-(m*0.5)], [0,h*0.5,(-w*0.5)+(m*0.5)] ],
    });*/
    
    while( i-- ) {

        w = Math.rand(3,6);
        h = Math.rand(3,6);
        d = Math.rand(3,6);
        x = Math.rand(-12,12);
        z = Math.rand(-12,12);
        y = Math.rand(4,30)//(60,100)

        //add( { type:'box', size:[w,h,d], pos:[x,y,z], move:true } );
        add( { type:'sphere', size:[w*0.5], pos:[x,y,z], density:0.3, friction:0.2, restitution:0.2 } );

    }

    //var ground = add({size:[50, 10, 50], pos:[0,-5,0] });
}

function updateSkeleton () {

    var r = [];

    var bodys = view.getBody();

    matrixWorldInv.getInverse( boneContainer.matrixWorld ); 

    var i = bones.length, bone, body, name, dx=0;
    while(i--){

        bone = bones[i];
        name = bone.name;

        if( name==='ENDSITE' ) name = 'ENDSITE'+i
        
        m.identity().multiplyMatrices( bone.matrixWorld, matrixWorldInv );

        dx = 0;

        // adjust rotation
        if(i===0 || i===1 || i===2 || i===3 || i===4 ) m.multiply( rm0 );
        if(i===6 || i===8 || i===7 || i===9 ) m.multiply( rm1 );
        if(i===11 ||i===13 || i===12 || i===14 ) m.multiply( rm2 );
        if(i===20 ){ m.multiply( rm3 ); dx = 1}
        if(i===16 ){ m.multiply( rm4 ); dx = -1}

        // adjuste position
        pm.identity().makeTranslation( dx, -mid[i], 0 );
        m.multiply( pm );

        m.decompose( p, q, s );

        // apply to physics body
        r.push( [ name, p.toArray(), q.toArray() ] );
        //matrix( [ name, p.toArray(), q.toArray() ] );

    }

    matrixArray( r );

}

function update () {

    if ( mixer ) mixer.update( 0.003 );
    if ( loaded ) updateSkeleton();



}