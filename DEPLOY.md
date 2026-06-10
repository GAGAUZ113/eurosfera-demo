# EUROSFERA — загрузка на хостинг (SuperHosting.BG)

Пошагово для публикации на **поддомен** euro.s.bg (на основном домене уже стоит WordPress — поверх НЕ лить!).

---

## 0. Что заливать / что НЕ заливать
**Залить** (всё содержимое сайта): `*.html`, `*.css`, `*.js`, `lib/`, `assets/`, `img/`, `analytics/`, `sitemap.xml`, `robots.txt`.
**НЕ заливать** (рабочее): `.git/`, `HANDOFF.md`, `README.md`, `DEPLOY.md`, `*.zip`, `.playwright-mcp/`, `screwfast-base/`.

Готовый архив для заливки: **`eurosfera-deploy.zip`** (создаётся командой `bash make-deploy.command`, в нём только нужное).

---

## 1. Поддомен в cPanel
1. cPanel → **Domains / Subdomains** → создать, напр. `new.euro.s.bg` (или `site.`, `eu.`).
2. Запомни его папку (обычно `/home/USER/public_html/new` или `/home/USER/new.euro.s.bg`).

## 2. Заменить демо-домен на свой (ВАЖНО для SEO)
Сейчас в `canonical` и `og:url` стоит демо-адрес `gagauz113.github.io/eurosfera-demo`. Перед заливкой замени на свой поддомен. В папке сайта выполни (поменяй домен в команде):
```bash
DOMAIN="https://new.euro.s.bg"
sed -i '' "s#https://gagauz113.github.io/eurosfera-demo#$DOMAIN#g" *.html sitemap.xml
```
(на Linux/хостинге — `sed -i` без `''`). После — пересоздай zip.

## 3. Залить файлы
cPanel → **File Manager** → зайти в папку поддомена → **Upload** → загрузить `eurosfera-deploy.zip` → **Extract**. Либо по FTP.

## 4. Аналитика (письмо раз в день: страницы, источник, IP)
Пиксель `analytics/px.php` уже вставлен на ВСЕ страницы — после заливки он начнёт логировать.
1. cPanel → **Email Accounts** → создать `site@euro.s.bg`.
2. В `analytics/daily_report.php` (вверху) впиши:
   `$TO='a.tukan@euro.s.bg';  $FROM='site@euro.s.bg';`
3. (надёжнее) В `analytics/_logger.php` укажи путь к базе ВНЕ public_html:
   `define('EURO_DB_PATH','/home/USER/private/eurosfera_visits.sqlite');`
4. cPanel → **Cron Jobs** → «Once Per Day» → команда:
   `/usr/local/bin/php /home/USER/public_html/new/analytics/daily_report.php`
   (точный путь к php — cPanel → «Select PHP Version»).
5. Проверка: открой `https://new.euro.s.bg/analytics/daily_report.php` — придёт тестовое письмо.
> Подробности и GDPR — в `analytics/README.md`. IP анонимизируется автоматически.

## 5. (опц.) Google Analytics 4 — страны/графики
Если нужен GA4 (работает и параллельно с пикселем): на каждой странице ПЕРЕД `enhance.js` добавь
`<script>window.EURO_GA4_ID="G-XXXXXXXXXX";</script>` — gtag подхватится сам (IP анонимизируется).

## 6. После заливки — проверить
- [ ] Сайт открывается на поддомене, дизайн/3D на месте.
- [ ] Переключатель языка переводит (нужен доступ к Google; в РФ — через VPN).
- [ ] Форма заявки отправляется (открывает письмо / Web3Forms).
- [ ] `analytics/daily_report.php` шлёт письмо; пиксель не виден на странице.
- [ ] `robots.txt` и `sitemap.xml` доступны; в `sitemap.xml` адреса твоего домена.
- [ ] Google Search Console: добавить сайт, отправить sitemap.

---
**Контакты на сайте:** a.tukan@euro.s.bg · Telegram @gagauz13 · +359 89 209 84 60
