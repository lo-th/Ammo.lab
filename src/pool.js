var pool = ( function () {

    'use strict';

    var urls = [];
    var callback = null;
    var results = null;
    var inLoading = false;

    var seaLoader = null;

    pool = {

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

        load: function( Urls, Callback ){

            if ( typeof Urls == 'string' || Urls instanceof String ) urls.push( Urls );// = [ Urls ];
            else urls = urls.concat( Urls );

            callback = Callback || function(){};

            results = {};

            inLoading = true;

            this.loadOne();

        },

        next: function () {

            urls.shift();
            if( urls.length === 0 ){ 
                inLoading = false;
                callback( results );

                //console.log(results)
            }
            else this.loadOne();

        },

        loadOne: function(){

            var link = urls[0];

            var name = link.substring( link.lastIndexOf('/')+1, link.lastIndexOf('.') );
            var type = link.substring( link.lastIndexOf('.')+1 );

            if( type === 'jpg' || type === 'png' ) this.loadImage( link, name );
            else this[ type + '_load' ]( link, name );

        },

        loadImage: function ( url, name ) {

            var img = new Image();

            img.onload = function(){

                results[name] = img;
                this.next();

            }.bind( this );

            img.src = url;

        },

        setSeaLoader: function ( sea ) {

            seaLoader = sea;

        },

        sea_load: function ( url, name ) {

            var l = seaLoader || new THREE.SEA3D();

            l.onComplete = function( e ) {

                if( seaLoader === null ) results[name] = l.meshes;
                this.next();

            }.bind( this );

            l.load( url );

        },

        json_load: function ( url, name ) {

            var xml = new XMLHttpRequest();
            xml.overrideMimeType( "application/json" );

            xml.onload = function () {

                results[name] = JSON.parse( xml.responseText );
                this.next();

            }.bind( this );

            xml.open( 'GET', url, true );
            xml.send( null );

        },

        glsl_load: function ( url, name ) {

            var xml = new XMLHttpRequest();

            xml.onload = function () {

                results[name] = xml.responseText;
                this.next();

            }.bind( this );

            xml.open( 'GET', url, true );
            xml.send( null );

        },

    };

    return pool;

})();