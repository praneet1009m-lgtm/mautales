import gsap from 'gsap';import {ScrollTrigger} from 'gsap/ScrollTrigger';import Lenis from 'lenis';import * as THREE from 'three';import {toCanvas,getFontEmbedCSS} from 'html-to-image';
gsap.registerPlugin(ScrollTrigger);window.__ST=ScrollTrigger;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const mobile=matchMedia('(max-width:860px)').matches, fine=matchMedia('(pointer:fine)').matches;
const rnd=(a,b)=>a+Math.random()*(b-a);
const lenis=new Lenis({lerp:.085,wheelMultiplier:.9});window.__lenis=lenis;lenis.stop();
lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);
history.scrollRestoration='manual';scrollTo(0,0);

/* torn edges */
function torn(el,a=1.6){const p=[],n=22;const j=()=>rnd(0,a);
 for(let i=0;i<=n;i++)p.push(`${i/n*100}% ${j()}%`);for(let i=1;i<=n;i++)p.push(`${100-j()}% ${i/n*100}%`);
 for(let i=n-1;i>=0;i--)p.push(`${i/n*100}% ${100-j()}%`);for(let i=n-1;i>0;i--)p.push(`${j()}% ${i/n*100}%`);
 el.style.clipPath=`polygon(${p.join(',')})`;}
$$('.torn').forEach(e=>torn(e,e.classList.contains('cv-label')?2.4:1.4));

/* handwriting */
const NS='http://www.w3.org/2000/svg';
function buildHW(svg){const t=document.createElementNS(NS,'text'),s=+svg.dataset.size||120;t.setAttribute('font-size',s);t.setAttribute('y',s);
 [...svg.dataset.text].forEach(c=>{const ts=document.createElementNS(NS,'tspan');ts.textContent=c;t.appendChild(ts)});svg.appendChild(t);
 const b=t.getBBox();svg.setAttribute('viewBox',`${b.x-8} ${b.y-6} ${b.width+16} ${b.height+12}`);
 const ts=$$('tspan',t).filter(x=>x.textContent.trim());ts.forEach(x=>{x.style.strokeDasharray=s*5;x.style.strokeDashoffset=s*5});svg._ts=ts;svg._s=s}
function drawHW(svg,d=1){const tl=gsap.timeline();tl.to(svg._ts,{strokeDashoffset:0,duration:.9*d,stagger:.11*d,ease:'power1.inOut'})
 .to(svg._ts,{fillOpacity:1,duration:.5,stagger:.08*d},.45*d);return tl}
function drawPath(svg,d=1.1){const ps=$$('path',svg);ps.forEach(p=>{const L=p.getTotalLength();p.style.strokeDasharray=L;p.style.strokeDashoffset=L});
 return gsap.to(ps,{strokeDashoffset:0,duration:d,stagger:.25,ease:'power2.inOut'})}

/* cursor: paper plane */
const cur=$('#cursor');
if(fine&&!mobile){let x=innerWidth/2,y=innerHeight/2,cx=x,cy=y,ang=0;
 addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY});
 gsap.ticker.add(()=>{const dx=x-cx,dy=y-cy;cx+=dx*.22;cy+=dy*.22;if(Math.hypot(dx,dy)>2)ang+=((Math.atan2(dy,dx)*180/Math.PI+45-ang+540)%360-180)*.15;
  cur.style.transform=`translate(${cx}px,${cy}px) rotate(${ang}deg)`});
 document.addEventListener('pointerover',e=>{const d=e.target.closest('.drag'),l=e.target.closest('a,button,input,textarea');cur.classList.toggle('on',!!d);cur.classList.toggle('link',!!l&&!d)});
}else cur.remove();

/* paper physics drag */
let zTop=20;
function physics(el){const st={x:0,y:0,vx:0,vy:0,on:false,moved:0};const g=p=>gsap.getProperty(el,p);
 el.addEventListener('pointerdown',e=>{if(e.button)return;st.on=true;st.moved=0;st.px=e.clientX;st.py=e.clientY;st.x=g('x');st.y=g('y');st.vx=st.vy=0;el.setPointerCapture(e.pointerId);
  el.classList.add('lift');el.style.zIndex=++zTop;gsap.to(el,{scale:1.07,duration:.3,ease:'back.out(3)'});gsap.killTweensOf(el,'x,y,rotationX,rotationY')});
 el.addEventListener('pointermove',e=>{if(!st.on)return;const dx=e.clientX-st.px,dy=e.clientY-st.py;st.px=e.clientX;st.py=e.clientY;st.moved+=Math.abs(dx)+Math.abs(dy);
  st.x+=dx;st.y+=dy;st.vx=st.vx*.5+dx*.5;st.vy=st.vy*.5+dy*.5;
  gsap.set(el,{x:st.x,y:st.y,rotationY:gsap.utils.clamp(-35,35,st.vx*2.2),rotationX:gsap.utils.clamp(-35,35,-st.vy*2.2),rotation:'+='+st.vx*.12})});
 const up=()=>{if(!st.on)return;st.on=false;el.classList.remove('lift');
  gsap.to(el,{x:st.x+st.vx*14,y:st.y+st.vy*14,rotation:'+='+st.vx*1.2,duration:1.1,ease:'power3.out'});
  gsap.to(el,{rotationX:0,rotationY:0,scale:1,duration:1.6,ease:'elastic.out(1,.35)'})};
 el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
 el.addEventListener('click',e=>{if(st.moved>6){e.preventDefault();e.stopPropagation()}},true);}

/* moments: wrap collage items */
const items=$$('.collage .c');items.forEach(it=>{const w=document.createElement('div');w.className='cw';it.before(w);w.appendChild(it)});
$$('.drag').forEach(physics);

/* idle flutter & mouse tilt */
const flut=$$('.drag,.stkr').map(e=>({e,ph:rnd(0,6.28),sp:rnd(.6,1.2),d:+(e.dataset.d||rnd(1,4))}));
let mx=0,my=0;
addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5});
// only elements on (or near) screen get style writes; off-screen ones pick up the same time-based pose when they return
const vis=new Set(),io=new IntersectionObserver(es=>es.forEach(x=>x.isIntersecting?vis.add(x.target):vis.delete(x.target)),{rootMargin:'25% 25%'});
flut.forEach(f=>io.observe(f.e));let smx=0,smy=0;gsap.ticker.add(t=>{smx+=(mx-smx)*.06;smy+=(my-smy)*.06;for(const f of flut){if(!vis.has(f.e))continue;
 f.e.style.rotate=`${Math.sin(t*f.sp+f.ph)*.9}deg`;
 if(!mobile)f.e.style.translate=`${(+f.e.dataset.sx||0)-smx*f.d*9}px ${-smy*f.d*7}px`}});

/* hang cards on string */
const hangs=$$('.hang');
function layoutHangs(){if(mobile)return;const line=$('.line'),W=line.offsetWidth,H=innerHeight;
 hangs.forEach((h,i)=>{const t=(i+.5)/hangs.length,yy=.1*(1-t)**2+2*t*(1-t)*1.1+.1*t*t;h.style.left=(t*W-h.offsetWidth/2)+'px';h.style.top=(H*.12+H*.14*yy-14+(i%2)*H*.05)+'px'})}
const sw=hangs.map(()=>({a:0,v:0}));let lastV=0;
gsap.ticker.add(()=>{const v=lenis.velocity||0;lastV+=(v-lastV)*.2;hangs.forEach((h,i)=>{const s=sw[i];s.v+=(-s.a*.035)-s.v*.06+(-lastV*.012);s.a+=s.v;if(!vis.has(h))return;
 h.style.transform=`rotate(${s.a+Math.sin(performance.now()/900+i)*1.2}deg)`})});
hangs.forEach(h=>io.observe(h));hangs.forEach((h,i)=>h.addEventListener('pointerenter',e=>{sw[i].v+=(e.movementX||4)*.25}));

/* music */
const mus=$('#music'),mb=$('#musicBtn');mb.onclick=()=>{if(mus.paused){mus.volume=.5;mus.play().catch(()=>{});mb.classList.add('on')}else{mus.pause();mb.classList.remove('on')}};
/* letter mailto */
$('#letter').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);
 location.href=`mailto:mansip1007@gmail.com?subject=${encodeURIComponent('Hello Mau! — '+(f.get('brand')||f.get('name')))}&body=${encodeURIComponent(`Dear Mau,\n\n${f.get('msg')}\n\n— ${f.get('name')} (${f.get('email')})${f.get('brand')?'\n'+f.get('brand'):''}`)}`});
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const t=$(a.getAttribute('href'));t&&lenis.scrollTo(t,{duration:1.6})}));

/* youtube lightbox */
{const box=$('#ytbox'),fr=$('.yt-fr',box),inn=$('.yt-in',box),out=$('.yt-out',box);
 const close=()=>{box.hidden=true;fr.innerHTML='';lenis.start()};
 $$('[data-yt]').forEach(a=>a.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();const id=a.dataset.yt;
  inn.classList.toggle('short',!!a.dataset.short);fr.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="${a.title.replace(/"/g,'&quot;')}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  out.href=a.href;box.hidden=false;lenis.stop()}));
 $('.yt-x',box).onclick=close;box.addEventListener('click',e=>{if(e.target===box)close()});addEventListener('keydown',e=>{if(e.key==='Escape'&&!box.hidden)close()})}

/* ---------- scroll choreography ---------- */
function popIn(scope,trig){const pops=$$('.pop',scope),tapes=$$('.tape',scope),docs=$$('.doodle',scope),hws=$$('svg.hw',scope);
 const tl=gsap.timeline({paused:!!trig,scrollTrigger:trig?{trigger:trig,start:'top 65%',once:true}:undefined});
 hws.forEach((s,i)=>tl.add(drawHW(s,.8),i*.4));
 tl.from(pops,{scale:0,rotation:()=>rnd(-40,40),duration:.9,stagger:.07,ease:'back.out(2.6)'},.15);
 tl.from(tapes,{scaleX:0,transformOrigin:'0% 50%',opacity:0,duration:.6,stagger:.06,ease:'power3.out'},.3);
 docs.forEach(d=>tl.add(drawPath(d),.8));return tl}

function build(){
 $$('.sheet').forEach(sh=>{const e=document.createElement('i');e.className='edge';sh.appendChild(e)});
 layoutHangs();
 // hero intro elements
 const heroTL=popIn($('#hero'));heroTL.pause();
 gsap.from('#hero .pol,#hero .hero-pic,#hero .film,#hero .kraftback',{y:()=>rnd(-60,60),rotation:()=>rnd(-25,25),opacity:0,scale:.85,duration:1.2,stagger:.08,ease:'power3.out',paused:true,id:'heroDrop'});
 const heroDrop=gsap.getById('heroDrop');
 gsap.from('#hero .tag-l,#hero .desc,#hero .type',{y:30,opacity:0,duration:1,stagger:.12,ease:'power3.out',paused:true,id:'heroTxt'});
 // moments collage
 const D=[[-38,20,-7],[-19,24,5],[20,-20,-4],[0,22,-3],[22,22,4],[4,-18,6],[40,24,-6],[38,-22,5],[-30,-4,8],[-8,4,-12],[30,0,10],[-44,-14,0]];
 const M=[[-22,-13,-5],[22,-10,5],[-19,4,3],[0,0,0],[-18,21,-3],[24,8,-4],[0,0,0],[19,25,4],[-22,37,5],[39,-1,-10],[-40,13,12],[14,40,0]];
 const P=mobile?M:D;const wraps=$$('.collage .cw');
 wraps.forEach(w=>gsap.set(w,{transformOrigin:'50% 52%'}));
 const mtl=gsap.timeline({scrollTrigger:{trigger:'#moments',start:'top top',end:mobile?'+=140%':'+=200%',pin:true,scrub:1}});
 wraps.forEach((w,i)=>gsap.set(w,{x:P[i][0]*innerWidth/100,y:P[i][1]*innerHeight/100,rotation:P[i][2]}));
 mtl.to(wraps,{x:i=>P[i][0]*innerWidth/100*1.06,y:i=>P[i][1]*innerHeight/100*1.05-12,rotation:i=>P[i][2]*1.25,duration:.9,stagger:.01,ease:'sine.inOut'},0)
  .to({},{duration:.1});
 popIn($('.mo-head'),'#moments');

 // keep every card / photo / sticker fully on one page (desktop spreads have a gutter)
 const spineSafe=(sheet)=>{if(mobile)return;const X=innerWidth/2,G=14;const cand=$$('.pol,.stkr,.stk,.film,.hero-pic,.kraftback,.note,.ab-photo,.tab-about,.sticky,img.drag,.mo-head,.ct-head,.vid,.sub-btn,.shorts,.co-stats',sheet).filter(e=>!e.closest('.sv-track .tags,.sv-end'));
  cand.forEach(e=>{e.style.translate='';e.dataset.sx=0});cand.forEach(e=>{const r=e.getBoundingClientRect(),sr=sheet.getBoundingClientRect();if(r.width>innerWidth*.46||r.bottom<sr.top||r.top>sr.top+innerHeight*1.05)return;
   if(r.left<X-2&&r.right>X+2){let dx=(r.left+r.right)/2<X?X-G-r.right:X+G-r.left;dx+=+e.dataset.sx||0;e.dataset.sx=dx.toFixed(1);e.style.translate=dx.toFixed(1)+'px 0'}})};
 window.__spineSafe=()=>$$('.sheet').forEach(spineSafe);
 // services horizontal
 const track=$('.sv-track');
 if(!mobile){const dist=()=>{const base=track.scrollWidth-innerWidth,X=innerWidth/2,tx=gsap.getProperty(track,'x'),tl=track.getBoundingClientRect().left-tx;
   const R=[...$$('.hang',track),...$$('img,.sv-end>*',track).filter(e=>!e.closest('.hang'))].map(h=>{const r=h.getBoundingClientRect();return [r.left-tl-tx,r.right-tl-tx]});
   for(let e=0;e<=320;e+=4)for(const sg of [1,-1]){const d=base+sg*e;if(R.every(([l,r])=>!(l-d<X+24&&r-d>X-24)))return d}return base};
  gsap.to(track,{x:()=>-dist(),ease:'none',scrollTrigger:{trigger:'#services',start:'top top',end:()=>'+='+dist(),pin:true,scrub:1,invalidateOnRefresh:true,
   onUpdate:s=>gsap.set('#svBar',{scaleX:s.progress})}});
 }else hangs.forEach(h=>gsap.from(h,{scrollTrigger:{trigger:h,start:'top 90%',once:true},rotation:rnd(-30,30),y:-40,opacity:0,duration:1.2,ease:'elastic.out(1,.4)'}));

 // contact envelope
 const env=$('.env'),wrap=$('.env-wrap'),letter=$('#letter'),flap=$('.env-flap'),seal=$('.seal'),head=$('.ct-head');
 const envH=env.offsetHeight,lH=letter.offsetHeight;
 const S=lH+envH*.04;if(mobile){wrap.style.marginTop='36px';wrap.style.setProperty('margin-bottom',`calc(22vh + ${S}px)`,'important')}
 const ctl=gsap.timeline({scrollTrigger:mobile?{trigger:wrap,start:'top bottom',end:'top 62%',scrub:1}:{trigger:'#contact',start:'top top',end:'+=140%',pin:true,scrub:1}});
 ctl.to(seal,{scale:1.25,duration:.06,ease:'power2.out'})
  .to(seal,{y:()=>innerHeight*.5,x:80,rotation:160,opacity:0,duration:.18,ease:'power2.in'})
  .to(flap,{rotationX:180,duration:.22,ease:'power2.inOut'},'-=.08')
  .set(flap,{zIndex:1})
  .addLabel('rise')
  .to(letter,{y:mobile?-lH-envH*.04+envH*.18:-lH*.72,duration:mobile?.27:.26,ease:mobile?'power1.inOut':'power2.out'})
  .set(letter,{zIndex:7})
  .to(letter,{y:()=>{if(mobile)return-lH-envH*.04+envH*.18;const hb=head.getBoundingClientRect().bottom-gsap.getProperty(head,'y');const wr=wrap.offsetTop+$('#contact .sheet').getBoundingClientRect().top-wrap.getBoundingClientRect().height*0;return 0},duration:.001});
 if(mobile)ctl.to(wrap,{y:S,duration:.27,ease:'power1.inOut'},'rise');
 // final: letter in front, envelope sinks
 if(!mobile){ctl.to(wrap,{y:()=>innerHeight*.22,scale:.92,duration:.25,ease:'power2.inOut'},'<')
  .to(letter,{y:()=>{const wt=wrap.getBoundingClientRect().top-$('#contact .sheet').getBoundingClientRect().top-(+gsap.getProperty(wrap,'y')||0);const nt=wt+envH*.04;const target=Math.max(innerHeight*.04,Math.min(head.offsetTop+head.offsetHeight+14,innerHeight*.9-lH));return (target-nt)/1-(innerHeight*.22)},rotation:-1.5,duration:.25,ease:'power2.inOut'},'<')
  .to({},{duration:.08});}
 // real-envelope layering: nothing of the letter may ever show below the envelope pocket
 const clipL=()=>{const b=letter.offsetTop+lH+(+gsap.getProperty(letter,'y'));const cut=Math.max(0,b-envH*.97);letter.style.clipPath=cut>0?`inset(-40px -40px ${cut.toFixed(1)}px -40px)`:'none'};
 ctl.eventCallback('onUpdate',clipL);clipL();addEventListener('resize',()=>requestAnimationFrame(clipL));
 popIn($('#contact'),'#contact');

 // other sections
 popIn($('#about'),'#about');popIn($('#content'),'#content');popIn($('.sv-intro'),'#services');
 gsap.from('#about .ab-photo',{scrollTrigger:{trigger:'#about',start:'top 70%',once:true},y:120,rotation:-20,opacity:0,duration:1.3,ease:'power3.out'});
 gsap.from('#about .big,#about p:not(.type):not(.sign)',{scrollTrigger:{trigger:'#about',start:'top 55%',once:true},y:30,opacity:0,duration:1,stagger:.12,delay:.5});

 // realistic page turns: three.js bent-page mesh, scroll-scrubbed. Only the right page lifts.
 const secs=['#moments','#about','#services','#content','#contact'];
 const order=['#hero','#moments','#about','#services','#content','#contact'];
 const anims=(sec)=>{const out=[];ScrollTrigger.getAll().forEach(t=>{if(t.trigger&&sec.contains(t.trigger)&&t.animation)out.push({a:t.animation,scrub:!!t.vars.scrub})});
  if(sec.id==='hero')['heroDrop','heroTxt'].forEach(i=>out.push({a:gsap.getById(i),scrub:false})),out.push({a:heroTL,scrub:false});return out};
 const finishEntry=(sec)=>anims(sec).forEach(o=>{if(!o.scrub&&o.a.progress()<1)o.a.progress(1)});
 // snapshot a section in a forced state ('exit' = everything finished, 'entry' = reveals finished, scroll scenes at start)
 const snapbox=document.createElement('div');snapbox.style.cssText='position:fixed;left:-300vw;top:0;pointer-events:none';document.body.appendChild(snapbox);
 let fontCSS=null,varCSS=null;
 const prepVars=()=>{const cs=getComputedStyle(document.documentElement),out={};for(const v of ['--noise','--fiber','--blot']){const m=cs.getPropertyValue(v).trim().match(/^url\(["']?(.*?)["']?\)$/s);if(!m)continue;
   out[v]=`url("data:image/svg+xml;base64,${btoa(decodeURIComponent(m[1].replace(/^data:image\/svg\+xml,/,'')))}")`}return out};const dpr=Math.min(devicePixelRatio||1,1.5);
 const snapshot=async(sel,mode)=>{const sec=$(sel),sh=$('.sheet',sec);const L=anims(sec),saved=L.map(o=>o.a.progress());
  L.forEach(o=>{if(mode==='exit'||!o.scrub)o.a.progress(1)});
  const c=sec.cloneNode(false);c.removeAttribute('style');const s=sh.cloneNode(true);L.forEach((o,i)=>o.a.progress(saved[i]));
  s.style.transform='none';s.style.translate='none';s.style.visibility='visible';s.style.clipPath='none';$$('.mo-hint',s).forEach(e=>e.remove());
  const vw=innerWidth,h=sh.offsetHeight;c.appendChild(s);c.style.cssText=`position:absolute;left:0;top:0;width:${vw}px;height:${h}px;margin:0;overflow:hidden;transform:none`;snapbox.appendChild(c);if(!varCSS)varCSS=prepVars();for(const v in varCSS)c.style.setProperty(v,varCSS[v]);
  // live video frames
  $$('video',sh).forEach((v,i)=>{const cv=document.createElement('canvas'),cl=$$('video',s)[i];try{cv.width=v.videoWidth||2;cv.height=v.videoHeight||2;cv.getContext('2d').drawImage(v,0,0,cv.width,cv.height);cv.className=cl.className;cv.style.cssText=getComputedStyle(cl).cssText;cv.style.width='100%';cv.style.height='100%';cv.style.objectFit='cover';cl.replaceWith(cv)}catch(e){}});
  // inline every image from its already-decoded live twin (html-to-image refetches could drop some, e.g. the contact cards)
  const li=$$('img',sh),ci=$$('img',s);ci.forEach((im,i)=>{const L0=li[i];if(!L0||!L0.complete||!L0.naturalWidth||im.src.startsWith('data:'))return;try{const k=Math.min(1,900/L0.naturalWidth),cv=document.createElement('canvas');cv.width=Math.round(L0.naturalWidth*k);cv.height=Math.round(L0.naturalHeight*k);cv.getContext('2d').drawImage(L0,0,0,cv.width,cv.height);im.removeAttribute('srcset');im.removeAttribute('loading');im.src=cv.toDataURL('image/webp',.9)}catch(e){}});
  if(!fontCSS)fontCSS=await getFontEmbedCSS(c).catch(()=> '');
  const cvs=await toCanvas(c,{width:vw,height:h,pixelRatio:dpr,fontEmbedCSS:fontCSS,cacheBust:false,style:{left:'0px',top:'0px'}}).catch(e=>{console.warn('snap',e);return null});
  c.remove();return cvs?{cvs,h}:null};
 const crop=(snap,x,y,w,h,flip)=>{const o=document.createElement('canvas');o.width=Math.round(w*dpr);o.height=Math.round(h*dpr);const g=o.getContext('2d');g.fillStyle='#f4e8cf';g.fillRect(0,0,o.width,o.height);
  if(snap){if(flip){g.translate(o.width,0);g.scale(-1,1)}const kx=snap.kx||dpr,ky=snap.ky||dpr;g.drawImage(snap.cvs,(x-(snap.ox||0))*kx,y*ky,w*kx,h*ky,0,0,o.width,o.height)}
  const t=new THREE.CanvasTexture(o);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;return t};
 // three.js renderer
 const gl=new THREE.WebGLRenderer({alpha:true,antialias:true,premultipliedAlpha:true});gl.setPixelRatio(dpr);gl.domElement.id='turnGL';document.body.appendChild(gl.domElement);
 const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,1,10,20000);
 const shR=document.createElement('div'),shL=document.createElement('div');shR.className='tw-sh';shL.className='tw-sh l';document.body.append(shR,shL);
 const SX=mobile?70:140,SY=mobile?12:24;
 const geo=new THREE.BufferGeometry();const nv=(SX+1)*(SY+1),pos=new Float32Array(nv*3),uv=new Float32Array(nv*2),idx=[];
 for(let j=0;j<=SY;j++)for(let i=0;i<=SX;i++){const k=j*(SX+1)+i;uv[k*2]=i/SX;uv[k*2+1]=j/SY;if(i<SX&&j<SY){const a=k,b=k+1,c=k+SX+1,d=c+1;idx.push(a,b,d,a,d,c)}}
 geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));geo.setIndex(idx);
 const mat=new THREE.ShaderMaterial({side:THREE.DoubleSide,transparent:false,uniforms:{tF:{value:null},tB:{value:null},bend:{value:0}},
  vertexShader:`varying vec2 vUv;varying vec3 vN;void main(){vUv=uv;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tF,tB;uniform float bend;varying vec2 vUv;varying vec3 vN;
  void main(){vec3 n=normalize(vN);vec4 c;if(gl_FrontFacing){c=texture2D(tF,vUv);}else{n=-n;c=texture2D(tB,vec2(1.-vUv.x,vUv.y));}
   vec3 L=normalize(vec3(-.35,.3,1.));float d0=L.z;float d=max(dot(n,L),0.);float sh=(.28+.72*d)/(.28+.72*d0);
   vec3 H=normalize(vec3(-.62,.18,.76));float sp=pow(max(dot(n,H),0.),48.)*.32*bend;
   float rim=smoothstep(.0,.35,1.-abs(n.z))*.10*bend; // darken where the sheet turns edge-on
   vec3 col=c.rgb*min(sh,1.06)-rim+vec3(1.,.97,.9)*sp;gl_FragColor=vec4(col,1.);
   #include <colorspace_fragment>
  }`});
 const leaf=new THREE.Mesh(geo,mat);scene.add(leaf);
 const sizeGL=()=>{const vw=innerWidth,vh=innerHeight,D=mobile?1100:1600;gl.setSize(vw,vh);cam.aspect=vw/vh;cam.fov=2*Math.atan(vh/2/D)*180/Math.PI;cam.position.set(0,0,D);cam.updateProjectionMatrix()};sizeGL();addEventListener('resize',sizeGL);
 // pre-render every page state needed (behind the cover / in idle time)
 const SN={};const jobs=[];const one=s=>s==='#moments'||s==='#about';const key=(s,m)=>s+(one(s)?'exit':m);
 for(let k=0;k<order.length-1;k++){jobs.push([order[k],'exit'],[order[k+1],'entry'])}
 const SNAPMODE=location.search.includes('snap');
 // build-time page textures (node prerender.mjs): same snapshot() output, saved per viewport, so no multi-second snapshot work at runtime
 const loadPre=async()=>{if(SNAPMODE)return false;try{const man=await (await fetch('/turn/manifest.json')).json();const vw=innerWidth,vh=innerHeight,a=vw/vh;
   const cand=man.filter(m=>m.mobile===mobile);let set=cand.find(m=>m.w===vw&&m.h===vh);if(!set)return false; // exact size only; otherwise capture at runtime so the texture matches the live page
   const ks=Object.keys(set.snaps);const first=ks.includes('#heroexit')?['#heroexit','#momentsexit']:[];const ord=[...first,...ks.filter(k=>!first.includes(k))];
   const ld=async K=>{const e=set.snaps[K],im=new Image();im.src=`/turn/${set.id}/${e.f}`;await im.decode();const h=e.h*vh/set.h,kx=set.dpr*set.w/vw;SN[K]={cvs:im,h,kx,ky:set.dpr*e.h/h,ox:(e.x||0)*vw/set.w};if(K==='#momentsexit')window.__snap1=true};
   await Promise.all(ord.slice(0,2).map(ld));window.__snap1=true;for(const K of ord.slice(2))await ld(K);return true}catch(e){console.warn('pre',e);return false}};
 let lastSz=mobile?innerWidth+'':innerWidth+'x'+innerHeight,rsT;addEventListener('resize',()=>{clearTimeout(rsT);rsT=setTimeout(async()=>{const sz=mobile?innerWidth+'':innerWidth+'x'+innerHeight;if(sz===lastSz||SNAPMODE)return;lastSz=sz;await window.__snaps;varCSS=null;window.__kills.forEach(f=>f());window.__snaps=(async()=>{ /* old textures stay in use until each new one replaces it, so a turn never shows a blank page */ if(await loadPre())return true;for(const [s,m] of jobs){const K=key(s,m);SN[K]=await snapshot(s,one(s)?'exit':m)||SN[K]}return true})()},400)});
window.__kills=window.__kills||[];
window.__exportSnaps=async()=>{await window.__snaps;const o={};for(const K in SN)o[K]={h:SN[K].h,url:SN[K].cvs.toDataURL('image/webp',.92)};return o};
 window.__snaps=(async()=>{await new Promise(r=>setTimeout(r,50));window.__spineSafe();ScrollTrigger.refresh();if(await loadPre())return true;for(const [s,m] of jobs){const t0=performance.now();const K=key(s,m);SN[K]=SN[K]||await snapshot(s,one(s)?'exit':m);if(K==='#momentsexit')window.__snap1=true}return true})();
 for(let k=0;k<order.length-1;k++){
  const A=$(order[k]+' .sheet'),B=$(order[k+1]+' .sheet'),secB=B.closest('section');
  const mids=[];let n=(A.closest('.pin-spacer')||A.closest('section')).nextElementSibling;
  while(n&&!n.contains(B)){mids.push(n);n=n.nextElementSibling}
  let T=null;
  const docTop=el=>{let y=0,n=el;while(n){y+=n.offsetTop;n=n.offsetParent}return y};
  const make=(st)=>{if(T)return;const sa=SN[key(order[k],'exit')],sb=SN[key(order[k+1],'entry')];if(!sa||!sb)return; // capture not ready: let the pages scroll normally instead of turning a blank sheet
   finishEntry(secB);const vw=innerWidth,vh=innerHeight,X=mobile?0:vw/2,W=mobile?vw:vw/2;
   const yA=sa?Math.max(0,Math.min(sa.h-vh,(A.style.translate='',-(A.getBoundingClientRect().top+scrollY-(st!=null?st:scrollY))))):0;
   const tF=crop(sa,X,yA,W,vh,false),tB=mobile?crop(sb,0,0,W,vh,false):crop(sb,X-W,0,W,vh,false);
   mat.uniforms.tF.value=tF;mat.uniforms.tB.value=tB;
   T={X,W,vh,vw,tF,tB};gl.domElement.style.display='block';document.body.classList.add('turning');
   mids.forEach(m=>m.style.visibility='hidden');
   if(mobile)A.style.visibility='hidden';else{A.style.clipPath=`inset(0 ${A.offsetWidth-X}px 0 0)`;B.style.clipPath=`inset(0 0 0 ${X}px)`}};
  const kill=()=>{if(!T)return;T.tF.dispose();T.tB.dispose();T=null;gl.domElement.style.display='none';shR.style.display=shL.style.display='none';
   A.style.visibility='';A.style.clipPath='';A.style.translate='';B.style.clipPath='';B.style.translate='';mids.forEach(m=>m.style.visibility='');document.body.classList.remove('turning')};
  const draw=(p)=>{if(mobile)p=Math.min(1,p/.62);const {X,W,vw,vh}=T,e=gsap.parseEase('power2.inOut')(p),th0=Math.PI*e;
   const s=Math.sin(Math.PI*p),C=(mobile?1.9:2.6)*s*(Math.cos(Math.PI*p)*1.1+.22);mat.uniforms.bend.value=Math.min(1,s*1.6);
   let minx=X,maxx=X,zmax=0;const du=1/SX;
   for(let j=0;j<=SY;j++){const v=j/SY,f=1+.55*(.5-v)*s; // bottom corner leads slightly
    let x=X,z=0;for(let i=0;i<=SX;i++){const k=(j*(SX+1)+i)*3;
     if(i>0){const u=(i-.5)*du,ph=th0+C*f*Math.pow(u,2.6);x+=W*du*Math.cos(ph);z+=W*du*Math.sin(ph)}
     pos[k]=x-vw/2;pos[k+1]=vh/2-v*vh*-1-vh+0;pos[k+1]=-vh/2+v*vh;pos[k+2]=z;
     if(j===SY>>1){minx=Math.min(minx,x);maxx=Math.max(maxx,x);zmax=Math.max(zmax,z)}}}
   geo.attributes.position.needsUpdate=true;geo.computeVertexNormals();gl.render(scene,cam);
   // soft cast shadows on the pages below
   const lift=Math.min(1,zmax/(W*.5)),sp=30+lift*W*.32,a=.5*(1-.4*lift)*Math.min(1,p*10)*Math.min(1,(1-p)*14);
   if(maxx>X+2){shR.style.cssText=`display:block;left:${X}px;width:${maxx-X+sp}px;background:linear-gradient(90deg,rgba(30,15,5,${a*.7}),rgba(30,15,5,${a}) ${Math.max(0,maxx-X-sp*.3)}px,transparent ${maxx-X+sp}px)`}else shR.style.display='none';
   const l2=Math.max(0,X-minx);if(!mobile&&minx<X-2){shL.style.cssText=`display:block;left:${minx-sp}px;width:${l2+sp}px;background:linear-gradient(270deg,rgba(30,15,5,${a*.7}),rgba(30,15,5,${a}) ${Math.max(0,l2-sp*.3)}px,transparent ${l2+sp}px)`}else shL.style.display='none'};
  const bTop=()=>{const e=B.closest('.pin-spacer')||B.closest('section');let y=0,n=e;while(n){y+=n.offsetTop;n=n.offsetParent}return y};
  ScrollTrigger.create({start:()=>{const pv=k?ScrollTrigger.getById('turn'+(k-1)):null;return Math.max(0,pv?pv.end+1:0,bTop()-innerHeight-mids.reduce((t,m)=>t+m.offsetHeight,0))},end:()=>bTop(),invalidateOnRefresh:true,id:'turn'+k,
   onUpdate:self=>{const p=self.progress;if(p<=0||p>=1){kill();return}make(self.start);if(!T)return;gl.domElement.style.display='block';document.body.classList.add('turning');
    A.style.translate=`0 ${self.scroll()-self.start}px`;B.style.translate=`0 ${-(self.end-self.scroll())}px`;draw(p)},
   onLeave:kill,onLeaveBack:kill});window.__kills.push(kill);
 }
 // tabs active
 secs.forEach((s,i)=>ScrollTrigger.create({trigger:s,start:'top 50%',end:'bottom 50%',onToggle:e=>$$('.tabs a')[i].classList.toggle('act',e.isActive)}));
 ScrollTrigger.refresh();
 return {heroTL,heroDrop}
}

/* ---------- cover / preloader ---------- */
async function boot(){
 const cnt=$('#count');const prog={v:0};
 const imgs=$$('img').map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r}));
 const ctr=gsap.to(prog,{v:88,duration:2.2,ease:'power1.out',onUpdate:()=>cnt.textContent=Math.round(prog.v)});
 await document.fonts.ready;await Promise.race([Promise.all(imgs),new Promise(r=>setTimeout(r,6000))]);
 $$('svg.hw').forEach(buildHW);
 const {heroTL,heroDrop}=build();heroTL.progress(1);heroDrop.progress(1);gsap.getById('heroTxt').progress(1);await new Promise(r=>{const t0=Date.now(),c=()=>window.__snap1||Date.now()-t0>8000?r():setTimeout(c,100);c()});
 const cvName=$('.cv-label svg');
 const tl=gsap.timeline();
 tl.add(drawHW(cvName,.9),0).to(prog,{v:100,duration:.8,onUpdate:()=>cnt.textContent=Math.round(prog.v)},Math.max(0,ctr.duration()-ctr.time())*.3)
  .to('.cv-hint',{opacity:0,duration:.3},'+=.2')
  .to('#cover .book',{rotationX:0,rotationZ:0,scale:1.05,duration:.9,ease:'power2.inOut'},'<')
  .to('.band',{x:60,opacity:0,duration:.4,ease:'power2.in'},'-=.3')
  .to('#cover',{backgroundColor:'rgba(20,11,6,0)',duration:.7,ease:'power1.in'},'-=.35').to('#cover .pageblock,.cv-hint',{opacity:0,duration:.5},'<')
  .to('.cv',{rotationY:-172,duration:1.6,ease:'power3.inOut'},'-=.2')
  .to('.cv-back',{filter:'brightness(.6)',duration:1.6},'<')
  .to('#cover .book',{scale:2.6,x:'-25%',opacity:0,duration:1.1,ease:'power2.in'},'-=.55')
  .to('#cover',{backgroundColor:'rgba(0,0,0,0)',opacity:0,duration:.8},'<.2')
  
  .add(()=>{$('#cover').remove();document.body.classList.remove('loading');lenis.start();window.__ready=true},'+=.3');
}
boot();
addEventListener('resize',()=>{layoutHangs();window.__spineSafe&&window.__spineSafe();ScrollTrigger.refresh()});
