function demo() {

    cam ( 0, 10, 40 );

    load ( 'track', afterLoad );

}

function afterLoad () {

    add({type:'plane'}); // infinie plane

    add({ type:'mesh', shape:view.getGeo()['track'], mass:0, friction:0.6, restitution:0.1 });

    // ammo car shape

    // ! \\ click on view and use key to controle character

    // ? \\ character don't work now


    character ({ 
        flag:16,
        group:32,
        mask:1|2
        
    });

};