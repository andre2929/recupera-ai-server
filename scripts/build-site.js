// Gera o site ESTATICO do painel (dados + audios por devedor embutidos).
//   node scripts/build-site.js [pasta_saida]
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { montarDados } from '../src/montar.js';
import { paginaHTML } from '../src/painel-ui.js';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const saida = resolve(process.argv[2] || resolve(raiz, 'site'));
mkdirSync(saida, { recursive: true });

console.log('🎙️  Gerando audio (nome+valor) por devedor...');
const dados = await montarDados({ comAudio: true });
writeFileSync(resolve(saida, 'index.html'), paginaHTML(dados));
const comAudio = dados.devedores.filter((d) => d.audio).length;
console.log(`✅ Site gerado: ${resolve(saida, 'index.html')} (${dados.devedores.length} devedores, ${comAudio} c/ audio)`);
