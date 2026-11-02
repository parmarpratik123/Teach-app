/* ===== Sign-in safety net: signs in directly if the main sign-in code did not respond, and shows any page error on the sign-in screen ===== */
(function(){
  var H=document.documentElement,PASS='Teach@2026',KEY='teach-comm-session';
  function $(id){return document.getElementById(id);}
  window.addEventListener('error',function(e){
    try{var el=$('loginError');if(el&&!H.classList.contains('authed')&&!el.textContent)el.textContent='A page problem was found: '+(e.message||'unknown')+'. Please send this message to the site owner.';}catch(x){}
  });
  var form=$('loginForm');if(!form)return;
  form.addEventListener('submit',function(ev){
    try{ev.preventDefault();}catch(x){}
    var email=String($('loginEmail').value||'').trim().toLowerCase(),pass=String($('loginPass').value||'').trim();
    setTimeout(function(){
      try{
        if(H.classList.contains('authed')||window.__loginRan)return;
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){$('loginError').textContent='Please enter a valid email address.';return;}
        if(pass!==PASS){$('loginError').textContent='That password is not right. Please try again.';return;}
        var name=email.split('@')[0].split(/[._-]+/).filter(Boolean).map(function(w){return w.charAt(0).toUpperCase()+w.slice(1);}).join(' ');
        window.teachUser={email:email,name:name,role:'TEACH Team',at:new Date().toISOString()};
        try{(($('loginRemember')&&$('loginRemember').checked)?localStorage:sessionStorage).setItem(KEY,JSON.stringify(window.teachUser));}catch(x){}
        H.classList.add('authed');var le=$('loginError');if(le)le.textContent='';
        try{if($('meName'))$('meName').textContent=name;if($('meRole'))$('meRole').textContent='TEACH Team';if($('meAvatar'))$('meAvatar').textContent=name.split(/\s+/).map(function(w){return w.charAt(0);}).join('').slice(0,2).toUpperCase();}catch(x){}
        try{showView('home');}catch(x){}
      }catch(x){}
    },200);
  });
})();
