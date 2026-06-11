/* arrival.js — премиум-витрина авто: реальное фото на весь кадр + мягкий «кино-зум»
   на скролле (эффект Ken Burns). Подписи меняются по мере прокрутки. БЕЗ слайда из пустоты. */
(function () {
  "use strict";
  var sec = document.getElementById("vip-arrival");
  if (!sec) return;

  var caps = Array.prototype.slice.call(sec.querySelectorAll(".va-cap"));

  // Уважаем «уменьшенную анимацию» — показываем статично
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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

    // мягкий зум 1.02 → 1.12 + лёгкий вертикальный дрейф
    if (car) {
      var scale = 1.02 + p * 0.10;
      var ty = (p - 0.5) * -2.4;
      car.style.transform = "scale(" + scale.toFixed(3) + ") translateY(" + ty.toFixed(2) + "%)";
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
