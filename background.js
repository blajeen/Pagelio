import {safeName, imageExtension} from './lib.js';

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || message.type !== 'download-images') return;
  (async () => {
    const results = [];
    for (const [index, item] of message.items.slice(0, 100).entries()) {
      if (!/^(https?:\/\/|data:image\/)/i.test(item.url)) { results.push(false); continue; }
      try {
        await chrome.downloads.download({url: item.url, filename: `Pagelio/${safeName(message.title)}/${String(index + 1).padStart(3, '0')}-${safeName(item.alt || 'imagem')}.${imageExtension(item.url)}`, conflictAction: 'uniquify', saveAs: false});
        results.push(true);
      } catch { results.push(false); }
    }
    respond({started: results.filter(Boolean).length, failed: results.filter(x => !x).length});
  })().catch(error => respond({error: error.message}));
  return true;
});
