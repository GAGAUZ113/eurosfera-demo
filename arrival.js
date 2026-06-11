/* arrival.js — премиум-витрина авто.
   • Если есть файл assets/video/vclass-arrival.mp4 → видео ПРОКРУЧИВАЕТСЯ скроллом
     (машина подъезжает → дверь → гость садится → уезжает — как мини-ролик).
   • Если файла нет → реальное фото на весь кадр с мягким «кино-зумом».
   Подписи меняются по мере прокрутки. */
(function () {
  "use strict";
  var sec = document.getElementById("vip-arrival");
  if (!sec) return;

  var caps = Array.prototype.slice.call(sec.querySelectorAll(".va-cap"));
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return; // статично

  var car = sec.querySelector(".va-car");
  var bar = sec.querySelector(".va-progress i");
  var video = sec.querySelector(".va-video");
  var ticking = false, lastStage = -1;
  var scrub = false, vdur = 0;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  // Пытаемся подключить видео (только если файл реально существует)
  if (video && video.getAttribute("data-src")) {
    var url = video.getAttribute("data-src");
    fetch(url, { method: "HEAD" }).then(function (r) {
      if (!r.ok) return;
      video.src = url;
      video.addEventListener("loadedmetadata", function () {
        vdur = video.duration || 0;
        if (vdur > 0) { scrub = true; sec.classList.add("va-has-video"); render(); }
      }, { once: true });
      video.load();
    }).catch(function () {});
  }

  function render() {
    ticking = false;
    var r = sec.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    if (total <= 0) total = 1;
    var p = clamp(-r.top / total, 0, 1);

    if (scrub && vdur > 0) {
      // прокручиваем КАДРЫ видео по позиции скролла
      try { video.currentTime = clamp(p * vdur, 0, vdur - 0.05); } catch (e) {}
    } else if (car) {
      // фото: мягкий зум 1.02 → 1.12 + лёгкий вертикальный дрейф
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
