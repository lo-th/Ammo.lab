function demo() {

    view.moveCam({ theta:30, phi:40, distance:30, target:[0,2,0] });
    view.load ( ['bot.sea'], afterLoad, true, true );
    physic.set();
    
};

function afterLoad () {

    var size = 0.2;

    // load wheel map

    var meca1 = view.material({
        name:'meca1',
        roughness: 0.4,
        metalness: 0.6,
        map: view.texture( 'base.jpg' ),
    });

    var meca2 = view.material({
        name:'meca2',
        roughness: 0.7,
        metalness: 0.3,
        map: view.texture( 'wheel.jpg' ),
    });

    // infinie plane
    physic.add({type:'plane'});

    // body

    physic.add({ 
        name:'body',
        type:'mesh', 
        material:meca1,
        geometry:view.getGeometry( 'bot', 'base_frame' ),
        shape:view.getGeometry( 'bot', 'base_frame_S' ),
        mass:20,
        size:[size],
        pos:[0, 8.4*size, 0],
    })

    // wheels

    var position = [22.8*size, 11.76*size, 5*size, 7.7*size];

    for (var i = 0; i < 4; i++){

        var type='';
        var z = 0;
        var x = 0;
        var speed = 0;//5;
        var s = 0;
        var name;
        var name2;
        if(i==0) type = 'L';
        if(i==1) type = 'R';
        if(i==2) type = 'R';
        if(i==3) type = 'L';

        if(type=='L'){ 
            name = 'bot_wheel_L';
            name2 = 'bot_wheel_SL';
        } else {
            name = 'bot_wheel_R';
            name2 = 'bot_wheel_SR';
        }

        if( i<2 ){ 
            z = position[1]+(position[3]*0.5); 
            //s = speed;
        } else {
            z = -position[1]-(position[3]*0.5);
            //s = -speed;
        }

        if(i==0 || i==2){ 
            x = position[0];
            //s = speed;
        } else{ 
            x = -position[0];
            //s = -speed;
        }

        if(i==0 || i==3){
            s = speed;
        }else{
            s = -speed;
        }

        physic.add({
            name:'w'+i,
            type:'mesh',
            material:meca2,
            geometry:view.getGeometry( 'bot', name ),
            shape:view.getGeometry( 'bot', name2 ),
            friction:0.4,
            mass:2,
            size:[size],
            pos:[ x, position[2]*0.5, z],
            rot:[0,0,0],
            margin:0.01,
        });

        physic.add({
            name:'j'+i,
            type:'joint_hinge',
            body1:'body',
            body2:'w'+i,
            pos1:[ x, -(8.4-5)*size, z],
            pos2:[ 0, 0, 0],
            axe1:[0,0,1],
            axe2:[0,0,1],
            motor:[true, s, 1],
        })
    }

};