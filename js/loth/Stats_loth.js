/**
 * @author mrdoob / http://mrdoob.com/
 * @author loth / http://3dflashlo.wordpress.com/
 */

var Stats_loth = function (name, size) {

	var startTime = Date.now(), prevTime = startTime;
	var ms = 0, msMin = Infinity, msMax = 0;
	var fps = 0, fpsMin = Infinity, fpsMax = 0;
	var frames = 0, mode = 0;

	var iconSize = size || 30;//36;

	var container = document.createElement( 'div' );
	var unselect = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none;'
	
	container.style.cssText = unselect+'position:absolute; top:10px; left:10px;width:'+iconSize+'px; height:'+iconSize+'px; pointer-events:none;';

	var lofpsColor = 'rgba(255,255,0,0.5)';
	var lofpsColorMin = 'rgba(200,200,0,0.1)';
	var lomsColor = 'rgba(0,255,0,0.2)';
	var lomsColorMax = 'rgba(0,200,0,0.1)';

	
	var iconColor = '#ffffff';

	var iconColor0 =  'rgba(255,255,255,0.3)';
	var iconColor2 =  'rgba(255,255,0,0.3)';

	var needle= [
		"<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px'",
		"width='"+iconSize+"px' height='"+iconSize+"px' viewBox='0 0 100 100' enable-background='new 0 0 100 100' xml:space='preserve'>",
		"<path id='needle' fill='"+iconColor+"' d='",
		"M50,17.5c-1.381,0-2.5,1.119-2.5,2.5v30c0,1.381,1.119,2.5,2.5,2.5s2.5-1.119,2.5-2.5V20C52.5,18.619,51.381,17.5,50,17.5z",
		"'/></svg>"
	].join("\n");
	var needle2= [
	    "<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px'",
		"width='"+iconSize+"px' height='"+iconSize+"px' viewBox='0 0 100 100' enable-background='new 0 0 100 100' xml:space='preserve'>",
		"<path id='needle2' fill='"+iconColor2+"' d='",
		"M51.5,48.69V20c0-0.828-0.672-1.5-1.5-1.5s-1.5,0.672-1.5,1.5v28.69C48.193,49.041,48,49.496,48,50c0,1.105,0.895,2,2,2s2-0.895,2-2C52,49.496,51.807,49.041,51.5,48.69z",
		"'/></svg>"
	].join("\n");


	var needleplus= [
		"<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px'",
		"width='"+iconSize+"px' height='"+iconSize+"px' viewBox='0 0 100 100' enable-background='new 0 0 100 100' xml:space='preserve'>",
		"<circle id='needleplus' fill='"+iconColor0+"' cx='50' cy='6' r='4'/></svg>"
	].join("\n");
	var needleplus2= [
	    "<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px'",
		"width='"+iconSize+"px' height='"+iconSize+"px' viewBox='0 0 100 100' enable-background='new 0 0 100 100' xml:space='preserve'>",
		"<circle id='needleplus2' fill='"+iconColor2+"' cx='50' cy='13' r='2.5'/></svg>"
	].join("\n");

	var base = [
		"<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px'",
		"width='"+iconSize+"px' height='"+iconSize+"px' viewBox='0 0 100 100' enable-background='new 0 0 100 100' xml:space='preserve'>",
		"<path id='base' fill='"+iconColor0+"' d='",
		"M50,2C23.49,2,2,23.49,2,50c0,3.223,0.323,6.369,0.929,9.414l3.923-0.784C6.296,55.839,6,52.954,6,50C6,25.699,25.699,",
		"6,50,6s44,19.699,44,44c0,2.954-0.296,5.839-0.851,8.63l3.923,0.784C97.677,56.369,98,53.223,98,50C98,23.49,76.51,2,50,2z",
		"'/></svg>"
	].join("\n");

	
	var size = 2;

	var loDiv = document.createElement( 'div' );
	loDiv.id = 'lo';
	loDiv.style.cssText = 'position:absolute; left:0; top:0; width:'+iconSize+'px; height:'+iconSize+'px;';
	loDiv.innerHTML = base;
	//container.appendChild( loDiv );
	

	var txt = document.createElement( 'div' );
	txt.style.cssText = 'font-family:Monospace; color:'+iconColor0+'; position:absolute; left:0; top:'+(iconSize-12)+'px; width:'+iconSize+'px; height:'+10+'px;  text-align:center; font-size:10px; pointer-events:none;';
	container.appendChild(txt);
	txt.innerHTML = name || "three";

	/*var needleMsMax = document.createElement( 'div' );
	needleMsMax.id = 'nmsx';
	needleMsMax.style.cssText = 'position:absolute;left:'+16*size+'px; bottom:1px;width:'+1*size+'px;height:'+15*size+'px;transform-origin: 0.5px '+15*size+'px;-webkit-transform-origin:1px '+15*size+'px;-o-transform-origin:1px '+15*size+'px;';
	loDiv.appendChild( needleMsMax );

	var l0 = document.createElement( 'div' );
	l0.style.cssText = 'width:'+1*size+'px;height:'+12*size+'px;background-color:'+lomsColorMax+';';
	needleMsMax.appendChild(l0);*/

	
	//needleMs.style.cssText = 'position:absolute;left:'+16*size+'px; bottom:1px;width:'+1*size+'px;height:'+15*size+'px;transform-origin: 0.5px '+15*size+'px;-webkit-transform-origin: 1px '+15*size+'px;-o-transform-origin:1px '+15*size+'px;';
	//loDiv.appendChild( needleMs );

	//var l1 = document.createElement( 'div' );
	//l1.style.cssText = 'width:'+1*size+'px;height:'+12*size+'px;background-color:'+lomsColor+';';
	//needleMs.appendChild(l1);

	/*var needleFpsMin = document.createElement( 'div' );
	needleFpsMin.id = 'nfpsm';
	needleFpsMin.style.cssText = 'position:absolute;left:'+16*size+'px; bottom:1px;width:'+1*size+'px;height:'+15*size+'px;background-color:'+lofpsColorMin+';transform-origin:1px '+15*size+'px;-webkit-transform-origin:1px '+15*size+'px;-o-transform-origin: 1px '+15*size+'px%;';
	loDiv.appendChild(needleFpsMin);*/

	var needleFps = document.createElement( 'div' );
	//needleFps.id = 'nfps';
	needleFps.style.cssText = 'position:absolute;  left:0; top:0; width:'+iconSize+'px; height:'+iconSize+'px;';//' transform-origin:50% 70.31%; -webkit-transform-origin:50% 70.31%; -o-transform-origin:50% 70.31%;';
    needleFps.innerHTML = needle;
	container.appendChild(needleFps);

	var needleMs = document.createElement( 'div' );
	//needleMs.id = 'nms';
	needleMs.style.cssText = 'position:absolute;  left:0; top:0; width:'+iconSize+'px; height:'+iconSize+'px;';//' transform-origin:50% 70.31%; -webkit-transform-origin:50% 70.31%; -o-transform-origin:50% 70.31%;';
    needleMs.innerHTML = needle2;
    container.appendChild(needleMs);
	
	var needleFpsm = document.createElement( 'div' );
	//needleFpsm.id = 'nfps';
	needleFpsm.style.cssText = 'position:absolute;  left:0; top:0; width:'+iconSize+'px; height:'+iconSize+'px;';//' transform-origin:50% 70.31%; -webkit-transform-origin:50% 70.31%; -o-transform-origin:50% 70.31%;';
    needleFpsm.innerHTML = needleplus;
	container.appendChild(needleFpsm);

	var needleMsm = document.createElement( 'div' );
	//needleMs.id = 'nms';
	needleMsm.style.cssText = 'position:absolute;  left:0; top:0; width:'+iconSize+'px; height:'+iconSize+'px;';//' transform-origin:50% 70.31%; -webkit-transform-origin:50% 70.31%; -o-transform-origin:50% 70.31%;';
    needleMsm.innerHTML = needleplus2;
    container.appendChild(needleMsm);

    container.appendChild( loDiv );


	var rotate = function ( dom, value ) {
		if(value>90)value = 90;
		if(value<-90)value = -90;
		dom.style.webkitTransform = 'rotate('+value+'deg)';
		dom.style.oTransform = 'rotate('+value+'deg)';
		dom.style.transform = 'rotate('+value+'deg)';
	}

	return {

		domElement: container,

		begin: function () {

			startTime = Date.now();

		},

		end: function () {

			var time = Date.now();

			ms = time - startTime;
			//msMin = Math.min( msMin, ms );
			msMax = Math.max( msMax, ms );

			rotate(needleMs, (ms*3)-90);
			rotate(needleMsm, (msMax*3)-90);

			frames ++;

			if ( time > prevTime + 1000 ) {

				fps = Math.round( ( frames * 1000 ) / ( time - prevTime ) );

				fpsMin = Math.min( fpsMin, fps );
				//fpsMax = Math.max( fpsMax, fps );

				rotate(needleFps, (fps*3)-90);
				rotate(needleFpsm, (fpsMin*3)-90);
				prevTime = time;
				frames = 0;

			}

			return time;

		},

		update: function () {

			startTime = this.end();

		},

		rename: function (name) {

			txt.textContent = name;

		}

	}

};
