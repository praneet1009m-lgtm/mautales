import {chromium} from 'playwright';
const [,,port,tag,W='390',H='844',K='1']=process.argv;const w=+W,h=+H;
const b=await chromium.launch({executablePath:'/workspace/mau-scrapbook/.pw/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell'});
const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const p=await ctx.newPage();await p.goto(`http://localhost:${port}/?nosnap`);await p.waitForFunction(()=>window.__ready,null,{timeout:300000});await p.waitForTimeout(2500);
const T=await p.evaluate(()=>window.__ST.getAll().filter(s=>(s.vars.id||'').startsWith('turn')).map(s=>[s.start,s.end]));const [s,e]=T[+K];
for(const f of [.1,.22,.35,.5]){await p.evaluate(v=>window.__lenis.scrollTo(v,{immediate:true,force:true}),s+(e-s)*f);await p.waitForTimeout(400);console.log(f,await p.evaluate(()=>scrollY));await p.screenshot({path:`/workspace/mau-orig/mobile-turn/.f-${tag}-${f}.png`})}
await b.close();
