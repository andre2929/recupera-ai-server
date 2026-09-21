// UI unica do painel RECUPERA.AI (SaaS, identidade CDL RECUPERA).
// Usada pelo painel local (painel.js) e pelo site publico (build-site.js).
// paginaHTML(dados) -> HTML completo, self-contained. Dados embutidos (sem fetch).
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// amostra de audio (Marina) embutida p/ demonstrar nota de voz. Se faltar, sem play.
let AUDIO_URI = '';
try {
  const p = resolve(raiz, 'data', 'voz', 'marina-francisca.mp3');
  if (existsSync(p)) AUDIO_URI = 'data:audio/mpeg;base64,' + readFileSync(p).toString('base64');
} catch { /* sem audio */ }

// Marca da CDL RECUPERA em SVG (troque por <img src="data:..."> da PNG oficial se quiser).
// Robo mascote RECUPERA.AI (fallback SVG) — acena e pisca/wink (CSS).
// Se existir data/mascote.png, o painel usa a IMAGEM real no lugar deste SVG.
const ROBO_SVG = `<svg class="robo" viewBox="0 0 130 122" aria-hidden="true">
  <line x1="65" y1="10" x2="65" y2="26" stroke="#7fb0ff" stroke-width="3"/>
  <circle cx="65" cy="8" r="5" fill="#4cc9f0"/>
  <rect x="20" y="30" width="12" height="26" rx="6" fill="#3f78ff"/>
  <rect x="98" y="30" width="12" height="26" rx="6" fill="#3f78ff"/>
  <rect x="30" y="22" width="70" height="54" rx="18" fill="#f4f8ff" stroke="#1e56a8" stroke-width="3"/>
  <rect x="38" y="30" width="54" height="38" rx="14" fill="#0b1f45"/>
  <g class="olhos">
    <path class="e1" d="M46 47 q6 -7 12 0" fill="none" stroke="#4cc9f0" stroke-width="3.4" stroke-linecap="round"/>
    <circle class="e2" cx="78" cy="46" r="5.4" fill="#4cc9f0"/>
  </g>
  <path d="M52 57 q13 9 26 0" fill="none" stroke="#4cc9f0" stroke-width="3.2" stroke-linecap="round"/>
  <rect x="44" y="80" width="42" height="30" rx="12" fill="#f4f8ff" stroke="#1e56a8" stroke-width="2.5"/>
  <rect x="52" y="86" width="26" height="18" rx="4" fill="#1e56a8"/>
  <g class="mao maoE"><rect x="20" y="66" width="10" height="22" rx="5" fill="#cfe0ff"/><circle cx="25" cy="62" r="7" fill="#f4f8ff" stroke="#1e56a8" stroke-width="2"/></g>
  <g class="mao maoD"><rect x="100" y="66" width="10" height="22" rx="5" fill="#cfe0ff"/><circle cx="105" cy="62" r="7" fill="#f4f8ff" stroke="#1e56a8" stroke-width="2"/></g>
</svg>`;

// usa a imagem oficial se o Andre tiver salvado em data/mascote.png (ou .jpg)
let ROBO = ROBO_SVG;
try {
  for (const [f, mime] of [['mascote.png', 'image/png'], ['mascote.jpg', 'image/jpeg'], ['mascote.webp', 'image/webp']]) {
    const p = resolve(raiz, 'data', f);
    if (existsSync(p)) { ROBO = `<img class="robo-img" alt="RECUPERA.AI" src="data:${mime};base64,${readFileSync(p).toString('base64')}">`; break; }
  }
} catch { /* usa SVG */ }
export { ROBO };

const LOGO_SVG = `<svg viewBox="0 0 66 54" class="flag" aria-hidden="true">
  <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#1e56a8"/><stop offset="1" stop-color="#0d2f68"/></linearGradient></defs>
  <path d="M6 6 Q34 1 60 8 L60 34 Q34 41 6 37 Z" fill="url(#lg)"/>
  <path d="M6 34 Q30 28 60 33 L60 37 Q30 43 6 40 Z" fill="#f5b301"/>
  <path d="M6 37 Q30 31 60 35 L60 41 Q30 47 6 43 Z" fill="#1f9d57"/>
</svg>`;
// usa a logo oficial (data/logo.png) se existir; senao o SVG.
let LOGO = LOGO_SVG, LOGO_IMG = false;
try {
  for (const [f, mime] of [['logo.png', 'image/png'], ['logo.jpg', 'image/jpeg'], ['logo.webp', 'image/webp']]) {
    const p = resolve(raiz, 'data', f);
    if (existsSync(p)) { LOGO = `<img class="brandimg" alt="CDL RECUPERA" src="data:${mime};base64,${readFileSync(p).toString('base64')}">`; LOGO_IMG = true; break; }
  }
} catch { /* usa SVG */ }
export { LOGO, LOGO_IMG };

export const CSS = `
:root{
  --azul:#14418b;--azul2:#1e5eff;--azul-esc:#0b2550;--navy:#0a1f45;
  --verde:#1f9d57;--verde2:#00b389;--amarelo:#f5b301;--verm:#e0575b;
  --bg:#eef2f8;--card:#ffffff;--line:#e2e8f2;--ink:#152238;--muted:#5b6b82;
  --side:#0b2550;--side2:#0a1f45;
  --sombra:0 1px 3px rgba(16,38,76,.06),0 6px 18px rgba(16,38,76,.06);
  --raio:14px;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden}
body{font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:var(--ink);font-size:14px;-webkit-font-smoothing:antialiased}
button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
.demo{background:var(--amarelo);color:#3a2a00;text-align:center;font-size:11.5px;font-weight:700;padding:5px;letter-spacing:.02em}

/* layout */
.app{display:grid;grid-template-columns:236px 1fr;min-height:100vh;transition:grid-template-columns .25s}
.app.recolhido{grid-template-columns:72px 1fr}
.sidebar{background:#fff;color:#3f4a5e;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;border-right:1px solid var(--line)}
.flag{width:34px;height:28px;flex:0 0 auto}
.brandimg{height:36px;width:auto;display:block;border-radius:6px;flex:0 0 auto}
.nav{padding:14px 10px;display:flex;flex-direction:column;gap:3px;flex:1}
.nav a{display:flex;align-items:center;gap:13px;padding:11px 13px;border-radius:11px;color:#48546a;font-weight:600;font-size:13.5px;white-space:nowrap;transition:background .15s,color .15s}
.nav a .ic{width:20px;text-align:center;flex:0 0 auto;font-size:16px;color:#7a8aa3}
.nav a:hover{background:#f1f5fc;color:var(--azul)}
.nav a:hover .ic{color:var(--azul)}
.nav a.active{background:#e8f1ff;color:var(--azul2);font-weight:700}
.nav a.active .ic{color:var(--azul2)}
.app.recolhido .nav a .tx{display:none}
.switchlink{margin-top:auto;background:#f0f5ff;color:var(--azul2)!important;font-weight:700}
.switchlink .ic{color:var(--azul2)!important}
.side-foot{padding:16px;font-size:11px;color:#8f9bb0;border-top:1px solid var(--line)}
.app.recolhido .side-foot{display:none}

.main{display:flex;flex-direction:column;min-width:0}
.topbar{position:relative;overflow:hidden;background:linear-gradient(120deg,var(--navy),#123a7e 60%,#0d2f68);color:#fff;padding:14px 22px;display:flex;align-items:center;gap:16px}
.topbar canvas{position:absolute;inset:0;width:100%;height:100%;opacity:.85;pointer-events:none}
.topbar>*{position:relative;z-index:1}
.burger{font-size:20px;color:#cdd8ee;padding:4px 8px;border-radius:8px}
.burger:hover{background:rgba(255,255,255,.1)}
.hlogo{display:flex;align-items:center;gap:9px}
.hlogo .bt{line-height:1.05}.hlogo .bt b{display:block;font-size:15px;font-weight:800;color:#fff}
.hlogo .bt span{display:block;font-size:10px;color:#8fb4ff;font-weight:600}
.tagline{margin-left:14px;font-size:15px;font-weight:600;color:#dbe7ff}
.tagline b{color:#3ee88a}
.top-right{margin-left:auto;display:flex;align-items:center;gap:18px}
.online{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:#d6ffe9}
.online .p{width:9px;height:9px;border-radius:50%;background:#2ee88a;box-shadow:0 0 0 0 rgba(46,232,138,.6);animation:pulse 2s infinite}
.user{display:flex;align-items:center;gap:9px}
.avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#3f78ff,#1e56a8);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:14px}
.user .un{line-height:1.1}.user .un b{font-size:13px}.user .un span{font-size:11px;color:#a9c2ee}

.content{padding:20px 22px 32px;max-width:1280px;width:100%;margin:0 auto}
footer.rodape{margin-top:auto;background:#fff;border-top:1px solid var(--line);padding:14px 22px;display:flex;align-items:center;gap:18px;flex-wrap:wrap;font-size:12px;color:var(--muted)}
footer.rodape b{color:var(--azul)}
footer.rodape .chips{display:flex;gap:16px;margin-left:8px}
footer.rodape .chips span::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--verde);margin-right:6px;vertical-align:middle}
footer.rodape .con{margin-left:auto;color:var(--verde);font-weight:600}

/* banner assistente */
.banner{position:relative;overflow:hidden;border-radius:16px;padding:20px 22px;color:#fff;background:linear-gradient(120deg,#0d2f68,#1e56a8 55%,#123a7e);display:flex;align-items:center;gap:18px;margin-bottom:18px;box-shadow:var(--sombra)}
.banner::after{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.18),transparent);transform:skewX(-18deg);animation:shine 5s infinite}
.banner .bot{width:auto;height:auto;background:none;display:flex;align-items:center;justify-content:center;flex:0 0 auto;align-self:flex-end;margin-bottom:-20px}
.robo{width:82px;height:82px}
.mascote{position:relative;display:inline-block;animation:bob 3.4s ease-in-out infinite}
.robo-img{width:auto;height:132px;object-fit:contain;display:block;filter:drop-shadow(0 8px 16px rgba(0,0,0,.28))}
.lid{position:absolute;top:33%;left:36%;width:29%;height:9%;background:#0a1c40;border-radius:50%;opacity:0;animation:piscar 3.8s infinite}
@keyframes piscar{0%,90%,100%{opacity:0}94%,97%{opacity:1}}
.robo .e2{transform-box:fill-box;transform-origin:center;animation:blink 3.4s infinite}
.robo .maoD{transform-box:fill-box;transform-origin:50% 90%;animation:wave 1.4s ease-in-out infinite}
.robo .maoE{transform-box:fill-box;transform-origin:50% 90%;animation:wave 1.4s ease-in-out infinite reverse}
@keyframes blink{0%,90%,100%{transform:scaleY(1)}94%{transform:scaleY(.1)}}
@keyframes wave{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(14deg)}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
.banner h2{font-size:18px;margin-bottom:3px}.banner p{font-size:13px;color:#cfe0ff;max-width:520px}
.banner .st{margin-left:auto;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.12);padding:8px 14px;border-radius:100px;font-size:12.5px;font-weight:600;white-space:nowrap}
.banner .st .p{width:9px;height:9px;border-radius:50%;background:#2ee88a;animation:pulse 2s infinite}

/* kpis */
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:var(--raio);padding:16px;box-shadow:var(--sombra);display:flex;gap:13px;align-items:center;animation:up .5s both}
.kpi .ki{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex:0 0 auto}
.kpi .n{font-size:21px;font-weight:800;color:var(--navy);line-height:1.1;white-space:nowrap}
.kpi .l{font-size:11.5px;color:var(--muted);margin-top:2px}
.ki.b1{background:rgba(30,94,255,.12);color:var(--azul2)}
.ki.b2{background:rgba(20,65,139,.1);color:var(--azul)}
.ki.b3{background:rgba(31,157,87,.13);color:var(--verde)}
.ki.b4{background:rgba(245,179,1,.15);color:#c98a00}

.funil{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.pill{display:flex;align-items:center;gap:7px;background:#fff;border:1px solid var(--line);border-radius:100px;padding:6px 13px;font-size:12.5px;box-shadow:var(--sombra)}
.pill .dot{width:9px;height:9px;border-radius:50%}
.pill b{font-weight:800}

.grid2{display:grid;grid-template-columns:1fr 1.05fr;gap:16px}
.grid2.wide{grid-template-columns:1fr}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--raio);box-shadow:var(--sombra);overflow:hidden;animation:up .5s both}
.card>h3{font-size:13px;padding:13px 16px;border-bottom:1px solid var(--line);color:var(--navy);display:flex;align-items:center;gap:8px}
.card>h3 a,.card>h3 .lnk{margin-left:auto;font-size:11.5px;color:var(--azul2);font-weight:600;cursor:pointer}

/* lista carteira */
.lista{max-height:64vh;overflow:auto}
.row{display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid var(--line);cursor:pointer;transition:background .15s,transform .15s}
.row:hover{background:#f3f7ff;transform:translateX(2px)}
.row .nome{font-weight:600}.row .meta{font-size:11px;color:var(--muted)}
.row .val{font-weight:700;color:var(--navy);text-align:right;white-space:nowrap}
.row .rt{margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.badge{font-size:10px;font-weight:700;padding:2px 9px;border-radius:100px;white-space:nowrap}

/* filtros */
.filtros{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px;align-items:center}
.tabs{display:flex;gap:6px;flex-wrap:wrap}
.tab{padding:7px 13px;border-radius:100px;font-size:12.5px;font-weight:600;background:#fff;border:1px solid var(--line);color:var(--muted)}
.tab.on{background:var(--azul);color:#fff;border-color:var(--azul)}
.busca{flex:1;min-width:180px;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 12px}
.busca input{border:none;outline:none;flex:1;font-size:13px;background:none}
select.ord{background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:12.5px;color:var(--ink)}

/* conversa */
.conv{display:grid;grid-template-columns:1fr 1.25fr;gap:16px;height:calc(100vh - 220px);min-height:460px}
.conv .lista{max-height:none;height:100%}
.chatw{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:var(--raio);overflow:hidden;box-shadow:var(--sombra)}
.chhead{padding:12px 16px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:12px}
.chead .av{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--verde),var(--verde2));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
.chead .info b{font-size:14px}.chead .info span{font-size:11.5px;color:var(--muted)}
.chhead .cv{margin-left:auto;text-align:right}.chhead .cv b{color:var(--navy)}
.chat{flex:1;overflow:auto;padding:16px;background:#eef1f7;background-image:radial-gradient(rgba(20,65,139,.04) 1px,transparent 1px);background-size:18px 18px}
.chat .empty{color:var(--muted);text-align:center;padding:60px 20px}
.chat .empty .big{font-size:40px;opacity:.4;margin-bottom:10px}
.msg{max-width:76%;padding:9px 13px;border-radius:14px;margin-bottom:9px;font-size:13px;line-height:1.45;white-space:pre-wrap;word-break:break-word;box-shadow:0 1px 1px rgba(0,0,0,.05);animation:up .3s both}
.msg .h{font-size:10px;color:var(--muted);margin-bottom:3px;font-weight:600}
.msg.saida{background:#dff5d8;margin-left:auto;border-bottom-right-radius:4px}
.msg.entrada{background:#fff;border-bottom-left-radius:4px}
.voz{display:flex;align-items:center;gap:10px;min-width:190px}
.voz .play{width:34px;height:34px;border-radius:50%;background:var(--verde);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;flex:0 0 auto}
.voz .wave{flex:1;display:flex;align-items:center;gap:2px;height:22px}
.voz .wave i{flex:1;background:#9fc7ad;border-radius:2px;height:30%}
.voz .dur{font-size:11px;color:var(--muted)}
.vozcap{font-size:11.5px;color:#3a5a3a;margin-top:6px;font-style:italic;opacity:.85}
.composer{display:flex;align-items:center;gap:9px;padding:11px 14px;border-top:1px solid var(--line);background:#fff}
.composer input{flex:1;border:1px solid var(--line);border-radius:100px;padding:10px 16px;font-size:13px;outline:none}
.composer .cb{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;flex:0 0 auto}
.composer .mic{background:#eef2f8;color:var(--azul)}
.composer .snd{background:var(--verde);color:#fff}
.composer .cb:active{transform:scale(.92)}

/* grafico */
.chart{padding:16px}
.chart svg{width:100%;height:auto;display:block}
.chart .lg{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--muted);margin-top:10px}
.chart .lg span::before{content:'';display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:middle}
.barlist{padding:6px 16px 14px}
.barrow{padding:9px 0;border-bottom:1px solid var(--line)}
.barrow:last-child{border:none}
.barrow .t{display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px}
.barrow .t b{color:var(--navy)}
.track{height:8px;background:#eef2f8;border-radius:100px;overflow:hidden}
.track i{display:block;height:100%;border-radius:100px}

/* relatorios / baixa tabelas */
.rtabs{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}
.tbl{width:100%;border-collapse:collapse;font-size:12.5px}
.tbl th{background:#f3f6fb;text-align:left;padding:10px 14px;color:var(--muted);font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.03em}
.tbl th:last-child,.tbl td:last-child{text-align:right}
.tbl td{padding:10px 14px;border-bottom:1px solid var(--line)}
.tbl tr:hover td{background:#f7faff}
.tot{display:flex;justify-content:space-between;padding:13px 16px;background:var(--navy);color:#fff;font-weight:700;border-radius:0 0 var(--raio) var(--raio)}
.tot b{color:var(--amarelo)}
.btn{padding:7px 13px;border-radius:9px;font-size:12px;font-weight:700}
.btn.g{background:var(--verde);color:#fff}
.btn.g:active{transform:scale(.96)}
.btn.done{background:#e8f5ee;color:var(--verde);cursor:default}
.aviso{background:#eef4ff;border-left:4px solid var(--azul2);padding:11px 15px;border-radius:0 10px 10px 0;font-size:12.5px;color:#2a4a80;margin-bottom:14px}

.h2v{font-size:16px;font-weight:800;color:var(--navy);margin-bottom:14px;display:flex;align-items:center;gap:9px}

/* fab + bottom nav (mobile) */
.fab{position:fixed;right:18px;bottom:18px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--azul2),#3f78ff);color:#fff;font-size:26px;box-shadow:0 8px 24px rgba(30,94,255,.5);z-index:40;display:flex;align-items:center;justify-content:center}
.bottomnav{display:none}
.toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--navy);color:#fff;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.25);opacity:0;transition:.3s;z-index:60}
.toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
.cfgin{border:1px solid var(--line);border-radius:9px;padding:9px 11px;font-size:13px;outline:none;font-family:inherit;width:100%}
.cfgin:focus{border-color:var(--azul2)}
.emptybox{padding:34px 20px;text-align:center;color:var(--muted)}
.wamodal{position:fixed;inset:0;background:rgba(10,20,40,.55);display:none;align-items:center;justify-content:center;z-index:70;padding:16px}
.wamodal.on{display:flex}
.wabox{background:#fff;border-radius:16px;width:min(380px,96vw);overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.wahead{padding:13px 16px;border-bottom:1px solid var(--line);display:flex;align-items:center}
.wahead .x{margin-left:auto;font-size:22px;color:var(--muted);cursor:pointer;line-height:1}
.wabody{padding:18px;text-align:center}

@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(46,232,138,.6)}70%{box-shadow:0 0 0 9px rgba(46,232,138,0)}100%{box-shadow:0 0 0 0 rgba(46,232,138,0)}}
@keyframes shine{0%{left:-60%}55%,100%{left:130%}}
@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

/* ===== responsivo ===== */
@media(max-width:1150px){.kpis{grid-template-columns:1fr 1fr}}
@media(max-width:1024px){.grid2{grid-template-columns:1fr}.conv{grid-template-columns:1fr;height:auto}.conv .lista{max-height:38vh}.chatw{height:60vh}}
@media(max-width:760px){
  .app{grid-template-columns:1fr}
  .sidebar{display:none}
  .content{padding:14px 14px 90px}
  .kpis{grid-template-columns:1fr 1fr;gap:10px}
  .kpi{padding:13px;gap:10px}.kpi .n{font-size:19px}
  .banner{flex-wrap:wrap;padding:16px}.banner .st{margin-left:0;margin-top:8px}
  .topbar{padding:12px 14px}.tagline{display:none}.hlogo .bt{display:none}.top-right{gap:10px}.user .un{display:none}
  .banner .bot{margin-bottom:0}.robo-img{height:104px}
  .online span{display:none}
  .bottomnav{display:flex;position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid var(--line);z-index:41;box-shadow:0 -2px 12px rgba(16,38,76,.08)}
  .bottomnav a{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 0;font-size:10px;color:var(--muted);font-weight:600}
  .bottomnav a .ic{font-size:19px}
  .bottomnav a.active{color:var(--azul2)}
  .fab{bottom:74px}
  .conv .lista{max-height:34vh}
  .filtros{gap:8px}.busca{min-width:120px}
  .tbl th:nth-child(2),.tbl td:nth-child(2){display:none}
}
@media(max-width:380px){.kpis{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.topbar canvas{display:none}}
`;

// ---- client JS (SEM backticks e SEM interpolacao — string literal segura) ----
const CLIENT = `
var VIEW='painel',SEL=null,F={st:'todos',q:'',ord:'recent'},KPIok=false;
var BAIXADO={};
var RM=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var EST={
 NOVO:{rot:'Novo',cor:'#5b6b82',g:'aberto'},
 ABERTURA_ENVIADA:{rot:'Abordado',cor:'#1e5eff',g:'neg'},
 OFERTA_AVISTA:{rot:'Negociando',cor:'#8b5cf6',g:'neg'},
 OFERTA_PARCELADO:{rot:'Negociando',cor:'#8b5cf6',g:'neg'},
 AGUARDANDO_PGTO:{rot:'Aguardando pgto',cor:'#f5b301',g:'neg'},
 COMPROVANTE_RECEBIDO:{rot:'Comprovante',cor:'#0ea5a0',g:'pago'},
 PAGO:{rot:'Pago / baixa',cor:'#1f9d57',g:'pago'},
 CONTESTACAO:{rot:'Contestacao',cor:'#e0575b',g:'contest'},
 RECUSADO:{rot:'Recusado',cor:'#9aa7ba',g:'aberto'}
};
function em(e){return EST[e]||{rot:e,cor:'#5b6b82',g:'aberto'};}
function money(n){return 'R$ '+Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
function pn(n){return String(n||'').split(' ')[0];}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
function badge(e){var x=em(e);return '<span class="badge" style="background:'+x.cor+'1f;color:'+x.cor+'">'+x.rot+'</span>';}
function grupo(e){return em(e).g;}
function isPago(d){return grupo(d.estado)==='pago';}
function elBaixa(id){return BAIXADO[id]||grupo(byId(id).estado)==='pago' && false;}
function byId(id){return DADOS.devedores.find(function(d){return d.id===id;});}

function go(v){VIEW=v;paint();window.scrollTo(0,0);}
function paint(){
 document.querySelectorAll('[data-nav]').forEach(function(a){a.classList.toggle('active',a.getAttribute('data-nav')===VIEW);});
 document.querySelectorAll('section[data-view]').forEach(function(s){s.hidden=s.getAttribute('data-view')!==VIEW;});
 if(VIEW==='painel')renderPainel();
 else if(VIEW==='carteira')renderCarteira();
 else if(VIEW==='conversas')renderConversas();
 else if(VIEW==='relatorios')renderRelatorios();
 else if(VIEW==='recuperacao')renderRecuperacao();
 else if(VIEW==='baixa')renderBaixa();
 else if(VIEW==='configuracoes')renderConfig();
 else renderSimples(VIEW);
}

/* ---- painel ---- */
function renderPainel(){
 var r=DADOS.resumo,d=DADOS.devedores;
 var pagos=d.filter(isPago).length;
 var idx=r.total?Math.round(100*pagos/r.total):0;
 var kp=[
  ['b1','&#128101;',r.total,'Devedores na carteira',0],
  ['b2','&#128176;',r.carteira,'Valor em aberto',1],
  ['b3','&#129309;',r.recuperado,'Acordo fechado / pago',1],
  ['b4','&#128200;',idx,'Indice de sucesso',2]
 ];
 var masc=ROBO_IMG?'<div class="mascote">'+ROBO_M+'<span class="lid"></span></div>':ROBO_M;
 var h='<div class="banner"><div class="bot">'+masc+'</div><div><h2>Ola! Sou o Piloto RECUPERA.AI</h2>'+
  '<p>Seu assistente inteligente para ajudar na recuperacao de debitos da CDL Campo Grande.</p></div>'+
  '<div class="st"><span class="p"></span>Sistema Online</div></div>';
 h+='<div class="kpis">';
 kp.forEach(function(k,i){
  h+='<div class="kpi" style="animation-delay:'+(i*.06)+'s"><div class="ki '+k[0]+'">'+k[1]+'</div><div>'+
   '<div class="n" data-to="'+k[2]+'" data-fmt="'+k[4]+'">0</div><div class="l">'+k[3]+'</div></div></div>';
 });
 h+='</div>';
 // funil
 var cont={};d.forEach(function(x){cont[x.estado]=(cont[x.estado]||0)+1;});
 h+='<div class="funil">'+Object.keys(cont).sort(function(a,b){return cont[b]-cont[a];}).map(function(e){
  return '<div class="pill"><span class="dot" style="background:'+em(e).cor+'"></span>'+em(e).rot+' <b>'+cont[e]+'</b></div>';
 }).join('')+'</div>';
 // grafico + mini carteira
 h+='<div class="grid2"><div class="card"><h3>&#128200; Evolucao da recuperacao <span class="lnk" onclick="go(\\'recuperacao\\')">Detalhes</span></h3>'+chartHTML(240)+'</div>'+
   '<div class="card"><h3>&#128188; Carteira <span class="lnk" onclick="go(\\'carteira\\')">Ver todos</span></h3><div class="lista">'+
   d.slice(0,8).map(rowHTML).join('')+'</div></div></div>';
 var el=document.getElementById('v-painel');el.innerHTML=h;
 animKPIs();
}
function animKPIs(){
 document.querySelectorAll('#v-painel .n[data-to]').forEach(function(n){
  var to=+n.getAttribute('data-to'),fmt=+n.getAttribute('data-fmt');
  var f=function(v){return fmt===1?money(v):fmt===2?(Math.round(v)+'%'):Math.round(v);};
  if(RM||KPIok){n.textContent=f(to);return;}
  var t0=null,dur=900;
  function step(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/dur);var e=1-Math.pow(1-p,3);n.textContent=f(to*e);if(p<1)requestAnimationFrame(step);else n.textContent=f(to);}
  requestAnimationFrame(step);
 });
 KPIok=true;
}
function rowHTML(d){
 return '<div class="row" onclick="abrir('+d.id+')"><div><div class="nome">'+esc(d.nome)+'</div>'+
  '<div class="meta">'+esc(d.credor||'')+(d.parcelas>1?' &middot; '+d.parcelas+'x':'')+'</div></div>'+
  '<div class="rt"><div class="val">'+money(d.valor_acordo||d.valor)+'</div>'+badge(d.estado)+'</div></div>';
}

/* ---- carteira ---- */
function filtrar(){
 var arr=DADOS.devedores.slice();
 if(F.st!=='todos')arr=arr.filter(function(d){return grupo(d.estado)===F.st;});
 if(F.q){var q=F.q.toLowerCase();arr=arr.filter(function(d){return (d.nome+' '+(d.credor||'')).toLowerCase().indexOf(q)>=0;});}
 arr.sort(function(a,b){
  if(F.ord==='maior')return (b.valor)-(a.valor);
  if(F.ord==='menor')return (a.valor)-(b.valor);
  if(F.ord==='antigo')return a.id-b.id;
  return b.id-a.id;
 });
 return arr;
}
function renderCarteira(){
 var tabs=[['todos','Todos'],['pago','Pago / Baixa'],['neg','Em negociacao'],['contest','Contestacao'],['aberto','Em aberto']];
 var h='<div class="h2v">&#128188; Carteira de devedores</div><div class="filtros"><div class="tabs">'+
  tabs.map(function(t){return '<button class="tab'+(F.st===t[0]?' on':'')+'" onclick="setSt(\\''+t[0]+'\\')">'+t[1]+'</button>';}).join('')+'</div>'+
  '<div class="busca">&#128269;<input placeholder="Buscar devedor..." value="'+esc(F.q)+'" oninput="setQ(this.value)"></div>'+
  '<select class="ord" onchange="setOrd(this.value)">'+
   [['recent','Mais recente'],['antigo','Mais antigo'],['maior','Maior divida'],['menor','Menor divida']].map(function(o){return '<option value="'+o[0]+'"'+(F.ord===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+
  '</select></div>';
 var arr=filtrar();
 h+='<div class="card"><div class="lista">'+(arr.length?arr.map(rowHTML).join(''):'<div class="empty" style="padding:30px;text-align:center;color:#5b6b82">Nenhum devedor neste filtro.</div>')+'</div></div>';
 document.getElementById('v-carteira').innerHTML=h;
}
function setSt(s){F.st=s;renderCarteira();}
function setQ(q){F.q=q;var arr=filtrar();var box=document.querySelector('#v-carteira .lista');if(box)box.innerHTML=arr.length?arr.map(rowHTML).join(''):'<div class="empty" style="padding:30px;text-align:center;color:#5b6b82">Nada encontrado.</div>';}
function setOrd(o){F.ord=o;renderCarteira();}

/* ---- conversas ---- */
function abrir(id){SEL=id;VIEW='conversas';paint();}
function renderConversas(){
 var d=DADOS.devedores;
 var h='<div class="conv"><div class="card"><h3>&#128188; Carteira</h3><div class="lista">'+
   d.map(function(x){return '<div class="row" onclick="selConv('+x.id+')" style="'+(SEL===x.id?'background:#eaf1ff':'')+'"><div><div class="nome">'+esc(x.nome)+'</div><div class="meta">'+esc(x.credor||'')+'</div></div><div class="rt"><div class="val">'+money(x.valor_acordo||x.valor)+'</div>'+badge(x.estado)+'</div></div>';}).join('')+
   '</div></div>'+chatHTML()+'</div>';
 document.getElementById('v-conversas').innerHTML=h;
}
function selConv(id){SEL=id;renderConversas();}
function chatHTML(){
 var d=SEL?byId(SEL):null;
 if(!d)return '<div class="chatw"><div class="chat"><div class="empty"><div class="big">&#128172;</div>Selecione um devedor<br>para visualizar a conversa.</div></div></div>';
 var msgs=d.mensagens||[];var firstSaida=true;
 var corpo=msgs.length?msgs.map(function(m){
  var audio=false;
  if(m.direcao==='saida'&&firstSaida){audio=true;firstSaida=false;} // abertura = nota de voz
  if(audio){var src=d.audio?d.audio:('/api/voz?texto='+encodeURIComponent(m.texto));return '<div class="msg saida"><div class="h">RECUPERA.AI &#129302; &middot; audio</div>'+vozHTML(src)+'</div>';}
  return '<div class="msg '+m.direcao+'"><div class="h">'+(m.direcao==='saida'?'RECUPERA.AI &#129302;':pn(d.nome))+'</div>'+esc(m.texto)+'</div>';
 }).join(''):'<div class="empty">Sem mensagens.</div>';
 return '<div class="chatw"><div class="chead"><div class="av">'+pn(d.nome).charAt(0)+'</div><div class="info"><b>'+esc(d.nome)+'</b><br><span>'+esc(d.credor||'')+'</span></div>'+
  '<div class="cv"><b>'+money(d.valor_acordo||d.valor)+'</b><br>'+badge(d.estado)+'</div></div>'+
  '<div class="chat" id="chatbox">'+corpo+'</div>'+
  '<div class="composer"><button class="cb mic" title="Enviar audio" onclick="enviarAudio()">&#127908;</button>'+
  '<input id="cin" placeholder="Digite sua mensagem..." onkeydown="if(event.key===\\'Enter\\')enviarMsg()">'+
  '<button class="cb snd" onclick="enviarMsg()">&#10148;</button></div></div>';
}
function vozHTML(src){
 var bars='';for(var i=0;i<22;i++){bars+='<i style="height:'+(20+Math.round(Math.abs(Math.sin(i*1.3))*70))+'%"></i>';}
 var ds=src?' data-src="'+src+'"':'';
 return '<div class="voz"><button class="play"'+ds+' onclick="tocar(this)">&#9654;</button><div class="wave">'+bars+'</div><span class="dur">&#128266; voz</span></div>';
}
var _au=null;
function tocar(btn){
 var src=btn.getAttribute('data-src');
 if(!src){var d=SEL?byId(SEL):null;src=(d&&d.audio)?d.audio:AUDIO;}
 if(!src){alert('Audio nao disponivel.');return;}
 if(_au){_au.pause();}
 _au=new Audio(src);_au.play();btn.innerHTML='&#10073;&#10073;';
 _au.onended=function(){btn.innerHTML='&#9654;';};
}
function enviarMsg(){
 var i=document.getElementById('cin');if(!i||!i.value.trim())return;
 var box=document.getElementById('chatbox');
 box.insertAdjacentHTML('beforeend','<div class="msg saida"><div class="h">Gestor</div>'+esc(i.value.trim())+'</div>');
 i.value='';box.scrollTop=box.scrollHeight;
}
function enviarAudio(){
 var i=document.getElementById('cin');if(!document.getElementById('chatbox'))return;
 var txt=(i&&i.value.trim())||'';
 if(!txt){alert('Digite a mensagem para gerar o audio.');return;}
 if(i)i.value='';
 var cap='<div class="vozcap">&#128172; '+esc(txt)+'</div>';
 function push(inner){var b=document.getElementById('chatbox');b.insertAdjacentHTML('beforeend','<div class="msg saida">'+inner+'</div>');b.scrollTop=b.scrollHeight;}
 push('<div class="h">RECUPERA.AI &#129302; &middot; gerando audio...</div>'+cap);
 var slot=document.getElementById('chatbox').lastChild;
 fetch('/api/voz?texto='+encodeURIComponent(txt)).then(function(r){if(!r.ok)throw 0;return r.blob();})
  .then(function(b){var u=URL.createObjectURL(b);slot.innerHTML='<div class="h">RECUPERA.AI &#129302; &middot; audio (gerado na hora)</div>'+vozHTML(u)+cap;
    var pb=slot.querySelector('.play');if(pb)tocar(pb);})
  .catch(function(){slot.innerHTML='<div class="h">RECUPERA.AI &#129302; &middot; audio</div>'+vozHTML('')+cap;});
}

/* ---- relatorios ---- */
var REL='pago';
function renderRelatorios(){
 var mapa={pago:'Pagos / Baixa',neg:'Em negociacao',aberto:'Em aberto',contest:'Contestacao'};
 var h='<div class="h2v">&#128202; Relatorios</div><div class="rtabs">'+
  Object.keys(mapa).map(function(k){return '<button class="tab'+(REL===k?' on':'')+'" onclick="setRel(\\''+k+'\\')">'+mapa[k]+'</button>';}).join('')+'</div>';
 var arr=DADOS.devedores.filter(function(d){return grupo(d.estado)===REL;});
 var tot=arr.reduce(function(s,d){return s+(REL==='pago'?(d.valor_acordo||d.valor):d.valor);},0);
 h+='<div class="card"><table class="tbl"><thead><tr><th>Devedor</th><th>Credor</th><th>Situacao</th><th>Valor</th></tr></thead><tbody>'+
  (arr.length?arr.map(function(d){return '<tr><td><b>'+esc(d.nome)+'</b></td><td>'+esc(d.credor||'')+'</td><td>'+badge(d.estado)+(d.parcelas>1?' <span style="color:#5b6b82">'+d.parcelas+'x</span>':'')+'</td><td>'+money(REL==='pago'?(d.valor_acordo||d.valor):d.valor)+'</td></tr>';}).join(''):'<tr><td colspan="4" style="text-align:center;color:#5b6b82;padding:24px">Nenhum registro.</td></tr>')+
  '</tbody></table><div class="tot"><span>'+arr.length+' registro(s)</span><span>Total: <b>'+money(tot)+'</b></span></div></div>';
 document.getElementById('v-relatorios').innerHTML=h;
}
function setRel(k){REL=k;renderRelatorios();}

/* ---- recuperacao (grafico grande) ---- */
function renderRecuperacao(){
 var h='<div class="h2v">&#128200; Evolucao da recuperacao</div>'+
  '<div class="card"><h3>Acumulado recuperado por acordo fechado</h3>'+chartHTML(300)+'</div>';
 // por estagio (valor)
 var g={pago:0,neg:0,aberto:0,contest:0};var lab={pago:'Pago / Baixa',neg:'Em negociacao',aberto:'Em aberto',contest:'Contestacao'};var cor={pago:'#1f9d57',neg:'#1e5eff',aberto:'#9aa7ba',contest:'#e0575b'};
 DADOS.devedores.forEach(function(d){g[grupo(d.estado)]+=(grupo(d.estado)==='pago'?(d.valor_acordo||d.valor):d.valor);});
 var max=Math.max(g.pago,g.neg,g.aberto,g.contest,1);
 h+='<div class="card" style="margin-top:16px"><h3>Distribuicao da carteira por estagio</h3><div class="barlist">'+
  Object.keys(lab).map(function(k){return '<div class="barrow"><div class="t"><span>'+lab[k]+'</span><b>'+money(g[k])+'</b></div><div class="track"><i style="width:'+(g[k]/max*100)+'%;background:'+cor[k]+'"></i></div></div>';}).join('')+
  '</div></div>';
 document.getElementById('v-recuperacao').innerHTML=h;
}
function chartHTML(alt){
 var rec=DADOS.devedores.filter(isPago).sort(function(a,b){return a.id-b.id;});
 var W=700,H=alt,pad=34;var pts=[];var acc=0;
 rec.forEach(function(d,i){acc+=(d.valor_acordo||d.valor);pts.push(acc);});
 if(!pts.length)pts=[0];
 var maxv=pts[pts.length-1]||1;var n=pts.length;
 var X=function(i){return pad+(W-2*pad)*(n<=1?0:i/(n-1));};
 var Y=function(v){return H-pad-(H-2*pad)*(v/maxv);};
 var line='',area='M'+X(0)+' '+Y(0);
 pts.forEach(function(v,i){var x=X(i),y=Y(v);line+=(i?'L':'M')+x+' '+y+' ';area+=' L'+x+' '+y;});
 area+=' L'+X(n-1)+' '+(H-pad)+' L'+X(0)+' '+(H-pad)+' Z';
 var grid='';for(var k=0;k<=3;k++){var yy=pad+(H-2*pad)*k/3;grid+='<line x1="'+pad+'" y1="'+yy+'" x2="'+(W-pad)+'" y2="'+yy+'" stroke="#e2e8f2"/>';grid+='<text x="6" y="'+(yy+4)+'" font-size="10" fill="#9aa7ba">'+money(maxv*(1-k/3)).replace('R$ ','')+'</text>';}
 var dots='';pts.forEach(function(v,i){dots+='<circle cx="'+X(i)+'" cy="'+Y(v)+'" r="3" fill="#1f9d57"/>';});
 return '<div class="chart"><div style="overflow-x:auto"><svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'+
  '<defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f9d57" stop-opacity=".28"/><stop offset="1" stop-color="#1f9d57" stop-opacity="0"/></linearGradient></defs>'+
  grid+'<path d="'+area+'" fill="url(#ar)"/><path d="'+line+'" fill="none" stroke="#1f9d57" stroke-width="2.5" stroke-linejoin="round"/>'+dots+'</svg></div>'+
  '<div class="lg"><span style="color:#1f9d57"></span>Recuperado acumulado &middot; '+rec.length+' acordos &middot; total '+money(maxv)+'</div></div>';
}

/* ---- baixa spc ---- */
function renderBaixa(){
 var arr=DADOS.devedores.filter(isPago);
 var feitos=arr.filter(function(d){return BAIXADO[d.id];}).length;
 var h='<div class="h2v">&#9989; Baixa no SPC</div>'+
  '<div class="aviso"><b>Em implementacao:</b> a baixa sera efetivada via <b>API da CDL</b>. Por enquanto o painel registra a solicitacao de baixa dos acordos pagos. ('+feitos+'/'+arr.length+' baixados)</div>'+
  '<div class="card"><table class="tbl"><thead><tr><th>Devedor</th><th>Credor</th><th>Valor pago</th><th>Baixa SPC</th></tr></thead><tbody>'+
  (arr.length?arr.map(function(d){
    var ok=BAIXADO[d.id];
    return '<tr><td><b>'+esc(d.nome)+'</b></td><td>'+esc(d.credor||'')+'</td><td>'+money(d.valor_acordo||d.valor)+'</td><td>'+
     (ok?'<span class="btn done">&#10003; Baixado</span>':'<button class="btn g" onclick="darBaixa('+d.id+')">Dar baixa</button>')+'</td></tr>';
  }).join(''):'<tr><td colspan="4" style="text-align:center;color:#5b6b82;padding:24px">Nenhum acordo pago ainda.</td></tr>')+
  '</tbody></table></div>';
 document.getElementById('v-baixa').innerHTML=h;
}
function darBaixa(id){BAIXADO[id]=true;renderBaixa();}

/* ---- config: numeros do WhatsApp ---- */
function lsGet(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def;}catch(e){return def;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
var NUMS=lsGet('rcpa_nums',[{apelido:'Cobrador 1',num:'',status:'offline'},{apelido:'Cobrador 2',num:'',status:'offline'},{apelido:'Cobrador 3',num:'',status:'offline'}]);
var CFG=lsGet('rcpa_cfg',{intervalo:3,ini:'08:00',fim:'18:00',max:200,voz:true});
var SB={offline:{r:'Offline',c:'#9aa7ba'},aguardando:{r:'Aguardando QR',c:'#f5b301'},conectado:{r:'Conectado',c:'#1f9d57'}};
function renderConfig(){
 var h='<div class="h2v">&#9881; Configuracoes — Numeros do WhatsApp</div>'+
  '<div class="aviso">Cada numero e um <b>chip/aparelho</b> (cobrador). Conecte lendo o QR no servidor. Distribuir em varios numeros e o disparo espacado reduzem o risco de bloqueio.</div>';
 h+='<div class="card"><h3>&#128241; Numeros de disparo</h3><table class="tbl"><thead><tr><th>Apelido</th><th>Numero (com DDD)</th><th>Status</th><th>Acoes</th></tr></thead><tbody>'+
  NUMS.map(function(n,i){var s=SB[n.status]||SB.offline;
   return '<tr><td><input class="cfgin" value="'+esc(n.apelido)+'" oninput="setNum('+i+',\\'apelido\\',this.value)"></td>'+
    '<td><input class="cfgin" placeholder="55 67 99999-9999" value="'+esc(n.num)+'" oninput="setNum('+i+',\\'num\\',this.value)"></td>'+
    '<td><span class="badge" style="background:'+s.c+'1f;color:'+s.c+'">'+s.r+'</span></td>'+
    '<td class="acbtns"><button class="btn" style="background:#eef2f8;color:#1e56a8" onclick="conectar('+i+')">Conectar</button>'+
    '<button class="btn" style="background:#fdecec;color:#c0392b" onclick="delNum('+i+')">Remover</button></td></tr>';}).join('')+
  '</tbody></table><div style="padding:12px 16px"><button class="btn g" onclick="addNum()">+ Adicionar numero</button></div></div>';
 h+='<div class="card" style="margin-top:16px"><h3>&#9889; Regras de disparo (anti-bloqueio)</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:16px">'+
  cfgCampo('Intervalo entre mensagens (seg)','intervalo','number',CFG.intervalo)+
  cfgCampo('Maximo por numero/dia','max','number',CFG.max)+
  cfgCampo('Horario inicio','ini','time',CFG.ini)+
  cfgCampo('Horario fim','fim','time',CFG.fim)+
  '<div class="full" style="grid-column:1/-1"><label style="font-size:12px;color:var(--muted);font-weight:600"><input type="checkbox" '+(CFG.voz?'checked':'')+' onchange="setCfg(\\'voz\\',this.checked)"> Enviar abertura como nota de voz (IA)</label></div>'+
  '</div><div style="padding:0 16px 16px"><button class="btn g" onclick="salvarCfg()">Salvar configuracoes</button></div></div>';
 document.getElementById('v-configuracoes').innerHTML=h;
}
function cfgCampo(lbl,k,tipo,val){return '<div><label style="display:block;font-size:12px;color:var(--muted);font-weight:600;margin-bottom:5px">'+lbl+'</label><input class="cfgin" type="'+tipo+'" value="'+val+'" oninput="setCfg(\\''+k+'\\',this.value)"></div>';}
function setNum(i,f,v){NUMS[i][f]=v;}
function setCfg(k,v){CFG[k]=v;}
function addNum(){NUMS.push({apelido:'Cobrador '+(NUMS.length+1),num:'',status:'offline'});renderConfig();}
function delNum(i){NUMS.splice(i,1);lsSet('rcpa_nums',NUMS);renderConfig();toast('Numero removido.');}
var _wapoll;
function conectar(i){
 var ap=NUMS[i].apelido||('Cobrador '+(i+1));
 abrirWa('Conectar '+ap,'<div class="emptybox">Iniciando instancia... aguarde o QR aparecer.</div>');
 fetch('/api/wa/conectar?id='+i).then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(){pollWa(i);})
  .catch(function(){ // sem servidor (site estatico) = demo
    NUMS[i].status='conectado';lsSet('rcpa_nums',NUMS);fecharWa();renderConfig();
    toast('Modo demonstracao: numero marcado como conectado (sem servidor).');});
}
function pollWa(i){clearInterval(_wapoll);_wapoll=setInterval(function(){
 fetch('/api/wa/status?id='+i).then(function(r){return r.json();}).then(function(s){
  if(s.status==='aguardando'&&s.qr){setWaBody('<img src="'+s.qr+'" style="width:280px;height:280px;border-radius:10px"><div class="hint" style="margin-top:12px">Escaneie com o WhatsApp <b>deste chip</b>:<br>Aparelhos conectados &rarr; Conectar aparelho</div>');}
  else if(s.status==='conectado'){clearInterval(_wapoll);NUMS[i].status='conectado';if(s.numero)NUMS[i].num=s.numero;lsSet('rcpa_nums',NUMS);fecharWa();renderConfig();toast('Numero conectado! '+(s.numero||''));}
  else if(s.status==='erro'){clearInterval(_wapoll);setWaBody('<div class="emptybox" style="color:#c0392b">Erro ao conectar. Feche e tente de novo.</div>');}
  else{setWaBody('<div class="emptybox">Preparando conexao... ('+(s.status||'')+')</div>');}
 }).catch(function(){clearInterval(_wapoll);});
},1500);}
function abrirWa(t,b){document.getElementById('watit').textContent=t;setWaBody(b);document.getElementById('wamodal').classList.add('on');}
function setWaBody(h){document.getElementById('wabody').innerHTML=h;}
function fecharWa(){clearInterval(_wapoll);var m=document.getElementById('wamodal');if(m)m.classList.remove('on');}
function salvarCfg(){lsSet('rcpa_nums',NUMS);lsSet('rcpa_cfg',CFG);toast('Configuracoes salvas!');}
var _tt;function toast(msg){var t=document.getElementById('toast');if(!t){alert(msg);return;}t.textContent=msg;t.className='toast on';clearTimeout(_tt);_tt=setTimeout(function(){t.className='toast';},2800);}

/* ---- simples ---- */
function renderSimples(v){
 var t={configuracoes:'Configuracoes',ajuda:'Ajuda'};
 document.getElementById('v-'+v).innerHTML='<div class="h2v">'+(t[v]||v)+'</div><div class="card"><div style="padding:34px;text-align:center;color:#5b6b82">Secao <b>'+(t[v]||v)+'</b> — disponivel na versao completa do sistema.</div></div>';
}

/* ---- sidebar + topbar canvas ---- */
function toggleSide(){document.getElementById('app').classList.toggle('recolhido');}
function bg(){
 var c=document.getElementById('tcanvas');if(!c||RM)return;var x=c.getContext('2d');
 function rs(){c.width=c.offsetWidth;c.height=c.offsetHeight;}rs();window.addEventListener('resize',rs);
 var P=[];for(var i=0;i<52;i++)P.push({x:Math.random(),y:Math.random(),v:.00010+Math.random()*.00018,r:.7+Math.random()*2.0,a:.3+Math.random()*.5});
 var t=0;
 function loop(){t+=.015;x.clearRect(0,0,c.width,c.height);
  // linhas de crescimento onduladas (azul + verde)
  for(var g=0;g<5;g++){x.strokeStyle=g%2? 'rgba(90,242,192,.16)':'rgba(150,190,255,.20)';x.lineWidth=1.2;x.beginPath();
   var yy=c.height*(.22+g*.16);x.moveTo(0,yy);
   for(var xx=0;xx<=c.width;xx+=26)x.lineTo(xx,yy-Math.sin((xx*.012)+g+t)*9);x.stroke();}
  // particulas
  P.forEach(function(p){p.x+=p.v*c.width*3;if(p.x>1.05)p.x=-.05;var px=p.x*c.width,py=(p.y+Math.sin(t+p.x*6)*.02)*c.height;
   x.fillStyle='rgba(170,205,255,'+p.a+')';x.beginPath();x.arc(px,py,p.r,0,6.283);x.fill();});
  requestAnimationFrame(loop);}
 loop();
}
document.addEventListener('DOMContentLoaded',function(){bg();paint();});
`;

export function paginaHTML(dados) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>CDL RECUPERA — RECUPERA.AI</title><style>${CSS}</style></head><body>
<div class="app" id="app">
  <aside class="sidebar">
    <nav class="nav">
      <a data-nav="painel" class="active" onclick="go('painel')"><span class="ic">&#8962;</span><span class="tx">Painel</span></a>
      <a data-nav="carteira" onclick="go('carteira')"><span class="ic">&#128101;</span><span class="tx">Carteira</span></a>
      <a data-nav="conversas" onclick="go('conversas')"><span class="ic">&#128172;</span><span class="tx">Conversas</span></a>
      <a data-nav="relatorios" onclick="go('relatorios')"><span class="ic">&#128202;</span><span class="tx">Relatorios</span></a>
      <a data-nav="recuperacao" onclick="go('recuperacao')"><span class="ic">&#128200;</span><span class="tx">Recuperacao</span></a>
      <a data-nav="baixa" onclick="go('baixa')"><span class="ic">&#9989;</span><span class="tx">Baixa SPC</span></a>
      <a data-nav="configuracoes" onclick="go('configuracoes')"><span class="ic">&#9881;</span><span class="tx">Configuracoes</span></a>
      <a data-nav="ajuda" onclick="go('ajuda')"><span class="ic">&#10067;</span><span class="tx">Ajuda</span></a>
      <a class="switchlink" href="cliente.html"><span class="ic">&#128100;</span><span class="tx">Portal do Cliente &#8599;</span></a>
    </nav>
    <div class="side-foot">Recuperar e fazer o comercio<br>circular novamente.</div>
  </aside>
  <div class="main">
    <header class="topbar">
      <canvas id="tcanvas"></canvas>
      <button class="burger" onclick="toggleSide()">&#9776;</button>
      <div class="hlogo">${LOGO}${LOGO_IMG ? '' : '<div class="bt"><b>CDL RECUPERA</b><span>RECUPERA.AI</span></div>'}</div>
      <div class="tagline">Juntos por empresas <b>mais fortes!</b></div>
      <div class="top-right">
        <div class="online"><span class="p"></span><span>Sistema Online</span></div>
        <div class="user"><div class="avatar">G</div><div class="un"><b>Ola, Gestor</b><br><span>Painel</span></div></div>
      </div>
    </header>
    <main class="content">
      <section data-view="painel" id="v-painel"></section>
      <section data-view="carteira" id="v-carteira" hidden></section>
      <section data-view="conversas" id="v-conversas" hidden></section>
      <section data-view="relatorios" id="v-relatorios" hidden></section>
      <section data-view="recuperacao" id="v-recuperacao" hidden></section>
      <section data-view="baixa" id="v-baixa" hidden></section>
      <section data-view="configuracoes" id="v-configuracoes" hidden></section>
      <section data-view="ajuda" id="v-ajuda" hidden></section>
    </main>
    <footer class="rodape"><b>CDL RECUPERA</b> · Central de Negociacoes CDL Campo Grande
      <div class="chips"><span>Seguranca</span><span>Agilidade</span><span>Resultados</span></div>
      <span class="con">● Conectado</span>
    </footer>
  </div>
  <nav class="bottomnav">
    <a data-nav="painel" class="active" onclick="go('painel')"><span class="ic">&#8962;</span>Painel</a>
    <a data-nav="carteira" onclick="go('carteira')"><span class="ic">&#128101;</span>Carteira</a>
    <a data-nav="conversas" onclick="go('conversas')"><span class="ic">&#128172;</span>Conversas</a>
    <a data-nav="relatorios" onclick="go('relatorios')"><span class="ic">&#128202;</span>Relatorios</a>
    <a data-nav="baixa" onclick="go('baixa')"><span class="ic">&#9989;</span>Baixa</a>
  </nav>
  <button class="fab" onclick="go('conversas')" title="RECUPERA.AI">&#129302;</button>
</div>
<div class="toast" id="toast"></div>
<div class="wamodal" id="wamodal"><div class="wabox"><div class="wahead"><b id="watit">Conectar numero</b><span class="x" onclick="fecharWa()">&times;</span></div><div class="wabody" id="wabody"></div></div></div>
<script>
var DADOS=${JSON.stringify(dados)};
var AUDIO=${JSON.stringify(AUDIO_URI)};
var ROBO_M=${JSON.stringify(ROBO)};
var ROBO_IMG=${ROBO.startsWith('<img')};
${CLIENT}
</script></body></html>`;
}
