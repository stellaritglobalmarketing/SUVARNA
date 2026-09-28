const {chromium}=require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:3000',{waitUntil:'networkidle'});
assert.equal(await page.getByRole('button',{name:/Pause slideshow|Play slideshow/}).count(),0);
assert.equal(await page.getByText('Healthy Lifestyle',{exact:true}).count(),0);
for(const [w,h] of [[1440,1000],[1920,1080],[390,844],[375,667],[768,1024]]){
await page.setViewportSize({width:w,height:h});await page.evaluate(()=>scrollTo(0,0));await page.getByRole('button',{name:'Show products banner'}).click();await page.waitForTimeout(750);
const metrics=await page.evaluate(()=>{const r=document.querySelector('.hero-gallery').getBoundingClientRect();const a=document.querySelector('.gallery-next').getBoundingClientRect();return {bottom:r.bottom,inside:a.left>r.left&&a.right<=r.right&&a.top>=r.top&&a.bottom<=r.bottom,overflow:document.documentElement.scrollWidth>innerWidth,src:document.querySelector('.hero-slide.is-active img').currentSrc};});
assert(!metrics.overflow);assert(metrics.inside);assert(Math.abs(metrics.bottom-(w<1024?h-72:h))<3);assert(metrics.src.includes(w<1024?'mobile-v3':'banner-v2'));
if(w===1440||w===390)await page.screenshot({path:`output/fullheight-${w}.png`});
}
await page.getByRole('button',{name:'Show hampers banner'}).click();await page.getByRole('link',{name:'Explore hampers',exact:true}).click();await page.waitForTimeout(900);assert.equal(await page.evaluate(()=>location.hash),'#hampers');
await page.evaluate(()=>scrollTo(0,0));await page.getByRole('button',{name:'Show products banner'}).click();await page.getByRole('link',{name:'Shop the collection',exact:true}).click();await page.waitForTimeout(900);assert.equal(await page.evaluate(()=>location.hash),'#products');assert.deepEqual(errors,[]);console.log('PASS: five viewport sizes, full available height, overlay arrows, no pause or trust row, responsive artwork and both scroll links.');await browser.close();})();
