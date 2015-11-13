/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    CODEMIRROR ultimate editor
*/

var editor = ( function () {

    var content, code, separator; 
    var callback = function(){};
    var isSelfDrag = false;
    var isFocus = false;
    var dragView = false;
    var errorLines = [];
    var widgets = [];
    var interval = null;
    var left = 400;

    editor = function () {};

    editor.init = function ( Callback ) {

        if(Callback) callback = Callback;

        left = ~~ (window.innerWidth*0.4);

        content = document.createElement('div');
        content.className = 'editor';
        document.body.appendChild( content );

        code = CodeMirror( content, {
            lineNumbers: false, matchBrackets: true, indentWithTabs: true, styleActiveLine: true,
            theme:'monokai', mode:'text/javascript',
            tabSize: 4, indentUnit: 4, highlightSelectionMatches: {showToken: /\w/}
        });

        separator = document.createElement('div');
        separator.className = 'separator';
        document.body.appendChild( separator );

        var mid = document.createElement('div');
        mid.className = 'separator_mid';
        mid.innerHTML = '|||';
        separator.appendChild( mid );

        var _this = this;
        code.on('change', function () { _this.onChange() } );
        code.on('focus', function () { isFocus = true; } );
        code.on('blur', function () { isFocus = false; } );
        code.on('drop', function () { if ( !isSelfDrag ) code.setValue(''); else isSelfDrag = false; } );
        code.on('dragstart', function () { isSelfDrag = true; } );
        //this.code.on('dragend', function(e) { _this.isSelfDrag=false; } );

        separator.addEventListener('mousedown', function () { dragView = true;  } );
        document.addEventListener('mouseup', function () { dragView = false; } );
        document.addEventListener('mousemove', function (e) { if( dragView ){ left = e.clientX+10; _this.resize(); } } );

        this.resize();

    };

    editor.resize = function () {

        if(view){ 
            view.setLeft( left );
            view.resize();
        }

        separator.style.left = (left-20) + 'px';
        content.style.width = (left-20) + 'px';

    };

    editor.load = function ( url ) {

        console.log(url)

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

        var name = value.substring(value.indexOf("function")+9, value.indexOf("("));
        var oScript = document.createElement("script");
        oScript.language = "javascript";
        oScript.type = "text/javascript";
        oScript.text = value;
        document.getElementsByTagName('BODY').item(0).appendChild(oScript);

        callback( name );

    };


    return editor;

})();