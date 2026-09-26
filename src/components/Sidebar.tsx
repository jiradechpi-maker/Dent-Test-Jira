import React from 'react';
import {
  FileText,
  Home,
  FileSpreadsheet,
  Users,
  BookOpen,
  History,
  CreditCard,
  HelpCircle,
  Hash
} from 'lucide-react';

export type ViewTab = 'dash' | 'create' | 'batch' | 'lect' | 'course' | 'hist' | 'pay' | 'help';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  lecturerCount: number;
  courseCount: number;
  historyCount: number;
  currentLetterNo: string;
  hasLogo: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  lecturerCount,
  courseCount,
  historyCount,
  currentLetterNo,
  hasLogo
}) => {
  const navItems: { id: ViewTab; label: string; icon: React.ReactNode; group: string; count?: number; badge?: string }[] = [
    { id: 'dash', label: 'ภาพรวมระบบ', icon: <Home className="w-4 h-4" />, group: 'งานสารบรรณ' },
    { id: 'create', label: 'สร้างหนังสือเชิญ', icon: <FileText className="w-4 h-4" />, group: 'งานสารบรรณ' },
    { id: 'batch', label: 'นำเข้า Excel (Batch)', icon: <FileSpreadsheet className="w-4 h-4" />, group: 'งานสารบรรณ' },
    { id: 'lect', label: 'ทะเบียนอาจารย์', icon: <Users className="w-4 h-4" />, group: 'ฐานข้อมูล', count: lecturerCount },
    { id: 'course', label: 'คลังรายวิชา', icon: <BookOpen className="w-4 h-4" />, group: 'ฐานข้อมูล', count: courseCount },
    { id: 'hist', label: 'ประวัติเอกสาร', icon: <History className="w-4 h-4" />, group: 'ฐานข้อมูล', count: historyCount },
    { id: 'pay', label: 'ชุดเอกสารเบิกจ่าย', icon: <CreditCard className="w-4 h-4" />, group: 'ชุดเบิกจ่าย', badge: 'พร้อมใช้' },
    { id: 'help', label: 'คู่มือ & ตั้งค่าระบบ', icon: <HelpCircle className="w-4 h-4" />, group: 'ช่วยเหลือ' }
  ];

  const groups = Array.from(new Set(navItems.map((item) => item.group)));

  return (
    <aside className="w-64 bg-gradient-to-b from-[#530086] via-[#3C0062] to-[#25003B] text-white flex flex-col shrink-0 min-h-screen border-r border-white/10 select-none no-print">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl shadow-inner shrink-0">
          🦷
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold tracking-tight text-white leading-tight truncate">
            Dent Letter System
          </h1>
          <p className="text-[11px] text-white/60 truncate mt-0.5">
            คณะทันตแพทยศาสตร์ สจล.
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {groups.map((group) => {
          const itemsInGroup = navItems.filter((i) => i.group === group);
          return (
            <div key={group}>
              <div className="text-[10px] font-bold tracking-wider text-white/40 uppercase px-3 py-1">
                {group}
              </div>
              <div className="space-y-0.5 mt-1">
                {itemsInGroup.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                        isActive
                          ? 'bg-white text-[#4F0080] font-bold shadow-md shadow-black/20'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className={`${isActive ? 'text-[#4F0080]' : 'text-white/70'}`}>
                        {item.icon}
                      </span>
                      <span className="truncate flex-1">{item.label}</span>
                      {item.count !== undefined && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-[#F2EBF8] text-[#4F0080]' : 'bg-white/15 text-white/90'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                      {item.badge && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-3.5 mx-2.5 mb-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/50">
          <Hash className="w-3.5 h-3.5" />
          <span>เลขหนังสือล่าสุด</span>
        </div>
        <div className="text-sm font-bold text-white tracking-wide truncate">
          {currentLetterNo || '—'}
        </div>
        <div className="pt-1 border-t border-white/10 text-[10px] text-white/50 flex items-center justify-between">
          <span>ตราสัญลักษณ์ สจล.</span>
          <span className={`inline-flex items-center gap-1 ${hasLogo ? 'text-emerald-300' : 'text-amber-300'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasLogo ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            {hasLogo ? 'พร้อมใช้งาน' : 'ค่ามาตรฐาน'}
          </span>
        </div>
      </div>
    </aside>
  );
};
