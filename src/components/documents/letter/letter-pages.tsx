import type { ReactNode } from "react";
import type { InvitationTemplateData } from "@/lib/invitation/template-data";
import { protectThai } from "@/lib/thai-wrap";
import { cn } from "@/lib/utils";
import styles from "./letter.module.css";

/** How the attachment's teaching-schedule rows are spread over pages (from measuring, see useAttachmentLayout). */
export interface AttachmentLayout {
  /** Row indexes per attachment page. */
  pages: number[][];
  /** Index of the attachment page that ends with the exam section (it never splits). */
  examPage: number;
}

export const SINGLE_PAGE_LAYOUT = (rows: number): AttachmentLayout => ({
  pages: [Array.from({ length: rows }, (_, i) => i)],
  examPage: 0,
});

interface Props {
  data: InvitationTemplateData;
  /** Names that must stay whole on one line (see invitationProtectedWords). */
  protectedWords: string[];
  layout?: AttachmentLayout;
}

/** Text with Thai compound words and names kept whole (no line break inside them). */
export function T({ children, words }: { children: string; words: string[] }) {
  return (
    <>
      {protectThai(children, words).map((segment, i) =>
        segment.keep ? (
          <span key={i} className={styles.keep}>
            {segment.text}
          </span>
        ) : (
          segment.text
        ),
      )}
    </>
  );
}

/** Both pages of the invitation letter, laid out like templates/invitation-letter.docx. */
export function LetterPages({ data, protectedWords, layout }: Props) {
  const t = (text: string) => <T words={protectedWords}>{text}</T>;
  const attachment = layout ?? SINGLE_PAGE_LAYOUT(data.schedule.length);

  return (
    <>
      <LetterPage data={data} t={t} />
      {attachment.pages.map((rows, pageIndex) => (
        <section key={pageIndex} className={styles.page} data-letter-page="">
          {pageIndex === 0 ? <AttachmentHeader data={data} t={t} /> : null}
          {rows.length > 0 ? <ScheduleTable data={data} rows={rows} t={t} /> : null}
          {pageIndex === attachment.examPage && data.hasExam ? <ExamSection data={data} t={t} /> : null}
        </section>
      ))}
    </>
  );
}

type Tx = (text: string) => ReactNode;

function LetterPage({ data, t }: { data: InvitationTemplateData; t: Tx }) {
  return (
    <section className={styles.page} data-letter-page="">
      {/* eslint-disable-next-line @next/next/no-img-element -- printed/captured as-is, no optimisation wanted */}
      <img className={styles.emblem} src="/brand/kmitl-emblem.jpeg" alt="ตราสัญลักษณ์ สจล." />
      <p aria-hidden />
      <p aria-hidden className={styles.headerSpacer} />
      <div className={styles.letterhead}>
        <p>{t(`ที่ ${data.documentPrefix} / ${data.letterNo}`)}</p>
        <div>
          {data.letterheadLines.map((line) => (
            <p key={line.text}>{t(line.text)}</p>
          ))}
        </div>
      </div>
      <p className={styles.date}>{t(data.issueDate)}</p>
      <p className={cn(styles.hanging, styles.justify)}>
        <span className={styles.label}>เรื่อง</span>
        {t(`ขอเรียนเชิญเป็นอาจารย์พิเศษ รายวิชา ${data.courseName}`)}
      </p>
      <p className={cn(styles.hanging, styles.justify)}>
        <span className={styles.label}>เรียน</span>
        {t(data.lecturerName)}
      </p>
      <p className={cn(styles.body, styles.justify)}>
        {t(`ด้วยคณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง ได้ดำเนินการจัดการเรียนการสอนในรายวิชา ${data.courseName} `)}
        <span className={styles.bold}>{t("หลักสูตรทันตแพทยศาสตรบัณฑิต (หลักสูตรนานาชาติ) ใช้การเรียนการสอนเป็นภาษาอังกฤษ")}</span>
        {t(
          ` ภาคการศึกษาที่ ${data.semester} ปีการศึกษา ${data.academicYear} ให้กับนักศึกษาระดับปริญญาตรีชั้นปีที่ ${data.studentYear} ณ ${data.venue} คณะทันตแพทยศาสตร์ นั้น`,
        )}
      </p>
      <p className={cn(styles.body, styles.justify)}>
        {t(
          `ในการนี้ คณะทันตแพทยศาสตร์ ขอเรียนเชิญท่านเป็นอาจารย์พิเศษในรายวิชา ${data.courseName} ซึ่งท่านเป็นผู้มีความรู้ ความสามารถ และมีประสบการณ์สูง โดยรายละเอียดปรากฏดังเอกสารที่แนบมาพร้อมนี้`,
        )}
      </p>
      <p className={cn(styles.body, styles.justify)}>
        {t(
          `ทั้งนี้ คณะทันตแพทยศาสตร์ ขอมอบหมายให้ ${data.coordinatorShort} เป็นผู้ประสานงาน เบอร์โทรศัพท์ ${data.coordinatorPhone} E-mail address: ${data.coordinatorEmail}`,
        )}
      </p>
      <p className={cn(styles.body, styles.justify)}>{t("คณะทันตแพทยศาสตร์ หวังว่าจะได้รับความอนุเคราะห์จากท่าน และขอขอบพระคุณมา ณ โอกาสนี้")}</p>
      <p className={cn(styles.closing, styles.center)}>{t("ขอแสดงความนับถือ")}</p>
      <p aria-hidden />
      <p aria-hidden />
      <p className={styles.center}>{t(data.signerName)}</p>
      <p className={styles.center}>{t(data.signerPosition)}</p>
      <div className={styles.footer}>
        <p>{t(data.footerUnit)}</p>
        <p>{t(data.footerPhone)}</p>
      </div>
    </section>
  );
}

export function AttachmentHeader({ data, t }: { data: InvitationTemplateData; t: Tx }) {
  return (
    <div>
      <p className={cn(styles.title, styles.center)}>{t(`ภาคเรียนที่ ${data.semester} ปีการศึกษา ${data.academicYear}`)}</p>
      <p className={styles.gapBefore}>{t("หลักสูตรทันตแพทยศาสตรบัณฑิต (หลักสูตรนานาชาติ)")}</p>
      <p>{t(`ชื่อวิชา: ${data.courseName}`)}</p>
      <p className={cn(styles.bold, styles.gapAfter)}>{t(`อาจารย์ผู้สอน: ${data.lecturerName}`)}</p>
    </div>
  );
}

export function ScheduleTable({ data, rows, t }: { data: InvitationTemplateData; rows: number[]; t: Tx }) {
  return (
    <table className={styles.table}>
      <colgroup>
        <col className={styles.colDate} />
        <col className={styles.colTopic} />
        <col className={styles.colHours} />
      </colgroup>
      <thead>
        <tr>
          {/* widths repeated on the cells: the PDF capture does not carry <col> widths over */}
          <th className={styles.colDate}>วัน/ เวลา</th>
          <th className={styles.colTopic}>หัวข้อการสอน</th>
          <th className={styles.colHours}>จำนวนชั่วโมง</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((index) => {
          const row = data.schedule[index];
          if (!row) return null;
          return (
            <tr key={index} data-row={index}>
              <td className={styles.center}>
                <p className={styles.bold}>{t(row.dayDate)}</p>
                <p>{row.timeRange}</p>
              </td>
              <td>
                <p>{t(row.topic)}</p>
              </td>
              <td className={styles.center}>
                <p>{row.hours}</p>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function ExamSection({ data, t }: { data: InvitationTemplateData; t: Tx }) {
  return (
    <div>
      <p className={cn(styles.bold, styles.underline, styles.gapBefore)}>รายละเอียดการออกข้อสอบ</p>
      <p>{t(`ข้อสอบรายวิชาบรรยาย คิดเป็น (${data.pointsPerHour} คะแนน/ ${data.one} ชั่วโมงการสอน)`)}</p>
      <p>{t(`กรณีสอนบรรยาย ${data.totalHours} ชั่วโมง รบกวนขอ ${data.totalPoints} คะแนน`)}</p>
      <p className={styles.gapBeforeSmall}>{t(`ท่านสามารถออกข้อสอบได้ทั้งแบบอัตนัย และปรนัย (${data.examChoices} ตัวเลือก)`)}</p>
      <p>
        {t("- ขอให้จัดส่งข้อสอบภายใน ")}
        <span className={cn(styles.bold, styles.underline)}>{t(data.examDeadline)}</span>
      </p>
      <p className={styles.gapBefore}>
        {t(
          `จัดส่งได้ที่ ${data.coordinatorFull} ซึ่งเป็นผู้ประสานงาน โดยท่านสามารถติดต่อได้ที่หมายเลขโทรศัพท์ ${data.coordinatorPhone} E-mail address: ${data.coordinatorEmail}`,
        )}
      </p>
    </div>
  );
}

export { styles as letterStyles };
