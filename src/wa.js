// Adaptador WhatsApp (transporte local via whatsapp-web.js — QR no terminal).
// Mesma interface que a Evolution API usaria depois: start / onMessage / enviar.
// Requer: npm install  (baixa o Chromium do puppeteer).
import qrcode from 'qrcode-terminal';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;

export function criarWhatsApp({ onMessage }) {
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './data/wa-session' }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
  });

  client.on('qr', (qr) => {
    console.log('\n📱 Escaneie o QR no WhatsApp do chip dedicado (Aparelhos conectados):\n');
    qrcode.generate(qr, { small: true });
  });
  client.on('ready', () => console.log('✅ WhatsApp conectado.'));
  client.on('auth_failure', (m) => console.error('❌ Falha de autenticacao:', m));
  client.on('disconnected', (r) => console.warn('⚠️  Desconectado:', r));

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

  async function enviar(telefone, texto) {
    const chatId = telefone.replace(/\D/g, '') + '@c.us';
    await client.sendMessage(chatId, texto);
  }

  // envia mp3 como nota de voz (PTT)
  async function enviarAudio(telefone, caminhoMp3) {
    const chatId = telefone.replace(/\D/g, '') + '@c.us';
    const media = MessageMedia.fromFilePath(caminhoMp3);
    await client.sendMessage(chatId, media, { sendAudioAsVoice: true });
  }

  return { start: () => client.initialize(), enviar, enviarAudio, client };
}
