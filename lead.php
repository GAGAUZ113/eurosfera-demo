<?php
/* =========================================================================
   EUROSFERA — серверный приём заявок (PHP).
   • Отправляет письмо ПРЯМО с сайта (клиенту НЕ нужен почтовый агент).
   • Присваивает уникальный номер: EU-ГГГГММДД-NNN (дата + счётчик за день).
   • Маршрутизация: IT-заявки → it@; остальные → sale@ (Альфия); копия всегда → a.tukan@.
   • Бэкап каждой заявки в analytics/data/leads.log.
   Возвращает JSON: {"success":true,"ticket":"EU-20260612-001"}.
   ========================================================================= */
header('Content-Type: application/json; charset=utf-8');

$OWNER = 'a.tukan@euro.s.bg';   // Анатолий — копия всех заявок
$SALES = 'sale@euro.s.bg';      // Альфия — обычные заявки
$ITBOX = 'it@euro.s.bg';        // IT-направление

/* --- входные данные: form-data или JSON --- */
$in = $_POST;
if (empty($in)) { $j = json_decode(file_get_contents('php://input'), true); if (is_array($j)) $in = $j; }

/* --- honeypot (бот заполнил скрытое поле) — тихо «успех», письмо не шлём --- */
if (!empty($in['botcheck'])) { echo json_encode(['success' => true, 'ticket' => '']); exit; }

$name    = trim((string)($in['name'] ?? ''));
$contact = trim((string)($in['contact'] ?? ''));
$dir     = trim((string)($in['direction'] ?? ''));
$message = trim((string)($in['message'] ?? ''));
$page    = trim((string)($in['page'] ?? ''));

if ($name === '' || $contact === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'empty']); exit;
}
/* защита от инъекции заголовков письма */
$name    = str_replace(["\r", "\n"], ' ', $name);
$contact = str_replace(["\r", "\n"], ' ', $contact);

/* --- уникальный номер EU-ГГГГММДД-NNN (атомарно, с блокировкой) --- */
$dataDir = __DIR__ . '/analytics/data';
if (!is_dir($dataDir)) @mkdir($dataDir, 0750, true);
$today = gmdate('Ymd');
$n = 1;
if ($fp = @fopen($dataDir . '/leads_counter.json', 'c+')) {
    flock($fp, LOCK_EX);
    $st = json_decode(stream_get_contents($fp), true);
    if (is_array($st) && ($st['date'] ?? '') === $today) $n = (int)$st['n'] + 1;
    rewind($fp); ftruncate($fp, 0);
    fwrite($fp, json_encode(['date' => $today, 'n' => $n]));
    flock($fp, LOCK_UN); fclose($fp);
}
$ticket = 'EU-' . $today . '-' . str_pad((string)$n, 3, '0', STR_PAD_LEFT);

/* --- маршрутизация по направлению --- */
$isIT = (stripos($dir, 'IT') !== false) || (stripos($dir, 'ПО') !== false) || (stripos($dir, 'лиценз') !== false);
$to   = $isIT ? $ITBOX : $SALES;

/* --- письмо --- */
$subj = "Заявка $ticket — " . ($dir !== '' ? $dir : 'EUROSFERA');
$body  = "Новая заявка с сайта EUROSFERA\n";
$body .= "Номер:       $ticket\n";
$body .= "Дата (UTC):  " . gmdate('Y-m-d H:i') . "\n";
$body .= "-----------------------------------------\n";
$body .= "Имя:         " . ($name    !== '' ? $name    : '—') . "\n";
$body .= "Контакт:     " . ($contact !== '' ? $contact : '—') . "\n";
$body .= "Направление: " . ($dir     !== '' ? $dir     : '—') . "\n";
$body .= "Сообщение:   " . ($message !== '' ? $message : '—') . "\n";
$body .= "Страница:    " . ($page    !== '' ? $page    : '—') . "\n";
$body .= "IP:          " . ($_SERVER['REMOTE_ADDR'] ?? '—') . "\n";

$headers  = "From: EUROSFERA <$OWNER>\r\n";
$headers .= "Cc: $OWNER\r\n";
if (filter_var($contact, FILTER_VALIDATE_EMAIL)) $headers .= "Reply-To: $contact\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: EUROSFERA-site\r\n";

$subjEnc = '=?UTF-8?B?' . base64_encode($subj) . '?=';
$ok = @mail($to, $subjEnc, $body, $headers, "-f$OWNER");

/* --- бэкап заявки в лог (защищён .htaccess) --- */
@file_put_contents(
    $dataDir . '/leads.log',
    gmdate('Y-m-d H:i') . "\t$ticket\t$to\t$name\t$contact\t$dir\t" . str_replace("\n", ' ', $message) . "\n",
    FILE_APPEND | LOCK_EX
);

echo json_encode(['success' => (bool)$ok, 'ticket' => $ticket]);
