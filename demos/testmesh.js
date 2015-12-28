function demo() {

    cam ( 90, 20, 40 );
    load ( 'bol', afterLoad );

}

function afterLoad () {

    add({
        type:'mesh',
        shape:view.getGeo()['bol'],
        mass:0
    });

    add({ type:'sphere', size:[3], pos:[-20, 40, 0], mass:1});
    add({ type:'sphere', size:[3], pos:[-10, 50, 0], mass:1});
    add({ type:'sphere', size:[3], pos:[0, 60, 0], mass:1});
    add({ type:'sphere', size:[3], pos:[10, 70, 0], mass:1});
    add({ type:'sphere', size:[3], pos:[20, 80, 0], mass:1});

}