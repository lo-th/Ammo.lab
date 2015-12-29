function demo() {

    cam ( -90, 20, 180 );
    load ( 'bol', afterLoad );

}

function afterLoad () {

    add({
        type:'mesh',
        shape:view.getGeo()['bol'],
        friction:0.2,
        mass:0,
        pos:[0, 1, -36]
    });

    var i = 60;
    while(i--){
        add({ type:'sphere', size:[2], pos:[0, 40+(i*7), -40], mass:1});
    }


}