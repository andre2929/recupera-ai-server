// Monta o objeto de dados do painel a partir do banco.
// comAudio=true gera (edge-tts) a nota de voz da ABERTURA de cada devedor,
// com o NOME e o VALOR dele, e embute como data URI (cacheado por voz.js).
import { readFileSync } from 'node:fs';
import { db, resumo } from './db.js';
import { abrir } from './brain.js';
import { gerarVoz } from './voz.js';

export async function montarDados({ comAudio = false } = {}) {
  const devs = db.prepare('SELECT * FROM devedores ORDER BY id').all();
  const msgs = db.prepare('SELECT devedor_id, direcao, texto FROM mensagens ORDER BY id').all();
  const porDev = {};
  for (const m of msgs) (porDev[m.devedor_id] ||= []).push(m);

  const devedores = [];
  for (const d of devs) {
    const dev = { ...d, mensagens: porDev[d.id] || [] };
    if (comAudio) {
      try {
        const texto = abrir(d).respostas[0]; // abertura: "Ola, {nome}! ... R$ {valor} ..."
        const mp3 = await gerarVoz(texto);
        dev.audio = 'data:audio/mpeg;base64,' + readFileSync(mp3).toString('base64');
      } catch { /* sem audio p/ esse */ }
    }
    devedores.push(dev);
  }
  return { resumo: resumo(), devedores };
}
