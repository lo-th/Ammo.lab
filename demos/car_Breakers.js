function demo() {

    view.moveCam({ theta:45, phi:15, distance:25, target:[0,1,0] });
    view.load ( 'cars.sea', afterLoad, true );

    physic.set();
    
};

var CARS = [
    { n:'001', name:'fordM'  , radius:0.36, nw:4, w:'1', mass:1109,  wPos:[0.76, 0, 1.46] },
    { n:'002', name:'vaz'    , radius:0.36, nw:4, w:'1', mass:1003,  wPos:[0.72, 0, 1.31] },
    { n:'003', name:'coupe'  , radius:0.36, nw:4, w:'1', mass:900,   wPos:[0.96, 0, 1.49] },
    { n:'004', name:'c4'     , radius:0.40, nw:4, w:'2', mass:1181,  wPos:[0.93, 0, 1.65] },
    { n:'005', name:'ben'    , radius:0.40, nw:4, w:'2', mass:1256,  wPos:[0.88, 0, 1.58] },
    { n:'006', name:'taxi'   , radius:0.40, nw:4, w:'2', mass:1156,  wPos:[0.90, 0, 1.49] },
    { n:'007', name:'207'    , radius:0.40, nw:4, w:'2', mass:1156,  wPos:[0.94, 0, 1.60] },
    { n:'008', name:'police' , radius:0.40, nw:4, w:'2', mass:1400,  wPos:[0.96, 0, 1.67] },
    { n:'009', name:'van1'   , radius:0.46, nw:4, w:'3', mass:2000,  wPos:[1.14, 0, 1.95] },
    { n:'010', name:'van2'   , radius:0.40, nw:4, w:'2', mass:2400,  wPos:[0.89, 0, 2.10] },
    { n:'011', name:'van3'   , radius:0.46, nw:4, w:'3', mass:2400,  wPos:[0.90, 0, 1.83, 0, 0.26] },
    { n:'012', name:'truck1' , radius:0.57, nw:6, w:'4', mass:10000, wPos:[1.00, 0, 2.58, 1.23, 0.18] },
    { n:'013', name:'truck2' , radius:0.57, nw:6, w:'4', mass:14000, wPos:[1.17, 0, 3.64, 2.37] },
    { n:'014', name:'bus'    , radius:0.64, nw:4, w:'5', mass:11450, wPos:[1.25, 0, 2.49] },
];

function afterLoad () {

    // infinie plane
    physic.add({type:'plane'});

    physic.add({type:'box', pos:[10,5,0], size:[1,10, 21], material:'hide'});
    physic.add({type:'box', pos:[-10,5,0], size:[1,10, 21], material:'hide'});
    physic.add({type:'box', pos:[0,5,10], size:[19,10, 1], material:'hide'});
    physic.add({type:'box', pos:[0,5,-10], size:[19,10, 1], material:'hide'});

    // load cars map

    var carMat = view.material({
        name:'extra',
        roughness: 0.4,
        metalness: 0.6,
        map: view.texture( 'cars.png' ),
        transparent:true,
        side: THREE.DoubleSide,
    });

    for (var i = 0; i < 200; i++){

        var t = Math.randInt(0,13);
        var n = (t+1).toString();
        if(n.length == 1) n = '0'+n;
        if(n.length == 2) n = '0'+n;

        var shape = view.getGeometry( 'cars', 'shape'+ n );
        var chassis = view.getGeometry( 'cars', 'mcar'+ n );
        var down = view.getGeometry( 'cars', 'down'+ n );
        var inside = view.getGeometry( 'cars', 'inside'+n );
        var wheel = view.getGeometry( 'cars', 'w00' + CARS[t].w );

        var gar = inside ? [chassis, down, inside] : [chassis, down];

        // add wheel
        for( var j = 0; j<CARS[t].nw; j++ ){
            var ww = wheel.clone();
            var wp = CARS[t].wPos;
            var wr = CARS[t].radius;
            if(j<4) ww.applyMatrix( new THREE.Matrix4().makeTranslation( j<2 ? wp[0]: -wp[0], wr, j==0 || j==2 ? wp[2]:-wp[2] ));
            else if(j===4) ww.applyMatrix( new THREE.Matrix4().makeTranslation( - wp[ 0 ], wr, -wp[ 3 ] ));
            else if(j===5) ww.applyMatrix( new THREE.Matrix4().makeTranslation(  wp[ 0 ], wr, -wp[ 3 ] ));
            gar.push(ww);
        }

        var geometry = view.mergeGeometry( gar );

        var r = Math.randInt(0,360);

        physic.add({

            type:'convex',
            shape:shape,
            geometry:geometry,
            friction:0.4,
            mass:1,
            size:[0.5],
            pos:[Math.rand(-5,5), 10+(i*2), Math.rand(-5,5)],
            rot:[r, 0,0],
            material:carMat,

        });
    }

};