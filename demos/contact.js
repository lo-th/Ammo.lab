var mat = {};

function demo() {

    view.moveCam({ theta:0, phi:30, distance:40, target:[0,2,0] });

    physic.set({

        fps:60,
        substep:2,// more substep = more accurate simulation default set to 2
        gravity:[0,-10,0],

    });


    mat['contactOn'] = view.material({name:'contactOn', color:0x33FF33 });
    mat['contactOff'] = view.material({name:'contactOff', color:0xFF3333 });

    // basic geometry body

    physic.add({ type:'plane', name:'ground', restitution:0.8 }); // infinie plane

    // load buggy 3d model
    view.load ( ['ping_pong.mp3'], afterLoad, true, true );

};

function afterLoad () {

    var m1 = physic.add({ type:'box', name:'boxy', size:[2,2,2], pos:[-5,30,0], mass:2, restitution:0.8, material:mat.contactOff });
    var m2 = physic.add({ type:'sphere', name:'sphy', size:[1], pos:[5,30,0], mass:2, restitution:0.8, material:mat.contactOff });

    var s1 = view.addSound('ping_pong');
    var s2 = view.addSound('ping_pong');

    m1.add( s1 );
    m2.add( s2 );

    m1.userData.sound = s1;
    m2.userData.sound = s2;
    m1.userData.oldpos = m1.position.clone();
    m2.userData.oldpos = m2.position.clone();

    // add collision test
    physic.add({ type:'collision', b1:'boxy', b2:'ground', callback:onContact1 });// contact pair test
    physic.add({ type:'collision', b1:'sphy', callback:onContact2 });// contact single test

}

function onContact1 ( b ){

    var m = physic.byName('boxy');
    var audio = m.userData.sound;
    var pos = m.userData.oldpos;

    var d = pos.distanceTo( m.position );
    m.material = b ? mat.contactOn : mat.contactOff;
    if( b && d>0.05 && !audio.isPlaying ) audio.play();

    pos.copy( m.position );

}

function onContact2 ( b ){

    var m = physic.byName('sphy');
    var audio = m.userData.sound;
    var pos = m.userData.oldpos;

    var d = pos.distanceTo( m.position );
    m.material = b ? mat.contactOn : mat.contactOff;
    if(b && d>0.05 && !audio.isPlaying ) audio.play();

    pos.copy( m.position );
 
}