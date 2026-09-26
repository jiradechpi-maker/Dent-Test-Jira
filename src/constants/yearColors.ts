/**
 * Dental School Student Year Themes & Color Palette
 * Faculty of Dentistry, King Mongkut's Institute of Technology Ladkrabang (KMITL)
 * 
 * Distinct Palette:
 * - Year 1: เขียวมินต์ (Clinical Teal / Mint #0D9488) - น้องใหม่ปรีคลินิก วิทยาศาสตร์พื้นฐาน
 * - Year 2: น้ำเงิน (Royal Blue #1D4ED8) - พรีคลินิก ๑ กายวิภาคศาสตร์จำลอง
 * - Year 3: ม่วง (Royal Violet / Plum #7C3AED) - พรีคลินิก ๒ หัตถการขั้นสูง (ปรับใหม่ ไม่ซ้ำ/ไม่กลืนกับชมพูปี 4)
 * - Year 4: ชมพูอ่อน (Soft Pastel Pink #F43F5E) - คลินิกผู้ป่วยจริง ๑
 * - Year 5: เทาอ่อน (Slate Grey #475569) - คลินิกผู้ป่วยจริง ๒ (ขั้นสูง)
 * - Year 6: ทองอำพัน (Senior Amber Gold #D97706) - ทันตแพทย์ฝึกหัด Extern (คณะเปิดได้ ๕ ปี กำลังเตรียมรับรุ่น ๑)
 */

export interface YearTheme {
  year: number;
  thaiLabel: string;        // "ชั้นปีที่ ๑"
  shortThai: string;        // "ปี ๑"
  engLabel: string;         // "1st Year (Freshman)"
  phaseName: string;        // "ปรีคลินิก & วิทยาศาสตร์พื้นฐาน"
  phaseShort: string;       // "Pre-Dent"
  curriculumStage: string;  // "วิทยาศาสตร์พื้นฐาน จุลชีววิทยา กายวิภาคศาสตร์ทั่วไป"
  isUpcoming?: boolean;     // สำหรับปี 6 ที่กำลังเตรียมเปิด
  upcomingNote?: string;
  totalCoursesCount: number;

  // Visual Tokens (Hex & Tailwind)
  colorCode: string;        // Primary Brand Hex
  softBgHex: string;        // Tinted container bg
  borderHex: string;        // Matching border
  badgeBg: string;          // Tailwind classes
  badgeText: string;
  badgeBorder: string;
  cardBg: string;
  cardBorderHover: string;
  accentBar: string;
  tabActive: string;
  tabInactiveHover: string;
  dotColor: string;
  tagLight: string;
  statBadge: string;
}

export const YEAR_THEMES: Record<number, YearTheme> = {
  1: {
    year: 1,
    thaiLabel: 'ชั้นปีที่ ๑',
    shortThai: 'ปี ๑',
    engLabel: '1st Year (Freshman)',
    phaseName: 'ปรีคลินิก & วิทยาศาสตร์การแพทย์',
    phaseShort: 'Pre-Dent',
    curriculumStage: 'วิทยาศาสตร์พื้นฐาน จุลชีววิทยา กายวิภาคศาสตร์ทั่วไป',
    isUpcoming: false,
    totalCoursesCount: 12,
    colorCode: '#0D9488', // Teal/Mint
    softBgHex: '#F0FDFA',
    borderHex: '#99F6E4',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
    cardBg: 'bg-gradient-to-br from-white to-emerald-50/40',
    cardBorderHover: 'hover:border-emerald-400 hover:shadow-emerald-100',
    accentBar: 'bg-emerald-500',
    tabActive: 'bg-emerald-700 text-white border-emerald-700 shadow-sm shadow-emerald-700/20',
    tabInactiveHover: 'hover:border-emerald-300 hover:bg-emerald-50/60',
    dotColor: 'bg-emerald-500',
    tagLight: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    statBadge: 'bg-emerald-100 text-emerald-900 border border-emerald-300'
  },
  2: {
    year: 2,
    thaiLabel: 'ชั้นปีที่ ๒',
    shortThai: 'ปี ๒',
    engLabel: '2nd Year (Pre-clinical I)',
    phaseName: 'พรีคลินิก ๑ & ทันตกรรมจำลอง',
    phaseShort: 'Pre-Clin I',
    curriculumStage: 'กายวิภาคศาสตร์ฟัน ชีวเคมีช่องปาก พยาธิวิทยาจำลอง',
    isUpcoming: false,
    totalCoursesCount: 12,
    colorCode: '#1D4ED8', // Royal Blue
    softBgHex: '#EFF6FF',
    borderHex: '#BFDBFE',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-300',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-300',
    cardBg: 'bg-gradient-to-br from-white to-blue-50/40',
    cardBorderHover: 'hover:border-blue-400 hover:shadow-blue-100',
    accentBar: 'bg-blue-600',
    tabActive: 'bg-blue-700 text-white border-blue-700 shadow-sm shadow-blue-700/20',
    tabInactiveHover: 'hover:border-blue-300 hover:bg-blue-50/60',
    dotColor: 'bg-blue-600',
    tagLight: 'bg-blue-50 text-blue-800 border border-blue-200',
    statBadge: 'bg-blue-100 text-blue-900 border border-blue-300'
  },
  3: {
    year: 3,
    thaiLabel: 'ชั้นปีที่ ๓',
    shortThai: 'ปี ๓',
    engLabel: '3rd Year (Pre-clinical II)',
    phaseName: 'พรีคลินิก ๒ & หัตถการขั้นสูง',
    phaseShort: 'Pre-Clin II',
    curriculumStage: 'หัตถการทันตกรรม ทันตกรรมประดิษฐ์จำลอง เอนโดดอนต์จำลอง',
    isUpcoming: false,
    totalCoursesCount: 13,
    colorCode: '#7C3AED', // Royal Violet / Plum (ชัดเจนมาก ไม่กลืนกับชมพูปี 4)
    softBgHex: '#F5F3FF',
    borderHex: '#DDD6FE',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-300',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-300',
    cardBg: 'bg-gradient-to-br from-white to-purple-50/40',
    cardBorderHover: 'hover:border-purple-400 hover:shadow-purple-100',
    accentBar: 'bg-purple-600',
    tabActive: 'bg-purple-700 text-white border-purple-700 shadow-sm shadow-purple-700/20',
    tabInactiveHover: 'hover:border-purple-300 hover:bg-purple-50/60',
    dotColor: 'bg-purple-600',
    tagLight: 'bg-purple-50 text-purple-800 border border-purple-200',
    statBadge: 'bg-purple-100 text-purple-900 border border-purple-300'
  },
  4: {
    year: 4,
    thaiLabel: 'ชั้นปีที่ ๔',
    shortThai: 'ปี ๔',
    engLabel: '4th Year (Clinical I)',
    phaseName: 'คลินิกผู้ป่วยจริง ๑',
    phaseShort: 'Clinic I',
    curriculumStage: 'ตรวจรักษาผู้ป่วยจริง คลินิกทันตกรรมรวม ประดิษฐ์ฟันเทียมถอดได้',
    isUpcoming: false,
    totalCoursesCount: 12,
    colorCode: '#DC2626', // แดงสดใส ชัดเจน แตกต่างจากปี 3 โดยสิ้นเชิง ไม่กลืนกัน
    softBgHex: '#FEF2F2',
    borderHex: '#FECACA',
    badgeBg: 'bg-red-50 text-red-800 border-red-300',
    badgeText: 'text-red-800',
    badgeBorder: 'border-red-300',
    cardBg: 'bg-gradient-to-br from-white to-red-50/40',
    cardBorderHover: 'hover:border-red-400 hover:shadow-red-100',
    accentBar: 'bg-red-600',
    tabActive: 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-600/20',
    tabInactiveHover: 'hover:border-red-300 hover:bg-red-50/60',
    dotColor: 'bg-red-600',
    tagLight: 'bg-red-50 text-red-800 border border-red-200',
    statBadge: 'bg-red-100 text-red-900 border border-red-300'
  },
  5: {
    year: 5,
    thaiLabel: 'ชั้นปีที่ ๕',
    shortThai: 'ปี ๕',
    engLabel: '5th Year (Clinical II)',
    phaseName: 'คลินิกผู้ป่วยจริง ๒ (ขั้นสูง)',
    phaseShort: 'Clinic II',
    curriculumStage: 'ศัลยศาสตร์ช่องปากขั้นสูง ทันตกรรมเด็ก จัดฟัน ผู้ป่วยโรคทางระบบ',
    isUpcoming: false,
    totalCoursesCount: 11,
    colorCode: '#475569', // Slate Grey
    softBgHex: '#F8FAFC',
    borderHex: '#CBD5E1',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300',
    cardBg: 'bg-gradient-to-br from-white to-slate-50',
    cardBorderHover: 'hover:border-slate-400 hover:shadow-slate-100',
    accentBar: 'bg-slate-500',
    tabActive: 'bg-slate-700 text-white border-slate-700 shadow-sm shadow-slate-700/20',
    tabInactiveHover: 'hover:border-slate-300 hover:bg-slate-100/60',
    dotColor: 'bg-slate-500',
    tagLight: 'bg-slate-100 text-slate-800 border border-slate-300',
    statBadge: 'bg-slate-200 text-slate-900 border border-slate-300'
  },
  6: {
    year: 6,
    thaiLabel: 'ชั้นปีที่ ๖',
    shortThai: 'ปี ๖',
    engLabel: '6th Year (Senior Extern)',
    phaseName: 'ทันตแพทย์ฝึกหัด (Extern)',
    phaseShort: 'Externship',
    curriculumStage: 'หมุนเวียนปฏิบัติงาน รพ.ศูนย์ ชุมชน บริหารงานคลินิก เตรียมใบประกอบวิชาชีพ',
    isUpcoming: true,
    upcomingNote: 'คณะเปิดสอน ๕ ปี ขณะนี้กำลังเตรียมเปิดรับนักศึกษารุ่นที่ ๑ ก้าวสู่ปี ๖',
    totalCoursesCount: 10,
    colorCode: '#D97706', // Amber Gold
    softBgHex: '#FFFBEB',
    borderHex: '#FDE68A',
    badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    cardBg: 'bg-gradient-to-br from-white to-amber-50/40',
    cardBorderHover: 'hover:border-amber-400 hover:shadow-amber-100',
    accentBar: 'bg-amber-500',
    tabActive: 'bg-amber-700 text-white border-amber-700 shadow-sm shadow-amber-700/20',
    tabInactiveHover: 'hover:border-amber-300 hover:bg-amber-50/60',
    dotColor: 'bg-amber-500',
    tagLight: 'bg-amber-50 text-amber-900 border border-amber-300',
    statBadge: 'bg-amber-100 text-amber-950 border border-amber-300'
  }
};

/**
 * Array list of year themes 1 to 6
 */
export const YEAR_THEMES_LIST: YearTheme[] = [
  YEAR_THEMES[1],
  YEAR_THEMES[2],
  YEAR_THEMES[3],
  YEAR_THEMES[4],
  YEAR_THEMES[5],
  YEAR_THEMES[6]
];

/**
 * Helper to get YearTheme by number or thai label string
 */
export function getYearTheme(yearInput: number | string | undefined): YearTheme {
  if (typeof yearInput === 'number' && YEAR_THEMES[yearInput]) {
    return YEAR_THEMES[yearInput];
  }

  if (typeof yearInput === 'string') {
    const clean = yearInput.trim();
    if (clean.includes('๑') || clean.includes('1')) return YEAR_THEMES[1];
    if (clean.includes('๒') || clean.includes('2')) return YEAR_THEMES[2];
    if (clean.includes('๓') || clean.includes('3')) return YEAR_THEMES[3];
    if (clean.includes('๔') || clean.includes('4')) return YEAR_THEMES[4];
    if (clean.includes('๕') || clean.includes('5')) return YEAR_THEMES[5];
    if (clean.includes('๖') || clean.includes('6')) return YEAR_THEMES[6];
  }

  // Default fallback to Year 4 (Clinical)
  return YEAR_THEMES[4];
}
