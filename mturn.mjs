// usage: node mturn.mjs <port> <tag> <w> <h> [rec|fps]
import {chromium} from 'playwright';import fs from 'fs';
const [,,port,tag,W='390',H='844',mode='rec']=process.argv;const w=+W,h=+H;
const OUT='/workspace/mau-orig/mobile-turn';
const b=await chromium.launch({executablePath:'/workspace/mau-scrapbook/.pw/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',args:mode==='fps'?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:3,isMobile:true,hasTouch:true,...(mode==='rec'?{recordVideo:{dir:OUT+'/.vid-'+tag,size:{width:w,height:h}}}:{})});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://localhost:${port}/`);await p.waitForFunction(()=>window.__ready,null,{timeout:300000});await p.waitForTimeout(1200);
const c=await ctx.newCDPSession(p);
const T=await p.evaluate(()=>window.__ST.getAll().filter(s=>(s.vars.id||'').startsWith('turn')).map(s=>[s.start,s.end]));
const go=y=>p.evaluate(v=>{window.__lenis.scrollTo(v,{immediate:true,force:true});scrollTo(0,v)},y);
const swipe=async(dy,ms)=>{const x=Math.round(w/2),y0=Math.round(h*.85);const n=Math.max(4,Math.round(ms/16));await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y0}]});
 for(let i=1;i<=n;i++){const k=i/n,e=k*k*(3-2*k);await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:Math.round(y0-dy*e)}]});await p.waitForTimeout(16)}
 await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})};
if(mode==='fps')await c.send('Emulation.setCPUThrottlingRate',{rate:4});
const startF=()=>p.evaluate(()=>{window.__f=[];let l=performance.now();window.__run=true;const f=t=>{__f.push(t-l);l=t;if(__run)requestAnimationFrame(f)};requestAnimationFrame(f)});
const stopF=()=>p.evaluate(()=>{__run=false;const f=__f.slice(2);const tot=f.reduce((a,b)=>a+b,0);return{fps:+(f.length/tot*1000).toFixed(1),p95ms:+[...f].sort((a,b)=>a-b)[Math.floor(f.length*.95)].toFixed(1),over50ms:f.filter(x=>x>50).length}});
console.log(JSON.stringify(T));const res={};const pr=()=>p.evaluate(()=>{const t=window.__ST.getAll().filter(s=>(s.vars.id||'').startsWith('turn'));return t.map(s=>+s.progress.toFixed(2))});
for(const k of [0,1]){const [s,e]=T[k];await go(s-5);await p.waitForTimeout(800);await startF();
 // 1) short drag (~25% of turn) then release
 await swipe(Math.min(h*.8,(e-s)*.25),700);await p.waitForTimeout(1200);const a=await pr();console.log('y',await p.evaluate(()=>scrollY));
 // 2) longer flick to finish
 await swipe(Math.min(h*.8,(e-s)*.4),260);await p.waitForTimeout(1500);const bb=await pr();
 res['turn'+k]={...(await stopF()),afterShortDrag:a[k],afterFlick:bb[k]};}
console.log(tag,w+'x'+h,mode,JSON.stringify(res),errs.join('|')||'ok');
fs.appendFileSync(OUT+'/results.txt',`${tag} ${w}x${h} ${mode} ${JSON.stringify(res)}\n`);
await ctx.close();
if(mode==='rec'){const d=OUT+'/.vid-'+tag;const f=fs.readdirSync(d)[0];fs.renameSync(d+'/'+f,`${OUT}/${tag}-${w}x${h}.webm`);fs.rmSync(d,{recursive:true})}
await b.close();
