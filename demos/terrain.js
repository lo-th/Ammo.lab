var terra;

function demo() {

    /** 
      You can move terrain with keyboard 
      AWSD or QZSD rotate with camera
    */

    view.hideGrid();

    view.addSky({url:'photo.jpg', hdr:true });

    view.moveCam({ theta:0, phi:30, distance:120, target:[0,0,0] });

    view.addJoystick();

    physic.set({
        fps:60,
        substep:2,
        gravity:[0,-10,0],
    })

    physic.add ({ 
        type:'terrain',
        name:'terra', 
        pos : [0,0,0], // terrain position
        size : [120,30,120], // terrain size in meter
        sample : [128,128], // number of subdivision
        //sample : [16,16], // number of subdivision

        frequency : [0.016,0.05,0.2], // frequency of noise
        level : [1,0.2,0.05], // influence of octave
        expo: 0,

        friction: 0.5, 
        bounce: 0.0,

        border:true,
        bottom:true,

        maxSpeed: 0.02,

        //flag:2,//KINEMATIC ?
        //group:4,//KINEMATIC ?

        //acc:0.001,
        //dec:0.001,

        //flipEdge:false,
        //soft_cfm:0.000001
        //toTri: true,

        //hdt:'PHY_SHORT',
        //heightScale:10,
    });

    var i = 30, x, y, z;

    terra = physic.byName('terra');

    while(i--){
        x = Math.rand(-40,40);
        z = Math.rand(-40,40);
        y = terra.getHeight(x,z)+1;
        physic.add ({ type:'sphere', size:[1], pos:[x,y,z], mass:10, friction: 0.5, state:4 });
        x = Math.rand(-40,40);
        z = Math.rand(-40,40);
        y = terra.getHeight(x,z)+1;
        physic.add ({ type:'box', size:[2], pos:[x,y,z], mass:10, friction: 0.5, state:4 });
    }

    physic.postUpdate = update;

};

function update () {

    terra.easing( true );

    var r = [];
    var bodys = physic.getBodys();
    bodys.forEach( function ( b, id ) {
        if( b.position.y < -2 ) r.push( { name:b.name, pos:[ Math.rand(-40,40), Math.rand(40,60), Math.rand(-40,40)], noVelocity:true } );
    });
    physic.matrix( r );

}