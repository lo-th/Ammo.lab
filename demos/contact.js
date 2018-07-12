var pos1 = new THREE.Vector3();
var pos2 = new THREE.Vector3();

function demo() {

    cam ([ 0, 30, 40 ]);

    set({

        fps:60,
        numStep:2,// more numStep = more accurate simulation default set to 2
        gravity:[0,-10,0],

    })

    // basic geometry body

    add({ type:'plane', name:'ground', restitution:0.8 }); // infinie plane

    // load buggy 3d model
    view.load ( ['ping_pong.mp3'], afterLoad, true, true );


    

};

function afterLoad () {

    var m1 = add({ type:'box', size:[2,2,2], pos:[-5,30,0], mass:2, name:'boxy', restitution:0.8, material:'contactOff' });
    var m2 = add({ type:'sphere', size:[1], pos:[5,30,0], mass:2, name:'sphy', restitution:0.8, material:'contactOff' });


    m1.add(view.addSound('ping_pong'));
    m2.add(view.addSound('ping_pong'));


    contact({ b1:'boxy', b2:'ground', f:onContact1});// contact pair test
    contact({ b1:'sphy', f:onContact2});// contact single test

}

function onContact1 ( b ){



    var m = view.byName['boxy'];
    var d = pos1.distanceTo(m.position);
    m.material = b ? view.mat.contactOn : view.mat.contactOff;
    var audio = m.children[ 0 ];
    if(b && d>0.05 ) audio.play();

    pos1.copy( m.position );

}

function onContact2 ( b ){

    var m = view.byName['sphy'];
    var d = pos2.distanceTo(m.position);
    m.material = b ? view.mat.contactOn : view.mat.contactOff;
    var audio = m.children[ 0 ];
    if(b && d>0.05 ) audio.play();

    pos2.copy( m.position );
 
}