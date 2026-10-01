/**
 * AE.* primitives — injected into every canvas iframe.
 * Wires data-ae="..." markup to interactive behaviors.
 * Iframe runs sandbox="allow-scripts" (null origin); only DOM APIs available.
 */
export const AE_PRIMITIVES: string = `
(function () {
  "use strict";

  function warn(msg, el) {
    try { console.warn("[AE] " + msg, el || ""); } catch (e) {}
  }

  function toFiniteNumber(value, fallback) {
    var n = parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function safeQueryAll(root, selector) {
    try { return Array.prototype.slice.call(root.querySelectorAll(selector)); }
    catch (e) { warn("querySelectorAll failed: " + selector); return []; }
  }

  // ---- Shared IntersectionObserver for reveal + count ----
  var ioCallbacks = new WeakMap();
  var sharedIO = null;

  function getSharedIO() {
    if (sharedIO) return sharedIO;
    if (typeof IntersectionObserver === "undefined") {
      warn("IntersectionObserver unavailable; reveal/count will fire immediately");
      return null;
    }
    sharedIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var cb = ioCallbacks.get(entry.target);
        if (typeof cb === "function") {
          try { cb(entry.target); } catch (e) { warn("IO callback threw: " + e.message); }
          sharedIO.unobserve(entry.target);
          ioCallbacks.delete(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });
    return sharedIO;
  }

  function observeOnce(el, cb) {
    var io = getSharedIO();
    if (!io) { cb(el); return; }
    ioCallbacks.set(el, cb);
    io.observe(el);
  }

  // ---- Reveal ----
  function initReveal(root) {
    safeQueryAll(root, '[data-ae="reveal"]').forEach(function (el) {
      if (el.__aeRevealInit) return;
      el.__aeRevealInit = true;
      var delay = toFiniteNumber(el.getAttribute("data-ae-delay"), 0);
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity 600ms ease-out, transform 600ms ease-out";
      el.style.transitionDelay = delay + "ms";
      el.style.willChange = "opacity, transform";
      observeOnce(el, function (target) {
        target.style.opacity = "1";
        target.style.transform = "translateY(0)";
      });
    });
  }

  // ---- Count ----
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function initCount(root) {
    safeQueryAll(root, '[data-ae="count"]').forEach(function (el) {
      if (el.__aeCountInit) return;
      el.__aeCountInit = true;
      var from = toFiniteNumber(el.getAttribute("data-ae-from"), 0);
      var to = toFiniteNumber(el.getAttribute("data-ae-to"), NaN);
      var dur = toFiniteNumber(el.getAttribute("data-ae-dur"), 1500);
      if (!Number.isFinite(to)) { warn("count missing/invalid data-ae-to", el); return; }
      if (dur <= 0) dur = 1500;
      el.textContent = String(Math.round(from));
      observeOnce(el, function (target) {
        var start = performance.now();
        function step(now) {
          var t = Math.min(1, (now - start) / dur);
          var eased = easeOutCubic(t);
          var current = from + (to - from) * eased;
          target.textContent = String(Math.round(current));
          if (t < 1) requestAnimationFrame(step);
          else target.textContent = String(Math.round(to));
        }
        requestAnimationFrame(step);
      });
    });
  }

  // ---- Tabs ----
  function initTabs(root) {
    safeQueryAll(root, '[data-ae="tabs"]').forEach(function (container) {
      if (container.__aeTabsInit) return;
      container.__aeTabsInit = true;
      var tabs = safeQueryAll(container, "[data-ae-tab]");
      var panels = safeQueryAll(container, "[data-ae-panel]");
      if (!tabs.length || !panels.length) {
        warn("tabs container missing tabs or panels", container);
        return;
      }

      function activate(key) {
        tabs.forEach(function (t) {
          var isActive = t.getAttribute("data-ae-tab") === key;
          if (isActive) t.setAttribute("data-active", "");
          else t.removeAttribute("data-active");
          t.setAttribute("aria-selected", isActive ? "true" : "false");
          t.setAttribute("tabindex", isActive ? "0" : "-1");
        });
        panels.forEach(function (p) {
          var isActive = p.getAttribute("data-ae-panel") === key;
          if (isActive) {
            p.setAttribute("data-active", "");
            p.style.display = "";
            p.setAttribute("aria-hidden", "false");
          } else {
            p.removeAttribute("data-active");
            p.style.display = "none";
            p.setAttribute("aria-hidden", "true");
          }
        });
      }

      tabs.forEach(function (tab, idx) {
        if (!tab.hasAttribute("role")) tab.setAttribute("role", "tab");
        tab.addEventListener("click", function () {
          var key = tab.getAttribute("data-ae-tab");
          if (key) activate(key);
        });
        tab.addEventListener("keydown", function (e) {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          var dir = e.key === "ArrowRight" ? 1 : -1;
          var next = (idx + dir + tabs.length) % tabs.length;
          var nextTab = tabs[next];
          if (!nextTab) return;
          var key = nextTab.getAttribute("data-ae-tab");
          if (key) activate(key);
          nextTab.focus();
        });
      });

      var first = tabs[0].getAttribute("data-ae-tab");
      if (first) activate(first);
    });
  }

  // ---- Accordion ----
  function initAccordion(root) {
    safeQueryAll(root, '[data-ae="accordion"]').forEach(function (acc) {
      if (acc.__aeAccordionInit) return;
      acc.__aeAccordionInit = true;
      var toggles = safeQueryAll(acc, "[data-ae-toggle]");
      toggles.forEach(function (toggle) {
        var content = null;
        var parent = toggle.parentElement;
        if (parent) content = parent.querySelector("[data-ae-content]");
        if (!content) {
          warn("accordion toggle has no sibling [data-ae-content]", toggle);
          return;
        }
        content.style.overflow = "hidden";
        content.style.transition = "max-height 0.3s ease-out";
        var expanded = toggle.getAttribute("aria-expanded") === "true";
        content.style.maxHeight = expanded ? content.scrollHeight + "px" : "0px";
        toggle.addEventListener("click", function () {
          var isOpen = toggle.getAttribute("aria-expanded") === "true";
          if (isOpen) {
            content.style.maxHeight = content.scrollHeight + "px";
            // force reflow then collapse
            void content.offsetHeight;
            content.style.maxHeight = "0px";
            toggle.setAttribute("aria-expanded", "false");
          } else {
            content.style.maxHeight = content.scrollHeight + "px";
            toggle.setAttribute("aria-expanded", "true");
          }
        });
      });
    });
  }

  // ---- Scrub ----
  var scrubEntries = [];
  var scrubRaf = 0;
  var scrubBound = false;

  function applyScrub(entry) {
    var rect;
    try { rect = entry.el.getBoundingClientRect(); }
    catch (e) { return; }
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    var denom = vh + rect.height;
    if (denom <= 0) return;
    var raw = (vh - rect.top) / denom;
    var progress = Math.max(0, Math.min(1, raw));
    var value = entry.from + (entry.to - entry.from) * progress;
    try { entry.target.style[entry.prop] = String(value); }
    catch (e) { warn("scrub failed to set style." + entry.prop + ": " + e.message); }
  }

  function scrubTick() {
    scrubRaf = 0;
    for (var i = 0; i < scrubEntries.length; i++) applyScrub(scrubEntries[i]);
  }

  function scrubSchedule() {
    if (scrubRaf) return;
    scrubRaf = requestAnimationFrame(scrubTick);
  }

  function initScrub(root) {
    safeQueryAll(root, '[data-ae="scrub"]').forEach(function (el) {
      if (el.__aeScrubInit) return;
      el.__aeScrubInit = true;
      var prop = el.getAttribute("data-ae-prop");
      if (!prop) { warn("scrub missing data-ae-prop", el); return; }
      var from = toFiniteNumber(el.getAttribute("data-ae-from"), NaN);
      var to = toFiniteNumber(el.getAttribute("data-ae-to"), NaN);
      if (!Number.isFinite(from) || !Number.isFinite(to)) {
        warn("scrub invalid data-ae-from/to", el);
        return;
      }
      var target = el.querySelector("[data-ae-target]") || el;
      // Convert kebab-case CSS prop to camelCase for style indexing
      var styleProp = prop.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
      if (prop === "stroke-dashoffset") {
        try { target.style.strokeDasharray = String(Math.abs(from)); }
        catch (e) { warn("scrub could not set stroke-dasharray: " + e.message); }
      }
      var entry = { el: el, target: target, prop: styleProp, from: from, to: to };
      scrubEntries.push(entry);
      applyScrub(entry);
    });

    if (!scrubBound && scrubEntries.length > 0) {
      scrubBound = true;
      window.addEventListener("scroll", scrubSchedule, { passive: true });
      window.addEventListener("resize", scrubSchedule, { passive: true });
    }
  }

  // ---- Lightbox ----
  function initLightbox(root) {
    safeQueryAll(root, 'img[data-ae="lightbox"]').forEach(function (img) {
      if (img.__aeLightboxInit) return;
      img.__aeLightboxInit = true;
      img.style.cursor = "zoom-in";
      img.addEventListener("click", function () { openLightbox(img); });
    });
  }

  function openLightbox(img) {
    var full = img.getAttribute("data-ae-full") || img.getAttribute("src") || "";
    if (!full) { warn("lightbox has no source URL", img); return; }
    var overlay = document.createElement("div");
    overlay.setAttribute("data-ae-lightbox-overlay", "");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;z-index:9999;cursor:zoom-out;";
    var bigImg = document.createElement("img");
    bigImg.src = full;
    bigImg.alt = img.getAttribute("alt") || "";
    bigImg.style.cssText = "max-width:90vw;max-height:90vh;object-fit:contain;cursor:default;";
    overlay.appendChild(bigImg);

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "\\u00D7";
    closeBtn.style.cssText = "position:absolute;top:16px;right:20px;background:transparent;border:none;color:#fff;font-size:36px;line-height:1;cursor:pointer;padding:4px 12px;";
    overlay.appendChild(closeBtn);

    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function close() {
      try { document.body.removeChild(overlay); }
      catch (e) {}
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) { if (e.key === "Escape") close(); }

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    bigImg.addEventListener("click", function (e) { e.stopPropagation(); });
    closeBtn.addEventListener("click", function (e) { e.stopPropagation(); close(); });
    document.addEventListener("keydown", onKey);

    document.body.appendChild(overlay);
  }

  // ---- Chart (hover/focus tooltips on data points) ----
  function initChart(root) {
    safeQueryAll(root, '[data-ae="chart"]').forEach(function (chart) {
      if (chart.__aeChartInit) return;
      chart.__aeChartInit = true;
      try { if (getComputedStyle(chart).position === "static") chart.style.position = "relative"; } catch (e) {}
      var tip = document.createElement("div");
      tip.setAttribute("data-ae-tooltip", "");
      tip.style.cssText = "position:absolute;pointer-events:none;opacity:0;transform:translate(-50%,-130%);transition:opacity 120ms ease;background:rgba(15,23,42,0.95);color:#fff;font:600 12px/1.3 system-ui,sans-serif;padding:6px 10px;border-radius:8px;white-space:nowrap;z-index:5;box-shadow:0 4px 14px rgba(0,0,0,0.3);";
      chart.appendChild(tip);
      function show(pt) {
        var label = pt.getAttribute("data-ae-label") || "";
        var value = pt.getAttribute("data-ae-value") || "";
        tip.textContent = value ? (label ? label + ": " + value : value) : label;
        var cr = chart.getBoundingClientRect();
        var pr = pt.getBoundingClientRect();
        tip.style.left = (pr.left - cr.left + pr.width / 2) + "px";
        tip.style.top = (pr.top - cr.top) + "px";
        tip.style.opacity = "1";
      }
      function hide() { tip.style.opacity = "0"; }
      safeQueryAll(chart, "[data-ae-point]").forEach(function (pt) {
        if (!pt.hasAttribute("tabindex")) pt.setAttribute("tabindex", "0");
        try { pt.style.cursor = "pointer"; } catch (e) {}
        pt.addEventListener("mouseenter", function () { show(pt); });
        pt.addEventListener("mouseleave", hide);
        pt.addEventListener("focus", function () { show(pt); });
        pt.addEventListener("blur", hide);
      });
    });
  }

  // ---- Compare (before/after drag slider) ----
  function initCompare(root) {
    safeQueryAll(root, '[data-ae="compare"]').forEach(function (cmp) {
      if (cmp.__aeCompareInit) return;
      cmp.__aeCompareInit = true;
      var before = cmp.querySelector("[data-ae-before]");
      var after = cmp.querySelector("[data-ae-after]");
      if (!before || !after) { warn("compare needs [data-ae-before] and [data-ae-after]", cmp); return; }
      try { if (getComputedStyle(cmp).position === "static") cmp.style.position = "relative"; } catch (e) {}
      after.style.position = "absolute";
      after.style.top = "0"; after.style.left = "0";
      after.style.width = "100%"; after.style.height = "100%"; after.style.overflow = "hidden";
      var split = 50;
      var handle = document.createElement("div");
      handle.setAttribute("data-ae-handle", "");
      handle.setAttribute("role", "slider");
      handle.setAttribute("aria-label", "Before / after comparison");
      handle.setAttribute("aria-valuemin", "0");
      handle.setAttribute("aria-valuemax", "100");
      handle.setAttribute("tabindex", "0");
      handle.style.cssText = "position:absolute;top:0;bottom:0;width:3px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,0.35);cursor:ew-resize;z-index:3;transform:translateX(-50%);";
      var grip = document.createElement("div");
      grip.style.cssText = "position:absolute;top:50%;left:50%;width:34px;height:34px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);transform:translate(-50%,-50%);";
      handle.appendChild(grip);
      cmp.appendChild(handle);
      function apply() {
        after.style.clipPath = "inset(0 " + (100 - split) + "% 0 0)";
        handle.style.left = split + "%";
        handle.setAttribute("aria-valuenow", String(Math.round(split)));
      }
      function setFromClientX(clientX) {
        var rect = cmp.getBoundingClientRect();
        if (rect.width <= 0) return;
        split = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        apply();
      }
      var dragging = false;
      handle.addEventListener("pointerdown", function (e) { dragging = true; try { handle.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); });
      handle.addEventListener("pointermove", function (e) { if (dragging) setFromClientX(e.clientX); });
      handle.addEventListener("pointerup", function (e) { dragging = false; try { handle.releasePointerCapture(e.pointerId); } catch (_) {} });
      cmp.addEventListener("click", function (e) { if (e.target === handle || handle.contains(e.target)) return; setFromClientX(e.clientX); });
      handle.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") { split = Math.max(0, split - 4); apply(); e.preventDefault(); }
        else if (e.key === "ArrowRight") { split = Math.min(100, split + 4); apply(); e.preventDefault(); }
      });
      apply();
    });
  }

  // ---- Steps (step-through walkthrough) ----
  function initSteps(root) {
    safeQueryAll(root, '[data-ae="steps"]').forEach(function (wrap) {
      if (wrap.__aeStepsInit) return;
      wrap.__aeStepsInit = true;
      var steps = safeQueryAll(wrap, "[data-ae-step]");
      if (steps.length < 2) { warn("steps needs >=2 [data-ae-step]", wrap); return; }
      var idx = 0;
      var nav = document.createElement("div");
      nav.style.cssText = "display:flex;align-items:center;gap:12px;margin-top:16px;";
      var prev = document.createElement("button");
      var next = document.createElement("button");
      prev.type = "button"; next.type = "button";
      prev.textContent = "\\u2039 Prev"; next.textContent = "Next \\u203A";
      var btnCss = "font:600 13px system-ui,sans-serif;padding:6px 14px;border-radius:999px;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer;";
      prev.style.cssText = btnCss; next.style.cssText = btnCss;
      var counter = document.createElement("span");
      counter.style.cssText = "font:600 12px system-ui,sans-serif;opacity:0.7;";
      nav.appendChild(prev); nav.appendChild(counter); nav.appendChild(next);
      wrap.appendChild(nav);
      function render() {
        steps.forEach(function (s, i) { s.style.display = i === idx ? "" : "none"; });
        counter.textContent = (idx + 1) + " / " + steps.length;
        prev.disabled = idx === 0; next.disabled = idx === steps.length - 1;
        prev.style.opacity = prev.disabled ? "0.4" : "1";
        next.style.opacity = next.disabled ? "0.4" : "1";
      }
      prev.addEventListener("click", function () { if (idx > 0) { idx--; render(); } });
      next.addEventListener("click", function () { if (idx < steps.length - 1) { idx++; render(); } });
      render();
    });
  }

  // ---- Scrubber (draggable range → CSS variable) ----
  function initScrubber(root) {
    safeQueryAll(root, '[data-ae="scrubber"]').forEach(function (sc) {
      if (sc.__aeScrubberInit) return;
      sc.__aeScrubberInit = true;
      var input = sc.querySelector('input[type="range"]');
      if (!input) { warn("scrubber needs <input type=range>", sc); return; }
      var varName = sc.getAttribute("data-ae-var") || "--ae-val";
      var suffix = sc.getAttribute("data-ae-suffix") || "";
      var out = sc.querySelector("[data-ae-output]");
      function apply() {
        try { sc.style.setProperty(varName, input.value); } catch (e) {}
        if (out) out.textContent = input.value + suffix;
      }
      input.addEventListener("input", apply);
      apply();
    });
  }

  // ---- Toggle (cycle between labeled states) ----
  function initToggle(root) {
    safeQueryAll(root, '[data-ae="toggle"]').forEach(function (tg) {
      if (tg.__aeToggleInit) return;
      tg.__aeToggleInit = true;
      var states = safeQueryAll(tg, "[data-ae-state]");
      var btn = tg.querySelector("[data-ae-toggle-btn]");
      if (states.length < 2 || !btn) { warn("toggle needs >=2 [data-ae-state] and a [data-ae-toggle-btn]", tg); return; }
      var idx = 0;
      for (var i = 0; i < states.length; i++) { if (states[i].hasAttribute("data-active")) { idx = i; break; } }
      var relabel = btn.hasAttribute("data-ae-label");
      function render() {
        states.forEach(function (s, i) {
          s.style.display = i === idx ? "" : "none";
          if (i === idx) s.setAttribute("data-active", ""); else s.removeAttribute("data-active");
        });
        if (relabel) btn.textContent = states[idx].getAttribute("data-ae-state") || "";
      }
      btn.addEventListener("click", function () { idx = (idx + 1) % states.length; render(); });
      render();
    });
  }

  // ---- Init orchestrator ----
  function init(root) {
    var scope = root || document;
    try { initReveal(scope); } catch (e) { warn("initReveal threw: " + e.message); }
    try { initCount(scope); } catch (e) { warn("initCount threw: " + e.message); }
    try { initTabs(scope); } catch (e) { warn("initTabs threw: " + e.message); }
    try { initAccordion(scope); } catch (e) { warn("initAccordion threw: " + e.message); }
    try { initScrub(scope); } catch (e) { warn("initScrub threw: " + e.message); }
    try { initLightbox(scope); } catch (e) { warn("initLightbox threw: " + e.message); }
    try { initChart(scope); } catch (e) { warn("initChart threw: " + e.message); }
    try { initCompare(scope); } catch (e) { warn("initCompare threw: " + e.message); }
    try { initSteps(scope); } catch (e) { warn("initSteps threw: " + e.message); }
    try { initScrubber(scope); } catch (e) { warn("initScrubber threw: " + e.message); }
    try { initToggle(scope); } catch (e) { warn("initToggle threw: " + e.message); }
  }

  // mount(node): (re)initialize primitives inside a newly-inserted subtree.
  // Safe to call repeatedly — every primitive guards with an init-once flag.
  try { window.AE = { init: init, mount: init }; } catch (e) {}

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { init(); });
  } else {
    init();
  }
})();
`;

/**
 * Host bridge — injected into every canvas alongside AE_PRIMITIVES. Talks to the
 * parent app over postMessage (null-origin safe, targetOrigin "*"):
 *  - for the streaming shell: appends streamed sections ("ae-section") and fills
 *    image placeholders ("ae-image"), calling AE.mount on each new subtree
 *  - announces readiness ("ae-ready") so the host can flush queued messages
 */
export const AE_BRIDGE: string = `
(function () {
  "use strict";
  function onMessage(e) {
    var d = e && e.data ? e.data : {};
    if (d.type === "ae-section" && typeof d.html === "string") {
      try {
        var canvas = document.querySelector(".ae-canvas") || document.body;
        var tmp = document.createElement("div");
        tmp.innerHTML = d.html;
        var node = tmp.firstElementChild;
        if (node) {
          canvas.appendChild(node);
          if (window.AE && typeof window.AE.mount === "function") window.AE.mount(node);
        }
      } catch (err) {}
    } else if (d.type === "ae-image" && d.id) {
      try {
        var imgs = document.querySelectorAll('img[data-image-id="' + d.id + '"]');
        for (var i = 0; i < imgs.length; i++) imgs[i].setAttribute("src", d.url);
      } catch (err) {}
    }
  }
  try { window.addEventListener("message", onMessage); } catch (e) {}
  // Announce ready on the next tick, after AE.init has run.
  try { setTimeout(function () { parent.postMessage({ type: "ae-ready" }, "*"); }, 0); } catch (e) {}
})();
`;
