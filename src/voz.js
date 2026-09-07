// Voz da Marina: transforma o texto do chat em fala natural pt-BR e gera o mp3
// via edge-tts (gratis, sem key). Chama o script python scripts/gerar-voz.py.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dirVoz = resolve(raiz, 'data', 'voz');
mkdirSync(dirVoz, { recursive: true });

export const VOZ = process.env.VOZ_MARINA || 'pt-BR-FranciscaNeural';
const PYTHON = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');

// ---------- extenso pt-BR ----------
const U = ['zero', 'um', 'dois', 'tres', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
  'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const D = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const C = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function ext999(n) {
  if (n === 0) return '';
  if (n === 100) return 'cem';
  const out = [];
  const c = Math.floor(n / 100), r = n % 100;
  if (c) out.push(C[c]);
  if (r < 20 && r > 0) out.push(U[r]);
  else if (r >= 20) { const d = Math.floor(r / 10), u = r % 10; out.push(D[d] + (u ? ' e ' + U[u] : '')); }
  return out.join(' e ');
}
export function extenso(n) {
  n = Math.floor(n);
  if (n === 0) return 'zero';
  const partes = [];
  const mi = Math.floor(n / 1000000), mil = Math.floor((n % 1000000) / 1000), r = n % 1000;
  if (mi) partes.push((mi === 1 ? 'um milhao' : ext999(mi) + ' milhoes'));
  if (mil) partes.push(mil === 1 ? 'mil' : ext999(mil) + ' mil');
  if (r) partes.push(ext999(r));
  return partes.join(' e ');
}
function reaisPorExtenso(str) {
  // "1.289,50" -> "mil duzentos e oitenta e nove reais e cinquenta centavos"
  const [int, cent] = str.replace(/\./g, '').split(',');
  const i = parseInt(int, 10), c = parseInt(cent || '0', 10);
  let s = extenso(i) + (i === 1 ? ' real' : ' reais');
  if (c > 0) s += ' e ' + extenso(c) + (c === 1 ? ' centavo' : ' centavos');
  return s;
}
const MESES = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto',
  'setembro', 'outubro', 'novembro', 'dezembro'];

// ---------- texto do chat -> texto falado ----------
export function falarTexto(texto) {
  let t = String(texto);
  t = t.replace(/\*/g, '');                                  // tira negrito markdown
  t = t.replace(/R\$\s*([\d.]+,\d{2})/g, (_, v) => reaisPorExtenso(v)); // dinheiro
  t = t.replace(/(\d+)\s*%/g, (_, n) => extenso(+n) + ' por cento');    // percentual
  t = t.replace(/(\d{2})\/(\d{2})\/(\d{4})/g,                // datas
    (_, d, m, a) => `dia ${extenso(+d)} de ${MESES[+m - 1] || ''} de ${extenso(+a)}`);
  t = t.replace(/\bvenc\.?/gi, 'vencimento');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

// Detecta mensagem que NAO deve virar audio (tem codigo Pix pra copiar).
export function temPix(texto) {
  return /br\.gov\.bcb\.pix/i.test(texto) || /\b[A-Z0-9]{40,}\b/.test(texto);
}

// Gera o mp3. Retorna o caminho. Cacheado por hash do (texto+voz).
export function gerarVoz(texto, voz = VOZ) {
  const falado = falarTexto(texto);
  const hash = createHash('sha1').update(voz + '|' + falado).digest('hex').slice(0, 16);
  const saida = resolve(dirVoz, hash + '.mp3');
  if (existsSync(saida)) return Promise.resolve(saida);
  const script = resolve(raiz, 'scripts', 'gerar-voz.py');
  return new Promise((ok, err) => {
    const p = spawn(PYTHON, [script, falado, saida, voz], { stdio: ['ignore', 'ignore', 'pipe'] });
    let e = '';
    p.stderr.on('data', (d) => (e += d));
    p.on('close', (code) => (code === 0 && existsSync(saida)) ? ok(saida) : err(new Error('TTS falhou: ' + e)));
    p.on('error', err);
  });
}
