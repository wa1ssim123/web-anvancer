'use strict';
/* Recruitment messaging. Direct: HORENOVA + one verified member.
   Match: HORENOVA + candidate + assigned verified recruiter, only after consent.
   No public directory and no browser-supplied participant IDs. */
function normalizedRoles(raw) {
  return String(raw||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().split(/[,;/|]+/).map(x=>x.trim().replace(/\s+/g,' ')).filter(Boolean);
}
function rolesOverlap(candidate,request){
  const a=normalizedRoles(candidate),b=normalizedRoles(request);
  return a.some(x=>b.includes(x));
}
function createChatHandler({pool,json,read,rate,auth,requireRole,error,limit,uuid,application}) {
  const bad=(msg,status=422)=>{throw error(status,msg);};
  const protect=async req=>{
    const user=await auth(req);
    requireRole(user,['admin','candidate','recruiter']);
    return user;
  };
  const safe=(value,n)=>limit(value,n);
  const displayName=p=>[p?.firstName,p?.lastName].filter(Boolean).join(' ').trim()||'Candidat';
  const mapDirect=r=>({
    kind:'direct',id:r.id,role:r.recipient_role,
    title:r.recipient_role==='candidate'?displayName(r.profile):r.business_name||'Établissement',
    subtitle:r.recipient_role==='candidate'?(r.job_role||'Candidature'):(r.job_role||'Recrutement'),
    jobRole:r.job_role||'',status:r.status||'',lastMessageAt:r.last_message_at,
    messagePreview:r.preview||'',participants:['admin',r.recipient_role]
  });
  const mapMatch=r=>({
    kind:'match',id:r.id,role:'match',title:r.job_title||r.job_role||'Mise en relation',
    subtitle:displayName(r.profile)+' · '+(r.business_name||'Recruteur HORENOVA'),
    candidateName:displayName(r.profile),businessName:r.business_name||'Recruteur HORENOVA',
    jobRole:r.job_role||'',status:r.status,lastMessageAt:r.last_message_at||r.updated_at,
    messagePreview:r.preview||'',participants:['admin','candidate','recruiter']
  });
  const directListSql=`SELECT d.id,d.recipient_role,d.last_message_at,
        a.profile,a.job_role,a.status,r.business_name,r.job_role AS r_role,
        (SELECT body FROM hr_direct_messages WHERE thread_id=d.id ORDER BY id DESC LIMIT 1) AS preview
      FROM hr_direct_threads d
      LEFT JOIN hr_applications a ON a.id=d.application_id
      LEFT JOIN hr_recruiter_requests r ON r.id=d.recruiter_request_id
      WHERE ($1='admin' OR (d.recipient_role=$1 AND d.recipient_wix_id=$2))
      ORDER BY d.last_message_at DESC LIMIT 150`;
  async function directAccess(id,user){
    if(!uuid(id))bad('Identifiant de conversation invalide.',400);
    const q=await pool.query('SELECT id,recipient_wix_id,recipient_role FROM hr_direct_threads WHERE id=$1',[id]);
    const row=q.rows[0];
    if(!row || !(user.role==='admin'||(row.recipient_wix_id===user.id&&row.recipient_role===user.role)))
      bad('Conversation introuvable.',404);
    return row;
  }
  async function matchAccess(id,user){
    const a=await application(id,user);
    if(!a.consent_to_intro||!a.recruiter_wix_id)bad('Cette conversation à trois n’est pas encore autorisée.',403);
    return a;
  }
  async function handle(req,res,path,method){
    if(!path.startsWith('/api/chat/')&&!path.startsWith('/api/admin/match-directory'))return false;
    const user=await protect(req);
    if(path==='/api/admin/match-directory' && method==='GET'){
      requireRole(user,['admin']);rate(user.id+':match-search',90,60);
      const url=new URL(req.url,'http://localhost');
      const kind=url.searchParams.get('kind')==='recruiter'?'recruiter':'candidate';
      const term=safe(url.searchParams.get('query'),90),role=safe(url.searchParams.get('role'),80);
      const city=safe(url.searchParams.get('city'),80),status=safe(url.searchParams.get('status'),30);
      const params=['%'+term+'%','%'+role+'%','%'+city+'%',status];
      if(kind==='candidate'){
        const r=await pool.query(`SELECT id,job_title,job_role,status,created_at,consent_to_intro,recruiter_wix_id,
          profile->>'firstName' AS first_name,profile->>'lastName' AS last_name,
          COALESCE(profile->>'city',profile->'application'->>'desiredCity','') AS city,
          candidate_email
          FROM hr_applications WHERE
          ($1='%%' OR CONCAT_WS(' ',profile->>'firstName',profile->>'lastName',candidate_email,job_title,job_role) ILIKE $1)
          AND job_role ILIKE $2
          AND COALESCE(profile->>'city',profile->'application'->>'desiredCity','') ILIKE $3
          AND ($4='' OR status=$4)
          ORDER BY created_at DESC LIMIT 150`,params);
        return json(res,200,{kind,items:r.rows.map(x=>({
          id:x.id,name:[x.first_name,x.last_name].filter(Boolean).join(' ')||'Candidat',
          email:x.candidate_email,jobTitle:x.job_title,jobRole:x.job_role,city:x.city||'',
          status:x.status,consentToIntro:x.consent_to_intro,
          assigned:!!x.recruiter_wix_id,createdAt:x.created_at
        }))});
      }
      const r=await pool.query(`SELECT id,business_name,contact_name,job_title,job_role,city,status,
        kind,created_at FROM hr_recruiter_requests
        WHERE removed_at IS NULL
        AND ($1='%%' OR CONCAT_WS(' ',business_name,contact_name,job_title,job_role) ILIKE $1)
        AND job_role ILIKE $2 AND city ILIKE $3 AND ($4='' OR status=$4)
        ORDER BY created_at DESC LIMIT 150`,params);
      return json(res,200,{kind,items:r.rows.map(x=>({
        id:x.id,name:x.business_name||'Recruteur',
        contactName:x.contact_name||'',jobTitle:x.job_title,jobRole:x.job_role,
        city:x.city||'',status:x.status,kind:x.kind,createdAt:x.created_at
      }))});
    }
    if(path==='/api/chat/threads'&&method==='GET'){
      rate(user.id+':chat-list',100,60);
      const [direct,matched]=await Promise.all([
        pool.query(directListSql,[user.role,user.id]),
        pool.query(`SELECT a.id,a.job_title,a.job_role,a.profile,a.status,a.updated_at,
          r.business_name,
          (SELECT MAX(m.created_at) FROM hr_messages m WHERE m.application_id=a.id AND a.match_started_at IS NOT NULL AND m.created_at>=a.match_started_at) AS last_message_at,
          (SELECT m.body FROM hr_messages m WHERE m.application_id=a.id AND a.match_started_at IS NOT NULL AND m.created_at>=a.match_started_at ORDER BY m.id DESC LIMIT 1) AS preview
          FROM hr_applications a
          LEFT JOIN hr_recruiter_requests r ON r.id=a.recruiter_request_id
          WHERE a.consent_to_intro=true AND a.recruiter_wix_id IS NOT NULL
          AND ($1='admin' OR ($1='candidate' AND a.candidate_wix_id=$2)
          OR ($1='recruiter' AND a.recruiter_wix_id=$2))
          ORDER BY a.updated_at DESC LIMIT 150`,[user.role,user.id])
      ]);
      const items=[
        ...direct.rows.map(r=>mapDirect({...r,job_role:r.recipient_role==='candidate'?r.job_role:r.r_role})),
        ...matched.rows.map(mapMatch)
      ].sort((a,b)=>new Date(b.lastMessageAt||0)-new Date(a.lastMessageAt||0));
      return json(res,200,{items});
    }
    if(path==='/api/chat/direct-threads'&&method==='POST'){
      requireRole(user,['admin']);rate(user.id+':start-chat',35,3600);
      const d=await read(req,5000),kind=d.kind;
      if(!['candidate','recruiter'].includes(kind)||!uuid(String(d.sourceId||'')))
        bad('Dossier ou type de destinataire invalide.');
      let recipient;
      if(kind==='candidate'){
        const r=await pool.query('SELECT candidate_wix_id FROM hr_applications WHERE id=$1',[d.sourceId]);
        recipient=r.rows[0]?.candidate_wix_id;
      }else{
        const r=await pool.query('SELECT recruiter_wix_id FROM hr_recruiter_requests WHERE id=$1 AND removed_at IS NULL',[d.sourceId]);
        recipient=r.rows[0]?.recruiter_wix_id;
      }
      if(!recipient)bad('Destinataire non trouvé.',404);
      const sql=kind==='candidate'?
        "INSERT INTO hr_direct_threads(application_id,recipient_wix_id,recipient_role,created_by_admin) VALUES($1,$2,'candidate',$3) ON CONFLICT (application_id) WHERE application_id IS NOT NULL DO UPDATE SET last_message_at=hr_direct_threads.last_message_at RETURNING id":
        "INSERT INTO hr_direct_threads(recruiter_request_id,recipient_wix_id,recipient_role,created_by_admin) VALUES($1,$2,'recruiter',$3) ON CONFLICT (recruiter_request_id) WHERE recruiter_request_id IS NOT NULL DO UPDATE SET last_message_at=hr_direct_threads.last_message_at RETURNING id";
      const q=await pool.query(sql,[d.sourceId,recipient,user.id]);
      return json(res,200,{ok:true,kind:'direct',id:q.rows[0].id});
    }
    const m=path.match(/^\/api\/chat\/(direct|match)\/([0-9a-f-]+)\/messages$/i);
    if(m){
      const kind=m[1],id=m[2];
      if(kind==='direct')await directAccess(id,user);else await matchAccess(id,user);
      if(method==='GET'){
        rate(user.id+':chat-get',150,60);
        const r=kind==='direct'?
          await pool.query('SELECT id,sender_wix_id,sender_role,body,created_at FROM (SELECT id,sender_wix_id,sender_role,body,created_at FROM hr_direct_messages WHERE thread_id=$1 ORDER BY id DESC LIMIT 200) recent ORDER BY id',[id]):
          await pool.query('SELECT id,sender_wix_id,sender_role,body,created_at FROM (SELECT m.id,m.sender_wix_id,m.sender_role,m.body,m.created_at FROM hr_messages m JOIN hr_applications a ON a.id=m.application_id WHERE m.application_id=$1 AND (a.match_started_at IS NOT NULL AND m.created_at>=a.match_started_at) ORDER BY m.id DESC LIMIT 200) recent ORDER BY id',[id]);
        return json(res,200,{items:r.rows.map(x=>({id:x.id,senderWixId:x.sender_wix_id,senderRole:x.sender_role,body:x.body,createdAt:x.created_at}))});
      }
      if(method==='POST'){
        rate(user.id+':chat-send',25,60);
        const d=await read(req,9000),body=safe(d.body,2000);
        if(!body||body.length>2000)bad('Message vide ou trop long.');
        let r;
        if(kind==='direct'){
          const client=await pool.connect();
          try{
            await client.query('BEGIN');
            r=await client.query('INSERT INTO hr_direct_messages(thread_id,sender_wix_id,sender_role,body) VALUES($1,$2,$3,$4) RETURNING id,created_at',[id,user.id,user.role,body]);
            await client.query('UPDATE hr_direct_threads SET last_message_at=now() WHERE id=$1',[id]);
            await client.query('COMMIT');
          }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}
          finally{client.release()}
        }else{
          r=await pool.query('INSERT INTO hr_messages(application_id,sender_wix_id,sender_role,body) VALUES($1,$2,$3,$4) RETURNING id,created_at',[id,user.id,user.role,body]);
        }
        return json(res,201,{ok:true,id:r.rows[0].id,createdAt:r.rows[0].created_at});
      }
    }
    throw error(404,'Route de messagerie introuvable.');
  }
  return handle;
}
module.exports={createChatHandler,normalizedRoles,rolesOverlap};