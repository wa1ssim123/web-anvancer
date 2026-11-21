'use strict';
const http = require('node:http');
const crypto = require('node:crypto');
const { Pool } = require('pg');
const PORT = Number(process.env.PORT || 10000);
const ADMIN_WIX_ID = process.env.ADMIN_WIX_ID || '';
const ADDITIONAL_ADMIN_IDS=new Set(['d9be4582-6401-48d6-b68c-77c6e268d3bd','9f0ec78b-0150-4be9-9daf-8b874a7caa18','854202b1-66c0-4c31-9dff-862bda95f9b0','1711eb68-181b-465c-95ef-3d78b25fdd14']);
const isAdminId=id=>!!id&&(id===ADMIN_WIX_ID||ADDITIONAL_ADMIN_IDS.has(id));
const origins = new Set([
  'https://horenova.com',
  'https://www.horenova.com',
  // Known first-party URLs used for end-to-end QA before DNS cutover.
  'https://horenova-site-officiel.onrender.com',
  'https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com'
]);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  max: 6,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000
});
const RATE = new Map();
const error = (status, message) => Object.assign(new Error(message), { status });
function json(res, status, value, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(JSON.stringify(value));
}
function limit(s, n = 120) { return String(s ?? '').trim().slice(0, n); }
function uuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
function rate(id, count, seconds) {
  const key = id + ':' + seconds;
  const now = Date.now(), old = RATE.get(key) || [];
  const next = old.filter(x => x > now - seconds * 1000);
  if (next.length >= count) throw error(429, 'Trop de demandes. Réessayez dans un instant.');
  next.push(now); RATE.set(key, next);
  if (RATE.size > 10000) RATE.clear();
}
async function read(req, max = 100000, binary = false) {
  const parts=[]; let len=0;
  for await (const chunk of req) {
    len += chunk.length;
    if (len > max) throw error(413, 'Fichier ou message trop volumineux.');
    parts.push(chunk);
  }
  const body=Buffer.concat(parts);
  if (binary) return body;
  try { return body.length ? JSON.parse(body.toString('utf8')) : {}; }
  catch { throw error(400, 'Données JSON invalides.'); }
}
async function wixFetch(token, endpoint, body) {
  const opts={headers:{Authorization:token,'Content-Type':'application/json'},signal:AbortSignal.timeout(12000)};
  if(body !== undefined){ opts.method='POST'; opts.body=JSON.stringify(body); }
  let response;
  try { response=await fetch('https://www.wixapis.com' + endpoint, opts); }
  catch { throw error(503, 'Authentification Wix temporairement inaccessible.'); }
  if(!response.ok) {
    if(response.status===401 || response.status===403) throw error(401,'Session expirée. Reconnectez-vous.');
    throw error(503,'Les données Wix sont temporairement indisponibles.');
  }
  return await response.json();
}
async function wixItems(token, collection, pageLimit=50, ownerId='') {
  // Always scope private collections to the Wix-verified member. Paging a global
  // collection and then searching locally can select an unrelated account.
  const r=await wixFetch(token,'/wix-data/v2/items/query',{
    dataCollectionId: collection,query:{
      ...(ownerId ? {filter:{_owner:{$eq:ownerId}}} : {}),
      paging:{limit:pageLimit,offset:0}
    }
  });
  return (r.dataItems || []).map(x=>x.data || {});
}
async function auth(req) {
  const header=req.headers.authorization || '';
  const token=header.replace(/^Bearer\s+/i,'');
  if(!token || token.length > 10000) throw error(401,'Connexion nécessaire.');
  const result=await wixFetch(token,'/members/v1/members/my?fieldSet=FULL');
  const member=result.member;
  if(!member?.id || ['BLOCKED','DELETED','OFFLINE'].includes(member.status)) throw error(401,'Membre non autorisé.');
  let role='none';
  if(isAdminId(member.id)) role='admin';
  else {
    const roles=await wixItems(token,'AccountRoles',5,member.id);
    const own=roles.find(x=>x._owner === member.id);
    role=['candidate','recruiter'].includes(own?.role) ? own.role : 'none';
  }
  return {id:member.id,email:member.loginEmail||'',displayName:
    [member.contact?.firstName,member.contact?.lastName].filter(Boolean).join(' ')||member.profile?.nickname||'Membre HORENOVA',
    token,role};
}
function requireRole(user,roles) {
  if(!roles.includes(user.role)) throw error(403,'Accès non autorisé pour ce type de compte.');
}
async function application(id,user) {
  if(!uuid(id)) throw error(400,'Identifiant invalide.');
  const q=await pool.query('SELECT * FROM hr_applications WHERE id=$1',[id]);
  const a=q.rows[0];
  if(!a) throw error(404,'Candidature introuvable.');
  if(user.role==='admin' || (user.role==='candidate' && a.candidate_wix_id===user.id) ||
    (user.role==='recruiter' && a.recruiter_wix_id===user.id && a.consent_to_intro)) return a;
  throw error(403,'Vous ne pouvez pas consulter ce dossier.');
}
function present(a,user) {
  const recruiter=user.role==='recruiter';
  return {
    id:a.id,jobId:a.job_id,jobTitle:a.job_title,jobRole:a.job_role,status:a.status,
    createdAt:a.created_at,updatedAt:a.updated_at,
    candidateWixId:recruiter?undefined:a.candidate_wix_id,
    candidateEmail:recruiter?undefined:a.candidate_email,
    profile:recruiter?{...a.profile,application:a.profile?.application?{...a.profile.application,phone:undefined}:undefined}:a.profile,
    consentToIntro:a.consent_to_intro,recruiterWixId:a.recruiter_wix_id,
    recruiterRequestId:a.recruiter_request_id
  };
}
const {createSupportHandler}=require('./support.cjs');
const supportHandler=createSupportHandler({pool,json,read,rate,auth,error,limit,uuid});
const {createTechHandler}=require('./tech.cjs');
const techHandler=createTechHandler({pool,json,read,rate,auth,requireRole,error,limit,uuid});
const {createTransactionalMailer}=require('./transactional-mail.cjs');
const mailer=createTransactionalMailer({pool});
const queueReceipt=async event=>{
  try { return await mailer.enqueue(event); }
  catch(e){
    // Never make a successful business event look like a failed submission.
    console.warn('HORENOVA email queue temporarily unavailable',e.code||e.name||'error');
    return {queued:false};
  }
};
async function api(req,res,path,method) {
  if(path.startsWith('/api/support/'))return supportHandler(req,res,path,method);
  if(path.startsWith('/api/tech/'))return techHandler(req,res,path,method);
  if(path==='/health' && method==='GET'){
    const q=await pool.query('SELECT 1 AS ok');
    return json(res,200,{ok:q.rows[0].ok===1,service:'horenova-production-api'});
  }
  if(path==='/api/reviews/public' && method==='GET'){
    const [summary,listed]=await Promise.all([
      pool.query("SELECT count(*)::integer AS count,round(avg(rating)::numeric,1)::float AS average FROM hr_reviews WHERE status='APPROVED'"),
      pool.query("SELECT id,public_name,experience,rating,title,comment,created_at FROM hr_reviews WHERE status='APPROVED' ORDER BY created_at DESC LIMIT 30")
    ]);
    return json(res,200,{count:summary.rows[0].count,average:summary.rows[0].average,items:listed.rows},{'Cache-Control':'public, max-age=120'});
  }
  // Public vacancies: only HORENOVA-approved requests, never recruiter identity/contact fields.
  if(path==='/api/jobs/public' && method==='GET'){
    const approved=await pool.query(
      "SELECT r.id,r.business_name,r.business_type,r.workplace_address,r.job_title,r.job_role,r.city,r.kind,r.contract_type,r.requirements,r.openings,r.start_date,r.salary_text,r.schedule_text,r.description,r.created_at,EXISTS(SELECT 1 FROM hr_job_photos p WHERE p.request_id=r.id) AS has_photo FROM hr_recruiter_requests r WHERE r.status='VALIDEE' AND r.removed_at IS NULL ORDER BY r.created_at DESC LIMIT 200"
    );
    // Defense in depth: employer contact details are never meant to appear on public offers.
    // The admin must still manually review each title and description before approval.
    const hideDirectContacts=value=>String(value||'')
      .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,'[coordonnées masquées]')
      .replace(/(?:\+?212|0)[\s./-]?[5-7](?:[\s./-]?\d){8}\b/g,'[téléphone masqué]')
      .replace(/(?:https?:\/\/|www\.)[^\s]+/gi,'[lien masqué]')
      .slice(0,1500);
    const items=approved.rows.map(row=>({
      id:row.id,title:hideDirectContacts(row.job_title),role:hideDirectContacts(row.job_role),city:hideDirectContacts(row.city),
      businessName:hideDirectContacts(row.business_name),businessType:hideDirectContacts(row.business_type),
      workplaceAddress:hideDirectContacts(row.workplace_address),
      kind:row.kind==='shift'?'shift':'job',contractType:hideDirectContacts(row.contract_type),
      requirements:hideDirectContacts(row.requirements),openings:row.openings||1,
      startDate:row.start_date||null,salaryText:hideDirectContacts(row.salary_text),
      scheduleText:hideDirectContacts(row.schedule_text),description:hideDirectContacts(row.description),
      photoUrl:row.has_photo?'/api/jobs/public/'+row.id+'/workplace-photo':null,
      hasWorkplacePhoto:!!row.has_photo,createdAt:row.created_at
    }));
    return json(res,200,{items},{'Cache-Control':'no-store'});
  }
  const publicWorkplace=path.match(/^\/api\/jobs\/public\/([0-9a-f-]+)\/workplace-photo$/i);
  if(publicWorkplace && method==='GET'){
    if(!uuid(publicWorkplace[1]))throw error(400,'Identifiant d’annonce invalide.');
    const response=await pool.query(
      "SELECT p.image FROM hr_job_photos p JOIN hr_recruiter_requests r ON r.id=p.request_id WHERE r.id=$1 AND r.status='VALIDEE' AND r.removed_at IS NULL LIMIT 1",
      [publicWorkplace[1]]
    );
    if(!response.rows[0])throw error(404,'Aucune photo validée pour cette annonce.');
    res.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(response.rows[0].image);return;
  }
  const user=await auth(req);
  if(path==='/api/me' && method==='GET') return json(res,200,{id:user.id,email:user.email,role:user.role,displayName:user.displayName});
   if(path==='/api/admin/email-status' && method==='GET'){
     requireRole(user,['admin']);
     return json(res,200,await mailer.stats());
   }
  if(path==='/api/reviews' && method==='POST'){
    rate(user.id+':reviews',4,3600);
    const d=await read(req,12000),score=Number(d.rating);
    const title=limit(d.title,100),comment=limit(d.comment,1600);
    const experience=limit(d.experience,40);
    const publicName=limit(d.publicName,45)||'Membre HORENOVA';
    const accepted=['Candidat','Recruteur','Académie','Tourisme','Plateforme'];
    if(!Number.isInteger(score)||score<1||score>5)throw error(422,'Choisissez une note de 1 à 5 étoiles.');
    if(title.length<5||comment.length<30)throw error(422,'Un titre (5 caractères) et un avis détaillé (30 caractères minimum) sont nécessaires.');
    if(!accepted.includes(experience))throw error(422,'Catégorie d’expérience invalide.');
    if(publicName.length<2)throw error(422,'Nom public trop court.');
    const check=await pool.query("SELECT id FROM hr_reviews WHERE member_wix_id=$1",[user.id]);
    const q=await pool.query(`INSERT INTO hr_reviews(member_wix_id,public_name,experience,rating,title,comment,status)
      VALUES($1,$2,$3,$4,$5,$6,'PENDING')
      ON CONFLICT (member_wix_id) DO UPDATE SET public_name=EXCLUDED.public_name,experience=EXCLUDED.experience,rating=EXCLUDED.rating,title=EXCLUDED.title,comment=EXCLUDED.comment,status='PENDING',updated_at=now(),moderated_at=NULL
      RETURNING id,status`,[user.id,publicName,experience,score,title,comment]);
    return json(res,check.rowCount?200:201,{ok:true,status:q.rows[0].status,message:'Avis reçu. Publication après vérification par HORENOVA.'});
  }
  if(path==='/api/reviews/mine' && method==='GET'){
    const q=await pool.query('SELECT id,public_name,experience,rating,title,comment,status,updated_at FROM hr_reviews WHERE member_wix_id=$1',[user.id]);
    return json(res,200,{item:q.rows[0]||null});
  }
  if(path==='/api/reviews/moderation' && method==='GET'){
    requireRole(user,['admin']);
    const q=await pool.query('SELECT id,public_name,experience,rating,title,comment,status,created_at,updated_at FROM hr_reviews ORDER BY CASE status WHEN \'PENDING\' THEN 0 ELSE 1 END,updated_at DESC LIMIT 250');
    return json(res,200,{items:q.rows});
  }
  const reviewModeration=path.match(/^\/api\/reviews\/([0-9a-f-]+)\/moderate$/i);
  if(reviewModeration && method==='PATCH'){
    requireRole(user,['admin']);
    if(!uuid(reviewModeration[1]))throw error(422,'Avis invalide.');
    const d=await read(req,1000);
    if(!['APPROVED','REJECTED'].includes(d.status))throw error(422,'Statut de modération invalide.');
    const q=await pool.query("UPDATE hr_reviews SET status=$1,moderated_at=now(),updated_at=now() WHERE id=$2 RETURNING id",[d.status,reviewModeration[1]]);
    if(!q.rowCount)throw error(404,'Avis introuvable.');
    await pool.query("INSERT INTO hr_audit(actor_wix_id,event_type,detail) VALUES($1,'REVIEW_MODERATION',$2)",[user.id,JSON.stringify({reviewId:reviewModeration[1],status:d.status})]);
    return json(res,200,{ok:true});
  }
  // Private candidate photo presence: the photo itself is never public.
  if(path==='/api/profile/photo' && method==='GET'){
    requireRole(user,['candidate']);
    const q=await pool.query('SELECT image FROM hr_candidate_photos WHERE candidate_wix_id=$1',[user.id]);
    if(!q.rows[0])throw error(404,'Photo de profil non renseignée.');
    res.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
    res.end(q.rows[0].image);return;
  }
  if(path==='/api/profile/photo/status' && method==='GET'){
    requireRole(user,['candidate']);
    const query=await pool.query('SELECT 1 FROM hr_candidate_photos WHERE candidate_wix_id=$1 LIMIT 1',[user.id]);
    return json(res,200,{hasPhoto:!!query.rows[0]});
  }
  if(path==='/api/recruiter/workplace-photo' && method==='POST'){
    requireRole(user,['recruiter']);rate(user.id+':workplace-photo',12,3600);
    if((req.headers['content-type']||'').split(';')[0]!=='image/jpeg')throw error(415,'Photo JPEG uniquement.');
    const image=await read(req,550000,true);
    if(image.length<200||image[0]!==0xff||image[1]!==0xd8||
      image[image.length-2]!==0xff||image[image.length-1]!==0xd9)
      throw error(422,'Photo du lieu de travail invalide.');
    await pool.query("INSERT INTO hr_workplace_photos(recruiter_wix_id,mime,image) VALUES($1,'image/jpeg',$2) ON CONFLICT (recruiter_wix_id) DO UPDATE SET image=EXCLUDED.image,updated_at=now()",[user.id,image]);
    return json(res,200,{ok:true,hasPhoto:true});
  }
  if(path==='/api/recruiter/workplace-photo/status' && method==='GET'){
    requireRole(user,['recruiter']);
    const q=await pool.query('SELECT 1 FROM hr_workplace_photos WHERE recruiter_wix_id=$1 LIMIT 1',[user.id]);
    return json(res,200,{hasPhoto:!!q.rows[0]});
  }
  const securedWorkplace=path.match(/^\/api\/recruiter-requests\/([0-9a-f-]+)\/workplace-photo$/i);
  if(securedWorkplace && method==='GET'){
    requireRole(user,['admin','recruiter']);
    if(!uuid(securedWorkplace[1]))throw error(400,'Identifiant de demande invalide.');
    const rows=await pool.query(
      'SELECT p.image FROM hr_job_photos p JOIN hr_recruiter_requests r ON r.id=p.request_id WHERE r.id=$1 AND ($2::boolean OR r.recruiter_wix_id=$3) LIMIT 1',
      [securedWorkplace[1],user.role==='admin',user.id]
    );
    if(!rows.rows[0])throw error(404,'Photo du lieu de travail absente.');
    res.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
    res.end(rows.rows[0].image);return;
  }
  if(path==='/api/recruiter-requests' && method==='POST'){
    requireRole(user,['recruiter']);
    const d=await read(req);
    // Accept the legacy public form's "title" and the central API's "jobTitle".
    const title=limit(d.jobTitle || d.title,120), business=limit(d.businessName,120);
     if(!['job','shift'].includes(d.kind))throw error(422,'Choisissez un emploi ou un shift.');
    if(title.length<4 || business.length<2) throw error(422,'Titre et établissement obligatoires.');
    const wixRequestId=limit(d.wixRequestId,100);
    const savePhotoForRequest=async requestId=>{
      await pool.query(
        'INSERT INTO hr_job_photos(request_id,mime,image) SELECT $1,mime,image FROM hr_workplace_photos WHERE recruiter_wix_id=$2 ON CONFLICT(request_id) DO NOTHING',
        [requestId,user.id]
      );
    };

    // Retry after a partial Wix success must not create a duplicate central request.
    if(wixRequestId){
      const existing=await pool.query('SELECT id FROM hr_recruiter_requests WHERE recruiter_wix_id=$1 AND wix_request_id=$2 ORDER BY created_at DESC LIMIT 1',[user.id,wixRequestId]);
      if(existing.rows[0]){await savePhotoForRequest(existing.rows[0].id);return json(res,200,{id:existing.rows[0].id,ok:true,alreadyRecorded:true});}
    }
    rate(user.id+':requests',10,3600);
    const photo=await pool.query('SELECT 1 FROM hr_workplace_photos WHERE recruiter_wix_id=$1 LIMIT 1',[user.id]);
    if(!photo.rows[0])throw error(422,'Ajoutez une photo du lieu de travail avant d’envoyer l’annonce.');
    const openings=Number(d.openings||1);
    if(!Number.isInteger(openings)||openings<1||openings>200)throw error(422,'Nombre de postes invalide.');
    const startDate=/^\d{4}-\d{2}-\d{2}$/.test(d.startDate||'')?d.startDate:null;
    const values=[user.id,business,limit(d.contactName,120),limit(d.phone,40),
      title,limit(d.role,90),limit(d.city,80),limit(d.kind,12),limit(d.salaryText,100),
      limit(d.scheduleText,120),limit(d.description,1500),wixRequestId,
      limit(d.businessType,80),limit(d.workplaceAddress,180),limit(d.contractType,60),
      limit(d.requirements,1200),openings,startDate];
    let q;
    try{
      q=await pool.query('INSERT INTO hr_recruiter_requests(recruiter_wix_id,business_name,contact_name,contact_phone,job_title,job_role,city,kind,salary_text,schedule_text,description,wix_request_id,business_type,workplace_address,contract_type,requirements,openings,start_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id',values);
    }catch(e){
      if(e.code==='23505' && wixRequestId){
        const previous=await pool.query('SELECT id FROM hr_recruiter_requests WHERE recruiter_wix_id=$1 AND wix_request_id=$2 LIMIT 1',[user.id,wixRequestId]);
        if(previous.rows[0]){await savePhotoForRequest(previous.rows[0].id);return json(res,200,{id:previous.rows[0].id,ok:true,alreadyRecorded:true});}
      }
      throw e;
    }
    await savePhotoForRequest(q.rows[0].id);
    const receipt=await queueReceipt({
      key:d.kind+':'+q.rows[0].id,kind:d.kind,to:user.email,locale:d.locale,
      payload:{contactName:limit(d.contactName,70)||user.displayName,
        jobTitle:title,businessName:business,city:limit(d.city,80),
        scheduleText:limit(d.scheduleText,120)}
    });
    return json(res,201,{id:q.rows[0].id,ok:true,emailQueued:receipt.queued,emailEnabled:mailer.configured()});
  }
  if(path==='/api/recruiter-requests' && method==='GET') {
    requireRole(user,['recruiter','admin']);
    const q=user.role==='admin' ?
      await pool.query('SELECT r.*, EXISTS(SELECT 1 FROM hr_job_photos p WHERE p.request_id=r.id) AS has_workplace_photo FROM hr_recruiter_requests r WHERE r.removed_at IS NULL ORDER BY r.created_at DESC LIMIT 150') :
      await pool.query('SELECT r.*, EXISTS(SELECT 1 FROM hr_job_photos p WHERE p.request_id=r.id) AS has_workplace_photo FROM hr_recruiter_requests r WHERE r.recruiter_wix_id=$1 AND r.removed_at IS NULL ORDER BY r.created_at DESC LIMIT 150',[user.id]);
    return json(res,200,{items:q.rows});
  }
  // Only the verified HORENOVA administrator can moderate employer requests.
  const removeRecruiterRequest=path.match(/^\/api\/recruiter-requests\/([0-9a-f-]+)$/i);
   if(removeRecruiterRequest && method==='DELETE'){
     requireRole(user,['admin']);
     const id=removeRecruiterRequest[1];
     if(!uuid(id))throw error(400,'Identifiant de demande invalide.');
     // Reversible soft removal: all public links, shifts and vacancy application gates
     // exclude this record; historical applications, private photos and audits remain intact.
     // The audit and change are one SQL statement/transaction.
     const removed=await pool.query(`
       WITH changed AS (
         UPDATE hr_recruiter_requests
         SET removed_at=NOW(),updated_at=NOW()
         WHERE id=$1 AND removed_at IS NULL
         RETURNING id,job_title,kind
       ), trace AS (
         INSERT INTO hr_audit(actor_wix_id,event_type,detail)
         SELECT $2,'RECRUITER_REQUEST_REMOVED',
           jsonb_build_object('requestId',id,'title',job_title,'kind',kind)
         FROM changed RETURNING id
       )
       SELECT id,job_title,kind FROM changed`,[id,user.id]);
     if(!removed.rows[0])throw error(404,'Annonce introuvable ou déjà supprimée.');
     return json(res,200,{ok:true,removed:true,id:removed.rows[0].id});
   }
   const recruiterStatus=path.match(/^\/api\/recruiter-requests\/([0-9a-f-]+)\/status$/i);
  if(recruiterStatus && method==='PATCH'){
    requireRole(user,['admin']);
    const requestId=recruiterStatus[1];
    if(!uuid(requestId))throw error(400,'Identifiant de demande invalide.');
    const d=await read(req,3000);
    const statuses=['A_EXAMINER','VALIDEE','REFUSEE'];
    if(!statuses.includes(d.status))throw error(422,'Statut de demande invalide.');
    const updated=await pool.query(
      'UPDATE hr_recruiter_requests SET status=$1,updated_at=now() WHERE id=$2 AND removed_at IS NULL RETURNING id,status',
      [d.status,requestId]
    );
    if(!updated.rows[0])throw error(404,'Demande introuvable.');
    await pool.query(
      "INSERT INTO hr_audit(actor_wix_id,event_type,detail) VALUES($1,'RECRUITER_REQUEST_MODERATION',$2)",
      [user.id,JSON.stringify({requestId,status:d.status})]
    );
    return json(res,200,{ok:true,item:updated.rows[0]});
  }
  if(path==='/api/profile/photo' && method==='POST') {
    requireRole(user,['candidate']);rate(user.id+':photo',10,3600);
    if((req.headers['content-type']||'').split(';')[0]!=='image/jpeg') throw error(415,'Photo JPEG uniquement.');
    const photo=await read(req,450000,true);
    if(photo.length<200 || photo[0]!==0xff || photo[1]!==0xd8 || photo[photo.length-2]!==0xff || photo[photo.length-1]!==0xd9)
      throw error(422,'Image JPEG invalide.');
    await pool.query("INSERT INTO hr_candidate_photos(candidate_wix_id,mime,image) VALUES($1,'image/jpeg',$2) ON CONFLICT (candidate_wix_id) DO UPDATE SET image=EXCLUDED.image,updated_at=now()",[user.id,photo]);
    return json(res,200,{ok:true});
  }
  if(path==='/api/admin/recruitment-overview' && method==='GET'){
    requireRole(user,['admin']);
    const [overall,publicJobs]=await Promise.all([
      pool.query("SELECT kind,status,COUNT(*)::integer AS total FROM hr_recruiter_requests WHERE removed_at IS NULL GROUP BY kind,status"),
      pool.query("SELECT COUNT(*)::integer AS total FROM hr_applications")
    ]);
    return json(res,200,{requests:overall.rows,applicationCount:publicJobs.rows[0]?.total||0});
  }
  if(path==='/api/applications' && method==='POST') {
    requireRole(user,['candidate']);rate(user.id+':applications',8,3600);
    const d=await read(req),id=limit(d.jobId,100);
    if(!id || !d.consentToIntro) throw error(422,'Choisissez une offre réelle et acceptez les modalités de mise en relation.');
    let job=null;
    // Central approved recruiter requests are directly publishable after admin validation.
    // Do not accept unapproved requests, do not expose private employer data.
    if(uuid(id)){
      const central=await pool.query(
        "SELECT id,job_title,job_role FROM hr_recruiter_requests WHERE id=$1 AND status='VALIDEE' AND removed_at IS NULL",
        [id]
      );
      if(central.rows[0]){
        job={_id:central.rows[0].id,title:central.rows[0].job_title,
          role:central.rows[0].job_role,active:true};
      }
    }
    if(!job){
      const found=await wixFetch(user.token,'/wix-data/v2/items/'+encodeURIComponent(id)+'?dataCollectionId=Jobs');
      job=found.dataItem?.data || {};
    }
    if(!job.active || !job._id) throw error(422,'Cette offre n’est pas active.');
    // Simple application flow: identity verified by Wix; photo and explicit
    // consent required. Quiz and video are welcome but never submission gates.
    const form=d.application||{};
    const firstName=limit(form.firstName,80),lastName=limit(form.lastName,80);
    if(firstName.length<2||lastName.length<2)
      throw error(422,'Indiquez votre prénom et votre nom.');
    const phone=limit(form.phone,40);
    if(!/^\+?[0-9\s().-]{8,25}$/.test(phone))
      throw error(422,'Ajoutez un numéro de téléphone valide.');
    const desiredCity=limit(form.desiredCity,80);
    if(desiredCity.length<2)throw error(422,'Précisez votre ville.');
    const uploaded=await pool.query('SELECT 1 FROM hr_candidate_photos WHERE candidate_wix_id=$1 LIMIT 1',[user.id]);
    if(!uploaded.rows[0])throw error(422,'Ajoutez une photo de profil à votre candidature.');
    const exists=await pool.query('SELECT * FROM hr_applications WHERE candidate_wix_id=$1 AND job_id=$2 LIMIT 1',[user.id,job._id]);
    if(exists.rows[0])return json(res,200,{ok:true,alreadyApplied:true,item:present(exists.rows[0],user)});
    let profile=null,best=null;
    try{
      const profiles=await wixItems(user.token,'CandidateProfiles',10,user.id);
      profile=profiles.find(x=>x._owner===user.id)||null;
    }catch(e){console.warn('Optional candidate profile unavailable',e?.message||'unavailable');}
    try{
      const attempts=await wixItems(user.token,'QuizAttempts',100,user.id);
      best=attempts.filter(a=>a.passed && a.jobFamily===job.role).sort((a,b)=>(b.score||0)-(a.score||0))[0]||null;
    }catch(e){console.warn('Optional quiz result unavailable',e?.message||'unavailable');}
    const allowed=['age','bio','arabic','arabicLevel','french','frenchLevel','english','englishLevel','otherLanguage','otherLanguageLevel','preferredLanguage','videoFileId','videoConsent'];
    const snapshot=Object.fromEntries(allowed.map(k=>[k,profile?.[k]??null]));
    snapshot.firstName=firstName;snapshot.lastName=lastName;
    snapshot.city=desiredCity;snapshot.jobFamily=limit(job.role,90);
    snapshot.quizScore=best?.score??null;snapshot.quizPassed=!!best;
    snapshot.profileComplete=true;
    const experienceYears=form.experienceYears===''||form.experienceYears==null?null:Number(form.experienceYears);
    if(experienceYears!==null&&(!Number.isFinite(experienceYears)||experienceYears<0||experienceYears>60))
      throw error(422,'Les années d’expérience doivent être comprises entre 0 et 60.');
    const skills=Array.isArray(form.skills)?form.skills.slice(0,12).map(x=>limit(x,40)).filter(Boolean):[];
    const motivation=limit(form.motivation,900);
    snapshot.application={
      experienceYears,skills,phone,
      lastPosition:limit(form.lastPosition,90),
      availability:limit(form.availability,50),
      desiredCity,contractPreference:limit(form.contractPreference,60),
      motivation,earliestStart:limit(form.earliestStart,10)
    };
    const params=[user.id,user.email,job._id,limit(job.title,150),limit(job.role,90),JSON.stringify(snapshot)];
    let created;
    try {
      created=await pool.query("INSERT INTO hr_applications(candidate_wix_id,candidate_email,job_id,job_title,job_role,profile,consent_to_intro) VALUES($1,$2,$3,$4,$5,$6::jsonb,true) RETURNING *",params);
    } catch(e) {
      if(e.code==='23505'){
        const previous=await pool.query('SELECT * FROM hr_applications WHERE candidate_wix_id=$1 AND job_id=$2 LIMIT 1',[user.id,job._id]);
        if(previous.rows[0])return json(res,200,{ok:true,alreadyApplied:true,item:present(previous.rows[0],user)});
        throw error(409,'Cette candidature est déjà enregistrée.');
      }
      throw e;
    }
    const receipt=await queueReceipt({
      key:'candidate:'+created.rows[0].id,kind:'candidate',to:user.email,
      locale:d.locale||profile?.preferredLanguage,
      payload:{firstName,jobTitle:limit(job.title,140)}
    });
    return json(res,201,{ok:true,item:present(created.rows[0],user),emailQueued:receipt.queued,emailEnabled:mailer.configured()});
  }
  if(path==='/api/applications' && method==='GET') {
    requireRole(user,['candidate','recruiter','admin']);
    const q=user.role==='admin' ?
      await pool.query('SELECT * FROM hr_applications ORDER BY created_at DESC LIMIT 200') :
      user.role==='candidate' ?
      await pool.query('SELECT * FROM hr_applications WHERE candidate_wix_id=$1 ORDER BY created_at DESC LIMIT 100',[user.id]) :
      await pool.query('SELECT * FROM hr_applications WHERE recruiter_wix_id=$1 AND consent_to_intro=true ORDER BY created_at DESC LIMIT 100',[user.id]);
    return json(res,200,{items:q.rows.map(a=>present(a,user))});
  }
  const m=path.match(/^\/api\/applications\/([0-9a-f-]+)(?:\/(messages|photo|assign|status))?$/i);
  if(m){
    const id=m[1],action=m[2]||'',a=await application(id,user);
    if(!action && method==='GET') return json(res,200,{item:present(a,user)});
    if(action==='messages' && method==='GET'){
      const r=await pool.query('SELECT id,sender_wix_id,sender_role,body,created_at FROM hr_messages WHERE application_id=$1 ORDER BY id DESC LIMIT 150',[id]);
      return json(res,200,{items:r.rows.reverse()});
    }
    if(action==='messages' && method==='POST'){
      rate(user.id+':chat',25,60);
      const d=await read(req,10000),body=limit(d.body,2000);
      if(!body || body.length>2000) throw error(422,'Message vide ou trop long.');
      const r=await pool.query('INSERT INTO hr_messages(application_id,sender_wix_id,sender_role,body) VALUES($1,$2,$3,$4) RETURNING id,created_at',[id,user.id,user.role,body]);
      return json(res,201,{ok:true,id:r.rows[0].id,createdAt:r.rows[0].created_at});
    }
    if(action==='photo' && method==='GET'){
      const r=await pool.query('SELECT image FROM hr_candidate_photos WHERE candidate_wix_id=$1',[a.candidate_wix_id]);
      if(!r.rows.length) throw error(404,'Aucune photo enregistrée.');
      res.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
      res.end(r.rows[0].image);
      return;
    }
    if(action==='status' && method==='PATCH') {
      requireRole(user,['admin']);
      const d=await read(req);
      const allowed=['EN_ETUDE','PRESELECTION','ENTRETIEN','MISE_EN_RELATION','RETENUE','REFUSEE','CLOTURE'];
      if(!allowed.includes(d.status)) throw error(422,'Statut invalide.');
      await pool.query('UPDATE hr_applications SET status=$1,updated_at=now() WHERE id=$2',[d.status,id]);
      await pool.query('INSERT INTO hr_audit(actor_wix_id,event_type,application_id,detail) VALUES($1,$2,$3,$4)',[user.id,'STATUS',id,JSON.stringify({status:d.status})]);
      return json(res,200,{ok:true});
    }
    if(action==='assign' && method==='PATCH') {
      requireRole(user,['admin']);
      if(!a.consent_to_intro) throw error(403,'Le candidat n’a pas consenti à la mise en relation.');
      const d=await read(req);
      if(!uuid(d.requestId)) throw error(422,'Demande recruteur invalide.');
      const q=await pool.query('SELECT * FROM hr_recruiter_requests WHERE id=$1 AND removed_at IS NULL',[d.requestId]);
      const request=q.rows[0];
      if(!request) throw error(404,'Demande de recrutement introuvable.');
      if(request.status!=='VALIDEE') throw error(409,'Validez la demande avant de mettre en relation le candidat.');
      if(request.job_role && a.job_role && request.job_role!==a.job_role)
        throw error(422,'Le métier du recruteur ne correspond pas à celui du candidat.');
      await pool.query("UPDATE hr_applications SET recruiter_wix_id=$1,recruiter_request_id=$2,status='MISE_EN_RELATION',updated_at=now() WHERE id=$3",[request.recruiter_wix_id,request.id,id]);
      await pool.query('INSERT INTO hr_audit(actor_wix_id,event_type,application_id,detail) VALUES($1,$2,$3,$4)',[user.id,'ASSIGN_RECRUITER',id,JSON.stringify({requestId:request.id})]);
      return json(res,200,{ok:true});
    }
  }
  throw error(404,'Route introuvable.');
}
const server=http.createServer(async(req,res)=>{
  const origin=req.headers.origin;
  if(origin && !origins.has(origin)) return json(res,403,{error:'Origine non autorisée.'});
  if(origin) {
    res.setHeader('Access-Control-Allow-Origin',origin);
    res.setHeader('Vary','Origin');
    res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');
    // DELETE must be explicitly advertised during the browser's CORS preflight.
    // Authorization is still required by the DELETE route after the preflight.
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PATCH, DELETE, OPTIONS');
  }
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
  const path=new URL(req.url,'http://localhost').pathname;
  try { await api(req,res,path,req.method); }
  catch(e){
    const status=e.status || 500;
    if(status===500) console.error('HORENOVA API internal error:',e.code||e.name||'unknown');
    if(!res.headersSent) json(res,status,{error:status===500?'Service temporairement indisponible.':e.message});
    else res.end();
  }
});
mailer.start().catch(e=>console.error('HORENOVA notification system initialization failed',e.code||e.name||'error'));
server.listen(PORT,'0.0.0.0',()=>console.log('HORENOVA API ready on port '+PORT));
