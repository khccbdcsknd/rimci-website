/* ==========================================================================
   Dachdeckerei Nordhang, Beispielprojekt
   Gemeinsames Skript aller Seiten. Kein Framework, kein Bauschritt.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     Einblenden beim Scrollen
     ------------------------------------------------------------------------ */

  var stuecke = document.querySelectorAll(".auftritt");
  var sparsam = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (sparsam || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(stuecke, function (el) { el.classList.add("da"); });
  } else {
    var wache = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("da");
        wache.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -5% 0px" });
    Array.prototype.forEach.call(stuecke, function (el) { wache.observe(el); });
  }

  /* ------------------------------------------------------------------------
     Bildflaechen
     Die Zeichnung ist die Grundlage. Liegt ein Foto im Ordner, legt es sich
     darueber. Fehlt es, bleibt die Zeichnung stehen.
     ------------------------------------------------------------------------ */

  Array.prototype.forEach.call(document.querySelectorAll(".flaeche img"), function (bild) {
    function weg() { bild.style.display = "none"; }
    if (bild.complete && bild.naturalWidth === 0) weg();
    bild.addEventListener("error", weg);
  });

  /* ------------------------------------------------------------------------
     Anfrageformular
     Nur auf der Kontaktseite vorhanden. In einem echten Projekt kommt hier
     ein Versanddienst dazu; fuer dieses Beispiel ist der Versand bewusst
     abgeschaltet.
     ------------------------------------------------------------------------ */

  var form = document.getElementById("anfrage");
  if (!form) return;

  var meldung = document.getElementById("f-meldung");
  var okFeld = document.getElementById("f-ok-feld");
  var zustimmung = document.getElementById("f-ok");
  var EMPFAENGER = (form.getAttribute("data-empfaenger") || "").trim();

  var pflicht = ["f-name", "f-mail", "f-anliegen", "f-text"].map(function (id) {
    return document.getElementById(id);
  });

  function sage(el, text) {
    var feld = el.closest("[data-feld]");
    var stelle = document.getElementById(el.id + "-mangel");
    if (feld) feld.classList.toggle("mangel", Boolean(text));
    el.setAttribute("aria-invalid", text ? "true" : "false");
    if (stelle) stelle.textContent = text || "";
    return !text;
  }

  function pruefe(el) {
    var wert = (el.value || "").trim();
    if (!wert) return sage(el, "Bitte ausfüllen.");
    if (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(wert)) {
      return sage(el, "Diese E-Mail-Adresse sieht nicht vollständig aus.");
    }
    return sage(el, "");
  }

  function pruefeZustimmung() {
    var stelle = document.getElementById("f-ok-mangel");
    var fehlt = !zustimmung.checked;
    okFeld.classList.toggle("mangel", fehlt);
    stelle.textContent = fehlt ? "Bitte bestätigen Sie die Einwilligung." : "";
    return !fehlt;
  }

  pflicht.forEach(function (el) {
    el.addEventListener(el.tagName === "SELECT" ? "change" : "input", function () {
      var feld = el.closest("[data-feld]");
      if (feld && feld.classList.contains("mangel")) pruefe(el);
    });
  });

  zustimmung.addEventListener("change", function () {
    if (okFeld.classList.contains("mangel")) pruefeZustimmung();
  });

  function zeige(art, text, roh) {
    meldung.className = "meldung an meldung--" + art;
    if (roh) meldung.innerHTML = text; else meldung.textContent = text;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var gut = true;
    pflicht.forEach(function (el) { if (!pruefe(el)) gut = false; });
    if (!pruefeZustimmung()) gut = false;

    if (!gut) {
      zeige("schlecht", "Bitte ergänzen Sie die markierten Felder.");
      var erstes = form.querySelector(".mangel input, .mangel select, .mangel textarea");
      if (erstes) erstes.focus();
      return;
    }

    if (document.getElementById("f-koeder").value) {
      zeige("gut", "Vielen Dank, Ihre Anfrage ist eingegangen.");
      form.reset();
      return;
    }

    if (EMPFAENGER) {
      var inhalt =
        "Name: " + pflicht[0].value.trim() + "\n" +
        "E-Mail: " + pflicht[1].value.trim() + "\n" +
        "Anliegen: " + pflicht[2].value + "\n\n" +
        pflicht[3].value.trim();
      var verweis = "mailto:" + EMPFAENGER +
        "?subject=" + encodeURIComponent("Anfrage über die Website") +
        "&body=" + encodeURIComponent(inhalt);
      zeige("gut", 'Ihre Nachricht ist vorbereitet. <a href="' + verweis + '">E-Mail-Programm öffnen</a>', true);
      return;
    }

    zeige("gut", "Danke. In diesem Beispielprojekt wird bewusst nichts verschickt. Auf einer echten Seite läge Ihre Anfrage jetzt im Postfach des Betriebs.");
  });
})();
