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
    `Voce e ${contexto.persona || 'Marina'}, negociadora de cobranca amigavel de uma central de credito. ` +
    `Tom: ${contexto.tom || 'cordial, respeitoso e firme'}. ` +
    `Reescreva a mensagem abaixo de forma natural e humana para WhatsApp (curta, calorosa). ` +
    `REGRAS: mantenha EXATAMENTE os mesmos valores em R$, percentuais, o codigo Pix e qualquer numero. ` +
    `Nao invente descontos, prazos ou promessas. Nao adicione informacao nova. So o texto reescrito, sem aspas.`;
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
