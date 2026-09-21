// Tela inicial (escolha de acesso): Central CDL (agente) ou Portal do Cliente.
import { LOGO, LOGO_IMG, ROBO } from './painel-ui.js';

export function paginaHomeHTML() {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>CDL RECUPERA — Acesso</title><style>
:root{--azul:#14418b;--azul2:#1e5eff;--verde:#1f9d57;--amarelo:#f5b301;--navy:#0a1f45}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Roboto,Arial,sans-serif;min-height:100vh;color:#fff;
 background:radial-gradient(1200px 600px at 70% -10%,#1b4da0,transparent),linear-gradient(160deg,#0a1f45,#0d2f68 55%,#0a1f45);
 display:flex;flex-direction:column;overflow-x:hidden;position:relative}
canvas#bg{position:fixed;inset:0;width:100%;height:100%;opacity:.6;pointer-events:none;z-index:0}
.wrap{position:relative;z-index:1;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;text-align:center}
.brand{display:flex;align-items:center;gap:12px;margin-bottom:6px}
.brand .flag{width:46px;height:38px;filter:drop-shadow(0 2px 6px rgba(0,0,0,.4))}
.brand .brandimg{height:64px;width:auto;border-radius:8px;filter:drop-shadow(0 4px 10px rgba(0,0,0,.35))}
.brand b{font-size:22px;font-weight:800}.brand span{color:#8fb4ff;font-size:12px;display:block;font-weight:600;text-align:left}
.robo-img{height:150px;width:auto;margin:6px 0 2px;filter:drop-shadow(0 12px 22px rgba(0,0,0,.35));animation:bob 3.4s ease-in-out infinite}
.robo{width:120px;height:120px;margin:6px 0}
h1{font-size:30px;font-weight:800;letter-spacing:-.02em;margin-top:6px}
h1 i{color:var(--amarelo);font-style:normal}
.sub{color:#bcd0ef;font-size:15px;margin:8px 0 30px;max-width:520px}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:20px;width:100%;max-width:760px}
.acesso{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:26px 22px;
 text-decoration:none;color:#fff;transition:.2s;backdrop-filter:blur(4px);display:flex;flex-direction:column;align-items:center;gap:10px}
.acesso:hover{transform:translateY(-4px);background:rgba(255,255,255,.12);border-color:rgba(120,170,255,.5);box-shadow:0 18px 40px rgba(0,0,0,.3)}
.acesso .ic{width:66px;height:66px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:32px}
.acesso.ag .ic{background:linear-gradient(135deg,#1e5eff,#3f78ff)}
.acesso.cli .ic{background:linear-gradient(135deg,#1f9d57,#00b389)}
.acesso h2{font-size:19px}
.acesso p{color:#c4d5ef;font-size:13px;line-height:1.45}
.acesso .go{margin-top:6px;font-size:13px;font-weight:700;color:#9fc0ff}
.acesso.cli .go{color:#7fe8b6}
.foot{position:relative;z-index:1;text-align:center;padding:16px;color:#7f97c4;font-size:12px}
@keyframes bob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-7px) rotate(2deg)}}
@media(max-width:640px){.cards{grid-template-columns:1fr}h1{font-size:24px}.robo-img{height:120px}}
@media(prefers-reduced-motion:reduce){canvas#bg{display:none}.robo-img{animation:none}}
</style></head><body>
<canvas id="bg"></canvas>
<div class="wrap">
  <div class="brand">${LOGO}${LOGO_IMG ? '' : '<div><b>CDL RECUPERA</b><span>RECUPERA.AI</span></div>'}</div>
  ${ROBO}
  <h1>Central Inteligente de <i>Negociacoes</i></h1>
  <p class="sub">Recuperacao de credito com IA humanizada no WhatsApp. Escolha como deseja entrar:</p>
  <div class="cards">
    <a class="acesso ag" href="central.html">
      <div class="ic">&#128736;</div><h2>Central CDL</h2>
      <p>Painel do agente: cobranca com IA, conversas no WhatsApp, negociacao, Pix, relatorios e baixa.</p>
      <div class="go">Entrar como equipe CDL &#8594;</div>
    </a>
    <a class="acesso cli" href="cliente.html">
      <div class="ic">&#127970;</div><h2>Portal do Cliente</h2>
      <p>Para o credor: envie inadimplentes, acompanhe a recuperacao, valide pagamentos e SPC/Serasa.</p>
      <div class="go">Entrar como cliente &#8594;</div>
    </a>
  </div>
</div>
<div class="foot">CDL RECUPERA · Central de Negociacoes CDL Campo Grande · Seguranca · Agilidade · Resultados</div>
<script>
(function(){var c=document.getElementById('bg');if(!c||(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches))return;
var x=c.getContext('2d');function rs(){c.width=innerWidth;c.height=innerHeight;}rs();addEventListener('resize',rs);
var P=[];for(var i=0;i<60;i++)P.push({x:Math.random(),y:Math.random(),v:.0002+Math.random()*.0004,r:.6+Math.random()*2,a:.2+Math.random()*.5});var t=0;
function loop(){t+=.008;x.clearRect(0,0,c.width,c.height);
 for(var g=0;g<5;g++){x.strokeStyle=g%2?'rgba(90,242,192,.10)':'rgba(150,190,255,.12)';x.beginPath();var yy=c.height*(.15+g*.17);x.moveTo(0,yy);for(var xx=0;xx<=c.width;xx+=34)x.lineTo(xx,yy-Math.sin(xx*.006+g+t)*14);x.stroke();}
 P.forEach(function(p){p.x+=p.v*c.width;if(p.x>1.05)p.x=-.05;x.fillStyle='rgba(170,205,255,'+p.a+')';x.beginPath();x.arc(p.x*c.width,p.y*c.height,p.r,0,6.283);x.fill();});
 requestAnimationFrame(loop);}loop();})();
</script></body></html>`;
}
