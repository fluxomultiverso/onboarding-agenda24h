import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {mkdirSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(process.env.A24_PLAYWRIGHT_PATH || 'playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let downloads=0;page.on('download',()=>downloads++);
 await page.goto(new URL('../cliente.html',import.meta.url).href);
 assert.equal(await page.locator('.header-actions, #file-input-draft, #btn-save-draft, #btn-new').count(),0);
 await page.locator('#f-nome').fill('Cliente Online');
 await page.locator('#f-whatsapp').fill('21999998888');
 await page.locator('#f-whatsapp').blur();
 await page.reload();
 assert.equal(await page.locator('#f-nome').inputValue(),'Cliente Online');
 await page.evaluate(()=>goToStep(5));
 assert.equal(await page.locator('#client-whatsapp').isDisabled(),true);
 assert.equal(await page.locator('#client-email').isDisabled(),true);
 assert.equal(await page.locator('#commercial-save, #commercial-share, #provisionamento-chave, #btn-generate-contract, .json-preview').count(),0);
 assert.equal(await page.locator('#btn-next').isVisible(),false);
 // Testa a integração com o compartilhamento sem enviar dados a aplicativos reais.
 await page.evaluate(()=>{
   window.savedValidator=validar;validar=()=>[];renderCurrentStep();updateFooter();
   window.shared=[];
   Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
   Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.shared.push(JSON.parse(await data.files[0].text()));}});
 });
 await page.locator('#client-whatsapp').click();await page.waitForFunction(()=>shared.length===1);
 const draft=await page.evaluate(()=>JSON.stringify(shared[0]));
 const main=await browser.newPage();await main.goto(new URL('../index.html',import.meta.url).href);
 assert.equal(await main.evaluate(text=>parseDraft(text).empresa.nome_fantasia,draft),'Cliente Online');
 await page.evaluate(()=>{state.empresa.nome_fantasia='Outro Cliente';});
 await page.locator('#client-whatsapp').click();await page.waitForFunction(()=>shared.length===2);
 assert.equal(await page.evaluate(()=>shared[1].dados.empresa.nome_fantasia),'Outro Cliente');
 await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancelado','AbortError');}}));
 await page.locator('#client-whatsapp').click();
 assert.match(await page.locator('#file-status').innerText(),/cancelado/);
 assert.equal(downloads,0);
 await page.evaluate(()=>{validar=savedValidator;goToStep(0);});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 const out=new URL('../output/cliente/',import.meta.url);mkdirSync(out,{recursive:true});
 await page.screenshot({path:fileURLToPath(new URL('celular.png',out)),fullPage:true});
 for(let step=0;step<6;step++)await page.evaluate(i=>goToStep(i),step);
 assert.deepEqual(errors,[]);
 console.log('OK: seis etapas, ausência de exportações, recuperação automática, validação, arquivo atual compartilhado, importação no principal, cancelamento sem download e layout móvel.');
} finally {await browser.close();}
