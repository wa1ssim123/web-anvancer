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
  if (existing?.render && existing?.ready) return Promise.resolve(existing);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const sources = [
      'https://www.google.com/recaptcha/enterprise.js?render=explicit&hl=fr',
      'https://www.recaptcha.net/recaptcha/enterprise.js?render=explicit&hl=fr'
    ];
    let settled = false;
    const timeout = setTimeout(() => finish(new Error('Vérification anti-robot inaccessible. Désactivez le bloqueur de contenu, puis actualisez la page.')), 20000);
    function finish(error, api) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) { loading = null; reject(error); }
      else resolve(api);
    }
    function attempt(index) {
      if (settled) return;
      if (index >= sources.length) {
        finish(new Error('La vérification de sécurité est indisponible sur ce navigateur. Vérifiez le réseau et les bloqueurs de contenu.'));
        return;
      }
      const api = window.grecaptcha?.enterprise;
      if (api?.render && api?.ready) {
        api.ready(() => finish(null, api));
        return;
      }
      const script = document.createElement('script');
      script.src = sources[index];
      script.async = true;
      script.defer = true;
      script.dataset.hnGoogleCaptcha = '1';
      script.addEventListener('load', () => {
        const loaded = window.grecaptcha?.enterprise;
        if (loaded?.render && loaded?.ready) loaded.ready(() => finish(null, loaded));
        else { script.remove(); attempt(index + 1); }
      }, { once: true });
      script.addEventListener('error', () => {
        script.remove();
        attempt(index + 1);
      }, { once: true });
      document.head.appendChild(script);
    }
    attempt(0);
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
