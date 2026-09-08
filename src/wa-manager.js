// Gerenciador MULTI-NUMERO do WhatsApp: cada cobrador (chip) = uma instancia
// isolada, com seu proprio QR. O painel mostra o QR; o celular do chip escaneia.
// Roda no SERVIDOR (painel.js/server.js). Cada Chromium consome memoria — em
// producao, dimensionar a VPS (3 chips ~ 1.5GB RAM).
// whatsapp-web.js e qrcode sao carregados sob demanda (import dinamico) — assim o
// servidor de painel+voz sobe mesmo em host sem essas libs (ex: Render free).
const clients = {};      // id -> Client
const estado = {};       // id -> { status, numero, qr }

export function status(id) {
  return estado[id] || { status: 'offline' };
}

export function listar() {
  return Object.keys(estado).map((id) => ({ id, ...estado[id], qr: undefined }));
}

// Inicia (ou reusa) a instancia do cobrador `id`. Idempotente.
export async function conectar(id) {
  id = String(id);
  if (clients[id]) return status(id);
  estado[id] = { status: 'iniciando' };
  let Client, LocalAuth, QR;
  try {
    const pkg = await import('whatsapp-web.js'); Client = pkg.default.Client; LocalAuth = pkg.default.LocalAuth;
    QR = (await import('qrcode')).default;
  } catch { estado[id] = { status: 'indisponivel' }; return status(id); }
  const c = new Client({
    authStrategy: new LocalAuth({ clientId: 'cob-' + id, dataPath: './data/wa-multi' }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
  });
  clients[id] = c;
  c.on('qr', async (qr) => {
    try { estado[id] = { status: 'aguardando', qr: await QR.toDataURL(qr, { width: 320, margin: 2 }) }; }
    catch { estado[id] = { status: 'aguardando' }; }
  });
  c.on('ready', () => { estado[id] = { status: 'conectado', numero: c.info?.wid?.user || null }; });
  c.on('auth_failure', () => { estado[id] = { status: 'erro' }; });
  c.on('disconnected', () => { estado[id] = { status: 'offline' }; delete clients[id]; });
  c.initialize().catch(() => { estado[id] = { status: 'erro' }; delete clients[id]; });
  return status(id);
}

export async function desconectar(id) {
  id = String(id);
  const c = clients[id];
  if (c) { try { await c.logout(); } catch {} try { await c.destroy(); } catch {} delete clients[id]; }
  estado[id] = { status: 'offline' };
  return status(id);
}

// Envia por um cobrador conectado (resolve LID). Retorna true/erro.
export async function enviarPor(id, telefone, texto) {
  const c = clients[String(id)];
  if (!c || estado[String(id)]?.status !== 'conectado') throw new Error('cobrador ' + id + ' offline');
  const wid = await c.getNumberId(telefone.replace(/\D/g, ''));
  if (!wid) throw new Error('numero sem WhatsApp');
  await c.sendMessage(wid._serialized, texto);
  return true;
}
