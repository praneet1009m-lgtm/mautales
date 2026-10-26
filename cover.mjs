import {chromium} from 'playwright';
const b=await chromium.launch({executablePath:'/workspace/mau-scrapbook/.pw/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell'});
const m=process.argv[2]==='mobile';const p=await b.newPage({viewport:m?{width:390,height:844}:{width:1440,height:900},isMobile:m,hasTouch:m});
await p.goto('http://localhost:4210/');const t0=Date.now();
for(let i=0;i<16;i++){await p.screenshot({path:`.tmp/cv-${process.argv[3]||'a'}-${String(i).padStart(2,'0')}.png`});await p.waitForTimeout(450)}
await b.close();
