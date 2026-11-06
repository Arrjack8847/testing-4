import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

// Diagnostic-only coverage of all ten invitation sections. Never add artwork or
// alter the reference animation clocks just to satisfy this inventory.
const sections=[
 ['1','#invitation'],['2','#message'],['3','#couple'],
 ['4','#eventDetails'],['5','#runningOrder'],['6','#dressCode'],
 ['7','#gallery'],['8','#weddingGift'],['9','#rsvp'],['10','#closingMessage']
];
const decorative=/flower|floral|petal|bloom|vine|plant|stem|hang|butterfly|botanical|leaf/i;
async function inventory(page){
 return page.evaluate(({sections,source})=>{
   const pattern=new RegExp(source,'i');
   return sections.map(([number,selector])=>{
     const root=document.querySelector(selector);
     if(!root)return {number,selector,missing:true,decorations:[]};
     const decorations=[...root.querySelectorAll('*')].filter(el=>{
       const name=typeof el.className==='string'?el.className:'';
       return pattern.test(name)||pattern.test(el.id);
     }).slice(0,120).map(el=>{
       const css=getComputedStyle(el),rect=el.getBoundingClientRect();
       return {tag:el.tagName.toLowerCase(),name:typeof el.className==='string'?el.className.slice(0,120):'',
         id:el.id,visible:css.display!=='none'&&css.visibility!=='hidden',
         animation:css.animationName,duration:css.animationDuration,
         playState:css.animationPlayState,transform:css.transform,
         x:+rect.x.toFixed(1),y:+rect.y.toFixed(1)};
     });
     return {number,selector,missing:false,decorations};
   });
 },{sections,source:decorative.source});
}
test('inventory decorative motion across every section at four phone widths',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/');
 await expect(page.locator('#invitation')).toHaveAttribute('data-layers','ready',{timeout:35000});
 const before=await inventory(page);
 await page.getByRole('button',{name:'Open Invitation',exact:true}).click();
 await expect(page.locator('#invitation')).toHaveAttribute('data-state','opened');
 const after=await inventory(page);
 await page.emulateMedia({reducedMotion:'reduce'});
 const reduced=await inventory(page);
 await writeFile(testInfo.outputPath('decorative-motion-inventory.json'),
  JSON.stringify({project:testInfo.project.name,before,after,reduced,errors},null,2));
 expect(before).toHaveLength(10);
 expect(before.filter(s=>s.missing)).toEqual([]);
 expect(before.some(s=>s.decorations.length>0)).toBe(true);
 expect(errors).toEqual([]);
});
