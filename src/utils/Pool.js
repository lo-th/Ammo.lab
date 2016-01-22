/**
 * @author lth / https://github.com/lo-th/
 */

THREE.Pool = function( modelPath , imgPath ){

    this.urls = null;
    this.callback = null;

    this.modelPath = modelPath || 'models/';
    this.imgPath = imgPath || 'textures/';
    

    this.GEOS = {};
    this.MAPS = {};

    

    /*this.manager = new THREE.LoadingManager();

    this.manager.onProgress = function ( item, loaded, total ) {
        console.log( item, loaded, total );
    }*/


   // this.imgLoader = new XMLHttpRequest();//new Image();//new THREE.TextureLoader(this.manager);
    this.meshLoader = new THREE.SEA3D();

}

THREE.Pool.prototype = {

    load:function( urls, callback ){

        if(callback){
            this.callback = callback;
        }

        if(urls){
            if( typeof urls == 'string' || urls instanceof String ) this.urls = [ urls ];
            else this.urls = urls;
        }

        var _this = this;


        var url = this.urls[0];
        var ext = url.substring( url.indexOf(".") + 1 );
        var name = url.substring( url.indexOf("/") + 1, url.indexOf(".") );

        if( ext === 'sea' ) { // geometry

            this.meshLoader.onDownloadProgress = function( e ) { this.progress(e); }.bind(this);

            this.meshLoader.onComplete = function( e ) {

                 //console.log(e)

                var i = this.meshLoader.geometries.length, g;
                while(i--){
                    g = this.meshLoader.geometries[i];
                    this.GEOS[ g.name ] = g;
                };

                this.complete();

            }.bind(this);

            this.meshLoader.load( this.modelPath + url );
        
        } else { // map

            

            //var img = new Image();

            var img = document.createElement("img");
            img.src = this.imgPath + url;

            img.onload = function(e){
                var map = new THREE.Texture( img );
                map.flipY = false;
                map.needsUpdate = true;

                this.MAPS[name] = map;

                this.complete();
            }.bind(this);

            


            //img.onprogress = function(e){ console.log(e)}
            /*this.imgLoader.onprogress = function(e){ this.progress(e); }.bind(this);
            this.imgLoader.onload = function(e){

                var img = document.createElement('img');
                //img.src = this.imgPath + url;
                img.setAttribute('src', this.imgPath + url);

                //console.log(e)

                var map = new THREE.Texture( img );
                map.flipY = false;
                map.needsUpdate = true;

                this.MAPS[name] = map;

                this.complete();

            }.bind(this);

            this.imgLoader.open("GET", this.imgPath + url, true);
            this.imgLoader.overrideMimeType('text/plain; charset=x-user-defined'); 
            this.imgLoader.send(null)*/

            
            //this.MAPS[name] = this.imgLoader.load( this.imgPath + url, function(){ _this.complete(); } ,  _this.progressIMG );

        }
 

    },

    map:function(){
        return this.MAPS;
    },

    geo:function(){
        return this.GEOS;
    },

    complete : function(){

        this.urls.shift();
        if( this.urls.length ) this.load();
        else { if( this.callback ) this.callback(); }

    },
    progress : function(e){

        //if (e.lengthComputable) {
            progress = (e.loaded / e.total);
        //} else {
         //   progress = e.progress;
       // }

       // ((e.progress || 0) * 100) + "%";
        console.log(progress, e)

    },

    progressIMG : function(e){

       // ((e.progress || 0) * 100) + "%";
        console.log(e);//.progress)

    },

    





}