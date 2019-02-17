function demo() {

    view.moveCam({ theta:40, phi:30, distance:70, target:[0,0,0] });

    physic.set(); // reset default setting

    //physic.add({type:'plane', friction:0.6, restitution:0.1 }); // infinie plane

    var z = 0;
    
    for( var i = 0; i < 20; i++){

        z = -20 + i*2;

        physic.add({ 
            type:'softRope',
            name:'rope'+i, 
            radius:0.5,
            mass:1,
            state:4, 
            start:[-40,10,z],
            end:[40,10,z], 
            numSegment:20,
            viterations:10,
            piterations:10,
            citerations:4,
            diterations:0,
            fixed: 1+2,
            margin:0.5,// memorry bug !!!
        });
    }

    var i = 10;
    while(i--){
        physic.add({ type:'sphere', size:[Math.rand(2,4)], pos:[Math.rand(-30,30), 30+(i*3), Math.rand(-10,10)], mass:0.2});
    }

    physic.postUpdate = update;

}


function update () {

    var r = [];
    // get list of rigidbody
    var bodys = physic.getBodys();

    bodys.forEach( function ( b, id ) {

        if( b.position.y < -3 ){
            r.push( { name:b.name, pos:[ Math.rand(-30,30), 50, Math.rand(-10,10)], noVelocity:true } );
        }

    });

    // apply new matrix to bodys
    physic.matrix( r );

}