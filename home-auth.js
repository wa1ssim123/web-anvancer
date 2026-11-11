import { subscribeMember, getMemberState } from "/js/wix/member-store.js";

const DEMO_KEY='mihna-demo-session-v1';
function hasDemo(){ try{return !!JSON.parse(localStorage.getItem(DEMO_KEY)||'null')}catch{return false} }
const protectedPaths = new Set([
  '/jobs.html','/shifts.html','/talents.html','/matches.html','/academy.html','/shop.html','/business.html','/explore.html',
  '/favorites.html','/account.html','/candidate-setup.html','/recruiter-setup.html','/recruit.html','/quiz.html','/apply.html',
  '/admin.html','/boost.html','/trip.html','/profile.html','/job.html','/talent.html','/onboarding.html'
]);

function bindGuestButtons(){
  const login=document.getElementById('homeLoginLink');
  if(login && !login.dataset.directBound){login.dataset.directBound='1';login.addEventListener('click',e=>{if(document.body.classList.contains('home-guest')){e.preventDefault();location.assign('/login.html?mode=signin')}})}
  const create=document.querySelector('.home-create-account');
  if(create && !create.dataset.directBound){create.dataset.directBound='1';create.addEventListener('click',e=>{if(document.body.classList.contains('home-guest')){e.preventDefault();location.assign('/login.html?mode=signup')}})}
}

function addCreateButton(){
  const actions=document.querySelector('.art-header-actions');
  if(!actions || actions.querySelector('.home-create-account')) return;
  const a=document.createElement('a');
  a.className='art-login home-create-account';
  a.href='/login.html?mode=signup';
  a.textContent='Créer un compte';
  actions.insertBefore(a, document.getElementById('menuBtn') || null);
  bindGuestButtons();
}
function removeCreateButton(){document.querySelector('.home-create-account')?.remove()}

function applyState(loggedIn){
  document.documentElement.classList.remove('home-auth-pending');
  document.body.classList.toggle('home-guest',!loggedIn);
  document.body.classList.toggle('home-member',loggedIn);
  if(loggedIn) removeCreateButton(); else addCreateButton();
  bindGuestButtons();
}

// One capture listener: guests can see the presentation, but every real app route requires an account.
document.addEventListener('click',e=>{
  if(!document.body.classList.contains('home-guest')) return;
  const a=e.target.closest('a[href]'); if(!a) return;
  let u; try{u=new URL(a.href,location.href)}catch{return}
  if(u.origin!==location.origin || !protectedPaths.has(u.pathname)) return;
  e.preventDefault();
  const returnTo=u.pathname+u.search+u.hash;
  location.href='/login.html?returnTo='+encodeURIComponent(returnTo);
},true);

if(hasDemo()) applyState(true);
else {
  const decide=s=>{if(!s.loading) applyState(!!s.loggedIn)};
  subscribeMember(decide);
  decide(getMemberState());
}
