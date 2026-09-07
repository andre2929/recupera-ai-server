// Importa carteira de CSV -> banco. Parser proprio (sem dependencia).
import { readFileSync } from 'node:fs';
import { upsertDevedor } from './db.js';
import { normalizarTelefone } from './util.js';

// Parser CSV simples: aspas duplas, virgula, \n. Suficiente pra base de cobranca.
export function parseCSV(txt) {
  const linhas = [];
  let campo = '', linha = [], aspas = false;
  txt = txt.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (aspas) {
      if (c === '"' && txt[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ',') { linha.push(campo); campo = ''; }
    else if (c === '\n') { linha.push(campo); linhas.push(linha); linha = []; campo = ''; }
    else campo += c;
  }
  if (campo.length || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas.filter((l) => l.some((x) => x.trim() !== ''));
}

function num(v) {
  if (v == null) return 0;
  // aceita "1.289,50" e "1289.50"
  let s = String(v).trim().replace(/[R$\s]/g, '');
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  return parseFloat(s) || 0;
}

export function importarCSV(caminho) {
  const rows = parseCSV(readFileSync(caminho, 'utf8'));
  if (!rows.length) return { ok: 0, ignorados: 0, total: 0 };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (nome) => head.indexOf(nome);
  const iNome = idx('nome'), iCpf = idx('cpf'), iTel = idx('telefone'),
    iVal = idx('valor'), iVenc = idx('vencimento'), iCred = idx('credor'),
    iSpc = idx('situacao_spc'), iPerf = idx('perfil_teste');

  let ok = 0, ignorados = 0;
  const problemas = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const tel = normalizarTelefone(row[iTel]);
    const nome = (row[iNome] || '').trim();
    const valor = num(row[iVal]);
    if (!tel || !nome || valor <= 0) {
      ignorados++; problemas.push(`linha ${r + 1}: ${nome || '(sem nome)'} — telefone/valor invalido`);
      continue;
    }
    upsertDevedor({
      nome, cpf: (row[iCpf] || '').trim() || null, telefone: tel, valor,
      vencimento: (row[iVenc] || '').trim() || null, credor: (row[iCred] || '').trim() || null,
      situacao_spc: (row[iSpc] || '').trim() || 'negativado',
      perfil_teste: iPerf >= 0 ? (row[iPerf] || '').trim() || null : null,
    });
    ok++;
  }
  return { ok, ignorados, total: rows.length - 1, problemas };
}
