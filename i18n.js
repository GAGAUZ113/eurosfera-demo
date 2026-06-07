/* =========================================================
   EUROSFERA — мультиязычность (i18n.js)
   Полный автоперевод ВСЕЙ страницы через Google Translate,
   привязанный к нашему красивому переключателю языков.
   Источник — русский. Переводит весь текст, не только заголовки.
   Языки: RU, EN, BG, UK, PL, DE, RO, ES, TG.
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

  // --- Google Translate init ---
  let gtReady = false;
  window.googleTranslateElementInit = function () {
    try {
      new google.translate.TranslateElement(
        { pageLanguage: "ru", includedLanguages: LANGS.map(l => l.c).join(","), autoDisplay: false },
        "google_translate_element"
      );
      gtReady = true;
      // применить сохранённый язык, когда combo появится
      const saved = localStorage.getItem("euro_lang");
      if (saved && saved !== "ru") waitCombo(() => setGoogleLang(saved));
    } catch (e) {}
  };

  function loadGT() {
    if (document.getElementById("gt-script")) return;
    const holder = document.createElement("div");
    holder.id = "google_translate_element";
    holder.style.cssText = "position:absolute;left:-9999px;top:-9999px;";
    document.body.appendChild(holder);
    const s = document.createElement("script");
    s.id = "gt-script";
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.onerror = () => console.warn("Google Translate недоступен (нет интернета?)");
    document.head.appendChild(s);
  }

  function waitCombo(cb, tries) {
    tries = tries || 0;
    const combo = document.querySelector(".goog-te-combo");
    if (combo) { cb(combo); return; }
    if (tries > 40) return;
    setTimeout(() => waitCombo(cb, tries + 1), 150);
  }

  function setGoogleLang(lang) {
    waitCombo(combo => {
      combo.value = lang === "ru" ? "" : lang;
      combo.dispatchEvent(new Event("change"));
    });
  }

  function apply(lang) {
    localStorage.setItem("euro_lang", lang);
    document.documentElement.setAttribute("data-lang", lang);
    const cur = document.querySelector("#euro-lang .euro-lang-cur");
    const L = LANGS.find(x => x.c === lang);
    if (cur && L) cur.textContent = L.f + " " + L.c.toUpperCase();
    if (lang === "ru") {
      // вернуть оригинал — сбросить перевод Google
      const combo = document.querySelector(".goog-te-combo");
      if (combo) { combo.value = ""; combo.dispatchEvent(new Event("change")); }
      // надёжный сброс — очистить cookie googtrans и перезагрузить, если был перевод
      if (/googtrans=/.test(document.cookie)) {
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        location.reload();
      }
      return;
    }
    if (gtReady) setGoogleLang(lang);
    else loadGT(), waitCombo(() => setGoogleLang(lang));
  }

  // --- переключатель в шапке ---
  function buildSwitcher() {
    const header = document.querySelector(".header .wrap");
    if (!header || document.getElementById("euro-lang")) return;
    const box = document.createElement("div");
    box.id = "euro-lang";
    box.innerHTML =
      '<button class="euro-lang-btn" aria-label="Язык"><span class="euro-lang-cur">🇷🇺 RU</span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>' +
      '<div class="euro-lang-menu">' + LANGS.map(l => '<button data-lang="' + l.c + '">' + l.f + " " + l.n + "</button>").join("") + "</div>";
    const burger = header.querySelector(".burger");
    if (burger) header.insertBefore(box, burger); else header.appendChild(box);
    const btn = box.querySelector(".euro-lang-btn");
    btn.addEventListener("click", e => { e.stopPropagation(); box.classList.toggle("open"); });
    document.addEventListener("click", () => box.classList.remove("open"));
    box.querySelectorAll("[data-lang]").forEach(b =>
      b.addEventListener("click", () => { apply(b.getAttribute("data-lang")); box.classList.remove("open"); }));
    // показать сохранённый язык на кнопке
    const saved = localStorage.getItem("euro_lang") || "ru";
    const L = LANGS.find(x => x.c === saved);
    const cur = box.querySelector(".euro-lang-cur");
    if (cur && L) cur.textContent = L.f + " " + L.c.toUpperCase();
  }

  function init() {
    buildSwitcher();
    const saved = localStorage.getItem("euro_lang");
    if (saved && saved !== "ru") loadGT(); // подгрузить переводчик и применить язык
  }

  if (document.readyState === "complete") setTimeout(init, 300);
  else window.addEventListener("load", () => setTimeout(init, 300));
})();
