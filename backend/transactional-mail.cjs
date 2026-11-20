'use strict';
/* Reliable transactional email queue for HORENOVA.
 * The database records the business event first. Email is queued separately
 * and retried server-side; failed/duplicate API requests never trigger mail.
 * Requires RESEND_API_KEY and a verified MAIL_FROM sender on Render.
 */
const {renderMail,localeOf}=require('./mail-templates.cjs');
const EVENT_TYPES=new Set(['candidate','job','shift']);
const schema=`CREATE TABLE IF NOT EXISTS hr_email_outbox (
 event_key TEXT PRIMARY KEY,
 event_kind TEXT NOT NULL CHECK (event_kind IN ('candidate','job','shift')),
 recipient_email TEXT NOT NULL,
 locale TEXT NOT NULL DEFAULT 'fr',
 payload JSONB NOT NULL,
 state TEXT NOT NULL DEFAULT 'queued' CHECK (state IN ('queued','sending','sent','failed')),
 attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 lease_until TIMESTAMPTZ,
 sent_at TIMESTAMPTZ,
 provider_id TEXT,
 last_error TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;
const index=`CREATE INDEX IF NOT EXISTS hr_email_outbox_pending_idx
 ON hr_email_outbox (next_attempt_at,created_at)
 WHERE state IN ('queued','sending')`;
const emailOk = email => typeof email==='string' && email.length<=220 &&
 /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email);
const safeKey=key=>typeof key==='string'&&/^(candidate|job|shift):[0-9a-f-]{36}$/.test(key);
function createTransactionalMailer({pool,env=process.env,fetcher=globalThis.fetch,log=console}){
 let initialized=null, draining=false, timer=null;
 const configured=()=>Boolean(env.RESEND_API_KEY&&env.MAIL_FROM&&
    /<[^<>\s]+@[^<>\s]+\.[^<>\s]+>/.test(env.MAIL_FROM));
 async function init(){
   if(!initialized){
     initialized=(async()=>{await pool.query(schema);await pool.query(index);return true;})()
       .catch(err=>{initialized=null;throw err});
   }
   return initialized;
 }
 async function enqueue({key,kind,to,locale='fr',payload={}}){
   if(!safeKey(key)||!EVENT_TYPES.has(kind)||!emailOk(to))return {queued:false,reason:'invalid_recipient_or_event'};
   await init();
   const data={jobTitle:String(payload.jobTitle||'').slice(0,140),
     firstName:String(payload.firstName||'').slice(0,75),
     contactName:String(payload.contactName||'').slice(0,75),
     businessName:String(payload.businessName||'').slice(0,130),
     city:String(payload.city||'').slice(0,85),
     scheduleText:String(payload.scheduleText||'').slice(0,140)};
   const result=await pool.query(`INSERT INTO hr_email_outbox
     (event_key,event_kind,recipient_email,locale,payload)
     VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT(event_key) DO NOTHING
     RETURNING event_key`,[key,kind,to,localeOf(locale),JSON.stringify(data)]);
   if(result.rows?.length){
     // Attempt delivery soon, never rely on the browser remaining open.
     setImmediate(()=>drain().catch(e=>log.warn('HORENOVA notification drain unavailable',e.code||e.name||'error')));
   }
   return {queued:true,alreadyQueued:!result.rows?.length};
 }
 async function send(row){
   const mail=renderMail(row.event_kind,row.payload,row.locale);
   const response=await fetcher('https://api.resend.com/emails',{
     method:'POST',
     headers:{
       Authorization:'Bearer '+env.RESEND_API_KEY,
       'Content-Type':'application/json',
       'Idempotency-Key':'horenova/'+row.event_key
     },
     body:JSON.stringify({
       from:env.MAIL_FROM,
       to:[row.recipient_email],
       subject:mail.subject,
       html:mail.html,
       text:mail.text,
       ...(env.MAIL_REPLY_TO?{reply_to:env.MAIL_REPLY_TO}:{})
     }),
     signal:AbortSignal.timeout(12000)
   });
   if(!response.ok){
     const ex=new Error('Provider HTTP '+response.status);
     ex.permanent=response.status>=400&&!([408,409,425,429].includes(response.status))&&response.status<500;
     throw ex;
   }
   const data=await response.json().catch(()=>({}));
   if(typeof data.id!=='string'||!data.id)throw new Error('Provider did not confirm message ID');
   return data.id;
 }
 async function drain(){
   if(draining||!configured())return {processed:0,enabled:configured()};
   draining=true;
   let processed=0;
   try{
     await init();
     const claimed=await pool.query(`WITH selected AS(
       SELECT event_key FROM hr_email_outbox
       WHERE (state='queued' AND next_attempt_at<=NOW())
          OR (state='sending' AND lease_until<NOW() AND next_attempt_at<=NOW())
       ORDER BY created_at ASC LIMIT 8 FOR UPDATE SKIP LOCKED)
       UPDATE hr_email_outbox o
       SET state='sending', attempts=o.attempts+1,lease_until=NOW()+INTERVAL '90 seconds'
       FROM selected s WHERE o.event_key=s.event_key
       RETURNING o.*`);
     for(const item of claimed.rows||[]){
       try{
         const providerId=await send(item);
         await pool.query(`UPDATE hr_email_outbox SET state='sent',sent_at=NOW(),provider_id=$2,
           lease_until=NULL,last_error=NULL WHERE event_key=$1 AND state='sending'`,[item.event_key,providerId]);
         processed++;
       }catch(e){
         const terminal=Boolean(e.permanent)||item.attempts>=8;
         const waitSeconds=Math.min(21600,30*2**Math.min(item.attempts,9));
         await pool.query(`UPDATE hr_email_outbox
           SET state=$2,lease_until=NULL,last_error=$3,
               next_attempt_at=NOW()+($4::integer*INTERVAL '1 second')
           WHERE event_key=$1 AND state='sending'`,[item.event_key,terminal?'failed':'queued',
             String(e.message||e.name||'Error').slice(0,120),waitSeconds]);
         log.warn('HORENOVA notification attempt failed',item.event_kind,terminal?'permanent':'retry',e.name||'error');
       }
     }
     return {processed,enabled:true};
   } finally{draining=false;}
 }
 async function start(){
   await init();
   if(!timer){
     timer=setInterval(()=>drain().catch(e=>log.warn('HORENOVA notification worker unavailable',e.code||e.name||'error')),30000);
     timer.unref?.();
   }
   if(!configured())log.warn('HORENOVA transactional email waiting for RESEND_API_KEY and MAIL_FROM');
   else await drain();
 }
 async function stats(){
   await init();
   const q=await pool.query('SELECT state,COUNT(*)::integer AS total FROM hr_email_outbox GROUP BY state ORDER BY state');
   return {enabled:configured(),states:q.rows};
 }
 return {init,enqueue,drain,start,stats,configured};
}
module.exports={createTransactionalMailer,emailOk,safeKey};
