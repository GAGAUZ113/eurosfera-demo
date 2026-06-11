/* =========================================================
   EUROSFERA — общие улучшения (enhance.js)
   Счётчики, плавающий виджет, форма заявки, кнопка «наверх»,
   согласие на cookies и аналитика (Google Analytics 4).

   ⬇⬇⬇  НАСТРОЙКИ — МЕНЯТЬ ТОЛЬКО ЗДЕСЬ  ⬇⬇⬇
   ========================================================= */
const EURO_CONFIG = {
  // Контакты (используются в виджете и форме)
  whatsapp: "359892098460",             // номер без + и пробелов
  telegram: "https://t.me/gagauz13",    // ссылка на Telegram (заявки идут сюда)
  email:    "sale@euro.s.bg",           // публичная почта (показывается в контактах)
  leads:    "a.tukan@euro.s.bg,sale@euro.s.bg", // КУДА слать заявки (обе почты)
  phone:    "+359 89 209 84 60",

  // === КУДА ИДУТ ЗАЯВКИ ===
  // Способ 1 (РЕКОМЕНДУЕТСЯ): через наш Telegram-бот по webhook (n8n или свой сервер).
  // Сайт отправит заявку на этот URL, а webhook перешлёт её в Telegram-бот.
  // Токен бота при этом НЕ виден на сайте — это безопасно.
  lead_webhook: "",   // напр. "https://n8n.tukan.../webhook/eurosfera-lead"

  // Способ 2 (быстро, но токен виден в коде сайта — только для теста):
  // прямая отправка в Telegram через Bot API.
  telegram_bot_token: "",   // напр. "123456:ABC..."  (НЕ рекомендуется на публичном сайте)
  telegram_chat_id:   "",   // ID чата/канала, куда слать заявки

  // Способ 3 (резерв): дублировать на email через Web3Forms (бесплатно, без сервера).
  // Ключ за 1 минуту: https://web3forms.com → вставь a.tukan@euro.s.bg → придёт Access Key.
  web3forms_key: "",   // напр. "abcd-1234-..."

  // АНАЛИТИКА (Google Analytics 4) — бесплатно, данные можно выгружать (CSV/BigQuery).
  // Создай ресурс на https://analytics.google.com → получишь ID вида G-XXXXXXXXXX.
  // Пока тут заглушка — аналитика не грузится, пока не вставишь реальный ID.
  ga4_id: "",                                // напр. "G-ABC123XYZ"  (пусто = выключено)
};
/* ⬆⬆⬆  КОНЕЦ НАСТРОЕК  ⬆⬆⬆ */


(function () {
  "use strict";

  /* ---------- 0. Направление страницы + LITE-режим (мобайл/слабые устройства) ---------- */
  // data-page → каждое направление получает свой цвет (см. enhance.css :root[data-page]).
  const PAGE_KEY = (location.pathname.match(/([a-z0-9-]+)\.html/) || [])[1] || "index";
  document.documentElement.setAttribute("data-page", PAGE_KEY);
  if (document.body) document.body.classList.add("page-" + PAGE_KEY);
  // LITE: телефон, мало ядер/памяти или экономия трафика → не грузим тяжёлый WebGL.
  const _coarse = matchMedia("(pointer: coarse)").matches;
  const _small  = Math.min(window.innerWidth, window.innerHeight) < 760;
  const _weak   = (navigator.hardwareConcurrency || 8) < 4 || (navigator.deviceMemory || 8) < 4;
  const _saveData = !!(navigator.connection && navigator.connection.saveData);
  window.EURO_LITE = !!(_small || _weak || _saveData);
  if (window.EURO_LITE) document.documentElement.classList.add("euro-lite");

  /* ---------- 1. Анимированные счётчики ---------- */
  function animateCounter(el) {
    const raw = el.textContent.trim();
    // делим на: префикс (€, и т.п.) + число + суффикс (+, K, " день", "ч"…)
    const m = raw.match(/^(\D*?)(\d[\d.,]*)(.*)$/s);
    if (!m) return;
    const prefix = m[1] || "";
    const target = parseInt(m[2].replace(/[\s.,]/g, ""), 10);
    const suffix = m[3] || "";
    if (isNaN(target)) return;
    const dur = 1400, start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out
      el.textContent = prefix + Math.round(eased * target).toLocaleString("ru-RU") + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const counterObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) { animateCounter(e.target); obs.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll(".stat-num, .fact-num, [data-count]").forEach(el => counterObs.observe(el));

  /* ---------- 2. Иконки (SVG) ---------- */
  const ICON = {
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>',
    tg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  };

  /* ---------- 3. Плавающий виджет связи ---------- */
  const fab = document.createElement("div");
  fab.className = "e-fab";
  fab.innerHTML = `
    <div class="e-fab-actions">
      <button class="e-fab-btn e-fab-form" data-open-form aria-label="Оставить заявку">${ICON.mail}<span class="e-fab-tip">Оставить заявку</span></button>
      <a class="e-fab-btn e-fab-tg" href="${EURO_CONFIG.telegram}" target="_blank" rel="noopener" aria-label="Telegram">${ICON.tg}<span class="e-fab-tip">Telegram</span></a>
      <a class="e-fab-btn e-fab-wa" href="https://wa.me/${EURO_CONFIG.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICON.wa}<span class="e-fab-tip">WhatsApp</span></a>
    </div>
    <button class="e-fab-toggle" aria-label="Связаться">${ICON.chat}</button>`;
  document.body.appendChild(fab);
  fab.querySelector(".e-fab-toggle").addEventListener("click", () => fab.classList.toggle("open"));

  /* ---------- 4. Кнопка «Наверх» ---------- */
  const top = document.createElement("button");
  top.className = "e-top"; top.setAttribute("aria-label", "Наверх"); top.innerHTML = ICON.up;
  document.body.appendChild(top);
  top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  addEventListener("scroll", () => top.classList.toggle("show", scrollY > 600), { passive: true });

  /* ---------- 5. Модальная форма заявки (Web3Forms) ---------- */
  const modal = document.createElement("div");
  modal.className = "e-modal";
  modal.innerHTML = `
    <div class="e-form-card" role="dialog" aria-modal="true">
      <button class="e-modal-close" aria-label="Закрыть">${ICON.x}</button>
      <h3>Оставить заявку</h3>
      <p class="e-sub">Ответим в течение часа в рабочее время</p>
      <form class="e-form" novalidate>
        <input type="hidden" name="access_key" value="${EURO_CONFIG.web3forms_key}">
        <input type="hidden" name="subject" value="Новая заявка с сайта EUROSFERA">
        <input type="hidden" name="from_name" value="Сайт EUROSFERA">
        <input type="checkbox" name="botcheck" class="e-hp" tabindex="-1" autocomplete="off">
        <div class="e-field">
          <label>Ваше имя</label>
          <input type="text" name="name" required placeholder="Как к вам обращаться">
        </div>
        <div class="e-field">
          <label>Телефон или email</label>
          <input type="text" name="contact" required placeholder="+359… или mail@example.com">
        </div>
        <div class="e-field">
          <label>Направление</label>
          <select name="direction">
            <option>Товары и оборудование</option>
            <option>Логистика и склады</option>
            <option>IT и лицензии ПО</option>
            <option>Юр. оформление / открытие компании</option>
            <option>Другое</option>
          </select>
        </div>
        <div class="e-field">
          <label>Сообщение</label>
          <textarea name="message" placeholder="Кратко опишите задачу"></textarea>
        </div>
        <button type="submit" class="e-submit">Отправить заявку</button>
        <div class="e-form-msg"></div>
        <p class="e-form-note">Нажимая «Отправить», вы соглашаетесь на обработку данных для ответа на заявку.</p>
      </form>
    </div>`;
  document.body.appendChild(modal);

  const formMsg = modal.querySelector(".e-form-msg");
  const formEl = modal.querySelector(".e-form");
  function openForm() { modal.classList.add("open"); document.body.style.overflow = "hidden"; }
  function closeForm() { modal.classList.remove("open"); document.body.style.overflow = ""; }
  modal.querySelector(".e-modal-close").addEventListener("click", closeForm);
  modal.addEventListener("click", e => { if (e.target === modal) closeForm(); });
  addEventListener("keydown", e => { if (e.key === "Escape") closeForm(); });

  // Любая кнопка с data-open-form или ссылка на #contact открывает форму
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-open-form]");
    if (t) { e.preventDefault(); openForm(); }
  });

  function leadText(data) {
    return "🟦 Новая заявка с сайта EUROSFERA\n\n" +
      "👤 Имя: " + (data.name || "—") + "\n" +
      "📞 Контакт: " + (data.contact || "—") + "\n" +
      "🧭 Направление: " + (data.direction || "—") + "\n" +
      "✉️ Сообщение: " + (data.message || "—") + "\n\n" +
      "🌐 Страница: " + location.href;
  }

  async function sendLead(data) {
    const C = EURO_CONFIG;
    // 1) webhook (n8n → Telegram-бот) — приоритет
    if (C.lead_webhook) {
      const r = await fetch(C.lead_webhook, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, text: leadText(data), source: "eurosfera-site", page: location.href }),
      });
      if (!r.ok) throw new Error("webhook " + r.status);
      return true;
    }
    // 2) напрямую в Telegram через Bot API
    if (C.telegram_bot_token && C.telegram_chat_id) {
      const r = await fetch("https://api.telegram.org/bot" + C.telegram_bot_token + "/sendMessage", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: C.telegram_chat_id, text: leadText(data) }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error("telegram " + (j.description || ""));
      return true;
    }
    // 3) резерв — email через Web3Forms
    if (C.web3forms_key) {
      const r = await fetch("https://api.web3forms.com/submit", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...data, access_key: C.web3forms_key }),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.message || "web3forms");
      return true;
    }
    // 4) запасной вариант без настройки — письмо на ОБЕ почты (заявки дублируются)
    const subject = encodeURIComponent("Заявка с сайта EUROSFERA");
    const body = encodeURIComponent(leadText(data));
    window.location.href = "mailto:" + (C.leads || C.email) + "?subject=" + subject + "&body=" + body;
    return true;
  }

  formEl.addEventListener("submit", async e => {
    e.preventDefault();
    formMsg.className = "e-form-msg";
    const btn = formEl.querySelector(".e-submit");
    const data = Object.fromEntries(new FormData(formEl));
    if (data.botcheck) return; // honeypot
    btn.disabled = true; btn.textContent = "Отправляем…";
    try {
      await sendLead(data);
      formEl.reset();
      formMsg.className = "e-form-msg ok";
      formMsg.textContent = "✓ Спасибо! Заявка отправлена. Мы свяжемся с вами в ближайшее время.";
      if (window.gtag) gtag("event", "generate_lead", { method: "form" });
    } catch (err) {
      formMsg.className = "e-form-msg err";
      formMsg.textContent = "Не удалось отправить. Напишите нам в Telegram или на " + EURO_CONFIG.email;
    } finally { btn.disabled = false; btn.textContent = "Отправить заявку"; }
  });

  /* ---------- 6. Согласие на cookies + Google Analytics ---------- */
  function loadGA() {
    if (!EURO_CONFIG.ga4_id) return;
    const s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + EURO_CONFIG.ga4_id;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag("js", new Date());
    gtag("config", EURO_CONFIG.ga4_id, { anonymize_ip: true });
  }
  const consent = localStorage.getItem("euro_consent");
  if (consent === "granted") {
    loadGA();
  } else if (consent !== "denied" && EURO_CONFIG.ga4_id) {
    const bar = document.createElement("div");
    bar.className = "e-consent";
    bar.innerHTML = `
      <p>Мы используем cookies для аналитики посещаемости, чтобы делать сайт лучше. Вы можете согласиться или отказаться.</p>
      <div class="e-c-btns">
        <button class="e-c-decline">Отказаться</button>
        <button class="e-c-accept">Принять</button>
      </div>`;
    document.body.appendChild(bar);
    requestAnimationFrame(() => bar.classList.add("show"));
    bar.querySelector(".e-c-accept").addEventListener("click", () => {
      localStorage.setItem("euro_consent", "granted"); bar.remove(); loadGA();
    });
    bar.querySelector(".e-c-decline").addEventListener("click", () => {
      localStorage.setItem("euro_consent", "denied"); bar.remove();
    });
  }

  /* ---------- 7. Анимации: GSAP, 3D-наклон, печатающийся текст ---------- */
  const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.async = true; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  // GSAP — кинематографичное появление шапки + лёгкий параллакс
  function initGSAP() {
    if (!window.gsap || reduceMotion) return;
    // Hero «въезжает» РОВНО когда штора прелоадера поднимается (класс e-ready) — иначе
    // анимация играла бы под заставкой и её не видно. Фолбэк-таймер на случай, если e-ready не пришёл.
    const heroEls = ".hero .hero-badge, .hero h1, .hero .lead, .hero p, .hero .hero-btns, .hero .hero-vendors";
    let heroPlayed = false;
    function heroIn() {
      if (heroPlayed) return; heroPlayed = true;
      gsap.from(heroEls, { y: 30, opacity: 0, duration: .9, stagger: .12, ease: "power3.out", clearProps: "all" });
    }
    const rootEl = document.documentElement;
    if (rootEl.classList.contains("e-ready")) heroIn();
    else {
      const mo = new MutationObserver(() => { if (rootEl.classList.contains("e-ready")) { mo.disconnect(); heroIn(); } });
      mo.observe(rootEl, { attributes: true, attributeFilter: ["class"] });
      setTimeout(() => { mo.disconnect(); heroIn(); }, 5000); // страховка: не оставить hero невидимым
    }
    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.to("#particles", {
        yPercent: 18, ease: "none",
        scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: true },
      });
      // ВНИМАНИЕ: появление заголовков делает система .reveal (IntersectionObserver + CSS),
      // отдельный gsap.from тут НЕ используем — иначе inline opacity:0 конфликтует с .reveal
      // и заголовок может «застрять» невидимым. Оставляем только безопасный параллакс.
      // Параллакс — только на десктопе (на телефоне скролл должен быть лёгким)
      if (!window.EURO_LITE && !_coarse) {
        document.querySelectorAll(".hero-photo").forEach(el => {
          gsap.to(el, { yPercent: 24, ease: "none",
            scrollTrigger: { trigger: el.closest("section,.hero") || el, start: "top top", end: "bottom top", scrub: true } });
        });
        const word = document.querySelector(".premium3d-word");
        if (word) gsap.to(word, { xPercent: 8, ease: "none",
          scrollTrigger: { trigger: ".premium3d", start: "top top", end: "bottom top", scrub: 1 } });
      }
    }
  }

  // Vanilla-tilt — карточки наклоняются за курсором (сбалансированно)
  function initTilt() {
    if (!window.VanillaTilt || reduceMotion) return;
    if (matchMedia("(pointer: coarse)").matches) return; // на тач-экранах наклон не нужен (и не плодим glare-слои)
    const cards = document.querySelectorAll(".dir-card, .sw-card, .price-card, .why-card");
    if (cards.length) VanillaTilt.init(cards, { max: 6, speed: 500, scale: 1.02, glare: true, "max-glare": 0.12 });
  }

  // Typed.js — печатающийся список направлений (если на странице есть #typed-roles)
  function initTyped() {
    const el = document.getElementById("typed-roles");
    if (!el || !window.Typed) return;
    el.textContent = "";
    new Typed("#typed-roles", {
      strings: ["Товары", "Логистику", "IT и лицензии", "Открытие компании", "Удобрения", "Premium-трансфер"],
      typeSpeed: 70, backSpeed: 35, backDelay: 1600, startDelay: 400, loop: true, smartBackspace: true,
    });
  }

  // Открываем отправку заявок для страничных форм (напр. онлайн-заказ трансфера)
  window.euroSendLead = sendLead;
  window.euroOpenForm = function (preset) {
    if (preset && preset.message) {
      const ta = modal.querySelector('[name="message"]'); if (ta) ta.value = preset.message;
    }
    openForm();
  };

  /* ---------- 7b. Плавный переход между страницами ---------- */
  const pageFade = document.createElement("div");
  pageFade.className = "e-pagefade";
  pageFade.innerHTML = '<div class="e-pf-cover"></div><div class="e-pf-bars"><i></i><i></i><i></i><i></i><i></i></div>';
  document.body.appendChild(pageFade);
  // Разные анимации перехода по направлениям: [вариант, цвет]
  const PF = {
    "goods.html":     ["t-right", "#2563EB"],
    "logistics.html": ["t-up",    "#4F46E5"],
    "it.html":        ["t-bars",  "#0e7490"],
    "company.html":   ["t-fade",  "#0D9488"],
    "agro.html":      ["t-iris",  "#15803d"],
    "transfer.html":  ["t-iris",  "#0369a1"],
    "music.html":     ["t-bars",  "#6d28d9"],
    "index.html":     ["t-fade",  "#0a0f2c"],
  };
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (a.target === "_blank" || a.hasAttribute("download") || a.hasAttribute("data-lightbox") || a.hasAttribute("data-open-form")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (/^https?:\/\//i.test(href) && href.indexOf(location.host) === -1) return; // внешняя ссылка
    if (!/\.html(\?|#|$)/.test(href)) return; // только переходы на наши страницы
    // Та же страница (якорь / ссылка на саму себя) — НЕ показываем шторку, иначе синий экран зависает
    let dest; try { dest = new URL(href, location.href); } catch (_) { return; }
    if (dest.pathname === location.pathname && dest.search === location.search) return;
    e.preventDefault();
    const key = ((href.match(/([a-z0-9-]+)\.html/) || [])[0]) || "index.html";
    const v = PF[key] || ["t-fade", "#0a0f2c"];
    pageFade.style.setProperty("--pf", v[1]);
    pageFade.className = "e-pagefade go " + v[0];
    setTimeout(() => { location.href = href; }, 560);
  }, true);
  // ВАЖНО: сбрасываем шторку при каждом показе страницы — в т.ч. при возврате «Назад»
  // из bfcache (иначе страница восстанавливается с уже активной шторкой = зависший синий экран).
  window.addEventListener("pageshow", () => { pageFade.className = "e-pagefade"; });
  window.addEventListener("pagehide", () => { pageFade.className = "e-pagefade"; });

  /* ---------- 8. Премиум-полировка: прогресс, аврора, магнитные кнопки ---------- */
  // Индикатор прокрутки
  const prog = document.createElement("div");
  prog.className = "e-progress";
  document.body.appendChild(prog);
  function updateProgress() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    prog.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
  }
  addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // Аврора-фон (под контентом)
  if (!reduceMotion) {
    const aur = document.createElement("div");
    aur.className = "e-aurora";
    aur.innerHTML = '<span class="a1"></span><span class="a2"></span><span class="a3"></span>';
    document.body.insertBefore(aur, document.body.firstChild);
  }

  // Магнитные кнопки — лёгкое притяжение к курсору
  if (!reduceMotion && !matchMedia("(pointer: coarse)").matches) {
    document.querySelectorAll(".btn-primary, .btn-cta, .cta-btn").forEach(btn => {
      btn.addEventListener("mousemove", e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + x * 0.18 + "px," + y * 0.28 + "px)";
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------- 9. Лайтбокс для галереи ---------- */
  const lb = document.createElement("div");
  lb.className = "e-lb";
  lb.innerHTML = '<button class="e-lb-close" aria-label="Закрыть">' + ICON.x + '</button><figure><img alt=""><figcaption></figcaption></figure>';
  document.body.appendChild(lb);
  const lbImg = lb.querySelector("img"), lbCap = lb.querySelector("figcaption");
  function closeLb() { lb.classList.remove("open"); document.body.style.overflow = ""; }
  lb.querySelector(".e-lb-close").addEventListener("click", closeLb);
  lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
  addEventListener("keydown", e => { if (e.key === "Escape") closeLb(); });
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-lightbox]");
    if (!a) return;
    e.preventDefault();
    lbImg.src = a.getAttribute("href");
    const cap = a.querySelector(".e-gallery-cap");
    lbCap.textContent = cap ? cap.textContent : "";
    lb.classList.add("open"); document.body.style.overflow = "hidden";
  });

  /* ---------- 10. Карусель (отзывы) ---------- */
  document.querySelectorAll("[data-carousel]").forEach(car => {
    const track = car.querySelector(".e-track");
    const slides = track ? [...track.children] : [];
    const dotsBox = car.querySelector(".e-c-dots");
    if (!track || !slides.length) return;
    let i = 0;
    slides.forEach((_, k) => {
      const b = document.createElement("b");
      if (!k) b.className = "on";
      b.addEventListener("click", () => { go(k); rest(); });
      dotsBox && dotsBox.appendChild(b);
    });
    const dots = dotsBox ? [...dotsBox.children] : [];
    function go(n) {
      i = (n + slides.length) % slides.length;
      track.style.transform = "translateX(" + (-i * 100) + "%)";
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
    }
    const prev = car.querySelector(".e-c-prev"), next = car.querySelector(".e-c-next");
    prev && prev.addEventListener("click", () => { go(i - 1); rest(); });
    next && next.addEventListener("click", () => { go(i + 1); rest(); });
    let timer = reduceMotion ? null : setInterval(() => go(i + 1), 5500);
    function rest() { if (timer) { clearInterval(timer); timer = setInterval(() => go(i + 1), 5500); } }
    let sx = null;
    car.addEventListener("touchstart", e => sx = e.touches[0].clientX, { passive: true });
    car.addEventListener("touchend", e => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) { go(dx < 0 ? i + 1 : i - 1); rest(); }
      sx = null;
    });
  });

  /* ---------- 11. Кастомный курсор ---------- */
  if (matchMedia("(hover: hover) and (pointer: fine)").matches && !reduceMotion) {
    const ring = document.createElement("div"); ring.className = "e-cur";
    const dot = document.createElement("div"); dot.className = "e-cur-dot";
    const spot = document.createElement("div"); spot.className = "e-spotlight"; // мягкая подсветка за курсором (цвет направления)
    document.body.appendChild(spot); document.body.appendChild(ring); document.body.appendChild(dot);
    document.body.classList.add("e-has-cursor");
    let cx = innerWidth / 2, cy = innerHeight / 2, rx = cx, ry = cy, sx2 = cx, sy2 = cy;
    addEventListener("mousemove", e => { cx = e.clientX; cy = e.clientY; dot.style.left = cx + "px"; dot.style.top = cy + "px"; }, { passive: true });
    (function loop() {
      rx += (cx - rx) * 0.2; ry += (cy - ry) * 0.2; ring.style.left = rx + "px"; ring.style.top = ry + "px";
      sx2 += (cx - sx2) * 0.08; sy2 += (cy - sy2) * 0.08; spot.style.transform = "translate(" + (sx2 - 300) + "px," + (sy2 - 300) + "px)";
      requestAnimationFrame(loop);
    })();
    const hot = "a, button, [data-open-form], .dir-card, [data-tilt], .car-tabs button, .e-c-btn, input, select, textarea, .faq-q, [data-lightbox]";
    document.addEventListener("mouseover", e => { if (e.target.closest && e.target.closest(hot)) ring.classList.add("hot"); });
    document.addEventListener("mouseout", e => { if (e.target.closest && e.target.closest(hot)) ring.classList.remove("hot"); });
  }

  /* ---------- 11b. Анимации v4: подчёркивание заголовков + штамп чисел ---------- */
  (function headReveal() {
    const targets = document.querySelectorAll(".section-head, .e-statband");
    if (!targets.length || !("IntersectionObserver" in window)) {
      targets.forEach(t => t.classList.add("head-in")); return; // фолбэк — сразу показать
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("head-in"); obs.unobserve(e.target); } });
    }, { threshold: 0.25, rootMargin: "0px 0px -40px 0px" });
    targets.forEach(t => io.observe(t));
  })();
  // порядковый индекс карточек направлений (для лёгкой каскадной задержки)
  document.querySelectorAll(".dir-cards .dir-card").forEach((c, i) => c.style.setProperty("--i", i));

  /* ---------- 11c. IT: эффект «декодирования» текста (scramble) ---------- */
  (function decodeText() {
    if (PAGE_KEY !== "it" || reduceMotion || window.EURO_LITE) return;
    const GLYPHS = "!<>-_\\/[]{}=+*?#01ABCDEF%$";
    function scramble(el) {
      const finalText = (el.getAttribute("data-final") || el.textContent || "").trim();
      if (!finalText) return;
      el.setAttribute("data-final", finalText);
      const len = finalText.length, dur = 620 + len * 22, start = performance.now();
      el.classList.add("is-scrambling");
      function tick(now) {
        const p = Math.min((now - start) / dur, 1), reveal = Math.floor(p * len);
        let out = "";
        for (let i = 0; i < len; i++) {
          const ch = finalText[i];
          out += (i < reveal || ch === " ") ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(tick);
        else { el.textContent = finalText; el.classList.remove("is-scrambling"); } // ВСЕГДА садимся на исходный текст
      }
      requestAnimationFrame(tick);
    }
    const eyebrow = document.querySelector(".premium3d-eyebrow");
    function runEyebrow() { if (eyebrow) scramble(eyebrow); }
    const rootEl = document.documentElement;
    if (rootEl.classList.contains("e-ready")) runEyebrow();
    else {
      const mo = new MutationObserver(() => { if (rootEl.classList.contains("e-ready")) { mo.disconnect(); runEyebrow(); } });
      mo.observe(rootEl, { attributes: true, attributeFilter: ["class"] });
      setTimeout(runEyebrow, 5000);
    }
    // надписи-оверлайны декодируются при прокрутке в зону видимости
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es, obs) => {
        es.forEach(e => { if (e.isIntersecting) { scramble(e.target); obs.unobserve(e.target); } });
      }, { threshold: 0.7 });
      document.querySelectorAll(".overline, .scene3d-eyebrow").forEach(el => { if (el !== eyebrow) io.observe(el); });
    }
  })();

  /* ---------- 12. Lenis — плавная инерционная прокрутка ---------- */
  function initLenis() {
    if (!window.Lenis || reduceMotion) return;
    if (matchMedia("(pointer: coarse)").matches) return; // на телефоне — родная прокрутка (плавнее, без рывков)
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.__lenis = lenis;
    if (window.ScrollTrigger) lenis.on("scroll", () => ScrollTrigger.update());
  }
  // Цветная вспышка при входе в направление (цвет = --e-indigo, свой у каждого)
  if (!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    const fl = document.createElement("div"); fl.className = "e-flash";
    document.body.appendChild(fl);
    const flash = () => requestAnimationFrame(() => { fl.classList.add("go"); setTimeout(() => fl.remove(), 950); });
    if (document.readyState === "complete") setTimeout(flash, 650);
    else addEventListener("load", () => setTimeout(flash, 650));
  }

  loadScript("lib/lenis.min.js").then(initLenis).catch(() => {});

  loadScript("lib/gsap.min.js")
    .then(() => loadScript("lib/ScrollTrigger.min.js"))
    .then(initGSAP).catch(() => {});
  loadScript("lib/vanilla-tilt.min.js").then(initTilt).catch(() => {});
  loadScript("lib/typed.umd.js").then(initTyped).catch(() => {});
})();

/* ---------- Google Analytics 4 (опционально) ----------
   Чтобы включить GA4: задай свой идентификатор в любой странице ДО enhance.js:
   <script>window.EURO_GA4_ID="G-XXXXXXXXXX";</script>
   Тогда здесь подгрузится gtag и пойдёт сбор (источник перехода, страна, устройство).
   Работает и на статике (GitHub Pages), и на хостинге. Для EU нужен баннер-согласие. */
(function () {
  "use strict";
  var ID = window.EURO_GA4_ID;
  if (!ID || !/^G-[A-Z0-9]+$/i.test(ID)) return;
  var s = document.createElement("script"); s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", ID, { anonymize_ip: true });
})();

/* ============================================================
   ДОБАВЛЕНО 2026-06-11 — микро-звуки UI + телефон под «дымкой»
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Микро-звуки (WebAudio, без файлов) ---------- */
  var SND = (function () {
    var ctx = null, muted = false;
    try { muted = localStorage.getItem("euro_snd") === "off"; } catch (e) {}

    function ensure() {
      if (reduce || muted) return null;
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { ctx = new AC(); } catch (e) { return null; }
      }
      if (ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
      return ctx;
    }
    // одна нота: частота, длительность(с), тип, громкость, задержка(с)
    function note(f, d, type, g, delay) {
      var c = ensure(); if (!c) return;
      var t0 = c.currentTime + (delay || 0);
      var osc = c.createOscillator(), gain = c.createGain();
      osc.type = type || "sine"; osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(g || 0.04, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(t0); osc.stop(t0 + d + 0.02);
    }
    return {
      get muted() { return muted; },
      setMuted: function (v) {
        muted = v;
        try { localStorage.setItem("euro_snd", v ? "off" : "on"); } catch (e) {}
      },
      click: function () { note(660, 0.06, "sine", 0.035); note(990, 0.05, "sine", 0.025, 0.012); },
      enter: function () { note(520, 0.10, "triangle", 0.04); note(780, 0.12, "triangle", 0.03, 0.05); },
      reveal: function () { note(1180, 0.05, "sine", 0.03); },
      send: function () { note(523, 0.10, "sine", 0.04); note(659, 0.10, "sine", 0.04, 0.07); note(784, 0.16, "sine", 0.045, 0.14); }
    };
  })();
  window.EuroSnd = SND;

  /* кнопка вкл/выкл звука (над «Наверх», слева) */
  var sndBtn = document.createElement("button");
  sndBtn.className = "e-snd" + (SND.muted ? " muted" : "");
  sndBtn.setAttribute("aria-label", SND.muted ? "Включить звук" : "Выключить звук");
  var ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>';
  var OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="m23 9-6 6M17 9l6 6"/></svg>';
  sndBtn.innerHTML = SND.muted ? OFF : ON;
  document.body.appendChild(sndBtn);
  sndBtn.addEventListener("click", function () {
    var willMute = !SND.muted;
    SND.setMuted(willMute);
    sndBtn.classList.toggle("muted", willMute);
    sndBtn.innerHTML = willMute ? OFF : ON;
    sndBtn.setAttribute("aria-label", willMute ? "Включить звук" : "Выключить звук");
    if (!willMute) SND.click(); // подтверждаем включение тихим тиком
  });
  addEventListener("scroll", function () { sndBtn.classList.toggle("show", scrollY > 600); }, { passive: true });

  /* значимые клики → микро-звук (делегирование) */
  document.addEventListener("click", function (e) {
    if (e.target.closest(".phone-mask")) return;            // у телефона свой звук
    if (e.target.closest(".cta-btn, .e-fab-btn, [data-open-form]")) SND.click();
    else if (e.target.closest(".dir-link, .dir-card")) SND.enter();
  }, true);
  document.addEventListener("submit", function () { SND.send(); }, true);

  /* ---------- Телефон под «дымкой»: раскрытие по клику ---------- */
  var PHONE_IC = '<svg class="pm-ic" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.5 15.5 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.24 1.02l-2.2 2.2z"/></svg>';
  function initPhone(el) {
    var enc = el.getAttribute("data-p"); if (!enc) return;
    el.innerHTML = PHONE_IC + '<span class="pm-num">+359 •• ••• •• ••</span><span class="pm-hint">Показать номер</span>';
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    function reveal() {
      if (el.classList.contains("revealed")) return;
      var dec; try { dec = atob(enc); } catch (e) { return; }
      var parts = dec.split("|");
      var tel = parts[0], show = parts[1] || parts[0];
      el.classList.add("revealed");
      el.innerHTML = PHONE_IC + '<a href="tel:' + tel + '"><span class="pm-num">' + show + "</span></a>";
      SND.reveal();
    }
    el.addEventListener("click", reveal);
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reveal(); }
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll(".phone-mask[data-p]"), initPhone);
})();
