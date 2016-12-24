function demo() {

    cam ( 0, 10, 10 );
    load ( ['track', 'hero'], afterLoad );

}

// ! \\ 

//  click on view and use key to controle character
//  use W - S or Z - S for front back move
//  use A - D or Q - D for strafe move
//  use left right arrow to rotate view
//  space to jump

// you can also use Gamepad ( mapped for xbox )


function afterLoad () {

    var m = view.getResult();

    add({type:'plane'}); // infinie plane

    add({ type:'mesh', shape:view.getGeo()['track'], mass:0, friction:0.6, restitution:0.1 });

    character ({ name:'bob', rot:[0,90,0], mesh:m.hero[ Math.randInt(0, 4) ], scale:0.07, debug:true });

    follow ('bob');


    var s, x, y;
    for(var i = 0; i < 40; i++){
        x = Math.rand(-50, 50);
        z = Math.rand(-50, 50);
        s = Math.rand(0.5, 5);
        add({ type:'box', size:[s,s,s], pos:[x,s*0.5,z], mass:s});
    }

};