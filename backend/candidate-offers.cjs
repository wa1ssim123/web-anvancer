'use strict';
function createCandidateOffersHandler({pool,json,read,rate,auth,requireRole,error,uuid}){
 const clean=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
 const contact=/[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\s().-]*){8,}|https?:\/\/|www\./i;
 const checkText=(v,n,min=2)=>{const x=clean(v,n);if(x.length<min||contact.test(x))throw error(422,'Texte invalide ou coordonnées directes interdites.');return x};
 const types=['SHIFT','PART_TIME','FULL_TIME'];
 const validDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
 return async function(req,res,path,method){
 const user=await auth(req);requireRole(user,['candidate','recruiter','admin','manager']);
 const params=new URL(req.url,'http://localhost').searchParams;
 const page=Math.min(10000,Math.max(0,Math.trunc(Number(params.get('offset'))||0)));
 if(path==='/api/candidate-offers'&&method==='GET'){
  const fields='id,display_name,job_role,city,work_type,experience_years,available_from,description,status,created_at,updated_at';
  let q;
  if(user.role==='candidate')q=await pool.query('SELECT '+fields+' FROM hr_candidate_offers WHERE candidate_wix_id=$1 ORDER BY created_at DESC,id DESC LIMIT 51 OFFSET $2',[user.id,page]);
  else if(['admin','manager'].includes(user.role))q=await pool.query("SELECT "+fields+" FROM hr_candidate_offers ORDER BY (status='PENDING') DESC,created_at DESC,id DESC LIMIT 51 OFFSET $1",[page]);
  else q=await pool.query("SELECT "+fields+" FROM hr_candidate_offers WHERE status='APPROVED' AND ($1='' OR job_role ILIKE '%'||$1||'%') AND ($2='' OR city ILIKE '%'||$2||'%') AND ($3='' OR work_type=$3) ORDER BY created_at DESC,id DESC LIMIT 51 OFFSET $4",[clean(params.get('role'),90),clean(params.get('city'),80),types.includes(params.get('type'))?params.get('type'):'',page]);
  return json(res,200,{items:q.rows.slice(0,50),hasMore:q.rows.length>50});
 }
 if(path==='/api/candidate-offers'&&method==='POST'){
  requireRole(user,['candidate']);rate(user.id+':candidate-offers',8,3600);const d=await read(req);
  if(d.consent!==true||!types.includes(d.workType))throw error(422,'Consentement et type de travail requis.');
  const name=checkText(d.displayName,100),role=checkText(d.jobRole,90),city=checkText(d.city,80),description=checkText(d.description,1500,10);
  const exp=d.experienceYears===''||d.experienceYears==null?null:Number(d.experienceYears);
  if(exp!==null&&(!Number.isInteger(exp)||exp<0||exp>60))throw error(422,'Expérience de 0 à 60 ans.');
  if(d.availableFrom&&!validDate(d.availableFrom))throw error(422,'Date invalide.');
  const q=await pool.query('INSERT INTO hr_candidate_offers(candidate_wix_id,display_name,job_role,city,work_type,experience_years,available_from,description) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,status',[user.id,name,role,city,d.workType,exp,d.availableFrom||null,description]);
  return json(res,201,{item:q.rows[0]});
 }
 if(path==='/api/candidate-offers/interests'&&method==='GET'){
  const fields='i.id,i.offer_id,i.message,i.status,i.created_at,o.display_name,o.job_role,o.city,r.business_name,r.job_title';
  let q;
  if(user.role==='candidate')q=await pool.query("SELECT "+fields+" FROM hr_candidate_offer_interests i JOIN hr_candidate_offers o ON o.id=i.offer_id JOIN hr_recruiter_requests r ON r.id=i.recruiter_request_id WHERE o.candidate_wix_id=$1 AND i.status IN ('APPROVED','ACCEPTED','DECLINED') ORDER BY i.created_at DESC,i.id DESC LIMIT 51 OFFSET $2",[user.id,page]);
  else if(user.role==='recruiter')q=await pool.query('SELECT '+fields+' FROM hr_candidate_offer_interests i JOIN hr_candidate_offers o ON o.id=i.offer_id JOIN hr_recruiter_requests r ON r.id=i.recruiter_request_id WHERE i.recruiter_wix_id=$1 ORDER BY i.created_at DESC,i.id DESC LIMIT 51 OFFSET $2',[user.id,page]);
  else q=await pool.query("SELECT "+fields+" FROM hr_candidate_offer_interests i JOIN hr_candidate_offers o ON o.id=i.offer_id JOIN hr_recruiter_requests r ON r.id=i.recruiter_request_id ORDER BY (i.status='PENDING') DESC,i.created_at DESC,i.id DESC LIMIT 51 OFFSET $1",[page]);
  return json(res,200,{items:q.rows.slice(0,50),hasMore:q.rows.length>50});
 }
 if(path==='/api/candidate-offers/recruiter-jobs'&&method==='GET'){
  requireRole(user,['recruiter']);const q=await pool.query("SELECT id,job_title,business_name FROM hr_recruiter_requests WHERE recruiter_wix_id=$1 AND status='VALIDEE' AND removed_at IS NULL ORDER BY created_at DESC LIMIT 200",[user.id]);return json(res,200,{items:q.rows});
 }
 const interest=path.match(/^\/api\/candidate-offers\/interests\/([0-9a-f-]+)$/i);
 if(interest&&method==='PATCH'){
  if(!uuid(interest[1]))throw error(400,'Identifiant invalide.');const d=await read(req);
  if(['admin','manager'].includes(user.role)){
   if(!['APPROVED','REJECTED'].includes(d.status))throw error(422,'Statut invalide.');
   const q=await pool.query("UPDATE hr_candidate_offer_interests i SET status=$1,updated_at=now() FROM hr_candidate_offers o,hr_recruiter_requests r WHERE i.id=$2 AND i.status='PENDING' AND o.id=i.offer_id AND r.id=i.recruiter_request_id AND ($1='REJECTED' OR (o.status='APPROVED' AND r.status='VALIDEE' AND r.removed_at IS NULL)) RETURNING i.id",[d.status,interest[1]]);
   if(!q.rows.length)throw error(409,'Demande indisponible ou déjà traitée.');return json(res,200,{ok:true});
  }
  requireRole(user,['candidate']);if(!['ACCEPTED','DECLINED'].includes(d.status))throw error(422,'Statut invalide.');
  const client=await pool.connect();try{
   await client.query('BEGIN');
   const q=await client.query("SELECT i.*,o.display_name,o.city,o.experience_years,o.description,o.job_role AS candidate_role,o.available_from,r.job_title,r.job_role AS requested_role,r.status AS request_status,r.removed_at,o.status AS offer_status FROM hr_candidate_offer_interests i JOIN hr_candidate_offers o ON o.id=i.offer_id JOIN hr_recruiter_requests r ON r.id=i.recruiter_request_id WHERE i.id=$1 AND o.candidate_wix_id=$2 AND i.status='APPROVED' FOR UPDATE OF i,o,r",[interest[1],user.id]);
   const a=q.rows[0];if(!a)throw error(404,'Demande introuvable.');
   let applicationId=null,alreadyApplied=false;
   if(d.status==='ACCEPTED'){
    if(a.offer_status!=='APPROVED'||a.request_status!=='VALIDEE'||a.removed_at)throw error(409,'Offre ou recrutement indisponible.');
    const names=a.display_name.split(/\s+/),profile={firstName:names.shift()||'',lastName:names.join(' '),city:a.city,jobFamily:a.candidate_role,application:{experienceYears:a.experience_years,motivation:a.description,earliestStart:a.available_from||null}};
    const inserted=await client.query("INSERT INTO hr_applications(candidate_wix_id,candidate_email,job_id,job_title,job_role,profile,consent_to_intro,recruiter_wix_id,recruiter_request_id,status,match_started_at) VALUES($1,$2,$3::text,$4,$5,$6::jsonb,true,$7,$3::uuid,'MISE_EN_RELATION',now()) ON CONFLICT(candidate_wix_id,job_id) DO NOTHING RETURNING id",[user.id,user.email,a.recruiter_request_id,a.job_title,a.requested_role,JSON.stringify(profile),a.recruiter_wix_id]);
    applicationId=inserted.rows[0]?.id||null;alreadyApplied=!applicationId;
   }
   await client.query('UPDATE hr_candidate_offer_interests SET status=$1,updated_at=now() WHERE id=$2',[d.status,a.id]);await client.query('COMMIT');return json(res,200,{ok:true,applicationId,alreadyApplied});
  }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
 }
 const m=path.match(/^\/api\/candidate-offers\/([0-9a-f-]+)(\/interest)?$/i);
 if(m){if(!uuid(m[1]))throw error(400,'Identifiant invalide.');
  if(m[2]&&method==='POST'){
   requireRole(user,['recruiter']);rate(user.id+':candidate-interest',20,3600);const d=await read(req);if(!uuid(d.requestId))throw error(422,'Choisissez une annonce validée.');
   const message=checkText(d.message,1000,5);
   const q=await pool.query("INSERT INTO hr_candidate_offer_interests(offer_id,recruiter_wix_id,recruiter_request_id,message) SELECT o.id,$2,r.id,$4 FROM hr_candidate_offers o JOIN hr_recruiter_requests r ON r.id=$3 WHERE o.id=$1 AND o.status='APPROVED' AND r.recruiter_wix_id=$2 AND r.status='VALIDEE' AND r.removed_at IS NULL AND o.candidate_wix_id<>$2 ON CONFLICT(offer_id,recruiter_request_id) DO NOTHING RETURNING id",[m[1],user.id,d.requestId,message]);
   if(!q.rows.length)throw error(409,'Annonce indisponible ou demande déjà envoyée.');return json(res,201,{ok:true});
  }
  if(!m[2]&&method==='PATCH'){
   const d=await read(req);let q;
   if(['admin','manager'].includes(user.role)&&['APPROVED','REJECTED'].includes(d.status))q=await pool.query("UPDATE hr_candidate_offers SET status=$1,updated_at=now() WHERE id=$2 AND status='PENDING' RETURNING id",[d.status,m[1]]);
   else if(user.role==='candidate'&&d.status==='WITHDRAWN')q=await pool.query("UPDATE hr_candidate_offers SET status='WITHDRAWN',updated_at=now() WHERE id=$1 AND candidate_wix_id=$2 AND status IN ('PENDING','APPROVED') RETURNING id",[m[1],user.id]);
   else throw error(403,'Action non autorisée.');
   if(!q.rows.length)throw error(409,'Annonce indisponible ou déjà traitée.');return json(res,200,{ok:true});
  }
 }
 throw error(404,'Route introuvable.');
 };
}
module.exports={createCandidateOffersHandler};
