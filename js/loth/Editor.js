/**
 * @author loth / http://3dflashlo.wordpress.com/
 */

'use strict';
var Editor = function (Themes, nDemo) {

	var maxDemo = nDemo || 7;
	var themes = Themes || ['1d1f20', '2f3031', '424344'];
	var fontFamily = "font-family:Consolas, 'ConsolasRegular', 'Courier New', monospace;";

	var degrade01 = '#'+themes[0]+';';//'linear-gradient(45deg, #'+themes[0]+', #'+themes[1]+');';
	var fullImg = '';//background: url(images/grad.png) no-repeat center center fixed; -webkit-background-size: cover; -moz-background-size: cover; -o-background-size: cover; background-size: cover;'

	var unselect = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none;'
	var textselect = '-o-user-select:text; -ms-user-select:text; -khtml-user-select:text; -webkit-user-select:text; -moz-user-select: text;'
	var open = false;

    var container = document.createElement( 'div' );
	//container.style.cssText = unselect+'position:absolute; margin:0; padding:0; top:0px; bottom:0px; right:0px; color:#CCCCCC; width:100%; height:100% font-size:12px; font-family:SourceCode; pointer-events:none;';
	container.style.cssText = unselect+'position:absolute; margin:0; padding:0; top:0px; left:0px; width:100%; height:100%; font-size:12px; pointer-events:none;' + fontFamily;
	
	container.id = 'Editor';

	/*var logobb = document.createElement( 'div' );
	logobb.style.cssText = 'position:absolute; width:100%; height:100%; background:#FFFFFF';
    container.appendChild( logobb );
    themes[0] = "FFFFFF";*/
   // 25517c//693c28

	var introX = document.createElement( 'div' );
	introX.style.cssText = '-webkit-filter: drop-shadow( 1px 1px 1px #00ffff ); filter: drop-shadow( 1px 1px 1px #00ffff ); text-align:center; position:absolute; margin:0; padding:0; top:50%; left:50%; width:300px; height:150px; margin-left:-150px; margin-top:-75px; display:block; pointer-events:none';
	container.appendChild( introX );

	var containerEdit = document.createElement( 'div' );
	//containerEdit.style.cssText = unselect+'position:absolute; margin:0; padding:0; top:0px; left:50%; color:#CCCCCC; width:50%; height:100%; font-size:12px; font-family:SourceCode;  pointer-events:none; display:none; background:' + degrade01;
	containerEdit.style.cssText = unselect+fullImg+'position:absolute; margin:0; padding:0; top:0px; left:50%; color:#CCCCCC; width:50%; height:100%; font-size:12px; pointer-events:none; display:none;'+ fontFamily;//' background-image:url(images/grad.png)'

	containerEdit.id = 'EditorRoot';
	container.appendChild( containerEdit );

	var line = document.createElement( 'div' );
	line.style.cssText = unselect+'position:absolute; margin:0; padding:0; top:-1px; left:-1px; width:1px; height:100%; pointer-events:none; background:#'+themes[2]+';';
	containerEdit.appendChild( line );


    var iconSize0 = 90;
	var iconSize = 36;
	var iconSize2 = 46;
	var iconColor = '#ffffff';



	var icon_libs= [
	"<svg version='1.1' id='Calque_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px'",
	"width='"+iconSize0+"px' height='"+iconSize0+"px' viewBox='0 40 128 50' enable-background='new 0 40 128 50' xml:space='preserve' >",
    "<g><path id='icon_libs' fill='#"+themes[0]+"' d='M78.881,34.035v-3.054C81.464,30.785,83.5,28.633,83.5,26c0-2.761-2.239-5-5-5c-0.75,0-5.958,0-7.872,4.25",
	"c-2.123,4.715-1.709,8.826-1.709,8.826c0,21.715,17.59,23.895,17.59,40.494c0,12.389-10.078,22.467-22.467,22.467",
	"c-12.389,0-22.467-10.079-22.467-22.467c0-16.911,17.59-18.498,17.59-40.494c0,0,0.086-4.41-2.529-8.826",
	"C54.142,21.039,50,21,49.25,21c-2.761,0-5,2.239-5,5c0,2.717,2.169,4.923,4.869,4.993v3.042c0,17.909-17.59,17.92-17.59,40.494",
	"C31.528,92.462,46.066,107,64,107s32.471-14.538,32.471-32.471C96.471,52.276,78.881,51.708,78.881,34.035z'/>",
	"<circle fill='#"+themes[0]+"' cx='64.937' cy='85.463' r='3.87'/>",
	"<circle fill='#"+themes[0]+"' cx='64.751' cy='72.129' r='3.061'/>",
	"<circle fill='#"+themes[0]+"' cx='64.589' cy='58.439' r='2.764'/>",
	"<circle fill='#"+themes[0]+"' cx='76.325' cy='76.663' r='3.518'/>",
	"<circle fill='#"+themes[0]+"' cx='55.491' cy='65.33' r='2.764'/>",
	"<circle fill='#"+themes[0]+"' cx='52.726' cy='78.197' r='4.523'/>",
    "</g></svg>"
	].join("\n");

	var introStyle = unselect+'color:#'+themes[0]+'; -webkit-filter: drop-shadow( -1px -1px 1px #ff0000 ); filter: drop-shadow( -1px -1px 1px #ff0000 );pointer-events:none; font-size:40px; font-weight:800;';



	var logo = document.createElement( 'div' );
	logo.style.cssText = introStyle;
	logo.innerHTML = icon_libs;//+ "<br>Ammo.lab";
	introX.appendChild( logo );

	var logotext = document.createElement( 'div' );
	logotext.style.cssText = introStyle + 'margin-top:-30px;'; 
	logotext.innerHTML = "Ammo.lab";
	introX.appendChild( logotext );

	var hideIntro = function () {
		introX.removeChild(logo);
		container.removeChild( introX );

		nMenu0.style.display = "block";
		nMenu1.style.display = "block";
		nMenu.style.display = "block";
		menuDemo.style.display = "block";
	};

	var icon_sketch = [
		"<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px'",
		"width='"+iconSize+"px' height='"+iconSize+"px' viewBox='0 0 512 512' enable-background='new 0 0 512 512' xml:space='preserve'>",
		"<path id='icon_sketch' fill='"+iconColor+"' d='M406.795,288.699c0,0-150.181-200.667-167.999-223.151C230.815,55.477,218.572,50,203.566,50",
		"c-18.495,0-41.19,8.311-65.313,26.578c-43.697,33.091-55.152,68.727-37.758,93.333c17.394,24.605,169.059,224.635,169.059,224.635",
		"L429.28,462L406.795,288.699z M373.723,291.244c-8.167,6.262-19.282,9.627-31.722,9.37c-19.202-0.384-37.061-9.212-47.773-23.615",
		"c0,0-68.544-91.57-86.417-115.446c22.586-15.522,44.649-19.854,52.812-20.98C299.125,191.673,351.506,261.579,373.723,291.244z",
		"M246.924,122.409c-13.336,3.071-33.354,9.789-53.55,24.405c-20.146,14.579-32.598,33.948-39.599,47.948",
		"c-5.425-7.236-10.367-13.843-14.66-19.604c4.867-11.375,16.086-32.71,36.5-47.482c26.535-19.203,53.045-22.577,57.857-23.045",
		"C237.468,109.898,242,115.89,246.924,122.409z M122.624,136.409c4.455-11.676,16.008-24.997,32.532-37.509",
		"c17.54-13.283,35.185-20.9,48.41-20.9c6.219,0,10.689,1.661,13.286,4.938c0.673,0.85,1.557,1.982,2.607,3.34",
		"c-13.267,2.82-34.427,9.446-55.782,24.901c-18.947,13.712-31.086,31.659-38.29,45.395c-0.801-1.104-1.489-2.062-2.028-2.825",
		"C122.053,151.901,118.585,146.995,122.624,136.409z M167.747,213.368c3.66-9.166,12.858-28.557,30.038-43.972",
		"c15.447,20.63,67.472,90.116,86.398,115.472c9.793,13.118,13.633,30.794,10.538,48.497c-2.126,12.165-7.493,22.905-14.357,29.086",
		"C257.658,332.479,205.973,264.208,167.747,213.368z M374.452,408.451l-85.889-36.271c9.184-8.109,16.028-21.378,18.694-36.625",
		"c1.876-10.726,1.581-21.477-0.707-31.549c10.535,5.77,22.633,9.081,35.196,9.333c0.515,0.01,1.025,0.015,1.537,0.015",
		"c14.185,0,27.071-3.956,37.028-11.152l12.146,93.604C383.894,396.664,377.805,400.766,374.452,408.451z'/></svg>"
	].join("\n");

	var icon_github= [
		"<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px'",
		"width='"+iconSize+"px' height='"+iconSize+"px' viewBox='0 0 128 128' enable-background='new 0 0 128 128' xml:space='preserve'>",
		"<path id='icon_github' fill='"+iconColor+"' d='M64.606,16.666c-26.984,0-48.866,21.879-48.866,48.872",
		"c0,21.589,14.001,39.905,33.422,46.368c2.444,0.448,3.335-1.06,3.335-2.356c0-1.16-0.042-4.233-0.066-8.312",
		"c-13.594,2.953-16.462-6.551-16.462-6.551c-2.222-5.645-5.426-7.148-5.426-7.148c-4.437-3.032,0.336-2.971,0.336-2.971",
		"c4.904,0.346,7.485,5.036,7.485,5.036c4.359,7.468,11.438,5.312,14.222,4.061c0.444-3.158,1.706-5.312,3.103-6.533",
		"c-10.852-1.233-22.26-5.426-22.26-24.152c0-5.335,1.904-9.697,5.03-13.113c-0.503-1.236-2.18-6.205,0.479-12.933",
		"c0,0,4.103-1.314,13.438,5.01c3.898-1.084,8.078-1.626,12.234-1.645c4.15,0.019,8.331,0.561,12.234,1.645",
		"c9.33-6.324,13.425-5.01,13.425-5.01c2.666,6.728,0.989,11.697,0.486,12.933c3.132,3.416,5.023,7.778,5.023,13.113",
		"c0,18.773-11.426,22.904-22.313,24.114c1.755,1.509,3.318,4.491,3.318,9.05c0,6.533-0.06,11.804-0.06,13.406",
		"c0,1.307,0.88,2.827,3.36,2.35c19.402-6.475,33.391-24.779,33.391-46.363C113.478,38.545,91.596,16.666,64.606,16.666z'/></svg>"
	].join("\n");

	var icon_gear = [
        "<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px'",
        "width='"+iconSize+"px' height='"+iconSize+"px' viewBox='0 0 512 512' enable-background='new 0 0 512 512' xml:space='preserve'>",
        "<path id='icon_gear' fill='"+iconColor+"' d='M462,283.742v-55.485l-49.249-17.514c-3.4-11.792-8.095-23.032-13.919-33.563l22.448-47.227",
        "l-39.234-39.234l-47.226,22.449c-10.53-5.824-21.772-10.52-33.564-13.919L283.741,50h-55.484l-17.515,49.25",
        "c-11.792,3.398-23.032,8.094-33.563,13.918l-47.227-22.449l-39.234,39.234l22.45,47.227c-5.824,10.531-10.521,21.771-13.919,33.563",
        "L50,228.257v55.485l49.249,17.514c3.398,11.792,8.095,23.032,13.919,33.563l-22.45,47.227l39.234,39.234l47.227-22.449",
        "c10.531,5.824,21.771,10.52,33.563,13.92L228.257,462h55.484l17.515-49.249c11.792-3.398,23.034-8.095,33.564-13.919l47.226,22.448",
        "l39.234-39.234l-22.448-47.226c5.824-10.53,10.521-21.772,13.919-33.564L462,283.742z M256,331.546",
        "c-41.724,0-75.548-33.823-75.548-75.546s33.824-75.547,75.548-75.547c41.723,0,75.546,33.824,75.546,75.547",
        "S297.723,331.546,256,331.546z'/></svg>"
    ].join("\n");

    var icon_update = [
		"<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px'",
		"width='"+iconSize2+"px' height='"+iconSize2+"px' viewBox='0 0 512 512' enable-background='new 0 0 512 512' xml:space='preserve'>",
		"<path id='icon_update' fill='"+iconColor+"' d='M373.223,142.573l-37.252,37.253c-20.225-20.224-48.162-32.731-79.021-32.731",
		"c-61.719,0-111.752,50.056-111.752,111.776c0,0.016,0-0.016,0,0h43.412l-69.342,69.315L50,258.871h42.514c0-0.008,0,0.006,0,0",
		"c0-90.816,73.621-164.46,164.436-164.46C302.357,94.411,343.467,112.816,373.223,142.573z M462,253.129l-69.268-69.316",
		"l-69.342,69.316h43.412c0,0.016,0-0.017,0,0c0,61.72-50.033,111.776-111.752,111.776c-30.859,0-58.797-12.508-79.021-32.731",
		"l-37.252,37.253c29.758,29.757,70.867,48.162,116.273,48.162c90.814,0,164.436-73.644,164.436-164.459c0-0.007,0,0.008,0,0H462z'/></svg>"
	].join("\n");

	var outColor = 'ffffff';
	var selColor = '1a94ff';//7fdbff'


    var nMenu = document.createElement( 'div' );
	nMenu.style.cssText = "position:absolute; width:"+iconSize+"px; height:"+iconSize+"px; margin-bottom:0px; pointer-events:auto; top:6px; right:6px; display:none;";
	nMenu.innerHTML = icon_gear;
	container.appendChild( nMenu );

	nMenu.addEventListener( 'mouseover', function ( event ) { event.preventDefault(); document.getElementById("icon_gear").setAttribute('fill','#'+selColor); updateTimer = setInterval(rotateUpdate, 10, this); }, false );
	nMenu.addEventListener( 'mouseout', function ( event ) { event.preventDefault(); document.getElementById("icon_gear").setAttribute('fill','#'+outColor); clearInterval(updateTimer);}, false );
	nMenu.addEventListener( 'mousedown', function ( event ) { event.preventDefault(); showCode(); }, false );

	var nMenu0 = document.createElement( 'div' );
	nMenu0.style.cssText = "position:absolute; width:"+iconSize+"px; height:"+iconSize+"px; margin-bottom:0px; pointer-events:auto; top:6px; left:6px;  display:none;";
	nMenu0.innerHTML = "<a href='https://github.com/lo-th/Ammo.lab'  target='_blank' >"+icon_github+"</a>";//icon_github;
	container.appendChild( nMenu0 );
	
	nMenu0.addEventListener( 'mouseover', function ( event ) { event.preventDefault(); document.getElementById("icon_github").setAttribute('fill','#'+selColor); }, false );
	nMenu0.addEventListener( 'mouseout', function ( event ) { event.preventDefault(); document.getElementById("icon_github").setAttribute('fill','#'+outColor); }, false );
	nMenu0.addEventListener( 'mousedown', function ( event ) { event.preventDefault(); showCode(); }, false );

	var nMenu1 = document.createElement( 'div' );
	nMenu1.style.cssText = "position:absolute; width:"+iconSize+"px; height:"+iconSize+"px; margin-bottom:0px; pointer-events:auto; top:56px; right:6px; display:none;";
	nMenu1.innerHTML = icon_sketch;
	container.appendChild( nMenu1 );

	nMenu1.addEventListener( 'mouseover', function ( event ) { event.preventDefault(); document.getElementById("icon_sketch").setAttribute('fill','#'+selColor);  }, false );
	nMenu1.addEventListener( 'mouseout', function ( event ) { event.preventDefault(); document.getElementById("icon_sketch").setAttribute('fill','#'+outColor); }, false );
	nMenu1.addEventListener( 'mousedown', function ( event ) { event.preventDefault(); sketchMode(); }, false );

	var sketchMode = function () {
		View.sketchMode();
		if(View.isSketch){
			textColor('111111');
			outColor = '111111';
			selColor = 'ab0dd8';
			containerEdit.style.backgroundImage = 'url(images/sketch/paper.jpg)';
			document.getElementById("info").style.color = '#111111';
			document.getElementById("stats").style.color = '#111111';
			MainEditor.contentWindow.changeTheme(0);
		}else{
			textColor('cccccc');
			containerEdit.style.backgroundImage = 'none';
			document.getElementById("info").style.color = '#ffffff';
			document.getElementById("stats").style.color = '#909090'
			outColor = 'ffffff';
			selColor = '1a94ff';
			MainEditor.contentWindow.changeTheme(1);
		}
		document.getElementById("icon_sketch").setAttribute('fill','#'+outColor); 
		document.getElementById("icon_gear").setAttribute('fill','#'+outColor); 
		document.getElementById("icon_github").setAttribute('fill','#'+outColor); 
		document.getElementById("icon_update").setAttribute('fill','#'+outColor); 
	}

	var showCode = function () {
    	if(open){ 
    		hide();
    	    View.viewSize.mw = 1;
    		View.viewSize.mh = 1;
    	}else{ 
    		if(self.innerWidth>self.innerHeight){
    			show('v');
    			if(stats) stats.style.bottom = '0px';
    			View.viewSize.mw = 0.5;
    			View.viewSize.mh = 1;
    		} else {
    			show('h');
    			if(stats) stats.style.bottom = '50%';
    			View.viewSize.mw = 1;
    			View.viewSize.mh = 0.5;
    			
    		}
    	}
    	View.resize();
    }

	var show = function(mode){
		open = true;
		if(mode === 'v'){
			containerEdit.style.top = "0px";
			containerEdit.style.left = "50%";
			containerEdit.style.height = "100%";
			containerEdit.style.width = "50%";
			line.style.height = "100%";
			line.style.width = "1px";
			//line.style.left = "-1px";
		} else{
			containerEdit.style.top = "50%";
			containerEdit.style.left = "0px";
			containerEdit.style.height = "50%";
			containerEdit.style.width = "100%";
			line.style.height = "1px";
			line.style.width = "100%";
		}
		containerEdit.style.display = "block";
	}

	var hide = function(){
		open = false;
		containerEdit.style.display = "none";
		
		if(MainEditor)MainEditor.contentWindow.close()
		window.focus();
	}


	var colors = ['#303030', '#b10dc9', '#0074d9', '#ff851b'];
	var buttonActif = 'position:relative; display:inline-block; cursor:pointer; pointer-events:auto;';
	var effect= '';//-webkit-filter: drop-shadow( 1px 1px 2px #'+themes[2]+' ); filter: drop-shadow( 1px 1px 2px #'+themes[2]+' );';
	var bstyle = unselect + effect +' font-size:14px; -webkit-border-radius:40px; border-radius:40px;  border:1px solid #'+themes[2]+'; height:19px; padding:0px 0px; text-align:center;';// background:'+ degrade01;
	var bstyleMenu = unselect + effect +' font-size:12px; -webkit-border-radius:20px; border-radius:20px;  border:1px solid #'+themes[2]+'; height:19px; padding:0px 0px; text-align:center; ';


	var bbMenu = [];
	var bbColor = [];
	var nscript;
	
	var currentDemo;

	

	var rvalue = 0;
	var updateTimer;

    // RUN BUTTON
	var bRun = document.createElement( 'div' );
	bRun.id = 'Editor-Run';
	bRun.style.cssText = bstyle + buttonActif + 'top:10px; left:10px; position:absolute; width:46px; height:46px;';
	var icColor = document.createElement( 'div' );
	icColor.style.cssText = "-webkit-border-radius:40px; border-radius:40px; position:absolute; width:46px; height:46px; pointer-events:none; background-color: rgba(0,0,0,0); pointer-events:none;";
	var icRun = document.createElement( 'div' );
	icRun.style.cssText = "position:absolute; width:46px; height:46px; pointer-events:none;";
	icRun.innerHTML = icon_update; 
	containerEdit.appendChild( bRun );
	bRun.appendChild(icColor);
	bRun.appendChild(icRun);
	bRun.addEventListener( 'mousedown', function ( event ) { event.preventDefault(); update(); icColor.style.backgroundColor = 'rgba(0,116,217,0.7)'; }, false );
	bRun.addEventListener( 'mouseover', function ( event ) { event.preventDefault();  icColor.style.backgroundColor = 'rgba(0,116,217,0.1)'; updateTimer = setInterval(rotateUpdate, 10, icRun); document.getElementById("icon_update").setAttribute('fill','#'+selColor);}, false );
    bRun.addEventListener( 'mouseout', function ( event ) { event.preventDefault(); icColor.style.backgroundColor = 'rgba(0,0,0,0)'; clearInterval(updateTimer); document.getElementById("icon_update").setAttribute('fill','#'+outColor);}, false );

    var rotateUpdate = function (dom) {
    	rvalue -= 5;
		dom.style.webkitTransform = 'rotate('+rvalue+'deg)';
		dom.style.oTransform = 'rotate('+rvalue+'deg)';
		dom.style.transform = 'rotate('+rvalue+'deg)';
	}

    // MENU DEMO
    var menuDemo = document.createElement( 'div' );
	menuDemo.id = 'menuDemo';
	menuDemo.style.cssText = unselect + 'top:12px; left:180px; position:absolute; display:block; width:'+(maxDemo*28)+'px; height:60px; overflow:hidden; padding:0; display:none';
	container.appendChild( menuDemo );




	for(var i=0;i!==maxDemo;i++){
		bbMenu[i] = document.createElement( 'div' );
		bbColor[i] = document.createElement( 'div' );
		bbMenu[i].style.cssText = bstyle + buttonActif + "width:20px; margin-right:2px; padding:2px 2px;";
		bbColor[i].style.cssText = "-webkit-border-radius:40px; border-radius:40px; position:absolute; top:0; left:0; width:24px; height:24px; pointer-events:none; background-color: rgba(0,0,0,0);";
		if(i<10){
			bbMenu[i].textContent = '0'+i;
			bbMenu[i].name = 'demo0'+i;
		}else{
			bbMenu[i].textContent = i;
			bbMenu[i].name = 'demo'+i;
		}
		bbMenu[i].addEventListener( 'mousedown', function ( event ) { event.preventDefault(); importScript(this.name); this.childNodes[1].style.backgroundColor = 'rgba(0,116,217,0.7)';}, false );
		bbMenu[i].addEventListener( 'mouseover', function ( event ) { event.preventDefault(); this.childNodes[1].style.backgroundColor = 'rgba(0,116,217,0.3)'; }, false );
		bbMenu[i].addEventListener( 'mouseout', function ( event ) { event.preventDefault();  this.childNodes[1].style.backgroundColor = 'rgba(0,0,0,0)'; testCurrentDemo(); }, false );		
		menuDemo.appendChild( bbMenu[i] );
		bbMenu[i].appendChild( bbColor[i] );
	}

	// MAIN EDITOR
	var MainEditor = document.createElement( 'iframe' );
	MainEditor.id = 'mEditor';
	MainEditor.name = 'editor';
	MainEditor.src = "editor.html";
	MainEditor.style.cssText =unselect+"  top:70px; bottom:0px; left:10px; right:0;  margin:0; padding:0; position:absolute; height:calc(100% - 70px); width:calc(100% - 10px); display:block; pointer-events:auto; border:none;"
	containerEdit.appendChild( MainEditor );


	var importScript = function(name, Test){
		currentDemo = name;
		var test = Test || false;
		MainEditor.contentWindow.setBase(Editor);
		MainEditor.contentWindow.loadfileJS("demos/"+name+".js");
		if(test)testCurrentDemo();
	}

	var close = function(){
		MainEditor.contentWindow.close();
		window.focus();
	}

	var textColor = function(cc){
		for(var i=0, j=bbMenu.length;i!==j;i++){
			bbMenu[i].style.color = "#"+cc;
		}
	}

	var testCurrentDemo = function(){
		for(var i=0, j=bbMenu.length;i!==j;i++){
			if(bbMenu[i].name === currentDemo)bbMenu[i].childNodes[1].style.backgroundColor = 'rgba(177,13,201,0.5)';
			else bbMenu[i].childNodes[1].style.backgroundColor = 'rgba(0,0,0,0)';
		}
	}

	var update = function (){
		var head = document.getElementsByTagName('head')[0];
		nscript = document.createElement("script");
		nscript.type = "text/javascript";
		nscript.name = "topScript";
		nscript.id = "topScript";
		nscript.charset = "utf-8";
		nscript.text = MainEditor.contentWindow.codeEditor.getValue();
		head.appendChild(nscript);
	}

	return {
		update:update,
		importScript: importScript,
		domElement: container,
		hideIntro: hideIntro,
		close:close,
		getScript: function () {
			return nscript;
		},
		getOpen: function () {
			return open;
		}
	}

}
