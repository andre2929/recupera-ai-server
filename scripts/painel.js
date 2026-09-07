// Painel web local — serve a UI unica + gera VOZ AO VIVO do texto digitado.
//   node scripts/painel.js   ->  http://localhost:8788
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { montarDados } from '../src/montar.js';
import { paginaHTML } from '../src/painel-ui.js';
import { gerarVoz } from '../src/voz.js';

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
  const dados = await montarDados({ comAudio: true }); // audios cacheados
  if (req.url === '/api/dados') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(dados));
  } else {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(paginaHTML(dados));
  }
}).listen(PORTA, () => console.log(`\n📊 Painel: http://localhost:${PORTA}  (voz ao vivo em /api/voz)\n`));
