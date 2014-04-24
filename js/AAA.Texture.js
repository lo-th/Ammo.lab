AAA.Texture = function(){
	this.path = 'images/'
	this.names = [
	    'sketch/noise.png', 'sketch/paper.jpg',
	    'terrain/level0.jpg', 'terrain/level1.jpg', 'terrain/level2.jpg', 'terrain/level3.jpg', 'terrain/level4.jpg', 'terrain/diffuse1.jpg', 'terrain/diffuse2.jpg', 'terrain/normal.jpg',
	    'c1gt/body.png', 'c1gt/bodydoor.png', 'c1gt/intern.png', 'c1gt/light.png', 'c1gt/wheels.png'
	];
    this.warps = [
        0, 0,
        1,1,1,1,1,1,1,1,
        1,1,1,1,1
    ];
    this.revers = [
        0, 0,
        0,0,0,0,0,0,0,0,
        1,1,1,1,1
    ]


	this.imgs = [];
	this.txts = [];
	this.endFunction = null;
	this.num = 0;
}

AAA.Texture.prototype = {
    constructor: AAA.Texture,
    load:function(End){
    	this.endFunction = End;
    	this.loadNext();
    },
    loadNext:function(){
    	var _this = this;
    	var n = this.num;
    	this.imgs[n] = new Image();
    	this.txts[n] = new THREE.Texture(this.imgs[n]);
    	this.imgs[n].onload = function(){ 
    		_this.num++; 
    		if(_this.num == _this.names.length){
    			_this.loadComplete();
    		} else {
    			_this.loadNext();
    		}
    	};
        this.imgs[n].src = this.path + this.names[n];
    },
    loadComplete:function(){
    	var i = this.txts.length;
    	while(i--){
            this.txts[i].name = this.names[i].slice(this.names[i].indexOf("/")+1, -4);
            this.txts[i].format = THREE.RGBFormat;
            if(this.warps[i] == 1) this.txts[i].wrapS = this.txts[i].wrapT = THREE.RepeatWrapping;
            if(this.revers[i] == 1) this.txts[i].repeat.set( 1, -1 );
    		this.txts[i].needsUpdate = true;
    	}
    	this.endFunction();
    },
    getByName:function(name){
        var i = this.txts.length;
        while(i--){
            if(this.txts[i].name == name) return this.txts[i];
        }
    }
}