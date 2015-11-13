CLEAR({broadphase:"BVT", timer:false, timestep:1/60, iteration:2, G:-10});

function initDemo()
{
    NAME("Vehicule Terrain");

    ADD({type:"plane"});
    ADD({type:"terrain", pos:[0,0,0], size:[200,5,200], div:[128,128], Move:true });


    // NOTE: use arrow key to control car
    // select your car with number 0-9

    var Setting = {
        engine:600, stiffness: 40, relaxation: 0.85, compression: 0.82, 
        travel: 500, force: 6000, frictionSlip: 10.5, reslength: 0.1, roll: 0.1 
    }

    var max = 10; // maximum 20
    var px, t, n=2;

    for (var i=0; i!==max; ++i ){
        t = Math.floor(Math.random()*n)+1;
    	px=-11+(i*2.5);
        switch(t){
            case 1: CAR({type:'c1gt',   pos:[px, 8, -7], mass:900,  setting:Setting }); break;
            case 2: CAR({type:'vision', pos:[px, 8, -7], mass:1490, setting:Setting }); break;
            case 3: 
                CAR({
                    type:'basic',  pos:[px, 10, -7], mass:1000, setting:Setting, 
                    size:[2,0.5,5], wPos:[1,0,2], wRadius:0.4, massCenter:[0,0.05,0] 
                }); 
            break;
        }
    }
}