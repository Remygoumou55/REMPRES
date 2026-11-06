const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const [,,a,b,fps,out,list]=process.argv;fs.mkdirSync(out,{recursive:true});
const br=await chromium.launch();const pg=await br.newPage({viewport:{width:1080,height:1920}});
await pg.goto('file://'+__dirname+'/comp.html');await pg.waitForTimeout(500);
const ts=list?list.split(',').map(Number):null;const N=ts?ts.length:Math.round((b-a)*fps);
for(let i=0;i<N;i++){const t=ts?ts[i]:(+a)+i/fps;const fn=ts?`${out}/t${t}.png`:`${out}/f${String(Math.round(t*fps)).padStart(5,'0')}.png`;
await pg.evaluate(t=>render(t),t);await pg.screenshot({path:fn,omitBackground:true});}
await br.close();})();
