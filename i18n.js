/* =========================================================
   EUROSFERA — мультиязычность (i18n.js)
   Полный автоперевод ВСЕЙ страницы через Google Translate.
   Надёжный метод: cookie googtrans=/ru/<lang> + перезагрузка.
   Источник — русский. Языки: RU, EN, BG, UK, PL, DE, RO, ES, TG.
   ========================================================= */
(function () {
  "use strict";

  const LANGS = [
    { c: "ru", n: "Русский", f: "🇷🇺" },
    { c: "en", n: "English", f: "🇬🇧" },
    { c: "bg", n: "Български", f: "🇧🇬" },
    { c: "uk", n: "Українська", f: "🇺🇦" },
    { c: "pl", n: "Polski", f: "🇵🇱" },
    { c: "de", n: "Deutsch", f: "🇩🇪" },
    { c: "ro", n: "Română", f: "🇷🇴" },
    { c: "es", n: "Español", f: "🇪🇸" },
    { c: "tg", n: "Тоҷикӣ", f: "🇹🇯" },
  ];

  // --- cookie helpers ---
  function setGtCookie(val) {
    const host = location.hostname;
    // основной
    document.cookie = "googtrans=" + val + ";path=/";
    // на корневой домен (для прод-домена вида example.com)
    if (host && host.indexOf(".") > -1 && !/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      const root = "." + host.replace(/^www\./, "");
      document.cookie = "googtrans=" + val + ";path=/;domain=" + root;
      document.cookie = "googtrans=" + val + ";path=/;domain=" + host;
    }
  }
  function clearGtCookie() {
    const exp = ";expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie = "googtrans=" + exp;
    const host = location.hostname;
    if (host && host.indexOf(".") > -1) {
      document.cookie = "googtrans=" + exp + ";domain=." + host.replace(/^www\./, "");
      document.cookie = "googtrans=" + exp + ";domain=" + host;
    }
  }

  // --- маленький тост обратной связи (перевод зависит от доступности Google) ---
  function toast(msg, ms) {
    let t = document.getElementById("euro-toast");
    if (!t) {
      t = document.createElement("div"); t.id = "euro-toast";
      t.style.cssText = "position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:99999;" +
        "background:rgba(8,12,30,.96);color:#fff;border:1px solid rgba(99,102,241,.4);border-radius:12px;" +
        "padding:12px 18px;font:500 14px/1.4 system-ui,sans-serif;max-width:88vw;text-align:center;" +
        "box-shadow:0 12px 40px rgba(0,0,0,.5);backdrop-filter:blur(8px)";
      document.body.appendChild(t);
    }
    t.textContent = msg; t.style.opacity = "1";
    clearTimeout(t._tm); if (ms) t._tm = setTimeout(() => { t.style.opacity = "0"; }, ms);
  }

  // --- Google Translate init ---
  window.googleTranslateElementInit = function () {
    try {
      new google.translate.TranslateElement(
        { pageLanguage: "ru", autoDisplay: false },
        "google_translate_element"
      );
    } catch (e) {}
  };
  function loadGT() {
    if (document.getElementById("gt-script")) return;
    if (!document.getElementById("google_translate_element")) {
      const holder = document.createElement("div");
      holder.id = "google_translate_element";
      holder.style.cssText = "position:absolute;left:-9999px;top:-9999px;";
      document.body.appendChild(holder);
    }
    const s = document.createElement("script");
    s.id = "gt-script";
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    // Если Google-переводчик недоступен (нет интернета / заблокирован в регионе) — честно скажем,
    // а не оставим пользователя в недоумении «почему не переводится».
    s.onerror = function () { toast("Перевод недоступен: нет связи с Google. Нужен интернет или VPN.", 6000); };
    document.head.appendChild(s);
  }

  function apply(lang) {
    localStorage.setItem("euro_lang", lang);
    if (lang === "ru") { clearGtCookie(); location.reload(); return; }
    const L = LANGS.find(x => x.c === lang);
    toast("Переводим на " + (L ? L.n : lang) + "…");   // мгновенный отклик на тап
    setGtCookie("/ru/" + lang);
    setTimeout(function () { location.reload(); }, 200);
  }

  // --- переключатель в шапке ---
  function buildSwitcher() {
    const header = document.querySelector(".header .wrap");
    if (!header || document.getElementById("euro-lang")) return;
    const box = document.createElement("div");
    box.id = "euro-lang";
    const saved = localStorage.getItem("euro_lang") || "ru";
    const SL = LANGS.find(x => x.c === saved) || LANGS[0];
    box.innerHTML =
      '<button class="euro-lang-btn" aria-label="Язык"><span class="euro-lang-cur">' + SL.f + " " + SL.c.toUpperCase() + '</span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>' +
      '<div class="euro-lang-menu">' + LANGS.map(l => '<button data-lang="' + l.c + '">' + l.f + " " + l.n + "</button>").join("") + "</div>";
    const burger = header.querySelector(".burger");
    if (burger) header.insertBefore(box, burger); else header.appendChild(box);
    const btn = box.querySelector(".euro-lang-btn");
    btn.addEventListener("click", e => { e.stopPropagation(); box.classList.toggle("open"); });
    document.addEventListener("click", () => box.classList.remove("open"));
    box.querySelectorAll("[data-lang]").forEach(b =>
      b.addEventListener("click", () => apply(b.getAttribute("data-lang"))));
  }

  function init() {
    buildSwitcher();
    const saved = localStorage.getItem("euro_lang");
    // если язык не русский — гарантируем cookie и грузим переводчик
    if (saved && saved !== "ru") {
      if (!/googtrans=\/ru\//.test(document.cookie)) setGtCookie("/ru/" + saved);
      loadGT();
    }
  }

  if (document.readyState === "complete") setTimeout(init, 250);
  else window.addEventListener("load", () => setTimeout(init, 250));
})();
