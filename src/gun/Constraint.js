/*global Ammo*/
import { math } from './math.js';
import { root, map } from './root.js';

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    GUN - CONSTRAINT JOINT
*/

function Constraint() {

	this.ID = 0;
	this.joints = [];

	this.t1 = new Ammo.btTransform();
	this.t2 = new Ammo.btTransform();

}

Object.assign( Constraint.prototype, {

	step: function ( AR, N ) {

		var n, t1 = this.t1, t2 = this.t2, p1, p2, scale = root.scale;

		this.joints.forEach( function ( b, id ) {

			n = N + ( id * 14 );



			t1.copy( map.get( b.b1 ).getWorldTransform() ).multiply( b.formA ).toArray( AR, n , scale );
			t2.copy( map.get( b.b2 ).getWorldTransform() ).multiply( b.formB ).toArray( AR, n + 7, scale );

			/*p1 = t1.getOrigin();
			p2 = t2.getOrigin();
			
			p1.toArray( AR, n , scale );
			p2.toArray( AR, n+3 , scale );*/

		} );

	},

	clear: function () {

		while ( this.joints.length > 0 ) this.destroy( this.joints.pop() );
		this.ID = 0;

	},

	destroy: function ( j ) {

		root.world.removeConstraint( j );
		j.formA.free();
		j.formB.free();
		//Ammo.destroy( j.formA );
		//Ammo.destroy( j.formB );
		Ammo.destroy( j );
		map.delete( j.name );

		//console.log( 'delete', j.name )

	},

	remove: function ( name ) {

		//console.log( 'remove_'+ name );

		if ( !map.has( name ) ) return;
		var j = map.get( name );
		var n = this.joints.indexOf( j );
		if ( n !== - 1 ) {

			this.joints.splice( n, 1 );
			this.destroy( j );

		}

	},

	add: function ( o ) {

		o.name = o.name !== undefined ? o.name : 'joint' + this.ID ++;

		var name = o.name;

		// delete old if same name
		this.remove( name );


		if ( o.body1 ) o.b1 = o.body1;
		if ( o.body2 ) o.b2 = o.body2;

		if ( ! map.has( o.b1 ) || ! map.has( o.b2 ) ){ console.log( '! not find body' ); return;}

		var b1 = map.get( o.b1 );
		var b2 = map.get( o.b2 );

		b1.activate();
		b2.activate();
		//console.log(b2)

		var tmpPos = math.vector3();

		var posA = math.vector3().fromArray( o.pos1 || [ 0, 0, 0 ] ).multiplyScalar( root.invScale );
		var posB = math.vector3().fromArray( o.pos2 || [ 0, 0, 0 ] ).multiplyScalar( root.invScale );

		var axeA = math.vector3().fromArray( o.axe1 || [ 1, 0, 0 ] );
		var axeB = math.vector3().fromArray( o.axe2 || [ 1, 0, 0 ] );

		var formA = math.transform().identity();
		var formB = math.transform().identity();

		//if ( o.type !== "joint_p2p" && o.type !== "joint_hinge" && o.type !== "joint" ) {

			var local = o.local !== undefined ? o.local : true;

			if ( ! local ) { // worldToLocal

				var t = math.transform();
				// frame A
				t.identity();
				t.setOrigin( posA );
				//t.quartenionFromAxis( o.axe1 || [ 1, 0, 0 ] );
				//t.setFromDirection( o.axe1 || [ 1, 0, 0 ], 90*math.torad );
				//b1.getMotionState().getWorldTransform( formA );
				formA.getInverse().multiply( t );

				// frame B
				t.identity();
				t.setOrigin( posB );

				//t.quartenionFromAxis( o.axe2 || [ 1, 0, 0 ], 90*math.torad  );
				//t.setFromDirection( o.axe2 || [ 1, 0, 0 ] );
				b2.getMotionState().getWorldTransform( formB );
				formB.getInverse().multiply( t );

				t.free();

			} else { // local

				// frame A
				formA.setOrigin( posA );
				if ( o.quatA !== undefined ) formA.quaternionFromArray( o.quatA );
				//else if ( o.axe1 ) formA.setFromUnitVectors( o.axe1 ); 
				else if ( o.axe1 ) formA.quartenionFromAxis( o.axe1 );  
				//else if ( o.axe1 ) formA.quartenionFromAxisAngle( o.axe1, 90*math.torad  );
				//else if ( o.axe1 ) formA.setFromDirection( o.axe1 );
				//else if ( o.axe1 ) formA.eulerFromArrayZYX( o.axe1 );
				//else if ( o.axe1 ) formA.makeRotationDir( o.axe1 );
				//else if ( o.axe1 ) formA.getBasis() * axeA;

				// frame B
				formB.setOrigin( posB );
				if ( o.quatB !== undefined ) formB.quaternionFromArray( o.quatB );
				//else if ( o.axe2 ) formB.setFromUnitVectors( o.axe2 );
				else if ( o.axe2 ) formB.quartenionFromAxis( o.axe2 );
				//else if ( o.axe2 ) formB.quartenionFromAxisAngle( o.axe2, 90*math.torad );
				//else if ( o.axe2 ) formB.setFromDirection( o.axe2 );
				//else if ( o.axe2 ) formB.eulerFromArrayZYX( o.axe2 );
				//else if ( o.axe2 ) formB.makeRotationDir( o.axe2 );
				//else if ( o.axe2 ) formB.getBasis() * axeB;

			}

		//}

		// use fixed frame A for linear llimits useLinearReferenceFrameA
		var useA = o.useA !== undefined ? o.useA : true;

		var joint, n;

		switch ( o.type ) {

			case "joint_p2p":
				n = 1;
				joint = new Ammo.btPoint2PointConstraint( b1, b2, posA, posB );
				if ( o.strength ) joint.get_m_setting().set_m_tau( o.strength );
				if ( o.damping ) joint.get_m_setting().set_m_damping( o.damping );
				if ( o.impulse ) joint.get_m_setting().set_m_impulseClamp( o.impulse );
				break;
			case "joint_hinge": case "joint": n = 2; joint = new Ammo.btHingeConstraint( b1, b2, posA, posB, axeA, axeB, useA ); break;
			case "joint_hinge_ref": n = 2; joint = new Ammo.btHingeConstraint( b1, b2, formA, formB, useA ); break;
			case "joint_slider": n = 3; joint = new Ammo.btSliderConstraint( b1, b2, formA, formB, useA ); break;
			case "joint_conetwist": n = 4; joint = new Ammo.btConeTwistConstraint( b1, b2, formA, formB ); break;
			case "joint_dof": n = 5; joint = new Ammo.btGeneric6DofConstraint( b1, b2, formA, formB, useA ); break;
			case "joint_spring_dof": n = 6; joint = new Ammo.btGeneric6DofSpringConstraint( b1, b2, formA, formB, useA ); break;
			case "joint_fixe": n = 7; joint = new Ammo.btFixedConstraint( b1, b2, formA, formB ); break;
            //case "joint_gear": joint = new Ammo.btGearConstraint( b1, b2, point1, point2, o.ratio || 1); break;// missing
            //case "joint_universal": joint = new Ammo.btUniversalConstraint( b1, b2, point1, point2, o.ratio || 1); break;// missing

		}

		joint.b1 = o.b1//b1;
		joint.b2 = o.b2//b2;

		joint.formA = formA.clone();
		joint.formB = formB.clone();

		

		// EXTRA SETTING

		if ( o.breaking && joint.setBreakingImpulseThreshold ) joint.setBreakingImpulseThreshold( o.breaking );

		// hinge

		// Lowerlimit	==	Upperlimit	->	axis	is	locked.
		// Lowerlimit	>	Upperlimit	->	axis	is	free
		// Lowerlimit	<	Upperlimit	->	axis	it	limited	in	that	range	

		
		if ( o.limit && joint.setLimit ) {

			// 0 _ limite min
			// 1 _ limite max
			// 2 _ softness   0->1, recommend ~0.8->1  describes % of limits where movement is free.  beyond this softness %, the limit is gradually enforced until the "hard" (1.0) limit is reached.
			// 3 _ bias  0->1?, recommend 0.3 +/-0.3 or so.   strength with which constraint resists zeroth order (angular, not angular velocity) limit violation.
			// 4 _ relaxation  0->1, recommend to stay near 1.  the lower the value, the less the constraint will fight velocities which violate the angular limits.

			if ( o.type === 'joint_hinge' || o.type === 'joint' || o.type === 'joint_hinge_ref') joint.setLimit( o.limit[ 0 ] * math.torad, o.limit[ 1 ] * math.torad, o.limit[ 2 ] !==undefined ? o.limit[ 2 ] : 0.9, o.limit[ 3 ] !==undefined ? o.limit[ 3 ] : 0.3, o.limit[ 4 ] !==undefined ? o.limit[ 4 ] : 1.0 );

			// 0 _ swingSpan1
			// 1 _ swingSpan2
			// 2 _ twistSpan
			// 3 _ softness   0->1, recommend ~0.8->1  describes % of limits where movement is free.  beyond this softness %, the limit is gradually enforced until the "hard" (1.0) limit is reached.
			// 4 _ bias  0->1?, recommend 0.3 +/-0.3 or so.   strength with which constraint resists zeroth order (angular, not angular velocity) limit violation.
			// 5 _ relaxation  0->1, recommend to stay near 1.  the lower the value, the less the constraint will fight velocities which violate the angular limits.
			if ( o.type === 'joint_conetwist' ) {

				// don't work !!!
				//joint.setLimit( o.limit[ 0 ] * math.torad, o.limit[ 1 ] * math.torad, o.limit[ 2 ] * math.torad, o.limit[ 3 ] !==undefined ? o.limit[ 3 ] : 0.9, o.limit[ 4 ] !==undefined ? o.limit[ 4 ] : 0.3, o.limit[ 5 ] !==undefined ? o.limit[ 5 ] : 1.0 );

				joint.setLimit( 3, o.limit[ 2 ] * math.torad );//m_twistSpan // x
				joint.setLimit( 4, o.limit[ 1 ] * math.torad );//m_swingSpan2 // z
				joint.setLimit( 5, o.limit[ 0 ] * math.torad );//m_swingSpan1 // y

			}

			

		}

		if ( o.limit && o.type === 'joint_slider' ) {

			if( o.limit[ 0 ] ) joint.setLowerLinLimit( o.limit[ 0 ] * root.invScale );
            if( o.limit[ 1 ] ) joint.setUpperLinLimit( o.limit[ 1 ] * root.invScale );
	        if( o.limit[ 2 ] ) joint.setLowerAngLimit( o.limit[ 2 ] * math.torad );
	        if( o.limit[ 3 ] ) joint.setUpperAngLimit( o.limit[ 3 ] * math.torad );

		}
		

		// slider & dof

	    if( joint.setLinearLowerLimit ){

	        if( o.linLower ) joint.setLinearLowerLimit( tmpPos.fromArray( o.linLower ).multiplyScalar( root.invScale ) );
	        if( o.linUpper ) joint.setLinearUpperLimit( tmpPos.fromArray( o.linUpper ).multiplyScalar( root.invScale ) );

	    }

	    if( joint.setAngularLowerLimit ){

	        if( o.angLower ) joint.setAngularLowerLimit( tmpPos.fromArray( o.angLower ).multiplyScalar( math.torad ) );
	        if( o.angUpper ) joint.setAngularUpperLimit( tmpPos.fromArray( o.angUpper ).multiplyScalar( math.torad ) );

	    }

		// 6 dof

		/*if ( joint.setLinearLowerLimit ) {

			if ( o.linLower ) joint.setLinearLowerLimit( posA.fromArray( o.linLower ).multiplyScalar( root.invScale ));
			if ( o.linUpper ) joint.setLinearUpperLimit( posB.fromArray( o.linUpper ).multiplyScalar( root.invScale ));

		}

		if ( joint.setAngularLowerLimit ) {

			if ( o.angLower ) joint.setAngularLowerLimit( axeA.set( o.angLower[ 0 ] * math.torad, o.angLower[ 1 ] * math.torad, o.angLower[ 2 ] * math.torad ));
			if ( o.angUpper ) joint.setAngularUpperLimit( axeB.set( o.angUpper[ 0 ] * math.torad, o.angUpper[ 1 ] * math.torad, o.angUpper[ 2 ] * math.torad ));
			
		}*/


		if ( o.motor && joint.enableAngularMotor ) joint.enableAngularMotor( o.motor[ 0 ], o.motor[ 1 ], o.motor[ 2 ] );

		if ( o.feedback ) joint.enableFeedback( o.feedback );//
		//joint.enableFeedback( o.feedback );
		//if(o.param) joint.setParam( o.param[0], o.param[1], o.param[1] );//

		if ( o.angularOnly && joint.setAngularOnly ) joint.setAngularOnly( o.angularOnly ? 1 : 0 );
		if ( o.enableMotor && joint.enableMotor ) joint.enableMotor( o.enableMotor );
		if ( o.maxMotorImpulse && joint.setMaxMotorImpulse ) joint.setMaxMotorImpulse( o.maxMotorImpulse );
		if ( o.motorTarget && joint.setMotorTarget ) {

			var q = math.quaternion().fromArray( o.motorTarget );
			joint.setMotorTarget( q );
			q.free();

		}



		// 6 DOF
		// < 3 position
		// > 3 rotation

		if ( o.damping && joint.setDamping ) {

			for ( var i = 0; i < 6; i ++ ) joint.setDamping( i, o.damping[ i ] );

		}

		// spring dof
	    // < 3 position 
	    // > 3 rotation
		if ( o.spring && joint.enableSpring && joint.setStiffness ) {

			for ( var i = 0; i < 6; i ++ ) {

				joint.enableSpring( i, o.spring[ i ] === 0 ? false : true );
				joint.setStiffness( i, o.spring[ i ] );

			}

		}

		if ( o.param && joint.setParam ) {

			for ( var i = 0, lng = o.param.length; i < lng; i ++ ) {

				joint.setParam( o.param[ i ][ 0 ], o.param[ i ][ 1 ], i );// 2, 0.475   //BT_CONSTRAINT_STOP_CFM, 1.0e-5f, 5 // add some damping

			}

		}

		var collision = o.collision !== undefined ? o.collision : false;

		joint.isJoint = true;
		joint.name = name;
		joint.nType = n;
		joint.type = 'joint';

		root.world.addConstraint( joint, collision ? false : true );

		this.joints.push( joint );

		// add to map
		map.set( name, joint );

		//console.log( o.type, joint );

		// free math
		tmpPos.free();
		posA.free();
		posB.free();
		axeA.free();
		axeB.free();
		formA.free();
		formB.free();
		o = null;


		//console.log( math.getLength() );

	},

	// TODO
	applyOption: function ( joint, o ) {



	},


} );


export { Constraint };


function Joint( o ) {

	this.type = 'constraint';
	this.name = o.name;



}

Object.assign( Joint.prototype, {

	step: function ( n, AR ){

	},

	init: function ( o ){


	},

	clear: function (){


	},

});