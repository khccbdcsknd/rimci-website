/* Sternwiese: Menü, Einblendung, Formular-Hinweis. Kein Scroll-Listener am Fenster. */
(function () {
  "use strict";
  var ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var menue = document.getElementById("menue");
  var auf = document.querySelector(".kopf .burger");
  var zu = document.querySelector(".menue__zu");
  function setzen(offen) {
    menue.hidden = false;
    menue.classList.toggle("offen", offen);
    auf.setAttribute("aria-expanded", String(offen));
    document.body.style.overflow = offen ? "hidden" : "";
    (offen ? zu : auf).focus();
  }
  auf.addEventListener("click", function () { setzen(true); });
  zu.addEventListener("click", function () { setzen(false); });
  menue.addEventListener("click", function (e) { if (e.target.closest("a")) setzen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menue.classList.contains("offen")) setzen(false); });

  var teile = document.querySelectorAll(".auf");
  if (ruhig || !("IntersectionObserver" in window)) {
    teile.forEach(function (t) { t.classList.add("da"); });
  } else {
    var b = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("da"); b.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    teile.forEach(function (t) { b.observe(t); });
  }

  var formular = document.querySelector(".formular");
  formular.addEventListener("submit", function (e) {
    e.preventDefault();
    formular.querySelector(".formular__hinweis").textContent = "Dies ist eine Beispielseite. Das Formular verschickt nichts.";
  });
})();
