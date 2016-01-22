
//===============================================
// BVH
//===============================================

var BVH = { REVISION:'1.0'};

BVH.TO_RAD = Math.PI / 180;
window.URL = window.URL || window.webkitURL;

BVH.Interface = function(p){
    this.parent = p;

    this.down = false;

    this.width = window.innerWidth - 40;
    this.totalFrame = 0;
    this.frame = 0;
    this.ratio = 0;

    this.timeInfo = document.createElement('div');
    this.timeInfo.style.cssText = "position:absolute; bottom:40px; left:20px; width:200px; height:5px; pointer-events:none;";
    document.body.appendChild(this.timeInfo);

    this.timeline = document.createElement('div');
    this.timeline.style.cssText = "position:absolute; bottom:20px; left:20px; width:"+this.width+"px; height:5px; border:1px solid #888; pointer-events:auto; cursor:pointer;";
    document.body.appendChild(this.timeline);

    this.framer = document.createElement('div');
    this.framer.style.cssText = "position:absolute; top:Apx; left:0px; width:1px; height:5px; background:#CCC; pointer-events:none;";
    this.timeline.appendChild(this.framer);

    var _this = this;
    window.addEventListener( 'resize', function(e){_this.resize(e);}, false );
    this.timeline.addEventListener( 'mousedown', function ( e ) { _this.tDown(e); }, false );
    document.body.addEventListener( 'mouseup', function ( e ) { _this.tUp(e); }, false );
    document.body.addEventListener( 'mousemove', function ( e ) { _this.tMove(e); }, false );
}

BVH.Interface.prototype = {
    setTotalFrame:function(t){
        this.totalFrame = t;
        this.ratio = this.totalFrame / this.width;
    },
    resize:function(e){
        this.width = window.innerWidth - 40;
        this.timeline.style.width = this.width+'px';
        this.ratio = this.totalFrame / this.width;
    },
    update:function(f){
        this.frame = f;
        this.timeInfo.innerHTML = this.frame + ' / ' + this.totalFrame;
        this.framer.style.width = this.frame / this.ratio + 'px';
    },
    tUp:function(e){
        this.down = false;
    },
    tDown:function(e){
        this.down = true;
        //this.frame = Math.floor((e.clientX-20)*this.ratio);
        //this.parent.gotoFrame(this.frame);

        //console.log(this.frame)

    },
    tMove:function(e){
        if(this.down){
            var f = Math.floor((e.clientX-20)*this.ratio);
            if(f<0) f = 0;
            if(f>this.totalFrame) f = this.totalFrame; 
            this.frame = f;
            this.parent.gotoFrame(this.frame);
        }
    }
}

BVH.Reader = function(){

    this.interface = new BVH.Interface(this);



    this.extractor = new EXTRACT.Pool();

    this.isComplete = false;

    this.debug = true;
    this.type = "";
    this.data = null;
    this.rootBone = null;
    this.numFrames = 0;
    this.secsPerFrame = 0;
    this.play = false;
    this.channels = null;
    this.lines = "";
    
    this.speed = 1;

    this.nodes = null;
    this.order = {};
    
    this.frame = 0;
    this.oldFrame = 0;
    this.startTime = 0;
    
    this.ParentNodes = null;
    this.ChildNodes = null;
    this.BoneByName = null;
    this.Nodes = null;
    
    this.position = new THREE.Vector3( 0, 0, 0 );
    this.scale = 1;

    this.tmpOrder = "";
    this.tmpAngle = [];

    this.skeleton = null;
    this.bones = [];
    this.nodesMesh = [];
    
    this.boneSize = 0.4;
    this.nodeSize = 0.4;
    
    // geometry
    this.boxgeo = new THREE.BufferGeometry().fromGeometry( new THREE.BoxGeometry( 1.5, 1.5, 1 ) );
    this.boxgeo.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, 0.5 ) );
    this.nodegeo = new THREE.BufferGeometry().fromGeometry( new THREE.SphereGeometry ( this.nodeSize, 8, 6 ) );
    
    // material
    this.boneMaterial = new THREE.MeshBasicMaterial({ color:0xffff44 });
    this.nodeMaterial = new THREE.MeshBasicMaterial({ color:0x88ff88 });
}

BVH.Reader.prototype = {
    constructor: BVH.Reader,

    read:function(r, fname){
        this.play = false;
        this.isComplete = false;
        // console.log(r);
        var type = fname.substring(fname.indexOf('.')+1,fname.length);
        var name = fname.substring(0, fname.indexOf('.'));

        console.log(type, name);

        var _this = this;

        if(type==='z'){
            if(this.extractor.results[name]){ this.parseData( _this.extractor.results[name].split(/\s+/g)); console.log('already loaded');}
            else this.extractor.read(r, fname, 2, function(){ _this.parseData(_this.extractor.results[name].split(/\s+/g)); } );
        } else if(type==='bvh' || this.type === 'BVH'){
            this.parseData(r.split(/\s+/g));
        }

    },

    load:function(fname){
        this.play = false;
        this.isComplete = false;
        
        var _this = this;
        this.type = fname.substring(fname.indexOf('.')+1,fname.length);
        var name = fname.substring(fname.lastIndexOf('/')+1, fname.indexOf('.'));

        if(this.type==='z'){
            if(this.extractor.results[name]) this.parseData( this.extractor.results[name].split(/\s+/g) );
            else this.extractor.load(fname, 2, function(){ _this.parseData(_this.extractor.results[name].split(/\s+/g)); } );
        } else {
            var xhr = new XMLHttpRequest();
            xhr.open( 'GET', fname, true );

            if(this.type === 'bvh' || this.type === 'BVH'){ // direct from file
                xhr.onreadystatechange = function(){ if ( this.readyState == 4 ){ _this.parseData(this.responseText.split(/\s+/g));}};          
            } else if(this.type === 'png'){ // from png compress
                xhr.responseType = 'blob';
                xhr.onload = function(e) {
                    if (this.readyState == 4 ) {
                        var blob = this.response;
                        var img = document.createElement('img');
                        img.onload = function(e) {
                            var c=document.createElement("canvas"), r='', pix, i, string = "";
                            c.width = this.width;
                            c.height = this.height;
                            c.getContext('2d').drawImage(this, 0, 0);
                            
                            var d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
                            var color = 0;
                            if(d[1]!==0)color=1;
                            if(d[2]!==0)color=2;
                            var pix, string = "", id, l = d.length/4;
                            for ( var i = 0; i<l; i++){
                                id = (i*4)+color;
                                pix = d[id]+32;
                                pix = pix == 127 ? 10 : pix;
                                if( pix<127 ) string += String.fromCharCode(pix);
                            }
                           _this.parseData(string.split(/\s+/g))
                            window.URL.revokeObjectURL(img.src); // Clean up after yourself.
                        }
                        img.src = window.URL.createObjectURL(blob);
                    }
                }
            }
            xhr.send( null );
        }
    },
    parseData:function(data){
        this.play = false;
        this.isComplete = false;
        this.data = data;
        this.channels = [];
        this.nodes = [];
        this.Nodes = {};
        this.distances = {};
        
        this.ParentNodes = {};
        this.ChildNodes = {};
        this.BoneByName = {};
        
        var done = false;
        while (!done) {
            switch (this.data.shift()) {
            case 'ROOT':
                if(this.rootBone !== null) this.clearNode();
                if(this.skeleton !== null) this.clearSkeleton();

                this.rootBone = this.parseNode(this.data);
                this.rootBone.position.copy(this.position);
                this.rootBone.scale.set(this.scale,this.scale,this.scale);

                break;
            case 'MOTION':
                this.data.shift();
                this.numFrames = parseInt( this.data.shift() );
                this.data.shift();
                this.data.shift();
                this.secsPerFrame = parseFloat(this.data.shift());
                done = true;
                this.startPlay()
            }
        }

        
    },
    startPlay:function(){
        debugTell("BVH frame:"+this.numFrames+" s/f:"+this.secsPerFrame + " channels:"+this.channels.length + " node:"+ this.nodes.length);
        this.getDistanceList();
        this.getNodeList();
        
        if(this.debug) this.addSkeleton();

        this.isComplete = true;

        this.interface.setTotalFrame(this.numFrames);
        
        this.startTime = Date.now();
        this.play = true;
    },
    reScale:function (s) {
        this.scale = s;
        this.rootBone.scale.set(this.scale,this.scale,this.scale);
    },
    rePosition:function (v) {
        this.position = v;
        this.rootBone.position.copy(this.position);
    },
    getDistanceList:function () {
        this.distances = {};
        var n = this.nodes.length, node, name;
        while (n--){
            node = this.nodes[n];
            name = node.name;
            if(node.children.length){
                this.distances[name] = this.distanceTest(new THREE.Vector3().setFromMatrixPosition( node.matrixWorld ), node.children[0].position);
            } else this.distances[name] = 2;
        }
    },
    distanceTest:function(p1, p2){
        var x = p2.x-p1.x;
        var y = p2.y-p1.y;
        var z = p2.z-p1.z;
        var d = Math.sqrt(x*x + y*y + z*z);
        if(d<=0)d=0.1;
        return d;
    },  
    getNodeList:function () {
        var n = this.nodes.length, node, s = "", name, p1,p2;
        for(var i=0; i<n; i++){
            node = this.nodes[i];
            name = node.name;

            this.Nodes[name] = node;
            if(node.parent){ 
                this.ParentNodes[name] = node.parent; 
            } else this.ParentNodes[name] = null;
            if(node.children.length){
                this.ChildNodes[name] = node.children[0]; 
            } else{
                this.ChildNodes[name] = null;
            }
            
            s += node.name + " _ "+ i +"<br>"//+" _ "+node.parent.name +" _ "+node.children[0].name+"<br>";
        }
        if(out2)out2.innerHTML = s;
    },
    addSkeleton:function (){
        this.skeleton = new THREE.Group();
        this.bones = [];
        this.nodesMesh = [];

        var n = this.nodes.length, node, bone;

        for(var i=0; i<n; i++){
            node = this.nodes[i];
            this.nodesMesh[i] = new THREE.Mesh( this.nodegeo, this.nodeMaterial )
            this.skeleton.add(this.nodesMesh[i]);
            
            if ( node.name !== 'Site' ){
                bone = new THREE.Mesh(this.boxgeo, this.boneMaterial);
                bone.castShadow = true;
                bone.receiveShadow = true;
                bone.rotation.order = 'XYZ';
                bone.name = node.name;
                this.skeleton.add(bone);
                this.bones[i] = bone;
                this.BoneByName[node.name] = bone;
            }
        }
        scene.add( this.skeleton );
        //this.skeleton.visible = false;

    },
    clearSkeleton:function () {
        var n = this.skeleton.children.length;
        while(n--){
            this.skeleton.remove(this.skeleton.children[n]);
        }
        scene.remove( this.skeleton );
        this.skeleton = null;
    },
    updateSkeleton:function (  ) {
        var mtx, node, bone, name;
        var n = this.nodes.length;
        var target;
        for(var i=0; i<n; i++){
            node = this.nodes[i];
            bone = this.bones[i];
            name = node.name;
            
            mtx = node.matrixWorld;
            this.nodesMesh[i].position.setFromMatrixPosition( mtx );

            if ( name !== 'Site' ){
                
                bone.position.setFromMatrixPosition( mtx );
                if(node.children.length){
                    target = new THREE.Vector3().setFromMatrixPosition( node.children[0].matrixWorld );
                    bone.lookAt(target);
                    bone.rotation.z = 0;

                    if(name==="Head")bone.scale.set(this.boneSize*2,this.boneSize*2,this.distances[name]*(this.boneSize*1.5));
                    else bone.scale.set(this.boneSize,this.boneSize,this.distances[name]);
                }
            }
        }
    },
    transposeName:function(name){
        if(name==="hip" || name==="SpineBase") name = "Hips";
        if(name==="abdomen" || name==="SpineBase2") name = "Spine1";
        if(name==="chest" || name==="SpineMid") name = "Chest";
        if(name==="neck" || name==="Neck2") name = "Neck";
        if(name==="head") name = "Head";
        if(name==="lCollar") name = "LeftCollar";
        if(name==="rCollar") name = "RightCollar";
        if(name==="lShldr") name = "LeftUpArm";
        if(name==="rShldr") name = "RightUpArm";
        if(name==="lForeArm") name = "LeftLowArm";
        if(name==="rForeArm") name = "RightLowArm";
        if(name==="lHand") name = "LeftHand";
        if(name==="rHand") name = "RightHand";
        if(name==="lFoot") name = "LeftFoot";
        if(name==="rFoot") name = "RightFoot";
        if(name==="lThigh") name = "LeftUpLeg";
        if(name==="rThigh") name = "RightUpLeg";
        if(name==="lShin") name = "LeftLowLeg";
        if(name==="rShin") name = "RightLowLeg";

        // leg
        if(name==="RightHip" || name==="HipRight") name = "RightUpLeg";
        if(name==="LeftHip" || name==="HipLeft") name = "LeftUpLeg";
        if(name==="RightKnee" || name==="KneeRight") name = "RightLowLeg";
        if(name==="LeftKnee" || name==="KneeLeft") name = "LeftLowLeg";
        if(name==="RightAnkle" || name==="AnkleRight") name = "RightFoot";
        if(name==="LeftAnkle" || name==="AnkleLeft") name = "LeftFoot";
        // arm
        if(name==="RightShoulder" || name==="ShoulderRight") name = "RightUpArm";
        if(name==="LeftShoulder" || name==="ShoulderLeft") name = "LeftUpArm";
        if(name==="RightElbow" || name==="ElbowRight") name = "RightLowArm";
        if(name==="LeftElbow" || name==="ElBowLeft") name = "LeftLowArm";
        if(name==="RightWrist" || name==="WristRight") name = "RightHand";
        if(name==="LeftWrist"|| name==="WristLeft") name = "LeftHand";

        if(name==="rcollar" || name==="CollarRight") name = "RightCollar";
        if(name==="lcollar" || name==="CollarLeft") name = "LeftCollar";

        if(name==="rtoes") name = "RightToe";
        if(name==="ltoes") name = "LeftToe";

        if(name==="upperback") name = "Spine1";
        
        return name;
    },
    parseNode:function(data){
        var name, done, n, node, t;
        name = data.shift();
        name = this.transposeName(name);
        node = new THREE.Group();
        node.name = name;

        done = false;
        while ( !done ) {
            switch ( t = data.shift()) {
                case 'OFFSET':
                    node.position.set( parseFloat( data.shift() ), parseFloat( data.shift() ), parseFloat( data.shift() ) );
                    node.offset = node.position.clone();
                    break;
                case 'CHANNELS':
                    n = parseInt( data.shift() );
                    for ( var i = 0;  0 <= n ? i < n : i > n;  0 <= n ? i++ : i-- ) { 
                        this.channels.push({ node: node, prop: data.shift() });
                    }
                    break;
                case 'JOINT':
                case 'End':
                    node.add( this.parseNode(data) );
                    break;
                case '}':
                    done = true;
            }
        }
        this.nodes.push(node);
        return node;
    },
    clearNode:function(){
        var i;
        if(out2)out2.innerHTML = "";

        if(this.nodes){
            for (i=0; i<this.nodes.length; i++){
                this.nodes[i] = null;
            }
            this.nodes.length = 0;

            /*if(this.bones.length > 0){
                for ( i=0; i<this.bones.length; i++){
                    if(this.bones[i]){
                        this.bones[i].geometry.dispose();
                    }
                }
                this.bones.length = 0;
                scene.remove( this.skeleton );
           }*/
        }
    },
    animate:function(){
        //debugTell("frame" +  this.frame);
        var ch;
        var n = this.frame % this.numFrames * this.channels.length;
        var ref = this.channels;
        var isRoot = false;

        for ( var i = 0, len = ref.length; i < len; i++) {
            ch = ref[ i ];
            if(ch.node.name === "Hips") isRoot = true;
            else isRoot = false;


            switch ( ch.prop ) {
                case 'Xrotation':
                    this.autoDetectRotation(ch.node, "X", parseFloat(this.data[n]));
                    //ch.node.rotation.x = (parseFloat(this.data[n])) * BVH.TO_RAD;
                    break;
                case 'Yrotation':
                    this.autoDetectRotation(ch.node, "Y", parseFloat(this.data[n]));
                    //ch.node.rotation.y = (parseFloat(this.data[n])) * BVH.TO_RAD;
                    break;
                case 'Zrotation':
                    this.autoDetectRotation(ch.node, "Z", parseFloat(this.data[n]));
                    //ch.node.rotation.z = (parseFloat(this.data[n])) * BVH.TO_RAD;
                    break;
                case 'Xposition':
                    if(isRoot) ch.node.position.x = ch.node.offset.x + parseFloat(this.data[n])+ this.position.x;
                    else ch.node.position.x = ch.node.offset.x + parseFloat(this.data[n]);
                    break;
                case 'Yposition':
                    if(isRoot) ch.node.position.y = ch.node.offset.y + parseFloat(this.data[n])+ this.position.y;
                    else ch.node.position.y = ch.node.offset.y + parseFloat(this.data[n]);
                    break;
                case 'Zposition':
                    if(isRoot) ch.node.position.z = ch.node.offset.z + parseFloat(this.data[n])+ this.position.z;
                    else ch.node.position.z = ch.node.offset.z + parseFloat(this.data[n]);
                break;
            }

            n++;
        }

        if(this.bones.length > 0) this.updateSkeleton();


        updateBVH();
    },
    autoDetectRotation:function(Obj, Axe, Angle){

        this.tmpOrder+=Axe;
        var angle = Angle * BVH.TO_RAD;

        if(Axe === "X")this.tmpAngle[0] = angle;
        else if(Axe === "Y")this.tmpAngle[1] = angle;
        else this.tmpAngle[2] = angle;

        if(this.tmpOrder.length===3){
            var e = new THREE.Euler( this.tmpAngle[0], this.tmpAngle[1], this.tmpAngle[2], this.tmpOrder );
            this.order[Obj.name] =  this.tmpOrder;
            
            Obj.setRotationFromEuler(e);
            Obj.updateMatrixWorld();

            this.tmpOrder = "";
            this.tmpAngle.length = 0;
        }

    },
    update:function(){
        if ( this.play ) { 
            this.frame = ((((Date.now() - this.startTime) / this.secsPerFrame / 1000) )*this.speed) | 0;
            if(this.oldFrame!==0) this.frame += this.oldFrame;
            if(this.frame > this.numFrames ){this.frame = 0; this.oldFrame=0; this.startTime =Date.now() }

      
            this.interface.update(this.frame);

            this.animate();
        }
    },
    gotoFrame:function(f){
        if ( this.play ) this.play = false;
        this.frame = f;
        this.interface.update(this.frame);
        this.animate();
        
    },
    next:function(){
        this.play = false;
        this.frame ++;
        if(this.frame > this.numFrames )this.frame = 0;
        this.animate();

    },
    prev:function(){
        this.play = false;
        this.frame --;
        if(this.frame<0)this.frame = this.numFrames;
        this.animate();
    }

}
