import * as THREE from 'three';

import { moonMaps } from './textures';

/*
 * One ShaderMaterial for every round body in the decorative views: the Moon
 * (real LROC colour + LOLA relief once the maps load, procedural before),
 * the Earth, and two spare looks (banded gas giant, rusty desert).
 *
 * The shader does its own lighting from `uSun` (a world-space point) and
 * writes its result without colour-space conversion, which is how the look
 * was tuned. To keep that look under three.js colour management:
 * - the colour uniforms hold the raw hex values (no sRGB-to-linear step);
 * - the sRGB-tagged LROC map is re-encoded to sRGB after sampling.
 */

export type BodyType = 0 | 1 | 2 | 3;

export interface BodyUniforms {
  [uniform: string]: THREE.IUniform;
  /** 0 rocky / Moon, 1 Earth, 2 banded gas, 3 desert. */
  uType: THREE.IUniform<number>;
  uC1: THREE.IUniform<THREE.Color>;
  uC2: THREE.IUniform<THREE.Color>;
  /** Rim (atmosphere) colour. */
  uC3: THREE.IUniform<THREE.Color>;
  /** World-space position of the light source. */
  uSun: THREE.IUniform<THREE.Vector3>;
  /** Seconds; drives the Earth cloud drift. */
  uTime: THREE.IUniform<number>;
  uAlpha: THREE.IUniform<number>;
  /** 0 = black, 1 = fully lit; fades a body in. */
  uReveal: THREE.IUniform<number>;
  uSeed: THREE.IUniform<number>;
  /** Earth: 1 shifts the coastlines and turns off city lights. Gas: 1 adds the red spot. */
  uSpot: THREE.IUniform<number>;
  uMap: THREE.IUniform<THREE.Texture | null>;
  uDisp: THREE.IUniform<THREE.Texture | null>;
  uHasMap: THREE.IUniform<number>;
  /** Strength of the LOLA slope shading. */
  uBump: THREE.IUniform<number>;
}

export type BodyMaterial = THREE.ShaderMaterial & { uniforms: BodyUniforms };

const NOISE = /* glsl */ `
  float hash(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float noise(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
  float fbm(vec3 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=.5; } return s; }
  float craters(vec3 p){ vec3 i=floor(p), f=fract(p); float h=0.;
    for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++) for(int z=-1;z<=1;z++){
      vec3 g=vec3(float(x),float(y),float(z)); vec3 c=i+g;
      if(hash(c+3.3)<.55) continue;
      vec3 o=vec3(hash(c),hash(c+19.1),hash(c+47.3));
      float r=.18+.3*hash(c+5.7); float d=length(g+o-f)/r;
      h += (d<1.?.6*(d*d-1.):0.) + .28*exp(-pow((d-1.)/.14,2.));
    } return h; }`;

const VERTEX = /* glsl */ `
  varying vec3 vN; varying vec3 vP; varying vec3 vW; varying vec2 vUv; varying vec3 vT; varying vec3 vB;
  void main(){ vP=position; vUv=uv;
    vec3 p0=normalize(position); vec3 T=vec3(p0.z,0.,-p0.x); T=length(T)<1e-4?vec3(1.,0.,0.):normalize(T); vec3 B=cross(p0,T);
    vT=normalize(mat3(modelMatrix)*T); vB=normalize(mat3(modelMatrix)*B); vN=normalize(mat3(modelMatrix)*normal);
    vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;

const FRAGMENT = /* glsl */ `
  uniform int uType; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uSun; uniform float uTime;
  uniform float uAlpha; uniform float uReveal; uniform float uSeed; uniform float uSpot;
  uniform sampler2D uMap; uniform sampler2D uDisp; uniform float uHasMap; uniform float uBump;
  varying vec3 vN; varying vec3 vP; varying vec3 vW; varying vec2 vUv; varying vec3 vT; varying vec3 vB;
  ${NOISE}
  // The GPU decodes the sRGB-tagged map to linear; the look was tuned on the encoded values.
  vec3 mmToSrgb(vec3 c){ return mix(pow(c,vec3(.41666))*1.055-vec3(.055), c*12.92, vec3(lessThanEqual(c,vec3(.0031308)))); }
  vec3 bump(vec3 n, float h, float s){ vec3 dpx=dFdx(vW), dpy=dFdy(vW); float dhx=dFdx(h), dhy=dFdy(h);
    vec3 r1=cross(dpy,n), r2=cross(n,dpx); float det=dot(dpx,r1); vec3 g=sign(det)*(dhx*r1+dhy*r2); return normalize(abs(det)*n - s*g); }
  void main(){
    vec3 p=normalize(vP); vec3 N=normalize(vN); vec3 L=normalize(uSun-vW); vec3 V=normalize(cameraPosition-vW);
    vec3 col; float h=0.; float spec=0.; vec3 emis=vec3(0.); float atm=0.; vec3 atmC=uC3;
    if(uType==0 && uHasMap>.5){ // the real Moon: NASA LROC colour + LOLA relief
      vec3 alb=mmToSrgb(texture2D(uMap,vUv).rgb);
      // slope of the LOLA height map by central differences, turned into a tilt of the sphere normal
      vec2 e=vec2(1./1024.,1./512.);
      float hu=texture2D(uDisp,vUv+vec2(e.x,0.)).r-texture2D(uDisp,vUv-vec2(e.x,0.)).r;
      float hv=texture2D(uDisp,vUv+vec2(0.,e.y)).r-texture2D(uDisp,vUv-vec2(0.,e.y)).r;
      float sl=max(length(p.xz),.06);
      float su=hu/(2.*e.x)/(6.2832*sl)*uBump, sv=hv/(2.*e.y)/3.1416*uBump;
      N=normalize(normalize(vN)-su*normalize(vT)-sv*normalize(vB));
      col=pow(alb,vec3(1.25))*1.08;
      atm=.3; atmC=uC3;
    } else if(uType==0){ // rocky cratered, procedural (the Moon until its maps load)
      float mare=smoothstep(.48,.62,fbm(p*1.4+uSeed));
      h=.25*fbm(p*6.)+.9*craters(p*5.+uSeed)+.45*craters(p*12.+uSeed*2.)+.12*craters(p*26.);
      col=mix(uC1,uC2,mare)*(.82+.3*fbm(p*18.));
      col*= .9+.25*clamp(h,-.5,.6);
      float px=length(fwidth(vW));
      N=bump(N,h,.012*clamp(1.-px*4.,.25,1.));
      atm=.35; atmC=uC3;
    } else if(uType==1){ // earth
      float land=smoothstep(.5+uSpot*.09,.53+uSpot*.09,fbm(p*1.7+uSeed));
      float ice=smoothstep(.8,.86,abs(p.y)+.05*fbm(p*8.));
      vec3 ocean=vec3(.03,.11,.25); vec3 ground=mix(vec3(.18,.3,.12),vec3(.45,.36,.22),fbm(p*5.));
      col=mix(ocean,ground,land); col=mix(col,vec3(.92),ice);
      float cl=smoothstep(.5,.72,fbm(p*3.2+vec3(uTime*.01,0.,0.)));
      spec=(1.-land)*(1.-cl)*.6;
      float night=1.-smoothstep(-.1,.1,dot(N,L));
      emis=vec3(1.,.78,.4)*step(.83,noise(p*90.))*land*(1.-ice)*night*(1.-cl)*.9*(1.-uSpot);
      col=mix(col,vec3(1.),cl*.9); atm=1.; atmC=vec3(.45,.7,1.);
    } else if(uType==2){ // banded gas / clouds
      float w=fbm(p*vec3(2.,6.,2.)+uSeed);
      float b=sin(p.y*uSeed*3.+w*5.)*.5+.5;
      col=mix(uC1,uC2,b); col=mix(col,uC3,smoothstep(.55,.8,fbm(p*vec3(3.,12.,3.)+uTime*.005)));
      if(uSpot>.5){ float sp=1.-smoothstep(.08,.16,length(vec2((atan(p.z,p.x)-1.2)*.45,(p.y+.32)*1.5))); col=mix(col,vec3(.74,.33,.2),sp*.9); }
      atm=.7; atmC=uC3;
    } else { // rusty desert
      float d=fbm(p*3.+uSeed);
      col=mix(uC1,uC2,smoothstep(.4,.65,d)); col*=.85+.3*fbm(p*14.);
      col=mix(col,vec3(.95,.93,.9),smoothstep(.88,.93,abs(p.y)));
      h=.4*fbm(p*10.)+.4*craters(p*8.+uSeed); N=bump(N,h,.006);
      atm=.45; atmC=vec3(1.,.55,.35);
    }
    float wrap=max((dot(N,L)+.08)/1.08,0.);
    vec3 c=col*(wrap*1.25+.015);
    if(spec>0.){ vec3 Hh=normalize(L+V); c+=vec3(1.,.93,.8)*pow(max(dot(N,Hh),0.),60.)*spec; }
    float fr=pow(1.-max(dot(normalize(vN),V),0.),3.);
    c+=atmC*fr*atm*smoothstep(-.35,.45,dot(normalize(vN),L))*1.1;
    c+=emis;
    c=mix(vec3(0.),c,uReveal);
    gl_FragColor=vec4(c,uAlpha);
  }`;

/** Colour holding the raw hex components, skipping three.js's sRGB-to-linear conversion. */
function rawColor(c: THREE.ColorRepresentation): THREE.Color {
  if (c instanceof THREE.Color) return c.clone();
  const out = new THREE.Color();
  if (typeof c === 'number') return out.setHex(c, THREE.LinearSRGBColorSpace);
  return out.setStyle(c, THREE.LinearSRGBColorSpace);
}

export function createBodyMaterial(
  type: BodyType,
  c1: THREE.ColorRepresentation,
  c2: THREE.ColorRepresentation,
  c3: THREE.ColorRepresentation,
  seed: number,
): BodyMaterial {
  const uniforms: BodyUniforms = {
    uType: { value: type },
    uC1: { value: rawColor(c1) },
    uC2: { value: rawColor(c2) },
    uC3: { value: rawColor(c3) },
    uSun: { value: new THREE.Vector3() },
    uTime: { value: 0 },
    uAlpha: { value: 1 },
    uReveal: { value: 1 },
    uSeed: { value: seed },
    uSpot: { value: 0 },
    uMap: { value: null },
    uDisp: { value: null },
    uHasMap: { value: 0 },
    uBump: { value: 0.04 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
  });
  return Object.assign(material, { uniforms });
}

/**
 * The Moon: procedural until the LROC/LOLA maps load, then the real maps.
 * If the maps fail to load the procedural look stays. Browser only.
 */
export function createMoonMaterial(): BodyMaterial {
  const material = createBodyMaterial(0, '#c9c5bc', '#5d5a53', '#cfe0ff', 1.3);
  moonMaps().then(
    ({ map, disp }) => {
      material.uniforms.uMap.value = map;
      material.uniforms.uDisp.value = disp;
      material.uniforms.uHasMap.value = 1;
    },
    () => {
      // Keep the procedural Moon.
    },
  );
  return material;
}

export function createEarthMaterial(): BodyMaterial {
  return createBodyMaterial(1, '#000', '#000', '#000', 0.7);
}
