// Restore a saved sign-in before the page paints (demo sign-in, front-end only)
(function(){var k='teach-comm-session',u=null;try{u=JSON.parse(localStorage.getItem(k)||sessionStorage.getItem(k)||'null')}catch(e){}window.teachUser=u;if(u)document.documentElement.classList.add('authed')})();
