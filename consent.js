// Согласие на cookie для link.adsnew.org. Подключается в <head> до всех счётчиков.
// Логика та же, что на основном сайте (site/src/lib/consent-script.ts в репозитории my-website-rus):
//   статистика — Google Analytics; реклама — Meta Pixel и TikTok Pixel.
//   Израиль и США — включено до выбора, можно отказаться; GPC отключает рекламу.
//   Остальные страны — до согласия выключено.
// Выбор хранится 12 месяцев. Ссылка «Настройки cookie» внизу страницы открывает выбор заново.
(function (w, d) {
  var KEY = 'adsnew-cookie-consent-v1';
  var MAX_AGE = 365 * 24 * 60 * 60 * 1000;
  var US_ZONES = /^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Adak|Boise|Detroit|Juneau|Sitka|Metlakatla|Nome|Yakutat|Menominee|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+)|Pacific\/Honolulu|US\/.+)$/;
  var IL_ZONES = /^(Asia\/(Jerusalem|Tel_Aviv)|Israel)$/;

  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  var optOutRegion = US_ZONES.test(tz) || IL_ZONES.test(tz);
  var gpc = navigator.globalPrivacyControl === true;

  var stored = null;
  try {
    var raw = w.localStorage.getItem(KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed.ts === 'number' && Date.now() - parsed.ts < MAX_AGE) stored = parsed;
    }
  } catch (e) {}

  var state = stored
    ? { analytics: !!stored.analytics, marketing: !!stored.marketing }
    : { analytics: optOutRegion, marketing: optOutRegion && !gpc };

  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
  function g(v) { return v ? 'granted' : 'denied'; }
  w.gtag('consent', 'default', {
    analytics_storage: g(state.analytics),
    ad_storage: g(state.marketing),
    ad_user_data: g(state.marketing),
    ad_personalization: g(state.marketing),
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });

  var loaded = { analytics: false, marketing: false };

  function addScript(src) {
    var s = d.createElement('script');
    s.async = true;
    s.src = src;
    d.head.appendChild(s);
  }

  function loadAnalytics() {
    if (loaded.analytics) return;
    loaded.analytics = true;
    addScript('https://www.googletagmanager.com/gtag/js?id=G-1KF8DCZKLR');
    w.gtag('js', new Date());
    w.gtag('config', 'G-1KF8DCZKLR');
  }

  function loadMarketing() {
    if (loaded.marketing) return;
    loaded.marketing = true;

    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(w, d, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    w.fbq('consent', 'grant');
    w.fbq('init', '1630705058143577');
    w.fbq('track', 'PageView');
    var view = d.documentElement.getAttribute('data-meta-view-content');
    if (view) w.fbq('track', 'ViewContent', { content_name: view });

    !function (w, d, t) {
      w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
      ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
      ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.load = function (e) {
        var o = d.createElement('script'); o.type = 'text/javascript'; o.async = !0;
        o.src = 'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=' + e + '&lib=' + t;
        var a = d.getElementsByTagName('script')[0]; a.parentNode.insertBefore(o, a);
      };
      ttq.load('D1CJDVJC77U8IVAAI6MG');
      ttq.page();
    }(w, d, 'ttq');
  }

  function apply() {
    if (state.analytics) loadAnalytics();
    if (state.marketing) loadMarketing();
  }

  w.adsConsent = {
    // decided: посетитель уже сделал выбор (баннер не нужен).
    decided: !!stored,
    optOutRegion: optOutRegion,
    get: function () { return { analytics: state.analytics, marketing: state.marketing }; },
    set: function (next) {
      var revoked = (state.analytics && !next.analytics && loaded.analytics) ||
        (state.marketing && !next.marketing && loaded.marketing);
      state = { analytics: !!next.analytics, marketing: !!next.marketing };
      this.decided = true;
      try {
        w.localStorage.setItem(KEY, JSON.stringify({ analytics: state.analytics, marketing: state.marketing, ts: Date.now() }));
      } catch (e) {}
      w.gtag('consent', 'update', {
        analytics_storage: g(state.analytics),
        ad_storage: g(state.marketing),
        ad_user_data: g(state.marketing),
        ad_personalization: g(state.marketing)
      });
      if (!state.marketing && loaded.marketing) {
        if (w.fbq) w.fbq('consent', 'revoke');
        if (w.ttq && w.ttq.revokeConsent) w.ttq.revokeConsent();
      }
      w.dispatchEvent(new CustomEvent('adsnew:consent-change'));
      if (revoked) { w.location.reload(); return; }
      apply();
    }
  };

  apply();
})(window, document);

// Баннер выбора. Показывается, если посетитель ещё не выбирал, или по ссылке [data-cookie-settings].
(function (w, d) {
  var css = '.ck-wrap{position:fixed;left:0;right:0;bottom:0;z-index:1000;padding:12px;font-family:Inter,sans-serif}' +
    '.ck-box{max-width:680px;margin:0 auto;background:#fff;border:1px solid #ddd;padding:20px;font-size:14px;line-height:1.5;color:#333;box-shadow:0 10px 40px rgba(0,0,0,.15);text-align:left}' +
    '.ck-box b{color:#000}.ck-box a{color:#000}.ck-opts{margin-top:12px;background:#f5f5f2;padding:12px}' +
    '.ck-opts label{display:flex;gap:10px;margin:6px 0;align-items:flex-start}.ck-opts input{margin-top:4px}' +
    '.ck-btns{margin-top:14px;display:flex;flex-wrap:wrap;gap:8px}' +
    '.ck-btns button{font:inherit;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:10px 18px;cursor:pointer;border:1px solid #000}' +
    '.ck-dark{background:#000;color:#fff}.ck-light{background:#fff;color:#000}';

  function open(details) {
    var api = w.adsConsent;
    if (!api || d.querySelector('.ck-wrap')) return;
    var c = api.get();
    var wrap = d.createElement('div');
    wrap.className = 'ck-wrap';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', 'Настройки cookie');
    wrap.innerHTML = '<style>' + css + '</style><div class="ck-box">' +
      '<b>Cookie на этом сайте</b><p style="margin:8px 0 0">Я использую cookie, чтобы считать посещения (Google Analytics) и показывать рекламу тем, кто заходил на сайт (Meta Pixel, TikTok Pixel). Вы можете разрешить всё, отказаться или выбрать сами. Изменить решение можно в любой момент по ссылке «Настройки cookie» внизу страницы. <a href="https://beauty.adsnew.org/privacy-policy#cookies">Подробнее</a></p>' +
      '<div class="ck-opts" hidden>' +
      '<label><input type="checkbox" checked disabled><span><b>Необходимые</b> — запоминают ваш выбор по cookie. Всегда включены.</span></label>' +
      '<label><input type="checkbox" data-k="analytics"' + (c.analytics ? ' checked' : '') + '><span><b>Статистика</b> — Google Analytics: сколько людей заходит и какие страницы читают.</span></label>' +
      '<label><input type="checkbox" data-k="marketing"' + (c.marketing ? ' checked' : '') + '><span><b>Реклама</b> — Meta Pixel и TikTok Pixel: оценка рекламы и показ объявлений тем, кто уже был на сайте.</span></label>' +
      '</div><div class="ck-btns">' +
      '<button type="button" class="ck-dark" data-a="all">Разрешить все</button>' +
      '<button type="button" class="ck-dark" data-a="none">Отклонить</button>' +
      '<button type="button" class="ck-light" data-a="more">Настроить</button>' +
      '</div></div>';
    d.body.appendChild(wrap);
    var opts = wrap.querySelector('.ck-opts');
    var more = wrap.querySelector('[data-a="more"]');
    function showDetails() { opts.hidden = false; more.textContent = 'Сохранить выбор'; more.setAttribute('data-a', 'save'); }
    if (details) showDetails();
    function save(next) { wrap.parentNode.removeChild(wrap); api.set(next); }
    wrap.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a');
      if (a === 'all') save({ analytics: true, marketing: true });
      else if (a === 'none') save({ analytics: false, marketing: false });
      else if (a === 'more') showDetails();
      else if (a === 'save') save({
        analytics: wrap.querySelector('[data-k="analytics"]').checked,
        marketing: wrap.querySelector('[data-k="marketing"]').checked
      });
    });
  }

  d.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-cookie-settings]') : null;
    if (t) { e.preventDefault(); open(true); }
  });
  function init() { if (w.adsConsent && !w.adsConsent.decided) open(false); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})(window, document);
