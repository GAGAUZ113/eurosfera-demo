/* =========================================================
   EUROSFERA — мультиязычность (i18n.js)
   Переключатель языков + перевод основных блоков сайта.
   Источник — русский; переключение заменяет текст по словарю.
   Языки: RU, EN, UK, PL, DE, RO, ES, TG (таджикский).
   ========================================================= */
(function () {
  "use strict";

  const LANGS = [
    { c: "ru", n: "Русский", f: "🇷🇺" },
    { c: "en", n: "English", f: "🇬🇧" },
    { c: "uk", n: "Українська", f: "🇺🇦" },
    { c: "pl", n: "Polski", f: "🇵🇱" },
    { c: "de", n: "Deutsch", f: "🇩🇪" },
    { c: "ro", n: "Română", f: "🇷🇴" },
    { c: "es", n: "Español", f: "🇪🇸" },
    { c: "tg", n: "Тоҷикӣ", f: "🇹🇯" },
  ];

  // Словарь: ключ — точный русский текст, значение — переводы.
  // (Отсутствующий перевод → остаётся русский.)
  const T = {
    "Главная": { en: "Home", uk: "Головна", pl: "Strona główna", de: "Startseite", ro: "Acasă", es: "Inicio", tg: "Асосӣ" },
    "Товары": { en: "Goods", uk: "Товари", pl: "Towary", de: "Waren", ro: "Mărfuri", es: "Productos", tg: "Молҳо" },
    "Логистика": { en: "Logistics", uk: "Логістика", pl: "Logistyka", de: "Logistik", ro: "Logistică", es: "Logística", tg: "Логистика" },
    "IT и ПО": { en: "IT & Software", uk: "IT та ПЗ", pl: "IT i oprogramowanie", de: "IT & Software", ro: "IT și software", es: "IT y software", tg: "IT ва нармафзор" },
    "Связаться": { en: "Contact", uk: "Зв’язатися", pl: "Kontakt", de: "Kontakt", ro: "Contact", es: "Contacto", tg: "Тамос" },
    "О компании": { en: "About", uk: "Про компанію", pl: "O firmie", de: "Über uns", ro: "Despre noi", es: "Nosotros", tg: "Дар бораи мо" },
    "Направления": { en: "Services", uk: "Напрямки", pl: "Kierunki", de: "Bereiche", ro: "Direcții", es: "Áreas", tg: "Самтҳо" },
    "Как работаем": { en: "How we work", uk: "Як працюємо", pl: "Jak działamy", de: "So arbeiten wir", ro: "Cum lucrăm", es: "Cómo trabajamos", tg: "Чӣ тавр кор мекунем" },

    "Обсудить задачу": { en: "Discuss your task", uk: "Обговорити задачу", pl: "Omów zadanie", de: "Aufgabe besprechen", ro: "Discută proiectul", es: "Comentar tu tarea", tg: "Муҳокима кардан" },
    "Берём на себя:": { en: "We handle:", uk: "Беремо на себе:", pl: "Zajmujemy się:", de: "Wir übernehmen:", ro: "Ne ocupăm de:", es: "Nos ocupamos de:", tg: "Ба зимма мегирем:" },
    "Ваше представительство": { en: "Your representation", uk: "Ваше представництво", pl: "Twoje przedstawicielstwo", de: "Ihre Vertretung", ro: "Reprezentanța dvs.", es: "Su representación", tg: "Намояндагии шумо" },
    "Евросоюзе": { en: "the European Union", uk: "Євросоюзі", pl: "Unii Europejskiej", de: "der Europäischen Union", ro: "Uniunea Europeană", es: "la Unión Europea", tg: "Иттиҳоди Аврупо" },
    "в": { en: "in", uk: "в", pl: "w", de: "in", ro: "în", es: "en", tg: "дар" },
    "Направления ↓": { en: "Services ↓", uk: "Напрямки ↓", pl: "Kierunki ↓", de: "Bereiche ↓", ro: "Direcții ↓", es: "Áreas ↓", tg: "Самтҳо ↓" },
    "Подробнее →": { en: "Learn more →", uk: "Детальніше →", pl: "Więcej →", de: "Mehr →", ro: "Detalii →", es: "Más →", tg: "Муфассал →" },
    "EU-юрлицо": { en: "EU entity", uk: "Компанія в ЄС", pl: "Podmiot z UE", de: "EU-Unternehmen", ro: "Entitate UE", es: "Entidad de la UE", tg: "Ширкати ИА" },
    "EUR-счёт": { en: "EUR account", uk: "EUR-рахунок", pl: "Konto EUR", de: "EUR-Konto", ro: "Cont EUR", es: "Cuenta EUR", tg: "Ҳисоби EUR" },
    "Склады в 3 странах": { en: "Warehouses in 3 countries", uk: "Склади у 3 країнах", pl: "Magazyny w 3 krajach", de: "Lager in 3 Ländern", ro: "Depozite în 3 țări", es: "Almacenes en 3 países", tg: "Анборҳо дар 3 кишвар" },

    "Закупаем товары у европейских поставщиков, оплачиваем инвойсы в евро, храним на складах ЕС и организуем доставку — легально, от имени EU‑компании.":
      { en: "We buy goods from European suppliers, pay invoices in euros, store at EU warehouses and arrange delivery — legally, on behalf of an EU company.",
        uk: "Закуповуємо товари в європейських постачальників, оплачуємо інвойси в євро, зберігаємо на складах ЄС і організовуємо доставку — легально, від імені компанії в ЄС.",
        pl: "Kupujemy towary u europejskich dostawców, opłacamy faktury w euro, magazynujemy w UE i organizujemy dostawę — legalnie, w imieniu firmy z UE.",
        de: "Wir kaufen Waren bei europäischen Lieferanten, bezahlen Rechnungen in Euro, lagern in EU-Lagern und organisieren die Lieferung — legal, im Namen eines EU-Unternehmens.",
        ro: "Cumpărăm mărfuri de la furnizori europeni, plătim facturile în euro, depozităm în UE și organizăm livrarea — legal, în numele unei companii din UE.",
        es: "Compramos productos a proveedores europeos, pagamos facturas en euros, almacenamos en la UE y organizamos la entrega — legalmente, en nombre de una empresa de la UE.",
        tg: "Молро аз таъминкунандагони аврупоӣ мехарем, ҳисобҳоро бо евро пардохт мекунем, дар анборҳои ИА нигоҳ медорем ва расонданро ташкил мекунем — қонунан, аз номи ширкати ИА." },

    "Наши направления — одна компания": { en: "Our services — one company", uk: "Наші напрямки — одна компанія", pl: "Nasze kierunki — jedna firma", de: "Unsere Bereiche — ein Unternehmen", ro: "Direcțiile noastre — o singură companie", es: "Nuestras áreas — una empresa", tg: "Самтҳои мо — як ширкат" },
    "Выберите задачу — мы предложим решение": { en: "Pick a task — we’ll offer a solution", uk: "Оберіть задачу — ми запропонуємо рішення", pl: "Wybierz zadanie — zaproponujemy rozwiązanie", de: "Wählen Sie eine Aufgabe — wir bieten die Lösung", ro: "Alegeți o sarcină — propunem soluția", es: "Elija una tarea — le ofreceremos una solución", tg: "Вазифаро интихоб кунед — мо ҳалли онро пешниҳод мекунем" },

    "Товары и оборудование": { en: "Goods & equipment", uk: "Товари та обладнання", pl: "Towary i sprzęt", de: "Waren & Ausrüstung", ro: "Mărfuri și echipamente", es: "Productos y equipos", tg: "Молҳо ва таҷҳизот" },
    "Логистика и склады": { en: "Logistics & warehousing", uk: "Логістика та склади", pl: "Logistyka i magazyny", de: "Logistik & Lager", ro: "Logistică și depozite", es: "Logística y almacenes", tg: "Логистика ва анборҳо" },
    "IT и лицензии ПО": { en: "IT & software licenses", uk: "IT та ліцензії ПЗ", pl: "IT i licencje", de: "IT & Software-Lizenzen", ro: "IT și licențe software", es: "IT y licencias de software", tg: "IT ва иҷозатномаҳои нармафзор" },
    "Открытие компании в Болгарии": { en: "Company formation in Bulgaria", uk: "Відкриття компанії в Болгарії", pl: "Założenie firmy w Bułgarii", de: "Firmengründung in Bulgarien", ro: "Înființare firmă în Bulgaria", es: "Apertura de empresa en Bulgaria", tg: "Кушодани ширкат дар Булғористон" },
    "Удобрения и Агро": { en: "Fertilizers & Agro", uk: "Добрива та Агро", pl: "Nawozy i Agro", de: "Dünger & Agrar", ro: "Îngrășăminte și Agro", es: "Fertilizantes y Agro", tg: "Нуриҳо ва Агро" },
    "Premium-трансфер": { en: "Premium transfer", uk: "Premium-трансфер", pl: "Transfer premium", de: "Premium-Transfer", ro: "Transfer premium", es: "Traslado premium", tg: "Трансфери Premium" },

    "Бренды и поставщики, с которыми мы работаем": { en: "Brands and suppliers we work with", uk: "Бренди та постачальники, з якими ми працюємо", pl: "Marki i dostawcy, z którymi współpracujemy", de: "Marken und Lieferanten, mit denen wir arbeiten", ro: "Branduri și furnizori cu care lucrăm", es: "Marcas y proveedores con los que trabajamos", tg: "Брендҳо ва таъминкунандагоне, ки бо мо кор мекунанд" },
    "Галерея": { en: "Gallery", uk: "Галерея", pl: "Galeria", de: "Galerie", ro: "Galerie", es: "Galería", tg: "Галерея" },
    "Как мы работаем": { en: "How we work", uk: "Як ми працюємо", pl: "Jak pracujemy", de: "Wie wir arbeiten", ro: "Cum lucrăm", es: "Cómo trabajamos", tg: "Чӣ тавр кор мекунем" },
    "Склады, логистика и команда в Европе": { en: "Warehouses, logistics and team in Europe", uk: "Склади, логістика та команда в Європі", pl: "Magazyny, logistyka i zespół w Europie", de: "Lager, Logistik und Team in Europa", ro: "Depozite, logistică și echipă în Europa", es: "Almacenes, logística y equipo en Europa", tg: "Анборҳо, логистика ва даста дар Аврупо" },
    "География": { en: "Geography", uk: "Географія", pl: "Geografia", de: "Geografie", ro: "Geografie", es: "Geografía", tg: "Ҷуғрофия" },
    "Готовы обсудить задачу?": { en: "Ready to discuss your task?", uk: "Готові обговорити задачу?", pl: "Gotowi omówić zadanie?", de: "Bereit, Ihre Aufgabe zu besprechen?", ro: "Gata să discutăm proiectul?", es: "¿Listo para comentar tu tarea?", tg: "Барои муҳокима омодаед?" },

    "Оставить заявку": { en: "Send a request", uk: "Залишити заявку", pl: "Wyślij zapytanie", de: "Anfrage senden", ro: "Trimite o cerere", es: "Enviar solicitud", tg: "Дархост фиристодан" },
    "Ответим в течение часа в рабочее время": { en: "We reply within an hour during business hours", uk: "Відповімо протягом години в робочий час", pl: "Odpowiemy w ciągu godziny w godzinach pracy", de: "Wir antworten innerhalb einer Stunde während der Geschäftszeiten", ro: "Răspundem în decurs de o oră în programul de lucru", es: "Respondemos en una hora en horario laboral", tg: "Дар вақти корӣ дар давоми як соат ҷавоб медиҳем" },
    "Ваше имя": { en: "Your name", uk: "Ваше ім’я", pl: "Twoje imię", de: "Ihr Name", ro: "Numele dvs.", es: "Su nombre", tg: "Номи шумо" },
    "Телефон или email": { en: "Phone or email", uk: "Телефон або email", pl: "Telefon lub email", de: "Telefon oder E-Mail", ro: "Telefon sau email", es: "Teléfono o email", tg: "Телефон ё email" },
    "Направление": { en: "Service", uk: "Напрямок", pl: "Kierunek", de: "Bereich", ro: "Direcție", es: "Área", tg: "Самт" },
    "Сообщение": { en: "Message", uk: "Повідомлення", pl: "Wiadomość", de: "Nachricht", ro: "Mesaj", es: "Mensaje", tg: "Паём" },
    "Отправить заявку": { en: "Send request", uk: "Надіслати заявку", pl: "Wyślij", de: "Senden", ro: "Trimite", es: "Enviar", tg: "Фиристодан" },

    "Контакты": { en: "Contacts", uk: "Контакти", pl: "Kontakt", de: "Kontakte", ro: "Contacte", es: "Contactos", tg: "Тамосҳо" },
    "Компания": { en: "Company", uk: "Компанія", pl: "Firma", de: "Unternehmen", ro: "Companie", es: "Empresa", tg: "Ширкат" },
    "О нас": { en: "About us", uk: "Про нас", pl: "O nas", de: "Über uns", ro: "Despre noi", es: "Sobre nosotros", tg: "Дар бораи мо" },
  };

  // --- кэш текстовых узлов ---
  const nodes = [];
  function buildCache() {
    nodes.length = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.nodeName;
        if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest("#euro-lang, #typed-roles, .stat-num, .fact-num, .e-progress")) return NodeFilter.FILTER_REJECT;
        return n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    let n;
    while ((n = walker.nextNode())) {
      const key = n.nodeValue.trim();
      if (T[key]) nodes.push({ node: n, raw: n.nodeValue, key });
    }
  }

  function apply(lang) {
    nodes.forEach(({ node, raw, key }) => {
      if (lang === "ru") { node.nodeValue = raw; return; }
      const tr = T[key] && T[key][lang];
      node.nodeValue = tr ? raw.replace(key, tr) : raw;
    });
    document.documentElement.lang = lang;
    localStorage.setItem("euro_lang", lang);
    const cur = document.querySelector("#euro-lang .euro-lang-cur");
    const L = LANGS.find(x => x.c === lang);
    if (cur && L) cur.textContent = L.f + " " + L.c.toUpperCase();
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
    // вставляем перед бургером или в конец
    const burger = header.querySelector(".burger");
    if (burger) header.insertBefore(box, burger); else header.appendChild(box);
    const btn = box.querySelector(".euro-lang-btn");
    btn.addEventListener("click", e => { e.stopPropagation(); box.classList.toggle("open"); });
    document.addEventListener("click", () => box.classList.remove("open"));
    box.querySelectorAll("[data-lang]").forEach(b =>
      b.addEventListener("click", () => { apply(b.getAttribute("data-lang")); box.classList.remove("open"); }));
  }

  function init() {
    buildSwitcher();
    buildCache();
    apply(localStorage.getItem("euro_lang") || "ru");
  }

  // даём enhance.js построить виджеты/форму, затем кэшируем
  if (document.readyState === "complete") setTimeout(init, 350);
  else window.addEventListener("load", () => setTimeout(init, 350));
})();
