import * as docx from 'docx';
import saveAs from 'file-saver';
import JSZip from 'jszip';
import { LetterData, SystemStandard, DisbursementData } from '../types';
import { OFFICIAL_INFO, DEFAULT_STD, DEFAULT_KMITL_LOGO } from '../constants/defaults';
import { toThaiDigits, dateForPrint } from './thaiFormatter';

const CM = 567; // 1 cm in twips (dxa)
const DOCFONT = 'TH Sarabun PSK';
const FONT_SPEC = {
  name: DOCFONT,
  ascii: DOCFONT,
  hAnsi: DOCFONT,
  cs: DOCFONT,
  eastAsia: DOCFONT
};

function safeFileName(s: string): string {
  return String(s || '').replace(/[\/\\?%*:|"<>]/g, '_').trim();
}

/**
 * Convert dataURL or SVG to Uint8Array for docx ImageRun
 */
async function dataUrlToUint8Array(dataUrl: string): Promise<Uint8Array | null> {
  try {
    if (!dataUrl) return null;
    if (dataUrl.startsWith('data:image/svg+xml')) {
      // Rasterize SVG onto a Canvas to obtain PNG bytes for Word docx compatibility
      const svgText = decodeURIComponent(dataUrl.split(',')[1]);
      const img = new Image();
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          resolve();
        };
        img.onerror = reject;
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
      });

      const pngData = canvas.toDataURL('image/png');
      const bin = atob(pngData.split(',')[1]);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        arr[i] = bin.charCodeAt(i);
      }
      return arr;
    }

    if (dataUrl.indexOf(',') > -1) {
      const bin = atob(dataUrl.split(',')[1]);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        arr[i] = bin.charCodeAt(i);
      }
      return arr;
    }
  } catch (err) {
    console.warn('Failed to convert logo to bytes for Word docx:', err);
  }
  return null;
}

/**
 * Builds the official Invitation Letter docx document
 */
export async function buildInvitationDoc(
  d: LetterData,
  std: SystemStandard = DEFAULT_STD,
  logoDataUrl?: string
): Promise<docx.Document> {
  const D = docx;
  const ch: (docx.Paragraph | docx.Table)[] = [];
  const TW = (cm: number) => Math.round(cm * CM);

  // Standard Thai Saraban font size: 16pt -> 32 half-points in Word OpenXML
  const effectiveFs = (std.fs && std.fs >= 14) ? std.fs : 16;
  const HPS = Math.round(effectiveFs * 2); // 16pt = 32 half-points
  const LINE = Math.round(240 * (std.lh || 1.15)); // 1.15 line spacing = 276 dxa
  const CSP = Math.round((std.lsp || 0) * 20); // 1pt = 20 twips in Word
  const A = D.AlignmentType;

  const NO: docx.IBorderOptions = { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const NB = { top: NO, bottom: NO, left: NO, right: NO };

  const T = (t: string, b = false) =>
    new D.TextRun({
      text: String(t == null ? '' : t),
      bold: !!b,
      boldComplexScript: !!b,
      size: HPS,
      sizeComplexScript: HPS,
      font: FONT_SPEC,
      characterSpacing: CSP,
      scale: std.charScale ?? 100
    });

  const P = (o: docx.IParagraphOptions) => new D.Paragraph(o);
  const SP = (o: { before?: number; after?: number } = {}) => ({
    line: LINE,
    lineRule: D.LineRuleType.AUTO,
    after: o.after === undefined ? 0 : o.after,
    before: o.before === undefined ? 240 : o.before // Default 12pt (240 dxa) spacing before
  });

  const diff = std.mL - std.mR;
  // Exact 50% page width alignment: right indent of (mL - mR) centers text on 10.5cm page axis
  const CIND = diff !== 0 ? { right: TW(diff) } : {};

  // 1. KMITL Emblem Logo (Inline centered paragraph, EXACT 3.0 cm = 113.4 px at 96 DPI)
  const activeLogo = logoDataUrl || DEFAULT_KMITL_LOGO;
  if (activeLogo) {
    const imgBytes = await dataUrlToUint8Array(activeLogo);
    if (imgBytes) {
      const logoH = std.logoH || 3.0; // Standard 3.0 cm height
      // In docx ImageRun transformation, width & height are in 96 DPI pixels: 1 cm = (96 / 2.54) = 37.795 px
      // 3.0 cm * 37.795 px/cm = 113.38 px (approx 115 px / 1.18 inches as requested)
      const logoPx = Math.min(115, Math.max(110, Math.round((logoH / 2.54) * 96)));
      const logoSpacingBefore = Math.round((std.logoTopOffset ?? 0) * 20);

      ch.push(
        P({
          alignment: A.CENTER,
          indent: CIND,
          spacing: {
            before: logoSpacingBefore,
            after: 0, // spaceAfter: 0 (margin-bottom: 0) to prevent pushing content to page 2
            line: LINE,
            lineRule: D.LineRuleType.AUTO
          },
          children: [
            new D.ImageRun({
              data: imgBytes,
              transformation: { width: logoPx, height: logoPx },
              type: 'png' as const
            })
          ]
        })
      );
    }
  }

  // 2. Header Block (Use BORDERLESS TABLE: Left 8.5 cm, Right 7.5 cm to lock position 100%)
  const lw = TW(8.5);  // 8.5 cm
  const rw = TW(7.5);  // 7.5 cm (Total = 16.0 cm printable width)

  const letterNoText = d.letter_no.startsWith('ที่')
    ? d.letter_no
    : `ที่ ${d.letter_no}`;

  ch.push(
    new D.Table({
      width: { size: TW(contentW), type: D.WidthType.DXA },
      layout: D.TableLayoutType.FIXED,
      columnWidths: [lw, rw],
      borders: { top: NO, bottom: NO, left: NO, right: NO, insideHorizontal: NO, insideVertical: NO },
      rows: [
        new D.TableRow({
          children: [
            new D.TableCell({
              borders: NB,
              margins: { left: 0, right: 0, top: 0, bottom: 0 },
              width: { size: lw, type: D.WidthType.DXA },
              children: [
                P({
                  spacing: { before: 0, after: 0, line: LINE, lineRule: D.LineRuleType.AUTO },
                  children: [T(letterNoText)]
                })
              ]
            }),
            new D.TableCell({
              borders: NB,
              margins: { left: 0, right: 0, top: 0, bottom: 0 },
              width: { size: rw, type: D.WidthType.DXA },
              children: [
                P({
                  spacing: { before: 0, after: 0, line: LINE, lineRule: D.LineRuleType.AUTO },
                  children: [T(OFFICIAL_INFO.addr1)]
                }),
                P({
                  spacing: { before: 0, after: 0, line: LINE, lineRule: D.LineRuleType.AUTO },
                  children: [T(OFFICIAL_INFO.addr2)]
                })
              ]
            })
          ]
        })
      ]
    })
  );

  // 3. Date Line (Use BORDERLESS TABLE: Left empty 8.2 cm, Right date text 7.8 cm)
  const rawDate = (d.issue_date || '').trim();
  const dateFormatted = (/^\d|^[๑-๙]/.test(rawDate)) ? rawDate : `      ${rawDate || 'กันยายน ๒๕๖๙'}`;
  const dateSpacing = Math.round((std.dateTopOffset ?? 12) * 20); // 12pt = 240 dxa
  const dateLw = TW(8.2); // 8.2 cm
  const dateRw = TW(Math.max(1, contentW - 8.2)); // 7.8 cm

  ch.push(
    new D.Table({
      width: { size: TW(contentW), type: D.WidthType.DXA },
      layout: D.TableLayoutType.FIXED,
      columnWidths: [dateLw, dateRw],
      borders: { top: NO, bottom: NO, left: NO, right: NO, insideHorizontal: NO, insideVertical: NO },
      rows: [
        new D.TableRow({
          children: [
            new D.TableCell({
              borders: NB,
              margins: { left: 0, right: 0, top: 0, bottom: 0 },
              width: { size: dateLw, type: D.WidthType.DXA },
              children: [
                P({
                  spacing: { before: dateSpacing, after: 0, line: LINE, lineRule: D.LineRuleType.AUTO },
                  children: []
                })
              ]
            }),
            new D.TableCell({
              borders: NB,
              margins: { left: 0, right: 0, top: 0, bottom: 0 },
              width: { size: dateRw, type: D.WidthType.DXA },
              children: [
                P({
                  spacing: { before: dateSpacing, after: 0, line: LINE, lineRule: D.LineRuleType.AUTO },
                  children: [T(dateFormatted)]
                })
              ]
            })
          ]
        })
      ]
    })
  );

  // 4. เรื่อง & เรียน (Spacing before configurable, Tab Stop at 1.5 cm = 851 dxa)
  const subjectSpacing = Math.round((std.subjectTopOffset ?? 12) * 20);
  const tabPos = TW(std.rTab ?? 1.5);
  const lbl = (label: string, text: string, spBefore = subjectSpacing) =>
    P({
      spacing: { before: spBefore, after: 0, line: LINE, lineRule: D.LineRuleType.AUTO },
      indent: { left: tabPos, hanging: tabPos },
      tabStops: [{ type: D.TabStopType.LEFT, position: tabPos }],
      children: [T(label), T(`\t${text}`)]
    });

  ch.push(lbl('เรื่อง', `ขอเรียนเชิญเป็นอาจารย์พิเศษ รายวิชา ${d.course}`, subjectSpacing));
  ch.push(lbl('เรียน', d.lecturer, Math.round(4 * 20)));

  // 5. Official Paragraphs (First-line indent 2.5 cm = 1417 dxa, Thai Distributed)
  const bodyAlign =
    std.alignMode === 'left'
      ? A.LEFT
      : (A.THAI_DISTRIBUTE || A.DISTRIBUTE || A.JUSTIFIED);

  const makeBodyP = (runs: docx.TextRun[], lhVal?: number, mbVal?: number, isFirst = false) => {
    const effectiveLh = lhVal ?? std.lh ?? 1.15;
    const effectiveMb = mbVal ?? std.paraSpacing ?? 12;
    const lineTwips = Math.round(effectiveLh * 240);
    const afterTwips = Math.round(effectiveMb * 20);
    const beforeTwips = isFirst ? Math.round((std.paraSpacing ?? 12) * 20) : 0;

    return P({
      alignment: bodyAlign,
      indent: { firstLine: TW(std.rIndent ?? 2.5) }, // 2.5 cm (1417 dxa)
      spacing: {
        before: beforeTwips,
        after: afterTwips,
        line: lineTwips,
        lineRule: D.LineRuleType.AUTO
      },
      children: runs
    });
  };

  ch.push(
    makeBodyP(
      [
        T(`ด้วยคณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง ได้ดำเนินการจัดการเรียนการสอนในรายวิชา ${d.course} `),
        T(OFFICIAL_INFO.boldProgram, true),
        T(` ปีการศึกษา ${d.acadYear} ให้กับนักศึกษาระดับปริญญาตรี ${d.stdYear} คณะทันตแพทยศาสตร์ นั้น`)
      ],
      std.p1Lh,
      std.p1Mb,
      true
    )
  );

  ch.push(
    makeBodyP(
      [
        T(`ในการนี้ คณะทันตแพทยศาสตร์ ขอเรียนเชิญท่านเป็นอาจารย์พิเศษในรายวิชา ${d.course} ซึ่งท่านเป็นผู้มีความรู้ ความสามารถ และมีประสบการณ์สูง โดยรายละเอียดปรากฏ ดังเอกสารที่แนบมาพร้อมนี้`)
      ],
      std.p2Lh,
      std.p2Mb,
      false
    )
  );

  ch.push(
    makeBodyP(
      [
        T(`ทั้งนี้ คณะทันตแพทยศาสตร์ ขอมอบหมายให้ ${d.coName} เป็นผู้ประสานงาน เบอร์โทรศัพท์ ${d.coPhone} E-mail address: ${d.coMail} เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป`)
      ],
      std.p3Lh,
      std.p3Mb,
      false
    )
  );

  ch.push(
    makeBodyP(
      [
        T('จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์ และขอขอบคุณมา ณ โอกาสนี้')
      ],
      std.p4Lh,
      std.p4Mb,
      false
    )
  );

  // 6. Sign-off Block (Use BORDERLESS TABLE: Left empty 8.2 cm, Right centered with dean name & title)
  const sigBefore = Math.round((std.signatureTopOffset ?? 18) * 20); // 18pt = 360 dxa
  const sigGap = Math.round((std.signGapHeight ?? 1.6) * 450);
  const sigLw = TW(8.2); // 8.2 cm
  const sigRw = TW(Math.max(1, contentW - 8.2)); // 7.8 cm

  ch.push(
    new D.Table({
      width: { size: TW(contentW), type: D.WidthType.DXA },
      layout: D.TableLayoutType.FIXED,
      columnWidths: [sigLw, sigRw],
      borders: { top: NO, bottom: NO, left: NO, right: NO, insideHorizontal: NO, insideVertical: NO },
      rows: [
        new D.TableRow({
          children: [
            new D.TableCell({
              borders: NB,
              margins: { left: 0, right: 0, top: 0, bottom: 0 },
              width: { size: sigLw, type: D.WidthType.DXA },
              children: [
                P({
                  spacing: { before: sigBefore, after: 0, line: LINE, lineRule: D.LineRuleType.AUTO },
                  children: []
                })
              ]
            }),
            new D.TableCell({
              borders: NB,
              margins: { left: 0, right: 0, top: 0, bottom: 0 },
              width: { size: sigRw, type: D.WidthType.DXA },
              children: [
                P({
                  alignment: A.CENTER,
                  spacing: { before: sigBefore, after: sigGap, line: LINE, lineRule: D.LineRuleType.AUTO },
                  children: [T('ขอแสดงความนับถือ')]
                }),
                P({
                  alignment: A.CENTER,
                  spacing: { before: 0, after: 20, line: LINE, lineRule: D.LineRuleType.AUTO },
                  children: [T(OFFICIAL_INFO.dean)]
                }),
                P({
                  alignment: A.CENTER,
                  spacing: { before: 0, after: 0, line: LINE, lineRule: D.LineRuleType.AUTO },
                  children: [T(OFFICIAL_INFO.deanPos)]
                })
              ]
            })
          ]
        })
      ]
    })
  );

  // 7. Footer Left (0cm left margin, strictly split into 2 lines)
  const footerParts = OFFICIAL_INFO.foot2
    ? [OFFICIAL_INFO.foot1, OFFICIAL_INFO.foot2]
    : OFFICIAL_INFO.foot1.split('/').map((s) => s.trim());
  const footerBefore = Math.round((std.footerBottomOffset ?? 24) * 20);

  ch.push(
    P({
      alignment: A.LEFT,
      spacing: { before: footerBefore, after: 0, line: LINE, lineRule: D.LineRuleType.AUTO },
      children: [T(footerParts[0] || 'คณะทันตแพทยศาสตร์ ส่วนสนับสนุนวิชาการ')]
    })
  );
  if (footerParts[1]) {
    ch.push(
      P({
        alignment: A.LEFT,
        spacing: { before: 0, after: 0, line: LINE, lineRule: D.LineRuleType.AUTO },
        children: [T(footerParts[1])]
      })
    );
  }

  // ================= PAGE 2: SCHEDULE TABLE =================
  const BORDER_SINGLE: docx.IBorderOptions = { style: D.BorderStyle.SINGLE, size: 4, color: '333333' };
  const TABLE_BORDERS: docx.ITableBordersOptions = {
    top: BORDER_SINGLE,
    bottom: BORDER_SINGLE,
    left: BORDER_SINGLE,
    right: BORDER_SINGLE,
    insideHorizontal: BORDER_SINGLE,
    insideVertical: BORDER_SINGLE
  };

  ch.push(P({ children: [new D.PageBreak()] }));

  // สิ่งที่ส่งมาด้วย ๑ (ชิดขวา ตามระเบียบสารบรรณ)
  ch.push(
    P({
      alignment: A.RIGHT,
      spacing: SP({ before: 0, after: 80 }),
      children: [T('สิ่งที่ส่งมาด้วย ๑', true)]
    })
  );

  ch.push(
    P({
      alignment: A.CENTER,
      spacing: SP({ before: 0, after: 60 }),
      children: [T(`รายละเอียดการสอนอาจารย์พิเศษ รายวิชา ${d.course}`, true)]
    })
  );
  ch.push(
    P({
      alignment: A.CENTER,
      spacing: SP({ before: 0, after: 60 }),
      children: [T(`หลักสูตรทันตแพทยศาสตรบัณฑิต (หลักสูตรนานาชาติ) ปีการศึกษา ${d.acadYear}`)]
    })
  );
  ch.push(
    P({
      alignment: A.LEFT,
      spacing: SP({ before: 60, after: 120 }),
      children: [T(`อาจารย์ผู้สอน: ${d.lecturer}`, true)]
    })
  );

  const cell = (txt: string, w: number, center = false, bold = false) =>
    new D.TableCell({
      width: { size: w, type: D.WidthType.DXA },
      borders: TABLE_BORDERS,
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: [P({ alignment: center ? A.CENTER : A.LEFT, spacing: SP({ before: 0, after: 0 }), children: [T(txt, bold)] })]
    });

  const W = contentW;
  let cols: number[];
  let hr: docx.TableRow;
  let br: docx.TableRow[];

  if (d.tableMode === '5') {
    // 5-Column Table: ครั้งที่, วัน/เดือน/ปี, เวลา, หัวข้อบรรยาย/ปฏิบัติการ, อาจารย์ผู้สอน
    cols = [TW(1.5), TW(3.2), TW(2.8), TW(5.5), TW(3.0)];
    hr = new D.TableRow({
      tableHeader: true,
      children: [
        cell('ครั้งที่', cols[0], true, true),
        cell('วัน/เดือน/ปี', cols[1], true, true),
        cell('เวลา', cols[2], true, true),
        cell('หัวข้อบรรยาย/ปฏิบัติการ', cols[3], true, true),
        cell('อาจารย์ผู้สอน', cols[4], true, true)
      ]
    });
    br = d.items.map(
      (r, idx) =>
        new D.TableRow({
          children: [
            cell(toThaiDigits(idx + 1), cols[0], true),
            cell(r.date, cols[1], true),
            cell(r.time, cols[2], true),
            cell(r.topic, cols[2] ? cols[3] : cols[3]),
            cell(d.lecturer, cols[4], true)
          ]
        })
    );
  } else if (d.tableMode === '4') {
    cols = [TW(W * 0.20), TW(W * 0.16), TW(W * 0.51), TW(W * 0.13)];
    hr = new D.TableRow({
      tableHeader: true,
      children: [
        cell('วัน/เดือน/ปี', cols[0], true, true),
        cell('เวลา', cols[1], true, true),
        cell('หัวข้อการสอน', cols[2], true, true),
        cell('จำนวนชั่วโมง', cols[3], true, true)
      ]
    });
    br = d.items.map(
      (r) =>
        new D.TableRow({
          children: [
            cell(r.date, cols[0], true),
            cell(r.time, cols[1], true),
            cell(r.topic, cols[2]),
            cell(r.hours, cols[3], true)
          ]
        })
    );
  } else {
    cols = [TW(W * 0.26), TW(W * 0.61), TW(W * 0.13)];
    hr = new D.TableRow({
      tableHeader: true,
      children: [
        cell('วัน/ เวลา', cols[0], true, true),
        cell('หัวข้อการสอน', cols[1], true, true),
        cell('จำนวนชั่วโมง', cols[2], true, true)
      ]
    });
    br = d.items.map(
      (r) =>
        new D.TableRow({
          children: [
            new D.TableCell({
              width: { size: cols[0], type: D.WidthType.DXA },
              borders: TABLE_BORDERS,
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: [
                P({ alignment: A.CENTER, spacing: SP({ before: 0, after: 0 }), children: [T(r.date)] }),
                P({ alignment: A.CENTER, spacing: SP({ before: 0, after: 0 }), children: [T(r.time)] })
              ]
            }),
            cell(r.topic, cols[1]),
            cell(r.hours, cols[2], true)
          ]
        })
    );
  }

  ch.push(
    new D.Table({
      width: { size: TW(W), type: D.WidthType.DXA },
      layout: D.TableLayoutType.FIXED,
      columnWidths: cols,
      borders: TABLE_BORDERS,
      rows: [hr, ...br]
    })
  );

  return new D.Document({
    styles: {
      default: {
        document: {
          run: { font: FONT_SPEC, size: HPS, sizeComplexScript: HPS, characterSpacing: CSP },
          paragraph: { spacing: { line: LINE, lineRule: D.LineRuleType.AUTO, after: 0 } }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838, orientation: D.PageOrientation.PORTRAIT },
            margin: {
              top: TW(std.mT || 1.5),     // 851 dxa (1.5 cm)
              right: TW(std.mR || 2.0),   // 1134 dxa (2.0 cm)
              bottom: TW(std.mB || 1.8),  // 1021 dxa (1.8 cm)
              left: TW(std.mL || 3.0),    // 1701 dxa (3.0 cm)
              gutter: 0
            }
          }
        },
        children: ch
      }
    ]
  });
}

/**
 * Downloads single invitation letter as Word (.docx)
 */
export async function exportInvitationDocx(
  d: LetterData,
  std: SystemStandard = DEFAULT_STD,
  logoDataUrl?: string
) {
  const doc = await buildInvitationDoc(d, std, logoDataUrl);
  const blob = await docx.Packer.toBlob(doc);
  const fileName = `หนังสือเชิญ_${safeFileName(d.lecturer || 'อาจารย์')}_${safeFileName(d.course)}.docx`;
  saveAs(blob, fileName);
}

/**
 * Builds the 4 disbursement documents in Word format
 */
export async function buildDisbursementDoc(
  d: DisbursementData,
  formType: 'all' | 'requisition' | 'receipt' | 'acceptance' | 'timesheet',
  std: SystemStandard = DEFAULT_STD,
  logoDataUrl?: string
): Promise<docx.Document> {
  const D = docx;
  const ch: (docx.Paragraph | docx.Table)[] = [];
  const TW = (cm: number) => Math.round(cm * CM);
  const HPS = 22; // 11pt
  const A = D.AlignmentType;

  const T = (t: string, b = false) =>
    new D.TextRun({
      text: String(t == null ? '' : t),
      bold: !!b,
      size: HPS,
      sizeComplexScript: HPS,
      font: DOCFONT
    });

  const P = (o: docx.IParagraphOptions) => new D.Paragraph(o);
  const SP = (after = 100) => ({ line: 320, lineRule: D.LineRuleType.AUTO, after });

  // 1. แบบตอบรับการเป็นอาจารย์พิเศษ
  if (formType === 'all' || formType === 'acceptance') {
    ch.push(
      P({
        alignment: A.CENTER,
        spacing: SP(200),
        children: [T('แบบตอบรับการเป็นอาจารย์พิเศษ', true)]
      })
    );
    ch.push(
      P({
        alignment: A.CENTER,
        spacing: SP(160),
        children: [T('คณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง')]
      })
    );
    ch.push(P({ spacing: SP(120), children: [T(`วันที่ ${d.docDate || '...........................................'}`)] }));
    ch.push(P({ spacing: SP(120), children: [T(`เรียน  คณบดีคณะทันตแพทยศาสตร์`)] }));
    ch.push(
      P({
        indent: { firstLine: TW(1.5) },
        spacing: SP(120),
        children: [
          T(`ตามที่ คณะทันตแพทยศาสตร์ ได้มีหนังสือเชิญข้าพเจ้า `),
          T(d.lecturer, true),
          T(` เป็นอาจารย์พิเศษสอนในรายวิชา `),
          T(d.course, true),
          T(` ปีการศึกษา `),
          T(d.acadYear, true),
          T(` นั้น`)
        ]
      })
    );
    ch.push(
      P({
        indent: { firstLine: TW(1.5) },
        spacing: SP(140),
        children: [T(`ข้าพเจ้า ขอตอบรับการเป็นอาจารย์พิเศษตามวัน เวลา และหัวข้อที่ได้รับมอบหมาย โดยยินดีปฏิบัติตามระเบียบและข้อบังคับของสถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบังทุกประการ`)]
      })
    );
    ch.push(P({ spacing: SP(100), children: [T('ข้อมูลสำหรับการโอนเงินค่าตอบแทนเข้าบัญชีธนาคาร:')] }));
    ch.push(P({ indent: { left: TW(1.0) }, spacing: SP(80), children: [T(`• ชื่อบัญชี: ${d.lecturer}`)] }));
    ch.push(P({ indent: { left: TW(1.0) }, spacing: SP(80), children: [T(`• ธนาคาร: ${d.bankName || '........................................'} สาขา: ........................................`)] }));
    ch.push(P({ indent: { left: TW(1.0) }, spacing: SP(160), children: [T(`• เลขที่บัญชี: ${d.bankAccount || '........................................................'}`)] }));

    ch.push(P({ alignment: A.RIGHT, spacing: SP(80), children: [T('(ลงชื่อ)...........................................................')] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(80), children: [T(`(${d.lecturer})`)] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(300), children: [T('อาจารย์พิเศษผู้สอน')] }));
  }

  // 2. ใบเบิกเงินค่าตอบแทนอาจารย์พิเศษ
  if (formType === 'all' || formType === 'requisition') {
    if (ch.length > 0) ch.push(P({ children: [new D.PageBreak()] }));

    ch.push(P({ alignment: A.CENTER, spacing: SP(160), children: [T('ใบเบิกเงินค่าตอบแทนอาจารย์พิเศษ', true)] }));
    ch.push(P({ alignment: A.CENTER, spacing: SP(160), children: [T('คณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง')] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(140), children: [T(`วันที่ ${d.docDate}`)] }));
    ch.push(P({ spacing: SP(100), children: [T(`๑. ชื่ออาจารย์พิเศษ: ${d.lecturer}`)] }));
    ch.push(P({ spacing: SP(100), children: [T(`๒. สังกัด/ที่อยู่: ${d.address || 'คณะทันตแพทยศาสตร์'}`)] }));
    ch.push(P({ spacing: SP(100), children: [T(`๓. รายวิชาที่สอน: ${d.course} (หลักสูตรนานาชาติ)`)] }));
    ch.push(P({ spacing: SP(100), children: [T(`๔. ปีการศึกษา: ${d.acadYear} ${d.stdYear}`)] }));
    ch.push(P({ spacing: SP(100), children: [T(`๕. จำนวนชั่วโมงสอนรวม: ${d.totalHours} ชั่วโมง อัตราชั่วโมงละ ${d.hourlyRate.toLocaleString()} บาท`)] }));
    ch.push(
      P({
        spacing: SP(160),
        children: [
          T(`๖. รวมเป็นเงินทั้งสิ้น: `),
          T(`${d.totalAmount.toLocaleString()} บาท `, true),
          T(`(${d.totalAmountText})`, true)
        ]
      })
    );

    ch.push(P({ alignment: A.RIGHT, spacing: SP(80), children: [T('(ลงชื่อ).....................................................ผู้ขอเบิก')] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(80), children: [T(`(${d.coName})`)] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(240), children: [T('ผู้ประสานงานรายวิชา')] }));

    ch.push(P({ spacing: SP(80), children: [T('คำรับรองการปฏิบัติงาน:') ] }));
    ch.push(P({ indent: { firstLine: TW(1.0) }, spacing: SP(120), children: [T('ขอรับรองว่าอาจารย์พิเศษได้ปฏิบัติการสอนตามตารางที่กำหนดจริงครบถ้วนสมบูรณ์')] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(80), children: [T('(ลงชื่อ).....................................................ผู้อนุมัติ')] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(80), children: [T(OFFICIAL_INFO.dean)] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(200), children: [T(OFFICIAL_INFO.deanPos)] }));
  }

  // 3. ใบสำคัญรับเงิน (Receipt Voucher)
  if (formType === 'all' || formType === 'receipt') {
    if (ch.length > 0) ch.push(P({ children: [new D.PageBreak()] }));

    ch.push(P({ alignment: A.CENTER, spacing: SP(160), children: [T('ใบสำคัญรับเงิน', true)] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(120), children: [T('ที่ คณะทันตแพทยศาสตร์ สจล.')] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(160), children: [T(`วันที่ ${d.docDate}`)] }));

    ch.push(
      P({
        indent: { firstLine: TW(1.5) },
        spacing: SP(140),
        children: [
          T(`ข้าพเจ้า `),
          T(d.lecturer, true),
          T(` อยู่บ้านเลขที่ ${d.address || '...........................................................................................'}`),
          T(` บัตรประจำตัวประชาชนเลขที่ ${d.idCard || '................................................'}`)
        ]
      })
    );

    ch.push(
      P({
        spacing: SP(140),
        children: [
          T(`ได้รับเงินจาก `),
          T(OFFICIAL_INFO.facultyFull, true),
          T(` ดังรายการต่อไปนี้:`)
        ]
      })
    );

    // Items table
    const cols = [TW(12.0), TW(4.5)];
    const tableRows = [
      new D.TableRow({
        tableHeader: true,
        children: [
          new D.TableCell({ width: { size: cols[0], type: D.WidthType.DXA }, children: [P({ alignment: A.CENTER, children: [T('รายการ', true)] })] }),
          new D.TableCell({ width: { size: cols[1], type: D.WidthType.DXA }, children: [P({ alignment: A.CENTER, children: [T('จำนวนเงิน (บาท)', true)] })] })
        ]
      }),
      new D.TableRow({
        children: [
          new D.TableCell({
            width: { size: cols[0], type: D.WidthType.DXA },
            children: [
              P({ children: [T(`ค่าตอบแทนการสอนอาจารย์พิเศษ รายวิชา ${d.course}`)] }),
              P({ children: [T(`จำนวน ${d.totalHours} ชั่วโมง @ ${d.hourlyRate.toLocaleString()} บาท`)] }),
              P({ children: [T(`(${d.totalAmountText})`, true)] })
            ]
          }),
          new D.TableCell({
            width: { size: cols[1], type: D.WidthType.DXA },
            children: [P({ alignment: A.RIGHT, children: [T(d.totalAmount.toLocaleString() + '.-', true)] })]
          })
        ]
      })
    ];

    ch.push(
      new D.Table({
        width: { size: TW(16.5), type: D.WidthType.DXA },
        layout: D.TableLayoutType.FIXED,
        columnWidths: cols,
        rows: tableRows
      })
    );

    ch.push(P({ spacing: SP(160), children: [T(`จำนวนเงิน (ตัวอักษร): ${d.totalAmountText}`, true)] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(80), children: [T('(ลงชื่อ).....................................................ผู้รับเงิน')] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(80), children: [T(`(${d.lecturer})`)] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(160), children: [T('(ลงชื่อ).....................................................ผู้จ่ายเงิน')] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(200), children: [T(`(${d.coName})`)] }));
  }

  // 4. ใบลงเวลาปฏิบัติงาน / ลงเวลาสอน (Teaching Timesheet)
  if (formType === 'all' || formType === 'timesheet') {
    if (ch.length > 0) ch.push(P({ children: [new D.PageBreak()] }));

    ch.push(P({ alignment: A.CENTER, spacing: SP(160), children: [T('ใบลงเวลาปฏิบัติงานและหัวข้อการสอนอาจารย์พิเศษ', true)] }));
    ch.push(P({ alignment: A.CENTER, spacing: SP(140), children: [T(OFFICIAL_INFO.facultyFull)] }));
    ch.push(P({ spacing: SP(80), children: [T(`ชื่ออาจารย์พิเศษ: ${d.lecturer}`)] }));
    ch.push(P({ spacing: SP(80), children: [T(`รายวิชา: ${d.course}  ปีการศึกษา: ${d.acadYear} ${d.stdYear}`)] }));

    const tCols = [TW(2.5), TW(3.2), TW(7.0), TW(1.8), TW(2.5)];
    const tRows = [
      new D.TableRow({
        tableHeader: true,
        children: [
          new D.TableCell({ width: { size: tCols[0], type: D.WidthType.DXA }, children: [P({ alignment: A.CENTER, children: [T('วันที่', true)] })] }),
          new D.TableCell({ width: { size: tCols[1], type: D.WidthType.DXA }, children: [P({ alignment: A.CENTER, children: [T('เวลา', true)] })] }),
          new D.TableCell({ width: { size: tCols[2], type: D.WidthType.DXA }, children: [P({ alignment: A.CENTER, children: [T('หัวข้อการสอน', true)] })] }),
          new D.TableCell({ width: { size: tCols[3], type: D.WidthType.DXA }, children: [P({ alignment: A.CENTER, children: [T('ชม.', true)] })] }),
          new D.TableCell({ width: { size: tCols[4], type: D.WidthType.DXA }, children: [P({ alignment: A.CENTER, children: [T('ลายมือชื่อ', true)] })] })
        ]
      }),
      ...d.items.map(
        (r) =>
          new D.TableRow({
            children: [
              new D.TableCell({ width: { size: tCols[0], type: D.WidthType.DXA }, children: [P({ alignment: A.CENTER, children: [T(r.date)] })] }),
              new D.TableCell({ width: { size: tCols[1], type: D.WidthType.DXA }, children: [P({ alignment: A.CENTER, children: [T(r.time)] })] }),
              new D.TableCell({ width: { size: tCols[2], type: D.WidthType.DXA }, children: [P({ children: [T(r.topic)] })] }),
              new D.TableCell({ width: { size: tCols[3], type: D.WidthType.DXA }, children: [P({ alignment: A.CENTER, children: [T(r.hours)] })] }),
              new D.TableCell({ width: { size: tCols[4], type: D.WidthType.DXA }, children: [P({ alignment: A.CENTER, children: [T('....................')] })] })
            ]
          })
      )
    ];

    ch.push(
      new D.Table({
        width: { size: TW(17.0), type: D.WidthType.DXA },
        layout: D.TableLayoutType.FIXED,
        columnWidths: tCols,
        rows: tRows
      })
    );

    ch.push(P({ spacing: SP(160), children: [T(`รวมชั่วโมงสอนทั้งสิ้น: ${d.totalHours} ชั่วโมง`, true)] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(80), children: [T('(ลงชื่อ).....................................................ผู้สอน')] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(80), children: [T(`(${d.lecturer})`)] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(80), children: [T('(ลงชื่อ).....................................................ผู้ตรวจรับรอง')] }));
    ch.push(P({ alignment: A.RIGHT, spacing: SP(100), children: [T(`(${d.coName})`)] }));
  }

  return new D.Document({
    styles: {
      default: {
        document: {
          run: { font: DOCFONT, size: HPS, sizeComplexScript: HPS },
          paragraph: { spacing: { line: 300, lineRule: D.LineRuleType.AUTO } }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838, orientation: D.PageOrientation.PORTRAIT },
            margin: { top: TW(1.8), right: TW(1.8), bottom: TW(1.8), left: TW(2.0), gutter: 0 }
          }
        },
        children: ch
      }
    ]
  });
}

/**
 * Downloads disbursement document in Word (.docx)
 */
export async function exportDisbursementDocx(
  d: DisbursementData,
  formType: 'all' | 'requisition' | 'receipt' | 'acceptance' | 'timesheet',
  std: SystemStandard = DEFAULT_STD,
  logoDataUrl?: string
) {
  const doc = await buildDisbursementDoc(d, formType, std, logoDataUrl);
  const blob = await docx.Packer.toBlob(doc);
  const titleMap = {
    all: 'ชุดเอกสารเบิกจ่ายครบชุด',
    requisition: 'ใบเบิกค่าตอบแทน',
    receipt: 'ใบสำคัญรับเงิน',
    acceptance: 'แบบตอบรับอาจารย์พิเศษ',
    timesheet: 'ใบลงเวลาสอน'
  };
  const fileName = `${titleMap[formType]}_${safeFileName(d.lecturer)}_${safeFileName(d.course)}.docx`;
  saveAs(blob, fileName);
}

/**
 * Exports batch letters to a single ZIP file containing all Word files (.docx)
 */
export async function exportBatchZip(
  batch: LetterData[],
  std: SystemStandard = DEFAULT_STD,
  logoDataUrl?: string,
  onProgress?: (current: number, total: number) => void
) {
  const zip = new JSZip();
  let count = 0;
  for (const item of batch) {
    const doc = await buildInvitationDoc(item, std, logoDataUrl);
    const blob = await docx.Packer.toBlob(doc);
    const fileName = `หนังสือเชิญ_${safeFileName(item.lecturer || 'อาจารย์')}_${safeFileName(item.course)}.docx`;
    zip.file(fileName, blob);
    count++;
    if (onProgress) onProgress(count, batch.length);
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `หนังสือเชิญอาจารย์พิเศษ_สจล_ทั้งหมด_${count}ฉบับ.zip`);
}
