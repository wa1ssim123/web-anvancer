/*
 * HORENOVA members — Wix Headless REST + Google reCAPTCHA Enterprise.
 * Wix-owned public site keys are documented at:
 * https://dev.wix.com/docs/go-headless/authentication/members/custom-login-page/re-captcha/add-re-captcha-to-a-custom-login-page-rest
 * Only public keys are in this client script. CAPTCHA tokens are short-lived and
 * are never stored in localStorage or sent to Horenova's own server.
 */
const VISIBLE_WIX_KEY = '6Ld0J8IcAAAAANyrnxzrRlX1xrrdXsOmsepUYosy';
const INVISIBLE_WIX_KEY = '6LdoPaUfAAAAAJphvHoUoOob7mx0KDlXyXlgrx5v';
const widgets = new WeakMap();
let loading = null;
let invisibleWidgetId = null;

function status(form, message) {
  const element = form.querySelector('[data-captcha-status]');
  if (element) element.textContent = message;
}
function loadEnterprise() {
  const existing = window.grecaptcha?.enterprise;
  if (existing?.render) return Promise.resolve(existing);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, api) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) { loading = null; reject(error); }
      else resolve(api);
    };
    const timeout = setTimeout(() => finish(new Error('La vérification de sécurité ne répond pas. Actualisez la page et réessayez.')), 20000);
    let script = document.querySelector('script[data-hn-google-captcha]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/enterprise.js?render=explicit&hl=fr';
      script.async = true;
      script.defer = true;
      script.dataset.hnGoogleCaptcha = '1';
      document.head.appendChild(script);
    }
    const onReady = () => {
      const api = window.grecaptcha?.enterprise;
      if (!api?.ready || !api?.render) {
        finish(new Error('La vérification de sécurité est indisponible. Rechargez la page.'));
        return;
      }
      api.ready(() => finish(null, api));
    };
    script.addEventListener('load', onReady, {once:true});
    script.addEventListener('error', () => finish(new Error('Impossible de charger la vérification Google. Vérifiez votre connexion ou bloqueur de contenus.')), {once:true});
    if (window.grecaptcha?.enterprise?.render) onReady();
  });
  return loading;
}
export async function prepareCaptcha(form) {
  const area = form.querySelector('[data-captcha-area]');
  const host = form.querySelector('[data-captcha-widget]');
  if (!area || !host) throw new Error('Zone de sécurité introuvable : rechargez la page.');
  area.hidden = false;
  status(form,'Chargement de la vérification de sécurité…');
  try {
    const api = await loadEnterprise();
    if (!widgets.has(form)) {
      const id = api.render(host, {
        sitekey: VISIBLE_WIX_KEY,
        theme: 'light',
        size: 'normal',
        callback: () => status(form, 'Vérification réussie.'),
        'expired-callback': () => status(form, 'La vérification a expiré. Cochez à nouveau la case.'),
        'error-callback': () => status(form, 'Vérification impossible. Rechargez la page et réessayez.')
      });
      widgets.set(form, id);
    }
    const token = api.getResponse(widgets.get(form));
    status(form,token?'Vérification réussie.':'Cochez « Je ne suis pas un robot » pour continuer.');
  } catch (error) {
    status(form,error.message || 'Vérification indisponible.');
    throw error;
  }
}
export async function captchaTokensFor(form) {
  await prepareCaptcha(form);
  const api = await loadEnterprise();
  const token = api.getResponse(widgets.get(form));
  if (!token) {
    status(form,'Cochez « Je ne suis pas un robot » pour continuer.');
    throw new Error('Cochez « Je ne suis pas un robot » avant de continuer.');
  }
  return [{Recaptcha:token}];
}
export function resetCaptcha(form) {
  const id = widgets.get(form);
  if (id === undefined) return;
  try { window.grecaptcha?.enterprise?.reset(id); } catch {}
  status(form,'Cochez « Je ne suis pas un robot » pour réessayer.');
}
// If the Wix Headless project is configured for *invisible* instead of
// visible challenge, retry once with the documented invisible token type.
export async function invisibleCaptchaTokens() {
  const api = await loadEnterprise();
  if (invisibleWidgetId === null) {
    let host = document.getElementById('hnInvisibleCaptchaHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'hnInvisibleCaptchaHost';
      document.body.appendChild(host);
    }
    invisibleWidgetId = api.render(host, {
      sitekey: INVISIBLE_WIX_KEY,
      size: 'invisible',
      badge: 'bottomright'
    });
  }
  api.reset(invisibleWidgetId);
  const token = await api.execute(invisibleWidgetId);
  if (!token) throw new Error('La vérification anti-robot a échoué. Rechargez la page.');
  return [{InvisibleRecaptcha:token}];
}
