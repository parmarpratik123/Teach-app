/* TEACH Communication: main app (projects, calendar, library, tasks, checklists, approvals, requests, reports, team access) */

/* ---- block 1 ---- */
// Activity log: every action on the site is recorded with a timestamp so Reports can filter and download it.
(function(){
  var KEY='teach-comm-activity';
  try{window.teachActivity=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){window.teachActivity=[]}
  if(!Array.isArray(window.teachActivity))window.teachActivity=[];
  window.logActivity=function(section,action,title,details){
    var rec={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),at:new Date().toISOString(),by:(window.teachUser&&window.teachUser.name)||'',section:section,action:action,title:String(title||''),details:String(details||'')};
    window.teachActivity.unshift(rec);
    try{localStorage.setItem(KEY,JSON.stringify(window.teachActivity))}catch(e){}
    try{document.dispatchEvent(new CustomEvent('teach-activity'))}catch(e){}
    return rec;
  };
})();


/* ---- block 2 ---- */
const navButtons=[...document.querySelectorAll('[data-view]')];function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+name));navButtons.forEach(b=>b.classList.toggle('active',b.dataset.view===name));window.scrollTo({top:0,behavior:'smooth'});}navButtons.forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));
const toast=document.getElementById('toast');let toastTimer;function notify(msg){toast.textContent=msg;toast.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.style.display='none',2600)}
function save(key,items){try{localStorage.setItem('teach-comm-'+key,JSON.stringify(items))}catch(e){}}
function load(key){try{return JSON.parse(localStorage.getItem('teach-comm-'+key)||'[]')}catch(e){return []}}
let projects=load('projects'),posts=load('posts'),tasks=load('tasks'),resources=load('resources');
function safe(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderList(id,items,kind){const el=document.getElementById(id);if(!items.length)return;const html=items.map(x=>{if(kind==='projects')return `<div class="feature-card"><span class="status progress">${safe(x.status)}</span><h3>${safe(x.title)}</h3><p>Added to your project workspace.</p></div>`;if(kind==='posts')return `<div class="feature-card"><b>${safe(x.date||'Date not set')} · ${safe(x.platform)}</b><h3>${safe(x.title)}</h3><p>Added to your calendar.</p></div>`;if(kind==='tasks')return `<div class="feature-card"><span class="status review">${safe(x.status)}</span><h3>${safe(x.title)}</h3><p>Owner: ${safe(x.owner||'Not assigned')} · Deadline: ${safe(x.date||'Not set')}</p></div>`;return `<div class="feature-card">📁<h3>${safe(x.title)}</h3><p>${x.link?`<a href="${safe(x.link)}" target="_blank" rel="noopener">Open resource ↗</a>`:'Resource link not added'}</p></div>`}).join('');el.insertAdjacentHTML('afterbegin',html)}
document.querySelectorAll('.a-check').forEach((c,i)=>{c.checked=localStorage.getItem('teach-a11y-'+i)==='1';c.addEventListener('change',()=>{localStorage.setItem('teach-a11y-'+i,c.checked?'1':'0');logActivity('Deaf-Friendly Checklist',c.checked?'Ticked':'Unticked',c.parentElement.textContent.trim(),'');notify('Checklist saved on this device.')})});

// Approval workflow demo. Actions are stored in this browser only until a backend is deployed.
const approvalKey='teach-comm-approvals';let approvals=[];try{approvals=JSON.parse(localStorage.getItem(approvalKey)||'[]')}catch(e){approvals=[]}
const approvalRole=document.getElementById('approvalRole'),approvalCards=document.getElementById('approvalCards');
function saveApprovals(){try{localStorage.setItem(approvalKey,JSON.stringify(approvals))}catch(e){}}
function approvalStatusClass(status){return status==='Approved'?'':status==='Needs Changes'?'review':'progress'}
function renderApprovals(){if(!approvalCards)return;const role=approvalRole.value;const visible=approvals.filter(a=>role==='staff'||(role==='manager'&&a.status!=='Approved')||(role==='ceo'&&a.status==='Manager Approved'||role==='ceo'&&a.status==='Pending CEO Approval'));
if(!visible.length){approvalCards.innerHTML='<div class="approval-empty">No items in this view yet. Submit a creative above to start the approval process.</div>';return}
approvalCards.innerHTML=visible.map(a=>{let actions='';if(role==='staff'&&(a.status==='Needs Changes'))actions='<span class="status review">Review feedback and resubmit</span>';if(role==='manager'&&a.status==='Pending Manager Review')actions=`<button class="approve-btn" data-approval-action="manager-approve" data-id="${a.id}">✓ Approve & send to CEO</button><button class="reject-btn" data-approval-action="request-changes" data-id="${a.id}">↺ Request changes</button>`;if(role==='ceo'&&(a.status==='Manager Approved'||a.status==='Pending CEO Approval'))actions=`<button class="approve-btn" data-approval-action="ceo-approve" data-id="${a.id}">✓ Final approval</button><button class="reject-btn" data-approval-action="request-changes" data-id="${a.id}">↺ Request changes</button>`;return `<article class="approval-card" data-aid="${a.id}"><span class="status ${approvalStatusClass(a.status)}">${a.status}</span><h3>${safe(a.title)}</h3><p>${safe(a.type)} · Submitted by ${safe(a.submittedBy||'Communication Team')}</p><div class="approval-meta"><span class="status ${a.status==='Approved'?'':'review'}">Stage: ${safe(a.stage||'Manager Review')}</span></div>${a.feedback?`<p><b>Feedback:</b> ${safe(a.feedback)}</p>`:''}<p><small>Updated: ${safe(a.updated||'Just now')}</small></p><div class="approval-actions">${actions}${a.refId?`<button class="request-btn" data-openref="${safe(a.refId)}">Open ${safe(a.refKind||"item")} ↗</button>`:""}</div></article>`}).join('')}
document.getElementById('submitApproval').addEventListener('click',()=>{const title=document.getElementById('approvalTitle').value.trim();if(!title)return notify('Please enter a creative or campaign name.');approvals.unshift({id:Date.now().toString(),title,type:document.getElementById('approvalType').value,status:'Pending Manager Review',stage:'Manager Review',submittedBy:'Communication Team',updated:new Date().toLocaleString()});logActivity('Approvals','Submitted for approval',title,document.getElementById('approvalType').value+' · Sent to manager');saveApprovals();document.getElementById('approvalTitle').value='';renderApprovals();notify('Submitted for manager review in this browser.');});
approvalRole.addEventListener('change',renderApprovals);approvalCards.addEventListener('click',e=>{const btn=e.target.closest('[data-approval-action]');if(!btn)return;const item=approvals.find(a=>a.id===btn.dataset.id);if(!item)return;const action=btn.dataset.approvalAction;if(action==='manager-approve'){item.status='Manager Approved';item.stage='CEO Final Review';item.updated=new Date().toLocaleString();logActivity('Approvals','Manager approved',item.title,item.type+' · Sent to CEO');notify('Manager approval saved. Ready for CEO review.')}else if(action==='ceo-approve'){item.status='Approved';item.stage='Final Approval';item.updated=new Date().toLocaleString();logActivity('Approvals','CEO final approval',item.title,item.type);notify('Final approval saved.')}else if(action==='request-changes'){const feedback=prompt('Please enter feedback or changes required:');if(feedback===null)return;item.status='Needs Changes';item.stage='Creator Updates';item.feedback=feedback;item.updated=new Date().toLocaleString();logActivity('Approvals','Changes requested',item.title,'Feedback: '+feedback);notify('Feedback saved for the creator.')}saveApprovals();renderApprovals()});renderApprovals();


/* ---- block 3 ---- */
// ===== Shared helpers: per-item Deaf-friendly checklist + "Send for approval" =====
(function(){
  var A11Y=[['isl','ISL video or interpreter considered'],['captions','Captions or transcript added'],['alt','Alt text written for images'],['contrast','Readable text and strong contrast'],['easy','Easy English used'],['review','Checked by a Deaf / DHH colleague']];
  function e(s){return typeof safe==='function'?safe(s==null?'':s):String(s==null?'':s)}
  window.teachA11yItems=A11Y;
  window.teachA11yScore=function(done){done=done||[];return A11Y.filter(function(a){return done.indexOf(a[0])>-1}).length};
  window.teachA11yBadge=function(done){var n=window.teachA11yScore(done);return '<span class="a11y-badge '+(n===A11Y.length?'full':n?'part':'')+'" title="Deaf-friendly checklist">🤟 '+n+'/'+A11Y.length+'</span>'};
  window.teachA11yHtml=function(kind,id,done,open){done=done||[];var n=window.teachA11yScore(done);return '<details class="a11y-box"'+(open?' open':'')+'><summary><b>🤟 Deaf-friendly checklist</b>'+window.teachA11yBadge(done)+'</summary><div class="a11y-items">'+A11Y.map(function(a){return '<label class="a11y-item"><input type="checkbox" data-a11y="'+kind+'|'+e(id)+'|'+a[0]+'"'+(done.indexOf(a[0])>-1?' checked':'')+'> '+a[1]+'</label>'}).join('')+'</div>'+(n<A11Y.length?'<p class="a11y-hint">Tick each item before sending for approval.</p>':'<p class="a11y-hint ok">All checks done. Ready to share.</p>')+'</details>'};
  window.teachA11yToggle=function(done,key,on){done=(done||[]).filter(function(k){return k!==key});if(on)done.push(key);return done};
  window.teachA11yLabel=function(key){var f=A11Y.find(function(a){return a[0]===key});return f?f[1]:key};

  var ac=document.getElementById('approvalCards');if(ac)ac.addEventListener('click',function(e){var b=e.target.closest('[data-openref]');if(!b)return;var p=b.dataset.openref.split(':'),id=p.slice(1).join(':');if(p[0]==='post'&&window.teachOpenPost)window.teachOpenPost(id);else if(p[0]==='task'&&window.teachOpenTask)window.teachOpenTask(id);else if(p[0]==='project'&&window.teachOpenProject)window.teachOpenProject(id)});
  window.teachApprovalFor=function(refId){try{return approvals.filter(function(a){return a.refId===refId})[0]||null}catch(x){return null}};
  window.teachApprovalBadge=function(refId){var a=window.teachApprovalFor(refId);if(!a)return '';var c=a.status==='Approved'?'':a.status==='Needs Changes'?'review':'progress';return '<span class="status '+c+'" title="Approval status">✓ '+e(a.status)+'</span>'};
  window.teachSendForApproval=function(o){
    if(typeof approvals==='undefined'){notify('Approvals are not available.');return null}
    var ex=approvals.filter(function(a){return a.refId===o.refId&&['Approved','Needs Changes'].indexOf(a.status)<0})[0];
    if(ex){notify('This is already waiting for approval ('+ex.status+').');return ex}
    var score=window.teachA11yScore(o.a11y);
    var a={id:Date.now().toString(),title:o.title,type:o.type,status:'Pending Manager Review',stage:'Manager Review',submittedBy:(window.teachUser&&window.teachUser.name)||'Communication Team',updated:new Date().toLocaleString(),refKind:o.refKind,refId:o.refId,feedback:''};
    approvals.unshift(a);saveApprovals();renderApprovals();
    var hasList=Array.isArray(o.a11y);if(window.logActivity)window.logActivity('Approvals','Submitted for approval',o.title,o.type+' · from '+o.refKind+(hasList?' · Deaf-friendly checklist '+score+'/'+A11Y.length:''));
    notify(hasList&&score<A11Y.length?'Sent for manager review. Note: Deaf-friendly checklist is '+score+'/'+A11Y.length+'.':'Sent for manager review.');
    return a;
  };
})();

// ===== Social Media Calendar + home mini calendar =====
(function(){
  var PLAT={Instagram:{c:'#d6246e',b:'#fde8f1',s:'◎',k:'IG'},Facebook:{c:'#1877f2',b:'#e8eefc',s:'f',k:'FB'},LinkedIn:{c:'#0a66c2',b:'#e5f0fb',s:'in',k:'LI'},YouTube:{c:'#e62117',b:'#fde6e3',s:'▶',k:'YT'},WhatsApp:{c:'#1a9e55',b:'#e2f6ea',s:'✆',k:'WA'},Email:{c:'#7a5a2e',b:'#f4ede2',s:'✉',k:'Email'}};
  var STATUSES=['Planned','Draft','Scheduled','Published'];
  var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var KEY='teach-comm-posts';
  function pad(n){return String(n).padStart(2,'0')}
  function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  function parseYmd(s){var p=String(s).split('-').map(Number);return new Date(p[0],(p[1]||1)-1,p[2]||1)}
  function niceDate(s){if(!s)return 'No date';var d=parseYmd(s);return d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear()}
  function niceTime(t){if(!t)return '';var p=t.split(':').map(Number);var h=p[0]%12||12;return h+':'+pad(p[1])+(p[0]<12?' AM':' PM')}
  function esc(s){return typeof safe==='function'?safe(s==null?'':s):String(s==null?'':s)}
  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
  function plat(p){return PLAT[p]||PLAT.Instagram}
  function plist(p){return (p.platforms&&p.platforms.length?p.platforms:[p.platform]).filter(function(x){return PLAT[x]})}
  function pnames(p){return plist(p).join(', ')}
  function log(a,t,d){if(window.logActivity)window.logActivity('Social Media Calendar',a,t,d)}
  function projName(id){if(!id||!window.teachGetProjects)return '';var p=window.teachGetProjects().filter(function(x){return x.id===id})[0];return p?p.title:''}

  var posts=[];
  try{posts=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){posts=[]}
  if(!Array.isArray(posts))posts=[];
  var seeded=false;try{seeded=localStorage.getItem(KEY+'-seeded')==='1'}catch(e){}
  if(!seeded&&!posts.length){
    posts=[
      {title:'TEACH 10 Years',date:'2026-10-26',time:'10:00',platforms:['Instagram','Facebook','LinkedIn'],status:'Scheduled',notes:'Campaign post',caption:'10 years of making higher education and careers accessible for Deaf and Hard of Hearing youth. Thank you to every student, parent, teacher and partner who made it possible.',tags:'#TEACH10Years #DeafInclusion #ISL'},
      {title:'Inclusion to Impact',date:'2026-10-28',time:'11:30',platforms:['LinkedIn'],status:'Draft',notes:'Impact story',caption:'',tags:'#InclusionToImpact'},
      {title:'Event Invite',date:'2026-10-30',time:'17:00',platforms:['Facebook','WhatsApp','Email'],status:'Planned',notes:'Community announcement',caption:'',tags:''}
    ];
  }
  posts=posts.map(function(p){var pl=(p.platforms&&p.platforms.length?p.platforms:[p.platform]).filter(function(x){return PLAT[x]});if(!pl.length)pl=['Instagram'];return {id:p.id||uid(),title:p.title||'Untitled post',date:p.date||'',time:p.time||'',platforms:pl,platform:pl[0],status:STATUSES.indexOf(p.status)>-1?p.status:'Planned',notes:p.notes||'',caption:p.caption||'',tags:p.tags||'',project:p.project||'',a11y:p.a11y||[],createdAt:p.createdAt||''}});
  function savePosts(){posts.forEach(function(p){p.platform=p.platforms[0]});try{localStorage.setItem(KEY,JSON.stringify(posts));localStorage.setItem(KEY+'-seeded','1')}catch(e){}}
  savePosts();
  window.teachGetPosts=function(){return posts.slice()};

  var today=new Date();
  var view=new Date(today.getFullYear(),today.getMonth(),1);
  var mini=new Date(today.getFullYear(),today.getMonth(),1);
  var selected=ymd(today);
  var hidden={};
  var editingId=null;
  var $=function(id){return document.getElementById(id)};
  var grid=$('calGrid'),dayPosts=$('dayPosts'),form=$('postForm');

  $('calPlats').innerHTML=Object.keys(PLAT).map(function(k){return '<label class="rq-pill plat-opt" style="--pc:'+PLAT[k].c+'"><input type="checkbox" name="calPlat" value="'+k+'"><span class="pdot" style="background:'+PLAT[k].c+'"></span>'+k+'</label>'}).join('');
  function pickPlats(list){document.querySelectorAll('input[name=calPlat]').forEach(function(i){i.checked=list.indexOf(i.value)>-1})}
  function readPlats(){return [].map.call(document.querySelectorAll('input[name=calPlat]:checked'),function(i){return i.value})}
  function fillProjects(val){var s=$('calProject'),ps=window.teachGetProjects?window.teachGetProjects():[];s.innerHTML='<option value="">No project</option>'+ps.map(function(p){return '<option value="'+esc(p.id)+'">'+esc(p.title)+'</option>'}).join('');s.value=val||''}
  function visible(p){return plist(p).some(function(x){return !hidden[x]})}
  function byDay(){var m={};posts.forEach(function(p){if(!p.date||!visible(p))return;(m[p.date]=m[p.date]||[]).push(p)});Object.keys(m).forEach(function(k){m[k].sort(function(a,b){return (a.time||'99').localeCompare(b.time||'99')})});return m}

  function renderLegend(){$('calLegend').innerHTML=Object.keys(PLAT).map(function(k){return '<button type="button" class="plat-toggle" data-plat="'+k+'" aria-pressed="'+(!hidden[k])+'"><span class="pdot" style="background:'+PLAT[k].c+'"></span>'+k+'</button>'}).join('')}

  function renderGrid(){
    var y=view.getFullYear(),m=view.getMonth();
    $('calMonthLabel').textContent=MONTHS[m]+' '+y;
    var first=new Date(y,m,1),dim=new Date(y,m+1,0).getDate();
    var weeks=Math.ceil((first.getDay()+dim)/7),map=byDay(),t=ymd(new Date()),html='';
    for(var i=0;i<weeks*7;i++){
      var d=new Date(y,m,1-first.getDay()+i),k=ymd(d),list=map[k]||[];
      var cls='mcal-cell'+(d.getMonth()!==m?' out':'')+(k===t?' today':'')+(k===selected?' selected':'')+((d.getDay()===0||d.getDay()===6)?' weekend':'');
      var chips=list.slice(0,3).map(function(p){var pl=plat(plist(p)[0]);return '<span class="chip'+(p.status==='Published'?' is-published':'')+'" draggable="true" data-id="'+p.id+'" style="--pc:'+pl.c+';--pb:'+pl.b+'" title="'+esc(p.title+' · '+pnames(p)+(p.time?' · '+niceTime(p.time):'')+' · '+p.status)+'">'+(p.time?esc(niceTime(p.time).replace(':00','').replace(' ',''))+' ':'')+esc(p.title)+(plist(p).length>1?' <em class="chip-n">+'+(plist(p).length-1)+'</em>':'')+'</span>'}).join('');
      if(list.length>3)chips+='<span class="more">+'+(list.length-3)+' more</span>';
      html+='<div class="'+cls+'" data-date="'+k+'" role="gridcell" tabindex="0" aria-selected="'+(k===selected)+'" aria-label="'+DAYS[d.getDay()]+' '+niceDate(k)+', '+list.length+' post'+(list.length===1?'':'s')+'"><span class="dnum">'+d.getDate()+'</span><div class="chips">'+chips+'</div></div>';
    }
    grid.innerHTML=html;renderStats();
  }

  function renderStats(){
    var y=view.getFullYear(),m=view.getMonth(),pre=y+'-'+pad(m+1)+'-';
    var inMonth=posts.filter(function(p){return p.date&&p.date.indexOf(pre)===0});
    var html='<div class="cal-stat"><b>'+inMonth.length+'</b>Posts in '+MON[m]+'</div>';
    Object.keys(PLAT).forEach(function(k){html+='<div class="cal-stat"><b>'+inMonth.filter(function(p){return plist(p).indexOf(k)>-1}).length+'</b><span class="pdot" style="background:'+PLAT[k].c+'"></span> '+k+'</div>'});
    html+='<div class="cal-stat"><b>'+inMonth.filter(function(p){return p.status==='Published'}).length+'</b>Published</div>';
    $('calStats').innerHTML=html;
  }

  function postCard(p){
    var pl=plat(plist(p)[0]),pn=projName(p.project);
    return '<div class="day-post" style="--pc:'+pl.c+'"><b>'+esc(p.title)+'</b><div class="plat-badges">'+plist(p).map(function(k){return '<span class="plat-badge" style="--pc:'+PLAT[k].c+';--pb:'+PLAT[k].b+'">'+PLAT[k].s+' '+k+'</span>'}).join('')+'</div><small>'+(p.time?niceTime(p.time):'No time set')+(pn?' · <button type="button" class="link-btn inline" data-openproj="'+esc(p.project)+'">✦ '+esc(pn)+'</button>':'')+'</small>'+
      (p.caption?'<div class="cap"><p>'+esc(p.caption)+'</p>'+(p.tags?'<p class="tags">'+esc(p.tags)+'</p>':'')+'<button type="button" class="mini-btn" data-copy="'+p.id+'">Copy caption</button></div>':(p.tags?'<p class="tags">'+esc(p.tags)+'</p>':'<small class="muted">No caption yet</small>'))+
      (p.notes?'<small>'+esc(p.notes)+'</small>':'')+
      (window.teachA11yHtml?window.teachA11yHtml('post',p.id,p.a11y,false):'')+
      '<div class="day-post-actions"><select data-status="'+p.id+'" aria-label="Status">'+STATUSES.map(function(s){return '<option'+(s===p.status?' selected':'')+'>'+s+'</option>'}).join('')+'</select><button type="button" class="mini-btn" data-edit="'+p.id+'">Edit</button><button type="button" class="mini-btn danger" data-del="'+p.id+'">Delete</button></div>'+
      '<div class="appr-row">'+(window.teachApprovalBadge?window.teachApprovalBadge('post:'+p.id):'')+'<button type="button" class="mini-btn appr-btn" data-approve="'+p.id+'">✓ Send for approval</button></div></div>';
  }

  function renderDay(){
    var d=parseYmd(selected);
    $('dayLabel').textContent=DAYS[d.getDay()]+', '+niceDate(selected);
    var list=posts.filter(function(p){return p.date===selected}).sort(function(a,b){return (a.time||'99').localeCompare(b.time||'99')});
    $('daySub').textContent=list.length?list.length+' post'+(list.length===1?'':'s')+' planned':'Nothing planned yet';
    dayPosts.innerHTML=list.length?list.map(postCard).join(''):'<div class="day-empty">No posts on this day yet. Use the form below to add one.</div>';
    if(!editingId)$('calDate').value=selected;
  }
  function renderAll(){renderGrid();renderDay();renderMini()}
  function select(k,scroll){selected=k;var d=parseYmd(k);if(d.getFullYear()!==view.getFullYear()||d.getMonth()!==view.getMonth())view=new Date(d.getFullYear(),d.getMonth(),1);renderGrid();renderDay();if(scroll&&window.innerWidth<1150){var s=document.querySelector('.cal-side');if(s)s.scrollIntoView({behavior:'smooth',block:'start'})}}
  function resetForm(){editingId=null;form.reset();pickPlats(['Instagram']);fillProjects('');$('calDate').value=selected;$('formHeading').textContent='Add a post';$('calSubmit').textContent='+ Schedule Post';$('calCancel').hidden=true}
  function startEdit(id){var p=posts.find(function(x){return x.id===id});if(!p)return;editingId=id;$('calTitle').value=p.title;$('calDate').value=p.date;$('calTime').value=p.time;pickPlats(plist(p));$('calStatus').value=p.status;fillProjects(p.project);$('calCaption').value=p.caption;$('calTags').value=p.tags;$('calNotes').value=p.notes;$('formHeading').textContent='Edit post';$('calSubmit').textContent='Save changes';$('calCancel').hidden=false;$('calTitle').focus()}

  $('calPrev').addEventListener('click',function(){view=new Date(view.getFullYear(),view.getMonth()-1,1);renderGrid()});
  $('calNext').addEventListener('click',function(){view=new Date(view.getFullYear(),view.getMonth()+1,1);renderGrid()});
  $('calToday').addEventListener('click',function(){var t=new Date();view=new Date(t.getFullYear(),t.getMonth(),1);select(ymd(t))});
  $('calLegend').addEventListener('click',function(e){var b=e.target.closest('[data-plat]');if(!b)return;hidden[b.dataset.plat]=!hidden[b.dataset.plat];renderLegend();renderGrid()});

  grid.addEventListener('click',function(e){var chip=e.target.closest('.chip');var cell=e.target.closest('.mcal-cell');if(!cell)return;select(cell.dataset.date,true);if(chip)startEdit(chip.dataset.id)});
  grid.addEventListener('keydown',function(e){var cell=e.target.closest('.mcal-cell');if(!cell)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();select(cell.dataset.date,true);var c=grid.querySelector('[data-date="'+cell.dataset.date+'"]');if(c)c.focus()}});
  var dragId=null;
  grid.addEventListener('dragstart',function(e){var chip=e.target.closest('.chip');if(!chip)return;dragId=chip.dataset.id;try{e.dataTransfer.setData('text/plain',dragId);e.dataTransfer.effectAllowed='move'}catch(err){}});
  grid.addEventListener('dragover',function(e){var cell=e.target.closest('.mcal-cell');if(!cell||!dragId)return;e.preventDefault();grid.querySelectorAll('.drag-over').forEach(function(c){if(c!==cell)c.classList.remove('drag-over')});cell.classList.add('drag-over')});
  grid.addEventListener('dragleave',function(e){var cell=e.target.closest('.mcal-cell');if(cell&&!cell.contains(e.relatedTarget))cell.classList.remove('drag-over')});
  grid.addEventListener('drop',function(e){var cell=e.target.closest('.mcal-cell');if(!cell||!dragId)return;e.preventDefault();var p=posts.find(function(x){return x.id===dragId});dragId=null;if(!p||p.date===cell.dataset.date){renderGrid();return}var from=p.date;p.date=cell.dataset.date;savePosts();log('Rescheduled post',p.title,pnames(p)+' · '+niceDate(from)+' → '+niceDate(p.date));selected=p.date;renderAll();notify('Moved to '+niceDate(p.date)+'.')});
  grid.addEventListener('dragend',function(){dragId=null;grid.querySelectorAll('.drag-over').forEach(function(c){c.classList.remove('drag-over')})});

  dayPosts.addEventListener('change',function(e){
    var s=e.target.closest('[data-status]');
    if(s){var p=posts.find(function(x){return x.id===s.dataset.status});if(!p)return;var old=p.status;p.status=s.value;savePosts();log('Changed post status',p.title,pnames(p)+' · '+old+' → '+p.status);renderGrid();renderMini();notify('Status updated to '+p.status+'.');return}
    var a=e.target.closest('[data-a11y]');
    if(a){var bits=a.dataset.a11y.split('|');if(bits[0]!=='post')return;var q=posts.find(function(x){return x.id===bits[1]});if(!q)return;q.a11y=window.teachA11yToggle(q.a11y,bits[2],a.checked);savePosts();log(a.checked?'Ticked checklist item':'Unticked checklist item',q.title,window.teachA11yLabel(bits[2])+' · '+window.teachA11yScore(q.a11y)+'/6');var box=a.closest('.a11y-box');var badge=box.querySelector('summary .a11y-badge');if(badge)badge.outerHTML=window.teachA11yBadge(q.a11y);var hint=box.querySelector('.a11y-hint');var n=window.teachA11yScore(q.a11y);if(hint){hint.className='a11y-hint'+(n===6?' ok':'');hint.textContent=n===6?'All checks done. Ready to share.':'Tick each item before sending for approval.'}}
  });
  dayPosts.addEventListener('click',function(e){
    var ed=e.target.closest('[data-edit]'),del=e.target.closest('[data-del]'),cp=e.target.closest('[data-copy]'),ap=e.target.closest('[data-approve]'),op=e.target.closest('[data-openproj]');
    if(ed)startEdit(ed.dataset.edit);
    if(op&&window.teachOpenProject)window.teachOpenProject(op.dataset.openproj);
    if(cp){var p=posts.find(function(x){return x.id===cp.dataset.copy});if(!p)return;var txt=p.caption+(p.tags?'\n\n'+p.tags:'');var done=function(){notify('Caption copied.')};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done,function(){fallback(txt)})}else fallback(txt)}
    if(ap){var q=posts.find(function(x){return x.id===ap.dataset.approve});if(!q||!window.teachSendForApproval)return;window.teachSendForApproval({title:q.title,type:'Social Media Post ('+pnames(q)+')',refKind:'Social post',refId:'post:'+q.id,a11y:q.a11y});renderDay()}
    if(del){var r=posts.find(function(x){return x.id===del.dataset.del});if(!r)return;if(!confirm('Delete "'+r.title+'"?'))return;posts=posts.filter(function(x){return x!==r});savePosts();log('Deleted post',r.title,pnames(r)+' · '+niceDate(r.date));if(editingId===r.id)resetForm();renderAll();notify('Post deleted.')}
  });
  function fallback(txt){var t=document.createElement('textarea');t.value=txt;document.body.appendChild(t);t.select();try{document.execCommand('copy');notify('Caption copied.')}catch(x){notify('Select the caption and copy it manually.')}document.body.removeChild(t)}

  form.addEventListener('submit',function(e){
    e.preventDefault();
    var title=$('calTitle').value.trim(),date=$('calDate').value,pl=readPlats();
    if(!title)return notify('Please enter a post title.');
    if(!date)return notify('Please choose a date.');
    if(!pl.length)return notify('Choose at least one place for the post to go.');
    var data={title:title,date:date,time:$('calTime').value,platforms:pl,platform:pl[0],status:$('calStatus').value,project:$('calProject').value,caption:$('calCaption').value.trim(),tags:$('calTags').value.trim(),notes:$('calNotes').value.trim()};
    var pn=projName(data.project);
    if(editingId){var p=posts.find(function(x){return x.id===editingId});if(p){var changes=[];['title','date','time','status','project','caption','tags','notes'].forEach(function(f){if(p[f]!==data[f])changes.push(f)});if(p.platforms.join()!==pl.join())changes.push('channels');Object.assign(p,data);savePosts();log('Edited post',p.title,pnames(p)+' · '+niceDate(p.date)+(p.time?' '+niceTime(p.time):'')+' · '+p.status+(changes.length?' (changed: '+changes.join(', ')+')':''));notify('Post updated.')}}
    else{var n=Object.assign({id:uid(),a11y:[],createdAt:new Date().toISOString()},data);posts.push(n);savePosts();log('Scheduled post',n.title,pnames(n)+' · '+niceDate(n.date)+(n.time?' '+niceTime(n.time):'')+' · '+n.status+(pn?' · Project: '+pn:''));notify('Post added to '+niceDate(n.date)+'.')}
    selected=date;resetForm();select(date);renderMini();
  });
  $('calCancel').addEventListener('click',resetForm);

  function renderMini(){
    var box=$('miniCal');if(!box)return;
    var y=mini.getFullYear(),m=mini.getMonth(),first=new Date(y,m,1),dim=new Date(y,m+1,0).getDate(),t=ymd(new Date());
    $('miniLabel').textContent=MONTHS[m]+' '+y;
    var has={};posts.forEach(function(p){if(p.date)has[p.date]=(has[p.date]||0)+1});
    var html=['Su','Mo','Tu','We','Th','Fr','Sa'].map(function(d){return '<span class="day">'+d+'</span>'}).join('');
    for(var i=0;i<first.getDay();i++)html+='<span></span>';
    for(var d=1;d<=dim;d++){var k=y+'-'+pad(m+1)+'-'+pad(d);html+='<span data-date="'+k+'" class="'+(k===t?'today':has[k]?'event':'')+'" title="'+(has[k]?has[k]+' post'+(has[k]>1?'s':''):'')+'">'+d+'</span>'}
    box.innerHTML=html;
    var up=posts.filter(function(p){return p.date&&p.date>=t}).sort(function(a,b){return (a.date+(a.time||'')).localeCompare(b.date+(b.time||''))}).slice(0,3);
    $('miniUpcoming').innerHTML=up.length?up.map(function(p){var pl=plat(plist(p)[0]);return '<div class="postline" role="button" tabindex="0" data-mpost="'+p.id+'" style="cursor:pointer"><span class="social-icon" style="background:'+pl.b+'">'+pl.s+'</span><span><b>'+niceDate(p.date)+(p.time?' · '+niceTime(p.time):'')+'</b><br>'+esc(p.title)+' – '+esc(plist(p).map(function(k){return PLAT[k].k}).join(', '))+'</span></div>'}).join(''):'<div class="postline"><span>No upcoming posts. Open the calendar to plan one.</span></div>';
  }
  var mp=$('miniPrev'),mn=$('miniNext'),mc=$('miniCal');
  if(mp)mp.addEventListener('click',function(){mini=new Date(mini.getFullYear(),mini.getMonth()-1,1);renderMini()});
  if(mn)mn.addEventListener('click',function(){mini=new Date(mini.getFullYear(),mini.getMonth()+1,1);renderMini()});
  var mu=$('miniUpcoming');if(mu){var mgo=function(e){var r=e.target.closest('[data-mpost]');if(r)window.teachOpenPost(r.dataset.mpost)};mu.addEventListener('click',mgo);mu.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();mgo(e)}})}
  if(mc)mc.addEventListener('click',function(e){var s=e.target.closest('[data-date]');if(!s)return;showView('calendar');select(s.dataset.date)});
  document.addEventListener('teach-activity',function(){var ae=document.activeElement;if(ae&&dayPosts.contains(ae))return;if(document.getElementById('view-calendar').classList.contains('active'))renderDay()});
  document.querySelectorAll('[data-view="calendar"],[data-go="calendar"]').forEach(function(b){b.addEventListener('click',function(){if(!editingId)fillProjects($('calProject').value);renderDay()})});
  window.teachOpenPost=function(id){var p=posts.find(function(x){return x.id===id});if(!p)return;showView('calendar');select(p.date||ymd(new Date()))};
  window.teachPlatforms=PLAT;
  renderLegend();resetForm();renderAll();
})();

// ===== Reports: filter everything done by date and time, then download =====
(function(){
  var SECTIONS=['Account','Social Media Calendar','Creative Projects','Inspiration Board','Announcements','Comms Requests','Team Tasks','Brand & File Library','Approvals','Checklists','Deaf-Friendly Checklist'];
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var $=function(id){return document.getElementById(id)};
  if(!$('repRows'))return;
  function pad(n){return String(n).padStart(2,'0')}
  function esc(s){return typeof safe==='function'?safe(s==null?'':s):String(s==null?'':s)}
  function toInput(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())}
  function dStr(d){return pad(d.getDate())+' '+MON[d.getMonth()]+' '+d.getFullYear()}
  function tStr(d){var h=d.getHours()%12||12;return h+':'+pad(d.getMinutes())+(d.getHours()<12?' AM':' PM')}
  function sod(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate(),0,0)}
  function eod(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate(),23,59)}
  var sel=$('repSection');
  SECTIONS.forEach(function(s){var o=document.createElement('option');o.value=s;o.textContent=s;sel.appendChild(o)});
  var activeRange='month';

  function setRange(kind){
    var now=new Date(),from,to=eod(now);
    if(kind==='today')from=sod(now);
    else if(kind==='week')from=sod(new Date(now.getFullYear(),now.getMonth(),now.getDate()-6));
    else if(kind==='month')from=new Date(now.getFullYear(),now.getMonth(),1,0,0);
    else if(kind==='lastmonth'){from=new Date(now.getFullYear(),now.getMonth()-1,1,0,0);to=eod(new Date(now.getFullYear(),now.getMonth(),0))}
    else{var acts=window.teachActivity||[];var oldest=acts.length?new Date(acts[acts.length-1].at):now;from=sod(oldest)}
    $('repFrom').value=toInput(from);$('repTo').value=toInput(to);activeRange=kind;render();
  }

  function range(){
    var f=$('repFrom').value?new Date($('repFrom').value):new Date(0);
    var t=$('repTo').value?new Date($('repTo').value):new Date(8640000000000000);
    if($('repTo').value)t=new Date(t.getTime()+59999);
    return {from:f,to:t};
  }

  function rows(){
    var r=range(),s=sel.value,who=$('repPerson').value;
    return (window.teachActivity||[]).filter(function(a){var d=new Date(a.at);return d>=r.from&&d<=r.to&&(!s||a.section===s)&&(!who||a.by===who)}).sort(function(a,b){return a.at<b.at?1:-1});
  }

  function people(){var ps=$('repPerson'),cur=ps.value,names={};(window.teachActivity||[]).forEach(function(a){if(a.by)names[a.by]=1});var me=window.teachUser&&window.teachUser.name;ps.innerHTML='<option value="">Everyone</option>'+Object.keys(names).sort().map(function(n){return '<option value="'+esc(n)+'">'+esc(n)+(n===me?' (me)':'')+'</option>'}).join('');ps.value=names[cur]?cur:''}
  function render(){
    people();document.querySelectorAll('#repQuick button').forEach(function(b){b.classList.toggle('on',b.dataset.range===activeRange)});
    var list=rows(),counts={};
    list.forEach(function(a){counts[a.section]=(counts[a.section]||0)+1});
    var shown=sel.value?[sel.value]:SECTIONS;
    $('repTiles').innerHTML='<div class="rep-tile"><b>'+list.length+'</b><span>Total actions</span></div>'+shown.map(function(s){return '<div class="rep-tile"><b>'+(counts[s]||0)+'</b><span>'+esc(s)+'</span></div>'}).join('');
    $('repCount').textContent=list.length+' record'+(list.length===1?'':'s')+' in this range';
    $('repRows').innerHTML=list.length?list.map(function(a){var d=new Date(a.at);return '<tr><td class="nowrap">'+dStr(d)+'</td><td class="nowrap">'+tStr(d)+'</td><td class="nowrap">'+esc(a.by||'—')+'</td><td><span class="rep-tag">'+esc(a.section)+'</span></td><td>'+esc(a.action)+'</td><td><b>'+esc(a.title)+'</b></td><td>'+esc(a.details)+'</td></tr>'}).join(''):'<tr><td colspan="7" class="rep-empty">Nothing recorded in this range yet. Add a post, task, project or approval and it will appear here.</td></tr>';
  }

  function fileRange(){var r=range();var f=$('repFrom').value?r.from:null,t=$('repTo').value?new Date(r.to.getTime()-59999):null;function k(d){return d?d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()):'all'}return k(f)+'_to_'+k(t)}
  function rangeLabel(){var r=range();var f=$('repFrom').value?dStr(r.from)+', '+tStr(r.from):'Beginning';var t=$('repTo').value?(function(){var x=new Date(r.to.getTime()-59999);return dStr(x)+', '+tStr(x)})():'Now';return f+' – '+t}

  function download(name,text,type){
    var blob=new Blob([text],{type:type}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url)},800);
  }

  $('repCsv').addEventListener('click',function(){
    var list=rows();
    if(!list.length)return notify('Nothing to download in this range.');
    function c(v){v=String(v==null?'':v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
    var lines=[['TEACH Communication – Activity Report'],['Range',rangeLabel()],['Section',sel.value||'All sections'],['Person',$('repPerson').value||'Everyone'],['Generated',dStr(new Date())+', '+tStr(new Date())],[],['Date','Time','By','Section','Action','Item','Details']];
    list.slice().reverse().forEach(function(a){var d=new Date(a.at);lines.push([dStr(d),tStr(d),a.by||'',a.section,a.action,a.title,a.details])});
    download('TEACH-activity_'+fileRange()+'.csv','﻿'+lines.map(function(r){return r.map(c).join(',')}).join('\r\n'),'text/csv;charset=utf-8');
    notify('Report downloaded ('+list.length+' records).');
  });

  $('repPrint').addEventListener('click',function(){
    var list=rows().slice().reverse(),counts={};
    if(!list.length)return notify('Nothing to download in this range.');
    list.forEach(function(a){counts[a.section]=(counts[a.section]||0)+1});
    var r=range(),fromK=$('repFrom').value.slice(0,10),toK=$('repTo').value.slice(0,10);
    var planned=(window.teachGetPosts?window.teachGetPosts():[]).filter(function(p){return p.date&&(!fromK||p.date>=fromK)&&(!toK||p.date<=toK)}).sort(function(a,b){return (a.date+(a.time||'')).localeCompare(b.date+(b.time||''))});
    var area=$('printArea');if(!area){area=document.createElement('div');area.id='printArea';document.body.appendChild(area)}
    area.innerHTML='<h1>TEACH Communication – Activity Report</h1><div class="pmeta"><b>Range:</b> '+esc(rangeLabel())+' &nbsp;·&nbsp; <b>Section:</b> '+esc(sel.value||'All sections')+' &nbsp;·&nbsp; <b>Generated:</b> '+dStr(new Date())+', '+tStr(new Date())+'</div>'+
      '<h2>Summary</h2><table><tr><th>Section</th><th>Actions</th></tr>'+Object.keys(counts).map(function(k){return '<tr><td>'+esc(k)+'</td><td>'+counts[k]+'</td></tr>'}).join('')+'<tr><th>Total</th><th>'+list.length+'</th></tr></table>'+
      '<h2>Activity log</h2><table><tr><th>Date</th><th>Time</th><th>By</th><th>Section</th><th>Action</th><th>Item</th><th>Details</th></tr>'+list.map(function(a){var d=new Date(a.at);return '<tr><td>'+dStr(d)+'</td><td>'+tStr(d)+'</td><td>'+esc(a.by||'')+'</td><td>'+esc(a.section)+'</td><td>'+esc(a.action)+'</td><td>'+esc(a.title)+'</td><td>'+esc(a.details)+'</td></tr>'}).join('')+'</table>'+
      (planned.length&&(!sel.value||sel.value==='Social Media Calendar')?'<h2>Social posts dated in this range</h2><table><tr><th>Date</th><th>Time</th><th>Platform</th><th>Title</th><th>Status</th></tr>'+planned.map(function(p){var d=new Date(p.date+'T00:00');return '<tr><td>'+dStr(d)+'</td><td>'+(p.time||'')+'</td><td>'+esc(p.platform)+'</td><td>'+esc(p.title)+'</td><td>'+esc(p.status)+'</td></tr>'}).join('')+'</table>':'');
    document.body.classList.add('printing');
    var done=function(){document.body.classList.remove('printing');window.removeEventListener('afterprint',done)};
    window.addEventListener('afterprint',done);
    setTimeout(function(){window.print();setTimeout(done,1500)},50);
  });

  document.getElementById('repQuick').addEventListener('click',function(e){var b=e.target.closest('[data-range]');if(b)setRange(b.dataset.range)});
  ['repFrom','repTo'].forEach(function(id){$(id).addEventListener('change',function(){activeRange='';render()})});
  sel.addEventListener('change',render);$('repPerson').addEventListener('change',render);
  document.addEventListener('teach-activity',render);
  document.querySelectorAll('[data-view="reports"]').forEach(function(b){b.addEventListener('click',function(){if(activeRange)setRange(activeRange);else render()})});
  setRange('month');
})();


/* ---- block 4 ---- */
// ===== Inspiration Board (references) and Announcements (team news) =====
(function(){
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var $=function(id){return document.getElementById(id)};
  if(!$('gGrid'))return;
  function pad(n){return String(n).padStart(2,'0')}
  function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  function pd(s){var p=String(s).split('-').map(Number);return new Date(p[0],(p[1]||1)-1,p[2]||1)}
  function nice(s){if(!s)return '';var d=pd(s);return d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear()}
  function esc(s){return typeof safe==='function'?safe(s==null?'':s):String(s==null?'':s)}
  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
  function load(k){try{var v=JSON.parse(localStorage.getItem(k)||'null');return Array.isArray(v)?v:null}catch(e){return null}}
  function store(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function log(sec,a,t,d){if(window.logActivity)window.logActivity(sec,a,t,d)}

  // ---------- Inspiration Board (references the team likes) ----------
  var LIKES=['Colours','Layout','Typography','Copy / caption','Photography','Illustration','Video style','ISL presentation','Accessibility'];
  var SOURCES={'Instagram':['#d6246e','#f77737','◎'],'LinkedIn':['#0a66c2','#3d8fd9','in'],'Facebook':['#1877f2','#5b9cf8','f'],'YouTube':['#c4180c','#ef4b3f','▶'],'Behance':['#0057ff','#4f8bff','Bē'],'Pinterest':['#b7081b','#e43a4d','P'],'Another NGO':['#16885c','#46b788','✿'],'Brand / company':['#24203d','#5a4380','◆'],'Website':['#064e62','#0a9eaa','⌘'],'Other':['#6b5a3e','#b08d57','✦']};
  var IKEY='teach-comm-inspiration';
  var refs=load(IKEY)||[
    {title:'ISL-first reel opening',source:'Instagram',likes:['Video style','ISL presentation'],notes:'The signer fills the frame in the first two seconds, captions are burned in, and the title card is bold and short.',tags:'reel, ISL, captions',fav:true,example:true},
    {title:'Impact numbers carousel',source:'LinkedIn',likes:['Layout','Typography'],notes:'One big number per slide with a single line of context. Brand colour background, lots of space.',tags:'carousel, impact, data',fav:false,example:true},
    {title:'Student portrait series',source:'Another NGO',likes:['Photography','Copy / caption'],notes:'Natural-light portraits with a short first-person quote in the student\'s own words.',tags:'portraits, stories',fav:true,example:true},
    {title:'Accessible event poster',source:'Behance',likes:['Accessibility','Typography','Colours'],notes:'High contrast, very large date and venue, QR code with the link also written out as text.',tags:'poster, event',fav:false,example:true}
  ];
  refs=refs.map(function(r){return Object.assign({id:uid(),source:'Other',link:'',img:'',likes:[],notes:'',tags:'',project:'',fav:false,example:false},r)});
  function saveRefs(){try{localStorage.setItem(IKEY,JSON.stringify(refs));return true}catch(e){notify('That image is too large to save in this browser. Try a smaller screenshot or add a link instead.');return false}}
  saveRefs();
  var iFilter='All',editRef=null,pendingImg=null;
  window.teachGetRefs=function(){return refs.slice()};
  $('gSource').innerHTML=Object.keys(SOURCES).map(function(s){return '<option>'+s+'</option>'}).join('');
  $('gLikes').innerHTML=LIKES.map(function(l){return '<label class="rq-pill"><input type="checkbox" name="gLike" value="'+esc(l)+'">'+esc(l)+'</label>'}).join('');
  function projOptions(v){var ps=window.teachGetProjects?window.teachGetProjects():[];$('gProject').innerHTML='<option value="">No project</option>'+ps.map(function(p){return '<option value="'+esc(p.id)+'">'+esc(p.title)+'</option>'}).join('');$('gProject').value=v||''}
  function projTitle(id){var ps=window.teachGetProjects?window.teachGetProjects():[];var p=ps.filter(function(x){return x.id===id})[0];return p?p.title:''}
  function cover(r,big){var s=SOURCES[r.source]||SOURCES.Other;return r.img?'<img src="'+r.img+'" alt="'+esc(r.title)+'" loading="lazy">':'<span class="i-ph" style="--t1:'+s[0]+';--t2:'+s[1]+'"><span class="i-ph-icon">'+esc(s[2])+'</span><span class="i-ph-src">'+esc(r.source)+'</span></span>'}

  function renderInspo(){
    var q=$('gSearch').value.trim().toLowerCase();
    var F=['All','★ Favourites'].concat(LIKES);
    $('gFilters').innerHTML=F.map(function(f){var n=f==='All'?refs.length:f==='★ Favourites'?refs.filter(function(r){return r.fav}).length:refs.filter(function(r){return r.likes.indexOf(f)>-1}).length;if(f!=='All'&&f!=='★ Favourites'&&!n&&iFilter!==f)return '';return '<button type="button" data-gtype="'+esc(f)+'" class="'+(iFilter===f?'on':'')+'">'+esc(f)+' <span class="cnt">'+n+'</span></button>'}).join('');
    var list=refs.filter(function(r){return (iFilter==='All'||(iFilter==='★ Favourites'?r.fav:r.likes.indexOf(iFilter)>-1))&&(!q||(r.title+' '+r.source+' '+r.notes+' '+r.tags+' '+r.likes.join(' ')+' '+projTitle(r.project)).toLowerCase().indexOf(q)>-1)}).sort(function(a,b){if(a.fav!==b.fav)return a.fav?-1:1;return (b.createdAt||'').localeCompare(a.createdAt||'')});
    $('gGrid').innerHTML=list.length?list.map(function(r){var pt=projTitle(r.project);return '<article class="i-card"><button type="button" class="i-cover" data-gopen="'+r.id+'" aria-label="Open '+esc(r.title)+'">'+cover(r)+'</button><button type="button" class="i-fav'+(r.fav?' on':'')+'" data-gfav="'+r.id+'" aria-label="'+(r.fav?'Remove from favourites':'Add to favourites')+'" aria-pressed="'+r.fav+'">'+(r.fav?'★':'☆')+'</button>'+(r.example?'<span class="i-ex">Example</span>':'')+'<div class="i-body"><h3>'+esc(r.title)+'</h3><small>'+esc(r.source)+(pt?' · ✦ '+esc(pt):'')+'</small>'+(r.likes.length?'<div class="i-likes"><span class="i-lab">We like:</span>'+r.likes.map(function(l){return '<span>'+esc(l)+'</span>'}).join('')+'</div>':'')+(r.notes?'<p class="i-notes">'+esc(r.notes)+'</p>':'')+(r.tags?'<p class="i-tags">'+r.tags.split(',').map(function(t){return t.trim()}).filter(Boolean).map(function(t){return '#'+esc(t.replace(/^#/,''))}).join(' ')+'</p>':'')+'<div class="g-foot">'+(r.link?'<a href="'+esc(r.link)+'" target="_blank" rel="noopener">Open source ↗</a>':'<span style="margin-right:auto"></span>')+'<button type="button" class="mini-btn" data-gedit="'+r.id+'">Edit</button><button type="button" class="mini-btn danger" data-gdel="'+r.id+'" aria-label="Remove '+esc(r.title)+'">✕</button></div></div></article>'}).join(''):'<div class="g-empty">No references match. Try another filter or add one.</div>';
  }
  function openG(show){$('gForm').hidden=!show;$('gToggle').textContent=show?'Close':'+ Add reference';if(show){if(!editRef)projOptions('');$('gTitle').focus()}else{editRef=null;pendingImg=null;$('gForm').reset();$('gPreview').innerHTML='';$('gSave').textContent='Save reference'}}
  $('gToggle').addEventListener('click',function(){openG($('gForm').hidden)});
  $('gCancel').addEventListener('click',function(){openG(false)});
  $('gImg').addEventListener('change',function(){var f=this.files&&this.files[0];if(!f)return;if(!/^image\//.test(f.type))return notify('Please choose an image file.');var rd=new FileReader();rd.onload=function(){var im=new Image();im.onload=function(){var max=900,w=im.width,h=im.height;if(w>max){h=Math.round(h*max/w);w=max}var c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);pendingImg=c.toDataURL('image/jpeg',0.78);$('gPreview').innerHTML='<img src="'+pendingImg+'" alt="Preview"><button type="button" class="mini-btn" id="gImgClear">Remove image</button>'};im.onerror=function(){notify('That image could not be read.')};im.src=rd.result};rd.readAsDataURL(f)});
  $('gPreview').addEventListener('click',function(e){if(e.target.id==='gImgClear'){pendingImg='';$('gImg').value='';$('gPreview').innerHTML=''}});
  $('gForm').addEventListener('submit',function(e){
    e.preventDefault();var title=$('gTitle').value.trim(),link=$('gLink').value.trim();
    if(!title)return notify('Please give the reference a name.');
    if(link&&!/^https?:\/\//i.test(link))return notify('Please use a full link starting with https://');
    var likes=[].map.call(document.querySelectorAll('input[name=gLike]:checked'),function(i){return i.value});
    var data={title:title,source:$('gSource').value,link:link,likes:likes,notes:$('gNotes').value.trim(),tags:$('gTags').value.trim(),project:$('gProject').value,fav:$('gFav').checked};
    if(editRef){var r=refs.find(function(x){return x.id===editRef});if(!r)return;var backup=JSON.stringify(r);Object.assign(r,data);if(pendingImg!==null)r.img=pendingImg;r.example=false;if(!saveRefs()){Object.assign(r,JSON.parse(backup));return}log('Inspiration Board','Edited reference',r.title,r.source+(likes.length?' · We like: '+likes.join(', '):''));notify('Reference updated.')}
    else{var n=Object.assign({id:uid(),img:pendingImg||'',createdAt:new Date().toISOString()},data);refs.push(n);if(!saveRefs()){refs.pop();return}log('Inspiration Board','Added reference',n.title,n.source+(likes.length?' · We like: '+likes.join(', '):'')+(n.project?' · Project: '+projTitle(n.project):''));notify('Reference added to the board.')}
    openG(false);iFilter='All';renderInspo();
  });
  function startEditRef(id){var r=refs.find(function(x){return x.id===id});if(!r)return;editRef=id;pendingImg=null;$('gForm').hidden=false;$('gToggle').textContent='Close';$('gTitle').value=r.title;$('gSource').value=r.source;$('gLink').value=r.link;$('gNotes').value=r.notes;$('gTags').value=r.tags;$('gFav').checked=r.fav;projOptions(r.project);document.querySelectorAll('input[name=gLike]').forEach(function(i){i.checked=r.likes.indexOf(i.value)>-1});$('gPreview').innerHTML=r.img?'<img src="'+r.img+'" alt="Current image"><button type="button" class="mini-btn" id="gImgClear">Remove image</button>':'';$('gSave').textContent='Save changes';$('gForm').scrollIntoView({behavior:'smooth',block:'start'});$('gTitle').focus()}
  function openRef(id){var r=refs.find(function(x){return x.id===id});if(!r)return;var pt=projTitle(r.project);$('iModalTitle').textContent=r.title;$('iModalBody').innerHTML='<div class="i-big">'+cover(r,true)+'</div><dl class="i-dl"><dt>Source</dt><dd>'+esc(r.source)+(r.link?' · <a href="'+esc(r.link)+'" target="_blank" rel="noopener">Open source ↗</a>':'')+'</dd>'+(r.likes.length?'<dt>What we like</dt><dd>'+r.likes.map(esc).join(', ')+'</dd>':'')+(r.notes?'<dt>Notes</dt><dd>'+esc(r.notes)+'</dd>':'')+(r.tags?'<dt>Tags</dt><dd>'+esc(r.tags)+'</dd>':'')+(pt?'<dt>Project</dt><dd><button type="button" class="link-btn inline" data-iproj="'+esc(r.project)+'">✦ '+esc(pt)+'</button></dd>':'')+'</dl>';$('iModal').hidden=false;$('iModalClose').focus()}
  $('iModalClose').addEventListener('click',function(){$('iModal').hidden=true});
  $('iModal').addEventListener('click',function(e){if(e.target===$('iModal'))$('iModal').hidden=true;var p=e.target.closest('[data-iproj]');if(p&&window.teachOpenProject){$('iModal').hidden=true;window.teachOpenProject(p.dataset.iproj)}});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('iModal').hidden)$('iModal').hidden=true});
  $('gFilters').addEventListener('click',function(e){var b=e.target.closest('[data-gtype]');if(!b)return;iFilter=b.dataset.gtype;renderInspo()});
  $('gSearch').addEventListener('input',renderInspo);
  $('gGrid').addEventListener('click',function(e){
    var o=e.target.closest('[data-gopen]'),f=e.target.closest('[data-gfav]'),ed=e.target.closest('[data-gedit]'),d=e.target.closest('[data-gdel]');
    if(o)openRef(o.dataset.gopen);
    if(ed)startEditRef(ed.dataset.gedit);
    if(f){var r=refs.find(function(x){return x.id===f.dataset.gfav});if(!r)return;r.fav=!r.fav;saveRefs();log('Inspiration Board',r.fav?'Added to favourites':'Removed from favourites',r.title,r.source);renderInspo()}
    if(d){var x=refs.find(function(y){return y.id===d.dataset.gdel});if(!x||!confirm('Remove "'+x.title+'" from the board?'))return;refs=refs.filter(function(y){return y!==x});saveRefs();log('Inspiration Board','Removed reference',x.title,x.source);renderInspo();notify('Reference removed.')}
  });
  document.querySelectorAll('[data-view="gallery"]').forEach(function(b){b.addEventListener('click',function(){if($('gForm').hidden)projOptions('');renderInspo()})});

  // ---------- Announcements ----------
  var CATS={'Event':{c:'#f45b45',b:'#ffe4dc',i:'✦'},'Meeting':{c:'#2774c8',b:'#e4efff',i:'◷'},'Guideline Update':{c:'#16885c',b:'#e1f7eb',i:'✓'},'Achievement':{c:'#c98a00',b:'#fff0cc',i:'★'},'General':{c:'#777b80',b:'#f0f0f0',i:'i'}};
  var AKEY='teach-comm-announcements';
  var anns=load(AKEY)||[
    {title:'TEACH 10 Years Celebration',msg:"Let's celebrate 10 years of inclusion, empowerment and possibilities! Campaign creatives are live across all channels.",cat:'Achievement',posted:'2026-10-12',date:'',by:'Communication Team',pinned:true},
    {title:'Communication team meeting',msg:'Monthly planning meeting. Bring your November post ideas and any pending approvals.',cat:'Meeting',posted:'2026-10-20',date:'2026-10-25',by:'Pratik Parmar',pinned:false},
    {title:'Social Media Guidelines updated',msg:'New caption format and hashtag list are now available in the Brand & File Library. Please use them from this week.',cat:'Guideline Update',posted:'2026-10-06',date:'',by:'Communication Team',pinned:false}
  ];
  anns=anns.map(function(a){return Object.assign({id:uid(),cat:'General',msg:'',date:'',by:'',pinned:false,posted:a.posted||ymd(new Date())},a)});
  store(AKEY,anns);
  var aCat='All',aEdit=null;
  $('aCat').innerHTML=Object.keys(CATS).map(function(c){return '<option>'+c+'</option>'}).join('');
  function sorted(){return anns.slice().sort(function(a,b){if(a.pinned!==b.pinned)return a.pinned?-1:1;return (b.posted||'').localeCompare(a.posted||'')})}
  function daysSince(s){return Math.floor((new Date()-pd(s))/864e5)}
  function renderAnns(){
    $('aFilters').innerHTML=['All'].concat(Object.keys(CATS)).map(function(c){var n=c==='All'?anns.length:anns.filter(function(a){return a.cat===c}).length;return '<button type="button" data-acat="'+c+'" class="'+(aCat===c?'on':'')+'">'+(c==='All'?'All':CATS[c].i+' '+c)+' <span class="cnt">'+n+'</span></button>'}).join('');
    var t=ymd(new Date()),list=sorted().filter(function(a){return aCat==='All'||a.cat===aCat});
    $('aList').innerHTML=list.length?list.map(function(a){var c=CATS[a.cat]||CATS.General,d=pd(a.posted),badge='';
      if(a.date){badge=a.date>=t?'<span class="ann-badge">'+(a.date===t?'Today':'Upcoming · '+nice(a.date))+'</span>':'<span class="ann-badge" style="background:#eee">Past · '+nice(a.date)+'</span>'}
      if(daysSince(a.posted)<=3)badge='<span class="ann-badge" style="background:#171717;color:#fff!important">NEW</span>'+badge;
      return '<article class="ann'+(a.pinned?' pinned':'')+'" style="--ac:'+c.c+';--ab:'+c.b+'"><div class="ann-date" aria-label="Posted '+nice(a.posted)+'"><b>'+d.getDate()+'</b><span>'+MON[d.getMonth()]+' '+String(d.getFullYear()).slice(2)+'</span></div><div><div class="ann-top"><span class="ann-tag">'+c.i+' '+esc(a.cat)+'</span>'+(a.pinned?'<span class="ann-badge" style="background:#fff0cc">📌 Pinned</span>':'')+badge+'</div><h3>'+esc(a.title)+'</h3>'+(a.msg?'<p>'+esc(a.msg)+'</p>':'')+'<div class="ann-meta">Posted '+nice(a.posted)+(a.by?' by '+esc(a.by):'')+'</div></div><div class="ann-actions"><button type="button" class="mini-btn" data-apin="'+a.id+'">'+(a.pinned?'Unpin':'Pin')+'</button><button type="button" class="mini-btn" data-aedit="'+a.id+'">Edit</button><button type="button" class="mini-btn danger" data-adel="'+a.id+'">Delete</button></div></article>'}).join(''):'<div class="g-empty">No announcements in this category yet.</div>';
    renderHome();
  }
  function renderHome(){
    var box=$('homeAnns');if(!box)return;
    box.innerHTML=sorted().slice(0,3).map(function(a){var c=CATS[a.cat]||CATS.General;return '<div class="announcement home-ann" role="button" tabindex="0" style="cursor:pointer;--ac:'+c.c+'"><div class="thumb" aria-hidden="true">'+c.i+'</div><div><span class="ann-cat">'+esc(a.cat)+(a.pinned?' · 📌':'')+'</span><b>'+esc(a.title)+'</b>'+(a.msg?'<small>'+esc(a.msg.length>90?a.msg.slice(0,88)+'…':a.msg)+'</small>':'')+'<small>'+(a.date?'On '+nice(a.date):'Posted '+nice(a.posted))+'</small></div></div>'}).join('')||'<div class="announcement"><small>No announcements yet.</small></div>';
  }
  function openA(show){$('aForm').hidden=!show;$('aToggle').textContent=show?'Close':'+ New announcement';var sb=$('aForm').querySelector('[type=submit]');if(sb){if(!sb.dataset.t)sb.dataset.t=sb.textContent;sb.textContent=(show&&aEdit)?'Save changes':sb.dataset.t}if(show)$('aTitle').focus();else aEdit=null}
  $('aToggle').addEventListener('click',function(){openA($('aForm').hidden)});
  $('aCancel').addEventListener('click',function(){$('aForm').reset();openA(false)});
  $('aForm').addEventListener('submit',function(e){
    e.preventDefault();var title=$('aTitle').value.trim();if(!title)return notify('Please enter a headline.');
    var a={id:uid(),title:title,msg:$('aMsg').value.trim(),cat:$('aCat').value,date:$('aDate').value,by:$('aBy').value.trim(),pinned:$('aPin').checked,posted:ymd(new Date()),createdAt:new Date().toISOString()};
    if(aEdit){var ex=anns.find(function(x){return x.id===aEdit});if(ex){var oldT=ex.title;ex.title=a.title;ex.msg=a.msg;ex.cat=a.cat;ex.date=a.date;ex.by=a.by;ex.pinned=a.pinned;store(AKEY,anns);log('Announcements','Edited announcement',ex.title,oldT!==ex.title?'Renamed from '+oldT:ex.cat);$('aForm').reset();openA(false);renderAnns();notify('Announcement updated.');return}}anns.push(a);store(AKEY,anns);log('Announcements','Posted announcement',a.title,a.cat+(a.date?' · for '+nice(a.date):'')+(a.pinned?' · Pinned':''));
    $('aForm').reset();openA(false);aCat='All';renderAnns();notify('Announcement posted.');
  });
  $('aFilters').addEventListener('click',function(e){var b=e.target.closest('[data-acat]');if(!b)return;aCat=b.dataset.acat;renderAnns()});
  $('aList').addEventListener('click',function(e){
    var p=e.target.closest('[data-apin]'),d=e.target.closest('[data-adel]'),ed=e.target.closest('[data-aedit]');if(ed){var ea=anns.find(function(x){return x.id===ed.dataset.aedit});if(ea){$('aForm').reset();aEdit=ea.id;openA(true);$('aTitle').value=ea.title;$('aMsg').value=ea.msg||'';$('aCat').value=ea.cat;$('aDate').value=ea.date||'';$('aBy').value=ea.by||'';$('aPin').checked=!!ea.pinned;$('aForm').scrollIntoView({behavior:'smooth',block:'center'});notify('Editing this announcement. Change anything and press Save changes.')}return}
    if(p){var a=anns.find(function(x){return x.id===p.dataset.apin});if(!a)return;a.pinned=!a.pinned;store(AKEY,anns);log('Announcements',a.pinned?'Pinned announcement':'Unpinned announcement',a.title,a.cat);renderAnns()}
    if(d){var b=anns.find(function(x){return x.id===d.dataset.adel});if(!b||!confirm('Delete "'+b.title+'"?'))return;anns=anns.filter(function(x){return x!==b});store(AKEY,anns);log('Announcements','Deleted announcement',b.title,b.cat);renderAnns();notify('Announcement deleted.')}
  });

  var ha=$('homeAnns');if(ha){ha.addEventListener('click',function(e){if(e.target.closest('.home-ann'))showView('announcements')});ha.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.closest('.home-ann')){e.preventDefault();showView('announcements')}})}
  renderInspo();renderAnns();
})();


/* ---- block 5 ---- */
// ===== Request Comms Work: brief form for other departments + comms request queue =====
(function(){
  var $=function(id){return document.getElementById(id)};
  if(!$('rqForm'))return;
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function pad(n){return String(n).padStart(2,'0')}
  function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  function pd(s){var p=String(s).split('-').map(Number);return new Date(p[0],(p[1]||1)-1,p[2]||1)}
  function nice(s){if(!s)return '';var d=pd(s);return d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear()}
  function esc(s){return typeof safe==='function'?safe(s==null?'':s):String(s==null?'':s)}
  function log(a,t,d){if(window.logActivity)window.logActivity('Comms Requests',a,t,d)}
  function addDays(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n)}
  function workDays(to){var t=new Date(),d=new Date(t.getFullYear(),t.getMonth(),t.getDate()),end=pd(to),n=0;if(end<=d)return 0;while(d<end){d=addDays(d,1);if(d.getDay()!==0&&d.getDay()!==6)n++}return n}
  function addWorkDays(n){var d=new Date();d=new Date(d.getFullYear(),d.getMonth(),d.getDate());while(n>0){d=addDays(d,1);if(d.getDay()!==0&&d.getDay()!==6)n--}return d}

  // Suggested working-day lead times (edit to match the team's real capacity)
  var TYPES={'Banner / standee':4,'Brochure / booklet':7,'Carousel (multi-slide post)':3,'Certificate':2,'Email mailer':2,'Event photography / coverage':2,'Invitation':2,'Newsletter':5,'Poster / flyer':3,'Presentation (PPT)':3,'Social media post':2,'Video / reel':5,'Other':3};
  var AUD=['Corporate / employers','DHH community','Funders / CSR partners','General public','Government / officials','Parents','Students','TEACH staff'];
  var PLATS=['Instagram post','Instagram story / reel','LinkedIn','Facebook','YouTube','WhatsApp','Email','Website','Screen / projector (16:9)'];
  var LANGS=['English','Hindi','Marathi'];
  var A11Y=['ISL video / interpreter','Captions on video','Alt text for images','Easy English version','High-contrast large text'];
  var STATUSES=['New','Accepted','In Progress','Draft Shared','Delivered','On Hold','Declined'];
  var SCOL={'New':'#f45b45','Accepted':'#2774c8','In Progress':'#c98a00','Draft Shared':'#7a4fb5','Delivered':'#16885c','On Hold':'#777b80','Declined':'#777b80'};

  var TYPE_LIST=Object.keys(TYPES).filter(function(t){return t!=='Other'}).sort(function(a,b){return a.localeCompare(b)}).concat(['Other']);
  $('rqType').innerHTML='<option value="">Choose…</option>'+TYPE_LIST.map(function(t){return '<option>'+t+'</option>'}).join('');
  function pills(id,name,list){$(id).innerHTML=list.map(function(v){return '<label class="rq-pill"><input type="checkbox" name="'+name+'" value="'+esc(v)+'">'+esc(v)+'</label>'}).join('')}
  pills('rqAudience','rqAud',AUD);pills('rqPlatforms','rqPlat',PLATS);pills('rqLang','rqLng',LANGS);pills('rqA11y','rqAcc',A11Y);
  document.querySelector('input[name=rqLng][value="English"]').checked=true;
  $('rqLeadGrid').innerHTML=TYPE_LIST.map(function(t){return '<div><b>'+TYPES[t]+' days</b>'+esc(t)+'</div>'}).join('');

  var FIELDS=['rqName','rqDept','rqCampus','rqType','rqTitle','rqPurpose','rqCta','rqSize','rqOrient','rqQty','rqCustom','rqSides','rqPaper','rqPrinter','rqDeliver','rqCopy','rqPhotos','rqLogos','rqLink','rqDeadline','rqEvent','rqDraft','rqNotes'];
  var GROUPS={audience:'rqAud',platforms:'rqPlat',languages:'rqLng',accessibility:'rqAcc'};
  function out(){var r=document.querySelector('input[name=rqOut]:checked');return r?r.value:'Digital only'}
  function hasPrint(v){return /Print/.test(v||out())}
  function hasDigital(v){return /Digital/.test(v||out())}
  function readForm(){var o={output:out()};FIELDS.forEach(function(f){o[f.slice(2).toLowerCase()]=$(f).value.trim()});Object.keys(GROUPS).forEach(function(k){o[k]=[].map.call(document.querySelectorAll('input[name='+GROUPS[k]+']:checked'),function(i){return i.value})});return o}
  function writeForm(o){FIELDS.forEach(function(f){var k=f.slice(2).toLowerCase();if(o[k]!=null)$(f).value=o[k]});Object.keys(GROUPS).forEach(function(k){document.querySelectorAll('input[name='+GROUPS[k]+']').forEach(function(i){i.checked=(o[k]||[]).indexOf(i.value)>-1})});document.querySelectorAll('input[name=rqOut]').forEach(function(r){r.checked=r.value===o.output});document.querySelectorAll('.rq-form .invalid').forEach(function(x){x.classList.remove('invalid')});syncOutput();updateLead()}

  function syncOutput(){$('rqPrint').hidden=!hasPrint();$('rqDigital').hidden=!hasDigital();$('rqCustomWrap').hidden=!/Custom|Flex/.test($('rqSize').value)}
  function recommended(o){o=o||readForm();var base=TYPES[o.type]||7;if(hasPrint(o.output))base+=2;if((o.accessibility||[]).indexOf('ISL video / interpreter')>-1)base+=2;return base}
  function priority(o){var rec=recommended(o),wd=workDays(o.deadline);if(wd>=rec)return 'Standard';if(wd>=Math.ceil(rec/2))return 'Urgent';return 'Rush'}
  function updateLead(){
    var o=readForm(),el=$('rqLead');
    if(!o.deadline){el.className='rq-lead';el.innerHTML=o.type?'Suggested notice for this request: <b>'+recommended(o)+' working days</b> (earliest comfortable date: '+nice(ymd(addWorkDays(recommended(o))))+').':'';return}
    var rec=recommended(o),wd=workDays(o.deadline),p=priority(o);
    var extra=(hasPrint(o.output)?' Includes 2 days for printing.':'')+((o.accessibility||[]).indexOf('ISL video / interpreter')>-1?' Includes 2 days for the ISL video.':'');
    if(wd===0){el.className='rq-lead bad';el.innerHTML='⚠ This deadline is today or in the past. Please choose a future date.';return}
    el.className='rq-lead '+(p==='Standard'?'ok':p==='Urgent'?'warn':'bad');
    el.innerHTML=(p==='Standard'?'✓ ':'⚠ ')+'You are giving <b>'+wd+' working day'+(wd===1?'':'s')+'</b>. Suggested for this request: <b>'+rec+'</b>.'+extra+' This will be marked <b>'+p+'</b>'+(p==='Rush'?' and needs the comms manager to agree before work starts.':p==='Urgent'?'; quality may be limited, so please send all content on day one.':'.');
  }

  // Pre-filled example so departments can see a complete brief
  function example(){
    var dl=addWorkDays(8),ev=addDays(dl,4),dr=addWorkDays(4);
    return {name:'Sneha Kulkarni',dept:'Skills',campus:'Pune',type:'Poster / flyer',title:'Placement Drive 2026 – Pune Campus',purpose:'Invite final-year DHH students to register for the on-campus placement drive with 12 partner companies. The main message: jobs are coming to campus, and ISL interpreters will be at every interview.',cta:'Scan the QR code to register by '+nice(ymd(dl)),audience:['Students','Parents','Corporate / employers'],output:'Digital + Print',platforms:['Instagram post','Instagram story / reel','LinkedIn','WhatsApp'],size:'A3 (297 × 420 mm)',orient:'Portrait',qty:'40',custom:'',sides:'Single-sided',paper:'Matte paper (130 gsm)',printer:'Comms team to arrange vendor',deliver:'Pune campus reception, 2nd floor',copy:'Rough draft, please polish',photos:'Use TEACH photo library',logos:'All 12 partner company logos (list and files in the Drive link)',languages:['English','Marathi'],accessibility:['ISL video / interpreter','Alt text for images','High-contrast large text'],link:'https://drive.google.com/drive/folders/placement-drive-2026',deadline:ymd(dl),event:ymd(ev),draft:ymd(dr),notes:'Please use the TEACH coral and yellow colours. Mention the date, time and venue clearly. A 30-second ISL video of the same message would be great for Instagram and WhatsApp.'};
  }

  var KEY='teach-comm-requests',reqs;
  try{reqs=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){reqs=null}
  if(!Array.isArray(reqs)){var ex=example();ex.id='CR-EX';ex.example=true;ex.status='Accepted';ex.submitted=new Date().toISOString();ex.priority=priority(ex);reqs=[ex]}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(reqs))}catch(e){}}
  save();
  function nextId(){var n=reqs.reduce(function(m,r){var x=parseInt(String(r.id).replace(/\D/g,''),10);return isNaN(x)?m:Math.max(m,x)},0)+1;return 'CR-'+String(n).padStart(4,'0')}
  var rqFilter='Open',rqEdit=null;

  function outTags(r){var t=[];if(hasPrint(r.output))t.push('🖨 '+(r.size?r.size.split(' (')[0]:'Print')+(r.qty?' × '+r.qty:''));if(hasDigital(r.output)&&r.platforms&&r.platforms.length)t.push('💻 '+r.platforms.slice(0,2).join(', ')+(r.platforms.length>2?' +'+(r.platforms.length-2):''));if((r.accessibility||[]).indexOf('ISL video / interpreter')>-1)t.push('🤟 ISL');return t}
  function dueInfo(r){if(!r.deadline)return {t:'No deadline',bg:'#eee'};if(r.status==='Delivered')return {t:'Delivered',bg:'#e1f7eb'};var wd=workDays(r.deadline);if(pd(r.deadline)<pd(ymd(new Date())))return {t:'Overdue · '+nice(r.deadline),bg:'#ffd6cc'};if(wd<=2)return {t:'Due '+nice(r.deadline)+' · '+wd+' days',bg:'#ffe4dc'};return {t:'Due '+nice(r.deadline)+' · '+wd+' work days',bg:'#fff0cc'}}

  function renderQueue(){
    var open=reqs.filter(function(r){return ['Delivered','Declined'].indexOf(r.status)<0}).length;
    $('rqCount').textContent=open;
    var F={'Open':function(r){return ['Delivered','Declined'].indexOf(r.status)<0},'Rush & Urgent':function(r){return r.priority!=='Standard'&&['Delivered','Declined'].indexOf(r.status)<0},'Print jobs':function(r){return hasPrint(r.output)},'Delivered':function(r){return r.status==='Delivered'},'All':function(){return true}};
    $('rqFilters').innerHTML=Object.keys(F).map(function(k){return '<button type="button" data-rqf="'+k+'" class="'+(rqFilter===k?'on':'')+'">'+k+' <span class="cnt">'+reqs.filter(F[k]).length+'</span></button>'}).join('');
    var list=reqs.filter(F[rqFilter]).sort(function(a,b){return (a.deadline||'9').localeCompare(b.deadline||'9')});
    $('rqQueue').innerHTML=list.length?list.map(function(r){var due=dueInfo(r);return '<article class="rq-card'+(r.example?' example':'')+'" style="--rc:'+(SCOL[r.status]||'#f45b45')+'"><div><span class="rq-id">'+esc(r.id)+(r.example?' · EXAMPLE REQUEST':'')+'</span><h3>'+esc(r.title)+'</h3><div class="rq-meta">'+esc(r.type)+' · '+esc(r.dept)+(r.campus?' ('+esc(r.campus)+')':'')+' · Requested by '+esc(r.name)+'</div><div class="rq-tags">'+'<span class="rq-tag" style="background:'+(r.priority==='Standard'?'#e1f7eb':r.priority==='Urgent'?'#fff0cc':'#ffe4dc')+'">'+esc(r.priority)+'</span>'+outTags(r).map(function(t){return '<span class="rq-tag">'+esc(t)+'</span>'}).join('')+'</div></div><div class="rq-side"><span class="rq-due" style="background:'+due.bg+'">'+esc(due.t)+'</span><select data-rqstatus="'+esc(r.id)+'" aria-label="Status">'+STATUSES.map(function(s){return '<option'+(s===r.status?' selected':'')+'>'+s+'</option>'}).join('')+'</select><button type="button" class="mini-btn" data-rqedit="'+esc(r.id)+'">✎ Edit</button><button type="button" class="mini-btn" data-rqview="'+esc(r.id)+'">View full brief</button><button type="button" class="mini-btn danger" data-rqdel="'+esc(r.id)+'">Delete</button></div></article>'}).join(''):'<div class="g-empty">No requests here.</div>';
  }

  function row(label,val){if(val==null||val===''||(Array.isArray(val)&&!val.length))return '';return '<dt>'+esc(label)+'</dt><dd>'+esc(Array.isArray(val)?val.join(', '):val)+'</dd>'}
  function brief(r){
    var h='<div class="rq-brief"><h4>Requester</h4><dl>'+row('Name',r.name)+row('Department',r.dept)+row('Campus',r.campus)+'</dl>';
    h+='<h4>The request</h4><dl>'+row('Request ID',r.id)+row('Type',r.type)+row('Title',r.title)+row('Purpose / key message',r.purpose)+row('Audience',r.audience)+row('Call to action',r.cta)+'</dl>';
    h+='<h4>Format</h4><dl>'+row('Output',r.output)+(hasDigital(r.output)?row('Digital use',r.platforms):'')+(hasPrint(r.output)?row('Print size',r.size+(r.custom?' – '+r.custom:''))+row('Orientation',r.orient)+row('Quantity',r.qty)+row('Sides',r.sides)+row('Paper / material',r.paper)+row('Printing arranged by',r.printer)+row('Deliver prints to',r.deliver):'')+'</dl>';
    h+='<h4>Content</h4><dl>'+row('Text / copy',r.copy)+row('Photos',r.photos)+row('Logos',r.logos)+row('Languages',r.languages)+row('Accessibility',r.accessibility)+row('Files / reference',r.link)+'</dl>';
    h+='<h4>Timeline</h4><dl>'+row('Needed by',nice(r.deadline))+row('Event / publish date',nice(r.event))+row('First draft by',nice(r.draft))+row('Priority',r.priority)+row('Status',r.status)+row('Submitted',r.submitted?new Date(r.submitted).toLocaleString():'')+'</dl>';
    if(r.notes)h+='<h4>Notes</h4><dl>'+row('Notes',r.notes)+'</dl>';
    return h+'</div>';
  }
  var openId=null;
  function openBrief(id){var r=reqs.find(function(x){return x.id===id});if(!r)return;openId=id;$('rqModalTitle').textContent=r.id+' · '+r.title;$('rqModalBody').innerHTML=brief(r);$('rqModal').hidden=false;$('rqModalClose').focus()}
  function closeBrief(){$('rqModal').hidden=true;openId=null}
  $('rqModalClose').addEventListener('click',closeBrief);
  $('rqModal').addEventListener('click',function(e){if(e.target===$('rqModal'))closeBrief()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('rqModal').hidden)closeBrief()});
  $('rqModalPrint').addEventListener('click',function(){var r=reqs.find(function(x){return x.id===openId});if(!r)return;var area=$('printArea');if(!area){area=document.createElement('div');area.id='printArea';document.body.appendChild(area)}area.innerHTML='<h1>Comms Request Brief – '+esc(r.id)+'</h1><div class="pmeta">'+esc(r.title)+' · '+esc(r.dept)+'</div>'+brief(r);document.body.classList.add('printing');var done=function(){document.body.classList.remove('printing');window.removeEventListener('afterprint',done)};window.addEventListener('afterprint',done);setTimeout(function(){window.print();setTimeout(done,1500)},50)});
  $('rqModalTask').addEventListener('click',function(){var r=reqs.find(function(x){return x.id===openId});if(!r)return;if(!window.teachAddTask)return;var had=document.querySelector('[data-tk]')&&0;var before=(function(){try{return JSON.parse(localStorage.getItem('teach-comm-tasks')||'[]').some(function(t){return t.requestId===r.id})}catch(e){return false}})();var t=window.teachAddTask({title:r.title,owner:'',date:r.draft||r.deadline||'',status:'Not Started',notes:r.purpose,requestId:r.id},true);if(before)return;log('Added request to Task Tracker',r.title,r.id);closeBrief();window.teachOpenTask(t.id);notify('Added to the Team Task Tracker.')});
  function save_tasks(x){try{localStorage.setItem('teach-comm-tasks',JSON.stringify(tasks))}catch(e){}if(typeof renderList==='function')renderList('taskCards',[x],'tasks')}

  // Tabs
  function tab(name){document.querySelectorAll('[data-rqtab]').forEach(function(b){b.classList.toggle('on',b.dataset.rqtab===name);b.setAttribute('aria-selected',b.dataset.rqtab===name)});document.querySelectorAll('[data-rqpane]').forEach(function(p){p.hidden=p.dataset.rqpane!==name});if(name==='queue')renderQueue()}
  document.querySelector('.rq-tabs').addEventListener('click',function(e){var b=e.target.closest('[data-rqtab]');if(b)tab(b.dataset.rqtab)});

  // Form behaviour
  $('rqForm').addEventListener('change',function(e){if(e.target.name==='rqOut'||e.target.id==='rqSize')syncOutput();updateLead()});
  $('rqForm').addEventListener('input',function(e){e.target.classList.remove('invalid');if(e.target.type==='date')updateLead()});
  $('rqExample').addEventListener('click',function(){tab('form');writeForm(example());$('rqExampleNote').hidden=false;$('rqForm').scrollIntoView({behavior:'smooth',block:'start'})});
  $('rqClear').addEventListener('click',function(){rqEdit=null;$('rqEditNote').hidden=true;var sb=$('rqForm').querySelector('.rq-submit [type=submit]');if(sb)sb.textContent='Submit request →';$('rqForm').reset();document.querySelector('input[name=rqLng][value="English"]').checked=true;$('rqExampleNote').hidden=true;document.querySelectorAll('.rq-form .invalid').forEach(function(x){x.classList.remove('invalid')});syncOutput();updateLead()});
  $('rqForm').addEventListener('submit',function(e){
    e.preventDefault();var o=readForm(),req=['rqName','rqDept','rqType','rqTitle','rqPurpose','rqDeadline'];
    if(hasPrint(o.output))req.push('rqSize','rqQty');
    var missing=req.filter(function(id){return !$(id).value.trim()});
    document.querySelectorAll('.rq-form .invalid').forEach(function(x){x.classList.remove('invalid')});
    missing.forEach(function(id){$(id).classList.add('invalid')});
    if(missing.length){$(missing[0]).focus();return notify('Please fill the highlighted fields.')}
    if(hasDigital(o.output)&&!o.platforms.length)return notify('Please choose where the digital version will be used.');
    if(workDays(o.deadline)===0)return notify('Please choose a deadline in the future.');
    if(o.link&&!/^https?:\/\//i.test(o.link))return notify('Please use a full link starting with https://');
    if(rqEdit){var ex=reqs.find(function(x){return x.id===rqEdit});if(ex){var keep={id:ex.id,status:ex.status,submitted:ex.submitted,example:false};Object.keys(ex).forEach(function(k){delete ex[k]});Object.assign(ex,o,keep,{priority:priority(o),edited:new Date().toISOString()});save();log('Request edited',ex.title,ex.id+' · '+ex.type+' · Due '+nice(ex.deadline)+' · '+ex.priority);rqEdit=null;$('rqClear').click();rqFilter='Open';tab('queue');notify('Request '+ex.id+' updated.');return}rqEdit=null}
    o.id=nextId();o.status='New';o.priority=priority(o);o.submitted=new Date().toISOString();
    reqs.push(o);save();
    log('New request submitted',o.title,o.id+' · '+o.type+' · '+o.dept+' · '+o.output+(hasPrint(o.output)?' · '+o.size+' × '+o.qty:'')+' · Due '+nice(o.deadline)+' · '+o.priority);
    $('rqClear').click();rqFilter='Open';tab('queue');openBrief(o.id);notify('Request '+o.id+' sent to the communication team.');
  });

  // Queue actions
  $('rqQueue').addEventListener('click',function(e){var b=e.target.closest('[data-rqedit]');if(!b)return;var r=reqs.find(function(x){return x.id===b.dataset.rqedit});if(!r)return;rqEdit=r.id;tab('form');writeForm(r);var sb=$('rqForm').querySelector('.rq-submit [type=submit]');if(sb)sb.textContent='Save changes';$('rqExampleNote').hidden=true;$('rqEditNote').hidden=false;$('rqEditNote').innerHTML='✎ <b>Editing '+esc(r.id)+'.</b> Change anything and press <b>Save changes</b>, or press <b>Clear form</b> to cancel.';$('rqForm').scrollIntoView({behavior:'smooth',block:'start'});notify('Editing '+r.id+'.')});
  $('rqFilters').addEventListener('click',function(e){var b=e.target.closest('[data-rqf]');if(!b)return;rqFilter=b.dataset.rqf;renderQueue()});
  $('rqQueue').addEventListener('change',function(e){var s=e.target.closest('[data-rqstatus]');if(!s)return;var r=reqs.find(function(x){return x.id===s.dataset.rqstatus});if(!r)return;var old=r.status;r.status=s.value;save();log('Request status changed',r.title,r.id+' · '+old+' → '+r.status);renderQueue();notify(r.id+' marked '+r.status+'.')});
  $('rqQueue').addEventListener('click',function(e){var v=e.target.closest('[data-rqview]'),d=e.target.closest('[data-rqdel]');if(v)openBrief(v.dataset.rqview);if(d){var r=reqs.find(function(x){return x.id===d.dataset.rqdel});if(!r||!confirm('Delete request '+r.id+'?'))return;reqs=reqs.filter(function(x){return x!==r});save();log('Request deleted',r.title,r.id);renderQueue()}});

  window.teachRequestBrief=function(id){var r=reqs.find(function(x){return x.id===id});return r?brief(r):null};
  window.teachOpenRequest=function(id){showView('request');tab('queue');openBrief(id)};
  syncOutput();updateLead();renderQueue();
})();


/* ---- block 6 ---- */
// ===== Team Task Tracker: expandable task list, linked to comms requests =====
(function(){
  var $=function(id){return document.getElementById(id)};
  if(!$('tkList'))return;
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var STATUSES=['Not Started','In Progress','For Review','Completed'];
  var SCLS={'Not Started':'todo','In Progress':'progress','For Review':'review','Completed':''};
  function pad(n){return String(n).padStart(2,'0')}
  function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  function pd(s){var p=String(s).split('-').map(Number);return new Date(p[0],(p[1]||1)-1,p[2]||1)}
  function nice(s){if(!s)return '';var d=pd(s);return d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear()}
  function esc(s){return typeof safe==='function'?safe(s==null?'':s):String(s==null?'':s)}
  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
  function initials(n){return String(n||'?').split(/\s+/).map(function(w){return w.charAt(0)}).join('').slice(0,2).toUpperCase()}
  function log(a,t,d){if(window.logActivity)window.logActivity('Team Tasks',a,t,d)}
  var KEY='teach-comm-tasks',list=[];
  try{list=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){list=[]}
  if(!Array.isArray(list))list=[];
  var seeded=false;try{seeded=localStorage.getItem(KEY+'-seeded')==='1'}catch(e){}
  if(!seeded){list=list.concat([
    {title:'Social Media Posts (Oct)',owner:'Riya',date:'2026-10-26',status:'In Progress',notes:'All October posts for Instagram and LinkedIn, with captions and alt text.'},
    {title:'Poster Design – CTEI',owner:'Amit',date:'2026-10-28',status:'For Review',notes:'A3 poster for the CTEI programme launch.'},
    {title:'Event Invite – Annual Day',owner:'Sheha',date:'2026-10-30',status:'Not Started',notes:'Digital invite plus a WhatsApp version.'},
    {title:'Newsletter Design',owner:'Pratik',date:'2026-11-02',status:'Completed',notes:'October newsletter layout.'}])}
  list=list.map(function(t){var m=/^(CR-[\w]+) · (.*)$/.exec(t.title||'');return {id:t.id||uid(),title:m&&!t.requestId?m[2]:(t.title||'Untitled task'),owner:t.owner||'',date:t.date||'',status:STATUSES.indexOf(t.status)>-1?t.status:'Not Started',notes:t.notes||'',requestId:t.requestId||(m?m[1]:''),a11y:t.a11y||[],createdAt:t.createdAt||''}});
  function save(){try{localStorage.setItem(KEY,JSON.stringify(list));localStorage.setItem(KEY+'-seeded','1')}catch(e){}}
  save();
  var filter='Open',openIds={};

  function dueText(t){if(!t.date)return '<span class="tk-due">No deadline</span>';if(t.status==='Completed')return '<span class="tk-due">'+nice(t.date)+'</span>';var today=pd(ymd(new Date())),d=pd(t.date),diff=Math.round((d-today)/864e5);var cls=diff<0?'late':diff<=2?'soon':'';var lbl=diff<0?Math.abs(diff)+' day'+(diff===-1?'':'s')+' late':diff===0?'Today':diff===1?'Tomorrow':'in '+diff+' days';return '<span class="tk-due '+cls+'">'+nice(t.date)+'<em>'+lbl+'</em></span>'}

  function render(){
    var q=$('tkSearch').value.trim().toLowerCase();
    var F={'Open':function(t){return t.status!=='Completed'},'Not Started':function(t){return t.status==='Not Started'},'In Progress':function(t){return t.status==='In Progress'},'For Review':function(t){return t.status==='For Review'},'Completed':function(t){return t.status==='Completed'},'From requests':function(t){return !!t.requestId},'All':function(){return true}};
    $('tkFilters').innerHTML=Object.keys(F).map(function(k){return '<button type="button" data-tkf="'+k+'" class="'+(filter===k?'on':'')+'">'+k+' <span class="cnt">'+list.filter(F[k]).length+'</span></button>'}).join('');
    var rows=list.filter(F[filter]).filter(function(t){return !q||(t.title+' '+t.owner+' '+t.notes+' '+t.requestId).toLowerCase().indexOf(q)>-1}).sort(function(a,b){if((a.status==='Completed')!==(b.status==='Completed'))return a.status==='Completed'?1:-1;return (a.date||'9').localeCompare(b.date||'9')});
    $('tkList').innerHTML=rows.length?rows.map(function(t){var open=!!openIds[t.id];return '<article class="tk'+(open?' open':'')+(t.status==='Completed'?' done':'')+'" data-tk="'+t.id+'"><button type="button" class="tk-row" aria-expanded="'+open+'" data-toggle="'+t.id+'"><span class="tk-name"><b>'+esc(t.title)+'</b>'+'<span class="tk-tags">'+(t.requestId?'<span class="tk-req">✉ '+esc(t.requestId)+'</span>':'')+(window.teachA11yBadge?window.teachA11yBadge(t.a11y):'')+(window.teachApprovalBadge?window.teachApprovalBadge('task:'+t.id):'')+'</span>'+(t.notes&&!open?'<small>'+esc(t.notes.length>80?t.notes.slice(0,78)+'…':t.notes)+'</small>':'')+'</span><span class="tk-owner">'+(t.owner?'<i>'+esc(initials(t.owner))+'</i>'+esc(t.owner):'<span class="tk-none">Unassigned</span>')+'</span>'+dueText(t)+'<span><span class="status '+SCLS[t.status]+'">'+esc(t.status)+'</span></span><span class="tk-chev" aria-hidden="true">⌄</span></button>'+(open?body(t):'')+'</article>'}).join(''):'<div class="g-empty">No tasks here.</div>';
    renderHome();
  }

  function body(t){
    var brief=t.requestId&&window.teachRequestBrief?window.teachRequestBrief(t.requestId):null;
    var h='<div class="tk-body"><div class="tk-edit"><label>Task name<input data-f="title" value="'+esc(t.title)+'"></label><label>Owner<input data-f="owner" value="'+esc(t.owner)+'" placeholder="Unassigned"></label><label>Deadline<input type="date" data-f="date" value="'+esc(t.date)+'"></label><label>Status<select data-f="status">'+STATUSES.map(function(s){return '<option'+(s===t.status?' selected':'')+'>'+s+'</option>'}).join('')+'</select></label><label class="wide">Details<textarea data-f="notes" placeholder="Add details for the team…">'+esc(t.notes)+'</textarea></label></div>';
    h+=(window.teachA11yHtml?window.teachA11yHtml('task',t.id,t.a11y,false):'')+'<div class="appr-row">'+(window.teachApprovalBadge?window.teachApprovalBadge('task:'+t.id):'')+'<button type="button" class="mini-btn appr-btn" data-tapprove="'+t.id+'">✓ Send for approval</button></div>';
    h+='<div class="tk-actions"><span class="tk-meta">'+(t.createdAt?'Created '+new Date(t.createdAt).toLocaleString():'Sample task')+'</span><button type="button" class="outline" data-del="'+t.id+'">Delete</button><button type="button" class="primary" data-save="'+t.id+'">Save changes</button></div>';
    if(t.requestId){h+='<div class="tk-brief"><div class="tk-brief-head"><h4>✉ From comms request '+esc(t.requestId)+'</h4>'+(brief?'<button type="button" class="mini-btn" data-openreq="'+esc(t.requestId)+'">Open in request queue ↗</button>':'')+'</div>'+(brief||'<p class="tk-none">The original request is no longer in the request queue.</p>')+'</div>'}
    return h+'</div>';
  }

  function renderHome(){var tb=$('homeTasks');if(!tb)return;var rows=list.slice().sort(function(a,b){if((a.status==='Completed')!==(b.status==='Completed'))return a.status==='Completed'?1:-1;return (a.date||'9').localeCompare(b.date||'9')}).slice(0,5);tb.innerHTML=rows.map(function(t){var d=t.date?pd(t.date):null;return '<tr data-hometask="'+t.id+'" tabindex="0" title="Open task"><td>'+esc(t.title)+(t.requestId?' <span class="tk-req">✉</span>':'')+'</td><td>'+esc(t.owner||'—')+'</td><td>'+(d?pad(d.getDate())+' '+MON[d.getMonth()]:'—')+'</td><td><span class="status '+SCLS[t.status]+'">'+esc(t.status)+'</span></td></tr>'}).join('')||'<tr><td colspan="4">No tasks yet.</td></tr>'}

  window.teachAddTask=function(t,quiet){
    if(t.requestId){var ex=list.find(function(x){return x.requestId===t.requestId});if(ex){if(typeof notify==='function')notify('This request is already in the Task Tracker.');return ex}}
    var n={id:uid(),title:t.title||'Untitled task',owner:t.owner||'',date:t.date||'',status:t.status||'Not Started',notes:t.notes||'',requestId:t.requestId||'',createdAt:new Date().toISOString()};
    list.push(n);save();if(!quiet)log('Added task',n.title,'Owner: '+(n.owner||'Unassigned')+' · Deadline: '+(n.date?nice(n.date):'Not set')+' · '+n.status);render();return n;
  };
  window.teachGetTasks=function(){return list.slice()};
  window.teachOpenTask=function(id){openIds={};openIds[id]=true;filter='All';$('tkSearch').value='';showView('tasks');render();var el=document.querySelector('[data-tk="'+id+'"]');if(el)setTimeout(function(){el.scrollIntoView({behavior:'smooth',block:'center'})},60)};

  function openForm(show){$('tkForm').hidden=!show;$('tkToggle').textContent=show?'Close':'+ Add task';if(show)$('tkTitle').focus()}
  $('tkToggle').addEventListener('click',function(){openForm($('tkForm').hidden)});
  $('tkCancel').addEventListener('click',function(){$('tkForm').reset();openForm(false)});
  $('tkForm').addEventListener('submit',function(e){e.preventDefault();var title=$('tkTitle').value.trim();if(!title)return notify('Please enter a task name.');window.teachAddTask({title:title,owner:$('tkOwner').value.trim(),date:$('tkDate').value,status:$('tkStatus').value,notes:$('tkNotes').value.trim()});$('tkForm').reset();openForm(false);filter='Open';render();notify('Task added.')});
  $('tkFilters').addEventListener('click',function(e){var b=e.target.closest('[data-tkf]');if(!b)return;filter=b.dataset.tkf;render()});
  $('tkSearch').addEventListener('input',render);
  $('tkList').addEventListener('change',function(e){var a=e.target.closest('[data-a11y]');if(!a)return;var b=a.dataset.a11y.split('|');if(b[0]!=='task')return;var t=list.find(function(x){return x.id===b[1]});if(!t)return;t.a11y=window.teachA11yToggle(t.a11y,b[2],a.checked);save();log(a.checked?'Ticked checklist item':'Unticked checklist item',t.title,window.teachA11yLabel(b[2])+' · '+window.teachA11yScore(t.a11y)+'/6');var box=a.closest('.a11y-box');var bd=box.querySelector('summary .a11y-badge');if(bd)bd.outerHTML=window.teachA11yBadge(t.a11y);var n=window.teachA11yScore(t.a11y),h=box.querySelector('.a11y-hint');if(h){h.className='a11y-hint'+(n===6?' ok':'');h.textContent=n===6?'All checks done. Ready to share.':'Tick each item before sending for approval.'}var row=a.closest('.tk').querySelector('.tk-tags .a11y-badge');if(row)row.outerHTML=window.teachA11yBadge(t.a11y)});
  $('tkList').addEventListener('click',function(e){
    var ta=e.target.closest('[data-tapprove]');if(ta){var tt=list.find(function(x){return x.id===ta.dataset.tapprove});if(tt&&window.teachSendForApproval){window.teachSendForApproval({title:tt.title,type:'Creative task',refKind:'Task',refId:'task:'+tt.id,a11y:tt.a11y});render()}return}
    var tg=e.target.closest('[data-toggle]'),sv=e.target.closest('[data-save]'),dl=e.target.closest('[data-del]'),orq=e.target.closest('[data-openreq]');
    if(tg){var id=tg.dataset.toggle;openIds[id]=!openIds[id];render();return}
    if(orq&&window.teachOpenRequest){window.teachOpenRequest(orq.dataset.openreq);return}
    if(sv){var t=list.find(function(x){return x.id===sv.dataset.save});if(!t)return;var box=sv.closest('.tk'),old=Object.assign({},t),ch=[];box.querySelectorAll('[data-f]').forEach(function(i){var v=i.value.trim();if(i.dataset.f==='title'&&!v)return;if(t[i.dataset.f]!==v){ch.push(i.dataset.f);t[i.dataset.f]=v}});if(!ch.length)return notify('No changes to save.');save();log(ch.indexOf('status')>-1&&ch.length===1?'Changed task status':'Updated task',t.title,ch.indexOf('status')>-1?old.status+' → '+t.status:'Changed: '+ch.join(', '));render();notify('Task saved.')}
    if(dl){var d=list.find(function(x){return x.id===dl.dataset.del});if(!d||!confirm('Delete "'+d.title+'"?'))return;list=list.filter(function(x){return x!==d});save();log('Deleted task',d.title,d.owner||'');render();notify('Task deleted.')}
  });
  var ht=$('homeTasks');if(ht){ht.addEventListener('click',function(e){var r=e.target.closest('[data-hometask]');if(r)window.teachOpenTask(r.dataset.hometask)});ht.addEventListener('keydown',function(e){var r=e.target.closest('[data-hometask]');if(r&&(e.key==='Enter'||e.key===' ')){e.preventDefault();window.teachOpenTask(r.dataset.hometask)}})}
  document.querySelectorAll('[data-view="tasks"],[data-go="tasks"]').forEach(function(b){b.addEventListener('click',render)});
  render();
})();


/* ---- block 7 ---- */
// ===== Creative Projects Hub: project cards that open to everything linked to the project =====
(function(){
  var $=function(id){return document.getElementById(id)};
  if(!$('pjGrid'))return;
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var STATUSES=['Planned','In Progress','For Review','Completed'];
  var SCLS={'Planned':'todo','In Progress':'progress','For Review':'review','Completed':''};
  var GRAD={'Campaign':['#f0563f','#ff8a65'],'Event':['#8b1c20','#f07c42'],'Poster series':['#24203d','#5a4380'],'Video':['#151515','#4a4a4a'],'Report / publication':['#064e62','#0a9eaa'],'Other':['#6b5a3e','#b08d57']};
  function pad(n){return String(n).padStart(2,'0')}
  function pd(s){var p=String(s).split('-').map(Number);return new Date(p[0],(p[1]||1)-1,p[2]||1)}
  function nice(s){if(!s)return '';var d=pd(s);return d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear()}
  function esc(s){return typeof safe==='function'?safe(s==null?'':s):String(s==null?'':s)}
  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
  function load(k){try{var v=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(v)?v:[]}catch(e){return []}}
  function log(a,t,d){if(window.logActivity)window.logActivity('Creative Projects',a,t,d)}
  var KEY='teach-comm-projects',list=load(KEY),seeded=false;
  try{seeded=localStorage.getItem(KEY+'-seeded')==='1'}catch(e){}
  if(!seeded){list=list.concat([
    {title:'TEACH 10 Years Campaign',type:'Campaign',status:'Completed',owner:'Pratik',start:'2026-09-15',due:'2026-10-12',desc:'Social media campaign and celebration creatives marking 10 years of TEACH.',keys:'10 Years, TEACH 10'},
    {title:'Inclusion to Impact',type:'Poster series',status:'In Progress',owner:'Riya',start:'2026-09-25',due:'2026-11-05',desc:'Poster series and social media content sharing student impact stories.',keys:'Inclusion'},
    {title:'Annual Day Lakshya 2025–26',type:'Event',status:'For Review',owner:'Sheha',start:'2026-09-10',due:'2026-11-15',desc:'Event branding, invitation and certificates for Annual Day.',keys:'Annual Day, Lakshya'}])}
  list=list.map(function(p){return {id:p.id||uid(),title:p.title||'Untitled project',type:GRAD[p.type]?p.type:'Campaign',status:STATUSES.indexOf(p.status)>-1?p.status:'Planned',owner:p.owner||'',start:p.start||'',due:p.due||'',desc:p.desc||'',keys:p.keys||'',link:p.link||'',createdAt:p.createdAt||''}});
  function save(){try{localStorage.setItem(KEY,JSON.stringify(list));localStorage.setItem(KEY+'-seeded','1')}catch(e){}}
  save();
  var filter='All',openId=null;

  // Linking: an item belongs to a project when its name, campaign or notes contain the project name or one of its other names
  function terms(p){return [p.title].concat(String(p.keys||'').split(',')).map(function(t){return t.trim().toLowerCase()}).filter(function(t){return t.length>=3})}
  function hit(p,text){text=String(text||'').toLowerCase();return terms(p).some(function(t){return text.indexOf(t)>-1})}
  function linked(p){
    var posts=window.teachGetPosts?window.teachGetPosts():load('teach-comm-posts');
    return {
      tasks:load('teach-comm-tasks').filter(function(t){return hit(p,t.title+' '+t.notes)}),
      posts:posts.filter(function(x){return x.project===p.id||hit(p,x.title+' '+(x.notes||'')+' '+(x.tags||''))}),
      designs:(window.teachGetRefs?window.teachGetRefs():load('teach-comm-inspiration')).filter(function(x){return x.project===p.id||hit(p,x.title+' '+(x.tags||''))}),
      requests:load('teach-comm-requests').filter(function(x){return hit(p,x.title+' '+(x.purpose||''))}),
      approvals:load('teach-comm-approvals').filter(function(x){return hit(p,x.title)}),
      anns:load('teach-comm-announcements').filter(function(x){return hit(p,x.title+' '+(x.msg||''))}),
      activity:(window.teachActivity||[]).filter(function(a){return hit(p,a.title+' '+a.details)})
    };
  }
  function progress(L){var n=L.tasks.length,d=L.tasks.filter(function(t){return t.status==='Completed'}).length;return {n:n,d:d,pct:n?Math.round(d/n*100):0}}
  function mark(t){return esc(String(t).replace(/[–—-]/g,' ').split(/\s+/).filter(Boolean).slice(0,3).join(' '))}
  function due(p){if(!p.due)return 'No due date';if(p.status==='Completed')return 'Finished · '+nice(p.due);var diff=Math.round((pd(p.due)-pd(new Date().toISOString().slice(0,10)))/864e5);return 'Due '+nice(p.due)+(diff<0?' · '+Math.abs(diff)+' days late':diff===0?' · today':' · in '+diff+' days')}

  function render(){
    syncModeUI();var q=$('pjSearch').value.trim().toLowerCase();
    $('pjFilters').innerHTML=['All'].concat(STATUSES).map(function(s){var n=s==='All'?list.length:list.filter(function(p){return p.status===s}).length;return '<button type="button" data-pjf="'+s+'" class="'+(filter===s?'on':'')+'">'+s+' <span class="cnt">'+n+'</span></button>'}).join('');
    if(mode!=='cards'){renderMode();renderHome();renderWeek();return}
    var rows=list.filter(function(p){return (filter==='All'||p.status===filter)&&(!q||(p.title+' '+p.keys+' '+p.owner+' '+p.desc).toLowerCase().indexOf(q)>-1)}).sort(function(a,b){if((a.status==='Completed')!==(b.status==='Completed'))return a.status==='Completed'?1:-1;return (a.due||'9').localeCompare(b.due||'9')});
    $('pjGrid').innerHTML=rows.length?rows.map(function(p){var L=linked(p),pr=progress(L),g=GRAD[p.type];
      var hh=health(p,L);return '<button type="button" class="pj-card" data-pj="'+p.id+'" aria-label="Open '+esc(p.title)+'"><span class="pj-cover" style="--g1:'+g[0]+';--g2:'+g[1]+'"><span class="pj-type">'+esc(p.type)+'</span><span class="pj-mark">'+mark(p.title)+'</span></span><span class="pj-body"><span class="pj-top"><span class="status '+SCLS[p.status]+'">'+esc(p.status)+'</span>'+hpill(hh)+'<span class="pj-due">'+esc(due(p))+'</span></span><b class="pj-title">'+esc(p.title)+'</b>'+(p.desc?'<span class="pj-desc">'+esc(p.desc)+'</span>':'')+'<span class="pj-counts"><span title="Tasks">♧ '+L.tasks.length+'</span><span title="Social posts">▦ '+L.posts.length+'</span><span title="References">▧ '+L.designs.length+'</span><span title="Comms requests">✉ '+L.requests.length+'</span><span title="Approvals">✓ '+L.approvals.length+'</span></span><span class="pj-prog"><span class="pj-bar"><i style="width:'+pr.pct+'%"></i></span><small>'+(pr.n?pr.d+' of '+pr.n+' tasks done':'No tasks yet')+'</small></span><span class="pj-foot">'+(p.owner?'<i class="pj-av">'+esc(p.owner.charAt(0).toUpperCase())+'</i>'+esc(p.owner):'No lead set')+'<span class="pj-open">Open project →</span></span></span></button>'}).join(''):'<div class="g-empty">No projects here. Create one with “+ New project”.</div>';
    renderHome();renderWeek();
  }

  function sec(title,icon,items,empty,html){return '<section class="pj-sec"><h4><span>'+icon+'</span>'+title+' <em>'+items.length+'</em></h4>'+(items.length?'<div class="pj-items">'+items.map(html).join('')+'</div>':'<p class="pj-empty">'+empty+'</p>')+'</section>'}
  function item(main,sub,right,attrs){return '<div class="pj-item"'+(attrs||'')+'><div><b>'+main+'</b>'+(sub?'<small>'+sub+'</small>':'')+'</div>'+(right?'<div class="pj-item-r">'+right+'</div>':'')+'</div>'}
  function pill(s){var c={'Completed':'','Published':'','Approved':'','Delivered':'','In Progress':'progress','Draft':'todo','Planned':'todo','Not Started':'todo','New':'progress','For Review':'review','In Review':'review','Scheduled':'review','Needs Changes':'review','Pending Manager Review':'progress','Manager Approved':'review'}[s];return '<span class="status '+(c==null?'todo':c)+'">'+esc(s||'')+'</span>'}

  function openProject(id){
    var p=list.find(function(x){return x.id===id});if(!p)return;openId=id;var L=linked(p),pr=progress(L);
    $('pjModalType').textContent=p.type;$('pjModalTitle').textContent=p.title;
    var h='<div class="pj-summary"><div class="pj-stat"><b>'+pr.pct+'%</b><span>'+(pr.n?pr.d+' of '+pr.n+' tasks done':'No tasks yet')+'</span><span class="pj-bar"><i style="width:'+pr.pct+'%"></i></span></div><div class="pj-stat"><b>'+L.posts.length+'</b><span>Social posts</span></div><div class="pj-stat"><b>'+L.designs.length+'</b><span>References</span></div><div class="pj-stat"><b>'+L.requests.length+'</b><span>Comms requests</span></div><div class="pj-stat"><b>'+L.approvals.length+'</b><span>Approvals</span></div></div>';
    h+='<div class="pj-over"><div><span>Project lead</span><b>'+esc(p.owner||'Not set')+'</b></div><div><span>Status</span><b>'+pill(p.status)+'</b></div><div><span>Start</span><b>'+esc(nice(p.start)||'—')+'</b></div><div><span>Due</span><b>'+esc(due(p).replace(/^Due /,''))+'</b></div>'+(p.desc?'<p class="pj-over-desc">'+esc(p.desc)+'</p>':'')+(p.link?'<p class="pj-link"><a href="'+esc(p.link)+'" target="_blank" rel="noopener">Open main file ↗</a></p>':'')+'</div>';
    h+=sec('Tasks','♧',L.tasks,'No tasks mention this project yet.',function(t){return item(esc(t.title)+(t.requestId?' <span class="tk-req">✉ '+esc(t.requestId)+'</span>':''),esc((t.owner||'Unassigned')+(t.date?' · Due '+nice(t.date):'')),pill(t.status),' data-pjtask="'+esc(t.id)+'" role="button" tabindex="0"')})+'<div class="pj-add"><input id="pjNewTask" placeholder="Add a task to this project…" aria-label="New task for this project"><button type="button" class="outline" id="pjAddTask">+ Add task</button></div>';
    var ph=health(p,L);h+='<div class="appr-row pj-appr">'+hpill(ph)+'<small>'+esc(ph.why)+'</small><span style="margin-left:auto"></span>'+(window.teachApprovalBadge?window.teachApprovalBadge('project:'+p.id):'')+'<button type="button" class="mini-btn appr-btn" id="pjApprove">✓ Send for approval</button></div>';
    h+=sec('Social posts','▦',L.posts.slice().sort(function(a,b){return (a.date||'').localeCompare(b.date||'')}),'No social posts planned for this project.',function(x){return item(esc(x.title),esc((x.platforms||[x.platform]).join(', ')+(x.date?' · '+nice(x.date):'')+(x.time?' · '+x.time:'')),pill(x.status))});
    h+=sec('References','▧',L.designs,'No references from the Inspiration Board are linked to this project.',function(x){return item(esc(x.title),esc(x.source+(x.likes&&x.likes.length?' · We like: '+x.likes.join(', '):'')),(x.link?'<a href="'+esc(x.link)+'" target="_blank" rel="noopener" class="mini-btn">Source ↗</a>':''),' data-pjref="1" role="button" tabindex="0"')});
    h+=sec('Comms requests','✉',L.requests,'No comms requests for this project.',function(x){return item(esc(x.id+' · '+x.title),esc((x.dept||'')+(x.output?' · '+x.output:'')+(x.size&&/Print/.test(x.output)?' · '+x.size.split(' (')[0]+(x.qty?' × '+x.qty:''):'')+(x.deadline?' · Due '+nice(x.deadline):'')),'<button type="button" class="mini-btn" data-pjreq="'+esc(x.id)+'">View brief</button> '+pill(x.status))});
    h+=sec('Approvals','✓',L.approvals,'Nothing from this project has gone for approval.',function(x){return item(esc(x.title),esc(x.type+(x.feedback?' · Feedback: '+x.feedback:'')),pill(x.status))});
    h+=sec('Announcements','📣',L.anns,'No announcements about this project.',function(x){return item(esc(x.title),esc(x.cat+' · Posted '+nice(x.posted)),'')});
    h+=sec('History','◷',L.activity.slice(0,20),'No recorded activity yet.',function(a){var d=new Date(a.at);return item(esc(a.action)+' · '+esc(a.title),esc(a.section+(a.details?' · '+a.details:'')),'<small class="pj-when">'+d.getDate()+' '+MON[d.getMonth()]+', '+pad(d.getHours())+':'+pad(d.getMinutes())+(a.by?'<br>'+esc(a.by):'')+'</small>')});
    h+='<details class="pj-sec pj-details"><summary><h4><span>✎</span>Edit project details</h4></summary><div class="pj-edit tk-edit"><label class="wide">Project name<input data-f="title" value="'+esc(p.title)+'"></label><label>Type<select data-f="type">'+Object.keys(GRAD).map(function(t){return '<option'+(t===p.type?' selected':'')+'>'+t+'</option>'}).join('')+'</select></label><label>Status<select data-f="status">'+STATUSES.map(function(s){return '<option'+(s===p.status?' selected':'')+'>'+s+'</option>'}).join('')+'</select></label><label>Project lead<input data-f="owner" value="'+esc(p.owner)+'" placeholder="Not set"></label><label>Start date<input type="date" data-f="start" value="'+esc(p.start)+'"></label><label>Due date<input type="date" data-f="due" value="'+esc(p.due)+'"></label><label class="wide">Description<textarea data-f="desc">'+esc(p.desc)+'</textarea></label><label class="wide">Main file link<input data-f="link" value="'+esc(p.link)+'" placeholder="https://…"></label><label class="wide">Other names it goes by<input data-f="keys" value="'+esc(p.keys)+'" placeholder="Comma separated"></label></div>'+'<div class="tk-actions"><span class="tk-meta">Linked items are found by the project name'+(p.keys?' and: '+esc(p.keys):'')+'.</span><button type="button" class="outline" id="pjDelete">Delete project</button><button type="button" class="primary" id="pjSave">Save details</button></div></details>';
    
    $('pjModalBody').innerHTML=h;$('pjModal').hidden=false;$('pjModalClose').focus();
  }
  function closeProject(){$('pjModal').hidden=true;openId=null}

  function renderHome(){var box=$('homeProjects');if(!box)return;var rows=list.slice().sort(function(a,b){return (b.start||'').localeCompare(a.start||'')}).slice(0,3);box.innerHTML=rows.map(function(p){var g=GRAD[p.type];return '<div class="project" data-homepj="'+p.id+'" role="button" tabindex="0" style="cursor:pointer"><div class="thumb" style="background:linear-gradient(145deg,'+g[0]+','+g[1]+')!important">'+mark(p.title)+'</div><div><b>'+esc(p.title)+'</b><small>'+esc(p.type)+(p.due?' · '+nice(p.due):'')+'</small><span class="status '+SCLS[p.status]+'">'+esc(p.status)+'</span></div></div>'}).join('')||'<p class="pj-empty">No projects yet.</p>'}
  window.teachGetProjects=function(){return list.slice()};
  window.teachProjectHealth=function(){return list.map(function(p){return {id:p.id,title:p.title,owner:p.owner,due:p.due,h:health(p)}})};
  window.teachOpenProject=function(id){showView('projects');render();openProject(id)};

  function openForm(show){$('pjForm').hidden=!show;$('pjToggle').textContent=show?'Close':'+ New project';if(show)$('pjTitle').focus()}
  $('pjToggle').addEventListener('click',function(){openForm($('pjForm').hidden)});
  $('pjCancel').addEventListener('click',function(){$('pjForm').reset();openForm(false)});
  $('pjForm').addEventListener('submit',function(e){e.preventDefault();var t=$('pjTitle').value.trim(),lk=$('pjLink').value.trim();if(!t)return notify('Please enter a project name.');if(lk&&!/^https?:\/\//i.test(lk))return notify('Please use a full link starting with https://');var p={id:uid(),title:t,type:$('pjType').value,status:$('pjStatus').value,owner:$('pjOwner').value.trim(),start:$('pjStart').value,due:$('pjDue').value,desc:$('pjDesc').value.trim(),keys:$('pjKeys').value.trim(),link:lk,createdAt:new Date().toISOString()};list.push(p);save();log('Added project',p.title,p.type+' · '+p.status+(p.owner?' · Lead: '+p.owner:''));$('pjForm').reset();openForm(false);filter='All';render();notify('Project created.')});
  $('pjFilters').addEventListener('click',function(e){var b=e.target.closest('[data-pjf]');if(!b)return;filter=b.dataset.pjf;render()});
  $('pjSearch').addEventListener('input',render);
  $('pjGrid').addEventListener('click',function(e){var c=e.target.closest('[data-pj]');if(c)openProject(c.dataset.pj)});
  $('pjModalClose').addEventListener('click',closeProject);
  $('pjModal').addEventListener('click',function(e){
    if(e.target===$('pjModal'))return closeProject();
    var p=list.find(function(x){return x.id===openId});if(!p)return;
    if(e.target.closest('#pjSave')){var ch=[],old=p.title;$('pjModalBody').querySelectorAll('.pj-edit [data-f]').forEach(function(i){var v=i.value.trim();if(i.dataset.f==='title'&&!v)return;if(i.dataset.f==='link'&&v&&!/^https?:\/\//i.test(v))return;if(p[i.dataset.f]!==v){ch.push(i.dataset.f);p[i.dataset.f]=v}});if(!ch.length)return notify('No changes to save.');save();log(ch.length===1&&ch[0]==='status'?'Changed project status':'Updated project',p.title,ch.indexOf('status')>-1?'Status: '+p.status:'Changed: '+ch.join(', '));render();openProject(p.id);notify('Project saved.');return}
    if(e.target.closest('#pjApprove')){if(window.teachSendForApproval){window.teachSendForApproval({title:p.title,type:'Project ('+p.type+')',refKind:'Project',refId:'project:'+p.id});openProject(p.id)}return}
    if(e.target.closest('[data-pjref]')){closeProject();showView('gallery');return}
    if(e.target.closest('#pjDelete')){if(!confirm('Delete the project "'+p.title+'"? Its tasks, posts and designs stay where they are.'))return;list=list.filter(function(x){return x!==p});save();log('Deleted project',p.title,p.type);closeProject();render();notify('Project deleted.');return}
    if(e.target.closest('#pjAddTask')){var v=$('pjNewTask').value.trim();if(!v)return notify('Type a task name first.');if(window.teachAddTask){window.teachAddTask({title:v,notes:'Project: '+p.title,date:p.due,owner:p.owner});openProject(p.id);render();notify('Task added to this project.')}return}
    var tk=e.target.closest('[data-pjtask]');if(tk&&window.teachOpenTask){closeProject();window.teachOpenTask(tk.dataset.pjtask);return}
    var rq=e.target.closest('[data-pjreq]');if(rq&&window.teachOpenRequest){closeProject();window.teachOpenRequest(rq.dataset.pjreq)}
  });
  $('pjModal').addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.id==='pjNewTask'){e.preventDefault();$('pjAddTask').click()}var tk=e.target.closest('[data-pjtask]');if(tk&&(e.key==='Enter'||e.key===' ')){e.preventDefault();tk.click()}});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('pjModal').hidden)closeProject()});
  var hp=$('homeProjects');if(hp){hp.addEventListener('click',function(e){var r=e.target.closest('[data-homepj]');if(r)window.teachOpenProject(r.dataset.homepj)});hp.addEventListener('keydown',function(e){var r=e.target.closest('[data-homepj]');if(r&&(e.key==='Enter'||e.key===' ')){e.preventDefault();window.teachOpenProject(r.dataset.homepj)}})}
  document.addEventListener('teach-activity',function(){if($('pjModal').hidden)render()});
  document.querySelectorAll('[data-view="projects"],[data-go="projects"]').forEach(function(b){b.addEventListener('click',render)});

  // ---------- Project tracking views ----------
  var mode='cards';
  function todayD(){var t=new Date();return new Date(t.getFullYear(),t.getMonth(),t.getDate())}
  function daysTo(s){return Math.round((pd(s)-todayD())/864e5)}
  function health(p,L){
    L=L||linked(p);var pr=progress(L);
    if(p.status==='Completed')return {k:'done',t:'Completed',why:'Marked completed'};
    if(!p.due)return {k:'none',t:'No due date',why:'Add a due date to track this project'};
    var left=daysTo(p.due);
    if(left<0)return {k:'late',t:'Late',why:'Due date passed '+Math.abs(left)+' day'+(left===-1?'':'s')+' ago'+(pr.n?' · '+pr.pct+'% of tasks done':'')};
    var exp=null;if(p.start){var s=pd(p.start),d=pd(p.due);if(d>s)exp=Math.min(1,Math.max(0,(todayD()-s)/(d-s)))}
    if(pr.n){
      if(left<=3&&pr.pct<75)return {k:'risk',t:'At risk',why:'Due in '+left+' day'+(left===1?'':'s')+' with '+pr.pct+'% of tasks done'};
      if(exp!==null&&pr.pct/100<exp-0.25)return {k:'risk',t:'At risk',why:Math.round(exp*100)+'% of the time used, '+pr.pct+'% of tasks done'};
    }else if(left<=7)return {k:'risk',t:'At risk',why:'Due in '+left+' day'+(left===1?'':'s')+' and no tasks planned yet'};
    return {k:'ok',t:'On track',why:(pr.n?pr.pct+'% of tasks done · ':'')+'due in '+left+' day'+(left===1?'':'s')};
  }
  function hpill(h){return '<span class="hpill h-'+h.k+'" title="'+esc(h.why)+'">'+esc(h.t)+'</span>'}
  function filtered(){var q=$('pjSearch').value.trim().toLowerCase();return list.filter(function(p){return (filter==='All'||p.status===filter)&&(!q||(p.title+' '+p.keys+' '+p.owner+' '+p.desc).toLowerCase().indexOf(q)>-1)})}

  function renderBoard(){
    var rows=filtered();
    $('pjGrid').innerHTML='<div class="pj-board">'+STATUSES.map(function(s){var col=rows.filter(function(p){return p.status===s}).sort(function(a,b){return (a.due||'9').localeCompare(b.due||'9')});return '<div class="pj-col" data-col="'+s+'"><div class="pj-col-head"><span class="status '+SCLS[s]+'">'+s+'</span><em>'+col.length+'</em></div><div class="pj-col-body">'+(col.map(function(p){var L=linked(p),pr=progress(L),h=health(p,L);return '<div class="pj-bcard" draggable="true" data-pj="'+p.id+'" role="button" tabindex="0"><b>'+esc(p.title)+'</b><small>'+esc(p.type)+(p.owner?' · '+esc(p.owner):'')+'</small><span class="pj-bar"><i style="width:'+pr.pct+'%"></i></span><span class="pj-bmeta">'+hpill(h)+'<small>'+(p.due?nice(p.due):'No due date')+'</small></span></div>'}).join('')||'<p class="pj-col-empty">Drop a project here</p>')+'</div></div>'}).join('')+'</div><p class="pj-hint">Drag a project to another column to change its status.</p>';
  }

  function renderTimeline(){
    var rows=filtered().filter(function(p){return p.due||p.start}).sort(function(a,b){return (a.start||a.due).localeCompare(b.start||b.due)});
    var none=filtered().filter(function(p){return !p.due&&!p.start});
    if(!rows.length){$('pjGrid').innerHTML='<div class="g-empty">Add start and due dates to projects to see them on the timeline.</div>';return}
    var t0=todayD(),min=t0,max=new Date(t0.getTime()+28*864e5);
    rows.forEach(function(p){var s=pd(p.start||p.due),d=pd(p.due||p.start);if(s<min)min=s;if(d>max)max=d});
    min=new Date(min.getFullYear(),min.getMonth(),min.getDate()-min.getDay());max=new Date(max.getFullYear(),max.getMonth(),max.getDate()+7);
    var span=(max-min)/864e5,pct=function(d){return ((d-min)/864e5/span*100).toFixed(2)+'%'};
    var ticks='',w=new Date(min);while(w<=max){ticks+='<span class="tl-tick" style="left:'+pct(w)+'">'+w.getDate()+' '+MON[w.getMonth()]+'</span>';w=new Date(w.getFullYear(),w.getMonth(),w.getDate()+7)}
    var today='<span class="tl-today" style="left:'+pct(t0)+'"></span>',todayHead='<span class="tl-today" style="left:'+pct(t0)+'"><em>Today</em></span>';
    $('pjGrid').innerHTML='<div class="tl-wrap"><div class="tl"><div class="tl-row tl-head"><div class="tl-name"></div><div class="tl-track">'+ticks+todayHead+'</div></div>'+rows.map(function(p){var L=linked(p),h=health(p,L),pr=progress(L),s=pd(p.start||p.due),d=pd(p.due||p.start);if(!p.start)s=new Date(d.getTime()-7*864e5);var width=Math.max(1.2,(d-s)/864e5/span*100);return '<div class="tl-row"><div class="tl-name"><button type="button" class="link-btn" data-pj="'+p.id+'">'+esc(p.title)+'</button><small>'+esc(p.owner||'No lead')+' · '+hpill(h)+'</small></div><div class="tl-track">'+today+'<button type="button" class="tl-bar h-'+h.k+'" data-pj="'+p.id+'" style="left:'+pct(s)+';width:'+width.toFixed(2)+'%" title="'+esc(p.title+' · '+(p.start?nice(p.start)+' → ':'')+nice(p.due)+' · '+h.why)+'"><i style="width:'+pr.pct+'%"></i><span>'+(p.start?nice(p.start).slice(0,-5)+' – ':'')+nice(p.due).slice(0,-5)+'</span></button></div></div>'}).join('')+'</div></div>'+(none.length?'<p class="pj-hint">Not on the timeline (no dates): '+none.map(function(p){return esc(p.title)}).join(', ')+'</p>':'')+'<p class="pj-hint">The darker part of each bar shows how many of its tasks are done.</p>';
  }

  function renderHealth(){
    var rows=filtered().map(function(p){var L=linked(p);return {p:p,h:health(p,L),pr:progress(L)}});
    var G=[['late','Late','These have passed their due date.'],['risk','At risk','Behind on tasks, close to the due date, or not planned yet.'],['ok','On track','Moving at the right pace.'],['none','No due date','Add a due date so these can be tracked.'],['done','Completed','']];
    var counts={};rows.forEach(function(r){counts[r.h.k]=(counts[r.h.k]||0)+1});
    $('pjGrid').innerHTML='<div class="hl-sum">'+G.slice(0,4).map(function(g){return '<div class="hl-tile h-'+g[0]+'"><b>'+(counts[g[0]]||0)+'</b><span>'+g[1]+'</span></div>'}).join('')+'</div>'+G.map(function(g){var rs=rows.filter(function(r){return r.h.k===g[0]});if(!rs.length)return '';return '<section class="hl-group"><h4>'+hpill({k:g[0],t:g[1],why:g[2]})+' <small>'+esc(g[2])+'</small></h4>'+rs.map(function(r){return '<button type="button" class="hl-row" data-pj="'+r.p.id+'"><span class="hl-main"><b>'+esc(r.p.title)+'</b><small>'+esc(r.h.why)+'</small></span><span class="hl-lead">'+esc(r.p.owner||'No lead')+'</span><span class="hl-prog"><span class="pj-bar"><i style="width:'+r.pr.pct+'%"></i></span><small>'+(r.pr.n?r.pr.d+'/'+r.pr.n+' tasks':'No tasks')+'</small></span><span class="hl-due">'+(r.p.due?nice(r.p.due):'—')+'</span></button>'}).join('')+'</section>'}).join('');
  }

  function renderTeam(){
    var tasks=window.teachGetTasks?window.teachGetTasks():load('teach-comm-tasks'),people={},week=7;
    function person(n){n=(n||'').trim();if(!n)n='Unassigned';var k=n.toLowerCase();return people[k]=people[k]||{name:n,tasks:[],projects:[]}}
    tasks.filter(function(t){return t.status!=='Completed'}).forEach(function(t){person(t.owner).tasks.push(t)});
    list.filter(function(p){return p.status!=='Completed'&&p.owner}).forEach(function(p){person(p.owner).projects.push(p)});
    var arr=Object.keys(people).map(function(k){return people[k]}).sort(function(a,b){if(a.name==='Unassigned')return 1;if(b.name==='Unassigned')return -1;return b.tasks.length-a.tasks.length});
    if(!arr.length){$('pjGrid').innerHTML='<div class="g-empty">No open tasks or projects assigned yet.</div>';return}
    var maxT=Math.max.apply(null,arr.map(function(p){return p.tasks.length}).concat([1]));
    $('pjGrid').innerHTML='<div class="tm-grid">'+arr.map(function(pp){var late=pp.tasks.filter(function(t){return t.date&&daysTo(t.date)<0}),soon=pp.tasks.filter(function(t){return t.date&&daysTo(t.date)>=0&&daysTo(t.date)<=week});var load=pp.tasks.length>=5?'heavy':pp.tasks.length>=3?'busy':'light';return '<div class="tm-card"><div class="tm-head"><i class="pj-av">'+esc(pp.name.charAt(0).toUpperCase())+'</i><div><b>'+esc(pp.name)+'</b><small>'+pp.tasks.length+' open task'+(pp.tasks.length===1?'':'s')+(pp.projects.length?' · leads '+pp.projects.length+' project'+(pp.projects.length===1?'':'s'):'')+'</small></div><span class="tm-load l-'+load+'">'+(load==='heavy'?'Full':load==='busy'?'Busy':'Has room')+'</span></div><span class="tm-bar"><i style="width:'+Math.round(pp.tasks.length/maxT*100)+'%"></i></span><div class="tm-nums"><span><b>'+late.length+'</b>Overdue</span><span><b>'+soon.length+'</b>Due in 7 days</span><span><b>'+pp.tasks.filter(function(t){return t.status==='For Review'}).length+'</b>In review</span></div>'+(pp.tasks.length?'<div class="tm-list">'+pp.tasks.slice().sort(function(a,b){return (a.date||'9').localeCompare(b.date||'9')}).slice(0,5).map(function(t){var dd=t.date?daysTo(t.date):null;return '<button type="button" class="tm-item" data-tmtask="'+esc(t.id)+'"><span>'+esc(t.title)+'</span><small class="'+(dd!==null&&dd<0?'late':dd!==null&&dd<=2?'soon':'')+'">'+(t.date?nice(t.date).slice(0,-5):'No date')+'</small></button>'}).join('')+(pp.tasks.length>5?'<small class="tm-more">+'+(pp.tasks.length-5)+' more</small>':'')+'</div>':'')+(pp.projects.length?'<div class="tm-proj">'+pp.projects.map(function(p){return '<button type="button" class="tm-chip" data-pj="'+p.id+'">✦ '+esc(p.title)+'</button>'}).join('')+'</div>':'')+'</div>'}).join('')+'</div><p class="pj-hint">Workload counts open tasks in the Task Tracker. Has room: 0–2 · Busy: 3–4 · Full: 5 or more.</p>';
  }

  function syncModeUI(){document.querySelectorAll('[data-pjmode]').forEach(function(b){b.classList.toggle('on',b.dataset.pjmode===mode);b.setAttribute('aria-selected',b.dataset.pjmode===mode)});$('pjGrid').className=mode==='cards'?'pj-grid':'pj-view-'+mode}
  function renderMode(){
    syncModeUI();
    if(mode==='board')renderBoard();else if(mode==='timeline')renderTimeline();else if(mode==='health')renderHealth();else if(mode==='team')renderTeam();
  }
  $('pjModes').addEventListener('click',function(e){var b=e.target.closest('[data-pjmode]');if(!b)return;mode=b.dataset.pjmode;render()});
  var dragPj=null;
  $('pjGrid').addEventListener('dragstart',function(e){var c=e.target.closest('.pj-bcard');if(!c)return;dragPj=c.dataset.pj;c.classList.add('dragging');try{e.dataTransfer.setData('text/plain',dragPj);e.dataTransfer.effectAllowed='move'}catch(x){}});
  $('pjGrid').addEventListener('dragover',function(e){var col=e.target.closest('.pj-col');if(!col||!dragPj)return;e.preventDefault();document.querySelectorAll('.pj-col.over').forEach(function(c){if(c!==col)c.classList.remove('over')});col.classList.add('over')});
  $('pjGrid').addEventListener('drop',function(e){var col=e.target.closest('.pj-col');if(!col||!dragPj)return;e.preventDefault();var p=list.find(function(x){return x.id===dragPj});dragPj=null;if(!p||p.status===col.dataset.col){render();return}var old=p.status;p.status=col.dataset.col;save();log('Changed project status',p.title,old+' → '+p.status);render();notify(p.title+' moved to '+p.status+'.')});
  $('pjGrid').addEventListener('dragend',function(){dragPj=null;document.querySelectorAll('.pj-col.over,.pj-bcard.dragging').forEach(function(c){c.classList.remove('over','dragging')})});
  $('pjGrid').addEventListener('click',function(e){var t=e.target.closest('[data-tmtask]');if(t&&window.teachOpenTask)window.teachOpenTask(t.dataset.tmtask)});
  $('pjGrid').addEventListener('keydown',function(e){var c=e.target.closest('.pj-bcard');if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openProject(c.dataset.pj)}});

  // ---------- Home: Due this week ----------
  function renderWeek(){
    var box=$('homeWeek');if(!box)return;
    var items=[],lim=7;
    (window.teachGetTasks?window.teachGetTasks():load('teach-comm-tasks')).forEach(function(t){if(t.status!=='Completed'&&t.date&&daysTo(t.date)<=lim)items.push({d:t.date,k:'Task',ic:'♧',t:t.title,s:t.owner||'Unassigned',go:'task',id:t.id})});
    (window.teachGetPosts?window.teachGetPosts():[]).forEach(function(p){if(p.status!=='Published'&&p.date&&daysTo(p.date)>=-2&&daysTo(p.date)<=lim)items.push({d:p.date,k:'Post',ic:'▦',t:p.title,s:(p.platforms||[p.platform]).join(', '),go:'post',id:p.id})});
    list.forEach(function(p){if(p.status!=='Completed'&&p.due&&daysTo(p.due)<=lim)items.push({d:p.due,k:'Project due',ic:'✦',t:p.title,s:p.owner||'No lead',go:'project',id:p.id})});
    load('teach-comm-requests').forEach(function(r){if(['Delivered','Declined'].indexOf(r.status)<0&&r.deadline&&daysTo(r.deadline)<=lim)items.push({d:r.deadline,k:'Request',ic:'✉',t:r.id+' · '+r.title,s:r.dept||'',go:'request',id:r.id})});
    items.sort(function(a,b){return a.d.localeCompare(b.d)});
    var DN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    function when(d){var n=daysTo(d);return n<0?Math.abs(n)+'d late':n===0?'Today':n===1?'Tomorrow':DN[pd(d).getDay()]+' '+pd(d).getDate()}
    var late=items.filter(function(i){return daysTo(i.d)<0}).length;
    box.innerHTML='<div class="section-title"><div><h2>Due this week</h2><p>'+(items.length?items.length+' item'+(items.length===1?'':'s')+' across tasks, posts, projects and requests'+(late?' · <b class="wk-late">'+late+' overdue</b>':''):'Nothing due in the next 7 days.')+'</p></div><button class="link-btn" type="button" data-go2="projects-health">Project health →</button></div>'+(items.length?'<div class="wk-list">'+items.slice(0,10).map(function(i){var n=daysTo(i.d);return '<button type="button" class="wk-item'+(n<0?' late':n<=1?' soon':'')+'" data-wk="'+i.go+'|'+esc(i.id)+'"><span class="wk-when">'+when(i.d)+'</span><span class="wk-ic" aria-hidden="true">'+i.ic+'</span><span class="wk-main"><b>'+esc(i.t)+'</b><small>'+esc(i.k+' · '+i.s)+'</small></span></button>'}).join('')+'</div>'+(items.length>10?'<p class="pj-hint">+'+(items.length-10)+' more</p>':''):'');
  }
  var hw=$('homeWeek');if(hw)hw.addEventListener('click',function(e){var b=e.target.closest('[data-wk]');if(b){var x=b.dataset.wk.split('|');if(x[0]==='task'&&window.teachOpenTask)window.teachOpenTask(x[1]);else if(x[0]==='post'&&window.teachOpenPost)window.teachOpenPost(x[1]);else if(x[0]==='project')window.teachOpenProject(x[1]);else if(x[0]==='request'&&window.teachOpenRequest)window.teachOpenRequest(x[1]);return}if(e.target.closest('[data-go2="projects-health"]')){mode='health';showView('projects');render()}});
  document.querySelectorAll('[data-view="home"]').forEach(function(b){b.addEventListener('click',renderWeek)});
  document.addEventListener('teach-activity',renderWeek);
  render();
})();


/* ---- block 8 ---- */
// ===== Checklists: one checklist per kind of work, with Deaf-friendly steps =====
(function(){
  var $=function(id){return document.getElementById(id)};
  if(!$('clList'))return;
  function esc(s){return typeof safe==='function'?safe(s==null?'':s):String(s==null?'':s)}
  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
  function load(k,d){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}}
  function store(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  var D=true;
  var BASE={
    reel:{n:'Reel / Video',i:'▶',items:[['Hook in the first 2 seconds'],['Captions burned in and checked word by word',D],['ISL signer clearly visible, well lit, not cropped',D],['No information given only in sound or voice-over',D],['On-screen text stays up long enough to read',D],['Vertical 9:16, text clear of the app buttons'],['Cover image or thumbnail chosen'],['Music is licensed or royalty free'],['Caption and hashtags written'],['Partners and funders tagged'],['Consent taken for everyone shown'],['Sent for approval']]},
    post:{n:'Social post',i:'◎',items:[['Correct size (1080 × 1350 or 1080 × 1080)'],['TEACH logo placed correctly'],['Text is large with strong contrast',D],['Alt text written for the image',D],['Easy English, short sentences',D],['Names, dates and spellings checked'],['Caption, hashtags and tags added'],['Link or call to action works'],['Consent taken for people in photos'],['Sent for approval']]},
    carousel:{n:'Carousel',i:'❐',items:[['First slide makes people swipe'],['Same layout and fonts on every slide'],['Around 25 words or fewer per slide',D],['Alt text for every slide',D],['Strong contrast on every slide',D],['Last slide has a clear call to action'],['Slides exported in the right order'],['Caption and hashtags written'],['Sent for approval']]},
    poster:{n:'Poster / Print',i:'▤',items:[['Right size with 3 mm bleed'],['CMYK, 300 dpi export'],['Date, time and venue large and easy to find',D],['High contrast, no text over busy photos',D],['QR code plus the link written out as text',D],['TEACH and partner logos placed'],['Spelling and names checked twice'],['Test print checked'],['Quantity and paper confirmed with printer'],['Sent for approval']]},
    ppt:{n:'Presentation',i:'▦',items:[['TEACH template used'],['16:9 slides'],['One idea per slide'],['Text at least 24 pt',D],['Strong contrast on every slide',D],['Slides shared with the ISL interpreter in advance',D],['Captions on any video in the deck',D],['Speaker notes added'],['File named clearly and shared'],['Sent for approval']]},
    event:{n:'Event',i:'✦',items:[['ISL interpreter booked',D],['Light on the interpreter, visible from all seats',D],['Live captions on screen',D],['Visual signs and alerts, nothing announced by sound only',D],['Photographer and video briefed'],['Photo consent arranged'],['Standee, backdrop and signage ready'],['Social media coverage plan shared'],['Thank-you and recap post planned']]},
    email:{n:'Email / Newsletter',i:'✉',items:[['Clear subject line'],['Preview text written'],['Alt text on every image',D],['Easy English, short paragraphs',D],['All links tested'],['Checked on a phone'],['Right contact list chosen'],['Unsubscribe link included'],['Sent for approval']]},
    web:{n:'Website / Blog',i:'⌘',items:[['Clear headings in order'],['Alt text on every image',D],['Captions or transcript for every video',D],['Text contrast checked',D],['All links work'],['Page title and short description set'],['Checked on a phone']]}
  };
  var order=['reel','post','carousel','poster','ppt','event','email','web'];
  var custom=load('teach-comm-cl-custom',{}),ticks=load('teach-comm-cl-ticks',{}),hist=load('teach-comm-cl-history',[]);
  var cur='reel',only=false;
  function items(t){var b=BASE[t].items.map(function(x,i){return {id:t+'-'+i,txt:x[0],deaf:!!x[1]}});return b.concat((custom[t]||[]).map(function(c){return {id:c.id,txt:c.txt,deaf:!!c.deaf,custom:true}}))}
  function done(t){return (ticks[t]||[])}
  window.teachChecklistSummary=function(){return order.map(function(t){var it=items(t),d=done(t).filter(function(id){return it.some(function(x){return x.id===id})}).length;return {key:t,name:BASE[t].n,icon:BASE[t].i,total:it.length,done:d}})};
  window.teachChecklistHistory=function(){return hist.slice()};
  window.teachOpenChecklist=function(t){if(BASE[t])cur=t;showView('accessibility');render()};

  function render(){
    $('clTypes').innerHTML=order.map(function(t){var it=items(t),d=done(t).length;return '<button type="button" role="tab" data-cl="'+t+'" aria-selected="'+(t===cur)+'" class="'+(t===cur?'on':'')+'"><span class="cl-ic">'+BASE[t].i+'</span>'+esc(BASE[t].n)+(d?'<span class="cnt">'+d+'/'+it.length+'</span>':'')+'</button>'}).join('');
    var it=items(cur),dn=done(cur),shown=it.filter(function(x){return !only||x.deaf});
    var n=it.filter(function(x){return dn.indexOf(x.id)>-1}).length,deafAll=it.filter(function(x){return x.deaf}),deafDone=deafAll.filter(function(x){return dn.indexOf(x.id)>-1}).length,pct=it.length?Math.round(n/it.length*100):0;
    $('clProgress').innerHTML='<div class="cl-prog-top"><b>'+esc(BASE[cur].n)+' checklist</b><span>'+n+' of '+it.length+' done · 🤟 '+deafDone+'/'+deafAll.length+' Deaf-friendly</span></div><span class="pj-bar"><i style="width:'+pct+'%"></i></span>';
    $('clList').innerHTML=shown.map(function(x,i){var on=dn.indexOf(x.id)>-1;return '<label class="cl-item'+(on?' on':'')+(x.deaf?' deaf':'')+'"><input type="checkbox" data-clitem="'+esc(x.id)+'"'+(on?' checked':'')+'><span class="cl-num">'+(i+1)+'</span><span class="cl-txt">'+esc(x.txt)+'</span>'+(x.deaf?'<span class="cl-deaf" title="Deaf-friendly step">🤟</span>':'')+(x.custom?'<button type="button" class="cl-del" data-cldel="'+esc(x.id)+'" aria-label="Remove this step">✕</button>':'')+'</label>'}).join('');
    $('clHistory').innerHTML=hist.length?hist.slice(0,8).map(function(h){var d=new Date(h.at);return '<div class="cl-h"><span class="cl-ic">'+(BASE[h.type]?BASE[h.type].i:'☑')+'</span><div><b>'+esc(h.name||BASE[h.type].n)+'</b><small>'+esc(BASE[h.type]?BASE[h.type].n:'')+' · '+h.done+'/'+h.total+' · '+d.getDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]+(h.by?' · '+esc(h.by):'')+'</small></div></div>'}).join(''):'<p class="pj-empty">Checklists you mark as done will appear here.</p>';
  }
  $('clTypes').addEventListener('click',function(e){var b=e.target.closest('[data-cl]');if(!b)return;cur=b.dataset.cl;render()});
  $('clOnlyDeaf').addEventListener('change',function(){only=this.checked;render()});
  $('clList').addEventListener('change',function(e){var c=e.target.closest('[data-clitem]');if(!c)return;var arr=(ticks[cur]||[]).filter(function(x){return x!==c.dataset.clitem});if(c.checked)arr.push(c.dataset.clitem);ticks[cur]=arr;store('teach-comm-cl-ticks',ticks);render()});
  $('clList').addEventListener('click',function(e){var d=e.target.closest('[data-cldel]');if(!d)return;e.preventDefault();custom[cur]=(custom[cur]||[]).filter(function(x){return x.id!==d.dataset.cldel});store('teach-comm-cl-custom',custom);if(window.logActivity)window.logActivity('Checklists','Removed step',BASE[cur].n,'');render()});
  $('clAddItem').addEventListener('click',function(){var v=$('clNewItem').value.trim();if(!v)return notify('Type the step first.');(custom[cur]=custom[cur]||[]).push({id:'c'+uid(),txt:v,deaf:$('clNewDeaf').checked});store('teach-comm-cl-custom',custom);if(window.logActivity)window.logActivity('Checklists','Added step',BASE[cur].n,v);$('clNewItem').value='';$('clNewDeaf').checked=false;render();notify('Step added to the '+BASE[cur].n+' checklist.')});
  $('clNewItem').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();$('clAddItem').click()}});
  $('clReset').addEventListener('click',function(){ticks[cur]=[];store('teach-comm-cl-ticks',ticks);render()});
  $('clCopy').addEventListener('click',function(){var it=items(cur),dn=done(cur);var txt=BASE[cur].n+' checklist'+($('clFor').value.trim()?' – '+$('clFor').value.trim():'')+'\n'+it.map(function(x){return (dn.indexOf(x.id)>-1?'☑ ':'☐ ')+x.txt+(x.deaf?' (Deaf-friendly)':'')}).join('\n');var ok=function(){notify('Checklist copied. Paste it into WhatsApp or email.')};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(ok,function(){notify('Could not copy. Select the list and copy it manually.')});else notify('Could not copy. Select the list and copy it manually.')});
  $('clDone').addEventListener('click',function(){var it=items(cur),dn=done(cur),n=it.filter(function(x){return dn.indexOf(x.id)>-1}).length;if(!n)return notify('Tick at least one step first.');var nm=$('clFor').value.trim();var rec={type:cur,name:nm,done:n,total:it.length,at:new Date().toISOString(),by:(window.teachUser&&window.teachUser.name)||''};hist.unshift(rec);hist=hist.slice(0,50);store('teach-comm-cl-history',hist);if(window.logActivity)window.logActivity('Checklists','Completed checklist',nm||BASE[cur].n,BASE[cur].n+' · '+n+'/'+it.length+' steps'+(n<it.length?' · '+(it.length-n)+' not ticked':''));ticks[cur]=[];store('teach-comm-cl-ticks',ticks);$('clFor').value='';render();notify(n<it.length?'Saved. '+(it.length-n)+' step'+(it.length-n===1?' was':'s were')+' not ticked.':'Checklist complete. Saved to Reports.')});
  document.querySelectorAll('[data-view="accessibility"],[data-go="accessibility"]').forEach(function(b){b.addEventListener('click',render)});
  render();
})();


/* ---- block 9 ---- */
// ===== Customizable Home: widgets you can show, hide, reorder and resize; packed with no gaps =====
(function(){
  var home=document.getElementById('view-home');if(!home)return;
  var $=function(id){return document.getElementById(id)};
  function esc(s){return typeof safe==='function'?safe(s==null?'':s):String(s==null?'':s)}
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function pd(s){var p=String(s).split('-').map(Number);return new Date(p[0],(p[1]||1)-1,p[2]||1)}
  function nice(s){if(!s)return '';var d=pd(s);return d.getDate()+' '+MON[d.getMonth()]}
  function panelWith(sel){var el=home.querySelector(sel);return el?el.closest('.panel'):null}
  function panelByTitle(t){var hs=home.querySelectorAll('.panel h3');for(var i=0;i<hs.length;i++){if(hs[i].textContent.trim()===t)return hs[i].closest('.panel')}return null}
  function mk(title,go,inner){var s=document.createElement('section');s.className='panel';s.innerHTML='<div class="panel-head"><h3>'+title+'</h3>'+(go?'<button class="link-btn" type="button" data-hgo="'+go+'">View all →</button>':'')+'</div><div class="hw-body" id="'+inner+'"></div>';return s}

  // Checklists widget replaces the old Deaf-friendly panel
  var oldA11y=panelByTitle('Deaf-Friendly Communication');
  var clPanel=mk('Checklists','accessibility','hwChecklists');
  if(oldA11y)oldA11y.parentNode.replaceChild(clPanel,oldA11y);

  var DEF=[
    {id:'hero',name:'Welcome banner',size:'F',show:true,el:home.querySelector('.hero')},
    {id:'quick',name:'Quick access',size:'F',show:true,el:home.querySelector('.quick-wrap:not(#homeWeek)')},
    {id:'week',name:'Due this week',size:'F',show:true,el:$('homeWeek')},
    {id:'projects',name:'Recent projects',size:'S',show:true,el:panelWith('#homeProjects')},
    {id:'calendar',name:'Social media calendar',size:'S',show:true,el:panelWith('#miniCal')},
    {id:'health',name:'Project health',size:'S',show:true,el:mk('Project health','projects','hwHealth')},
    {id:'tasks',name:'Team tasks',size:'M',show:true,el:panelWith('#homeTasks')},
    {id:'approvals',name:'Waiting for approval',size:'M',show:true,el:mk('Waiting for approval','approvals','hwApprovals')},
    {id:'announcements',name:'Announcements',size:'S',show:true,el:panelWith('#homeAnns')},
    {id:'checklists',name:'Checklists',size:'S',show:true,el:clPanel},
    {id:'inspo',name:'Inspiration favourites',size:'S',show:true,el:mk('Inspiration favourites','gallery','hwInspo')},
    {id:'quicklinks',name:'Quick links',size:'S',show:true,el:panelByTitle('Quick Links')},
    {id:'library',name:'Brand & file library',size:'S',show:false,el:panelWith('#folders')}
  ].filter(function(w){return w.el});
  var BY={};DEF.forEach(function(w){BY[w.id]=w});

  // Build the grid
  var bar=document.createElement('div');bar.className='home-bar';
  bar.innerHTML='<div><b id="homeHello">Welcome</b><small id="homeDate"></small></div><button type="button" class="outline" id="homeCustomize">⚙ Customize home</button>';
  var grid=document.createElement('div');grid.className='home-grid';grid.id='homeGrid';
  home.insertBefore(grid,home.firstChild);home.insertBefore(bar,grid);
  DEF.forEach(function(w){var c=document.createElement('div');c.className='hw';c.dataset.w=w.id;var inn=document.createElement('div');inn.className='hw-in';c.appendChild(inn);inn.appendChild(w.el);grid.appendChild(c);w.box=c;w.inner=inn});
  home.querySelectorAll('.dashboard,.lower-grid,.right-stack').forEach(function(x){if(!x.querySelector('.panel,.quick-wrap'))x.remove()});

  // Layout state (per person)
  function key(){return 'teach-comm-home-layout:'+((window.teachUser&&window.teachUser.email)||'default')}
  function defaults(){return DEF.map(function(w){return {id:w.id,show:w.show,size:w.size}})}
  function loadLayout(){var l=null;try{l=JSON.parse(localStorage.getItem(key())||'null')}catch(e){}if(!Array.isArray(l))return defaults();l=l.filter(function(x){return BY[x.id]});l.forEach(function(x){if(x.size==='L')x.size='M'});DEF.forEach(function(w){if(!l.some(function(x){return x.id===w.id}))l.push({id:w.id,show:w.show,size:w.size})});return l}
  function saveLayout(){try{localStorage.setItem(key(),JSON.stringify(layout))}catch(e){}}
  var layout=loadLayout();

  function apply(){layout.forEach(function(x){var w=BY[x.id];grid.appendChild(w.box);w.box.hidden=!x.show;w.box.className='hw size-'+x.size});pack()}
  var raf=0;
  var SPAN={S:1,M:2,L:2,F:3};
  function pack(){cancelAnimationFrame(raf);raf=requestAnimationFrame(function(){
    var row=8,gap=16,wd=grid.clientWidth,cols=wd<700?1:wd<1000?2:3;
    grid.style.gridTemplateColumns='repeat('+cols+',minmax(0,1fr))';
    var tops=[];for(var c=0;c<cols;c++)tops.push(0);
    layout.forEach(function(x){var w=BY[x.id];if(!w||w.box.hidden)return;
      var sp=Math.min(cols,x.size==='S'&&cols===2?1:SPAN[x.size]||1);if(cols===2&&x.size==='M')sp=1;if(cols===2&&(x.size==='L'||x.size==='F'))sp=2;
      w.box.style.gridRow='auto';w.box.style.gridColumn='1 / span '+sp;
      var h=Math.max(1,Math.ceil((w.inner.getBoundingClientRect().height+gap)/row)),best=0,bestTop=1e9;
      for(var st=0;st<=cols-sp;st++){var t=Math.max.apply(null,tops.slice(st,st+sp));if(t<bestTop){bestTop=t;best=st}}
      w.box.style.gridColumn=(best+1)+' / span '+sp;w.box.style.gridRow=(bestTop+1)+' / span '+h;
      for(var k=best;k<best+sp;k++)tops[k]=bestTop+h});
  })}
  if(window.ResizeObserver){var ro=new ResizeObserver(pack);DEF.forEach(function(w){ro.observe(w.inner)})}
  window.addEventListener('resize',pack);

  // New widgets
  function renderHealth(){var b=$('hwHealth');if(!b)return;var L=window.teachProjectHealth?window.teachProjectHealth():[];var c={late:0,risk:0,ok:0,none:0,done:0};L.forEach(function(x){c[x.h.k]=(c[x.h.k]||0)+1});var watch=L.filter(function(x){return x.h.k==='late'||x.h.k==='risk'}).slice(0,3);b.innerHTML='<div class="hw-tiles"><div class="hw-tile h-late"><b>'+c.late+'</b><span>Late</span></div><div class="hw-tile h-risk"><b>'+c.risk+'</b><span>At risk</span></div><div class="hw-tile h-ok"><b>'+c.ok+'</b><span>On track</span></div></div>'+(watch.length?'<div class="hw-rows">'+watch.map(function(x){return '<button type="button" class="hw-row" data-hproj="'+esc(x.id)+'"><span class="hpill h-'+x.h.k+'">'+esc(x.h.t)+'</span><span class="hw-row-main"><b>'+esc(x.title)+'</b><small>'+esc(x.h.why)+'</small></span></button>'}).join('')+'</div>':'<p class="pj-empty">'+(L.length?'Every open project is on track.':'No projects yet.')+'</p>')}
  function hwApprovals(){var b=$('hwApprovals');if(!b)return;var A=[];try{A=approvals.filter(function(a){return a.status!=='Approved'})}catch(e){}b.innerHTML=A.length?'<div class="hw-rows">'+A.slice(0,4).map(function(a){var c=a.status==='Needs Changes'?'review':'progress';return '<button type="button" class="hw-row" data-hgo="approvals"><span class="hw-row-main"><b>'+esc(a.title)+'</b><small>'+esc(a.type+' · '+(a.submittedBy||''))+'</small></span><span class="status '+c+'">'+esc(a.status)+'</span></button>'}).join('')+'</div>'+(A.length>4?'<p class="pj-hint">+'+(A.length-4)+' more waiting</p>':''):'<p class="pj-empty">Nothing is waiting for approval.</p>'}
  function renderInspo(){var b=$('hwInspo');if(!b)return;var R=(window.teachGetRefs?window.teachGetRefs():[]);var fav=R.filter(function(r){return r.fav});var list=(fav.length?fav:R).slice(0,4);b.innerHTML=list.length?'<div class="hw-inspo">'+list.map(function(r){return '<button type="button" class="hw-ref" data-hgo="gallery" title="'+esc(r.title)+'">'+(r.img?'<img src="'+r.img+'" alt="">':'<span class="hw-ref-ph">'+esc(r.source)+'</span>')+'<span class="hw-ref-t">'+esc(r.title)+'</span></button>'}).join('')+'</div>':'<p class="pj-empty">Save references to the Inspiration Board to see them here.</p>'}
  function renderChecklists(){var b=$('hwChecklists');if(!b)return;var S=window.teachChecklistSummary?window.teachChecklistSummary():[];var H=window.teachChecklistHistory?window.teachChecklistHistory():[];var inprog=S.filter(function(s){return s.done>0});b.innerHTML='<div class="hw-cl">'+S.map(function(s){return '<button type="button" class="hw-cl-btn'+(s.done?' busy':'')+'" data-hcl="'+s.key+'"><span>'+s.icon+'</span>'+esc(s.name)+(s.done?'<em>'+s.done+'/'+s.total+'</em>':'')+'</button>'}).join('')+'</div><p class="pj-hint">'+(inprog.length?inprog.length+' checklist'+(inprog.length===1?'':'s')+' in progress · ':'')+H.length+' completed so far</p>'}
  function greet(){var u=window.teachUser,h=new Date().getHours(),g=h<12?'Good morning':h<17?'Good afternoon':'Good evening';$('homeHello').textContent=g+(u?', '+u.name.split(' ')[0]:'');var d=new Date();$('homeDate').textContent=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]+', '+d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear()}
  function renderAll(){greet();renderHealth();hwApprovals();renderInspo();renderChecklists();pack()}
  grid.addEventListener('click',function(e){var g=e.target.closest('[data-hgo]'),p=e.target.closest('[data-hproj]'),c=e.target.closest('[data-hcl]');if(p&&window.teachOpenProject){window.teachOpenProject(p.dataset.hproj);return}if(c&&window.teachOpenChecklist){window.teachOpenChecklist(c.dataset.hcl);return}if(g&&!e.target.closest('[data-go]')){showView(g.dataset.hgo)}});

  // Customize panel
  var SZ={S:'One third',M:'Two thirds',F:'Full width'};
  var dlg=document.createElement('div');dlg.className='rq-modal';dlg.id='homeCustom';dlg.hidden=true;dlg.setAttribute('role','dialog');dlg.setAttribute('aria-modal','true');dlg.setAttribute('aria-labelledby','hcTitle');
  dlg.innerHTML='<div class="rq-modal-box hc-box"><div class="rq-modal-head"><div><h3 id="hcTitle">Customize home</h3><p class="sub" style="margin:2px 0 0">Choose what to show, put it in your order and pick a size. Changes apply straight away.</p></div><button type="button" class="mini-btn" id="hcClose" aria-label="Close">✕</button></div><div class="hc-list" id="hcList"></div><div class="rq-modal-foot"><button type="button" class="outline" id="hcReset">Reset to default</button><button type="button" class="primary" id="hcDone">Done</button></div></div>';
  document.body.appendChild(dlg);
  function renderList(){$('hcList').innerHTML=layout.map(function(x,i){var w=BY[x.id];return '<div class="hc-row'+(x.show?'':' off')+'" data-hc="'+x.id+'"><label class="hc-show"><input type="checkbox" data-hcshow'+(x.show?' checked':'')+'><span>'+esc(w.name)+'</span></label><div class="hc-size" role="group" aria-label="Size of '+esc(w.name)+'">'+['S','M','F'].map(function(s){return '<button type="button" data-hcsize="'+s+'" class="'+(x.size===s?'on':'')+'" aria-pressed="'+(x.size===s)+'" title="'+SZ[s]+'">'+s+'</button>'}).join('')+'</div><div class="hc-move"><button type="button" data-hcmove="-1" aria-label="Move up"'+(i===0?' disabled':'')+'>↑</button><button type="button" data-hcmove="1" aria-label="Move down"'+(i===layout.length-1?' disabled':'')+'>↓</button></div></div>'}).join('')+'<p class="pj-hint">Sizes: S one third · M two thirds · F full width. On phones every widget is full width.</p>'}
  $('homeCustomize').addEventListener('click',function(){renderList();dlg.hidden=false;$('hcClose').focus()});
  function close(){dlg.hidden=true}
  $('hcClose').addEventListener('click',close);$('hcDone').addEventListener('click',close);
  dlg.addEventListener('click',function(e){if(e.target===dlg)close()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!dlg.hidden)close()});
  $('hcReset').addEventListener('click',function(){layout=defaults();saveLayout();apply();renderList();notify('Home reset to the default layout.')});
  $('hcList').addEventListener('click',function(e){var row=e.target.closest('[data-hc]');if(!row)return;var i=layout.findIndex(function(x){return x.id===row.dataset.hc});var s=e.target.closest('[data-hcsize]'),m=e.target.closest('[data-hcmove]');if(s){layout[i].size=s.dataset.hcsize}else if(m){var j=i+Number(m.dataset.hcmove);if(j<0||j>=layout.length)return;var t=layout[i];layout[i]=layout[j];layout[j]=t}else return;saveLayout();apply();renderList();var f=$('hcList').querySelector('[data-hc="'+row.dataset.hc+'"] '+(m?'[data-hcmove="'+m.dataset.hcmove+'"]':'[data-hcsize="'+s.dataset.hcsize+'"]'));if(f&&!f.disabled)f.focus()});
  $('hcList').addEventListener('change',function(e){var c=e.target.closest('[data-hcshow]');if(!c)return;var id=c.closest('[data-hc]').dataset.hc;layout.forEach(function(x){if(x.id===id)x.show=c.checked});saveLayout();apply();c.closest('.hc-row').classList.toggle('off',!c.checked)});

  document.addEventListener('teach-activity',function(){if(home.classList.contains('active'))renderAll()});
  document.querySelectorAll('[data-view="home"]').forEach(function(b){b.addEventListener('click',function(){layout=loadLayout();apply();renderAll()})});
  var lf=$('loginForm');if(lf)lf.addEventListener('submit',function(){setTimeout(function(){layout=loadLayout();apply();renderAll()},30)});
  apply();renderAll();
})();


/* ---- block 10 ---- */
// ===== Brand & File Library + home links (quick links, hero button, widget) =====
(function(){
  var $=function(id){return document.getElementById(id)};
  if(!$('libList'))return;
  function esc(s){return typeof safe==='function'?safe(s==null?'':s):String(s==null?'':s)}
  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
  function log(a,t,d){if(window.logActivity)window.logActivity('Brand & File Library',a,t,d)}
  var CATS={'Logos & Brand':'◆','Templates':'▧','Design elements':'✦','Documents & Guides':'▤','Photos & Videos':'▣'};
  var KEY='teach-comm-library',lib=null;
  try{lib=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
  if(!Array.isArray(lib)){lib=[
    {title:'TEACH logo – full colour',cat:'Logos & Brand',notes:'PNG and SVG. Use on white or cream backgrounds.'},
    {title:'TEACH logo – white version',cat:'Logos & Brand',notes:'For coral, dark or photo backgrounds.'},
    {title:'Brand colours and fonts',cat:'Logos & Brand',notes:'Coral, yellow and cream colour codes, with the Archivo font.'},
    {title:'Instagram post template',cat:'Templates',notes:'1080 × 1350 and 1080 × 1080.'},
    {title:'Carousel template',cat:'Templates',notes:'Cover, content and call-to-action slides.'},
    {title:'Presentation template (TEACH_Proposal_FY_26-27)',cat:'Templates',notes:'Cream, coral and gold style with Archivo fonts. Use for every deck.'},
    {title:'Certificate template',cat:'Templates',notes:'A4 landscape.'},
    {title:'Icon set',cat:'Design elements',notes:'Line icons in brand colours.'},
    {title:'Shapes and patterns',cat:'Design elements',notes:'Circles and curves used in TEACH designs.'},
    {title:'Content guidelines',cat:'Documents & Guides',notes:'Tone of voice, Easy English and words we use.'},
    {title:'Social media guidelines',cat:'Documents & Guides',notes:'Caption format, hashtag list and tagging rules.'},
    {title:'Accessibility guidelines',cat:'Documents & Guides',notes:'Captions, ISL, alt text and contrast.'},
    {title:'Approval process',cat:'Documents & Guides',notes:'Who approves what, and how long it takes.'},
    {title:'Campus photo library',cat:'Photos & Videos',notes:'Mumbai, Pune and Delhi campuses. Check consent before use.'},
    {title:'Event photos 2026',cat:'Photos & Videos',notes:'Annual Day, Sign Languages Day and other events.'}
  ];
    // carry over anything added with the old library form
    try{(JSON.parse(localStorage.getItem('teach-comm-resources')||'[]')||[]).forEach(function(r){if(r&&r.title)lib.push({title:r.title,cat:'Documents & Guides',link:r.link||'',notes:'',createdAt:r.createdAt||''})})}catch(e){}
  }
  lib=lib.map(function(r){return Object.assign({id:uid(),cat:'Documents & Guides',link:'',notes:'',createdAt:''},r,{cat:CATS[r.cat]?r.cat:'Documents & Guides'})});
  function save(){try{localStorage.setItem(KEY,JSON.stringify(lib))}catch(e){}}
  save();
  var cat='All',editId=null;
  $('libCat').innerHTML=Object.keys(CATS).map(function(c){return '<option>'+esc(c)+'</option>'}).join('');

  function render(){
    var q=$('libSearch').value.trim().toLowerCase();
    $('libFilters').innerHTML=['All'].concat(Object.keys(CATS)).map(function(c){var n=c==='All'?lib.length:lib.filter(function(r){return r.cat===c}).length;return '<button type="button" data-libcat="'+esc(c)+'" class="'+(cat===c?'on':'')+'">'+(c==='All'?'All':CATS[c]+' '+esc(c))+' <span class="cnt">'+n+'</span></button>'}).join('');
    var rows=lib.filter(function(r){return (cat==='All'||r.cat===cat)&&(!q||(r.title+' '+r.notes+' '+r.cat).toLowerCase().indexOf(q)>-1)});
    var groups=cat==='All'?Object.keys(CATS):[cat];
    $('libList').innerHTML=rows.length?groups.map(function(c){var g=rows.filter(function(r){return r.cat===c});if(!g.length)return '';return '<section class="lib-group"><h4><span>'+CATS[c]+'</span>'+esc(c)+' <em>'+g.length+'</em></h4><div class="lib-grid">'+g.map(function(r){return '<div class="lib-item" id="lib-'+r.id+'"><div class="lib-main"><b>'+esc(r.title)+'</b>'+(r.notes?'<small>'+esc(r.notes)+'</small>':'')+'</div><div class="lib-acts">'+(r.link?'<a class="mini-btn lib-open" href="'+esc(r.link)+'" target="_blank" rel="noopener">Open ↗</a>':'<button type="button" class="mini-btn lib-nolink" data-libedit="'+r.id+'" title="No link yet">+ Add link</button>')+'<button type="button" class="mini-btn" data-libedit="'+r.id+'" aria-label="Edit '+esc(r.title)+'">Edit</button><button type="button" class="mini-btn danger" data-libdel="'+r.id+'" aria-label="Remove '+esc(r.title)+'">✕</button></div></div>'}).join('')+'</div></section>'}).join(''):'<div class="g-empty">Nothing matches. Try another search or add the file.</div>';
    renderHome();
  }
  function openForm(show,r){$('libForm').hidden=!show;$('libToggle').textContent=show?'Close':'+ Add file or folder';if(!show){editId=null;$('libForm').reset();$('libSave').textContent='Save';return}if(r){editId=r.id;$('libTitle').value=r.title;$('libCat').value=r.cat;$('libLink').value=r.link;$('libNotes').value=r.notes;$('libSave').textContent='Save changes'}else if(cat!=='All')$('libCat').value=cat;$('libForm').scrollIntoView({behavior:'smooth',block:'start'});(r&&!r.link?$('libLink'):$('libTitle')).focus()}
  $('libToggle').addEventListener('click',function(){openForm($('libForm').hidden)});
  $('libCancel').addEventListener('click',function(){openForm(false)});
  $('libForm').addEventListener('submit',function(e){e.preventDefault();var t=$('libTitle').value.trim(),l=$('libLink').value.trim();if(!t)return notify('Please enter a name.');if(l&&!/^https?:\/\//i.test(l))return notify('Please use a full link starting with https://');var d={title:t,cat:$('libCat').value,link:l,notes:$('libNotes').value.trim()};if(editId){var r=lib.find(function(x){return x.id===editId});if(r){Object.assign(r,d);save();log('Updated file',r.title,r.cat+(r.link?' · link added':''));notify('Saved.')}}else{var n=Object.assign({id:uid(),createdAt:new Date().toISOString()},d);lib.push(n);save();log('Added file',n.title,n.cat+(n.link?' · '+n.link:''));notify('Added to the library.')}openForm(false);render()});
  $('libFilters').addEventListener('click',function(e){var b=e.target.closest('[data-libcat]');if(!b)return;cat=b.dataset.libcat;render()});
  $('libSearch').addEventListener('input',render);
  $('libList').addEventListener('click',function(e){var ed=e.target.closest('[data-libedit]'),dl=e.target.closest('[data-libdel]');if(ed){openForm(true,lib.find(function(x){return x.id===ed.dataset.libedit}))}if(dl){var r=lib.find(function(x){return x.id===dl.dataset.libdel});if(!r||!confirm('Remove "'+r.title+'" from the library?'))return;lib=lib.filter(function(x){return x!==r});save();log('Removed file',r.title,r.cat);render();notify('Removed.')}});

  window.teachOpenLibrary=function(o){o=o||{};cat=o.cat&&CATS[o.cat]?o.cat:'All';$('libSearch').value=o.q||'';showView('library');render();if(o.q){var hit=lib.filter(function(r){return r.title.toLowerCase().indexOf(o.q.toLowerCase())>-1})[0];if(hit){var el=$('lib-'+hit.id);if(el){el.classList.add('flash');setTimeout(function(){el.classList.remove('flash')},1600)}}}};
  function openRes(title,fallbackCat){var r=lib.filter(function(x){return x.title.toLowerCase()===title.toLowerCase()})[0];if(r&&r.link){window.open(r.link,'_blank','noopener');return}window.teachOpenLibrary(r?{q:r.title}:{cat:fallbackCat})}

  // Home: library widget built from real data
  function renderHome(){var box=$('folders');if(!box)return;var q=($('folderSearch')||{}).value||'';q=q.trim().toLowerCase();if(q){var m=lib.filter(function(r){return (r.title+' '+r.notes).toLowerCase().indexOf(q)>-1}).slice(0,5);box.innerHTML=m.length?m.map(function(r){return '<div class="folder" role="button" tabindex="0" data-hlib="'+r.id+'"><div class="folder-ico">'+CATS[r.cat]+'</div><div><b>'+esc(r.title)+'</b><small>'+esc(r.cat)+(r.link?' · opens link':'')+'</small></div></div>'}).join(''):'<p class="pj-empty">No files match “'+esc(q)+'”.</p>';return}box.innerHTML=Object.keys(CATS).map(function(c){var n=lib.filter(function(r){return r.cat===c}).length;return '<div class="folder" role="button" tabindex="0" data-hlibcat="'+esc(c)+'"><div class="folder-ico">📁</div><div><b>'+esc(c)+'</b><small>'+n+' item'+(n===1?'':'s')+'</small></div></div>'}).join('')}
  var fold=$('folders');if(fold){var go=function(e){var a=e.target.closest('[data-hlibcat]'),b=e.target.closest('[data-hlib]');if(a)window.teachOpenLibrary({cat:a.dataset.hlibcat});if(b){var r=lib.find(function(x){return x.id===b.dataset.hlib});if(r&&r.link)window.open(r.link,'_blank','noopener');else if(r)window.teachOpenLibrary({q:r.title})}};fold.addEventListener('click',go);fold.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go(e)}})}
  var fs=$('folderSearch');if(fs){var nf=fs.cloneNode(true);fs.parentNode.replaceChild(nf,fs);nf.setAttribute('aria-label','Search the library');nf.addEventListener('input',renderHome);nf.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();window.teachOpenLibrary({q:nf.value.trim()})}})}

  // Home: quick links
  var QL={'Design Templates':function(){window.teachOpenLibrary({cat:'Templates'})},'TEACH Logo Pack':function(){window.teachOpenLibrary({cat:'Logos & Brand'})},'Content Guidelines':function(){openRes('Content guidelines','Documents & Guides')},'Social Media Guidelines':function(){openRes('Social media guidelines','Documents & Guides')},'Approval Process':function(){showView('approvals')}};
  document.querySelectorAll('#view-home .quick-link:not([data-go])').forEach(function(q){var t=q.textContent.replace('›','').trim();if(!QL[t])return;q.setAttribute('role','button');q.tabIndex=0;q.style.cursor='pointer';q.addEventListener('click',QL[t]);q.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();QL[t]()}})});
  document.querySelectorAll('#view-home .quick-link[data-go]').forEach(function(q){q.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();q.click()}})});

  // Home: hero button starts a new project
  var pill=document.querySelector('#view-home .hero .pill');if(pill){var btn=document.createElement('button');btn.type='button';btn.className='pill hero-cta';btn.textContent='Start a new project →';pill.parentNode.replaceChild(btn,pill);btn.addEventListener('click',function(){showView('projects');var t=$('pjToggle'),f=$('pjForm');if(t&&f&&f.hidden)t.click()})}

  document.querySelectorAll('[data-view="library"],[data-go="library"]').forEach(function(b){b.addEventListener('click',function(){cat='All';$('libSearch').value='';render()})});
  render();
})();


/* ---- block 11 ---- */
// ===== Sign-in (demo: checked in the browser, not a secure login) =====
(function(){
  var PASSWORD='Teach@2026';
  var PEOPLE={'pratik.parmar@teachedu.in':{name:'Pratik Parmar',role:'Communication Executive'},'jagruti.dhoke@teachedu.in':{name:'Jagruti Dhoke',role:'Communication Team'}};
  var KEY='teach-comm-session',$=function(id){return document.getElementById(id)};
  function nameFrom(email){return email.split('@')[0].split(/[._-]+/).filter(Boolean).map(function(w){return w.charAt(0).toUpperCase()+w.slice(1)}).join(' ')}
  function initials(n){return n.split(/\s+/).map(function(w){return w.charAt(0)}).join('').slice(0,2).toUpperCase()}
  function paint(){var u=window.teachUser;if(!u)return;if($('meName'))$('meName').textContent=u.name;if($('meRole'))$('meRole').textContent=u.role;if($('meAvatar'))$('meAvatar').textContent=initials(u.name)}
  var logo=document.querySelector('.logo-card img');if(logo&&$('loginLogo'))$('loginLogo').src=logo.src;
  $('pwToggle').addEventListener('click',function(){var p=$('loginPass'),show=p.type==='password';p.type=show?'text':'password';this.textContent=show?'Hide':'Show';this.setAttribute('aria-label',show?'Hide password':'Show password')});
  $('loginForm').addEventListener('submit',function(e){
    window.__loginRan=Date.now();e.preventDefault();var email=$('loginEmail').value.trim().toLowerCase(),pass=$('loginPass').value.trim(),err=$('loginError');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){err.textContent='Please enter a valid email address.';$('loginEmail').focus();return}
    if(pass!==PASSWORD){err.textContent='That password is not right. Please try again.';$('loginPass').select();return}
    err.textContent='';
    var p=PEOPLE[email]||{name:nameFrom(email),role:'TEACH Team'};
    window.teachUser={email:email,name:p.name,role:p.role,at:new Date().toISOString()};
    try{(($('loginRemember').checked)?localStorage:sessionStorage).setItem(KEY,JSON.stringify(window.teachUser))}catch(x){}
    document.documentElement.classList.add('authed');$('loginPass').value='';paint();
    if(window.logActivity)window.logActivity('Account','Signed in',p.name,email);
    if(typeof showView==='function')showView('home');
    if(typeof notify==='function')notify('Welcome, '+p.name.split(' ')[0]+'!');
  });
  $('signOut').addEventListener('click',function(){
    var u=window.teachUser;if(u&&window.logActivity)window.logActivity('Account','Signed out',u.name,u.email);
    try{localStorage.removeItem(KEY);sessionStorage.removeItem(KEY)}catch(x){}
    window.teachUser=null;document.documentElement.classList.remove('authed');$('loginEmail').value=u?u.email:'';$('loginPass').focus();
  });
  paint();
})();


/* ---- block 12 ---- */
/* ===== TEACH Comms: Team Access (Admin / Editor / View-only) ===== */
(function(){
  function $(id){return document.getElementById(id);}
  function say(m){try{notify(m);}catch(e){}}
  function lg2(a,t,d){try{if(window.logActivity)window.logActivity('Approvals',a,t,d||'');}catch(e){}}
  function lg(a,t,d){try{if(window.logActivity)window.logActivity('Team Access',a,t,d||'');}catch(e){}}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function nameFrom(email){return String(email).split('@')[0].split(/[._-]+/).filter(Boolean).map(function(w){return w.charAt(0).toUpperCase()+w.slice(1);}).join(' ')||email;}
  function initials(n){return String(n).split(/\s+/).map(function(w){return w.charAt(0);}).join('').slice(0,2).toUpperCase();}
  function isEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
  function clone(o){return JSON.parse(JSON.stringify(o));}
  var H=document.documentElement,KEY='teach-comm-access',ROLES={admin:'Admin',editor:'Editor',viewer:'View-only'};
  var SEED={people:[{email:'pratik.parmar@teachedu.in',name:'Pratik Parmar',role:'admin'},{email:'jagruti.dhoke@teachedu.in',name:'Jagruti Dhoke',role:'admin'}],
            settings:{manage:'everyone',defaultRole:'editor',allowRequests:true},approvers:{manager:'',ceo:''},v:2};
  var mem=null,state;

  function normalise(p){
    if(!p||!Array.isArray(p.people))return null;
    var seen={},people=[];
    p.people.forEach(function(x){
      var e=String(x&&x.email||'').trim().toLowerCase();
      if(!isEmail(e)||seen[e])return;seen[e]=1;
      people.push({email:e,name:String(x.name||'').trim()||nameFrom(e),role:ROLES[x.role]?x.role:'viewer'});
    });
    var s=p.settings||{};
    var ap=p.approvers||{},em=function(v){v=String(v||'').trim().toLowerCase();return isEmail(v)?v:'';};
    return {v:2,people:people,settings:{manage:s.manage==='admins'?'admins':'everyone',defaultRole:s.defaultRole==='editor'?'editor':'viewer',allowRequests:s.allowRequests!==false},approvers:{manager:em(ap.manager),ceo:em(ap.ceo)}};
  }
  function load(){
    var raw=null;try{raw=localStorage.getItem(KEY);}catch(e){}
    if(raw){try{var o=JSON.parse(raw),n=normalise(o);if(n&&n.people.length){if(!o.v||o.v<2)n.settings.defaultRole='editor';return n;}}catch(e){}}
    return mem?clone(mem):clone(SEED);
  }
  function persist(){mem=clone(state);try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
  state=load();
  window.teachAccessState=function(){return state;};

  function person(email){email=String(email||'').toLowerCase();for(var i=0;i<state.people.length;i++){if(state.people[i].email===email)return state.people[i];}return null;}
  function roleOf(email){var p=person(email);return p?p.role:state.settings.defaultRole;}
  function me(){return window.teachUser||null;}
  function myRole(){var u=me();return u?roleOf(u.email):null;}
  function canManage(){var r=myRole();return !!r&&(state.settings.manage==='everyone'||r==='admin');}
  function adminCount(){return state.people.filter(function(p){return p.role==='admin';}).length;}
  function msg(id,t,ok){var m=$(id);if(!m)return;m.textContent=t;m.style.color=ok?'#16885c':'#b42318';}

  /* ---------- what a View-only person cannot do ---------- */
  var HIDE=['#pjToggle','#libToggle','#tkToggle','#gToggle','#aToggle','#clAddItem','#submitApproval','#rqModalTask','[data-del]','[data-edit]','[data-adel]','[data-apin]','[data-approval-action]','[data-approve]','[data-tapprove]','[data-cldel]','[data-gdel]','[data-gedit]','[data-libdel]','[data-libedit]','[data-rqdel]','[data-save]','.pj-add','.appr-btn','#postForm','#approvalTitle','#approvalType','[data-aedit]','[data-rqedit]','[data-apr-edit]','[data-apr-del]'];
  var BLOCK=HIDE.concat(['[data-gfav]','[data-rqstatus]','[data-status]','#calSubmit','#libSave','#gSave']).join(',');
  var st=document.createElement('style');
  st.textContent='.acc-badge[hidden]{display:none!important}'+HIDE.map(function(s){return 'html.role-viewer '+s;}).join(',')+'{display:none!important}';
  document.head.appendChild(st);
  function viewer(){return window.teachRole==='viewer';}
  function deny(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();say('View-only access: you can look around, but not change things.');}
  document.addEventListener('click',function(e){
    if(!viewer()||!e.target.closest)return;
    if(e.target.closest('#view-access'))return;
    if(e.target.closest(BLOCK))deny(e);
  },true);
  document.addEventListener('submit',function(e){
    if(!viewer())return;var f=e.target;
    if(f.id==='rqForm'&&state.settings.allowRequests)return;
    if(f.closest&&f.closest('#view-access'))return;
    deny(e);
  },true);
  document.addEventListener('keydown',function(e){
    if(!viewer()||e.key!=='Enter'||!e.target.closest)return;
    if(e.target.closest('.pj-add'))deny(e);
  },true);
  document.addEventListener('dragstart',function(e){if(viewer())deny(e);},true);
  document.addEventListener('drop',function(e){if(viewer())deny(e);},true);
  var LOCK='.tk-edit input,.tk-edit select,.tk-edit textarea,select[data-status],[data-rqstatus],.pj-add input';
  function lockControls(){
    var v=viewer();
    document.querySelectorAll(LOCK).forEach(function(el){
      if(v){if(!el.disabled){el.disabled=true;el.setAttribute('data-acc-lock','1');}}
      else if(el.getAttribute('data-acc-lock')){el.disabled=false;el.removeAttribute('data-acc-lock');}
    });
  }
  var pending=false,mainEl=document.querySelector('main');
  if(mainEl&&window.MutationObserver){new MutationObserver(function(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;lockControls();});}).observe(mainEl,{childList:true,subtree:true});}

  /* ---------- apply the signed-in person's role ---------- */
  function applyRole(){
    var r=myRole();
    ['admin','editor','viewer'].forEach(function(x){H.classList.remove('role-'+x);});
    window.teachRole=r;if(r)H.classList.add('role-'+r);
    var b=$('meAccess');
    if(b){b.hidden=!r;b.textContent=r?ROLES[r]:'';b.className='acc-badge r-'+(r||'viewer');b.title=r?('Your access: '+ROLES[r]):'';}
    lockControls();showBanner();renderAccess();
    try{if(typeof renderApprovals==='function')renderApprovals();}catch(x){}
  }

  /* ---------- Team Access page ---------- */
  function renderAccess(){
    if(!$('accList'))return;
    var manage=canManage(),u=me(),r=myRole();
    $('accYou').innerHTML=u?('Signed in as <b>'+esc(u.name)+'</b> ('+esc(u.email)+') · <span class="acc-badge r-'+r+'">'+ROLES[r]+'</span>'+(person(u.email)?'':'<br><small>You are not on the list, so you have the default access for people who are not listed.</small>')):'Sign in to see your access.';
    var list=state.people.slice().sort(function(a,b){return a.name.localeCompare(b.name);});
    $('accCount').textContent=list.length;
    $('accList').innerHTML=list.map(function(p){
      var self=u&&u.email===p.email;
      return '<div class="acc-row" data-email="'+esc(p.email)+'"><div class="acc-av">'+esc(initials(p.name))+'</div><div class="acc-who"><b>'+esc(p.name)+(self?' <span class="acc-badge">you</span>':'')+'</b><small>'+esc(p.email)+'</small></div>'+
        '<select data-acc-role="'+esc(p.email)+'" aria-label="Role for '+esc(p.name)+'"'+(manage?'':' disabled')+'>'+['admin','editor','viewer'].map(function(k){return '<option value="'+k+'"'+(p.role===k?' selected':'')+'>'+ROLES[k]+'</option>';}).join('')+'</select>'+
        (manage?'<div class="acc-act"><button type="button" class="mini-btn danger" data-acc-del="'+esc(p.email)+'">Remove</button></div>':'')+'</div>';
    }).join('')||'<p class="acc-note">Nobody on the list yet.</p>';
    [].forEach.call(document.querySelectorAll('input[name=accManage]'),function(x){x.checked=x.value===state.settings.manage;x.disabled=!manage;});
    $('accDefault').value=state.settings.defaultRole;$('accDefault').disabled=!manage;
    $('accReq').checked=!!state.settings.allowRequests;$('accReq').disabled=!manage;
    $('accSetNote').textContent=manage?'':'Only admins can change access right now.';
    [].forEach.call($('accForm').querySelectorAll('input,select,button'),function(x){x.disabled=!manage;});
    $('accApply').disabled=!manage;
    if(document.activeElement!==$('accJson'))$('accJson').value=JSON.stringify(state,null,2);
    renderApprovers(manage);
  }
  function changed(selfAffected){persist();if(selfAffected)applyRole();else renderAccess();}
  function meEmail(){var u=me();return u?u.email:'';}

  $('accForm').addEventListener('submit',function(e){
    e.preventDefault();
    if(!canManage())return msg('accMsg','Only admins can give access right now.');
    var name=$('accName').value.trim(),email=$('accEmail').value.trim().toLowerCase(),role=$('accRole').value;
    if(!isEmail(email)){$('accEmail').focus();return msg('accMsg','Please enter a valid email address, for example name@teachedu.in');}
    if(person(email))return msg('accMsg','This person already has access. Change their role in the list below.');
    state.people.push({email:email,name:name||nameFrom(email),role:role});
    lg('Gave access',name||nameFrom(email),ROLES[role]+' · '+email);
    $('accForm').reset();changed(email===meEmail());msg('accMsg','Access given.',true);say('Access given and saved.');
  });
  $('accList').addEventListener('change',function(e){
    var s=e.target.closest('[data-acc-role]');if(!s)return;
    var p=person(s.dataset.accRole),nr=s.value;
    if(!p||!canManage()){renderAccess();return;}
    if(p.role==='admin'&&nr!=='admin'&&adminCount()===1){renderAccess();return say('There must be at least one Admin.');}
    var old=p.role;p.role=nr;lg('Changed role',p.name,ROLES[old]+' → '+ROLES[nr]);
    changed(p.email===meEmail());say('Saved.');
  });
  $('accList').addEventListener('click',function(e){
    var b=e.target.closest('[data-acc-del],[data-acc-yes],[data-acc-no]');if(!b)return;
    if(b.hasAttribute('data-acc-no')){renderAccess();return;}
    var email=b.dataset.accDel||b.dataset.accYes,p=person(email);if(!p||!canManage())return;
    if(b.hasAttribute('data-acc-del')){
      b.closest('.acc-act').innerHTML='<span class="acc-ask">Remove access?</span><button type="button" class="mini-btn danger" data-acc-yes="'+esc(email)+'">Yes, remove</button><button type="button" class="mini-btn" data-acc-no="1">Cancel</button>';return;
    }
    if(p.role==='admin'&&adminCount()===1){renderAccess();return say('There must be at least one Admin.');}
    state.people=state.people.filter(function(x){return x.email!==p.email;});
    lg('Removed access',p.name,ROLES[p.role]+' · '+p.email);changed(p.email===meEmail());say('Access removed.');
  });
  [].forEach.call(document.querySelectorAll('input[name=accManage]'),function(x){x.addEventListener('change',function(){
    if(!canManage()){renderAccess();return;}
    state.settings.manage=x.value;lg('Changed setting','Who can give or remove access',x.value==='admins'?'Admins only':'Everyone');persist();applyRole();say('Saved.');
  });});
  $('accDefault').addEventListener('change',function(){
    if(!canManage()){renderAccess();return;}
    state.settings.defaultRole=this.value;lg('Changed setting','Default role for people not on the list',ROLES[this.value]);persist();applyRole();say('Saved.');
  });
  $('accReq').addEventListener('change',function(){
    if(!canManage()){renderAccess();return;}
    state.settings.allowRequests=this.checked;lg('Changed setting','View-only people can send Comms requests',this.checked?'Yes':'No');persist();applyRole();say('Saved.');
  });
  $('accCopy').addEventListener('click',function(){
    var t=JSON.stringify(state,null,2),ta=$('accJson');
    function fall(){ta.focus();ta.select();msg('accMsg2','Press Ctrl+C (or Copy) to copy the selected list.',true);}
    try{navigator.clipboard.writeText(t).then(function(){msg('accMsg2','List copied.',true);},fall);}catch(x){fall();}
  });
  $('accApply').addEventListener('click',function(){
    if(!canManage())return msg('accMsg2','Only admins can change access right now.');
    var n=null;try{n=normalise(JSON.parse($('accJson').value));}catch(x){}
    if(!n||!n.people.length)return msg('accMsg2','This list could not be read. Please paste the list you copied.');
    if(!n.people.some(function(p){return p.role==='admin';}))return msg('accMsg2','The list needs at least one Admin.');
    state=n;lg('Applied access list','Team Access',n.people.length+' people');persist();$('accJson').blur();applyRole();msg('accMsg2','List applied.',true);say('Access list applied.');
  });

  /* ---------- Approvers: Manager first, then CEO ---------- */
  function appr(step){return (state.approvers&&state.approvers[step])||'';}
  function nameOfEmail(e){var p=person(e);return p?p.name:nameFrom(e);}
  function whoText(step){var e=appr(step);return e?nameOfEmail(e)+' ('+e+')':'';}
  function itemEmail(step,it){return it?String((step==='manager'?it.managerEmail:it.ceoEmail)||'').trim().toLowerCase():'';}
  function canApprove(step,it){var u=me();if(!u)return false;var mine=String(u.email).toLowerCase(),ie=itemEmail(step,it);if(ie)return mine===ie||myRole()==='admin';var e=appr(step);return e?mine===e:myRole()==='admin';}
  var STEP_LABEL={manager:'Manager',ceo:'CEO'};
  function renderApprovers(manage){
    if(!$('accMgr'))return;
    if(document.activeElement!==$('accMgr'))$('accMgr').value=appr('manager');
    if(document.activeElement!==$('accCeo'))$('accCeo').value=appr('ceo');
    $('accPeople').innerHTML=state.people.map(function(p){return '<option value="'+esc(p.email)+'">'+esc(p.name)+'</option>';}).join('');
    [].forEach.call($('accApprBox').querySelectorAll('input,button'),function(x){x.disabled=!manage;});
    var m=appr('manager'),c=appr('ceo');
    $('accApprNote').textContent=(m||c)?('Manager: '+(m?whoText('manager'):'not set — any Admin can approve this step')+'.  CEO: '+(c?whoText('ceo'):'not set — any Admin can approve this step')+'.'):'Not set yet. Until you set them, any Admin can approve at both steps.';
    var w=$('aprWho');
    if(w)w.innerHTML='<b>Who approves:</b> Manager — '+(m?esc(whoText('manager')):'not set (any Admin)')+' &nbsp;→&nbsp; CEO — '+(c?esc(whoText('ceo')):'not set (any Admin)')+'<br><small>Only they can approve or request changes at their step. Everyone can still use “View as” to preview each view.</small>';
  }
  function giveAccess(email,notes){
    var p=person(email);
    if(!p){state.people.push({email:email,name:nameFrom(email),role:'editor'});notes.push(nameFrom(email)+' was added as Editor.');lg('Gave access',nameFrom(email),'Editor · '+email+' (approver)');}
    else if(p.role==='viewer'){p.role='editor';notes.push(p.name+' was changed from View-only to Editor so they can approve.');lg('Changed role',p.name,'View-only → Editor (approver)');}
  }
  $('accApprSave').addEventListener('click',function(){
    if(!canManage())return msg('accMsg3','Only admins can change approvers right now.');
    var m=$('accMgr').value.trim().toLowerCase(),c=$('accCeo').value.trim().toLowerCase();
    if(m&&!isEmail(m)){$('accMgr').focus();return msg('accMsg3','Please enter a valid Manager email.');}
    if(c&&!isEmail(c)){$('accCeo').focus();return msg('accMsg3','Please enter a valid CEO email.');}
    if(m&&c&&m===c)return msg('accMsg3','The Manager and the CEO should be two different people.');
    var notes=[];if(m)giveAccess(m,notes);if(c)giveAccess(c,notes);
    state.approvers={manager:m,ceo:c};
    lg('Set approvers','Manager & CEO','Manager: '+(m||'not set')+' · CEO: '+(c||'not set'));
    persist();applyRole();msg('accMsg3','Approvers saved. '+notes.join(' '),true);say('Approvers saved.');
  });
  $('accApprClear').addEventListener('click',function(){
    if(!canManage())return msg('accMsg3','Only admins can change approvers right now.');
    state.approvers={manager:'',ceo:''};lg('Set approvers','Manager & CEO','Cleared');persist();applyRole();msg('accMsg3','Approvers cleared. Any Admin can approve.',true);
  });

  /* ---------- Approvals page: lock the buttons, add email buttons ---------- */
  function aFind(id){try{for(var i=0;i<approvals.length;i++){if(approvals[i].id===id)return approvals[i];}}catch(e){}return null;}
  function stepFor(action,it){if(action==='manager-approve')return 'manager';if(action==='ceo-approve')return 'ceo';if(action==='request-changes')return it.status==='Pending Manager Review'?'manager':'ceo';return null;}
  function appUrl(){return String(location.href).split('#')[0];}
  function compose(it){
    var by=it.submittedBy||'the Communication Team',s=it.status,to='',name='',subject='',body='',step=null,label='';
    var tail='\n\nOpen this item in TEACH Communication: '+appUrl()+(window.teachItemHash?window.teachItemHash(it):'')+'\n\nThank you.';
    if(s==='Pending Manager Review'){step='manager';to=appr('manager');name=to?nameOfEmail(to):'Manager';label='Email the Manager';
      subject='Approval needed: '+it.title;
      body='Hello '+name.split(' ')[0]+',\n\nA creative is waiting for your approval.\n\nItem: '+it.title+'\nType: '+it.type+'\nSubmitted by: '+by+'\nStep: Manager review\n\nPlease go to Manager & CEO Approvals and choose “View as: Manager”.'+tail;}
    else if(s==='Manager Approved'||s==='Pending CEO Approval'){step='ceo';to=appr('ceo');name=to?nameOfEmail(to):'CEO';label='Email the CEO';
      subject='Final approval needed: '+it.title;
      body='Hello '+name.split(' ')[0]+',\n\n“'+it.title+'” ('+it.type+') has been approved by '+(it.managerBy||'the Manager')+' and is ready for your final approval.\n\nSubmitted by: '+by+'\n\nPlease go to Manager & CEO Approvals and choose “View as: CEO / Final Approver”.'+tail;}
    else if(s==='Needs Changes'){to=it.submittedByEmail||'';name=by;label='Email '+by.split(' ')[0]+' about the changes';
      subject='Changes requested: '+it.title;
      body='Hello '+by.split(' ')[0]+',\n\nChanges were requested on “'+it.title+'”.\n\nFeedback: '+(it.feedback||'(see the app)')+'\n\nPlease update it and send it for approval again.'+tail;}
    else if(s==='Approved'){to=it.submittedByEmail||'';name=by;label='Email '+by.split(' ')[0]+' the approval';
      subject='Approved: '+it.title;
      body='Hello '+by.split(' ')[0]+',\n\n“'+it.title+'” ('+it.type+') has received final approval'+(it.ceoBy?' from '+it.ceoBy:'')+'. You can go ahead and use it.'+tail;}
    else return null;
    return {step:step,to:to,label:label,subject:subject,body:body};
  }
  window.teachApprovalCompose=compose;
  function decorate(){
    var box=$('approvalCards');if(!box)return;
    [].forEach.call(box.querySelectorAll('.approval-card:not([data-apr])'),function(card){
      card.setAttribute('data-apr','1');
      var it=aFind(card.dataset.aid);if(!it)return;
      [].forEach.call(card.querySelectorAll('[data-approval-action]'),function(b){
        var step=stepFor(b.dataset.approvalAction,it);
        if(!canApprove(step,it)){b.classList.add('acc-locked');b.setAttribute('aria-disabled','true');b.title=(itemEmail(step,it)||appr(step))?('Only '+(itemEmail(step,it)||whoText(step))+' can do this step.'):'Only an Admin can do this step until a '+STEP_LABEL[step]+' is set.';}
      });
      var c=compose(it);if(!c){addManage(card,it);return;}
      var extra='';
      if(c.step){extra+='<p class="apr-wait">Waiting for: <b>'+STEP_LABEL[c.step]+(appr(c.step)?' — '+esc(nameOfEmail(appr(c.step))):' (not set, any Admin)')+'</b></p>';}
      var row='<div class="apr-notify">';
      if(c.to){row+='<a class="request-btn apr-mail" data-apr-mail="'+esc(it.id)+'" href="mailto:'+esc(c.to)+'?subject='+encodeURIComponent(c.subject)+'&body='+encodeURIComponent(c.body)+'">✉ '+esc(c.label)+'</a>';}
      else if(c.step){row+='<button type="button" class="request-btn" data-apr-goto="1">Set the '+STEP_LABEL[c.step]+' on Team Access</button>';}
      if(c.to||c.step)row+='<button type="button" class="request-btn" data-apr-copy="'+esc(it.id)+'">Copy message</button>';
      row+='</div>';
      card.insertAdjacentHTML('beforeend',extra+row);
      addManage(card,it);
    });
  }
  function addManage(card,it){card.insertAdjacentHTML('beforeend','<div class="apr-notify apr-manage"><button type="button" class="request-btn" data-apr-edit="'+esc(it.id)+'">✎ Edit</button><button type="button" class="request-btn" data-apr-del="'+esc(it.id)+'">🗑 Delete</button></div>');}
  var ac=$('approvalCards');
  if(ac){
    new MutationObserver(decorate).observe(ac,{childList:true});
    ac.addEventListener('click',function(e){
      /*EDITDEL*/
      var ae=e.target.closest('[data-apr-edit]'),ad=e.target.closest('[data-apr-del]'),ay=e.target.closest('[data-apr-delyes]'),asv=e.target.closest('[data-apr-esave]'),ax=e.target.closest('[data-apr-ecancel]');
      if(ae||ad||ay||asv||ax){
        e.stopPropagation();
        var cardM=e.target.closest('.approval-card');
        if(ax){try{renderApprovals();}catch(x){}return;}
        var itM=aFind((ae||ad||ay||asv).dataset.aprEdit||(ae||ad||ay||asv).dataset.aprDel||(ae||ad||ay||asv).dataset.aprDelyes||(ae||ad||ay||asv).dataset.aprEsave);
        if(!itM)return;
        if(ae){
          var types=[].slice.call($('approvalType').options).map(function(o){return o.text;});
          cardM.innerHTML='<div class="apr-fb"><label>Creative / campaign name<input type="text" data-apr-et="1" value="'+esc(itM.title)+'"></label><label>Type<select data-apr-ety="1">'+types.map(function(t){return '<option'+(t===itM.type?' selected':'')+'>'+esc(t)+'</option>';}).join('')+'</select></label><div class="row"><button type="button" class="approve-btn" data-apr-esave="'+esc(itM.id)+'">✔ Save</button><button type="button" class="outline" data-apr-ecancel="1">Cancel</button></div><p class="apr-msg" role="status"></p></div>';
          var f1=cardM.querySelector('[data-apr-et]');if(f1)f1.focus();return;
        }
        if(asv){
          var nt=cardM.querySelector('[data-apr-et]').value.trim();
          if(!nt){cardM.querySelector('.apr-msg').textContent='Please enter a name before saving.';return;}
          var oldT=itM.title;itM.title=nt;itM.type=cardM.querySelector('[data-apr-ety]').value;itM.updated=new Date().toLocaleString();
          lg2('Edited approval item',nt,oldT!==nt?'Renamed from '+oldT:itM.type);saveApprovals();renderApprovals();say('Saved.');return;
        }
        if(ad){cardM.querySelector('.apr-manage').innerHTML='<span class="apr-ask">Delete this item?</span><button type="button" class="reject-btn" data-apr-delyes="'+esc(itM.id)+'">Yes, delete</button><button type="button" class="outline" data-apr-ecancel="1">Cancel</button>';return;}
        if(ay){
          for(var di=approvals.length-1;di>=0;di--){if(approvals[di].id===itM.id)approvals.splice(di,1);}
          lg2('Deleted approval item',itM.title,itM.type);saveApprovals();renderApprovals();say('Deleted.');return;
        }
      }
      var go=e.target.closest('[data-apr-goto]'),cp=e.target.closest('[data-apr-copy]'),ml=e.target.closest('[data-apr-mail]'),fb=e.target.closest('[data-apr-send],[data-apr-cancel]');
      if(go){e.stopPropagation();try{showView('access');}catch(x){}return;}
      if(cp){var it=aFind(cp.dataset.aprCopy),c=it&&compose(it);if(!c)return;var t='To: '+(c.to||'(add their email)')+'\nSubject: '+c.subject+'\n\n'+c.body;
        function ok(){say('Message copied. Paste it into an email or WhatsApp.');lg('Approvals','Message copied',it.title,c.label);}
        try{navigator.clipboard.writeText(t).then(ok,function(){say('Could not copy. Please use the email button.');});}catch(x){say('Could not copy. Please use the email button.');}return;}
      if(ml){var it2=aFind(ml.dataset.aprMail);if(it2){lg('Approvals','Email prepared',it2.title,compose(it2).label);}say('Opening your email app. If nothing opens, use “Copy message”.');return;}
      if(fb){
        var card=fb.closest('.approval-card'),it3=aFind(card.dataset.aid);
        if(fb.hasAttribute('data-apr-cancel')){try{renderApprovals();}catch(x){}return;}
        var txt=card.querySelector('[data-apr-fb]').value.trim();
        if(!txt){card.querySelector('[data-apr-fb]').focus();return say('Please type some feedback.');}
        if(!it3||!canApprove(stepFor('request-changes',it3),it3))return say('You cannot do this step.');
        it3.status='Needs Changes';it3.stage='Creator Updates';it3.feedback=txt;it3.changesBy=(me()||{}).name||'';it3.updated=new Date().toLocaleString();
        lg('Approvals','Changes requested',it3.title,'Feedback: '+txt);saveApprovals();renderApprovals();say('Feedback saved for the creator.');return;
      }
      var b=e.target.closest('[data-approval-action]');if(!b)return;
      var item=aFind(b.dataset.id);if(!item)return;
      var action=b.dataset.approvalAction,step=stepFor(action,item);
      function stop(){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}
      if(!canApprove(step,item)){stop();say((itemEmail(step,item)||appr(step))?'Only '+(itemEmail(step,item)||whoText(step))+' can do this step.':'Only an Admin can do this step until a '+STEP_LABEL[step]+' is set on Team Access.');return;}
      var u=me();
      if(action==='manager-approve'){item.managerBy=u?u.name:'';}
      else if(action==='ceo-approve'){item.ceoBy=u?u.name:'';}
      else if(action==='request-changes'){
        stop();
        var area=b.closest('.approval-actions');
        area.innerHTML='<div class="apr-fb"><label>Feedback or changes required<input type="text" data-apr-fb="1" placeholder="Type what needs to change"></label><div class="row"><button type="button" class="reject-btn" data-apr-send="1">↺ Send feedback</button><button type="button" class="outline" data-apr-cancel="1">Cancel</button></div></div>';
        var i2=area.querySelector('[data-apr-fb]');if(i2)i2.focus();
      }
    },true);
    ac.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.matches('[data-apr-fb]')){e.preventDefault();var s2=e.target.closest('.approval-card').querySelector('[data-apr-send]');if(s2)s2.click();}else if(e.key==='Enter'&&e.target.matches('[data-apr-et]')){e.preventDefault();var s3=e.target.closest('.approval-card').querySelector('[data-apr-esave]');if(s3)s3.click();}else if(e.key==='Escape'&&e.target.closest('.apr-fb')){try{renderApprovals();}catch(x){}}});
  }
  /* remember who submitted each new approval (so they can be emailed) */
  var known={};try{(approvals||[]).forEach(function(a){known[a.id]=1;});}catch(x){}
  if(typeof saveApprovals==='function'){
    var _sv=saveApprovals;
    saveApprovals=function(){var u=me();if(u){try{(approvals||[]).forEach(function(a){if(!known[a.id]){known[a.id]=1;if(!a.submittedByEmail){a.submittedByEmail=u.email;a.submittedBy=u.name;}}});}catch(x){}}return _sv.apply(this,arguments);};
  }

  /* clear message for people who only have View-only access */
  function showBanner(){
    var host=document.querySelector('main')||document.body,el=$('accBanner');
    if(!el){el=document.createElement('div');el.id='accBanner';el.className='acc-banner';el.setAttribute('role','status');host.insertBefore(el,host.firstChild);}
    var v=window.teachRole==='viewer';el.hidden=!v;
    if(v)el.innerHTML='👁 You are signed in with <b>View-only</b> access, so add, edit and delete buttons are hidden. '+(canManage()?'<button type="button" class="outline" id="accBannerGo">Open Team Access</button>':'Ask an Admin to give you Editor access.');
  }
  document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#accBannerGo')){try{showView('access');}catch(x){}}});

  /* react to sign-in / sign-out */
  var lastSig=null;
  function sigNow(){return window.teachUser?window.teachUser.email:'';}
  new MutationObserver(function(){var s=sigNow();if(s!==lastSig){lastSig=s;applyRole();}}).observe(H,{attributes:true,attributeFilter:['class']});
  lastSig=sigNow();applyRole();
})();


/* ===== Delete confirmation that also works where pop-up boxes are blocked ===== */
(function(){
  var nativeConfirm=window.confirm.bind(window),pending=null,timer=null;
  window.confirm=function(msg){
    var t0=performance.now(),r=false;
    try{r=nativeConfirm(msg);}catch(e){r=false;}
    if(r)return true;
    if(performance.now()-t0>150)return false;
    if(pending===msg){pending=null;clearTimeout(timer);return true;}
    pending=msg;clearTimeout(timer);timer=setTimeout(function(){pending=null;},5000);
    try{notify('Press Delete again within 5 seconds to confirm.');}catch(e){}
    return false;
  };
})();
