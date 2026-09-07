# Gera audio da voz da Marina (edge-tts, gratis, pt-BR neural).
# Uso: python scripts/gerar-voz.py "texto" saida.mp3 [voz]
import sys, asyncio, edge_tts

VOZ_PADRAO = "pt-BR-FranciscaNeural"

async def gerar(texto, saida, voz):
    # rate um tico mais lento = mais humano/acolhedor numa cobranca
    tts = edge_tts.Communicate(texto, voz, rate="-4%")
    await tts.save(saida)

if __name__ == "__main__":
    texto = sys.argv[1]
    saida = sys.argv[2] if len(sys.argv) > 2 else "voz.mp3"
    voz = sys.argv[3] if len(sys.argv) > 3 else VOZ_PADRAO
    asyncio.run(gerar(texto, saida, voz))
    print(f"OK -> {saida} ({voz})")
