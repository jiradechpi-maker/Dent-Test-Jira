import React, { useState } from 'react';
import { DocumentHistoryItem, SystemStandard } from '../types';
import { exportInvitationDocx } from '../utils/docxExport';
import { getYearTheme } from '../constants/yearColors';
import { History, Search, Download, RotateCcw, Trash2, Calendar, User, BookOpen } from 'lucide-react';

interface HistoryViewProps {
  history: DocumentHistoryItem[];
  std: SystemStandard;
  logoUrl?: string;
  onRestore: (item: DocumentHistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onNotification: (msg: string, type?: 'ok' | 'err' | 'warn') => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  std,
  logoUrl,
  onRestore,
  onDelete,
  onClearAll,
  onNotification
}) => {
  const [search, setSearch] = useState('');

  const filtered = history.filter((item) =>
    item.no.toLowerCase().includes(search.toLowerCase()) ||
    item.lect.toLowerCase().includes(search.toLowerCase()) ||
    item.course.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportWord = async (item: DocumentHistoryItem) => {
    try {
      await exportInvitationDocx(
        {
          letter_no: item.no,
          runNo: 0,
          issue_date: item.date,
          lecturer: item.lect,
          course: item.course,
          acadYear: item.year,
          stdYear: item.std,
          coName: item.co,
          coPhone: item.ph,
          coMail: item.mail,
          tableMode: item.mode,
          items: item.items
        },
        std,
        logoUrl
      );
      onNotification(`ส่งออกไฟล์ Word เลขที่ ${item.no} สำเร็จ ✅`, 'ok');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onNotification(`ส่งออกไฟล์ไม่สำเร็จ: ${msg}`, 'err');
    }
  };

  return (
    <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-4">
      {/* Header with Search and Clear */}
      <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#4F0080]" />
          <h3 className="text-xs font-bold text-[#4F0080]">
            ประวัติเอกสารที่เคยออก ({history.length} ฉบับ)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-[#7A6A88] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเลขที่ / อาจารย์ / วิชา..."
              className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] focus:bg-white focus:outline-none focus:border-[#6B00AD]"
            />
          </div>

          {history.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#FCE9EF] hover:bg-[#F8DCE5] text-[#B4003C] transition-colors cursor-pointer"
            >
              ล้างประวัติทั้งหมด
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-xs text-[#7A6A88]">
          <History className="w-10 h-10 text-[#C4AED4] mx-auto mb-2 opacity-40" />
          <div>{history.length === 0 ? 'ยังไม่มีประวัติเอกสาร' : 'ไม่พบเอกสารตามคำค้นหา'}</div>
          <div className="text-[11px] text-[#7A6A88]/70 mt-1">
            เมื่อสร้างและดาวน์โหลดไฟล์ Word ระบบจะบันทึกประวัติให้เรียกคืนได้ที่นี่
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[calc(100vh-220px)]">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#F9F5FC] text-[#4F0080] border-b border-[#E7DEF0] sticky top-0">
                <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                <th className="py-2.5 px-3 text-left">เลขที่หนังสือ</th>
                <th className="py-2.5 px-3 text-left">อาจารย์พิเศษ</th>
                <th className="py-2.5 px-3 text-left">รายวิชา</th>
                <th className="py-2.5 px-3 text-center">ปี/ชั้นปี</th>
                <th className="py-2.5 px-3 text-center">คาบสอน</th>
                <th className="py-2.5 px-3 text-left">วันที่บันทึก</th>
                <th className="py-2.5 px-3 text-center w-36">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EBF8]">
              {filtered.map((item, idx) => {
                const dateObj = new Date(item.t);
                return (
                  <tr key={item.id || idx} className="hover:bg-[#FCFAFE] transition-colors">
                    <td className="py-2.5 px-3 text-center text-[#7A6A88]">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-[#4F0080] whitespace-nowrap">
                      {item.no}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#241033]">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#8B2FC9] shrink-0" />
                        <span className="truncate max-w-[200px]">{item.lect}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#241033]">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#1F8A5B] shrink-0" />
                        <span className="truncate max-w-[200px]">{item.course}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[11px]">
                      {(() => {
                        const theme = getYearTheme(item.std);
                        return (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[#7A6A88] font-mono">{item.year}</span>
                            <span
                              className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold border flex items-center gap-1"
                              style={{
                                backgroundColor: theme.softBgHex,
                                color: theme.colorCode,
                                borderColor: theme.borderHex
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: theme.colorCode }}
                              />
                              <span>{theme.shortThai}</span>
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#4F0080]">
                      {item.items?.length || 0}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-[#7A6A88] whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#7A6A88]" />
                        <span>
                          {dateObj.toLocaleDateString('th-TH')}{' '}
                          {dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onRestore(item)}
                          className="p-1.5 rounded-md bg-[#F2EBF8] hover:bg-[#E8DCF4] text-[#4F0080] transition-colors"
                          title="เรียกคืนข้อมูลกลับเข้าสู่แบบฟอร์ม"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportWord(item)}
                          className="p-1.5 rounded-md bg-[#E8F7EF] hover:bg-[#D4F1E1] text-[#1F8A5B] transition-colors"
                          title="ดาวน์โหลดไฟล์ Word"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 rounded-md text-[#B4003C] hover:bg-[#FCE9EF] transition-colors"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
