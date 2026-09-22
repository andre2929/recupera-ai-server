// Camada de IA OPCIONAL e AUTOSSUFICIENTE. A IA so REESCREVE/conversa no tom humano.
// Ela NUNCA decide valor, gera Pix ou muda o estado — isso e do brain.js.
// Sem chave (ou se a API falhar), retorna o rascunho deterministico intacto.
//
// Provedores suportados (escolhe pela chave presente, nesta ordem):
//   GROQ_API_KEY     -> Groq (GRATIS, rapido, Llama 3.3 70B)   https://console.groq.com/keys
//   GEMINI_API_KEY   -> Google Gemini (free tier)              https://aistudio.google.com/apikey
//   ANTHROPIC_API_KEY-> Claude
//   OPENAI_API_KEY   -> OpenAI-compativel (OPENAI_BASE_URL)

const GROQ = process.env.GROQ_API_KEY;
const GEMINI = process.env.GEMINI_API_KEY;
const ANTHROPIC = process.env.ANTHROPIC_API_KEY;
const OPENAI = process.env.OPENAI_API_KEY;

const PROVIDER = GROQ ? 'groq' : GEMINI ? 'gemini' : ANTHROPIC ? 'anthropic' : OPENAI ? 'openai' : null;
export const iaAtiva = !!PROVIDER;
export const provedorIA = PROVIDER || 'nenhum';

// ---- chamada unica que despacha pro provedor ativo. Retorna texto ou null. ----
export async function conversar(system, user, { maxTokens = 500, temperature = 0.7 } = {}) {
  if (!PROVIDER) return null;
  try {
    if (PROVIDER === 'groq' || PROVIDER === 'openai') {
      const base = PROVIDER === 'groq' ? 'https://api.groq.com/openai/v1' : (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1');
      const key = PROVIDER === 'groq' ? GROQ : OPENAI;
      const model = PROVIDER === 'groq'
        ? (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile')
        : (process.env.OPENAI_MODEL || 'gpt-4o-mini');
      const r = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
        body: JSON.stringify({ model, max_tokens: maxTokens, temperature,
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
      });
      if (!r.ok) return null;
      const j = await r.json();
      return j?.choices?.[0]?.message?.content?.trim() || null;
    }
    if (PROVIDER === 'gemini') {
      const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature },
        }),
      });
      if (!r.ok) return null;
      const j = await r.json();
      return j?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    }
    if (PROVIDER === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': ANTHROPIC, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
          max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
      });
      if (!r.ok) return null;
      const j = await r.json();
      return j?.content?.[0]?.text?.trim() || null;
    }
  } catch {
    return null; // autossuficiente: falhou a IA, quem chamou usa o fallback
  }
  return null;
}

// rascunho: texto ja pronto do roteiro. contexto: {persona, tom, sistema, ultimaMsg}
// Reescreve no tom humano com o MESMO conteudo/numeros. Fallback = rascunho.
export async function humanizar(rascunho, contexto = {}) {
  if (!PROVIDER) return rascunho;
  const sys = contexto.sistema ||
    (`Voce e ${contexto.persona || 'Marina'}, negociadora de uma central de cobranca, conversando no WhatsApp. ` +
    `Escreva como uma PESSOA REAL brasileira: coloquial e natural, contracoes (pra, ta, ce), calorosa e proxima, ` +
    `frases curtas como quem digita no celular; pode usar 1 emoji leve de vez em quando. ` +
    `Voce age de forma humanizada, mas NUNCA minta: se perguntarem diretamente se voce e um robo/IA/atendente automatico, ` +
    `responda com honestidade que e um assistente digital e siga ajudando com naturalidade. ` +
    `Tom: ${contexto.tom || 'cordial, humano e firme'}. ` +
    `REGRAS DURAS: mantenha EXATAMENTE os mesmos valores em R$, percentuais, o codigo Pix e qualquer numero. ` +
    `Nao invente descontos, prazos ou promessas. Nao adicione informacao nova. Responda so com o texto reescrito, sem aspas.`);
  const user = `Mensagem do cliente: "${contexto.ultimaMsg || ''}"\n\nRascunho a reescrever:\n${rascunho}`;
  const txt = await conversar(sys, user, { maxTokens: 400 });
  return txt || rascunho;
}
