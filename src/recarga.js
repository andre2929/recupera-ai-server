// Recarga pre-paga: o lojista compra um pacote de creditos via PIX.
// Gera o PIX (pagamento.js: mock ou Asaas), e ao confirmar, credita (idempotente).
import { db } from './db.js';
import { gerarPix } from './pagamento.js';
import { conceder, saldo } from './creditos.js';

// Pacotes (alinhados com a proposta). valor sempre em centavos.
export const PACOTES = [
  { id: 'teste', nome: 'Teste', creditos: 200, valor_cents: 60000 },   // R$ 600  -> R$ 3,00/devedor
  { id: 'media', nome: 'Média', creditos: 500, valor_cents: 125000 },  // R$ 1.250 -> R$ 2,50
  { id: 'cheia', nome: 'Cheia', creditos: 1000, valor_cents: 200000 }, // R$ 2.000 -> R$ 2,00
];
export const pacote = (id) => PACOTES.find((p) => p.id === id);

const _ins = db.prepare(
  'INSERT INTO recargas (lojista_id,pacote,creditos,valor_cents,pix_id,pix_copia,status) VALUES (?,?,?,?,?,?,?)');
const _porPix = db.prepare('SELECT * FROM recargas WHERE pix_id=?');
const _pagar = db.prepare("UPDATE recargas SET status='pago', pago_em=datetime('now','localtime') WHERE id=?");

// Cria a cobranca PIX da recarga. Retorna { recarga, pix }.
export async function criarRecarga(lojista, pacoteId) {
  const p = pacote(pacoteId);
  if (!p) throw new Error('pacote invalido: ' + pacoteId);
  const pix = await gerarPix({ valor: p.valor_cents / 100, nome: 'Recarga RECUPERA.AI', prazoHoras: 24 });
  _ins.run(lojista, p.nome, p.creditos, p.valor_cents, pix.id, pix.copiaCola, 'pendente');
  return { recarga: _porPix.get(pix.id), pix, pacote: p };
}

// Confirma o pagamento (webhook Asaas ou botao demo). Idempotente por pix_id.
export function confirmarRecarga(pixId) {
  const r = _porPix.get(pixId);
  if (!r) return { ok: false, motivo: 'recarga nao encontrada' };
  if (r.status === 'pago') return { ok: true, jaPago: true, saldo: saldo(r.lojista_id) };
  _pagar.run(r.id);
  const novoSaldo = conceder(r.lojista_id, r.creditos, {
    tipo: 'recarga', refTipo: 'recarga', refId: pixId, descricao: 'Recarga ' + r.pacote + ' (' + r.creditos + ' creditos)',
  });
  return { ok: true, creditos: r.creditos, saldo: novoSaldo };
}

export const recargasDoLojista = (lojista = 1) =>
  db.prepare('SELECT pacote,creditos,valor_cents,status,criado_em,pago_em FROM recargas WHERE lojista_id=? ORDER BY id DESC LIMIT 20').all(lojista);
