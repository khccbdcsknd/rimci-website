/* ==========================================================================
   RIMCI - arbeiten.js
   Branchenfilter auf der Arbeiten-Seite.
   Blendet Karten aus, vergibt den Versatz neu und zeigt einen leeren
   Zustand, falls eine Branche keine Eintraege hat.
   ========================================================================== */

(function () {
  "use strict";

  var bar = document.querySelector("[data-filters]");
  var grid = document.querySelector("[data-work-index]");
  if (!bar || !grid) return;

  var buttons = Array.prototype.slice.call(bar.querySelectorAll("[data-filter]"));
  var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-cat]"));
  var empty = document.querySelector("[data-empty]");
  var live = document.querySelector("[data-filter-status]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Anzahl pro Branche in die Knoepfe schreiben */
  buttons.forEach(function (button) {
    var cat = button.getAttribute("data-filter");
    var count = cat === "alle"
      ? cards.length
      : cards.filter(function (card) { return card.getAttribute("data-cat") === cat; }).length;
    var slot = button.querySelector(".filter__count");
    if (slot) slot.textContent = count;
  });

  function arrange() {
    var visible = cards.filter(function (card) { return !card.hidden; });
    cards.forEach(function (card) { card.classList.remove("is-offset"); });
    visible.forEach(function (card, index) {
      if (index % 2 === 1) card.classList.add("is-offset");
    });
    if (empty) empty.hidden = visible.length > 0;
    return visible;
  }

  function apply(cat) {
    buttons.forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.getAttribute("data-filter") === cat));
    });

    cards.forEach(function (card) {
      card.hidden = !(cat === "alle" || card.getAttribute("data-cat") === cat);
      card.classList.remove("is-entering");
    });

    var visible = arrange();

    if (live) {
      live.textContent = visible.length === 1
        ? "1 Arbeit angezeigt"
        : visible.length + " Arbeiten angezeigt";
    }

    if (reduceMotion) return;

    /* Layout einmal lesen, damit die Einlauf-Animation neu startet */
    void grid.offsetWidth;

    visible.forEach(function (card, index) {
      card.style.setProperty("--enter-delay", Math.min(index, 6) * 60 + "ms");
      card.classList.add("is-entering");
    });
  }

  bar.addEventListener("click", function (event) {
    var button = event.target.closest("[data-filter]");
    if (button) apply(button.getAttribute("data-filter"));
  });

  arrange();
})();
