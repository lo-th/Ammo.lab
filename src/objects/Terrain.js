THREE.Terrain = function ( o, perlin ) {

    o = o == undefined ? {} : o;

    this.div = o.div == undefined ? [64,64] : o.div;
    this.size = o.size == undefined ? [100,10,100] : o.size;

    this.colorBase = { r:1, g:0.7, b:0 };

    // for perlin
    this.complexity = o.complexity == undefined ? 30 : o.complexity;
    this.complexity2 = o.complexity2 == undefined ? 60 : o.complexity2;

    this.local = new THREE.Vector3();
    if(o.local) this.local.fromArray( o.local );

    this.lng = this.div[0] * this.div[1];
    this.hdata = new Float32Array( this.lng );

    this.perlin = perlin == undefined ? new Perlin() : perlin;

    this.colors = new Float32Array( this.lng * 3 );
    this.geometry = new THREE.PlaneBufferGeometry( this.size[0], this.size[2], this.div[0] - 1, this.div[1] - 1 );
    this.geometry.rotateX( -Math.PI * 0.5 );
    this.geometry.computeBoundingSphere();

    this.geometry.addAttribute( 'color', new THREE.BufferAttribute( this.colors, 3 ) );
    this.vertices = this.geometry.attributes.position.array;

    this.material = new THREE.MeshStandardMaterial({ vertexColors: THREE.VertexColors, name:'terrain', metalness:1, roughness:0.3, wireframe:false });

    this.update();


    THREE.Mesh.call( this, this.geometry, this.material );

    this.castShadow = false;
    this.receiveShadow = true;

};

THREE.Terrain.prototype = Object.create( THREE.Mesh.prototype );
THREE.Terrain.prototype.constructor = THREE.Terrain;

THREE.Terrain.prototype.dispose = function () {

    this.geometry.dispose();
    this.material.dispose();
    
}

THREE.Terrain.prototype.setEnvMap = function ( map ) {

    this.material.envMap = map;
}

THREE.Terrain.prototype.move = function () {

    this.update();
}

THREE.Terrain.prototype.clamp = function (v, min, max) {
    v = v < min ? min : v;
    v = v > max ? max : v;
    return v;
}

THREE.Terrain.prototype.norm = function (v, min, max) {
    //v = v < min ? min : v;
    //v = v > max ? max : v;
    return (v - min) / (max - min);
}
THREE.Terrain.prototype.linear = function (a, n0, n1) {
    return ((1.0 - a) * (n0)) + (a * (n1));
}
THREE.Terrain.prototype.cubicSCurve = function (a) {
     a = (a);
        return (a * a * (3.0 - 2.0 * a));
}
THREE.Terrain.prototype.quinticSCurve = function (a) {
     a = (a);
        var a3 = (a * a * a);
        var a4 = (a3 * a);
        var a5 = (a4 * a);
        return ((6.0 * a5) - (15.0 * a4) + (10.0 * a3));
}

THREE.Terrain.prototype.update = function () {

    var sc = 1 / this.complexity;
    var sc2 = 1 / this.complexity2;
    var r = 1 / this.div[0];
    var rx = (this.div[0] - 1) / this.size[0];
    var rz = (this.div[1] - 1) / this.size[2];

    var i = this.lng, n, x, y, c, c1, c2;
    while(i--){
        n = i * 3;
        x = i % this.div[0];
        y = ~~ ( i * r );

        /*
        // from -1 to 1
        c1 = this.perlin.noise( (x+(this.local.x*rx))*sc, (y+(this.local.z*rz))*sc ); 
        c2 = this.perlin.noise( (x+100+(this.local.x*rx))*sc2, (y+100+(this.local.z*rz))*sc2 );
        c = 0.5 + ((c1*c2) * 0.5);
        */
        
        
        // from 0 to 1
        c1 = 0.5 + ( this.perlin.noise( (x+(this.local.x*rx))*sc, (y+(this.local.z*rz))*sc ) * 0.5); 
        c2 = 0.5 + ( this.perlin.noise( (x+100+(this.local.x*rx))*sc2, (y+100+(this.local.z*rz))*sc2 ) * 0.5);
        //c = c1*c2;

        c = Math.min(c1,c2);
        //c = Math.max(c1,c2);
        //c = Math.pow(c1,c2);

        //c = this.norm(c, 0.3, 0.5);
        c = this.linear(c, 0, 0.7);
        //c = this.cubicSCurve(c);
        c = this.quinticSCurve(c);

         //c = this.clamp(c, 0, 1);
        
        this.hdata[ i ] = c * this.size[ 1 ]; // final h size
        this.vertices[ n + 1 ] = this.hdata[i];
        this.colors[ n ] = c * this.colorBase.r;
        this.colors[ n + 1 ] = c * this.colorBase.g;
        this.colors[ n + 2 ] = c * this.colorBase.b;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    
    //this.geometry.computeBoundingSphere();
    this.geometry.computeVertexNormals();



}