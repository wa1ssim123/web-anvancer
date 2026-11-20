'use strict';
/* Live quiz module with Wix API mocks: real FR/EN/AR language-switch and answer persistence. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const quiz=fs.readFileSync(path.join(root,'quiz.js'),'utf8');
const i18n=fs.readFileSync(path.join(root,'horenova-i18n.js'),'utf8');
const fixture=`<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body data-hn12="quiz">
<header class="hn12-top"><a class="hn12-logo">HORENOVA</a><div class="hn12-actions"><button type="button" id="menuBtn">☰</button></div></header>
<main class="hn12-page"><section class="hn12-hero"><div class="hn12-hero-copy"><h1>Tester les bases<br>sans transformer le métier en examen.</h1><p>Quelques questions courtes pour confirmer les fondamentaux avant candidature.</p></div></section>
<section class="quiz-exam"><div class="quiz-exam-head"><span class="small-title">QUIZ MÉTIER · 5 QUESTIONS</span><h1>Un petit test.</h1><p>Le but est de vérifier les bases.</p><span id="quizRole"></span></div><form id="domainQuiz"></form><div id="quizResult" hidden></div></section></main>
<script type="module" src="/quiz.js"></script><script defer src="/horenova-i18n.js"></script></body></html>`;
async function main(){
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{try{if(!localStorage.getItem('mihna-lang'))localStorage.setItem('mihna-lang','fr')}catch{}});
  await page.route('https://horenova.test/**',route=>{
   const p=new URL(route.request().url()).pathname;
   const body=p==='/quiz.html'?fixture:p==='/quiz.js'?quiz:p==='/horenova-i18n.js'?i18n:p==='/mihna-global.js'?"export const requireRole=async()=>({member:{id:'wix-fixture'},role:'candidate'});":"export const queryItems=async()=>({items:[]});export const insertItem=async()=>({_id:'attempt-1'});export const patchItemFields=async()=>({});";
   return route.fulfill({status:200,contentType:p.endsWith('.js')?'text/javascript':'text/html',body});
  });
  await page.goto('https://horenova.test/quiz.html?role=Serveur&returnTo=%2Fapply.html%3Fid%3Doffer-001');
  await page.locator('#hn-language-control').waitFor();
  assert.match(await page.locator('#domainQuiz fieldset').first().innerText(),/Un client signale une allergie/);
  await page.locator('#domainQuiz input[name="q0"][value="1"]').check();
  assert.equal(await page.locator('#hnQuizAnswered').innerText(),'1 / 5');
  await page.locator('#hn-language-control').selectOption('ar');
  await page.waitForFunction(()=>document.documentElement.lang==='ar'&&document.querySelector('#domainQuiz fieldset legend')?.textContent.includes('حساسية'));
  assert.ok(await page.locator('#domainQuiz input[name="q0"][value="1"]').isChecked(),'Arabic language toggle lost a selected answer');
  assert.equal(await page.locator('#domainQuiz fieldset').count(),5,'Arabic quiz is missing questions');
  assert.equal(await page.locator('#hnQuizAnswered').innerText(),'1 / 5');
  await page.locator('#hn-language-control').selectOption('en');
  await page.waitForFunction(()=>document.documentElement.lang==='en'&&document.querySelector('#domainQuiz fieldset legend')?.textContent.includes('allergy'));
  assert.ok(await page.locator('#domainQuiz input[name="q0"][value="1"]').isChecked(),'English language toggle lost a selected answer');
  assert.equal(await page.locator('#domainQuiz fieldset').count(),5,'English quiz is missing questions');
  assert.equal(errors.length,0,'Quiz/i18n exceptions: '+errors.join('; '));
  console.log('PASS profession quiz FR → AR → EN, all 5 questions and preserved answers');
  await context.close();
 }finally{await browser.close();}
}
main().catch(e=>{console.error('FAIL candidate quiz multilingual: '+e.stack);process.exitCode=1});
