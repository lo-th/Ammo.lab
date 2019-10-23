var dragon_material;

var dragons = [];
var tt =0;
var debug = false;

function demo() {

    view.moveCam({ theta:0, phi:0, distance:25, target:[-3,0,0] });
    view.addSky({ url:'red.jpg', hdr:true });
    view.setShadowRange( 50, 170, 220, false, 100, -8 );
    view.hideGrid( true );
    

    physic.set({
        jointDebug: debug,
        gravity:[0,0,0],
    });

    // infinie plane
    physic.add({type:'plane', pos:[0,-8, 0]});

    view.load ( ['dragon.sea'], afterLoad, true, true );
    
};

function afterLoad () {

	dragon_material = view.material({
        name:'dragon_mat',
        roughness: 0.4,
        metalness: 0.6,
        map: view.texture( 'dragon.jpg' ),
        metalnessMap: view.texture( 'dragon.jpg' ),
        alphaMap: view.texture( 'dragon_m.jpg' ),
        transparent:true,
        //alphaTest:0.9,
        normalMap: view.texture( 'dragon_n.jpg' ),
        normalScale:  new THREE.Vector2( 1.5, 1.5 ),
        roughness:0.3,
        metalness:1.0,
        premultipliedAlpha:true,
        skinning:true,
        wireframe:debug,
    });

    makeDragon();

    physic.prevUpdate = updateNode;
    physic.pastUpdate = updateBone;

}


function makeDragon () {

	var mtx = new THREE.Matrix4();
    var p = new THREE.Vector3();
    var sv = new THREE.Vector3();
    var q = new THREE.Quaternion();

    var dragon = view.getMesh('dragon', 'dragon');
    dragon.material = dragon_material;
    var skeleton = dragon.skeleton;

    //dragon.castShadow = false;
    //dragon.receiveShadow = false;

    var transform = new THREE.Matrix4().makeTranslation( -1, 0, 0 );
    
    var num = 20, s = 1,  bone, node;
    var phy = [];


    // SPINE

    for ( var i = 0; i < num; i++) {

    	bone = skeleton.getBoneByName('b_spine_' + i);

    	bone.userData.isPhysics = true;
    	bone.userData.phyMtx = new THREE.Matrix4();

    	mtx.multiplyMatrices( bone.matrixWorld, transform );
        mtx.decompose( p, q, sv );

        if(i>10) s *= 0.9

        node = physic.add({ 
        	type:'box', name:'b_spine_' + i,

        	mass: 0.1, pos:p.toArray(), quat:q.toArray(), size:[2,s,s], 
        	kinematic: i === 0 ? true : false,
        	material: debug ? undefined : 'hide',
        	neverSleep:true,

        });

        node.castShadow = false;
        node.receiveShadow = false;
        
        node.userData.bone = bone;
        node.userData.inverse = new THREE.Matrix4().getInverse( transform );
        phy.push( node );

    }

    for ( var i = 0; i < num-1; i++) {
        physic.add({ 
        	//type:'joint_hinge',
        	//type:'joint_spring_dof',
            type:'joint_conetwist', 
            name:'joint'+i, b1:'b_spine_'+i, b2:'b_spine_'+(i+1),
            pos1:[-1,0,0], pos2:[1,0,0], 
            //axe1:[1,0,0], axe2:[1,0,0], 
            //axe1:[0,1,0], axe2:[0,1,0],
            axe1:[0,0,1], axe2:[0,0,1],

            //      x , y, z
            //limit:[-30,30,1,0.3, 1], 
            limit:[20, 20, 0], 
            //linLower:[0, 0, 0], linUpper:[0, 0, 0],  
            //angLower:[-20, -20, -20], angUpper:[20, 20, 20],
            //collision:true,
            useA:true,

            //angularOnly:true,
        })

        
    }


    dragon.userData.phy = phy;

    dragon.setTimeScale( 0.5 );
    dragon.play('move');

    view.extraMesh.add( dragon );
    dragons.push( dragon );

}

function updateNode ( time ) {

	if( physic.byName( 'b_spine_0' ) === null ) return;

	tt += time * 0.5;

	var r = 3.0;
	var x = -3 + r * Math.cos( tt );
	var y = r * Math.sin( tt );

	physic.matrix( [{ name:'b_spine_0', pos:[ x, y, -1 ] }] );

}

function updateBone () {

	var b = dragons[0].userData.phy;
	var lng = b.length, node, bone, e , te = new THREE.Euler();

	var mtx = new THREE.Matrix4();

	for ( var i = 0; i < lng; i++) {

		node = b[i];
		bone = node.userData.bone;

        mtx.copy( node.matrixWorld ).multiply( node.userData.inverse );
        bone.userData.phyMtx.copy( mtx );

	}


}