const panel=document.getElementById('mobileMenu');
const menu=document.getElementById('menuBtn');
function openMenu(){if(!panel)return;panel.hidden=false;panel.classList.add('open','hn15-open');document.body.classList.add('hn15-menu-open');menu?.setAttribute('aria-expanded','true');if(menu)menu.textContent='×'}
function closeMenu(){if(!panel)return;panel.classList.remove('open','hn15-open');panel.hidden=true;document.body.classList.remove('hn15-menu-open');menu?.setAttribute('aria-expanded','false');if(menu)menu.textContent='☰'}
if(menu&&panel){menu.setAttribute('aria-expanded','false');menu.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();panel.classList.contains('hn15-open')?closeMenu():openMenu()},{capture:true});}
panel?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
document.addEventListener('click',e=>{if(panel?.classList.contains('hn15-open')&&!panel.contains(e.target)&&e.target!==menu)closeMenu()});