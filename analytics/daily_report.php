<?php
/* =========================================================================
   EUROSFERA — ежедневный отчёт на почту (запускается КРОНОМ раз в день).
   Шлёт: сколько визитов, ТОП страниц, ТОП источников перехода, ТОП регионов IP
   (анонимизированных). Плюс чистит записи старше EURO_RETENTION_DAYS (GDPR).
   Запуск из cPanel → Cron jobs:  php /home/USER/public_html/analytics/daily_report.php
   ========================================================================= */
require __DIR__ . '/_logger.php';

/* === КУДА СЛАТЬ === */
$TO   = 'a.tukan@euro.s.bg';
$FROM = 'site@euro.s.bg';   // ящик, существующий на хостинге (иначе письмо уйдёт в спам)

$since = gmdate('Y-m-d H:i:s', time() - 86400);  // последние 24 часа
$today = gmdate('d.m.Y');

try {
    $pdo = new PDO('sqlite:' . EURO_DB_PATH);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $total = (int)$pdo->query("SELECT COUNT(*) FROM visits WHERE ts >= '$since'")->fetchColumn();
    $uniq  = (int)$pdo->query("SELECT COUNT(DISTINCT ip) FROM visits WHERE ts >= '$since'")->fetchColumn();

    $top = function($col, $label) use ($pdo, $since) {
        $q = $pdo->prepare("SELECT $col AS v, COUNT(*) AS c FROM visits
                            WHERE ts >= :s AND $col != '' GROUP BY $col ORDER BY c DESC LIMIT 15");
        $q->execute([':s' => $since]);
        $out = "\n== $label ==\n";
        $rows = $q->fetchAll(PDO::FETCH_ASSOC);
        if (!$rows) return $out . "(нет данных)\n";
        foreach ($rows as $r) $out .= str_pad($r['c'], 5, ' ', STR_PAD_LEFT) . "  " . $r['v'] . "\n";
        return $out;
    };

    $body  = "Отчёт по сайту EUROSFERA за $today (последние 24 часа)\n";
    $body .= "============================================\n";
    $body .= "Визитов (просмотров): $total\n";
    $body .= "Уникальных посетителей (по анонимизир. IP): $uniq\n";
    $body .= $top('page', 'ТОП страниц');
    $body .= $top('src',  'ТОП источников перехода (откуда пришли)');
    $body .= $top('ip',   'ТОП посетителей (IP анонимизирован, хвост обнулён)');
    $body .= "\n— IP-адреса анонимизированы (последний блок обнулён) согласно GDPR.\n";
    $body .= "— Полную статистику со странами смотри в cPanel → AWStats.\n";

    // GDPR: удаляем старые записи
    $cut = gmdate('Y-m-d H:i:s', time() - EURO_RETENTION_DAYS * 86400);
    $pdo->prepare("DELETE FROM visits WHERE ts < :c")->execute([':c' => $cut]);

    $headers = "From: EUROSFERA <$FROM>\r\nContent-Type: text/plain; charset=UTF-8\r\n";
    @mail($TO, "EUROSFERA — трафик за $today ($total визитов)", $body, $headers);
    echo "OK: отправлено на $TO ($total визитов)\n";
} catch (Throwable $e) {
    echo "Ошибка: " . $e->getMessage() . "\n";
}
