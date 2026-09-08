// Adaptador WhatsApp (transporte local via whatsapp-web.js — QR no terminal).
// Mesma interface que a Evolution API usaria depois: start / onMessage / enviar.
// Requer: npm install  (baixa o Chromium do puppeteer).
import qrcode from 'qrcode-terminal';
import QR from 'qrcode';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;

export function criarWhatsApp({ onMessage }) {
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './data/wa-session' }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
  });

  client.on('qr', async (qr) => {
    console.log('\n📱 Escaneie o QR no WhatsApp do chip dedicado (Aparelhos conectados):\n');
    qrcode.generate(qr, { small: true });
    try { await QR.toFile('./data/qr.png', qr, { width: 460, margin: 2 }); console.log('QR_PNG_SALVO'); }
    catch (e) { console.error('erro qr png:', e.message); }
  });
  client.on('ready', () => console.log('✅ WhatsApp conectado.'));
  client.on('auth_failure', (m) => console.error('❌ Falha de autenticacao:', m));
  client.on('disconnected', (r) => console.warn('⚠️  Desconectado:', r));

  const enviados = new Set(); // textos que o proprio bot mandou (evita eco no self-chat)

  client.on('message', async (m) => {
    if (m.from.endsWith('@g.us')) return; // ignora grupos
    const telefone = m.from.replace(/@c\.us$/, '');
    const temAnexo = m.hasMedia;
    try {
      await onMessage({ telefone, texto: m.body || '', temAnexo, raw: m });
    } catch (e) {
      console.error('Erro ao processar msg de', telefone, e);
    }
  });

  // self-chat: quando o numero do bot = numero do devedor (teste com 1 numero),
  // as respostas manuais chegam como fromMe. Processa, pulando o eco do proprio bot.
  client.on('message_create', async (m) => {
    if (!m.fromMe || !m.body) return;
    if (m.to && m.to.endsWith('@g.us')) return;
    if (enviados.has(m.body)) { enviados.delete(m.body); return; } // foi o bot que mandou
    const telefone = (m.to || m.from || '').replace(/@c\.us$/, '').replace(/@lid$/, '');
    try {
      await onMessage({ telefone, texto: m.body, temAnexo: m.hasMedia, raw: m });
    } catch (e) {
      console.error('Erro (self) de', telefone, e);
    }
  });

  // resolve o numero pro id correto do WhatsApp (WID/LID). Evita "No LID for user".
  async function resolverId(telefone) {
    const num = telefone.replace(/\D/g, '');
    const id = await client.getNumberId(num);
    if (!id) throw new Error('Numero sem WhatsApp: ' + num);
    return id._serialized;
  }

  async function enviar(telefone, texto) {
    enviados.add(texto); // marca como envio do bot (self-chat nao ecoa)
    await client.sendMessage(await resolverId(telefone), texto);
  }

  // mostra "digitando..." por `ms` (deixa mais humano)
  async function digitando(telefone, ms) {
    try {
      const chat = await client.getChatById(await resolverId(telefone));
      await chat.sendStateTyping();
      await new Promise((s) => setTimeout(s, ms));
    } catch { /* ignora */ }
  }

  // envia mp3 como nota de voz (PTT)
  async function enviarAudio(telefone, caminhoMp3) {
    const media = MessageMedia.fromFilePath(caminhoMp3);
    await client.sendMessage(await resolverId(telefone), media, { sendAudioAsVoice: true });
  }

  return { start: () => client.initialize(), enviar, enviarAudio, digitando, client };
}
