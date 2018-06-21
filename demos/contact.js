function demo() {

    cam ([ 0, 30, 40 ]);

    set({

        fps:60,
        numStep:2,// more numStep = more accurate simulation default set to 2
        gravity:[0,-10,0],

    })

    // basic geometry body

    add({ type:'plane', name:'ground', restitution:0.8 }); // infinie plane

    add({ type:'box', size:[2,2,2], pos:[0,30,0], mass:2, name:'boxy', restitution:0.8, material:'contactOff' });

    contact({ b1:'boxy', b2:'ground', f:onContact});

    /*var i = 200, pos = [], s, d, rot = [0,0,90];
    
    while( i-- ) {

        h = Math.rand(0.1,4);
        d = Math.rand(0.1,1);

        pos[0] = Math.rand(-5,5); 
        pos[1] = Math.rand(2,20) + ( i*h );
        pos[2] = Math.rand(-5,5);

        switch( Math.randInt(0,4) ){

            case 0 : add({ type:'sphere',   size:[d,d,d], pos:pos, mass:0.2 }); break;
            case 1 : add({ type:'box',      size:[d,h,d], pos:pos, mass:0.2 }); break;
            case 2 : add({ type:'cone',     size:[d,h,d], pos:pos, mass:0.2 }); break;
            case 3 : add({ type:'capsule',  size:[d,h,d], rot:rot, pos:pos, mass:0.2 }); break;
            case 4 : add({ type:'cylinder', size:[d,h,d], rot:rot, pos:pos, mass:0.2 }); break;

        }
    }*/

};

function onContact ( b ){

    view.byName['boxy'].material = b ? view.mat.contactOn : view.mat.contactOff

    //console.log( 'contact: ', b )

}