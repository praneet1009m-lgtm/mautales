import {chromium} from 'playwright';
const [,, tag='x', mob]=process.argv;
const b=await chromium.launch({executablePath:'/workspace/mau-scrapbook/.pw/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext(mob?{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}:{viewport:{width:1366,height:768}});
const p=await ctx.newPage();
await p.addInitScript(()=>{window.__lt=[];new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push(e.duration))).observe({type:'longtask',buffered:true});});
const t0=Date.now();await p.goto('http://localhost:4210/',{waitUntil:'load'});const load=Date.now()-t0;
if(process.env.JS)await p.evaluate(process.env.JS);if(process.env.CSS)await p.addStyleTag({content:process.env.CSS});await p.waitForFunction(()=>window.__ready,null,{timeout:90000});await p.waitForTimeout(1500);
const c=await ctx.newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:4});
await p.evaluate(()=>{window.__lt=[];window.__f=[];let l=performance.now();const f=t=>{__f.push(t-l);l=t;requestAnimationFrame(f)};requestAnimationFrame(f)});
const H=await p.evaluate(()=>document.documentElement.scrollHeight);
for(let i=0;i<(+process.env.N||120);i++){await p.mouse.move(400+i%50,300);mob?await p.evaluate(()=>scrollBy(0,innerHeight*.35)):await p.mouse.wheel(0,120);await p.waitForTimeout(60)}
const r=await p.evaluate(()=>{const f=__f.slice(2);const tot=f.reduce((a,b)=>a+b,0);return{fps:+(f.length/tot*1000).toFixed(1),p95:+f.sort((a,b)=>a-b)[Math.floor(f.length*.95)].toFixed(1),longFrames:f.filter(x=>x>50).length,longTasks:__lt.length,ltTotal:Math.round(__lt.reduce((a,b)=>a+b,0)),y:scrollY}});
console.log(tag,mob?'mobile':'desktop',JSON.stringify({load,...r}));await b.close();
