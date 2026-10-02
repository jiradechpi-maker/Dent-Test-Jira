/**
 * Builds templates/invitation-letter.docx — the docxtemplater template for
 * "หนังสือเชิญอาจารย์พิเศษ" (special-lecturer invitation letter).
 *
 * Wording is copied verbatim from the faculty's original Word letter; only the
 * variable parts are replaced by {tags}. Layout follows KMITL rules:
 *   • KMITL emblem (not the Garuda), centred, 3 cm
 *   • TH SarabunPSK 16 pt throughout
 *   • A4, margins top 1.5 / bottom 1.8 / left 3.0 / right 2.0 cm
 *   • Letterhead locked in a borderless 2-column table so it never drifts in MS Word
 *
 * Run with: npm run template:invitation
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  LineRuleType,
  Packer,
  Paragraph,
  Tab,
  Table,
  TableBorders,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  UnderlineType,
  VerticalAlignTable,
  WidthType,
  type IParagraphOptions,
  type IRunOptions,
} from "docx";

const ROOT = join(__dirname, "..");
const OUT_FILE = join(ROOT, "templates", "invitation-letter.docx");
const EMBLEM = readFileSync(join(ROOT, "templates", "assets", "kmitl-emblem.jpeg"));

const FONT = "TH SarabunPSK";
const SIZE = 32; // half-points → 16 pt
const TITLE_SIZE = 40; // 20 pt — attachment title, as in the original

const cm = (value: number): number => Math.round((value * 1440) / 2.54);

const PAGE = { width: 11906, height: 16838 };
const MARGIN = { top: cm(1.5), bottom: cm(1.8), left: cm(3.0), right: cm(2.0) };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right; // 16 cm
const ADDRESS_COLUMN = cm(6.5); // where the right-hand letterhead block starts
/**
 * The address block may run 1 cm into the right margin (the original letter used a −2.08 cm right indent)
 * so each address line — institution name, then street address — stays on ONE line.
 */
const LETTERHEAD_WIDTH = CONTENT_WIDTH + cm(1.0);
const DATE_INDENT = cm(8.0);
const BODY_FIRST_LINE = 1440; // 2.54 cm, as in the original letter
/**
 * Exact line pitch (twips). Locking it makes MS Word and LibreOffice/Gotenberg break pages identically,
 * whichever TH Sarabun build is installed (TH SarabunPSK and TH Sarabun New report different line heights).
 */
const LINE_PITCH = 380; // 19 pt

type RunOpts = Omit<IRunOptions, "font">;

function run(text: string, options: RunOpts = {}): TextRun {
  return new TextRun({
    text,
    font: { ascii: FONT, hAnsi: FONT, cs: FONT, eastAsia: FONT },
    language: { value: "en-US", bidirectional: "th-TH" },
    ...options,
    size: options.size ?? SIZE,
    sizeComplexScript: options.sizeComplexScript ?? options.size ?? SIZE,
    ...(options.bold ? { boldComplexScript: true } : {}),
  });
}

function bold(text: string, extra: RunOpts = {}): TextRun {
  return run(text, { bold: true, ...extra });
}

function para(children: (TextRun | ImageRun)[], options: Omit<IParagraphOptions, "children"> = {}): Paragraph {
  const { spacing, ...rest } = options;
  return new Paragraph({
    ...rest,
    spacing: { before: 0, after: 0, line: LINE_PITCH, lineRule: LineRuleType.EXACT, ...spacing },
    children,
  });
}

/** A paragraph that only holds a docxtemplater loop/condition tag; it disappears from the output. */
function tagOnly(tag: string): Paragraph {
  return para([run(tag)]);
}

function blank(): Paragraph {
  return para([run("")]);
}

const NO_BORDERS = TableBorders.NONE;

// ── Page 1 — the letter ────────────────────────────────────────────────────

const emblem = para(
  [
    new ImageRun({
      type: "jpg",
      data: EMBLEM,
      transformation: { width: 113, height: 113 }, // 3.0 cm at 96 dpi
      altText: { name: "KMITL emblem", title: "ตราสัญลักษณ์ สจล.", description: "ตราสัญลักษณ์สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง" },
    }),
  ],
  { alignment: AlignmentType.CENTER, spacing: { line: 240, lineRule: LineRuleType.AUTO, after: 120 } },
);

const zeroCellMargins = { top: 0, bottom: 0, left: 0, right: 0 };

const letterhead = new Table({
  width: { size: LETTERHEAD_WIDTH, type: WidthType.DXA },
  columnWidths: [ADDRESS_COLUMN, LETTERHEAD_WIDTH - ADDRESS_COLUMN],
  layout: TableLayoutType.FIXED,
  borders: NO_BORDERS,
  rows: [
    new TableRow({
      children: [
        new TableCell({
          width: { size: ADDRESS_COLUMN, type: WidthType.DXA },
          margins: zeroCellMargins,
          borders: NO_BORDERS,
          children: [para([run("ที่ {documentPrefix} / {letterNo}")])],
        }),
        new TableCell({
          width: { size: LETTERHEAD_WIDTH - ADDRESS_COLUMN, type: WidthType.DXA },
          margins: zeroCellMargins,
          borders: NO_BORDERS,
          children: [tagOnly("{#letterheadLines}"), para([run("{text}")]), tagOnly("{/letterheadLines}")],
        }),
      ],
    }),
  ],
});

const issueDate = para([run("{issueDate}")], {
  indent: { left: DATE_INDENT },
  spacing: { before: 120, after: 120 },
});

const hanging = { left: 720, hanging: 720 };

const subject = para([run("เรื่อง"), run("", { children: [new Tab()] }), run("ขอเรียนเชิญเป็นอาจารย์พิเศษ รายวิชา {courseName}")], {
  indent: hanging,
  alignment: AlignmentType.THAI_DISTRIBUTE,
  spacing: { before: 120, after: 0 },
});

const salutation = para([run("เรียน"), run("", { children: [new Tab()] }), run("{lecturerName}")], {
  indent: hanging,
  alignment: AlignmentType.THAI_DISTRIBUTE,
  spacing: { before: 120, after: 120 },
});

const bodyOptions: Omit<IParagraphOptions, "children"> = {
  indent: { firstLine: BODY_FIRST_LINE },
  alignment: AlignmentType.THAI_DISTRIBUTE,
  spacing: { before: 0, after: 120 },
};

const body1 = para(
  [
    run(
      "ด้วยคณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง ได้ดำเนินการจัดการเรียนการสอนในรายวิชา {courseName} ",
    ),
    bold("หลักสูตรทันตแพทยศาสตรบัณฑิต (หลักสูตรนานาชาติ) ใช้การเรียนการสอนเป็นภาษาอังกฤษ"),
    run(
      " ภาคการศึกษาที่ {semester} ปีการศึกษา {academicYear} ให้กับนักศึกษาระดับปริญญาตรีชั้นปีที่ {studentYear} ณ {venue} คณะทันตแพทยศาสตร์ นั้น",
    ),
  ],
  bodyOptions,
);

const body2 = para(
  [
    run(
      "ในการนี้ คณะทันตแพทยศาสตร์ ขอเรียนเชิญท่านเป็นอาจารย์พิเศษในรายวิชา {courseName} ซึ่งท่านเป็นผู้มีความรู้ ความสามารถ และมีประสบการณ์สูง โดยรายละเอียดปรากฏดังเอกสารที่แนบมาพร้อมนี้",
    ),
  ],
  bodyOptions,
);

const body3 = para(
  [
    run(
      "ทั้งนี้ คณะทันตแพทยศาสตร์ ขอมอบหมายให้ {coordinatorShort} เป็นผู้ประสานงาน เบอร์โทรศัพท์ {coordinatorPhone} E-mail address: {coordinatorEmail}",
    ),
  ],
  bodyOptions,
);

const body4 = para([run("คณะทันตแพทยศาสตร์ หวังว่าจะได้รับความอนุเคราะห์จากท่าน และขอขอบพระคุณมา ณ โอกาสนี้")], bodyOptions);

// Signature block — kept together so it can never be split across pages.
const signatureKeep: Omit<IParagraphOptions, "children"> = {
  alignment: AlignmentType.CENTER,
  keepNext: true,
  keepLines: true,
};

const closing = para([run("ขอแสดงความนับถือ")], { ...signatureKeep, spacing: { before: 240, after: 0 } });
const signatureSpace = [0, 1].map(() => para([run("")], signatureKeep));
const signerName = para([run("{signerName}")], { ...signatureKeep, spacing: { before: 120, after: 0 } });
const signerPosition = para([run("{signerPosition}")], { alignment: AlignmentType.CENTER, keepLines: true });

const firstPageFooter = new Footer({
  children: [para([run("{footerUnit}")]), para([run("{footerPhone}")])],
});

// ── Page 2 — attachment (teaching schedule) ───────────────────────────────

const attachmentTitle = para([bold("ภาคเรียนที่ {semester} ปีการศึกษา {academicYear}", { size: TITLE_SIZE, sizeComplexScript: TITLE_SIZE })], {
  alignment: AlignmentType.CENTER,
  pageBreakBefore: true,
});

const programLine = para([run("หลักสูตรทันตแพทยศาสตรบัณฑิต (หลักสูตรนานาชาติ)")], { spacing: { before: 240, after: 0 } });
const courseLine = para([run("ชื่อวิชา: {courseName}")]);
const lecturerLine = para([bold("อาจารย์ผู้สอน: {lecturerName}")], { spacing: { before: 0, after: 240 } });

const SCHEDULE_COLUMNS = [2123, 5387, 1417]; // twips, identical to the original table
const line = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const gridBorders = { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line };
const cellMargins = { top: 40, bottom: 40, left: 108, right: 108 };

function headerCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlignTable.CENTER,
    margins: cellMargins,
    children: [para([bold(text)], { alignment: AlignmentType.CENTER })],
  });
}

const [colDate = 0, colTopic = 0, colHours = 0] = SCHEDULE_COLUMNS;

const scheduleTable = new Table({
  width: { size: SCHEDULE_COLUMNS.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  columnWidths: SCHEDULE_COLUMNS,
  layout: TableLayoutType.FIXED,
  indent: { size: 140, type: WidthType.DXA },
  borders: gridBorders,
  rows: [
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: [headerCell("วัน/ เวลา", colDate), headerCell("หัวข้อการสอน", colTopic), headerCell("จำนวนชั่วโมง", colHours)],
    }),
    new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: colDate, type: WidthType.DXA },
          verticalAlign: VerticalAlignTable.CENTER,
          margins: cellMargins,
          children: [
            para([run("{#schedule}"), bold("{dayDate}")], { alignment: AlignmentType.CENTER }),
            para([run("{timeRange}")], { alignment: AlignmentType.CENTER }),
          ],
        }),
        new TableCell({
          width: { size: colTopic, type: WidthType.DXA },
          verticalAlign: VerticalAlignTable.CENTER,
          margins: cellMargins,
          children: [para([run("{topic}")], { alignment: AlignmentType.LEFT })],
        }),
        new TableCell({
          width: { size: colHours, type: WidthType.DXA },
          verticalAlign: VerticalAlignTable.CENTER,
          margins: cellMargins,
          children: [para([run("{hours}{/schedule}")], { alignment: AlignmentType.CENTER })],
        }),
      ],
    }),
  ],
});

const examSection = [
  tagOnly("{#hasExam}"),
  para([bold("รายละเอียดการออกข้อสอบ", { underline: { type: UnderlineType.SINGLE } })], { spacing: { before: 240, after: 0 } }),
  para([run("ข้อสอบรายวิชาบรรยาย คิดเป็น ({pointsPerHour} คะแนน/ {one} ชั่วโมงการสอน)")]),
  para([run("กรณีสอนบรรยาย {totalHours} ชั่วโมง รบกวนขอ {totalPoints} คะแนน")]),
  para([run("ท่านสามารถออกข้อสอบได้ทั้งแบบอัตนัย และปรนัย ({examChoices} ตัวเลือก)")], { spacing: { before: 120, after: 0 } }),
  para([run("- ขอให้จัดส่งข้อสอบภายใน "), bold("{examDeadline}", { underline: { type: UnderlineType.SINGLE } })]),
  para(
    [
      run(
        "จัดส่งได้ที่ {coordinatorFull} ซึ่งเป็นผู้ประสานงาน โดยท่านสามารถติดต่อได้ที่หมายเลขโทรศัพท์ {coordinatorPhone} E-mail address: {coordinatorEmail}",
      ),
    ],
    // Left-aligned: Thai-distributed spacing stretched this line letter-by-letter in MS Word.
    { alignment: AlignmentType.LEFT, spacing: { before: 240, after: 0 } },
  ),
  tagOnly("{/hasExam}"),
];

const doc = new Document({
  creator: "DentOps — คณะทันตแพทยศาสตร์ สจล.",
  title: "หนังสือเชิญอาจารย์พิเศษ",
  description: "Template: invitation letter for special lecturers (docxtemplater tags)",
  styles: {
    default: {
      document: {
        run: { font: { ascii: FONT, hAnsi: FONT, cs: FONT, eastAsia: FONT }, size: SIZE, sizeComplexScript: SIZE },
        paragraph: { spacing: { before: 0, after: 0, line: LINE_PITCH, lineRule: LineRuleType.EXACT } },
      },
    },
  },
  sections: [
    {
      properties: {
        titlePage: true,
        page: {
          size: PAGE,
          margin: { ...MARGIN, header: cm(0.8), footer: cm(0.6), gutter: 0 },
        },
      },
      footers: {
        first: firstPageFooter,
        default: new Footer({ children: [blank()] }),
      },
      children: [
        emblem,
        letterhead,
        issueDate,
        subject,
        salutation,
        body1,
        body2,
        body3,
        body4,
        closing,
        ...signatureSpace,
        signerName,
        signerPosition,
        attachmentTitle,
        programLine,
        courseLine,
        lecturerLine,
        scheduleTable,
        ...examSection,
      ],
    },
  ],
});

async function main(): Promise<void> {
  const buffer = await Packer.toBuffer(doc);
  mkdirSync(join(ROOT, "templates"), { recursive: true });
  writeFileSync(OUT_FILE, buffer);
  console.log(`✔ wrote ${OUT_FILE} (${buffer.length.toLocaleString()} bytes)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
