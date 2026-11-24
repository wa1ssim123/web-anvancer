/* HORENOVA — official WhatsApp and Telegram pictograms.
 * Local SVG artwork derived from Simple Icons' WhatsApp and Telegram glyphs.
 * The original names, links, accessible labels and i18n remain unchanged.
 */
(()=>{
 'use strict';
 if(window.__hnOfficialSocialLogosV1)return;
 window.__hnOfficialSocialLogosV1=true;
 const BRAND={
  whatsapp:{src:'/assets/brand-whatsapp.svg',name:'WhatsApp'},
  telegram:{src:'/assets/brand-telegram.svg',name:'Telegram'}
 };
 const TEXT={
  whatsapp:/(?:\bwhatsapp\b|واتساب|واتسآب)/i,
  telegram:/(?:\btelegram\b|تيليغرام|تلغرام|تليجرام)/i
 };
 const SYMBOLS=[
  ['#canal .hc-channel-symbol','whatsapp'],
  ['#telegram .hc-channel-symbol','telegram'],
  ['#hnWhatsappChannelAdmin .hca-badge','whatsapp'],
  ['#hnTelegramChannelAdmin .hca-badge','telegram']
 ];
 const explicit=[
  ['#hnSocialWA','whatsapp'],
  ['#hnSocialTG','telegram'],
  ['#hnSocialTGPending','telegram'],
  ['#hcFollow','whatsapp'],
  ['#hcTelegramFollow','telegram'],
  ['#hcaSave','whatsapp'],
  ['#htgSave','telegram'],
  ['#hnAdminSocialPublications #hspaTelegram','telegram']
 ];
 function logo(brand){
  const item=BRAND[brand];
  const img=document.createElement('img');
  img.className='hn-brand-logo hn-brand-logo-'+brand;
  img.src=item.src;img.width=20;img.height=20;
  img.alt='';img.setAttribute('aria-hidden','true');
  img.decoding='async';img.loading='eager';
  img.dataset.hnBrand=brand;
  return img;
 }
 function isPresent(el,brand){
  return !!Array.from(el.children).find(child=>
   child.classList?.contains('hn-brand-logo')&&child.dataset.hnBrand===brand);
 }
 function inject(el,brand,symbol=false){
  if(!el||el.closest('.hn-intro-shortcut-social'))return;
  if(symbol){
   if(el.children.length===1&&isPresent(el,brand))return;
   el.replaceChildren(logo(brand));
   el.classList.add('hn-brand-symbol');
   return;
  }
  if(isPresent(el,brand))return;
  const icon=logo(brand);
  el.prepend(icon);
  el.classList.add('hn-brand-control');
 }
 function classify(el){
  const id=el.id||'';
  const href=el.getAttribute?.('href')||'';
  const text=(el.textContent||'').trim().replace(/\s+/g,' ');
  if(text.length>90)return [];
  const names=[];
  if(TEXT.whatsapp.test(text)||/(?:whatsapp\.com\/channel|wa\.me\/)/i.test(href)||/^hca/.test(id)&&el.closest('#hnWhatsappChannelAdmin'))names.push('whatsapp');
  if(TEXT.telegram.test(text)||/(?:^https:\/\/(?:t\.me|telegram\.me)\/)/i.test(href)||/^htg/.test(id)&&el.closest('#hnTelegramChannelAdmin'))names.push('telegram');
  return names;
 }
 let queued=false;
 function refresh(){
  queued=false;
  for(const [selector,brand] of SYMBOLS){
   document.querySelectorAll(selector).forEach(node=>inject(node,brand,true));
  }
  for(const [selector,brand] of explicit){
   document.querySelectorAll(selector).forEach(node=>inject(node,brand));
  }
  const candidates=document.querySelectorAll(
   'a[href],button,.hspa-connection b,.hspa-pill,.hn-social-pending');
  for(const node of candidates){
   // Never attach branding to the private support FAB, forms, or hidden input.
   if(node.closest('.hs-launcher,.hs-fab-v3')||node.matches('[aria-hidden="true"]'))continue;
   for(const brand of classify(node))inject(node,brand);
  }
 }
 function queue(){
  if(queued)return;queued=true;
  (window.requestAnimationFrame||setTimeout)(refresh);
 }
 function init(){
  if(!document.body)return;
  const style=document.createElement('link');
  style.rel='stylesheet';style.href='/social-brand-icons.css?v=20261123-logo1';
  style.dataset.hnBrandStyles='';
  document.head.append(style);
  refresh();
  const observer=new MutationObserver(records=>{
   if(records.some(r=>r.type==='childList'&&[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.classList?.contains('hn-brand-logo'))))queue();
  });
  observer.observe(document.body,{subtree:true,childList:true});
  document.addEventListener('hn-admin-moderation-changed',queue);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
