function demo() {

    cam ([ 0, 30, 40 ]);

    set({

        fps:60,
        numStep:2,// more numStep = more accurate simulation default set to 2
        gravity:[0,-10,0],

    })

    // basic geometry body

    add({ type:'plane', name:'ground', restitution:0.8 }); // infinie plane

    add({ type:'box', size:[2,2,2], pos:[-5,30,0], mass:2, name:'boxy', restitution:0.8, material:'contactOff' });
    add({ type:'sphere', size:[1], pos:[5,30,0], mass:2, name:'sphy', restitution:0.8, material:'contactOff' });


    contact({ b1:'boxy', b2:'ground', f:onContact1});// contact pair test
    contact({ b1:'sphy', f:onContact2});// contact single test

};

function onContact1 ( b ){

    view.byName['boxy'].material = b ? view.mat.contactOn : view.mat.contactOff

}

function onContact2 ( b ){

    view.byName['sphy'].material = b ? view.mat.contactOn : view.mat.contactOff
    
}