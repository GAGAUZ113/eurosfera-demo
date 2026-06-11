/* arrival.js — кинематографичная подача авто на скролле (реальные фото).
   Машина «въезжает» справа → держится в центре с лёгким зумом → «уезжает» влево.
   Подписи (Подача → Посадка → В путь) меняются по мере прокрутки. */
(function () {
  "use strict";
  var sec = document.getElementById("vip-arrival");
  if (!sec) return;

  var caps = Array.prototype.slice.call(sec.querySelectorAll(".va-cap"));

  // Уважаем «уменьшенную анимацию» — показываем всё статично
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    caps.forEach(function (c) { c.classList.add("on"); });
    return;
  }

  var car = sec.querySelector(".va-car");
  var bar = sec.querySelector(".va-progress i");
  var ticking = false, lastStage = -1;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function render() {
    ticking = false;
    var r = sec.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    if (total <= 0) total = 1;
    var p = clamp(-r.top / total, 0, 1);

    var x, sc, op = 1, t;
    if (p < 0.33) {                 // въезжает справа в центр
      t = p / 0.33;
      x = (1 - t) * 118;
      sc = 1.00 + t * 0.05;
    } else if (p < 0.66) {          // держится, медленный зум + лёгкий параллакс
      x = (p - 0.5) * -12;
      sc = 1.05 + (p - 0.33) * 0.10;
    } else {                        // уезжает влево и затухает
      t = (p - 0.66) / 0.34;
      x = -t * 132;
      sc = 1.13 - t * 0.05;
      op = 1 - clamp((t - 0.72) / 0.28, 0, 1);
    }

    if (car) {
      car.style.transform = "translateX(" + x.toFixed(2) + "%) scale(" + sc.toFixed(3) + ")";
      car.style.opacity = op.toFixed(2);
    }
    if (bar) bar.style.width = (p * 100).toFixed(1) + "%";

    var stage = p < 0.36 ? 0 : (p < 0.69 ? 1 : 2);
    if (stage !== lastStage) {
      caps.forEach(function (c) { c.classList.toggle("on", +c.dataset.stage === stage); });
      lastStage = stage;
    }
  }

  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  render();
})();
