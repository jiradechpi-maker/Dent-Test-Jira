import React, { useState, useMemo } from 'react';
import {
  LetterData,
  DisbursementData,
  SystemStandard,
  DocumentHistoryItem,
  Lecturer
} from '../types';
import { OFFICIAL_INFO, DEFAULT_STD } from '../constants/defaults';
import { thaiBahtText, toThaiDigits } from '../utils/thaiFormatter';
import { exportDisbursementDocx } from '../utils/docxExport';
import {
  Download,
  Printer,
  FileCheck2,
  DollarSign,
  Receipt,
  Clock,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface DisbursementViewProps {
  currentLetter: LetterData;
  history: DocumentHistoryItem[];
  lecturers: Lecturer[];
  std: SystemStandard;
  logoUrl?: string;
  onNotification: (msg: string, type?: 'ok' | 'err' | 'warn') => void;
}

export type DisbursementDocType = 'acceptance' | 'requisition' | 'receipt' | 'timesheet' | 'all';

export const DisbursementView: React.FC<DisbursementViewProps> = ({
  currentLetter,
  history,
  lecturers,
  std,
  logoUrl,
  onNotification
}) => {
  // Matched lecturer extra data (e.g. bank info, ID card)
  const matchedLec = useMemo(() => {
    return lecturers.find((l) => l.n.trim() === currentLetter.lecturer.trim());
  }, [lecturers, currentLetter.lecturer]);

  // Form state
  const [selectedSourceId, setSelectedSourceId] = useState<string>('current');
  const [activeDoc, setActiveDoc] = useState<DisbursementDocType>('requisition');
  const [hourlyRate, setHourlyRate] = useState<number>(1000); // 1,000 THB/hr default for international program
  const [idCard, setIdCard] = useState<string>(matchedLec?.idCard || '1-1002-00123-45-6');
  const [address, setAddress] = useState<string>('คณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง');
  const [bankName, setBankName] = useState<string>(matchedLec?.bankName || 'ธนาคารกรุงไทย');
  const [bankAccount, setBankAccount] = useState<string>(matchedLec?.bankAccount || '085-0-12345-6');
  const [docDate, setDocDate] = useState<string>(currentLetter.issue_date || '๖ กันยายน ๒๕๖๙');

  // Active source data (either current letter or selected from history)
  const activeSource = useMemo(() => {
    if (selectedSourceId === 'current') return currentLetter;
    const found = history.find((h) => h.id === selectedSourceId);
    if (found) {
      return {
        letter_no: found.no,
        runNo: 0,
        issue_date: found.date,
        lecturer: found.lect,
        course: found.course,
        acadYear: found.year,
        stdYear: found.std,
        coName: found.co,
        coPhone: found.ph,
        coMail: found.mail,
        tableMode: found.mode,
        items: found.items
      };
    }
    return currentLetter;
  }, [selectedSourceId, currentLetter, history]);

  // Calculate total hours
  const totalHours = useMemo(() => {
    let sum = 0;
    activeSource.items.forEach((item) => {
      const arabic = item.hours.replace(/[๐-๙]/g, (d) => {
        const map: Record<string, string> = { '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4', '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9' };
        return map[d] || d;
      });
      const parsed = parseFloat(arabic);
      if (!isNaN(parsed)) sum += parsed;
    });
    return sum || (activeSource.items.length * 3); // default 3 hrs per session if blank
  }, [activeSource.items]);

  const totalAmount = useMemo(() => totalHours * hourlyRate, [totalHours, hourlyRate]);
  const totalAmountText = useMemo(() => thaiBahtText(totalAmount), [totalAmount]);

  const disbursementPayload: DisbursementData = {
    lecturer: activeSource.lecturer,
    course: activeSource.course,
    acadYear: activeSource.acadYear,
    stdYear: activeSource.stdYear,
    idCard,
    address,
    bankName,
    bankAccount,
    hourlyRate,
    lectureHours: totalHours,
    labHours: 0,
    totalHours,
    totalAmount,
    totalAmountText,
    items: activeSource.items,
    coName: activeSource.coName,
    deanName: OFFICIAL_INFO.dean,
    deanPos: OFFICIAL_INFO.deanPos,
    docDate
  };

  const handleExportWord = async (docType: DisbursementDocType) => {
    try {
      await exportDisbursementDocx(disbursementPayload, docType, std, logoUrl);
      onNotification('ส่งออกไฟล์ Word เอกสารเบิกจ่ายสำเร็จแล้ว ✅', 'ok');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onNotification('ส่งออกไฟล์ไม่สำเร็จ: ' + msg, 'err');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Banner Notice */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#F4EDFA] via-[#ECE0F7] to-[#E3D0F2] border border-[#E0D2EC] flex items-start gap-3 no-print">
        <Sparkles className="w-5 h-5 text-[#6B00AD] shrink-0 mt-0.5" />
        <div className="text-xs text-[#2B0043] leading-relaxed">
          <span className="font-bold text-[#4F0080]">โมดูลชุดเอกสารเบิกจ่ายค่าสอนอาจารย์พิเศษ (พร้อมใช้งานสมบูรณ์):</span>
          <br />
          ดึงข้อมูลอัตโนมัติจากหนังสือเชิญ เพื่อสร้างเอกสารครบ ๔ แบบฟอร์มราชการตามระเบียบการเงิน สจล.:{' '}
          <strong>๑. แบบตอบรับการเป็นอาจารย์พิเศษ</strong> ·{' '}
          <strong>๒. ใบเบิกเงินค่าตอบแทนอาจารย์พิเศษ</strong> ·{' '}
          <strong>๓. ใบสำคัญรับเงิน</strong> ·{' '}
          <strong>๔. ใบลงเวลาปฏิบัติงานและหัวข้อการสอน</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4 items-start">
        {/* Left Form Controls */}
        <div className="space-y-3.5 no-print">
          {/* Source Selector */}
          <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2">
              <h3 className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
                <span>🔄</span>
                <span>เลือกที่มาของข้อมูล</span>
              </h3>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                เอกสารต้นฉบับ
              </label>
              <select
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
              >
                <option value="current">
                  📄 ฉบับปัจจุบันในฟอร์ม ({currentLetter.letter_no} - {currentLetter.lecturer})
                </option>
                {history.map((h) => (
                  <option key={h.id} value={h.id}>
                    🗂️ {h.no} · {h.lect} ({h.course})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-2.5 rounded-lg bg-[#F8F5FA] border border-[#EFE7F6] text-[11px] space-y-1 text-[#241033]">
              <div>
                <strong>อาจารย์:</strong> {activeSource.lecturer}
              </div>
              <div>
                <strong>รายวิชา:</strong> {activeSource.course} ({activeSource.acadYear})
              </div>
              <div>
                <strong>จำนวนคาบสอน:</strong> {activeSource.items.length} คาบ ({totalHours} ชั่วโมง)
              </div>
            </div>
          </div>

          {/* Rate & Finance Settings */}
          <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2">
              <h3 className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                <span>การคำนวณค่าตอบแทน</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                  อัตราชั่วโมงละ (บาท)
                </label>
                <input
                  type="number"
                  step="100"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#6B00AD]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                  จำนวนชั่วโมงรวม
                </label>
                <div className="px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#F2EBF8] text-xs font-bold text-[#4F0080]">
                  {totalHours} ชั่วโมง
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#E8F7EF] border border-[#C5ECD6] text-xs space-y-1">
              <div className="flex justify-between items-center text-[#1F8A5B]">
                <span className="font-semibold">รวมเป็นเงินทั้งสิ้น:</span>
                <span className="text-base font-bold">
                  {totalAmount.toLocaleString()} บาท
                </span>
              </div>
              <div className="text-[11px] text-[#1F8A5B] font-medium pt-1 border-t border-[#C5ECD6]/50">
                ตัวอักษร: &quot;{totalAmountText}&quot;
              </div>
            </div>
          </div>

          {/* Lecturer Disbursement Extra Info */}
          <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2">
              <h3 className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
                <span>🏦</span>
                <span>ข้อมูลผู้รับเงิน & บัญชีธนาคาร</span>
              </h3>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                เลขประจำตัวประชาชน (สำหรับใบสำคัญรับเงิน)
              </label>
              <input
                type="text"
                value={idCard}
                onChange={(e) => setIdCard(e.target.value)}
                placeholder="1-1002-00123-45-6"
                className="w-full px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                ที่อยู่ตามบัตรประชาชน / สังกัด
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                  ธนาคาร
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="ธนาคารกรุงไทย"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                  เลขที่บัญชี
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="085-0-12345-6"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                วันที่ลงในเอกสาร
              </label>
              <input
                type="text"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
              />
            </div>
          </div>

          {/* Quick Export Actions */}
          <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-2.5">
            <div className="text-xs font-bold text-[#4F0080]">
              📦 ส่งออกไฟล์ Word (.docx)
            </div>
            <button
              onClick={() => handleExportWord('all')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#4F0080] hover:bg-[#3D0063] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>ส่งออกครบชุด ๔ แบบฟอร์ม (.docx)</span>
            </button>
            <button
              onClick={() => handleExportWord(activeDoc)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#F2EBF8] hover:bg-[#E8DCF4] text-[#4F0080] text-xs font-semibold transition-colors cursor-pointer border border-[#E7DEF0]"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดเฉพาะแบบฟอร์มที่เลือก (.docx)</span>
            </button>
          </div>
        </div>

        {/* Right Preview Column */}
        <div className="space-y-3">
          {/* Form Tabs */}
          <div className="bg-white border border-[#E7DEF0] rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto no-print">
            <button
              onClick={() => setActiveDoc('requisition')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeDoc === 'requisition'
                  ? 'bg-[#4F0080] text-white shadow-xs'
                  : 'text-[#5C4A6E] hover:bg-[#F4EDFA]'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>๑. ใบเบิกค่าตอบแทน</span>
            </button>

            <button
              onClick={() => setActiveDoc('receipt')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeDoc === 'receipt'
                  ? 'bg-[#4F0080] text-white shadow-xs'
                  : 'text-[#5C4A6E] hover:bg-[#F4EDFA]'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>๒. ใบสำคัญรับเงิน</span>
            </button>

            <button
              onClick={() => setActiveDoc('acceptance')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeDoc === 'acceptance'
                  ? 'bg-[#4F0080] text-white shadow-xs'
                  : 'text-[#5C4A6E] hover:bg-[#F4EDFA]'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>๓. แบบตอบรับอาจารย์</span>
            </button>

            <button
              onClick={() => setActiveDoc('timesheet')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeDoc === 'timesheet'
                  ? 'bg-[#4F0080] text-white shadow-xs'
                  : 'text-[#5C4A6E] hover:bg-[#F4EDFA]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>๔. ใบลงเวลาสอน</span>
            </button>

            <button
              onClick={() => setActiveDoc('all')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ml-auto transition-all ${
                activeDoc === 'all'
                  ? 'bg-[#1F8A5B] text-white shadow-xs'
                  : 'text-[#1F8A5B] hover:bg-[#E8F7EF]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>แสดงครบ ๔ ฟอร์ม</span>
            </button>
          </div>

          {/* Document Viewer Container */}
          <div className="overflow-auto max-h-[calc(100vh-170px)] rounded-xl bg-[#EBE3F3] p-4 border border-[#E7DEF0] print-area">
            <div
              className="origin-top"
              style={{
                fontFamily: "'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', sans-serif",
                fontSize: '11pt',
                lineHeight: 1.45
              }}
            >
              {/* Form 1: ใบเบิกเงินค่าตอบแทน */}
              {(activeDoc === 'requisition' || activeDoc === 'all') && (
                <div className="a4-document-page mb-6">
                  <div className="text-center font-bold text-base mb-1">
                    ใบเบิกเงินค่าตอบแทนอาจารย์พิเศษ
                  </div>
                  <div className="text-center text-sm font-semibold mb-3">
                    คณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง
                  </div>
                  <div className="text-right mb-4">วันที่ {docDate}</div>

                  <div className="space-y-2 mb-6">
                    <div>
                      <strong>๑. ชื่ออาจารย์พิเศษ:</strong> {activeSource.lecturer}
                    </div>
                    <div>
                      <strong>๒. สังกัด/ที่อยู่:</strong> {address}
                    </div>
                    <div>
                      <strong>๓. รายวิชาที่สอน:</strong> {activeSource.course} (หลักสูตรทันตแพทยศาสตรบัณฑิต นานาชาติ)
                    </div>
                    <div>
                      <strong>๔. ปีการศึกษา:</strong> {activeSource.acadYear} {activeSource.stdYear}
                    </div>
                    <div>
                      <strong>๕. จำนวนชั่วโมงสอนรวม:</strong> {totalHours} ชั่วโมง อัตราชั่วโมงละ {hourlyRate.toLocaleString()} บาท
                    </div>
                    <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200">
                      <strong>๖. รวมเป็นเงินทั้งสิ้น:</strong>{' '}
                      <span className="text-base font-bold text-[#4F0080]">
                        {totalAmount.toLocaleString()} บาท
                      </span>{' '}
                      (ตัวอักษร: <strong>{totalAmountText}</strong>)
                    </div>
                  </div>

                  <div className="flex justify-end mt-6 text-center">
                    <div>
                      <div>(ลงชื่อ)....................................................................ผู้ขอเบิก</div>
                      <div className="mt-1">({activeSource.coName})</div>
                      <div className="text-xs text-neutral-600">ผู้ประสานงานรายวิชา</div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-dashed border-neutral-300">
                    <div className="font-bold mb-1">คำรับรองการปฏิบัติงาน:</div>
                    <p className="indent-6 text-justify">
                      ขอรับรองว่าอาจารย์พิเศษได้ปฏิบัติการสอนตามตารางที่กำหนดจริง มีผลการปฏิบัติงานเป็นที่เรียบร้อย ครบถ้วนตามวัตถุประสงค์ของการจัดการเรียนการสอน
                    </p>
                    <div className="flex justify-end mt-6 text-center">
                      <div>
                        <div>(ลงชื่อ)....................................................................ผู้อนุมัติ</div>
                        <div className="mt-1">{OFFICIAL_INFO.dean}</div>
                        <div className="text-xs text-neutral-600">{OFFICIAL_INFO.deanPos}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form 2: ใบสำคัญรับเงิน */}
              {(activeDoc === 'receipt' || activeDoc === 'all') && (
                <div className="a4-document-page mb-6">
                  <div className="text-center font-bold text-base mb-1">
                    ใบสำคัญรับเงิน
                  </div>
                  <div className="text-right text-sm">ที่ คณะทันตแพทยศาสตร์ สจล.</div>
                  <div className="text-right text-sm mb-4">วันที่ {docDate}</div>

                  <p className="doc-body text-justify mb-3">
                    ข้าพเจ้า <strong className="font-bold">{activeSource.lecturer}</strong> อยู่บ้านเลขที่ {address} บัตรประจำตัวประชาชนเลขที่ {idCard} ได้รับเงินจาก {OFFICIAL_INFO.facultyFull} ดังรายการต่อไปนี้
                  </p>

                  <table className="sched-doc mb-3">
                    <thead>
                      <tr>
                        <th style={{ width: '70%' }}>รายการ</th>
                        <th style={{ width: '30%' }}>จำนวนเงิน (บาท)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3">
                          <div className="font-semibold">
                            ค่าตอบแทนการสอนอาจารย์พิเศษ รายวิชา {activeSource.course}
                          </div>
                          <div className="text-xs text-neutral-700 mt-1">
                            จำนวน {totalHours} ชั่วโมง @ {hourlyRate.toLocaleString()} บาท/ชั่วโมง
                          </div>
                          <div className="text-xs text-neutral-700 mt-1">
                            (ตัวอักษร: {totalAmountText})
                          </div>
                        </td>
                        <td className="text-right font-bold p-3 align-top">
                          {totalAmount.toLocaleString()}.-
                        </td>
                      </tr>
                      <tr>
                        <td className="font-bold text-right py-2">รวมเงิน</td>
                        <td className="font-bold text-right py-2">{totalAmount.toLocaleString()}.-</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="font-bold mb-6">
                    จำนวนเงิน (ตัวอักษร): {totalAmountText}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8 text-center">
                    <div>
                      <div>(ลงชื่อ)....................................................................ผู้จ่ายเงิน</div>
                      <div className="mt-1">({activeSource.coName})</div>
                      <div className="text-xs text-neutral-600">เจ้าหน้าที่ผู้ประสานงาน</div>
                    </div>
                    <div>
                      <div>(ลงชื่อ)....................................................................ผู้รับเงิน</div>
                      <div className="mt-1">({activeSource.lecturer})</div>
                      <div className="text-xs text-neutral-600">อาจารย์พิเศษผู้สอน</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form 3: แบบตอบรับอาจารย์พิเศษ */}
              {(activeDoc === 'acceptance' || activeDoc === 'all') && (
                <div className="a4-document-page mb-6">
                  <div className="text-center font-bold text-base mb-1">
                    แบบตอบรับการเป็นอาจารย์พิเศษ
                  </div>
                  <div className="text-center text-sm mb-4">
                    คณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง
                  </div>
                  <div className="text-right text-sm mb-4">วันที่ {docDate}</div>

                  <div className="mb-3">
                    <strong>เรียน:</strong> คณบดีคณะทันตแพทยศาสตร์
                  </div>

                  <p className="doc-body text-justify mb-4">
                    ตามที่ คณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง ได้มีหนังสือเชิญข้าพเจ้า <strong className="font-bold">{activeSource.lecturer}</strong> เป็นอาจารย์พิเศษสอนในรายวิชา <strong className="font-bold">{activeSource.course}</strong> ปีการศึกษา {activeSource.acadYear} ให้แก่นักศึกษาระดับปริญญาตรี {activeSource.stdYear} นั้น
                  </p>

                  <p className="doc-body text-justify mb-6">
                    ข้าพเจ้า <strong>ขอตอบรับการเป็นอาจารย์พิเศษ</strong> ตามวัน เวลา และหัวข้อการสอนตามที่ได้รับมอบหมาย โดยยินดีปฏิบัติตามระเบียบและข้อบังคับของสถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบังทุกประการ
                  </p>

                  <div className="border border-neutral-300 rounded-lg p-3 bg-neutral-50 mb-6 space-y-1.5 text-xs">
                    <div className="font-bold text-[#4F0080]">
                      ข้อมูลสำหรับการโอนเงินค่าตอบแทนเข้าบัญชีธนาคาร:
                    </div>
                    <div>• <strong>ชื่อบัญชี:</strong> {activeSource.lecturer}</div>
                    <div>• <strong>ธนาคาร:</strong> {bankName}</div>
                    <div>• <strong>เลขที่บัญชี:</strong> {bankAccount}</div>
                  </div>

                  <div className="flex justify-end mt-12 text-center">
                    <div>
                      <div>(ลงชื่อ)....................................................................</div>
                      <div className="mt-1 font-semibold">({activeSource.lecturer})</div>
                      <div className="text-xs text-neutral-600">อาจารย์พิเศษผู้สอน</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form 4: ใบลงเวลาปฏิบัติงานและหัวข้อการสอน */}
              {(activeDoc === 'timesheet' || activeDoc === 'all') && (
                <div className="a4-document-page">
                  <div className="text-center font-bold text-base mb-1">
                    ใบลงเวลาปฏิบัติงานและหัวข้อการสอนอาจารย์พิเศษ
                  </div>
                  <div className="text-center text-sm mb-3">
                    คณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง
                  </div>

                  <div className="flex justify-between text-xs mb-3">
                    <div><strong>อาจารย์พิเศษ:</strong> {activeSource.lecturer}</div>
                    <div><strong>วิชา:</strong> {activeSource.course} ({activeSource.acadYear})</div>
                  </div>

                  <table className="sched-doc mb-4">
                    <thead>
                      <tr>
                        <th style={{ width: '15%' }}>วันที่</th>
                        <th style={{ width: '18%' }}>เวลา</th>
                        <th>หัวข้อการสอน</th>
                        <th style={{ width: '10%' }}>ชม.</th>
                        <th style={{ width: '15%' }}>ลายมือชื่อ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSource.items.map((row, idx) => (
                        <tr key={row.id || idx}>
                          <td className="text-center text-xs">{row.date}</td>
                          <td className="text-center text-xs">{row.time}</td>
                          <td className="text-xs">{row.topic}</td>
                          <td className="text-center font-semibold text-xs">{row.hours}</td>
                          <td className="text-center text-neutral-400 text-xs">..................</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={3} className="text-right font-bold py-1.5 pr-2">
                          รวมชั่วโมงสอนทั้งสิ้น
                        </td>
                        <td className="text-center font-bold text-[#4F0080] py-1.5">
                          {totalHours}
                        </td>
                        <td className="text-center text-xs font-semibold">ชั่วโมง</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="grid grid-cols-2 gap-4 mt-8 text-center text-xs">
                    <div>
                      <div>(ลงชื่อ)....................................................................ผู้สอน</div>
                      <div className="mt-1">({activeSource.lecturer})</div>
                      <div className="text-neutral-500">อาจารย์พิเศษ</div>
                    </div>
                    <div>
                      <div>(ลงชื่อ)....................................................................ผู้ตรวจรับรอง</div>
                      <div className="mt-1">({activeSource.coName})</div>
                      <div className="text-neutral-500">ผู้ประสานงานรายวิชา</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
