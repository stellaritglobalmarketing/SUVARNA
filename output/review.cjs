const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror', e=>console.log('PAGE ERROR', e.message));
 await page.goto('http://localhost:3000',{waitUntil:'networkidle'});
 await page.screenshot({path:'output/redesign-desktop.png',fullPage:true});
 console.log((await page.locator('body').innerText()).slice(0,1800));
 console.log('overflow',await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'output/redesign-mobile.png',fullPage:true});
 console.log('mobile overflow',await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
 await browser.close();
})();
