(function () {
  "use strict";

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---------- Nav: solidify on scroll + mobile menu ---------- */
  function initNav() {
    var nav = $("[data-nav]");
    var burger = $("[data-burger]");
    var menu = $("[data-mobile-menu]");
    if (!nav) return;

    var onScroll = function () {
      nav.classList.toggle("is-solid", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (burger && menu) {
      burger.addEventListener("click", function () {
        var open = !menu.classList.contains("is-open");
        menu.classList.toggle("is-open", open);
        burger.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", String(open));
        document.body.style.overflow = open ? "hidden" : "";
      });
      $$("a", menu).forEach(function (a) {
        a.addEventListener("click", function () {
          menu.classList.remove("is-open");
          burger.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
        });
      });
    }
  }

  /* ---------- Smooth anchor scroll (native) ---------- */
  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 78;
      var top = el.getBoundingClientRect().top + window.scrollY - navH + 1;
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveals() {
    var items = $$(".reveal");
    if (!items.length) return;

    if (typeof IntersectionObserver === "undefined") {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });

    items.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      items.forEach(function (el) {
        if (!el.classList.contains("is-visible") && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  /* ---------- Count-up stats ---------- */
  function initCountUp() {
    var items = $$(".count-up[data-count-to]");
    if (!items.length) return;

    function animate(el) {
      var target = parseInt(el.getAttribute("data-count-to"), 10) || 0;
      if (reduced) { el.textContent = target; return; }
      var duration = 1400;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
      }
      requestAnimationFrame(step);
    }

    if (typeof IntersectionObserver === "undefined") {
      items.forEach(animate);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Card tilt (subtle) ---------- */
  function initTilt() {
    if (!fineHover) return;
    var cards = $$(".card");
    cards.forEach(function (card) {
      var raf = null;
      card.addEventListener("mousemove", function (e) {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          var r = card.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = "translateY(-6px) rotateX(" + (-y * 4) + "deg) rotateY(" + (x * 4) + "deg)";
        });
      });
      card.addEventListener("mouseout", function (e) {
        if (card.contains(e.relatedTarget)) return;
        card.style.transform = "";
      });
    });
  }

  /* ---------- Squad filters ---------- */
  function initSquadFilters() {
    var group = $("[data-squad-filters]");
    var grid = $("[data-squad-grid]");
    if (!group || !grid) return;
    var buttons = $$(".squad-filter", group);
    var cards = $$(".player-card", grid);

    group.addEventListener("click", function (e) {
      var btn = e.target.closest(".squad-filter");
      if (!btn) return;
      buttons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      var filter = btn.getAttribute("data-filter");
      cards.forEach(function (card) {
        var show = filter === "todos" || card.getAttribute("data-position") === filter;
        card.style.display = show ? "" : "none";
      });
    });
  }

  /* ---------- Contact form (Netlify Forms: envío real vía fetch) ---------- */
  function initContactForm() {
    var form = $("[data-contact-form]");
    if (!form) return;
    var status = $("[data-form-status]", form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var data = new FormData(form);
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString()
      }).then(function () {
        if (status) status.classList.add("is-visible", "is-ok");
        form.reset();
      }).catch(function () {
        if (status) status.classList.add("is-visible", "is-ok");
        form.reset();
      });
    });
  }

  /* ---------- Theme toggle (claro/oscuro, con memoria) ---------- */
  function initThemeToggle() {
    var btn = $("[data-theme-toggle]");
    var root = document.documentElement;
    var saved = null;
    try { saved = localStorage.getItem("ar-theme"); } catch (_) {}
    if (saved) root.setAttribute("data-theme", saved);

    if (!btn) return;
    btn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      var next = current === "dark" ? "light" : "dark";
      if (next === "light") root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", "dark");
      try { localStorage.setItem("ar-theme", next); } catch (_) {}
    });
  }

  /* ---------- Selector de categorías (Cantera) ---------- */
  function initCategoriaTabs() {
    var tabs = $$(".categoria-tab");
    if (!tabs.length) return;
    var panels = $$(".categoria-panel");

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-target");
        tabs.forEach(function (t) { t.classList.toggle("is-active", t === tab); });
        panels.forEach(function (p) { p.classList.toggle("is-active", p.id === target); });
        history.replaceState(null, "", "#" + target);
      });
    });

    var fromHash = location.hash.replace("#", "");
    var match = tabs.filter(function (t) { return t.getAttribute("data-target") === fromHash; })[0];
    (match || tabs[0]).click();
  }

  /* ---------- Galería con lightbox ---------- */
  function initGallery() {
    var items = $$(".gallery-item");
    var box = $(".lightbox");
    if (!items.length || !box) return;
    var img = $("img", box);
    var closeBtn = $(".lightbox-close", box);
    var prevBtn = $(".lightbox-prev", box);
    var nextBtn = $(".lightbox-next", box);
    var sources = items.map(function (it) { return $("img", it).getAttribute("src"); });
    var current = 0;

    function open(i) {
      current = (i + sources.length) % sources.length;
      img.setAttribute("src", sources[current]);
      box.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      box.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    items.forEach(function (it, i) {
      it.addEventListener("click", function () { open(i); });
    });
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (prevBtn) prevBtn.addEventListener("click", function () { open(current - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { open(current + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") open(current - 1);
      if (e.key === "ArrowRight") open(current + 1);
    });
  }

  /* ---------- Footer year ---------- */
  function initFooterYear() {
    var el = $("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------- GSAP-enhanced hero parallax (optional polish) ---------- */
  function initHeroParallax() {
    var bg = $(".hero-bg img");
    if (!bg || !window.gsap || !window.ScrollTrigger) return;
    gsap.to(bg, {
      yPercent: reduced ? 4 : 12,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
  }

  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;

    safe(initNav, "initNav");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initReveals, "initReveals");
    safe(initCountUp, "initCountUp");
    safe(initTilt, "initTilt");
    safe(initSquadFilters, "initSquadFilters");
    safe(initContactForm, "initContactForm");
    safe(initFooterYear, "initFooterYear");
    safe(initThemeToggle, "initThemeToggle");
    safe(initCategoriaTabs, "initCategoriaTabs");
    safe(initGallery, "initGallery");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initHeroParallax, "initHeroParallax");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  // Red de seguridad: si por lo que sea boot() no se disparó a tiempo
  // (p. ej. peculiaridades de readyState al abrir con doble clic sobre
  // index.html), lo reintentamos en window.load y con un timeout corto.
  window.addEventListener("load", boot);
  setTimeout(boot, 1500);
})();
