// Fragment shader: physically-motivated sky, ocean, beach, palms. GLSL ES 3.00.
export const FRAG = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 uFull,uTile;
uniform float uT,uWave,uStars,uPhase,uCloud,uAurora,uWind,uAA,uOct,uLit;
uniform vec3 uSun,uMoon;
const float PI=3.14159265;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float h11(float p){return fract(sin(p*127.1)*43758.5453);}
float h31(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){s+=a*vn(p);p=m*p;a*=.5;}return s;}
float gE,gDay,gNight,gTw;vec3 gSunC,gMoonC,gAmb;
void setup(){
  gE=uSun.y;
  gDay=smoothstep(-.10,.28,gE);
  gNight=1.-smoothstep(-.26,-.05,gE);
  gTw=smoothstep(-.32,-.04,gE)*(1.-smoothstep(.0,.22,gE));
  gSunC=mix(vec3(1.,.32,.07),vec3(1.,.9,.74),smoothstep(-.02,.4,gE))*smoothstep(-.1,.04,gE);
  gMoonC=vec3(.28,.38,.62)*.3*uLit*smoothstep(-.04,.12,uMoon.y)*gNight;
  gAmb=mix(vec3(.006,.01,.025),vec3(.25,.42,.75),gDay)+vec3(.35,.12,.12)*gTw*.35+gMoonC*.25;
}
vec3 starField(vec3 rd){
  vec3 c=vec3(0.);
  for(int L=0;L<2;L++){
    float sc=L==0?80.:170.;vec3 p=rd*sc;vec3 id=floor(p);vec3 f=fract(p)-.5;
    float h=h31(id+float(L)*17.);float thr=1.-.09*uStars*(L==0?1.:.8);
    if(h>thr){
      vec3 off=(vec3(h31(id+1.7),h31(id+4.1),h31(id+8.3))-.5)*.5;
      float d=length(f-off);float b=(h-thr)/(1.-thr);
      float tw=.75+.25*sin(uT*2.5+h*90.);
      c+=mix(vec3(.7,.8,1.),vec3(1.,.85,.7),h31(id+9.))*smoothstep(.16,.0,d)*(.4+1.6*b)*tw*(L==0?1.:.6);
    }
  }
  vec3 n=normalize(vec3(.35,.55,.75));float b=dot(rd,n);float band=exp(-b*b*26.);
  vec2 g=vec2(atan(rd.x,rd.z),rd.y)*4.;float dust=fbm(g*2.+3.),cl=fbm(g*6.);
  c+=vec3(.55,.6,.85)*band*(.25+.9*cl)*(1.-.7*smoothstep(.45,.7,dust))*.09*min(uStars,1.5);
  return c*3.;
}
vec4 moonDisc(vec3 rd){
  float cd=dot(rd,uMoon);if(cd<.95)return vec4(0.);
  float R=.034;vec3 t1=normalize(cross(vec3(0,1,0),uMoon));vec3 t2=cross(uMoon,t1);
  vec2 p=vec2(dot(rd,t1),dot(rd,t2))/R;float r=length(p);
  vec3 halo=vec3(.5,.6,.9)*.06*uLit*exp(-acos(clamp(cd,-1.,1.))*38.);
  if(r>1.)return vec4(halo,0.);
  float z=sqrt(1.-r*r);vec3 n=vec3(p,z);float ph=uPhase*2.*PI;vec3 L=vec3(sin(ph),0.,-cos(ph));
  float tex=fbm(p*2.2+4.)*.6+fbm(p*7.)*.4;
  vec3 alb=mix(vec3(.42,.43,.47),vec3(.96,.94,.88),smoothstep(.35,.65,tex));
  vec3 col=alb*(max(dot(n,L),0.)*2.4+.025);
  return vec4(col+halo,smoothstep(1.,.96,r));
}
vec3 aurora(vec3 rd){
  if(rd.y<.04||uAurora<.01)return vec3(0.);
  vec3 c=vec3(0.);
  for(int i=0;i<10;i++){
    float fi=float(i);float t=(1.4+fi*.07)/rd.y;vec2 q=rd.xz*t;
    float w=fbm(vec2(q.x*.35+uT*.02+fi*.3,q.y*.18-uT*.01));
    float cu=smoothstep(.45,.75,w)*exp(-fi*.1);
    c+=mix(vec3(.1,1.,.55),vec3(.5,.2,.9),fi/10.)*cu*.04;
  }
  return c*smoothstep(.04,.3,rd.y)*(1.-smoothstep(.6,.95,rd.y))*uAurora*gNight*4.;
}
vec3 cloudLayer(vec3 rd,vec3 sky){
  float f=smoothstep(.0,.1,rd.y);if(f<=0.)return sky;
  vec2 p=rd.xz/(rd.y+.12)*.9+vec2(uT*.012*uWind,uT*.005*uWind);
  float d=fbm(p+fbm(p*.5));float cov=mix(.64,.36,uCloud);
  float a=smoothstep(cov,cov+.26,d)*f;if(a<=.001)return sky;
  float dl=fbm(p+fbm(p*.5)+uSun.xz*.4);
  float lit=clamp(.55+(d-dl)*3.4,0.,1.);
  vec3 sun=gSunC*2.4+gMoonC*3.;
  vec3 c=mix(gAmb*.6,sun+gAmb*.5,lit);
  c+=gSunC*pow(max(dot(rd,uSun),0.),10.)*(1.-a)*.4;
  return mix(sky,c,a*.93);
}
vec3 skyCol(vec3 rd,bool full){
  float y=max(rd.y,0.);
  vec3 sA=normalize(vec3(uSun.x,.0001,uSun.z));
  float sd=max(dot(normalize(vec3(rd.x,.0001,rd.z)),sA),0.);
  vec3 zen=mix(vec3(.002,.005,.02),vec3(.10,.27,.68),gDay);
  vec3 hor=mix(vec3(.008,.014,.035),vec3(.60,.76,.93),gDay);
  vec3 warm=vec3(1.,.42,.16)*(.25+.8*pow(sd,2.5))+vec3(.12,.08,.26);
  hor=mix(hor,warm,gTw*.9);
  vec3 c=mix(hor,zen,pow(y,.42));
  c+=vec3(.5,.14,.2)*gTw*pow(sd,3.)*exp(-y*3.)*.5;
  float mu=max(dot(rd,uSun),0.);
  c+=gSunC*(pow(mu,5.)*.12+pow(mu,48.)*.5+pow(mu,900.)*2.)*(1.+gTw);
  if(full&&rd.y>0.)c+=gSunC*28.*smoothstep(.9996,.9998,mu);
  c=mix(c,hor*1.1,exp(-y*12.)*.5);
  if(gNight>.01){
    c+=starField(rd)*gNight*(1.-gMoonC.b*.6);
    if(full){vec4 m=moonDisc(rd);c=mix(c,m.rgb,m.a)+m.rgb*(1.-m.a);}
    else c+=vec3(.5,.6,.9)*.06*uLit*exp(-acos(clamp(dot(rd,uMoon),-1.,1.))*38.);   // reflections: soft glow only; glitter lobes add the rest
    if(full)c+=aurora(rd);
  }
  c=cloudLayer(rd,c);
  if(full&&rd.y<.07){
    float az=atan(rd.x,rd.z);
    float ih=.03*exp(-pow((az+.5)*4.,2.))*(.55+.45*fbm(vec2(az*25.,1.)))+.006*exp(-pow((az-.25)*9.,2.));
    if(rd.y<ih){vec3 ic=gAmb*.16+gSunC*.04;c=mix(ic,hor*1.1,.4);}
  }
  return c;
}
float sandH(vec2 p){
  float x0=1.4+p.y*.28;float d=p.x-x0;float s=d*.045;
  s+=smoothstep(8.,24.,d)*1.2*(.6+.4*vn(p*.25));
  s+=.03*vn(p*3.)*step(0.,d);
  return s;
}
float waveH(vec2 p,float oct){
  float h=0.,a=.22,f=.55;vec2 q=p;
  for(int i=0;i<8;i++){
    if(float(i)>=oct)break;
    float ang=float(i)*1.7+.6;vec2 d=vec2(cos(ang),sin(ang));
    float ph=dot(q,d)*f+uT*sqrt(f*9.8)*.55;
    h+=a*(1.-abs(sin(ph)));q+=d*h*.25;a*=.56;f*=1.75;
  }
  h+=.02*vn(p*vec2(2.3,1.9)+vec2(uT*.3,-uT*.2))+.01*vn(p*6.-uT*.5);   // fine ripple detail at every quality
  return h*uWave;
}
vec3 oceanCol(vec3 ro,vec3 rd,float t){
  vec3 p=ro+rd*t;
  float oct=min(uOct,mix(uOct,3.,smoothstep(40.,160.,t)));
  float e=.04+t*.0012;
  float h=waveH(p.xz,oct),hx=waveH(p.xz+vec2(e,0.),oct),hz=waveH(p.xz+vec2(0.,e),oct);
  vec3 n=normalize(vec3(h-hx,e,h-hz));
  n=normalize(mix(n,vec3(0,1,0),smoothstep(30.,220.,t)));
  vec3 rf=reflect(rd,n);rf.y=abs(rf.y);
  float fre=.02+.98*pow(1.-max(dot(n,-rd),0.),5.);
  float dep=-sandH(p.xz);
  vec3 shallow=vec3(.10,.62,.60),deep=vec3(0.,.12,.22);
  float k=1.-exp(-max(dep,0.)*.9);
  vec3 body=mix(shallow,deep,k)*(gAmb*.9+gSunC*.5*max(n.y,0.)+gMoonC*.4);
  body+=vec3(.05,.35,.3)*gSunC*pow(clamp(h*2.5,0.,1.),2.)*.4;
  vec3 col=mix(body,skyCol(rf,false),fre);
  col+=gSunC*(pow(max(dot(rf,uSun),0.),240.)*3.5+pow(max(dot(rf,uSun),0.),24.)*.35)+gMoonC*(pow(max(dot(rf,uMoon),0.),300.)*5.+pow(max(dot(rf,uMoon),0.),30.)*1.5);
  float surf=sin(dep*22.-uT*1.2+vn(p.xz*.5)*3.)*.5+.5;
  float fw=smoothstep(.38,.0,dep)*pow(surf,5.)*(.45+.8*fbm(p.xz*5.));
  fw+=smoothstep(.05,.0,dep)*.45;
  vec3 foam=(gAmb*1.4+gSunC*1.4+gMoonC)*vec3(.95,.97,1.);
  col=mix(col,foam,clamp(fw,0.,1.)*.85);
  return col;
}
vec3 sandColor(vec3 p,vec3 rd){
  vec2 xz=p.xz;float s=sandH(xz);float e=.05;
  vec3 n=normalize(vec3(sandH(xz-vec2(e,0.))-sandH(xz+vec2(e,0.)),2.*e,sandH(xz-vec2(0.,e))-sandH(xz+vec2(0.,e))));
  float grain=vn(xz*20.)*.5+vn(xz*60.)*.5+fbm(xz*1.5)*.5;
  vec3 base=mix(vec3(.62,.52,.37),vec3(.88,.78,.60),grain*.8);
  float sw=.07+.06*sin(uT*.5+xz.y*.3)+.03*sin(uT*.9+xz.y*.7+xz.x);
  float wet=smoothstep(sw+.05,sw-.01,s);
  base*=mix(1.,.42,wet);
  vec3 L=gAmb+gSunC*1.5*max(dot(n,uSun),0.)+gMoonC*2.*max(dot(n,uMoon),0.);
  vec3 c=base*L;
  vec3 rf=reflect(rd,n);rf.y=abs(rf.y);
  float fre=.03+.97*pow(1.-max(dot(n,-rd),0.),5.);
  c+=skyCol(rf,false)*fre*wet*.8;
  float foam=smoothstep(.05,.0,abs(s-sw))*(.4+.6*fbm(xz*6.+uT*.3));
  c=mix(c,(gAmb*1.4+gSunC*1.4+gMoonC)*vec3(.95,.97,1.),foam*.8);
  return c;
}
vec2 rot(vec2 v,float a){float c=cos(a),s=sin(a);return vec2(c*v.x-s*v.y,s*v.x+c*v.y);}
vec3 palmLayer(vec2 q,vec2 b,float H,float lean,float seed,vec3 bg){
  vec3 col=bg;
  vec2 crown=b+vec2(lean*H,H);
  vec2 ls=normalize(vec2(uSun.x*3.,1.));
  vec3 lightC=gAmb*.7+gSunC*1.5+gMoonC*1.5;
  float s=clamp((q.y-b.y)/H,0.,1.);
  float cx=b.x+lean*H*s*s+.01*sin(s*5.+seed);
  float w=mix(.05,.028,s)*H*.9;
  float nrm=(q.x-cx)/w;
  float tm=smoothstep(1.,.85,abs(nrm))*step(b.y,q.y)*step(q.y,crown.y+.02);
  if(tm>0.){
    float lam=clamp(dot(vec2(nrm,sqrt(max(1.-nrm*nrm,0.))),ls),0.,1.);
    float ring=.8+.2*sin(s*H*140.);
    col=mix(col,vec3(.13,.09,.055)*ring*(gAmb*.9+gSunC*1.6*lam+gMoonC*1.5),tm);
  }
  vec2 r=q-crown;
  if(length(r)<H*.7){
    for(int i=0;i<12;i++){
      float fi=float(i);
      float a=fi*(2.*PI/12.)+h11(fi+seed)*.35;
      vec2 dir=vec2(cos(a),sin(a));dir.y=dir.y*.8+.15;dir=normalize(dir);
      dir=rot(dir,sin(uT*.7+fi+seed*3.)*.035*uWind);
      float L=H*(.46+.14*h11(fi*3.1+seed));
      float u=dot(r,dir),sf=u/L;if(sf<0.||sf>1.)continue;
      vec2 rr=r+vec2(0.,.85*sf*sf*L*(.6+.5*(1.-dir.y)));
      float v=dot(rr,vec2(-dir.y,dir.x));
      float leaf=abs(sin(sf*L*95.+fi));
      float wd=L*.075*pow(sin(PI*sf),.6)*(.45+.55*leaf)*(1.-.3*sf);
      float fm=max(smoothstep(wd,wd*.7,abs(v)),smoothstep(.004,.002,abs(v))*(1.-sf*.8));
      if(fm<=0.)continue;
      float back=pow(clamp(dot(dir,normalize(vec2(uSun.x*3.,.4))),0.,1.),2.);
      vec3 fc=vec3(.05,.17,.04)*(.55+.45*leaf)*(gAmb*1.1+gSunC*1.1*clamp(.5+.5*sign(v)*ls.x*-1.,0.,1.));
      fc+=vec3(.35,.5,.08)*gSunC*back*.35*leaf;
      col=mix(col,fc,fm);
    }
  }
  return col;
}
vec3 renderPx(vec2 fc){
  vec2 q=(fc*2.-uFull)/uFull.y;float asp=uFull.x/uFull.y;
  float hv=max(tan(radians(27.)),tan(radians(40.))/asp);
  vec3 rd=normalize(vec3(q.x*hv,q.y*hv+.17,1.));vec3 ro=vec3(0.,2.,0.);
  vec3 col;
  if(rd.y>=0.){col=skyCol(rd,true);}
  else{
    float tw=-ro.y/rd.y;float hit=-1.;
    if(rd.x>0.){
      float tt=.3;
      for(int i=0;i<56;i++){
        if(tt>tw)break;vec3 p=ro+rd*tt;float hh=p.y-sandH(p.xz);
        if(hh<0.){hit=tt;break;}
        tt+=max(.03,hh*.8);
      }
      if(hit<0.&&sandH((ro+rd*tw).xz)>0.)hit=tw;   // grazing rays that ran out of steps still land on the beach
      if(hit>0.){float lo=hit-max(.03,.3),hi=hit;for(int i=0;i<5;i++){float m=.5*(lo+hi);vec3 p=ro+rd*m;if(p.y<sandH(p.xz))hi=m;else lo=m;}hit=hi;}
    }
    vec3 hz=skyCol(normalize(vec3(rd.x,.02,rd.z)),false);
    if(hit>0.){col=sandColor(ro+rd*hit,rd);col=mix(col,hz,1.-exp(-hit*.004));}
    else{col=oceanCol(ro,rd,tw);col=mix(col,hz,1.-exp(-tw*.0028));}
  }
  float k=clamp(asp/1.5,.4,1.);   // keep palms in proportion on portrait screens
  col=palmLayer(q,vec2(asp*.95,-1.1),1.6*k,-.10,3.,col);
  col=palmLayer(q,vec2(asp*.72,-1.05),1.35*k,.18,7.,col);
  col=palmLayer(q,vec2(asp*.5,-.7),.8*k,.10,11.,col);
  return col;
}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){
  setup();
  int n=int(uAA+.5);vec3 sum=vec3(0.);
  for(int j=0;j<4;j++){if(j>=n)break;for(int i=0;i<4;i++){if(i>=n)break;
    sum+=renderPx(gl_FragCoord.xy+uTile+(vec2(float(i),float(j))+.5)/float(n)-.5);}}
  vec3 c=sum/float(n*n);
  vec2 uv=(gl_FragCoord.xy+uTile)/uFull;
  c*=1.-.35*pow(length(uv-.5)*1.25,2.2);
  c=aces(c*mix(1.7,.62,smoothstep(-.22,.05,gE)));c=pow(c,vec3(1./2.2));
  c+=(h21(gl_FragCoord.xy+uTile)-.5)/255.;
  O=vec4(c,1.);
}`;
