/* =========================================================================
   EUROSFERA — живой WebGL-фон (своя GLSL-«туманность»).
   Полноэкранный текучий градиент под контентом, реагирует на мышь, цвет —
   под направление (по data-page). Лёгкий: низкое внутреннее разрешение,
   пауза в фоне/вне видимости, уважает prefers-reduced-motion.
   ========================================================================= */
(function () {
  "use strict";
  if (document.getElementById("e-shaderbg")) return;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // палитра под направление (приглушённая, ложится на navy)
  const PAGE = document.documentElement.getAttribute("data-page") || "index";
  const PALETTE = {
    index:     [[0.13, 0.34, 0.85], [0.09, 0.55, 0.74], [0.30, 0.22, 0.66]],
    goods:     [[0.15, 0.39, 0.92], [0.13, 0.72, 0.85], [0.30, 0.30, 0.80]],
    logistics: [[0.31, 0.27, 0.90], [0.20, 0.36, 0.95], [0.13, 0.72, 0.85]],
    it:        [[0.03, 0.55, 0.70], [0.05, 0.65, 0.90], [0.13, 0.72, 0.85]],
    company:   [[0.05, 0.58, 0.53], [0.08, 0.72, 0.86], [0.10, 0.45, 0.70]],
    agro:      [[0.09, 0.64, 0.29], [0.13, 0.77, 0.46], [0.08, 0.60, 0.55]],
    transfer:  [[0.01, 0.41, 0.63], [0.05, 0.65, 0.90], [0.84, 0.69, 0.24]],
    music:     [[0.49, 0.23, 0.93], [0.66, 0.33, 0.97], [0.93, 0.29, 0.60]],
  };
  const C = PALETTE[PAGE] || PALETTE.index;

  const canvas = document.createElement("canvas");
  canvas.id = "e-shaderbg";
  Object.assign(canvas.style, {
    position: "fixed", inset: "0", width: "100%", height: "100%",
    zIndex: "-1", pointerEvents: "none", opacity: "0", transition: "opacity 1.2s ease",
  });
  const gl = canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: "low-power" });
  if (!gl) return; // нет WebGL — просто остаёмся на статичном navy-фоне

  (document.body || document.documentElement).appendChild(canvas);
  // ставим сразу за фоновым шумом/частицами
  requestAnimationFrame(() => { canvas.style.opacity = "1"; });

  const VERT = "attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }";
  const FRAG = [
    "precision highp float;",
    "uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse;",
    "uniform vec3 u_c1; uniform vec3 u_c2; uniform vec3 u_c3;",
    "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }",
    "float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);",
    "  float a=hash(i), b=hash(i+vec2(1.0,0.0)), c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));",
    "  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }",
    "float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.0; a*=0.5; } return v; }",
    "void main(){",
    "  vec2 uv = gl_FragCoord.xy/u_res.xy;",
    "  vec2 pp = uv*2.0-1.0; pp.x *= u_res.x/u_res.y;",
    "  float t = u_time*0.05;",
    "  vec2 m = (u_mouse*2.0-1.0)*0.35;",
    "  vec2 q = vec2(fbm(pp*1.1 + t + m), fbm(pp*1.1 - t + vec2(1.7,9.2)));",
    "  float n = fbm(pp*1.4 + q*2.2 + t*0.6);",
    "  vec3 col = mix(u_c1, u_c2, smoothstep(0.15,0.85,n));",
    "  col = mix(col, u_c3, smoothstep(0.55,1.0,q.x));",
    "  float vig = smoothstep(1.7,0.15,length(pp));",
    "  vec3 navy = vec3(0.024,0.039,0.094);",
    "  col = mix(navy, col, 0.55*vig);",
    "  gl_FragColor = vec4(col, 1.0);",
    "}",
  ].join("\n");

  function compile(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // полноэкранный треугольник
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "u_res");
  const uTime = gl.getUniformLocation(prog, "u_time");
  const uMouse = gl.getUniformLocation(prog, "u_mouse");
  gl.uniform3fv(gl.getUniformLocation(prog, "u_c1"), C[0]);
  gl.uniform3fv(gl.getUniformLocation(prog, "u_c2"), C[1]);
  gl.uniform3fv(gl.getUniformLocation(prog, "u_c3"), C[2]);

  // внутреннее разрешение: телефон — пол-разрешения, десктоп — до 1.3x (быстро)
  const small = Math.min(innerWidth, innerHeight) < 760;
  const SCALE = small ? 0.5 : Math.min(window.devicePixelRatio || 1, 1.3);
  function resize() {
    const w = Math.max(2, Math.floor(innerWidth * SCALE)), h = Math.max(2, Math.floor(innerHeight * SCALE));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); gl.uniform2f(uRes, w, h);
  }
  resize(); addEventListener("resize", resize);

  let mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5;
  if (!small) addEventListener("pointermove", e => { tmx = e.clientX / innerWidth; tmy = 1 - e.clientY / innerHeight; }, { passive: true });

  let raf = 0, running = true, t0 = null;
  function frame(now) {
    if (!running) return;
    if (t0 === null) t0 = now;
    const time = reduce ? 6.0 : (now - t0) / 1000;   // reduce-motion — статичный кадр
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
    gl.uniform1f(uTime, time); gl.uniform2f(uMouse, mx, my);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (reduce) return;                               // один кадр и стоп
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; t0 = null; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }
  document.addEventListener("visibilitychange", () => { document.hidden ? stop() : start(); });
  raf = requestAnimationFrame(frame);
})();
