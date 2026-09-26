import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Users,
  BookOpen,
  CreditCard,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { DocumentHistoryItem, SystemStandard } from '../types';
import { YEAR_THEMES_LIST, getYearTheme } from '../constants/yearColors';
import { ViewTab } from './Sidebar';

interface DashboardViewProps {
  history: DocumentHistoryItem[];
  lecturerCount: number;
  courseCount: number;
  currentLetterNo: string;
  std: SystemStandard;
  onNavigate: (tab: ViewTab) => void;
  onRestoreHistory: (item: DocumentHistoryItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  history,
  lecturerCount,
  courseCount,
  currentLetterNo,
  std,
  onNavigate,
  onRestoreHistory
}) => {
  const CM = 567; // twips

  const stdSpecs = [
    { label: 'เลขที่หนังสือ (ชิดซ้าย)', ruler: '0.00', page: `${std.mL.toFixed(2)} cm`, twips: '0' },
    { label: 'ข้อความ เรื่อง / เรียน (แท็บ)', ruler: `${std.rTab.toFixed(2)} cm`, page: `${(std.mL + std.rTab).toFixed(2)} cm`, twips: Math.round(std.rTab * CM) },
    { label: 'ย่อหน้าเนื้อหาหนังสือ', ruler: `${std.rIndent.toFixed(2)} cm`, page: `${(std.mL + std.rIndent).toFixed(2)} cm`, twips: Math.round(std.rIndent * CM) },
    { label: 'บรรทัดเดือน / ปี (วันที่)', ruler: `${std.rDate.toFixed(2)} cm`, page: `${(std.mL + std.rDate).toFixed(2)} cm`, twips: Math.round(std.rDate * CM) },
    { label: 'ที่อยู่สถาบัน (คอลัมน์ขวา)', ruler: `${std.rAddr.toFixed(2)} cm`, page: `${(std.mL + std.rAddr).toFixed(2)} cm`, twips: Math.round(std.rAddr * CM) },
    { label: 'ตราสัญลักษณ์ & บล็อกลงนาม', ruler: 'กึ่งกลาง', page: '10.50 cm', twips: 'CENTER' }
  ];

  return (
    <div className="space-y-4">
      {/* 4 Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#F4EDFA] text-[#4F0080] flex items-center justify-center text-lg font-bold shrink-0">
            🗂️
          </div>
          <div>
            <div className="text-xl font-bold text-[#241033] tracking-tight">
              {history.length}
            </div>
            <div className="text-xs text-[#7A6A88]">เอกสารที่ออกแล้ว</div>
          </div>
        </div>

        <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#F4EDFA] text-[#4F0080] flex items-center justify-center text-lg font-bold shrink-0">
            👥
          </div>
          <div>
            <div className="text-xl font-bold text-[#241033] tracking-tight">
              {lecturerCount}
            </div>
            <div className="text-xs text-[#7A6A88]">อาจารย์ในทะเบียน</div>
          </div>
        </div>

        <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#F4EDFA] text-[#4F0080] flex items-center justify-center text-lg font-bold shrink-0">
            📚
          </div>
          <div>
            <div className="text-xl font-bold text-[#241033] tracking-tight">
              {courseCount}
            </div>
            <div className="text-xs text-[#7A6A88]">รายวิชาในคลัง</div>
          </div>
        </div>

        <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#F4EDFA] text-[#4F0080] flex items-center justify-center text-lg font-bold shrink-0">
            🔢
          </div>
          <div className="min-w-0">
            <div className="text-base font-bold text-[#241033] tracking-tight truncate">
              {currentLetterNo || '—'}
            </div>
            <div className="text-xs text-[#7A6A88]">เลขหนังสือล่าสุด</div>
          </div>
        </div>
      </div>

      {/* Shortcuts & Standard Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Shortcuts */}
        <div className="bg-white border border-[#E7DEF0] rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2.5">
            <h3 className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
              <span>⚡</span>
              <span>ทางลัดงานสารบรรณ</span>
            </h3>
            <span className="text-[11px] text-[#7A6A88]">เข้าถึงการทำงานรวดเร็ว</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={() => onNavigate('create')}
              className="flex items-center justify-between p-3 rounded-lg border border-[#E7DEF0] hover:border-[#6B00AD] hover:bg-[#FBF8FD] transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#4F0080] text-white flex items-center justify-center text-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#241033]">สร้างหนังสือใหม่</div>
                  <div className="text-[10px] text-[#7A6A88]">กรอก & ดูตัวอย่าง A4</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#7A6A88] group-hover:text-[#4F0080] transition-colors" />
            </button>

            <button
              onClick={() => onNavigate('batch')}
              className="flex items-center justify-between p-3 rounded-lg border border-[#E7DEF0] hover:border-[#6B00AD] hover:bg-[#FBF8FD] transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1F8A5B] text-white flex items-center justify-center text-xs">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#241033]">นำเข้า Excel</div>
                  <div className="text-[10px] text-[#7A6A88]">ส่งออก ZIP หลายฉบับ</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#7A6A88] group-hover:text-[#1F8A5B] transition-colors" />
            </button>

            <button
              onClick={() => onNavigate('pay')}
              className="flex items-center justify-between p-3 rounded-lg border border-[#E7DEF0] hover:border-[#6B00AD] hover:bg-[#FBF8FD] transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#8B2FC9] text-white flex items-center justify-center text-xs">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#241033]">ชุดเอกสารเบิกจ่าย</div>
                  <div className="text-[10px] text-[#7A6A88]">ครบ ๔ แบบฟอร์ม</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#7A6A88] group-hover:text-[#8B2FC9] transition-colors" />
            </button>

            <button
              onClick={() => onNavigate('lect')}
              className="flex items-center justify-between p-3 rounded-lg border border-[#E7DEF0] hover:border-[#6B00AD] hover:bg-[#FBF8FD] transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#57426B] text-white flex items-center justify-center text-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#241033]">ทะเบียนอาจารย์</div>
                  <div className="text-[10px] text-[#7A6A88]">จัดการรายชื่อ & ธนาคาร</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#7A6A88] group-hover:text-[#57426B] transition-colors" />
            </button>
          </div>
        </div>

        {/* Standard Measurement Rules */}
        <div className="bg-white border border-[#E7DEF0] rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2.5">
            <h3 className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>ค่ามาตรฐานระบบราชการ สจล. (ฟอนต์ ๑๐pt)</span>
            </h3>
            <span className="text-[10px] font-semibold text-[#1F8A5B] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>ตรงตามระเบียบ</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9F5FC] text-[#4F0080] border-b border-[#E7DEF0]">
                  <th className="py-1.5 px-2.5 text-left font-semibold">องค์ประกอบ</th>
                  <th className="py-1.5 px-2 text-center font-semibold">ระยะไม้บรรทัด</th>
                  <th className="py-1.5 px-2 text-center font-semibold">ระยะจากขอบกระดาษ</th>
                  <th className="py-1.5 px-2 text-center font-semibold">Word (twips)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EBF8]">
                {stdSpecs.map((s, idx) => (
                  <tr key={idx} className="hover:bg-[#FCFAFE]">
                    <td className="py-1.5 px-2.5 text-[#241033] font-medium">{s.label}</td>
                    <td className="py-1.5 px-2 text-center text-[#7A6A88]">{s.ruler}</td>
                    <td className="py-1.5 px-2 text-center font-semibold text-[#4F0080]">{s.page}</td>
                    <td className="py-1.5 px-2 text-center text-[11px] text-[#7A6A88] font-mono">{s.twips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent 5 Documents */}
      <div className="bg-white border border-[#E7DEF0] rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2.5">
          <h3 className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>เอกสาร ๕ ฉบับล่าสุด</span>
          </h3>
          <button
            onClick={() => onNavigate('hist')}
            className="text-xs text-[#4F0080] hover:underline font-semibold"
          >
            ดูประวัติทั้งหมด ({history.length})
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#7A6A88]">
            <Clock className="w-8 h-8 text-[#C4AED4] mx-auto mb-2 opacity-40" />
            <div>ยังไม่มีประวัติการสร้างเอกสาร</div>
            <div className="text-[11px] text-[#7A6A88]/70 mt-0.5">
              เมื่อกดส่งออกไฟล์ Word ข้อมูลจะถูกบันทึกที่นี่โดยอัตโนมัติ
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9F5FC] text-[#4F0080] border-b border-[#E7DEF0]">
                  <th className="py-2 px-3 text-center w-10">ลำดับ</th>
                  <th className="py-2 px-3 text-left">เลขที่หนังสือ</th>
                  <th className="py-2 px-3 text-left">อาจารย์พิเศษ</th>
                  <th className="py-2 px-3 text-left">รายวิชา</th>
                  <th className="py-2 px-3 text-center">ชั้นปี</th>
                  <th className="py-2 px-3 text-center">จำนวนคาบ</th>
                  <th className="py-2 px-3 text-left">วันที่บันทึก</th>
                  <th className="py-2 px-3 text-center w-24">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EBF8]">
                {history.slice(0, 5).map((item, idx) => {
                  const d = new Date(item.t);
                  const theme = getYearTheme(item.std);
                  return (
                    <tr key={item.id || idx} className="hover:bg-[#FCFAFE]">
                      <td className="py-2 px-3 text-center text-[#7A6A88]">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-[#4F0080]">{item.no}</td>
                      <td className="py-2 px-3 font-medium text-[#241033]">{item.lect}</td>
                      <td className="py-2 px-3 text-[#241033]">{item.course}</td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 border"
                          style={{
                            backgroundColor: theme.softBgHex,
                            color: theme.colorCode,
                            borderColor: theme.borderHex
                          }}
                          title={theme.phaseName}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: theme.colorCode }}
                          />
                          <span>{theme.shortThai}</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center text-[#7A6A88]">
                        {item.items?.length || 0}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-[#7A6A88]">
                        {d.toLocaleDateString('th-TH')} {d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => onRestoreHistory(item)}
                          className="px-2 py-1 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] text-[#4F0080] text-[11px] font-semibold transition-colors"
                        >
                          เรียกคืนฟอร์ม
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
