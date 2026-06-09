/* =========================================================================
   EUROSFERA — 3D «взрыв-схема» устройства на скролле (Three.js), для IT.
   Оригинальная геометрия (стилизованный накопитель) собрана из примитивов:
   на прокрутке детали РАЗЛЕТАЮТСЯ на части (exploded view) и вращаются.
   Стиль — фирменный «светящийся каркас» (тёмные грани + аддитивные рёбра),
   надёжно читается на тёмном фоне без env-карт. Чужие ассеты не используются.
   ========================================================================= */
(function () {
  "use strict";
  const host = document.getElementById("device3d-canvas");
  const section = document.getElementById("device3d");
  if (!host || !section || !window.THREE) return;

  // LITE: на телефоне/слабом устройстве WebGL не запускаем → секция = чистый стек шагов
  const _lite = (Math.min(innerWidth, innerHeight) < 760) || ((navigator.hardwareConcurrency || 8) < 4)
    || ((navigator.deviceMemory || 8) < 4) || (navigator.connection && navigator.connection.saveData);
  if (_lite) {
    document.documentElement.classList.add("euro-lite");
    section.querySelectorAll(".scene3d-step").forEach(s => s.classList.add("active"));
    return;
  }
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ACCENT = 0x22d3ee, ACCENT2 = 0x0ea5e9, ICE = 0x9fe9ff, GOLD = 0xffd27a;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.4, 8.6);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });

  const root = new THREE.Group();
  root.rotation.x = -0.52;
  root.scale.setScalar(0.82);
  scene.add(root);

  const parts = [];
  /** Деталь = тёмная грань + светящиеся рёбра (аддитивно). explode — куда улетает при разборе. */
  function makePart(geo, faceColor, edgeColor, ex, ey, ez) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: faceColor })));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })));
    g.userData.explode = new THREE.Vector3(ex, ey, ez);
    return g;
  }
  function add(g, x, y, z) { g.position.set(x, y, z); g.userData.home = g.position.clone(); root.add(g); parts.push(g); return g; }

  const W = 3.0, D = 2.1;
  // основание (корпус)
  add(makePart(new THREE.BoxGeometry(W, 0.22, D), 0x0a1633, ACCENT2, 0, -1.5, 0), 0, -0.55, 0);
  // плата снизу (акцентное свечение)
  add(makePart(new THREE.BoxGeometry(W * 0.9, 0.05, D * 0.9), 0x06222b, ACCENT, 0, -2.0, 0), 0, -0.7, 0);
  // диск-«блин» 1
  add(makePart(new THREE.CylinderGeometry(1.0, 1.0, 0.05, 48), 0x10243f, ICE, 0, 0.7, 0), 0, -0.12, 0);
  // диск-«блин» 2
  add(makePart(new THREE.CylinderGeometry(1.0, 1.0, 0.05, 48), 0x10243f, ICE, 0, 1.5, 0), 0, 0.12, 0);
  // шпиндель (золотой)
  add(makePart(new THREE.CylinderGeometry(0.2, 0.2, 0.55, 24), 0x2a2410, GOLD, 0, 1.0, 0), 0, 0, 0);
  // коромысло (актуатор)
  const arm = add(makePart(new THREE.BoxGeometry(1.45, 0.07, 0.26), 0x18243f, ACCENT, 1.4, 1.1, 0.6), 0.7, 0.05, 0.7);
  arm.rotation.y = -0.5;
  // головка чтения
  add(makePart(new THREE.BoxGeometry(0.16, 0.05, 0.16), 0x18243f, GOLD, 1.9, 1.4, 1.0), 0.0, 0.05, 0.35);
  // крышка
  add(makePart(new THREE.BoxGeometry(W, 0.1, D), 0x0c1c3a, ACCENT2, 0, 2.0, 0), 0, 0.42, 0);
  // 4 винта по углам (золото)
  const sx = W / 2 - 0.16, sz = D / 2 - 0.16;
  [[sx, sz], [-sx, sz], [sx, -sz], [-sx, -sz]].forEach(([x, z], i) => {
    add(makePart(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 12), 0x2a2410, GOLD, x * 0.7, 1.6 + i * 0.18, z * 0.7), x, 0.46, z);
  });

  // лёгкое облако частиц для глубины
  const pn = reduce ? 120 : 360, pp = new Float32Array(pn * 3);
  for (let i = 0; i < pn; i++) {
    const r = 4 + Math.random() * 6, t = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pp[i * 3] = r * Math.sin(ph) * Math.cos(t); pp[i * 3 + 1] = r * Math.sin(ph) * Math.sin(t) * 0.6; pp[i * 3 + 2] = r * Math.cos(ph);
  }
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  const field = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x3aa6c8, size: 0.03, transparent: true, opacity: 0.5, depthWrite: false }));
  scene.add(field);

  // шаги/прогресс (переиспользуем разметку .scene3d-step)
  const steps = [...section.querySelectorAll(".scene3d-step")];
  const dots = [...section.querySelectorAll(".scene3d-progress span")];
  let progress = 0, shown = -1;
  function setStep(i) { if (i === shown) return; shown = i; steps.forEach((s, k) => s.classList.toggle("active", k === i)); dots.forEach((d, k) => d.classList.toggle("on", k <= i)); }
  setStep(0);
  function onScroll() {
    const r = section.getBoundingClientRect(); const total = r.height - innerHeight;
    progress = Math.min(Math.max(-r.top / (total || 1), 0), 1);
    setStep(Math.min(steps.length - 1, Math.floor(progress * steps.length)));
  }
  addEventListener("scroll", onScroll, { passive: true });

  function resize() { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  const clock = new THREE.Clock(); let auto = 0;
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05); auto += dt;
    const e = reduce ? 0.55 : easeInOut(progress);          // фактор разлёта 0..1
    for (const g of parts) {
      const h = g.userData.home, o = g.userData.explode;
      g.position.set(h.x + o.x * e, h.y + o.y * e, h.z + o.z * e);
    }
    root.rotation.y = auto * 0.35 + progress * Math.PI * 1.1;
    root.rotation.x = -0.52 + Math.sin(progress * Math.PI) * 0.14;
    field.rotation.y += dt * 0.02;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  resize(); onScroll(); addEventListener("resize", resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
  tick();
})();
