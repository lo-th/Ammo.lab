function demo() {

    /** 
      You can move terrain with keyboard 
      AWSD or QZSD rotate with camera
    */

    cam ([0, 30, 100]);

    view.hideGrid();
    view.addJoystick();

    set ({});

    add ({ 
        type:'terrain',
        name:'terra', 
        pos : [0,0,0], // terrain position
        size : [200,30,200], // terrain size in meter
        sample : [128,128], // number of subdivision

        frequency : [0.016,0.05,0.2], // frequency of noise
        level : [1,0.2,0.05], // influence of octave
        expo: 3,

        friction: 0.5, 
        bounce: 0.0,
        //soft_cfm:0.000001
        //toTri: true,
    });

    var i = 30;

    while(i--){
        add ({ type:'sphere', size:[1], pos:[Math.rand(-40,40),40,Math.rand(-40,40)], density:1, friction: 0.5, state:4 });
        add ({ type:'box', size:[2], pos:[Math.rand(-40,40),40,Math.rand(-40,40)], density:1, friction: 0.5, state:4 });
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