function demo() {

    cam ({ azim:30, polar:40, distance:30 });
    load ( 'cars', afterLoad );
    
};

function afterLoad () {

    // infinie plane
    add({type:'plane'});

    add({type:'box', pos:[10,5,0], size:[1,10, 21]});
    add({type:'box', pos:[-10,5,0], size:[1,10, 21]});
    add({type:'box', pos:[0,5,10], size:[19,10, 1]});
    add({type:'box', pos:[0,5,-10], size:[19,10, 1]});

    // load cars map
    view.addMap('cars.png', 'cars');
    view.mat.cars.transparent = true;
    view.mat.cars.side = THREE.DoubleSide;
    view.mat.cars.shadowSide = false;

    for (var i = 0; i < 100; i++){

        var t = Math.randInt(0,13);
        var n = (t+1).toString();
        if(n.length == 1) n = '0'+n;
        if(n.length == 2) n = '0'+n;

        var g = view.mergeMesh([view.getGeo()['mcar'+n], view.getGeo()['down'+n]])

        var r = Math.randInt(0,360);

        add({

            type:'convex',
            shape:g,
            friction:0.4,
            mass:1,
            size:[0.5],
            pos:[0, 10+(i*7), 0],
            rot:[r, 0,0],
            material:'cars'
        });
    }

};