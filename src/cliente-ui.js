// PORTAL DO CLIENTE (credor/recebedor) — RECUPERA.AI.
// Ele envia inadimplentes p/ cobranca, acompanha, valida pagamento no financeiro,
// pede inclusao/retirada SPC/Serasa, ve parcelamentos, metricas, graficos e o
// historico de conversa. Reusa a identidade visual do painel do agente.
import { CSS, LOGO, LOGO_IMG, ROBO } from './painel-ui.js';

const CSS_CLI = `
.form{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:18px}
.form .full{grid-column:1/-1}
.form label{display:block;font-size:12px;color:var(--muted);font-weight:600;margin-bottom:5px}
.form input,.form textarea{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:13.5px;outline:none;font-family:inherit}
.form input:focus,.form textarea:focus{border-color:var(--azul2);box-shadow:0 0 0 3px rgba(30,94,255,.12)}
.form .acao{grid-column:1/-1;display:flex;gap:10px;justify-content:flex-end}
.btnp{background:var(--azul2);color:#fff;border-radius:10px;padding:11px 20px;font-weight:700;font-size:14px}
.btnp:active{transform:scale(.97)}
.btns{background:#eef2f8;color:var(--azul);border-radius:10px;padding:11px 18px;font-weight:600}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--navy);color:#fff;padding:13px 22px;border-radius:12px;font-size:13.5px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.25);opacity:0;transition:.3s;z-index:60;display:flex;gap:9px;align-items:center}
.toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
.toast.ok{background:#12603a}
.modal{position:fixed;inset:0;background:rgba(10,20,40,.55);display:none;align-items:center;justify-content:center;z-index:70;padding:16px}
.modal.on{display:flex}
.modalbox{background:#fff;border-radius:16px;width:min(560px,96vw);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.modalbox .mh{padding:14px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:12px}
.modalbox .mh .x{margin-left:auto;font-size:22px;color:var(--muted);cursor:pointer;line-height:1}
.timeline{padding:8px 18px 16px}
.tl{display:flex;gap:12px;padding:10px 0;border-bottom:1px dashed var(--line)}
.tl:last-child{border:none}
.tl .n{flex:0 0 30px;height:30px;border-radius:9px;background:var(--azul);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px}
.tl.pg .n{background:var(--verde)}
.tl .t b{color:var(--navy)}.tl .t span{font-size:11.5px;color:var(--muted)}
.tl .v{margin-left:auto;font-weight:700;color:var(--navy)}
.bureau{font-size:10px;font-weight:800;padding:2px 8px;border-radius:100px;border:1px solid var(--line)}
.bureau.spc{color:#c0392b;border-color:#e0575b55;background:#e0575b12}
.bureau.serasa{color:#0a6b3b;border-color:#1f9d5755;background:#1f9d5712}
.acbtns{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}
.emptybox{padding:40px 20px;text-align:center;color:var(--muted)}
.emptybox .big{font-size:38px;opacity:.4;margin-bottom:8px}
.hint{font-size:11.5px;color:var(--muted);margin-top:4px}
.pacotes{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
@media(max-width:760px){.pacotes{grid-template-columns:1fr}}
.destaque{display:grid;grid-template-columns:160px 1fr;gap:22px;align-items:center;padding:20px}
.ringwrap{position:relative;width:160px;height:160px}
.ringsvg{width:160px;height:160px;transform:rotate(-90deg)}
.ringp{transition:stroke-dashoffset 1.5s cubic-bezier(.22,1,.36,1)}
.ringtxt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ringtxt b{font-size:34px;font-weight:800;color:var(--navy);line-height:1}
.ringtxt span{font-size:11px;color:var(--muted);margin-top:2px}
.dstats{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.dstat{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.dstat .v{font-size:20px;font-weight:800;color:var(--navy)}
.dstat .v.g{color:var(--verde)}.dstat .v.a{color:#d98b0e}
.dstat .l{font-size:11.5px;color:var(--muted);margin-top:2px}
@media(max-width:620px){.destaque{grid-template-columns:1fr;justify-items:center;text-align:center}.dstats{width:100%}}
/* ===== Conversa estilo WhatsApp ===== */
.modalbox.wamodal{width:min(460px,96vw);height:min(86vh,760px);background:#efeae2}
.wa{display:flex;flex-direction:column;height:100%}
.wa .wahead{display:flex;align-items:center;gap:10px;padding:9px 12px;background:#008069;color:#fff;flex:0 0 auto}
.wa .wahead .bk{font-size:20px;line-height:1;cursor:pointer;opacity:.95}
.wa .wahead .av{width:38px;height:38px;border-radius:50%;background:#0a7d69;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex:0 0 auto;overflow:hidden}
.wa .wahead .nm{line-height:1.25;min-width:0}
.wa .wahead .nm b{font-size:15px;font-weight:600;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wa .wahead .nm span{font-size:12px;opacity:.85}
.wa .wahead .x{margin-left:auto;font-size:22px;color:#fff;cursor:pointer;opacity:.9;line-height:1}
.wa .wabody{flex:1;overflow:auto;padding:14px 7% 22px;background-color:#efeae2;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Cg fill='none' stroke='%23d8cfc4' stroke-width='1.1' opacity='.55'%3E%3Ccircle cx='14' cy='14' r='4'/%3E%3Cpath d='M40 8l6 6-6 6-6-6z'/%3E%3Cpath d='M48 40h10M53 35v10'/%3E%3Cpath d='M8 44c4-4 8 0 12-4'/%3E%3C/g%3E%3C/svg%3E")}
.wa .wday{text-align:center;margin:2px 0 12px}
.wa .wday span{background:#e2f0e1;color:#54656f;font-size:11px;padding:5px 12px;border-radius:8px;box-shadow:0 1px .5px rgba(0,0,0,.1)}
.wa .wrow{display:flex;margin-bottom:5px}
.wa .wrow.out{justify-content:flex-end}
.wa .wb{position:relative;max-width:78%;padding:6px 9px 8px;border-radius:8px;font-size:13.6px;line-height:1.42;color:#111b21;box-shadow:0 1px .5px rgba(0,0,0,.13);white-space:pre-wrap;word-break:break-word}
.wa .wrow.out .wb{background:#d9fdd3;border-top-right-radius:0}
.wa .wrow.in .wb{background:#fff;border-top-left-radius:0}
.wa .wrow.out .wb::after{content:"";position:absolute;top:0;right:-8px;border:8px solid transparent;border-top-color:#d9fdd3;border-right-width:0}
.wa .wrow.in .wb::after{content:"";position:absolute;top:0;left:-8px;border:8px solid transparent;border-top-color:#fff;border-left-width:0}
.wa .wb .tm{float:right;font-size:10.5px;color:#667781;margin:8px -2px -3px 10px;line-height:1}
.wa .wb .ck{color:#53bdeb;margin-left:1px;letter-spacing:-3px}
.wa .wvoz{display:flex;align-items:center;gap:8px;min-width:170px}
.wa .wvoz .pl{width:32px;height:32px;border-radius:50%;background:#008069;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;flex:0 0 auto;cursor:pointer}
.wa .wvoz .wave{flex:1;display:flex;align-items:center;gap:2px;height:20px}
.wa .wvoz .wave i{flex:1;background:#9fc7ad;border-radius:2px;height:30%}
.wa .wvoz .dur{font-size:11px;color:#667781}
/* ===== Agente IA (config) ===== */
.ag{display:grid;grid-template-columns:1fr 340px;gap:16px;align-items:start}
@media(max-width:980px){.ag{grid-template-columns:1fr}}
.agcol{display:flex;flex-direction:column;gap:16px}
.agc{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 18px 20px;box-shadow:var(--sombra)}
.agc h3{font-size:14.5px;color:var(--navy);display:flex;align-items:center;gap:8px;margin:0 0 4px}
.agc h3 .e{color:#12a150}
.agc .sub{font-size:12px;color:var(--muted);margin:0 0 14px}
.agrow{padding:9px 0;border-bottom:1px solid var(--line)}
.agrow:last-child{border-bottom:none}
.agrow .k{font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:#12a150;font-weight:800;margin-bottom:3px}
.agrow input,.agrow textarea,.agrow select{width:100%;border:1px solid var(--line);border-radius:9px;padding:8px 10px;font-size:13px;font-family:inherit;outline:none;color:var(--navy);background:#fbfdfb}
.agrow textarea{resize:vertical;min-height:44px;line-height:1.4}
.agrow input:focus,.agrow textarea:focus,.agrow select:focus{border-color:#12a150;box-shadow:0 0 0 3px #12a15020}
.presets{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:4px}
@media(max-width:560px){.presets{grid-template-columns:repeat(2,1fr)}}
.pcard{border:1.5px solid var(--line);border-radius:12px;padding:12px 10px;cursor:pointer;text-align:center;transition:.15s;background:#fff}
.pcard:hover{border-color:#8fd6b0}
.pcard.on{border-color:#12a150;background:#eafaf1}
.pcard .pi{font-size:20px}
.pcard b{display:block;font-size:12.5px;color:var(--navy);margin-top:3px}
.pcard span{font-size:10.5px;color:var(--muted);line-height:1.25;display:block;margin-top:2px}
.foco{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:4px}
.slrow{display:grid;grid-template-columns:1fr 46px;gap:10px;align-items:center;padding:8px 0}
.slrow label{font-size:12px;color:var(--navy);font-weight:600}
.slrow .sv{font-size:13px;font-weight:800;color:#12a150;text-align:right}
.slrow input[type=range]{grid-column:1/-1;width:100%;accent-color:#12a150}
.tggs{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tgg{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid var(--line);border-radius:10px;padding:9px 12px;font-size:12.5px;color:var(--navy);font-weight:600}
.sw{position:relative;width:40px;height:22px;flex:0 0 auto;border-radius:100px;background:#cfd8d3;cursor:pointer;transition:.2s}
.sw.on{background:#12a150}
.sw::after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.sw.on::after{left:20px}
.tempos{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:4px}
.tcard{border:1.5px solid var(--line);border-radius:10px;padding:10px 4px;text-align:center;cursor:pointer;transition:.15s;background:#fff}
.tcard.on{border-color:#12a150;background:#eafaf1}
.tcard b{font-size:14px;color:var(--navy)}
.tcard span{display:block;font-size:10px;color:var(--muted);margin-top:1px}
.agsave{background:#12a150;color:#fff;border-radius:10px;padding:9px 18px;font-weight:700;font-size:13.5px}
.agsave:active{transform:scale(.97)}
.agside .test{background:linear-gradient(180deg,#f4fbf6,#fff)}
.tchat{background:#efeae2;border-radius:12px;padding:12px 10px;min-height:150px;max-height:300px;overflow:auto;display:flex;flex-direction:column;gap:6px}
.tchat .tb{max-width:85%;padding:7px 10px;border-radius:9px;font-size:12.8px;line-height:1.42;white-space:pre-wrap;box-shadow:0 1px .5px rgba(0,0,0,.12)}
.tchat .tb.u{align-self:flex-end;background:#d9fdd3;border-top-right-radius:2px}
.tchat .tb.a{align-self:flex-start;background:#fff;border-top-left-radius:2px}
.tin{display:flex;gap:8px;margin-top:10px}
.tin input{flex:1;border:1px solid var(--line);border-radius:100px;padding:9px 14px;font-size:13px;outline:none}
.tin input:focus{border-color:#12a150}
.tin button{width:40px;height:40px;border-radius:50%;background:#12a150;color:#fff;font-size:15px;flex:0 0 auto}
.promptbox{background:#0f1b17;color:#c9f0d8;border-radius:10px;padding:12px;font-size:11px;line-height:1.5;white-space:pre-wrap;word-break:break-word;max-height:320px;overflow:auto;font-family:ui-monospace,Menlo,Consolas,monospace}
.agacc{border:1px solid var(--line);border-radius:12px;overflow:hidden}
.agacc>summary{list-style:none;cursor:pointer;padding:12px 14px;font-size:13px;font-weight:700;color:var(--navy);display:flex;align-items:center;gap:8px;background:#f6faf7}
.agacc>summary::-webkit-details-marker{display:none}
.agacc[open]>summary{border-bottom:1px solid var(--line)}
.agacc .in{padding:14px}
`;

const CLIENTE = `
var VIEW='visao',F={st:'todos',q:''},REL='pago';
var EXTRA=[],VALID={},SPC={},nSeq=1;
var EST={
 NOVO:{rot:'Em fila',cor:'#8b5cf6'},ABERTURA_ENVIADA:{rot:'Em cobranca',cor:'#1e5eff'},
 OFERTA_AVISTA:{rot:'Negociando',cor:'#1e5eff'},OFERTA_PARCELADO:{rot:'Negociando',cor:'#1e5eff'},
 AGUARDANDO_PGTO:{rot:'Aguardando pgto',cor:'#f5b301'},COMPROVANTE_RECEBIDO:{rot:'Comprovante',cor:'#0ea5a0'},
 PAGO:{rot:'Recuperado',cor:'#1f9d57'},CONTESTACAO:{rot:'Contestado',cor:'#e0575b'},RECUSADO:{rot:'Sem acordo',cor:'#9aa7ba'}
};
function money(n){return 'R$ '+Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
function all(){return DADOS.devedores.concat(EXTRA);}
function byId(id){return all().filter(function(d){return String(d.id)===String(id);})[0];}
// grupo do ponto de vista do CLIENTE (dinheiro que entrou = recuperado)
function grp(d){var e=d.estado;
 if(e==='PAGO'||e==='COMPROVANTE_RECEBIDO')return 'pago';
 if(e==='NOVO')return 'fila';
 if(e==='CONTESTACAO')return 'contest';
 if(e==='RECUSADO')return 'recusa';
 return 'neg';}
function pendValid(d){return grp(d)==='pago'&&!VALID[d.id];} // aguardando conferencia do financeiro
var GLAB={pago:{rot:'Recuperado',cor:'#1f9d57'},neg:{rot:'Em negociacao',cor:'#1e5eff'},fila:{rot:'Em cobranca',cor:'#8b5cf6'},contest:{rot:'Contestado',cor:'#e0575b'},recusa:{rot:'Sem acordo',cor:'#9aa7ba'}};
function badge(d){var g=GLAB[grp(d)];return '<span class="badge" style="background:'+g.cor+'1f;color:'+g.cor+'">'+g.rot+'</span>';}
function pago(d){return grp(d)==='pago';}
function valorDe(d){return d.valor_acordo||d.valor;}

function go(v){VIEW=v;paint();window.scrollTo(0,0);}
function paint(){
 document.querySelectorAll('[data-nav]').forEach(function(a){a.classList.toggle('active',a.getAttribute('data-nav')===VIEW);});
 document.querySelectorAll('section[data-view]').forEach(function(s){s.hidden=s.getAttribute('data-view')!==VIEW;});
 ({visao:rVisao,agente:rAgente,recarga:rRecarga,enviar:rEnviar,meus:rMeus,validar:rValidar,spc:rSpc,parcelas:rParcelas,relatorios:rRel}[VIEW]||function(){})();
}
function kpi(n,l,cls){return '<div class="kpi"><div class="ki '+(cls||'b1')+'">'+'</div><div><div class="n">'+n+'</div><div class="l">'+l+'</div></div></div>';}

/* VISAO GERAL */
function rVisao(){
 var a=all();var rec=a.filter(pago);var recV=rec.reduce(function(s,d){return s+valorDe(d);},0);
 var cob=a.filter(function(d){return grp(d)==='fila'||grp(d)==='neg';}).length;
 var pend=a.filter(pendValid).length;
 var taxa=a.length?Math.round(100*rec.length/a.length):0;
 var tot=a.reduce(function(s,d){return s+d.valor;},0);var ticket=a.length?tot/a.length:0;
 var h='<div class="banner"><div class="bot" onclick="falarRobo()" style="cursor:pointer" title="Toque pra me ouvir">'+(ROBO_IMG?'<div class="mascote">'+ROBO_M+'<span class="lid"></span></div>':ROBO_M)+'</div>'+
  '<div><h2>Bem-vindo ao seu Portal RECUPERA.AI</h2><p>Envie seus inadimplentes, acompanhe a recuperacao em tempo real e valide os pagamentos direto com seu financeiro.</p><div style="font-size:12px;color:#bcd0ef;margin-top:6px">&#128266; Toque no robo pra me ouvir</div></div>'+
  '<div class="st"><span class="p"></span>Cobranca ativa</div></div>';
 // destaque grafico: anel de recuperacao
 h+='<div class="card"><div class="destaque">'+ring(taxa)+'<div><div style="font-size:15px;font-weight:800;color:var(--navy);margin-bottom:12px">Desempenho da carteira</div><div class="dstats">'+
  '<div class="dstat"><div class="v g">'+money(recV)+'</div><div class="l">Total recuperado</div></div>'+
  '<div class="dstat"><div class="v a">'+money(tot-recV)+'</div><div class="l">Ainda em aberto</div></div>'+
  '<div class="dstat"><div class="v">'+rec.length+'/'+a.length+'</div><div class="l">Acordos fechados</div></div>'+
  '<div class="dstat"><div class="v">'+money(ticket)+'</div><div class="l">Ticket medio</div></div>'+
  '</div></div></div></div>';
 h+='<div class="kpis">'+
  kpi(a.length,'Devedores enviados','b1')+kpi(cob,'Em cobranca','b2')+
  kpi(money(recV),'Recuperado','b3')+kpi(pend,'Aguardando validacao','b4')+'</div>';
 h+='<div class="funil"><div class="pill"><span class="dot" style="background:#f5b301"></span>Aguardando validacao <b>'+pend+'</b></div>'+
  '<div class="pill"><span class="dot" style="background:#1f9d57"></span>Ticket medio <b>'+money(ticket)+'</b></div>'+
  '<div class="pill"><span class="dot" style="background:#1e5eff"></span>Em negociacao <b>'+a.filter(function(d){return grp(d)==='neg';}).length+'</b></div></div>';
 h+='<div class="grid2"><div class="card"><h3>&#128200; Evolucao da recuperacao</h3>'+chart(240)+'</div>'+
  '<div class="card"><h3>&#128202; Distribuicao por status</h3>'+distrib()+'</div></div>';
 document.getElementById('v-visao').innerHTML=h;
 setTimeout(function(){document.querySelectorAll('.ringp').forEach(function(c){c.style.strokeDashoffset=c.getAttribute('data-off');});},60);
}
function ring(pct){var r=64,c=2*Math.PI*r;
 return '<div class="ringwrap"><svg viewBox="0 0 160 160" class="ringsvg"><circle cx="80" cy="80" r="'+r+'" fill="none" stroke="#e6edf7" stroke-width="14"/>'+
  '<circle class="ringp" cx="80" cy="80" r="'+r+'" fill="none" stroke="#1f9d57" stroke-width="14" stroke-linecap="round" stroke-dasharray="'+c+'" stroke-dashoffset="'+c+'" data-off="'+(c*(1-pct/100))+'"/></svg>'+
  '<div class="ringtxt"><b>'+pct+'%</b><span>recuperado</span></div></div>';}
function distrib(){
 var a=all(),c={};a.forEach(function(d){var g=grp(d);c[g]=(c[g]||0)+1;});
 var max=Math.max.apply(null,Object.keys(c).map(function(k){return c[k];}).concat([1]));
 return '<div class="barlist">'+Object.keys(GLAB).filter(function(k){return c[k];}).map(function(k){
  return '<div class="barrow"><div class="t"><span>'+GLAB[k].rot+'</span><b>'+c[k]+'</b></div><div class="track"><i style="width:'+(c[k]/max*100)+'%;background:'+GLAB[k].cor+'"></i></div></div>';}).join('')+'</div>';
}
function chart(alt){
 var rec=all().filter(pago).sort(function(a,b){return (''+a.id).localeCompare(''+b.id);});
 var W=700,H=alt,pad=34,pts=[],acc=0;rec.forEach(function(d){acc+=valorDe(d);pts.push(acc);});
 if(!pts.length)pts=[0];var maxv=pts[pts.length-1]||1,n=pts.length;
 var X=function(i){return pad+(W-2*pad)*(n<=1?0:i/(n-1));},Y=function(v){return H-pad-(H-2*pad)*(v/maxv);};
 var line='',area='M'+X(0)+' '+Y(0);pts.forEach(function(v,i){line+=(i?'L':'M')+X(i)+' '+Y(v)+' ';area+=' L'+X(i)+' '+Y(v);});
 area+=' L'+X(n-1)+' '+(H-pad)+' L'+X(0)+' '+(H-pad)+' Z';
 var grid='';for(var k=0;k<=3;k++){var yy=pad+(H-2*pad)*k/3;grid+='<line x1="'+pad+'" y1="'+yy+'" x2="'+(W-pad)+'" y2="'+yy+'" stroke="#e2e8f2"/><text x="6" y="'+(yy+4)+'" font-size="10" fill="#9aa7ba">'+money(maxv*(1-k/3)).replace('R$ ','')+'</text>';}
 return '<div class="chart"><div style="overflow-x:auto"><svg viewBox="0 0 '+W+' '+H+'"><defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f9d57" stop-opacity=".28"/><stop offset="1" stop-color="#1f9d57" stop-opacity="0"/></linearGradient></defs>'+grid+'<path d="'+area+'" fill="url(#ar)"/><path d="'+line+'" fill="none" stroke="#1f9d57" stroke-width="2.5"/></svg></div><div class="lg"><span style="color:#1f9d57"></span>Recuperado acumulado &middot; '+rec.length+' acordos</div></div>';
}

/* ENVIAR DEVEDOR */
function rEnviar(){
 document.getElementById('v-enviar').innerHTML='<div class="h2v">&#10133; Enviar inadimplente para cobranca</div>'+
  '<div class="card"><h3>Dados do devedor</h3><div class="form">'+
  '<div><label>Nome completo *</label><input id="f_nome" placeholder="Ex: Joao da Silva"></div>'+
  '<div><label>CPF</label><input id="f_cpf" placeholder="000.000.000-00"></div>'+
  '<div><label>Telefone (WhatsApp) *</label><input id="f_tel" placeholder="(67) 99999-9999"></div>'+
  '<div><label>Valor da divida *</label><input id="f_val" placeholder="R$ 0,00"></div>'+
  '<div><label>Vencimento</label><input id="f_venc" placeholder="dd/mm/aaaa"></div>'+
  '<div><label>N. do contrato / pedido</label><input id="f_doc" placeholder="opcional"></div>'+
  '<div class="full"><label>Observacoes p/ o agente</label><textarea id="f_obs" rows="2" placeholder="Ex: cliente antigo, prefere contato a tarde..."></textarea></div>'+
  '<div class="acao"><button class="btns" onclick="go(\\'meus\\')">Ver meus devedores</button><button class="btnp" onclick="enviar()">Enviar para cobranca</button></div>'+
  '</div><div class="hint" style="padding:0 18px 16px">Assim que enviado, o agente RECUPERA.AI inicia o contato pelo WhatsApp automaticamente.</div></div>';
}
function enviar(){
 var nome=val('f_nome'),tel=val('f_tel'),v=parseFloat((val('f_val')||'').replace(/[^0-9,.-]/g,'').replace(/\\./g,'').replace(',','.'))||0;
 if(!nome||!tel||!v){toast('Preencha nome, telefone e valor.',false);return;}
 var d={id:'n'+(nSeq++),nome:nome,cpf:val('f_cpf'),telefone:tel,valor:v,vencimento:val('f_venc'),credor:CLIENTE_NOME,estado:'NOVO',mensagens:[]};
 EXTRA.push(d);toast('Devedor enviado para cobranca! O agente ja vai iniciar o contato.',true);go('meus');
}
function val(id){var e=document.getElementById(id);return e?e.value.trim():'';}

/* MEUS DEVEDORES */
function rMeus(){
 var tabs=[['todos','Todos'],['fila','Em cobranca'],['neg','Em negociacao'],['valid','Aguardando validacao'],['pago','Recuperado'],['contest','Contestado']];
 var h='<div class="h2v">&#128101; Meus devedores</div><div class="filtros"><div class="tabs">'+
  tabs.map(function(t){return '<button class="tab'+(F.st===t[0]?' on':'')+'" onclick="setSt(\\''+t[0]+'\\')">'+t[1]+'</button>';}).join('')+'</div>'+
  '<div class="busca">&#128269;<input placeholder="Buscar..." value="'+esc(F.q)+'" oninput="setQ(this.value)"></div></div>';
 var arr=all().filter(function(d){var m=F.st==='todos'||(F.st==='valid'?pendValid(d):grp(d)===F.st);return m&&(!F.q||(d.nome+' '+(d.credor||'')).toLowerCase().indexOf(F.q.toLowerCase())>=0);});
 h+='<div class="card"><table class="tbl"><thead><tr><th>Devedor</th><th>Telefone</th><th>Valor</th><th>Status</th><th>Acoes</th></tr></thead><tbody>'+
  (arr.length?arr.map(function(d){return '<tr><td><b>'+esc(d.nome)+'</b></td><td>'+esc(d.telefone||'')+'</td><td>'+money(valorDe(d))+(d.parcelas>1?' <span style="color:#5b6b82">'+d.parcelas+'x</span>':'')+'</td><td>'+badge(d)+'</td>'+
   '<td class="acbtns"><button class="btn" style="background:#eef2f8;color:#1e56a8" onclick="conversa(\\''+d.id+'\\')">&#128172; Conversa</button></td></tr>';}).join(''):'<tr><td colspan="5"><div class="emptybox">Nenhum devedor neste filtro.</div></td></tr>')+
  '</tbody></table></div>';
 document.getElementById('v-meus').innerHTML=h;
}
function setSt(s){F.st=s;rMeus();}
function setQ(q){F.q=q;rMeus();}

/* VALIDAR PAGAMENTOS (setor financeiro do cliente) */
function rValidar(){
 var arr=all().filter(pendValid);
 var h='<div class="h2v">&#9989; Validar pagamentos</div>'+
  '<div class="aviso">Pagamentos com <b>comprovante recebido</b> pelo agente. Seu <b>setor financeiro</b> confere na base do financeiro (extrato/conta) e valida. Apos validar, o devedor fica pronto para a <b>retirada do SPC/Serasa</b>.</div>';
 h+='<div class="card"><table class="tbl"><thead><tr><th>Devedor</th><th>Valor pago</th><th>Comprovante</th><th>Acao do financeiro</th></tr></thead><tbody>'+
  (arr.length?arr.map(function(d){return '<tr><td><b>'+esc(d.nome)+'</b><br><span style="font-size:11px;color:#5b6b82">'+esc(d.credor||'')+'</span></td><td>'+money(valorDe(d))+'</td>'+
   '<td><span class="bureau" style="color:#0a6b3b;border-color:#1f9d5755;background:#1f9d5712">&#128206; recebido</span></td>'+
   '<td class="acbtns"><button class="btn g" onclick="validar(\\''+d.id+'\\',true)">Validar no financeiro</button><button class="btn" style="background:#fdecec;color:#c0392b" onclick="validar(\\''+d.id+'\\',false)">Nao localizado</button></td></tr>';}).join(''):'<tr><td colspan="4"><div class="emptybox"><div class="big">&#9989;</div>Nenhum pagamento pendente de validacao no momento.</div></td></tr>')+
  '</tbody></table></div>';
 document.getElementById('v-validar').innerHTML=h;
}
function validar(id,ok){
 if(ok){VALID[id]=true;toast('Pagamento validado no financeiro! Pronto para retirada do SPC.',true);}
 else{toast('Marcado como NAO localizado. Caso volta para o agente verificar.',false);}
 rValidar();
}

/* SPC / SERASA */
function rSpc(){
 var a=all();
 var incluir=a.filter(function(d){var g=grp(d);return (g==='fila'||g==='neg'||g==='recusa')&&!(SPC[d.id]&&SPC[d.id].incluido);});
 var retirar=a.filter(function(d){return (grp(d)==='pago')||(SPC[d.id]&&SPC[d.id].incluido&&!SPC[d.id].retirado);});
 var h='<div class="h2v">&#127991; Negativacao — SPC / Serasa</div>'+
  '<div class="aviso">Inclua no SPC/Serasa quem nao negociou, e <b>retire automaticamente</b> quem pagou (apos a validacao do financeiro). Integracao oficial via API dos birôs (em implementacao).</div>';
 h+='<div class="card"><h3>&#11014; Incluir na negativacao</h3><table class="tbl"><thead><tr><th>Devedor</th><th>Valor</th><th>Status</th><th>Incluir</th></tr></thead><tbody>'+
  (incluir.length?incluir.map(function(d){return '<tr><td><b>'+esc(d.nome)+'</b></td><td>'+money(d.valor)+'</td><td>'+statusSpc(d)+'</td>'+
   '<td class="acbtns"><button class="btn" style="background:#e0575b12;color:#c0392b;border:1px solid #e0575b55" onclick="incluir(\\''+d.id+'\\',\\'SPC\\')">SPC</button><button class="btn" style="background:#1f9d5712;color:#0a6b3b;border:1px solid #1f9d5755" onclick="incluir(\\''+d.id+'\\',\\'Serasa\\')">Serasa</button></td></tr>';}).join(''):'<tr><td colspan="4"><div class="emptybox">Ninguem para incluir agora.</div></td></tr>')+
  '</tbody></table></div>';
 h+='<div class="card" style="margin-top:16px"><h3>&#11015; Retirar (baixa apos pagamento)</h3><table class="tbl"><thead><tr><th>Devedor</th><th>Valor pago</th><th>Status</th><th>Retirar</th></tr></thead><tbody>'+
  (retirar.length?retirar.map(function(d){return '<tr><td><b>'+esc(d.nome)+'</b></td><td>'+money(valorDe(d))+'</td><td>'+statusSpc(d)+'</td>'+
   '<td class="acbtns">'+((SPC[d.id]&&SPC[d.id].retirado)?'<span class="btn done">&#10003; Retirado</span>':(VALID[d.id]?'<button class="btn g" onclick="retirar(\\''+d.id+'\\')">Retirar do biro</button>':'<span class="hint">valide o pgto antes</span>'))+'</td></tr>';}).join(''):'<tr><td colspan="4"><div class="emptybox">Ninguem para retirar agora.</div></td></tr>')+
  '</tbody></table></div>';
 document.getElementById('v-spc').innerHTML=h;
}
function statusSpc(d){var s=SPC[d.id];if(!s||!s.incluido)return '<span class="hint">nao negativado</span>';
 var b='<span class="bureau '+(s.bureau==='SPC'?'spc':'serasa')+'">'+s.bureau+'</span>';
 return b+(s.retirado?' <span class="hint">retirado</span>':' <span class="hint">ativo desde '+s.data+'</span>');}
function incluir(id,bureau){SPC[id]={incluido:true,bureau:bureau,retirado:false,data:new Date().toLocaleDateString('pt-BR')};toast('Incluido no '+bureau+'.',true);rSpc();}
function retirar(id){SPC[id]=SPC[id]||{incluido:true,bureau:'SPC',data:new Date().toLocaleDateString('pt-BR')};SPC[id].retirado=true;toast('Baixa solicitada — retirada do biro.',true);rSpc();}

/* PARCELAMENTOS */
function rParcelas(){
 var arr=all().filter(function(d){return d.parcelas>1;});
 var h='<div class="h2v">&#128197; Parcelamentos ativos</div>';
 if(!arr.length){h+='<div class="card"><div class="emptybox"><div class="big">&#128197;</div>Nenhum acordo parcelado ainda.</div></div>';document.getElementById('v-parcelas').innerHTML=h;return;}
 h+=arr.map(function(d){var pv=valorDe(d)/d.parcelas;var linhas='';
  for(var i=0;i<d.parcelas;i++){var venc=new Date();venc.setMonth(venc.getMonth()+i);var paga=i===0&&grp(d)==='pago';
   linhas+='<div class="tl'+(paga?' pg':'')+'"><div class="n">'+(i+1)+'</div><div class="t"><b>Parcela '+(i+1)+'/'+d.parcelas+'</b><br><span>venc. '+venc.toLocaleDateString('pt-BR')+(paga?' &middot; paga':'')+'</span></div><div class="v">'+money(pv)+'</div></div>';}
  return '<div class="card"><h3>'+esc(d.nome)+' &middot; '+money(valorDe(d))+' em '+d.parcelas+'x</h3><div class="timeline">'+linhas+'</div></div>';
 }).join('');
 document.getElementById('v-parcelas').innerHTML=h;
}

/* RELATORIOS */
function rRel(){
 var mapa={pago:'Recuperados',valid:'Aguardando validacao',neg:'Em negociacao',fila:'Em cobranca',contest:'Contestados'};
 var h='<div class="h2v">&#128202; Relatorios</div><div class="rtabs">'+
  Object.keys(mapa).map(function(k){return '<button class="tab'+(REL===k?' on':'')+'" onclick="setRel(\\''+k+'\\')">'+mapa[k]+'</button>';}).join('')+'</div>';
 var arr=all().filter(function(d){return grp(d)===REL;});
 var tot=arr.reduce(function(s,d){return s+(REL==='pago'?valorDe(d):d.valor);},0);
 h+='<div class="card"><table class="tbl"><thead><tr><th>Devedor</th><th>Telefone</th><th>Negativacao</th><th>Valor</th></tr></thead><tbody>'+
  (arr.length?arr.map(function(d){return '<tr><td><b>'+esc(d.nome)+'</b></td><td>'+esc(d.telefone||'')+'</td><td>'+statusSpc(d)+'</td><td>'+money(REL==='pago'?valorDe(d):d.valor)+'</td></tr>';}).join(''):'<tr><td colspan="4"><div class="emptybox">Sem registros.</div></td></tr>')+
  '</tbody></table><div class="tot"><span>'+arr.length+' registro(s)</span><span>Total: <b>'+money(tot)+'</b></span></div></div>';
 document.getElementById('v-relatorios').innerHTML=h;
}
function setRel(k){REL=k;rRel();}

/* RECARGA DE CREDITOS (self-service, PIX) */
var CRED={saldo:0,usados:0,pacotes:[]};
function rRecarga(){
 var el=document.getElementById('v-recarga');
 el.innerHTML='<div class="h2v">&#128179; Recarga de creditos</div><div class="card"><div class="emptybox">Carregando...</div></div>';
 fetch('/api/recarga/pacotes').then(function(r){return r.json();}).then(function(d){CRED=d;pintaRecarga();})
  .catch(function(){el.innerHTML='<div class="h2v">&#128179; Recarga de creditos</div><div class="aviso">A recarga funciona no servidor (recupera-ai.onrender.com). Nesta demo estatica ela nao processa PIX.</div>'+pacotesHTML(true);});
}
function pintaRecarga(){
 var el=document.getElementById('v-recarga');
 el.innerHTML='<div class="h2v">&#128179; Recarga de creditos</div>'+
  '<div class="card"><div class="destaque" style="grid-template-columns:150px 1fr">'+ring2(CRED.saldo,CRED.usados)+
   '<div><div style="font-size:15px;font-weight:800;color:var(--navy);margin-bottom:12px">Seus creditos</div><div class="dstats">'+
   '<div class="dstat"><div class="v g">'+CRED.saldo+'</div><div class="l">Creditos disponiveis</div></div>'+
   '<div class="dstat"><div class="v">'+CRED.usados+'</div><div class="l">Ja utilizados</div></div>'+
   '</div><div class="hint" style="margin-top:8px">1 credito = 1 devedor que a IA trabalha. Sem credito, a IA nao cobra.</div></div></div></div>'+
  '<div class="h2v" style="font-size:14px;margin-top:18px">Escolha uma recarga</div>'+pacotesHTML(false)+
  '<div class="card" style="margin-top:16px"><h3>&#128220; Historico</h3>'+histHTML()+'</div>';
}
function pacotesHTML(demo){
 var ps=CRED.pacotes&&CRED.pacotes.length?CRED.pacotes:[{id:'teste',nome:'Teste',creditos:200,valor_cents:60000},{id:'media',nome:'Media',creditos:500,valor_cents:125000},{id:'cheia',nome:'Cheia',creditos:1000,valor_cents:200000}];
 return '<div class="pacotes">'+ps.map(function(p){
  var pd=(p.valor_cents/100/p.creditos);
  return '<div class="plano'+(p.id==='media'?' dest':' alt')+'"><span class="badge">'+(p.id==='media'?'MAIS ESCOLHIDO':p.nome.toUpperCase())+'</span>'+
   '<h3>'+p.creditos+' devedores</h3><div class="desc">R$ '+pd.toFixed(2).replace('.',',')+' por devedor</div>'+
   '<div style="font-size:24px;font-weight:800;color:var(--navy)">'+money(p.valor_cents/100)+'</div>'+
   '<button class="btnp" style="width:100%;margin-top:12px" onclick="comprar(\\''+p.id+'\\')"'+(demo?' disabled':'')+'>Comprar via Pix</button></div>';
 }).join('')+'</div>';
}
function histHTML(){
 if(!CRED.historico||!CRED.historico.length)return '<div class="emptybox">Nenhum movimento ainda.</div>';
 return '<table class="tbl"><thead><tr><th>Movimento</th><th>Qtd</th><th>Saldo</th><th>Quando</th></tr></thead><tbody>'+
  CRED.historico.map(function(h){var pos=h.quantidade>0;return '<tr><td>'+esc(h.descricao||h.tipo)+'</td><td style="color:'+(pos?'#1f9d57':'#e0575b')+'">'+(pos?'+':'')+h.quantidade+'</td><td>'+h.saldo_apos+'</td><td style="color:#5b6b82">'+esc(h.criado_em||'')+'</td></tr>';}).join('')+'</tbody></table>';
}
function ring2(saldo,usados){var tot=saldo+usados||1;var pct=Math.round(saldo/tot*100);var r=64,c=2*Math.PI*r;
 return '<div class="ringwrap"><svg viewBox="0 0 160 160" class="ringsvg"><circle cx="80" cy="80" r="'+r+'" fill="none" stroke="#e6edf7" stroke-width="14"/>'+
  '<circle class="ringp" cx="80" cy="80" r="'+r+'" fill="none" stroke="#1e5eff" stroke-width="14" stroke-linecap="round" stroke-dasharray="'+c+'" stroke-dashoffset="'+(c*(1-pct/100))+'"/></svg>'+
  '<div class="ringtxt"><b>'+saldo+'</b><span>creditos</span></div></div>';}
function comprar(id){
 toast('Gerando seu Pix...',true);
 fetch('/api/recarga/comprar?pacote='+id).then(function(r){return r.json();}).then(function(d){
  if(!d.pix){toast('Erro ao gerar Pix.',false);return;}
  var m=document.getElementById('modal');
  document.getElementById('modalbody').classList.remove('wamodal');
  document.getElementById('modalbody').innerHTML='<div class="mh"><b>Pagar recarga — '+d.pacote.creditos+' creditos</b><span class="x" onclick="fecharRec()">&times;</span></div>'+
   '<div style="padding:18px"><div style="font-size:22px;font-weight:800;color:var(--navy);text-align:center">'+money(d.pacote.valor_cents/100)+'</div>'+
   '<div class="hint" style="text-align:center;margin:4px 0 12px">Pix copia e cola:</div>'+
   '<div style="background:#f6f8fc;border:1px solid var(--line);border-radius:10px;padding:10px;font-size:10px;word-break:break-all">'+esc(d.pix.copiaCola)+'</div>'+
   '<button class="btns" style="width:100%;margin-top:10px" onclick="copiar(\\''+d.pix.id+'\\',this)">Copiar codigo</button>'+
   '<button class="btnp" style="width:100%;margin-top:8px" onclick="confirmarRec(\\''+d.pix.id+'\\')">Ja paguei — confirmar</button>'+
   '<div class="hint" style="text-align:center;margin-top:8px">Na operacao real, a confirmacao e automatica pelo banco (webhook).</div></div>';
  window._pixcc=d.pix.copiaCola; m.classList.add('on');
 }).catch(function(){toast('Recarga so funciona no servidor.',false);});
}
function copiar(id,btn){try{navigator.clipboard.writeText(window._pixcc||'');btn.textContent='Copiado!';}catch(e){}}
function confirmarRec(pix){
 fetch('/api/recarga/confirmar?pix='+encodeURIComponent(pix)).then(function(r){return r.json();}).then(function(d){
  fecharRec();
  if(d.ok){toast('Recarga confirmada! +'+(d.creditos||0)+' creditos',true);rRecarga();}
  else toast('Nao foi possivel confirmar.',false);
 }).catch(function(){toast('Erro.',false);});
}
function fecharRec(){document.getElementById('modal').classList.remove('on');}

/* CONVERSA (modal) */
function conversa(id){var d=byId(id);var m=document.getElementById('modal');
 var msgs=d.mensagens||[],first=true,hh=9,mm=2;
 function hora(){mm++;if(mm>59){mm=0;hh++;}return (hh<10?'0':'')+hh+':'+(mm<10?'0':'')+mm;}
 var corpo=msgs.length?msgs.map(function(x){
  var out=x.direcao==='saida',t=hora();
  var au=false;if(out&&first){au=true;first=false;}
  var meta='<span class="tm">'+t+(out?' <span class="ck">&#10003;&#10003;</span>':'')+'</span>';
  if(au)return '<div class="wrow out"><div class="wb"><div class="wvoz"><span class="pl">&#9654;</span><div class="wave">'+wave()+'</div><span class="dur">0:12</span></div>'+meta+'</div></div>';
  return '<div class="wrow '+(out?'out':'in')+'"><div class="wb">'+esc(x.texto)+meta+'</div></div>';
 }).join(''):'<div class="wrow in"><div class="wb">Sem conversa registrada ainda.<span class="tm">'+hora()+'</span></div></div>';
 var ini=d.nome.trim().charAt(0).toUpperCase()||'?';
 document.getElementById('modalbody').innerHTML=
  '<div class="wa"><div class="wahead"><span class="bk" onclick="fechar()">&#8592;</span>'+
  '<div class="av">'+ini+'</div>'+
  '<div class="nm"><b>'+esc(d.nome)+'</b><span>online</span></div>'+
  '<span class="x" onclick="fechar()">&times;</span></div>'+
  '<div class="wabody"><div class="wday"><span>HOJE</span></div>'+corpo+'</div></div>';
 m.classList.add('on');
 document.querySelector('#modal .modalbox').classList.add('wamodal');
}
function wave(){var b='';for(var i=0;i<20;i++)b+='<i style="height:'+(20+Math.round(Math.abs(Math.sin(i*1.3))*70))+'%"></i>';return b;}
function fechar(){document.getElementById('modal').classList.remove('on');document.getElementById('modalbody').classList.remove('wamodal');}

/* ================= AGENTE IA (config do agente de cobranca) ================= */
var AG_DEF={
 empresa:(typeof CLIENTE_NOME!=='undefined'?CLIENTE_NOME:'CDL Campo Grande'),
 segmento:'Varejo / comercio — lojistas associados',
 regiao:'Campo Grande/MS — seg a sex 8h-18h, sab 8h-12h',
 sobre:'Central de cobranca amigavel dos lojistas associados a CDL. Recupera dividas de forma respeitosa, dentro da LGPD e do Codigo de Defesa do Consumidor.',
 cobra:'Dividas de crediario, cheques, carnes e mensalidades em atraso dos lojistas associados.',
 vende:'1) Cumprimenta pelo nome com respeito. 2) Confirma a divida e o valor. 3) Oferece condicao (a vista com desconto ou parcelado). 4) Gera o Pix na hora. 5) Recebe o comprovante e da baixa.',
 pode:'Negociar, oferecer desconto a vista, parcelar, gerar Pix, confirmar pagamento por comprovante e iniciar a baixa no SPC/Serasa.',
 naopode:'Ameacar, constranger, expor a divida a terceiros, cobrar fora do horario ou divida prescrita, prometer o que nao pode ou mentir. Se perguntarem direto se e um robo, responde com honestidade.',
 preset:'amigavel', foco:'hibrido',
 tom:70, formal:50, firmeza:45, proativ:65,
 tamanho:'curtas', emojis:'moderado', velocidade:'humana', idioma:'pt-BR',
 proibidas:'calote, caloteiro, vagabundo, barato, milagre, garantido',
 tEspera:'10', descMax:15, parcMax:6, pausar:'/pausar', despausar:'/despausar',
 tg:{partes:true,nome:true,umapergunta:true,voz:true,assinar:false}
};
var AG=carregarAG();
function carregarAG(){try{var s=JSON.parse(localStorage.getItem('recupera_agente_cfg')||'null');if(s){var o=JSON.parse(JSON.stringify(AG_DEF));for(var k in s)o[k]=s[k];o.tg=Object.assign({},AG_DEF.tg,s.tg||{});return o;}}catch(e){}return JSON.parse(JSON.stringify(AG_DEF));}
function salvarAG(){try{localStorage.setItem('recupera_agente_cfg',JSON.stringify(AG));}catch(e){}
 try{fetch('/api/agente/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(AG)}).catch(function(){});}catch(e){}
 toast('Agente salvo! A IA ja vai atender com essa configuracao.',true);}
var PRESETS=[
 ['padrao','&#129309;','Padrao','Equilibrado e profissional',{tom:60,formal:55,firmeza:45}],
 ['serio','&#127913;','Serio','Objetivo e formal',{tom:40,formal:75,firmeza:60}],
 ['amigavel','&#129366;','Amigavel','Acolhedor e proximo',{tom:75,formal:45,firmeza:40}],
 ['firme','&#128170;','Firme','Cordial mas incisivo',{tom:50,formal:55,firmeza:75}],
 ['consultivo','&#129504;','Consultivo','Explica e orienta',{tom:60,formal:60,firmeza:45}],
 ['empatico','&#129505;','Empatico','Compreensivo, sem pressao',{tom:80,formal:45,firmeza:30}]
];
var FOCOS=[['recuperar','&#127919;','Recuperar','Negocia e fecha'],['suporte','&#128736;','Suporte','Tira duvidas'],['hibrido','&#128256;','Hibrido','Faz os dois']];
var TEMPOS=[['3','Instantaneo'],['5','Rapido'],['10','Humano'],['20','Pensativo'],['30','Calmo']];
function agSel(id,v){AG[id]=v;rAgente();}
function agSet(id,v){AG[id]=v;}
function agSlider(id,v){AG[id]=+v;var el=document.getElementById('sv_'+id);if(el)el.textContent=v;}
function agTgl(k){AG.tg[k]=!AG.tg[k];var el=document.getElementById('tg_'+k);if(el)el.classList.toggle('on',AG.tg[k]);}
function agPreset(p){AG.preset=p;var pr=PRESETS.filter(function(x){return x[0]===p;})[0];if(pr){AG.tom=pr[4].tom;AG.formal=pr[4].formal;AG.firmeza=pr[4].firmeza;}rAgente();}
function tgl(k,lbl){return '<div class="tgg"><span>'+lbl+'</span><div id="tg_'+k+'" class="sw'+(AG.tg[k]?' on':'')+'" onclick="agTgl(\\''+k+'\\')"></div></div>';}
function sl(id,lbl){return '<div class="slrow"><label>'+lbl+'</label><span class="sv" id="sv_'+id+'">'+AG[id]+'</span><input type="range" min="0" max="100" value="'+AG[id]+'" oninput="agSlider(\\''+id+'\\',this.value)"></div>';}
function inp(id,lbl,ta){var v=esc(AG[id]);return '<div class="agrow"><div class="k">'+lbl+'</div>'+(ta?'<textarea oninput="agSet(\\''+id+'\\',this.value)">'+v+'</textarea>':'<input value="'+v+'" oninput="agSet(\\''+id+'\\',this.value)">')+'</div>';}
function selct(id,lbl,opts){return '<div class="agrow"><div class="k">'+lbl+'</div><select onchange="agSet(\\''+id+'\\',this.value)">'+opts.map(function(o){return '<option'+(AG[id]===o?' selected':'')+'>'+o+'</option>';}).join('')+'</select></div>';}

function rAgente(){
 var sec=document.getElementById('v-agente');if(!sec)return;
 var presetsH=PRESETS.map(function(p){return '<div class="pcard'+(AG.preset===p[0]?' on':'')+'" onclick="agPreset(\\''+p[0]+'\\')"><div class="pi">'+p[1]+'</div><b>'+p[2]+'</b><span>'+p[3]+'</span></div>';}).join('');
 var focoH=FOCOS.map(function(f){return '<div class="pcard'+(AG.foco===f[0]?' on':'')+'" onclick="agSel(\\'foco\\',\\''+f[0]+'\\')"><div class="pi">'+f[1]+'</div><b>'+f[2]+'</b><span>'+f[3]+'</span></div>';}).join('');
 var tempoH=TEMPOS.map(function(t){return '<div class="tcard'+(AG.tEspera===t[0]?' on':'')+'" onclick="agSel(\\'tEspera\\',\\''+t[0]+'\\')"><b>'+t[0]+'s</b><span>'+t[1]+'</span></div>';}).join('');
 sec.innerHTML=''+
 '<div class="banner"><div class="bot" style="cursor:default">'+(ROBO_IMG?'<div class="mascote">'+ROBO_M+'<span class="lid"></span></div>':ROBO_M)+'</div>'+
  '<div><h2>Agente IA &mdash; ensine sua cobranca</h2><p>Configure o que a IA sabe do seu negocio e como ela fala. Ela atende no WhatsApp, negocia, gera o Pix e da baixa &mdash; 100% no automatico.</p></div>'+
  '<button class="agsave" style="align-self:center" onclick="salvarAG()">Salvar</button></div>'+
 '<div class="ag"><div class="agcol">'+
  /* O QUE A IA APRENDEU */
  '<div class="agc"><h3><span class="e">&#10022;</span> O que a IA aprendeu</h3><p class="sub">Quanto mais completo, melhor ela negocia.</p>'+
   inp('empresa','Empresa / credor')+inp('segmento','Segmento')+inp('regiao','Regiao / horario')+
   inp('sobre','Sobre',1)+inp('cobra','O que cobra',1)+inp('vende','Como negocia',1)+
   inp('pode','Pode fazer',1)+inp('naopode','Nao pode fazer',1)+
  '</div>'+
  /* PERSONALIDADE */
  '<div class="agc"><h3><span class="e">&#10022;</span> Personalidade do agente</h3><p class="sub">Presets ajustam os controles abaixo.</p>'+
   '<div class="presets">'+presetsH+'</div>'+
   '<div style="font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:#12a150;font-weight:800;margin:16px 0 6px">Foco do atendimento</div><div class="foco">'+focoH+'</div>'+
   '<div style="margin-top:14px">'+sl('tom','Tom (0=serio &rarr; 100=caloroso)')+sl('formal','Formalidade')+sl('firmeza','Firmeza na cobranca')+sl('proativ','Proatividade')+'</div>'+
   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">'+
    selct('tamanho','Tamanho',['curtas','medias','longas'])+selct('emojis','Emojis',['nenhum','moderado','muitos'])+
    selct('velocidade','Velocidade',['instantanea','humana','calma'])+selct('idioma','Idioma',['pt-BR'])+
   '</div>'+
   inp('proibidas','Palavras proibidas')+
   '<div class="tggs" style="margin-top:12px">'+tgl('partes','Responder em partes')+tgl('nome','Chamar pelo nome')+tgl('umapergunta','Uma pergunta por vez')+tgl('voz','Enviar voz')+tgl('assinar','Assinar mensagens')+'</div>'+
  '</div>'+
  /* TEMPO DE ESPERA */
  '<div class="agc"><h3><span class="e">&#10022;</span> Tempo de espera (entender contexto)</h3><p class="sub">A IA aguarda esse tempo antes de responder. Se o cliente manda varias mensagens seguidas, ela junta tudo e responde de uma vez &mdash; como uma pessoa real.</p>'+
   '<div class="tempos">'+tempoH+'</div></div>'+
  /* AJUSTES FINOS */
  '<div class="agc"><h3><span class="e">&#10022;</span> Ajustes finos da negociacao</h3>'+
   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+
    '<div class="agrow"><div class="k">Desconto max. a vista (%)</div><input type="number" min="0" max="90" value="'+AG.descMax+'" oninput="agSet(\\'descMax\\',+this.value)"></div>'+
    '<div class="agrow"><div class="k">Parcelamento max. (x)</div><input type="number" min="1" max="24" value="'+AG.parcMax+'" oninput="agSet(\\'parcMax\\',+this.value)"></div>'+
    '<div class="agrow"><div class="k">Palavra p/ pausar IA</div><input value="'+esc(AG.pausar)+'" oninput="agSet(\\'pausar\\',this.value)"></div>'+
    '<div class="agrow"><div class="k">Palavra p/ despausar</div><input value="'+esc(AG.despausar)+'" oninput="agSet(\\'despausar\\',this.value)"></div>'+
   '</div></div>'+
 '</div>'+
 /* COLUNA LATERAL: TESTAR + PROMPT */
 '<div class="agcol agside">'+
  '<div class="agc test"><h3><span class="e">&#10022;</span> Testar resposta</h3><p class="sub">Previa de como a IA responde com essa config (roteiro deterministico).</p>'+
   '<div class="tchat" id="tchat"><div class="tb a">Oi! Sou o agente da '+esc(AG.empresa)+'. Me manda uma mensagem como se fosse o devedor pra ver como eu respondo. &#128522;</div></div>'+
   '<div class="tin"><input id="tmsg" placeholder="Ex: ta caro, tem desconto?" onkeydown="if(event.key===\\'Enter\\')agTestar()"><button onclick="agTestar()">&#10148;</button></div>'+
   '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">'+
    ['oi','ta caro, tem desconto?','so consigo parcelar','pode gerar o pix','ja paguei, segue o comprovante','voce e um robo?'].map(function(q){return '<button class="btns" style="font-size:11px;padding:6px 10px" onclick="agQuick(\\''+q.replace(/\\'/g,"")+'\\')">'+q+'</button>';}).join('')+
   '</div></div>'+
  '<details class="agacc"><summary>&#128220; Ver prompt gerado</summary><div class="in"><div class="promptbox" id="promptbox">'+esc(agPrompt())+'</div>'+
   '<button class="btns" style="width:100%;margin-top:10px" onclick="agCopiarPrompt()">Copiar prompt</button></div></details>'+
 '</div></div>';
}
function agQuick(q){var i=document.getElementById('tmsg');i.value=q;agTestar();}
function agTestar(){var i=document.getElementById('tmsg');var msg=(i.value||'').trim();if(!msg)return;i.value='';
 var box=document.getElementById('tchat');
 box.innerHTML+='<div class="tb u">'+esc(msg)+'</div>';
 var r=agResponder(msg);
 box.innerHTML+='<div class="tb a">'+r+'</div>';
 box.scrollTop=box.scrollHeight;
 var pb=document.getElementById('promptbox');if(pb)pb.textContent=agPrompt();
}
function agResponder(msg){
 var t=msg.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');
 var emp=esc(AG.empresa);
 var nome=AG.tg.nome?'Joao':''; var vlr='R$ 340,00';
 var desc=(340*(1-AG.descMax/100)).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
 var emj=AG.emojis==='nenhum'?'':(AG.emojis==='muitos'?' &#128522;&#128076;':' &#128522;');
 var ola=AG.tom>=65?'Oi'+(nome?', '+nome:'')+'! Tudo bem?':'Ola'+(nome?', '+nome:'')+'.';
 var r;
 if(/robo|rob|voce e|eh um|automat|maquina|humano/.test(t)) r='Sou um assistente digital da '+emp+', sim. Mas pode falar comigo numa boa que eu resolvo tudo por aqui: negocio, gero o Pix e dou baixa.';
 else if(/oi|ola|bom dia|boa tarde|boa noite|tudo bem/.test(t)) r=ola+' Sou da '+emp+' e vi que tem uma pendencia de '+vlr+' em aberto. Da pra resolver hoje numa condicao boa. Prefere a vista ou parcelado?';
 else if(/desconto|caro|ta caro|abaixa|diminui/.test(t)) r=(nome?nome+', ':'')+'consigo sim: a vista fecho de '+vlr+' por *R$ '+desc+'* ('+AG.descMax+'% off). Fechando agora ja te mando o Pix. Pode ser?';
 else if(/parcel|dividir|vezes|nao tenho tudo|so consigo/.test(t)) r='Sem problema! Da pra parcelar em ate '+AG.parcMax+'x. Em quantas vezes fica bom pra voce que eu ja gero a 1a?';
 else if(/pix|gerar|gera|paga|codigo|copia/.test(t)) r='Perfeito! Ja gero o Pix copia e cola aqui na conversa. Assim que pagar, e so me mandar o comprovante que eu confirmo na hora.';
 else if(/comprovante|paguei|pago|anexo|print|efetuei/.test(t)) r='Recebi seu comprovante'+(nome?', '+nome:'')+'! &#9989; Vou validar e sua negativacao e baixada em ate 5 dias uteis. Obrigado por resolver com a gente!';
 else if(/nao devo|nao reconheco|nao e minha|ja paguei isso/.test(t)) r='Entendo. Vou registrar sua contestacao e encaminhar pro financeiro do lojista conferir. Assim que verificarem, te retorno por aqui.';
 else r='Posso te ajudar a resolver essa pendencia de '+vlr+' agora: fecho a vista com desconto ou parcelo em ate '+AG.parcMax+'x. Qual fica melhor?';
 if(AG.emojis!=='nenhum'&&!/&#/.test(r))r+=emj;
 if(AG.tg.assinar)r+='\\n\\n&mdash; '+emp;
 return r;
}
function agPrompt(){
 var g=AG;var reg=[];
 if(g.tg.nome)reg.push('chame a pessoa pelo primeiro nome');
 if(g.tg.umapergunta)reg.push('faca uma pergunta por vez');
 if(g.tg.partes)reg.push('pode responder em 1-3 mensagens curtas');
 if(g.tg.voz)reg.push('a abertura pode ir como nota de voz');
 if(g.tg.assinar)reg.push('assine as mensagens com o nome do credor');
 return 'Voce e o agente de cobranca da '+g.empresa+' ('+g.segmento+').\\n'+
  'Atendimento: '+g.regiao+'.\\n'+
  'Sobre: '+g.sobre+'\\n'+
  'O que cobra: '+g.cobra+'\\n'+
  'Como negocia: '+g.vende+'\\n'+
  'PODE: '+g.pode+'\\n'+
  'NAO PODE: '+g.naopode+'\\n\\n'+
  'Personalidade: preset "'+g.preset+'", foco "'+g.foco+'".\\n'+
  'Tom '+g.tom+'/100, formalidade '+g.formal+'/100, firmeza '+g.firmeza+'/100, proatividade '+g.proativ+'/100.\\n'+
  'Respostas '+g.tamanho+', emojis '+g.emojis+', velocidade '+g.velocidade+', idioma '+g.idioma+'.\\n'+
  'NUNCA use as palavras: '+g.proibidas+'.\\n'+
  'Regras de estilo: '+(reg.join('; ')||'padrao')+'.\\n'+
  'Limites de negociacao: desconto a vista ate '+g.descMax+'%, parcelamento ate '+g.parcMax+'x.\\n'+
  'Tempo de espera antes de responder: '+g.tEspera+'s (junte mensagens em sequencia).\\n'+
  'Voce e 100% autonomo, humanizado e segue a LGPD e o Codigo de Defesa do Consumidor. '+
  'Se perguntarem diretamente se voce e um robo, responda com honestidade, sem se passar por humano. '+
  'A decisao de valores, desconto, parcela e gerar Pix segue os limites acima.';
}
function agCopiarPrompt(){try{navigator.clipboard.writeText(agPrompt());toast('Prompt copiado.',true);}catch(e){}}

/* TOAST */
var _tt;
function toast(msg,ok){var t=document.getElementById('toast');t.className='toast on'+(ok?' ok':'');t.innerHTML=(ok?'&#9989; ':'&#9888; ')+esc(msg);clearTimeout(_tt);_tt=setTimeout(function(){t.className='toast';},3200);}

/* ASSISTENTE (o robozinho responde e faz) */
var _robau;
function dizer(txt){try{if(_robau)_robau.pause();_robau=new Audio('/api/voz?texto='+encodeURIComponent(txt));_robau.play();}catch(e){}}
function respAssist(p){
 var t=p.toLowerCase();var d=DADOS.devedores;var pagos=d.filter(function(x){return grp(x)==='pago';});
 var rec=pagos.reduce(function(s,x){return s+valorDe(x);},0);
 if(/recuper|entrou|dinheiro|quanto/.test(t))return 'Ate agora recuperei '+money(rec)+' pra voce, com '+pagos.length+' acordos fechados.';
 if(/pagaram|pagou|acordo|fechou/.test(t))return pagos.length+' devedores ja pagaram, somando '+money(rec)+'.';
 if(/credito|saldo|recarga/.test(t))return 'Voce compra creditos na aba Recarga. Cada credito eu uso pra trabalhar um devedor.';
 if(/quantos|devedor|carteira|inadimpl/.test(t))return 'Sua carteira tem '+d.length+' devedores, e '+pagos.length+' ja foram resolvidos.';
 if(/contest|reclam|nao pagou|problema/.test(t))return d.filter(function(x){return grp(x)==='contest';}).length+' casos em contestacao, ja encaminhados pra verificacao.';
 if(/negoci/.test(t))return d.filter(function(x){return grp(x)==='neg';}).length+' devedores estao em negociacao agora.';
 if(/como funciona|como que funciona|explica|passo a passo|o que e isso|como usa/.test(t))return 'Simples: voce compra creditos, envia sua lista de devedores, e eu abordo cada um no WhatsApp com voz humanizada, negocio, gero o Pix e dou baixa quando paga. Voce so acompanha aqui.';
 if(/como envi|enviar devedor|cadastr|mandar a lista|importar/.test(t))return 'Na aba Enviar Devedor voce coloca nome, telefone e valor. Eu começo a cobrar automaticamente pelo WhatsApp.';
 if(/como receb|onde cai|dinheiro cai|minha conta|receber/.test(t))return 'O Pix cai direto na conta do lojista. Depois o financeiro valida e a baixa e liberada. Nada passa por fora.';
 if(/seguro|lgpd|legal|risco|golpe/.test(t))return 'Tudo dentro da LGPD, com tom respeitoso e sem constrangimento, e com auditoria de cada acao feita no sistema.';
 if(/pix|como paga|copia e cola/.test(t))return 'Na conversa eu gero o Pix copia e cola. O devedor paga na hora e manda o comprovante, e eu confirmo.';
 if(/spc|serasa|negativ|limpar nome/.test(t))return 'Quem nao paga pode ser incluido no SPC ou Serasa; quem paga e retirado apos a validacao do financeiro.';
 if(/oi|ola|bom dia|boa tarde|boa noite|tudo bem|quem e voce/.test(t))return 'Oi! Eu sou o assistente da RECUPERA.AI. Pergunta o que quiser sobre sua recuperacao ou sobre como o sistema funciona.';
 return 'Posso explicar como o sistema funciona, dizer quanto recuperei, quantos pagaram, ou abrir a recarga. E so pedir!';
}
function falarRobo(){
 var p=prompt('Fala comigo! Ex: "quanto ja recuperei?", "quantos pagaram?", "meus creditos", "abrir recarga"');
 if(p===null)return;
 if(!p.trim()){dizer('Oi! Eu sou o assistente da RECUPERA ponto AI, pronto pra recuperar seu dinheiro no automatico.');return;}
 var t=p.toLowerCase();
 if(/recarga|comprar credito|creditos?/.test(t)&&/abrir|ir|quero|comprar|ver/.test(t)){go('recarga');dizer('Abrindo a recarga de creditos pra voce.');return;}
 if(/enviar|cadastrar|mandar devedor|novo devedor/.test(t)){go('enviar');dizer('Abrindo a tela de enviar devedor.');return;}
 var r=respAssist(p);toast(r,true);dizer(r);
}
function toggleSide(){document.getElementById('app').classList.toggle('recolhido');}
function bg(){var c=document.getElementById('tcanvas');if(!c||(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches))return;var x=c.getContext('2d');
 function rs(){c.width=c.offsetWidth;c.height=c.offsetHeight;}rs();window.addEventListener('resize',rs);
 var P=[];for(var i=0;i<40;i++)P.push({x:Math.random(),y:Math.random(),v:.0003+Math.random()*.0005,r:.7+Math.random()*1.8,a:.3+Math.random()*.5});var t=0;
 function loop(){t+=.015;x.clearRect(0,0,c.width,c.height);
  for(var g=0;g<4;g++){x.strokeStyle=g%2?'rgba(90,242,192,.16)':'rgba(150,190,255,.2)';x.beginPath();var yy=c.height*(.25+g*.18);x.moveTo(0,yy);for(var xx=0;xx<=c.width;xx+=28)x.lineTo(xx,yy-Math.sin(xx*.012+g+t)*8);x.stroke();}
  P.forEach(function(p){p.x+=p.v*c.width;if(p.x>1.05)p.x=-.05;x.fillStyle='rgba(170,205,255,'+p.a+')';x.beginPath();x.arc(p.x*c.width,p.y*c.height,p.r,0,6.283);x.fill();});
  requestAnimationFrame(loop);}loop();}
document.addEventListener('DOMContentLoaded',function(){bg();paint();
 try{fetch('/api/agente').then(function(r){return r.ok?r.json():null;}).then(function(s){
  if(s&&s.empresa){for(var k in s)AG[k]=s[k];AG.tg=Object.assign({},AG_DEF.tg,s.tg||{});if(VIEW==='agente')rAgente();}
 }).catch(function(){});}catch(e){}
});
`;

export function paginaClienteHTML(dados, clienteNome = 'CDL Campo Grande') {
  const nav = [
    ['visao', '&#8962;', 'Visao Geral'], ['agente', '&#129302;', 'Agente IA'],
    ['recarga', '&#128179;', 'Recarga de Creditos'],
    ['enviar', '&#10133;', 'Enviar Devedor'],
    ['meus', '&#128101;', 'Meus Devedores'], ['validar', '&#9989;', 'Validar Pagamentos'],
    ['spc', '&#127991;', 'SPC / Serasa'], ['parcelas', '&#128197;', 'Parcelamentos'],
    ['relatorios', '&#128202;', 'Relatorios'],
  ];
  const navHTML = (cls) => nav.map(([v, ic, tx], i) =>
    `<a data-nav="${v}" class="${i === 0 ? 'active' : ''}" onclick="go('${v}')"><span class="ic">${ic}</span><span class="tx">${tx}</span></a>`).join('');
  const secs = nav.map(([v]) => `<section data-view="${v}" id="v-${v}"${v === 'visao' ? '' : ' hidden'}></section>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Portal do Cliente — CDL RECUPERA</title><style>${CSS}${CSS_CLI}</style></head><body>
<div class="app" id="app">
  <aside class="sidebar"><nav class="nav">${navHTML()}
      <a class="switchlink" href="central.html"><span class="ic">&#128736;</span><span class="tx">Painel do Agente &#8599;</span></a></nav>
    <div class="side-foot">Camara de Dirigentes Lojistas<br>de Campo Grande / MS</div></aside>
  <div class="main">
    <header class="topbar"><canvas id="tcanvas"></canvas>
      <button class="burger" onclick="toggleSide()">&#9776;</button>
      <div class="hlogo">${LOGO}${LOGO_IMG ? '' : '<div class="bt"><b>CDL RECUPERA</b><span>Portal do Cliente</span></div>'}</div>
      <div class="tagline">Sua recuperacao, <b>transparente</b></div>
      <div class="top-right"><div class="online"><span class="p"></span><span>Cobranca ativa</span></div>
        <div class="user"><div class="avatar">C</div><div class="un"><b>${clienteNome}</b><br><span>Portal do Cliente</span></div></div></div>
    </header>
    <main class="content">${secs}</main>
    <footer class="rodape"><b>${clienteNome}</b> · CNPJ 03.962.883/0001-09 · (67) 3320-4000
      <div class="chips"><span>Seguranca</span><span>Transparencia</span><span>Resultados</span></div>
      <span class="con">● Conectado</span></footer>
  </div>
  <nav class="bottomnav">
    <a data-nav="visao" class="active" onclick="go('visao')"><span class="ic">&#8962;</span>Visao</a>
    <a data-nav="agente" onclick="go('agente')"><span class="ic">&#129302;</span>Agente</a>
    <a data-nav="recarga" onclick="go('recarga')"><span class="ic">&#128179;</span>Recarga</a>
    <a data-nav="enviar" onclick="go('enviar')"><span class="ic">&#10133;</span>Enviar</a>
    <a data-nav="meus" onclick="go('meus')"><span class="ic">&#128101;</span>Devedores</a>
  </nav>
</div>
<div class="modal" id="modal"><div class="modalbox" id="modalbody"></div></div>
<div class="toast" id="toast"></div>
<script>
var DADOS=${JSON.stringify(dados)};
var CLIENTE_NOME=${JSON.stringify(clienteNome)};
var ROBO_M=${JSON.stringify(ROBO)};
var ROBO_IMG=${ROBO.startsWith('<img')};
${CLIENTE}
</script></body></html>`;
}
