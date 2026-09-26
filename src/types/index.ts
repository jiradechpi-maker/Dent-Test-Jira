export interface TeachingScheduleItem {
  id?: string;
  date: string;       // e.g. "พฤหัสบดีที่ ๑๗/๐๙/๖๙"
  time: string;       // e.g. "๐๙.๐๐ - ๑๒.๐๐ น."
  topic: string;      // e.g. "Lab Direct interim fabrication..."
  hours: string;      // e.g. "๓"
}

export interface LetterData {
  letter_no: string;      // e.g. "อว ๗๐๓๓ / ๓๑๑"
  runNo: number;          // e.g. 311
  issue_date: string;     // e.g. "๖ กันยายน ๒๕๖๙"
  datePickerValue?: string;
  lecturer: string;       // e.g. "ผู้ช่วยศาสตราจารย์ ดร.ทพญ.สุพาณี บูรณธรรม"
  course: string;         // e.g. "Fixed Prosthodontics"
  acadYear: string;       // e.g. "๒๕๖๙"
  stdYear: string;        // e.g. "ชั้นปีที่ ๔"
  coName: string;         // e.g. "นายจิรเดช พิชัย"
  coPhone: string;        // e.g. "096-859-0110"
  coMail: string;         // e.g. "jiradech.pi@kmitl.ac.th"
  tableMode: '3' | '4';   // 3 or 4 columns
  items: TeachingScheduleItem[];
}

export interface Lecturer {
  id: string;
  n: string;              // Name with title
  note?: string;          // Affiliation / department
  idCard?: string;        // ID Card No. for disbursement
  phone?: string;
  bankName?: string;      // For disbursement
  bankAccount?: string;   // For disbursement
}

export interface Course {
  id: string;
  n: string;              // Course title
  y?: string;             // Academic year
  s?: string;             // Student year
  code?: string;          // Course code
}

export interface DocumentHistoryItem {
  id: string;
  t: string;              // ISO timestamp
  no: string;
  lect: string;
  course: string;
  year: string;
  std: string;
  co: string;
  ph: string;
  mail: string;
  date: string;
  mode: '3' | '4';
  items: TeachingScheduleItem[];
}

export interface LetterDraft {
  id: string;
  title: string;
  savedAt: string;        // ISO timestamp
  letterNo: string;
  course: string;
  lecturer: string;
  data: LetterData;
}

export interface DisbursementData {
  lecturer: string;
  course: string;
  acadYear: string;
  stdYear: string;
  idCard: string;
  address: string;
  bankName: string;
  bankAccount: string;
  hourlyRate: number;      // e.g. 600 or 1000
  lectureHours: number;
  labHours: number;
  totalHours: number;
  totalAmount: number;
  totalAmountText: string;
  items: TeachingScheduleItem[];
  coName: string;
  deanName: string;
  deanPos: string;
  docDate: string;
}

export interface SystemStandard {
  fs: number;          // 10 pt (or 16 pt)
  lh: number;          // 1.15
  lsp: number;         // -0.2 px
  wsp: number;         // 0 px
  pgap: number;        // 0
  spBefore?: number;   // 12 pt
  spAfter?: number;    // 0 pt
  rIndent: number;     // 2.5 cm (พิกัดเลข 2 บนไม้บรรทัด MS Word)
  rTab: number;        // 1.5 cm
  rDate: number;       // 8.2 cm (พิกัด 8.2 cm บนไม้บรรทัด)
  rAddr: number;       // 8.5 cm (พิกัด 8.5 cm บนไม้บรรทัด)
  rAddrRight?: number; // -2.08 cm (ระยะร่นขวานิเสธ -2.08 cm)
  mT: number;          // 1.5 cm
  mB: number;          // 1.8 cm
  mL: number;          // 3.0 cm
  mR: number;          // 2.0 cm
  logoH: number;       // 3.0 cm
  logoPx?: number;     // 289 px
  bleed: number;       // 1.5 cm
  pageCenter: boolean;
  thaiNum: boolean;
  blankDay: boolean;

  // Granular section vertical offset controls (ปรับขึ้น-ลง แต่ละส่วนได้อิสระ)
  logoTopOffset?: number;     // pt (เลื่อนตำแหน่งตราสัญลักษณ์ สจล.)
  logoXOffset?: number;       // cm บนไม้บรรทัด (เริ่มต้นที่ 7.5 cm = กึ่งกลางหน้ากระดาษ 10.5 cm เส้นสีแดง)
  headerTopOffset?: number;   // pt (เลื่อนบรรทัด ที่ อว / ที่อยู่)
  dateTopOffset?: number;     // pt (เลื่อนบรรทัดวันที่)
  subjectTopOffset?: number;  // pt (เลื่อนบรรทัด เรื่อง/เรียน)
  paraSpacing?: number;       // pt (ระยะห่างก่อน/หลังแต่ละย่อหน้าเนื้อหา)
  signatureTopOffset?: number;// pt (ระยะห่างก่อนคำลงท้าย)
  signGapHeight?: number;     // cm (ความสูงช่องว่างเซ็นชื่อ)
  footerBottomOffset?: number;// pt (ระยะส่วนท้ายกระดาษ)

  // Word Typography & Paragraph Toolkit (ตัวจัดการอักขระ & ข้อความแบบ MS Word)
  alignMode?: 'thaiDistributed' | 'justify' | 'left'; // thai distributed vs justify vs left
  textJustify?: 'inter-cluster' | 'inter-word' | 'auto'; // thai cluster vs word
  lineBreakMode?: 'strict' | 'normal' | 'anywhere'; // การตัดบรรทัดภาษาไทย
  wordBreak?: 'break-word' | 'break-all' | 'keep-all'; // word break
  charScale?: number; // % (มาตราส่วนความกว้างตัวอักษร 80% - 120%, default 100%)
  charSpacingType?: 'normal' | 'expanded' | 'condensed'; // รูปแบบช่องไฟ (ปกติ / ขยาย / บีบ)
  charSpacingAmount?: number; // pt จำนวนการขยายหรือบีบ
  preventOrphanWords?: boolean; // ป้องกันคำสำคัญตกหล่นแยกบรรทัด

  // Individual Paragraph Spacing & Line Height (ระยะบรรทัดและช่องว่างแยกแต่ละย่อหน้า)
  p1Lh?: number; // ระยะระหว่างบรรทัด ย่อหน้าที่ ๑ (Line Height, default 1.15)
  p1Mb?: number; // ระยะเว้นท้ายย่อหน้าที่ ๑ (Space After, pt, default 12)
  p2Lh?: number; // ระยะระหว่างบรรทัด ย่อหน้าที่ ๒ (Line Height, default 1.15)
  p2Mb?: number; // ระยะเว้นท้ายย่อหน้าที่ ๒ (Space After, pt, default 12)
  p3Lh?: number; // ระยะระหว่างบรรทัด ย่อหน้าที่ ๓ (Line Height, default 1.15)
  p3Mb?: number; // ระยะเว้นท้ายย่อหน้าที่ ๓ (Space After, pt, default 12)
  p4Lh?: number; // ระยะระหว่างบรรทัด ย่อหน้าที่ ๔ (Line Height, default 1.15)
  p4Mb?: number; // ระยะเว้นท้ายย่อหน้าที่ ๔ (Space After, pt, default 12)
}
