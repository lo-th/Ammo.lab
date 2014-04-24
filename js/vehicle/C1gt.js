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
    this.maps = [ 'body.png', 'bodydoor.png', 'intern.png', 'light.png', 'wheels.png'];
	this.mats = null;
	this.meshs = null;
	this.textures = null;
	this.geos = null;

	this.Pool = null;
	this.timerTest  = null;

	this.car = null;
	this.wheel = null;
	this.shape = null;

	this.cars = [];

	this.load();
}

AAA.C1gt.prototype = {
    constructor: AAA.C1gt,
    load:function(){
    	var _this = this;
    	if(this.isHighModel)this.Pool = new SEA3D.Pool('models/c1gt.high.sea', function() { _this.init() });
    	else this.Pool = new SEA3D.Pool('models/c1gt.sea', function() { _this.init() });
    },
    init:function(){
    	this.geos = [];
    	for(var i=0;i<this.name.length;i++){
    		this.geos[i] = this.Pool.getGeometry(this.name[i], true, 0.02);
	    }
	    this.textures = [];
	    var PATH = "images/c1gt/";
	    var i = this.maps.length;
        while(i--){
            this.textures[i] = new THREE.ImageUtils.loadTexture( PATH + this.maps[i] );
        }

        this.timerTest = setInterval(this.loadCarTextures, 20, this);

    },
    loadCarTextures:function (tt) {
    	var _this = tt;
        if ( _this.textures.length == _this.maps.length)  {
            clearInterval(_this.timerTest);
            _this.construct();
        }
    },
    construct:function(){

    	this.mats = [];
    	var i;

    	var texture;
        i = this.textures.length;
	    while(i--){
	    	texture = this.textures[i];
	        texture.repeat.set( 1, -1 );
	        texture.format = THREE.RGBFormat;
	        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	    }

    	this.mats[0] = new THREE.MeshBasicMaterial({ name:'body', map:this.textures[0], reflectivity:0.6, envMap:View.sky, combine:THREE.MixOperation });
	    this.mats[1] = new THREE.MeshBasicMaterial({ name:'door', map:this.textures[1], reflectivity:0.6, envMap:View.sky, combine:THREE.MixOperation });
	    this.mats[2] = new THREE.MeshBasicMaterial({ name:'intern', map:this.textures[2], reflectivity:0.3, envMap:View.sky, combine:THREE.MixOperation });
	    this.mats[3] = new THREE.MeshBasicMaterial({ name:'glass', map:this.textures[0], reflectivity:0.9, envMap:View.sky, combine:THREE.MixOperation, transparent:true, opacity:0.3, side:THREE.DoubleSide});
	    this.mats[4] = new THREE.MeshBasicMaterial({ name:'light', map:this.textures[3], reflectivity:0.3, envMap:View.sky, combine:THREE.MixOperation});
	    this.mats[5] = new THREE.MeshBasicMaterial({ name:'wheel', map:this.textures[4], reflectivity:0.2, envMap:View.sky, combine:THREE.MixOperation});
	    this.mats[6] = new THREE.MeshBasicMaterial({ name:'steering', color:0x333333, reflectivity:0.3, envMap:View.sky, combine:THREE.MixOperation});

    	this.meshs = [];

	    var bodyGlass = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[5]), this.mats[3] );
	    var doorLGlass = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[2]), this.mats[3] );
	    var doorRGlass = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[3]), this.mats[3] );
	    var intern = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[10]), this.mats[2] );
	    var headlight = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[7]), this.mats[4] );
	    
	    var geobody = new THREE.Geometry();
	    THREE.GeometryUtils.merge(geobody, this.geos[1]);
	    THREE.GeometryUtils.merge(geobody, this.geos[0]);
	    THREE.GeometryUtils.merge(geobody, this.geos[11]);

	    this.meshs[0] = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(geobody), this.mats[0] );
	    // this.meshs[0] = new THREE.Mesh( geobody, this.mats[0] );
	    this.meshs[0].add(bodyGlass);
	    this.meshs[0].add(headlight);
	    this.meshs[0].add(intern);
	    this.meshs[0].name = "body";

	    this.meshs[1] = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[6]), this.mats[0] );
	    this.meshs[1].name = "hood";

	    this.meshs[2] = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[4]), this.mats[3] );
	    this.meshs[2].name = "trunk";

	    this.meshs[3] = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[9]), this.mats[1] );
	    this.meshs[3].add(doorLGlass);
	    this.meshs[3].name = "doorL";

	    this.meshs[4] = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[8]), this.mats[1] );
	    this.meshs[4].add(doorRGlass);
	    this.meshs[4].name = "doorR";

	    this.meshs[5] = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[12]), this.mats[6] );
	    this.meshs[5].name = "steering";

	    //this.steering = this.meshs[5];

	   //this.meshs[6] = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(new THREE.CubeGeometry( 1.8,1.465,3.44 )), this.mats[3] );


	    this.car = new THREE.Object3D();

	    i = this.meshs.length;
	    var mesh;
	    while(i--){
	    	mesh = this.meshs[i];
	        this.car.add(mesh);
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

	    this.wheel = new THREE.Mesh( THREE.BufferGeometryUtils.fromGeometry(this.geos[13]), this.mats[5] );
	    this.wheel.name = "wheel";

	    var g = new THREE.Geometry();
        THREE.GeometryUtils.merge(g, this.geos[14]);
        g.applyMatrix( new THREE.Matrix4().makeRotationY( 180* (Math.PI / 180) ) );

	    this.shape = new THREE.Mesh( g );
	    //this.car.add(this.shape);
	    this.name.length = 0;

	    this.end(); 

    }
}