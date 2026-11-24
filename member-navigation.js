import {getMemberState,subscribeMember} from '/js/wix/member-store.js';
import {hub} from '/hn-api.js';
export function dashboardForRole(role){return role==='admin'?'/admin.html':role==='manager'?'/manager.html':'/account.html'}
const selector='.hn12-logo,.hn-home-brand,.hs-brand,.hn12-actions .profile,[data-hn-login]';
let role=null,owner=null,seq=0;const original=new WeakMap();
function sync(){
 const s=getMemberState();if(s.loading)return;
 for(const a of document.querySelectorAll(selector)){
  if(!original.has(a))original.set(a,{href:a.getAttribute('href')||'/',text:a.textContent});
  if(!s.loggedIn||!s.member?.id){const o=original.get(a);a.href=o.href;if(a.matches('[data-hn-login]'))a.textContent=o.text;continue}
  const verified=role||document.body.dataset.memberRole;
  const dest=dashboardForRole(verified||(location.pathname==='/admin.html'?'admin':location.pathname==='/manager.html'?'manager':null));
  a.href=location.pathname===dest&&document.getElementById('hnDashboardTop')?'#hnDashboardTop':dest;
  if(a.matches('[data-hn-login]'))a.textContent=document.documentElement.lang==='ar'?'حسابي':document.documentElement.lang==='en'?'My account':'Mon espace';
 }
}
async function changed(s){
 if(s.loading)return;const id=s.loggedIn?s.member?.id:null;
 if(!id){seq++;owner=null;role=null;sync();return}
 if(id===owner){sync();return}
 owner=id;role=null;const ticket=++seq;sync();
 try{const me=await hub('/api/me');if(ticket===seq&&getMemberState().member?.id===id){role=me.role;sync()}}catch{if(ticket===seq)sync()}
}
if(!document.documentElement.dataset.hnNativeNav){
 document.documentElement.dataset.hnNativeNav='r8';
 subscribeMember(s=>{void changed(s)});void changed(getMemberState());
 document.addEventListener('hn-role-navigation-ready',sync);
 window.addEventListener('pageshow',sync);
}
// Deliberately no click handlers: all buttons, anchors, keyboard and touch use native browser behavior.
