// Servidor de PRODUCAO do painel RECUPERA.AI (com voz ao vivo).
// Boot: popula o banco de demo se estiver vazio. Rotas: painel, /api/dados, /api/voz.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { seedDemo } from './src/seed.js';
import { montarDados } from './src/montar.js';
import { paginaHTML } from './src/painel-ui.js';
import { paginaClienteHTML } from './src/cliente-ui.js';
import { paginaHomeHTML } from './src/home-ui.js';
import { gerarVoz } from './src/voz.js';
import * as wa from './src/wa-manager.js';

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
    if (req.url === '/health') { res.writeHead(200).end('ok'); return; }
    if (req.url.startsWith('/api/wa/')) {
      const id = new URL(req.url, 'http://x').searchParams.get('id') || '1';
      const acao = req.url.split('?')[0].split('/').pop();
      const r = acao === 'conectar' ? await wa.conectar(id) : acao === 'desconectar' ? await wa.desconectar(id) : wa.status(id);
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
    const dados = await montarDados({ comAudio: false }); // play gera ao vivo via /api/voz
    if (u === '/api/dados') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(dados));
    } else if (u.startsWith('/cliente')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(paginaClienteHTML(dados));
    } else {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(paginaHTML(dados));
    }
  } catch (e) {
    console.error('erro', e);
    res.writeHead(500).end('erro interno');
  }
});

servidor.listen(PORTA, () => console.log(`🚀 RECUPERA.AI painel + voz ao vivo na porta ${PORTA}`));
