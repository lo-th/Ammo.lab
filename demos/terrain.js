function demo() {

    cam ( 0, 35, 100 );

    add ({ type:'terrain', pos:[0,-5,0] });

    add ({ type:'sphere', size:[1], pos:[0,20,0], mass:0.2 });
    add ({ type:'sphere', size:[1], pos:[5,20,5], mass:0.2 });
    add ({ type:'sphere', size:[1], pos:[-5,20,-5], mass:0.2 });


    car ( { type:'basic', pos:[0,40,0] } );

};