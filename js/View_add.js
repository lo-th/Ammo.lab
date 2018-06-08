View.prototype.updateIntern = function(){

	this.heroStep( Ar, ArPos[0] );
    this.carsStep( Ar, ArPos[1] );
    this.bodyStep( Ar, ArPos[2] );
    this.softStep( Ar, ArPos[3] );

}



View.prototype.bodyStep = function( AR, N ){

	if( !this.bodys.length ) return;
	var _this = this;

    this.bodys.forEach( function( b, id ) {

        var n = N + ( id * 8 );
        var s = AR[n];
        if ( s > 0 ) {

            if ( b.material.name == 'sleep' ) b.material = _this.mat.move;
            if( s > 50 && b.material.name == 'move' ) b.material = _this.mat.movehigh;
            else if( s < 50 && b.material.name == 'movehigh') b.material = _this.mat.move;
            
            b.position.fromArray( AR, n + 1 );
            b.quaternion.fromArray( AR, n + 4 );

        } else {
            if ( b.material.name == 'move' || b.material.name == 'movehigh' ) b.material = _this.mat.sleep;
        }
    });

}

View.prototype.heroStep = function( AR, N ){

    if( !this.heros.length ) return;

    this.heros.forEach( function( b, id ) {

        var n = N + (id * 8);
        var s = AR[n] * 3.33;
        b.userData.speed = s * 100;
        b.position.fromArray( AR, n + 1 );
        b.quaternion.fromArray( AR, n + 4 );

        if(b.skin){



            if( s === 0 ) b.skin.play( 0, 0.3 );
            else{ 
                b.skin.play( 1, 0.3 );
                b.skin.setTimeScale( s );

            }

            //console.log(s)
            
        }

    });

};

View.prototype.carsStep = function( AR, N ){

    if( !this.cars.length ) return;

    this.cars.forEach( function( b, id ) {

        var n = N + (id * 56);
        //carsSpeed[id] = Cr[n];
        b.userData.speed = AR[n];

        b.position.fromArray( AR, n + 1 );
        b.quaternion.fromArray( AR, n + 4 );

        //b.position.set( Cr[n+1], Cr[n+2], Cr[n+3] );
        //b.quaternion.set( Cr[n+4], Cr[n+5], Cr[n+6], Cr[n+7] );

        //b.axe.position.copy( b.body.position );
        //b.axe.quaternion.copy( b.body.quaternion );

        var j = b.userData.NumWheels, w;

        if(b.userData.helper){
            if( j == 4 ){
                w = 8 * ( 4 + 1 );
                b.userData.helper.updateSuspension(AR[n+w+0], AR[n+w+1], AR[n+w+2], AR[n+w+3]);
            }
        }
        
        while(j--){

            w = 8 * ( j + 1 );
            //if( j == 1 ) steering = a[n+w];// for drive wheel
            //if( j == 1 ) b.axe.position.x = Cr[n+w];
            //if( j == 2 ) b.axe.position.y = Cr[n+w];
            //if( j == 3 ) b.axe.position.z = Cr[n+w];

            b.userData.w[j].position.fromArray( AR, n + w + 1 );
            b.userData.w[j].quaternion.fromArray( AR, n + w + 4 );

            //b.userData.w[j].position.set( Cr[n+w+1], Cr[n+w+2], Cr[n+w+3] );
            //b.userData.w[j].quaternion.set( Cr[n+w+4], Cr[n+w+5], Cr[n+w+6], Cr[n+w+7] );
        }
    });

};

View.prototype.getSofts = function(){

    return this.softs;

};

View.prototype.softStep = function( AR, N ){

    if( !this.softs.length ) return;

    var softPoints = N;

    this.softs.forEach( function( b, id ) {

        //if(Sr.length< softPoints+(b.points * 3) ) return;

        var n, c, cc, p, j, k, u;
        var g = b.geometry;
        var t = b.softType; // type of softBody
        var order = null;
        var isWithColor = g.attributes.color ? true : false;
        var isWithNormal = g.attributes.normal ? true : false;


        if( t === 2 ){ // rope

            j = g.positions.length;
            while( j-- ){
                n = softPoints + ( j * 3 );
                g.positions[j].set( AR[n], AR[n+1], AR[n+2] );
            }

            g.updatePath();

        } else {

            if( !g.attributes.position ) return;

            p = g.attributes.position.array;
            if( isWithColor ) c = g.attributes.color.array;

            if( t === 5 || t === 4 ){ // softTriMesh // softConvex

                var max = g.numVertices;
                var maxi = g.maxi;
                var pPoint = g.pPoint;
                var lPoint = g.lPoint;

                j = max;
                while(j--){
                    n = (j*3) + softPoints;
                    if( j == max-1 ) k = maxi - pPoint[j];
                    else k = pPoint[j+1] - pPoint[j];
                    var d = pPoint[j];
                    while(k--){
                        u = lPoint[d+k]*3;
                        p[u] = AR[n];
                        p[u+1] = AR[n+1]; 
                        p[u+2] = AR[n+2];
                    }
                }

            } else { // cloth // ellipsoid

                if( g.attributes.order ) order = g.attributes.order.array;
                j = p.length;

                n = 2;

                if( order !== null ) {

                    j = order.length;
                    while(j--){
                        k = order[j] * 3;
                        n = j*3 + softPoints;
                        p[k] = AR[n];
                        p[k+1] = AR[n+1];
                        p[k+2] = AR[n+2];

                        cc = Math.abs(AR[n+1]/10);
                        c[k] = cc;
                        c[k+1] = cc;
                        c[k+2] = cc;
                    }

                } else {
                     while(j--){
                         
                        p[j] = AR[ j + softPoints ];
                        if(n==1){ 
                            cc = Math.abs(p[j]/10);
                            c[j-1] = cc;
                            c[j] = cc;
                            c[j+1] = cc;
                        }
                        n--;
                        n = n < 0 ? 2 : n;
                    }

                }

            }

            if(t!==2) g.computeVertexNormals();

            if( isWithNormal ){

                var norm = g.attributes.normal.array;

                j = max;
                while(j--){
                    if( j == max-1 ) k = maxi - pPoint[j];
                    else k = pPoint[j+1] - pPoint[j];
                    var d = pPoint[j];
                    var ref = lPoint[d]*3;
                    while(k--){
                        u = lPoint[d+k]*3;
                        norm[u] = norm[ref];
                        norm[u+1] = norm[ref+1]; 
                        norm[u+2] = norm[ref+2];
                    }
                }

                g.attributes.normal.needsUpdate = true;
            }

            if( isWithColor ) g.attributes.color.needsUpdate = true;
            g.attributes.position.needsUpdate = true;
            
            g.computeBoundingSphere();

        }

        softPoints += b.points * 3;
    });

};

//--------------------------------------
//   RIGIDBODY
//--------------------------------------

View.prototype.add = function ( o ) {

	var isCustomGeometry = false;
    var isKinematic = false;

    var moveType = 1;
    if( o.move !== undefined ) moveType = 0;// dynamic
    if( o.density !== undefined ) moveType = 0;
    if( o.kinematic !== undefined ) moveType = 2;

    if(o.density!==undefined) o.mass = o.density;

    if(o.kinematic) isKinematic = true;
    

    o.mass = o.mass == undefined ? 0 : o.mass;
    o.type = o.type == undefined ? 'box' : o.type;

    // position
    o.pos = o.pos == undefined ? [0,0,0] : o.pos;

    // size
    o.size = o.size == undefined ? [1,1,1] : o.size;
    if(o.size.length == 1){ o.size[1] = o.size[0]; }
    if(o.size.length == 2){ o.size[2] = o.size[0]; }

    if(o.geoSize){
        if(o.geoSize.length == 1){ o.geoSize[1] = o.geoSize[0]; }
        if(o.geoSize.length == 2){ o.geoSize[2] = o.geoSize[0]; }
    }

    // rotation is in degree
    o.rot = o.rot == undefined ? [0,0,0] : Math.vectorad(o.rot);
    o.quat = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( o.rot ) ).toArray();

    if(o.rotA) o.quatA = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( Math.vectorad( o.rotA ) ) ).toArray();
    if(o.rotB) o.quatB = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( Math.vectorad( o.rotB ) ) ).toArray();

    if(o.angUpper) o.angUpper = Math.vectorad( o.angUpper );
    if(o.angLower) o.angLower = Math.vectorad( o.angLower );

    var mesh = null;

    if(o.type.substring(0,5) === 'joint') {

        ammo.send( 'add', o );
        return;

    }

    if(o.type === 'plane'){
        this.helper.position.set( o.pos[0], o.pos[1], o.pos[2] )
        ammo.send( 'add', o ); 
        return;
    }

    if(o.type === 'softTriMesh'){
        this.softTriMesh( o ); 
        return;
    }

    if(o.type === 'softConvex'){
        this.softConvex( o ); 
        return;
    }

    if(o.type === 'cloth'){
        this.cloth( o ); 
        return;
    }

    if(o.type === 'rope'){
        this.rope( o ); 
        return;
    }

    if(o.type === 'ellipsoid'){
        this.ellipsoid( o ); 
        return;
    }

    if(o.type === 'terrain'){
        this.terrain( o ); 
        return;
    }

    if( o.type === 'planet' ){
        this.planet( o ); 
        return;
    }

    
    

    var material;
    if(o.material !== undefined) material = this.mat[o.material];
    else material = o.mass ? this.mat.move : this.mat.statique;
    
    if( o.type === 'capsule' ){
        var g = new THREE.CapsuleBufferGeometry( o.size[0] , o.size[1]*0.5 );
        //g.applyMatrix(new THREE.Matrix4().makeRotationY(-Math.PI*0.5));
        mesh = new THREE.Mesh( g, material );
        this.extraGeo.push(mesh.geometry);
        isCustomGeometry = true;

    } else if( o.type === 'mesh' || o.type === 'convex' ){ 
        if(o.shape) {
            o.v = this.prepaGeometry( o.shape, o.type );
            this.extraGeo.push( o.shape );
        }
        if(o.geometry){

            mesh = new THREE.Mesh( o.geometry, material );
            this.extraGeo.push(o.geometry);
            
        } else {
            mesh = new THREE.Mesh( o.shape, material );
            //extraGeo.push(mesh.geometry);
        }
    } else {
        if(o.geometry){
            if(o.geoRot || o.geoScale) o.geometry = o.geometry.clone();
            // rotation only geometry
            if(o.geoRot){ o.geometry.applyMatrix(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler().fromArray(Math.vectorad(o.geoRot))));}

        
            // scale only geometry
            if(o.geoScale){ 
                o.geometry.applyMatrix( new THREE.Matrix4().makeScale( o.geoScale[0], o.geoScale[1], o.geoScale[2] ) );
                //material = mat['back'];//material.clone();
                //material.side = THREE.BackSide;
            }
        }

        if(o.mass === 0 && o.type === 'box' ) mesh = new THREE.Mesh( o.geometry || this.geo['hardbox'], material );
        else mesh = new THREE.Mesh( o.geometry || this.geo[o.type], material );

        if( o.geometry ){
            this.extraGeo.push(o.geometry);
            if(o.geoSize) mesh.scale.fromArray( o.geoSize );
            if(!o.geoSize && o.size) mesh.scale.fromArray( o.size );
            isCustomGeometry = true;
        }

    }


    if(mesh){

        if( !isCustomGeometry ) mesh.scale.fromArray( o.size );

        mesh.position.fromArray( o.pos );
        mesh.quaternion.fromArray( o.quat );

        mesh.receiveShadow = true;
        mesh.castShadow = moveType !== 1 ? true : false;

        //if( moveType !== 1 ){ mesh.castShadow = true; mesh.receiveShadow = true; }
        
        //view.setName( o, mesh );

        if( o.name === undefined ) o.name =  moveType !== 1 ? 'b'+ this.bodys.length : 'f'+ this.solids.length;
        mesh.name = o.name;

        if( o.parent !== undefined ) o.parent.add( mesh );
        else this.scene.add( mesh );

        
    }

    if( o.shape ) delete( o.shape );
    if( o.geometry ) delete( o.geometry );
    if( o.material ) delete( o.material );

    
    if( o.noPhy === undefined ){

        // push 
        if(mesh){
            if( o.mass===0 && !isKinematic ){

               // mesh.idx = view.setIdx( solids.length, 'solids' );
                //view.setName( o, mesh );

                this.solids.push( mesh );

            } else {

                //mesh.idx = view.setIdx( bodys.length, 'bodys' );
                //view.setName( o, mesh );

                this.bodys.push( mesh );

            };
        }

        // send to worker
        ammo.send( 'add', o );

    }

    if(mesh){ 
        if( o.name ) this.byName[ o.name ] = mesh;
        return mesh;
    }

};

//--------------------------------------
//   CHARACTER
//--------------------------------------

View.prototype.character = function ( o ) {

    o.size = o.size == undefined ? [0.25,2,2] : o.size;
    if(o.size.length == 1){ o.size[1] = o.size[0]; }
    if(o.size.length == 2){ o.size[2] = o.size[0]; }

    o.pos = o.pos === undefined ? [0,0,0] : o.pos;
    o.rot = o.rot == undefined ? [0,0,0] : Math.vectorad( o.rot );
    o.quat = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( o.rot ) ).toArray();

    var g = new THREE.CapsuleBufferGeometry( o.size[0], o.size[1]*0.5, 6 );

    var mesh = new THREE.Group();//o.mesh || new THREE.Mesh( g );

    if( o.debug ){

        var mm = new THREE.Mesh( g, this.mat.debug );
        this.extraGeo.push( g );
        mesh.add( mm )

    }

    //mesh.material = mat.hero;
    if( o.mesh ){

        //this.mat.hero.skinning = true;
        //mesh.userData.skin = true;

        var model = o.mesh;

        

        model.material = this.mat.hero;
        model.scale.multiplyScalar( o.scale || 1 );
        model.position.set(0,0,0);
        
        model.setTimeScale( 0.5 );
        model.play(0);

        mesh.add( model );
        mesh.skin = model;

        //this.extraGeo.push( mesh.skin.geometry );
        
    } else {

        var mx = new THREE.Mesh( g, this.mat.hero );
        this.extraGeo.push( g );
        mesh.add( mx );

    }
    


    

    mesh.userData.speed = 0;
    mesh.userData.type = 'hero';
    mesh.userData.id = this.heros.length;

     // copy rotation quaternion
    mesh.position.fromArray( o.pos );
    mesh.quaternion.fromArray( o.quat );

    

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    //mesh.idx = view.setIdx( heros.length, 'heros' );
    //view.setName( o, mesh );
    if( o.name ) this.byName[ o.name ] = mesh;

    this.scene.add( mesh );
    this.heros.push( mesh );

    

    if( o.mesh ) delete( o.mesh );

    // send to worker
    ammo.send( 'character', o );

};

//--------------------------------------
//   VEHICLE
//--------------------------------------

View.prototype.setDriveCar = function ( name ) {

    ammo.send('setDriveCar', { n:this.byName[name].userData.id });

},

View.prototype.vehicle = function ( o ) {

	//this.getControls().cam.rotationOffset = 90;

    //var type = o.type || 'box';
    var size = o.size || [2,0.5,4];
    var pos = o.pos || [0,0,0];
    var rot = o.rot || [0,0,0];

    var wPos = o.wPos || [1, 0, 1.6];

    o.masscenter = o.masscenter == undefined ? [0,0,0] : o.masscenter;

    //var masscenter = o.masscenter || [0,0.25,0];

    Math.vectorad( rot );

    // chassis
    var mesh;
    if( o.mesh ){ 
        mesh = o.mesh;
        var k = mesh.children.length;
            while(k--){
                mesh.children[k].position.fromArray( o.masscenter ).negate();//.set( -masscenter[0], -masscenter[1], -masscenter[2] );
                //mesh.children[k].geometry.translate( masscenter[0], masscenter[1], masscenter[2] );
                mesh.children[k].castShadow = true;
                mesh.children[k].receiveShadow = true;
            }
    } else {
        var g = new THREE.BufferGeometry().fromGeometry( new THREE.BoxGeometry(size[0], size[1], size[2]) );//geo.box;
        g.translate( -o.masscenter[0], -o.masscenter[1], -o.masscenter[2] );
        this.extraGeo.push( g );
        mesh = new THREE.Mesh( g, this.mat.move );
    } 
    

    //mesh.scale.set( size[0], size[1], size[2] );
    mesh.position.set( pos[0], pos[1], pos[2] );
    mesh.rotation.set( rot[0], rot[1], rot[2] );

    // copy rotation quaternion
    o.quat = mesh.quaternion.toArray();

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    

    this.scene.add( mesh );

    //mesh.idx = view.setIdx( cars.length, 'cars' );
    //view.setName( o, mesh );

    if( o.name ) this.byName[ o.name ] = mesh;

    mesh.userData.speed = 0;
    mesh.userData.steering = 0;
    mesh.userData.NumWheels = o.nw || 4;
    mesh.userData.type = 'car';

    

    // wheels

    var radius = o.radius || 0.4;
    var deep = o.deep || 0.3;
    wPos = o.wPos || [1, -0.25, 1.6];

    var w = [];

    var needScale = o.wheel == undefined ? true : false;

    var gw = o.wheel || this.geo['wheel'];
    var gwr = gw.clone();
    gwr.rotateY( Math.Pi );
    this.extraGeo.push( gwr );

    var i = o.nw || 4;
    while(i--){
        if(i==1 || i==2) w[i] = new THREE.Mesh( gw, this.mat.move );
        else w[i] = new THREE.Mesh( gwr, this.mat.move );
        if( needScale ) w[i].scale.set( deep, radius, radius );
        else w[i].material = this.mat.move;//mat.cars;

        w[i].castShadow = true;
        w[i].receiveShadow = true;

        this.scene.add( w[i] );
    }

    mesh.userData.w = w;

    if(o.helper){
        mesh.userData.helper = new THREE.CarHelper( wPos, o.masscenter, deep );
        mesh.add( mesh.userData.helper );
    }

    //var car = { body:mesh, w:w, axe:helper.mesh, nw:o.nw || 4, helper:helper, speed:0 };

    this.cars.push( mesh );

    mesh.userData.id = this.cars.length-1;
    //carsSpeed.push( 0 );



    if( o.mesh ) o.mesh = null;
    if( o.wheel ) o.wheel = null;

    if ( o.type == 'mesh' || o.type == 'convex' ) o.v = this.prepaGeometry( o.shape, o.type );

    if( o.shape ) delete(o.shape);
    if( o.mesh ) delete(o.mesh);

    // send to worker
    ammo.send( 'vehicle', o );

};

//--------------------------------------
//   SOFT TRI MESH
//--------------------------------------

View.prototype.softTriMesh = function ( o ) {

    //console.log(o.shape)

    //if(o.shape.bones) 

    var g = o.shape.clone();
    var pos = o.pos || [0,0,0];
    var size = o.size || [1,1,1];
    var rot = o.rot || [0,0,0];

    g.translate( pos[0], pos[1], pos[2] );
    g.scale( size[0], size[1], size[2] );

    //g.rotateX( rot[0] *= Math.degtorad );
    //g.rotateY( rot[1] *= Math.degtorad );
    //g.rotateZ( rot[2] *= Math.degtorad );
    g.applyMatrix( new THREE.Matrix4().makeRotationY(rot[1] *= Math.torad ));

    
    

    //console.log('start', g.getIndex().count);

    view.prepaGeometry( g );

    this.extraGeo.push( g );

    //console.log('mid', g.realIndices.length);


    o.v = g.realVertices;
    o.i = g.realIndices;
    o.ntri = g.numFaces;

    var material = o.material === undefined ? this.mat.soft : this.mat[o.material];
    var mesh = new THREE.Mesh( g, material );

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    mesh.softType = 5;
    mesh.points = o.v.length / 3;

    //mesh.idx = view.setIdx( softs.length, 'softs' );
    //view.setName( o, mesh );

    if( o.name ) this.byName[ o.name ] = mesh;

    this.scene.add( mesh );
    this.softs.push( mesh );

    if( o.shape ) delete(o.shape);
    if( o.material ) delete(o.material);

    // send to worker
    ammo.send( 'add', o );
    
};

//--------------------------------------
//   SOFT CONVEX
//--------------------------------------

View.prototype.softConvex = function ( o ) {

    var g = o.shape;
    var pos = o.pos || [0,0,0];

    g.translate( pos[0], pos[1], pos[2] );

    view.prepaGeometry(g);

    o.v = g.realVertices;

    var mesh = new THREE.Mesh( g, this.mat.soft );
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    mesh.softType = 4;
    mesh.points = o.v.length / 3;

    mesh.idx = view.setIdx( softs.length, 'softs' );
    view.setName( o, mesh );

    scene.add( mesh );
    softs.push( mesh );

    // send to worker
    ammo.send( 'add', o );

};

//--------------------------------------
//   CLOTH
//--------------------------------------

View.prototype.cloth = function ( o ) {

    var i, x, y, n;

    var div = o.div || [16,16];
    var size = o.size || [100,0,100];
    var pos = o.pos || [0,0,0];

    var max = div[0] * div[1];

    var g = new THREE.PlaneBufferGeometry( size[0], size[2], div[0] - 1, div[1] - 1 );
    g.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( max*3 ), 3 ) );
    g.rotateX( -Math.PI90 );
    //g.translate( -size[0]*0.5, 0, -size[2]*0.5 );

    //var numVerts = g.attributes.position.array.length / 3;

    var mesh = new THREE.Mesh( g, this.mat.soft );

    //mesh.idx = view.setIdx( softs.length, 'softs' );

    //view.setName( o, mesh );
    if( o.name ) this.byName[ o.name ] = mesh;

   // mesh.material.needsUpdate = true;
    mesh.position.set( pos[0], pos[1], pos[2] );

    mesh.castShadow = true;
    mesh.receiveShadow = true;//true;
    //mesh.frustumCulled = false;

    mesh.softType = 1;
    mesh.points = g.attributes.position.array.length / 3;

    this.scene.add( mesh );
    this.softs.push( mesh );

    o.size = size;
    o.div = div;
    o.pos = pos;

    // send to worker
    ammo.send( 'add', o );

};

//--------------------------------------
//   ROPE
//--------------------------------------

View.prototype.rope = function ( o ) {

    //var max = o.numSegment || 10;
    //var start = o.start || [0,0,0];
    //var end = o.end || [0,10,0];

   // max += 2;
    /*var ropeIndices = [];

    //var n;
    //var pos = new Float32Array( max * 3 );
    for(var i=0; i<max-1; i++){

        ropeIndices.push( i, i + 1 );

    }*/

    if( o.numSeg === undefined ) o.numSeg = o.numSegment;

    /*var g = new THREE.BufferGeometry();
    g.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
    g.addAttribute('position', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
    g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));

    //var mesh = new THREE.LineSegments( g, new THREE.LineBasicMaterial({ vertexColors: true }));
    var mesh = new THREE.LineSegments( g, new THREE.LineBasicMaterial({ color: 0xFFFF00 }));*/

    //var g = new THREE.Tubex( o, o.numSeg || 10, o.radius || 0.2, o.numRad || 6, false );
    var g = new THREE.Tubular( o, o.numSeg || 10, o.radius || 0.2, o.numRad || 6, false );

    //console.log(g.positions.length)

    var mesh = new THREE.Mesh( g, this.mat.soft );

    if( o.name ) this.byName[ o.name ] = mesh;

    //mesh.idx = view.setIdx( softs.length, 'softs' );

    //this.setName( o, mesh );


    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.softType = 2;
    mesh.points = g.positions.length;

    this.scene.add( mesh );
    this.softs.push( mesh );

    // send to worker
    ammo.send( 'add', o );

};

//--------------------------------------
//   ELLIPSOID 
//--------------------------------------

View.prototype.ellipsoid = function ( o ) {

    // send to worker
    ammo.send( 'add', o );

};

View.prototype.ellipsoidMesh = function ( o ) {

    var max = o.lng;
    var points = [];
    var ar = o.a;
    var i, j, k, v, n;
    
    // create temp convex geometry and convert to buffergeometry
    for( i = 0; i<max; i++ ){
        n = i*3;
        points.push(new THREE.Vector3(ar[n], ar[n+1], ar[n+2]));
    }
    var gt = new THREE.ConvexGeometry( points );

    
    var indices = new Uint32Array( gt.faces.length * 3 );
    var vertices = new Float32Array( max * 3 );
    var order = new Float32Array( max );
    //var normals = new Float32Array( max * 3 );
    //var uvs  = new Float32Array( max * 2 );

    

     // get new order of vertices
    v = gt.vertices;
    i = max;
    //var v = gt.vertices;
    //var i = max, j, k;
    while(i--){
        j = max;
        while(j--){
            n = j*3;
            if(ar[n]==v[i].x && ar[n+1]==v[i].y && ar[n+2]==v[i].z) order[j] = i;
        }
    }

   
    i = max
    while(i--){
        n = i*3;
        k = order[i]*3;

        vertices[k] = ar[n];
        vertices[k+1] = ar[n+1];
        vertices[k+2] = ar[n+2];

    }

    // get indices of faces
    i = gt.faces.length;
    while(i--){
        n = i*3;
        var face = gt.faces[i];
        indices[n] = face.a;
        indices[n+1] = face.b;
        indices[n+2] = face.c;
    }

    //console.log(gtt.vertices.length)
    var g = new THREE.BufferGeometry();
    g.setIndex( new THREE.BufferAttribute( indices, 1 ) );
    g.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
    g.addAttribute('order', new THREE.BufferAttribute( order, 1 ));
    
    //g.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
    //g.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );

    g.computeVertexNormals();

    this.extraGeo.push( g );


    gt.dispose();


    //g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
    var mesh = new THREE.Mesh( g, this.mat.soft );

    //mesh.idx = view.setIdx( softs.length, 'softs' );

    if( o.name ) this.byName[ o.name ] = mesh;

    //this.setName( o, mesh );

    mesh.softType = 3;
    mesh.points = g.attributes.position.array.length / 3;

    //console.log( mesh.points )

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.scene.add( mesh );
    this.softs.push( mesh );

};

//--------------------------------------
//
//   TERRAIN
//
//--------------------------------------

View.prototype.terrain = function ( o ) {

    o.sample = o.sample == undefined ? [64,64] : o.sample;
    o.pos = o.pos == undefined ? [0,0,0] : o.pos;
    o.complexity = o.complexity == undefined ? 30 : o.complexity;

    var mesh = new Terrain( o );

    mesh.position.fromArray( o.pos );

    this.scene.add( mesh );
    this.solids.push( mesh );


    o.heightData = mesh.heightData32;

    o.offset = 0;

    if( o.name ) this.byName[ o.name ] = mesh;

    // send to worker
    ammo.send( 'add', o );

};


View.prototype.updateTerrain = function (name){

    var t = this.byName[ name ];

    if(t.isWater){ t.local.y +=0.2; t.update() }
    else t.easing();

    ammo.send( 'terrain', { name:name, heightData: t.heightData32 } );

};


//--------------------------------------
//
//   PLANETE
//
//--------------------------------------

View.prototype.planet = function ( o ) {

    var mesh = new Planet( o );

    this.scene.add( mesh );
    this.solids.push( mesh );

    o.type = 'mesh';

    o.v = this.prepaGeometry( mesh.geometry, 'mesh' );
    this.extraGeo.push( mesh.geometry );

    // send to worker
    ammo.send( 'add', o );

}