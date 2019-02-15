/*global Ammo*/
import { math } from './math.js';
import { root, map } from './root.js';

/**
* @author lth / https://github.com/lo-th/
*/

//--------------------------------------------------
//  AMMO CONSTRAINT JOINT
//--------------------------------------------------

function Constraint() {

	this.ID = 0;
	this.joints = [];

}

Object.assign( Constraint.prototype, {

	step: function ( AR, N ) {

		this.joints.forEach( function ( b, id ) {

			var n = N + ( id * 4 );
			AR[ n ] = b.type;

		} );

	},

	clear: function () {

		while ( this.joints.length > 0 ) this.destroy( this.joints.pop() );
		this.ID = 0;

	},

	destroy: function ( j ) {

		root.world.removeConstraint( j );
		Ammo.destroy( j );
		map.delete( j.name );

	},

	remove: function ( name ) {

		if ( ! map.has( name ) ) return;
		var j = map.get( name );
		var n = this.joints.indexOf( j );
		if ( n !== - 1 ) {

			this.joints.splice( n, 1 );
			this.destroy( j );

		}

	},

	add: function ( o ) {



		var name = o.name !== undefined ? o.name : 'joint' + this.ID ++;

		// delete old if same name
		this.remove( name );


		if ( o.body1 ) o.b1 = o.body1;
		if ( o.body2 ) o.b2 = o.body2;

		if ( ! map.has( o.b1 ) || ! map.has( o.b2 ) ) return;

		var b1 = map.get( o.b1 );
		var b2 = map.get( o.b2 );

		var posA = math.vector3().fromArray( o.pos1 || [ 0, 0, 0 ] ).multiplyScalar( root.invScale );
		var posB = math.vector3().fromArray( o.pos2 || [ 0, 0, 0 ] ).multiplyScalar( root.invScale );

		var axeA = math.vector3().fromArray( o.axe1 || [ 1, 0, 0 ] );
		var axeB = math.vector3().fromArray( o.axe2 || [ 1, 0, 0 ] );

		var formA = math.transform().identity();
		var formB = math.transform().identity();

		if ( o.type !== "joint_p2p" && o.type !== "joint_hinge" && o.type !== "joint" ) {

			var local = o.local !== undefined ? o.local : true;

			if ( ! local ) { // worldToLocal

				var t = math.transform();
				// frame A
				t.identity();
				t.setOrigin( posA );
				t.eulerFromArray( o.axe1 || [ 1, 0, 0 ] );
				b1.getMotionState().getWorldTransform( formA );
				formA.getInverse().multiply( t );

				// frame B
				t.identity();
				t.setOrigin( posB );
				t.eulerFromArray( o.axe2 || [ 1, 0, 0 ] );
				b2.getMotionState().getWorldTransform( formB );
				formB.getInverse().multiply( t );

				t.free();

			} else { // local

				// frame A
				formA.setOrigin( posA );
				if ( o.quatA ) formA.quaternionFromArray( o.quatA );
				else if ( o.axe1 ) formA.eulerFromArray( o.axe1 );

				// frame B
				formB.setOrigin( posB );
				if ( o.quatB ) formB.quaternionFromArray( o.quatB );
				else if ( o.axe2 ) formA.eulerFromArray( o.axe2 );

			}

		}

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
			case "joint_fixe": new Ammo.btFixedConstraint( b1, b2, formA, formB ); break;
            //case "joint_gear": joint = new Ammo.btGearConstraint( b1, b2, point1, point2, o.ratio || 1); break;// missing
            //case "joint_universal": joint = new Ammo.btUniversalConstraint( b1, b2, point1, point2, o.ratio || 1); break;// missing

		}

		// EXTRA SETTING

		if ( o.breaking ) joint.setBreakingImpulseThreshold( o.breaking );

		// hinge

		// 0 _ limite min / swingSpan1
		// 1 _ limite max / swingSpan2
		// 2 _ twistSpan
		// 2 / 3 _ softness   0->1, recommend ~0.8->1  describes % of limits where movement is free.  beyond this softness %, the limit is gradually enforced until the "hard" (1.0) limit is reached.
		// 3 / 4 _ bias  0->1?, recommend 0.3 +/-0.3 or so.   strength with which constraint resists zeroth order (angular, not angular velocity) limit violation.
		// 4 / 5 _ relaxation  0->1, recommend to stay near 1.  the lower the value, the less the constraint will fight velocities which violate the angular limits.
		if ( o.limit && joint.setLimit ) {

			if ( o.type === 'joint_hinge' || o.type === 'joint' ) joint.setLimit( o.limit[ 0 ] * math.torad, o.limit[ 1 ] * math.torad, o.limit[ 2 ] || 0.9, o.limit[ 3 ] || 0.3, o.limit[ 4 ] || 1.0 );
			if ( o.type === 'joint_conetwist' ) {

				//console.log(joint)

				joint.setLimit( 3, o.limit[ 0 ] * math.torad );//m_twistSpan // x
				joint.setLimit( 4, o.limit[ 2 ] * math.torad );//m_swingSpan2 // z
				joint.setLimit( 5, o.limit[ 1 ] * math.torad );//m_swingSpan1 // y


				//joint.setLimit( o.limit[1]*math.torad, o.limit[2]*math.torad, o.limit[0]*math.torad, o.limit[3] || 0.9, o.limit[4] || 0.3, o.limit[5] || 1.0 );

			}

		}
		if ( o.motor && joint.enableAngularMotor ) joint.enableAngularMotor( o.motor[ 0 ], o.motor[ 1 ], o.motor[ 2 ] );


		// slider & dof

		if ( joint.setLinearLowerLimit ) {

			if ( o.linLower ) {

				posA.fromArray( o.linLower ).multiplyScalar( root.invScale ); joint.setLinearLowerLimit( posA );

			}
			if ( o.linUpper ) {

				posB.fromArray( o.linUpper ).multiplyScalar( root.invScale ); joint.setLinearUpperLimit( posB );

			}

		}

		if ( joint.setAngularLowerLimit ) {

			if ( o.angLower ) {

				axeA.set( o.angLower[ 0 ] * math.torad, o.angLower[ 1 ] * math.torad, o.angLower[ 2 ] * math.torad ); joint.setAngularLowerLimit( axeA );

			}
			if ( o.angUpper ) {

				axeB.set( o.angUpper[ 0 ] * math.torad, o.angUpper[ 1 ] * math.torad, o.angUpper[ 2 ] * math.torad ); joint.setAngularUpperLimit( axeB );

			}

		}

		// dof

		if ( o.feedback ) joint.enableFeedback( o.feedback );
		//if(o.param) joint.setParam( o.param[0], o.param[1], o.param[1] );//

		if ( o.angularOnly && joint.setAngularOnly ) joint.setAngularOnly( o.angularOnly );
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
		if ( o.spring && joint.enableSpring ) {

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
		joint.type = n;

		root.world.addConstraint( joint, collision ? false : true );
		this.joints.push( joint );

		map.set( name, joint );

		// free math
		posA.free();
		posB.free();
		axeA.free();
		axeB.free();
		formA.free();
		formB.free();
		o = null;

	}


} );


export { Constraint };
