

var option = {

    type:[0,1,2,3,4,5,6],

    joint_p2p:false,
    joint_hinge:false,
    joint_hinge_ref:false,
    joint_conetwist:false,
    joint_slider:false,
    joint_dof:false,
    joint_spring_dof:false,

}

var num = 20;
var mid = (num * 2.1) * 0.5;
var py = 20;
var down = true;
var isDone = false;

function demo() {

    ui ({

        base: option,
        function: applyOption,

        joint_p2p:{ type:'button', p:0, h:25, radius:10 },
        joint_hinge:{ type:'button', p:0, h:25, radius:10 },
        joint_hinge_ref:{ type:'button', p:0, h:25, radius:10 },
        joint_conetwist:{ type:'button', p:0, h:25, radius:10 },
        joint_slider:{ type:'button', p:0, h:25, radius:10 },
        joint_dof:{ type:'button', p:0, h:25, radius:10 },
        joint_spring_dof:{ type:'button', p:0, h:25, radius:10 },

    });

    view.moveCam({ theta:0, phi:0, distance:30, target:[0,10,0] });

    physic.set({
        jointDebug: true,
        gravity:[0,-1,0],
    });

    // infinie plane
    physic.add({type:'plane'});

    demoType( 4 );

    physic.prevUpdate = update;

};

function update () {

    if( physic.byName( 'box0' ) === null ) return;

    py = down ? py-0.1 : py+0.1;
    physic.matrix( [{ name:'box0', pos:[ -mid, py, 0 ], noVelocity:true }] );

    if(py<5){ down = false }
    if(py>20){ down = true }


}

function clearDemo ( n ) {

    var list = [];

    for ( var i = 0; i < num; i++) {

        list.push( 'box'+ i );

    }

    for ( var i = 0; i < num-1; i++) {

        list.push( 'joint'+ i );
    }

    physic.removesDirect( list );

    isDone = false;

    demoType( n );


}

function demoType ( n ) {

    if( isDone ){
        clearDemo( n );
        return;
    }

    var x;

    for ( var i = 0; i < num; i++) {
        x = (i*2) - mid;
        physic.add({ type:'box', name:'box' + i, mass: 1, pos:[x,py,0], size:[2], kinematic: i === 0 ? true : false, neverSleep:true });
    }

    //return;

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
                //axe1:[1,0,0], axe2:[1,0,0], 
                //axe1:[0,1,0], axe2:[0,1,0],
                axe1:[0,0,1], axe2:[0,0,1],

                limit:[-30,30,0.9,0.3, 1], 
                collision:false,
                useA:true,

                //angularOnly:true,
            })
        }
        break;
        case 2:

        for ( var i = 0; i < num-1; i++) {
            physic.add({ 
                type:'joint_hinge_ref', name:'joint'+i, b1:'box'+i, b2:'box'+(i+1),
                pos1:[1,0,0], pos2:[-1,0,0], 
                //axe1:[1,0,0], axe2:[1,0,0], 
                //axe1:[0,1,0], axe2:[0,1,0],
                axe1:[0,0,1], axe2:[0,0,1],
                
                limit:[-30,30,0.9,0.3, 1], 
                collision:false,
                useA:true,
            })


        }
        break;
        case 3:
        for ( var i = 0; i < num-1; i++) {
            physic.add({ 
                type:'joint_conetwist', name:'joint'+i, b1:'box'+i, b2:'box'+(i+1), 
                pos1:[1,0,0], pos2:[-1,0,0], 
                axe1:[0,0,1], axe2:[0,0,1],
               // axe1:[1,0,0], axe2:[1,0,0], 
                limit:[10, 20, 60], 
                collision:false 
            })
        }
        break;
        case 4:
        for ( var i = 0; i < num-1; i++) {
            physic.add({ 
                type:'joint_slider', name:'joint'+i, b1:'box'+i, b2:'box'+(i+1), 
                pos1:[1,0,0], pos2:[-1,0,0], 
                //axe1:[1,0,0], axe2:[1,0,0],
                //axe1:[0,1,0], axe2:[0,1,0],
                axe1:[0,0,1], axe2:[0,0,1],
                
                limit:[-0.5, 0.5, -2, 2], 
                //collision:false 
            })
        }
        break;
        case 5:
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
        case 6:
        for ( var i = 0; i < num-1; i++) {
            physic.add({ 
                type:'joint_spring_dof', name:'joint'+i, b1:'box'+i, b2:'box'+(i+1), 
                pos1:[1,0,0], pos2:[-1,0,0], 
                axe1:[0,0,1], axe2:[0,0,1], 
                linLower:[0, 0, 0], linUpper:[0, 0, 0], 
                angLower:[-20, -20, -20], angUpper:[20, 20, 20],
                collision:false, 
                local:true 
            })
        }
        break;

    }

    isDone = true;

}



function applyOption () {

    if(option.joint_p2p) demoType( 0 );
    if(option.joint_hinge) demoType( 1 );
    if(option.joint_hinge_ref) demoType( 2 );
    if(option.joint_conetwist) demoType( 3 );
    if(option.joint_slider) demoType( 4 );
    if(option.joint_dof) demoType( 5 );
    if(option.joint_spring_dof) demoType( 6 );

}

/*
setFromAxis( [1,0,0] )
setFromAxis2( [1,0,0] )
setFromAxis2( [0,1,0] )
setFromAxis2( [0,0,1] )
//setFromAxisAngle( [0,1,0], 0 )
//setFromVector( [0,1,0], [1,0,0] )

function setFromAxis2  ( axis ) {

    var q = new THREE.Quaternion()

    if (axis[ 2 ] > 0.99999) q.set(0, 0, 0, 1);
    else if (axis[ 2 ] < -0.99999) q.set(1, 0, 0, 0);
    else {
        var a = new THREE.Vector3(axis[ 1 ], axis[ 0 ], 0)//.normalize();
        console.log(a.toArray())
        var radians = Math.acos(axis[ 2 ]);
        q.setFromAxisAngle(a, radians);
    }

    console.log( q.toArray() )


}



function setFromAxis  ( axis ) {

    //var angle = Math.atan2( axis[ 0 ], axis[ 2 ] );
    var angle = Math.atan2( axis[ 0 ], axis[ 1 ] );
    var halfAngle = angle * 0.5;

    console.log(angle*Math.todeg)

    if( angle === 0 ){

        angle = Math.atan2( axis[ 1 ], axis[ 0 ] );
        halfAngle = angle * 0.5

         console.log(angle*Math.todeg)

        console.log(   1 * Math.sin( halfAngle ), 0, 0, Math.cos( halfAngle ) );

    } else {
        console.log(  0, 1 * Math.sin( halfAngle ), 0, Math.cos( halfAngle )  );
    }

    //var q = new THREE.Quaternion( w1,w2,w3, dot + Math.sqrt(dot * dot + w1 * w1 + w2 * w2 + w3 * w3) ).normalize();
    
    //return this;

}

function setFromAxisAngle  ( axis, angle ) {

    /*var x = axis[ 0 ];
    var y = axis[ 1 ];
    var z = axis[ 2 ];
*/
/*
    var halfAngle = angle * 0.5;

    var a = axis[0];
    var b = axis[1];
    var c = axis[2];

    var sin = Math.sin(halfAngle);
    var cos = Math.cos(halfAngle);

    var sin_norm = sin / Math.sqrt(a * a + b * b + c * c);



    console.log(a * sin_norm, b * sin_norm, c * sin_norm, cos);

}


function setFromVector  ( u, v ) {

    var a = u[0];
    var b = u[1];
    var c = u[2];

    var x = v[0];
    var y = v[1];
    var z = v[2];

    var dot = a * x + b * y + c * z;
    var w1 = b * z - c * y;
    var w2 = c * x - a * z;
    var w3 = a * y - b * x;

    var q = new THREE.Quaternion( w1,w2,w3, dot + Math.sqrt(dot * dot + w1 * w1 + w2 * w2 + w3 * w3) ).normalize();
            
            
            

    console.log( q.toArray() )

}*/