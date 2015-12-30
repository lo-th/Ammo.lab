function demo() {

    cam ( -90, 20, 30 );
    load ( 'cars', afterLoad );
    
};

function afterLoad () {

    // infinie plane
    add({type:'plane'});

    // load cars map
    view.addMap('cars.png', 'cars');

    for (var i = 0; i < 14; i++){
        
        var n = (i+1).toString();
        if(n.length == 1) n = '0'+n;
        if(n.length == 2) n = '0'+n;

        var g = view.mergeMesh([view.getGeo()['mcar'+n], view.getGeo()['down'+n]])

        var r = Math.randInt(0,360);

        add({

            type:'mesh',
            shape:g,
            friction:0.4,
            mass:2,
            pos:[0, 40+(i*7), 0],
            rot:[r, 0,0],
            material:'cars'
        });
    }

};