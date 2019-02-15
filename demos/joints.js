var option = {

    type:[0,1,2,3,4,5],

}

var num = 20;


function demo() {

    ui ({

        base: option,
        function: applyOption,
        type: { type:'button', p:0, h:40, radius:10 },

    });

    cam ({ theta:0, phi:0, distance:30, y:20 });

    // infinie plane
    physic.add({type:'plane'});

    demoType( 1 );

    
};

function demoType ( n ) {

    var x;
    var mid = (num * 2.1) * 0.5;

    for ( var i = 0; i < num; i++) {
        x = (i*2) - mid;
        physic.add({ type:'box', name:'box' + i, mass: 1, pos:[x,20,0], size:[2], kinematic: i === 0 ? true : false, neverSleep:true });
    }

    switch( n ){
        case 0: 
        for ( var i = 0; i < num-1; i++) {
            physic.add({ type:'joint_p2p', name:'joint'+i, b1:'box'+i, b2:'box'+(i+1), pos1:[1,0,0], pos2:[-1,0,0], collision:false })
        }
        break;
        case 1:
        for ( var i = 0; i < num-1; i++) {
            physic.add({ 
                type:'joint_hinge', name:'joint'+i, b1:'box'+i, b2:'box'+(i+1),
                pos1:[1,0,0], pos2:[-1,0,0], 
               // axe1:[1,0,0], axe2:[1,0,0], 
                //axe1:[0,1,0], axe2:[0,1,0],
                axe1:[0,0,1], axe2:[0,0,1],
                limit:[-10,10,0.9,0.3, 1], 
                collision:false,
                useA:false,
            })
        }
        break;
        case 2:
        for ( var i = 0; i < num-1; i++) {
            physic.add({ type:'joint_conetwist', name:'joint'+i, b1:'box'+i, b2:'box'+(i+1), pos1:[1,0,0], pos2:[-1,0,0], axe1:[1,0,0], axe2:[1,0,0], limit:[0, 20, 20], collision:false })
        }
        break;
        case 3:
        for ( var i = 0; i < num-1; i++) {
            physic.add({ type:'joint_slider', name:'joint'+i, b1:'box'+i, b2:'box'+(i+1), pos1:[1,0,0], pos2:[-1,0,0], axe1:[1,0,0], axe2:[1,0,0], limit:[0, 20, 20], collision:false })
        }
        break;
        case 4:
        for ( var i = 0; i < num-1; i++) {
            physic.add({ 
                type:'joint_dof', name:'joint'+i, b1:'box'+i, b2:'box'+(i+1), 
                pos1:[1,0,0], pos2:[-1,0,0], 
                axe1:[0, 0, 1], axe2:[0,0,1], 
                linLower:[0, 0, 0], linUpper:[0, 0, 0], 
                angLower:[-20, -20, -20], angUpper:[20, 20, 20], 
                collision:false, 
                local:true 
            })
        }
        break;
        case 5:
        for ( var i = 0; i < num-1; i++) {
            physic.add({ 
                type:'joint_spring_dof', name:'joint'+i, b1:'box'+i, b2:'box'+(i+1), 
                pos1:[1,0,0], pos2:[-1,0,0], 
                axe1:[0,1,0], axe2:[1,0,0], 
                linLower:[0, 0, 0], linUpper:[0, 0, 0], 
                angLower:[-20, -20, -20], angUpper:[20, 20, 20],
                collision:false, 
                local:true 
            })
        }
        break;

    }
}



function applyOption () {

    // note: object with same name is automaticly delete

    demoType( option.type );
}