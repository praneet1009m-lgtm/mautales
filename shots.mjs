import {chromium} from 'playwright';
const b=await chromium.launch({executablePath:'/workspace/mau-scrapbook/.pw/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const only=process.argv[2];
for(const [n,vp,m] of [['desktop',{width:1440,height:900},false],['mobile',{width:390,height:844},true]]){
 if(only&&only!==n)continue;
 const p=await b.newPage({viewport:vp,deviceScaleFactor:m?1.5:1,isMobile:m,hasTouch:m});
 p.on('console',x=>x.type()==='error'&&console.log(n,'ERR',x.text())); p.on('pageerror',e=>console.log(n,'PERR',e.message));
 await p.goto('http://localhost:4210/'); await p.waitForTimeout(1500); await p.screenshot({path:`shots/${n}-0-cover.png`});
 await p.waitForFunction(()=>window.__ready,null,{timeout:60000}); await p.mouse.move(vp.width*.7,vp.height*.5); await p.waitForTimeout(2500);
 await p.screenshot({path:`shots/${n}-1-hero.png`});
 // positions: [selector, fraction into pin (or offset)]
 const pos=await p.evaluate((m)=>{const T=window.__ST.getAll();const top=s=>document.querySelector(s).getBoundingClientRect().top+scrollY;
  const pin=s=>T.find(t=>t.pin&&t.trigger===document.querySelector(s));
  const r={};const mo=pin('#moments');r.mo1=mo.start+(mo.end-mo.start)*.25;r.mo2=mo.end-5;r.mq=top('.washi-mq')-innerHeight*.45;
  r.ab=top('#about');r.co=top('#content');const sv=pin('#services');if(sv){r.sv1=sv.start+2;r.sv2=sv.start+(sv.end-sv.start)*.45;r.sv3=sv.end-5}else{r.sv1=top('#services');r.sv2=top('.tags');r.sv3=top('.tags')+innerHeight*.9}
  const ct=pin('#contact');if(ct){r.ct1=ct.start+(ct.end-ct.start)*.35;r.ct2=ct.end-5}else{r.ct1=top('#contact');r.ct2=top('.env-wrap')-innerHeight*.66}
  if(m){r.co2=T.find(t=>t.vars.id==='turn4').start-2;r.ab2=top('#about .pg-r');r.hero2=top('#hero .pg-r')-60}return r},m);
 for(const [k,y] of Object.entries(pos)){await p.evaluate(y=>window.__lenis.scrollTo(y,{immediate:true,force:true}),y);await p.waitForTimeout(2600);await p.screenshot({path:`shots/${n}-${k}.png`,timeout:120000})}
 await p.close();}
await b.close();
