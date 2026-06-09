/* =========================================================
   EUROSFERA — 3D scroll-сцена (Three.js)
   Прокрутка управляет 3D-объектом и переключает шаги «полного цикла».
   ========================================================= */
(function () {
  "use strict";
  const host = document.getElementById("scene3d-canvas");
  const section = document.getElementById("scene3d");
  if (!host || !section || !window.THREE) return;
  // LITE: на телефоне/слабом устройстве WebGL не запускаем; секция превращается в чистый
  // стек шагов (см. CSS html.euro-lite .scene3d / @media). Тяжёлой scroll-сцены нет.
  const _lite = (Math.min(innerWidth, innerHeight) < 760) || ((navigator.hardwareConcurrency || 8) < 4)
    || ((navigator.deviceMemory || 8) < 4) || (navigator.connection && navigator.connection.saveData);
  if (_lite) {
    document.documentElement.classList.add("euro-lite");
    section.querySelectorAll(".scene3d-step").forEach(s => s.classList.add("active"));
    return;
  }
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 4.4);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });

  const grp = new THREE.Group(); scene.add(grp);

  // центральный объект — икосаэдр
  const geo = new THREE.IcosahedronGeometry(1.4, 1);
  // тёмное ядро
  grp.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x0a1030 })));
  // светящийся каркас
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color: 0x3B82F6, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }));
  grp.add(edges);
  // точки в вершинах
  const vGeo = new THREE.BufferGeometry();
  vGeo.setAttribute("position", geo.getAttribute("position").clone());
  grp.add(new THREE.Points(vGeo, new THREE.PointsMaterial({ color: 0x67e8f9, size: 0.07, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
  // ореол
  grp.add(new THREE.Mesh(new THREE.SphereGeometry(1.9, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0x6366F1, transparent: true, opacity: 0.05, side: THREE.BackSide, blending: THREE.AdditiveBlending })));

  // облако частиц вокруг
  const pn = reduce ? 200 : 600, pp = new Float32Array(pn * 3);
  for (let i = 0; i < pn; i++) {
    const r = 3 + Math.random() * 5, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    pp[i * 3] = r * Math.sin(p) * Math.cos(t); pp[i * 3 + 1] = r * Math.sin(p) * Math.sin(t); pp[i * 3 + 2] = r * Math.cos(p);
  }
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  const field = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x4763d0, size: 0.03, transparent: true, opacity: 0.6, depthWrite: false }));
  scene.add(field);

  const steps = [...section.querySelectorAll(".scene3d-step")];
  const dots = [...section.querySelectorAll(".scene3d-progress span")];
  let progress = 0, shown = -1;

  function setStep(i) {
    if (i === shown) return; shown = i;
    steps.forEach((s, k) => s.classList.toggle("active", k === i));
    dots.forEach((d, k) => d.classList.toggle("on", k <= i));
  }
  setStep(0);

  function onScroll() {
    const rect = section.getBoundingClientRect();
    const total = rect.height - innerHeight;
    progress = Math.min(Math.max(-rect.top / (total || 1), 0), 1);
    setStep(Math.min(3, Math.floor(progress * 4)));
  }
  addEventListener("scroll", onScroll, { passive: true });

  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  const clock = new THREE.Clock();
  let rot = 0;
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    rot += dt * 0.15;
    // целевой поворот от прокрутки + лёгкое автокручение
    grp.rotation.y = progress * Math.PI * 2 + rot;
    grp.rotation.x = progress * Math.PI * 0.8 + 0.2;
    const s = 1 + Math.sin(progress * Math.PI) * 0.18;
    grp.scale.setScalar(s);
    field.rotation.y -= dt * 0.02;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  resize(); onScroll(); addEventListener("resize", resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
  tick();
})();
