"use strict";


var user = ( function () {

    // key map
    // 0 : axe L | left:right  -1>1
    // 1 : axe L | top:down    -1>1
    // 2 : axe R | left:right  -1>1
    // 3 : axe R | top:down    -1>1
    // 4 : bouton A             0-1  jump / space
    // 5 : bouton B             0-1
    // 6 : bouton X             0-1
    // 7 : bouton Y             0-1
    // 8 : gachette L up        0-1
    // 9 : gachette R up        0-1
    // 10 : gachette L down     0>1
    // 11 : gachette R down     0>1
    // 12 : bouton setup        0-1
    // 13 : bouton menu         0-1
    // 14 : axe button left     0-1
    // 15 : axe button right    0-1
    // 16 : Xcross axe top      0-1
    // 17 : Xcross axe down     0-1
    // 18 : Xcross axe left     0-1
    // 19 : Xcross axe right    0-1

    // 20 : Keyboard or Gamepad    0-1

    var key = new Float32Array( 20 );
    var gamepad;
    var useGamepad = false;

    user = function () {};

    user.init = function ( callback ) {

        gamepad = new Gamepad( key ); 

        document.addEventListener( 'keydown', user.keyDown, false );
        document.addEventListener( 'keyup', user.keyUp, false );


    };

    user.update = function () {

        gamepad.update();

        if(gamepad.ready) gamepad.getValue(0);
       // else { if() useGamepad = true; }

    }


    user.keyDown = function ( e ) {

        if( editor.getFocus() ) return;
        e = e || window.event;
        switch ( e.keyCode ) {
            // axe L
            case 65: case 81: key[0] = -1;break;//key[0]<=-1 ? -1:key[0]-= 0.1; break; // left, A, Q
            case 68:          key[0] = key[0] = 1;  break; // right, D
            case 87: case 90: key[1] = key[1] = -1; break; // up, W, Z
            case 83:          key[1] = key[1] = 1;  break; // down, S
            // axe R
            case 37:          key[2] = -1; break; // left
            case 39:          key[2] = 1;  break; // right
            case 38:          key[3] = -1; break; // up
            case 40:          key[3] = 1;  break; // down
            

            case 17: case 67:          key[5] = 1; break; // ctrl, C
            case 69:                   key[5] = 1; break; // E
            case 32:                   key[4] = 1; break; // space
            case 16:                   key[7] = 1; break; // shift

            case 71:                   view.sh_grid(); break; // G
        }

        gamepad.reset();

        //if(useGamepad){ useGamepad = false;  }

        // send to worker
        //ammo.send( 'key', key );

        //console.log( e.which, String.fromCharCode(e.which) );

    };

    user.keyUp = function ( e ) {

        if( editor.getFocus() ) return;
        e = e || window.event;
        switch( e.keyCode ) {
            // axe L
            case 65: case 81: key[0] = key[0]<0 ? 0:key[0]; break; // left, A, Q
            case 68:          key[0] = key[0]>0 ? 0:key[0]; break; // right, D
            case 87: case 90: key[1] = key[1]<0 ? 0:key[1]; break; // up, W, Z
            case 83:          key[1] = key[1]>0 ? 0:key[1]; break; // down, S
            // axe R
            case 37:          key[2] = key[2]<0 ? 0:key[2]; break; // left
            case 39:          key[2] = key[2]>0 ? 0:key[2]; break; // right
            case 38:          key[3] = key[3]<0 ? 0:key[3]; break; // up
            case 40:          key[3] = key[3]>0 ? 0:key[3]; break; // down
            




            case 17: case 67:          key[5] = 0; break; // ctrl, C
            case 69:                   key[5] = 0; break; // E
            case 32:                   key[4] = 0; break; // space
            case 16:                   key[7] = 0; break; // shift
        }

        //if(!useGamepad)useGamepad = true;

        // send to worker
        //ammo.send( 'key', key );

    };

    user.getKey = function () {

        return key;

    };


    //--------------------------------------
    //
    //   GAMEPAD
    //
    //--------------------------------------

    var Gamepad = function( key ){

        this.values = []; 
        this.key = key;
        this.ready = 0;

    };

    Gamepad.prototype = {

        update:function(){

            var i,j,k,l, v, pad;
            //var info = '';
            var fix = this.fix;
            var gamepads = navigator.getGamepads();

            for (i = 0; i < gamepads.length; i++) {
                pad = gamepads[i];
                if(pad){
                    k = pad.axes.length;
                    l = pad.buttons.length;
                    if(l){
                        if(!this.values[i]) this.values[i] = [];
                        // axe
                        for (j = 0; j < k; j++) {
                            v = fix(pad.axes[j], 0.08 );
                            if(this.ready == 0 && v !== 0 ) this.ready = 1;
                            this.values[i][j] = v;
                            //if(i==0) this.key[j] = fix( pad.axes[j], 0.08 );
                        }
                        // button
                        for (j = 0; j < l; j++) {
                            v = fix(pad.buttons[j].value); 
                            if(this.ready == 0 && v !== 0 ) this.ready = 1;
                            this.values[i][k+j] = v;
                            //if(i==0) this.key[k+j] = fix( pad.buttons[j].value );
                        }
                        //info += 'gamepad '+i+'| ' + this.values[i]+ '<br>';
                    } else {
                        if(this.values[i]) this.values[i] = null;
                    }
                }
            }

            //document.getElementById("info").innerHTML = info
        },

        getValue:function(n){

            var i = 19, v;
            while(i--){
                v = this.values[n][i];
                if(this.ready == 0 && v !== 0 ) this.ready = 1;
                this.key[i] = v;
            }

        },

        reset:function(){
            //this.values = [];
            this.ready = 0;
        },

        fix:function(v, dead){
            var n = Number((v.toString()).substring(0, 5));
            if(dead && n<dead && n>-dead) n = 0;
            return n;
        }

    };




    return user;

})();


