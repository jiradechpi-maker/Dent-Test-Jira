/**
 * Organisation constants used on official KMITL documents.
 * Every number is stored with Arabic digits; the document layer converts to Thai digits when enabled.
 */
export const ORGANIZATION = {
  facultyName: "คณะทันตแพทยศาสตร์",
  institutionName: "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง",
  /** Government document prefix: "อว 7033" → "อว ๗๐๓๓". */
  documentPrefix: "อว 7033",
  /** Address block on the right of the letterhead, one entry per printed line. */
  letterheadLines: ["สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง", "เลขที่ 1 ซอยฉลองกรุง 1 เขตลาดกระบัง กรุงเทพฯ 10520"],
  signer: {
    name: "รองศาสตราจารย์ ดร.ทันตแพทย์หญิงอารยา พงษ์หาญยุทธ",
    position: "คณบดีคณะทันตแพทยศาสตร์",
  },
  /** Bottom-left block on page 1 (originating unit). Two spaces are intentional — matches the original letter. */
  footerUnit: "คณะทันตแพทยศาสตร์  ส่วนสนับสนุนวิชาการ",
  footerPhone: "โทรศัพท์ 0 2329 8000 ต่อ 2189",
} as const;

export const ACADEMIC_UNIT_LABEL = "งานสนับสนุนวิชาการ คณะทันตแพทยศาสตร์ สจล.";
