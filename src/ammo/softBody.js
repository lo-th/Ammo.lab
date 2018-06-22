
//--------------------------------------------------
//
//  AMMO SOFTBODY
//
//--------------------------------------------------

//var softPoints;

function stepSoftBody ( AR, N ) {

    //if( !softs.length ) return;

    var softPoints = N;

    softs.forEach( function ( b ) {

        var s = b.get_m_nodes(); // get vertrices list
        var j = s.size();
        var n;
                
        while(j--){
            n = softPoints + ( j * 3 );
            s.at( j ).get_m_x().toArray( AR, n );
            //pos = s.at( j ).get_m_x();
            
            //Sr[n] = pos.x();
            //Sr[n+1] = pos.y();
            //Sr[n+2] = pos.z();
        }

        softPoints += s.size()*3;

    });

};

function moveSoftBody( o ) {

    var soft = softs[o.id];
    var s = soft.get_m_nodes();
    //console.log(s)
    var j = s.size();
    while(j--){
        //pos = s.at( j ).get_m_x().add( new Ammo.btVector3(0, 10, 0) );
    }

    soft.set_m_nodes( s );

};



function clearSoftBody () {

    var b;

    while( softs.length > 0){

        b = softs.pop();
        world.removeSoftBody( b );
        Ammo.destroy( b );

    }

    softs = [];

};


function addSoftBody ( o ) {

    var worldInfo = world.getWorldInfo();

    var gendiags = o.gendiags || true;
    //var fixed = o.fixed || 0;

    o.size = o.size == undefined ? [1,1,1] : o.size;
    o.div = o.div == undefined ? [64,64] : o.div;

    var softBodyHelpers = new Ammo.btSoftBodyHelpers();

    var body;

    switch( o.type ){

        case 'cloth':
            var mw = o.size[0] * 0.5;
            var mh = o.size[2] * 0.5;

            tmpPos1.fromArray( [ -mw, 0, -mh ] );
            tmpPos2.fromArray( [  mw, 0, -mh ] );
            tmpPos3.fromArray( [ -mw, 0,  mh ] );
            tmpPos4.fromArray( [  mw, 0,  mh ] );
            
            body = softBodyHelpers.CreatePatch( worldInfo, tmpPos1, tmpPos2, tmpPos3, tmpPos4, o.div[0], o.div[1], o.fixed || 0, gendiags  );
            body.softType = 1;

        break;

        case 'rope':

            tmpPos1.fromArray( o.start || [ -10, 0, 0 ] );
            tmpPos2.fromArray( o.end || [ 10, 0, 0 ] );

            var nseg = o.numSegment || 10;
            nseg -= 2;

            o.margin = (o.radius || 0.2);//*2;

            body = softBodyHelpers.CreateRope( worldInfo, tmpPos1, tmpPos2, nseg, o.fixed || 0 );
            //body.setTotalMass(o.mass);

            //console.log(body)


            //console.log(body.get_m_nodes().size())
            
            body.softType = 2;

        break;

        case 'ellipsoid':

            var center = o.center || [ 0, 0, 0]; // start
            var p1 = o.radius || [ 3, 3, 3]; // end

            tmpPos1.fromArray( o.center || [ 0, 0, 0 ] );
            tmpPos2.fromArray( o.radius || [ 3, 3, 3 ] );

            body = softBodyHelpers.CreateEllipsoid( worldInfo, tmpPos1, tmpPos2, o.vertices || 128  );
            body.softType = 3;

            var a = [];
            var b = body.get_m_nodes();
            var j = b.size(), n, node, p;
            while(j--){
                n = (j*3);
                node = b.at( j );
                p = node.get_m_x();
                a[n] = p.x();
                a[n+1] = p.y();
                a[n+2] = p.z();
            }

            o.lng = b.size();
            o.a = a;

            self.postMessage({ m:'ellipsoid', o:o });

        break;

        case 'softConvex': // BUG !!

            var lng = o.v.length/3;
            //console.log(lng)
            body = softBodyHelpers.CreateFromConvexHull( worldInfo, o.v, lng, o.randomize || true );
            body.softType = 4;

            // force nodes
            var i = lng, n;
            while(i--){
                n = i*3;
                tmpPos.fromArray( o.v, n );
                body.get_m_nodes().at( i ).set_m_x( tmpPos );
                //body.get_m_nodes().at( i ).set_m_x(new Ammo.btVector3(o.v[n], o.v[n+1], o.v[n+2]));
            }

        break;

        case 'softTriMesh':

            body = softBodyHelpers.CreateFromTriMesh( worldInfo, o.v, o.i, o.ntri, o.randomize || true );
            body.softType = 5;

        break;
    }



    var sb = body.get_m_cfg();

    //console.log(sb.get_kVC())

    if( o.viterations !== undefined ) sb.set_viterations( o.viterations );// Velocities solver iterations 10
    if( o.piterations !== undefined ) sb.set_piterations( o.piterations );// Positions solver iterations 10
    if( o.diterations !== undefined ) sb.set_diterations( o.diterations );// Drift solver iterations 0
    if( o.citerations !== undefined ) sb.set_citerations( o.citerations );// Cluster solver iterations 4

    sb.set_collisions( 0x11 );

    if( o.friction !== undefined ) sb.set_kDF( o.friction );// Dynamic friction coefficient [0,1]
    if( o.damping !== undefined ) sb.set_kDP( o.damping );// Damping coefficient [0,1]
    if( o.pressure !== undefined ) sb.set_kPR( o.pressure );// Pressure coefficient [-inf,+inf]

    if( o.drag !== undefined ) sb.set_kDG( o.drag );// Drag coefficient [0,+inf]
    if( o.lift !== undefined ) sb.set_kLF( o.lift );// Lift coefficient [0,+inf]

    if( o.vc !== undefined ) sb.set_kVC( o.vc ); // Volume conversation coefficient [0,+inf] def:0
    if( o.matching !== undefined ) sb.set_kMT( o.matching );// Pose matching coefficient [0,1]

    if(o.hardness){
        sb.set_kCHR( o.hardness )// Rigid contacts hardness [0,1]
        sb.set_kKHR( o.hardness )// Kinetic contacts hardness [0,1]
        sb.set_kSHR( o.hardness )// Soft contacts hardness [0,1]
        sb.set_kAHR( o.hardness )// Anchors hardness [0,1] def:0.7
    }

    /*
    kSRHR_CL;               // Soft vs rigid hardness [0,1] (cluster only)
    kSKHR_CL;               // Soft vs kinetic hardness [0,1] (cluster only)
    kSSHR_CL;               // Soft vs soft hardness [0,1] (cluster only)
    kSR_SPLT_CL;    // Soft vs rigid impulse split [0,1] (cluster only)
    kSK_SPLT_CL;    // Soft vs rigid impulse split [0,1] (cluster only)
    kSS_SPLT_CL;    // Soft vs rigid impulse split [0,1] (cluster only)
    */



    
    

    if( o.stiffness !== undefined ){ // range (0,1)
        var mat = body.get_m_materials().at( 0 );
        mat.set_m_kLST( o.stiffness ); // linear 
        mat.set_m_kAST( o.stiffness ); // angular
        mat.set_m_kVST( o.stiffness ); // volume
    }
    
    body.setTotalMass( o.mass, o.fromfaces || false );
    //body.setPose( true, true );


    if(o.margin !== undefined ) Ammo.castObject( body, Ammo.btCollisionObject ).getCollisionShape().setMargin( o.margin );


    // Soft-soft and soft-rigid collisions
    world.addSoftBody( body, o.group || 1, o.mask || -1 );

    body.setActivationState( o.state || 1 );

    body.points = body.get_m_nodes().size();

    if( o.name ) byName[o.name] = body;

    softs.push( body );

    o = null;

};