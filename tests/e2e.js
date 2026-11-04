import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync, mkdirSync, copyFileSync, cpSync, mkdtempSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

mkdirSync('work',{recursive:true});
const root = path.resolve('.');
const sandbox = mkdtempSync(path.join(root,'work','browser-'));
const extension = path.join(sandbox,'extension'); mkdirSync(extension);
for (const file of ['manifest.json','lib.js','page.js','background.js','popup.html','popup.js','gallery.html','gallery.js','capture.html','capture.js','styles.css']) copyFileSync(path.join(root,file),path.join(extension,file));
cpSync(path.join(root,'assets'),path.join(extension,'assets'),{recursive:true});
const server = createServer((req,res) => {
  if (req.url === '/image.png') {res.setHeader('Content-Type','image/png'); res.end(readFileSync('assets/icon-128.png')); return;}
  res.setHeader('Content-Type','text/html;charset=utf-8');
  res.end(`<!doctype html><html><head><title>Página de testes · Pagelio</title><style>body{margin:0;font:18px sans-serif;background:#faf9f6}header{position:fixed;top:0;left:0;right:0;height:50px;background:#3158e8;color:white}article{padding:80px 30px 0;min-height:2300px;background:linear-gradient(#fff,#e0e8ff)}section{height:650px}</style></head><body><header>Barra fixa</header><article><h1>Uma página para guardar</h1><p id="selection">Texto selecionável de exemplo.</p><img src="/image.png" alt="Ícone grande"><img src="/image.png?small" width="32" height="32" alt="Ícone pequeno"><p><a href="https://example.com">Exemplo</a> <a href="https://example.com">Mesmo link</a></p><section>Primeiro trecho</section><h2>Segundo trecho</h2><section>Conteúdo intermediário</section><h2>Final da página</h2><p>Fim.</p></article></body></html>`);
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const port = server.address().port;
const manifest = JSON.parse(readFileSync(path.join(extension,'manifest.json'),'utf8'));
// Apenas na cópia temporária: captura de aba exige activeTab por clique ou <all_urls>.
// O perfil é descartável e navega somente para a fixture local.
manifest.host_permissions = ['<all_urls>'];
const {writeFileSync} = await import('node:fs');
writeFileSync(path.join(extension,'manifest.json'),JSON.stringify(manifest));
let context;
try {
  context = await chromium.launchPersistentContext(path.join(sandbox,'profile'), {
    channel:'chromium', headless:true, viewport:null, acceptDownloads:true,
    args:['--window-size=1100,900',`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]
  });
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  context.setDefaultTimeout(20000);
  console.log('Navegador e extensão carregados.');
  const id = new URL(worker.url()).host;
  const source = await context.newPage(); await source.goto(`http://127.0.0.1:${port}`);
  await source.waitForFunction(() => document.images[0].complete);
  const tab = await worker.evaluate(async url => (await chrome.tabs.query({})).find(tab => tab.url === url), source.url());
  assert.ok(tab);
  const errors = [];
  const observe = page => page.on('pageerror', error => errors.push(error.message));
  const gallery = await context.newPage(); observe(gallery);
  await gallery.goto(`chrome-extension://${id}/gallery.html?tab=${tab.id}`);
  await gallery.locator('.image-card').first().waitFor();
  assert.equal(await gallery.locator('.image-card').count(),1);
  await gallery.locator('#query').fill('inexistente');
  assert.equal(await gallery.locator('.image-card').count(),0);
  await gallery.locator('#query').fill('');
  await gallery.locator('#select').click();
  assert.match(await gallery.locator('#download').innerText(),/\(1\)/);
  await gallery.locator('#download').click();
  await gallery.locator('#status').filter({hasText:'1 downloads iniciados'}).waitFor();
  assert.equal(await worker.evaluate(async () => (await chrome.downloads.search({})).length),1);
  const extracted = await gallery.evaluate(async tabId => {
    const {pageCall} = await import('./lib.js'); return pageCall(tabId,'extract');
  },tab.id);
  assert.match(extracted.text,/Texto selecionável/); assert.equal(extracted.links.length,1);
  await source.evaluate(() => {const range = document.createRange(); range.selectNodeContents(document.querySelector('#selection')); getSelection().removeAllRanges(); getSelection().addRange(range);});
  const selected = await gallery.evaluate(async tabId => (await (await import('./lib.js')).pageCall(tabId,'extract')).selection,tab.id);
  assert.equal(selected,'Texto selecionável de exemplo.');
  await worker.evaluate(tabId => chrome.scripting.executeScript({target:{tabId},func:()=>{window.print = () => {};}}),tab.id);
  await gallery.evaluate(async tabId => (await import('./lib.js')).pageCall(tabId,'print',true),tab.id);
  assert.equal(await source.locator('[id^=pagelio-reader-]').count(),1);
  await source.evaluate(() => dispatchEvent(new Event('afterprint')));
  assert.equal(await source.locator('[id^=pagelio-reader-]').count(),0);
  console.log('OK: galeria, filtros, seleção, download de imagem, extração e impressão limpa.');
  const popup = await context.newPage(); observe(popup);
  await popup.addInitScript(({tab}) => {const original = chrome.tabs.query.bind(chrome.tabs); chrome.tabs.query = options => options.active && options.currentWindow ? Promise.resolve([tab]) : original(options);}, {tab});
  await popup.goto(`chrome-extension://${id}/popup.html`);
  await popup.locator('#page-title').filter({hasText:'Página de testes'}).waitFor();
  await popup.locator('body').screenshot({path:path.join(root,'work','popup-preview.png')});
  await popup.locator('#text').click();
  await popup.locator('#status').filter({hasText:'Texto selecionado enviado'}).waitFor();
  console.log('OK: painel e exportação de texto.');
  async function capture(mode) {
    await source.bringToFront();
    await source.evaluate(() => scrollTo(0,300));
    const newPage = context.waitForEvent('page');
    await worker.evaluate(({id,sourceId,mode}) => chrome.tabs.create({url:`chrome-extension://${id}/capture.html?tab=${sourceId}&mode=${mode}`,active:false}),{id,sourceId:tab.id,mode});
    const page = await newPage; observe(page);
    await page.locator('#capture-controls').waitFor({state:'visible',timeout:60000});
    const dimensions = await page.locator('canvas').evaluate(canvas => ({width:canvas.width,height:canvas.height}));
    const expectedHeight = mode === 'full' ? await source.evaluate(() => document.documentElement.scrollHeight) : await source.evaluate(() => innerHeight);
    const expectedWidth = await source.evaluate(() => innerWidth);
    assert.equal(dimensions.width,expectedWidth);
    assert.equal(dimensions.height,expectedHeight);
    if (mode === 'full') {
      assert.equal(await source.evaluate(() => scrollY),300);
      assert.equal(await source.locator('header').evaluate(el => el.style.visibility),'');
    }
    await page.locator('#format').selectOption('image/webp');
    await page.locator('#save').click();
    await page.locator('#status').filter({hasText:'Imagem enviada para salvar'}).waitFor();
    await page.close();
    console.log(`OK: captura ${mode}, dimensões e download WebP.`);
  }
  await capture('visible'); await capture('full');
  assert.deepEqual(errors,[]);
  console.log('Todos os testes de navegador passaram.');
} finally { await context?.close(); await new Promise(resolve => server.close(resolve)); }
