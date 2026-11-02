/* Automatic email notifications for approvals (Manager, CEO and anyone else) */
/* ===== TEACH Comms: automatic email notifications for approvals ===== */
(function(){
  var KEY='teach-comm-notify',H=document.documentElement;
  function $(id){return document.getElementById(id);}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function say(m){try{notify(m);}catch(e){}}
  function lg(a,t,d){try{if(window.logActivity)window.logActivity('Approvals',a,t,d||'');}catch(e){}}
  function isEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}

  /* ---------- settings (saved in this browser) ---------- */
  var cfg=(function(){var d={on:true,service:'',template:'',key:'',fallback:true};
    try{var o=JSON.parse(localStorage.getItem(KEY)||'null');if(o)Object.keys(d).forEach(function(k){if(o[k]!==undefined)d[k]=o[k];});}catch(e){}
    var C=(window.TEACH_CONFIG||{}).emailjs||{};
    if(!d.service)d.service=C.serviceId||'';if(!d.template)d.template=C.templateId||'';if(!d.key)d.key=C.publicKey||'';
    return d;})();
  function saveCfg(){try{localStorage.setItem(KEY,JSON.stringify(cfg));}catch(e){}}
  function ready(){return !!(cfg.service&&cfg.template&&cfg.key);}

  /* ---------- who is who (read from Team Access) ---------- */
  function access(){try{if(window.teachAccessState)return window.teachAccessState()||{};return JSON.parse(localStorage.getItem('teach-comm-access')||'null')||{};}catch(e){return {};}}
  function admins(){return (access().people||[]).filter(function(p){return p.role==='admin';}).map(function(p){return String(p.email).toLowerCase();});}
  function nameOf(email){var p=(access().people||[]).filter(function(x){return String(x.email).toLowerCase()===email;})[0];return p?p.name:email.split('@')[0];}
  function meEmail(){return window.teachUser?String(window.teachUser.email).toLowerCase():'';}

  /* ---------- link that carries the item, so it opens on the approver's own device ---------- */
  var FIELDS=['id','title','type','status','stage','submittedBy','submittedByEmail','updated','feedback','managerBy','ceoBy','changesBy','managerEmail','ceoEmail','notifyCc','_ts'];
  window.teachItemHash=function(it){
    try{var o={};FIELDS.forEach(function(f){if(it[f]!==undefined&&it[f]!=='')o[f]=it[f];});
      return '#apr='+encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(o)))));}catch(e){return '';}
  };
  function importFromLink(){
    var h=location.hash;if(h.indexOf('#apr=')!==0)return;
    var o=null;try{o=JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(h.slice(5))))));}catch(e){}
    try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}
    if(!o||!o.id||!o.title)return;
    var ex=approvals.filter(function(a){return a.id===o.id;})[0];
    if(ex){if((o._ts||0)>=(ex._ts||0))Object.keys(o).forEach(function(k){ex[k]=o[k];});}
    else approvals.unshift(o);
    seen[o.id]=o.status;
    saveApprovals();renderApprovals();
    var role=o.status==='Pending Manager Review'?'manager':(o.status==='Manager Approved'||o.status==='Pending CEO Approval')?'ceo':'staff';
    function open(){var s=$('approvalRole');if(s){s.value=role;renderApprovals();}try{showView('approvals');}catch(e){}say('Opened “'+o.title+'” from your email link.');}
    if(H.classList.contains('authed'))open();
    else{var mo=new MutationObserver(function(){if(H.classList.contains('authed')){mo.disconnect();setTimeout(open,0);}});mo.observe(H,{attributes:true,attributeFilter:['class']});}
  }

  /* ---------- the bar shown after a notification ---------- */
  function bar(html){
    var b=$('nfBar');
    if(!b){b=document.createElement('div');b.id='nfBar';b.setAttribute('role','status');b.setAttribute('aria-live','polite');document.body.appendChild(b);
      b.addEventListener('click',function(e){if(e.target.closest('[data-nf-close]'))b.hidden=true;});}
    b.innerHTML=html+' <button type="button" class="outline" data-nf-close="1">Close</button>';b.hidden=false;
    clearTimeout(bar.t);bar.t=setTimeout(function(){b.hidden=true;},20000);
  }
  function mailtoHref(to,subject,body,cc){return 'mailto:'+to+'?'+(cc?'cc='+cc+'&':'')+'subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);}

  function pretty(email){var p=(access().people||[]).filter(function(x){return String(x.email).toLowerCase()===email;})[0];
    return p?p.name:email.split('@')[0].split(/[._-]+/).filter(Boolean).map(function(w){return w.charAt(0).toUpperCase()+w.slice(1);}).join(' ');}

  /* ---------- who to email: Manager, CEO and anyone else (boxes on the Approvals page) ---------- */
  var LAST='teach-comm-notify-last',pending=null,mIn=$('approvalMgrEmail'),cIn=$('approvalCeoEmail'),ccIn=$('approvalCc'),subBtn=$('submitApproval'),CFG=window.TEACH_CONFIG||{};
  function parseList(v){return String(v||'').split(/[\s,;]+/).map(function(x){return x.trim().toLowerCase();}).filter(Boolean);}
  function uniq(a){return a.filter(function(v,i){return a.indexOf(v)===i;});}
  if(mIn&&cIn&&ccIn){
    var L={};try{L=JSON.parse(localStorage.getItem(LAST)||'{}')||{};}catch(e){}
    mIn.value=L.m||CFG.defaultManager||'';cIn.value=L.c||CFG.defaultCeo||'';ccIn.value=L.cc||'';
    if(subBtn)subBtn.addEventListener('click',function(e){
      var m=mIn.value.trim().toLowerCase(),c=cIn.value.trim().toLowerCase(),cc=uniq(parseList(ccIn.value)),bad=null,x;
      if(m&&!isEmail(m))bad=[mIn,'the Manager'];
      else if(c&&!isEmail(c))bad=[cIn,'the CEO'];
      else{x=cc.filter(function(v){return !isEmail(v);})[0];if(x)bad=[ccIn,'“'+x+'”'];}
      if(bad){e.stopImmediatePropagation();e.preventDefault();bad[0].focus();say('Please check the email address for '+bad[1]+'. Example: name@teachedu.in');return;}
      pending={m:m,c:c,cc:cc.join(',')};
      try{localStorage.setItem(LAST,JSON.stringify({m:m,c:c,cc:ccIn.value.trim()}));}catch(x2){}
      setTimeout(function(){pending=null;},0);
    },true);
  }

  /* ---------- sending ---------- */
  function sendEmailJS(to,c,a,link){
    return fetch('https://api.emailjs.com/api/v1.0/email/send',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({service_id:cfg.service,template_id:cfg.template,user_id:cfg.key,template_params:{
        to_email:to,to_name:nameOf(to),subject:c.subject,message:c.body,item_title:a.title,item_type:a.type,status:a.status,
        from_name:(window.teachUser&&window.teachUser.name)||'TEACH Communication',reply_to:meEmail(),app_link:link}})
    }).then(function(r){return r.text().then(function(t){if(!r.ok)throw new Error(t||('Error '+r.status));return true;});});
  }
  function personal(c,email,isCc){
    var b=c.body.replace(/^Hello [^,\n]*,/,'Hello '+pretty(email).split(' ')[0]+',');
    if(isCc)b=b.replace(/^(Hello [^\n]*\n)/,'$1\n(For your information: you were copied on this approval.)\n');
    return {subject:c.subject,body:b};
  }
  function deliver(a,c,primary,cc){
    var link=location.href.split('#')[0]+window.teachItemHash(a);
    var all=primary.concat(cc.filter(function(x){return primary.indexOf(x)===-1;})),label=all.join(', ');
    function fallback(why){
      if(!cfg.fallback){say('Email could not be sent'+(why?': '+why:'')+'.');return;}
      var m=personal(c,primary[0],false),href=mailtoHref(primary.join(','),m.subject,m.body,cc.join(','));
      try{var l=document.createElement('a');l.href=href;l.style.display='none';document.body.appendChild(l);l.click();l.remove();}catch(e){}
      bar('✉ '+(why?esc(why)+' ':'')+'Email to <b>'+esc(label)+'</b> is ready. <a class="request-btn" href="'+esc(href)+'">Open email</a>');
      lg('Email prepared',a.title,'To '+label);
    }
    if(ready()){
      Promise.all(all.map(function(r){return sendEmailJS(r,personal(c,r,primary.indexOf(r)===-1),a,link);})).then(function(){
        lg('Email sent automatically',a.title,'To '+label);say('Email sent to '+label+'.');
        bar('✅ Email sent to <b>'+esc(label)+'</b> about “'+esc(a.title)+'”.');
      }).catch(function(err){fallback('Automatic email failed ('+String(err.message||err).slice(0,80)+').');});
    }else fallback('');
  }
  function trigger(a){
    if(!cfg.on||!window.teachApprovalCompose)return;
    var c=window.teachApprovalCompose(a);if(!c)return;
    var st=a.status,own=st==='Pending Manager Review'?a.managerEmail:(st==='Manager Approved'||st==='Pending CEO Approval')?a.ceoEmail:'';
    var explicit=isEmail(String(own||'').toLowerCase());
    var list=explicit?[String(own).toLowerCase()]:parseList(c.to).filter(isEmail);
    if(!list.length)list=admins();
    var me=meEmail();if(!explicit)list=uniq(list).filter(function(x){return x!==me;});
    var cc=uniq(parseList(a.notifyCc).filter(isEmail)).filter(function(x){return x!==me&&list.indexOf(x)===-1;});
    if(!list.length&&!cc.length){say('No email needed: the next person is you.');return;}
    if(!list.length){list=cc;cc=[];}
    deliver(a,c,list,cc);
  }

  /* ---------- watch for new items and status changes ---------- */
  var seen={};try{approvals.forEach(function(a){seen[a.id]=a.status;});}catch(e){}
  var _save=saveApprovals;
  saveApprovals=function(){
    var r=_save.apply(this,arguments),changed=[];
    try{approvals.forEach(function(a){if(seen[a.id]===a.status)return;if(seen[a.id]===undefined&&pending&&a.status==='Pending Manager Review'){if(pending.m)a.managerEmail=pending.m;if(pending.c)a.ceoEmail=pending.c;if(pending.cc)a.notifyCc=pending.cc;}seen[a.id]=a.status;a._ts=Date.now();changed.push(a);});
      if(changed.length){_save.call(this);changed.forEach(trigger);}}catch(e){console.error(e);}
    try{renderWait();}catch(e){}
    return r;
  };

  /* ---------- "waiting for you" notice on the Approvals page ---------- */
  function renderWait(){
    var host=$('approvalCards');if(!host)return;
    var w=$('nfWait');if(!w){w=document.createElement('div');w.id='nfWait';w.className='nf-wait';w.setAttribute('role','status');host.parentNode.insertBefore(w,host);}
    var me=meEmail(),ac=access(),ap=ac.approvers||{},mine=(ac.people||[]).filter(function(p){return String(p.email).toLowerCase()===me;})[0];
    var isAdmin=mine&&mine.role==='admin',parts=[];
    if(me){
      var mine=function(a,own,set){var o=String(own||'').toLowerCase();return o?o===me:((set&&set===me)||(!set&&isAdmin));};
      var m=approvals.filter(function(a){return a.status==='Pending Manager Review'&&mine(a,a.managerEmail,ap.manager);}).length;
      var c=approvals.filter(function(a){return (a.status==='Manager Approved'||a.status==='Pending CEO Approval')&&mine(a,a.ceoEmail,ap.ceo);}).length;
      var ch=approvals.filter(function(a){return a.status==='Needs Changes'&&String(a.submittedByEmail||'').toLowerCase()===me;}).length;
      if(m)parts.push(m+' waiting for your <b>Manager</b> approval');
      if(c)parts.push(c+' waiting for your <b>CEO</b> final approval');
      if(ch)parts.push(ch+' sent back to you with <b>changes requested</b>');
    }
    w.hidden=!parts.length;w.innerHTML=parts.length?'🔔 '+parts.join(' · '):'';
  }
  var ac=$('approvalCards');if(ac)new MutationObserver(function(){try{renderWait();}catch(e){}}).observe(ac,{childList:true});
  new MutationObserver(function(){try{renderWait();}catch(e){}}).observe(H,{attributes:true,attributeFilter:['class']});

  /* ---------- settings box on Team Access ---------- */
  function paintCfg(){
    if(!$('nfOn'))return;
    $('nfOn').checked=!!cfg.on;$('nfFallback').checked=!!cfg.fallback;
    if(document.activeElement!==$('nfService'))$('nfService').value=cfg.service;
    if(document.activeElement!==$('nfTemplate'))$('nfTemplate').value=cfg.template;
    if(document.activeElement!==$('nfKey'))$('nfKey').value=cfg.key;
    $('nfState').innerHTML=!cfg.on?'Notifications are <b>off</b>.':ready()?'✅ <b>Automatic sending is on.</b> Emails go out by themselves the moment someone submits or decides.':'⚠ Not connected yet. Until you add the 3 EmailJS codes, your email app opens with the message ready to send.';
  }
  function msg(t,ok){var m=$('nfMsg');if(!m)return;m.textContent=t;m.className='acc-msg'+(ok?' ok':'');}
  if($('nfSave')){
    $('nfSave').addEventListener('click',function(){
      if(window.teachRole==='viewer')return msg('View-only people cannot change this.');
      cfg.on=$('nfOn').checked;cfg.fallback=$('nfFallback').checked;
      cfg.service=$('nfService').value.trim();cfg.template=$('nfTemplate').value.trim();cfg.key=$('nfKey').value.trim();
      saveCfg();paintCfg();lg('Changed setting','Email notifications',cfg.on?(ready()?'On · automatic':'On · email app'):'Off');msg('Saved.',true);
    });
    $('nfTest').addEventListener('click',function(){
      var me=meEmail();if(!me)return msg('Please sign in first.');
      var a={id:'test',title:'Test notification',type:'Test',status:'Pending Manager Review',submittedBy:(window.teachUser||{}).name||''};
      var c={subject:'Test: TEACH Communication email notifications',body:'Hello,\n\nThis is a test message from TEACH Communication. If you can read this, approval emails are working.\n\nThank you.'};
      msg('Sending test…',true);
      if(ready())sendEmailJS(me,c,a,location.href.split('#')[0]).then(function(){msg('Test email sent to '+me+'. Please check your inbox.',true);}).catch(function(e){msg('Failed: '+String(e.message||e).slice(0,120));});
      else{window.location.href=mailtoHref(me,c.subject,c.body);msg('Opening your email app. Add the 3 EmailJS codes for fully automatic sending.',true);}
    });
    ['nfOn','nfFallback'].forEach(function(id){$(id).addEventListener('change',function(){$('nfSave').click();});});
    new MutationObserver(paintCfg).observe(H,{attributes:true,attributeFilter:['class']});
    paintCfg();
  }
  document.querySelectorAll('[data-view="approvals"],[data-go="approvals"]').forEach(function(b){b.addEventListener('click',function(){renderWait();});});
  window.addEventListener('hashchange',importFromLink);
  importFromLink();renderWait();
})();
