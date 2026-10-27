// Build-time page-curl textures. Runs the site's own snapshot() pipeline (?snap) per viewport and saves the results,
// so visitors don't pay multi-second html-to-image work at runtime. Usage: npm run build && npx vite preview --port 4210 & node prerender.mjs && npm run build
import {chromium} from 'playwright';import fs from 'fs';
const EX='/workspace/mau-scrapbook/.pw/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const b=await chromium.launch(fs.existsSync(EX)?{executablePath:EX}:{});
const SETS=[['d',1366,768],['d',1280,720],['d',1536,864],['d',1920,1080],['d',1440,900],['d',1600,900],['d',1558,720],['d',1280,800],['d',1680,1050],
 ['m',390,844],['m',375,812],['m',412,915],['m',360,800],['m',412,823],['m',393,852],['m',430,932]];
const ONLY=process.env.ONLY; // e.g. ONLY=m re-renders just the phone sets, keeping the rest
let man=[];if(ONLY){man=JSON.parse(fs.readFileSync('public/turn/manifest.json','utf8')).filter(m=>!m.id.startsWith(ONLY))}else fs.rmSync('public/turn',{recursive:true,force:true});
const NEW=[];
for(const [m,w,h] of SETS){if(ONLY&&m!==ONLY)continue;const id=`${m}${w}x${h}`;const mob=m==='m';
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:mob?2:1.5,isMobile:mob,hasTouch:mob});const p=await ctx.newPage();
 await p.goto((process.env.URL||'http://localhost:4210/')+'?snap');await p.waitForFunction(()=>window.__ready,null,{timeout:300000});
 const o=await p.evaluate(()=>window.__exportSnaps());fs.rmSync(`public/turn/${id}`,{recursive:true,force:true});NEW.push(id);fs.mkdirSync(`public/turn/${id}`,{recursive:true});const snaps={};let i=0;
 for(const [K,v] of Object.entries(o)){const f=`${i++}.webp`;fs.writeFileSync(`public/turn/${id}/${f}`,Buffer.from(v.url.split(',')[1],'base64'));snaps[K]={f,h:v.h}}
 man.push({id,mobile:mob,w,h,snaps});console.log(id,Object.keys(snaps).length);await ctx.close()}
fs.writeFileSync('public/turn/manifest.json',JSON.stringify(man));await b.close();
// crop to the half each turn uses, dedupe, compress
(await import('child_process')).execSync('python3 prerender-pack.py',{stdio:'inherit',env:{...process.env,PACK_IDS:NEW.join(',')}});
