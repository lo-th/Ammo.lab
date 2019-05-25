#define GOLDEN 1.61803398875

varying vec3 worldPosition;
varying vec2 vUv;

uniform int isHdr;
uniform vec3 fogColor;
uniform vec3 groundColor;
uniform vec3 cloudColor;
uniform sampler2D noiseMap;
uniform sampler2D nightMap;
uniform vec3 lightdir;
uniform float fog;
uniform float cloud_size;
uniform float cloud_covr;
uniform float cloud_dens;
uniform float timelap;

uniform float nSample;
uniform float iteration;

const float c = 6.36e6;
const float d = 6.38e6;
const float g = 0.76;
const float h = g*g;
const float icc = 1.0/8e3;
const float jcc = 1.0/1200.0;
const float pi = 3.141592653589793;
const vec3 vm = vec3( 0,-c,0 );
const vec3 vn = vec3( 2.1e-5 );
const vec3 vo = vec3( 5.8e-6, 1.35e-5, 3.31e-5 );

//#define USE_PROCEDURAL

#ifdef USE_PROCEDURAL

	float hash( float n ) { return fract(sin(n)*753.5453123); }

	float noise( in vec3 x ){

	    vec3 p = floor(x);
	    vec3 f = fract(x);
	    f = f*f*(3.0-2.0*f);
	    
	    float n = p.x + p.y*157.0 + 113.0*p.z;
	    return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
	                   mix( hash(n+157.0), hash(n+158.0),f.x),f.y),
	               mix(mix( hash(n+113.0), hash(n+114.0),f.x),
	                   mix( hash(n+270.0), hash(n+271.0),f.x),f.y),f.z);
	}

#else

	// optimized noise from map

	float noise( in vec3 x ){

	    vec3 p = floor(x);
	    vec3 f = fract(x);
	    f = f*f*(3.0-2.0*f);
	    
	    vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
	    vec2 rg = texture2D( noiseMap, (uv+0.5)/256.0, -16.0 ).yx;
	    return mix( rg.x, rg.y, f.z );
	}

#endif


float NOISE( vec3 r ){

	r.xz += timelap;
	r *= 0.5;
	float s;
	s = 0.5 * noise(r);
	r = r * 2.52;
	s += 0.25 * noise(r);
	r = r * 2.53;
	s += 0.125 * noise(r);
	r = r * 2.51;
	s += 0.0625 * noise(r);
	r = r * 2.53;
	s += 0.03125 * noise(r);
	r = r * 2.52;
	s += 0.015625 * noise(r);
	return s;

}

float MakeNoise( vec3 r ){

	float s,t;
	s = NOISE( r * 2e-4 * ( 1.0 - cloud_size ) );
	t = ( 1.0 - cloud_covr ) * 0.5 + 0.2;
	s = smoothstep( t, t+.2 , s );
	s *= 0.5 * cloud_dens;
	return s;

}

void cloudLayer( in vec3 r,out float s,out float t,out float u ){

	float v,w;
	v = length( r-vm ) - c;
	w = 0.0;
	if( 5e3 < v && v < 1e4 ) w = MakeNoise( r ) * sin( pi*(v-5e3)/5e3 );
	s = exp(-v*icc) + fog;
	t = exp(-v*jcc) + w + fog;
	u = w + fog;

}

float ca( in vec3 r,in vec3 s,in float t ){

	vec3 u = r-vm;
	float v,w,x,y,z,A;
	v = dot(u,s);
	w = dot(u,u)-t*t;
	x = v*v-w;
	if( x<0.0 ) return -1.0;
	y = sqrt(x);
	z = -v-y;
	A = -v+y;
	return z >= 0.0 ? z : A;

}

vec3 makeSky( in vec3 r, in vec3 s, out float t){

    //int SAMPLE = int( nSample );
    //int STEP = int ( iteration ) ;
    const int SAMPLE = 128;
    const int STEP = 8;
	
	float u,v,w,x,y,z,A,B,C,m,F;
	vec3 p = normalize( lightdir );
	u = ca(r,s,d);
	v = dot(s,p);
	w = 1.0+v*v;
	x = 0.0596831*w;
	y = 0.0253662*(1.0-h)*w/((2.0+h)*pow(abs(1.0+h-2.0*g*v),1.5));
	z = 50. * pow( abs(1.+dot(s,-p)),2.0 ) * dot( vec3(0,1,0), p ) * ( 1.0-cloud_covr ) * ( 1.0 - min( fog, 1.0 ) );
	A = 0.0;
	B = 0.0;
	C = 0.0;
	m = 0.0;
	vec3 D,E;
	//float H,J,K,L,M, N,O,P,Q, S,U,V,W;
	D = vec3(0);
	E = vec3(0);
	F = u / float( SAMPLE );

	for( int G=0; G<SAMPLE; ++G ){
		float H,J,K,L,M;
		H = float(G)*F;
		vec3 I = r + s * H;
		L = 0.0;
		cloudLayer( I, J, K, L );
		J *= F;
		K *= F;
		A += J;
		B += K;
		C += L;
		M = ca(I,p,d);
		if( M > 0.0 ){
			float N,O,P,Q;
			N=M/float(STEP);
			O=0.0;
			P=0.0;
			Q=0.0;
			for( int R=0; R<STEP; ++R ){
				float S,U,V,W;
				S = float(R)*N;
				vec3 T=I+p*S;
				W = 0.0;
				cloudLayer( T, U, V, W );
				O+=U*N;
				P+=V*N;
				Q+=W*N;
			}
			vec3 S = exp(-(vo*(O+A)+vn*(P+B)));
			m+=L;
			D+=S*J;
			E+=S*K+z*m;
		}
		else return vec3(0.0);
	}
	t = m * 0.0125;
	return ( (D * vo * x) + (E * vn * y)) * 15.0;
}

vec2 Q(vec3 e){
	return vec2(.5+atan(e.z,e.x)/(2.*pi),.5+atan(e.y,length(e.xz))/pi);
}

vec2 QQ(vec3 e){
	return vec2(vUv.x+atan(e.z,e.x)/(2.*pi),vUv.y+atan(e.y,length(e.xz))/pi);
}

mat3 R(vec3 e,vec3 f){
	vec3 g,h;
	g = normalize(cross(f,e));
	h = normalize(cross(e,g));
	return mat3(g.x,g.y,g.z,h.x,h.y,h.z,e.x,e.y,e.z);
}

// for star

/*vec3 M33(vec3 e){
	return e-floor(e*(1./289.))*289.;
}

vec4 M44(vec4 e){
	return e-floor(e*(1./289.))*289.;
}

vec4 N(vec4 e){
	return M44((e*34.+1.)*e);
}

vec4 O(vec4 e){
	return 1.79284291400159-.85373472095314*e;
}

float P(vec3 e){
	const vec2 f=vec2(1./6.,1./3.);
	const vec4 g=vec4(0,.5,1,2);
	vec3 h,i,j,k,l,m,n,o,p,s,G,H,I,J;
	h=floor(e+dot(e,f.yyy));
	i=e-h+dot(h,f.xxx);
	j=step(i.yzx,i.xyz);
	k=1.-j;
	l=min(j.xyz,k.zxy);
	m=max(j.xyz,k.zxy);
	n=i-l+f.xxx;
	o=i-m+f.yyy;
	p=i-g.yyy;
	h=M33(h);
	vec4 q,t,u,v,w,x,y,z,A,B,C,D,E,F,K,L;
	q=N(N(N(h.z+vec4(0,l.z,m.z,1))+h.y+vec4(0,l.y,m.y,1))+h.x+vec4(0,l.x,m.x,1));
	float r = 0.142857142857;
	s=r*g.wyz-g.xzx;
	t=q-49.*floor(q*s.z*s.z);
	u=floor(t*s.z);
	v=floor(t-7.*u);
	w=u*s.x+s.yyyy;
	x=v*s.x+s.yyyy;
	y=1.-abs(w)-abs(x);
	z=vec4(w.xy,x.xy);
	A=vec4(w.zw,x.zw);
	B=floor(z)*2.+1.;
	C=floor(A)*2.+1.;
	D=-step(y,vec4(0));
	E=z.xzyw+B.xzyw*D.xxyy;
	F=A.xzyw+C.xzyw*D.zzww;
	G=vec3(E.xy,y.x);
	H=vec3(E.zw,y.y);
	I=vec3(F.xy,y.z);
	J=vec3(F.zw,y.w);
	K=O(vec4(dot(G,G),dot(H,H),dot(I,I),dot(J,J)));
	G*=K.x;
	H*=K.y;
	I*=K.z;
	J*=K.w;
	L=max(.6-vec4(dot(i,i),dot(n,n),dot(o,o),dot(p,p)),0.);
	L=L*L;
	return 21.*dot(L*L,vec4(dot(G,i),dot(H,n),dot(I,o),dot(J,p)))+.5;
}*/


//

/*
vec4 ToRGBE( in vec4 value ) {
	float maxComponent = max( max( value.r, value.g ), value.b );
	float fExp = clamp( ceil( log2( maxComponent ) ), -128.0, 127.0 );
	return vec4( value.rgb / exp2( fExp ), ( fExp + 128.0 ) / 255.0 );
    //return vec4( value.brg, ( 3.0 + 128.0 ) / 256.0 );
}


vec4 toHDRX( in vec4 c ) {
    vec3 v = c.rgb;
    v = pow( abs(v), vec3( GOLDEN ));// exposure and gamma increase to match HDR
    return ToRGBE( vec4(v.r, v.g, v.b, 1.0) );
}*/


void main(){

	vec3 light = normalize( lightdir );
	vec3 r = normalize( worldPosition );
	vec3 f = R( light, vec3(0,1,0) )*r;
	float uvy = acos( r.y ) / pi;
	float uvx = atan(r.x, r.z) / pi;


	float top = uvy <= 0.505 ? 1.0 : smoothstep(1.0, 0.0, (uvy-0.505)*25.0);
	float low = uvy > 0.505 ? 1.0 : smoothstep(1.0, 0.0, (0.505-uvy)*100.0);

	vec3 s = vec3( 0, 0.99, 0 );
	float m = 0.0;
	vec3 sky = clamp( makeSky( s, r, m ), vec3( 0.0 ), vec3( 10000.0 ) );

	//float u = pow( abs( 1.0 - abs(r.y) ), 10.0 );
	//float top = r.y >= 0.0 ? 1.0 : u; 
	//float low = r.y <= 0.0 ? 1.0 : 
	float luma = 0.005 + max( dot( vec3( 0, 1.0, 0 ), light ), 0.0 ) * 0.2;
	//x = ;
	//sky = mix(vec3(x),t,v*0.8);
	// cloudColor
	sky = mix( groundColor*luma, sky , top);
	//sky = smoothstep( groundColor*x, sky , vec3(v));
	float alpha = clamp( m + low, 0.0 , 0.99 ) + 0.01;

	//vec3 f = R( light, vec3(0,1,0) )*r;
//   vec3 star = texture2D( nightMap, QQ(f) ).rgb;
    //vec3 star = texture2D( nightMap, vec2( vUv.x+(timelap/24.0), vUv.y ) ).rgb*0.5;

    vec3 star = vec3(0.0);

    if( light.y < 0.0 ){ // is night

	    vec3 milk = texture2D( nightMap, vec2( vUv.x+(timelap/24.0), vUv.y ) ).rgb;//*0.5;

	    // star test

	    float h = ( milk.x + milk.y + milk.z ) / 3.0;

		/*
		const float i=1.0;
		float j= P(f*i*134.);
		j+=P( f*i*370.);
		j+=P( f*i*870.);
		float k=pow(abs(j),9.)*2e-4;
		float l=pow(abs(j),19.)*1e-8;
		*/

		vec4 cco = texture2D( noiseMap, vec2( uvx+(timelap/24.0), uvy )*vec2(30.0,6.0), -16.0 );
		float k = pow(abs(cco.r*2.0),9.)*0.0014;
		//l=pow(abs(cco.r)*1.5,19.)*1e-8;
		//k = pow( abs(k),  GOLDEN )

		//d = 10.0;
		//k = clamp(k - d*l, 0.0, 1.0);
		//l = clamp(l - d*k, 0.0, 1.0);
		float g = k*h;

		star = clamp(mix(normalize(milk)*g ,milk,h*.1),0.,2.);
		//star = clamp(star.rgb, 0.0, 1.0);

		//star = vec3(l);//vec3(1.0);



		//star = pow( abs(star), vec3( GOLDEN ));



	//   star = pow( abs(star), vec3( GOLDEN ));
	//    star = ((star) - 0.5) * (1.15) + 0.5;
	//	star = pow( abs( star ), vec3( .5 ) );
		star = star*(1.0-alpha) * clamp(pow(abs(1.-light.y),10.),0.,1.);
		//star = pow( abs(star), vec3( GOLDEN ));
	}
	//
//	star = star*(1.0-cubi.a)*clamp(pow(abs(1.-light.y),10.),0.,1.);

	vec3 color = pow( abs( sky ), vec3( 0.5 ) );

	//color = pow( abs( color ), vec3( GOLDEN ) );

    vec4 final = vec4( star + color, 1.0 );

    //final.rgb = star.rgb;

    //final.rgb = pow( abs( final.rgb ), vec3( GOLDEN ) );

	gl_FragColor = LinearToRGBE( final );

}
