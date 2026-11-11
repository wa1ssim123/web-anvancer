const DEMO_KEY='mihna-demo-session-v1';
const HINT_KEY='horenova-session-hint-v1';
function demo(){return false}
function target(){const here=location.pathname+location.search+location.hash;return '/enter.html?returnTo='+encodeURIComponent(here)}
function show(){document.documentElement.classList.remove('auth-pending');document.documentElement.classList.add('auth-ok')}
function backToEnter(){localStorage.removeItem(HINT_KEY);location.replace(target())}
if(demo()){show()}else if(localStorage.getItem(HINT_KEY)!=='1'){location.replace(target())}else{
  // Reveal protected page only after confirming a real Wix member session.
  import('/js/wix/member-store.js').then(({subscribeMember,getMemberState})=>{
    let settled=false;
    const decide=s=>{if(settled||s.loading)return;settled=true;if(s.loggedIn)show();else backToEnter()};
    subscribeMember(decide);decide(getMemberState());
    setTimeout(()=>{if(!settled)backToEnter()},6500);
  }).catch(backToEnter);
}