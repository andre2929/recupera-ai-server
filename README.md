# RECUPERA.AI — MVP WhatsApp

IA de cobrança no WhatsApp: importa a carteira, **negocia**, **gera Pix**, recebe o **comprovante** e sinaliza a **baixa no SPC**. Este é o MVP do pilar WhatsApp (voz/ligação vem depois).

Filosofia: a **decisão** (desconto, valor, parcela, gerar Pix, mudar de estado) é 100% do código determinístico. A IA (opcional) só **reescreve o texto** no tom humano — nunca inventa desconto nem move dinheiro. Sem chave de IA, roda sozinho no roteiro.

## O que já funciona (testado)
- Importador de carteira CSV → SQLite (base de 30 devedores de teste incluída).
- Cérebro de negociação: abertura → à vista (desconto por faixa de atraso) / parcelado (respeita parcela mínima e teto de desconto) → Pix → comprovante → baixa.
- Rota humana automática pra contestação ("já paguei" / "não reconheço").
- Follow-up pra quem não responde.
- Pix "copia e cola" válido (modo mock, sem conta) ou Asaas (sandbox/produção).
- **Voz (edge-tts, grátis):** a abertura vai como nota de voz no WhatsApp. Normalizador pt-BR fala valor/data por extenso ("R$ 4.720,00" → "quatro mil e setecentos e vinte reais"). Mensagens com Pix vão como texto (pra copiar). Requer `python` + `pip install edge-tts`.
- Simulador que roda a conversa inteira no terminal, sem WhatsApp.

## Rodar a simulação (não precisa instalar nada pesado)
Requer Node ≥ 22.5 (usa o SQLite nativo).
```bash
npm run importar        # importa a base de teste em exemplos/
npm run sim             # roda todos os perfis
npm run sim quer_parcelar   # só um perfil
```

## Ligar no WhatsApp de verdade
```bash
cp .env.example .env    # ajuste as chaves (opcional: IA e Asaas)
npm install             # baixa o Chromium do puppeteer (~1x)
npm start               # mostra o QR; escaneie com o chip dedicado
npm start -- --disparar 5567900000000   # dispara a abertura SÓ pra esse número
```
⚠️ **Segurança:** o disparo manda mensagem real. Comece pelos **seus próprios chips de teste**. Nunca dispare a carteira inteira antes de validar o piloto de 50–100 contatos.

## Configuração
- `config/negociacao.json` — limites de desconto, parcelas, piso. **A CDL aprova aqui.**
- `config/roteiro.json` — persona (Marina) e mensagens. **A CDL aprova o tom.**
- `.env` — chaves de IA (Anthropic), pagamento (Asaas), transporte WhatsApp.

## Estrutura
```
config/      negociacao.json, roteiro.json   (regras e tom — editáveis pela CDL)
exemplos/    base-devedores-teste.csv        (30 devedores fictícios)
src/         db, importer, brain, pagamento, llm, wa, index, util
scripts/     importar.js, simular.js
data/        (gerado) banco SQLite + sessão do WhatsApp
```

## Feito
- **Voz** na abertura (nota de voz WhatsApp, edge-tts).
- **Painel web** (`npm run painel` → http://localhost:8788): KPIs, funil, carteira e conversa estilo WhatsApp.

## Ainda não incluído (próximos passos)
- **Ligação telefônica** de verdade (hoje é áudio no chat; ligar exige provedor tipo Twilio + custo/min + STT pra ouvir a resposta).
- Baixa no SPC: hoje o sistema **sinaliza** a baixa (evento + mensagem); a integração real com o sistema da CDL depende do acesso deles.
- Lembrete automático das parcelas seguintes.
