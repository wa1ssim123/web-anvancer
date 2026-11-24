/* Native href remains functional without JS. Explicit same-tab navigation for mobile. */
(()=>{'use strict';
function install(root=document){
 for(const link of root.querySelectorAll('[data-co-open]')){
  if(link.dataset.coBound==='1')continue;link.dataset.coBound='1';
  link.addEventListener('click',event=>{
   if(event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const url=new URL(link.href,location.href);
   if(url.origin!==location.origin||url.pathname!=='/candidate-offers.html')return;
   // Perform real top-level navigation, never a modal, async request or new tab.
   event.preventDefault();location.assign(url.href);
  });
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>install(),{once:true});else install();
})();