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

/* Telegram public channels use https://t.me/<public_username>.
 * Private invite links are intentionally not accepted: this feature
 * advertises a public news channel, not a private group or personal chat.
 */
function normalizeTelegramUrl(value){
 if(typeof value!=='string'||value.length>300)return null;
 let link;
 try{link=new URL(value.trim())}catch{return null}
 if(link.protocol!=='https:'||!['t.me','telegram.me','www.t.me','www.telegram.me'].includes(link.hostname)||
    link.port||link.username||link.password||link.search||link.hash)return null;
 const match=link.pathname.match(/^\/([A-Za-z][A-Za-z0-9_]{4,31})\/?$/);
 if(!match||['joinchat','addstickers','share','login','iv','s','proxy','socks','blog','faq','apps'].includes(match[1].toLowerCase()))return null;
 return 'https://t.me/'+match[1];
}

function createCommunityHandler({pool,json,read,rate,auth,requireRole,error,publisher}){
 return async function communityHandler(req,res,path,method){
  if(path==='/api/community/publications' && method==='GET'){
   const user=await auth(req);requireRole(user,['admin']);
   rate(user.id+':social-publications',45,60);
   return json(res,200,await publisher.status(),{'Cache-Control':'private, no-store'});
  }
  const socialRetry=path.match(/^\/api\/community\/publications\/([0-9a-f-]+)\/retry$/i);
  if(socialRetry && method==='PATCH'){
   const user=await auth(req);requireRole(user,['admin']);
   rate(user.id+':social-retry',8,3600);
   if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(socialRetry[1]))
    throw error(422,'Identifiant de publication invalide.');
   const d=await read(req,600);
   if(d.confirmedReviewed!==true)throw error(422,'Vérifiez le canal avant de relancer. Un message peut déjà avoir été envoyé.');
   const ok=await publisher.retry(socialRetry[1]);
   if(!ok)throw error(409,'Publication non relançable. Vérifiez son statut et la validation de l’annonce.');
   await pool.query("INSERT INTO hr_audit(actor_wix_id,event_type,detail) VALUES($1,'TELEGRAM_POST_RETRY',$2)",
    [user.id,JSON.stringify({requestId:socialRetry[1]})]);
   return json(res,200,{ok:true,queued:true});
  }

  if(path==='/api/community/telegram'){
   if(method==='GET'){
    const r=await pool.query("SELECT url,updated_at FROM hr_social_channels WHERE channel_type='telegram' LIMIT 1");
    const item=r.rows[0]||null;
    return json(res,200,{active:!!item,url:item?.url||null,updatedAt:item?.updated_at||null},
      {'Cache-Control':'public, max-age=45'});
   }
   const user=await auth(req);
   requireRole(user,['admin']);
   rate(user.id+':telegram-channel-setting',12,3600);
   if(method==='PATCH'){
    const data=await read(req,1500);
    const url=normalizeTelegramUrl(data.url);
    if(!url)throw error(422,'Collez le lien public officiel de votre chaîne Telegram (https://t.me/nom_du_canal).');
    const saved=await pool.query(
     "INSERT INTO hr_social_channels(channel_type,url,updated_by) VALUES('telegram',$1,$2) ON CONFLICT(channel_type) DO UPDATE SET url=EXCLUDED.url,updated_by=EXCLUDED.updated_by,updated_at=now() RETURNING url,updated_at",
     [url,user.id]);
    await pool.query("INSERT INTO hr_audit(actor_wix_id,event_type,detail) VALUES($1,'TELEGRAM_CHANNEL_LINK_UPDATED',$2)",
      [user.id,JSON.stringify({channel:'telegram'})]);
    return json(res,200,{ok:true,active:true,url:saved.rows[0].url,updatedAt:saved.rows[0].updated_at});
   }
   if(method==='DELETE'){
    await pool.query("DELETE FROM hr_social_channels WHERE channel_type='telegram'");
    await pool.query("INSERT INTO hr_audit(actor_wix_id,event_type,detail) VALUES($1,'TELEGRAM_CHANNEL_LINK_REMOVED',$2)",
      [user.id,JSON.stringify({channel:'telegram'})]);
    return json(res,200,{ok:true,active:false,url:null});
   }
   throw error(405,'Méthode non autorisée.');
  }
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
module.exports={normalizeChannelUrl,normalizeTelegramUrl,createCommunityHandler};
