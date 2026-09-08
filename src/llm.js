// Camada de IA OPCIONAL. Regra de ouro: a IA so REESCREVE o texto no tom humano.
// Ela NUNCA decide valor, gera Pix ou muda o estado — isso e do brain.js.
// Sem ANTHROPIC_API_KEY (ou se a API falhar), retorna o rascunho deterministico intacto.

const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

export const iaAtiva = !!KEY;

// rascunho: texto ja pronto do roteiro. contexto: {persona, tom, historico, ultimaMsg}
// Retorna uma versao mais natural, com o MESMO conteudo/numeros. Fallback = rascunho.
export async function humanizar(rascunho, contexto = {}) {
  if (!KEY) return rascunho;
  const sys =
    `Voce e ${contexto.persona || 'Marina'}, uma negociadora de verdade de uma central de negociacao, conversando no WhatsApp. ` +
    `Escreva como uma PESSOA REAL brasileira: linguagem coloquial e natural, contracoes (pra, ta, ce), calorosa e proxima, ` +
    `frases curtas como quem digita no celular; pode usar 1 emoji leve de vez em quando. ` +
    `NUNCA diga nem de a entender que voce e um robo, IA, bot, assistente virtual, automatico ou sistema — voce se comporta como humana. ` +
    `Se perguntarem se e robo, desconverse de forma natural e simpatica e volte a ajudar, sem admitir nem negar categoricamente. ` +
    `Tom: ${contexto.tom || 'cordial, humano e firme'}. ` +
    `REGRAS DURAS: mantenha EXATAMENTE os mesmos valores em R$, percentuais, o codigo Pix e qualquer numero. ` +
    `Nao invente descontos, prazos ou promessas. Nao adicione informacao nova. Responda so com o texto reescrito, sem aspas.`;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: sys,
        messages: [{ role: 'user', content: `Mensagem do cliente: "${contexto.ultimaMsg || ''}"\n\nRascunho a reescrever:\n${rascunho}` }],
      }),
    });
    if (!r.ok) return rascunho;
    const j = await r.json();
    const txt = j?.content?.[0]?.text?.trim();
    return txt || rascunho;
  } catch {
    return rascunho; // autossuficiente: falhou a IA, segue o roteiro
  }
}
