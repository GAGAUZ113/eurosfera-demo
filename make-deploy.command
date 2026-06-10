#!/bin/bash
# EUROSFERA — собрать чистый архив для заливки на хостинг (без рабочих файлов).
cd "$(dirname "$0")" || exit 1
OUT="eurosfera-deploy.zip"
rm -f "$OUT"
zip -r "$OUT" \
  *.html *.css *.js sitemap.xml robots.txt \
  lib assets img analytics \
  -x "*.DS_Store" \
  -x "make-deploy.command" \
  >/dev/null
echo "Готово: $OUT ($(du -h "$OUT" | cut -f1))"
echo "Не вошли (рабочее): .git, HANDOFF.md, README.md, DEPLOY.md, *.zip, .playwright-mcp, screwfast-base"
