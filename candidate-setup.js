import { requireRole, getDemoSession, currentLang } from "/mihna-global.js";
import { queryItems, insertItem, patchItemFields } from "/js/wix/items.js";
import { wixRequest } from "/js/wix/client.js";
import { hubUploadPhoto,hub } from "/hn-api.js";
const auth=await requireRole(['candidate']); if(!auth) throw new Error('auth');
const f=document.getElementById('candidateForm'), preview=document.getElementById('videoPreview'), status=document.getElementById('uploadStatus');
const langs=['Arabic','French','English'];document.getElementById('languageGrid').innerHTML=langs.map((l,i)=>`<article class="language-card"><b>${l==='Arabic'?'العربية':l==='French'?'Français':'English'}</b><div class="yesno"><label><input type="radio" name="${l.toLowerCase()}" value="yes" required> Oui</label><label><input type="radio" name="${l.toLowerCase()}" value="no" required> Non</label></div><label class="level-control">Niveau <input name="${l.toLowerCase()}Level" type="range" min="1" max="5" value="3"><output>3/5</output></label></article>`).join('');
document.querySelectorAll('input[type=range]').forEach(r=>r.oninput=()=>{const o=r.parentElement.querySelector('output');if(o)o.textContent=r.value+'/5'});
if(f.elements.photo)f.elements.photo.onchange=()=>{
 const file=f.elements.photo.files?.[0],img=document.getElementById('candidatePhotoPreview');
 if(!file||!img)return;
 if(file.size>8*1024*1024){status.textContent='Photo trop volumineuse (max. 8 Mo).';return;}
 img.src=URL.createObjectURL(file);img.hidden=false;
};
f.video.required=false;
f.video.onchange=()=>{const file=f.video.files[0];if(!file)return;preview.src=URL.createObjectURL(file);preview.hidden=false;status.textContent=`${file.name} · ${(file.size/1024/1024).toFixed(1)} MB`};
let existing=null,hasPortrait=false;
try{
 const results=await Promise.allSettled([
  queryItems('CandidateProfiles',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:1}),
  queryItems('CandidatePublicProfiles',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:1}),
  hub('/api/profile/photo/status'),
  hub('/api/profile/candidate')
 ]);
 if(results[0].status==='fulfilled')existing=results[0].value.items?.[0]||null;
 if(results[1].status==='fulfilled'&&f.elements.publicIdentityConsent)f.elements.publicIdentityConsent.checked=!!(results[1].value.items?.[0]?.displayName&&!['Talent Horenova','Talent HORENOVA','Profil confidentiel'].includes(results[1].value.items[0].displayName));
 if(results[2].status==='fulfilled')hasPortrait=!!results[2].value.hasPhoto;
 const stored=results[3].status==='fulfilled'?results[3].value.profile:null;
 const saved=stored&&Object.keys(stored).length?{...existing,...stored}:existing;
 if(saved){
  for(const key of ['firstName','lastName','age','city','jobFamily','bio','otherLanguage','otherLanguageLevel'])if(f.elements[key]&&saved[key]!=null)f.elements[key].value=saved[key];
  for(const language of ['arabic','french','english']){
   if(typeof saved[language]!=='boolean')continue;
   const yes=saved[language];
   const radio=f.querySelector('input[name="'+language+'"][value="'+(yes?'yes':'no')+'"]');if(radio)radio.checked=true;
   const slider=f.elements[language+'Level'];if(slider&&saved[language+'Level']!=null){slider.value=saved[language+'Level'];slider.dispatchEvent(new Event('input'));}
  }
  f.video.required=false;
 }
}catch(error){console.warn('HORENOVA profile prefilling temporarily unavailable',error?.message||'network');}
f.elements.photo.required=!hasPortrait;
const photoLabel=f.elements.photo.closest('label')?.querySelector('small');
if(photoLabel){const labels={fr:['PHOTO PROFESSIONNELLE · OPTIONNELLE (déjà enregistrée)','PHOTO PROFESSIONNELLE · OBLIGATOIRE'],ar:['الصورة المهنية · اختيارية (مسجلة مسبقًا)','الصورة المهنية · إلزامية'],en:['PROFESSIONAL PHOTO · OPTIONAL (already saved)','PROFESSIONAL PHOTO · REQUIRED']};photoLabel.textContent=(labels[currentLang()]||labels.fr)[hasPortrait?0:1];}

const MAX_PRIVATE_VIDEO_BYTES=500*1024*1024;
const DIRECT_VIDEO_LIMIT=10*1024*1024;
const extension=file=>String(file?.name||'').split('.').pop()?.toLowerCase();
const supportedVideo=file=>/^(video\/mp4|video\/quicktime|video\/webm)$/i.test(file.type||'')||['mov','mp4','webm','m4v'].includes(extension(file));
const fileIdFromReply=data=>data?.file?.id||data?.fileDescriptor?.id||data?.fileDescriptor?.file?.id||data?.id||'';
function uploadError(response,stage){
  return new Error(stage+' ('+response.status+'). Réessayez avec une connexion stable.');
}
async function directPrivateVideoUpload(file,mime){
  const result=await wixRequest('/ricos/v1/ricos-document/generate-file-upload-url',{
    body:{mimeType:mime,fileName:file.name,private:true}
  });
  if(!result?.uploadUrl)throw Error('Le service Wix n’a pas fourni de lien sécurisé pour la vidéo.');
  status.textContent='Envoi chiffré de la vidéo privée…';
  const response=await fetch(result.uploadUrl,{
    method:'PUT',headers:{'Content-Type':mime},body:file
  });
  if(!response.ok)throw uploadError(response,'Échec de l’envoi vidéo');
  const data=await response.json().catch(()=>({}));
  return fileIdFromReply(data);
}
function tusMetadata(value){
  const bytes=new TextEncoder().encode(String(value));
  let chars='';for(const byte of bytes)chars+=String.fromCharCode(byte);
  return btoa(chars);
}
async function resumablePrivateVideoUpload(file,mime){
  const result=await wixRequest('/site-media/v1/files/generate-resumable-upload-url',{
    body:{mimeType:mime,fileName:file.name,sizeInBytes:String(file.size),private:true,uploadProtocol:'TUS'}
  });
  if(!result?.uploadUrl||!result?.uploadToken)throw Error('L’envoi reprenable de Wix est momentanément indisponible.');
  status.textContent='Ouverture d’une session d’envoi privée…';
  const initialize=await fetch(result.uploadUrl,{
    method:'POST',
    headers:{
      'Tus-Resumable':'1.0.0',
      'Upload-Length':String(file.size),
      'Upload-Metadata':[
        'filename '+tusMetadata(file.name),
        'contentType '+tusMetadata(mime),
        'token '+tusMetadata(result.uploadToken)
      ].join(',')
    }
  });
  if(!initialize.ok)throw uploadError(initialize,'Session vidéo refusée');
  const locationHeader=initialize.headers.get('Location');
  if(!locationHeader)throw Error('Wix n’a pas fourni l’adresse de reprise du transfert.');
  const sessionUrl=new URL(locationHeader,result.uploadUrl).href;
  let offset=0,attempts=0;
  const CHUNK=5*1024*1024;
  while(offset<file.size){
    const next=Math.min(file.size,offset+CHUNK);
    let response;
    try{
      response=await fetch(sessionUrl,{
        method:'PATCH',
        headers:{'Tus-Resumable':'1.0.0','Upload-Offset':String(offset),'Content-Type':'application/offset+octet-stream'},
        body:file.slice(offset,next)
      });
      if(!response.ok)throw uploadError(response,'Interruption de transfert');
      const parsedOffset=Number(response.headers.get('Upload-Offset'));
      offset=Number.isFinite(parsedOffset)&&parsedOffset>offset?parsedOffset:next;
      if(offset>file.size)throw Error('Décalage de transfert invalide retourné par Wix.');
      attempts=0;
      status.textContent='Vidéo privée : '+Math.min(100,Math.round(offset/file.size*100))+' % envoyés';
    }catch(error){
      if(++attempts>3)throw Error('Envoi vidéo interrompu après plusieurs tentatives. Vérifiez la connexion et réessayez.');
      status.textContent='Connexion interrompue. Reprise de la vidéo…';
      await new Promise(resolve=>setTimeout(resolve,attempts*800));
      const probe=await fetch(sessionUrl,{method:'HEAD',headers:{'Tus-Resumable':'1.0.0'}});
      if(!probe.ok)throw uploadError(probe,'Reprise vidéo indisponible');
      const headOffset=Number(probe.headers.get('Upload-Offset'));
      if(!Number.isInteger(headOffset)||headOffset<0||headOffset>file.size)throw Error('État du transfert vidéo invalide.');
      offset=headOffset;
    }
  }
  status.textContent='Finalisation sécurisée de la vidéo…';
  const finalizeUrl=result.uploadUrl.replace(/\/$/,'')+'/'+encodeURIComponent(result.uploadToken)+'?filename='+encodeURIComponent(file.name);
  const finalized=await fetch(finalizeUrl,{method:'PUT'});
  if(!finalized.ok)throw uploadError(finalized,'Finalisation vidéo indisponible');
  const data=await finalized.json().catch(()=>({}));
  return fileIdFromReply(data);
}
async function uploadPrivateVideo(file){
  if(!file||!supportedVideo(file))throw Error('Choisissez une vidéo MP4, MOV ou WebM.');
  if(file.size===0)throw Error('La vidéo est vide.');
  if(file.size>MAX_PRIVATE_VIDEO_BYTES)throw Error('Vidéo trop volumineuse (maximum 500 Mo). Réduisez la résolution avant de la renvoyer.');
  const mime=file.type||({mov:'video/quicktime',m4v:'video/mp4',mp4:'video/mp4',webm:'video/webm'}[extension(file)]||'video/mp4');
  status.textContent='Préparation de la vidéo privée…';
  let fileId='';
  if(file.size>DIRECT_VIDEO_LIMIT){
    try { fileId=await resumablePrivateVideoUpload(file,mime); }
    catch(error){
      // Some Wix member identities cannot request the Media Manager's resumable scope.
      // Keep the Ricos private upload flow as a compatibility fallback.
      status.textContent='Mode de transfert compatible…';
      fileId=await directPrivateVideoUpload(file,mime);
    }
  }else fileId=await directPrivateVideoUpload(file,mime);
  if(!fileId)throw Error('Vidéo transférée, mais Wix n’a pas confirmé son identifiant privé. Réessayez.');
  status.textContent='Vidéo privée enregistrée ✓';
  return fileId;
}

f.onsubmit=async e=>{e.preventDefault();if(!f.reportValidity())return;const btn=f.querySelector('button[type=submit]'),err=f.querySelector('[data-error]');err.textContent='';btn.disabled=true;try{const fd=new FormData(f);const bool=n=>fd.get(n)==='yes',num=n=>Number(fd.get(n)||0);let videoFileId=existing?.videoFileId||'';const file=f.video.files[0];if(auth.demo){videoFileId='demo-private-video';localStorage.setItem('mihna-demo-candidate',JSON.stringify(Object.fromEntries(fd.entries())))}else if(file){if(fd.get('videoConsent')!=='on')throw Error('Autorisez explicitement l’utilisation de votre vidéo privée avant de l’envoyer.');videoFileId=await uploadPrivateVideo(file)}const privateData={firstName:fd.get('firstName'),lastName:fd.get('lastName'),age:num('age'),city:fd.get('city'),jobFamily:fd.get('jobFamily'),bio:fd.get('bio')||'',arabic:bool('arabic'),arabicLevel:num('arabicLevel'),french:bool('french'),frenchLevel:num('frenchLevel'),english:bool('english'),englishLevel:num('englishLevel'),otherLanguage:fd.get('otherLanguage')||'',otherLanguageLevel:num('otherLanguageLevel'),videoFileId,videoConsent:!!videoFileId && (fd.get('videoConsent')==='on'||!!existing?.videoConsent),preferredLanguage:currentLang(),profileComplete:true};if(!auth.demo){const centralSave=await hub('/api/profile/candidate',{method:'POST',body:{profile:privateData}});if(!centralSave.ok)throw Error('Le serveur n’a pas confirmé l’enregistrement du profil.');if(existing)await patchItemFields('CandidateProfiles',existing._id,privateData);else existing=await insertItem('CandidateProfiles',privateData);const l=[];if(privateData.arabic)l.push('AR '+privateData.arabicLevel+'/5');if(privateData.french)l.push('FR '+privateData.frenchLevel+'/5');if(privateData.english)l.push('EN '+privateData.englishLevel+'/5');if(privateData.otherLanguage)l.push(privateData.otherLanguage+' '+privateData.otherLanguageLevel+'/5');const publicItems=(await queryItems('CandidatePublicProfiles',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:1})).items;const showIdentity=fd.get('publicIdentityConsent')==='yes';
const displayName=showIdentity?String(privateData.firstName||'').trim()+' '+String(privateData.lastName||'').trim().slice(0,1).toUpperCase()+'.':'Profil confidentiel';
const publicBio=showIdentity?String(privateData.bio||'').trim().slice(0,450):'Professionnel disponible via HORENOVA. Identité et coordonnées confidentielles.';
const pub={displayName,city:privateData.city,jobFamily:privateData.jobFamily,bio:publicBio,languageSummary:l.join(' · ')};if(publicItems[0])await patchItemFields('CandidatePublicProfiles',publicItems[0]._id,pub);else await insertItem('CandidatePublicProfiles',{...pub,rating:0,reviewCount:0,sponsored:false})}const photoFile=f.elements.photo?.files?.[0];if(!photoFile&&!hasPortrait)throw Error('Ajoutez une photo professionnelle pour compléter votre inscription.');
if(photoFile){
  if(photoFile.size>8*1024*1024)throw new Error('Photo trop volumineuse : maximum 8 Mo.');
  status.textContent='Traitement de la photo privée…';
  let source=null,objectUrl='';
  try{if(typeof createImageBitmap==='function')source=await createImageBitmap(photoFile);}catch{}
  if(!source){objectUrl=URL.createObjectURL(photoFile);source=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Cette photo n’est pas lisible sur cet appareil. Essayez JPEG ou PNG.'));image.src=objectUrl;});}
  const size=500,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  canvas.width=size;canvas.height=size;
  const width=source.width||source.naturalWidth,height=source.height||source.naturalHeight;
  if(!width||!height)throw Error('La photo possède des dimensions invalides.');
  const side=Math.min(width,height),sx=(width-side)/2,sy=(height-side)/2;
  ctx.drawImage(source,sx,sy,side,side,0,0,size,size);
  source.close?.();if(objectUrl)URL.revokeObjectURL(objectUrl);
  const compressed=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.78));
  if(!compressed)throw new Error('Impossible de convertir la photo en JPEG.');
  if(compressed.size>450000)throw new Error('Photo trop volumineuse après compression.');
  await hubUploadPhoto(compressed);
  status.textContent='Photo privée enregistrée ✓';
}
const target=new URLSearchParams(location.search).get('returnTo')||'';
const safeTarget=target.startsWith('/')&&!target.startsWith('//')&&!target.includes('\\')?target:'';
location.assign(safeTarget||'/account.html')}catch(x){err.textContent=x.message||String(x)}finally{btn.disabled=false}};