function demo() {

    cam ( -90, 20, 30 );

    // joint full test

    base();

    //P2P();
    SPRING();



    
};
var size = 0.05;


function base(){

    // infinie plane
    add({type:'plane'});

    // basic body
    add({type:'box', name:'bodyA', mass:1, pos:[0,0.2,0], size:[0.2]});
    add({type:'box', name:'bodyB', mass:1, pos:[0,4.2,0], size:[0.2]});
    add({type:'box', name:'no', mass:1, pos:[0,20,0]});

}

function P2P(){

    add({
        type:'joint_p2p',
        body1:'bodyA',
        body2:'bodyB',
        pos1:[0, 3, 0],
        pos2:[0, 0, 0],
    });
}

function SPRING(){
    var springRange = 2;

    add({
        type:'joint_spring_dof',
        body1:'bodyA',
        body2:'bodyB',
        pos1:[0, 0, 0],
        pos2:[0, 0, 0],
        rotA:[0, 0, 0],
        rotB:[0, 0, 0],

        angLower: [0, 0, 0],
        angUpper: [0, 0, 0],
        
        linLower: [ 0, 0, 0 ],
        linUpper: [ 0, 0, 0 ],

        useA:true,

        spring:[5,true],
        damping:[0,30],
        stiffness:[0,0.3],
        feedback:true,
    });

}