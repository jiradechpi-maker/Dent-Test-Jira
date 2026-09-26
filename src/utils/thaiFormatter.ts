const THAI_DIGITS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
const ARABIC_DIGITS: { [key: string]: string } = {
  '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
  '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9'
};

const TH_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export function toThaiDigits(s: string | number | null | undefined): string {
  if (s == null) return '';
  return String(s).replace(/[0-9]/g, (d) => THAI_DIGITS[+d] || d);
}

export function toArabicDigits(s: string | number | null | undefined): string {
  if (s == null) return '';
  return String(s).replace(/[๐-๙]/g, (d) => ARABIC_DIGITS[d] || d);
}

export function formatThaiDate(iso: string, useThaiNum = true): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = TH_MONTHS[d.getMonth()];
  const year = d.getFullYear() + 543;
  if (useThaiNum) {
    return `${toThaiDigits(day)} ${month} ${toThaiDigits(year)}`;
  }
  return `${day} ${month} ${year}`;
}

export function dateForPrint(s: string, blank = true): string {
  const str = String(s || '').trim();
  if (!blank) return str;
  // If blankDay is true, keep spaces for day filling if day is blank or leave leading space
  const NBSP = '\u00A0';
  const withoutDay = str.replace(/^[0-9๐-๙\s]*/, '');
  return `${NBSP}${NBSP}${NBSP}${NBSP}${NBSP}${NBSP}${withoutDay || str}`;
}

/**
 * Converts numeric amount to Thai words with "บาทถ้วน"
 * e.g. 3600 -> "สามพันหกร้อยบาทถ้วน"
 * e.g. 15450 -> "หนึ่งหมื่นห้าพันสี่ร้อยห้าสิบบาทถ้วน"
 */
export function thaiBahtText(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return 'ศูนย์บาทถ้วน';
  if (num === 0) return 'ศูนย์บาทถ้วน';

  const numbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function readGroup(nStr: string): string {
    let result = '';
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(nStr.charAt(i), 10);
      const pos = len - i - 1;
      if (digit !== 0) {
        if (pos === 0 && digit === 1 && len > 1 && nStr.charAt(len - 2) !== '0') {
          result += 'เอ็ด';
        } else if (pos === 1 && digit === 1) {
          result += '';
        } else if (pos === 1 && digit === 2) {
          result += 'ยี่';
        } else {
          result += numbers[digit];
        }
        result += units[pos];
      }
    }
    return result;
  }

  const parts = Math.abs(num).toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  let bahtStr = '';
  // Support up to millions and billions
  if (integerPart.length > 6) {
    const millionPart = integerPart.slice(0, integerPart.length - 6);
    const lowerPart = integerPart.slice(integerPart.length - 6);
    bahtStr = readGroup(millionPart) + 'ล้าน' + readGroup(lowerPart);
  } else {
    bahtStr = readGroup(integerPart);
  }

  if (!bahtStr) bahtStr = 'ศูนย์';
  bahtStr += 'บาท';

  if (decimalPart === '00') {
    bahtStr += 'ถ้วน';
  } else {
    let satangStr = readGroup(decimalPart);
    bahtStr += satangStr + 'สตางค์';
  }

  if (num < 0) {
    bahtStr = 'ลบ' + bahtStr;
  }

  return bahtStr;
}
