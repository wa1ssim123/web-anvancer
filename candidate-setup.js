import { requireRole, getDemoSession, currentLang } from "/mihna-global.js";
import { queryItems, insertItem, patchItemFields } from "/js/wix/items.js";
import { wixRequest } from "/js/wix/client.js";
import { hubUploadPhoto } from "/hn-api.js";
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
f.video.onchange=()=>{const file=f.video.files[0];if(!file)return;preview.src=URL.createObjectURL(file);preview.hidden=false;status.textContent=`${file.name} · ${(file.size/1024/1024).toFixed(1)} MB`};
let existing=null; if(!auth.demo){try{existing=(await queryItems('CandidateProfiles',{limit:1})).items[0]||null;if(existing){for(const k of ['firstName','lastName','age','city','jobFamily','bio','otherLanguage','otherLanguageLevel'])if(f.elements[k]&&existing[k]!=null)f.elements[k].value=existing[k];f.video.required=!existing.videoFileId}}catch{}}
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

f.onsubmit=async e=>{e.preventDefault();if(!f.reportValidity())return;const btn=f.querySelector('button[type=submit]'),err=f.querySelector('[data-error]');err.textContent='';btn.disabled=true;try{const fd=new FormData(f);const bool=n=>fd.get(n)==='yes',num=n=>Number(fd.get(n)||0);let videoFileId=existing?.videoFileId||'';const file=f.video.files[0];if(auth.demo){videoFileId='demo-private-video';localStorage.setItem('mihna-demo-candidate',JSON.stringify(Object.fromEntries(fd.entries())))}else if(file){videoFileId=await uploadPrivateVideo(file)}if(!videoFileId)throw new Error('La vidéo de présentation est obligatoire.');const privateData={firstName:fd.get('firstName'),lastName:fd.get('lastName'),age:num('age'),city:fd.get('city'),jobFamily:fd.get('jobFamily'),bio:fd.get('bio')||'',arabic:bool('arabic'),arabicLevel:num('arabicLevel'),french:bool('french'),frenchLevel:num('frenchLevel'),english:bool('english'),englishLevel:num('englishLevel'),otherLanguage:fd.get('otherLanguage')||'',otherLanguageLevel:num('otherLanguageLevel'),videoFileId,videoConsent:true,preferredLanguage:currentLang(),profileComplete:true};if(!auth.demo){if(existing)await patchItemFields('CandidateProfiles',existing._id,privateData);else existing=await insertItem('CandidateProfiles',privateData);const l=[];if(privateData.arabic)l.push('AR '+privateData.arabicLevel+'/5');if(privateData.french)l.push('FR '+privateData.frenchLevel+'/5');if(privateData.english)l.push('EN '+privateData.englishLevel+'/5');if(privateData.otherLanguage)l.push(privateData.otherLanguage+' '+privateData.otherLanguageLevel+'/5');const publicItems=(await queryItems('CandidatePublicProfiles',{limit:1})).items;const pub={displayName:'Talent Horenova',city:privateData.city,jobFamily:privateData.jobFamily,bio:'Profil anonymisé. Contact uniquement par Horenova.',languageSummary:l.join(' · '),rating:0,reviewCount:0,sponsored:false};if(publicItems[0])await patchItemFields('CandidatePublicProfiles',publicItems[0]._id,pub);else await insertItem('CandidatePublicProfiles',pub)}const photoFile=f.elements.photo?.files?.[0];
if(photoFile){
  if(photoFile.size>8*1024*1024)throw new Error('Photo trop volumineuse : maximum 8 Mo.');
  status.textContent='Traitement de la photo privée…';
  const bitmap=await createImageBitmap(photoFile);
  const size=500,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  canvas.width=size;canvas.height=size;
  const side=Math.min(bitmap.width,bitmap.height),sx=(bitmap.width-side)/2,sy=(bitmap.height-side)/2;
  ctx.drawImage(bitmap,sx,sy,side,side,0,0,size,size);
  bitmap.close?.();
  const compressed=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.78));
  if(!compressed)throw new Error('Impossible de convertir la photo en JPEG.');
  if(compressed.size>450000)throw new Error('Photo trop volumineuse après compression.');
  await hubUploadPhoto(compressed);
  status.textContent='Photo privée enregistrée ✓';
}
location.assign('/quiz.html?role='+encodeURIComponent(privateData.jobFamily)+'&setup=1')}catch(x){err.textContent=x.message||String(x)}finally{btn.disabled=false}};