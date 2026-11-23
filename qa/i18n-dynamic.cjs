'use strict';
// Test HORENOVA's actual translation logic with a minimal DOM stub.
// No browser accounts or production user data are required.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../horenova-i18n.js'),'utf8');
const doc={title:'Horenova',readyState:'loading',body:null,addEventListener(){}};
const context={document:doc,MutationObserver:class{observe(){}}};
const exposed=source.replace(/\}\)\(\);\s*$/, 'globalThis.__qaI18n={doText,doAttr,target};\n})();');
assert.notEqual(exposed,source,'Translator closure must be found');
vm.runInNewContext(exposed,context,{filename:'horenova-i18n.js'});
const {doText,doAttr,target}=context.__qaI18n;
assert.equal(target('Enregistrer','en'),'Save');
// Product names, generated wardrobe actions, and concept disclaimers must localize fully.
assert.equal(target('Executive Chef Jacket','fr'),'Veste de chef exécutif');
assert.equal(target('Veste de chef exécutif','en'),'Executive Chef Jacket');
assert.equal(target('Executive Chef Jacket','ar'),'سترة رئيس الطهاة');
assert.equal(target('PRIX SUR DEMANDE','en'),'PRICE ON REQUEST');
assert.equal(target('PRIX SUR DEMANDE','ar'),'السعر عند الطلب');
assert.equal(target('03 · DEMANDE','en'),'03 · REQUEST');
assert.equal(target('COLLECTION CONCEPT · LES COULEURS ET LE DOS SONT DES SIMULATIONS · PRIX ET STOCKS À CONFIRMER','ar'),'مجموعة تصورية · الألوان والظهر محاكاة · الأسعار والمخزون غير مؤكدين');
assert.equal(target('Collection Entretien — Duo Hôtel','en'),'Hotel Housekeeping Duo Collection');
assert.equal(target('Enregistrée','en'),'Saved');
assert.equal(target('Enregistrée','ar'),'تم الحفظ');
// Existing text node: initial translation, dynamic state change, switches back/forth.
const node={nodeType:3,nodeValue:'  Enregistrer  ',parentElement:{closest:()=>null}};
doText(node,'en');assert.equal(node.nodeValue,'  Save  ');
node.nodeValue='  Enregistrée  ';
doText(node,'en');assert.equal(node.nodeValue,'  Saved  ');
doText(node,'ar');assert.equal(node.nodeValue,'  تم الحفظ  ');
doText(node,'fr');assert.equal(node.nodeValue,'  Enregistrée  ');
// Inputs are updated dynamically as well, including placeholders and aria labels.
const el={
 attrs:{placeholder:'Enregistrer','aria-label':'Enregistrer'},
 hasAttribute(name){return Object.hasOwn(this.attrs,name)},
 getAttribute(name){return this.attrs[name]},
 setAttribute(name,value){this.attrs[name]=value}
};
doAttr(el,'placeholder','en');assert.equal(el.attrs.placeholder,'Save');
el.setAttribute('placeholder','Enregistrée');
doAttr(el,'placeholder','en');assert.equal(el.attrs.placeholder,'Saved');
doAttr(el,'placeholder','ar');assert.equal(el.attrs.placeholder,'تم الحفظ');
doAttr(el,'placeholder','fr');assert.equal(el.attrs.placeholder,'Enregistrée');
doAttr(el,'aria-label','en');assert.equal(el.attrs['aria-label'],'Save');
el.setAttribute('aria-label','Enregistrée');
doAttr(el,'aria-label','en');assert.equal(el.attrs['aria-label'],'Saved');
console.log('PASS: dynamic FR/EN/AR text, placeholders, accessibility labels, switching.');
