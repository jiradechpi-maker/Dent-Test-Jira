import React, { useState } from 'react';
import { LetterData, SystemStandard } from '../types';
import { downloadExcelTemplate, parseExcelBatch } from '../utils/excelBatch';
import { exportBatchZip } from '../utils/docxExport';
import {
  FileSpreadsheet,
  UploadCloud,
  Archive,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

interface BatchImportViewProps {
  std: SystemStandard;
  logoUrl?: string;
  onNotification: (msg: string, type?: 'ok' | 'err' | 'warn') => void;
}

export const BatchImportView: React.FC<BatchImportViewProps> = ({
  std,
  logoUrl,
  onNotification
}) => {
  const [batchItems, setBatchItems] = useState<LetterData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const buffer = ev.target?.result as ArrayBuffer;
        const parsed = parseExcelBatch(buffer, std.thaiNum);
        setBatchItems(parsed);
        onNotification(`นำเข้าข้อมูลจาก Excel สำเร็จ ${parsed.length} ฉบับ ✅`, 'ok');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        onNotification(`อ่านไฟล์ Excel ไม่สำเร็จ: ${msg}`, 'err');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportZip = async () => {
    if (batchItems.length === 0) {
      onNotification('ยังไม่มีข้อมูลสำหรับสร้างไฟล์ กรุณาอัปโหลด Excel ก่อน', 'warn');
      return;
    }
    setIsProcessing(true);
    setProgress({ current: 0, total: batchItems.length });
    try {
      await exportBatchZip(batchItems, std, logoUrl, (current, total) => {
        setProgress({ current, total });
      });
      onNotification(`สร้างไฟล์ ZIP สำเร็จครบทั้ง ${batchItems.length} ฉบับแล้ว ✅`, 'ok');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onNotification(`สร้าง ZIP ไม่สำเร็จ: ${msg}`, 'err');
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 items-start">
      {/* 3 Steps Process Left Column */}
      <div className="space-y-3.5">
        {/* Step 1: Template */}
        <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#4F0080]">
            <span className="w-5 h-5 rounded-full bg-[#F2EBF8] text-[#4F0080] flex items-center justify-center text-[11px]">
              ๑
            </span>
            <span>ดาวน์โหลดไฟล์ต้นแบบ</span>
          </div>
          <button
            onClick={downloadExcelTemplate}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-[#F2EBF8] hover:bg-[#E8DCF4] text-[#4F0080] text-xs font-semibold border border-[#E3D5F0] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ดาวน์โหลด template_หนังสือเชิญ.xlsx</span>
          </button>
          <div className="text-[11px] text-[#7A6A88] leading-relaxed">
            คอลัมน์มาตรฐาน:{' '}
            <code className="text-[#4F0080] font-mono text-[10px] bg-[#F9F5FC] px-1 py-0.5 rounded">
              key, letter_no, issue_date, lecturer, course, academic_year, student_year, coordinator, phone, email, sched_date, sched_time, topic, hours
            </code>
            <br />
            <span className="text-[#C97A00] font-medium mt-1 inline-block">
              * หนังสือ ๑ ฉบับที่มีหลายคาบสอน ให้ใส่ key เดียวกัน ระบบจะรวมตารางหน้า ๒ ให้อัตโนมัติ
            </span>
          </div>
        </div>

        {/* Step 2: Upload */}
        <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#4F0080]">
            <span className="w-5 h-5 rounded-full bg-[#F2EBF8] text-[#4F0080] flex items-center justify-center text-[11px]">
              ๒
            </span>
            <span>อัปโหลดไฟล์ Excel ของคุณ</span>
          </div>
          <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-[#C4AED4] hover:border-[#6B00AD] rounded-xl bg-[#FCFAFE] cursor-pointer transition-colors group">
            <UploadCloud className="w-8 h-8 text-[#8B2FC9] group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs font-semibold text-[#241033]">
              คลิกเพื่อเลือกไฟล์ .xlsx หรือ .xls
            </span>
            <span className="text-[10px] text-[#7A6A88] mt-0.5">
              รองรับไฟล์จาก Microsoft Excel ทุกเวอร์ชัน
            </span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Step 3: Produce ZIP */}
        <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#4F0080]">
            <span className="w-5 h-5 rounded-full bg-[#F2EBF8] text-[#4F0080] flex items-center justify-center text-[11px]">
              ๓
            </span>
            <span>สร้างไฟล์ทั้งหมด & ดาวน์โหลด ZIP</span>
          </div>
          <button
            disabled={batchItems.length === 0 || isProcessing}
            onClick={handleExportZip}
            className={`w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold shadow-xs transition-all ${
              batchItems.length === 0 || isProcessing
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : 'bg-[#1F8A5B] hover:bg-[#186f49] text-white cursor-pointer active:scale-98'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>
              {isProcessing
                ? `กำลังประมวลผล (${progress?.current}/${progress?.total})...`
                : `สร้างทั้งหมด (${batchItems.length} ฉบับ) → ดาวน์โหลด ZIP`}
            </span>
          </button>
          <div className="text-[11px] text-[#7A6A88]">
            ทุกไฟล์ถูกตั้งค่าตามมาตรฐานฟอนต์ ๑๐pt ขอบกระดาษราชการ และตาราง ๒ หน้าเป๊ะ
          </div>
        </div>
      </div>

      {/* Right Column: Preview Table */}
      <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2.5">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#4F0080]" />
            <h3 className="text-xs font-bold text-[#4F0080]">
              รายการเอกสารที่จะสร้าง ({batchItems.length} ฉบับ)
            </h3>
          </div>
          {batchItems.length > 0 && (
            <button
              onClick={() => setBatchItems([])}
              className="text-[11px] text-[#B4003C] hover:underline"
            >
              ล้างรายการนำเข้า
            </button>
          )}
        </div>

        {batchItems.length === 0 ? (
          <div className="text-center py-16 text-xs text-[#7A6A88]">
            <FileSpreadsheet className="w-10 h-10 text-[#C4AED4] mx-auto mb-2 opacity-40" />
            <div>ยังไม่มีข้อมูลนำเข้า</div>
            <div className="text-[11px] text-[#7A6A88]/70 mt-1">
              ดาวน์โหลดไฟล์ต้นแบบ กรอกข้อมูลอาจารย์และรายวิชา แล้วอัปโหลดทางซ้าย
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-220px)]">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9F5FC] text-[#4F0080] border-b border-[#E7DEF0] sticky top-0">
                  <th className="py-2 px-3 text-center w-10">#</th>
                  <th className="py-2 px-3 text-left">เลขที่หนังสือ</th>
                  <th className="py-2 px-3 text-left">อาจารย์พิเศษ</th>
                  <th className="py-2 px-3 text-left">รายวิชา</th>
                  <th className="py-2 px-3 text-center">ปี/ชั้นปี</th>
                  <th className="py-2 px-3 text-center">จำนวนคาบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EBF8]">
                {batchItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#FCFAFE]">
                    <td className="py-2 px-3 text-center text-[#7A6A88]">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-[#4F0080]">{item.letter_no || '—'}</td>
                    <td className="py-2 px-3 font-medium text-[#241033]">{item.lecturer}</td>
                    <td className="py-2 px-3 text-[#241033]">{item.course}</td>
                    <td className="py-2 px-3 text-center text-[11px] text-[#7A6A88]">
                      {item.acadYear} / {item.stdYear}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-[#1F8A5B]">
                      {item.items.length} คาบ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
