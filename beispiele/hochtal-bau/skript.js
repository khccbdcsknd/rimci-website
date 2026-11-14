/* Hochtal Bau: Menü, Zahlen, Projekt-Leiste, Einblendung, Formular-Hinweis. Kein Scroll-Listener am Fenster. */
(function () {
  "use strict";
  var ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var beobachter = "IntersectionObserver" in window;

  var menue = document.getElementById("menue");
  var auf = document.querySelector(".kopf .burger");
  var zu = document.querySelector(".menue__zu");
  function menueSetzen(offen) {
    menue.hidden = false;
    menue.classList.toggle("offen", offen);
    auf.setAttribute("aria-expanded", String(offen));
    document.body.style.overflow = offen ? "hidden" : "";
    if (offen) zu.focus(); else auf.focus();
  }
  auf.addEventListener("click", function () { menueSetzen(true); });
  zu.addEventListener("click", function () { menueSetzen(false); });
  menue.addEventListener("click", function (e) { if (e.target.closest("a")) menueSetzen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menue.classList.contains("offen")) menueSetzen(false); });

  var teile = document.querySelectorAll(".auf");
  if (ruhig || !beobachter) {
    teile.forEach(function (t) { t.classList.add("da"); });
  } else {
    var b1 = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("da"); b1.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    teile.forEach(function (t) { b1.observe(t); });
  }

  var zahlen = document.querySelectorAll("[data-zahl]");
  if (!ruhig && beobachter) {
    var b2 = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        b2.unobserve(e.target);
        var ziel = +e.target.dataset.zahl, start = performance.now();
        function schritt(jetzt) {
          var t = Math.min((jetzt - start) / 1400, 1);
          e.target.textContent = String(Math.round(ziel * (1 - Math.pow(1 - t, 3))));
          if (t < 1) requestAnimationFrame(schritt);
        }
        e.target.textContent = "0";
        requestAnimationFrame(schritt);
      });
    }, { threshold: 0.6 });
    zahlen.forEach(function (z) { b2.observe(z); });
  }

  var leiste = document.querySelector("[data-leiste]");
  var weiter = document.querySelector("[data-weiter]");
  if (leiste && weiter) {
    function rand() { weiter.disabled = leiste.scrollLeft >= leiste.scrollWidth - leiste.clientWidth - 4; }
    weiter.addEventListener("click", function () {
      var breite = leiste.children[0].getBoundingClientRect().width + 26;
      leiste.scrollBy({ left: breite, behavior: ruhig ? "auto" : "smooth" });
    });
    leiste.addEventListener("scroll", rand, { passive: true });
    window.addEventListener("resize", rand);
    rand();
  }

  var formular = document.querySelector(".formular");
  formular.addEventListener("submit", function (e) {
    e.preventDefault();
    formular.querySelector(".formular__hinweis").textContent = "Dies ist eine Beispielseite. Das Formular verschickt nichts.";
  });
})();
