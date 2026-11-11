import { subscribeMember,getMemberState } from '/js/wix/member-store.js';
const demo=()=>{try{return !!JSON.parse(localStorage.getItem('mihna-demo-session-v1')||'null')}catch{return false}};
function session(){const go=()=>location.href='/account.html';document.querySelectorAll('[data-hn-login]').forEach(a=>a.onclick=e=>{if(demo()||getMemberState().loggedIn){e.preventDefault();go()}});subscribeMember(()=>{})}
function reveal(){const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('show');io.unobserve(x.target)}}),{threshold:.12});document.querySelectorAll('[data-hn-reveal]').forEach(x=>io.observe(x))}
function motion(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;addEventListener('pointermove',e=>{const x=(e.clientX/innerWidth-.5),y=(e.clientY/innerHeight-.5);document.querySelectorAll('[data-float]').forEach((el,i)=>{const d=8+(i%4)*5;el.style.transform=`translate3d(${x*d}px,${y*d}px,0) rotate(${x*2}deg)`})})}
function intro(){const l=document.querySelector('.hn-intro');if(!l)return;setTimeout(()=>l.classList.add('open'),250);l.querySelector('button')?.addEventListener('click',()=>l.classList.add('gone'))}
function init(){document.body.classList.add('hn-home');intro();reveal();motion();session()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
