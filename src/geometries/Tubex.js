
/**
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Creates a tube which extrudes along a 3d spline.
 *
 */

THREE.Tubex = function ( pp, tubularSegments, radius, radialSegments, closed, CurveType ) {

    THREE.BufferGeometry.call( this );

    this.type = 'Tubex';

    this.tubularSegments = tubularSegments || 64;
    this.radius = radius || 1;
    this.radialSegments = radialSegments || 8;
    this.closed = closed || false;

    if( pp instanceof Array ) this.positions = pp;
    else {

        this.positions = [];

        var start = new THREE.Vector3().fromArray(pp.start);
        var end = new THREE.Vector3().fromArray(pp.end);
        var mid = end.clone().sub(start);
        var lng = pp.numSegment-1;

        this.positions.push( start );

        for( var i = 1; i < lng; i++ ){

            this.positions.push( new THREE.Vector3( (mid.x/lng)*i, (mid.y/lng)*i, (mid.z/lng)*i).add(start) );

        }

        this.positions.push( end );

    }

    this.path = new THREE.CatmullRomCurve3( this.positions );
    // 'catmullrom', 'centripetal', 'chordal'
    var curveType = CurveType || 'catmullrom'; 
    this.path.type = curveType;
    this.path.closed = this.closed;

    this.frames = this.path.computeFrenetFrames( this.tubularSegments, this.closed );

    // helper variables

    this.vertex = new THREE.Vector3();
    this.normal = new THREE.Vector3();
    this.uv = new THREE.Vector2();

    // buffer

    this.vertices = [];
    this.colors = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];

    // create buffer data

    this.generateBufferData();

    // build geometry

    this.setIndex( new ( this.indices.length > 65535 ? THREE.Uint32BufferAttribute : THREE.Uint16BufferAttribute )( this.indices, 1 ) );
    this.addAttribute( 'position', new THREE.Float32BufferAttribute( this.vertices, 3 ) );
    this.addAttribute( 'color', new THREE.Float32BufferAttribute( this.colors, 3 ) );
    this.addAttribute( 'normal', new THREE.Float32BufferAttribute( this.normals, 3 ) );
    this.addAttribute( 'uv', new THREE.Float32BufferAttribute( this.uvs, 2 ) );

}

THREE.Tubex.prototype = Object.create( THREE.BufferGeometry.prototype );
THREE.Tubex.prototype.constructor = THREE.Tubex;

THREE.Tubex.prototype.generateBufferData = function () {

    for ( var i = 0; i < this.tubularSegments; i ++ ) {

        this.generateSegment( i );

    }

    // if the geometry is not closed, generate the last row of vertices and normals
    // at the regular position on the given path
    //
    // if the geometry is closed, duplicate the first row of vertices and normals (uvs will differ)

    this.generateSegment( ( this.closed === false ) ? this.tubularSegments : 0 );

    // uvs are generated in a separate function.
    // this makes it easy compute correct values for closed geometries

    this.generateIndicesAndUv();

    // finally create faces

    //this.generateIndices();

};

THREE.Tubex.prototype.generateSegment = function ( i ) {

    // we use getPointAt to sample evenly distributed points from the given path

    var P = this.path.getPointAt( i / this.tubularSegments );

    // retrieve corresponding normal and binormal

    var N = this.frames.normals[ i ];
    var B = this.frames.binormals[ i ];

    // generate normals and vertices for the current segment

    for ( var j = 0; j <= this.radialSegments; j ++ ) {

        var v = j / this.radialSegments * Math.PI * 2;

        var sin =   Math.sin( v );
        var cos = - Math.cos( v );

        // normal

        this.normal.x = ( cos * N.x + sin * B.x );
        this.normal.y = ( cos * N.y + sin * B.y );
        this.normal.z = ( cos * N.z + sin * B.z );
        this.normal.normalize();

        this.normals.push( this.normal.x, this.normal.y, this.normal.z );

        // vertex

        this.vertex.x = P.x + this.radius * this.normal.x;
        this.vertex.y = P.y + this.radius * this.normal.y;
        this.vertex.z = P.z + this.radius * this.normal.z;

        this.vertices.push( this.vertex.x, this.vertex.y, this.vertex.z );

        // colors

        this.colors.push( 1, 1, 1 );

    }

}

THREE.Tubex.prototype.generateIndicesAndUv = function (  ) {

    for ( var i = 0; i <= this.tubularSegments; i ++ ) {

        for ( var j = 0; j <= this.radialSegments; j ++ ) {

            if( j > 0 && i > 0 ) {

                var a = ( this.radialSegments + 1 ) * ( i - 1 ) + ( j - 1 );
                var b = ( this.radialSegments + 1 ) * i + ( j - 1 );
                var c = ( this.radialSegments + 1 ) * i + j;
                var d = ( this.radialSegments + 1 ) * ( i - 1 ) + j;

                // faces

                this.indices.push( a, b, d );
                this.indices.push( b, c, d );
            }

            // uv

            this.uv.x = i / this.tubularSegments;
            this.uv.y = j / this.radialSegments;

            this.uvs.push( this.uv.x, this.uv.y );

        }

    }

}

THREE.Tubex.prototype.updatePath = function ( path ) {

    //this.path = path;

    this.frames = this.path.computeFrenetFrames( this.tubularSegments, this.closed );

    this.normals = this.attributes.normal.array;
    this.vertices = this.attributes.position.array;
    this.colors = this.attributes.color.array;
    

    for ( var i = 0; i < this.tubularSegments; i ++ ) {

        this.updateSegment( i );

    }

    // if the geometry is not closed, generate the last row of vertices and normals
    // at the regular position on the given path
    //
    // if the geometry is closed, duplicate the first row of vertices and normals (uvs will differ)

    this.updateSegment( ( this.closed === false ) ? this.tubularSegments : 0 );

    


    this.attributes.color.needsUpdate = true;
    this.attributes.position.needsUpdate = true;
    this.attributes.normal.needsUpdate = true;
   

}

THREE.Tubex.prototype.updateUV = function () {

    this.uvs = this.attributes.uv.array;

    var n, n2;

    for ( var i = 0; i <= this.tubularSegments; i ++ ) {

        n = (i*2) * (this.radialSegments+1);

        for ( var j = 0; j <= this.radialSegments; j ++ ) {

            n2 = j * 2;

            this.uv.x = i / this.tubularSegments;
            this.uv.y = j / this.radialSegments;

            this.uvs[n + n2] = this.uv.x
            this.uvs[n + n2 + 1] = this.uv.y;

        }

    }

     this.attributes.uv.needsUpdate = true;

}

THREE.Tubex.prototype.updateSegment = function ( i ) {

    // we use getPointAt to sample evenly distributed points from the given path

    var n = (i*3) * (this.radialSegments+1), n2;

    var P = this.path.getPointAt( i / this.tubularSegments );

    // retrieve corresponding normal and binormal

    var N = this.frames.normals[ i ];
    var B = this.frames.binormals[ i ];

    // generate normals and vertices for the current segment

    for ( var j = 0; j <= this.radialSegments; j ++ ) {

        var v = j / this.radialSegments * Math.PI * 2;

        n2 = j * 3;

        var sin =   Math.sin( v );
        var cos = - Math.cos( v );

        // normal

        this.normal.x = ( cos * N.x + sin * B.x );
        this.normal.y = ( cos * N.y + sin * B.y );
        this.normal.z = ( cos * N.z + sin * B.z );
        this.normal.normalize();

        this.normals[n + n2] =  this.normal.x;
        this.normals[n + n2 +1] =  this.normal.y;
        this.normals[n + n2 +2] =  this.normal.z;

        // vertex

        this.vertices[n + n2] =  P.x + this.radius * this.normal.x;
        this.vertices[n + n2 +1] =  P.y + this.radius * this.normal.y;
        this.vertices[n + n2 +2] =  P.z + this.radius * this.normal.z;

        // color

        this.colors[n + n2] = Math.abs(this.normal.x);
        this.colors[n + n2 +1] = Math.abs(this.normal.y);
        this.colors[n + n2 +2] = Math.abs(this.normal.z);

    }

    

}
