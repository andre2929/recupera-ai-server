// Camada de dados. Usa o SQLite nativo do Node (>=22.5) — zero dependencia que compila.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const caminhoDB = resolve(raiz, 'data', 'recupera.db');
mkdirSync(dirname(caminhoDB), { recursive: true });

export const db = new DatabaseSync(caminhoDB);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS devedores (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nome          TEXT NOT NULL,
    cpf           TEXT,
    telefone      TEXT UNIQUE NOT NULL,
    valor         REAL NOT NULL,
    vencimento    TEXT,
    credor        TEXT,
    situacao_spc  TEXT DEFAULT 'negativado',
    perfil_teste  TEXT,
    estado        TEXT NOT NULL DEFAULT 'NOVO',
    valor_acordo  REAL,
    parcelas      INTEGER,
    pix_id        TEXT,
    criado_em     TEXT DEFAULT (datetime('now','localtime')),
    atualizado_em TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS mensagens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    devedor_id INTEGER NOT NULL,
    direcao    TEXT NOT NULL,           -- 'entrada' (devedor) | 'saida' (bot)
    texto      TEXT NOT NULL,
    criado_em  TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (devedor_id) REFERENCES devedores(id)
  );

  CREATE TABLE IF NOT EXISTS eventos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    devedor_id INTEGER,
    tipo       TEXT NOT NULL,           -- acordo, pix_gerado, comprovante, pagamento, baixa_spc, contestacao
    detalhe    TEXT,
    criado_em  TEXT DEFAULT (datetime('now','localtime'))
  );

  -- ===== camada SaaS: creditos / recarga (por lojista) =====
  -- Ledger de creditos: cada linha e um movimento; saldo = SUM(quantidade).
  CREATE TABLE IF NOT EXISTS creditos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    lojista_id  INTEGER NOT NULL DEFAULT 1,
    tipo        TEXT NOT NULL,          -- recarga | consumo | ajuste | bonus
    quantidade  INTEGER NOT NULL,       -- + credita, - consome
    saldo_apos  INTEGER,
    ref_tipo    TEXT,                   -- recarga | devedor | manual
    ref_id      TEXT,
    descricao   TEXT,
    criado_em   TEXT DEFAULT (datetime('now','localtime'))
  );

  -- Lojistas/clientes do SaaS (a CDL usa e revende aos lojistas).
  CREATE TABLE IF NOT EXISTS lojistas (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    razao_social  TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj          TEXT,
    endereco      TEXT,
    telefone      TEXT,
    email         TEXT,
    plano         TEXT DEFAULT 'Recarga',
    status        TEXT DEFAULT 'ativo',
    criado_em     TEXT DEFAULT (datetime('now','localtime'))
  );

  -- Compras de recarga (PIX). idempotencia por pix_id.
  CREATE TABLE IF NOT EXISTS recargas (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    lojista_id    INTEGER NOT NULL DEFAULT 1,
    pacote        TEXT NOT NULL,
    creditos      INTEGER NOT NULL,
    valor_cents   INTEGER NOT NULL,     -- dinheiro sempre em centavos
    pix_id        TEXT UNIQUE,
    pix_copia     TEXT,
    status        TEXT NOT NULL DEFAULT 'pendente', -- pendente | pago | expirado
    criado_em     TEXT DEFAULT (datetime('now','localtime')),
    pago_em       TEXT
  );

  -- Auditoria: registra toda alteracao feita no sistema.
  CREATE TABLE IF NOT EXISTS auditoria (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    acao       TEXT NOT NULL,
    detalhe    TEXT,
    quem       TEXT DEFAULT 'Gestor',
    criado_em  TEXT DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS agente_cfg (
    lojista_id INTEGER PRIMARY KEY,
    json       TEXT NOT NULL,
    atualizado TEXT DEFAULT (datetime('now','localtime'))
  );
`);

// seed de lojistas (idempotente): a CDL + exemplos
if (db.prepare('SELECT COUNT(*) n FROM lojistas').get().n === 0) {
  const insL = db.prepare('INSERT INTO lojistas (razao_social,nome_fantasia,cnpj,endereco,telefone,email,plano,status) VALUES (?,?,?,?,?,?,?,?)');
  insL.run('Camara de Dirigentes Lojistas de Campo Grande / MS', 'CDL Campo Grande', '03.962.883/0001-09', 'Rua Antonio Maria Coelho Correa, 417 - Jardim Monte Libano', '(67) 3320-4000', 'contato@cdlcampogrande.com.br', 'Escala', 'ativo');
  insL.run('Oticas Visao Clara LTDA', 'Oticas Visao Clara', '12.345.678/0001-90', 'Av. Afonso Pena, 1000 - Centro', '(67) 3025-1000', 'contato@visaoclara.com.br', 'Recarga', 'ativo');
  insL.run('Moveis Bom Lar LTDA', 'Moveis Bom Lar', '98.765.432/0001-10', 'Rua 14 de Julho, 500 - Centro', '(67) 3384-2000', 'vendas@bomlar.com.br', 'Profissional', 'ativo');
}

// --- lojistas / auditoria ---
export const lojistas = () => db.prepare(
  `SELECT l.*, COALESCE((SELECT SUM(quantidade) FROM creditos c WHERE c.lojista_id=l.id),0) creditos
   FROM lojistas l ORDER BY l.id`).all();

// --- config do Agente IA (por lojista) ---
const _upAg = db.prepare(`INSERT INTO agente_cfg (lojista_id,json,atualizado) VALUES (?,?,datetime('now','localtime'))
  ON CONFLICT(lojista_id) DO UPDATE SET json=excluded.json, atualizado=excluded.atualizado`);
export function salvarAgente(cfg, lojista = 1) { _upAg.run(lojista, JSON.stringify(cfg)); auditar('agente_cfg', 'Configuracao do Agente IA atualizada', 'Cliente'); return { ok: true }; }
export function lerAgente(lojista = 1) {
  const r = db.prepare('SELECT json FROM agente_cfg WHERE lojista_id=?').get(lojista);
  return r ? JSON.parse(r.json) : null;
}

const _insAud = db.prepare('INSERT INTO auditoria (acao,detalhe,quem) VALUES (?,?,?)');
export const auditar = (acao, detalhe = null, quem = 'Gestor') => { try { _insAud.run(acao, detalhe, quem); } catch {} };
export const listaAuditoria = (limite = 60) =>
  db.prepare('SELECT acao,detalhe,quem,criado_em FROM auditoria ORDER BY id DESC LIMIT ?').all(limite);

export function zerarBase() {
  db.exec('DELETE FROM devedores; DELETE FROM mensagens; DELETE FROM eventos; DELETE FROM creditos; DELETE FROM recargas;');
  auditar('zerar_base', 'Base operacional zerada (devedores, conversas, creditos e recargas)');
}

export const recargasPagas = () => db.prepare(
  `SELECT r.pacote,r.creditos,r.valor_cents,r.status,r.criado_em,r.pago_em, l.nome_fantasia
   FROM recargas r LEFT JOIN lojistas l ON l.id=r.lojista_id ORDER BY r.id DESC LIMIT 50`).all();

export function resumoGestor() {
  const cli = db.prepare('SELECT COUNT(*) n FROM lojistas').get().n;
  const rec = db.prepare("SELECT COALESCE(SUM(valor_cents),0) v, COUNT(*) n, COALESCE(SUM(creditos),0) c FROM recargas WHERE status='pago'").get();
  const usados = -db.prepare("SELECT COALESCE(SUM(quantidade),0) s FROM creditos WHERE tipo='consumo'").get().s;
  const r = resumo();
  return { clientes: cli, receita_cents: rec.v, recargas: rec.n, creditos_vendidos: rec.c, creditos_usados: usados, devedores: r.total, recuperado: r.recuperado };
}

// Aprendizado da IA: mede (honesto, do banco real) o que converte melhor.
export function aprendizado() {
  const porPerfil = db.prepare(
    `SELECT COALESCE(perfil_teste,'sem_perfil') perfil, COUNT(*) total,
       SUM(CASE WHEN estado IN ('PAGO','COMPROVANTE_RECEBIDO') THEN 1 ELSE 0 END) pagos
     FROM devedores GROUP BY perfil ORDER BY pagos DESC`).all()
    .map((p) => ({ ...p, conv: p.total ? Math.round(100 * p.pagos / p.total) : 0 }));
  const evt = db.prepare('SELECT tipo, COUNT(*) n FROM eventos GROUP BY tipo').all();
  return { porPerfil, eventos: evt };
}

// --- devedores ---
const _upsert = db.prepare(`
  INSERT INTO devedores (nome, cpf, telefone, valor, vencimento, credor, situacao_spc, perfil_teste)
  VALUES (@nome, @cpf, @telefone, @valor, @vencimento, @credor, @situacao_spc, @perfil_teste)
  ON CONFLICT(telefone) DO UPDATE SET
    nome=excluded.nome, cpf=excluded.cpf, valor=excluded.valor,
    vencimento=excluded.vencimento, credor=excluded.credor,
    situacao_spc=excluded.situacao_spc, perfil_teste=excluded.perfil_teste
`);
export function upsertDevedor(d) {
  return _upsert.run({
    nome: d.nome, cpf: d.cpf ?? null, telefone: d.telefone,
    valor: d.valor, vencimento: d.vencimento ?? null, credor: d.credor ?? null,
    situacao_spc: d.situacao_spc ?? 'negativado', perfil_teste: d.perfil_teste ?? null,
  });
}

const _porTel = db.prepare('SELECT * FROM devedores WHERE telefone = ?');
export const devedorPorTelefone = (tel) => _porTel.get(tel);

const _porId = db.prepare('SELECT * FROM devedores WHERE id = ?');
export const devedorPorId = (id) => _porId.get(id);

const _todos = db.prepare('SELECT * FROM devedores ORDER BY id');
export const todosDevedores = () => _todos.all();

const _updEstado = db.prepare(
  `UPDATE devedores SET estado=@estado, valor_acordo=@valor_acordo, parcelas=@parcelas,
     pix_id=@pix_id, atualizado_em=datetime('now','localtime') WHERE id=@id`);
export function atualizarDevedor(id, campos) {
  const atual = devedorPorId(id);
  _updEstado.run({
    id,
    estado: campos.estado ?? atual.estado,
    valor_acordo: campos.valor_acordo ?? atual.valor_acordo ?? null,
    parcelas: campos.parcelas ?? atual.parcelas ?? null,
    pix_id: campos.pix_id ?? atual.pix_id ?? null,
  });
}

// --- mensagens / eventos ---
const _insMsg = db.prepare('INSERT INTO mensagens (devedor_id, direcao, texto) VALUES (?,?,?)');
export const logMensagem = (devedorId, direcao, texto) => _insMsg.run(devedorId, direcao, texto);

const _insEvt = db.prepare('INSERT INTO eventos (devedor_id, tipo, detalhe) VALUES (?,?,?)');
export const logEvento = (devedorId, tipo, detalhe = null) => _insEvt.run(devedorId, tipo, detalhe);

// --- resumo p/ painel/CLI ---
export function resumo() {
  const porEstado = db.prepare('SELECT estado, COUNT(*) n FROM devedores GROUP BY estado').all();
  const tot = db.prepare('SELECT COUNT(*) n, COALESCE(SUM(valor),0) v FROM devedores').get();
  const recuperado = db.prepare(
    "SELECT COALESCE(SUM(valor_acordo),0) v FROM devedores WHERE estado IN ('PAGO','COMPROVANTE_RECEBIDO')").get();
  return { porEstado, total: tot.n, carteira: tot.v, recuperado: recuperado.v };
}
