/**   _     _   _     
*    | |___| |_| |__
*    | / _ \  _|    |
*    |_\___/\__|_||_|
*    @author LoTh /http://3dflashlo.wordpress.com/
*/

// GT-C1 Sbarro Espera
// 900 kg / 1600 cm3 / 125 chevaux
// largeur 1.85m / hauteur 1.5m / longeur 3.44m

AAA.ToRad = Math.PI / 180;

AAA.C1gt = function(endFunction, High){
	this.end = endFunction;
	this.isHighModel = High || false;
	this.name = ['bottomCar', 'MotorAndBorder', 'doorGlassLeft', 'doorGlassRight', 'trunk', 'glass',
                'hood', 'headLight', 'doorRight', 'doorLeft', 'interior', 'body', 'steeringWheel', 'wheel', 'shape'];
	this.c1gtMats = [];
	this.geos = [];
	this.meshs = null;
	this.textures = null;
	this.Pool = null;

	this.car = null;
	this.wheel = null;
	this.shape = null;

	//this.cars = [];

	this.load();
}

AAA.C1gt.prototype = {
    constructor: AAA.C1gt,
    load:function(){
    	var _this = this;
    	//if(this.isHighModel)this.Pool = new SEA3D.Pool('models/c1gt.high.sea', function() { _this.init() });
    	//else
    	this.Pool = new SEA3D.Pool('models/c1gt.sea', function() { _this.init() });
    },
    init:function(){
    	var i = this.name.length;
    	
    	while(i--){
    		this.geos[i] = this.Pool.getGeometry(this.name[i], true, 0.02);
	    }
	    console.log(this.geos.length)

    	this.c1gtMats[0] = new THREE.MeshBasicMaterial({ name:'body', map:Textures.getByName("body"), reflectivity:0.6, envMap:View.sky, combine:THREE.MixOperation });
	    this.c1gtMats[1] = new THREE.MeshBasicMaterial({ name:'door', map:Textures.getByName("bodydoor"), reflectivity:0.6, envMap:View.sky, combine:THREE.MixOperation });
	    this.c1gtMats[2] = new THREE.MeshBasicMaterial({ name:'intern', map:Textures.getByName("intern"), reflectivity:0.3, envMap:View.sky, combine:THREE.MixOperation });
	    this.c1gtMats[3] = new THREE.MeshBasicMaterial({ name:'glass', map:Textures.getByName("body"), reflectivity:0.9, envMap:View.sky, combine:THREE.MixOperation, transparent:true, opacity:0.3, side:THREE.DoubleSide});
	    this.c1gtMats[4] = new THREE.MeshBasicMaterial({ name:'light', map:Textures.getByName("light"), reflectivity:0.3, envMap:View.sky, combine:THREE.MixOperation});
	    this.c1gtMats[5] = new THREE.MeshBasicMaterial({ name:'wheel', map:Textures.getByName("wheels"), reflectivity:0.2, envMap:View.sky, combine:THREE.MixOperation});
	    this.c1gtMats[6] = new THREE.MeshBasicMaterial({ name:'steering', color:0x333333, reflectivity:0.3, envMap:View.sky, combine:THREE.MixOperation});

	    this.c1gtMatLib = {};

    	this.meshs = [];

	    var bodyGlass = new THREE.Mesh( new THREE.BufferGeometry().fromGeometry(this.geos[5]), this.c1gtMats[3] );
	    var doorLGlass = new THREE.Mesh( new THREE.BufferGeometry().fromGeometry(this.geos[2]), this.c1gtMats[3] );
	    var doorRGlass = new THREE.Mesh( new THREE.BufferGeometry().fromGeometry(this.geos[3]), this.c1gtMats[3] );
	    var intern = new THREE.Mesh( new THREE.BufferGeometry().fromGeometry(this.geos[10]), this.c1gtMats[2] );
	    var headlight = new THREE.Mesh( new THREE.BufferGeometry().fromGeometry(this.geos[7]), this.c1gtMats[4] );
	    
	    var geobody = new THREE.Geometry();
	    geobody.merge(this.geos[1]);
	    geobody.merge(this.geos[0]);
	    geobody.merge(this.geos[11]);

	    this.meshs[0] = new THREE.Mesh( new THREE.BufferGeometry().fromGeometry(geobody), this.c1gtMats[0] );

	    this.meshs[0].add(bodyGlass);
	    this.meshs[0].add(headlight);
	    this.meshs[0].add(intern);
	    this.meshs[0].name = "body";
	    this.meshs[1] = new THREE.Mesh( new THREE.BufferGeometry().fromGeometry(this.geos[6]), this.c1gtMats[0] );
	    this.meshs[1].name = "hood";
	    this.meshs[2] = new THREE.Mesh( new THREE.BufferGeometry().fromGeometry(this.geos[4]), this.c1gtMats[3] );
	    this.meshs[2].name = "trunk";
	    this.meshs[3] = new THREE.Mesh( new THREE.BufferGeometry().fromGeometry(this.geos[9]), this.c1gtMats[1] );
	    this.meshs[3].add(doorLGlass);
	    this.meshs[3].name = "doorL";
	    this.meshs[4] = new THREE.Mesh( new THREE.BufferGeometry().fromGeometry(this.geos[8]), this.c1gtMats[1] );
	    this.meshs[4].add(doorRGlass);
	    this.meshs[4].name = "doorR";
	    this.meshs[5] = new THREE.Mesh( new THREE.BufferGeometry().fromGeometry(this.geos[12]), this.c1gtMats[6] );
	    this.meshs[5].name = "steering";

	    //this.steering = this.meshs[5];

	   //this.meshs[6] = new THREE.Mesh( new THREE.BufferGeometry().fromGeometry(new THREE.CubeGeometry( 1.8,1.465,3.44 )), this.c1gtMats[3] );


	    this.car = new THREE.Object3D();

	    i = this.meshs.length;
	    var mesh;
	    while(i--){
	    	mesh = this.meshs[i];
	        this.car.add(mesh);
	        mesh.castShadow = true;
	        mesh.receiveShadow = true;

	        if(mesh.name=='hood'){
	        	mesh.position.set(0,0.2935*2,-0.55*2); mesh.rotation.set(0*AAA.ToRad,0,0)
	        }
	        if(mesh.name=='trunk'){
	        	mesh.position.set(0,0.44225*2,0.595*2); mesh.rotation.set(-0*AAA.ToRad,0,0)
	        }
	        if(mesh.name=='doorL'){
	        	mesh.position.set(-0.075*2,0.54225*2,-0.025*2); mesh.rotation.set(-5*AAA.ToRad,0,-0*AAA.ToRad)
	        }
	        if(mesh.name=='doorR'){
	        	mesh.position.set(0.075*2,0.54225*2,-0.025*2); mesh.rotation.set(-5*AAA.ToRad,0,0*AAA.ToRad)
	        }
	        if(mesh.name=='steering'){
	        	mesh.position.set(-0.40,0.58,-0.3*2); mesh.rotation.set(-20*AAA.ToRad,0,0*AAA.ToRad)
	        }
	    }
	    //var w = this.geos[13]//
	    this.wheel = new THREE.Mesh( new THREE.BufferGeometry().fromGeometry(this.geos[13]), this.c1gtMats[5] );
	    this.wheel.name = "wheel";

	    var g = new THREE.Geometry();
        g.merge(this.geos[14]);
        g.applyMatrix( new THREE.Matrix4().makeRotationY( 180* (Math.PI / 180) ) );

	    this.shape = new THREE.Mesh( new THREE.BufferGeometry().fromGeometry(g) );
	    //this.car.add(this.shape);
	    this.name.length = 0;

	    this.end(); 

    }
}