#!/usr/bin/env bash
# Full verification battery against a deployed og-image-generator instance.
# Usage: BASE_URL=https://your-service.up.railway.app bash scripts/verify.sh
#
# Checks: /health, /themes, every theme renders a REAL 1200x630 PNG (IHDR decode),
# Cache-Control header, LRU hit on repeat, long-title lineClamp, emoji battery,
# custom sizes, POST /og, remote-logo default-off, and the <=512MB RAM proof
# after 20 sequential renders.
set -uo pipefail
BASE="${BASE_URL:?Set BASE_URL=https://... }"
OUT="${OUT_DIR:-./verify-out}"
mkdir -p "$OUT"
pass=0; fail=0
ok()  { pass=$((pass+1)); echo "PASS  $1"; }
bad() { fail=$((fail+1)); echo "FAIL  $1"; }

png_dims() {
  node -e "const b=require('fs').readFileSync(process.argv[1]);if(b[0]!==0x89||b[1]!==0x50){process.exit(1)}process.stdout.write(b.readUInt32BE(16)+'x'+b.readUInt32BE(20))" "$1" 2>/dev/null
}

check_png() { # label file expectedW expectedH
  local d; d=$(png_dims "$2")
  if [ "$d" = "$3x$4" ]; then
    ok "$1 (${d}, $(( $(wc -c <"$2") / 1024 ))KB)"
  else
    bad "$1 expected ${3}x${4}, got ${d:-not-a-png}"
  fi
}

enc() { node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$1"; }

# --- 1. health ---
if h=$(curl -sf "$BASE/health"); then
  echo "$h" | grep -q '"status":"ok"' && ok "health 200: $h" || bad "health body: $h"
else
  bad "health not reachable"; exit 1
fi

# --- 2. themes list ---
if t=$(curl -sf "$BASE/themes"); then
  echo "$t" | grep -q 'gradient' && ok "/themes lists built-ins" || bad "/themes body: $t"
else
  bad "/themes not reachable"
fi

# --- 3. every theme renders a real 1200x630 PNG + Cache-Control ---
for theme in dark light gradient card; do
  f="$OUT/theme-$theme.png"; hd="$OUT/theme-$theme.headers"
  curl -sf -D "$hd" "$BASE/og?title=$(enc 'Deploy and Host your OG Image API on Railway')&subtitle=$(enc 'Satori + resvg — no headless Chrome')&theme=$theme" -o "$f" \
    && check_png "theme $theme" "$f" 1200 630 || bad "theme $theme render"
  grep -qi '^cache-control: public, max-age=86400' "$hd" \
    && ok "theme $theme Cache-Control" || bad "theme $theme Cache-Control: $(grep -i cache-control "$hd" | tr -d '\r')"
done

# --- 4. LRU cache: MISS then HIT (unique per run so warm caches don't false-fail) ---
cacheUrl="$BASE/og?title=$(enc "CacheCheck Rocket 🚀 $(date +%s)")&theme=gradient"
curl -sf -D - -o /dev/null "$cacheUrl" | grep -qi '^x-cache: miss' && ok "first render X-Cache: MISS" || bad "first render not MISS"
curl -sf -D - -o /dev/null "$cacheUrl" | grep -qi '^x-cache: hit'  && ok "repeat render X-Cache: HIT"  || bad "repeat render not HIT"

# --- 5. long title: ~262 chars must clamp, not break layout (280 is the cap) ---
longTitle=$(node -e 'process.stdout.write("Long title stress test. ".repeat(10) + "Overflow words that will never fit.")')
curl -sf "$BASE/og?title=$(enc "$longTitle")&theme=light" -o "$OUT/long-title.png" \
  && check_png "long title (lineClamp)" "$OUT/long-title.png" 1200 630 || bad "long title render"

# --- 6. emoji battery: plain, VS16, skin tone, ZWJ, flag ---
emojiTitle='Ship it 🚀 with ❤️ 👍🏽 and 👨‍👩‍👧 🇺🇸'
curl -sf "$BASE/og?title=$(enc "$emojiTitle")&theme=gradient" -o "$OUT/emoji.png" \
  && check_png "emoji battery" "$OUT/emoji.png" 1200 630 || bad "emoji render"

# --- 7. custom size ---
curl -sf "$BASE/og?title=$(enc 'Custom size card')&width=800&height=418" -o "$OUT/custom.png" \
  && check_png "custom size" "$OUT/custom.png" 800 418 || bad "custom size render"

# --- 8. POST /og ---
curl -sf -X POST "$BASE/og" -H 'content-type: application/json' \
  -d '{"title":"Posted via JSON","subtitle":"POST /og preset override works","theme":"card"}' \
  -o "$OUT/post.png" && check_png "POST /og" "$OUT/post.png" 1200 630 || bad "POST /og"

# --- 9. remote logo rejected while ALLOW_REMOTE_ASSETS is off (default) ---
logoCode=$(curl -s -o "$OUT/logo-rejected.json" -w '%{http_code}' "$BASE/og?title=$(enc 'Logo test')&logo=$(enc 'https://railway.com/favicon.ico')")
if [ "$logoCode" = "400" ]; then
  ok "remote logo rejected by default (HTTP 400): $(cat "$OUT/logo-rejected.json")"
else
  bad "remote logo expected HTTP 400, got $logoCode"
fi

# --- 10. RAM proof: 20 sequential full-size renders, then /health rss < 512MB ---
for i in 1 2 3 4 5; do
  for theme in dark light gradient card; do
    curl -sf "$BASE/og?title=$(enc "RAM proof render $i $theme")&subtitle=$(enc 'sequential load test')&theme=$theme" -o /dev/null || bad "render $i/$theme"
  done
done
if h2=$(curl -sf "$BASE/health"); then
  rss=$(node -e 'const j=JSON.parse(process.argv[1]);console.log(j.memory.rssMB)' "$h2")
  echo "health after 20 renders: $h2"
  if [ -n "$rss" ] && [ "$rss" -lt 512 ]; then
    ok "RAM proof: RSS ${rss}MB < 512MB after 20 sequential renders"
  else
    bad "RAM proof: RSS ${rss}MB >= 512MB"
  fi
else
  bad "health unreachable after load"
fi

echo
echo "RESULT: $pass passed, $fail failed"
[ "$fail" = "0" ]
