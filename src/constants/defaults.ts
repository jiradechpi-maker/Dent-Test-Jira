import { LetterData, Lecturer, Course, SystemStandard } from '../types';

export const OFFICIAL_INFO = {
  addr1: 'สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง',
  addr2: 'เลขที่ ๑ ซอยฉลองกรุง ๑ เขตลาดกระบัง กรุงเทพฯ ๑๐๕๒๐',
  dean: '(รองศาสตราจารย์ ดร.ทันตแพทย์หญิงอารยา พงษ์หาญยุทธ)',
  deanPos: 'คณบดีคณะทันตแพทยศาสตร์',
  foot1: 'คณะทันตแพทยศาสตร์ ส่วนสนับสนุนวิชาการ',
  foot2: 'โทรศัพท์ ๐ ๒๓๒๙ ๘๐๐๐ ต่อ ๒๑๘๙',
  boldProgram: 'หลักสูตรทันตแพทยศาสตรบัณฑิต (หลักสูตรนานาชาติ) ใช้การเรียนการสอนเป็นภาษาอังกฤษ',
  runPrefix: 'อว ๗๐๓๓ /',
  facultyFull: 'คณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง',
};

export const DEFAULT_STD: SystemStandard = {
  fs: 16, // มาตรฐานสารบรรณหนังสือราชการไทย TH Sarabun PSK 16pt
  lh: 1.15,
  lsp: -0.2,
  wsp: 0,
  pgap: 0,
  spBefore: 12,
  spAfter: 0,
  rIndent: 2.5,   // 2.5 cm (พิกัดเลข 2 บนไม้บรรทัด MS Word)
  rTab: 1.5,
  rDate: 8.2,     // 8.2 cm บนไม้บรรทัด MS Word
  rAddr: 8.5,     // 8.5 cm บนไม้บรรทัด MS Word
  rAddrRight: -2.08, // -2.08 cm Right Indent ยื่นเกินขอบขวา
  mT: 1.5,
  mB: 1.8,
  mL: 3.0,
  mR: 2.0,
  logoH: 3.0,
  logoPx: 113, // มาตรฐาน 3.0 cm (96 DPI: 3.0 / 2.54 * 96 = 113.4px)
  bleed: 1.5,
  pageCenter: true,
  thaiNum: true,
  blankDay: true,
  logoTopOffset: 0,
  logoXOffset: 7.5, // 7.5 cm บนไม้บรรทัด = กึ่งกลางหน้ากระดาษ 10.5 cm เส้นสีแดงพอดี
  headerTopOffset: 12,
  dateTopOffset: 12,
  subjectTopOffset: 12,
  paraSpacing: 12,
  signatureTopOffset: 18,
  signGapHeight: 1.6,
  footerBottomOffset: 24,
  alignMode: 'thaiDistributed',
  textJustify: 'inter-cluster',
  lineBreakMode: 'strict',
  wordBreak: 'break-word',
  charScale: 100,
  charSpacingType: 'condensed',
  charSpacingAmount: -0.2,
  preventOrphanWords: true,
  p1Lh: 1.15,
  p1Mb: 12,
  p2Lh: 1.15,
  p2Mb: 12,
  p3Lh: 1.15,
  p3Mb: 12,
  p4Lh: 1.15,
  p4Mb: 12,
};

export const DEFAULT_LETTER_DATA: LetterData = {
  letter_no: 'อว ๗๐๓๓ /',
  runNo: 312,
  issue_date: '      กันยายน ๒๕๖๙',
  lecturer: 'อาจารย์ ทพญ. อรชร ทองบุราณ',
  course: 'Endodontics II',
  acadYear: '๒๕๖๙',
  stdYear: 'ชั้นปีที่ ๔',
  coName: 'นายจิรเดช พิชัย',
  coPhone: '๐๙๖-๘๕๙๐-๑๑๐',
  coMail: 'jiradech.pi@kmitl.ac.th',
  tableMode: '3',
  items: [
    {
      id: 'row-1',
      date: 'พฤหัสบดีที่ ๑๗/๐๙/๖๙',
      time: '๐๙.๐๐ - ๑๒.๐๐ น.',
      topic: 'Endodontic diagnostic procedures and treatment planning',
      hours: '๓'
    },
    {
      id: 'row-2',
      date: 'ศุกร์ที่ ๑๘/๐๙/๖๙',
      time: '๑๓.๐๐ - ๑๖.๐๐ น.',
      topic: 'Rotary instrumentation & advanced root canal obturation',
      hours: '๓'
    }
  ]
};

export const INITIAL_LECTURERS: Lecturer[] = [
  {
    id: 'lec-0',
    n: 'อาจารย์ ทพญ. อรชร ทองบุราณ',
    note: 'อาจารย์พิเศษ รายวิชา Endodontics II',
    phone: '081-999-8888',
    bankName: 'ธนาคารกรุงไทย',
    bankAccount: '085-0-88888-8'
  },
  {
    id: 'lec-1',
    n: 'ผู้ช่วยศาสตราจารย์ ดร.ทพญ.สุพาณี บูรณธรรม',
    note: 'ภาควิชาทันตกรรมประดิษฐ์',
    phone: '081-442-1234',
    bankName: 'ธนาคารกรุงไทย',
    bankAccount: '085-0-12345-6'
  },
  {
    id: 'lec-2',
    n: 'รองศาสตราจารย์ ทพ.สมชาย ใจดี',
    note: 'ภาควิชาวิทยาเอ็นโดดอนต์',
    phone: '089-123-4567',
    bankName: 'ธนาคารไทยพาณิชย์',
    bankAccount: '162-2-98765-4'
  },
  {
    id: 'lec-3',
    n: 'อาจารย์ ทพญ.ณัฐธิดา ศิริโรจน์',
    note: 'ภาควิชาทันตกรรมหัตถการ',
    phone: '086-778-9900',
    bankName: 'ธนาคารกสิกรไทย',
    bankAccount: '738-2-34567-8'
  },
  {
    id: 'lec-4',
    n: 'ผู้ช่วยศาสตราจารย์ ทพ.ดร.กิตติพงษ์ วงศ์วิวัฒน์',
    note: 'ภาควิชาศัลยศาสตร์ช่องปากและแม็กซิลโลเฟเชียล',
    phone: '084-555-1212',
    bankName: 'ธนาคารกรุงเทพ',
    bankAccount: '014-7-65432-1'
  }
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'crs-1',
    n: 'Fixed Prosthodontics',
    y: '๒๕๖๙',
    s: 'ชั้นปีที่ ๔',
    code: 'DENT 411'
  },
  {
    id: 'crs-2',
    n: 'Endodontics II',
    y: '๒๕๖๙',
    s: 'ชั้นปีที่ ๕',
    code: 'DENT 512'
  },
  {
    id: 'crs-3',
    n: 'Operative Dentistry & Esthetic Procedures',
    y: '๒๕๖๙',
    s: 'ชั้นปีที่ ๓',
    code: 'DENT 321'
  },
  {
    id: 'crs-4',
    n: 'Oral and Maxillofacial Surgery Clinical Practice',
    y: '๒๕๖๙',
    s: 'ชั้นปีที่ ๕',
    code: 'DENT 531'
  }
];

/**
 * High-definition KMITL Dental Official Seal as vector SVG embedded data URL.
 * Features King Mongkut's royal crown emblem, radiance rays, dental caduceus laurel motif,
 * and text: KING MONGKUT'S INSTITUTE OF TECHNOLOGY LADKRABANG - FACULTY OF DENTISTRY.
 */
export const DEFAULT_KMITL_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <radialGradient id="kmitlGold" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#FFEB80"/>
      <stop offset="50%" stop-color="#E5A910"/>
      <stop offset="100%" stop-color="#9C6B00"/>
    </radialGradient>
    <linearGradient id="kmitlPurple" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6B00AD"/>
      <stop offset="100%" stop-color="#360057"/>
    </linearGradient>
  </defs>
  
  <!-- Outer Ring -->
  <circle cx="200" cy="200" r="190" fill="url(#kmitlPurple)" stroke="#E5A910" stroke-width="6"/>
  <circle cx="200" cy="200" r="176" fill="none" stroke="#E5A910" stroke-width="2" stroke-dasharray="4,4"/>
  <circle cx="200" cy="200" r="144" fill="#FFFFFF" stroke="#E5A910" stroke-width="4"/>
  
  <!-- Rays of Wisdom -->
  <g stroke="#E5A910" stroke-width="2.5" opacity="0.85">
    <line x1="200" y1="60" x2="200" y2="40"/>
    <line x1="240" y1="70" x2="255" y2="52"/>
    <line x1="160" y1="70" x2="145" y2="52"/>
    <line x1="275" y1="95" x2="295" y2="82"/>
    <line x1="125" y1="95" x2="105" y2="82"/>
    <line x1="300" y1="135" x2="320" y2="128"/>
    <line x1="100" y1="135" x2="80" y2="128"/>
  </g>

  <!-- Crown (Phra Maha Phichai Mongkut) stylized crest -->
  <path d="M200,68 L206,94 L224,96 L210,110 L216,134 L200,122 L184,134 L190,110 L176,96 L194,94 Z" fill="url(#kmitlGold)" stroke="#7A5200" stroke-width="1.5"/>
  <path d="M165,138 Q200,126 235,138 L242,185 Q200,172 158,185 Z" fill="url(#kmitlGold)" stroke="#7A5200" stroke-width="2"/>
  <circle cx="200" cy="155" r="9" fill="#9C0028" stroke="#E5A910" stroke-width="1.5"/>
  <path d="M152,186 Q200,174 248,186 L252,216 Q200,202 148,216 Z" fill="url(#kmitlPurple)" stroke="#E5A910" stroke-width="2"/>
  
  <!-- Tooth / Medical Caduceus Motif -->
  <path d="M175,225 C165,225 156,234 156,248 C156,275 182,310 192,328 C196,334 204,334 208,328 C218,310 244,275 244,248 C244,234 235,225 225,225 C215,225 207,232 200,240 C193,232 185,225 175,225 Z" fill="#FFFFFF" stroke="#6B00AD" stroke-width="3.5"/>
  <path d="M185,250 C185,268 200,290 200,290 C200,290 215,268 215,250 C215,242 208,238 200,244 C192,238 185,242 185,250 Z" fill="#F1E3FA" stroke="#6B00AD" stroke-width="1.5"/>

  <!-- Inscription around ring -->
  <path id="textArcTop" d="M 52,200 A 148,148 0 0,1 348,200" fill="none"/>
  <path id="textArcBottom" d="M 348,200 A 148,148 0 0,1 52,200" fill="none"/>
  
  <text fill="#FFFFFF" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" letter-spacing="1">
    <textPath href="#textArcTop" startOffset="50%" text-anchor="middle">
      คณะทันตแพทยศาสตร์ · สจล.
    </textPath>
  </text>
  <text fill="#E5A910" font-family="'Sarabun', sans-serif" font-size="9.5" font-weight="600" letter-spacing="0.5">
    <textPath href="#textArcBottom" startOffset="50%" text-anchor="middle">
      FACULTY OF DENTISTRY · KMITL
    </textPath>
  </text>
</svg>
`)}`;
