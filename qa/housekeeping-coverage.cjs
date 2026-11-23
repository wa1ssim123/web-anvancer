'use strict';
/* HORENOVA: cleaning/hotel housekeeping cross-app regression checks (offline). */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const roles=['Agent de ménage','Femme / Valet de chambre',"Agent d'entretien","Gouvernant(e) d'étage",'Employé(e) de blanchisserie','Agent de nettoyage'];
for(const role of roles){
  assert.ok(read('candidate-setup.html').includes('value="'+role+'"'),'Missing candidate role: '+role);
  assert.ok(read('recruit-live.js').includes("value='"+role+"'"),'Missing recruiter role: '+role);
  assert.ok(read('talents.html').includes('value="'+role+'"'),'Missing talents filter: '+role);
  assert.ok(read('quiz.js').includes(JSON.stringify(role)),'Missing quiz profession: '+role);
  assert.ok(read('horenova-i18n.js').includes(role),'Missing localized role: '+role);
}
const quiz=read('quiz.js');
const bank=JSON.parse(quiz.match(/const HOUSEKEEPING_BANK=(\[[^\n]+\]);/)[1]);
const translations=Function('return ('+quiz.match(/const HOUSEKEEPING_I18N=(\{[^\n]+\});/)[1]+')')();
assert.equal(bank.length,5);
for(const q of bank){assert.equal(q[1].length,3);assert.ok([0,1,2].includes(q[2]));}
for(const lang of ['en','ar']){assert.equal(translations[lang].length,5);translations[lang].forEach(q=>{assert.ok(q[0]);assert.equal(q[1].length,3);});}
assert.ok(read('apply.js').includes('Entretien des chambres'));
assert.ok(read('apply.js').includes('Gestion du linge'));
const shop=read('shop-products-atelier-20261113.js');
const products=JSON.parse(shop.match(/^const PRODUCTS = (\[[^\n]+\]);/)[1]);
assert.equal(products.length,9);
for(const id of ['housekeeping-tunic','housekeeping-jacket','housekeeping-duo']){
  assert.ok(products.some(p=>p.id===id&&p.cat==='ÉTAGE'&&p.img.startsWith('https://static.wixstatic.com/media/')));
  assert.ok(read('horenova-wardrobe-atelier-20261113.js').includes("id:'"+id+"'"));
}
assert.ok(read('shop.html').includes('data-shop-filter="ÉTAGE"'));
assert.ok(read('index.html').includes('MÉNAGE & ÉTAGE'));
assert.ok(read('academy.html').includes('entretien hôtelier'));
console.log('PASS housekeeping: 6 jobs, candidate/recruiter/talents, optional quiz FR/EN/AR, applications, academy, home and 3 shop concepts.');
