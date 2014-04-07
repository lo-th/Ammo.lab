SEA3D.Animator = function(mesh, name){
    this.mesh = mesh;
    this.name = name;
    this.current = {};
    this.current.name = "";
    this.animation = [];
}

SEA3D.Animator.prototype = {
    constructor: SEA3D.Animator,
    add:function(name, loop){
        var a = new THREE.Animation( this.mesh, this.name+"/"+name, name);
        a.loop = loop || false;
        a.name = name;
        this.animation.push(a);
    },
    play:function(name){
        if(name!==this.current.name || this.current === null){
            if(this.current.name!=="")this.current.stop();
            for(var i=0, l=this.animation.length; i<l; i++ ){
                if(this.animation[i].name === name){
                    this.animation[i].play();
                    this.current = this.animation[i];
                } 
            }
        }
    },
    playFrame:function(name, n){
        for(var i=0, l=this.animation.length; i<l; i++ ){
                if(this.animation[i].name === name){
                    this.animation[i].play( n );
                    this.animation[i].stop();
                } 
            }
      //  this.current.play(n);
       // this.current.pause();
    },
    pause:function(){
        this.current.pause();
    },
    stop:function(){
        if(this.current.name!==""){
         this.current.stop();
         this.current = {};
         this.current.name = "";
         
     }
    },
    clear:function(){
        this.current.stop();
        /*for(var i=0, l=this.animation.length; i<l; i++ ){
            this.animation[i].reset();
        }*/

        this.animation.length = 0;
        this.current = null;
        this.mesh = null;
        this.name = "";
    }
}