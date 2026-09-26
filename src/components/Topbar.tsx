import React from 'react';
import { Download, Printer, CheckCircle, AlertTriangle, XCircle, Undo2, Redo2, Save, FolderOpen } from 'lucide-react';
import { ViewTab } from './Sidebar';

interface TopbarProps {
  currentTab: ViewTab;
  onExportDocx: () => void;
  onPrint: () => void;
  alert: { message: string; type: 'ok' | 'err' | 'warn' } | null;
  onDismissAlert: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onSaveDraft?: () => void;
  lastSavedTime?: string;
  draftsCount?: number;
  onOpenDraftsModal?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentTab,
  onExportDocx,
  onPrint,
  alert,
  onDismissAlert,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onSaveDraft,
  lastSavedTime,
  draftsCount = 0,
  onOpenDraftsModal
}) => {
  const titles: Record<ViewTab, { title: string; subtitle: string }> = {
    dash: {
      title: 'ภาพรวมระบบงานสารบรรณ',
      subtitle: 'สรุปสถานะฐานข้อมูลอาจารย์ รายวิชา ประวัติเอกสาร และค่ามาตรฐานราชการ สจล.'
    },
    create: {
      title: 'สร้างหนังสือเชิญอาจารย์พิเศษ',
      subtitle: 'กรอกข้อมูล ตรวจสอบตัวอย่าง A4 เสมือนจริง พร้อมส่งออกไฟล์ Word (.docx) และ PDF ทันที'
    },
    batch: {
      title: 'นำเข้าข้อมูลหลายฉบับจาก Excel',
      subtitle: 'สร้างหนังสือเชิญครั้งละหลายสิบฉบับพร้อมกัน แล้วดาวน์โหลดเป็นไฟล์ ZIP ไฟล์เดียว'
    },
    lect: {
      title: 'ทะเบียนอาจารย์พิเศษ',
      subtitle: 'จัดการรายชื่อ คำนำหน้า ตำแหน่งทางวิชาการ สังกัด และข้อมูลสำหรับเบิกจ่ายค่าสอน'
    },
    course: {
      title: 'คลังหลักสูตรและรายวิชาทันตแพทย์',
      subtitle: 'ฐานข้อมูลรายวิชาและโครงสร้างชั้นปี ๑ – ๖ คณะทันตแพทยศาสตร์ สจล.'
    },
    hist: {
      title: 'ประวัติเอกสารที่ออกแล้ว',
      subtitle: 'สืบค้น เรียกคืนข้อมูลกลับสู่แบบฟอร์ม หรือดาวน์โหลดไฟล์ Word ย้อนหลังได้ทุกฉบับ'
    },
    pay: {
      title: 'ชุดเอกสารเบิกจ่ายค่าตอบแทนอาจารย์พิเศษ',
      subtitle: 'สร้างครบชุด ๔ แบบฟอร์ม: ใบเบิกค่าตอบแทน · ใบสำคัญรับเงิน · แบบตอบรับ · ใบลงเวลาสอน'
    },
    help: {
      title: 'คู่มือการใช้งาน & ตั้งค่าระบบ',
      subtitle: 'คำแนะนำการตั้งค่าเครื่องพิมพ์ PDF ตราสัญลักษณ์ สจล. และสำรองฐานข้อมูล'
    }
  };

  const { title, subtitle } = titles[currentTab] || titles.create;

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-[#E7DEF0] shadow-xs no-print">
      {/* Main Bar */}
      <div className="px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-[#241033] tracking-tight">{title}</h2>
          <p className="text-xs text-[#7A6A88] mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Last Saved Status */}
          {lastSavedTime && (
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-[#7A6A88] bg-[#FAF8FC] px-2.5 py-1 rounded-lg border border-[#EFE7F6]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>บันทึกร่างแล้ว ({lastSavedTime})</span>
            </div>
          )}

          {/* Save Draft Button */}
          {onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8FC] hover:bg-[#F2EBF8] text-[#4F0080] border border-[#DECBEF] text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="บันทึกโครงร่างเอกสารลงในเบราว์เซอร์ทันที (เมื่อเข้ามาใหม่ข้อมูลจะคงอยู่เหมือนเดิม)"
            >
              <Save className="w-3.5 h-3.5 text-[#4F0080]" />
              <span>บันทึกโครงร่าง</span>
            </button>
          )}

          {/* Open Drafts Library Button */}
          {onOpenDraftsModal && (
            <button
              type="button"
              onClick={onOpenDraftsModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8FC] hover:bg-[#F2EBF8] text-[#5C4A6E] border border-[#DECBEF] text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="เปิดดูและเรียกคืนโครงร่างที่บันทึกไว้"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#4F0080]" />
              <span className="hidden md:inline">โครงร่าง</span>
              {draftsCount > 0 && (
                <span className="text-[10px] bg-[#4F0080] text-white px-1.5 py-0.2 rounded-full font-bold">
                  {draftsCount}
                </span>
              )}
            </button>
          )}

          {onUndo && (
            <div className="flex items-center gap-1 border-r border-[#E7DEF0] pr-2 mr-0.5">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  canUndo
                    ? 'bg-[#FAF8FC] hover:bg-[#F2EBF8] text-[#4F0080] border border-[#DECBEF] cursor-pointer shadow-2xs active:scale-95'
                    : 'text-[#C9BFD5] bg-neutral-50 border border-neutral-200 cursor-not-allowed opacity-50'
                }`}
                title="ย้อนกลับการแก้ไข (Undo: Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ย้อนกลับ</span>
              </button>

              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  canRedo
                    ? 'bg-[#FAF8FC] hover:bg-[#F2EBF8] text-[#4F0080] border border-[#DECBEF] cursor-pointer shadow-2xs active:scale-95'
                    : 'text-[#C9BFD5] bg-neutral-50 border border-neutral-200 cursor-not-allowed opacity-50'
                }`}
                title="ทำซ้ำการแก้ไข (Redo: Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ทำซ้ำ</span>
              </button>
            </div>
          )}

          <button
            onClick={onExportDocx}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1F8A5B] hover:bg-[#186f49] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            title="ดาวน์โหลดไฟล์ Microsoft Word (.docx) ตามรูปแบบมาตรฐานราชการ"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด Word</span>
          </button>

          <button
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#4F0080] hover:bg-[#3E0065] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            title="พิมพ์เอกสารออกเครื่องพิมพ์ หรือบันทึกเป็น PDF (ตรงตามหน้าพรีวิว 100%)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด PDF / สั่งพิมพ์</span>
          </button>
        </div>
      </div>

      {/* Alert Notification Strip */}
      {alert && (
        <div
          className={`px-6 py-2 text-xs font-medium flex items-center justify-between transition-all ${
            alert.type === 'ok'
              ? 'bg-[#E8F7EF] text-[#1F8A5B] border-l-4 border-[#1F8A5B]'
              : alert.type === 'err'
              ? 'bg-[#FDE9EF] text-[#B4003C] border-l-4 border-[#B4003C]'
              : 'bg-[#FFF6E4] text-[#C97A00] border-l-4 border-[#C97A00]'
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === 'ok' && <CheckCircle className="w-4 h-4 shrink-0" />}
            {alert.type === 'err' && <XCircle className="w-4 h-4 shrink-0" />}
            {alert.type === 'warn' && <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{alert.message}</span>
          </div>
          <button
            onClick={onDismissAlert}
            className="text-[11px] underline opacity-70 hover:opacity-100 cursor-pointer ml-4"
          >
            ปิด
          </button>
        </div>
      )}
    </div>
  );
};
