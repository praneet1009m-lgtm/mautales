// node sp-rec.mjs <port> <tag> <phone|desk> <w> <h>
import {chromium} from 'playwright';import fs from 'fs';
const [,,port,tag,dev,W,H]=process.argv;const w=+W,h=+H,ph=dev==='phone';
const OUT='/workspace/mau-orig/scroll-polish';
const b=await chromium.launch({executablePath:'/workspace/mau-scrapbook/.pw/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell'});
const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:ph?3:1,isMobile:ph,hasTouch:ph,recordVideo:{dir:OUT+'/.v-'+tag,size:{width:w,height:h}}});
const p=await ctx.newPage();
await p.goto(`http://localhost:${port}/`);await p.waitForFunction(()=>window.__ready,null,{timeout:300000});await p.waitForTimeout(1500);
const c=await ctx.newCDPSession(p);
const T=await p.evaluate(()=>window.__ST.getAll().filter(s=>(s.vars.id||'').startsWith('turn')).map(s=>[s.start,s.end]));
// per-frame log: scrollY, turn progress, top of next sheet on screen
await p.evaluate(()=>{window.__log=[];const f=()=>{const t=window.__ST.getAll().filter(s=>(s.vars.id||'').startsWith('turn'));const a=t.find(s=>s.progress>0&&s.progress<1);
 window.__log.push([performance.now()|0,Math.round(scrollY),a?+a.progress.toFixed(3):-1]);requestAnimationFrame(f)};requestAnimationFrame(f)});
const go=y=>p.evaluate(v=>{window.__lenis.scrollTo(v,{immediate:true,force:true});scrollTo(0,v)},y);
const swipe=async(dy,ms)=>{const x=Math.round(w/2),y0=Math.round(h*.88);const n=Math.max(4,Math.round(ms/16));await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y0}]});
 for(let i=1;i<=n;i++){await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:Math.round(y0-dy*i/n)}]});await p.waitForTimeout(16)}
 await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})};
const [s,e]=T[0],[s2,e2]=T[1];
if(ph){ await go(s-40);await p.waitForTimeout(700);
 // slow continuous scroll through turn 0: several short slow swipes (normal reading)
 for(let i=0;i<5;i++){await swipe(h*.22,500);await p.waitForTimeout(250)}
 await p.waitForTimeout(800);
 // go back up a little, then fast flicks through turn 1
 await go(s2-40);await p.waitForTimeout(700);await swipe(h*.5,180);await p.waitForTimeout(1500);
 await swipe(-h*.25,300);await p.waitForTimeout(1200); // direction change
 await swipe(h*.6,200);await p.waitForTimeout(1500);
}else{ await go(s-60);await p.waitForTimeout(700);await p.mouse.move(w/2,h/2);
 for(let i=0;i<14;i++){await p.mouse.wheel(0,100);await p.waitForTimeout(110)} // slow notches
 await p.waitForTimeout(1200);
 for(let i=0;i<5;i++){await p.mouse.wheel(0,-100);await p.waitForTimeout(90)} // reverse
 await p.waitForTimeout(1000);
 await go(s2-60);await p.waitForTimeout(700);
 for(let i=0;i<12;i++){await p.mouse.wheel(0,240);await p.waitForTimeout(40)} // fast
 await p.waitForTimeout(1600);}
const log=await p.evaluate(()=>window.__log);fs.writeFileSync(`${OUT}/${tag}-log.json`,JSON.stringify({T,log}));
await ctx.close();const d=OUT+'/.v-'+tag;const f=fs.readdirSync(d)[0];fs.renameSync(d+'/'+f,`${OUT}/${tag}.webm`);fs.rmSync(d,{recursive:true});await b.close();
// summary: progress reversals not caused by input
let rev=0,last=null,dir=0;for(const [t,y,pr] of log){if(pr<0||last==null){last=pr;continue}const d0=Math.sign(pr-last);if(d0&&dir&&d0!==dir)rev++;if(d0)dir=d0;last=pr}
console.log(tag,'frames',log.length,'progress direction flips',rev);
