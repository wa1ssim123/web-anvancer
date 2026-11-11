import {accessToken} from '/js/wix/client.js';
const BASE='https://horenova-hub-api.onrender.com';
export async function hub(path,{method='GET',body}={}){
  const token=await accessToken(),headers={Authorization:token};
  const opts={method,headers,mode:'cors',cache:'no-store'};
  if(body!==undefined){headers['Content-Type']='application/json';opts.body=JSON.stringify(body);}
  let response;
  try{response=await fetch(BASE+path,opts);}catch{throw Error('Le serveur sécurisé HORENOVA est indisponible.');}
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.error||'Erreur '+response.status);
  return data;
}
export async function hubPhoto(path){
  const token=await accessToken();
  const r=await fetch(BASE+path,{headers:{Authorization:token},cache:'no-store',mode:'cors'});
  if(!r.ok)return null;
  const blob=await r.blob();
  return blob.type==='image/jpeg'?URL.createObjectURL(blob):null;
}
export async function hubUploadPhoto(blob){
  const token=await accessToken();
  const r=await fetch(BASE+'/api/profile/photo',{method:'POST',headers:{Authorization:token,'Content-Type':'image/jpeg'},body:blob,cache:'no-store'});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(d.error||'Envoi de la photo impossible');
  return d;
}