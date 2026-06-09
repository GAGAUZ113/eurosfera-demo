/* =========================================================================
   EUROSFERA — WOW-3D на скролле для направлений (Three.js).
   Одна секция <section class="scene3d" id="wow3d" data-scene="...">, объект
   строится по data-scene. Стиль — фирменный «светящийся каркас» (тёмные грани +
   аддитивные рёбра), надёжно читается на тёмном фоне. Геометрия своя, с нуля.
   Сцены: container (логистика), molecule (агро), equalizer (музыка).
   ========================================================================= */
(function () {
  "use strict";
  const host = document.getElementById("wow3d-canvas");
  const section = document.getElementById("wow3d");
  if (!host || !section || !window.THREE) return;

  const _lite = (Math.min(innerWidth, innerHeight) < 760) || ((navigator.hardwareConcurrency || 8) < 4)
    || ((navigator.deviceMemory || 8) < 4) || (navigator.connection && navigator.connection.saveData);
  if (_lite) {
    document.documentElement.classList.add("euro-lite");
    section.querySelectorAll(".scene3d-step").forEach(s => s.classList.add("active"));
    return;
  }
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SCENE = section.getAttribute("data-scene") || "container";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.6, 9);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });

  const root = new THREE.Group(); scene.add(root);

  // ---- хелперы «светящихся» примитивов ----
  function glow(geo, faceColor, edgeColor, opacity) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: faceColor })));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: opacity == null ? 0.9 : opacity, blending: THREE.AdditiveBlending })));
    return g;
  }
  function box(w, h, d, f, e) { return glow(new THREE.BoxGeometry(w, h, d), f, e); }
  function ball(r, f, e) { return glow(new THREE.SphereGeometry(r, 20, 16), f, e); }
  function cyl(rt, rb, h, f, e) { return glow(new THREE.CylinderGeometry(rt, rb, h, 20), f, e); }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  // фоновое облако частиц
  function addField(color) {
    const pn = reduce ? 120 : 340, pp = new Float32Array(pn * 3);
    for (let i = 0; i < pn; i++) {
      const r = 4 + Math.random() * 6, t = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pp[i * 3] = r * Math.sin(ph) * Math.cos(t); pp[i * 3 + 1] = r * Math.sin(ph) * Math.sin(t) * 0.6; pp[i * 3 + 2] = r * Math.cos(ph);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pp, 3));
    const f = new THREE.Points(g, new THREE.PointsMaterial({ color: color, size: 0.03, transparent: true, opacity: 0.5, depthWrite: false }));
    scene.add(f); return f;
  }

  // =================== СЦЕНЫ ===================
  const builders = {
    // --- ЛОГИСТИКА: контейнер раскрывается, груз вылетает ---
    container() {
      const IND = 0x818cf8, CYAN = 0x67e8f9, GOLD = 0xffd27a;
      root.rotation.x = -0.18;
      root.scale.setScalar(0.95);
      const W = 4.2, H = 2.2, D = 2.4;
      // корпус (без передней стенки — её заменяют двери)
      const body = box(W, H, D, 0x0a1230, IND); root.add(body);
      // рёбра-«гофры» (вертикальные линии) для вайба контейнера
      for (let i = -2; i <= 2; i++) {
        const rib = box(0.04, H * 0.96, D * 0.99, 0x0a1230, 0x4f46e5, 0.5);
        rib.position.set(i * (W / 5), 0, 0); root.add(rib);
      }
      // двери на петлях (поворачиваются)
      const doorW = W / 2;
      function door(side) {
        const pivot = new THREE.Group();
        pivot.position.set(side * (W / 2), 0, D / 2);   // петля на углу передней грани
        const d = box(doorW, H * 0.98, 0.06, 0x0c1740, GOLD, 0.8);
        d.position.set(-side * doorW / 2, 0, 0);          // полотно от петли внутрь
        pivot.add(d); root.add(pivot); return pivot;
      }
      const dL = door(-1), dR = door(1);
      // груз внутри
      const cargo = [];
      const cw = 0.9;
      for (let i = 0; i < 6; i++) {
        const c = box(cw, cw, cw, 0x10204a, CYAN, 0.85);
        const hx = -W / 2 + cw / 2 + 0.5 + (i % 3) * (cw + 0.25);
        const hy = -H / 2 + cw / 2 + 0.25 + (i < 3 ? 0 : cw + 0.2);
        c.position.set(hx, hy, 0);
        c.userData.home = c.position.clone();
        c.userData.fly = new THREE.Vector3(2.2 + Math.random(), 0.6 + Math.random() * 1.2, (Math.random() - 0.5) * 1.5);
        root.add(c); cargo.push(c);
      }
      addField(0x4763d0);
      return function (p, t) {
        const open = easeInOut(Math.min(p * 1.6, 1));
        dL.rotation.y = open * 2.2; dR.rotation.y = -open * 2.2;
        const fly = easeInOut(Math.max(0, (p - 0.35) / 0.65));
        cargo.forEach((c, i) => {
          const h = c.userData.home, f = c.userData.fly;
          c.position.set(h.x + f.x * fly, h.y + f.y * fly, h.z + f.z * fly);
          c.rotation.y = fly * (1 + i * 0.2); c.rotation.x = fly * 0.6;
        });
        root.rotation.y = -0.5 + p * 0.9 + t * 0.04;
      };
    },

    // --- АГРО: молекула удобрения (атомы + связи), разлетается и собирается ---
    molecule() {
      const GREEN = 0x34d399, LIME = 0x86efac, BLUE = 0x60a5fa, WHITE = 0xd1fae5;
      root.scale.setScalar(1.0);
      const core = ball(0.7, 0x07301f, GREEN); root.add(core);
      // атомы вокруг (тетраэдр-подобно) + связи
      const dirs = [
        [1.6, 1.2, 0.6, 0.42, BLUE], [-1.5, 1.0, -0.7, 0.40, BLUE],
        [1.3, -1.2, -0.9, 0.34, LIME], [-1.4, -1.1, 0.8, 0.34, LIME],
        [0.2, 1.9, -0.4, 0.30, WHITE], [-0.3, -1.9, 0.3, 0.30, WHITE],
        [1.9, 0.1, 0.9, 0.26, LIME], [-1.9, -0.1, -0.8, 0.26, BLUE],
      ];
      const atoms = [];
      dirs.forEach(([x, y, z, r, col]) => {
        const a = ball(r, 0x07301f, col);
        a.userData.home = new THREE.Vector3(x, y, z);
        a.position.copy(a.userData.home);
        // связь (цилиндр от центра к атому)
        const len = Math.hypot(x, y, z);
        const bond = cyl(0.05, 0.05, len, 0x07301f, GREEN, 0.6);
        bond.userData.target = new THREE.Vector3(x, y, z);
        root.add(a); root.add(bond); atoms.push({ a, bond, home: a.userData.home.clone(), len });
      });
      function orient(bond, from, to) {
        const mid = from.clone().add(to).multiplyScalar(0.5);
        bond.position.copy(mid);
        const dir = to.clone().sub(from);
        bond.scale.y = dir.length() / bond.userData.baseLen;
        const up = new THREE.Vector3(0, 1, 0);
        bond.quaternion.setFromUnitVectors(up, dir.clone().normalize());
      }
      atoms.forEach(o => { o.bond.userData.baseLen = o.len; });
      addField(0x2f9e6e);
      const center = new THREE.Vector3(0, 0, 0);
      return function (p, t) {
        const e = 1 + easeInOut(p) * 1.4;            // молекула «дышит»/разлетается
        atoms.forEach((o, i) => {
          const pos = o.home.clone().multiplyScalar(e);
          pos.x += Math.sin(t * 1.2 + i) * 0.05; pos.y += Math.cos(t + i) * 0.05;
          o.a.position.copy(pos);
          orient(o.bond, center, pos);
        });
        core.scale.setScalar(1 + Math.sin(t * 1.5) * 0.05);
        root.rotation.y = t * 0.3 + p * Math.PI; root.rotation.x = -0.2 + Math.sin(p * Math.PI) * 0.2;
      };
    },

    // --- МУЗЫКА: 3D-эквалайзер (бары пляшут постоянно + реагируют на скролл) ---
    equalizer() {
      const PUR = 0xa855f7, PINK = 0xec4899, VIO = 0x7c3aed;
      root.rotation.x = -0.1; root.scale.setScalar(0.9);
      const cols = 9, rows = 3, bars = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const col = [PUR, PINK, VIO][r];
          const b = box(0.42, 1, 0.42, 0x1a0b33, col, 0.9);
          b.position.set((c - (cols - 1) / 2) * 0.62, 0, (r - (rows - 1) / 2) * 0.9);
          b.userData.phase = c * 0.5 + r * 1.3;
          root.add(b); bars.push(b);
        }
      }
      // подиум
      const base = box(cols * 0.62 + 0.6, 0.12, rows * 0.9 + 0.6, 0x140a26, PINK, 0.5);
      base.position.y = -1.4; root.add(base);
      addField(0x7c3aed);
      return function (p, t) {
        const energy = 0.5 + easeInOut(p) * 1.6;
        bars.forEach((b, i) => {
          const h = 0.4 + (Math.sin(t * 4 + b.userData.phase) * 0.5 + 0.5) * 2.4 * energy;
          b.scale.y = h; b.position.y = (h * 1) / 2 - 1.34;
        });
        root.rotation.y = -0.4 + p * 0.8 + t * 0.05;
      };
    },

    // --- ТРАНСФЕР: колесо/диск разбирается по слоям и крутится ---
    wheel() {
      const GOLD = 0xffd27a, STEEL = 0xcbd5e1, SKY = 0x38bdf8, BLUE = 0x0ea5e9;
      root.rotation.x = -0.12; root.scale.setScalar(1.0);
      const tire = glow(new THREE.TorusGeometry(1.8, 0.45, 14, 36), 0x0a0f24, BLUE, 0.75); root.add(tire);
      const rim = cyl(1.45, 1.45, 0.5, 0x10243f, STEEL); rim.rotation.x = Math.PI / 2; root.add(rim);
      const disc = cyl(1.0, 1.0, 0.12, 0x14233f, SKY); disc.rotation.x = Math.PI / 2; root.add(disc);
      const hub = cyl(0.32, 0.32, 0.7, 0x2a2410, GOLD); hub.rotation.x = Math.PI / 2; root.add(hub);
      const spokes = [];
      for (let i = 0; i < 5; i++) { const s = box(0.16, 2.5, 0.16, 0x10243f, GOLD, 0.85); s.rotation.z = i * (Math.PI * 2 / 5); root.add(s); spokes.push(s); }
      const layers = [tire, rim, disc, hub];
      tire.userData.ex = new THREE.Vector3(0, 0, -1.3); rim.userData.ex = new THREE.Vector3(0, 0, -0.4);
      disc.userData.ex = new THREE.Vector3(0, 0, 1.0); hub.userData.ex = new THREE.Vector3(0, 0, 1.9);
      layers.forEach(l => l.userData.home = l.position.clone());
      spokes.forEach(s => { s.userData.ex = new THREE.Vector3(0, 0, -0.4); s.userData.home = s.position.clone(); });
      addField(0x2563eb);
      return function (p, t) {
        const e = easeInOut(p);
        layers.concat(spokes).forEach(pt => { const h = pt.userData.home, ex = pt.userData.ex; pt.position.set(h.x + ex.x * e, h.y + ex.y * e, h.z + ex.z * e); });
        root.rotation.z = t * 0.5 + p * Math.PI * 1.6;
        root.rotation.y = Math.sin(p * Math.PI) * 0.5;
      };
    },

    // --- ФИРМА: компания «строится» из блоков снизу вверх ---
    tower() {
      const TEAL = 0x2dd4bf, SKY = 0x38bdf8, GOLD = 0xffd27a;
      root.rotation.x = -0.12; root.scale.setScalar(0.92);
      const blocks = [], n = 6;
      for (let i = 0; i < n; i++) {
        const w = 2.2 - i * 0.22;
        const b = box(w, 0.5, w, 0x07201d, i % 2 ? SKY : TEAL, 0.85);
        b.userData.home = new THREE.Vector3(0, -1.6 + i * 0.62, 0);
        b.userData.from = new THREE.Vector3((Math.sin(i * 2.3)) * 3.5, -1.6 + i * 0.62 + 4 + i * 0.6, (Math.cos(i * 1.7)) * 3.5);
        root.add(b); blocks.push(b);
      }
      const flag = cyl(0.09, 0.09, 1.1, 0x2a2410, GOLD); flag.position.set(0, -1.6 + n * 0.62 + 0.55, 0);
      flag.userData.home = flag.position.clone(); flag.userData.from = flag.userData.home.clone().add(new THREE.Vector3(0, 5, 0)); root.add(flag);
      addField(0x14b8a6);
      function lerp(o, a) { const h = o.userData.home, f = o.userData.from; o.position.set(f.x + (h.x - f.x) * a, f.y + (h.y - f.y) * a, f.z + (h.z - f.z) * a); }
      return function (p, t) {
        blocks.forEach((b, i) => { const a = easeInOut(Math.min(Math.max((p - i * 0.09) / 0.42, 0), 1)); lerp(b, a); b.rotation.y = (1 - a) * 1.6; });
        lerp(flag, easeInOut(Math.min(Math.max((p - 0.7) / 0.3, 0), 1)));
        root.rotation.y = t * 0.25 + p * 0.6;
      };
    },

    // --- ТОВАРЫ: 3D-куб товаров (3×3×3) разлетается и собирается ---
    cube() {
      const BLUE = 0x3b82f6, CYAN = 0x22d3ee, IND = 0x818cf8;
      root.rotation.x = -0.25; root.scale.setScalar(1.0);
      const cubes = [], gap = 0.74, s = 0.6;
      for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
        const c = box(s, s, s, 0x0a1230, [BLUE, CYAN, IND][(x + y + z + 3) % 3], 0.8);
        c.userData.home = new THREE.Vector3(x * gap, y * gap, z * gap);
        c.userData.dir = new THREE.Vector3(x, y, z);
        c.position.copy(c.userData.home); root.add(c); cubes.push(c);
      }
      addField(0x2563eb);
      return function (p, t) {
        const e = easeInOut(p) * 2.3;
        cubes.forEach(c => { const h = c.userData.home, d = c.userData.dir; c.position.set(h.x + d.x * e, h.y + d.y * e, h.z + d.z * e); c.rotation.y = e * 0.4; });
        root.rotation.y = t * 0.35 + p * Math.PI; root.rotation.x = -0.25 + Math.sin(p * Math.PI) * 0.2;
      };
    },
  };

  const build = builders[SCENE] || builders.container;
  const update = build();

  // ---- шаги/прогресс + цикл ----
  const steps = [...section.querySelectorAll(".scene3d-step")];
  const dots = [...section.querySelectorAll(".scene3d-progress span")];
  let progress = 0, shown = -1;
  function setStep(i) { if (i === shown) return; shown = i; steps.forEach((s, k) => s.classList.toggle("active", k === i)); dots.forEach((d, k) => d.classList.toggle("on", k <= i)); }
  setStep(0);
  function onScroll() {
    const r = section.getBoundingClientRect(); const total = r.height - innerHeight;
    progress = Math.min(Math.max(-r.top / (total || 1), 0), 1);
    if (steps.length) setStep(Math.min(steps.length - 1, Math.floor(progress * steps.length)));
  }
  addEventListener("scroll", onScroll, { passive: true });
  function resize() { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  const clock = new THREE.Clock();
  function tick() {
    const t = clock.getElapsedTime();
    update(progress, t);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  resize(); onScroll(); addEventListener("resize", resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
  tick();
})();
