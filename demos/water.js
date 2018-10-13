function demo() {

    view.hideGrid();

    cam ({azim:0, polar:30, distance:100});

    // world setting
    set({
        fps:60,
        substep:2,
        gravity:[0,-10,0],
    })

    add ({ 
        type:'terrain',
        name:'water', 
        water:true,
        pos : [0,0,0], // terrain position
        size : [200,20,200], // terrain size in meter
        sample : [128,128], // number of subdivision

        frequency : [0.016,0.08], // frequency of noise
        level : [ 1, 0.2 ], // influence of octave
        expo: 2,


        //friction: 0.5, 
        //bounce: 0.0,
        //soft_cfm:0.000001
        //toTri: true,
    });

    var l = 200, h = 20;
    add({type:'box', pos:[l*0.5,h*0.5,0], size:[1,h, l+1]});
    add({type:'box', pos:[-l*0.5,h*0.5,0], size:[1,h, l+1]});
    add({type:'box', pos:[0,h*0.5,l*0.5], size:[l-1,h, 1]});
    add({type:'box', pos:[0,h*0.5,-l*0.5], size:[l-1,h, 1]});

    var i = 30;

    while(i--){
        add ({ type:'sphere', size:[5], pos:[Math.rand(-40,40),40+(i*40),Math.rand(-40,40)], mass:10, friction: 0.5, state:4 });
        add ({ type:'box', size:[10], pos:[Math.rand(-40,40),40+(i*40),Math.rand(-40,40)], mass:10, friction: 0.5, state:4 });
    }

    view.update = update;

};

function update () {

    view.updateTerrain('water');

}