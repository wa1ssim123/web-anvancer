'use strict';
// Approved central HORENOVA vacancies only; Telegram official Bot API.
// WhatsApp Channels cannot be posted via Meta's official Cloud API.
const {normalizeTelegramUrl}=require('./community.cjs');
const WEBSITE='https://horenova.com';
function clean(value,max=110){
 return String(value||'').replace(/<[^>]*>/g,' ')
   .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,'')
   .replace(/(?:\+?212|0)[\s./-]?[5-7](?:[\s./-]?\d){8}\b/g,'')
   .replace(/(?:https?:\/\/|www\.)[^\s]+/gi,'')
   .replace(/[<>]/g,'').replace(/[\u0000-\u001F\u007F]/g,' ')
   .replace(/\s+/g,' ').trim().slice(0,max);
}
function publicLink(id){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id||''))
  throw Error('Invalid public vacancy ID');
 return WEBSITE+'/job.html?id='+encodeURIComponent(id);
}
function composePublication(row){
 const title=clean(row.job_title,100)||'Opportunité en hôtellerie et restauration';
 const business=clean(row.business_name,80)||'Établissement HORENOVA';
 const city=clean(row.city,65)||'Maroc';
 return [
  '🇲🇦 HORENOVA · NOUVELLE OFFRE VALIDÉE',
  '📣 '+(row.kind==='shift'?'SHIFT / EXTRA':'EMPLOI'),
  '💼 '+title,
  '🏢 '+business,
  '📍 '+city,
  '',
  '✅ Offre vérifiée par HORENOVA',
  '🔗 Détails et candidature : '+publicLink(row.id),
  '',
  '#HORENOVA #EmploiMaroc'
 ].join('\n');
}
function tokenIsValid(token){return typeof token==='string'&&/^[0-9]{5,15}:[A-Za-z0-9_-]{25,}$/.test(token)}
function createSocialPublisher({pool,token=process.env.TELEGRAM_BOT_TOKEN,fetchImpl=globalThis.fetch,log=console}){
 let busy=false,timer=null;
 const configured=()=>tokenIsValid(token);
 async function status(){
  const q=await pool.query(
   'SELECT p.request_id,p.channel,p.status,p.attempts,p.last_error,p.sent_at,p.telegram_message_id,'+
   'r.job_title,r.business_name,r.city,r.kind,r.status AS job_status,r.removed_at '+
   'FROM hr_social_publications p JOIN hr_recruiter_requests r ON r.id=p.request_id '+
   'ORDER BY p.created_at DESC LIMIT 120');
  const channels=await pool.query("SELECT channel_type,url FROM hr_social_channels WHERE channel_type IN ('whatsapp','telegram')");
  const links=Object.fromEntries(channels.rows.map(x=>[x.channel_type,x.url]));
  return {configured:configured(),telegramChannel:links.telegram||null,whatsappChannel:links.whatsapp||null,
   rows:q.rows.map(row=>({
    requestId:row.request_id,channel:row.channel,status:row.status,
    title:clean(row.job_title),city:clean(row.city),kind:row.kind,
    jobStatus:row.job_status,removed:!!row.removed_at,attempts:row.attempts,
    sentAt:row.sent_at,messageId:row.telegram_message_id||null,lastError:row.last_error||null,
    publicUrl:publicLink(row.request_id),
    message:composePublication({...row,id:row.request_id})
   }))
  };
 }
 async function claim(){
  const q=await pool.query(
   "WITH claimed AS (SELECT p.request_id FROM hr_social_publications p "+
   "JOIN hr_recruiter_requests r ON r.id=p.request_id "+
   "JOIN hr_social_channels sc ON sc.channel_type='telegram' "+
   "WHERE p.channel='telegram' AND p.status='pending' AND r.status='VALIDEE' AND r.removed_at IS NULL "+
   "ORDER BY p.created_at FOR UPDATE OF p SKIP LOCKED LIMIT 1), "+
   "updated AS (UPDATE hr_social_publications p SET status='sending',attempts=attempts+1,updated_at=now(),last_error=NULL "+
   "FROM claimed WHERE p.request_id=claimed.request_id AND p.channel='telegram' RETURNING p.request_id) "+
   "SELECT r.id,r.job_title,r.business_name,r.city,r.kind,sc.url "+
   "FROM updated u JOIN hr_recruiter_requests r ON r.id=u.request_id "+
   "JOIN hr_social_channels sc ON sc.channel_type='telegram'");
  return q.rows[0]||null;
 }
 async function deliver(item){
  const channel=normalizeTelegramUrl(item.url);
  if(!channel)throw Error('Lien Telegram invalide.');
  const response=await fetchImpl('https://api.telegram.org/bot'+token+'/sendMessage',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({chat_id:'@'+channel.slice('https://t.me/'.length),
    text:composePublication(item),disable_web_page_preview:true}),
   signal:AbortSignal.timeout(14000)
  });
  const r=await response.json();
  if(!response.ok||r.ok!==true||!Number.isSafeInteger(r.result?.message_id))
   throw Error('Telegram refuse la publication (code '+(r.error_code||response.status)+'). Vérifiez le bot et ses droits.');
  return r.result.message_id;
 }
 async function run(){
  if(!configured()||busy)return;
  busy=true;
  try{
   for(let i=0;i<4;i++){
    const item=await claim();if(!item)break;
    try{
     const live=await pool.query(
      "SELECT 1 FROM hr_recruiter_requests WHERE id=$1 AND status='VALIDEE' AND removed_at IS NULL",[item.id]);
     if(!live.rows[0]){
      await pool.query("UPDATE hr_social_publications SET status='cancelled',updated_at=now() WHERE request_id=$1 AND channel='telegram' AND status='sending'",[item.id]);
      continue;
     }
     const messageId=await deliver(item);
     await pool.query(
      "UPDATE hr_social_publications SET status='published',telegram_message_id=$2,sent_at=now(),updated_at=now(),last_error=NULL WHERE request_id=$1 AND channel='telegram' AND status='sending'",
      [item.id,messageId]);
    }catch(e){
     // A timeout can occur after Telegram accepted the post: do not blind-retry.
     await pool.query(
      "UPDATE hr_social_publications SET status='needs_review',updated_at=now(),last_error=$2 WHERE request_id=$1 AND channel='telegram' AND status='sending'",
      [item.id,clean(e.message,240)]);
     log.warn('HORENOVA Telegram delivery needs admin review',e.code||e.name||'error');
    }
   }
  }catch(e){log.warn('HORENOVA social publication queue unavailable',e.code||e.name||'error')}
  finally{busy=false}
 }
 function kick(){void run()}
 async function start(){
  await pool.query(
   "UPDATE hr_social_publications SET status='needs_review',last_error='Envoi précédent interrompu. Vérifier Telegram avant toute reprise.',updated_at=now() WHERE channel='telegram' AND status='sending' AND updated_at<now()-interval '3 minutes'");
  timer=setInterval(kick,30000);timer.unref?.();kick();
 }
 async function retry(id){
  const q=await pool.query(
   "UPDATE hr_social_publications p SET status='pending',updated_at=now(),last_error=NULL FROM hr_recruiter_requests r WHERE p.request_id=$1 AND p.channel='telegram' AND p.status='needs_review' AND r.id=p.request_id AND r.status='VALIDEE' AND r.removed_at IS NULL RETURNING p.request_id",
   [id]);
  if(q.rows[0])kick();
  return !!q.rows[0];
 }
 return{configured,status,kick,start,run,retry,stop:()=>timer&&clearInterval(timer)};
}
module.exports={createSocialPublisher,clean,publicLink,composePublication,tokenIsValid};
