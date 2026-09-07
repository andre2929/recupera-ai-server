// Popula o banco pra demo (idempotente): importa a carteira e roda as conversas.
// Usado no boot do servidor de producao quando o banco esta vazio.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, todosDevedores, atualizarDevedor, logMensagem, logEvento } from './db.js';
import { importarCSV } from './importer.js';
import { abrir, processar, confirmarPagamento } from './brain.js';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const SCRIPTS = {
  quer_pagar_avista: ['Oi, quero resolver sim', 'a vista', 'pode gerar o pix', 'segue o comprovante'],
  quer_parcelar: ['Oi', 'queria parcelar', 'em 6x', 'paguei a primeira, segue o comprovante'],
  valor_baixo_paga_rapido: ['quero pagar', 'avista', 'manda o pix', 'comprovante em anexo'],
  divida_alta_negocia_desconto: ['oi', 'tem desconto? ta caro', 'a vista entao', 'pode gerar', 'segue comprovante'],
  pede_desconto: ['oi', 'consegue um desconto?', 'fechado, pode gerar', 'comprovante'],
  divida_alta_parcela_longo: ['oi', 'so parcelado', 'em 12x', 'paguei, segue o comprovante'],
  divida_muito_alta: ['oi', 'nossa ta muito alto', 'parcelar', 'em 12x', 'comprovante'],
  ja_pagou_contesta: ['oi', 'eu ja paguei isso mes passado'],
  nao_reconhece_divida: ['quem e voce?', 'nao reconheco essa divida'],
  sem_resposta: [],
};
const anexo = (t) => /comprovante|anexo|print/i.test(t);

function aplicar(dev, out) {
  if (out.updates) Object.assign(dev, out.updates);
  dev.estado = out.estado;
  atualizarDevedor(dev.id, { estado: out.estado, ...out.updates });
  (out.eventos || []).forEach((e) => logEvento(dev.id, e.tipo, e.detalhe));
}

async function conversa(dev) {
  const ab = abrir(dev);
  ab.respostas.forEach((r) => logMensagem(dev.id, 'saida', r));
  aplicar(dev, ab);
  const script = SCRIPTS[dev.perfil_teste] || ['oi', 'quero pagar', 'a vista', 'pode gerar', 'comprovante'];
  for (const msg of script) {
    logMensagem(dev.id, 'entrada', msg);
    const out = await processar(dev, msg, anexo(msg));
    out.respostas.forEach((r) => logMensagem(dev.id, 'saida', r));
    aplicar(dev, out);
    if (dev.estado === 'COMPROVANTE_RECEBIDO') {
      const pg = confirmarPagamento(dev);
      pg.respostas.forEach((r) => logMensagem(dev.id, 'saida', r));
      aplicar(dev, pg);
      break;
    }
    if (['RECUSADO', 'CONTESTACAO', 'PAGO'].includes(dev.estado)) break;
  }
}

export async function seedDemo() {
  if (todosDevedores().length) return { seeded: false };
  importarCSV(resolve(raiz, 'exemplos', 'base-devedores-teste.csv'));
  db.exec('DELETE FROM mensagens; DELETE FROM eventos;');
  for (const dev of todosDevedores()) await conversa(dev);
  return { seeded: true, total: todosDevedores().length };
}
