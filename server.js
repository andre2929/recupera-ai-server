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
import { PACOTES, criarRecarga, confirmarRecarga } from './src/recarga.js';
import { saldo as credSaldo, usados as credUsados, historico as credHist } from './src/creditos.js';
import { lojistas, auditar, listaAuditoria, zerarBase, recargasPagas, resumoGestor, aprendizado } from './src/db.js';
import { paginaGestorHTML } from './src/gestor-ui.js';
import { readFileSync as _rfs } from 'node:fs';
import { resolve as _rp, dirname as _rd } from 'node:path';
import { fileURLToPath as _rf } from 'node:url';
const DB_PATH = _rp(_rd(_rf(import.meta.url)), 'data', 'recupera.db');

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
    if (req.url.startsWith('/api/gestor/') || req.url.startsWith('/api/backup') || req.url.startsWith('/api/auditar')) {
      const q = new URL(req.url, 'http://x');
      const acao = req.url.split('?')[0].split('/').pop();
      if (acao === 'backup') {
        auditar('backup', 'Copia de seguranca baixada');
        res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-disposition': `attachment; filename="recupera-backup-${new Date().toISOString().slice(0, 10)}.db"` });
        res.end(_rfs(DB_PATH));
        return;
      }
      let r;
      if (acao === 'resumo') r = resumoGestor();
      else if (acao === 'clientes') r = lojistas();
      else if (acao === 'financeiro') r = recargasPagas();
      else if (acao === 'auditoria') r = listaAuditoria();
      else if (acao === 'aprendizado') r = aprendizado();
      else if (acao === 'zerar') { zerarBase(); r = { ok: true }; }
      else if (acao === 'auditar') { auditar(q.searchParams.get('acao'), q.searchParams.get('detalhe')); r = { ok: true }; }
      else r = { erro: 'acao invalida' };
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify(r));
      return;
    }
    if (req.url.startsWith('/api/recarga/') || req.url.startsWith('/api/creditos')) {
      const q = new URL(req.url, 'http://x');
      const acao = req.url.split('?')[0].split('/').pop();
      let r;
      if (acao === 'pacotes' || acao === 'creditos') r = { saldo: credSaldo(1), usados: credUsados(1), pacotes: PACOTES, historico: credHist(1) };
      else if (acao === 'comprar') { const c = await criarRecarga(1, q.searchParams.get('pacote')); r = { pix: c.pix, pacote: c.pacote }; }
      else if (acao === 'confirmar') r = confirmarRecarga(q.searchParams.get('pix'));
      else r = { erro: 'acao invalida' };
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify(r));
      return;
    }
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
    if (u.startsWith('/gestor')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(paginaGestorHTML());
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
