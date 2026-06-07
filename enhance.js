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
  email:    "a.tukan@euro.s.bg",        // заявки приходят на этот email
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

  /* ---------- 1. Анимированные счётчики ---------- */
  function animateCounter(el) {
    const raw = el.textContent.trim();
    // делим на: префикс (€, и т.п.) + число + суффикс (+, K, " день", "ч"…)
    const m = raw.match(/^(\D*?)(\d[\d\s.,]*)(.*)$/s);
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
    throw new Error("not-configured");
  }

  formEl.addEventListener("submit", async e => {
    e.preventDefault();
    formMsg.className = "e-form-msg";
    const btn = formEl.querySelector(".e-submit");
    const data = Object.fromEntries(new FormData(formEl));
    if (data.botcheck) return; // honeypot
    const C = EURO_CONFIG;
    if (!C.lead_webhook && !(C.telegram_bot_token && C.telegram_chat_id) && !C.web3forms_key) {
      formMsg.className = "e-form-msg err";
      formMsg.textContent = "⚠ Форма ещё не настроена: укажите lead_webhook (Telegram-бот) в enhance.js";
      return;
    }
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
})();
