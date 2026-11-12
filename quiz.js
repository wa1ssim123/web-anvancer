import { requireRole } from "/mihna-global.js";import { insertItem,queryItems,patchItemFields } from "/js/wix/items.js";const auth=await requireRole(['candidate']);if(!auth)throw new Error('auth');const qs=new URLSearchParams(location.search),role=qs.get('role')||'Serveur',returnTo=qs.get('returnTo')||'',setup=qs.get('setup')==='1';document.getElementById('quizRole').textContent=role;
const BANK={
'Serveur':[['Un client signale une allergie. Que faites-vous en premier ?',['Je promets que le plat est sûr','Je vérifie la recette/procédure et informe cuisine/responsable','Je retire seulement la garniture'],1],['Pendant un rush, une table cherche votre regard.',['Je l’ignore jusqu’à finir tout le reste','Je confirme visuellement que je l’ai vue puis je priorise','Je demande à un autre client de patienter'],1],['Une erreur de commande arrive.',['Chercher le coupable devant le client','Reconnaître, corriger et informer du délai','Dire que la cuisine est responsable'],1],['La meilleure posture de service est…',['Calme, attentive et professionnelle','Très familière avec tous les clients','Silencieuse sans jamais confirmer'],0],['En fin de service…',['Je pars dès la dernière table','Je transmets les informations et remets la zone en ordre','Je laisse les détails au prochain shift'],1]],
'Barista':[['La buse vapeur doit être…',['Essuyée et purgée après chaque utilisation','Nettoyée seulement le soir','Trempée dans le lait'],0],['Un espresso coule beaucoup trop vite.',['Je sers quand même','Je vérifie mouture, dose et préparation','J’ajoute de l’eau'],1],['Pendant le rush…',['Je travaille en séquence et garde les boissons identifiables','Je prépare plusieurs boissons sans suivre les tickets','Je ne nettoie qu’à la fermeture'],0],['Pour la micro-mousse…',['On chauffe le lait jusqu’à ébullition','On intègre un peu d’air puis on crée un mouvement régulier','On ajoute de la mousse à la cuillère'],1],['Si un stock va manquer…',['J’attends la rupture','Je préviens l’équipe avant la rupture','Je cache le dernier paquet'],1]],
'Chef de cuisine':[['La mise en place sert surtout à…',['Préparer le poste et les priorités avant le service','Décorer la cuisine','Éviter toute communication'],0],['Une erreur pendant le service doit être…',['Cachée','Signalée rapidement pour être corrigée','Attribuée à quelqu’un d’autre'],1],['Les produits crus et prêts à manger…',['Peuvent partager les mêmes outils sans nettoyage','Doivent éviter les contaminations croisées','Sont identiques en stockage'],1],['Pendant la brigade…',['Les annonces doivent être courtes et claires','Personne ne doit répondre','Tout le monde parle en même temps'],0],['La vitesse professionnelle vient surtout…',['De gestes précis et répétés','De supprimer les contrôles','De courir dans la cuisine'],0]],
'default':[['L’hygiène des mains est nécessaire…',['Seulement au début','Aux moments critiques pendant tout le service','Seulement avec des gants'],1],['Un client pose une question que vous ne maîtrisez pas.',['Inventer une réponse','Vérifier ou demander au responsable','Changer de sujet'],1],['Une équipe fiable communique…',['Clairement et avec respect','Uniquement en cas de problème grave','Avec des messages longs pendant le rush'],0],['Un sol glissant doit être…',['Ignoré','Signalé et sécurisé','Recouvert de carton'],1],['Après une mission…',['Identifier ce qu’on peut améliorer','Ne jamais demander de feedback','Oublier immédiatement'],0]]};
const questions=BANK[role]||BANK.default,form=document.getElementById('domainQuiz');form.innerHTML=questions.map((q,i)=>`<fieldset><legend><b>${String(i+1).padStart(2,'0')}</b>${q[0]}</legend>${q[1].map((a,j)=>`<label><input type="radio" name="q${i}" value="${j}" required><span>${a}</span></label>`).join('')}</fieldset>`).join('')+'<button class="cta-main" type="submit">Voir mon score ↗</button>';
form.onsubmit=async event=>{
 event.preventDefault();
 if(!form.reportValidity())return;
 const button=form.querySelector('button[type=submit]');
 const result=document.getElementById('quizResult');
 const fd=new FormData(form);
 let correct=0;const answers=[];
 questions.forEach((question,i)=>{
  const selected=fd.get('q'+i);
  if(selected===null)return;
  const answer=Number(selected);
  answers.push(answer);
  if(answer===question[2])correct++;
 });
 if(answers.length!==questions.length){
  result.hidden=false;
  result.innerHTML='<p role="alert">Veuillez répondre à toutes les questions.</p>';
  return;
 }
 const score=Math.round(correct/questions.length*100),passed=score>=60;
 button.disabled=true;button.textContent='Enregistrement du résultat…';
 try{
  await insertItem('QuizAttempts',{jobFamily:role,score,passed,answersJson:JSON.stringify(answers)});
  const profile=(await queryItems('CandidateProfiles',{limit:1})).items[0];
  if(profile)await patchItemFields('CandidateProfiles',profile._id,{quizScore:score,quizPassed:passed});
  result.hidden=false;
  result.innerHTML='<span>'+(passed?'✓ BASES VALIDÉES':'↻ À RENFORCER')+'</span><h2>'+score+'%</h2><p>'+(passed?'Votre résultat a été enregistré. Vous pouvez continuer votre candidature.':'Votre résultat a été enregistré. Passez par Academy puis retentez le quiz.')+'</p>';
  if(passed){
    const destination=returnTo.startsWith('/')&&!returnTo.startsWith('//')?returnTo:(setup?'/account.html':'/jobs.html');
    setTimeout(()=>location.assign(destination),900);
  }else{
    result.insertAdjacentHTML('beforeend','<a class="soft-btn" href="/academy.html">Ouvrir Horenova Academy →</a>');
  }
 }catch(error){
  result.hidden=false;
  result.innerHTML='<p role="alert" style="color:#ae2b19">Votre score n’a pas été confirmé. '+String(error?.message||'Réessayez').replace(/[<>]/g,'')+'</p>';
 }finally{
  button.disabled=false;
  button.textContent='Voir mon score ↗';
 }
};