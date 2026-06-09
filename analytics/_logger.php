<?php
/* =========================================================================
   EUROSFERA — лёгкий GDPR-логгер посещений (ядро). Side-effect'ов при include нет.
   Хранит: время, АНОНИМИЗИРОВАННЫЙ IP, страницу, источник перехода, краткий UA.
   База — SQLite-файл. ВАЖНО: держи базу ВНЕ public_html или закрой .htaccess (приложен).
   ========================================================================= */

/* === НАСТРОЙКИ (поменяй под свой аккаунт SuperHosting) === */
if (!defined('EURO_DB_PATH')) {
    // Лучше путь ВНЕ public_html, напр.: '/home/ВАШ_ЮЗЕР/private/eurosfera_visits.sqlite'
    define('EURO_DB_PATH', __DIR__ . '/data/visits.sqlite');
}
if (!defined('EURO_RETENTION_DAYS')) define('EURO_RETENTION_DAYS', 90); // GDPR: срок хранения

/** Анонимизирует IP (требование GDPR: обнуляем хвост → IP перестаёт идентифицировать) */
function euro_anon_ip($ip) {
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        $p = explode('.', $ip); $p[3] = '0'; return implode('.', $p);          // 78.90.123.45 → 78.90.123.0
    }
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
        $g = explode(':', $ip); return implode(':', array_slice($g, 0, 3)) . '::';
    }
    return '0.0.0.0';
}

/** Записывает один просмотр. Никогда не роняет сайт (всё в try/catch). */
function eurosfera_track_log() {
    $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 240);
    // отсекаем ботов/краулеров — чтобы в отчёте были живые люди
    if ($ua && preg_match('/bot|crawl|spider|slurp|bingpreview|facebookexternalhit|monitor|curl|wget|headless/i', $ua)) return;

    $ip_anon = euro_anon_ip($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    $page    = substr($_SERVER['HTTP_REFERER'] ?? ($_SERVER['REQUEST_URI'] ?? ''), 0, 255); // для пикселя страница = referer
    $src     = substr($_SERVER['HTTP_REFERER'] ?? '', 0, 255);
    $ts      = gmdate('Y-m-d H:i:s');

    try {
        $dir = dirname(EURO_DB_PATH);
        if (!is_dir($dir)) @mkdir($dir, 0750, true);
        $pdo = new PDO('sqlite:' . EURO_DB_PATH);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_SILENT);
        $pdo->exec('CREATE TABLE IF NOT EXISTS visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT, ip TEXT, page TEXT, src TEXT, ua TEXT)');
        $st = $pdo->prepare('INSERT INTO visits (ts, ip, page, src, ua) VALUES (?,?,?,?,?)');
        $st->execute([$ts, $ip_anon, $page, $src, $ua]);
    } catch (Throwable $e) { /* молча: аналитика не должна ломать сайт */ }
}
