// Fast paint: synchronous localStorage mirror (no chrome.storage / IDB wait).
// Mirrored by newtab.js on every save. Full-res blob swaps in later.
// NOTE: #bg starts at opacity:0 until JS adds body.loaded, so the thumb is
// painted on <html> itself — the only layer visible before JS runs.
// #bg gets the same thumb pre-blurred so the swap is blur→sharp, not pop→sharp.
// External file (not inline) to satisfy MV3 content_security_policy.
(function () {
  try {
    (window.__ntpPerf = window.__ntpPerf || []).push({ m: 'head-fastpaint', t: Math.round(performance.now()) });
    var color = localStorage.getItem('ntp_bg_color') || '#202124';
    var rawThumb = localStorage.getItem('ntp_wp_thumb');
    var bright = parseInt(localStorage.getItem('ntp_wp_brightness') || '0', 10) || 0;
    var bv = (1.0 + bright * 0.08).toFixed(2);
    var bvDim = (parseFloat(bv) * 0.75).toFixed(2); // placeholder scrim: 25% dimmer
    var html = document.documentElement;
    // Color only — no thumb image here. A pixelated layer must never be visible;
    // the blurred #bg rule below is the first image frame.
    html.style.background = color;
    // Fix #11: validate thumb before injecting into CSS — a corrupted/tampered
    // localStorage value could contain quotes or break the CSS rule entirely.
    // Only accept well-formed data: URLs produced by our own _makeThumbDataUrl.
    var thumb = (rawThumb && rawThumb.indexOf('data:image') === 0) ? rawThumb : null;
    // #bg starts at opacity:0 until body.loaded — force it visible now so the
    // blurred thumb is literally the first painted frame (no pixelated flash,
    // no black gap). Later swaps control opacity themselves via inline styles.
    var css = '#bg{background-color:' + color + ';'
      + (thumb ? 'background-image:url("' + thumb + '");background-size:cover;background-position:center;background-repeat:no-repeat;filter:blur(5px) brightness(' + bvDim + ');transform:scale(1.05);opacity:1;'
               : 'background-image:none;');
    css += '}';
    var st = document.createElement('style');
    st.id = 'ntp-fastpaint';
    st.textContent = css;
    document.head.appendChild(st);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = color;
  } catch (e) {}

  // Fix #07c: if startup never reveals the page (storage hung, init threw),
  // show it anyway after 2s — a plain visible page beats a blank one.
  // Sits AFTER the catch so it schedules even when the block above throws.
  setTimeout(function () {
    if (document.body && !document.body.classList.contains('loaded')) {
      document.body.classList.add('loaded');
    }
  }, 2000);
})();
