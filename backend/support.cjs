'use strict';
// HORENOVA support : authenticated member <-> national administration.
// SQL is parameterised, authorization checked on every conversation.
const crypto=require('node:crypto');
function createSupportHandler({pool,json,read,rate,auth,error,limit,uuid}) {
 // Support schema is provisioned by the database owner. The Render API
 // role deliberately has no CREATE permission; avoid breaking live support.
 let schemaPromise=null;
 async function ensureSchema(){
  if(!schemaPromise){
   schemaPromise=Promise.all([
    pool.query('SELECT 1 FROM hr_support_threads LIMIT 0'),
    pool.query('SELECT 1 FROM hr_support_messages LIMIT 0'),
    pool.query('SELECT 1 FROM hr_support_presence LIMIT 0')
   ]).then(()=>true).catch(e=>{
    schemaPromise=null;
    console.warn('HORENOVA support database check failed',e.code||e.name||'error');
    throw error(503,'Impossible de charger vos conversations pour le moment. Réessayez ou appelez le 0648377009.');
   });
  }
  return schemaPromise;
 }
 const publicThread=row=>({
  id:row.id,subject:row.subject,category:row.category,status:row.status,
  createdAt:row.created_at,updatedAt:row.updated_at,lastMessageAt:row.last_message_at,
  memberEmail:row.member_email,memberRole:row.member_role,
  unread:Number(row.unread_count||0)
 });
 async function getThread(id,user) {
  if(!uuid(id))throw error(400,'Conversation de support invalide.');
  const r=await pool.query('SELECT * FROM hr_support_threads WHERE id=$1',[id]);
  const thread=r.rows[0];
  if(!thread)throw error(404,'Conversation introuvable.');
  if(user.role!=='admin'&&thread.member_wix_id!==user.id)throw error(403,'Accès non autorisé à cette conversation.');
  return thread;
 }
 async function handler(req,res,path,method){
  const user=await auth(req);
  await ensureSchema();
  if(!['candidate','recruiter','admin'].includes(user.role))throw error(403,'Connectez un compte candidat ou recruteur pour contacter HORENOVA.');
  if(path==='/api/support/presence'&&method==='GET'){
   const r=await pool.query("SELECT COUNT(*)::integer AS count FROM hr_support_presence WHERE last_seen_at > NOW()-INTERVAL '80 seconds'");
   return json(res,200,{online:r.rows[0].count>0,operatorCount:r.rows[0].count});
  }
  if(path==='/api/support/presence'&&method==='POST'){
   if(user.role!=='admin')throw error(403,'Réservé aux superviseurs.');
   rate(user.id+':support-heartbeat',30,60);
   await pool.query('INSERT INTO hr_support_presence(admin_wix_id,last_seen_at) VALUES($1,NOW()) ON CONFLICT(admin_wix_id) DO UPDATE SET last_seen_at=NOW()',[user.id]);
   return json(res,200,{ok:true});
  }
  if(path==='/api/support/threads'&&method==='GET'){
   const query=user.role==='admin'?
    `SELECT t.*, (SELECT COUNT(*) FROM hr_support_messages m
      WHERE m.thread_id=t.id AND m.sender_role<>'admin'
      AND m.created_at>COALESCE(t.admin_last_read_at,TO_TIMESTAMP(0)))::integer AS unread_count
      FROM hr_support_threads t ORDER BY
      CASE t.status WHEN 'OPEN' THEN 0 WHEN 'IN_PROGRESS' THEN 1 WHEN 'RESOLVED' THEN 2 ELSE 3 END,
      t.last_message_at DESC LIMIT 200`:
    `SELECT t.*, (SELECT COUNT(*) FROM hr_support_messages m
      WHERE m.thread_id=t.id AND m.sender_role='admin'
      AND m.created_at>COALESCE(t.member_last_read_at,TO_TIMESTAMP(0)))::integer AS unread_count
      FROM hr_support_threads t WHERE t.member_wix_id=$1
      ORDER BY t.last_message_at DESC LIMIT 60`;
   const rows=await pool.query(query,user.role==='admin'?[]:[user.id]);
   return json(res,200,{items:rows.rows.map(publicThread)});
  }
  if(path==='/api/support/threads'&&method==='POST'){
   if(user.role==='admin')throw error(403,'Les superviseurs doivent répondre dans une conversation existante.');
   rate(user.id+':support-create',6,3600);
   const d=await read(req,7000);
   const subject=limit(d.subject,110),category=limit(d.category,50);
   const message=limit(d.message,2000);
   const categories=['Compte & accès','Candidature & quiz','Offres & recrutement','Paiement & Academy','Application & bug','Autre'];
   if(subject.length<5||message.length<10||!categories.includes(category))
     throw error(422,'Indiquez un sujet (5 caractères minimum), une catégorie et un message (10 caractères minimum).');
   const id=crypto.randomUUID(),messageId=crypto.randomUUID();
   const client=await pool.connect();
   try{
    await client.query('BEGIN');
    await client.query('INSERT INTO hr_support_threads(id,member_wix_id,member_email,member_role,subject,category,status,member_last_read_at) VALUES($1,$2,$3,$4,$5,$6,\'OPEN\',NOW())',[id,user.id,limit(user.email,200),user.role,subject,category]);
    await client.query('INSERT INTO hr_support_messages(id,thread_id,sender_wix_id,sender_role,body) VALUES($1,$2,$3,$4,$5)',[messageId,id,user.id,user.role,message]);
    await client.query('COMMIT');
   }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
   return json(res,201,{ok:true,id});
  }
  const match=path.match(/^\/api\/support\/threads\/([0-9a-f-]+)(?:\/(messages|status))?$/i);
  if(match){
   const id=match[1],action=match[2]||'';
   const thread=await getThread(id,user);
   if(!action&&method==='GET')return json(res,200,{item:publicThread(thread)});
   if(action==='messages'&&method==='GET'){
    const data=await pool.query('SELECT id,sender_role,body,created_at FROM hr_support_messages WHERE thread_id=$1 ORDER BY created_at DESC,id DESC LIMIT 500',[id]);
    const column=user.role==='admin'?'admin_last_read_at':'member_last_read_at';
    await pool.query('UPDATE hr_support_threads SET '+column+'=NOW() WHERE id=$1',[id]);
    return json(res,200,{items:data.rows.reverse().map(m=>({id:m.id,senderRole:m.sender_role,body:m.body,createdAt:m.created_at}))});
   }
   if(action==='messages'&&method==='POST'){
    rate(user.id+':support-message',30,60);
    const d=await read(req,5000),body=limit(d.message,2000);
    if(body.length<1)throw error(422,'Écrivez un message.');
    if(thread.status==='CLOSED'&&user.role!=='admin')throw error(409,'Cette conversation est clôturée. Ouvrez une nouvelle demande.');
    const messageId=crypto.randomUUID();
    const client=await pool.connect();
    try{
     await client.query('BEGIN');
     await client.query('INSERT INTO hr_support_messages(id,thread_id,sender_wix_id,sender_role,body) VALUES($1,$2,$3,$4,$5)',[messageId,id,user.id,user.role,body]);
     await client.query('UPDATE hr_support_threads SET last_message_at=NOW(),updated_at=NOW(),status=$2 WHERE id=$1',[id,user.role==='admin'?'IN_PROGRESS':'OPEN']);
     await client.query('COMMIT');
    }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
    return json(res,201,{ok:true,id:messageId});
   }
   if(action==='status'&&method==='PATCH'){
    if(user.role!=='admin')throw error(403,'Réservé aux superviseurs.');
    const d=await read(req,2000);
    if(!['OPEN','IN_PROGRESS','RESOLVED','CLOSED'].includes(d.status))throw error(422,'Statut invalide.');
    await pool.query('UPDATE hr_support_threads SET status=$1,updated_at=NOW() WHERE id=$2',[d.status,id]);
    return json(res,200,{ok:true});
   }
  }
  throw error(404,'Route support introuvable.');
 }
 return handler;
}
module.exports={createSupportHandler};
