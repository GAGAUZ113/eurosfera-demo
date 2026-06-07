/* =========================================================
   EUROSFERA — 3D-глобус торговых маршрутов (Three.js)
   Флагманский блок в стиле Apple: вращается, реагирует на
   прокрутку и мышь, по маршрутам бегут светящиеся точки.
   Если WebGL/Three недоступны — остаётся обычный CSS-глобус.
   ========================================================= */
(function () {
  "use strict";
  const host = document.getElementById("globe3d");
  if (!host || !window.THREE) return;

  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const R = 1.6;

  // --- сцена / камера / рендерер ---
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5.2);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";

  const group = new THREE.Group();
  scene.add(group);

  // скрываем старый CSS-глобус, показываем 3D
  const cssGlobe = document.querySelector(".globe-wrap .globe-inner, .globe-wrap");
  document.querySelectorAll(".globe-wrap .orbit, .globe-wrap .route-line, .globe-wrap .globe-center").forEach(el => el.style.display = "none");

  // --- помощник: широта/долгота -> вектор на сфере ---
  function ll(lat, lon, r) {
    r = r || R;
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }

  // --- глобус из точек (Фибоначчи-распределение) ---
  const N = reduce ? 900 : 2600;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const cA = new THREE.Color(0x3B82F6), cB = new THREE.Color(0x14B8A6);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    const v = new THREE.Vector3(Math.cos(th) * rad, y, Math.sin(th) * rad).multiplyScalar(R);
    pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
    const c = cA.clone().lerp(cB, (y + 1) / 2);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  pg.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({
    size: 0.028, vertexColors: true, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  group.add(pts);

  // --- каркас-сфера (еле заметная) ---
  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.985, 36, 24),
    new THREE.MeshBasicMaterial({ color: 0x1b2150, wireframe: true, transparent: true, opacity: 0.25 })
  );
  group.add(wire);
  // тёмная заливка, чтобы дальние точки не просвечивали
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.96, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x070b1e })
  ));
  // мягкое свечение-ореол
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.18, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x3B82F6, transparent: true, opacity: 0.06, side: THREE.BackSide, blending: THREE.AdditiveBlending })
  );
  group.add(glow);

  // --- маршруты ЕС -> Центральная Азия ---
  const hubs = [ [42.7, 23.3], [52.2, 21.0], [54.7, 25.3], [52.5, 13.4] ];        // София, Варшава, Вильнюс, Берлин
  const dest = [ [43.2, 76.9], [51.1, 71.4], [41.3, 69.2], [42.9, 74.6] ];        // Алматы, Астана, Ташкент, Бишкек
  const routes = [];
  function makeArc(a, b) {
    const va = ll(a[0], a[1]), vb = ll(b[0], b[1]);
    const mid = va.clone().add(vb).multiplyScalar(0.5);
    const lift = 1 + va.distanceTo(vb) * 0.28;
    mid.normalize().multiplyScalar(R * lift);
    const curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
    const pts2 = curve.getPoints(60);
    const g = new THREE.BufferGeometry().setFromPoints(pts2);
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x6366F1, transparent: true, opacity: 0.35 }));
    group.add(line);
    // бегущая светящаяся точка
    const dotG = new THREE.BufferGeometry();
    dotG.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
    const dot = new THREE.Points(dotG, new THREE.PointsMaterial({
      color: 0x67e8f9, size: 0.12, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    group.add(dot);
    routes.push({ curve, dot, t: Math.random() });
    // маркеры на концах
    [va, vb].forEach(v => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x14B8A6 })
      );
      m.position.copy(v.clone().multiplyScalar(1.01));
      group.add(m);
    });
  }
  for (let i = 0; i < hubs.length; i++) makeArc(hubs[i], dest[i]);
  makeArc([42.7, 23.3], [41.3, 69.2]);
  makeArc([52.2, 21.0], [43.2, 76.9]);

  group.rotation.x = 0.35;

  // --- интерактив: мышь + прокрутка ---
  let mx = 0, my = 0, tx = 0, ty = 0, scrollRot = 0;
  window.addEventListener("mousemove", e => {
    mx = (e.clientX / innerWidth - 0.5) * 0.5;
    my = (e.clientY / innerHeight - 0.5) * 0.5;
  }, { passive: true });
  window.addEventListener("scroll", () => { scrollRot = (window.scrollY || 0) * 0.0012; }, { passive: true });

  // --- размеры ---
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(host);

  // --- анимация ---
  const clock = new THREE.Clock();
  function tick() {
    const dt = clock.getDelta();
    group.rotation.y += dt * 0.12;
    tx += (mx - tx) * 0.05; ty += (my - ty) * 0.05;
    group.rotation.y += (tx) * 0.01;
    group.rotation.x = 0.35 + ty * 0.6;
    group.position.y = -scrollRot * 0.15;
    // бегущие точки по маршрутам
    for (const r of routes) {
      r.t += dt * 0.18; if (r.t > 1) r.t -= 1;
      const p = r.curve.getPoint(r.t);
      const arr = r.dot.geometry.attributes.position.array;
      arr[0] = p.x; arr[1] = p.y; arr[2] = p.z;
      r.dot.geometry.attributes.position.needsUpdate = true;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
})();
