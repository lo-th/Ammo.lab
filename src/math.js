'use strict';

Math.torad = 0.0174532925199432957;
Math.todeg = 57.295779513082320876;
Math.Pi = 3.141592653589793;
Math.TwoPI = 6.283185307179586;
Math.PI90 = 1.570796326794896;
Math.PI270 = 4.712388980384689;
Math.inv255 = 0.003921569;
Math.golden = 10.166407384630519;

Math.int = function(x) { return Math.floor(x); };

//Math.golden = Math.TwoPI * (Math.sqrt(5) + 1) * 0.5;  // golden ratio

// RANDOM FUNCTION

Math.lerp = function ( x, y, t ) { return ( 1 - t ) * x + t * y; };
Math.rand = function ( low, high ) { return low + Math.random() * ( high - low ); };
Math.randInt = function ( low, high ) { return low + Math.floor( Math.random() * ( high - low + 1 ) ); };

Math.seed = function( s ) { return function() { s = Math.sin(s) * 10000; return s - Math.floor(s); }; };
Math.seed1 = Math.seed(32);
Math.seed2 = Math.seed(Math.seed1());
Math.ranSeed = Math.seed(Math.seed2());

//Math.ranSeed = Math.seed( Math.seed( Math.seed( 42 ) ) );
Math.randFix = function ( low, high ) { return low + Math.ranSeed() * ( high - low ); };
Math.randIntFix = function ( low, high ) { return low + Math.floor( Math.ranSeed() * ( high - low + 1 ) ); };

Math.vectorad = function ( r ) {

    var i = r.length;
    while(i--) r[i] *= Math.torad;
    return r;

};

Math.unwrapDeg = function ( r ) {

    r = r % 360;
    if (r > 180) r -= 360;
    if (r < -180) r += 360;
    return r;

};

Math.unwrapRad = function( r ){

    r = r % Math.TwoPI;
    if (r > Math.Pi ) r -= Math.TwoPI;
    if (r < - Math.Pi ) r += Math.TwoPI;
    return r;

};

Math.rot2d = function ( v, d, angle ) {

    v = v || { x:0, y:0 };
    var n = {};
    n.x = d * Math.cos( angle * Math.torad ) + v.x;
    n.y = d * Math.sin( angle * Math.torad ) + v.y;
    n.z = v.z;
    return n;

}

Math.dist2d = function ( v1, v2 ) {

    var dx = v2.x - v1.x;
    var dy = v2.y - v1.y;
    return Math.sqrt( dx * dx + dy * dy );

}

// COLOR FUNCTION

Math.colorDistance = function ( a, b ){

    var xd = a[0] - b[0];
    var yd = a[1] - b[1];
    var zd = a[2] - b[2];
    return Math.sqrt(xd*xd + yd*yd + zd*zd);

};

Math.rgbToHex = function( rgb ){

    return '0x' + ( '000000' + ( ( rgb[0] * 255 ) << 16 ^ ( rgb[1] * 255 ) << 8 ^ ( rgb[2] * 255 ) << 0 ).toString( 16 ) ).slice( - 6 );

};

Math.hslToRgb = function (h, s, l){

    var r, g, b;
    h /= 255., s /= 255., l /= 255.;
    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = Math.hue2rgb(p, q, h + 1/3);
        g = Math.hue2rgb(p, q, h);
        b = Math.hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];

};

Math.hue2rgb = function (p, q, t){

    if(t < 0) t += 1;
    if(t > 1) t -= 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;

};

Math.rgbToHsl = function (r, g, b){

    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) * 0.5;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [Math.round(h * 255), Math.round(s * 255), Math.round(l * 255)];

};

Math.orbit = function ( horizontal, vertical, radius, origine, revers ) {

    var p = { x:0, y:0, z:0 };
    if( origine === undefined ) origine = { x:0, y:0, z:0 };
    var lat = vertical * Math.torad;
    var lon = horizontal * Math.torad;
    if(revers){
        p.x = radius * Math.cos(lat) * Math.cos(lon);
        p.z = radius * Math.cos(lat) * Math.sin(lon);
        p.y = radius * Math.sin(lat);
    }else{
        p.x = radius * Math.sin(lat) * Math.cos(lon);
        p.z = radius * Math.sin(lat) * Math.sin(lon);
        p.y = radius * Math.cos(lat);
    }

    if( origine !== undefined ){
        p.x += origine.x;
        p.y += origine.y;
        p.z += origine.z;
    }
    
    return p;

}

Math.sphericalToUv = function ( v ) {

    var p = { u:0, v:0 };
    p.u = 0.5 + ( Math.atan2( v.x, v.z ) / Math.TwoPI );
    p.v = 0.5 + ( Math.asin( v.y ) / Math.Pi  );
    return p;

}

Math.spherical = function ( v ) {

    var p = { lat:0, lon:0 };
    var r = Math.sqrt( v.x* v.x + v.y* v.y+ v.z* v.z ); 
    p.lat = Math.asin( v.y / r ) * Math.todeg;
    p.lon = Math.atan2( v.z, v.x ) * Math.todeg;
    return p;

}

/*Math.spherical = function ( lat, y, lon, radius ) {

    var p = { x:0, y:0, z:0 };
    var phi = lat * Math.torad;
    var theta = lon * Math.torad;
    p.x = (radius+y) * Math.cos(phi) * Math.cos(theta);
    p.y = (radius+y) * Math.sin(phi) * Math.cos(theta);
    p.z = (radius+y) * Math.sin(theta);
    return p;

}*/