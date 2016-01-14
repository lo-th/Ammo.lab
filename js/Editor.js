/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    CODEMIRROR ultimate editor
*/

'use strict';

var editor = ( function () {

    var content, codeContent, code, separator, menu, debug, title; 
    var callback = function(){};
    var isSelfDrag = false;
    var isFocus = false;
    var errorLines = [];
    var widgets = [];
    var interval = null;
    var left = 400;
    var fileName = '';
    var isMenu = false;
    var nextDemo = null;
    var selectColor = '#308AFF';
    var scrollOn = false;
    var menuPins;
    var bigmenu;
    var bigButton = [];
    var bigContent;
    var isBigMenu = false;

    var octo, octoArm;

    var icon_Github = [
        "<svg width='80' height='80' viewBox='0 0 250 250' style='fill:rgba(255,255,255,0.2); color:#2A2A2A; position: absolute; top: 0; border: 0; right: 0;'>",
        "<path d='M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z' id='octo' onmouseover='editor.Gover();' onmouseout='editor.Gout();' onmousedown='editor.Gdown();'></path>",
        "<path d='M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2' fill='currentColor' style='transform-origin: 130px 106px;' id='octo-arm'></path>",
        "<path d='M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z' fill='currentColor' id='octo-body'></path></svg>",
    ].join("\n");

    editor = function () {};

    

    editor.init = function ( Callback ) {

        if(Callback) callback = Callback;

        left = ~~ (window.innerWidth*0.4);

        // big menu

        bigmenu = document.createElement( 'div' );
        bigmenu.className = 'bigmenu';
        document.body.appendChild( bigmenu );

        this.makeBigMenu();

        // github logo

        var github = document.createElement( 'div' );
        github.style.cssText = "position:absolute; right:0; top:0; width:1px; height:1px; pointer-events:none;";
        github.innerHTML = icon_Github; 
        document.body.appendChild( github );

        octo = document.getElementById('octo');
        octoArm = document.getElementById('octo-arm');

        // debug

        debug = document.createElement( 'div' );
        debug.className = 'debug';
        document.body.appendChild( debug );

        // title

        title = document.createElement( 'div' );
        title.className = 'title';
        document.body.appendChild( title );

        // editor

        content = document.createElement('div');
        content.className = 'editor';
        document.body.appendChild( content );

        codeContent = document.createElement('div');
        codeContent.className = 'codeContent';
        //document.body.appendChild( codeContent );
        content.appendChild( codeContent );

        code = CodeMirror( codeContent, {
            lineNumbers: false, matchBrackets: true, indentWithTabs: true, styleActiveLine: true,
            theme:'monokai', mode:'text/javascript',
            tabSize: 4, indentUnit: 4, highlightSelectionMatches: {showToken: /\w/}
        });

        separator = document.createElement('div');
        separator.className = 'separator';
        document.body.appendChild( separator );

        menu = document.createElement('div');
        menu.className = 'menu';
        content.appendChild( menu );

        /*menuPins = document.createElement('div');
        menuPins.className = 'menuPins';
        content.appendChild( menuPins );
        menuPins.innerHTML = '>';*/


        /*var mid = document.createElement('div');
        mid.className = 'separator_mid';
        mid.innerHTML = '||';
        separator.appendChild( mid );*/


        code.on('change', function () { editor.onChange() } );
        code.on('focus', function () { isFocus = true; view.needFocus(); } );
        code.on('blur', function () { isFocus = false; } );
        code.on('drop', function () { if ( !isSelfDrag ) code.setValue(''); else isSelfDrag = false; } );
        code.on('dragstart', function () { isSelfDrag = true; } );

        separator.addEventListener('mouseover', editor.mid_over, false );
        separator.addEventListener('mouseout', editor.mid_out, false );
        separator.addEventListener('mousedown', editor.mid_down, false );

        /*menu.addEventListener('mouseover', editor.menu_over, false );
        menu.addEventListener('mouseout', editor.menu_out, false );
        menu.addEventListener('mousedown', editor.menu_down, false );*/

        this.resize();

    };

    editor.resize = function ( e ) {

        if( e ) left = e.clientX + 10;

        if(view){
            view.setLeft( left );
            view.resize();
        }

        bigmenu.style.left = left +'px';
        bigmenu.style.width = window.innerWidth - left +'px';
        title.style.left = left +'px';
        debug.style.left = left +'px';
        separator.style.left = (left-10) + 'px';
        content.style.width = (left-10) + 'px';
        code.refresh();

    };

    editor.tell = function ( str ) { debug.innerHTML = str; };

    // bigmenu

    editor.makeBigMenu = function(){

        bigButton[0] = document.createElement( 'div' );
        bigButton[0].className = 'bigButton';
        bigmenu.appendChild( bigButton[0] );
        bigButton[0].innerHTML = "DEMOS";
        bigButton[0].addEventListener('mousedown', editor.selectBigMenu, false );

        bigButton[1] = document.createElement( 'div' );
        bigButton[1].className = 'bigButton';
        bigmenu.appendChild( bigButton[1] );
        bigButton[1].innerHTML = "CODE";


        bigContent = document.createElement( 'div' );
        bigContent.className = 'bigContent';
        bigmenu.appendChild( bigContent );
        //bigContent.style.display = "none";




        var i = bigButton.length;
        while(i--){
            bigButton[i].addEventListener('mouseover', editor.Bover, false );
            bigButton[i].addEventListener('mouseout', editor.Bout, false );
        }

    }

    editor.selectBigMenu = function(e){

        if(isBigMenu) editor.hideBigMenu();
        else editor.showBigMenu()
    };

    editor.showBigMenu = function(e){

        //bigContent.style.display = "block";
        bigmenu.style.background = "rgba(0,0,0,0.5)";
        isBigMenu = true;



        var lng = demos.length, name, n=1;
        for( var i = 0; i < lng ; i++ ) {
            name = demos[i];
            if( name !== fileName ) editor.addButtonBig( demos[i] );
        }
    };

    editor.hideBigMenu = function(e){

        //bigContent.style.display = "none";
        bigmenu.style.background = "rgba(0,0,0,0)";
        isBigMenu = false;

        var i = bigContent.childNodes.length, b;
        while(i--){
            b = bigContent.childNodes[i];
            b.removeEventListener('mousedown', editor.bigDown );
            bigContent.removeChild( b );
        }

    };

    editor.addButtonBig = function ( name ) {

        var b = document.createElement('div');
        b.className = 'menuButtonBig';
        bigContent.appendChild( b );
        b.innerHTML = '&bull; ' + name.charAt(0).toUpperCase() + name.substring(1).toLowerCase();
        b.name = name;
        b.addEventListener('mousedown', editor.bigDown, false );

    };

    editor.bigDown = function(e){

        editor.hideBigMenu();
        editor.load('demos/' + e.target.name + '.js');

    };

    editor.Bover = function(e){
        e.target.style.border = "1px solid "+selectColor;
        e.target.style.background = selectColor;;
        e.target.style.color = "#2A2A2A";
    };

    editor.Bout = function(e){
        e.target.style.border = "1px solid rgba(255, 255, 255, 0.2)";
        e.target.style.background = "none";
        e.target.style.color = "#dedede"
    };

    // github logo

    editor.Gover = function(){
        octo.setAttribute('fill', '#105AE2'); 
        octoArm.style.webkitAnimationName = 'octocat-wave'; 
        octoArm.style.webkitAnimationDuration = '560ms';
    }

    editor.Gout = function(){
        octo.setAttribute('fill','rgba(255,255,255,0.2)');  
        octoArm.style.webkitAnimationName = 'none';
    }

    editor.Gdown = function(){
        window.location.assign('https://github.com/lo-th/Ammo.lab');
    }

    // menu

    /*editor.menu_over = function () { 

        menu.style.background = 'rgba(255, 255, 255, 0.2)';
        menu.style.borderBottom = '1px solid rgba(255, 255, 255, 0)';
        menu.style.color = '#000000';
        menuPins.style.background = selectColor;

    };

    editor.menu_out = function () { 

        menu.style.background = 'none';
        menu.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
        menu.style.color = '#d2cec8';
        menuPins.style.background = 'none';
        if( isMenu ) editor.menu_hide();

    };

    editor.menu_move = function ( e ) {

        if( !isMenu ) return;
        nextDemo = null;

        if(scrollOn) if(e.clientX>(left-35)) return;

        var y = ~~ ((e.clientY-10+menu.scrollTop)/30);
        var i = menu.childNodes.length, b;
        while(i--){
            if(i!==0){
                b = menu.childNodes[i];
                if(y === i ){
                    nextDemo = demos[b.name];
                    b.style.background = selectColor;
                } else{
                    b.style.background = '#0d0d0d';
                }
            }
        }

    };

    editor.menu_down = function () {

        if(isMenu){
            if( nextDemo !== null ){
                editor.load('demos/' + nextDemo + '.js');
                nextDemo = null;
                editor.menu_hide();
            }
        } else {

            var lng = demos.length, name, n=1;
            var ly = 41+ (((lng-1) * 30));
            if(ly>window.innerHeight) ly = window.innerHeight;
            menu.style.height = ly + 'px';

            isMenu = true;

            for( var i = 0; i < lng ; i++ ) {
                name = demos[i];
                if( name !== fileName ) editor.addButton( demos[i], i, n++ );
            }

            if(menu.scrollHeight > menu.clientHeight) scrollOn = true;
            else scrollOn = false;

            if(scrollOn) menuPins.style.display = 'none';

            menu.addEventListener('mousemove', editor.menu_move, false );
        }
        
    };

    editor.menu_hide = function () { 

        isMenu = false;
        menu.style.height =  40 + 'px';
        var i = menu.childNodes.length, b;
        while(i--){
            if(i!==0){
                b = menu.childNodes[i];
                menu.removeChild( b );
            }
        }
        menuPins.style.display = 'block';
        menu.removeEventListener('mousemove', editor.menu_move, false );

    };

    editor.addButton = function ( name, id , n ) {

        var b = document.createElement('div');
        b.className = 'menuButton';
        menu.appendChild( b );
        b.innerHTML = '&bull; ' + name;
        b.style.color = '#d2cec8';
        b.style.top = (40 + (n-1)*30 )+ 'px';
        if(n==1) b.style.top = 40 + 'px';
        b.name = id;
        if(n==1) b.style.borderTop = '1px solid rgba(255, 255, 255, 0.2)';

    };*/

    // separator

    editor.mid_over = function () { 

        separator.style.background = 'rgba(255, 255, 255, 0.2)';
        separator.style.borderLeft = '1px solid rgba(255, 255, 255, 0)';
        separator.style.borderRight = '1px solid rgba(255, 255, 255, 0)';
        separator.style.color = '#000000';

    };

    editor.mid_out = function () { 

        separator.style.background = 'none';
        separator.style.borderLeft = '1px solid rgba(255, 255, 255, 0.2)';
        separator.style.borderRight = '1px solid rgba(255, 255, 255, 0.2)';
        separator.style.color = 'rgba(255, 255, 255, 0.2)';

    };

    editor.mid_down = function () {

        document.addEventListener('mouseup', editor.mid_up, false );
        document.addEventListener('mousemove', editor.resize, false );

    };

    editor.mid_up = function () {

        document.removeEventListener('mouseup', editor.mid_up, false );
        document.removeEventListener('mousemove', editor.resize, false );

    };

    // code

    editor.load = function ( url ) {

        fileName = url.substring(url.indexOf("/")+1, url.indexOf("."));

        var xhr = new XMLHttpRequest();
        xhr.overrideMimeType('text/plain; charset=x-user-defined'); 
        xhr.open('GET', url, true);
        xhr.onload = function(){ 

            code.setValue( xhr.responseText ); 

        }
        
        xhr.send();

    };

    editor.unFocus = function () {

        code.getInputField().blur();
        view.haveFocus();

    };

    editor.refresh = function () {

        code.refresh();

    },

    editor.getFocus = function () {

        return isFocus;

    },

    editor.validate = function ( value ) {

        return code.operation( function () {
            while ( errorLines.length > 0 ) code.removeLineClass( errorLines.shift(), 'background', 'errorLine' );
            var i = widgets.length;
            while(i--) code.removeLineWidget( widgets[ i ] );
            widgets.length = 0;
            var string = value;
            try {
                var result = esprima.parse( string, { tolerant: true } ).errors;
                i = result.length;
                while(i--){
                    var error = result[ i ];
                    var m = document.createElement( 'div' );
                    m.className = 'esprima-error';
                    m.textContent = error.message.replace(/Line [0-9]+: /, '');
                    var l = error.lineNumber - 1;
                    errorLines.push( l );
                    code.addLineClass( l, 'background', 'errorLine' );
                    var widget = code.addLineWidget( l, m );
                    widgets.push( widget );
                }
            } catch ( error ) {
                var m = document.createElement( 'div' );
                m.className = 'esprima-error';
                m.textContent = error.message.replace(/Line [0-9]+: /, '');
                var l = error.lineNumber - 1;
                errorLines.push( l );
                code.addLineClass( l, 'background', 'errorLine' );
                var widget = code.addLineWidget( l, m );
                widgets.push( widget );
            }
            return errorLines.length === 0;
        });

    };

    editor.onChange = function () {

        clearTimeout( interval );
        var value = code.getValue();
        if( this.validate( value ) ) interval = setTimeout( function() { editor.inject( value ); }, 500);

    },

    editor.inject = function ( value ) {

        var oScript = document.createElement("script");
        oScript.language = "javascript";
        oScript.type = "text/javascript";
        oScript.text = value;
        document.getElementsByTagName('BODY').item(0).appendChild(oScript);

        menu.innerHTML = '&bull; ' + fileName;
        title.innerHTML = fileName.charAt(0).toUpperCase() + fileName.substring(1).toLowerCase();//fileName;

        callback( fileName );

    };


    return editor;

})();