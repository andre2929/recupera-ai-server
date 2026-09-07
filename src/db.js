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
`);

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
