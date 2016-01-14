THREE.CarHelper = function ( p ) {

    var s = 0.2;
    var d = 0.5;

    this.py = p[1];

    var vertices = new Float32Array( [
        -s, 0, 0,  s, 0, 0,
        0, 0, 0,  0, s*2, 0,
        0, 0, -s,  0, 0, s,

        p[0]*d, p[1], p[2],    p[0]*d, p[1]+1, p[2],
        -p[0]*d, p[1], p[2],   -p[0]*d, p[1]+1, p[2],
        -p[0]*d, p[1],-p[2],   -p[0]*d, p[1]+1, -p[2],
        p[0]*d, p[1], -p[2],    p[0]*d, p[1]+1, -p[2],
    ] );

    var colors = new Float32Array( [
        1, 1, 0,  1, 1, 0,
        1, 1, 0,  0, 1, 0,
        1, 1, 0,  1, 1, 0,

        1,1,0,    1,1,0,
        1,1,0,    1,1,0,
        1,1,0,    1,1,0,
        1,1,0,    1,1,0,
    ] );

    this.geometry = new THREE.BufferGeometry();
    this.geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    this.geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

    this.positions = this.geometry.attributes.position.array;

    this.material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors, name:'helper' } );

    THREE.LineSegments.call( this, this.geometry, this.material );

};

THREE.CarHelper.prototype = Object.create( THREE.LineSegments.prototype );
THREE.CarHelper.prototype.constructor = THREE.CarHelper;

THREE.CarHelper.prototype.dispose = function () {

    this.geometry.dispose();
    this.material.dispose();

};

THREE.CarHelper.prototype.updateSuspension = function ( s0, s1, s2, s3 ) {

    this.positions[22] = this.py-s0;
    this.positions[28] = this.py-s1;
    this.positions[34] = this.py-s2;
    this.positions[40] = this.py-s3;

    this.geometry.attributes.position.needsUpdate = true;

};