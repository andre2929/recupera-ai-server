// Utilitarios puros, sem dependencia externa.

export function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function primeiroNome(nome) {
  return String(nome || '').trim().split(/\s+/)[0] || 'tudo bem';
}

// telefone -> so digitos, com DDI 55 garantido (Brasil). Retorna null se invalido.
export function normalizarTelefone(tel) {
  let d = String(tel || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.length <= 11) d = '55' + d;        // faltando DDI
  if (d.length < 12 || d.length > 13) return null;
  return d;
}

export function soDigitos(s) {
  return String(s || '').replace(/\D/g, '');
}

// dd/mm/aaaa ou aaaa-mm-dd -> Date (00:00 local). null se nao parsear.
export function parseData(s) {
  if (!s) return null;
  s = String(s).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

export function diasAtraso(vencimento, hoje = new Date()) {
  const v = parseData(vencimento);
  if (!v) return 0;
  const ms = hoje.setHours(0, 0, 0, 0) - v.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor(ms / 86400000));
}

export function fmtData(s) {
  const d = parseData(s);
  if (!d) return String(s || '');
  return d.toLocaleDateString('pt-BR');
}

// Preenche "{var}" num template a partir de um objeto.
export function preencher(tpl, vars) {
  return String(tpl).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}
