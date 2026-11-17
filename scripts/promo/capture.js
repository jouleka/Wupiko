// usage: node capture.js <puppeteer-core dir> <frames dir> [fps=30] [seconds=15]
const path=require('path');
const puppeteer=require(path.resolve(process.argv[2],'node_modules/puppeteer-core'));
const fs=require('fs');
(async()=>{
  const out=process.argv[3], fps=+(process.argv[4]||30), secs=+(process.argv[5]||15);
  fs.mkdirSync(out,{recursive:true});
  const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--allow-file-access-from-files','--hide-scrollbars']});
  const p=await b.newPage();
  await p.setViewport({width:1080,height:1920,deviceScaleFactor:1});
  await p.goto('file://'+path.resolve(__dirname,'promo.html'));
  await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()))});
  const n=fps*secs;
  for(let i=0;i<n;i++){
    await p.evaluate(t=>window.renderAt(t),i/fps);
    await p.screenshot({path:path.join(out,'f'+String(i).padStart(4,'0')+'.png')});
  }
  await b.close();
})();
