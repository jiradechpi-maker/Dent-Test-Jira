# Dentboard app icons

Three icon concepts. Each folder has the full set:

| File | Use |
|---|---|
| `icon.svg` | Main icon (scales to any size) |
| `icon-small.svg` | Simplified version for 16–48 px |
| `favicon.ico` | 16/32/48 px browser tab icon |
| `apple-icon.png` / `.svg` | 180 px iPhone home screen icon (square, iOS rounds the corners) |
| `icon-192.png`, `icon-512.png` | Android / PWA / social / documents |

`preview.png` compares all three at real sizes.

**Live:** `check` (copied into `src/app/icon.svg`, `src/app/favicon.ico`, `src/app/apple-icon.png`; referenced by `src/app/manifest.ts`).
The sidebar / top-bar logo draws the same tooth and check inline in `src/components/brand/dentboard-mark.tsx`.

**Switch to another concept** (e.g. `orbit`):

```bash
cp public/brand/icons/orbit/icon.svg public/brand/icons/orbit/favicon.ico public/brand/icons/orbit/apple-icon.png src/app/
sed -i 's#/icons/check/#/icons/orbit/#g' src/app/manifest.ts
```

Then redraw the in-app logo in `src/components/brand/dentboard-mark.tsx` with the new concept's shapes (from `scripts/icons/concepts.mjs`).

**Regenerate after editing shapes/colors** in `scripts/icons/concepts.mjs`:

```bash
node scripts/icons/build.mjs public/brand/icons   # needs ImageMagick and `npm i --no-save playwright`
```
