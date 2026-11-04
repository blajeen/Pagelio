import {pageCall, imageMatches, friendlyError} from './lib.js';
const $ = selector => document.querySelector(selector);
const selected = new Set();
let data = {items:[],title:''};
function visible() { return data.items.filter(item => imageMatches(item, Number($('#minimum').value), $('#query').value)); }
function updateCount() { $('#download').textContent = `Baixar selecionadas (${selected.size})`; $('#download').disabled = !selected.size; }
function render() {
  $('#grid').replaceChildren();
  const items = visible();
  for (const item of items) {
    const card = document.createElement('label'); card.className = 'image-card';
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = selected.has(item.url); checkbox.setAttribute('aria-label', `Selecionar ${item.alt || 'imagem'}`);
    checkbox.addEventListener('change', () => { checkbox.checked ? selected.add(item.url) : selected.delete(item.url); updateCount(); });
    const image = document.createElement('img'); image.src = item.url; image.alt = item.alt || 'Imagem da página'; image.loading = 'lazy'; image.referrerPolicy = 'no-referrer';
    const meta = document.createElement('div'); meta.className = 'image-meta';
    const title = document.createElement('strong'); title.textContent = item.alt || 'Sem descrição';
    const size = document.createElement('small'); size.textContent = `${item.width} × ${item.height} px`;
    meta.append(title, size); card.append(image, checkbox, meta); $('#grid').append(card);
  }
  if (!items.length) { const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'Nenhuma imagem com esses filtros. Experimente “Todos os tamanhos”.'; $('#grid').append(empty); }
  $('#status').textContent = `${items.length} de ${data.items.length} imagens · ${selected.size} selecionadas no total`;
  updateCount();
}
$('#query').addEventListener('input', render); $('#minimum').addEventListener('change', render);
$('#select').addEventListener('click', () => {
  const items = visible(); const all = items.every(item => selected.has(item.url));
  for (const item of items) all ? selected.delete(item.url) : selected.add(item.url);
  render();
});
$('#download').addEventListener('click', async () => {
  if (selected.size > 100) { $('#status').textContent = 'Selecione até 100 imagens por vez.'; return; }
  $('#download').disabled = true;
  try {
    const result = await chrome.runtime.sendMessage({type:'download-images', title:data.title, items:data.items.filter(item => selected.has(item.url))});
    if (result.error) throw new Error(result.error);
    $('#status').textContent = `${result.started} downloads iniciados${result.failed ? ` · ${result.failed} não iniciados` : ''}. Acompanhe a conclusão no navegador.`;
  } catch (error) { $('#status').textContent = friendlyError(error); }
  finally { updateCount(); }
});
try {
  data = await pageCall(Number(new URLSearchParams(location.search).get('tab')), 'images');
  $('#origin').textContent = `${data.title} · ${new URL(data.url).hostname}`; render();
} catch (error) { $('#origin').textContent = friendlyError(error); }
