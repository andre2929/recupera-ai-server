// Geracao de cobranca Pix. MODO=mock gera um copia-e-cola FALSO (teste, sem conta).
// MODO=sandbox/producao usa o Asaas. Em qualquer modo, isto CRIA uma cobranca pra
// o devedor pagar — nunca move/transfere dinheiro do Andre.

const MODO = (process.env.PAGAMENTO_MODO || 'mock').toLowerCase();

// CRC16-CCITT (0xFFFF) — usado no campo obrigatorio do BR Code (Pix).
function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function campo(id, valor) {
  return id + String(valor.length).padStart(2, '0') + valor;
}

// Monta um BR Code Pix estatico VALIDO no formato (chave de teste). Bom pra demo:
// gera um copia-e-cola legivel; nao cai numa conta real no modo mock.
function pixMock({ valor, nome, cidade, txid }) {
  const chave = 'recupera-teste@cdlcg.com.br';
  const merchant = campo('00', 'br.gov.bcb.pix') + campo('01', chave);
  const nomeR = (nome || 'RECUPERA AI').normalize('NFD').replace(/[^\x20-\x7E]/g, '').slice(0, 25).toUpperCase();
  const cidadeR = (cidade || 'CAMPO GRANDE').normalize('NFD').replace(/[^\x20-\x7E]/g, '').slice(0, 15).toUpperCase();
  const addfields = campo('05', String(txid).slice(0, 25));
  let payload =
    campo('00', '01') +
    campo('26', merchant) +
    campo('52', '0000') +
    campo('53', '986') +
    campo('54', Number(valor).toFixed(2)) +
    campo('58', 'BR') +
    campo('59', nomeR) +
    campo('60', cidadeR) +
    campo('62', addfields);
  payload += '6304';
  return payload + crc16(payload);
}

async function pixAsaas({ valor, nome, cpf, txid, prazoHoras }) {
  const base = MODO === 'producao' ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3';
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error('ASAAS_API_KEY ausente para MODO=' + MODO);
  const venc = new Date(Date.now() + (prazoHoras || 24) * 3600e3).toISOString().slice(0, 10);
  const headers = { 'Content-Type': 'application/json', access_token: key };

  // 1) cliente
  const cli = await fetch(base + '/customers', {
    method: 'POST', headers,
    body: JSON.stringify({ name: nome, cpfCnpj: (cpf || '').replace(/\D/g, '') || undefined }),
  }).then((r) => r.json());

  // 2) cobranca Pix
  const cob = await fetch(base + '/payments', {
    method: 'POST', headers,
    body: JSON.stringify({
      customer: cli.id, billingType: 'PIX', value: Number(valor),
      dueDate: venc, externalReference: txid, description: 'Acordo CDL — ' + txid,
    }),
  }).then((r) => r.json());

  // 3) QR/copia-e-cola
  const qr = await fetch(base + `/payments/${cob.id}/pixQrCode`, { headers }).then((r) => r.json());
  return { copiaCola: qr.payload, id: cob.id, expira: venc };
}

// Gera a cobranca. Retorna { copiaCola, id, expira }.
export async function gerarPix({ valor, nome, cpf, cidade = 'Campo Grande', prazoHoras = 24 }) {
  const txid = 'RCPA' + Date.now().toString(36).toUpperCase();
  if (MODO === 'mock') {
    return { copiaCola: pixMock({ valor, nome, cidade, txid }), id: txid, expira: null, mock: true };
  }
  return pixAsaas({ valor, nome, cpf, txid, prazoHoras });
}

export const modoPagamento = MODO;
