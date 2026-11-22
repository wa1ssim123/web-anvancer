/* HORENOVA - touch-first shift calendar independent of native iOS date picker. */
export function validShiftDate(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;
 const d=new Date(value+'T12:00:00Z');
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;
}
export function attachShiftCalendar(form,currentLang=()=> 'fr'){
 const field=form.elements.shiftDate,start=form.elements.startDate;
 const toggle=document.getElementById('hnShiftCalendarToggle');
 const panel=document.getElementById('hnShiftCalendar');
 const output=document.getElementById('hnShiftDateSummary');
 const now=new Date();let year=now.getFullYear(),month=now.getMonth();
 const dateText=(y,m,d)=>String(y).padStart(4,'0')+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
 function sync(){
  const good=validShiftDate(field.value);
  output.textContent=good?'Date du shift : '+new Intl.DateTimeFormat('fr-MA',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(field.value+'T12:00:00Z')):'Choisissez la date de votre mission.';
  if(form.elements.kind.value==='shift')start.value=good?field.value:'';
 }
 function close(){panel.hidden=true;toggle.setAttribute('aria-expanded','false')}
 function paint(){
  const lang=currentLang(),locale=lang==='ar'?'ar-MA':lang==='en'?'en-GB':'fr-MA';
  const title=new Intl.DateTimeFormat(locale,{year:'numeric',month:'long'}).format(new Date(year,month,1));
  const daysOfWeek=Array.from({length:7},(_,i)=>new Intl.DateTimeFormat(locale,{weekday:'short'}).format(new Date(2024,0,i+1)));
  const padding=(new Date(year,month,1).getDay()+6)%7;
  const total=new Date(year,month+1,0).getDate();
  const cells=Array.from({length:padding},()=>'<span aria-hidden="true"></span>');
  for(let day=1;day<=total;day++){
   const str=dateText(year,month,day),chosen=str===field.value;
   cells.push('<button type="button" data-hn-day="'+day+'" aria-label="'+str+'" aria-pressed="'+chosen+'" class="'+(chosen?'is-picked':'')+'">'+day+'</button>');
  }
  panel.innerHTML='<div class="hn-shift-cal-head"><button type="button" data-hn-month="-1" aria-label="Mois précédent">‹</button><strong>'+title+'</strong><button type="button" data-hn-month="1" aria-label="Mois suivant">›</button></div><div class="hn-shift-cal-days">'+daysOfWeek.map(x=>'<span>'+x+'</span>').join('')+cells.join('')+'</div>';
 }
 toggle.addEventListener('click',()=>{
  if(!panel.hidden){close();return}
  if(validShiftDate(field.value)){const p=field.value.split('-').map(Number);year=p[0];month=p[1]-1}
  paint();panel.hidden=false;toggle.setAttribute('aria-expanded','true');
 });
 panel.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||!panel.contains(b))return;
  if(b.dataset.hnMonth){const next=new Date(year,month+Number(b.dataset.hnMonth),1);year=next.getFullYear();month=next.getMonth();paint();return}
  if(b.dataset.hnDay){field.value=dateText(year,month,Number(b.dataset.hnDay));field.dispatchEvent(new Event('change',{bubbles:true}));close();toggle.focus()}
 });
 field.addEventListener('change',sync);field.addEventListener('input',sync);sync();
 return {validDate:validShiftDate,sync,close};
}
