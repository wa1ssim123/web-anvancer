import {getMemberState,subscribeMember} from '/js/wix/member-store.js';
import {hub} from '/hn-api.js';
// Only a verified member session may change the logo's destination. Routing is not authorization.
export function dashboardForRole(role){return role==='admin'?'/admin.html':role==='manager'?'/manager.html':'/account.html'}
const selector='.hn12-logo,.hn-home-brand,.hs-brand,.hn12-actions .profile,[data-session-link],[data-hn-login],header [data-co="back"],header a[href="/account.html"],header a[href="/admin.html"],header a[href="/manager.html"]';
let resolved=null,memberId=null,seq=0;
const original=new WeakMap();
const ownPage=()=>location.pathname;
function updateLinks(){
 const state=getMemberState();if(state.loading)return;
 const logged=!!(state.loggedIn&&state.member?.id);
 for(const a of document.querySelectorAll(selector)){
  if(!original.has(a))original.set(a,a.getAttribute('href')||'/');
  const href=original.get(a);
  if(!logged){a.setAttribute('href',href);continue}
  // Preserve explicit module return anchors, except the ordinary header logo/account buttons.
  if(a.matches('[data-co="back"]'))continue;
  const target=dashboardForRole(resolved||(ownPage()==='/admin.html'?'admin':ownPage()==='/manager.html'?'manager':null));
  a.setAttribute('href',target);
  if(a.matches('.hn12-logo,.hn-home-brand,.hs-brand'))a.setAttribute('aria-label','HORENOVA · '+(document.documentElement.lang==='ar'?'حسابي':document.documentElement.lang==='en'?'My account':'Mon espace'));
  if(a.matches('[data-hn-login]')){const lang=document.documentElement.lang; a.textContent=lang==='ar'?'حسابي':lang==='en'?'My account':'Mon espace';}
 }
}
async function changed(s){
 if(s.loading)return;
 const id=s.loggedIn?s.member?.id:null;
 if(!id){seq++;memberId=null;resolved=null;updateLinks();return}
 if(id===memberId&&resolved){updateLinks();return}
 memberId=id;const ticket=++seq;updateLinks();
 try{const result=await hub('/api/me');if(ticket!==seq||getMemberState().member?.id!==id)return;resolved=result.role;updateLinks()}catch{if(ticket===seq)updateLinks()}
}
function navigate(e){
 const a=e.target?.closest?.(selector);if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button>0)return;
 const s=getMemberState();if(!s.loggedIn||!s.member?.id)return;
 if(a.matches('[data-co="back"]'))return;
 const dest=dashboardForRole(resolved||(ownPage()==='/admin.html'?'admin':ownPage()==='/manager.html'?'manager':null));
 e.preventDefault();e.stopImmediatePropagation();
 // Do not reload a dashboard the member already has open.
 if(ownPage()===dest){window.scrollTo({top:0,behavior:'auto'});return}
 location.assign(dest);
}
if(!document.documentElement.dataset.hnMemberNavigation){
 document.documentElement.dataset.hnMemberNavigation='r7';
 document.addEventListener('click',navigate,true);
 subscribeMember(s=>{void changed(s)});
 void changed(getMemberState());
 document.addEventListener('hn-role-navigation-ready',updateLinks);
 window.addEventListener('pageshow',updateLinks);
}
