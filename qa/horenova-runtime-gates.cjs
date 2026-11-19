'use strict';
/* Cross-account HORENOVA API integration tests using in-memory mock PostgreSQL
 * and mock Wix token verification. NO production mutations or email sends.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../backend/server.cjs'),'utf8');
const requestId='11111111-1111-4111-8111-111111111111';
const applicationId='22222222-2222-4222-8222-222222222222';
const db={
  requests:[{id:requestId,recruiter_wix_id:'rec-id',business_name:'Restaurant QA',
    job_title:'Serveur test@example.com',job_role:'Serveur',city:'Casablanca',
    kind:'job',salary_text:'5500 DH',schedule_text:'09:00-17:00',
    description:'Contact +212612345678 (must be redacted)',status:'A_EXAMINER'}],
  applications:[],messages:[],audits:[],photos:[{candidate_wix_id:'cand-id',recruiter_wix_id:'rec-id'}]
};
const pg={Pool:class{
  async query(statement,params=[]){
    const sql=String(statement).replace(/\s+/g,' ').trim();
    if(sql.startsWith('SELECT 1 AS ok'))return {rows:[{ok:1}]};
    if(sql.includes('FROM hr_recruiter_requests r WHERE r.status=\'VALIDEE\''))
      return {rows:db.requests.filter(row=>row.status==='VALIDEE').map(row=>({...row,has_photo:true}))};
    if(sql.includes('SELECT p.image FROM hr_workplace_photos p JOIN hr_recruiter_requests r')){
      const req=db.requests.find(x=>x.id===params[0]);
      if(!req||!db.photos.some(x=>x.recruiter_wix_id===req.recruiter_wix_id)||(
        sql.includes("r.status='VALIDEE'")&&req.status!=='VALIDEE'))return {rows:[]};
      return {rows:[{image:Buffer.from([0xff,0xd8,0xff,0xd9])}]};
    }
    if(sql.includes('INSERT INTO hr_workplace_photos(')||sql.includes('INSERT INTO hr_candidate_photos('))return {rows:[]};
    if(sql.includes('SELECT 1 FROM hr_candidate_photos WHERE candidate_wix_id=$1'))return {rows:db.photos.filter(x=>x.candidate_wix_id===params[0]).map(()=>({exists:1}))};
    if(sql.includes('SELECT 1 FROM hr_workplace_photos WHERE recruiter_wix_id=$1'))return {rows:db.photos.filter(x=>x.recruiter_wix_id===params[0]).map(()=>({exists:1}))};
    if(sql.includes('SELECT id,job_title,job_role FROM hr_recruiter_requests'))
      return {rows:db.requests.filter(row=>row.id===params[0]&&row.status==='VALIDEE')};
    if(sql.includes('SELECT * FROM hr_recruiter_requests WHERE id='))
      return {rows:db.requests.filter(row=>row.id===params[0])};
    if(sql.includes('UPDATE hr_recruiter_requests SET status=')){
      const row=db.requests.find(row=>row.id===params[1]);
      if(row)row.status=params[0];
      return {rows:row?[{id:row.id,status:row.status}]:[]};
    }
    if(sql.includes('FROM hr_applications WHERE id=$1'))
      return {rows:db.applications.filter(row=>row.id===params[0])};
    if(sql.includes('SELECT * FROM hr_applications')){
      let rows=db.applications;
      if(sql.includes('candidate_wix_id=$1'))rows=rows.filter(row=>row.candidate_wix_id===params[0]);
      if(sql.includes('recruiter_wix_id=$1'))rows=rows.filter(row=>row.recruiter_wix_id===params[0]&&row.consent_to_intro);
      return {rows};
    }
    if(sql.includes('INSERT INTO hr_applications')){
      const row={id:applicationId,candidate_wix_id:params[0],candidate_email:params[1],
        job_id:params[2],job_title:params[3],job_role:params[4],profile:JSON.parse(params[5]),
        consent_to_intro:true,status:'EN_ETUDE',recruiter_wix_id:null,
        recruiter_request_id:null,created_at:'2026-11-18T00:00:00Z',updated_at:'2026-11-18T00:00:00Z'};
      db.applications.push(row);return {rows:[row]};
    }
    if(sql.includes('UPDATE hr_applications SET recruiter_wix_id=')){
      const row=db.applications.find(row=>row.id===params[2]);
      if(row){row.recruiter_wix_id=params[0];row.recruiter_request_id=params[1];}
      return {rows:[]};
    }
    if(sql.includes('SELECT id,sender_wix_id,sender_role,body,created_at FROM hr_messages'))
      return {rows:db.messages.filter(row=>row.application_id===params[0]).slice().reverse()};
    if(sql.includes('INSERT INTO hr_messages')){
      const row={id:db.messages.length+1,application_id:params[0],
        sender_wix_id:params[1],sender_role:params[2],body:params[3],
        created_at:'2026-11-18T00:00:00Z'};
      db.messages.push(row);return {rows:[row]};
    }
    if(sql.includes('INSERT INTO hr_audit')){db.audits.push({sql,params});return {rows:[]};}
    throw Error('Mock SQL route missing: '+sql.slice(0,180));
  }
}};
const fakeFetch=async(url,options)=>{
  const token=options.headers.Authorization;
  const id={'adm-token':'admin-id','rec-token':'rec-id','cand-token':'cand-id','other-token':'other-id'}[token];
  if(url.includes('/members/v1/members/my'))return {
    ok:Boolean(id),status:id?200:401,
    json:async()=>({member:{id,loginEmail:(id||'anonymous')+'@example.test',status:'ACTIVE',
      contact:{firstName:'Test'}}})
  };
  if(url.includes('/wix-data/v2/items/query')){
    const {dataCollectionId}=JSON.parse(options.body);
    let items=[];
    if(dataCollectionId==='AccountRoles'&&id!=='admin-id')
      items=[{_owner:id,role:id==='rec-id'?'recruiter':'candidate'}];
    if(dataCollectionId==='CandidateProfiles'&&id==='cand-id')
      items=[{_owner:id,profileComplete:true,videoFileId:'private-video-test',
        videoConsent:true,firstName:'QA candidate',jobFamily:'Serveur'}];
    if(dataCollectionId==='QuizAttempts'&&id==='cand-id')
      items=[{_owner:id,jobFamily:'Serveur',passed:true,score:90}];
    return {ok:true,status:200,json:async()=>({dataItems:items.map(data=>({data}))})};
  }
  throw Error('Unexpected Wix API path '+url);
};
const dependencies=name=>{
  if(name==='pg')return pg;
  if(name==='node:http')return {createServer:()=>({listen(){}})};
  if(name==='node:crypto')return require('node:crypto');
  throw Error('Unexpected dependency '+name);
};
const {api}=new Function('require','process','fetch','AbortSignal','Buffer','console',
  source+'\nreturn {api};')(dependencies,
  {env:{PORT:'10000',ADMIN_WIX_ID:'admin-id'}},fakeFetch,AbortSignal,Buffer,console);
async function call(method,path,token,body,{mime='application/json'}={}){
  const req={headers:{authorization:token||'','content-type':mime},
    async *[Symbol.asyncIterator](){if(body!==undefined)yield Buffer.isBuffer(body)?body:Buffer.from(JSON.stringify(body))}};
  const res={
    status:0,raw:'',
    writeHead(code){this.status=code;},
    end(body){this.raw=body||'';}
  };
  try{await api(req,res,path,method);}
  catch(error){res.status=error.status||500;res.raw=JSON.stringify({error:error.message});}
  return {status:res.status,data:Buffer.isBuffer(res.raw)?{photo:true}:res.raw?JSON.parse(res.raw):null};
}
async function run(){
  const out=[];
  const mark=(name,condition)=>{assert.ok(condition,name);out.push(name);};
  let r=await call('GET','/api/jobs/public');
  mark('Pending offers hidden',r.status===200&&r.data.items.length===0);
  r=await call('GET','/api/jobs/public/'+requestId+'/workplace-photo');
  mark('Pending employer photo hidden from the public',r.status===404);
  r=await call('GET','/api/recruiter/workplace-photo/status','rec-token');
  mark('Workplace upload status visible to recruiter',r.status===200&&r.data.hasPhoto);
  const jpeg=Buffer.concat([Buffer.from([0xff,0xd8]),Buffer.alloc(205,0x01),Buffer.from([0xff,0xd9])]);
  r=await call('POST','/api/recruiter/workplace-photo','cand-token',jpeg,{mime:'image/jpeg'});
  mark('Candidates cannot upload employer photos',r.status===403);
  r=await call('POST','/api/recruiter/workplace-photo','rec-token',jpeg,{mime:'image/jpeg'});
  mark('Recruiter uploads real workplace jpeg',r.status===200&&r.data.hasPhoto===true);
  r=await call('POST','/api/profile/photo','rec-token',jpeg,{mime:'image/jpeg'});
  mark('Recruiters cannot modify private candidate portraits',r.status===403);
  r=await call('GET','/api/profile/photo/status','cand-token');
  mark('Private portrait state available to candidate',r.status===200&&r.data.hasPhoto);
  r=await call('PATCH','/api/recruiter-requests/'+requestId+'/status','rec-token',{status:'VALIDEE'});
  mark('Recruiter denied moderation',r.status===403);
  r=await call('PATCH','/api/recruiter-requests/'+requestId+'/status','adm-token',{status:'VALIDEE'});
  mark('Admin can approve',r.status===200);
  r=await call('GET','/api/jobs/public');
  mark('Public listing redacts email and phone',r.status===200&&r.data.items.length===1&&
    !JSON.stringify(r.data.items).includes('test@example.com')&&
    !JSON.stringify(r.data.items).includes('+212612345678'));
  r=await call('GET','/api/jobs/public/'+requestId+'/workplace-photo');
  mark('Approved workplace photo becomes public',r.status===200&&r.data.photo===true);
  r=await call('POST','/api/applications','cand-token',{jobId:requestId,consentToIntro:true,application:{experienceYears:3,lastPosition:'Serveur',skills:['Service client','Hygiène'],availability:'Immédiatement',desiredCity:'Casablanca',contractPreference:'CDI',earliestStart:'2026-12-01',phone:'+212612345678',motivation:'Je possède une expérience de plusieurs années en service et je souhaite rejoindre une nouvelle équipe.'}});
  mark('Candidate application with professional dossier recorded',r.status===201&&r.data.item.id===applicationId&&r.data.item.profile.application.skills.length===2);
  r=await call('GET','/api/applications','adm-token');
  mark('Admin sees application',r.status===200&&r.data.items.length===1);
  r=await call('GET','/api/applications','rec-token');
  mark('Recruiter does not see application before assignment',r.status===200&&r.data.items.length===0);
  r=await call('PATCH','/api/applications/'+applicationId+'/assign','adm-token',{requestId});
  mark('Admin assigns recruiter',r.status===200);
  r=await call('GET','/api/applications','rec-token');
  mark('Recruiter receives assigned application without candidate email',r.status===200&&r.data.items.length===1&&r.data.items[0].candidateEmail===undefined);
  r=await call('GET','/api/applications/'+applicationId+'/messages','other-token');
  mark('Another candidate cannot access chat',r.status===403);
  r=await call('POST','/api/applications/'+applicationId+'/messages','cand-token',{body:'Bonjour recrutement'});
  mark('Candidate can send message',r.status===201);
  r=await call('GET','/api/applications/'+applicationId+'/messages','rec-token');
  mark('Recruiter sees candidate message',r.status===200&&r.data.items.some(m=>m.body==='Bonjour recrutement'));
  console.log('PASS '+out.length+' / '+out.length+' simulated API cross-account tests (NO real accounts or DB mutations).');
}
run().catch(error=>{console.error(error);process.exitCode=1;});