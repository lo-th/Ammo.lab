var pool = ( function () {

    'use strict';

    var results = {};
    var urls = null;
    var callback = null;
    
    var inLoading = false;
    var seaLoader = null;
    var readers = null;
    var URL = (window.URL || window.webkitURL);

    var start = 0;
    var end = 0;

    pool = {

        load: function( Urls, Callback ){

            urls = [];

            start = ( typeof performance === 'undefined' ? Date : performance ).now();

            if ( typeof Urls == 'string' || Urls instanceof String ) urls.push( Urls );// = [ Urls ];
            else urls = urls.concat( Urls );

            callback = Callback || function(){};

            //results = {};

            inLoading = true;

            this.loadOne();

        },

        setAssetLoadTechnique: function( callback ) {

            this.loading = callback;

        },

        reset: function (){

            results = null;
            callback = null;

        },

        get: function ( name ){

            return results[name];

        },

        getResult : function(){

            return results;

        },

        meshByName : function ( name ){

            var ar = results[ name ];
            var meshs = {}
            var i = ar.length;

            while(i--){
                meshs[ ar[i].name ] = ar[i];
            }

            return meshs;

        },

        getMesh : function ( name, meshName ){

            var ar = results[name];
            var i = ar.length;
            while(i--){
                if( ar[i].name === meshName ) return ar[i];
            }

        },

        next: function () {

            urls.shift();
            if( urls.length === 0 ){ 

                inLoading = false;

                end = ( typeof performance === 'undefined' ? Date : performance ).now() - start;
                console.log( 'loading time v2:', Math.floor(end), 'ms' );

                callback( results );

            }
            else this.loadOne();

        },

        loadOne: function(){

            var link = urls[0];
            var name = link.substring( link.lastIndexOf('/')+1, link.lastIndexOf('.') );
            var type = link.substring( link.lastIndexOf('.')+1 );
            this.loading( link, name, type );

        },

        progress: function ( loaded, total ) {

        },

        loading: function ( link, name, type ) {

            var self = this;

            var xhr = new XMLHttpRequest();
            xhr.open('GET', link, true );

            switch( type ){

                case 'sea': case 'z': case 'bvh': case 'BVH': xhr.responseType = "arraybuffer"; break;
                case 'jpg': case 'png': xhr.responseType = 'blob'; break;

            }
            
            //xhr.responseType = 'blob';
            //xhr.onload = function() { self.load_blob( xhr.response, name, type ); }
            //xhr.onload = function() { self.load_direct( xhr.response, name, type ); }

            xhr.onprogress = function ( e ) {

                if ( e.lengthComputable ) self.progress( e.loaded, e.total );

            };

            xhr.onreadystatechange = function () {

                if ( xhr.readyState === 2 ) { //xhr.getResponseHeader("Content-Length");
                } else if ( xhr.readyState === 3 ) { //  progress
                } else if ( xhr.readyState === 4 ) {
                    if ( xhr.status === 200 || xhr.status === 0 ) self.load_direct( xhr.response, name, type );
                    else console.error( "Couldn't load ["+ name + "] [" + xhr.status + "]" );
                }

            };
            
            xhr.send( null );

        },

        //

        load_direct: function ( response, name, type ) {

            var self = this;

            switch( type ){
     
                case 'sea':

                    var lll = new THREE.SEA3D();

                    lll.onComplete = function( e ) { 
                        results[name] = lll.meshes;
                        self.next();
                    }

                    lll.load( response );
                    //lll.file.read( response );

                break;
                case 'jpg': case 'png':

                    var img = new Image();
                    img.onload = function(e) {
                        URL.revokeObjectURL( img.src ); // Clean up after yourself.
                        results[name] = img;
                        self.next();
                    };

                    img.src = URL.createObjectURL( response );
                    

                break;
                case 'z':

                    results[name] = SEA3D.File.LZMAUncompress( response );
                    self.next();

                break;
                case 'bvh': case 'BVH':

                    results[name] = response;
                    self.next();

                break;

                case 'glsl':

                    results[name] = response;
                    self.next();

                break;

                case 'json':

                    results[name] = JSON.parse( response );
                    self.next();

                break;

            }

        },

        ///  

        load_blob: function ( blob, name, type ) {

            var self = this;
            var reader = readers || new FileReader();

            if( type === 'png' || type === 'jpg' ) reader.readAsDataURL( blob );
            else if( type === 'json' || type === 'glsl' ) reader.readAsText( blob );
            else reader.readAsArrayBuffer( blob );

            reader.onload = function(e) {

                switch( type ){
 
                    case 'sea':

                        var lll = new THREE.SEA3D();

                        lll.onComplete = function( e ) { 
                            results[name] = lll.meshes;
                            self.next(); 
                        }

                        lll.load( e.target.result );
                        //lll.file.read( e.target.result );

                    break;
                    case 'jpg': case 'png':

                        results[name] = new Image();
                        results[name].src = e.target.result;
                        self.next();

                    break;
                    case 'z':

                        results[name] = SEA3D.File.LZMAUncompress( e.target.result );
                        self.next();

                    break;
                    case 'bvh': case 'BVH':

                        results[name] = e.target.result;
                        self.next();

                    break;

                    case 'glsl':

                        results[name] = e.target.result;
                        self.next();

                    break;

                    case 'json':

                        results[name] = JSON.parse( e.target.result );
                        self.next();

                    break;

                }

            }

        }

    };

    return pool;

})();