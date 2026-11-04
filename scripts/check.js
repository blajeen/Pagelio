import {readFileSync, existsSync, readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.deepEqual([...manifest.permissions].sort(), ['activeTab','downloads','scripting','storage']);
assert.equal(manifest.host_permissions, undefined);
for (const icon of Object.values(manifest.icons)) assert.ok(existsSync(icon), `Ícone ausente: ${icon}`);
for (const file of readdirSync('.').filter(file => file.endsWith('.js'))) execFileSync(process.execPath, ['--check', file]);
for (const file of ['popup.html','gallery.html','capture.html']) {
  const html = readFileSync(file,'utf8');
  assert.ok(!/\son\w+=/i.test(html), `${file}: evento inline`);
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), `${file}: script inline`);
}
console.log('Manifesto, permissões, ícones, sintaxe e política de scripts: OK');
