import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

const execFileAsync = promisify(execFile);

async function convertAll() {
  const dir = 'diagrams_gpt5';
  const files = (await readdir(dir)).filter(f => f.endsWith('.mmd'));
  if (!files.length) {
    console.log('Keine .mmd-Dateien gefunden in', dir);
    return;
  }
  console.log('Konvertiere', files.length, 'Diagramme nach PDF...');

  for (const f of files) {
    const inPath = join(dir, f);
    const outPath = join(dir, basename(f, extname(f)) + '.pdf');
    console.log('->', inPath, '=>', outPath);
    try {
      await execFileAsync('npx', [
        '-y',
        'mmdc',
        '-i', inPath,
        '-o', outPath,
        '-c', join(dir, 'mermaid_config.json')
      ], { stdio: 'inherit' });
    } catch (err) {
      console.error('Fehler bei', f, err.stderr || err.message);
      process.exitCode = 1;
    }
  }
  console.log('Fertig. PDFs liegen in', dir);
}

convertAll().catch(err => { console.error(err); process.exit(1); });
