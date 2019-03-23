var carMat;
var option = {

    follow:false,
    currentCar: 'fordM',

}

function demo () {

    view.moveCam({ theta:0, phi:10, distance:30, target:[0,1,0] });
    view.load ( 'cars.sea', afterLoad, true );
    physic.set();

}

function afterLoad () {

    view.addJoystick();

    physic.set({
        fps:60,
        substep:2,
        gravity:[0,-10,0],
        worldscale:1,
    })

    // infinie plane
    physic.add({type:'plane'});

    carMat = view.material({
        name:'extra',
        roughness: 0.4,
        metalness: 0.6,
        map: view.texture( 'cars.png' ),
        transparent:true,
        side: THREE.DoubleSide,
    });

    // create cars
    var list = [];
    var g = [];
    for (var i = 0; i < CARS.length; i++){ 
    	list.push( CARS[i].name );
    	g.push( vehicle( i, [-25+(i*4), 0,0], 'convex') );
    }

    physic.addGroup( g );

    ui ({

        base:option,
        function: applyOption,

        follow: { type:'bool' },
        currentCar: { type:'list', list:list },
    
    });


    // ! \\ set the car we drive
    // use keyboard to controle car 
    physic.drive (option.currentCar);

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

function vehicle ( id, pos, shapeType ) {

    var o = CARS[id];
    o.type = 'car';
    o.shapeType = shapeType || 'box';
    
    o.pos = pos || [0,0,0];

    var shape = view.getGeometry( 'cars', 'shape'+o.n );
    var chassis = view.getGeometry( 'cars', 'mcar'+o.n );
    var down = view.getGeometry( 'cars', 'down'+o.n );
    var inside = view.getGeometry( 'cars', 'inside'+o.n );
    var yy = shape.boundingBox.min.y;

    o.material = carMat;

    if( inside ) o.geometry = view.mergeGeometry([chassis, down, inside]);
    else o.geometry = view.mergeGeometry([chassis, down]);

    o.wheelMaterial = carMat;//view.getMat().cars;

    // The maximum length of the suspension (metres)
    o.s_length = 0.1;//o.radius;// * 0.5;
    //The maximum distance the suspension can be compressed in Cm 
    //o.s_travel = (o.radius*2)*100;
    o.mass = o.mass / 5;
    // Maximum suspension force
    o.s_force = o.mass*10;


    o.s_compression = 0.84;
    o.s_damping = 0.88;
    o.s_stiffness = 40;

    o.wPos[1] = o.radius;//*2;
    
    o.shape = shape;
    //o.mesh = mesh;
    o.wheel = view.getGeometry( 'cars', 'w00' + o.w );
    o.nWheel = o.nw;

    //o.name = 'car_'+ id;

    o.helper = true;

    return o;

};

function applyOption () {

	follow( option.follow ? option.currentCar : 'none' )
	physic.drive (option.currentCar);

}