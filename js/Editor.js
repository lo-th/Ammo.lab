/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    CODEMIRROR ultimate editor
*/

var editor = ( function () {

    var content, codeContent, code, separator, menu; 
    var callback = function(){};
    var isSelfDrag = false;
    var isFocus = false;
    //var dragView = false;
    var errorLines = [];
    var widgets = [];
    var interval = null;
    var left = 400;
    var fileName = '';
    var isMenu = false;
    var nextDemo = null;
    var selectColor = '#105AE2';

    editor = function () {};

    editor.init = function ( Callback ) {

        if(Callback) callback = Callback;

        left = ~~ (window.innerWidth*0.4);

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

        menuPins = document.createElement('div');
        menuPins.className = 'menuPins';
        content.appendChild( menuPins );
        menuPins.innerHTML = '>';


        /*var mid = document.createElement('div');
        mid.className = 'separator_mid';
        mid.innerHTML = '||';
        separator.appendChild( mid );*/

        var _this = this;
        code.on('change', function () { _this.onChange() } );
        code.on('focus', function () { isFocus = true; view.needFocus(); } );
        code.on('blur', function () { isFocus = false; } );
        code.on('drop', function () { if ( !isSelfDrag ) code.setValue(''); else isSelfDrag = false; } );
        code.on('dragstart', function () { isSelfDrag = true; } );

        separator.addEventListener('mouseover', editor.mid_over, false );
        separator.addEventListener('mouseout', editor.mid_out, false );
        separator.addEventListener('mousedown', editor.mid_down, false );

        menu.addEventListener('mouseover', editor.menu_over, false );
        menu.addEventListener('mouseout', editor.menu_out, false );
        menu.addEventListener('mousedown', editor.menu_down, false );

        this.resize();

    };

    editor.menu_over = function () { 

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
        var y = ~~ ((e.clientY-10)/30);
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

            menu.addEventListener('mousemove', editor.menu_move, false );
        }
        
    };

    editor.menu_hide = function () { 

        isMenu = false;
        menu.style.height =  40 + 'px';
        var i = menu.childNodes.length;
        while(i--){
            if(i!==0){
                b = menu.childNodes[i];
                menu.removeChild( b );
            }
        }
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

    };

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

    editor.resize = function ( e ) {

        if( e ) left = e.clientX + 10;

        if(view){
            view.setLeft( left );
            view.resize();
        }

        separator.style.left = (left-10) + 'px';
        content.style.width = (left-10) + 'px';
        code.refresh();

    };

    editor.load = function ( url ) {

        fileName = url.substring(url.indexOf("/")+1, url.indexOf("."));

        var xhr = new XMLHttpRequest();
        xhr.overrideMimeType('text/plain; charset=x-user-defined'); 
        xhr.open('GET', url, true);
        xhr.onload = function(){ code.setValue( xhr.responseText ); }
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

        callback( fileName );

    };


    return editor;

})();