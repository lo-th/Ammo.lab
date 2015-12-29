function demo() {

    cam ( 90, 20, 180 );
    load ( 'bol', afterLoad );

}

function afterLoad () {

    add({
        type:'mesh',
        shape:view.getGeo()['bol'],
        mass:0,
        pos:[0, 10, 0]
    });

    var i = 60;
    while(i--){
        add({ type:'sphere', size:[3], pos:[0, 40+(i*7), 0], mass:1});
    }


}