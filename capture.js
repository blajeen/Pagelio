import {pageCall, safeName, friendlyError} from './lib.js';
const $ = selector => document.querySelector(selector);
const params = new URLSearchParams(location.search);
const sourceId = Number(params.get('tab'));
const self = await chrome.tabs.getCurrent();
const canvas = $('#preview');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let title = 'captura';
async function screenshot(windowId) {
  const [active] = await chrome.tabs.query({active:true, windowId});
  if (active?.id !== sourceId) throw new Error('A aba ativa mudou. Volte à página de origem e inicie outra captura.');
  const data = await chrome.tabs.captureVisibleTab(windowId, {format:'png'});
  return createImageBitmap(await (await fetch(data)).blob());
}
try {
  const source = await chrome.tabs.get(sourceId); title = source.title;
  if (params.get('mode') !== 'full') {
    const bitmap = await screenshot(source.windowId);
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0); bitmap.close();
  } else {
    try {
      const dimensions = await pageCall(sourceId, 'prepareCapture');
      const height = dimensions.height;
      if (height > 24000 || dimensions.width * height * dimensions.dpr ** 2 > 65000000 || height * dimensions.dpr > 32000) throw new Error('Esta página é grande demais para uma imagem. Use PDF ou capture a área visível.');
      let covered = 0;
      while (covered < height) {
        const position = await pageCall(sourceId, 'scrollCapture', covered, covered > 0);
        await wait(650);
        const bitmap = await screenshot(source.windowId);
        const scale = bitmap.height / position.viewport;
        if (!covered) { canvas.width = bitmap.width; canvas.height = Math.ceil(height * scale); }
        if (position.width !== dimensions.width || position.viewport !== dimensions.viewport) throw new Error('O tamanho da janela mudou. Inicie outra captura.');
        const start = Math.max(0, covered - position.y);
        const available = Math.min(position.viewport - start, height - covered);
        if (available <= 0) { bitmap.close(); throw new Error('A página mudou durante a captura. Tente novamente.'); }
        canvas.getContext('2d').drawImage(bitmap, 0, Math.round(start * scale), bitmap.width, Math.round(available * scale), 0, Math.round(covered * scale), canvas.width, Math.round(available * scale));
        bitmap.close(); covered += available;
        $('#status').textContent = `Capturando… ${Math.min(100, Math.round(covered / height * 100))}%`;
      }
    } finally { await pageCall(sourceId, 'restoreCapture').catch(() => {}); }
  }
  canvas.hidden = false; $('#capture-controls').hidden = false;
  $('#status').textContent = 'Sua captura está pronta. Escolha o formato e salve.';
  $('#dimensions').textContent = `${canvas.width} × ${canvas.height} px`;
} catch (error) { $('#status').textContent = friendlyError(error); $('#status').classList.add('error'); }
finally { await chrome.tabs.update(self.id, {active:true}); }
$('#save').addEventListener('click', async () => {
  try {
    const type = $('#format').value; const ext = {'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[type];
    const output = document.createElement('canvas'); output.width = canvas.width; output.height = canvas.height;
    const ctx = output.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, output.width, output.height); ctx.drawImage(canvas, 0, 0);
    const blob = await new Promise(resolve => output.toBlob(resolve, type, .92));
    if (!blob) throw new Error('Não foi possível gerar a imagem. Tente PNG.');
    const url = URL.createObjectURL(blob);
    try { await chrome.downloads.download({url, filename:`Pagelio/${safeName(title)}.${ext}`, saveAs:true}); $('#status').textContent = 'Imagem enviada para salvar.'; }
    finally { setTimeout(() => URL.revokeObjectURL(url), 60000); output.width = output.height = 0; }
  } catch (error) { $('#status').textContent = friendlyError(error); }
});
