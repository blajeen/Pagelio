import {isWebPage, pageCall, downloadText, friendlyError} from './lib.js';
const $ = selector => document.querySelector(selector);
let tab;
const status = (text, error = false) => { $('#status').textContent = text; $('#status').classList.toggle('error', error); };
async function run(action) {
  for (const button of document.querySelectorAll('button')) button.disabled = true;
  status('Preparando…');
  try { await action(); } catch (error) { status(friendlyError(error), true); }
  finally { for (const button of document.querySelectorAll('button')) button.disabled = !isWebPage(tab?.url); }
}
async function openWorkspace(page, mode) {
  await chrome.tabs.create({url: chrome.runtime.getURL(`${page}.html?tab=${tab.id}&mode=${mode || ''}`), active: page !== 'capture'});
  window.close();
}
$('#pdf').addEventListener('click', () => run(async () => {
  await pageCall(tab.id, 'print', $('#clean').checked);
  status('Na janela de impressão, escolha “Salvar como PDF”.');
}));
$('#visible').addEventListener('click', () => run(() => openWorkspace('capture', 'visible')));
$('#full').addEventListener('click', () => run(() => openWorkspace('capture', 'full')));
$('#images').addEventListener('click', () => run(() => openWorkspace('gallery')));
$('#text').addEventListener('click', () => run(async () => {
  const data = await pageCall(tab.id, 'extract');
  await downloadText(`${data.title}\n${data.url}\n\n${data.selection || data.text}`, `${data.title}.txt`);
  status(data.selection ? 'Texto selecionado enviado para salvar.' : 'Texto enviado para salvar.');
}));
$('#links').addEventListener('click', () => run(async () => {
  const data = await pageCall(tab.id, 'extract');
  if (!data.links.length) return status('Nenhum link encontrado no conteúdo principal.');
  await downloadText(`${data.title}\n${data.url}\n\n${data.links.map(link => `${link.text}\n${link.url}`).join('\n\n')}`, `${data.title}-links.txt`);
  status(`${data.links.length} links enviados para salvar.`);
}));
$('#clean').addEventListener('change', () => chrome.storage.local.set({clean: $('#clean').checked}));
try {
  [tab] = await chrome.tabs.query({active:true, currentWindow:true});
  $('#page-title').textContent = tab?.title || 'Nenhuma página aberta';
  $('#page-host').textContent = tab?.url ? new URL(tab.url).hostname : '';
  const settings = await chrome.storage.local.get({clean:false}); $('#clean').checked = settings.clean;
  if (!isWebPage(tab?.url)) { for (const button of document.querySelectorAll('button')) button.disabled = true; status('Abra um site para começar. Páginas internas do navegador não são compatíveis.'); }
} catch (error) { status(friendlyError(error), true); }
