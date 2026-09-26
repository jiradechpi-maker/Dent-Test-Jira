import React, { useState } from 'react';
import { LetterDraft } from '../types';
import { Save, FolderOpen, Trash2, RotateCcw, X, Clock, Plus, Search, CheckCircle2 } from 'lucide-react';

interface DraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: LetterDraft[];
  currentLetterNo: string;
  currentCourse: string;
  onSaveCurrentDraft: (customTitle?: string) => void;
  onRestoreDraft: (draft: LetterDraft) => void;
  onDeleteDraft: (id: string) => void;
}

export const DraftsModal: React.FC<DraftsModalProps> = ({
  isOpen,
  onClose,
  drafts,
  currentLetterNo,
  currentCourse,
  onSaveCurrentDraft,
  onRestoreDraft,
  onDeleteDraft
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [search, setSearch] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCurrentDraft(newTitle.trim() || undefined);
    setNewTitle('');
    setIsSavingNew(false);
  };

  const filteredDrafts = drafts.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.course.toLowerCase().includes(search.toLowerCase()) ||
      d.letterNo.toLowerCase().includes(search.toLowerCase()) ||
      d.lecturer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-[#E7DEF0] rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#F2EBF8] text-[#4F0080] flex items-center justify-center font-bold">
              <FolderOpen className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#241033]">
                โครงร่างแบบฟอร์มที่บันทึกไว้ ({drafts.length} รายการ)
              </h3>
              <p className="text-[11px] text-[#7A6A88]">
                ข้อมูลจะถูกเก็บไว้ในเบราว์เซอร์อัตโนมัติ เมื่อกลับเข้ามาใหม่โครงสร้างเดิมจะยังอยู่ครบถ้วน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7A6A88] hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Save Current Form Action */}
        <div className="bg-[#FAF8FC] border border-[#EFE7F6] rounded-xl p-3.5 space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกหน้าปัจจุบันเป็นโครงร่างใหม่</span>
            </div>
            <span className="text-[10.5px] text-[#7A6A88]">
              {currentLetterNo || 'ยังไม่ระบุเลข'} • {currentCourse || 'ยังไม่ระบุวิชา'}
            </span>
          </div>

          {!isSavingNew ? (
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-[11px] text-[#1F8A5B]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>หน้าปัจจุบันถูกบันทึกอัตโนมัติอยู่ตลอดเวลา</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSavingNew(true)}
                className="px-3 py-1.5 rounded-lg bg-[#4F0080] hover:bg-[#3B0060] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>บันทึกเก็บเป็นเวอร์ชันใหม่</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="flex gap-2 pt-1">
              <input
                type="text"
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="ตั้งชื่อโครงร่างนี้ เช่น ร่างวิชา Fixed Prostho 2569..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-[#DECBEF] bg-white text-xs focus:outline-none focus:border-[#4F0080]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-[#1F8A5B] hover:bg-[#186f49] text-white text-xs font-semibold cursor-pointer shadow-2xs"
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={() => setIsSavingNew(false)}
                className="px-2.5 py-1.5 rounded-lg border border-[#E7DEF0] text-xs font-semibold text-[#5C4A6E] hover:bg-white"
              >
                ยกเลิก
              </button>
            </form>
          )}
        </div>

        {/* Search */}
        <div className="relative shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A88]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาตามชื่อโครงร่าง / เลขที่หนังสือ / อาจารย์ / วิชา..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#4F0080]"
          />
        </div>

        {/* Drafts List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#F2EBF8] pr-1 min-h-[160px]">
          {filteredDrafts.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#7A6A88]">
              <FolderOpen className="w-8 h-8 text-[#C4AED4] mx-auto mb-2 opacity-40" />
              <div>{drafts.length === 0 ? 'ยังไม่มีโครงร่างที่บันทึกไว้' : 'ไม่พบโครงร่างตามคำค้นหา'}</div>
              <div className="text-[10.5px] text-[#7A6A88]/70 mt-0.5">
                คุณสามารถกดปุ่ม "บันทึกเก็บเป็นเวอร์ชันใหม่" ด้านบนเพื่อเก็บโครงร่างไว้เรียกใช้ได้ตลอดเวลา
              </div>
            </div>
          ) : (
            filteredDrafts.map((draft) => {
              const d = new Date(draft.savedAt);
              return (
                <div
                  key={draft.id}
                  className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-[#FCFAFE] rounded-xl transition-colors group"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#241033] truncate">
                        {draft.title}
                      </h4>
                      {draft.letterNo && (
                        <span className="font-mono text-[10px] text-[#4F0080] bg-[#F8F6FB] px-1.5 py-0.2 rounded border border-[#DECBEF]">
                          {draft.letterNo}
                        </span>
                      )}
                    </div>
                    <div className="text-[10.5px] text-[#7A6A88] flex items-center gap-2">
                      <span>วิชา: {draft.course || '—'}</span>
                      <span aria-hidden="true">·</span>
                      <span>อาจารย์: {draft.lecturer || '—'}</span>
                    </div>
                    <div className="text-[10px] text-[#7A6A88]/80 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#7A6A88]" />
                      <span>
                        บันทึกเมื่อ: {d.toLocaleDateString('th-TH')}{' '}
                        {d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onRestoreDraft(draft);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F2EBF8] hover:bg-[#E8DCF4] text-[#4F0080] text-xs font-semibold transition-colors cursor-pointer"
                      title="เรียกคืนโครงร่างนี้เข้าสู่แบบฟอร์ม"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>เรียกคืน</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteDraft(draft.id)}
                      className="p-1 rounded-lg text-[#7A6A88] hover:text-[#B4003C] hover:bg-[#FCE9EF] transition-colors"
                      title="ลบโครงร่างนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#F2EBF8] flex items-center justify-between text-xs text-[#7A6A88] shrink-0">
          <span>
            💡 <strong>คำแนะนำ:</strong> เมื่อเปิดหน้าเว็บเข้ามาใหม่ ข้อมูลล่าสุดจะยังคงอยู่เดิมอัตโนมัติ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-[#E7DEF0] text-xs font-semibold text-[#5C4A6E] hover:bg-[#FAF8FC]"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
