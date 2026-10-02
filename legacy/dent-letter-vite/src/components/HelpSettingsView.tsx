import React, { useRef } from 'react';
import { SystemStandard } from '../types';
import {
  HelpCircle,
  Printer,
  Upload,
  RotateCcw,
  CheckCircle2,
  FileCheck,
  Save,
  Download,
  AlertCircle
} from 'lucide-react';

interface HelpSettingsViewProps {
  std: SystemStandard;
  logoUrl?: string;
  hasCustomLogo: boolean;
  onUploadLogo: (dataUrl: string) => void;
  onResetLogo: () => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => void;
  onNotification: (msg: string, type?: 'ok' | 'err' | 'warn') => void;
}

export const HelpSettingsView: React.FC<HelpSettingsViewProps> = ({
  std,
  logoUrl,
  hasCustomLogo,
  onUploadLogo,
  onResetLogo,
  onExportBackup,
  onImportBackup,
  onNotification
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        onUploadLogo(result);
        onNotification('อัปโหลดและบันทึกตราสัญลักษณ์ สจล. เรียบร้อยแล้ว ✅', 'ok');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        onImportBackup(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Column 1: Logo & Printer */}
      <div className="space-y-4">
        {/* Logo Card */}
        <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2">
            <h3 className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
              <span>🏛️</span>
              <span>ตราสัญลักษณ์ สจล. (KMITL Emblem)</span>
            </h3>
            <span className="text-[10px] font-semibold text-[#1F8A5B] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{hasCustomLogo ? 'ใช้รูปที่อัปโหลด' : 'ใช้ตรามาตรฐานระบบ'}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 p-3 bg-[#FCFAFE] border border-[#E7DEF0] rounded-lg">
            <div className="w-16 h-16 rounded-lg bg-white border border-[#E7DEF0] p-1.5 flex items-center justify-center shrink-0 shadow-xs">
              {logoUrl ? (
                <img src={logoUrl} alt="ตราสัญลักษณ์ สจล." className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-[10px] text-[#7A6A88]">ไม่มีรูป</span>
              )}
            </div>
            <div className="text-xs space-y-1">
              <div className="font-semibold text-[#241033]">
                ตราสัญลักษณ์ คณะทันตแพทยศาสตร์ สจล.
              </div>
              <div className="text-[11px] text-[#7A6A88]">
                ขนาดมาตรฐาน ๓.๐ ซม. สำหรับหัวกระดาษราชการ และฝังลงในไฟล์ Word (.docx)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#4F0080] hover:bg-[#3D0063] text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>อัปโหลดรูปภาพใหม่ (PNG / JPG / SVG)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {hasCustomLogo && (
              <button
                onClick={onResetLogo}
                className="px-3 py-2 rounded-lg bg-[#F2EBF8] hover:bg-[#E8DCF4] text-[#4F0080] text-xs font-semibold transition-colors cursor-pointer"
                title="กลับไปใช้ตรามาตรฐานระบบ"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Printer Guide */}
        <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2">
            <h3 className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
              <Printer className="w-4 h-4" />
              <span>การตั้งค่าเครื่องพิมพ์สำหรับบันทึก PDF</span>
            </h3>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#F9F5FC] text-[#4F0080] border-b border-[#E7DEF0]">
                <th className="py-1.5 px-2.5 text-left font-semibold">หัวข้อในหน้าต่างพิมพ์</th>
                <th className="py-1.5 px-2.5 text-left font-semibold">ค่าที่ต้องเลือก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EBF8]">
              <tr>
                <td className="py-2 px-2.5 font-medium text-[#241033]">ปลายทาง (Destination)</td>
                <td className="py-2 px-2.5 font-semibold text-[#1F8A5B]">บันทึกเป็น PDF (Save as PDF)</td>
              </tr>
              <tr>
                <td className="py-2 px-2.5 font-medium text-[#241033]">ขนาดกระดาษ (Paper size)</td>
                <td className="py-2 px-2.5 font-semibold text-[#4F0080]">A4 (210 x 297 mm)</td>
              </tr>
              <tr>
                <td className="py-2 px-2.5 font-medium text-[#241033]">ระยะขอบ (Margins)</td>
                <td className="py-2 px-2.5 font-semibold text-[#B4003C]">ไม่มี (None) *สำคัญมาก</td>
              </tr>
              <tr>
                <td className="py-2 px-2.5 font-medium text-[#241033]">ส่วนหัวและส่วนท้าย (Headers &amp; Footers)</td>
                <td className="py-2 px-2.5 text-[#241033]">ยกเลิกการเลือก (Uncheck)</td>
              </tr>
              <tr>
                <td className="py-2 px-2.5 font-medium text-[#241033]">กราฟิกพื้นหลัง (Background graphics)</td>
                <td className="py-2 px-2.5 font-semibold text-[#1F8A5B]">เลือกเปิดใช้งาน (Checked)</td>
              </tr>
              <tr>
                <td className="py-2 px-2.5 font-medium text-[#241033]">มาตราส่วน (Scale)</td>
                <td className="py-2 px-2.5 font-semibold text-[#4F0080]">100% (พอดี 1:1)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Column 2: Standards & Backup */}
      <div className="space-y-4">
        {/* Standard Specs */}
        <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2">
            <h3 className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
              <FileCheck className="w-4 h-4" />
              <span>ค่ามาตรฐานเอกสารราชการ คณะทันตะ สจล.</span>
            </h3>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#F9F5FC] text-[#4F0080] border-b border-[#E7DEF0]">
                <th className="py-1.5 px-2.5 text-left font-semibold">พารามิเตอร์</th>
                <th className="py-1.5 px-2.5 text-right font-semibold">ค่าที่ระบบกำหนด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EBF8]">
              <tr>
                <td className="py-1.5 px-2.5 text-[#241033]">ขนาดฟอนต์ (Font Size)</td>
                <td className="py-1.5 px-2.5 text-right font-semibold text-[#4F0080]">{std.fs} pt (TH Sarabun PSK)</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2.5 text-[#241033]">ระยะห่างบรรทัด (Line Height)</td>
                <td className="py-1.5 px-2.5 text-right text-[#7A6A88]">{std.lh} เท่า</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2.5 text-[#241033]">ระยะช่องไฟอักษร (Letter Spacing)</td>
                <td className="py-1.5 px-2.5 text-right text-[#7A6A88]">{std.lsp} px</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2.5 text-[#241033]">ระยะขอบ บน / ล่าง / ซ้าย / ขวา</td>
                <td className="py-1.5 px-2.5 text-right font-semibold text-[#241033]">{std.mT} / {std.mB} / {std.mL} / {std.mR} ซม.</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2.5 text-[#241033]">ระยะย่อหน้าเนื้อหา (Indent)</td>
                <td className="py-1.5 px-2.5 text-right font-semibold text-[#1F8A5B]">{std.rIndent} ซม.</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2.5 text-[#241033]">ระยะบรรทัดวันที่ (Date Tab)</td>
                <td className="py-1.5 px-2.5 text-right font-semibold text-[#C97A00]">{std.rDate} ซม.</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2.5 text-[#241033]">ความสูงตราสัญลักษณ์ สจล.</td>
                <td className="py-1.5 px-2.5 text-right font-semibold text-[#4F0080]">{std.logoH} ซม.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Database Backup & Restore */}
        <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2">
            <h3 className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
              <Save className="w-4 h-4" />
              <span>สำรอง &amp; นำเข้าฐานข้อมูล (Backup &amp; Restore)</span>
            </h3>
          </div>

          <div className="text-[11px] text-[#7A6A88]">
            ส่งออกข้อมูลทะเบียนอาจารย์ คลังวิชา และประวัติเอกสารทั้งหมดเป็นไฟล์ JSON เพื่อย้ายเครื่องหรือเก็บสำรอง
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onExportBackup}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#F2EBF8] hover:bg-[#E8DCF4] text-[#4F0080] text-xs font-semibold border border-[#E7DEF0] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออกสำรอง (JSON)</span>
            </button>

            <button
              onClick={() => backupInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#FCFAFE] hover:bg-[#F2EBF8] text-[#4F0080] text-xs font-semibold border border-[#E7DEF0] transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>นำเข้าข้อมูลสำรอง</span>
            </button>
            <input
              ref={backupInputRef}
              type="file"
              accept=".json"
              onChange={handleBackupUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
