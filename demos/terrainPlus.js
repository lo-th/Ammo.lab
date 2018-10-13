function demo() {

    /** 
      You can move terrain with keyboard 
      AWSD or QZSD rotate with camera
    */

    cam ([0, 30, 100]);

    //view.hideGrid();
    view.addJoystick();

    set({
        fps:60,
        substep:2,
        gravity:[0,-10,0],
    })

    add ({ 
        type:'terrain',
        name:'terra', 
        pos : [0,0,0], // terrain position
        size : [300,30,300], // terrain size in meter
        sample : [128,128], // number of subdivision
        //sample : [16,16], // number of subdivision

        frequency : [0.016,0.05,0.2], // frequency of noise
        level : [1,0.2,0.05], // influence of octave
        expo: 0,

        friction: 0.5, 
        bounce: 0.0,
        //flipEdge:false,
        //soft_cfm:0.000001
        //toTri: true,

        //hdt:'PHY_SHORT',
        //heightScale:10,
    });

    var i = 30, x, y, z;

    while(i--){
        x = Math.rand(-100,100);
        z = Math.rand(-100,100);
        y = view.byName['terra'].getHeight(x,z)+1;
        add ({ type:'sphere', size:[1], pos:[x,y,z], mass:10, friction: 0.5, state:4 });
        x = Math.rand(-100,100);
        z = Math.rand(-100,100);
        y = view.byName['terra'].getHeight(x,z)+1;
        add ({ type:'box', size:[2], pos:[x,y,z], mass:10, friction: 0.5, state:4 });
    }

    view.update = update;

};

function update () {

    view.updateTerrain('terra');

    view.bodys.forEach( function ( b, id ) {

        if( b.position.y < -20 ){
            matrix( [ b.name, [ Math.rand(-40,40), Math.rand(40,60), Math.rand(-40,40)] ], [0,0,0,1] );
        }

    });

}