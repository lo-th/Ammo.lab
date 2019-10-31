function demo() {

    view.moveCam({ azim:0, polar:30, distance:80, target:[0,0,0] });
    physic.set(); // reset default setting
    view.loadObject( 'bol', afterLoad );

}

function afterLoad () {

    physic.add({
        type:'mesh',
        shape:view.getGeometry('bol', 'bol'),
        friction:0.4,
        mass:0,
        pos:[0, 1, -36]
    });

    var i = 60;
    while(i--){
        physic.add({ type:'sphere', size:[2], pos:[0, 40+(i*7), -40], mass:1});
    }

}