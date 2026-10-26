import {chromium} from 'playwright';
const mode=process.argv[2]||'desktop',only=process.argv[3];
const b=await chromium.launch({executablePath:'/workspace/mau-scrapbook/.pw/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell'});
const vp=mode==='mobile'?{viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}};
const p=await b.newPage(vp);const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:4210/');await p.waitForFunction(()=>window.__ready,null,{timeout:300000});await p.waitForTimeout(1500);
const T=await p.evaluate(()=>window.__ST.getAll().filter(s=>(s.vars.id||'').startsWith('turn')).map(s=>[s.start,s.end]));
const names=['hero-moments','moments-about','about-services','services-content','content-contact'];
for(let k=0;k<T.length;k++){if(only&&!names[k].includes(only))continue;
 for(const f of [0,.1,.25,.5,.75,.9,1]){const y=T[k][0]+(T[k][1]-T[k][0])*Math.min(.999,Math.max(.001,f));
  await p.evaluate(v=>window.__lenis.scrollTo(v,{immediate:true,force:true}),y);await p.waitForTimeout(700);
  await p.screenshot({path:`shots/turn-${mode}-${names[k]}-${String(Math.round(f*100)).padStart(3,'0')}.png`,timeout:120000});}}
console.log(JSON.stringify(T),errs.join('\n')||'ok');await b.close();
