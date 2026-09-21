// PAINEL DO GESTOR (master/dono da plataforma). Ve todos os clientes/lojistas,
// faturamento, aprendizado da IA, auditoria, backup e zerar base.
// Servido em /gestor. Tudo via /api/gestor/* e /api/backup (roda no servidor).
import { CSS, LOGO, LOGO_IMG } from './painel-ui.js';

const CSS_G = `
.gcards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px}
@media(max-width:760px){.gcards{grid-template-columns:1fr 1fr}}
@media(max-width:400px){.gcards{grid-template-columns:1fr}}
.rtabs{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}
.danger{background:#e0575b;color:#fff;border-radius:10px;padding:11px 18px;font-weight:700}
.danger:active{transform:scale(.97)}
.okbtn{background:var(--verde);color:#fff;border-radius:10px;padding:11px 18px;font-weight:700}
.toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--navy);color:#fff;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.25);opacity:0;transition:.3s;z-index:60}
.toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
.bar{height:8px;background:#eef2f8;border-radius:100px;overflow:hidden;margin-top:5px}
.bar i{display:block;height:100%;border-radius:100px}
`;

const CLIENT = `
var V='visao';
function money(c){return 'R$ '+(Number(c||0)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
function go(v){V=v;document.querySelectorAll('[data-nav]').forEach(function(a){a.classList.toggle('active',a.getAttribute('data-nav')===v);});
 document.querySelectorAll('section[data-view]').forEach(function(s){s.hidden=s.getAttribute('data-view')!==v;});paint();window.scrollTo(0,0);}
function paint(){({visao:rVisao,clientes:rClientes,financeiro:rFin,aprendizado:rApr,auditoria:rAud,config:rConfig}[V]||function(){})();}
function api(p){return fetch('/api/gestor/'+p).then(function(r){return r.json();});}
function kpi(n,l,cls){return '<div class="kpi"><div class="ki '+(cls||'b1')+'"></div><div><div class="n">'+n+'</div><div class="l">'+l+'</div></div></div>';}

function rVisao(){
 api('resumo').then(function(d){
  document.getElementById('v-visao').innerHTML='<div class="h2v">&#128200; Visao geral da plataforma</div>'+
   '<div class="gcards">'+
    kpi(d.clientes,'Clientes ativos','b1')+
    kpi(money(d.receita_cents),'Faturamento (recargas)','b3')+
    kpi(d.recargas,'Recargas pagas','b2')+
    kpi(d.creditos_vendidos.toLocaleString('pt-BR'),'Creditos vendidos','b4')+
    kpi(d.creditos_usados.toLocaleString('pt-BR'),'Creditos usados (IA)','b2')+
    kpi(money(d.recuperado*100),'Recuperado p/ lojistas','b3')+
   '</div>'+
   '<div class="aviso">Numeros reais do banco. Faturamento = recargas efetivamente pagas. Cada credito usado = 1 devedor trabalhado pela IA.</div>';
 });
}
function rClientes(){
 api('clientes').then(function(l){
  document.getElementById('v-clientes').innerHTML='<div class="h2v">&#127970; Clientes (lojistas)</div>'+
   '<div class="card"><table class="tbl"><thead><tr><th>Cliente</th><th>CNPJ</th><th>Plano</th><th>Creditos</th><th>Status</th></tr></thead><tbody>'+
   l.map(function(c){return '<tr><td><b>'+esc(c.nome_fantasia||c.razao_social)+'</b><br><span style="font-size:10px;color:#5b6b82">'+esc(c.razao_social)+'</span></td>'+
    '<td>'+esc(c.cnpj||'')+'</td><td>'+esc(c.plano||'')+'</td><td><b>'+c.creditos+'</b></td>'+
    '<td><span class="badge" style="background:'+(c.status==='ativo'?'#1f9d5722;color:#1f9d57':'#9aa7ba22;color:#5b6b82')+'">'+esc(c.status)+'</span></td></tr>';}).join('')+
   '</tbody></table></div>';
 });
}
function rFin(){
 api('financeiro').then(function(rows){
  var tot=rows.filter(function(r){return r.status==='pago';}).reduce(function(s,r){return s+r.valor_cents;},0);
  document.getElementById('v-financeiro').innerHTML='<div class="h2v">&#128176; Financeiro — recargas</div>'+
   '<div class="card"><table class="tbl"><thead><tr><th>Cliente</th><th>Pacote</th><th>Creditos</th><th>Valor</th><th>Status</th><th>Data</th></tr></thead><tbody>'+
   (rows.length?rows.map(function(r){return '<tr><td>'+esc(r.nome_fantasia||'-')+'</td><td>'+esc(r.pacote)+'</td><td>'+r.creditos+'</td><td>'+money(r.valor_cents)+'</td>'+
    '<td><span class="badge" style="background:'+(r.status==='pago'?'#1f9d5722;color:#1f9d57':'#f5a62322;color:#d98b0e')+'">'+esc(r.status)+'</span></td><td style="color:#5b6b82">'+esc(r.pago_em||r.criado_em)+'</td></tr>';}).join(''):'<tr><td colspan="6" style="text-align:center;color:#5b6b82;padding:24px">Nenhuma recarga ainda.</td></tr>')+
   '</tbody></table><div class="tot"><span>Faturamento pago</span><span><b>'+money(tot)+'</b></span></div></div>';
 });
}
function rApr(){
 api('aprendizado').then(function(d){
  var ps=d.porPerfil||[];var max=Math.max.apply(null,ps.map(function(p){return p.conv;}).concat([1]));
  document.getElementById('v-aprendizado').innerHTML='<div class="h2v">&#129504; Aprendizado da IA</div>'+
   '<div class="aviso">A IA mede, com dados REAIS, o que converte melhor — e prioriza sozinha o que funciona. Sem numero inventado: so o que o banco prova.</div>'+
   '<div class="card"><h3>Taxa de acordo por perfil de abordagem</h3><div style="padding:8px 16px 16px">'+
   (ps.length?ps.map(function(p){var cor=p.conv>=60?'#1f9d57':p.conv>=40?'#f5a623':'#e0575b';
     return '<div style="padding:9px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between;font-size:12.5px"><b>'+esc(p.perfil)+'</b><span>'+p.conv+'% ('+p.pagos+'/'+p.total+')</span></div><div class="bar"><i style="width:'+(p.conv/max*100)+'%;background:'+cor+'"></i></div></div>';}).join(''):'<div class="emptybox">Sem dados suficientes ainda. A IA aprende conforme cobra.</div>')+
   '</div></div>'+
   '<div class="card" style="margin-top:14px"><h3>O que a IA ja fez</h3><div style="padding:10px 16px">'+
   (d.eventos||[]).map(function(e){return '<span class="badge" style="background:#1e5eff18;color:#1e5eff;margin:3px;display:inline-block">'+esc(e.tipo)+': '+e.n+'</span>';}).join('')+'</div></div>';
 });
}
function rAud(){
 api('auditoria').then(function(rows){
  document.getElementById('v-auditoria').innerHTML='<div class="h2v">&#128220; Auditoria — tudo que foi feito</div>'+
   '<div class="card"><table class="tbl"><thead><tr><th>Acao</th><th>Detalhe</th><th>Quem</th><th>Quando</th></tr></thead><tbody>'+
   (rows.length?rows.map(function(a){return '<tr><td><b>'+esc(a.acao)+'</b></td><td>'+esc(a.detalhe||'')+'</td><td>'+esc(a.quem||'')+'</td><td style="color:#5b6b82">'+esc(a.criado_em)+'</td></tr>';}).join(''):'<tr><td colspan="4" style="text-align:center;color:#5b6b82;padding:24px">Nenhum registro ainda.</td></tr>')+
   '</tbody></table></div>';
 });
}
function rConfig(){
 document.getElementById('v-config').innerHTML='<div class="h2v">&#9881; Configuracoes</div>'+
  '<div class="card"><h3>&#128190; Copia de seguranca</h3><div style="padding:16px"><p class="hint" style="margin-bottom:10px">Baixe um backup completo do banco (clientes, devedores, creditos, conversas). Guarde em local seguro.</p>'+
   '<a class="okbtn" href="/api/backup" style="text-decoration:none;display:inline-block">&#11015; Baixar backup agora</a></div></div>'+
  '<div class="card" style="margin-top:16px"><h3 style="color:#c0392b">&#9888; Zona de risco</h3><div style="padding:16px"><p class="hint" style="margin-bottom:10px">Zerar apaga TODOS os devedores, conversas, creditos e recargas. Os clientes cadastrados sao mantidos. <b>Nao tem volta.</b></p>'+
   '<button class="danger" onclick="zerar()">Zerar base operacional</button></div></div>';
}
function zerar(){
 if(!confirm('Tem certeza? Isso apaga devedores, conversas, creditos e recargas. Nao tem volta.'))return;
 if(!confirm('Confirma DE VERDADE? Ultima chance.'))return;
 api('zerar').then(function(d){toast(d.ok?'Base zerada.':'Erro ao zerar.');});
}
var _tt;function toast(msg){var t=document.getElementById('toast');t.textContent=msg;t.className='toast on';clearTimeout(_tt);_tt=setTimeout(function(){t.className='toast';},2800);}
function toggleSide(){document.getElementById('app').classList.toggle('recolhido');}
document.addEventListener('DOMContentLoaded',function(){paint();});
`;

export function paginaGestorHTML() {
  const nav = [
    ['visao', '&#128200;', 'Visao Geral'], ['clientes', '&#127970;', 'Clientes'],
    ['financeiro', '&#128176;', 'Financeiro'], ['aprendizado', '&#129504;', 'Aprendizado IA'],
    ['auditoria', '&#128220;', 'Auditoria'], ['config', '&#9881;', 'Configuracoes'],
  ];
  const navHTML = nav.map(([v, ic, tx], i) =>
    `<a data-nav="${v}" class="${i === 0 ? 'active' : ''}" onclick="go('${v}')"><span class="ic">${ic}</span><span class="tx">${tx}</span></a>`).join('');
  const secs = nav.map(([v]) => `<section data-view="${v}" id="v-${v}"${v === 'visao' ? '' : ' hidden'}></section>`).join('');
  const bnav = nav.slice(0, 5).map(([v, ic, tx], i) =>
    `<a data-nav="${v}" class="${i === 0 ? 'active' : ''}" onclick="go('${v}')"><span class="ic">${ic}</span>${tx.split(' ')[0]}</a>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Painel do Gestor — CDL RECUPERA</title><style>${CSS}${CSS_G}</style></head><body>
<div class="app" id="app">
  <aside class="sidebar"><nav class="nav">${navHTML}
      <a class="switchlink" href="central.html"><span class="ic">&#128736;</span><span class="tx">Painel do Agente &#8599;</span></a></nav>
    <div class="side-foot">Painel do Gestor<br>RECUPERA.AI</div></aside>
  <div class="main">
    <header class="topbar"><canvas id="tcanvas"></canvas>
      <button class="burger" onclick="toggleSide()">&#9776;</button>
      <div class="hlogo">${LOGO}${LOGO_IMG ? '' : '<div class="bt"><b>CDL RECUPERA</b><span>Gestor</span></div>'}</div>
      <div class="tagline">Painel do <b>Gestor</b></div>
      <div class="top-right"><div class="online"><span class="p"></span><span>Sistema Online</span></div>
        <div class="user"><div class="avatar">G</div><div class="un"><b>Gestor Master</b><br><span>Administrador</span></div></div></div>
    </header>
    <main class="content">${secs}</main>
    <footer class="rodape"><b>RECUPERA.AI</b> · Painel do Gestor
      <div class="chips"><span>Seguranca</span><span>Auditoria</span><span>Resultados</span></div>
      <span class="con">● Conectado</span></footer>
  </div>
  <nav class="bottomnav">${bnav}</nav>
</div>
<div class="toast" id="toast"></div>
<script>${CLIENT}</script></body></html>`;
}
