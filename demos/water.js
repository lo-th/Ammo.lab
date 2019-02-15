var water;

function demo() {

    view.hideGrid();

    view.addSky({url:'photo.jpg', hdr:true });

    view.moveCam({ theta:0, phi:30, distance:120, target:[0,0,0] });


    // world setting
    physic.set({
        fps:60,
        substep:2,
        gravity:[0,-10,0],
    })

    physic.add ({ 
        type:'terrain',
        name:'water', 
        water:true,
        pos : [0,0,0], // terrain position
        size : [120,15,120], // terrain size in meter
        sample : [128,128], // number of subdivision

        frequency : [0.016,0.08], // frequency of noise
        level : [ 2, 0.2 ], // influence of octave
        expo: 2,

        deep: 4,
        opacity: 0.8,
        border:true,
        bottom:true,


        friction: 1, 
        //bounce: 0.0,
        //soft_cfm:0.000001
        //toTri: true,
    });

    /*
    // content box
    var l = 200, h = 40;
    physic.add({type:'box', pos:[l*0.5,h*0.5,0], size:[1,h, l+1], material:'hide'});
    physic.add({type:'box', pos:[-l*0.5,h*0.5,0], size:[1,h, l+1], material:'hide'});
    physic.add({type:'box', pos:[0,h*0.5,l*0.5], size:[l-1,h, 1], material:'hide'});
    physic.add({type:'box', pos:[0,h*0.5,-l*0.5], size:[l-1,h, 1], material:'hide'})
    */

    water = physic.byName('water');

    var i = 30;

    while(i--){
        physic.add ({ type:'sphere', size:[2], pos:[Math.rand(-40,40),40+(i*40),Math.rand(-40,40)], mass:1, friction: 0.5, state:4 });
        physic.add ({ type:'box', size:[4], pos:[Math.rand(-40,40),40+(i*40),Math.rand(-40,40)], mass:1, friction: 0.5, state:4 });
    }

    physic.postUpdate = update;

};

function update () {

    
    water.local.y += 0.25; 
    water.local.z += 0.25; 
    water.update( true );
    
    var r = [];
    var bodys = physic.getBodys();
    bodys.forEach( function ( b, id ) {
        if( b.position.y < -2 ) r.push( [ b.name, [ Math.rand(-40,40), Math.rand(40,60), Math.rand(-40,40)] ] );
    });
    physic.matrix( r );

}