// Runtime real: conecta WhatsApp + cerebro + banco + webhook de pagamento.
// Uso:
//   node src/index.js               -> so escuta e responde quem chamar
//   node src/index.js --disparar    -> envia a abertura pra carteira (SO numeros da base)
//   node src/index.js --disparar 5567991000101,5567991000102  -> so esses numeros
//
// SEGURANCA: o disparo manda mensagem de verdade. Rode primeiro com poucos numeros
// de teste (seus proprios chips). Nunca dispare a carteira inteira sem validar o piloto.
import { createServer } from 'node:http';
import { criarWhatsApp } from './wa.js';
import { abrir, processar, confirmarPagamento } from './brain.js';
import { humanizar, iaAtiva } from './llm.js';
import { modoPagamento } from './pagamento.js';
import { gerarVozPtt, temPix } from './voz.js';

const VOZ_ATIVA = process.env.VOZ_ATIVA !== '0'; // liga por padrao; VOZ_ATIVA=0 desliga
import {
  devedorPorTelefone, devedorPorId, todosDevedores, atualizarDevedor,
  logMensagem, logEvento, resumo,
} from './db.js';

const PORTA = Number(process.env.PORTA || 8787);
let wa;

async function responder(dev, out, comVoz = false) {
  for (const r of out.respostas) {
    const txt = iaAtiva ? await humanizar(r, { persona: 'Marina', ultimaMsg: dev._ultima }) : r;
    // nota de voz para mensagens sem Pix (Pix precisa ser texto pra copiar)
    if (comVoz && VOZ_ATIVA && !temPix(txt)) {
      try { await wa.enviarAudio(dev.telefone, await gerarVozPtt(txt)); }
      catch (e) { console.warn('voz falhou, seguindo em texto:', e.message); }
    }
    await wa.digitando(dev.telefone, Math.min(4500, 900 + txt.length * 35)); // "digitando..." humano
    await wa.enviar(dev.telefone, txt);
    logMensagem(dev.id, 'saida', r);
    await new Promise((s) => setTimeout(s, 500)); // respiro entre mensagens
  }
  atualizarDevedor(dev.id, { estado: out.estado, ...out.updates });
  Object.assign(dev, out.updates || {});
  dev.estado = out.estado;
  (out.eventos || []).forEach((e) => logEvento(dev.id, e.tipo, e.detalhe));
}

async function aoReceber({ telefone, texto, temAnexo }) {
  const dev = devedorPorTelefone(telefone.replace(/\D/g, ''));
  if (!dev) { console.log(`(ignorado) numero fora da carteira: ${telefone}`); return; }
  console.log(`📩 ${dev.nome}: ${texto}${temAnexo ? ' [anexo]' : ''}`);
  logMensagem(dev.id, 'entrada', texto || (temAnexo ? '[anexo]' : ''));
  dev._ultima = texto;
  const out = await processar(dev, texto, temAnexo);
  await responder(dev, out);
}

// webhook Asaas -> confirma pagamento -> baixa
function subirWebhook() {
  const server = createServer((req, res) => {
    if (req.method === 'POST' && req.url.startsWith('/webhook/asaas')) {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', async () => {
        try {
          const token = process.env.ASAAS_WEBHOOK_TOKEN;
          if (token && req.headers['asaas-access-token'] !== token) { res.writeHead(401).end('unauthorized'); return; }
          const ev = JSON.parse(body || '{}');
          if (ev.event === 'PAYMENT_RECEIVED' || ev.event === 'PAYMENT_CONFIRMED') {
            const ref = ev.payment?.externalReference || ev.payment?.id;
            const dev = todosDevedores().find((d) => d.pix_id === ref);
            if (dev) { const pg = confirmarPagamento(dev); await responder(dev, pg); console.log(`💰 Pagamento confirmado: ${dev.nome}`); }
          }
          res.writeHead(200).end('ok');
        } catch (e) { console.error('webhook erro', e); res.writeHead(500).end('erro'); }
      });
    } else if (req.url === '/status') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(resumo()));
    } else { res.writeHead(404).end(); }
  });
  server.listen(PORTA, () => console.log(`🌐 Webhook/status em http://localhost:${PORTA} (POST /webhook/asaas, GET /status)`));
}

async function dispararCarteira(filtro) {
  let lista = todosDevedores().filter((d) => d.estado === 'NOVO');
  if (filtro?.length) {
    const set = new Set(filtro.map((n) => n.replace(/\D/g, '')));
    lista = lista.filter((d) => set.has(d.telefone));
  }
  console.log(`📣 Disparando abertura para ${lista.length} devedor(es)...`);
  for (const dev of lista) {
    const out = abrir(dev);
    await responder(dev, out, true); // abertura com voz
    console.log(`   -> ${dev.nome} (${dev.telefone})`);
    await new Promise((s) => setTimeout(s, 3000)); // espaça pra nao queimar numero
  }
  console.log('✅ Disparo concluido.');
}

// ---------- boot ----------
console.log(`\n🚀 RECUPERA.AI runtime · pagamento=${modoPagamento} · IA=${iaAtiva ? 'ligada' : 'roteiro'}\n`);
subirWebhook();
wa = criarWhatsApp({ onMessage: aoReceber });

const args = process.argv.slice(2);
const idxDisp = args.indexOf('--disparar');
wa.client.on('ready', async () => {
  if (idxDisp >= 0) {
    const alvos = args[idxDisp + 1] && !args[idxDisp + 1].startsWith('--') ? args[idxDisp + 1].split(',') : [];
    await dispararCarteira(alvos);
  } else {
    console.log('👂 Escutando mensagens. (rode com --disparar para iniciar a abertura)');
  }
});
wa.start();
