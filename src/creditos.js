// Ledger de creditos por lojista. 1 credito = 1 devedor que a IA trabalha.
// saldo = soma do ledger. Conceder credita, consumir debita (nunca deixa negativo).
import { db } from './db.js';

const _saldo = db.prepare('SELECT COALESCE(SUM(quantidade),0) s FROM creditos WHERE lojista_id=?');
export const saldo = (lojista = 1) => _saldo.get(lojista).s;

const _usados = db.prepare("SELECT COALESCE(SUM(quantidade),0) s FROM creditos WHERE lojista_id=? AND tipo='consumo'");
export const usados = (lojista = 1) => -_usados.get(lojista).s;

const _ins = db.prepare(
  'INSERT INTO creditos (lojista_id,tipo,quantidade,saldo_apos,ref_tipo,ref_id,descricao) VALUES (?,?,?,?,?,?,?)');

// Credita. Idempotente por (ref_tipo, ref_id): nao credita 2x o mesmo pagamento.
export function conceder(lojista, quantidade, { tipo = 'recarga', refTipo = null, refId = null, descricao = null } = {}) {
  if (refId) {
    const ja = db.prepare('SELECT 1 FROM creditos WHERE lojista_id=? AND ref_tipo=? AND ref_id=? AND quantidade>0')
      .get(lojista, refTipo, refId);
    if (ja) return saldo(lojista); // ja creditado
  }
  const novo = saldo(lojista) + quantidade;
  _ins.run(lojista, tipo, quantidade, novo, refTipo, refId, descricao);
  return novo;
}

// Debita. Retorna {ok, saldo}. Nunca deixa negativo.
export function consumir(lojista, quantidade = 1, { refTipo = 'devedor', refId = null, descricao = null } = {}) {
  const s = saldo(lojista);
  if (s < quantidade) return { ok: false, saldo: s };
  const novo = s - quantidade;
  _ins.run(lojista, 'consumo', -quantidade, novo, refTipo, refId, descricao);
  return { ok: true, saldo: novo };
}

export function historico(lojista = 1, limite = 40) {
  return db.prepare(
    'SELECT tipo,quantidade,saldo_apos,descricao,criado_em FROM creditos WHERE lojista_id=? ORDER BY id DESC LIMIT ?')
    .all(lojista, limite);
}
