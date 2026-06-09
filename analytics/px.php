<?php
/* =========================================================================
   EUROSFERA — трекинг-пиксель для СТАТИЧЕСКОГО сайта (.html).
   Вставь в <head> или конец <body> КАЖДОЙ страницы:
     <img src="/analytics/px.php" width="1" height="1" alt="" style="position:absolute;left:-9999px" referrerpolicy="no-referrer-when-downgrade">
   Браузер запросит пиксель → здесь запишется визит. Отдаём прозрачный 1×1 GIF.
   ========================================================================= */
require __DIR__ . '/_logger.php';
eurosfera_track_log();

header('Content-Type: image/gif');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
// прозрачный 1×1 GIF
echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
