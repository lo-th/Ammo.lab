function demo() {

    cam ( 0, 10, 40 );

    load ( 'track', afterLoad );

}

function afterLoad () {

    add({type:'plane'}); // infinie plane

    add({ type:'track', shape:'mesh', size:[1,1,1], pos:[0,0,0], mass:0 });

    // ammo car shape

    // ! \\ click on view and use key to controle car

    character ({ 
        flag:16,
        group:32,
        mask:1|2
        
    });

};