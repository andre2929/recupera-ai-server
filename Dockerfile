# RECUPERA.AI — painel + voz ao vivo (Node 24 tem node:sqlite estavel; Python p/ edge-tts)
FROM node:24-slim

RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip \
    && pip3 install --break-system-packages --no-cache-dir edge-tts \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

ENV PAGAMENTO_MODO=mock \
    PORT=8788 \
    PYTHON_BIN=python3

EXPOSE 8788
CMD ["node", "server.js"]
