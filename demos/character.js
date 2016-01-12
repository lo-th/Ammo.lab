function demo() {

    cam ( 0, 10, 10 );

    load ( 'track', afterLoad );

}

function afterLoad () {

    add({type:'plane'}); // infinie plane

    add({ type:'mesh', shape:view.getGeo()['track'], mass:0, friction:0.6, restitution:0.1 });

    // ! \\ click on view and use key to controle character

    character ({ name:'bob', rot:[0,90,0] });

    follow ('bob');



    var s, x, y;
    for(var i = 0; i<40; i++){
        x = Math.rand(-50, 50);
        z = Math.rand(-50, 50);
        s = Math.rand(0.5, 5);
        add({ type:'box', size:[s,s,s], pos:[x,s*0.5,z], mass:s});
    }

};