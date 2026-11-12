(function(){
  var $=function(id){return document.getElementById(id)};
  var fmt=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'});
  var fmtP=new Intl.NumberFormat('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
  var eur=function(v){return fmt.format(Math.round(v*100)/100)};
  var num=function(id){var v=parseFloat($(id).value);return isFinite(v)?v:0};
  var sign=function(v){return (v>0?'+':'')+eur(v)};
  var lastN=null,S={};
  function buildTable(){var d=$('dlg');if(!d.open||!S.n)return;var h='<thead><tr><th>Mes</th><th>Cuota</th><th>Intereses</th><th>Capital</th><th>Pendiente</th></tr></thead><tbody>',b=S.P;for(var m=1;m<=S.n;m++){var it=b*S.i,pay=S.cuota+(m===S.n?S.fin:0),cp=pay-it;b-=cp;h+='<tr'+(m===S.k?' class="cur"':'')+'><td>'+m+'</td><td>'+eur(pay)+'</td><td>'+eur(it)+'</td><td>'+eur(cp)+'</td><td>'+eur(Math.max(0,b))+'</td></tr>'}$('tbl').innerHTML=h+'</tbody>'}
  $('openTable').addEventListener('click',function(){$('dlg').showModal();buildTable();var c=$('dlg').querySelector('tr.cur');if(c)c.scrollIntoView({block:'center'})});
  $('closeDlg').addEventListener('click',function(){$('dlg').close()});
  $('dlg').addEventListener('click',function(e){if(e.target===this)this.close()});

  function calc(){
    var pFin=num('pFin'),pCon=num('pCon'),ent=num('ent'),
        n=Math.max(1,Math.round(num('mes'))),tin=num('tin')/100,ap=num('ap')/100,com=num('com')/100,fin=Math.max(0,num('fin')),err='';
    if(ent>pFin){err='La entrada no puede superar el precio financiado.';ent=pFin;}
    $('err').textContent=err;
    var P=Math.max(0,pFin-ent);if(fin>P){err=err||'La cuota final no puede superar el importe del préstamo.';fin=P;}$('err').textContent=err;
    var i=tin/12,fee=P*ap;
    var cuota=i===0?(P-fin)/n:(P-fin/Math.pow(1+i,n))*i/(1-Math.pow(1+i,-n));var f=function(r){var s=0,v=1;for(var t=1;t<=n;t++){v/=1+r;s+=cuota*v}return s+fin*v-(P-fee)},r=0;if(P>0&&f(0)>0){var lo=0,hi=1;for(var q=0;q<60;q++){r=(lo+hi)/2;if(f(r)>0)lo=r;else hi=r}}var tae=Math.pow(1+r,12)-1;
    var bal=function(m){if(m>=n)return fin;var b=i===0?P-cuota*m:P*Math.pow(1+i,m)-cuota*(Math.pow(1+i,m)-1)/i;return Math.max(0,b)};

    var sl=$('cancel');
    if(lastN!==n){
      var prev=parseInt(sl.value,10)||0;
      sl.max=n;sl.value=lastN===null?Math.min(24,n):Math.min(prev,n);lastN=n;
    }
    var k=Math.min(parseInt(sl.value,10)||0,n);
    sl.style.setProperty('--p',(k/n*100)+'%');

    var pend=bal(k),comision=k>=n?0:pend*com;
    var totK=ent+fee+cuota*n+fin,totC=ent+fee+cuota*k+pend+comision,ahorro=totK-totC;

    $('cap').textContent=eur(P);
    $('fTin').textContent=fmtP.format(tin*100)+' %';
    $('fTae').textContent=fmtP.format(tae*100)+' %';
    $('fFin').textContent=eur(fin);
    $('fAp').textContent=eur(fee);
    $('fTot').textContent=eur(cuota*n+fin+fee);
    $('fCoste').textContent=eur(cuota*n+fin+fee-P);
    $('cuota').textContent=eur(cuota);
    $('tickEnd').textContent='Mes '+n;
    $('mesLbl').textContent=k;
    var sliderWidth=sl.getBoundingClientRect().width;
    $('mesLbl').style.left=(14+Math.max(0,sliderWidth-28)*(k/n))+'px';
    var big=$('ahorro');
    big.textContent=eur(ahorro);
    big.className='big'+(ahorro>0.005?' pos':'');
    var lbl=$('ahorroLbl');if(lbl)lbl.className='eyebrow'+(ahorro>0.005?'':' muted');
    var extraC=totC-pCon,less=extraC<=0.005;
    var hx=$('heroExtra');if(hx)hx.textContent=eur(Math.abs(extraC));
    var hxf=$('heroExtraFin');if(hxf)hxf.textContent=sign(totC-pFin);
    var hxb=$('heroExtraBox');if(hxb)hxb.className='hero-extra'+(less?' pos':'');
    var hxl=$('heroExtraLbl');if(hxl)hxl.textContent=less?'Pagas menos que al contado':'Pagas de más que al contado';
    $('ahorroTxt').textContent=k>=n?'No hay cancelación anticipada: pagas el préstamo completo.'
      :ahorro>0.005?'de ahorro por cancelar antes de llegar al mes '+n+'.'
      :'Aquí la comisión pesa más que los intereses que te ahorras.';

    $('pend').textContent=eur(pend);
    $('pendTxt').textContent=k===0?'Todo lo financiado':k>=n?(pend===0?'Préstamo liquidado':'Es la cuota final'):'Tras la cuota del mes '+k;
    $('comis').textContent=eur(comision);
    $('comisTxt').textContent=fmtP.format(com*100)+' % del capital pendiente';
    var pct=P>0?(1-pend/P):1;
    $('pagadas').textContent=Math.round(pct*100)+' %';
    $('pagadasTxt').textContent=eur(P-pend)+' de capital devuelto';
    $('ringArc').setAttribute('stroke-dasharray',(pct*131.9)+' 132');

    /* gráfico de capital pendiente */
    var bb=$('chart').getBoundingClientRect(),W=Math.max(300,Math.round(bb.width)||640),H=Math.max(200,Math.round(bb.height)||210),L=8,R=8,T=18,B=28,iw=W-L-R,ih=H-T-B;$('chart').setAttribute('viewBox','0 0 '+W+' '+H);
    var x=function(m){return L+m/n*iw},y=function(v){return T+(P>0?(1-v/P):1)*ih};
    var step=Math.max(1,Math.ceil(n/120)),pts=[];
    for(var m=0;m<=n;m+=step)pts.push([m,bal(m)]);
    if(pts[pts.length-1][0]!==n)pts.push([n,fin]);
    var line=pts.map(function(p,j){return (j?'L':'M')+x(p[0]).toFixed(1)+' '+y(p[1]).toFixed(1)}).join('');
    var done=pts.filter(function(p){return p[0]<=k});
    if(done[done.length-1][0]!==k)done.push([k,pend]);
    var area=done.map(function(p,j){return (j?'L':'M')+x(p[0]).toFixed(1)+' '+y(p[1]).toFixed(1)}).join('')+'L'+x(k).toFixed(1)+' '+y(0)+'L'+x(0)+' '+y(0)+'Z';
    var cx=x(k),cy=y(pend),anchor=k>n*.7?'end':k<n*.15?'start':'middle';
    var lx=anchor==='end'?cx-10:anchor==='start'?cx+10:cx;
    $('chart').innerHTML=
      '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4ff" stop-opacity=".45"/><stop offset="1" stop-color="#7cc4ff" stop-opacity=".05"/></linearGradient><linearGradient id="g2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#5fd3a0" stop-opacity=".08"/><stop offset="1" stop-color="#5fd3a0" stop-opacity=".4"/></linearGradient></defs>'+
      '<path d="'+line+'" fill="none" stroke="#4a5a7a" stroke-width="2" stroke-dasharray="4 4"/>'+
      '<path d="'+area+'" fill="url(#g)"/>'+
      '<path d="M'+x(0)+' '+y(P)+'L'+cx+' '+y(P)+done.slice().reverse().map(function(p){return 'L'+x(p[0]).toFixed(1)+' '+y(p[1]).toFixed(1)}).join('')+'Z" fill="url(#g2)"/>'+
      '<path d="'+done.map(function(p,j){return (j?'L':'M')+x(p[0]).toFixed(1)+' '+y(p[1]).toFixed(1)}).join('')+'" fill="none" stroke="#7cc4ff" stroke-width="3" stroke-linejoin="round"/>'+
      (k<n?'<line x1="'+cx+'" y1="'+cy+'" x2="'+cx+'" y2="'+y(0)+'" stroke="#7cc4ff" stroke-dasharray="3 3"/>':'')+
      '<line x1="'+L+'" y1="'+y(0)+'" x2="'+(W-R)+'" y2="'+y(0)+'" stroke="#2a3550"/>'+
      '<circle cx="'+cx+'" cy="'+cy+'" r="7" fill="#e9edf6" stroke="#7cc4ff" stroke-width="4"/>'+
      (function(){var ss=function(v){v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};var lbl=function(t,my,c){var w=t.length*7.4+18,a=.5+.5*ss(1-((W-R)-cx)/w)-.5*ss(1-(cx-L)/w),rx=cx-w*a;return '<rect x="'+rx+'" y="'+(my-12)+'" width="'+w+'" height="24" rx="7" fill="#0f1420" fill-opacity=".4" stroke="#2a3550" stroke-opacity=".5"/><text x="'+(rx+w/2)+'" y="'+(my+4.5)+'" text-anchor="middle" style="fill:'+c+';font-weight:700;font-size:13px">'+t+'</text>'};var hp=cy-y(P),dy=Math.max(2,Math.abs(y(bal(Math.min(n,k+1)))-y(bal(Math.max(0,k-1))))/2),w3=dy*3,s=ss((hp-(34-w3/2))/w3),py=(cy+26)*(1-s)+((y(P)+cy)/2)*s;var pagado=lbl('Pagado '+eur(P-pend),py,'#5fd3a0');var espacioAbajo=y(0)-cy,tP=1-ss((espacioAbajo-(34-w3/2))/w3),pyPend=(cy+y(0))/2-34*tP;var pendiente=lbl('Pendiente '+eur(pend),pyPend,'#7cc4ff');return pagado+pendiente})()+
      '<text x="'+L+'" y="'+(H-8)+'">Mes 0</text><text x="'+(W-R)+'" y="'+(H-8)+'" text-anchor="end">Mes '+n+'</text>';

    /* barras de coste, misma escala */
    var max=Math.max(totK,totC,pFin,pCon,1)*1.02,pc=function(v){return (v/max*100)+'%'};
    var bar=function(tot){var base=Math.min(tot,pCon),ex=Math.max(0,tot-pCon);
      return '<i class="b-base" style="width:'+pc(base)+'"></i><i class="b-red" style="width:'+pc(ex)+'"></i>'};
    $('trC').innerHTML=bar(totC);$('trK').innerHTML=bar(totK);
    var sc=$('scale'),sw=sc.getBoundingClientRect().width||300;
    var xCon=Math.max(0,Math.min(sw,pCon/max*sw));
    sc.innerHTML='<span class="tick" style="left:'+xCon.toFixed(1)+'px"></span><span class="mark">Contado '+eur(pCon)+'</span>';
    var mk=sc.querySelector('.mark'),mw=mk.getBoundingClientRect().width||120;
    mk.style.left=Math.max(mw/2,Math.min(sw-mw/2,xCon)).toFixed(1)+'px';
    $('hCancel').textContent=k>=n?'Sin cancelar':'Cancelando en el mes '+k;
    $('totC').textContent=eur(totC);$('totK').textContent=eur(totK);
    $('exCC').textContent=sign(totC-pCon);$('exFC').textContent=sign(totC-pFin);

    S={P:P,i:i,cuota:cuota,fin:fin,n:n,k:k};buildTable();
    $('exFK').textContent=sign(totK-pFin);
    $('exCK').textContent=sign(totK-pCon);
  }
  ['pFin','pCon','ent','mes','tin','ap','fin','com','cancel'].forEach(function(id){$(id).addEventListener('input',calc)});
  calc();
  if(window.ResizeObserver)new ResizeObserver(function(){calc()}).observe($('chart'));else window.addEventListener('resize',calc);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){calc()});
})();
