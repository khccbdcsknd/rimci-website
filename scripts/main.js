/* ==========================================================================
   RIMCI - main.js
   Geteiltes Verhalten fuer alle Seiten.

   Grundsaetze:
   - Kein Listener auf dem Fenster-Scroll. Sichtbarkeit laeuft ueber
     IntersectionObserver, damit pro Bild nichts nachgerechnet wird.
   - Jede Bewegung faellt unter "prefers-reduced-motion" auf statisch zurueck.
   - Alle Funktionen pruefen ihre Elemente, damit eine Seite ohne die
     jeweilige Sektion nicht bricht.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------------
     Navigation: Hintergrund einblenden, sobald der Seitenkopf verlassen wird
     ------------------------------------------------------------------------ */

  function initNavBackdrop() {
    var nav = document.querySelector(".nav");
    var sentinel = document.querySelector(".nav-sentinel");
    if (!nav || !sentinel) return;

    new IntersectionObserver(
      function (entries) {
        nav.classList.toggle("is-stuck", !entries[0].isIntersecting);
      },
      { rootMargin: "0px" }
    ).observe(sentinel);
  }

  /* ------------------------------------------------------------------------
     Mega-Menue "Leistungen"
     Oeffnet per Klick und per Hover, schliesst mit Escape, Klick nach aussen
     und sobald der Fokus die Gruppe verlaesst.
     ------------------------------------------------------------------------ */

  function initMegaMenu() {
    var trigger = document.querySelector("[data-mega-trigger]");
    var panel = document.getElementById("mega-leistungen");
    var nav = document.querySelector(".nav");
    if (!trigger || !panel || !nav) return;

    var closeTimer = null;

    function setOpen(open) {
      window.clearTimeout(closeTimer);
      trigger.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("is-open", open);
      nav.classList.toggle("is-open", open);
    }

    function scheduleClose() {
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(function () {
        setOpen(false);
      }, 180);
    }

    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      setOpen(trigger.getAttribute("aria-expanded") !== "true");
    });

    [trigger, panel].forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        if (window.matchMedia("(min-width: 1024px)").matches) setOpen(true);
      });
      el.addEventListener("mouseleave", scheduleClose);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && trigger.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        trigger.focus();
      }
    });

    document.addEventListener("focusin", function (event) {
      if (!panel.contains(event.target) && event.target !== trigger) setOpen(false);
    });

    document.addEventListener("click", function (event) {
      if (!panel.contains(event.target) && !trigger.contains(event.target)) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------------
     Mobiles Menue
     ------------------------------------------------------------------------ */

  function initDrawer() {
    var burger = document.querySelector(".burger");
    var drawer = document.getElementById("drawer");
    if (!burger || !drawer) return;

    function setOpen(open) {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
      drawer.classList.toggle("is-open", open);
      drawer.setAttribute("aria-hidden", String(!open));
      document.body.classList.toggle("is-locked", open);
    }

    setOpen(false);

    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });

    drawer.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && drawer.classList.contains("is-open")) {
        setOpen(false);
        burger.focus();
      }
    });

    /* Beim Wechsel auf Desktop das Menue sicher schliessen */
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function (event) {
      if (event.matches) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------------
     Scroll-Reveal
     Blendet Bloecke beim Eintreten ein. Geschwister werden leicht versetzt,
     damit eine Reihe in Lesereihenfolge erscheint statt gleichzeitig.
     ------------------------------------------------------------------------ */

  /* Bilder in Platzhaltern: sobald geladen, Beschriftung ausblenden */
  function initShots() {
    var bilder = document.querySelectorAll(".ph img");
    Array.prototype.forEach.call(bilder, function (img) {
      function zeigen() { img.parentNode.classList.add("is-filled"); }
      if (img.complete && img.naturalWidth > 0) zeigen();
      img.addEventListener("load", zeigen);
    });
  }

  function initReveal() {
    var targets = document.querySelectorAll(".reveal, .line-mask");
    if (!targets.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach(function (el) {
      /* Versatz aus der Position innerhalb der eigenen Gruppe ableiten */
      if (!el.style.getPropertyValue("--reveal-delay")) {
        var group = el.parentElement
          ? Array.prototype.filter.call(el.parentElement.children, function (child) {
              return child.classList.contains("reveal") || child.classList.contains("line-mask");
            })
          : [];
        var index = group.indexOf(el);
        if (index > 0) el.style.setProperty("--reveal-delay", Math.min(index, 5) * 70 + "ms");
      }
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------------
     Hero: Ueberschrift laeuft direkt beim Laden ein, ohne auf Scroll zu warten
     ------------------------------------------------------------------------ */

  function initHeroIntro() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) return;

    var parts = hero.querySelectorAll(".line-mask, .reveal");

    function play() {
      parts.forEach(function (el, index) {
        if (!el.style.getPropertyValue("--reveal-delay")) {
          el.style.setProperty("--reveal-delay", index * 90 + "ms");
        }
        el.classList.add("is-in");
      });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(play).catch(play);
    } else {
      play();
    }
  }

  /* ------------------------------------------------------------------------
     Laufschrift
     Der Inhalt wird einmal geklont, damit die Schleife ohne sichtbaren
     Sprung umlaeuft. Die Animation faehrt genau eine Kopienbreite weit.
     ------------------------------------------------------------------------ */

  function initMarquee() {
    document.querySelectorAll("[data-marquee]").forEach(function (track) {
      if (reduceMotion) return;
      var clone = track.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.removeAttribute("data-marquee");
      track.parentElement.appendChild(clone);
    });
  }

  /* ------------------------------------------------------------------------
     Magnetische Knoepfe
     Der Knopf folgt dem Zeiger ein Stueck weit. Transform wird direkt
     gesetzt, es laeuft kein Timer und keine Zustandsverwaltung mit.
     ------------------------------------------------------------------------ */

  function initMagnetic() {
    if (reduceMotion) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var strength = parseFloat(el.getAttribute("data-magnetic")) || 0.28;

      el.addEventListener("pointermove", function (event) {
        var box = el.getBoundingClientRect();
        var dx = event.clientX - (box.left + box.width / 2);
        var dy = event.clientY - (box.top + box.height / 2);
        el.style.transform = "translate(" + dx * strength + "px," + dy * strength + "px)";
      });

      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* ------------------------------------------------------------------------
     Waagerechte Leiste (Kundenstimmen)
     Pfeile scrollen um eine Kartenbreite und schalten sich an den Enden ab.
     ------------------------------------------------------------------------ */

  function initRail() {
    var rail = document.querySelector("[data-rail]");
    if (!rail) return;

    var prev = document.querySelector("[data-rail-prev]");
    var next = document.querySelector("[data-rail-next]");
    var cards = rail.children;
    if (!prev || !next || !cards.length) return;

    function step() {
      var card = cards[0];
      var gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
      return card.getBoundingClientRect().width + gap;
    }

    prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: "smooth" }); });
    next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: "smooth" }); });

    /* Liest nur die Scrollposition der Leiste selbst, nicht des Fensters.
       Pro Ereignis werden zwei Booleans gesetzt, sonst nichts. */
    function updateEdges() {
      var max = rail.scrollWidth - rail.clientWidth;
      prev.disabled = rail.scrollLeft <= 2;
      next.disabled = rail.scrollLeft >= max - 2;
    }

    rail.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateEdges);
    updateEdges();
  }

  /* ------------------------------------------------------------------------
     Start
     ------------------------------------------------------------------------ */

  function init() {
    initNavBackdrop();
    initMegaMenu();
    initDrawer();
    initShots();
    initReveal();
    initHeroIntro();
    initMarquee();
    initMagnetic();
    initRail();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
