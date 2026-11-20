/* HORENOVA · Admin-only, print-ready case dossiers.
   Auth and access to candidate portraits/threads are checked by protected API
   endpoints before this module is called from the verified admin console.
   No remote resources, tracking, credentials or script in the printed copy. */
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const safeValue=value=>{
 if(value===undefined||value===null||value==='')return 'Non renseigné';
 if(Array.isArray(value))return value.length?value.map(safeValue).join(' · '):'Non renseigné';
 if(typeof value==='boolean')return value?'Oui':'Non';
 if(typeof value==='object')return JSON.stringify(value);
 return String(value);
};
const date=value=>{
 if(!value)return 'Non renseigné';
 const d=new Date(value);
 return Number.isNaN(d.getTime())?safeValue(value):d.toLocaleString('fr-MA',{dateStyle:'long',timeStyle:'short'});
};
const field=(label,value)=>'<div class="field"><small>'+escapeHtml(label)+'</small><strong>'+escapeHtml(safeValue(value))+'</strong></div>';
const section=(number,title,fields)=>'<section class="section"><div class="section-title"><span>'+number+'</span><h2>'+escapeHtml(title)+'</h2></div><div class="fields">'+fields.map(([name,value])=>field(name,value)).join('')+'</div></section>';
const imageSlot=(data,description)=>{
 const valid=typeof data==='string'&&/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data);
 return valid?'<img src="'+data+'" alt="'+escapeHtml(description)+'" class="portrait">':
 '<div class="portrait placeholder">PHOTO NON DISPONIBLE</div>';
};
const htmlDoc=(body,title)=>{
 const name=escapeHtml(title);
 return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+name+'</title><style>'+
 ':root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#e8ede8;color:#173e33;font:13px/1.55 Arial,Helvetica,sans-serif}'+
 '.toolbar{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;gap:14px;background:#132d2b;color:#fff;padding:16px max(20px,calc((100% - 900px)/2));z-index:2}.toolbar button{border:0;background:#ffd3aa;color:#123328;padding:11px 20px;border-radius:8px;cursor:pointer;font-weight:800}.toolbar span{font-size:12px}'+
 '.sheet{width:min(900px,calc(100% - 30px));margin:30px auto;background:#fff;box-shadow:0 14px 70px #07271e26;padding:38px 43px 48px}'+
 '.top{border-bottom:3px solid #174d3c;padding-bottom:21px;display:flex;justify-content:space-between;gap:20px}.brand{font:bold 26px Georgia,serif;letter-spacing:-.06em;color:#123b32}.brand i{font-style:normal;color:#d77846}.subbrand{font-size:10px;font-weight:800;letter-spacing:.15em;color:#b46e44;margin-top:6px}.confidential{font-size:9px;font-weight:900;color:#9d542d;letter-spacing:.12em;text-align:right}'+
 '.summary{display:flex;align-items:center;justify-content:space-between;gap:28px;background:#eaf1ea;border:1px solid #d4e4d9;border-radius:14px;padding:22px;margin:25px 0}.summary h1{font:500 28px/1.18 Georgia,serif;letter-spacing:-.025em;margin:7px 0 11px;color:#163f34}.kicker{font-weight:900;font-size:10px;letter-spacing:.15em;color:#aa6d44}.summary p{margin:4px 0;color:#38574a}.portrait{height:130px;width:118px;object-fit:cover;border-radius:11px;border:1px solid #b6cec2;flex-shrink:0;background:#e3ebe5}.placeholder{display:flex;align-items:center;justify-content:center;text-align:center;padding:8px;font:800 10px Arial;color:#718c7e}'+
 '.section{margin:26px 0;break-inside:avoid-page}.section-title{display:flex;gap:12px;align-items:center;border-bottom:1px solid #dce9dd;margin-bottom:14px;padding-bottom:11px}.section-title span{width:32px;height:32px;display:grid;place-items:center;background:#154a3a;color:#f8d0a9;border-radius:7px;font-size:12px;font-weight:900}.section-title h2{font:500 19px Georgia,serif;margin:0}.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.field{background:#f6f8f4;border:1px solid #edf0e9;border-radius:8px;padding:12px;min-width:0;break-inside:avoid-page}.field small{display:block;font:800 10px/1.3 Arial;color:#7c927f;letter-spacing:.04em;margin-bottom:6px}.field strong{display:block;font:600 12px/1.6 Arial;color:#1b3e33;white-space:pre-wrap;overflow-wrap:anywhere}.foot{display:flex;justify-content:space-between;gap:20px;margin-top:34px;padding-top:15px;border-top:1px solid #cddfd2;font-size:10px;color:#70877a}'+
 '@media(max-width:630px){.sheet{padding:24px 18px}.fields{grid-template-columns:1fr}.summary{align-items:flex-start;gap:15px}.portrait{width:85px;height:95px}.toolbar span{max-width:170px}}'+
 '@page{size:A4;margin:14mm}@media print{body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.toolbar{display:none}.sheet{width:100%;margin:0;padding:0;box-shadow:none}.top{padding-top:0}.section{break-inside:auto}.section-title{break-after:avoid}.summary{break-inside:avoid}.foot{break-inside:avoid}}'+
 '</style></head><body><div class="toolbar"><span>HORENOVA · Prévisualisation confidentielle</span><button type="button" onclick="window.print()">Imprimer / Enregistrer en PDF</button></div><main class="sheet">'+body+'</main></body></html>';
};
const header=(kicker,name,subtitle,photo,photoLabel,reference)=>
 '<header class="top"><div><div class="brand">HORENOVA<i>.</i></div><div class="subbrand">LE TALENT MÉRITE LA BONNE RENCONTRE</div></div><div class="confidential">DOCUMENT CONFIDENTIEL<br>ADMINISTRATION UNIQUEMENT</div></header>'+
 '<div class="summary"><div><div class="kicker">'+escapeHtml(kicker)+'</div><h1>'+escapeHtml(name)+'</h1><p>'+escapeHtml(subtitle)+'</p><p>Référence : '+escapeHtml(reference||'Non renseignée')+'</p></div>'+
 (photoLabel?imageSlot(photo,photoLabel):'')+'</div>';
const footer=()=>'<footer class="foot"><span>HORENOVA · Document privé à ne pas diffuser sans autorisation</span><span>Édité le '+escapeHtml(date(new Date()))+'</span></footer>';
const languages=p=>[['Arabe',p.arabic,p.arabicLevel],['Français',p.french,p.frenchLevel],['Anglais',p.english,p.englishLevel],['Autre',p.otherLanguage,p.otherLanguageLevel]]
 .filter(([name,present])=>present).map(([name,present,level])=>name+(level?' · '+level+'/5':'')).join(' · ')||'Non renseignées';
const candidateDoc=(record,photo)=>{
 const p=record?.profile||{},d=p.application||{},full=[p.firstName,p.lastName].filter(Boolean).join(' ').trim()||'Candidat HORENOVA';
 const details=header('DOSSIER DE CANDIDATURE',full,record?.jobTitle||'Offre HORENOVA',photo,'Photo privée du candidat',record?.id)+
 section('01','Identité et coordonnées',[
  ['Nom',p.lastName],['Prénom',p.firstName],['E-mail',record.candidateEmail],['Téléphone privé',d.phone],
  ['Âge',p.age],['Ville',p.city],['Métier',p.jobFamily],['Langues',languages(p)]
 ])+
 section('02','Expérience et projet professionnel',[
  ['Offre',record.jobTitle],['Fonction recherchée',record.jobRole],['Expérience (années)',d.experienceYears],
  ['Dernier poste',d.lastPosition],['Compétences',d.skills],['Disponibilité',d.availability],
  ['Date de début envisagée',d.earliestStart],['Ville souhaitée',d.desiredCity],['Type de contrat',d.contractPreference]
 ])+
 section('03','Présentation et motivation',[
  ['Présentation du candidat',p.bio],['Motivation',d.motivation],
  ['Quiz métier (facultatif)',p.quizPassed?String(p.quizScore)+' %':'Non fourni'],
  ['Vidéo de présentation (facultative)',p.videoFileId?'Déposée':'Non fournie'],
  ['Consentement à la mise en relation',record.consentToIntro?'Oui':'Non']
 ])+
 section('04','Suivi du dossier',[
  ['Date de dépôt',date(record.createdAt)],['État de la candidature',record.status],
  ['Référence du dossier',record.id],['Référence de l’offre',record.jobId],
  ['Recruteur associé',record.recruiterWixId?'Association enregistrée':'Non associé']
 ])+footer();
 return htmlDoc(details,'Candidature · '+full+' · HORENOVA');
};
const requestDoc=(record,photo)=>{
 const r=record||{};
 const details=header(r.kind==='shift'?'DEMANDE DE SHIFT':'DEMANDE DE RECRUTEMENT',r.job_title||'Demande HORENOVA',r.business_name||'Établissement',photo,'Photo du lieu de travail',r.id)+
 section('01','Établissement et contact',[
  ['Établissement',r.business_name],['Type d’établissement',r.business_type],['Adresse',r.workplace_address],
  ['Ville',r.city],['Responsable',r.contact_name],['Téléphone privé',r.contact_phone??r.phone]
 ])+
 section('02','Informations sur le poste / la mission',[
  ['Type de demande',r.kind==='shift'?'Shift':'Emploi'],['Intitulé',r.job_title],
  ['Métier',r.job_role],['Description',r.description],['Conditions requises',r.requirements],
  ['Rémunération',r.salary_text],['Horaires',r.schedule_text],
  ['Contrat',r.contract_type],['Postes disponibles',r.openings],['Date de début',r.start_date]
 ])+
 section('03','Suivi et décision',[
  ['Statut',r.status],['Date de soumission',date(r.created_at)],['Dernière mise à jour',date(r.updated_at)],
  ['Référence de demande',r.id],['Photo du lieu enregistrée',r.has_workplace_photo?'Oui':'Non']
 ])+footer();
 return htmlDoc(details,'Demande · '+String(r.job_title||'HORENOVA'));
};
const supportDoc=(thread,messages)=>{
 const t=thread||{};
 const items=(Array.isArray(messages)?messages:[]).map((m,i)=>[
  'Message '+String(i+1).padStart(2,'0')+' · '+(m.senderRole==='admin'?'Équipe HORENOVA':'Membre'),
  date(m.createdAt)+'\n'+safeValue(m.body)
 ]);
 const details=header('DEMANDE DE SUPPORT',t.subject||'Assistance HORENOVA',t.category||'Assistance',null,null,t.id)+
 section('01','Membre et demande',[
  ['E-mail du membre',t.memberEmail],['Type de compte',t.memberRole],['Catégorie',t.category],
  ['Objet',t.subject],['Statut',t.status],['Créée le',date(t.createdAt)],['Dernière mise à jour',date(t.updatedAt)]
 ])+
 section('02','Historique de la conversation',items.length?items:[['Messages','Aucun message enregistré']])+footer();
 return htmlDoc(details,'Support · '+String(t.subject||'HORENOVA'));
};
function openSheet(){
 const target=window.open('','_blank');
 if(!target)throw new Error('Autorisez les fenêtres de prévisualisation pour imprimer ce dossier.');
 target.document.open();
 target.document.write('<!doctype html><html lang="fr"><meta charset="utf-8"><title>HORENOVA — Préparation</title><body style="font:16px system-ui;padding:40px;color:#17483a">Préparation de votre fiche privée HORENOVA…</body></html>');
 target.document.close();return target;
}
async function blobToDataUrl(url){
 const response=await fetch(url);
 if(!response.ok)throw new Error('Photo non disponible');
 const blob=await response.blob();
 if(!['image/jpeg','image/png','image/webp'].includes(blob.type)||blob.size>5_000_000)throw new Error('Photo au format non accepté');
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();reader.onerror=()=>reject(new Error('Photo non lisible'));reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob);
 });
}
function replaceSheet(target,html){
 if(target.closed)return;
 target.document.open();target.document.write(html);target.document.close();
}
export async function printCandidate(record,loadPhoto){
 const target=openSheet();let image=null;
 try{
  if(loadPhoto){let objectUrl=null;try{objectUrl=await loadPhoto();if(objectUrl)image=await blobToDataUrl(objectUrl);}catch(error){console.warn('HORENOVA print: portrait not available',error?.name||'error');}finally{if(objectUrl)URL.revokeObjectURL(objectUrl);}}
  replaceSheet(target,candidateDoc(record,image));target.focus();
 }catch(error){replaceSheet(target,htmlDoc('<h1>Impossible de préparer ce document</h1><p>'+escapeHtml(error?.message)+'</p>','Erreur HORENOVA'));}
}
export async function printRecruiter(record,loadPhoto){
 const target=openSheet();let image=null;
 try{
  if(loadPhoto){let objectUrl=null;try{objectUrl=await loadPhoto();if(objectUrl)image=await blobToDataUrl(objectUrl);}catch(error){console.warn('HORENOVA print: workplace image not available',error?.name||'error');}finally{if(objectUrl)URL.revokeObjectURL(objectUrl);}}
  replaceSheet(target,requestDoc(record,image));target.focus();
 }catch(error){replaceSheet(target,htmlDoc('<h1>Impossible de préparer ce document</h1><p>'+escapeHtml(error?.message)+'</p>','Erreur HORENOVA'));}
}
export async function printSupportThread(thread,loadMessages){
 const target=openSheet();
 try{
  const records=await loadMessages();
  replaceSheet(target,supportDoc(thread,records?.items||[]));target.focus();
 }catch(error){
  replaceSheet(target,htmlDoc('<h1>Impossible de charger la conversation privée</h1><p>'+escapeHtml(error?.message||'Erreur de chargement')+'</p>','Erreur HORENOVA'));
 }
}
