/* HORENOVA auth gate v2 — verify Wix identity, never a localStorage hint. */
(() => {
  'use strict';
  let done = false;
  const current = location.pathname + location.search + location.hash;
  const toLogin = '/enter.html?mode=signin&returnTo=' + encodeURIComponent(current);
  const allow = () => {
    if (done) return;
    done = true;
    document.documentElement.classList.remove('auth-pending');
    document.documentElement.classList.add('auth-ok');
  };
  const deny = () => {
    if (done) return;
    done = true;
    // Exactly one transition to a stable sign-in screen; no reload loop.
    location.replace(toLogin);
  };
  const watchdog = setTimeout(deny, 14000);
  import('/js/wix/member-store.js').then(({getMemberState,subscribeMember}) => {
    const decide = state => {
      if (done || state.loading) return;
      clearTimeout(watchdog);
      if (state.loggedIn && state.member?.id) allow();
      else deny();
    };
    subscribeMember(decide);
    decide(getMemberState());
  }).catch(() => { clearTimeout(watchdog); deny(); });
})();