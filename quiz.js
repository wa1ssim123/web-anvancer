import { requireRole } from "/mihna-global.js";import { insertItem,queryItems,patchItemFields } from "/js/wix/items.js";const auth=await requireRole(['candidate']);if(!auth)throw new Error('auth');const qs=new URLSearchParams(location.search),role=qs.get('role')||'Serveur',returnTo=qs.get('returnTo')||'',setup=qs.get('setup')==='1';document.getElementById('quizRole').textContent=role;
const BANK={
'Serveur':[['Un client signale une allergie. Que faites-vous en premier ?',['Je promets que le plat est sûr','Je vérifie la recette/procédure et informe cuisine/responsable','Je retire seulement la garniture'],1],['Pendant un rush, une table cherche votre regard.',['Je l’ignore jusqu’à finir tout le reste','Je confirme visuellement que je l’ai vue puis je priorise','Je demande à un autre client de patienter'],1],['Une erreur de commande arrive.',['Chercher le coupable devant le client','Reconnaître, corriger et informer du délai','Dire que la cuisine est responsable'],1],['La meilleure posture de service est…',['Calme, attentive et professionnelle','Très familière avec tous les clients','Silencieuse sans jamais confirmer'],0],['En fin de service…',['Je pars dès la dernière table','Je transmets les informations et remets la zone en ordre','Je laisse les détails au prochain shift'],1]],
'Barista':[['La buse vapeur doit être…',['Essuyée et purgée après chaque utilisation','Nettoyée seulement le soir','Trempée dans le lait'],0],['Un espresso coule beaucoup trop vite.',['Je sers quand même','Je vérifie mouture, dose et préparation','J’ajoute de l’eau'],1],['Pendant le rush…',['Je travaille en séquence et garde les boissons identifiables','Je prépare plusieurs boissons sans suivre les tickets','Je ne nettoie qu’à la fermeture'],0],['Pour la micro-mousse…',['On chauffe le lait jusqu’à ébullition','On intègre un peu d’air puis on crée un mouvement régulier','On ajoute de la mousse à la cuillère'],1],['Si un stock va manquer…',['J’attends la rupture','Je préviens l’équipe avant la rupture','Je cache le dernier paquet'],1]],
'Chef de cuisine':[['La mise en place sert surtout à…',['Préparer le poste et les priorités avant le service','Décorer la cuisine','Éviter toute communication'],0],['Une erreur pendant le service doit être…',['Cachée','Signalée rapidement pour être corrigée','Attribuée à quelqu’un d’autre'],1],['Les produits crus et prêts à manger…',['Peuvent partager les mêmes outils sans nettoyage','Doivent éviter les contaminations croisées','Sont identiques en stockage'],1],['Pendant la brigade…',['Les annonces doivent être courtes et claires','Personne ne doit répondre','Tout le monde parle en même temps'],0],['La vitesse professionnelle vient surtout…',['De gestes précis et répétés','De supprimer les contrôles','De courir dans la cuisine'],0]],
'default':[['L’hygiène des mains est nécessaire…',['Seulement au début','Aux moments critiques pendant tout le service','Seulement avec des gants'],1],['Un client pose une question que vous ne maîtrisez pas.',['Inventer une réponse','Vérifier ou demander au responsable','Changer de sujet'],1],['Une équipe fiable communique…',['Clairement et avec respect','Uniquement en cas de problème grave','Avec des messages longs pendant le rush'],0],['Un sol glissant doit être…',['Ignoré','Signalé et sécurisé','Recouvert de carton'],1],['Après une mission…',['Identifier ce qu’on peut améliorer','Ne jamais demander de feedback','Oublier immédiatement'],0]]};

const QUIZ_I18N={
en:{
 'Serveur':[
 ['A guest reports a food allergy. What should you do first?',['Promise the meal is safe','Check ingredients and procedure, and alert the kitchen or manager','Simply remove the garnish']],
 ['During a rush, a table tries to get your attention.',['Ignore them until every other task is finished','Acknowledge them and prioritize appropriately','Ask another guest to wait']],
 ['An incorrect order is delivered.',['Blame someone in front of the guest','Acknowledge the mistake, fix it, and explain the delay','Say it is the kitchen’s fault']],
 ['The best service attitude is…',['Calm, attentive and professional','Overly familiar with every guest','Silent, without acknowledging requests']],
 ['At the end of a shift…',['Leave as soon as the last table departs','Hand over important information and reset the workspace','Leave details for the next shift']]],
 'Barista':[
 ['The steam wand should be…',['Wiped and purged after each use','Cleaned only at night','Left soaking in milk']],
 ['An espresso extracts far too quickly.',['Serve it anyway','Check grind, dose and preparation','Add more water']],
 ['During peak service…',['Keep drinks organized and tickets identifiable','Prepare drinks without tracking tickets','Only clean at closing']],
 ['For good microfoam…',['Boil the milk','Introduce a little air and create a smooth vortex','Spoon in foam']],
 ['If supplies are about to run out…',['Wait until there is nothing left','Alert the team before running out','Hide the final pack']]],
 'Chef de cuisine':[
 ['The main purpose of mise en place is…',['Preparing the station and priorities before service','Decorating the kitchen','Avoiding communication']],
 ['An error during service should be…',['Hidden','Reported promptly so it can be fixed','Blamed on someone else']],
 ['Raw and ready-to-eat foods…',['Can share tools without cleaning','Must be protected from cross-contamination','Can always be stored the same way']],
 ['In a kitchen brigade…',['Announcements should be short and clear','Nobody should respond','Everyone should speak at once']],
 ['Professional speed mainly comes from…',['Precise, practiced movements','Removing safety checks','Running around the kitchen']]],
 'default':[
 ['Hand hygiene is necessary…',['Only at the start','At critical moments throughout service','Only when wearing gloves']],
 ['A customer asks something you do not know.',['Make up an answer','Check or ask a supervisor','Change the topic']],
 ['A reliable team communicates…',['Clearly and respectfully','Only in major emergencies','With long messages during rush']],
 ['A slippery floor must be…',['Ignored','Reported and made safe','Covered with cardboard']],
 ['After an assignment…',['Identify what could be improved','Never ask for feedback','Forget everything immediately']]]
},
ar:{
 'Serveur':[
 ['أخبرك زبون بأن لديه حساسية غذائية. ما أول خطوة؟',['تؤكد له أن الطبق آمن دون التحقق','تتحقق من المكونات والإجراءات وتبلغ المطبخ أو المسؤول','تزيل الزينة من الطبق فقط']],
 ['خلال فترة الازدحام تحاول طاولة لفت انتباهك.',['تتجاهلها حتى تنهي كل العمل','تؤكد أنك انتبهت ثم ترتب الأولويات','تطلب من زبون آخر الانتظار']],
 ['تم تقديم طلب خاطئ.',['تلوم زميلاً أمام الزبون','تعترف بالخطأ وتصححه وتوضح مدة الانتظار','تقول إن المطبخ مسؤول']],
 ['أفضل سلوك في الخدمة هو…',['الهدوء والانتباه والاحترافية','المبالغة في الألفة مع كل الزبائن','الصمت دون تأكيد الطلبات']],
 ['عند انتهاء الخدمة…',['تغادر فور خروج آخر طاولة','تسلم المعلومات وترتب مكان العمل','تترك التفاصيل للفريق التالي']]],
 'Barista':[
 ['يجب تنظيف أنبوب البخار…',['ومسحه وتفريغه بعد كل استعمال','فقط عند نهاية اليوم','بتركه في الحليب']],
 ['تدفق الإسبريسو سريع جداً.',['تقدمه كما هو','تفحص الطحن والكمية والتحضير','تضيف الماء']],
 ['خلال الازدحام…',['تنظم المشروبات والتذاكر بوضوح','تحضر الطلبات دون متابعتها','تترك التنظيف حتى الإغلاق']],
 ['للحصول على رغوة حليب دقيقة…',['تغلي الحليب','تدخل قليلاً من الهواء وتحافظ على حركة منتظمة','تضيف الرغوة بالملعقة']],
 ['عندما يوشك المخزون على النفاد…',['تنتظر نفاده','تخبر الفريق مسبقاً','تخفي آخر عبوة']]],
 'Chef de cuisine':[
 ['الغرض من التحضير المسبق هو…',['تحضير المحطة والأولويات قبل الخدمة','تزيين المطبخ','تجنب التواصل']],
 ['عند وقوع خطأ أثناء الخدمة يجب…',['إخفاؤه','إبلاغ الفريق سريعاً لتصحيحه','إلقاء اللوم على الآخرين']],
 ['المواد النيئة والأطعمة الجاهزة للأكل…',['يمكن أن تستخدم الأدوات نفسها دون تنظيف','يجب حمايتها من التلوث المتبادل','تخزن دائماً بالطريقة نفسها']],
 ['في فريق المطبخ…',['يجب أن تكون التعليمات قصيرة وواضحة','لا ينبغي لأحد الرد','يتحدث الجميع في وقت واحد']],
 ['تنتج السرعة المهنية أساساً من…',['حركات دقيقة ومتقنة بالتدريب','إلغاء إجراءات السلامة','الجري داخل المطبخ']]],
 'default':[
 ['متى تكون نظافة اليدين ضرورية؟',['في بداية الدوام فقط','في اللحظات الأساسية طوال الخدمة','عند ارتداء القفازات فقط']],
 ['سألك زبون شيئاً لا تعرفه.',['تخترع إجابة','تتحقق أو تسأل المسؤول','تغير الموضوع']],
 ['التواصل في الفريق الجيد يكون…',['واضحاً ومحترماً','فقط عند وقوع مشكلة كبيرة','برسائل طويلة أثناء الازدحام']],
 ['أرضية زلقة يجب…',['تجاهلها','التنبيه إليها وتأمين المكان','تغطيتها بالكرتون']],
 ['بعد إتمام مهمة…',['تحدد ما يمكن تحسينه','لا تطلب ملاحظات أبداً','تنسى كل ما حدث']]]
}};
const QUIZ_COPY={
 fr:{title:'Un quiz clair pour votre métier.',description:'Répondez aux cinq questions. Seuil de validation : 60 %. Votre résultat est sauvegardé pour ce métier.',answered:'réponse(s) sur',submit:'Valider mes réponses',saving:'Enregistrement du résultat…',success:'Bases métier validées',retry:'À renforcer',successText:'Votre quiz métier a été enregistré. Vous pouvez poursuivre votre inscription ou postuler aux offres de ce métier.',retryText:'Vous pouvez réessayer après vous être entraîné.',continue:'Continuer',missing:'Répondez aux cinq questions.',error:'Le résultat ne peut pas être confirmé.',retryLink:'Ouvrir Academy'},
 en:{title:'A clear quiz for your profession.',description:'Answer all five questions. Pass mark: 60%. Your result is saved for this profession.',answered:'answer(s) out of',submit:'Submit my answers',saving:'Saving result…',success:'Profession basics passed',retry:'More practice needed',successText:'Your profession quiz is saved. You can continue registration or apply for matching jobs.',retryText:'You can try again after some practice.',continue:'Continue',missing:'Answer all five questions.',error:'The result could not be confirmed.',retryLink:'Open Academy'},
 ar:{title:'اختبار واضح لمهنتك.',description:'أجب عن الأسئلة الخمسة. الحد الأدنى للنجاح 60٪. تُحفظ النتيجة لهذه المهنة.',answered:'إجابة من أصل',submit:'تأكيد إجاباتي',saving:'جارٍ حفظ النتيجة…',success:'تم اجتياز أساسيات المهنة',retry:'تحتاج إلى مزيد من التدريب',successText:'تم حفظ نتيجة اختبار مهنتك. يمكنك إتمام التسجيل أو الترشح للوظائف المناسبة.',retryText:'يمكنك المحاولة مجدداً بعد التدريب.',continue:'متابعة',missing:'أجب عن الأسئلة الخمسة.',error:'تعذر تأكيد حفظ النتيجة.',retryLink:'افتح الأكاديمية'}
};
let quizLang='fr';try{const selected=localStorage.getItem('mihna-lang');if(['fr','en','ar'].includes(selected))quizLang=selected;}catch{}
const copy=QUIZ_COPY[quizLang];
const sourceQuestions=BANK[role]||BANK.default;
const translated=QUIZ_I18N[quizLang]?.[BANK[role]?role:'default'];
const localizedQuestions=translated?sourceQuestions.map((q,i)=>[translated[i][0],translated[i][1],q[2]]):sourceQuestions;
const quizHeading=document.querySelector('.quiz-exam-head h1');if(quizHeading)quizHeading.textContent=copy.title;
const quizIntro=document.querySelector('.quiz-exam-head p');if(quizIntro)quizIntro.textContent=copy.description;
const quizSection=document.querySelector('.quiz-exam');if(quizSection)quizSection.dir=quizLang==='ar'?'rtl':'ltr';

const questions=localizedQuestions,form=document.getElementById('domainQuiz');form.innerHTML='<div class="hn-quiz-progress" role="status" style="font-weight:800;padding:12px 16px;color:#16463e;background:#e0efe6;border-radius:12px"><span id="hnQuizAnswered">0 / '+questions.length+'</span></div>'+questions.map((q,i)=>`<fieldset><legend><b>${String(i+1).padStart(2,'0')}</b>${q[0]}</legend>${q[1].map((a,j)=>`<label><input type="radio" name="q${i}" value="${j}" required><span>${a}</span></label>`).join('')}</fieldset>`).join('')+'<button class="cta-main" type="submit">'+copy.submit+' ↗</button>';
form.addEventListener('change',()=>{const answered=questions.filter((_,i)=>form.querySelector('input[name="q'+i+'"]:checked')).length;document.getElementById('hnQuizAnswered').textContent=answered+' / '+questions.length;});
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
  result.textContent=copy.missing;
  return;
 }
 const score=Math.round(correct/questions.length*100),passed=score>=60;
 button.disabled=true;button.textContent=copy.saving;
 try{
  const saved=await insertItem('QuizAttempts',{jobFamily:role,score,passed,answersJson:JSON.stringify(answers)});
  if(!saved?._id)throw Error(copy.error);
  const profile=(await queryItems('CandidateProfiles',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:1})).items[0];
  if(profile){try{await patchItemFields('CandidateProfiles',profile._id,{quizScore:score,quizPassed:passed});}catch(error){console.warn('Quiz attempt saved; optional profile score sync deferred.',error?.message||'cms');}}
  result.hidden=false;
  result.innerHTML='<span>'+(passed?'✓ '+copy.success:'↻ '+copy.retry)+'</span><h2>'+score+'%</h2><p>'+(passed?copy.successText:copy.retryText)+'</p>';
  if(passed){
    const destination=returnTo.startsWith('/')&&!returnTo.startsWith('//')?returnTo:(setup?'/account.html':'/jobs.html');
    const action=document.createElement('a');action.className='cta-main button-link';action.href=destination;action.textContent=copy.continue+' ↗';result.appendChild(action);
  }else{
    const action=document.createElement('a');action.className='soft-btn';action.href='/academy.html';action.textContent=copy.retryLink+' →';result.appendChild(action);
  }
 }catch(error){
  result.hidden=false;
  result.textContent=copy.error+' '+String(error?.message||'').replace(/[<>]/g,'');
 }finally{
  button.disabled=false;
  button.textContent=copy.submit+' ↗';
 }
};