/**
 * @author lth / https://github.com/lo-th/
 */

THREE.ViewUtils = {

    mergeGeometryArray : function( geos ){

        var tmp = [];
        var i = geos.length;
        while(i--){
            tmp[i] = new THREE.Geometry().fromBufferGeometry( geos[i] );
            //tmp[i].mergeVertices();
        }

        var g = new THREE.Geometry();

        while( tmp.length > 0 ){
            i = tmp.pop();
            g.merge(i);
            i.dispose();
        }

        g.mergeVertices();

        var geometry = new THREE.BufferGeometry().fromGeometry( g );
        g.dispose();

        return geometry;

    },



    prepaGeometry : function ( g, type ) {

        var verticesOnly = false;
        var facesOnly = false;

        if(type == 'mesh') facesOnly = true;
        if(type == 'convex') verticesOnly = true;

        var i, j, n, p, n2;

        var tmpGeo = new THREE.Geometry().fromBufferGeometry( g );
        tmpGeo.mergeVertices();

        var totalVertices = g.attributes.position.array.length/3;
        var numVertices = tmpGeo.vertices.length;
        var numFaces = tmpGeo.faces.length;

        g.realVertices = new Float32Array( numVertices * 3 );
        g.realIndices = new ( numFaces * 3 > 65535 ? Uint32Array : Uint16Array )( numFaces * 3 );

        i = numVertices;
        while(i--){
            p = tmpGeo.vertices[ i ];
            n = i * 3;
            g.realVertices[ n ] = p.x;
            g.realVertices[ n + 1 ] = p.y;
            g.realVertices[ n + 2 ] = p.z;
        }

        if(verticesOnly){ 
            tmpGeo.dispose();
            return g.realVertices;
        }

        i = numFaces;
        while(i--){
            p = tmpGeo.faces[ i ];
            n = i * 3;
            g.realIndices[ n ] = p.a;
            g.realIndices[ n + 1 ] = p.b;
            g.realIndices[ n + 2 ] = p.c;
        }

        tmpGeo.dispose();

        //g.realIndices = g.getIndex();
        //g.setIndex(g.realIndices);

        if(facesOnly){ 
            var faces = [];
            i = g.realIndices.length;
            while(i--){
                n = i * 3;
                p = g.realIndices[i]*3;
                faces[n] = g.realVertices[ p ];
                faces[n+1] = g.realVertices[ p+1 ];
                faces[n+2] = g.realVertices[ p+2 ];
            }
            return faces;
        }

        // find same point
        var ar = [];
        var pos = g.attributes.position.array;
        i = numVertices;
        while(i--){
            n = i*3;
            ar[i] = [];
            j = totalVertices;
            while(j--){
                n2 = j*3;
                if( pos[n2] == g.realVertices[n] && pos[n2+1] == g.realVertices[n+1] && pos[n2+2] == g.realVertices[n+2] ) ar[i].push(j);
            }
        }

        // generate same point index
        var pPoint = new ( numVertices > 65535 ? Uint32Array : Uint16Array )( numVertices );
        var lPoint = new ( totalVertices > 65535 ? Uint32Array : Uint16Array )( totalVertices );

        p = 0;
        for(i=0; i<numVertices; i++){
            n = ar[i].length;
            pPoint[i] = p;
            j = n;
            while(j--){ lPoint[p+j] = ar[i][j]; }
            p += n;
        }

        g.numFaces = numFaces;
        g.numVertices = numVertices;
        g.maxi = totalVertices;
        g.pPoint = pPoint;
        g.lPoint = lPoint;

    },





}