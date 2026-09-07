// CLI: node scripts/simular.js [perfil_teste | telefone]
// Roda a conversa de cobranca contra a base do banco, imprimindo o dialogo.
// Sem WhatsApp, sem chave de IA — prova o cerebro deterministico.
import { db, todosDevedores, devedorPorTelefone, atualizarDevedor, logMensagem, logEvento, resumo } from '../src/db.js';
import { abrir, processar, confirmarPagamento } from '../src/brain.js';
import { humanizar, iaAtiva } from '../src/llm.js';
import { modoPagamento } from '../src/pagamento.js';
import { brl } from '../src/util.js';

// Respostas roteirizadas por perfil (simula o devedor). null = nao responde.
const SCRIPTS = {
  quer_pagar_avista: ['Oi, quero resolver sim', 'à vista', 'pode gerar o pix', 'segue o comprovante'],
  quer_parcelar: ['Oi', 'queria parcelar', 'em 6x', 'paguei a primeira, segue o comprovante'],
  valor_baixo_paga_rapido: ['quero pagar', 'avista', 'manda o pix', 'comprovante em anexo'],
  divida_alta_negocia_desconto: ['oi', 'tem desconto? ta caro', 'à vista entao', 'pode gerar', 'segue comprovante'],
  pede_desconto: ['oi', 'consegue um desconto?', 'fechado, pode gerar', 'comprovante'],
  divida_alta_parcela_longo: ['oi', 'so parcelado', 'em 12x', 'paguei, segue o comprovante'],
  divida_muito_alta: ['oi', 'nossa ta muito alto', 'parcelar', 'em 12x', 'comprovante'],
  ja_pagou_contesta: ['oi', 'eu ja paguei isso mes passado'],
  nao_reconhece_divida: ['quem e voce?', 'nao reconheco essa divida'],
  sem_resposta: [],
};

const anexoLike = (t) => /comprovante|anexo|print/i.test(t);
const linha = () => console.log('─'.repeat(64));

async function fala(dev, resp) {
  const txt = iaAtiva ? await humanizar(resp, { persona: 'Marina' }) : resp;
  console.log(`🤖 Marina: ${txt}`);
  logMensagem(dev.id, 'saida', resp);
}
function ouve(dev, texto) {
  console.log(`👤 ${dev.nome.split(' ')[0]}: ${texto}`);
  logMensagem(dev.id, 'entrada', texto);
}
function aplicar(dev, out) {
  if (out.updates && Object.keys(out.updates).length) Object.assign(dev, out.updates);
  dev.estado = out.estado;
  atualizarDevedor(dev.id, { estado: out.estado, ...out.updates });
  (out.eventos || []).forEach((e) => logEvento(dev.id, e.tipo, e.detalhe));
}

async function conversa(dev) {
  linha();
  const dias = Math.max(0, Math.floor((Date.now() - new Date(dev.vencimento)) / 86400000));
  console.log(`CASO: ${dev.nome} · R$ ${brl(dev.valor)} · ${dev.credor} · ${dias}d atraso · [${dev.perfil_teste || 'sem_perfil'}]`);
  linha();

  // reset p/ demo repetivel
  dev.estado = 'NOVO'; dev.valor_acordo = null; dev.parcelas = null; dev.pix_id = null;
  atualizarDevedor(dev.id, { estado: 'NOVO', valor_acordo: null, parcelas: null, pix_id: null });

  const ab = abrir(dev);
  for (const r of ab.respostas) await fala(dev, r);
  aplicar(dev, ab);

  const script = SCRIPTS[dev.perfil_teste] || ['oi', 'quero pagar', 'à vista', 'pode gerar', 'comprovante'];
  if (script.length === 0) {
    console.log('   … (devedor nao responde — dispara follow-up)');
    const { config } = await import('../src/brain.js');
    await fala(dev, config.ROT.mensagens.followup_1
      .replace('{primeiro_nome}', dev.nome.split(' ')[0]).replace('{credor}', dev.credor));
    logEvento(dev.id, 'followup', '1');
  }

  for (const msgDev of script) {
    ouve(dev, msgDev);
    const out = await processar(dev, msgDev, anexoLike(msgDev));
    for (const r of out.respostas) await fala(dev, r);
    aplicar(dev, out);
    if (dev.estado === 'COMPROVANTE_RECEBIDO') {
      // simula webhook de pagamento confirmando
      const pg = confirmarPagamento(dev);
      for (const r of pg.respostas) await fala(dev, r);
      aplicar(dev, pg);
      break;
    }
    if (['RECUSADO', 'CONTESTACAO', 'PAGO'].includes(dev.estado)) break;
  }
  console.log(`\n   ➡️  Estado final: ${dev.estado}` +
    (dev.valor_acordo ? ` · acordo R$ ${brl(dev.valor_acordo)}${dev.parcelas > 1 ? ` em ${dev.parcelas}x` : ''}` : ''));
}

// ---------- main ----------
const alvo = process.argv[2];
let lista = todosDevedores();
if (!lista.length) {
  console.log('\n⚠️  Base vazia. Rode primeiro:  npm run importar\n');
  process.exit(1);
}
if (alvo) {
  const porTel = devedorPorTelefone(alvo.replace(/\D/g, ''));
  lista = porTel ? [porTel] : lista.filter((d) => d.perfil_teste === alvo);
  if (!lista.length) { console.log(`Nenhum devedor com perfil/telefone "${alvo}".`); process.exit(1); }
}

console.log(`\n🎬 SIMULACAO RECUPERA.AI · pagamento=${modoPagamento} · IA=${iaAtiva ? 'ligada' : 'roteiro'}\n`);
db.exec('DELETE FROM mensagens; DELETE FROM eventos;'); // demo repetivel: comeca limpo
for (const dev of lista) await conversa(dev);

linha();
const s = resumo();
console.log('\n📊 RESUMO DA CARTEIRA');
console.log(`   Total: ${s.total} devedores · R$ ${brl(s.carteira)} em aberto`);
console.log(`   Recuperado (acordo fechado/pago): R$ ${brl(s.recuperado)}`);
console.log('   Por estado:');
s.porEstado.forEach((e) => console.log(`     ${e.estado.padEnd(22)} ${e.n}`));
console.log('');
