"""
The TH Sarabun New files from the `font-th-sarabun-new` npm package were exported by a
webfont generator with "x-height matching", which enlarged every glyph ~1.41x.
This rescales them back so LibreOffice/Gotenberg lays text out like MS Word does
(calibrated against line breaks of the same letter rendered in MS Word).

    python3 scripts/fix-sarabun-scale.py docker/gotenberg/fonts/*.ttf
"""
import sys
from fontTools.ttLib import TTFont

SCALE = 0.709  # real TH Sarabun New width / webfont width (fits all line breaks of the MS Word reference)

for path in sys.argv[1:]:
    font = TTFont(path)
    head = font["head"]
    if head.unitsPerEm != 2048:
        print(f"skip {path}: already rescaled (unitsPerEm={head.unitsPerEm})")
        continue
    # Raising unitsPerEm shrinks every outline and metric uniformly — no glyph data touched.
    head.unitsPerEm = round(2048 / SCALE)
    font.save(path)
    print(f"rescaled {path}: unitsPerEm 2048 -> {head.unitsPerEm}")
