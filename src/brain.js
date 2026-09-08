// Cerebro da negociacao: maquina de estados deterministica.
// A DECISAO (desconto, valor, parcela, gerar Pix, mudar estado) mora AQUI, no codigo.
// A IA (llm.js) so reescreve o texto depois. Testavel sem WhatsApp e sem chave.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gerarPix } from './pagamento.js';
import { brl, primeiroNome, fmtData, diasAtraso, preencher } from './util.js';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NEG = JSON.parse(readFileSync(resolve(raiz, 'config', 'negociacao.json'), 'utf8'));
const ROT = JSON.parse(readFileSync(resolve(raiz, 'config', 'roteiro.json'), 'utf8'));

// ---------- classificador de intencao (deterministico) ----------
// Texto ja chega minusculo e SEM acento (ver classificar). Sem \b no fim das
// alternativas que sao PREFIXO (parcel, voc, presta), senao o boundary falha.
const RX = {
  contesta: /\b(nao\s*(dev|reconhe|conhe|e\s*minha)|ja\s*(paguei|quitei|pag)|isso\s*(ta|esta)\s*errado|golpe|fraude|quem\s*(e|eh)\s*(voc|vc))/i,
  comprovante: /(comprovante|segue\s*(o\s*|em\s*)?(comprovante|anexo|print)|acabei\s*de\s*pagar|paguei\s*agora|pix\s*feito|(ta|esta)\s*pago|efetuei|realizei\s*o\s*pag)/i,
  parcelas_num: /\b(\d{1,2})\s*(x|vez|parcel|presta)/i,
  parcelar: /(parcel|dividir|em\s*vezes|no\s*boleto|presta|nao\s*(tenho|consigo)\s*(pagar\s*)?tudo)/i,
  avista: /(a\s*vista|avista|tudo\s*de\s*uma|de\s*uma\s*vez|valor\s*total|quitar\s*tudo|pagar\s*tudo)/i,
  desconto: /(desconto|abaixa|abater|melhora|caro|muito\s*alto|\bmenos\b|reduz|diminui|baratear)/i,
  aceita: /\b(sim|quero|pode|aceito|fechad|fechou|bora|vamos|ok|okay|beleza|blz|positivo|claro|com\s*certeza|manda|gera)/i,
  recusa: /(nao\s*(quero|posso|tenho|da|consigo|rola|vai\s*da)|agora\s*nao|depois|deixa\s*(pra|p)\s*depois|sem\s*condi)/i,
  saudacao: /\b(oi|ola|opa|bom\s*dia|boa\s*tarde|boa\s*noite|e\s*ai|eai|tudo\s*bem)\b/i,
  humano: /(voce\s*e\s*(um\s*)?(rob|bot|maquin|ia\b)|isso\s*e\s*(um\s*)?(rob|bot)|e\s*(um\s*)?(rob|bot)\?|falar\s*com\s*(um\s*|uma\s*)?(humano|pessoa|atendente|gerente|consultor)|quero\s*(um\s*|uma\s*)?(humano|atendente|pessoa|consultor)|atendente\s*humano)/i,
};

export function classificar(texto, temAnexo = false) {
  // normaliza: minusculo + remove acentos ("à vista" -> "a vista", "não" -> "nao")
  const t = String(texto || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (temAnexo) return 'comprovante';
  if (RX.contesta.test(t)) return 'contesta';
  if (RX.humano.test(t)) return 'humano';
  if (RX.comprovante.test(t)) return 'comprovante';
  const mn = t.match(RX.parcelas_num);
  if (mn) return { tipo: 'parcelas_num', n: Math.max(1, parseInt(mn[1], 10)) };
  if (RX.parcelar.test(t)) return 'parcelar';
  if (RX.avista.test(t)) return 'avista';
  if (RX.desconto.test(t)) return 'desconto';
  if (RX.recusa.test(t)) return 'recusa';
  if (RX.aceita.test(t)) return 'aceita';
  return 'incerto';
}

// ---------- regras de negocio ----------
function descontoPct(dias) {
  for (const f of NEG.desconto_avista.faixas) if (dias <= f.ate_dias) return f.desconto_pct;
  return 0;
}
function valorComDesconto(valor, dias) {
  const pct = descontoPct(dias);
  const bruto = valor * (1 - pct / 100);
  const piso = valor * (NEG.piso_negociacao_pct / 100);
  return { pct, valor: Math.max(bruto, piso) };
}
function planoParcelas(valor, nPedido) {
  const { parcelas_max, valor_min_parcela } = NEG.parcelamento;
  let n = Math.min(Math.max(1, nPedido || parcelas_max), parcelas_max);
  // garante parcela minima
  while (n > 1 && valor / n < valor_min_parcela) n--;
  return { n, parcela: valor / n };
}

function vars(dev, extra = {}) {
  return {
    primeiro_nome: primeiroNome(dev.nome),
    agente_nome: ROT.agente_nome, empresa: ROT.empresa,
    credor: dev.credor || 'o credor', vencimento: fmtData(dev.vencimento),
    valor: brl(dev.valor), horario_atendimento: ROT.horario_atendimento,
    ...extra,
  };
}
const msg = (chave, dev, extra) => preencher(ROT.mensagens[chave], vars(dev, extra));

// ---------- API ----------
// Mensagem de abertura (disparo). Retorna {respostas, estado, eventos, updates}.
export function abrir(dev) {
  return {
    respostas: [msg('abertura', dev)],
    estado: 'ABERTURA_ENVIADA',
    eventos: [{ tipo: 'abertura' }],
    updates: {},
  };
}

// Processa uma mensagem de entrada. async por causa do Pix.
export async function processar(dev, texto, temAnexo = false) {
  const dias = diasAtraso(dev.vencimento);
  const intent = classificar(texto, temAnexo);
  const tipo = typeof intent === 'object' ? intent.tipo : intent;
  const out = { respostas: [], estado: dev.estado, eventos: [], updates: {} };
  const R = (chave, extra) => out.respostas.push(msg(chave, dev, extra));

  // atalhos globais
  if (tipo === 'contesta' && dev.estado !== 'PAGO') {
    R('contestacao'); out.estado = 'CONTESTACAO';
    out.eventos.push({ tipo: 'contestacao', detalhe: texto });
    return out;
  }
  // pediu falar com humano / perguntou se e robo -> resposta humanizada, segue o papo
  if (tipo === 'humano') {
    R('humano');
    out.eventos.push({ tipo: 'pediu_humano', detalhe: texto });
    return out;
  }

  async function fecharAvista() {
    const { pct, valor } = valorComDesconto(dev.valor, dias);
    const pix = await gerarPix({ valor, nome: dev.nome, cpf: dev.cpf, prazoHoras: NEG.prazo_pix_horas });
    R('gerar_pix', { valor_acordo: brl(valor), pix_copia_cola: pix.copiaCola, prazo_horas: NEG.prazo_pix_horas });
    out.estado = 'AGUARDANDO_PGTO';
    out.updates = { valor_acordo: valor, parcelas: 1, pix_id: pix.id };
    out.eventos.push({ tipo: 'acordo', detalhe: `avista ${pct}% => R$ ${brl(valor)}` });
    out.eventos.push({ tipo: 'pix_gerado', detalhe: pix.id });
  }

  async function fecharParcelado(nPedido) {
    const { n, parcela } = planoParcelas(dev.valor, nPedido);
    const pix = await gerarPix({ valor: parcela, nome: dev.nome, cpf: dev.cpf, prazoHoras: NEG.prazo_pix_horas });
    if (n !== nPedido)
      R('nao_entendi'); // sinaliza ajuste; substituido abaixo por msg propria
    out.respostas = []; // limpa (mensagem propria de parcelamento)
    out.respostas.push(preencher(
      `Fechado, {primeiro_nome}! Ficou em ${n}x de *R$ ${brl(parcela)}* (total R$ {valor}). ` +
      `Segue o Pix da 1a parcela:\n\n${pix.copiaCola}\n\nAssim que pagar, me manda o comprovante que eu confirmo. ` +
      `As proximas eu te lembro no vencimento.`, vars(dev)));
    out.estado = 'AGUARDANDO_PGTO';
    out.updates = { valor_acordo: dev.valor, parcelas: n, pix_id: pix.id };
    out.eventos.push({ tipo: 'acordo', detalhe: `parcelado ${n}x de R$ ${brl(parcela)}` });
    out.eventos.push({ tipo: 'pix_gerado', detalhe: pix.id });
  }

  switch (dev.estado) {
    case 'NOVO':
    case 'ABERTURA_ENVIADA': {
      if (tipo === 'recusa') { R('encerramento_recusa'); out.estado = 'RECUSADO'; break; }
      if (tipo === 'parcelar') {
        const { n, parcela } = planoParcelas(dev.valor, NEG.parcelamento.parcelas_max);
        R('oferta_parcelado', { parcelas_max: n, valor_parcela: brl(parcela) });
        out.estado = 'OFERTA_PARCELADO'; break;
      }
      // engajou (avista, aceita, desconto, saudacao ou ambiguo) -> oferta a vista (melhor pro credor)
      const { pct, valor } = valorComDesconto(dev.valor, dias);
      R('oferta_avista', { desconto_pct: pct, valor_com_desconto: brl(valor) });
      out.estado = 'OFERTA_AVISTA'; break;
    }

    case 'OFERTA_AVISTA': {
      if (tipo === 'aceita' || tipo === 'avista') { await fecharAvista(); break; }
      if (tipo === 'parcelar') {
        const { n, parcela } = planoParcelas(dev.valor, NEG.parcelamento.parcelas_max);
        R('oferta_parcelado', { parcelas_max: n, valor_parcela: brl(parcela) });
        out.estado = 'OFERTA_PARCELADO'; break;
      }
      if (tipo === 'desconto') {
        const { pct, valor } = valorComDesconto(dev.valor, dias);
        out.respostas.push(preencher(
          `Essa ja e a melhor condicao que consigo, {primeiro_nome}: ${pct}% de desconto, ` +
          `de R$ {valor} por *R$ ${brl(valor)}* a vista. Fechamos com o Pix?`, vars(dev)));
        break; // continua em OFERTA_AVISTA
      }
      if (tipo === 'comprovante') { R('contestacao'); out.estado = 'CONTESTACAO'; break; }
      if (tipo === 'recusa') { R('encerramento_recusa'); out.estado = 'RECUSADO'; break; }
      R('nao_entendi'); break;
    }

    case 'OFERTA_PARCELADO': {
      if (tipo === 'parcelas_num') { await fecharParcelado(intent.n); break; }
      if (tipo === 'avista') {
        const { pct, valor } = valorComDesconto(dev.valor, dias);
        R('oferta_avista', { desconto_pct: pct, valor_com_desconto: brl(valor) });
        out.estado = 'OFERTA_AVISTA'; break;
      }
      if (tipo === 'aceita') {
        out.respostas.push(preencher('Perfeito! Em quantas vezes voce prefere? (ate ' +
          NEG.parcelamento.parcelas_max + 'x)', vars(dev)));
        break;
      }
      if (tipo === 'recusa') { R('encerramento_recusa'); out.estado = 'RECUSADO'; break; }
      R('nao_entendi'); break;
    }

    case 'AGUARDANDO_PGTO': {
      if (tipo === 'comprovante') {
        R('comprovante_ok'); out.estado = 'COMPROVANTE_RECEBIDO';
        out.eventos.push({ tipo: 'comprovante', detalhe: temAnexo ? 'anexo' : 'texto' });
        break;
      }
      R('pedir_comprovante'); break;
    }

    case 'COMPROVANTE_RECEBIDO':
      out.respostas.push(preencher('Seu comprovante ja esta em validacao, {primeiro_nome}. ' +
        'Assim que confirmar, a baixa e iniciada. 🙌', vars(dev)));
      break;

    case 'PAGO':
      out.respostas.push(preencher('Sua pendencia ja esta quitada, {primeiro_nome}! Precisa de mais algo?', vars(dev)));
      break;

    case 'CONTESTACAO':
      out.respostas.push(preencher('Ja registrei seu caso e estou verificando seu pagamento no sistema, {primeiro_nome}. ' +
        'Assim que confirmar, te retorno aqui mesmo. Se tiver o comprovante, pode me mandar que agiliza!', vars(dev)));
      break;

    case 'RECUSADO':
      if (tipo === 'aceita' || tipo === 'avista' || tipo === 'parcelar') {
        const { pct, valor } = valorComDesconto(dev.valor, dias);
        R('oferta_avista', { desconto_pct: pct, valor_com_desconto: brl(valor) });
        out.estado = 'OFERTA_AVISTA';
      } else {
        R('encerramento_recusa');
      }
      break;

    default:
      R('nao_entendi');
  }
  return out;
}

// Confirma pagamento (chamado pelo webhook do Asaas ou manualmente na simulacao).
export function confirmarPagamento(dev) {
  return {
    respostas: [msg('pagamento_confirmado', dev)],
    estado: 'PAGO',
    eventos: [{ tipo: 'pagamento', detalhe: dev.pix_id }, { tipo: 'baixa_spc', detalhe: 'iniciada' }],
    updates: {},
  };
}

export const config = { NEG, ROT };
