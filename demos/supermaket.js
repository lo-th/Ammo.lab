function demo() {

    cam ( 0, 10, 10 );

    add ({type:'plane', pos:[0,-0.1,0], friction:0.6 });

    var i, j, k, pos;

    var d = 0.2;
    var s = 0.3;
    var x = 6, y = 10, z = 6;

    var decaleX = - ((x*0.5) * d) + (d*0.5);
    var decaleZ = - ((z*0.5) * d) + (d*0.5);

    for(k = 0; k<y; k++){
    for(j = 0; j<z; j++){
    for(i = 0; i<x; i++){
        pos = [ i*d + decaleX, k*d, j*d + decaleZ ];
        add ({ type:'box', size:[d,d,d], pos:pos, mass:0.2, friction:0.4, restitution:0.1, state:2 });
    }}}

    add({ type:'sphere', size:[s,s,s], pos:[0,100,0], mass:1, friction:0.3, restitution:0.3 });
    
}