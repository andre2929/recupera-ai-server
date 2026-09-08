// PORTAL DO CLIENTE (credor/recebedor) — RECUPERA.AI.
// Ele envia inadimplentes p/ cobranca, acompanha, valida pagamento no financeiro,
// pede inclusao/retirada SPC/Serasa, ve parcelamentos, metricas, graficos e o
// historico de conversa. Reusa a identidade visual do painel do agente.
import { CSS, LOGO, ROBO } from './painel-ui.js';

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
 ({visao:rVisao,enviar:rEnviar,meus:rMeus,validar:rValidar,spc:rSpc,parcelas:rParcelas,relatorios:rRel}[VIEW]||function(){})();
}
function kpi(n,l,cls){return '<div class="kpi"><div class="ki '+(cls||'b1')+'">'+'</div><div><div class="n">'+n+'</div><div class="l">'+l+'</div></div></div>';}

/* VISAO GERAL */
function rVisao(){
 var a=all();var rec=a.filter(pago);var recV=rec.reduce(function(s,d){return s+valorDe(d);},0);
 var cob=a.filter(function(d){return grp(d)==='fila'||grp(d)==='neg';}).length;
 var pend=a.filter(pendValid).length;
 var taxa=a.length?Math.round(100*rec.length/a.length):0;
 var tot=a.reduce(function(s,d){return s+d.valor;},0);var ticket=a.length?tot/a.length:0;
 var h='<div class="banner"><div class="bot">'+(ROBO_IMG?'<div class="mascote">'+ROBO_M+'<span class="lid"></span></div>':ROBO_M)+'</div>'+
  '<div><h2>Bem-vindo ao seu Portal RECUPERA.AI</h2><p>Envie seus inadimplentes, acompanhe a recuperacao em tempo real e valide os pagamentos direto com seu financeiro.</p></div>'+
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

/* CONVERSA (modal) */
function conversa(id){var d=byId(id);var m=document.getElementById('modal');
 var msgs=d.mensagens||[],first=true;
 var corpo=msgs.length?msgs.map(function(x){var au=false;if(x.direcao==='saida'&&first){au=true;first=false;}
  if(au)return '<div class="msg saida"><div class="h">RECUPERA.AI &#129302; &middot; audio</div><div class="voz"><button class="play">&#9654;</button><div class="wave">'+wave()+'</div><span class="dur">&#128266; voz</span></div></div>';
  return '<div class="msg '+x.direcao+'"><div class="h">'+(x.direcao==='saida'?'RECUPERA.AI &#129302;':esc(d.nome.split(' ')[0]))+'</div>'+esc(x.texto)+'</div>';}).join(''):'<div class="emptybox">Sem conversa registrada ainda.</div>';
 document.getElementById('modalbody').innerHTML='<div class="mh"><div class="chead"><div class="av" style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#1f9d57,#00b389);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700">'+d.nome.charAt(0)+'</div></div><div><b>'+esc(d.nome)+'</b><br><span style="font-size:11.5px;color:#5b6b82">'+money(valorDe(d))+' &middot; '+esc(d.credor||'')+'</span></div><span class="x" onclick="fechar()">&times;</span></div><div class="chat" style="max-height:60vh">'+corpo+'</div>';
 m.classList.add('on');
}
function wave(){var b='';for(var i=0;i<20;i++)b+='<i style="height:'+(20+Math.round(Math.abs(Math.sin(i*1.3))*70))+'%"></i>';return b;}
function fechar(){document.getElementById('modal').classList.remove('on');}

/* TOAST */
var _tt;
function toast(msg,ok){var t=document.getElementById('toast');t.className='toast on'+(ok?' ok':'');t.innerHTML=(ok?'&#9989; ':'&#9888; ')+esc(msg);clearTimeout(_tt);_tt=setTimeout(function(){t.className='toast';},3200);}
function toggleSide(){document.getElementById('app').classList.toggle('recolhido');}
function bg(){var c=document.getElementById('tcanvas');if(!c||(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches))return;var x=c.getContext('2d');
 function rs(){c.width=c.offsetWidth;c.height=c.offsetHeight;}rs();window.addEventListener('resize',rs);
 var P=[];for(var i=0;i<40;i++)P.push({x:Math.random(),y:Math.random(),v:.0003+Math.random()*.0005,r:.7+Math.random()*1.8,a:.3+Math.random()*.5});var t=0;
 function loop(){t+=.015;x.clearRect(0,0,c.width,c.height);
  for(var g=0;g<4;g++){x.strokeStyle=g%2?'rgba(90,242,192,.16)':'rgba(150,190,255,.2)';x.beginPath();var yy=c.height*(.25+g*.18);x.moveTo(0,yy);for(var xx=0;xx<=c.width;xx+=28)x.lineTo(xx,yy-Math.sin(xx*.012+g+t)*8);x.stroke();}
  P.forEach(function(p){p.x+=p.v*c.width;if(p.x>1.05)p.x=-.05;x.fillStyle='rgba(170,205,255,'+p.a+')';x.beginPath();x.arc(p.x*c.width,p.y*c.height,p.r,0,6.283);x.fill();});
  requestAnimationFrame(loop);}loop();}
document.addEventListener('DOMContentLoaded',function(){bg();paint();});
`;

export function paginaClienteHTML(dados, clienteNome = 'Comercio Demonstracao LTDA') {
  const nav = [
    ['visao', '&#8962;', 'Visao Geral'], ['enviar', '&#10133;', 'Enviar Devedor'],
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
    <div class="side-foot">Portal do Cliente<br>CDL RECUPERA</div></aside>
  <div class="main">
    <header class="topbar"><canvas id="tcanvas"></canvas>
      <button class="burger" onclick="toggleSide()">&#9776;</button>
      <div class="hlogo">${LOGO}<div class="bt"><b>CDL RECUPERA</b><span>Portal do Cliente</span></div></div>
      <div class="tagline">Sua recuperacao, <b>transparente</b></div>
      <div class="top-right"><div class="online"><span class="p"></span><span>Cobranca ativa</span></div>
        <div class="user"><div class="avatar">${clienteNome.charAt(0)}</div><div class="un"><b>${clienteNome}</b><br><span>Cliente</span></div></div></div>
    </header>
    <main class="content">${secs}</main>
    <footer class="rodape"><b>CDL RECUPERA</b> · Portal do Cliente
      <div class="chips"><span>Seguranca</span><span>Transparencia</span><span>Resultados</span></div>
      <span class="con">● Conectado</span></footer>
  </div>
  <nav class="bottomnav">
    <a data-nav="visao" class="active" onclick="go('visao')"><span class="ic">&#8962;</span>Visao</a>
    <a data-nav="enviar" onclick="go('enviar')"><span class="ic">&#10133;</span>Enviar</a>
    <a data-nav="meus" onclick="go('meus')"><span class="ic">&#128101;</span>Devedores</a>
    <a data-nav="validar" onclick="go('validar')"><span class="ic">&#9989;</span>Validar</a>
    <a data-nav="spc" onclick="go('spc')"><span class="ic">&#127991;</span>SPC</a>
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
