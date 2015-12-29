function demo() {

    cam ( -90, 20, 30 );
    load ( 'cars', afterLoad );
    view.addMap('cars.png', 'cars');

}

function afterLoad () {

    // infinie plane
    add({type:'plane'});

    // load cars map
    

    for (var i = 0; i < 14; i++){

        var n = (i+1).toString();
        if(n.length == 1) n = '0'+n;
        if(n.length == 2) n = '0'+n;

        var r = Math.randInt(0,360);

        console.log(n)

        add({

            type:'mesh',
            shape:view.getGeo()['mcar'+n],
            friction:0.4,
            mass:2,
            pos:[0, 40+(i*7), 0],
            rot:[r, 0,0],
            material:'cars'
        });
    }

    /*var i = 60;
    while(i--){
        add({ type:'sphere', size:[2], pos:[0, 40+(i*7), -40], mass:1});
    }*/


}