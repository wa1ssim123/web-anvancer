'use strict';
/* Official WhatsApp Channel integration, admin-only editing.
 * This never creates a WhatsApp Channel or sends messages to followers.
 * A channel URL is published only if supplied by a verified administrator.
 */
function normalizeChannelUrl(value){
  if(typeof value!=='string'||value.length>300) return null;
  const candidate=value.trim();
  let parsed;
  try{parsed=new URL(candidate)}catch{return null}
  if(parsed.protocol!=='https:'||!['whatsapp.com','www.whatsapp.com'].includes(parsed.hostname)||
     parsed.port||parsed.username||parsed.password||parsed.search||parsed.hash)return null;
  const match=parsed.pathname.match(/^\/channel\/([A-Za-z0-9_-]{12,128})\/?$/);
  return match?'https://whatsapp.com/channel/'+match[1]:null;
}
function createCommunityHandler({pool,json,read,rate,auth,requireRole,error}){
 return async function communityHandler(req,res,path,method){
  if(path!=='/api/community/channel')throw error(404,'Ressource communautaire introuvable.');
  if(method==='GET'){
   const r=await pool.query("SELECT url,updated_at FROM hr_social_channels WHERE channel_type='whatsapp' LIMIT 1");
   const item=r.rows[0]||null;
   // Cached for under a minute; publishing the actual link requires no redeploy.
   return json(res,200,{active:!!item,url:item?.url||null,updatedAt:item?.updated_at||null},
     {'Cache-Control':'public, max-age=45'});
  }
  const user=await auth(req);
  requireRole(user,['admin']);
  rate(user.id+':channel-setting',12,3600);
  if(method==='PATCH'){
   const d=await read(req,1500);
   const url=normalizeChannelUrl(d.url);
   if(!url)throw error(422,'Collez un lien officiel WhatsApp Channels de la forme https://whatsapp.com/channel/…');
   const q=await pool.query(
    "INSERT INTO hr_social_channels(channel_type,url,updated_by) VALUES('whatsapp',$1,$2) ON CONFLICT(channel_type) DO UPDATE SET url=EXCLUDED.url,updated_by=EXCLUDED.updated_by,updated_at=now() RETURNING url,updated_at",
    [url,user.id]
   );
   await pool.query("INSERT INTO hr_audit(actor_wix_id,event_type,detail) VALUES($1,'WHATSAPP_CHANNEL_LINK_UPDATED',$2)",[user.id,JSON.stringify({channel:'whatsapp'})]);
   return json(res,200,{ok:true,active:true,url:q.rows[0].url,updatedAt:q.rows[0].updated_at});
  }
  if(method==='DELETE'){
   await pool.query("DELETE FROM hr_social_channels WHERE channel_type='whatsapp'");
   await pool.query("INSERT INTO hr_audit(actor_wix_id,event_type,detail) VALUES($1,'WHATSAPP_CHANNEL_LINK_REMOVED',$2)",[user.id,JSON.stringify({channel:'whatsapp'})]);
   return json(res,200,{ok:true,active:false,url:null});
  }
  throw error(405,'Méthode non autorisée.');
 };
}
module.exports={normalizeChannelUrl,createCommunityHandler};
