export function safeName(value, fallback = 'pagina') {
  return String(value || fallback).normalize('NFKC').replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '').trim().slice(0, 110) || fallback;
}
export function isWebPage(url) { return /^https?:\/\//i.test(url || ''); }
export function imageExtension(url) {
  if (/^data:image\//i.test(url)) return url.match(/^data:image\/([a-z0-9]+)/i)?.[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg') || 'png';
  try { return new URL(url).pathname.match(/\.(avif|webp|png|jpe?g|gif|svg|bmp|ico)$/i)?.[1].toLowerCase() || 'png'; } catch { return 'png'; }
}
export function imageMatches(item, minimum, query) {
  return item.width >= minimum && item.height >= minimum && `${item.alt} ${item.url}`.toLowerCase().includes(query.toLowerCase());
}
export async function pageCall(tabId, method, ...args) {
  await chrome.scripting.executeScript({target: {tabId}, files: ['page.js']});
  const [result] = await chrome.scripting.executeScript({target: {tabId}, func: (name, values) => globalThis.PagelioPage[name](...values), args: [method, args]});
  return result.result;
}
export function downloadText(text, name, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], {type}));
  return chrome.downloads.download({url, filename: `Pagelio/${safeName(name)}`, saveAs: true}).finally(() => setTimeout(() => URL.revokeObjectURL(url), 60000));
}
export function friendlyError(error) {
  const message = error?.message || String(error);
  if (/Cannot access|Missing host permission|extensions gallery|Frame with ID|No tab with id|Cannot read/.test(message)) return 'Esta página não permite acesso. Abra um site comum e tente novamente.';
  return message;
}
