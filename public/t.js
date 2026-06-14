/* Tracque tracking snippet — drop on any site:
   <script async src="https://tracque.com/t.js" data-tracque="YOUR_SITE_KEY"></script>
   Captures AI-referred visits, exposes tracque('conversion', {value}), mirrors to GA4. */
(function () {
  var ENDPOINT = 'https://poarbxoeswwxexwnrugp.supabase.co/functions/v1/track';
  var s = document.currentScript || (function () { var a = document.getElementsByTagName('script'); return a[a.length - 1]; })();
  var SITE_KEY = s && s.getAttribute('data-tracque');
  if (!SITE_KEY) return;

  function cookie(name, value, days) {
    if (value === undefined) {
      var m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
      return m ? m.pop() : null;
    }
    var d = new Date(); d.setTime(d.getTime() + (days || 365) * 864e5);
    document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }
  function uid() { return (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)); }
  function qp(k) { try { return new URLSearchParams(location.search).get(k) || ''; } catch (e) { return ''; } }

  // Stable first-party visitor id.
  var vid = cookie('_tq_vid'); if (!vid) { vid = uid(); cookie('_tq_vid', vid); }

  function send(payload, useBeacon) {
    payload.site_key = SITE_KEY; payload.visitor_id = vid;
    var body = JSON.stringify(payload);
    if (useBeacon && navigator.sendBeacon) { navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' })); return; }
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
  }

  // ── Visit beacon (fired once on load) ──
  var visit = {
    type: 'visit',
    referrer: document.referrer || '',
    landing_path: location.pathname + location.search,
    utm_source: qp('utm_source'), utm_medium: qp('utm_medium'), utm_campaign: qp('utm_campaign'),
    gclid: qp('gclid'), fbclid: qp('fbclid')
  };
  // One visit insert; use its response to remember the source so later
  // conversions attribute to it (last-touch).
  fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ site_key: SITE_KEY, visitor_id: vid }, visit)) })
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d && d.source && d.source !== 'direct') { cookie('_tq_src', d.source); cookie('_tq_ai', d.is_ai ? '1' : '0'); } })
    .catch(function () {});

  // ── Public API: tracque('conversion', { value, event, currency }) ──
  window.tracque = function (cmd, opts) {
    opts = opts || {};
    if (cmd === 'conversion') {
      var src = cookie('_tq_src') || 'direct';
      var isAi = cookie('_tq_ai') === '1';
      send({ type: 'conversion', source: src, is_ai: isAi, event_name: opts.event || 'conversion', value: opts.value, currency: opts.currency || 'USD' }, true);
      // GA4 mirror — co-fire into the customer's existing analytics if present.
      if (typeof window.gtag === 'function') {
        window.gtag('event', opts.event || 'tracque_conversion', { value: opts.value, currency: opts.currency || 'USD', tracque_source: src });
      }
    }
  };
})();
