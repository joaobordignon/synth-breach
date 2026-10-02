#!/usr/bin/env bash
# Regenerate HEX's "Face in Code" source (public/hex-mask.png) from the
# AI-generated (Gemini) synthetic portrait assets/hex-source.jpg.
# The in-game sampler reads BRIGHT pixels as dense green glyphs on a dark
# field, so we crop to a square head-and-shoulders, grayscale, then NEGATE
# (dark features -> bright glyphs) and clip the light studio wall to black.
set -euo pipefail
convert assets/hex-source.jpg \
  -crop 1091x1091+455+0 +repage \
  -colorspace Gray \
  -resize 320x320 \
  -negate \
  -level 18%,100% \
  public/hex-mask.png
echo "Wrote public/hex-mask.png"
