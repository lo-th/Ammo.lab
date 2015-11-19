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
    var dragView = false;
    var errorLines = [];
    var widgets = [];
    var interval = null;
    var left = 400;
    var fileName = '';
    var isMenu = false;
    var nextDemo = null;

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

        //codeContent.focus();

        separator = document.createElement('div');
        separator.className = 'separator';
        document.body.appendChild( separator );

        menu = document.createElement('div');
        menu.className = 'menu';
        content.appendChild( menu );

        /*var mid = document.createElement('div');
        mid.className = 'separator_mid';
        mid.innerHTML = '||';
        separator.appendChild( mid );*/

        var _this = this;
        code.on('change', function () { _this.onChange() } );
        code.on('focus', function () { isFocus = true; } );
        code.on('blur', function () { isFocus = false; } );
        code.on('drop', function () { if ( !isSelfDrag ) code.setValue(''); else isSelfDrag = false; } );
        code.on('dragstart', function () { isSelfDrag = true; } );
        //this.code.on('dragend', function(e) { _this.isSelfDrag=false; } );

        separator.addEventListener('mouseover', function () { _this.mid_select(); } );
        separator.addEventListener('mouseout', function () { if(!dragView) _this.mid_unselect(); } );

        separator.addEventListener('mousedown', function () { dragView = true;  } );
        document.addEventListener('mouseup', function () { dragView = false;  _this.mid_unselect(); } );
        document.addEventListener('mousemove', function (e) { if( dragView ){ left = e.clientX+10; _this.resize(); } } );

        menu.addEventListener('mouseover', function () { _this.menu_select(); } );
        menu.addEventListener('mouseout', function () { _this.menu_unselect(); } );
        menu.addEventListener('mousedown', function () { _this.menu_down(); } );
        menu.addEventListener('mousemove', function (e) { _this.menu_move(e); } );
        this.resize();

    };
    editor.menu_select = function () { 

        menu.style.background = 'rgba(255, 255, 255, 0.2)';
        menu.style.borderBottom = '1px solid rgba(255, 255, 255, 0)';
        menu.style.color = '#000000';

    };

    editor.menu_unselect = function () { 

        menu.style.background = 'none';
        menu.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
        menu.style.color = '#d2cec8';

        if( isMenu ) this.menu_hide();

    };

    editor.menu_move = function ( e ) {

        if( !isMenu ) return;

        var y = ~~ (e.clientY*0.025);
        var i = menu.childNodes.length, b;
        while(i--){
            if(i!==0){
                b = menu.childNodes[i];
                if(y === i ){
                    nextDemo = demos[b.name];
                    b.style.background = '#0d44AA';
                } else b.style.background = '#0d0d0d';
            }
        }

    };

    editor.menu_down = function () { 
        if(isMenu){
            if( nextDemo !== null ){
                this.load('demos/' + nextDemo + '.js');
                nextDemo = null;
                this.menu_hide();
                
            }

        } else {

            var lng = demos.length, name, n=1;
            menu.style.height = (lng * 40) + 'px';

            isMenu = true;

            for( var i = 0; i<lng ; i++ ) {
                name = demos[i];
                if( name !== fileName ){
                    this.addButton( demos[i], i, n++ );
                }
            }
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

        //menu.innerHTML = '&bull; ' + fileName;

    };

    editor.addButton = function ( name, id , n ) {

        var b = document.createElement('div');
        b.className = 'menuButton';
        menu.appendChild( b );
        b.innerHTML = '&bull; ' + name;
        b.style.color = '#d2cec8';
        b.style.top = n*40 + 'px';
        b.name = id;
        if(n==1) b.style.borderTop = '1px solid rgba(255, 255, 255, 0.2)';

    };

    editor.mid_select = function () { 

        separator.style.background = 'rgba(255, 255, 255, 0.2)';
        separator.style.borderLeft = '1px solid rgba(255, 255, 255, 0)';
        separator.style.borderRight = '1px solid rgba(255, 255, 255, 0)';
        separator.style.color = '#000000';

    };

    editor.mid_unselect = function () { 

        separator.style.background = 'none';
        separator.style.borderLeft = '1px solid rgba(255, 255, 255, 0.2)';
        separator.style.borderRight = '1px solid rgba(255, 255, 255, 0.2)';
        separator.style.color = 'rgba(255, 255, 255, 0.2)';

    };

    editor.resize = function () {

        if(view){ 
            view.setLeft( left );
            view.resize();
        }

        separator.style.left = (left-10) + 'px';
        content.style.width = (left-10) + 'px';
        //codeContent.style.width = (left-10) + 'px';

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

    };

    editor.refresh = function () {

        code.refresh();

    },

    editor.getFocus = function () {

        return isFocus;

    },

    editor.validate = function ( value ) {

        //var _this = this;
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
        //editor.focus();
    },

    editor.inject = function ( value ) {

        //var name = value.substring(value.indexOf("function")+9, value.indexOf("("));
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