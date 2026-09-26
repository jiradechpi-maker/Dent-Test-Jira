import * as XLSX from 'xlsx';
import { LetterData, TeachingScheduleItem } from '../types';
import { toThaiDigits, dateForPrint } from './thaiFormatter';

export const EXCEL_COLUMNS = [
  'key',
  'letter_no',
  'issue_date',
  'lecturer',
  'course',
  'academic_year',
  'student_year',
  'coordinator',
  'phone',
  'email',
  'sched_date',
  'sched_time',
  'topic',
  'hours'
];

/**
 * Generates and downloads the official Excel template (.xlsx)
 */
export function downloadExcelTemplate() {
  const aoa = [
    EXCEL_COLUMNS,
    [
      'L001',
      'อว ๗๐๓๓ / ๓๑๑',
      '๖ กันยายน ๒๕๖๙',
      'ผู้ช่วยศาสตราจารย์ ดร.ทพญ.สุพาณี บูรณธรรม',
      'Fixed Prosthodontics',
      '๒๕๖๙',
      'ชั้นปีที่ ๔',
      'นายจิรเดช พิชัย',
      '096-859-0110',
      'jiradech.pi@kmitl.ac.th',
      'พฤหัสบดีที่ ๑๗/๐๙/๖๙',
      '๐๙.๐๐ - ๑๒.๐๐ น.',
      'Lab Direct interim fabrication using a vacuum thermoplastic sheet',
      '๓'
    ],
    [
      'L001',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'ศุกร์ที่ ๑๘/๐๙/๖๙',
      '๑๓.๐๐ - ๑๖.๐๐ น.',
      'Provisional restoration: clinical procedures & resin composite techniques',
      '๓'
    ],
    [
      'L002',
      'อว ๗๐๓๓ / ๓๑๒',
      '๖ กันยายน ๒๕๖๙',
      'รองศาสตราจารย์ ทพ.สมชาย ใจดี',
      'Endodontics II',
      '๒๕๖๙',
      'ชั้นปีที่ ๕',
      'นายจิรเดช พิชัย',
      '096-859-0110',
      'jiradech.pi@kmitl.ac.th',
      'จันทร์ที่ ๒๑/๐๙/๖๙',
      '๐๙.๐๐ - ๑๒.๐๐ น.',
      'Rotary instrumentation techniques in curved root canals',
      '๓'
    ]
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, 'letters');
  XLSX.writeFile(wb, 'template_หนังสือเชิญอาจารย์พิเศษ_สจล.xlsx');
}

/**
 * Parses uploaded Excel file buffer into an array of LetterData
 */
export function parseExcelBatch(fileBuffer: ArrayBuffer, thaiNum = true): LetterData[] {
  const wb = XLSX.read(new Uint8Array(fileBuffer), { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws, { defval: '' });

  const map: Record<string, LetterData> = {};
  const order: string[] = [];
  let lastKey = '';

  rows.forEach((r, idx) => {
    const rawKey = String(r['key'] || '').trim();
    const key = rawKey || lastKey || `ITEM_${idx}`;
    lastKey = key;

    if (!map[key]) {
      order.push(key);
      map[key] = {
        letter_no: '',
        runNo: 0,
        issue_date: '',
        lecturer: '',
        course: '',
        acadYear: '',
        stdYear: '',
        coName: 'นายจิรเดช พิชัย',
        coPhone: '096-859-0110',
        coMail: 'jiradech.pi@kmitl.ac.th',
        tableMode: '3',
        items: []
      };
    }

    const item = map[key];

    if (r['letter_no']) item.letter_no = String(r['letter_no']).trim();
    if (r['issue_date']) item.issue_date = String(r['issue_date']).trim();
    if (r['lecturer']) item.lecturer = String(r['lecturer']).trim();
    if (r['course']) item.course = String(r['course']).trim();
    if (r['academic_year']) item.acadYear = String(r['academic_year']).trim();
    if (r['student_year']) item.stdYear = String(r['student_year']).trim();
    if (r['coordinator']) item.coName = String(r['coordinator']).trim();
    if (r['phone']) item.coPhone = String(r['phone']).trim();
    if (r['email']) item.coMail = String(r['email']).trim();

    const topic = String(r['topic'] || '').trim();
    const schedDate = String(r['sched_date'] || '').trim();
    const schedTime = String(r['sched_time'] || '').trim();
    const hours = String(r['hours'] || '').trim();

    if (topic || schedDate || schedTime) {
      item.items.push({
        id: `sched-${key}-${item.items.length}`,
        date: thaiNum ? toThaiDigits(schedDate) : schedDate,
        time: thaiNum ? toThaiDigits(schedTime) : schedTime,
        topic: topic,
        hours: thaiNum ? toThaiDigits(hours) : hours
      });
    }
  });

  return order.map((k) => {
    const d = map[k];
    const hasTime = d.items.some((i) => !!i.time);
    d.tableMode = hasTime ? '4' : '3';
    if (thaiNum) {
      d.letter_no = toThaiDigits(d.letter_no);
      d.acadYear = toThaiDigits(d.acadYear);
      d.stdYear = toThaiDigits(d.stdYear);
      d.issue_date = dateForPrint(toThaiDigits(d.issue_date), true);
    }
    return d;
  });
}
