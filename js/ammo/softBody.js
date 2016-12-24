
//--------------------------------------------------
//
//  AMMO SOFTBODY
//
//--------------------------------------------------

var softPoints;

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

function stepSoftBody() {

    if( !softs.length ) return;

    softPoints = 0;

    softs.forEach( function ( b ) {

        var s = b.get_m_nodes(); // get vertrices list
        var j = s.size();
        var n;
                
        while(j--){
            n = (j*3) + softPoints;
            pos = s.at( j ).get_m_x();
            Sr[n] = pos.x();
            Sr[n+1] = pos.y();
            Sr[n+2] = pos.z();
        }

        softPoints += s.size()*3;

    });

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

            body = softBodyHelpers.CreateFromConvexHull( worldInfo, o.v, o.v.length/3, o.randomize || false );
            body.softType = 4;

            // force nodes
            var i = o.v.length/3, n;
            while(i--){
                n = i*3;
                tmpPos.fromArray( o.v, n );
                body.get_m_nodes().at( i ).set_m_x( tmpPos );
                //body.get_m_nodes().at( i ).set_m_x(new Ammo.btVector3(o.v[n], o.v[n+1], o.v[n+2]));
            }

        break;
        case 'softTriMesh':

            body = softBodyHelpers.CreateFromTriMesh( world.getWorldInfo(), o.v, o.i, o.ntri, o.randomize || true );
            body.softType = 5;

        break;
    }

    var sb = body.get_m_cfg();

    if( o.viterations !== undefined ) sb.set_viterations( o.viterations );//10
    if( o.piterations !== undefined ) sb.set_piterations( o.piterations );//10
    if( o.citerations !== undefined ) sb.set_citerations( o.citerations );//4
    if( o.diterations !== undefined ) sb.set_diterations( o.diterations );//0

    sb.set_collisions( 0x11 );

    // Friction
    if( o.kdf !== undefined ) sb.set_kDF(o.kdf);
    // Damping
    if( o.kdp !== undefined ) sb.set_kDP(o.kdp);
    // Pressure
    if( o.kpr !== undefined ) sb.set_kPR(o.kpr);

    if( o.kvc !== undefined ) sb.set_kVC(o.kvc);

    
    // Stiffness
    if( o.klst !== undefined ) body.get_m_materials().at(0).set_m_kLST(o.klst);
    if( o.kast !== undefined ) body.get_m_materials().at(0).set_m_kAST(o.kast);
    if( o.kvst !== undefined ) body.get_m_materials().at(0).set_m_kVST(o.kvst);


    body.setTotalMass( o.mass, o.fromfaces || false );


    if(o.margin !== undefined ) Ammo.castObject( body, Ammo.btCollisionObject ).getCollisionShape().setMargin( o.margin );


    // Soft-soft and soft-rigid collisions
    world.addSoftBody( body, o.group || 1, o.mask || -1 );

    if(o.name) byName[o.name] = body;

    softs.push( body );

    o = null;

};