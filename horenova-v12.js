/* isolated HORENOVA presentation */
(()=>{
(() => {
'use strict';
const page=document.body.dataset.hn12||'';
const links=[['/jobs.html','Offres'],['/shifts.html','Shifts'],['/talents.html','Talents'],['/academy.html','Academy'],['/shop.html','Shop'],['/explore.html','Maroc']];
const top=document.getElementById('hn12Top');
const panel=document.getElementById('mobileMenu');
const menu=document.getElementById('menuBtn');
// Menu handling moved to mobile-nav-v15.js
const progress=document.createElement('div');progress.className='hn12-progress';document.body.append(progress);addEventListener('scroll',()=>{const h=document.documentElement.scrollHeight-innerHeight;progress.style.width=(h>0?(scrollY/h)*100:0)+'%'},{passive:true});
const els=[...document.querySelectorAll('[data-hn12-reveal]')];if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target)}}),{threshold:.08});els.forEach(x=>io.observe(x))}else els.forEach(x=>x.classList.add('show'));
document.querySelectorAll('.hn12-card,.job-card-page,.shift-card,.talent-card').forEach(card=>{card.addEventListener('pointermove',e=>{if(innerWidth<961)return;const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(800px) rotateX(${-y*2}deg) rotateY(${x*2}deg) translateY(-3px)`});card.addEventListener('pointerleave',()=>card.style.transform='')});

})();

})();
