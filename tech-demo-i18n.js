/* HORENOVA TECH LAB: isolated FR/EN/AR locale layer, no user-data translation. */
(() => {
  'use strict';
  const pairs = [
    ["Retour au Tech Shop","Back to Tech Shop","العودة إلى متجر التكنولوجيا"],
    ["Accueil","Home","الرئيسية"],
    ["De la caisse au stock.","From POS to inventory.","من الكاشير إلى المخزون."],
    ["Une seule histoire.","One connected experience.","تجربة واحدة متكاملة."],
    ["Testez le principe d'un point de vente relié à la gestion des stocks et à un menu digital de démonstration. Cliquez sur un produit, confirmez une vente et observez les quantités disponibles changer.","Experience a POS connected to inventory and a digital menu in this demonstration. Select a product, confirm a simulated sale and watch available stock change.","جرّب نظام كاشير مرتبطًا بالمخزون والقائمة الرقمية. اختر منتجًا، أكّد بيعًا تجريبيًا، وشاهد تغيّر كمية المخزون."],
    ["PROTOTYPE LOCAL — PAS UN LOGICIEL DE PRODUCTION.","LOCAL PROTOTYPE — NOT PRODUCTION SOFTWARE.","نموذج تجريبي محلي — ليس برنامجًا جاهزًا للبيع."],
    ["Prix et produits fictifs en MAD. Aucune vraie commande, aucun paiement, aucune synchronisation serveur, impression fiscale ou connexion NFC matérielle. Les essais sont enregistrés uniquement dans votre navigateur.","Fictitious products and prices in MAD. No real orders, payments, server sync, fiscal receipts or physical NFC integration. Demo data stays in your browser.","المنتجات والأثمنة تجريبية بالدرهم. لا توجد طلبات حقيقية ولا دفع أو مزامنة خادم أو فواتير قانونية أو اتصال NFC فعلي. تبقى البيانات في متصفحك."],
    ["◧ Caisse POS","◧ POS register","◧ كاشير"],
    ["▦ Stock & ventes","▦ Inventory & sales","▦ المخزون والمبيعات"],
    ["◉ Menu NFC / QR","◉ NFC / QR menu","◉ قائمة NFC / QR"],
    ["↺ Réinitialiser la démo","↺ Reset demo","↺ إعادة ضبط التجربة"],
    ["VENTES DÉMO","DEMO SALES","مبيعات تجريبية"],
    ["Commandes confirmées","Simulated sales confirmed","المبيعات المؤكدة"],
    ["CHIFFRE D'AFFAIRES FICTIF","FICTITIOUS REVENUE","رقم أعمال افتراضي"],
    ["Sans encaissement","No payments collected","بدون تحصيل"],
    ["ALERTES STOCK","LOW STOCK ALERTS","تنبيهات المخزون"],
    ["Produits à 5 unités ou moins","Products with 5 units or less","منتجات بكمية 5 أو أقل"],
    ["Caisse tactile / simulation","Touchscreen POS / simulation","كاشير باللمس / تجربة"],
    ["Sélectionnez une table, ajoutez des produits et validez la vente fictive. Le stock correspondant se décrémente dans l'onglet Gestion.","Choose a table, add products and complete a simulated sale. The related inventory updates in the Inventory tab.","اختر طاولة وأضف المنتجات وأكّد البيع التجريبي. سيتم خصم الكميات من المخزون."],
    ["Carte des produits","Product catalog","قائمة المنتجات"],
    ["Ticket en cours","Current order","الطلب الحالي"],
    ["Table","Table","الطاولة"],
    ["Total fictif","Demo total","مجموع تجريبي"],
    ["Vider","Clear","مسح"],
    ["Valider la vente démo","Confirm demo sale","تأكيد البيع التجريبي"],
    ["Gestion / inventaire synchronisé localement","Management / locally synced stock","الإدارة / مخزون مترابط محليًا"],
    ["Les quantités proviennent du même catalogue que la caisse et le menu. Une vente fictive diminue le stock; le bouton +5 simule une réception.","The POS and menu use the same product catalog. A simulated sale reduces inventory; +5 simulates a stock receipt.","تستخدم القائمة والكاشير نفس المنتجات. يقلّ المخزون عند البيع التجريبي، وزر +5 يحاكي استقبال بضاعة."],
    ["Alerte si stock ≤ 5 unités. Les changements concernent uniquement cette démonstration.","Alert when inventory is 5 units or fewer. Changes affect this demo only.","تنبيه عندما تصبح الكمية 5 وحدات أو أقل. التغييرات تخص التجربة فقط."],
    ["Journal des ventes de démonstration","Demo sales history","سجل المبيعات التجريبية"],
    ["La carte sur le téléphone","Digital menu on phone","القائمة على الهاتف"],
    ["Exemple de la page que pourrait ouvrir une plaque NFC ou un QR code. Aucun tag réel n'est connecté à cette URL de démo.","Example page that a table NFC plaque or QR code could open. No physical tag is connected to this demo URL.","مثال للصفحة التي قد تفتحها لوحة NFC أو رمز QR. لا توجد شريحة حقيقية مرتبطة بهذه التجربة."],
    ["La Carte.","The Menu.","القائمة."],
    ["Des instants à savourer.","Moments to savor.","لحظات شهية."],
    ["DÉMONSTRATION · PRIX FICTIFS · AUCUNE COMMANDE RÉELLE","DEMO · FICTITIOUS PRICES · NO REAL ORDERS","تجربة · أثمنة افتراضية · بدون طلبات حقيقية"],
    ["Comment fonctionne Horenova Tap Menu ? ↗","How does Horenova Tap Menu work? ↗","كيف تعمل قائمة هورينوفا الذكية؟ ↗"],
    ["Ce que prouve cette démo :","What this demo shows:","ما الذي تعرضه التجربة:"],
    ["une interface de caisse, un panier d'articles, une vente fictive qui impacte les quantités en stock, un historique et un menu client lisant le même catalogue.","a POS screen, an order basket, simulated sales that update stock, a sales history and a guest menu using the same catalog.","واجهة كاشير وسلة طلبات وعمليات بيع افتراضية تؤثر على المخزون وسجل مبيعات وقائمة للزبون تعتمد نفس المنتجات."],
    ["Ce qui reste à développer avant toute vente :","Still required before real sale:","ما يجب تطويره قبل البيع الفعلي:"],
    ["authentification, permissions, base de données serveur, inventaires multi-sites, fiscalité, paiements, imprimantes, matériel NFC et tests d'installation.","authentication, access control, server database, multi-site stock, tax rules, payments, receipt printers, NFC hardware and installation tests.","المصادقة والصلاحيات وقاعدة بيانات على الخادم والمخزون متعدد الفروع والضرائب والدفع والطابعات وأجهزة NFC واختبارات التثبيت."],
    ["Retour au catalogue Tech ↗","Return to Tech catalog ↗","العودة إلى كتالوج التكنولوجيا ↗"],
    ["Tout","All","الكل"],
    ["Café","Coffee","قهوة"],
    ["Boissons","Drinks","مشروبات"],
    ["Cuisine","Kitchen","مطبخ"],
    ["Espresso","Espresso","إسبريسو"],
    ["Cappuccino","Cappuccino","كابتشينو"],
    ["Café latte","Café latte","كافيه لاتيه"],
    ["Thé à la menthe","Mint tea","شاي بالنعناع"],
    ["Jus d'orange","Orange juice","عصير البرتقال"],
    ["Eau minérale","Mineral water","مياه معدنية"],
    ["Tajine maison","House tagine","طاجين الدار"],
    ["Salade du chef","Chef's salad","سلطة الشيف"],
    ["Dessert du jour","Dessert of the day","حلوى اليوم"],
    ["Touchez un produit pour commencer la commande démo.","Tap a product to start a demo order.","اضغط على منتج لبدء طلب تجريبي."],
    ["Aucune vente fictive. Passez une commande depuis la caisse.","No simulated sales. Create an order in the POS.","لا توجد مبيعات تجريبية. أنشئ طلبًا في الكاشير."],
    ["Carte de démonstration","Demo catalog","قائمة تجريبية"],
    ["Indisponible (démo)","Unavailable (demo)","غير متوفر (تجربة)"],
    ["+5 unités","+5 units","+5 وحدات"],
    ["Voir / imprimer un ticket démo","View / print demo receipt","عرض / طباعة إيصال تجريبي"],
    ["Vente simulée validée. Stock et historique mis à jour.","Simulated sale completed. Stock and history updated.","تمّ البيع التجريبي، وتحديث المخزون والسجل."],
    ["Ticket vidé.","Order cleared.","تم مسح الطلب."],
    ["Données de démonstration réinitialisées.","Demo data reset.","تمت إعادة ضبط بيانات التجربة."],
    ["Stock insuffisant pour","Insufficient stock for","المخزون غير كافٍ لـ"],
    ["Stock insuffisant : rechargez le ticket.","Insufficient stock: please update the order.","المخزون غير كافٍ: يرجى تعديل الطلب."],
    ["Quantité supérieure au stock disponible.","Quantity exceeds available stock.","الكمية أكبر من المخزون المتوفر."],
    ["Démo","Demo","تجربة"],
    ["disp.","left","متوفر"]
  ];
  const dict = new Map(pairs.map(a=>[a[0],{en:a[1],ar:a[2]}]));
  const memory = new WeakMap();
  const supported = new Set(['fr','en','ar']);
  let lang='fr';
  try {let pref=localStorage.getItem('mihna-lang');if(supported.has(pref))lang=pref;}catch{}
  const chooser=document.getElementById('labLanguage');
  if(chooser)chooser.value=lang;
  function translateText(source,language=lang) {
    const v=dict.get(source);
    return language==='fr'?source:(v&&v[language])||source;
  }
  function translate(){
    document.documentElement.lang=lang;
    document.documentElement.dir=lang==='ar'?'rtl':'ltr';
    const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let n;
    while(n=walk.nextNode()){
      if(n.parentElement?.closest('script,style,textarea'))continue;
      let text=memory.get(n);
      if(text===undefined){text=n.nodeValue;memory.set(n,text);}
      const match=text.match(/^(\s*)([\s\S]*?)(\s*)$/);
      if(!match)continue;
      const translated=translateText(match[2]);
      const next=match[1]+translated+match[3];
      if(n.nodeValue!==next)n.nodeValue=next;
    }
    if(chooser)chooser.value=lang;
  }
  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;translate()});}
  function setLanguage(next) {
    if(!supported.has(next))return;
    lang=next;
    try{localStorage.setItem('mihna-lang',lang);}catch{}
    translate();
    document.dispatchEvent(new CustomEvent('hn-tech-lab-lang',{detail:{lang}}));
  }
  if(chooser)chooser.addEventListener('change',e=>setLanguage(e.target.value));
  window.HNTechLabI18n={translate:translateText,language:()=>lang};
  translate();
  new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,characterData:true});
})();