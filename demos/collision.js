function demo() {

    cam ( 0, 10, 40 );

    // infinie plane
    add({type:'plane', group:1});

    // static box
    add({ type:'box', size:[10,10,1], pos:[0,4.6,8.2], rot:[45,0,0], mass:0, group:1, mask:4 });
    add({ type:'box', size:[10,1,10], pos:[0,1,0], rot:[0,0,0], mass:0, group:1, mask:4 });

    add({ type:'box', size:[10,6,0.4], pos:[0,4.5,-4.8], rot:[0,0,0], mass:0, group:2, mask:4 });

    // dynamique sphere
    var i = 50, r = 0.2, d = 0.4, x;
    while(i--){
        x = Math.rand(-4,4);
        add({ type:'sphere', size:[r,r,r], pos:[x,10+(i*3), 10], mass:0.2, group:4, mask:1|2 });
        add({ type:'box', size:[d,d,d], pos:[x,12+(i*3), 10], mass:0.2, group:4, mask:1 });
    }

}