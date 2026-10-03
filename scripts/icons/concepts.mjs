// Canonical tooth in a 100x120 box
const TOOTH = 'M0 34C0 10 16 0 30 1C40 2 44 8 50 8C56 8 60 2 70 1C84 0 100 10 100 34C100 56 92 68 88 82C84 98 84 118 72 119C60 120 60 98 55 90C53 86 47 86 45 90C40 98 40 120 28 119C16 118 16 98 12 82C8 68 0 56 0 34Z';
const svg = (body, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>\n`;
const tooth = (x, y, s, attrs) => `<path transform="translate(${x} ${y}) scale(${s})" d="${TOOTH}" ${attrs}/>`;
const grad = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;

// ---------- A: Orbit — tooth with a gold orbit ring (international) ----------
function orbit({ small = false, square = false } = {}) {
  const rx = square ? 0 : small ? 104 : 116;
  const s = small ? 2.6 : 2.15, w = 100 * s, h = 120 * s;
  const x = 256 - w / 2, y = 256 - h / 2 + (small ? 0 : 4);
  const ringW = small ? 34 : 22, gap = small ? 20 : 14;
  const RX = small ? 222 : 194, RY = small ? 66 : 56;
  const ring = `transform="translate(256 ${small ? 250 : 246}) rotate(-14)"`;
  const bg = small ? '#4F0080' : 'url(#bg)';
  return svg(
    `<rect width="512" height="512" rx="${rx}" fill="${bg}"/>
  <ellipse ${ring} rx="${RX}" ry="${RY}" fill="none" stroke="#F5D27A" stroke-width="${ringW}" opacity="${small ? 1 : 0.9}"/>
  ${tooth(x, y, s, 'fill="#FFFFFF"')}
  <g clip-path="url(#tc)"><path ${ring} d="M-${RX} 0A${RX} ${RY} 0 0 0 ${RX} 0" fill="none" stroke="${small ? bg : '#5A0D94'}" stroke-width="${ringW + gap * 2}"/></g>
  <path ${ring} d="M-${RX} 0A${RX} ${RY} 0 0 0 ${RX} 0" fill="none" stroke="#F5D27A" stroke-width="${ringW}" stroke-linecap="round"/>`,
    `<clipPath id="tc">${tooth(x, y, s, '')}</clipPath>` + (small ? '' : grad('bg', '#6A1BB0', '#4F0080')));
}

// ---------- B: Tiles — tooth assembled from 4 dashboard tiles ----------
function tiles({ small = false, square = false } = {}) {
  const rx = square ? 0 : small ? 104 : 116;
  const s = small ? 3.3 : 2.7, w = 100 * s, h = 120 * s;
  const x = 256 - w / 2, y = 256 - h / 2;
  const g = small ? 7 : 5; // gap in tooth units
  const bg = '#F3E8FF';
  const cut = `stroke="${bg}" stroke-width="${g}" stroke-linecap="round"`;
  const T = (fill, clip) => `<g clip-path="url(#${clip})"><path transform="translate(${x} ${y}) scale(${s})" d="${TOOTH}" fill="${fill}"/></g>`;
  const defs = `
    <clipPath id="tl"><rect x="0" y="0" width="${x + 50 * s}" height="${y + 52 * s}"/></clipPath>
    <clipPath id="tr"><rect x="${x + 50 * s}" y="0" width="512" height="${y + 52 * s}"/></clipPath>
    <clipPath id="bl"><rect x="0" y="${y + 52 * s}" width="${x + 50 * s}" height="512"/></clipPath>
    <clipPath id="br"><rect x="${x + 50 * s}" y="${y + 52 * s}" width="512" height="512"/></clipPath>`;
  return svg(
    `<rect width="512" height="512" rx="${rx}" fill="${bg}"/>
  ${T('#7C3AED', 'tl')}${T(small ? '#4F0080' : '#F5B83D', 'tr')}${T('#5B21B6', 'bl')}${T('#4F0080', 'br')}
  <g transform="translate(${x} ${y}) scale(${s})">
    <line x1="-4" y1="52" x2="104" y2="52" ${cut}/>
    <line x1="50" y1="-4" x2="50" y2="124" ${cut}/>
  </g>`, defs);
}

// ---------- C: Check — the tooth IS the icon (like Apple's apple), check = ops done ----------
function check({ small = false, square = false } = {}) {
  const s = square ? 2.6 : small ? 3.9 : 3.6, w = 100 * s, h = 120 * s;
  const x = 256 - w / 2, y = 256 - h / 2;
  const sw = small ? 15 : 11;
  const bgRect = square ? `<rect width="512" height="512" fill="#FFFFFF"/>` : '';
  return svg(
    `${bgRect}
  <g transform="translate(${x} ${y}) scale(${s})">
    <path d="${TOOTH}" fill="url(#tg)" stroke="#FFFFFF" stroke-width="${square ? 0 : small ? 5 : 3}" stroke-linejoin="round" paint-order="stroke"/>
    <path d="M30 40L45 54L72 26" fill="none" stroke="#FFFFFF" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`,
    `<linearGradient id="tg" x1="0" y1="0" x2="100" y2="120" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8B3FE0"/><stop offset="1" stop-color="#4F0080"/></linearGradient>`);
}

const concepts = {
  orbit: { name: 'Orbit', fn: orbit },
  tiles: { name: 'Tiles', fn: tiles },
  check: { name: 'Check', fn: check },
};
export default concepts;
