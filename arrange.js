/* ============================================================================
   arrange.js — Tweaks: "Sleep om te ordenen" + "Foto's vervangen"
   ----------------------------------------------------------------------------
   A small Tweaks panel (wired to the host edit-mode toggle) with two tools:

   1. Sleep om te ordenen  — drag any heading/text/card anywhere on the page.
   2. Foto's vervangen      — click any photo or photo-placeholder to upload
                              your own image. Uploads are downscaled and stored
                              per-page in localStorage, so they survive reloads
                              and never touch the original markup.

   Vanilla JS, no dependencies. Load once per page: <script src="arrange.js">.
   ========================================================================== */
(function () {
  if (window.__sgArrangeLoaded) return;
  window.__sgArrangeLoaded = true;

  var ACCENT = '#e0521f';
  var PAGE = location.pathname.split('/').pop() || 'index';
  var STORE_POS = 'sg_arrange_' + PAGE;
  var STORE_IMG = 'sg_images_' + PAGE;
  var STORE_SIZE = 'sg_sizes_' + PAGE;

  /* Draggable elements. */
  var DRAG_SELECTOR = [
    'h1', 'h2', 'h3', 'h4', 'p', 'blockquote',
    '.eyebrow', '.section-eyebrow', '.dim-num', '.dim-title', '.dim-lede',
    '.lede', '.section-lede', '.role-tag',
    '.feature', '.benefit', '.stat', '.over-stat',
    '.gallery-item', '.person', '.pf-feat', '.quote-card', '.hero-ctas',
    '.cta-row', '.btn'
  ].join(',');

  /* Image slots: real <img> plus placeholder containers. */
  var IMG_SELECTOR = ['img', '.team-photo', '.quote-photo', '.pf-shot', '.gallery-item'].join(',');

  /* Resizable elements: text blocks + picture/card boxes (non-void containers). */
  var SIZE_SELECTOR = [
    'h1', 'h2', 'h3', 'h4', 'p', 'blockquote',
    '.section-title', '.lede', '.section-lede', '.dim-num',
    '.feature', '.benefit', '.stat', '.gallery-item', '.pf-shot',
    '.quote-photo', '.team-photo', '.quote-card', '.btn'
  ].join(',');

  var EXCLUDE = 'nav, footer, form, .arr-panel, [data-omelette-chrome], [data-arr-skip]';

  var offsets = loadJSON(STORE_POS);
  var images = loadJSON(STORE_IMG);
  var sizes = loadJSON(STORE_SIZE);
  var dragMode = false, imgMode = false, sizeMode = false;
  var els = [], slots = [], sizables = [], selected = null;

  // ── persistence ──────────────────────────────────────────────────────────
  function loadJSON(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (_) { return {}; } }
  function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } }

  // ── styles ─────────────────────────────────────────────────────────────--
  function injectStyle() {
    var css = ''
      + '.arr-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:262px;'
      + 'font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;background:#0f1722;'
      + 'color:#E8EEF5;border:1px solid rgba(255,255,255,.14);border-radius:14px;'
      + 'box-shadow:0 20px 56px rgba(0,0,0,.55);overflow:hidden;}'
      + '.arr-panel[hidden]{display:none;}'
      + '.arr-hd{display:flex;align-items:center;justify-content:space-between;'
      + 'padding:12px 14px 12px 16px;border-bottom:1px solid rgba(255,255,255,.1);}'
      + '.arr-hd b{font-size:14px;font-weight:600;letter-spacing:-.01em;}'
      + '.arr-x{appearance:none;border:0;background:transparent;color:rgba(255,255,255,.55);'
      + 'font-size:15px;line-height:1;cursor:pointer;padding:4px;border-radius:6px;}'
      + '.arr-x:hover{color:#fff;background:rgba(255,255,255,.08);}'
      + '.arr-body{padding:14px 16px;display:flex;flex-direction:column;gap:13px;}'
      + '.arr-sec{display:flex;flex-direction:column;gap:7px;}'
      + '.arr-sec+.arr-sec{padding-top:13px;border-top:1px solid rgba(255,255,255,.09);}'
      + '.arr-row{display:flex;align-items:center;justify-content:space-between;gap:10px;'
      + 'font-size:13px;font-weight:500;}'
      + '.arr-toggle{appearance:none;border:0;width:42px;height:24px;border-radius:999px;'
      + 'background:rgba(255,255,255,.22);position:relative;cursor:pointer;flex:none;transition:background .15s;}'
      + '.arr-toggle::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;'
      + 'border-radius:50%;background:#fff;transition:transform .16s cubic-bezier(.4,1.3,.5,1);}'
      + '.arr-toggle[aria-checked="true"]{background:' + ACCENT + ';}'
      + '.arr-toggle[aria-checked="true"]::after{transform:translateX(18px);}'
      + '.arr-hint{font-size:11.5px;line-height:1.5;color:rgba(255,255,255,.6);margin:0;}'
      + '.arr-reset{appearance:none;padding:8px 10px;border-radius:9px;'
      + 'border:1px solid rgba(255,255,255,.18);background:transparent;color:inherit;'
      + 'font:inherit;font-size:11.5px;font-weight:500;cursor:pointer;transition:.15s;flex:1;}'
      + '.arr-reset:hover{border-color:' + ACCENT + ';color:#f3936a;}'
      + '.arr-reset:disabled{opacity:.4;cursor:default;}'
      // drag affordances
      + 'body.arr-on [data-arr]{cursor:grab;outline:1px dashed rgba(224,82,31,.45);'
      + 'outline-offset:3px;border-radius:3px;touch-action:none;}'
      + 'body.arr-on [data-arr]:hover{outline:1.5px solid ' + ACCENT + ';}'
      + '[data-arr].arr-dragging{outline:2px solid ' + ACCENT + ' !important;'
      + 'box-shadow:0 16px 40px rgba(0,0,0,.4);opacity:.92;z-index:9999;position:relative;}'
      + 'body.arr-grabbing,body.arr-grabbing *{cursor:grabbing !important;user-select:none !important;}'
      // image-slot affordances
      + 'body.img-on [data-imgslot]{outline:1.5px dashed rgba(224,82,31,.55);outline-offset:2px;}'
      + '.arr-upload{position:absolute;z-index:60;top:8px;right:8px;display:none;align-items:center;'
      + 'gap:6px;padding:7px 11px;border:0;border-radius:8px;background:' + ACCENT + ';color:#fff;'
      + 'font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;font-weight:600;letter-spacing:.02em;'
      + 'cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.35);}'
      + '.arr-upload:hover{filter:brightness(1.08);}'
      + 'body.img-on [data-imgslot]{position:relative;}'
      + 'body.img-on .arr-imgslot-parent{position:relative;}'
      + 'body.img-on .arr-upload{display:inline-flex;}'
      // resize affordances
      + 'body.size-on [data-arr-size]{outline:1.5px dashed rgba(224,82,31,.45);outline-offset:2px;cursor:pointer;}'
      + 'body.size-on [data-arr-size].arr-sized{outline-color:rgba(224,82,31,.7);}'
      + 'body.size-on [data-arr-size].arr-selected{outline:2px solid ' + ACCENT + ';}'
      + '.arr-handle{position:absolute;z-index:55;right:-7px;bottom:-7px;width:16px;height:16px;'
      + 'border-radius:50%;background:#fff;border:2px solid ' + ACCENT + ';box-shadow:0 2px 8px rgba(0,0,0,.35);'
      + 'cursor:nwse-resize;display:none;touch-action:none;}'
      + 'body.size-on [data-arr-size]{position:relative;}'
      + 'body.size-on .arr-handle{display:block;}'
      + '.arr-sizebox{display:none;flex-direction:column;gap:8px;}'
      + '.arr-sizebox.show{display:flex;}'
      + '.arr-sizebox .lbl{font-size:11px;color:rgba(255,255,255,.55);}'
      + '.arr-dims{display:flex;gap:8px;}'
      + '.arr-dims label{flex:1;display:flex;align-items:center;gap:6px;font-size:12px;'
      + 'background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);border-radius:8px;padding:6px 9px;}'
      + '.arr-dims label span{color:rgba(255,255,255,.5);font-family:ui-monospace,monospace;font-size:11px;}'
      + '.arr-dims input{width:100%;border:0;background:transparent;color:#fff;font:inherit;font-size:12px;outline:none;}'
      + '.arr-dims input::-webkit-outer-spin-button,.arr-dims input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}';
    var s = document.createElement('style');
    s.setAttribute('data-omelette-chrome', '');
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ── panel ──────────────────────────────────────────────────────────────--
  var panel, dragToggle, imgToggle, sizeToggle, resetPosBtn, resetImgBtn, resetSizeBtn, fileInput;
  var sizeBox, selName, wInput, hInput;
  function buildPanel() {
    panel = document.createElement('div');
    panel.className = 'arr-panel';
    panel.setAttribute('data-omelette-chrome', '');
    panel.hidden = true;
    panel.innerHTML =
      '<div class="arr-hd"><b>Tweaks</b>'
      + '<button class="arr-x" type="button" aria-label="Sluiten">\u2715</button></div>'
      + '<div class="arr-body">'
      + '<div class="arr-sec">'
      + '<div class="arr-row"><span>Sleep om te ordenen</span>'
      + '<button class="arr-toggle" data-t="drag" type="button" role="switch" aria-checked="false"></button></div>'
      + '<p class="arr-hint">Versleep titels, tekst en kaarten naar de plek die u wilt.</p>'
      + '</div>'
      + '<div class="arr-sec">'
      + '<div class="arr-row"><span>Foto\u2019s vervangen</span>'
      + '<button class="arr-toggle" data-t="img" type="button" role="switch" aria-checked="false"></button></div>'
      + '<p class="arr-hint">Klik op een foto of fotovlak en upload uw eigen afbeelding.</p>'
      + '</div>'
      + '<div class="arr-sec">'
      + '<div class="arr-row"><span>Formaat aanpassen</span>'
      + '<button class="arr-toggle" data-t="size" type="button" role="switch" aria-checked="false"></button></div>'
      + '<p class="arr-hint">Klik een tekst- of fotovlak en sleep de hoek, of typ de maten.</p>'
      + '<div class="arr-sizebox">'
      + '<div class="lbl" data-sel-name>Niets geselecteerd</div>'
      + '<div class="arr-dims">'
      + '<label><span>B</span><input type="number" min="20" data-dim="w" placeholder="auto" /></label>'
      + '<label><span>H</span><input type="number" min="20" data-dim="h" placeholder="auto" /></label>'
      + '</div></div>'
      + '</div>'
      + '<div class="arr-sec" style="flex-flow:row wrap;gap:8px;">'
      + '<button class="arr-reset" data-r="pos" type="button">Indeling herstellen</button>'
      + '<button class="arr-reset" data-r="img" type="button">Foto\u2019s herstellen</button>'
      + '<button class="arr-reset" data-r="size" type="button" style="flex-basis:100%;">Formaten herstellen</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(panel);

    dragToggle = panel.querySelector('[data-t="drag"]');
    imgToggle = panel.querySelector('[data-t="img"]');
    sizeToggle = panel.querySelector('[data-t="size"]');
    resetPosBtn = panel.querySelector('[data-r="pos"]');
    resetImgBtn = panel.querySelector('[data-r="img"]');
    resetSizeBtn = panel.querySelector('[data-r="size"]');
    sizeBox = panel.querySelector('.arr-sizebox');
    selName = panel.querySelector('[data-sel-name]');
    wInput = panel.querySelector('[data-dim="w"]');
    hInput = panel.querySelector('[data-dim="h"]');

    dragToggle.addEventListener('click', function () { setDragMode(!dragMode); });
    imgToggle.addEventListener('click', function () { setImgMode(!imgMode); });
    sizeToggle.addEventListener('click', function () { setSizeMode(!sizeMode); });
    resetPosBtn.addEventListener('click', resetLayout);
    resetImgBtn.addEventListener('click', resetImages);
    resetSizeBtn.addEventListener('click', resetSizes);
    wInput.addEventListener('input', function () { applyTypedDim('w', wInput.value); });
    hInput.addEventListener('input', function () { applyTypedDim('h', hInput.value); });
    panel.querySelector('.arr-x').addEventListener('click', function () {
      hidePanel();
      try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (_) {}
    });

    // hidden file input shared by all slots
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.setAttribute('data-omelette-chrome', '');
    document.body.appendChild(fileInput);
    fileInput.addEventListener('change', onFilePicked);

    refreshResets();
  }

  function showPanel() { if (panel) panel.hidden = false; }
  function hidePanel() { if (panel) panel.hidden = true; setDragMode(false); setImgMode(false); setSizeMode(false); }

  function setDragMode(on) {
    dragMode = on;
    document.body.classList.toggle('arr-on', on);
    if (dragToggle) dragToggle.setAttribute('aria-checked', on ? 'true' : 'false');
  }
  function setImgMode(on) {
    imgMode = on;
    document.body.classList.toggle('img-on', on);
    if (imgToggle) imgToggle.setAttribute('aria-checked', on ? 'true' : 'false');
  }
  function setSizeMode(on) {
    sizeMode = on;
    document.body.classList.toggle('size-on', on);
    if (sizeToggle) sizeToggle.setAttribute('aria-checked', on ? 'true' : 'false');
    if (!on) selectSizable(null);
  }
  function refreshResets() {
    if (resetPosBtn) resetPosBtn.disabled = Object.keys(offsets).length === 0;
    if (resetImgBtn) resetImgBtn.disabled = Object.keys(images).length === 0;
    if (resetSizeBtn) resetSizeBtn.disabled = Object.keys(sizes).length === 0;
  }

  // ── drag registry ─────────────────────────────────────────────────────────
  function indexDrag() {
    els = Array.prototype.slice.call(document.querySelectorAll(DRAG_SELECTOR))
      .filter(function (el) { return !el.closest(EXCLUDE); });
    els.forEach(function (el, i) {
      el.setAttribute('data-arr', i);
      var o = offsets[i];
      if (o) el.style.transform = 'translate(' + o.x + 'px,' + o.y + 'px)';
    });
  }
  function resetLayout() {
    offsets = {}; saveJSON(STORE_POS, offsets);
    els.forEach(function (el) { el.style.transform = ''; });
    refreshResets();
  }

  // ── resize registry ───────────────────────────────────────────────────────
  function indexSizables() {
    sizables = Array.prototype.slice.call(document.querySelectorAll(SIZE_SELECTOR))
      .filter(function (el) { return !el.closest(EXCLUDE); });
    sizables.forEach(function (el, i) {
      el.setAttribute('data-arr-size', i);
      var handle = document.createElement('span');
      handle.className = 'arr-handle';
      handle.setAttribute('data-omelette-chrome', '');
      handle.addEventListener('pointerdown', function (e) { startResize(e, el); });
      el.appendChild(handle);
      var s = sizes[i];
      if (s) applySize(el, s.w, s.h);
    });
  }

  function applySize(el, w, h) {
    el.style.boxSizing = 'border-box';
    if (w) el.style.width = w + 'px';
    if (h) el.style.height = h + 'px';
    el.classList.add('arr-sized');
  }

  function selectSizable(el) {
    if (selected) selected.classList.remove('arr-selected');
    selected = el;
    if (!el) { sizeBox.classList.remove('show'); return; }
    el.classList.add('arr-selected');
    sizeBox.classList.add('show');
    var name = (el.tagName || '').toLowerCase();
    if (el.classList.length) {
      var cls = Array.prototype.filter.call(el.classList, function (c) {
        return c.indexOf('arr-') !== 0;
      })[0];
      if (cls) name += ' \u00b7 ' + cls;
    }
    selName.textContent = name;
    var r = el.getBoundingClientRect();
    wInput.value = Math.round(r.width);
    hInput.value = Math.round(r.height);
  }

  function persistSize(el) {
    var i = el.getAttribute('data-arr-size');
    var r = el.getBoundingClientRect();
    sizes[i] = { w: Math.round(r.width), h: Math.round(r.height) };
    saveJSON(STORE_SIZE, sizes);
    refreshResets();
  }

  function applyTypedDim(dim, val) {
    if (!selected) return;
    var n = parseInt(val, 10);
    if (isNaN(n) || n < 20) return;
    selected.style.boxSizing = 'border-box';
    if (dim === 'w') selected.style.width = n + 'px';
    else selected.style.height = n + 'px';
    selected.classList.add('arr-sized');
    persistSize(selected);
  }

  // handle drag
  var rsEl = null, rsX = 0, rsY = 0, rsW = 0, rsH = 0;
  function startResize(e, el) {
    if (!sizeMode) return;
    e.preventDefault(); e.stopPropagation();
    selectSizable(el);
    rsEl = el;
    var r = el.getBoundingClientRect();
    rsX = e.clientX; rsY = e.clientY; rsW = r.width; rsH = r.height;
    el.style.boxSizing = 'border-box';
    window.addEventListener('pointermove', onResizeMove, { passive: false });
    window.addEventListener('pointerup', onResizeUp, true);
    document.body.classList.add('arr-grabbing');
  }
  function onResizeMove(e) {
    if (!rsEl) return;
    e.preventDefault();
    var w = Math.max(20, Math.round(rsW + (e.clientX - rsX)));
    var h = Math.max(20, Math.round(rsH + (e.clientY - rsY)));
    rsEl.style.width = w + 'px';
    rsEl.style.height = h + 'px';
    rsEl.classList.add('arr-sized');
    wInput.value = w; hInput.value = h;
  }
  function onResizeUp() {
    if (rsEl) { persistSize(rsEl); rsEl = null; }
    document.body.classList.remove('arr-grabbing');
    window.removeEventListener('pointermove', onResizeMove, { passive: false });
    window.removeEventListener('pointerup', onResizeUp, true);
  }

  function resetSizes() {
    sizes = {}; saveJSON(STORE_SIZE, sizes);
    sizables.forEach(function (el) {
      el.style.width = ''; el.style.height = ''; el.classList.remove('arr-sized');
    });
    selectSizable(null);
    refreshResets();
  }

  // ── image slots ────────────────────────────────────────────────────────--
  function isImg(el) { return el.tagName === 'IMG'; }

  function indexSlots() {
    var raw = Array.prototype.slice.call(document.querySelectorAll(IMG_SELECTOR))
      .filter(function (el) { return !el.closest(EXCLUDE); });
    // Drop container slots that already contain an <img> (the <img> is the slot).
    slots = raw.filter(function (el) {
      if (isImg(el)) return true;
      return !el.querySelector('img');
    });
    slots.forEach(function (el, i) {
      el.setAttribute('data-imgslot', i);
      // upload button
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'arr-upload';
      btn.setAttribute('data-omelette-chrome', '');
      btn.innerHTML = '\u2191 Upload';
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        pendingSlot = i; fileInput.value = ''; fileInput.click();
      });
      if (isImg(el)) {
        // attach the upload button to the image's parent (no wrapping, so the
        // image keeps filling its frame via width/height:100%).
        var parent = el.parentNode;
        if (parent) {
          parent.classList.add('arr-imgslot-parent');
          parent.appendChild(btn);
        }
      } else {
        el.appendChild(btn);
      }
      if (images[i]) applyImage(el, images[i]);
    });
  }

  function applyImage(el, dataUrl) {
    if (isImg(el)) {
      el.src = dataUrl;
    } else {
      el.style.backgroundImage = 'url(' + dataUrl + ')';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundRepeat = 'no-repeat';
      // hide placeholder labels but keep corner/caption chrome
      var ph = el.querySelectorAll('.ph, .placeholder');
      Array.prototype.forEach.call(ph, function (p) { p.style.display = 'none'; });
    }
  }

  var pendingSlot = null;
  function onFilePicked(e) {
    var file = e.target.files && e.target.files[0];
    if (file == null || pendingSlot == null) return;
    var idx = pendingSlot; pendingSlot = null;
    downscale(file, 1500, 0.85, function (dataUrl) {
      if (!dataUrl) return;
      images[idx] = dataUrl;
      var ok = saveJSON(STORE_IMG, images);
      var el = slots[idx];
      if (el) applyImage(el, dataUrl);
      if (!ok) {
        delete images[idx]; saveJSON(STORE_IMG, images);
        alert('De afbeelding is te groot om te onthouden. Probeer een kleinere foto.');
      }
      refreshResets();
    });
  }

  // load file -> downscale via canvas -> JPEG dataURL
  function downscale(file, maxDim, quality, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var scale = Math.min(1, maxDim / Math.max(w, h));
        var cw = Math.round(w * scale), ch = Math.round(h * scale);
        var c = document.createElement('canvas');
        c.width = cw; c.height = ch;
        c.getContext('2d').drawImage(img, 0, 0, cw, ch);
        var out;
        try { out = c.toDataURL('image/jpeg', quality); }
        catch (_) { out = reader.result; }
        cb(out);
      };
      img.onerror = function () { cb(reader.result); };
      img.src = reader.result;
    };
    reader.onerror = function () { cb(null); };
    reader.readAsDataURL(file);
  }

  function resetImages() {
    images = {}; saveJSON(STORE_IMG, images);
    slots.forEach(function (el) {
      if (isImg(el)) {
        if (el.getAttribute('data-orig-src')) el.src = el.getAttribute('data-orig-src');
      } else {
        el.style.backgroundImage = '';
        var ph = el.querySelectorAll('.ph, .placeholder');
        Array.prototype.forEach.call(ph, function (p) { p.style.display = ''; });
      }
    });
    refreshResets();
    // reload to restore original <img> sources cleanly
    if (slots.some(isImg)) location.reload();
  }

  // ── drag interaction ──────────────────────────────────────────────────────
  var active = null, startX = 0, startY = 0, baseX = 0, baseY = 0, cur = null;
  function onPointerDown(e) {
    if (!dragMode || (e.button != null && e.button !== 0)) return;
    if (e.target.closest && e.target.closest('.arr-upload, .arr-panel')) return;
    var el = e.target.closest ? e.target.closest('[data-arr]') : null;
    if (!el || el.closest(EXCLUDE)) return;
    e.preventDefault(); e.stopPropagation();
    active = el;
    var o = offsets[el.getAttribute('data-arr')] || { x: 0, y: 0 };
    baseX = o.x; baseY = o.y; startX = e.clientX; startY = e.clientY; cur = { x: baseX, y: baseY };
    el.classList.add('arr-dragging');
    document.body.classList.add('arr-grabbing');
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, true);
  }
  function onPointerMove(e) {
    if (!active) return;
    e.preventDefault();
    cur = { x: baseX + (e.clientX - startX), y: baseY + (e.clientY - startY) };
    active.style.transform = 'translate(' + cur.x + 'px,' + cur.y + 'px)';
  }
  function onPointerUp() {
    if (active) {
      var key = active.getAttribute('data-arr');
      if (cur && (cur.x || cur.y)) offsets[key] = cur;
      else { delete offsets[key]; active.style.transform = ''; }
      saveJSON(STORE_POS, offsets); refreshResets();
      active.classList.remove('arr-dragging'); active = null;
    }
    document.body.classList.remove('arr-grabbing');
    window.removeEventListener('pointermove', onPointerMove, { passive: false });
    window.removeEventListener('pointerup', onPointerUp, true);
  }

  // ── host edit-mode protocol ───────────────────────────────────────────────
  function wireHost() {
    window.addEventListener('message', function (e) {
      var t = e && e.data && e.data.type;
      if (t === '__activate_edit_mode') showPanel();
      else if (t === '__deactivate_edit_mode') hidePanel();
    });
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (_) {}
  }

  // ── boot ───────────────────────────────────────────────────────────────--
  function boot() {
    // remember original img sources before anything swaps them
    Array.prototype.forEach.call(document.images, function (im) {
      if (!im.closest(EXCLUDE)) im.setAttribute('data-orig-src', im.getAttribute('src') || '');
    });
    injectStyle();
    buildPanel();
    indexDrag();
    indexSlots();
    indexSizables();
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('.arr-panel, .arr-handle, .arr-upload')) return;
      if (sizeMode) {
        var sz = e.target.closest ? e.target.closest('[data-arr-size]') : null;
        if (sz) { e.preventDefault(); e.stopPropagation(); selectSizable(sz); return; }
        selectSizable(null);
      }
      if (dragMode) {
        var el = e.target.closest ? e.target.closest('[data-arr]') : null;
        if (el) { e.preventDefault(); e.stopPropagation(); }
      }
    }, true);
    wireHost();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
