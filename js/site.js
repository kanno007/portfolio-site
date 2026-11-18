(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Theme ---------- */
  var themeBtn = document.getElementById('theme');
  var sun = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var moon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
  function setTheme(t, persist) {
    if (t === 'light') root.setAttribute('data-theme', 'light'); else root.setAttribute('data-theme', 'dark');
    themeBtn.innerHTML = t === 'light' ? moon : sun;
    themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    if (persist) { try { localStorage.setItem('km-theme', t); } catch (e) {} }
    if (window.__lens) window.__lens.recolor();
  }
  var saved = null; try { saved = localStorage.getItem('km-theme'); } catch (e) {}
  setTheme(saved === 'dark' ? 'dark' : 'light', false);
  themeBtn.addEventListener('click', function () { setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true); });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  var io = null;
  if (!reduce && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Page transitions (colour curtain between real pages) ---------- */
  var curtain = document.getElementById('curtain');
  var leaving = false;
  if (curtain && curtain.style.transform) {
    void curtain.offsetHeight;
    curtain.style.transition = ''; curtain.style.transform = '';
    curtain.classList.add('out');
    setTimeout(function () { curtain.classList.remove('out'); }, 600);
  }
  window.addEventListener('pageshow', function (e) { if (e.persisted && curtain) { leaving = false; curtain.className = 'curtain'; } });
  document.addEventListener('click', function (e) {
    if (reduce || leaving || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var u; try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.origin !== location.origin) return;
    if (u.pathname === location.pathname && u.search === location.search) return; // same page / in-page hash
    e.preventDefault(); leaving = true;
    try { sessionStorage.setItem('km-c', '1'); } catch (err) {}
    curtain.classList.add('in');
    setTimeout(function () { location.href = u.href; }, 480);
  });

  /* ---------- Header gets a surface once the page scrolls ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() { header.classList.toggle('scrolled', (window.scrollY || document.documentElement.scrollTop) > 12); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var menu = document.getElementById('menu');
  var menuBtn = document.getElementById('menu-btn');
  function openMenu() { menu.hidden = false; menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.setAttribute('aria-label', 'Close menu'); document.body.style.overflow = 'hidden'; }
  function closeMenu() { if (menu.hidden) return; menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu'); document.body.style.overflow = ''; }
  menuBtn.addEventListener('click', function () { if (menu.hidden) openMenu(); else closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Clock ---------- */
  var clocks = document.querySelectorAll('[data-clock]');
  function tick() {
    var s;
    try { s = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date()); } catch (e) { return; }
    for (var i = 0; i < clocks.length; i++) clocks[i].innerHTML = 'It’s <b>' + s + '</b> in ' + (clocks[i].getAttribute('data-city') || 'Ahmedabad') + '.';
  }
  tick(); setInterval(tick, 20000);

  /* ---------- Cursor + floating preview ---------- */
  var cursor = document.getElementById('cursor');
  var peek = document.getElementById('peek');
  var cx = 0, cy = 0, px = 0, py = 0, tx = 0, ty = 0, peekOn = false, shown = false;
  if (fine && !reduce) {
    document.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; if (!shown) { shown = true; px = tx; py = ty; cursor.classList.add('on'); } });
    document.addEventListener('pointerleave', function () { cursor.classList.remove('on'); shown = false; });
    document.addEventListener('pointerover', function (e) { var t = e.target.closest && e.target.closest('a, button, input, label'); cursor.classList.toggle('big', !!t); });
    var rows = document.querySelectorAll('.index a[data-img]');
    var peekImg = document.createElement('img'); peekImg.alt = ''; peek.appendChild(peekImg);
    for (var r = 0; r < rows.length; r++) {
      rows[r].addEventListener('pointerenter', function () {
        var src = this.querySelector('.thumb img');
        if (!src) return;
        peekImg.src = src.getAttribute('src');
        peek.className = 'peek show';
        peekOn = true;
      });
      rows[r].addEventListener('pointerleave', function () { peek.classList.remove('show'); peekOn = false; });
    }
    (function loop() {
      cx += (tx - cx) * .35; cy += (ty - cy) * .35;
      cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
      if (peekOn) { px += (tx - px) * .12; py += (ty - py) * .12; }
      var tilt = Math.max(-6, Math.min(6, (tx - px) * .05));
      peek.style.transform = 'translate(' + (px + 28) + 'px,' + (py - 200) + 'px) rotate(' + tilt + 'deg) scale(' + (peekOn ? 1 : .9) + ')';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Clarity lens hero ---------- */
  (function () {
    var canvas = document.getElementById('lens');
    var hero = document.getElementById('hero');
    var titleEl = document.getElementById('hero-title');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, items = [], shields = [], light = false;
    var ptr = { x: -9999, y: -9999, tx: 0, ty: 0 };
    var auto = true, t = Math.random() * 100, raf = null, visible = true, enabled = true;
    var col = { ink: '#142A23', accent: '#0E5E46', base: .07, peak: .55, shieldMul: .12 };

    function readColors() {
      var cs = getComputedStyle(root);
      col.ink = cs.getPropertyValue('--ink').trim() || '#fff';
      col.accent = cs.getPropertyValue('--accent').trim() || '#0E5E46';
      light = root.getAttribute('data-theme') === 'light';
      col.base = light ? .07 : .13; col.peak = light ? .55 : .82; col.shieldMul = light ? .12 : .2;
    }
    function smooth(e0, e1, x) { x = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return x * x * (3 - 2 * x); }
    function build() {
      var rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height; dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      var c = W < 700 ? 24 : 30;
      var cols = Math.ceil(W / c) + 2, rows = Math.ceil(H / c) + 2;
      var seed = 1337; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      items = [];
      for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
        var gx = i * c, gy = j * c;
        var kind = rnd();
        var w = kind < .55 ? c * .62 : kind < .82 ? c * .4 : c * .2;
        var h = kind < .82 ? Math.max(2.5, c * .12) : c * .2;
        items.push({ gx: gx, gy: gy, sx: gx + (rnd() - .5) * c * 2.6, sy: gy + (rnd() - .5) * c * 2.6, sr: (rnd() - .5) * 1.4, w: w, h: h, t: 0, acc: rnd() < .14, round: kind >= .82 });
      }
      var hr = canvas.getBoundingClientRect();
      var els = [titleEl].concat(Array.prototype.slice.call(hero.querySelectorAll('.lede, .hero-meta, .hero-actions')));
      shields = [];
      for (var e = 0; e < els.length; e++) {
        var tr = els[e].getBoundingClientRect();
        shields.push({ x: tr.left - hr.left - 16, y: tr.top - hr.top - 14, w: tr.width + 32, h: tr.height + 28 });
      }
      ptr.tx = W * .62; ptr.ty = H * .42; if (ptr.x < -1000) { ptr.x = ptr.tx; ptr.y = ptr.ty; }
    }
    function draw(step) {
      if (step) {
        t += .016;
        if (auto) { ptr.tx = W * (.5 + .36 * Math.sin(t * .33)); ptr.ty = H * (.46 + .3 * Math.cos(t * .26)); }
        ptr.x += (ptr.tx - ptr.x) * .07; ptr.y += (ptr.ty - ptr.y) * .07;
      }
      var R = Math.max(160, Math.min(W, H) * .36), R2 = R * R;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var n = 0; n < items.length; n++) {
        var it = items[n];
        var dx = it.gx - ptr.x, dy = it.gy - ptr.y, d2 = dx * dx + dy * dy;
        var target = d2 < R2 ? 1 - smooth(.3, 1, Math.sqrt(d2) / R) : 0;
        it.t += (target - it.t) * (step ? .1 : 1);
        var tt = it.t;
        var x = it.sx + (it.gx - it.sx) * tt, y = it.sy + (it.gy - it.sy) * tt, r = it.sr * (1 - tt);
        var a = col.base + col.peak * tt;
        for (var q = 0; q < shields.length; q++) { var sh = shields[q]; if (x > sh.x && x < sh.x + sh.w && y > sh.y && y < sh.y + sh.h) { a *= col.shieldMul; break; } }
        var cs = Math.cos(r), sn = Math.sin(r);
        ctx.setTransform(cs * dpr, sn * dpr, -sn * dpr, cs * dpr, x * dpr, y * dpr);
        ctx.globalAlpha = a;
        ctx.fillStyle = (it.acc && tt > .45) ? col.accent : col.ink;
        if (it.round) { ctx.beginPath(); ctx.arc(0, 0, it.w / 2, 0, 6.2832); ctx.fill(); }
        else ctx.fillRect(-it.w / 2, -it.h / 2, it.w, it.h);
      }
      ctx.globalAlpha = 1;
    }
    function frame() { draw(true); raf = requestAnimationFrame(frame); }
    function start() { if (reduce) { draw(false); return; } if (!raf && visible && enabled) raf = requestAnimationFrame(frame); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    hero.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect(); auto = false; ptr.tx = e.clientX - r.left; ptr.ty = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', function () { auto = true; });
    hero.addEventListener('touchmove', function (e) {
      var r = canvas.getBoundingClientRect(); auto = false; ptr.tx = e.touches[0].clientX - r.left; ptr.ty = e.touches[0].clientY - r.top;
    }, { passive: true });
    hero.addEventListener('touchend', function () { auto = true; });

    var resizeTimer;
    window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(function () { build(); if (reduce) draw(false); }, 120); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); else stop(); }, { threshold: 0 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

    window.__lens = {
      recolor: function () { readColors(); if (reduce) draw(false); },
      toggle: function (on) { enabled = on; if (on) { build(); start(); } else stop(); }
    };
    readColors();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { build(); if (reduce) draw(false); });
    build(); start();
  })();

  /* ---------- Copy email ---------- */
  var copyBtns = document.querySelectorAll('.copy-btn');
  for (var cb = 0; cb < copyBtns.length; cb++) {
    copyBtns[cb].addEventListener('click', function () {
      var btn = this, val = btn.getAttribute('data-copy'), orig = btn.textContent;
      function done() { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = orig; }, 1600); }
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(val).then(done, done); }
      else { var t = document.createElement('textarea'); t.value = val; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(t); done(); }
    });
  }

  /* ---------- Journal: section lists, copy link, topic filter ---------- */
  var postViews = document.querySelectorAll('.view.post');
  for (var pv = 0; pv < postViews.length; pv++) (function (view) {
    var toc = view.querySelector('.toc'), heads = view.querySelectorAll('.prose h2');
    for (var h = 0; h < heads.length; h++) {
      var id = view.getAttribute('data-view') + '-s' + (h + 1);
      heads[h].id = id;
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.textContent = heads[h].textContent; b.setAttribute('data-target', id);
      b.addEventListener('click', function () { var el = document.getElementById(this.getAttribute('data-target')); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
      li.appendChild(b); toc.appendChild(li);
    }
    var cl = view.querySelector('.copy-link');
    if (cl) cl.addEventListener('click', function () {
      var btn = this, orig = btn.textContent, url = location.href.split('#')[0];
      function done() { btn.textContent = 'Link copied'; setTimeout(function () { btn.textContent = orig; }, 1600); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, done); else done();
    });
  })(postViews[pv]);
  var topicBtns = document.querySelectorAll('.topics .chip-btn');
  for (var tb = 0; tb < topicBtns.length; tb++) topicBtns[tb].addEventListener('click', function () {
    var t = this.getAttribute('data-topic');
    for (var x = 0; x < topicBtns.length; x++) topicBtns[x].classList.toggle('is-on', topicBtns[x] === this);
    var items = document.querySelectorAll('.plist li'), shown = 0;
    for (var y = 0; y < items.length; y++) { var on = t === 'all' || items[y].getAttribute('data-topic') === t; items[y].hidden = !on; if (on) shown++; }
    var empty = document.querySelector('.plist-empty'); if (empty) empty.hidden = shown > 0;
  });

  /* ---------- Case studies: section list in the rail ---------- */
  var caseRails = document.querySelectorAll('.case-story'), caseItems = [];
  for (var cr = 0; cr < caseRails.length; cr++) (function (wrapEl, n) {
    var toc = wrapEl.querySelector('.case-toc-list'), stories = wrapEl.querySelectorAll('.case-col .story');
    for (var i = 0; i < stories.length; i++) {
      var h = stories[i].querySelector('h2'), lab = stories[i].querySelector('.label'); if (!h) continue;
      var id = 'case' + n + '-s' + (i + 1); h.id = id;
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.textContent = lab ? lab.textContent : h.textContent; b.setAttribute('data-target', id);
      b.addEventListener('click', function () { var el = document.getElementById(this.getAttribute('data-target')); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
      li.appendChild(b); toc.appendChild(li);
      caseItems.push({ b: b, el: stories[i] });
    }
  })(caseRails[cr], cr);

  /* Highlight the section currently being read in the rail */
  if (caseItems.length) {
    var caseTick = false;
    var markCase = function () {
      caseTick = false;
      var line = window.innerHeight * 0.35, cur = null;
      for (var k = 0; k < caseItems.length; k++) if (caseItems[k].el.getBoundingClientRect().top <= line) cur = caseItems[k];
      for (var m = 0; m < caseItems.length; m++) {
        var on = caseItems[m] === cur;
        caseItems[m].b.classList.toggle('is-active', on);
        if (on) caseItems[m].b.setAttribute('aria-current', 'true'); else caseItems[m].b.removeAttribute('aria-current');
      }
    };
    window.addEventListener('scroll', function () { if (!caseTick) { caseTick = true; requestAnimationFrame(markCase); } }, { passive: true });
    markCase();
  }

})();

/* Click any zoomable image to view it full screen */
(function () {
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!(t && t.classList && t.classList.contains('zoomable'))) return;
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-label', t.alt || 'Image');
    var im = document.createElement('img');
    im.src = t.currentSrc || t.src;
    im.alt = t.alt || '';
    function setTall() { if (im.naturalHeight > im.naturalWidth * 1.25) lb.classList.add('tall'); }
    if (im.complete) setTall(); else im.addEventListener('load', setTall);
    var hint = document.createElement('span');
    hint.className = 'lb-hint';
    hint.textContent = 'Tap anywhere or press Esc to close';
    lb.appendChild(im);
    lb.appendChild(hint);
    document.body.appendChild(lb);
    document.body.style.overflow = 'hidden';
    function close() {
      if (lb.parentNode) lb.parentNode.removeChild(lb);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    }
    function onKey(ev) { if (ev.key === 'Escape') close(); }
    lb.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
  });
})();
