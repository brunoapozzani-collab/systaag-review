/* v155-busca.js — typing in search boxes no longer "loses" letters.
   ROOT CAUSE: ~25 search/filter inputs re-render the whole screen on every keystroke
   (oninput="S.fq=this.value;renderMain()", "S.bdQ=…;renderMain()", "S.k53.q=…", "S.propF=…", render(), …).
   The <input> is destroyed and rebuilt, so focus and caret are lost after the first letter (and some
   screens rebuild the box with a trimmed / lower-cased / empty value, so a second word can't start).
   FIX (one global layer, no per-screen patches):
     1. remember the text box being typed in (id, or tag+placeholder+name+data-* + index), its value,
        caret and scroll, on every input event (capture phase, before the screen's own handler);
     2. a MutationObserver: when that box is removed by any re-render (renderMain, render, partial
        list re-draws…), find the equivalent new box, put back value, focus, caret and scroll —
        before the next keystroke is processed;
     3. renderMain()/render() called from a text input's input event are debounced (~180 ms) so
        typing stays smooth on heavy screens; never re-render during IME / dead-key composition
        (ç, ã, é…) — the pending render runs right after compositionend.
   Idempotent, defensive: every step is wrapped in try/catch. */
(function () {
  'use strict';
  if (window.__v155busca) return;
  window.__v155busca = { v: 1 };
  var W = window, D = document;
  var DELAY = 180;          // debounce for renders triggered by typing
  var WINDOW_MS = 4000;     // restore only if the user typed this recently

  function texty(el) {
    try {
      if (!el || el.nodeType !== 1) return false;
      if (el.tagName === 'TEXTAREA') return !el.readOnly && !el.disabled;
      if (el.tagName !== 'INPUT') return false;
      var t = (el.getAttribute('type') || 'text').toLowerCase();
      return /^(text|search|email|tel|url|password|number)$/.test(t) && !el.disabled;
    } catch (e) { return false; }
  }
  function sig(el) {
    var s = el.tagName + '|' + (el.getAttribute('type') || '') + '|' + (el.getAttribute('placeholder') || '') + '|' + (el.getAttribute('name') || '');
    ['data-cf', 'data-k', 'data-q', 'data-key', 'data-f'].forEach(function (a) { if (el.hasAttribute(a)) s += '|' + a + '=' + el.getAttribute(a); });
    return s;
  }
  function rootOf(el) {
    return (el.closest && (el.closest('.modal,[role=dialog],#modalRoot,.offcanvas') || el.closest('#main'))) || D.body;
  }
  function rootKey(r) { return r === D.body ? 'body' : (r.id ? '#' + r.id : (r.getAttribute('role') === 'dialog' ? 'dialog' : '.' + (r.className || '').toString().split(' ')[0])); }
  function sameSig(root, s) {
    var out = [], all = root.querySelectorAll('input,textarea');
    for (var i = 0; i < all.length; i++) if (texty(all[i]) && sig(all[i]) === s) out.push(all[i]);
    return out;
  }
  function describe(el) {
    var root = rootOf(el), s = sig(el), list = sameSig(root, s);
    return { id: el.id || '', sig: s, root: rootKey(root), idx: Math.max(0, list.indexOf(el)) };
  }
  function findRoot(key) {
    if (key === 'body') return D.body;
    if (key.charAt(0) === '#') return D.getElementById(key.slice(1));
    if (key === 'dialog') return D.querySelector('[role=dialog]');
    try { return D.querySelector(key); } catch (e) { return null; }
  }
  function find(d) {
    if (d.id) { var e = D.getElementById(d.id); if (e && texty(e)) return e; }
    var root = findRoot(d.root) || D.body, list = sameSig(root, d.sig);
    if (!list.length && root !== D.body) list = sameSig(D.body, d.sig);
    if (!list.length) return null;
    return list[Math.min(d.idx, list.length - 1)];
  }

  var last = null;          // {el, d, value, ss, se, dir, t, hash, valueOK, winY, mainTop}
  var composing = false;

  function record(el, fromInput) {
    try {
      var m = D.getElementById('main');
      var ss = null, se = null, dir = 'none';
      try { ss = el.selectionStart; se = el.selectionEnd; dir = el.selectionDirection || 'none'; } catch (e) {}
      last = {
        el: el, d: describe(el), value: el.value, ss: ss, se: se, dir: dir,
        t: fromInput ? Date.now() : (last && last.el === el ? last.t : 0),
        hash: location.hash, valueOK: fromInput ? true : (last && last.el === el ? last.valueOK : false),
        winY: W.scrollY, mainTop: m ? m.scrollTop : 0, lostAt: 0
      };
    } catch (e) {}
  }

  D.addEventListener('input', function (e) { try { ensureWrapped(); if (texty(e.target)) record(e.target, true); } catch (x) {} }, true);
  D.addEventListener('focusin', function (e) {
    try {
      if (restoring) return;
      // a screen's own "re-focus after render" lands here while our box was just destroyed: let restore() decide
      if (last && last.el && !last.el.isConnected && Date.now() - last.t < WINDOW_MS) { restore(); return; }
      if (texty(e.target)) { if (!last || last.el !== e.target) record(e.target, false); }
      else last = null; // user moved to a button/select/etc: never pull focus back
    } catch (x) {}
  }, true);
  D.addEventListener('focusout', function (e) { try { if (last && e.target === last.el) last.lostAt = Date.now(); } catch (x) {} }, true);
  D.addEventListener('keyup', function (e) { try { if (last && e.target === last.el) record(e.target, false); } catch (x) {} }, true);
  D.addEventListener('select', function (e) { try { if (last && e.target === last.el) record(e.target, false); } catch (x) {} }, true);
  D.addEventListener('keydown', function (e) {
    try {
      if (!last || e.target !== last.el) return;
      // Enter / Escape / Tab may legitimately clear or leave the box: don't force the old value back
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'Tab') { last.valueOK = false; if (e.key === 'Tab') last = null; }
    } catch (x) {}
  }, true);
  D.addEventListener('pointerdown', function (e) {
    try { if (last && e.target !== last.el && !(e.target.closest && e.target.closest('label') && e.target.closest('label').contains(last.el))) last = null; } catch (x) {}
  }, true);
  D.addEventListener('compositionstart', function () { composing = true; }, true);
  D.addEventListener('compositionend', function () {
    composing = false;
    try { if (pending) { clearTimeout(pending.timer); var p = pending; pending.timer = setTimeout(function () { flush(p); }, 30); } } catch (x) {}
  }, true);

  var restoring = false;
  function restore() {
    if (!last || !last.el || last.el.isConnected) return;
    // measure from the moment the box was destroyed (a heavy screen can keep the thread busy for seconds after)
    if ((last.lostAt || Date.now()) - last.t > WINDOW_MS) { last = null; return; }
    if (location.hash !== last.hash) { last = null; return; }
    var ne = find(last.d);
    if (!ne || ne === last.el) return;
    restoring = true;
    try {
      if (last.valueOK && ne.value !== last.value) ne.value = last.value;
      if (D.activeElement !== ne) { try { ne.focus({ preventScroll: true }); } catch (e) { ne.focus(); } }
      if (last.ss != null) { try { ne.setSelectionRange(Math.min(last.ss, ne.value.length), Math.min(last.se, ne.value.length), last.dir); } catch (e) {} }
      try {
        if (Math.abs(W.scrollY - last.winY) > 2) W.scrollTo({ top: last.winY, left: W.scrollX, behavior: 'instant' });
        var m = D.getElementById('main'); if (m && Math.abs(m.scrollTop - last.mainTop) > 2) m.scrollTop = last.mainTop;
      } catch (e) {}
      last.el = ne;
    } catch (e) {} finally { restoring = false; }
  }
  try {
    new MutationObserver(function () { try { restore(); } catch (e) {} })
      .observe(D.documentElement, { childList: true, subtree: true });
  } catch (e) {}

  /* ---- debounce renders that come from typing in a text box ---- */
  var pending = null;
  function fromTyping() {
    try {
      var ev = W.event;
      return !!(ev && ev.type === 'input' && texty(ev.target));
    } catch (e) { return false; }
  }
  function flush(p) {
    if (pending !== p) return;
    if (composing) return;           // compositionend will flush
    pending = null;
    try { p.fn.apply(p.self, p.args); } catch (e) { console.error('v155-busca render', e); }
    try { restore(); } catch (e) {}
  }
  function wrap(name) {
    var f = W[name];
    if (typeof f !== 'function' || f.__v155) return;   // outermost layer is already ours
    // (if a later overlay wrapped ours, we wrap again on top: the outer one defers, the inner passes through)
    var w = function () {
      if (fromTyping() || composing) {
        // render() covers renderMain(): keep the "biggest" pending call
        var fn = (pending && pending.name === 'render') ? pending.fn : w.__orig;
        var nm = (pending && pending.name === 'render') ? 'render' : name;
        if (pending) clearTimeout(pending.timer);
        var p = { fn: fn, name: nm, self: this, args: arguments };
        pending = p;
        p.timer = setTimeout(function () { flush(p); }, DELAY);
        return;
      }
      if (pending && (name === 'render' || pending.name === name)) { clearTimeout(pending.timer); pending = null; }
      return w.__orig.apply(this, arguments);
    };
    w.__orig = f; w.__v155 = true;
    try { W[name] = w; } catch (e) {}
  }
  function ensureWrapped() { try { wrap('renderMain'); wrap('render'); } catch (e) {} }
  ensureWrapped();
  // later overlays may re-assign renderMain: re-wrap on the next tick and on load
  setTimeout(ensureWrapped, 0);
  W.addEventListener('load', ensureWrapped);
  W.__v155busca.restore = restore;
  W.__v155busca.state = function () { return { last: last && { d: last.d, value: last.value }, pending: !!pending, composing: composing }; };
})();
