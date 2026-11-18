'use strict';
/** HORENOVA national talent browser regression, 130 synthetic profiles.
 * In memory only: no real users, Wix writes or production calls.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../live-data.js'),'utf8')
  .replace(/^import\s+.*?;\s*$/gm,'');
const mockTalents=Array.from({length:130},(_,i)=>({
  _id:'qa-talent-'+(i+1),
  jobFamily:i%2===0?'Serveur':'Barista',
  city:i%3===0?'Oujda':'Casablanca'
}));
let listener,renderCount=0,role='',city='';
const browserWindow={
  addEventListener(name,fn){if(name==='load')listener=fn;},
  renderTalents(){renderCount++;},
  renderTalentDetail(){}
};
const browserDocument={
  getElementById(id){
    if(id==='talentRoleFilter')return {value:role};
    if(id==='talentCityFilter')return {value:city};
    return null;
  }
};
async function queryItems(collection,query){
  if(collection==='Jobs')return {items:[],hasNext:false};
  assert.equal(collection,'CandidatePublicProfiles');
  const filtered=mockTalents.filter(t=>(query.filters||[]).every(f=>
    f.field==='city'?t.city===f.value:t.jobFamily===f.value));
  const start=query.skip||0;
  const items=filtered.slice(start,start+(query.limit||20));
  return {items,hasNext:start+items.length<filtered.length};
}
const fetchMock=async()=>({ok:true,json:async()=>({items:[]})});
new Function('window','document','queryItems','fetch','console',source)(
  browserWindow,browserDocument,queryItems,fetchMock,{warn(){}}
);
async function run(){
  assert.equal(typeof listener,'function','HORENOVA load event is registered');
  await listener();
  assert.equal(browserWindow.HORENOVA_LIVE_TALENTS.length,60);
  assert.equal(browserWindow.HORENOVA_TALENTS_HAS_NEXT,true);
  await browserWindow.HORENOVA_LOAD_MORE_TALENTS();
  assert.equal(browserWindow.HORENOVA_LIVE_TALENTS.length,120);
  await browserWindow.HORENOVA_LOAD_MORE_TALENTS();
  assert.equal(browserWindow.HORENOVA_LIVE_TALENTS.length,130);
  assert.equal(browserWindow.HORENOVA_TALENTS_HAS_NEXT,false);
  city='Oujda';role='Serveur';
  await browserWindow.HORENOVA_SEARCH_TALENTS();
  const wanted=mockTalents.filter(t=>t.city==='Oujda'&&t.jobFamily==='Serveur').length;
  assert.equal(browserWindow.HORENOVA_LIVE_TALENTS.length,wanted);
  assert.ok(browserWindow.HORENOVA_LIVE_TALENTS.every(t=>t.city==='Oujda'&&t.role==='Serveur'));
  assert.ok(renderCount>=4);
  console.log('PASS 5 nationwide talent pagination/filter/rerender tests (mocked).');
}
run().catch(err=>{console.error(err);process.exitCode=1;});