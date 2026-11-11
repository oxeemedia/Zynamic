/* Zynamik Direct: tracking i slanje formi u Google Sheet (preko Apps Script).
 * Jedino podešavanje: ZD_ENDPOINT ispod. Dok je prazno, sajt radi u DEMO modu
 * (ništa se ne šalje, sve se samo loguje u konzolu).
 */
(function () {
  'use strict';

  // Ovde ide URL Apps Script web app-a (Deploy -> Web app -> URL koji se završava na /exec)
  var ZD_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzK4vu8dBevxebioJgjVa3ts8iQ9JTtVAZAYMZfud-bYwu1FkHbk-pVvCyX2mhJswOE/exec';

  var LS = window.localStorage, SS = window.sessionStorage;
  function get(store, k) { try { return store.getItem(k); } catch (e) { return null; } }
  function set(store, k, v) { try { store.setItem(k, v); } catch (e) {} }
  function rid(n) {
    var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
    for (var i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)];
    return s;
  }

  // Posetilac (trajno) i sesija (do zatvaranja taba)
  var vid = get(LS, 'zd_vid'); if (!vid) { vid = rid(12); set(LS, 'zd_vid', vid); }
  var sid = get(SS, 'zd_sid'); if (!sid) { sid = rid(10); set(SS, 'zd_sid', sid); }

  // Izvor: UTM parametri i referrer, pamti se prvi dodir (first-touch)
  var q = new URLSearchParams(location.search);
  if (q.get('utm_source') || q.get('fbclid') || q.get('gclid')) {
    set(LS, 'zd_src', JSON.stringify({
      source: q.get('utm_source') || (q.get('fbclid') ? 'facebook' : (q.get('gclid') ? 'google' : '')),
      medium: q.get('utm_medium') || (q.get('fbclid') || q.get('gclid') ? 'paid' : ''),
      campaign: q.get('utm_campaign') || ''
    }));
  } else if (!get(LS, 'zd_src')) {
    var ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
    if (ref && ref.indexOf(location.hostname) < 0) {
      ref = ref.replace(/^www\.|^m\.|^l\./, '');
      set(LS, 'zd_src', JSON.stringify({ source: ref.split('.')[0], medium: 'referral', campaign: '' }));
    }
  }
  function src() {
    try { return JSON.parse(get(LS, 'zd_src') || 'null') || { source: 'direct', medium: '', campaign: '' }; }
    catch (e) { return { source: 'direct', medium: '', campaign: '' }; }
  }

  function page() {
    return (location.pathname.split('/').pop() || 'Main').replace(/\.dc\.html$|\.html$/, '') || 'Main';
  }

  function payload(type, data) {
    var s = src();
    return {
      type: type, ts: new Date().toISOString(), vid: vid, sid: sid, page: page(),
      source: s.source, medium: s.medium, campaign: s.campaign,
      device: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      data: data || {}
    };
  }

  // Slanje: text/plain da browser ne radi CORS preflight (Apps Script ga ne podržava)
  function send(type, data) {
    var body = JSON.stringify(payload(type, data));
    if (!ZD_ENDPOINT) { try { console.info('[ZD demo]', type, JSON.parse(body)); } catch (e) {} return Promise.resolve(); }
    var blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
    // Eventi idu beaconom (prežive zatvaranje stranice), porudžbine i forme preko fetch
    if (type === 'event' && navigator.sendBeacon && navigator.sendBeacon(ZD_ENDPOINT, blob)) return Promise.resolve();
    return fetch(ZD_ENDPOINT, { method: 'POST', mode: 'no-cors', body: body, keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' } }).catch(function () {
      // Ako mreža padne, sačuvaj pa pošalji sledeći put
      var qd = []; try { qd = JSON.parse(get(LS, 'zd_queue') || '[]'); } catch (e) {}
      qd.push(body); set(LS, 'zd_queue', JSON.stringify(qd.slice(-20)));
    });
  }

  function flushQueue() {
    if (!ZD_ENDPOINT) return;
    var qd = []; try { qd = JSON.parse(get(LS, 'zd_queue') || '[]'); } catch (e) {}
    if (!qd.length) return;
    set(LS, 'zd_queue', '[]');
    qd.forEach(function (b) {
      fetch(ZD_ENDPOINT, { method: 'POST', mode: 'no-cors', body: b, headers: { 'Content-Type': 'text/plain;charset=UTF-8' } }).catch(function () {});
    });
  }

  // Skuplja sva polja forme koja imaju name=""
  function form(el) {
    var out = {};
    if (!el || !el.elements) return out;
    for (var i = 0; i < el.elements.length; i++) {
      var f = el.elements[i];
      if (!f.name || f.type === 'submit' || f.type === 'button') continue;
      out[f.name] = (f.value || '').trim();
    }
    return out;
  }

  function orderId() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'ZD' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + rid(4);
  }

  var api = {
    send: send,
    form: form,
    orderId: orderId,
    event: function (name, props) { return send('event', Object.assign({ name: name }, props || {})); }
  };
  window.ZD = api;

  // Automatski: pregled stranice + klik na bilo koje dugme ka checkoutu
  function boot() {
    api.event('pageview', { path: page() });
    flushQueue();
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href*="Checkout"]') : null;
      if (a) api.event('cta_click', { from: page() });
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
