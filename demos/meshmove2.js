function demo() {

    cam ( -90, 20, 30 );
    load ( 'bot', afterLoad );
    
};

function afterLoad () {

    // infinie plane
    add({type:'plane'});

    add({ type:'box', size:[20,1,4], pos:[3,5,0], rot:[0,0,30], mass:0 });
    add({ type:'box', size:[1,6,10], pos:[-15,3,0], rot:[0,0,0], mass:0 });

    for (var i = 0; i < 4; i++){

        var name;

        if(i==0 || i==1) name = 'bot_wheel_L';
        else name = 'bot_wheel_R'

        //var r = Math.randInt(0,360);

        add({

            type:'mesh',
            shape:view.getGeo()[name],
            friction:0.4,
            mass:2,
            size:[0.2],
            pos:[10, 20+(i*7), 0],
            rot:[0,0,0]
        });
    }

};