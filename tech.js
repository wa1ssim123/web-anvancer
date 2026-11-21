/* Horenova Tech storefront: no fake checkout, quote request only. */
(() => {
  'use strict';
  const STORAGE = 'horenova-tech-quote-v1';
  const LANGKEY = 'horenova-tech-lang';
  const PHONE = '212648377009'; // Same public business phone shown on Horenova's website.
  const catalog = {
    POS: 'Horenova POS',
    ERP: 'Horenova Gestion',
    NFC: 'Horenova Tap Menu',
    TERMINAL: 'Terminal de caisse tactile',
    PERIPHERALS: 'Périphériques de caisse',
    KDS: 'Écran cuisine KDS'
  };
  const copy = {
    fr: {
      navHome:'Accueil',navShop:'Shop',navBusiness:'Business',quote:'Mon devis',
      heroTitle:'La technologie<br>au service <em>du service.</em>',
      heroCopy:'Une caisse élégante. Une gestion intelligente. Un menu accessible d’un simple geste. Tout un établissement, pensé comme un seul système.',
      exploreSolutions:'Explorer les solutions',tryDemo:'Essayer la démonstration',
      connectedSystem:'ÉCOSYSTÈME CONNECTÉ',
      ecosystemTitle:'La commande circule.<br><em>La gestion suit.</em>',
      flow1:'Table / Menu NFC',flow2:'Caisse / Commandes',flow3:'Stock / Analyses',
      ecosystemCopy:'Notre objectif : relier l’expérience client, l’encaissement et les opérations. Les liaisons de production seront déployées et validées établissement par établissement.',
      catalogEyebrow:'LE CATALOGUE TECH',catalogTitle:'Des solutions pour<br><em>chaque moment du service.</em>',
      catalogCopy:'Sélectionnez les solutions qui vous intéressent. Nous préparons ensuite une proposition adaptée à votre établissement.',
      filterAll:'Tout voir',filterSoftware:'Logiciels',filterNfc:'Menus NFC',filterHardware:'Matériel & packs',
      onRequest:'Sur devis',customMade:'Personnalisable',supplyToConfirm:'Disponibilité à confirmer',plannedSolution:'Solution envisagée',
      posDesc:'Logiciel de caisse tactile : produits, tables, commandes, tickets, historique et clôture de service. Conçu pour se connecter à la gestion.',
      erpDesc:'Stocks, achats, fournisseurs, recettes, consommations et indicateurs. Architecture prévue pour une synchronisation avec la caisse.',
      nfcDesc:'Plaque élégante à fixer sur la table : puce NFC et code QR ouvrant un menu digital sur le téléphone, sans application à installer.',
      terminalTitle:'Terminal tactile',terminalDesc:'Une caisse au design épuré avec écran tactile, à dimensionner selon le logiciel et le rythme de votre établissement.',
      peripheralTitle:'Les essentiels caisse',peripheralDesc:'Imprimante thermique, tiroir-caisse, scanner de codes-barres, afficheur client et accessoires compatibles selon configuration.',
      kdsTitle:'Écran de préparation',kdsDesc:'Une vision claire des commandes à préparer côté cuisine ou bar. Intégration à étudier selon votre installation.',
      addToQuote:'Ajouter au devis',added:'Ajouté au devis',previewMenu:'Voir le menu démo ↗',
      catalogNote:'Les visuels sont des illustrations conceptuelles, pas des photographies de matériel en stock. Tarifs, compatibilités, fonctionnalités et délais à valider avant toute commande.',
      nfcTitle:'Le menu n’est plus<br><em>un objet à distribuer.</em>',
      nfcCopy:'Le client pose son téléphone sur une plaque NFC ou scanne le QR code. Le menu s’ouvre dans son navigateur. Votre établissement conserve une présentation à son image.',
      stepTap:'Poser ou scanner',stepMenu:'Explorer le menu',stepUpdate:'Mettre à jour à distance',
      tryMenu:'Ouvrir un menu de démonstration',demoTitle:'Essayez la caisse et la gestion<br><em>dans un seul prototype.</em>',
      demoCopy:'Ajoutez une commande, observez l’évolution du stock et ouvrez le menu client. Les données de démo restent dans ce navigateur.',
      launchDemo:'Lancer la démo interactive',closeTitle:'Dessinons votre installation.<br><em>Pas un pack générique.</em>',
      closeCopy:'Restaurant, café, hôtel ou complexe : expliquez-nous votre besoin et composez une première sélection.',buildQuote:'Composer mon devis',
      footerTag:'Des outils numériques pour les professionnels de l’hospitalité.',support:'Support',
      quoteTitle:'Votre sélection',emptyQuote:'Aucune solution sélectionnée pour le moment.',
      nameField:'Votre nom',businessField:'Établissement / Ville',needsField:'Besoin particulier',
      quoteNotice:'Aucun paiement ici : cette sélection prépare une demande de devis. Les prix et disponibilités restent à confirmer.',
      sendWhatsapp:'Envoyer via WhatsApp',remove:'Retirer',toastAdded:'Solution ajoutée à votre devis.',toastRemoved:'Solution retirée.',quoteEmptyError:'Ajoutez au moins une solution pour préparer votre demande.',
      whatsappIntro:'Bonjour, je souhaite recevoir un devis HORENOVA TECH.',whatsappSelection:'Sélection de solutions',whatsappName:'Nom',whatsappBusiness:'Établissement / Ville',whatsappNotes:'Informations complémentaires',whatsappEnd:'Merci de confirmer la disponibilité, les fonctionnalités, les prix TTC, les délais et l’installation au Maroc.'
    },
    en: {
      navHome:'Home',navShop:'Shop',navBusiness:'Business',quote:'My quote',
      heroTitle:'Technology<br>made for <em>hospitality.</em>',
      heroCopy:'An elegant till. Intelligent operations. A menu at a single tap. Your entire venue, designed as one connected system.',
      exploreSolutions:'Explore solutions',tryDemo:'Try the interactive demo',
      connectedSystem:'CONNECTED ECOSYSTEM',
      ecosystemTitle:'Orders flow.<br><em>Operations follow.</em>',
      flow1:'Table / NFC menu',flow2:'POS / Orders',flow3:'Inventory / Insights',
      ecosystemCopy:'Our vision is to connect guest experience, checkout and daily operations. Production integrations require validation for each venue.',
      catalogEyebrow:'THE TECH CATALOG',catalogTitle:'Technology for<br><em>every moment of service.</em>',
      catalogCopy:'Select the solutions you are interested in. We will prepare a tailored proposal for your venue.',
      filterAll:'View all',filterSoftware:'Software',filterNfc:'NFC menus',filterHardware:'Hardware & bundles',
      onRequest:'Quote required',customMade:'Customizable',supplyToConfirm:'Availability unconfirmed',plannedSolution:'Concept under review',
      posDesc:'Touchscreen point of sale: products, tables, orders, receipts, history and closing. Designed to connect with operations.',
      erpDesc:'Inventory, purchasing, suppliers, recipes, consumption and insights. Designed to synchronize with the POS.',
      nfcDesc:'Elegant table plaque with an NFC chip and QR code that opens a digital menu in the guest’s browser, without installing an app.',
      terminalTitle:'Touch terminal',terminalDesc:'A cleanly designed touchscreen till, configured for your software and service volume.',
      peripheralTitle:'POS essentials',peripheralDesc:'Thermal receipt printer, cash drawer, barcode scanner, customer display and compatible accessories by configuration.',
      kdsTitle:'Kitchen display',kdsDesc:'A clear overview of kitchen and bar preparation. Integration to be evaluated for your setup.',
      addToQuote:'Add to quote',added:'In your quote',previewMenu:'Preview example menu ↗',
      catalogNote:'Product visuals are concept illustrations, not photographs of stocked devices. Pricing, compatibility, features and lead times must be confirmed before ordering.',
      nfcTitle:'The menu no longer<br><em>needs to be handed out.</em>',
      nfcCopy:'Guests tap their phone on an NFC plaque or scan the QR code. The menu opens in their browser, with your venue’s identity.',
      stepTap:'Tap or scan',stepMenu:'Browse the menu',stepUpdate:'Update remotely',
      tryMenu:'Open an example menu',demoTitle:'Try POS and inventory<br><em>in a single prototype.</em>',
      demoCopy:'Add an order, see stock levels change, and open the guest menu. Demo data stays in your browser.',
      launchDemo:'Launch interactive demo',closeTitle:'Design your installation.<br><em>Not a generic box.</em>',
      closeCopy:'Restaurant, café, hotel or complex: tell us what you need and start building your selection.',buildQuote:'Build my quote',
      footerTag:'Digital tools for the people behind hospitality.',support:'Support',
      quoteTitle:'Your selection',emptyQuote:'No solutions selected yet.',nameField:'Your name',businessField:'Venue / City',needsField:'Additional requirements',
      quoteNotice:'No payment is taken here: this selection prepares a quotation request. Prices and availability are not confirmed.',
      sendWhatsapp:'Send via WhatsApp',remove:'Remove',toastAdded:'Solution added to your quote.',toastRemoved:'Solution removed.',quoteEmptyError:'Select at least one solution to request a quote.',
      whatsappIntro:'Hello, I would like a HORENOVA TECH quotation.',whatsappSelection:'Selected solutions',whatsappName:'Name',whatsappBusiness:'Venue / City',whatsappNotes:'Additional requirements',whatsappEnd:'Please confirm availability, features, tax-inclusive pricing, delivery time and installation in Morocco.'
    },
    ar: {
      navHome:'الرئيسية',navShop:'المتجر',navBusiness:'الأعمال',quote:'طلب عرض سعر',
      heroTitle:'تكنولوجيا<br>في <em>خدمة الضيافة.</em>',
      heroCopy:'صندوق أداء أنيق، إدارة ذكية، وقائمة طعام بلمسة هاتف. نظام متكامل صُمّم لتسهيل عمل المؤسسة.',
      exploreSolutions:'اكتشف الحلول',tryDemo:'جرّب النسخة التوضيحية',
      connectedSystem:'منظومة مترابطة',
      ecosystemTitle:'الطلب يمرّ.<br><em>والإدارة تتابع.</em>',
      flow1:'الطاولة / قائمة NFC',flow2:'الكاشير / الطلبات',flow3:'المخزون / التحليلات',
      ecosystemCopy:'هدفنا ربط تجربة الزبون والدفع والعمليات اليومية. يتم اختبار وتأكيد الربط الفعلي لكل مؤسسة قبل التشغيل.',
      catalogEyebrow:'كتالوج التكنولوجيا',catalogTitle:'حلول لكل<br><em>لحظة من الخدمة.</em>',
      catalogCopy:'اختر الحلول التي تهمك لنعدّ لك عرضًا مناسبًا لمؤسستك.',
      filterAll:'عرض الكل',filterSoftware:'البرمجيات',filterNfc:'قوائم NFC',filterHardware:'الأجهزة والحزم',
      onRequest:'حسب عرض السعر',customMade:'قابل للتخصيص',supplyToConfirm:'التوفر غير مؤكد',plannedSolution:'حل قيد الدراسة',
      posDesc:'برنامج كاشير يعمل باللمس: المنتجات والطاولات والطلبات والإيصالات والسجل وإقفال الخدمة، مصمم للربط مع الإدارة.',
      erpDesc:'المخزون والمشتريات والموردون والوصفات والاستهلاك والتحليلات. بنية مخطط لربطها بنظام الكاشير.',
      nfcDesc:'لوحة أنيقة توضع على الطاولة فيها NFC ورمز QR لفتح قائمة رقمية على هاتف الزبون دون تنزيل تطبيق.',
      terminalTitle:'جهاز كاشير باللمس',terminalDesc:'شاشة كاشير بتصميم أنيق تُجهَّز حسب البرنامج وحجم العمل.',
      peripheralTitle:'ملحقات الكاشير',peripheralDesc:'طابعة حرارية، درج نقدي، ماسح باركود، شاشة للزبون وملحقات متوافقة حسب التجهيز.',
      kdsTitle:'شاشة المطبخ',kdsDesc:'عرض واضح للطلبات في المطبخ أو البار. الربط يحتاج دراسة بحسب النظام.',
      addToQuote:'أضف إلى طلب السعر',added:'تمت إضافته',previewMenu:'شاهد القائمة التجريبية ↗',
      catalogNote:'الصور تصوّرات تصميمية وليست صورًا لأجهزة متوفرة بالمخزون. يجب تأكيد الثمن والتوافق والوظائف ومدة التوريد قبل الطلب.',
      nfcTitle:'القائمة لم تعد<br><em>تحتاج إلى توزيع.</em>',
      nfcCopy:'يضع الزبون هاتفه فوق لوحة NFC أو يمسح QR، فتفتح القائمة في المتصفح بهوية مطعمك.',
      stepTap:'المس أو امسح',stepMenu:'تصفح القائمة',stepUpdate:'حدّثها عن بُعد',
      tryMenu:'افتح القائمة التجريبية',demoTitle:'جرّب الكاشير والمخزون<br><em>في نموذج واحد.</em>',
      demoCopy:'أضف طلبًا، راقب تغير المخزون، وافتح قائمة الزبون. بيانات التجربة محفوظة على متصفحك.',
      launchDemo:'افتح التجربة التفاعلية',closeTitle:'لنصمّم نظامك.<br><em>وليس صندوقًا جاهزًا.</em>',
      closeCopy:'مطعم أو مقهى أو فندق أو مجمع: اشرح لنا احتياجاتك واختر الحلول المناسبة.',buildQuote:'حضّر طلب السعر',
      footerTag:'حلول رقمية للمهنيين في قطاع الضيافة.',support:'الدعم',
      quoteTitle:'اختياراتك',emptyQuote:'لم تختَر أي حل بعد.',nameField:'اسمك',businessField:'المؤسسة / المدينة',needsField:'احتياجات إضافية',
      quoteNotice:'لا يوجد دفع هنا. هذه استمارة طلب عرض سعر فقط؛ الأثمنة والتوفر يحتاجان تأكيدًا.',
      sendWhatsapp:'إرسال عبر واتساب',remove:'إزالة',toastAdded:'تمت الإضافة إلى طلبك.',toastRemoved:'تمت الإزالة.',quoteEmptyError:'اختر حلاً واحدًا على الأقل لإرسال الطلب.',
      whatsappIntro:'مرحبًا، أود طلب عرض سعر من HORENOVA TECH.',whatsappSelection:'الحلول المطلوبة',whatsappName:'الاسم',whatsappBusiness:'المؤسسة / المدينة',whatsappNotes:'ملاحظات إضافية',whatsappEnd:'يرجى تأكيد التوفر والوظائف والأثمنة شاملة الضرائب ومدة التسليم والتركيب في المغرب.'
    }
  };
  const $ = id => document.getElementById(id);
  const storage = {
    get(k){ try { return localStorage.getItem(k); } catch { return null; } },
    set(k,v){ try { localStorage.setItem(k,v); } catch {} }
  };
  let selection = [];
  try { const saved = JSON.parse(storage.get(STORAGE) || '[]'); if(Array.isArray(saved)) selection = saved.filter(k => Object.prototype.hasOwnProperty.call(catalog,k)); } catch {}
  selection = Array.from(new Set(selection));
  let locale = storage.get(LANGKEY) || (navigator.language || 'fr').slice(0,2);
  if (!copy[locale]) locale = 'fr';
  let timer;
  function t(key){ return copy[locale][key] || copy.fr[key] || key; }
  function toast(msg) {
    const el = $('techToast'); if (!el) return;
    el.textContent = msg; el.classList.add('show'); clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('show'),2400);
  }
  function applyLanguage(lang) {
    if(!copy[lang]) lang = 'fr';
    locale = lang; storage.set(LANGKEY,lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.dir = document.documentElement.dir;
    $('techLanguage').value = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if(!copy[lang][key]) return;
      if(['heroTitle','ecosystemTitle','catalogTitle','nfcTitle','demoTitle','closeTitle'].includes(key)) el.innerHTML = t(key);
      else el.textContent = t(key);
    });
    document.querySelectorAll('[data-add]').forEach(btn => {
      btn.querySelector('span').textContent = selection.includes(btn.dataset.add) ? t('added') : t('addToQuote');
    });
    renderQuote();
  }
  function renderQuote(){
    $('quoteCount').textContent = String(selection.length);
    const list = $('quoteItems'); list.replaceChildren();
    if(!selection.length){const p=document.createElement('p');p.textContent=t('emptyQuote');list.append(p);}
    selection.forEach(sku=>{
      const el=document.createElement('div');el.className='quote-item';
      const title=document.createElement('strong');title.textContent=catalog[sku];
      const remove=document.createElement('button');remove.type='button';remove.textContent=t('remove');remove.setAttribute('aria-label',t('remove')+' '+catalog[sku]);
      remove.addEventListener('click',()=>removeSku(sku));
      el.append(title,remove);list.append(el);
    });
    document.querySelectorAll('[data-add]').forEach(btn=>{
      const added=selection.includes(btn.dataset.add);
      btn.classList.toggle('added',added);
      const span=btn.querySelector('span'); if(span) span.textContent=added?t('added'):t('addToQuote');
    });
  }
  function persist(){ storage.set(STORAGE,JSON.stringify(selection));renderQuote(); }
  function removeSku(sku){selection=selection.filter(s=>s!==sku);persist();toast(t('toastRemoved'));}
  function addSku(sku){if(!catalog[sku])return;if(!selection.includes(sku)){selection.push(sku);persist();toast(t('toastAdded'));}else{openQuote();}}
  let lastFocus;
  function openQuote(){
    lastFocus=document.activeElement;
    $('quotePanel').hidden=false;$('quoteOverlay').hidden=false;
    $('quotePanel').setAttribute('aria-hidden','false');$('quoteTrigger').setAttribute('aria-expanded','true');
    document.body.classList.add('quote-open');$('closeQuote').focus();
  }
  function closeQuote(){
    $('quotePanel').hidden=true;$('quoteOverlay').hidden=true;
    $('quotePanel').setAttribute('aria-hidden','true');$('quoteTrigger').setAttribute('aria-expanded','false');
    document.body.classList.remove('quote-open');
    if(lastFocus && typeof lastFocus.focus==='function') lastFocus.focus();
  }
  document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
    const filter=btn.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(x=>{const active=x===btn;x.classList.toggle('selected',active);x.setAttribute('aria-pressed',String(active));});
    document.querySelectorAll('.product').forEach(el=>{el.hidden=filter!=='all'&&el.dataset.category!==filter;});
  }));
  document.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>addSku(btn.dataset.add)));
  $('quoteTrigger').addEventListener('click',openQuote);
  $('closingQuote').addEventListener('click',openQuote);
  $('quoteOverlay').addEventListener('click',closeQuote);
  $('closeQuote').addEventListener('click',closeQuote);
  $('techLanguage').addEventListener('change',e=>applyLanguage(e.target.value));
  document.addEventListener('keydown',e=>{
    if($('quotePanel').hidden) return;
    if(e.key==='Escape'){e.preventDefault();closeQuote();}
    if(e.key==='Tab'){
      const focusables=Array.from($('quotePanel').querySelectorAll('button,input,textarea,a[href],select')).filter(el=>!el.disabled&&!el.hidden);
      if(!focusables.length)return;
      const first=focusables[0],last=focusables[focusables.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  $('quoteForm').addEventListener('submit',ev=>{
    ev.preventDefault();
    if(!selection.length){toast(t('quoteEmptyError'));return;}
    const data=new FormData(ev.currentTarget);
    const name=String(data.get('name')||'').trim().slice(0,80);
    const business=String(data.get('business')||'').trim().slice(0,120);
    const notes=String(data.get('notes')||'').trim().slice(0,600);
    const lines=[t('whatsappIntro'),'',
      t('whatsappSelection')+':',
      ...selection.map(sku=>'• '+catalog[sku])
    ];
    if(name)lines.push('',t('whatsappName')+': '+name);
    if(business)lines.push(t('whatsappBusiness')+': '+business);
    if(notes)lines.push(t('whatsappNotes')+': '+notes);
    lines.push('',t('whatsappEnd'));
    const url='https://wa.me/'+PHONE+'?text='+encodeURIComponent(lines.join('\n'));
    // Navigation is triggered only by explicit submission; no server-side transaction is claimed.
    const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';document.body.append(link);link.click();link.remove();
  });
  applyLanguage(locale);
})();