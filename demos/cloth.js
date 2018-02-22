function demo() {

    cam ({ azim:0, polar:20, distance:100 });

    set ({});

    view.hideGrid();

    // static box
    add({ type:'box', size:[10,10,10], pos:[0,-5,0], rot:[0,0,0], density:0 });

    add({ 
        type:'cloth', name:'cloth', 
        mass:20, state:4, pos:[0,0,0], 
        size:[100,0,100],
        div:[64,64],
        viterations:10,
        piterations:10,
        citerations:10,
        diterations:10,
        fixed: 1+2+4+8,
        gendiags:true,
    });


    add({ type:'sphere', size:[3], pos:[-20, 100, 0], density:1});
    add({ type:'sphere', size:[3], pos:[20, 200, 0], density:1});
    add({ type:'sphere', size:[3], pos:[0, 300, -20], density:1});
    add({ type:'sphere', size:[3], pos:[0, 400, 20], density:1});

    //anchor({soft:'cloth', body:'ground', pos:0});
    //anchor({soft:'cloth', body:'ground', pos:100});

    view.update = update;

}

function update () {

    view.bodys.forEach( function ( b, id ) {

        if( b.position.y < -20 ){
            matrix( [ b.name, [ Math.rand(-20,20), 100, Math.rand(-20,20)] ] );
        }

    });

}