import test from 'node:test';
import assert from 'node:assert/strict';
import {safeName,isWebPage,imageExtension,imageMatches} from '../lib.js';
test('nomes exportados não criam caminhos ou caracteres inválidos', () => {
  assert.equal(safeName('a/b\\c:*?"<>|. '), 'a-b-c-------');
  assert.equal(safeName('...'), 'pagina');
  assert.equal(safeName('a'.repeat(200)).length, 110);
});
test('somente páginas HTTP(S) são elegíveis', () => {
  for (const url of ['https://example.org','http://localhost:8080']) assert.equal(isWebPage(url), true);
  for (const url of ['chrome://settings','edge://extensions','file:///a','javascript:alert(1)',null]) assert.equal(isWebPage(url), false);
});
test('extensões de imagem ignoram query strings e tratam dados inline', () => {
  assert.equal(imageExtension('https://example.org/a.webp?width=500'), 'webp');
  assert.equal(imageExtension('data:image/jpeg;base64,abc'), 'jpg');
  assert.equal(imageExtension('https://example.org/render'), 'png');
});
test('filtro exige ambas as dimensões e pesquisa sem distinguir maiúsculas', () => {
  const item = {width:800,height:80,alt:'Logo Azul',url:'https://example.org/logo.png'};
  assert.equal(imageMatches(item,100,''),false);
  assert.equal(imageMatches(item,0,'AZUL'),true);
  assert.equal(imageMatches(item,0,'paisagem'),false);
});
