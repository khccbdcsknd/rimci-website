/* ==========================================================================
   RIMCI - main.js (alle Seiten)
   Menü, Kopfzeile, Handy-Leiste, Einblendung, Pfeil-Leisten.
   Beobachtet per IntersectionObserver, es gibt keinen Scroll-Listener am Fenster.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasObserver = "IntersectionObserver" in window;
  var dock = document.querySelector(".dock");

  function initMenu() {
    var burger = document.querySelector(".burger");
    var menu = document.getElementById("menu");
    if (!burger || !menu) return;

    function setOpen(open) {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
      menu.classList.toggle("is-open", open);
      menu.inert = !open;
      document.body.classList.toggle("is-locked", open);
      if (dock) dock.classList.toggle("is-menu", open);
      updateDock();
    }

    setOpen(false);

    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menu.classList.contains("is-open")) {
        setOpen(false);
        burger.focus();
      }
    });

    window.matchMedia("(min-width: 1024px)").addEventListener("change", function (event) {
      if (event.matches) setOpen(false);
    });
  }

  /* Über dem Karten-Stapel ist die Kopfzeile durchsichtig, sonst schwarz. */
  function initHead() {
    var head = document.querySelector(".head");
    var stack = document.querySelector(".stack");
    if (!head || !stack || !hasObserver) return;
    new IntersectionObserver(function (entries) {
      head.classList.toggle("is-clear", entries[0].isIntersecting);
    }, { rootMargin: "0px 0px -100% 0px" }).observe(stack);
  }

  /* Die Handy-Leiste weicht, solange Anfrage-Knopf oder Formular sichtbar sind. */
  var dockBlockers = 0;
  function updateDock() {
    if (!dock) return;
    dock.classList.toggle("is-hidden", dockBlockers > 0 || dock.classList.contains("is-menu"));
  }

  function initDock() {
    if (!dock || !hasObserver) return;
    var targets = document.querySelectorAll("[data-dock-hide]");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var seen = entry.target.dataset.seen === "1";
        if (entry.isIntersecting && !seen) { entry.target.dataset.seen = "1"; dockBlockers += 1; }
        if (!entry.isIntersecting && seen) { entry.target.dataset.seen = "0"; dockBlockers -= 1; }
      });
      updateDock();
    });
    targets.forEach(function (target) { observer.observe(target); });
  }

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (reduceMotion || !hasObserver) {
      items.forEach(function (item) { item.classList.add("is-in"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (item) { observer.observe(item); });
  }

  function initRails() {
    document.querySelectorAll("[data-rail-wrap]").forEach(function (wrap) {
      var rail = wrap.querySelector("[data-rail]");
      var prev = wrap.querySelector("[data-rail-prev]");
      var next = wrap.querySelector("[data-rail-next]");
      if (!rail || !prev || !next || !rail.children.length) return;

      function step() { return rail.children[0].getBoundingClientRect().width; }
      function go(direction) {
        rail.scrollBy({ left: direction * step(), behavior: reduceMotion ? "auto" : "smooth" });
      }
      function updateEdges() {
        var max = rail.scrollWidth - rail.clientWidth;
        prev.disabled = rail.scrollLeft <= 2;
        next.disabled = rail.scrollLeft >= max - 2;
      }

      prev.addEventListener("click", function () { go(-1); });
      next.addEventListener("click", function () { go(1); });
      rail.addEventListener("scroll", updateEdges, { passive: true });
      window.addEventListener("resize", updateEdges);
      updateEdges();
    });
  }

  initMenu();
  initHead();
  initDock();
  initReveal();
  initRails();
})();
