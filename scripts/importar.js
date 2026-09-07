// CLI: node scripts/importar.js [caminho.csv]
// Sem argumento, importa a base de teste de exemplos/.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { importarCSV } from '../src/importer.js';
import { resumo } from '../src/db.js';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2];
const caminho = arg ? resolve(arg) : resolve(raiz, 'exemplos', 'base-devedores-teste.csv');

console.log(`\n📥 Importando: ${caminho}\n`);
const r = importarCSV(caminho);
console.log(`✅ Importados/atualizados: ${r.ok}`);
if (r.ignorados) {
  console.log(`⚠️  Ignorados: ${r.ignorados}`);
  r.problemas.forEach((p) => console.log('   - ' + p));
}
const s = resumo();
console.log(`\n📊 Carteira: ${s.total} devedores · R$ ${s.carteira.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`);
