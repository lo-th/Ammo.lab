/**
 * @author loth / http://3dflashlo.wordpress.com/
 */

'use strict';
var Editor = function (Pos) {

	var left = Pos || 310;//590;
	var render3d, scene3d = null;
	var unselect = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none;'
	var textselect = '-o-user-select:text; -ms-user-select:text; -khtml-user-select:text; -webkit-user-select:text; -moz-user-select: text;'
	var mini = true;
	var type = "color";
	var open = false;

    var container = document.createElement( 'div' );
	container.style.cssText = unselect+'position:absolute; margin:0; padding:0; top:0px; bottom:0px;right:0px; color:#CCCCCC; width:100%; height:100% font-size:12px; font-family:SourceCode;  pointer-events:none;';
	container.id = 'Editor';

	var containerEdit = document.createElement( 'div' );
	containerEdit.style.cssText = unselect+'position:absolute; margin:0; padding:0; top:0px; left:50%; color:#CCCCCC; width:50%; height:100%; font-size:12px; font-family:SourceCode;  pointer-events:none; display:none; background: linear-gradient(45deg, #1d1f20, #2f3031);';
	containerEdit.id = 'EditorRoot';
	container.appendChild( containerEdit );

	var iconSize = 36;
	var iconColor = '#ffffff';

	var icon_github= [
	    "<svg version='1.1' id='Calque_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px'",
		"width='"+iconSize+"px' height='"+iconSize+"px' viewBox='0 0 512 512' enable-background='new 0 0 512 512' xml:space='preserve'>",
	    "<path id='icon_github' fill='"+iconColor+"' d='M256,90c44.34,0,86.026,17.267,117.38,48.62C404.733,169.974,422,211.66,422,256",
		"s-17.267,86.026-48.62,117.38C342.026,404.732,300.34,422,256,422s-86.026-17.268-117.38-48.62C107.267,342.026,90,300.34,90,256",
		"s17.267-86.026,48.62-117.38C169.974,107.267,211.66,90,256,90 M256,50C142.229,50,50,142.229,50,256s92.229,206,206,206",
		"s206-92.229,206-206S369.771,50,256,50L256,50z M391.25,266.53l0.238-2.476c-14.836-1.439-29.593-1.567-43.927-0.473",
		"c2.304-7.354,3.518-15.659,3.43-25.104c-0.188-20.065-6.879-35.692-17.394-48.662c2.02-12.216,0.498-24.431-3.312-36.651",
		"c-15.024,1.23-28.547,6.151-40.587,14.7c-22.502-4.564-45.001-4.855-67.503,0c-14.044-9.479-27.835-14.127-41.413-14.7",
		"c-4.025,13.456-4.646,26.719-1.242,39.76c-11.846,12.57-16.373,27.828-16.151,44.724c0.127,9.672,1.617,18.279,4.367,25.888",
		"c-14.125-1.036-28.643-0.896-43.244,0.518l0.239,2.476c14.869-1.443,29.652-1.563,44.012-0.439c0.527,1.278,1.058,2.552,1.663,3.769",
		"c-15.559-0.41-29.561,0.941-42.674,4.166l0.592,2.412c13.31-3.271,27.566-4.588,43.485-4.053",
		"c10.527,18.703,30.794,29.693,60.306,33.182c-6.856,5.568-10.543,12.137-11.492,19.57c0,0-3.103,0-15.63,0",
		"c-20.992,0-26.715-26.766-48.457-24.125c21.093,10.461,16.88,43.896,50.633,43.896c11.343,0,13.755,0,14.181,0v30.648",
		"c0.15,4.952-2.006,8.265-5.488,10.56c12.088,1.221,21.172-4.814,21.172-12.217s0-36.902,0-40.512s3.779-3.889,3.779-3.889v47.3",
		"c0.16,4.707-2.128,7.383-4.556,9.939c10.649,0.425,20.666-1.702,21.12-10.766c0,0,0-42.993,0-45.269s3.729-2.332,3.729,0",
		"s0,43.145,0,43.145c0.11,7.646,6.714,13.845,20.705,12.89c-3.743-3.013-4.892-6.059-4.892-10.466c0-4.406,0-46.773,0-46.773",
		"s3.856-0.196,3.856,3.889c0,4.086,0,32.614,0,39.451c0,8.779,10.54,12.402,22.569,12.062c-3.94-2.952-6.608-6.474-6.625-11.182",
		"v-47.443c-0.407-6.974-3.242-13.548-8.802-19.673c26.978-4.142,46.422-14.91,56.104-34.211c15.971-0.549,30.271,0.766,43.615,4.047",
		"l0.592-2.412c-13.215-3.248-27.333-4.599-43.037-4.157c0.543-1.226,1.082-2.456,1.547-3.749",
		"C361.268,264.955,376.216,265.069,391.25,266.53z'/></svg>"
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

    var nMenu = document.createElement( 'div' );
	nMenu.style.cssText = "position:absolute; width:"+iconSize+"px; height:"+iconSize+"px; margin-bottom:0px; pointer-events:auto; top:6px; right:6px; ";
	nMenu.innerHTML = icon_gear;
	container.appendChild( nMenu );

	nMenu.addEventListener( 'mouseover', function ( event ) { event.preventDefault(); document.getElementById("icon_gear").setAttribute('fill','#7fdbff'); }, false );
	nMenu.addEventListener( 'mouseout', function ( event ) { event.preventDefault(); document.getElementById("icon_gear").setAttribute('fill','#ffffff'); }, false );
	nMenu.addEventListener( 'mousedown', function ( event ) { event.preventDefault(); showCode(); }, false );

	var nMenu0 = document.createElement( 'div' );
	nMenu0.style.cssText = "position:absolute; width:"+iconSize+"px; height:"+iconSize+"px; margin-bottom:0px; pointer-events:auto; top:6px; left:6px; ";
	nMenu0.innerHTML = "<a href='https://github.com/lo-th/Ammo.lab'  target='_blank' >"+icon_github+"</a>";//icon_github;
	container.appendChild( nMenu0 );
	
	nMenu0.addEventListener( 'mouseover', function ( event ) { event.preventDefault(); document.getElementById("icon_github").setAttribute('fill','#7fdbff'); }, false );
	nMenu0.addEventListener( 'mouseout', function ( event ) { event.preventDefault(); document.getElementById("icon_github").setAttribute('fill','#ffffff'); }, false );
	nMenu0.addEventListener( 'mousedown', function ( event ) { event.preventDefault(); showCode(); }, false );

	var showCode = function () {
    	if(open){ hide(); viewSize = {w:1, h:1}; }
    	else{ 
    		if(self.innerWidth>self.innerHeight){
    			show('v');
    			viewSize = {w:0.5, h:1};
    		} else {
    			show('h');
    			viewSize = {w:1, h:0.5};
    		}
    	}
    	resize();
    }

	var show = function(mode){
		open = true;
		if(mode === 'v'){
			containerEdit.style.top = "0px";
			containerEdit.style.left = "50%";
			containerEdit.style.height = "100%";
			containerEdit.style.width = "50%";
		} else{
			containerEdit.style.top = "50%";
			containerEdit.style.left = "0px";
			containerEdit.style.height = "50%";
			containerEdit.style.width = "100%";
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
	var bstyle =unselect+ ' font-size:14px; margin-right:4px; -webkit-border-radius:20px; border-radius:20px;  border:2px solid #252525; background:'+colors[0]+'; height:19px; padding:2px 2px; text-align:center;';

	var bbMenu = [];
	var nscript;
	var maxDemo = 5;
	var currentDemo;


	var decoFrame = document.createElement( 'div' );
	decoFrame.id = 'decoFrame';
	decoFrame.style.cssText =unselect+'top:10px; left:130px; position:absolute; display:block; width:calc(100% - 120px); height:60px; overflow:hidden; padding:0;';
	containerEdit.appendChild( decoFrame );

    // RUN BUTTON
	var bRun = document.createElement( 'div' );
	bRun.id = 'Editor-Run';
	bRun.style.cssText =bstyle+buttonActif+'top:10px; left:10px; position:absolute; width:100px; height:30px; padding-top:12px;';
	bRun.textContent = "RUN SCRIPT";
	containerEdit.appendChild( bRun );
	bRun.addEventListener( 'mousedown', function ( event ) { event.preventDefault(); update(); this.style.backgroundColor = colors[3]; }, false );
	bRun.addEventListener( 'mouseover', function ( event ) { event.preventDefault();  this.style.backgroundColor = colors[2]; }, false );
    bRun.addEventListener( 'mouseout', function ( event ) { event.preventDefault(); this.style.backgroundColor = colors[0]; }, false );



    // MENU DEMO
	for(var i=0;i!==maxDemo;i++){
		bbMenu[i] = document.createElement( 'div' );
		bbMenu[i].style.cssText = bstyle + buttonActif + "width:20px; margin-right=2px;";
		if(i<10){
			bbMenu[i].textContent = '0'+i;
			bbMenu[i].name = 'demo0'+i;
		}else{
			bbMenu[i].textContent = i;
			bbMenu[i].name = 'demo'+i;
		}
		bbMenu[i].addEventListener( 'mousedown', function ( event ) { event.preventDefault(); importScript(this.name); currentDemo=this.name; this.style.backgroundColor =  colors[3];}, false );
		bbMenu[i].addEventListener( 'mouseover', function ( event ) { event.preventDefault(); this.style.backgroundColor = colors[2]; }, false );
		bbMenu[i].addEventListener( 'mouseout', function ( event ) { event.preventDefault();  this.style.backgroundColor = colors[0]; testCurrentDemo(); }, false );		
		decoFrame.appendChild( bbMenu[i] );
	}



	// MAIN EDITOR
	var MainEditor = document.createElement( 'iframe' );
	MainEditor.id = 'mEditor';
	MainEditor.name = 'editor';
	MainEditor.src = "editor.html";
	MainEditor.style.cssText =unselect+"  top:70px; bottom:0px; left:10px; right:0;  margin:0; padding:0; position:absolute; height:calc(100% - 70px); width:calc(100% - 10px); display:block; pointer-events:auto; border:none;"
	containerEdit.appendChild( MainEditor );


	var importScript = function(name){
		MainEditor.contentWindow.setBase(Editor);
		MainEditor.contentWindow.loadfile("demos/"+name+".html");
	}

	var testCurrentDemo = function(){
		for(var i=0, j=bbMenu.length;i!==j;i++){
			if(bbMenu[i].name === currentDemo)bbMenu[i].style.backgroundColor = colors[1];
			else bbMenu[i].style.backgroundColor = colors[0];
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
		domElement: container,
		show:show,
		hide:hide,
		importScript:importScript,
		getScript: function () {
			return nscript;
		}
	}

}
