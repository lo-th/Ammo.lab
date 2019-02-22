function demo() {

    view.moveCam({ theta:0, phi:10, distance:30, target:[0,3,0] });

    physic.set();
    
    physic.add ({type:'plane', pos:[0,0,0], friction:0.6 });

    var i, j, k, pos;
    var geo = view.getGeo();

    var d = 1;// meter
    var s = 2;
    var x = 6, y = 10, z = 6;

    var decaleX = - ((x*0.5) * d) + (d*0.5);
    var decaleZ = - ((z*0.5) * d) + (d*0.5);

    for(k = 0; k<y; k++){
    for(j = 0; j<z; j++){
    for(i = 0; i<x; i++){
        pos = [ i*d + decaleX, (k*d + d)-0.5, j*d + decaleZ ];
        physic.add ({ type:'box', geometry:geo.dice, size:[d,d,d], pos:pos, mass:1, friction:0.4, restitution:0.1, state:2 });
    }}}

    physic.add({ type:'sphere', size:[s,s,s], pos:[0,100,0], mass:10, friction:0.3, restitution:0.3 });
    
}

// ! \\ note
// ammo state value can be
// 1 : ACTIVE ( by default )
// 2 : ISLAND SLEEPING
// 3 : WANTS DEACTIVATION
// 4 : DISABLE DEACTIVATION
// 5 : DISABLE SIMULATION