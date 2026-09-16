/* ==========================================================================
   RIMCI - form.js
   Kontaktformular: Pruefung, Fehlermeldungen, Lade- und Ergebniszustand.

   VERSAND: Solange am <form> kein data-endpoint gesetzt ist, wird nichts
   verschickt. Das Formular bietet dann an, die Anfrage als E-Mail zu oeffnen.
   Fuer Formspree die Formular-URL eintragen, z. B.
   data-endpoint="https://formspree.io/f/abcdwxyz"
   ========================================================================== */

(function () {
  "use strict";

  var form = document.getElementById("contact-form");
  if (!form) return;

  var status = document.getElementById("form-status");
  var done = document.getElementById("form-done");
  var submit = form.querySelector('[type="submit"]');
  var submitLabel = submit ? submit.querySelector("[data-label]") : null;
  var endpoint = (form.getAttribute("data-endpoint") || "").trim();
  var MAIL = "nikorimacbusiness@gmail.com";

  var missing = {
    name: "Bitte geben Sie Ihren Namen an.",
    email: "Bitte geben Sie Ihre E-Mail-Adresse an.",
    topic: "Bitte wählen Sie Ihr Anliegen aus.",
    message: "Bitte schreiben Sie uns kurz, worum es geht.",
    consent: "Bitte stimmen Sie der Datenschutzerklärung zu."
  };

  var controls = Array.prototype.filter.call(
    form.querySelectorAll("input, select, textarea"),
    function (el) { return el.name && el.name !== "_gotcha"; }
  );

  function fieldOf(el) { return el.closest(".field"); }

  function messageFor(el) {
    var v = el.validity;
    if (v.valueMissing) return missing[el.name] || "Bitte füllen Sie dieses Feld aus.";
    if (v.typeMismatch) return "Diese E-Mail-Adresse sieht nicht vollständig aus.";
    if (v.tooShort) return "Bitte schreiben Sie ein paar Worte mehr.";
    return "Bitte prüfen Sie diese Eingabe.";
  }

  function validate(el) {
    var ok = el.checkValidity();
    var field = fieldOf(el);
    var error = field ? field.querySelector(".field__error") : null;
    if (field) field.classList.toggle("is-invalid", !ok);
    if (error) error.textContent = ok ? "" : messageFor(el);
    if (el.required) el.setAttribute("aria-invalid", String(!ok));
    return ok;
  }

  /* Fehler erst zeigen, wenn jemand ein Feld verlassen hat. Danach live
     nachpruefen, damit die Meldung verschwindet, sobald es passt. */
  controls.forEach(function (el) {
    var liveEvent = el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input";

    el.addEventListener("blur", function () {
      if (el.value || el.type === "checkbox") {
        el.dataset.touched = "true";
        validate(el);
      }
    });

    el.addEventListener(liveEvent, function () {
      if (el.dataset.touched === "true") validate(el);
    });
  });

  function showStatus(kind, text) {
    status.className = "form-status is-visible form-status--" + kind;
    status.textContent = text;
  }

  function clearStatus() {
    status.className = "form-status";
    status.textContent = "";
  }

  function setBusy(busy) {
    if (!submit) return;
    submit.disabled = busy;
    submit.setAttribute("aria-busy", String(busy));
    if (submitLabel) submitLabel.textContent = busy ? "Wird gesendet" : "Anfrage senden";
  }

  function topicLabel() {
    var select = form.elements.topic;
    return select && select.selectedIndex > 0 ? select.options[select.selectedIndex].text : "Anfrage";
  }

  function mailtoHref() {
    var data = new FormData(form);
    var lines = [
      "Name: " + (data.get("name") || ""),
      "Firma: " + (data.get("company") || "-"),
      "E-Mail: " + (data.get("email") || ""),
      "Telefon: " + (data.get("phone") || "-"),
      "Anliegen: " + topicLabel(),
      "",
      data.get("message") || ""
    ];
    return "mailto:" + MAIL +
      "?subject=" + encodeURIComponent("Anfrage: " + topicLabel()) +
      "&body=" + encodeURIComponent(lines.join("\n"));
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearStatus();

    var firstInvalid = null;
    controls.forEach(function (el) {
      el.dataset.touched = "true";
      if (!validate(el) && !firstInvalid) firstInvalid = el;
    });

    if (firstInvalid) {
      showStatus("err", "Bitte prüfen Sie die markierten Felder.");
      firstInvalid.focus();
      return;
    }

    /* Honigtopf ausgefuellt: vermutlich ein Bot. Still abbrechen. */
    var trap = form.elements._gotcha;
    if (trap && trap.value) return;

    /* Noch kein Versanddienst: ehrlich sagen und E-Mail als Ausweg anbieten */
    if (!endpoint) {
      showStatus("info", "Der Formularversand ist noch nicht eingerichtet. Ihre Angaben gehen trotzdem nicht verloren:");
      var link = document.createElement("a");
      link.href = mailtoHref();
      link.textContent = "Als E-Mail öffnen";
      status.appendChild(link);
      return;
    }

    setBusy(true);

    fetch(endpoint, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        form.hidden = true;
        if (done) {
          done.hidden = false;
          done.focus();
        }
      })
      .catch(function () {
        showStatus("err", "Das hat leider nicht geklappt. Bitte versuchen Sie es noch einmal oder schreiben Sie direkt an " + MAIL + ".");
      })
      .then(function () {
        setBusy(false);
      });
  });
})();
