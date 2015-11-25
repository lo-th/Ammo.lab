function demo () {

    cam ( 0, 20, 100 );

    load ( 'cars', afterLoad );

}

function afterLoad () {

    add({type:'plane'}); // infinie plane

    var CARS = [
       { size:[1.8, 1.4, 4.8],  n:'001', name:'fordM'  , wPos:[0.76, 0, 1.46],       nr:0.36, nw:4 },
       { size:[1.8, 1.8, 4.5],  n:'002', name:'vaz'    , wPos:[0.72, 0, 1.31],       nr:0.36, nw:4 },
       { size:[2.2, 1.5, 5.0],  n:'003', name:'coupe'  , wPos:[0.96, 0, 1.49],       nr:0.36, nw:4 },
       { size:[2.2, 1.9, 5.2],  n:'004', name:'c4'     , wPos:[0.93, 0, 1.65],       nr:0.40, nw:4 },
       { size:[2.2, 1.8, 5.2],  n:'005', name:'ben'    , wPos:[0.88, 0, 1.58],       nr:0.40, nw:4 },
       { size:[2.1, 1.7, 5.4],  n:'006', name:'taxi'   , wPos:[0.90, 0, 1.49],       nr:0.40, nw:4 },
       { size:[2.2, 1.9, 5.4],  n:'007', name:'207'    , wPos:[0.94, 0, 1.60],       nr:0.40, nw:4 },
       { size:[2.3, 1.7, 5.9],  n:'008', name:'police' , wPos:[0.96, 0, 1.67],       nr:0.40, nw:4 },
       { size:[2.7, 2.6, 6.2],  n:'009', name:'van1'   , wPos:[1.14, 0, 1.95],       nr:0.46, nw:4 },
       { size:[2.2, 2.8, 6.6],  n:'010', name:'van2'   , wPos:[0.89, 0, 2.10],       nr:0.40, nw:4 },
       { size:[2.8, 3.2, 7.0],  n:'011', name:'van3'   , wPos:[0.90, 0.26, 1.83],    nr:0.46, nw:4 },
       { size:[2.8, 3.9, 8.9],  n:'012', name:'truck1' , wPos:[1.00, 0, 2.58, 1.23], nr:0.57, nw:6 },
       { size:[3.0, 3.4, 10.6], n:'013', name:'truck2' , wPos:[1.17, 0, 3.64, 2.37], nr:0.57, nw:6 },
       { size:[3.0, 3.4, 12.7], n:'014', name:'bus'    , wPos:[1.25, 0, 2.49],       nr:0.64, nw:4 },
    ];

}