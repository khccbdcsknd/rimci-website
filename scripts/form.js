/* ==========================================================================
   RIMCI - form.js
   Anfrageformular im Footer: Prüfung, Fehlermeldungen, Lade- und Ergebniszustand.

   VERSAND: über Web3Forms (data-endpoint plus verstecktes Feld access_key).
   Ohne data-endpoint bietet das Formular an, die Anfrage als E-Mail zu öffnen.
   ========================================================================== */

(function () {
  "use strict";

  var form = document.getElementById("contact-form");
  if (!form) return;

  var status = document.getElementById("form-status");
  var done = document.getElementById("form-done");
  var submit = form.querySelector('[type="submit"]');
  var submitLabel = submit ? submit.querySelector("[data-label]") : null;
  var idleLabel = submitLabel ? submitLabel.textContent : "";
  var endpoint = (form.getAttribute("data-endpoint") || "").trim();
  var MAIL = "nikorimacbusiness@gmail.com";

  var missing = {
    firma: "Bitte nennen Sie Ihren Betrieb.",
    name: "Bitte nennen Sie Ihren Namen.",
    kontakt: "Bitte geben Sie eine Telefonnummer oder E-Mail-Adresse an."
  };

  var controls = Array.prototype.filter.call(
    form.querySelectorAll("input, textarea"),
    function (el) { return el.name && el.type !== "hidden" && el.name !== "botcheck"; }
  );

  function fieldOf(el) { return el.closest(".field"); }

  function messageFor(el) {
    var v = el.validity;
    if (v.valueMissing) return missing[el.name] || "Bitte füllen Sie dieses Feld aus.";
    if (v.tooShort) return "Das sieht noch nicht vollständig aus.";
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
     nachprüfen, damit die Meldung verschwindet, sobald es passt. */
  controls.forEach(function (el) {
    el.addEventListener("blur", function () {
      if (el.value) {
        el.dataset.touched = "true";
        validate(el);
      }
    });
    el.addEventListener("input", function () {
      if (el.dataset.touched === "true") validate(el);
    });
  });

  function showStatus(text) {
    status.className = "form-status is-visible";
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
    if (submitLabel) submitLabel.textContent = busy ? "Wird gesendet" : idleLabel;
  }

  function mailtoHref() {
    var data = new FormData(form);
    var lines = [
      "Betrieb: " + (data.get("firma") || ""),
      "Name: " + (data.get("name") || ""),
      "Telefon oder E-Mail: " + (data.get("kontakt") || ""),
      "",
      data.get("nachricht") || ""
    ];
    return "mailto:" + MAIL +
      "?subject=" + encodeURIComponent("Anfrage kostenloser Entwurf") +
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
      showStatus("Bitte prüfen Sie die markierten Felder.");
      firstInvalid.focus();
      return;
    }

    /* Honigtopf angekreuzt: vermutlich ein Bot. Still abbrechen. */
    var trap = form.elements.botcheck;
    if (trap && trap.checked) return;

    if (!endpoint) {
      showStatus("Der Versand ist gerade nicht eingerichtet. Ihre Angaben gehen trotzdem nicht verloren:");
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
        var intro = document.getElementById("form-intro");
        if (intro) intro.hidden = true;
        if (done) {
          done.hidden = false;
          done.focus();
        }
      })
      .catch(function () {
        showStatus("Das hat leider nicht geklappt. Bitte versuchen Sie es noch einmal oder schreiben Sie direkt an " + MAIL + ".");
      })
      .then(function () {
        setBusy(false);
      });
  });
})();
