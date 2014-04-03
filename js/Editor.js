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
