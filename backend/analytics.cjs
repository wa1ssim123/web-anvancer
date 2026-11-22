'use strict';
/* HORENOVA admin analytics.
 * Historic member-role counts and Wix analytics are imported from verified Wix data.
 * Future first-party visits store only SHA-256 hashes of random browser/session UUIDs:
 * no raw ID, IP address, user agent, email, or visited path is persisted.
 * Visitor estimate = distinct browsers, not guaranteed distinct human beings.
 */
const crypto = require('node:crypto');

function createAnalyticsHandler({pool,json,read,rate,auth,requireRole,error,uuid}) {
 const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
 async function handler(req,res,path,method) {
  if(path==='/api/analytics/visit' && method==='POST') {
   const origin=req.headers?.origin;
   if(!['https://horenova.com','https://www.horenova.com','https://horenova-site-officiel.onrender.com'].includes(origin))
    throw error(403,'Origine de visite non autorisée.');
   rate('analytics-ingest:'+String(req.socket?.remoteAddress||'unknown'),600,60);
   const data=await read(req,1200);
   const browserId=typeof data.browserId==='string'?data.browserId:'';
   const sessionId=typeof data.sessionId==='string'?data.sessionId:'';
   if(!uuid(browserId)||!uuid(sessionId))throw error(422,'Identifiants de visite invalides.');
   // The client controls the session ID. A repeated navigation is not a second visit.
   await pool.query(
    'INSERT INTO hr_analytics_sessions(session_hash,browser_hash) VALUES($1,$2) ON CONFLICT(session_hash) DO NOTHING',
    [hash(sessionId),hash(browserId)]
   );
   return json(res,200,{ok:true});
  }
  if(path==='/api/analytics/role-sync' && method==='POST') {
   const user=await auth(req);
   requireRole(user,['candidate','recruiter']);
   rate(user.id+':analytics-role',12,3600);
   // user.role is independently resolved from the signed Wix identity and their OWN
   // AccountRoles record by auth(req). Never trust a role sent by the browser.
   await pool.query(
    "INSERT INTO hr_analytics_roles(member_wix_id,role) VALUES($1,$2) ON CONFLICT(member_wix_id) DO UPDATE SET role=excluded.role,verified_at=now()",
    [user.id,user.role]
   );
   return json(res,200,{ok:true});
  }
  if(path==='/api/analytics/admin' && method==='GET') {
   const user=await auth(req);
   requireRole(user,['admin']);
   rate(user.id+':analytics-read',45,60);
   const [roles,visits,wix,history,signups,wixDaily]=await Promise.all([
    pool.query("SELECT role,COUNT(*)::integer AS total FROM hr_analytics_roles GROUP BY role"),
    pool.query(
     "SELECT COUNT(*)::integer AS sessions,COUNT(DISTINCT browser_hash)::integer AS unique_browsers,COUNT(*) FILTER(WHERE started_at>=date_trunc('day',now()))::integer AS today_sessions,COUNT(*) FILTER(WHERE started_at>=now()-interval '7 days')::integer AS last_7_days,MIN(started_at) AS first_recorded FROM hr_analytics_sessions"
    ),
    pool.query('SELECT first_day,through_day,sessions,unique_visitors,imported_at FROM hr_analytics_wix_summary WHERE id=true'),
    pool.query("SELECT started_at::date AS day,COUNT(*)::integer AS sessions,COUNT(DISTINCT browser_hash)::integer AS unique_browsers FROM hr_analytics_sessions WHERE started_at>=now()-interval '30 days' GROUP BY started_at::date ORDER BY day"),
    pool.query("SELECT registered_at::date AS day,role,COUNT(*)::integer AS total FROM hr_analytics_roles WHERE registered_at>=now()-interval '30 days' GROUP BY registered_at::date,role ORDER BY day"),
    pool.query("SELECT day,sessions,daily_unique_visitors FROM hr_analytics_wix_daily ORDER BY day")
   ]);
   const byRole=Object.fromEntries(roles.rows.map(row=>[row.role,Number(row.total)]));
   const stat=visits.rows[0]||{},old=wix.rows[0]||null;
   return json(res,200,{
    registrations:{
     candidates:byRole.candidate||0,
     recruiters:byRole.recruiter||0,
     total:(byRole.candidate||0)+(byRole.recruiter||0),
     source:'Wix AccountRoles + inscription vérifiée en continu',
     recent:signups.rows.map(row=>({date:row.day,role:row.role,count:Number(row.total)}))
    },
    wixHistory:old?{
     from:old.first_day,through:old.through_day,sessions:old.sessions,
     uniqueVisitors:old.unique_visitors,importedAt:old.imported_at,
     source:'Wix Analytics (historique du site Wix, couverture Render non garantie)',
     daily:wixDaily.rows.map(r=>({date:r.day,sessions:Number(r.sessions),uniqueVisitors:Number(r.daily_unique_visitors)}))
    }:null,
    firstParty:{
     sessions:Number(stat.sessions||0),
     uniqueBrowsers:Number(stat.unique_browsers||0),
     todaySessions:Number(stat.today_sessions||0),
     last7Days:Number(stat.last_7_days||0),
     firstRecorded:stat.first_recorded||null,
     source:'Compteur HORENOVA sur navigateur (activé à la publication)',
     daily:history.rows.map(row=>({date:row.day,sessions:Number(row.sessions),uniqueBrowsers:Number(row.unique_browsers)}))
    },
    precision:'Visiteurs uniques = navigateurs distincts estimés, et non personnes identifiées. Les chiffres Wix et le suivi HORENOVA ne sont pas additionnés.'
   });
  }
  throw error(404,'Route de statistiques introuvable.');
 }
 return handler;
}
module.exports={createAnalyticsHandler};
