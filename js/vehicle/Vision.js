/**   _     _   _     
*    | |___| |_| |__
*    | / _ \  _|    |
*    |_\___/\__|_||_|
*    @author LoTh /http://3dflashlo.wordpress.com/
*/

// BMW Vision Efficient Dynamics
// 1490 kg / 349 chevaux / max speed 250 km/h
// largeur 1.9m / hauteur 1.24m / longeur 4.6m

AAA.ToRad = Math.PI / 180;
AAA.Vision = function(endFunction, High){
	this.end = endFunction;
	this.isHighModel = High || false;
	this.name = ['body_top', 'body_side', 'body_back', 'glass_top', 'chassisPlus', 'interiorPlus', 'capot', 'crome', 'interiorSymetrie',
    'glass_wheel_window', 'light_red', 'chassisSymetrie', 'interiorWheelAxe', 'Plaques', 'Bouchon', 'driveMain', 'interiorDeco',
    'frontLight', 'frontLightContour', 'frontLightBack', 'grille++', 'radiateur', 'wheel', 'wheel_j1', 'wheel_j2',//24
    'sit', 'sit_j1', 'sit_j2', 'full', 'steering', 'steering_j1',
    'door_l', 'door_l_j1', 'door_l_j2', 'door_l_glass',//31-34
    'door_r', 'door_r_j1', 'door_r_j2', 'door_r_glass',//35-38
    ];

	this.mats = null;
	this.meshs = null;
	this.geos = null;

	this.Pool = null;
	this.timerTest  = null;

	this.car = null;
	this.wheel = null;
	this.shape = null;

	this.cars = [];

	this.load();
}

AAA.Vision.prototype = {
    constructor: AAA.Vision,
    load:function(){
    	var _this = this;
    	if(this.isHighModel)this.Pool = new SEA3D.Pool('models/vision.high.sea', function() { _this.init() });
    	else this.Pool = new SEA3D.Pool('models/vision.sea', function() { _this.init() });
    },
    init:function(){
    	this.geos = [];
    	for(var i=0;i<this.name.length;i++){
	        this.geos[i] = this.Pool.getGeometry(this.name[i], true, 0.006);
	    }
	    this.construct();
    },
    construct:function(){

    	this.mats = [];

    	this.mats[0] = new THREE.MeshBasicMaterial({ name:'wheelGumb', color:0x050505, reflectivity:0.1, envMap:View.sky, combine:THREE.MixOperation });
	    this.mats[1] = new THREE.MeshBasicMaterial({ name:'bodyWhite', color:0xeeeeee, reflectivity:0.3, envMap:View.sky, combine:THREE.MixOperation });
	    this.mats[2] = new THREE.MeshBasicMaterial({ name:'bodyBlack', color:0x373536, reflectivity:0.3, envMap:View.sky, combine:THREE.MixOperation });
	    this.mats[3] = new THREE.MeshBasicMaterial({ name:'chrome', color:0x909090, reflectivity:0.8, envMap:View.sky, combine:THREE.MixOperation});
	    this.mats[4] = new THREE.MeshBasicMaterial({ name:'glass', color:0x202020, reflectivity:0.8, envMap:View.sky, combine:THREE.MixOperation, transparent:true, opacity:0.8, side:THREE.DoubleSide});
	    this.mats[5] = new THREE.MeshBasicMaterial({ name:'lightBack', color: 0xFF0000, reflectivity:0.2, envMap:View.sky, combine:THREE.MixOperation, transparent:true, opacity:0.9});
	    this.mats[6] = new THREE.MeshBasicMaterial({ name:'lightFront', color:0xFFFFFF, reflectivity:0.2, envMap:View.sky, combine:THREE.MixOperation, transparent:true, opacity:0.9});
	    this.mats[7] = new THREE.MeshBasicMaterial({ name:'lightFront', color:0xFFFFFF, reflectivity:0.2, envMap:View.sky, combine:THREE.MixOperation, transparent:true, opacity:0.5});


    	this.meshs = [];

    	var g = new THREE.Geometry();
    	THREE.GeometryUtils.merge(g, this.geos[0]);
    	THREE.GeometryUtils.merge(g, this.geos[1]);
    	THREE.GeometryUtils.merge(g, this.geos[2]);
    	THREE.GeometryUtils.merge(g, this.geos[13]);
    	this.meshs[0] = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(g), this.mats[1] );

    	g = new THREE.Geometry();
    	THREE.GeometryUtils.merge(g, this.geos[3]);
    	THREE.GeometryUtils.merge(g, this.geos[9]);
    	var meshGlass = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(g), this.mats[4] );

    	g = new THREE.Geometry();
    	THREE.GeometryUtils.merge(g, this.geos[5]);
    	THREE.GeometryUtils.merge(g, this.geos[8]);
    	THREE.GeometryUtils.merge(g, this.geos[11]);
    	THREE.GeometryUtils.merge(g, this.geos[12]);
    	THREE.GeometryUtils.merge(g, this.geos[15]);
    	THREE.GeometryUtils.merge(g, this.geos[16]);
    	THREE.GeometryUtils.merge(g, this.geos[19]);
    	var meshBlack = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(g), this.mats[2] );

    	g = new THREE.Geometry();
    	THREE.GeometryUtils.merge(g, this.geos[7]);
    	THREE.GeometryUtils.merge(g, this.geos[14]);
    	THREE.GeometryUtils.merge(g, this.geos[20]);
    	THREE.GeometryUtils.merge(g, this.geos[21]);
    	var meshChrome = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(g), this.mats[3] );

    	var meshLightBack = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[10]), this.mats[5] );
    	var meshLightFront = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry( this.geos[17]), this.mats[6] );
    	var meshLightFront2 = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry( this.geos[18]), this.mats[7] );
    	

    	this.meshs[0].add(meshBlack);
    	this.meshs[0].add(meshGlass);
    	this.meshs[0].add(meshChrome);
    	this.meshs[0].add(meshLightBack);
    	this.meshs[0].add(meshLightFront);
    	this.meshs[0].add(meshLightFront2);


    	// hood
    	this.meshs[1] = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[6]), this.mats[1] );

    	// door L
    	var dglass = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[34]), this.mats[4] );
    	var ddeco = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[32]), this.mats[1] );
    	var dcc = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[33]), this.mats[3] );
    	this.meshs[2] = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[31]), this.mats[2] );
    	this.meshs[2].add(dglass);
    	this.meshs[2].add(ddeco);
    	this.meshs[2].add(dcc);

    	// door R
    	dglass = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[38]), this.mats[4] );
    	ddeco = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[36]), this.mats[1] );
    	dcc = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[37]), this.mats[3] );
    	this.meshs[3] = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[35]), this.mats[2] );
    	this.meshs[3].add(dglass);
    	this.meshs[3].add(ddeco);
    	this.meshs[3].add(dcc);

    	// sit
    	var sit1 = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[26]), this.mats[1] );
    	var sit2 = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[27]), this.mats[2] );
    	var sit = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[25]), this.mats[3] );
    	sit.add(sit1);
    	sit.add(sit2);

    	this.meshs[4]= new THREE.Object3D();
    	var s;
    	var spos = [0.4, 0, -0.75]

    	for(var j = 0; j<4 ; j++){
    		s = sit.clone();
    		this.meshs[4].add(s);
    		switch(j){
	    		case 0: s.position.set(spos[0], 0, spos[1]); break;
	    		case 1: s.position.set(-spos[0], 0, spos[1]); break;
	    		case 2: s.position.set(spos[0], 0, spos[2]); break;
	    		case 3: s.position.set(-spos[0], 0, spos[2]); break;
	    	}
    	}

    	this.meshs[5]= new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[29]), this.mats[2] );
    	var mm= new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[30]), this.mats[4] );
    	this.meshs[5].add(mm);
    	this.meshs[5].name = "steering"



	    this.car = new THREE.Object3D();

	    var i = this.meshs.length;
	    var mesh;
	    while(i--){
	    	mesh = this.meshs[i];
	        this.car.add(mesh)
	        if(mesh.name=='steering'){
	        	mesh.position.set(0.4,0.75,0.6); mesh.rotation.set(20*AAA.ToRad,0,0*AAA.ToRad)
	        }
	    }

	    // create wheel
	    var j1 = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[23]), this.mats[1] );
	    var j2 = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[24]), this.mats[2] );
	    this.wheel = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[22]), this.mats[0] );
	    this.wheel.add(j1);
	    this.wheel.add(j2);
	    this.wheel.name = "wheel";

	    this.shape = new THREE.Mesh( this.geos[29] );

	    this.end(); 

    }
}