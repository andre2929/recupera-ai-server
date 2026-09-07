// Servidor de PRODUCAO do painel RECUPERA.AI (com voz ao vivo).
// Boot: popula o banco de demo se estiver vazio. Rotas: painel, /api/dados, /api/voz.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { seedDemo } from './src/seed.js';
import { montarDados } from './src/montar.js';
import { paginaHTML } from './src/painel-ui.js';
import { gerarVoz } from './src/voz.js';

const PORTA = Number(process.env.PORT || 8788);

await seedDemo(); // idempotente

const servidor = createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/api/voz')) {
      const texto = new URL(req.url, 'http://x').searchParams.get('texto') || '';
      if (!texto.trim()) { res.writeHead(400).end('sem texto'); return; }
      const mp3 = await gerarVoz(texto);
      res.writeHead(200, { 'content-type': 'audio/mpeg', 'cache-control': 'public,max-age=86400' });
      res.end(await readFile(mp3));
      return;
    }
    if (req.url === '/api/dados') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(await montarDados({ comAudio: false })));
      return;
    }
    if (req.url === '/health') { res.writeHead(200).end('ok'); return; }
    // pagina: sem audio embutido; o play gera ao vivo via /api/voz
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(paginaHTML(await montarDados({ comAudio: false })));
  } catch (e) {
    console.error('erro', e);
    res.writeHead(500).end('erro interno');
  }
});

servidor.listen(PORTA, () => console.log(`🚀 RECUPERA.AI painel + voz ao vivo na porta ${PORTA}`));
