function demo () {

    cam ( 0, 20, 100 );

    load ( 'basic', afterLoad );

}

function afterLoad () {

    add({type:'plane'}); // infinie plane

    var i = 200, pos = [], s, d, rot = [0,0,90];
    
    while( i-- ) {

        h = Math.rand(0.1,4);
        d = Math.rand(0.1,1);

        pos[0] = Math.rand(-5,5); 
        pos[1] = Math.rand(2,20) + ( i*h );
        pos[2] = Math.rand(-5,5);

        add({ type:'smbox', shape:'box', size:[d,d,d], pos:pos, mass:0.2});

    }

}