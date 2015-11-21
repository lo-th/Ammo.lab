var intro = ( function () {

    intro = function () {};

    var content, logo, logotext;
    var size = 90;
    var sizey = 90;
    var color = '#505050';
   // var introStyle = //"color:"+color+"; -webkit-filter: drop-shadow( -1px -1px 1px #ff0000 ); -ms-filter: 'progid:DXImageTransform.Microsoft.Shadow( Strength=4, Direction=135, Color='#00ffff' )'; filter: drop-shadow( -1px -1px 1px #ff0000 ); pointer-events:none; font-size:40px; font-weight:800;";
    var introStyle = "color:"+color+";  pointer-events:none; font-size:40px; font-weight:800;";
    var icon_libs= [
        "<svg version='1.1' id='Calque_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px'",
        "width='"+size+"px' height='"+sizey+"px' viewBox='0 40 128 50' enable-background='new 0 40 128 50' xml:space='preserve' >",
        "<defs><filter id='f1' x='0' y='0' width='200%' height='200%'>",
        "<feOffset result='offOut' in='SourceGraphic' dx='20' dy='20' />",
        "<feBlend in='SourceGraphic' in2='offOut' mode='normal' />",
        "</filter></defs>",
        "<g><path id='icon_libs' fill='"+color+"' d='M78.881,34.035v-3.054C81.464,30.785,83.5,28.633,83.5,26c0-2.761-2.239-5-5-5c-0.75,0-5.958,0-7.872,4.25",
        "c-2.123,4.715-1.709,8.826-1.709,8.826c0,21.715,17.59,23.895,17.59,40.494c0,12.389-10.078,22.467-22.467,22.467",
        "c-12.389,0-22.467-10.079-22.467-22.467c0-16.911,17.59-18.498,17.59-40.494c0,0,0.086-4.41-2.529-8.826",
        "C54.142,21.039,50,21,49.25,21c-2.761,0-5,2.239-5,5c0,2.717,2.169,4.923,4.869,4.993v3.042c0,17.909-17.59,17.92-17.59,40.494",
        "C31.528,92.462,46.066,107,64,107s32.471-14.538,32.471-32.471C96.471,52.276,78.881,51.708,78.881,34.035z'/>",
        "<circle fill='"+color+"' cx='64.93' cy='85.46' r='3.87'/>",
        "<circle fill='"+color+"' cx='64.75' cy='72.12' r='3.061'/>",
        "<circle fill='"+color+"' cx='64.58' cy='58.43' r='2.764'/>",
        "<circle fill='"+color+"' cx='76.32' cy='76.66' r='3.518'/>",
        "<circle fill='"+color+"' cx='55.49' cy='65.33' r='2.764'/>",
        "<circle fill='"+color+"' cx='52.72' cy='78.19' r='4.523'/>",
        //"<text x='0' y='15' fill='red'>I love SVG!</text>",
        "</g></svg>"
    ].join("\n");

    intro.init = function () {

        content = document.createElement( 'div' );
        //content.style.cssText = "-webkit-filter: drop-shadow( 1px 1px 1px #00ffff ); -ms-filter: 'progid:DXImageTransform.Microsoft.Shadow( Strength=4, Direction=135, Color='#00ffff' )'; filter: drop-shadow( 1px 1px 1px #00ffff ); text-align:center; position:absolute; margin:0; padding:0; top:50%; left:50%; width:300px; height:150px; margin-left:-150px; margin-top:-75px; display:block; pointer-events:none";
        content.style.cssText = "text-align:center; position:absolute; margin:0; padding:0; top:50%; left:50%; width:375px; height:150px; margin-left:-187px; margin-top:-75px; display:block; pointer-events:none";
        
        document.body.appendChild( content );

        logo = document.createElement( 'img' );
        logo.src = 'textures/logo.png';

        //logo = document.createElement( 'div' );
        //logo.style.cssText = introStyle;
        //logo.innerHTML = icon_libs;
        content.appendChild( logo );

        /*logotext = document.createElement( 'div' );
        logotext.style.cssText = introStyle + 'margin-top:-30px;'; 
        logotext.innerHTML = "Ammo.lab";
        content.appendChild( logotext );*/

    };

    intro.clear = function () {

        content.removeChild( logo );
        //content.removeChild( logotext );
        document.body.removeChild( content );

    };

    return intro;

})();