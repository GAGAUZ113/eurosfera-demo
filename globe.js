/* =========================================================
   EUROSFERA — 3D-глобус торговых маршрутов (Three.js)
   Богатая сцена: звёздное небо, атмосфера-фреснель, светящиеся
   точки-материки, дуги-маршруты с бегущими огнями и пульсами.
   Fallback: при отсутствии WebGL остаётся CSS-глобус.
   ========================================================= */
(function () {
  "use strict";
  const host = document.getElementById("globe3d");
  if (!host || !window.THREE) return;

  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const R = 1.6;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5.2);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });

  // скрываем старый CSS-глобус
  document.querySelectorAll(".globe-wrap .orbit, .globe-wrap .route-line, .globe-wrap .globe-center").forEach(el => el.style.display = "none");

  const root = new THREE.Group(); scene.add(root);
  const group = new THREE.Group(); root.add(group);

  function ll(lat, lon, r) {
    r = r || R;
    const phi = (90 - lat) * Math.PI / 180, theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }

  // --- Звёздное небо ---
  const starN = reduce ? 350 : 1100;
  const sp = new Float32Array(starN * 3);
  for (let i = 0; i < starN; i++) {
    const r = 9 + Math.random() * 12;
    const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    sp[i * 3] = r * Math.sin(p) * Math.cos(t);
    sp[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
    sp[i * 3 + 2] = r * Math.cos(p);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x9fb4ff, size: 0.05, transparent: true, opacity: 0.7, depthWrite: false }));
  scene.add(stars);

  // --- Точки-сфера (материковый паттерн через шум) ---
  const N = reduce ? 1100 : 3200;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const cA = new THREE.Color(0x3B82F6), cB = new THREE.Color(0x22d3ee), cC = new THREE.Color(0x14B8A6);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = golden * i;
    const v = new THREE.Vector3(Math.cos(th) * rad, y, Math.sin(th) * rad).multiplyScalar(R);
    pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
    const c = cA.clone().lerp(cC, (y + 1) / 2).lerp(cB, Math.random() * 0.25);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  pg.setAttribute("color", new THREE.BufferAttribute(col, 3));
  group.add(new THREE.Points(pg, new THREE.PointsMaterial({
    size: 0.033, vertexColors: true, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  // тёмная заливка ядра
  group.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.96, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x060a1e })));
  // тонкий каркас
  group.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 40, 26),
    new THREE.MeshBasicMaterial({ color: 0x1b2150, wireframe: true, transparent: true, opacity: 0.18 })));

  // --- Атмосфера (фреснель-свечение) ---
  const atmoMat = new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
    vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(0.24,0.52,0.98,1.0)*i; }",
  });
  group.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.28, 48, 32), atmoMat));

  // --- Маршруты ---
  const EU = { "София": [42.7, 23.3], "Варшава": [52.2, 21.0], "Вильнюс": [54.7, 25.3], "Берлин": [52.5, 13.4] };
  const AS = { "Алматы": [43.2, 76.9], "Астана": [51.1, 71.4], "Ташкент": [41.3, 69.2], "Бишкек": [42.9, 74.6] };
  const euK = Object.keys(EU), asK = Object.keys(AS);
  const routes = [], rings = [];

  function ring(v) {
    const g = new THREE.RingGeometry(0.04, 0.06, 24);
    const m = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.9, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const r = new THREE.Mesh(g, m);
    r.position.copy(v.clone().multiplyScalar(1.02));
    r.lookAt(v.clone().multiplyScalar(2));
    group.add(r); rings.push({ m: r, t: Math.random() });
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), new THREE.MeshBasicMaterial({ color: 0x14B8A6 }));
    dot.position.copy(v.clone().multiplyScalar(1.01)); group.add(dot);
  }
  function arc(a, b) {
    const va = ll(a[0], a[1]), vb = ll(b[0], b[1]);
    const mid = va.clone().add(vb).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(R * (1 + va.distanceTo(vb) * 0.3));
    const curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
    const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
    group.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x6366F1, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending })));
    const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
    const dot = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xa5f3fc, size: 0.14, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    group.add(dot);
    routes.push({ curve, dot, t: Math.random() });
    ring(va); ring(vb);
  }
  for (let i = 0; i < euK.length; i++) arc(EU[euK[i]], AS[asK[i]]);
  arc(EU["София"], AS["Ташкент"]); arc(EU["Варшава"], AS["Алматы"]);
  arc(EU["Берлин"], AS["Бишкек"]); arc(EU["Вильнюс"], AS["Астана"]);

  group.rotation.x = 0.35;

  // --- интерактив ---
  let mx = 0, my = 0, tx = 0, ty = 0, scrollRot = 0;
  addEventListener("mousemove", e => { mx = (e.clientX / innerWidth - 0.5) * 0.6; my = (e.clientY / innerHeight - 0.5) * 0.5; }, { passive: true });
  addEventListener("scroll", () => { scrollRot = (scrollY || 0) * 0.0012; }, { passive: true });

  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize(); addEventListener("resize", resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(host);

  const clock = new THREE.Clock();
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    group.rotation.y += dt * 0.11;
    stars.rotation.y += dt * 0.01;
    tx += (mx - tx) * 0.05; ty += (my - ty) * 0.05;
    root.rotation.y = tx * 0.5;
    root.rotation.x = ty * 0.4;
    group.position.y = -scrollRot * 0.12;
    for (const r of routes) {
      r.t += dt * 0.16; if (r.t > 1) r.t -= 1;
      const p = r.curve.getPoint(r.t), a = r.dot.geometry.attributes.position.array;
      a[0] = p.x; a[1] = p.y; a[2] = p.z; r.dot.geometry.attributes.position.needsUpdate = true;
    }
    for (const rg of rings) {
      rg.t += dt * 0.6; if (rg.t > 1) rg.t -= 1;
      const s = 1 + rg.t * 2.4; rg.m.scale.set(s, s, s);
      rg.m.material.opacity = 0.9 * (1 - rg.t);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
})();
