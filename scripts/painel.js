// Painel web local — serve a UI unica + gera VOZ AO VIVO do texto digitado.
//   node scripts/painel.js   ->  http://localhost:8788
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { montarDados } from '../src/montar.js';
import { paginaHTML } from '../src/painel-ui.js';
import { paginaClienteHTML } from '../src/cliente-ui.js';
import { paginaHomeHTML } from '../src/home-ui.js';
import { gerarVoz } from '../src/voz.js';
import * as wa from '../src/wa-manager.js';
import { PACOTES, criarRecarga, confirmarRecarga } from '../src/recarga.js';
import { saldo as credSaldo, usados as credUsados, historico as credHist } from '../src/creditos.js';

const PORTA = Number(process.env.PORTA_PAINEL || 8788);

createServer(async (req, res) => {
  // voz ao vivo: /api/voz?texto=... -> mp3 gerado na hora (edge-tts)
  if (req.url.startsWith('/api/voz')) {
    const texto = new URL(req.url, 'http://x').searchParams.get('texto') || '';
    if (!texto.trim()) { res.writeHead(400).end('sem texto'); return; }
    try {
      const mp3 = await gerarVoz(texto);
      res.writeHead(200, { 'content-type': 'audio/mpeg', 'cache-control': 'no-store' });
      res.end(await readFile(mp3));
    } catch (e) { console.error('voz erro', e); res.writeHead(500).end('erro'); }
    return;
  }
  // --- recarga / creditos ---
  if (req.url.startsWith('/api/recarga/') || req.url.startsWith('/api/creditos')) {
    const q = new URL(req.url, 'http://x');
    const acao = req.url.split('?')[0].split('/').pop();
    let r;
    try {
      if (acao === 'pacotes' || acao === 'creditos')
        r = { saldo: credSaldo(1), usados: credUsados(1), pacotes: PACOTES, historico: credHist(1) };
      else if (acao === 'comprar') { const c = await criarRecarga(1, q.searchParams.get('pacote')); r = { pix: c.pix, pacote: c.pacote }; }
      else if (acao === 'confirmar') r = confirmarRecarga(q.searchParams.get('pix'));
      else r = { erro: 'acao invalida' };
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify(r));
    } catch (e) { res.writeHead(500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ erro: e.message })); }
    return;
  }
  // --- multi-numero WhatsApp ---
  if (req.url.startsWith('/api/wa/')) {
    const q = new URL(req.url, 'http://x');
    const id = q.searchParams.get('id') || '1';
    const acao = req.url.split('?')[0].split('/').pop();
    let r;
    if (acao === 'conectar') r = await wa.conectar(id);
    else if (acao === 'desconectar') r = await wa.desconectar(id);
    else r = wa.status(id); // status
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify(r));
    return;
  }
  const u = req.url.split('?')[0];
  if (u === '/' || u.startsWith('/index')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(paginaHomeHTML());
    return;
  }
  const dados = await montarDados({ comAudio: true }); // audios cacheados
  if (u.startsWith('/cliente')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(paginaClienteHTML(dados));
  } else if (u === '/api/dados') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(dados));
  } else { // /central e demais
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(paginaHTML(dados));
  }
}).listen(PORTA, () => console.log(`\n📊 Painel: http://localhost:${PORTA}  (voz ao vivo em /api/voz)\n`));
