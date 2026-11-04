import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync} from 'node:fs';
const {version} = JSON.parse(readFileSync('manifest.json','utf8'));
mkdirSync('dist',{recursive:true});
execFileSync('python',['-c', `from zipfile import ZipFile, ZIP_DEFLATED
from pathlib import Path
files = ['manifest.json','background.js','lib.js','page.js','popup.html','popup.js','gallery.html','gallery.js','capture.html','capture.js','styles.css','LICENSE','PRIVACY.md']
files += [str(p) for p in Path('assets').glob('icon-*.png') if p.name != 'icon-source.png']
with ZipFile('dist/pagelio-${version}.zip', 'w', ZIP_DEFLATED) as z:
    for name in files: z.write(name)
`]);
console.log(`Pacote criado: dist/pagelio-${version}.zip`);
