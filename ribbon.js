/* =========================================================
   EUROSFERA — премиум 3D-объект (Three.js), стиль AIR/Awwwards
   Глянцевая «текучая» форма с цветным светом, реагирует на
   мышь и прокрутку. Fallback: если нет WebGL — пусто (фон/текст).
   ========================================================= */
(function () {
  "use strict";
  const host = document.getElementById("premium3d-canvas");
  if (!host || !window.THREE) return;
  // LITE: на телефоне/слабом устройстве — статичный градиентный фон вместо тяжёлого WebGL (см. html.euro-lite .premium3d).
  const _lite = (Math.min(innerWidth, innerHeight) < 760) || ((navigator.hardwareConcurrency || 8) < 4)
    || ((navigator.deviceMemory || 8) < 4) || (navigator.connection && navigator.connection.saveData);
  if (_lite) { document.documentElement.classList.add("euro-lite"); return; }
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });

  const grp = new THREE.Group(); scene.add(grp);

  // глянцевый «узел» — текучая форма
  const geo = new THREE.TorusKnotGeometry(1.35, 0.42, 240, 36, 2, 3);
  const mat = new THREE.MeshStandardMaterial({ color: 0x0e1640, metalness: 0.92, roughness: 0.22 });
  const knot = new THREE.Mesh(geo, mat); grp.add(knot);
  // лёгкий каркас сверху для «техно»-блеска
  grp.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x1b2a6b, wireframe: true, transparent: true, opacity: 0.12 })));

  // свет — фирменные цвета
  scene.add(new THREE.AmbientLight(0x223, 0.6));
  const l1 = new THREE.PointLight(0x3B82F6, 60, 30); l1.position.set(5, 4, 6); scene.add(l1);
  const l2 = new THREE.PointLight(0x14B8A6, 50, 30); l2.position.set(-6, -3, 4); scene.add(l2);
  const l3 = new THREE.PointLight(0x8b5cf6, 45, 30); l3.position.set(0, 6, -4); scene.add(l3);
  const dir = new THREE.DirectionalLight(0xffffff, 0.5); dir.position.set(2, 3, 5); scene.add(dir);

  // частицы-пыль
  const pn = reduce ? 120 : 420, pp = new Float32Array(pn * 3);
  for (let i = 0; i < pn; i++) { pp[i*3]=(Math.random()-.5)*16; pp[i*3+1]=(Math.random()-.5)*10; pp[i*3+2]=(Math.random()-.5)*8; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  const dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x4763d0, size: 0.02, transparent: true, opacity: 0.5, depthWrite: false }));
  scene.add(dust);

  let mx = 0, my = 0, tx = 0, ty = 0, scr = 0;
  addEventListener("mousemove", e => { mx = (e.clientX / innerWidth - .5); my = (e.clientY / innerHeight - .5); }, { passive: true });
  addEventListener("scroll", () => { scr = scrollY || 0; }, { passive: true });

  function resize() { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  resize(); addEventListener("resize", resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(host);

  const clock = new THREE.Clock();
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    knot.rotation.y += dt * 0.25; knot.rotation.z += dt * 0.08;
    grp.children[1].rotation.copy(knot.rotation);
    tx += (mx - tx) * 0.04; ty += (my - ty) * 0.04;
    grp.rotation.y = tx * 0.6; grp.rotation.x = ty * 0.5;
    grp.position.y = Math.sin(clock.elapsedTime * 0.4) * 0.12 - scr * 0.0008;
    dust.rotation.y += dt * 0.03;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
})();
