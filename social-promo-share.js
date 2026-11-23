/* HORENOVA official promotional posters (uploaded by the owner).
 * The image changes at every user-initiated copy, without immediate repeats.
 * Media is stored in HORENOVA's own Wix Media Manager.
 */
export const PROMO_IMAGES=Object.freeze([
 'https://static.wixstatic.com/media/d0158d_0567d574c9cf463e92d49454e4be181c~mv2.jpg',
 'https://static.wixstatic.com/media/d0158d_e63bc288c1dc4c77a2ed6f6101941268~mv2.jpg',
 'https://static.wixstatic.com/media/d0158d_84ce4d96fe64462784b4b8a6de956f87~mv2.jpg',
 'https://static.wixstatic.com/media/d0158d_8708b67c54f84b4ea126b7ba2aa59569~mv2.jpg',
 'https://static.wixstatic.com/media/d0158d_94f90047e5014b61913ad975b913e88f~mv2.jpg'
]);
let lastPromo=-1;
export function nextPromoImage(random=Math.random){
 const n=PROMO_IMAGES.length;
 const r=Math.max(0,Math.min(0.99999999,Number(random())||0));
 const choice=lastPromo<0?Math.floor(r*n):Math.floor(r*(n-1));
 const index=lastPromo<0?choice:choice>=lastPromo?choice+1:choice;
 lastPromo=index;
 return PROMO_IMAGES[index];
}
function safeLine(value,max=115){
 return String(value||'').replace(/[\u0000-\u001f\u007f<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
}
export function buildPromoMessage(offer,row){
 const title=safeLine(offer?.title,100)||'Opportunité HORENOVA';
 const city=safeLine(offer?.city,75)||'Maroc';
 const kind=offer?.kind==='shift'?'SHIFT / EXTRA':'EMPLOI';
 const isUuid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value||''));
 // Prefer the exact safe public link returned by the API, including relative URLs.
 // If the API omits the link, reconstruct it from the approved request ID.
 let url='';
 try{
  const candidate=new URL(String(offer?.publicUrl||row?.publicUrl||''),'https://horenova.com');
  const id=candidate.searchParams.get('id');
  if(candidate.origin==='https://horenova.com'
   && /^\/(?:job|shift)\.html$/.test(candidate.pathname)
   && isUuid(id))url=candidate.origin+candidate.pathname+'?id='+id;
 }catch{}
 if(!url){
  const id=String(offer?.requestId||offer?.id||row?.requestId||'');
  url=isUuid(id)?'https://horenova.com/job.html?id='+id:'https://horenova.com/jobs.html';
 }
 const original=String(row?.message||'');
 const businessLine=original.split('\n').find(line=>line.startsWith('🏢 '));
 const business=safeLine(businessLine?.slice(3),85);
 return [
  '✨ HORENOVA | NOUVELLE OPPORTUNITÉ HORECA 🇲🇦',
  '',
  '🚀 Une nouvelle '+(kind==='EMPLOI'?'offre d’emploi':'mission flexible')+' est disponible !',
  '',
  '💼 Poste : '+title,
  ...(business?['🏢 Établissement : '+business]:[]),
  '📍 Ville : '+city,
  '📋 Type : '+kind,
  '',
  '✅ Annonce validée sur HORENOVA',
  '🔗 Voir les détails et postuler :',
  url,
  '',
  '🍽️ Hôtellerie • Restauration • Tourisme',
  '🌐 https://horenova.com',
  '',
  '🇲🇦 فرص عمل ومهام جديدة في قطاع الفندقة والمطاعم والسياحة',
  '',
  '#HORENOVA #EmploiMaroc #HORECA #Recrutement'
 ].join('\n');
}
export async function fetchPosterBlob(url){
 const response=await fetch(url,{mode:'cors',credentials:'omit',cache:'force-cache'});
 if(!response.ok)throw Error('Poster HTTP '+response.status);
 const blob=await response.blob();
 if(!/^image\/(jpeg|png|webp)$/i.test(blob.type))throw Error('Invalid poster media type');
 return blob;
}
export async function posterAsPng(url){
 const blob=await fetchPosterBlob(url);
 const blobUrl=URL.createObjectURL(blob);
 try{
  const img=new Image();
  img.src=blobUrl;
  await img.decode();
  if(!img.naturalWidth||!img.naturalHeight)throw Error('Invalid poster dimensions');
  const scale=Math.min(1,1100/img.naturalWidth,1600/img.naturalHeight);
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
  canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('Canvas unavailable');
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  const png=await new Promise((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(Error('PNG conversion failed')),'image/png'));
  return png;
 }finally{URL.revokeObjectURL(blobUrl)}
}
export async function copyTextOnly(message){
 try{
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(message);return true}
 }catch{}
 // Last chance for Safari/WebView with synchronous textarea selection.
 const el=document.createElement('textarea');el.value=message;el.readOnly=true;
 el.style.cssText='position:fixed;top:0;left:0;opacity:.01;width:1px;height:1px';
 document.body.append(el);el.focus();el.select();
 let succeeded=false;
 try{succeeded=!!document.execCommand?.('copy')}catch{}
 el.remove();
 return succeeded;
}
export async function copyRichPromo(message,imageUrl){
 // ClipboardItem is constructed in the original click gesture.
 // Safari can reject multiple formats; never report a combined copy unless it succeeds.
 if(typeof ClipboardItem!=='undefined'&&navigator.clipboard?.write){
  try{
   const pngPromise=posterAsPng(imageUrl);
   pngPromise.catch(()=>{}); // Browser may reject ClipboardItem before consuming the PNG promise.
   const item=new ClipboardItem({
    'text/plain':new Blob([message],{type:'text/plain'}),
    'image/png':pngPromise
   });
   await navigator.clipboard.write([item]);
   return {kind:'rich'};
  }catch{}
 }
 return {kind:await copyTextOnly(message)?'text':'manual'};
}
export async function sharePromo(message,imageUrl,preloadedPoster=null){
 if(!navigator.share)throw Error('Native sharing unavailable');
 // When the poster has been preloaded, invoke navigator.share in the SAME click
 // task: mobile Safari may reject a share started after an awaited network fetch.
 const poster=preloadedPoster||await fetchPosterBlob(imageUrl);
 const type=poster.type||'image/jpeg';
 const ext=type==='image/png'?'png':type==='image/webp'?'webp':'jpg';
 const file=new File([poster],'HORENOVA-recrutement.'+ext,{type});
 if(navigator.canShare&&!navigator.canShare({files:[file]}))throw Error('Sharing files unavailable');
 // Files shared through iOS / WhatsApp may discard the message and URL.
 // Sharing the photo alone preserves the previously copied text on clipboard.
 const payload={files:[file],title:'HORENOVA | Recrutement'};
 if(String(message||'').trim())payload.text=String(message);
 await navigator.share(payload);
}
