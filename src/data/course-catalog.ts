/**
 * Official course catalogue — Faculty of Dentistry, KMITL
 * Doctor of Dental Surgery (International Program), academic year 2569.
 * Imported from the previous Dent Letter System (legacy/dent-letter-vite).
 *
 * The per-course rows are data (names, credits, instructor nicknames, Thai year/semester labels) and stay as
 * imported; screens render year and semester from `year` / `semester` in the viewer's language.
 */

import type { Bi } from "@/lib/i18n/locale";

export interface CourseCatalogItem {
  code: string;
  name: string;
  credit: string;
  instructor: string;
  year: number; // 1 - 6
  stdYearThai: string;
  stdYearEng: string;
  semester: "1" | "2" | "year";
  semesterLabel: string;
  category?: "core" | "clinic" | "elective" | "ge";
  note?: string;
  specialLecturers?: string[];
}

export const COURSES_DATA: CourseCatalogItem[] = [
  // ===================== YEAR 1 (ชั้นปีที่ 1) =====================
  // ภาคเรียนที่ 1
  {
    code: '20626101',
    name: 'Integrated Chemistry for Dental Sciences',
    credit: '4 (3-3-7)',
    instructor: 'อ.ปู๋',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20626104',
    name: 'General Microbiology for Dental Science',
    credit: '3 (2-3-5)',
    instructor: 'อ.ปู๋',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636101',
    name: 'Dental Anatomy',
    credit: '2 (1-3-3)',
    instructor: 'อ.หมวย',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636102',
    name: 'Dental Professional Roles and Ethics',
    credit: '1 (1-0-2)',
    instructor: 'Lect. Stephi / อ.นันต์',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '96642999',
    name: 'Charm School (GE)',
    credit: '3 (3-0-6)',
    instructor: 'GE',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'ge'
  },
  {
    code: '96644029',
    name: 'English for Health Professions (GE)',
    credit: '3 (2-2-5)',
    instructor: 'อ.หญิง',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'ge'
  },
  {
    code: '9664xxxx',
    name: 'Design Thinking (GE Requirement)',
    credit: '3 (3-0-6)',
    instructor: 'GE',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'ge'
  },
  {
    code: '9664xxxx',
    name: 'Innovation Unboxed (GE Requirement)',
    credit: '3 (3-0-6)',
    instructor: 'GE',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'ge'
  },

  // ภาคเรียนที่ 2
  {
    code: '20626102',
    name: 'Fundamental of Material Science',
    credit: '2 (2-0-4)',
    instructor: 'อ.ปู๋',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20626103',
    name: 'Integrated Physics for Dental Sciences',
    credit: '3 (2-3-5)',
    instructor: 'อ.ปู๋',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20626107',
    name: 'Molecular Biology',
    credit: '2 (1-2-3)',
    instructor: 'อ.หญิง',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20626108',
    name: 'Cell Physiology',
    credit: '2 (1-2-3)',
    instructor: 'อ.หญิง',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20606002',
    name: 'Cell and Tissue Culture in Dental Science (Elective)',
    credit: '1 (0-3-3)',
    instructor: 'อ.ก้อง',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'elective'
  },
  {
    code: '96641007',
    name: 'DIGITAL CITIZEN (GE)',
    credit: '3 (3-0-6)',
    instructor: 'GE',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'ge'
  },
  {
    code: '96642211',
    name: 'CODING WITH PYTHON',
    credit: '3 (3-0-6)',
    instructor: '42 Bangkok',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'ge'
  },
  {
    code: '96642013',
    name: 'Integrated Thinking (GE Requirement)',
    credit: '3 (3-0-6)',
    instructor: 'GE',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'ge'
  },
  {
    code: '96642165',
    name: 'Health Promotion, Human Relationship and Communication',
    credit: '2 (2-0-4)',
    instructor: 'GE',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'ge'
  },
  {
    code: '96641004',
    name: 'TEAM-PROJECT 1 (GE Requirement)',
    credit: '1 (0-2-1)',
    instructor: 'อ.เปิ้ล',
    year: 1,
    stdYearThai: 'ชั้นปีที่ ๑',
    stdYearEng: '1st Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'ge'
  },

  // ===================== YEAR 2 (ชั้นปีที่ 2) =====================
  // ภาคเรียนที่ 1
  {
    code: '20626210',
    name: 'Clinical Anatomy in Dentistry',
    credit: '3 (2-4-3)',
    instructor: 'อ.ก้อง',
    year: 2,
    stdYearThai: 'ชั้นปีที่ ๒',
    stdYearEng: '2nd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20626211',
    name: 'Genetics and Developmental Biology',
    credit: '4 (3-3-6)',
    instructor: 'อ.หญิง',
    year: 2,
    stdYearThai: 'ชั้นปีที่ ๒',
    stdYearEng: '2nd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20626212',
    name: 'Kinesiology of Human Body',
    credit: '2 (1-2-3)',
    instructor: 'อ.มูนา',
    year: 2,
    stdYearThai: 'ชั้นปีที่ ๒',
    stdYearEng: '2nd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20626213',
    name: 'Basic Cardiovascular System and Homeostasis',
    credit: '4 (2-4-6)',
    instructor: 'อ.มูนา',
    year: 2,
    stdYearThai: 'ชั้นปีที่ ๒',
    stdYearEng: '2nd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20626214',
    name: 'Respiratory and Excretory System',
    credit: '4 (2-4-6)',
    instructor: 'อ.มูนา',
    year: 2,
    stdYearThai: 'ชั้นปีที่ ๒',
    stdYearEng: '2nd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20626215',
    name: 'Digestive System and Nutrient Function',
    credit: '4 (2-4-6)',
    instructor: 'อ.มูนา',
    year: 2,
    stdYearThai: 'ชั้นปีที่ ๒',
    stdYearEng: '2nd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636201',
    name: 'Oral Biology and Histology I',
    credit: '1 (1-0-2)',
    instructor: 'อ.วิจิตรา',
    year: 2,
    stdYearThai: 'ชั้นปีที่ ๒',
    stdYearEng: '2nd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },

  // ภาคเรียนที่ 2
  {
    code: '20626216',
    name: 'Medical Immunology',
    credit: '4 (2-4-6)',
    instructor: 'อ.ปู๋',
    year: 2,
    stdYearThai: 'ชั้นปีที่ ๒',
    stdYearEng: '2nd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20626217',
    name: 'Cellular Pathophysiology and Pharmacotherapeutics',
    credit: '3 (2-4-3)',
    instructor: 'อ.ปู๋',
    year: 2,
    stdYearThai: 'ชั้นปีที่ ๒',
    stdYearEng: '2nd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20626218',
    name: 'Neuroanatomy',
    credit: '4 (3-3-7)',
    instructor: 'อ.มูนา',
    year: 2,
    stdYearThai: 'ชั้นปีที่ ๒',
    stdYearEng: '2nd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636202',
    name: 'Oral Biology and Histology II',
    credit: '2 (1-3-3)',
    instructor: 'อ.วิจิตรา',
    year: 2,
    stdYearThai: 'ชั้นปีที่ ๒',
    stdYearEng: '2nd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636203',
    name: 'Oral Microbiome and Immunology in Dentistry I',
    credit: '1 (1-0-2)',
    instructor: 'อ.ปู๋',
    year: 2,
    stdYearThai: 'ชั้นปีที่ ๒',
    stdYearEng: '2nd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636205',
    name: 'Research Methodology and Biostatistics',
    credit: '4 (3-3-6)',
    instructor: 'อ.ปู๋',
    year: 2,
    stdYearThai: 'ชั้นปีที่ ๒',
    stdYearEng: '2nd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20606003',
    name: 'Nanotechnology for Precision Medicine (Elective)',
    credit: '1 (1-0-2)',
    instructor: 'อ.ปู๋',
    year: 2,
    stdYearThai: 'ชั้นปีที่ ๒',
    stdYearEng: '2nd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'elective'
  },
  {
    code: '96643004',
    name: 'Positive Power Leader (GE)',
    credit: '3 (3-0-6)',
    instructor: 'GE',
    year: 2,
    stdYearThai: 'ชั้นปีที่ ๒',
    stdYearEng: '2nd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'ge'
  },

  // ===================== YEAR 3 (ชั้นปีที่ 3) =====================
  // ภาคเรียนที่ 1
  {
    code: '20636321',
    name: 'Integrated Oral Pathology and Oral Medicine I',
    credit: '2 (2-0-4)',
    instructor: 'อ.วิจิตรา / อ.นภภาพ',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636302',
    name: 'Cariology and Management',
    credit: '3 (2-3-5)',
    instructor: 'อ.หมวย / อ.นู้ / อ.อารยา',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636303',
    name: 'Preventive Dentistry',
    credit: '2 (2-0-4)',
    instructor: 'อ.อารยา / อ.ณิชาปา',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636306',
    name: 'Oral Microbiome and Immunology in Dentistry II',
    credit: '2 (1-2-3)',
    instructor: 'อ.ปู๋',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636307',
    name: 'Dental Occlusion',
    credit: '3 (2-3-5)',
    instructor: 'อ.บิ๊ก',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636309',
    name: 'Dental Biomaterials',
    credit: '3 (2-3-5)',
    instructor: 'อ.หมวย / อ.ภัสสร',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636313',
    name: 'Removable Prosthodontics I: Partial Denture',
    credit: '3 (2-3-5)',
    instructor: 'อ.หน่อย',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636318',
    name: 'Intra-and Extra-Oral Radiology and Imaging I',
    credit: '1 (1-0-2)',
    instructor: 'อ.สุนทรา',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636405',
    name: 'Development of Craniofacial Complex',
    credit: '1 (1-0-2)',
    instructor: 'อ.เปิ้ล',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636421',
    name: 'Ergonomic and Clinic Management I',
    credit: '1 (1-0-2)',
    instructor: 'อ.หมวย',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },

  // ภาคเรียนที่ 2
  {
    code: '20636310',
    name: 'Pharmacology and Therapeutics in Dentistry',
    credit: '2 (2-0-4)',
    instructor: 'อ.หมวย',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636322',
    name: 'Integrated Oral Pathology and Oral Medicine II',
    credit: '3 (2-3-5)',
    instructor: 'อ.วิจิตรา / อ.นภภาพ',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636317',
    name: 'Periodontal Disease I',
    credit: '2 (2-0-4)',
    instructor: 'อ.วิไลรัตน์ / อ.นภภาพ',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636308',
    name: 'Operative Dentistry',
    credit: '4 (2-6-7)',
    instructor: 'อ.หมวย',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636311',
    name: 'Pain and Anxiety Control',
    credit: '1 (1-0-2)',
    instructor: 'อ.บุญจิรา',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636312',
    name: 'Oral and Maxillofacial Surgery I',
    credit: '2 (2-0-4)',
    instructor: 'อ.บุญจิรา',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636314',
    name: 'Removable Prosthodontics II: Complete Denture',
    credit: '3 (2-3-5)',
    instructor: 'อ.หน่อย',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636315',
    name: 'Patient Examination, Diagnosis, and Treatment Plan',
    credit: '2 (2-0-4)',
    instructor: 'อ.ตูน',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20606005',
    name: 'Preparation for Clinical Practice',
    credit: '1 (1-0-2)',
    instructor: 'อ.เปิ้ล',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636320',
    name: 'Intra-and Extra-Oral Radiology and Imaging II',
    credit: '2 (1-3-3)',
    instructor: 'อ.สุนทรา',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  // วิชารายปี (Year 3)
  {
    code: '20636319',
    name: 'Research/Innovation Project I',
    credit: '1 (0-3-2)',
    instructor: 'อ.ปู๋',
    year: 3,
    stdYearThai: 'ชั้นปีที่ ๓',
    stdYearEng: '3rd Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Year Course)',
    category: 'core'
  },

  // ===================== YEAR 4 (ชั้นปีที่ 4) =====================
  // ภาคเรียนที่ 1
  {
    code: '20636402',
    name: 'Fixed Prosthodontics',
    credit: '3 (2-3-5)',
    instructor: 'ผศ.ดร.ทพญ.สุพาณี บูรณธรรม / อ.กาญจนา',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core',
    specialLecturers: ['ผศ.ดร.ทพญ.สุพาณี บูรณธรรม', 'อ.กาญจนา']
  },
  {
    code: '20636404',
    name: 'Pediatric Dentistry',
    credit: '3 (2-3-5)',
    instructor: 'อ.อารยา',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636411',
    name: 'Endodontics I',
    credit: '2 (1-3-3)',
    instructor: 'อ.ปาริชาติ',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636415',
    name: 'Temporomandibular (TMD) and Orofacial Pain Management',
    credit: '3 (2-3-5)',
    instructor: 'อ.ลลิตา',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636418',
    name: 'Dental Management of Medically Compromised Patients and Special Needs',
    credit: '2 (2-0-4)',
    instructor: 'อ.บุญจิรา',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636420',
    name: 'Orthodontics I',
    credit: '2 (1-3-3)',
    instructor: 'อ.เปิ้ล',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '2060xxxx',
    name: 'Electives',
    credit: '1 (1-0-2)',
    instructor: 'อ.วิจิตรา',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'elective'
  },

  // ภาคเรียนที่ 2
  {
    code: '20636403',
    name: 'Periodontal Disease II',
    credit: '2 (2-0-4)',
    instructor: 'อ.วิไลรัตน์',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636408',
    name: 'Comprehensive Care and Communication',
    credit: '2 (2-0-4)',
    instructor: 'อ.ตูน',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636412',
    name: 'Endodontics II',
    credit: '2 (1-3-3)',
    instructor: 'อ.ปาริชาติ / อาจารย์พิเศษ',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core',
    specialLecturers: [
      'อาจารย์ ทพญ. อรชร ทองบุราณ',
      'อาจารย์ ทพ. อารยะ พันธ์วิเชียร',
      'อาจารย์ ทพ. พัฐรวี สดงาม',
      'อาจารย์ ทพญ. กันตพร บุณยานันต์',
      'อาจารย์ ทพญ. ศรัณยา จงประสิทธิ์พร'
    ]
  },
  {
    code: '20636413',
    name: 'Dental Traumatology',
    credit: '1 (1-0-2)',
    instructor: 'อ.บุญจิรา',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636416',
    name: 'Oral and Maxillofacial Surgery II',
    credit: '2 (2-0-4)',
    instructor: 'อ.บุญจิรา',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636417',
    name: 'Geriatric Dentistry',
    credit: '1 (1-0-2)',
    instructor: 'อ.ลลิตา',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636419',
    name: 'Dental Public Health and Epidemiology',
    credit: '2 (2-0-4)',
    instructor: 'อ.มัณฑนา',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636422',
    name: 'Laboratory Periodontal Disease',
    credit: '1 (0-3-1)',
    instructor: 'อ.ว่าน',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636423',
    name: 'Orthodontics II',
    credit: '1 (1-0-2)',
    instructor: 'อ.เปิ้ล',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20646401',
    name: 'Oral and Maxillofacial Surgery Clinic I',
    credit: '1 (0-3-0)',
    instructor: 'อ.เปิ้ล',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'clinic'
  },
  {
    code: '20646402',
    name: 'Diagnosis and Treatment Planning Clinic I',
    credit: '1 (0-3-0)',
    instructor: 'อ.ตูน',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'clinic'
  },
  {
    code: '20646403',
    name: 'Oral and Maxillofacial Radiology Clinic I',
    credit: '1 (0-3-0)',
    instructor: 'อ.สุนทรา',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'clinic'
  },
  {
    code: '20646404',
    name: 'Restorative Dentistry Clinic I',
    credit: '1 (0-3-0)',
    instructor: 'อ.หมวย',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'clinic'
  },
  {
    code: '20646405',
    name: 'Periodontic Clinic I',
    credit: '1 (0-3-0)',
    instructor: 'อ.ว่าน',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'clinic'
  },
  // วิชารายปี (Year 4)
  {
    code: '20636401',
    name: 'Research/Innovation Project II',
    credit: '2 (0-6-3)',
    instructor: 'อ.ปู๋',
    year: 4,
    stdYearThai: 'ชั้นปีที่ ๔',
    stdYearEng: '4th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Year Course)',
    category: 'core'
  },

  // ===================== YEAR 5 (ชั้นปีที่ 5) =====================
  // ภาคเรียนที่ 1
  {
    code: '20636410',
    name: 'Biostatistics Application to Medical Research',
    credit: '1 (1-0-2)',
    instructor: 'อ.ปู๋',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636407',
    name: 'Laws for Dental Student and Forensics',
    credit: '1 (1-0-2)',
    instructor: 'อ.อารยา',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636502',
    name: 'Comprehensive Dental Care Seminar I',
    credit: '1 (1-0-2)',
    instructor: 'อ.ว่าน',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636503',
    name: 'Emergency Care in Dental Practice',
    credit: '1 (1-0-2)',
    instructor: 'อ.บุญจิรา',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636504',
    name: 'Community and Family Dentistry',
    credit: '2 (2-0-4)',
    instructor: 'อ.มัณฑนา',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },

  // ภาคเรียนที่ 2
  {
    code: '20636414',
    name: 'Implant Dentistry',
    credit: '2 (1-2-3)',
    instructor: 'อ.กาญจนา',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636506',
    name: 'Comprehensive Dental Care Seminar II',
    credit: '1 (1-0-2)',
    instructor: 'อ.ฝ้าย',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '90xxxxxx',
    name: 'General Education (GE)',
    credit: '3 (3-0-6)',
    instructor: 'GE',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'ge'
  },

  // วิชารายปี (Year 5 - Clinic)
  {
    code: '20636507',
    name: 'International Learning Experience',
    credit: '1 (0-3-0)',
    instructor: 'อ.หญิง',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Year Course)',
    category: 'core'
  },
  {
    code: '20646501',
    name: 'Oral and Maxillofacial Surgery Clinic II',
    credit: '2 (0-6-0)',
    instructor: 'อ.เปิ้ล',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Clinic)',
    category: 'clinic'
  },
  {
    code: '20646502',
    name: 'Pediatric Dentistry Clinic I',
    credit: '2 (0-6-0)',
    instructor: 'อ.อารยา',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Clinic)',
    category: 'clinic'
  },
  {
    code: '20646503',
    name: 'Orthodontic Clinic I',
    credit: '1 (0-3-0)',
    instructor: 'อ.เปิ้ล',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Clinic)',
    category: 'clinic'
  },
  {
    code: '20646504',
    name: 'Diagnosis and Treatment Planning Clinic II',
    credit: '1 (0-3-0)',
    instructor: 'อ.ตูน',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Clinic)',
    category: 'clinic'
  },
  {
    code: '20646505',
    name: 'Emergency Clinic I',
    credit: '1 (0-3-0)',
    instructor: 'อ.บุญจิรา',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Clinic)',
    category: 'clinic'
  },
  {
    code: '20646506',
    name: 'Oral and Maxillofacial Radiology Clinic II',
    credit: '1 (0-3-0)',
    instructor: 'อ.สุนทรา',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Clinic)',
    category: 'clinic'
  },
  {
    code: '20646507',
    name: 'Restorative Dentistry Clinic II',
    credit: '2 (0-6-0)',
    instructor: 'อ.หมวย',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Clinic)',
    category: 'clinic'
  },
  {
    code: '20646508',
    name: 'Periodontic Clinic II',
    credit: '2 (0-6-0)',
    instructor: 'อ.ว่าน',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Clinic)',
    category: 'clinic'
  },
  {
    code: '20646509',
    name: 'Endodontic Clinic I',
    credit: '2 (0-6-0)',
    instructor: 'อ.ปาริชาติ',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Clinic)',
    category: 'clinic'
  },
  {
    code: '20646510',
    name: 'Prosthodontic Clinic I',
    credit: '4 (0-12-0)',
    instructor: 'อ.หน่อย',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Clinic)',
    category: 'clinic'
  },
  {
    code: '20636508',
    name: 'Research/Innovation Project III',
    credit: '1 (0-3-1)',
    instructor: 'อ.ปู๋',
    year: 5,
    stdYearThai: 'ชั้นปีที่ ๕',
    stdYearEng: '5th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Year Course)',
    category: 'core'
  },

  // ===================== YEAR 6 (ชั้นปีที่ 6) =====================
  // ภาคเรียนที่ 1
  {
    code: '20636501',
    name: 'Advanced Restoratives and Esthetic Dentistry',
    credit: '1 (1-0-2)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636505',
    name: 'Advanced Technology in Dentistry',
    credit: '1 (1-0-2)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636601',
    name: 'Comprehensive Care Seminar III',
    credit: '1 (1-0-2)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '20636602',
    name: 'Hospital Dentistry',
    credit: '1 (1-0-2)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'core'
  },
  {
    code: '90xxxxxx',
    name: 'General Education (GE)',
    credit: '3 (3-0-6)',
    instructor: 'GE',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: '1',
    semesterLabel: 'ภาคเรียนที่ ๑',
    category: 'ge'
  },

  // ภาคเรียนที่ 2
  {
    code: '20636603',
    name: 'Community Dentistry',
    credit: '2 (0-6-0)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636604',
    name: 'Comprehensive Care Seminar IV',
    credit: '1 (1-0-2)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },
  {
    code: '20636605',
    name: 'Ergonomic and Clinic Management II',
    credit: '1 (0-3-1)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: '2',
    semesterLabel: 'ภาคเรียนที่ ๒',
    category: 'core'
  },

  // วิชารายปี (Year 6 - Advanced Clinic)
  {
    code: '20646511',
    name: 'Temporomandibular Disorder and Pain Clinic',
    credit: '1 (0-3-0)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Advanced Clinic)',
    category: 'clinic'
  },
  {
    code: '20646601',
    name: 'Oral and Maxillofacial Surgery Clinic III',
    credit: '2 (0-6-0)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Advanced Clinic)',
    category: 'clinic'
  },
  {
    code: '20646602',
    name: 'Pediatric Dentistry Clinic II',
    credit: '2 (0-6-0)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Advanced Clinic)',
    category: 'clinic'
  },
  {
    code: '20646603',
    name: 'Orthodontic Clinic II',
    credit: '1 (0-3-0)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Advanced Clinic)',
    category: 'clinic'
  },
  {
    code: '20646604',
    name: 'Diagnosis and Treatment Planning Clinic III',
    credit: '1 (0-3-0)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Advanced Clinic)',
    category: 'clinic'
  },
  {
    code: '20646605',
    name: 'Emergency Clinic II',
    credit: '1 (0-3-0)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Advanced Clinic)',
    category: 'clinic'
  },
  {
    code: '20646606',
    name: 'Restorative Dentistry Clinic III',
    credit: '2 (0-6-0)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Advanced Clinic)',
    category: 'clinic'
  },
  {
    code: '20646607',
    name: 'Periodontic Clinic III',
    credit: '2 (0-6-0)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Advanced Clinic)',
    category: 'clinic'
  },
  {
    code: '20646608',
    name: 'Endodontic Clinic II',
    credit: '2 (0-6-0)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Advanced Clinic)',
    category: 'clinic'
  },
  {
    code: '20646609',
    name: 'Prosthodontic Clinic II',
    credit: '3 (0-9-0)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Advanced Clinic)',
    category: 'clinic'
  },
  {
    code: '20646610',
    name: 'Advanced Clinical Practice',
    credit: '1 (0-3-0)',
    instructor: 'คณะทันตแพทยศาสตร์',
    year: 6,
    stdYearThai: 'ชั้นปีที่ ๖',
    stdYearEng: '6th Year',
    semester: 'year',
    semesterLabel: 'วิชารายปี (Advanced Clinic)',
    category: 'clinic'
  }
];

export type CatalogSemester = CourseCatalogItem["semester"];

export const SEMESTER_TABS: { value: CatalogSemester; label: Bi; short: Bi }[] = [
  { value: "1", label: { th: "ภาคเรียนที่ 1", en: "Semester 1" }, short: { th: "ภาค 1", en: "Sem 1" } },
  { value: "2", label: { th: "ภาคเรียนที่ 2", en: "Semester 2" }, short: { th: "ภาค 2", en: "Sem 2" } },
  { value: "year", label: { th: "ตลอดปี / คลินิก", en: "Full year / clinical" }, short: { th: "ตลอดปี", en: "Full year" } },
];

export const CATEGORY_LABEL: Record<NonNullable<CourseCatalogItem["category"]>, Bi> = {
  core: { th: "วิชาบังคับ", en: "Core" },
  clinic: { th: "คลินิก", en: "Clinical" },
  elective: { th: "วิชาเลือก", en: "Elective" },
  ge: { th: "ศึกษาทั่วไป", en: "General education" },
};

export const CATALOG_YEARS = [1, 2, 3, 4, 5, 6] as const;

export function coursesFor(year: number, semester?: CatalogSemester): CourseCatalogItem[] {
  return COURSES_DATA.filter((c) => c.year === year && (semester === undefined || c.semester === semester));
}

/** Code or any part of the name, across every year. */
export function searchCourses(query: string): CourseCatalogItem[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return COURSES_DATA.filter((c) => {
    const haystack = `${c.code} ${c.name}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}

/** Unique course names, sorted — for autocomplete. */
export const COURSE_NAMES: string[] = Array.from(new Set(COURSES_DATA.map((c) => c.name))).sort((a, b) => a.localeCompare(b));

export function findCourseByName(name: string): CourseCatalogItem | undefined {
  const key = name.trim().toLowerCase();
  return COURSES_DATA.find((c) => c.name.toLowerCase() === key);
}
