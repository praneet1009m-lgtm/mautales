import {chromium} from 'playwright';import fs from 'fs';
const [,,port,tag,W='390',H='844']=process.argv;const w=+W,h=+H;
const b=await chromium.launch({executablePath:'/workspace/mau-scrapbook/.pw/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:3,isMobile:true,hasTouch:true});
const p=await ctx.newPage();await p.goto(`http://localhost:${port}/`);await p.waitForFunction(()=>window.__ready,null,{timeout:300000});await p.waitForTimeout(2500);
const c=await ctx.newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:4});
const T=await p.evaluate(()=>window.__ST.getAll().filter(s=>(s.vars.id||'').startsWith('turn')).map(s=>[s.start,s.end]));const out={};
for(let k=0;k<5;k++){const [s,e]=T[k];await p.evaluate(v=>window.__lenis.scrollTo(v,{immediate:true,force:true}),s-2);await p.waitForTimeout(600);
 await p.evaluate(([s,e])=>new Promise(r=>{const f=[];let l=performance.now(),t0=l;const st=t=>{f.push(t-l);l=t;const k=Math.min(1,(t-t0)/1500);window.__lenis.scrollTo(s+(e-s)*.62*k,{immediate:true,force:true});if(k<1)requestAnimationFrame(st);else{window.__r=f.slice(1);r()}};requestAnimationFrame(st)}),[s,e]);
 out['turn'+k]=await p.evaluate(()=>{const f=__r,tot=f.reduce((a,b)=>a+b,0);return{fps:+(f.length/tot*1000).toFixed(1),worstMs:+Math.max(...f).toFixed(0),over50:f.filter(x=>x>50).length}})}
const line=`${tag} ${w}x${h} scrubbed-turn 4xCPU ${JSON.stringify(out)}`;console.log(line);fs.appendFileSync('/workspace/mau-orig/mobile-turn/fps.txt',line+'\n');await b.close();
