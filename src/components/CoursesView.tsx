import React, { useState, useMemo } from 'react';
import { Course } from '../types';
import {
  COURSES_DATA,
  CourseCatalogItem,
  ACADEMIC_YEAR_DEFAULT
} from '../data/coursesData';
import {
  YEAR_THEMES,
  YEAR_THEMES_LIST,
  getYearTheme,
  YearTheme
} from '../constants/yearColors';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Calendar,
  Layers,
  BookmarkPlus,
  BookmarkCheck,
  Copy,
  Info,
  Award,
  ChevronRight,
  X,
  SlidersHorizontal
} from 'lucide-react';

interface CoursesViewProps {
  courses: Course[];
  onAddCourse: (c: Omit<Course, 'id'>) => void;
  onUpdateCourse: (id: string, c: Partial<Course>) => void;
  onDeleteCourse: (id: string) => void;
  onSelectCourse: (c: Course) => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  courses,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onSelectCourse
}) => {
  // Navigation tabs for the database
  const [activeTab, setActiveTab] = useState<'catalog' | 'roadmap' | 'custom'>('catalog');

  // Year filter: 1 to 6 or 'all'
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2' | 'year' | 'all'>('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'clinic' | 'core' | 'ge'>('all');

  // Modal detail course state
  const [detailCourse, setDetailCourse] = useState<CourseCatalogItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Custom courses form state
  const [searchCustom, setSearchCustom] = useState('');
  const [customName, setCustomName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [customYear, setCustomYear] = useState('๒๕๖๙');
  const [customStd, setCustomStd] = useState('ชั้นปีที่ ๔');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filtered official catalog courses
  const filteredCatalog = useMemo(() => {
    return COURSES_DATA.filter((course) => {
      if (selectedYear !== 'all' && course.year !== selectedYear) return false;
      if (selectedSemester !== 'all' && course.semester !== selectedSemester) return false;
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'clinic' && course.category !== 'clinic') return false;
        if (selectedCategory === 'core' && course.category !== 'core') return false;
        if (selectedCategory === 'ge' && course.category !== 'ge') return false;
      }
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase().trim();
        const mCode = course.code.toLowerCase().includes(q);
        const mName = course.name.toLowerCase().includes(q);
        const mInst = course.instructor.toLowerCase().includes(q);
        const mSpecial = course.specialLecturers?.some((lec) =>
          lec.toLowerCase().includes(q)
        );
        return mCode || mName || mInst || mSpecial;
      }
      return true;
    });
  }, [selectedYear, selectedSemester, selectedCategory, catalogSearch]);

  // Statistics per year
  const yearStats = useMemo(() => {
    const stats: Record<number, { count: number; clinicCount: number; credits: number }> = {};
    for (let i = 1; i <= 6; i++) {
      const yearCourses = COURSES_DATA.filter((c) => c.year === i);
      const clinicCount = yearCourses.filter((c) => c.category === 'clinic').length;
      stats[i] = {
        count: yearCourses.length,
        clinicCount,
        credits: yearCourses.reduce((sum, c) => {
          const match = c.credit.match(/^(\d+)/);
          return sum + (match ? parseInt(match[1], 10) : 0);
        }, 0)
      };
    }
    return stats;
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleImportFromCatalog = (item: CourseCatalogItem) => {
    const exists = courses.some(
      (c) => c.n.toLowerCase() === item.name.toLowerCase() || (c.code && c.code === item.code)
    );
    if (!exists) {
      onAddCourse({
        n: item.name,
        code: item.code,
        y: ACADEMIC_YEAR_DEFAULT,
        s: item.stdYearThai
      });
    }
  };

  const handleUseCatalogInLetter = (item: CourseCatalogItem) => {
    onSelectCourse({
      id: `cat-${item.code}`,
      n: item.name,
      code: item.code,
      y: ACADEMIC_YEAR_DEFAULT,
      s: item.stdYearThai
    });
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    if (editingId) {
      onUpdateCourse(editingId, {
        n: customName.trim(),
        code: customCode.trim(),
        y: customYear.trim(),
        s: customStd.trim()
      });
      setEditingId(null);
    } else {
      onAddCourse({
        n: customName.trim(),
        code: customCode.trim(),
        y: customYear.trim(),
        s: customStd.trim()
      });
    }

    setCustomName('');
    setCustomCode('');
    setCustomYear('๒๕๖๙');
    setCustomStd('ชั้นปีที่ ๔');
  };

  const handleEditCustom = (c: Course) => {
    setActiveTab('custom');
    setEditingId(c.id);
    setCustomName(c.n);
    setCustomCode(c.code || '');
    setCustomYear(c.y || '๒๕๖๙');
    setCustomStd(c.s || 'ชั้นปีที่ ๔');
  };

  const filteredCustom = courses.filter(
    (c) =>
      c.n.toLowerCase().includes(searchCustom.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(searchCustom.toLowerCase()))
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* ================= 1. DENTAL YEAR COLOR PALETTE BANNER ================= */}
      <section className="bg-white border border-[#E7DEF0] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#F2EBF8] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4F0080] to-[#7B1FA2] text-white flex items-center justify-center text-sm shadow-xs font-bold">
                🦷
              </span>
              <div>
                <h2 className="text-base font-bold text-[#241033] tracking-tight">
                  ฐานข้อมูลหลักสูตรทันตแพทยศาสตร์ สจล.
                </h2>
                <div className="flex items-center gap-2 text-xs text-[#7A6A88] mt-0.5">
                  <span>Faculty of Dentistry, KMITL</span>
                  <span aria-hidden="true">·</span>
                  <span>Doctor of Dental Surgery (B.D.S. International Program)</span>
                  <span aria-hidden="true">·</span>
                  <span>ปีการศึกษา ๒๕๖๙</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#7A6A88] bg-[#F8F6FB] px-3 py-1 rounded-lg border border-[#E7DEF0]">
              เปิดสอน ๕ ปี (กำลังเตรียมรับรุ่นที่ ๑ สู่ชั้นปี ๖)
            </span>
          </div>
        </div>

        {/* 6-Year Color Navigation Cards (Without Color Names) */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ข้อมูลจำแนกตามชั้นปี ๑ – ๖</span>
            </span>
            <span className="text-[11px] text-[#7A6A88]">
              คลิกการ์ดชั้นปีเพื่อกรองรายวิชาทันที
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {YEAR_THEMES_LIST.map((theme) => {
              const isSelected = selectedYear === theme.year;
              const stats = yearStats[theme.year];

              return (
                <button
                  key={theme.year}
                  type="button"
                  onClick={() => {
                    setSelectedYear(selectedYear === theme.year ? 'all' : theme.year);
                    if (activeTab === 'custom') setActiveTab('catalog');
                  }}
                  className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-offset-1 shadow-sm'
                      : 'hover:border-slate-300 hover:shadow-2xs bg-white'
                  }`}
                  style={{
                    backgroundColor: isSelected ? theme.softBgHex : '#FFFFFF',
                    borderColor: isSelected ? theme.colorCode : '#EAE4F0'
                  }}
                >
                  {/* Top indicator dot & label */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: theme.colorCode }}
                    />
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${theme.colorCode}15`,
                        color: theme.colorCode
                      }}
                    >
                      {theme.shortThai}
                    </span>
                  </div>

                  {/* Stage Title */}
                  <div>
                    <div className="text-xs font-bold text-[#1E1128] leading-tight">
                      {theme.thaiLabel}
                    </div>
                    <div className="text-[10.5px] text-[#5C4A6E] mt-0.5 truncate">
                      {theme.phaseShort}
                    </div>
                  </div>

                  {/* Course count */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                    <span className="text-[#7A6A88]">
                      {theme.engLabel.split(' ')[0]}
                    </span>
                    <span className="font-bold text-[#241033]">
                      {stats?.count || 0} วิชา
                    </span>
                  </div>

                  {/* Upcoming tag for Year 6 */}
                  {theme.isUpcoming && (
                    <div className="mt-1.5 text-[9.5px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-center">
                      รอรับรุ่น ๑
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= 2. DATABASE NAVIGATION TABS ================= */}
      <div className="flex items-center justify-between border-b border-[#E7DEF0] pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E7DEF0] rounded-xl shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-[#4F0080] text-white shadow-xs'
                : 'text-[#5C4A6E] hover:bg-[#F2EBF8]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>คลังหลักสูตร สจล. ({COURSES_DATA.length} วิชา)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'roadmap'
                ? 'bg-[#4F0080] text-white shadow-xs'
                : 'text-[#5C4A6E] hover:bg-[#F2EBF8]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>แผนผังโครงสร้าง ๖ ชั้นปี</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-[#4F0080] text-white shadow-xs'
                : 'text-[#5C4A6E] hover:bg-[#F2EBF8]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>รายวิชาที่บันทึกในระบบ ({courses.length})</span>
          </button>
        </div>

        <div className="text-xs text-[#7A6A88] flex items-center gap-2">
          <span>แสดง: <strong className="text-[#4F0080]">{filteredCatalog.length}</strong> จาก {COURSES_DATA.length} รายการ</span>
          {selectedYear !== 'all' && (
            <button
              onClick={() => setSelectedYear('all')}
              className="text-xs text-[#4F0080] hover:underline font-semibold cursor-pointer"
            >
              ล้างตัวกรองชั้นปี
            </button>
          )}
        </div>
      </div>

      {/* ================= TAB 1: CURRICULUM COURSE CATALOG ================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-3.5">
          {/* Enhanced Filter Controls Bar */}
          <div className="bg-white border border-[#E7DEF0] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Year Selectors with Color Indicator */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-[#5C4A6E] mr-1 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-[#4F0080]" />
                  <span>ชั้นปี:</span>
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedYear('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    selectedYear === 'all'
                      ? 'bg-[#4F0080] text-white border-[#4F0080] shadow-xs'
                      : 'bg-white text-[#5C4A6E] border-[#E7DEF0] hover:bg-[#F2EBF8]'
                  }`}
                >
                  ทั้งหมด
                </button>

                {YEAR_THEMES_LIST.map((theme) => {
                  const isActive = selectedYear === theme.year;
                  return (
                    <button
                      key={theme.year}
                      type="button"
                      onClick={() => setSelectedYear(theme.year)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        isActive
                          ? 'shadow-xs font-bold text-white'
                          : 'bg-white text-[#4A3B5C] border-[#E7DEF0] hover:bg-[#FAF8FC]'
                      }`}
                      style={{
                        backgroundColor: isActive ? theme.colorCode : undefined,
                        borderColor: isActive ? theme.colorCode : undefined
                      }}
                      title={theme.thaiLabel}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: isActive ? '#FFFFFF' : theme.colorCode }}
                      />
                      <span>{theme.shortThai}</span>
                    </button>
                  );
                })}
              </div>

              {/* Semester Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-[#5C4A6E] mr-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#4F0080]" />
                  <span>ภาคเรียน:</span>
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedSemester('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    selectedSemester === 'all'
                      ? 'bg-[#4F0080] text-white border-[#4F0080]'
                      : 'bg-white text-[#5C4A6E] border-[#E7DEF0] hover:bg-[#F2EBF8]'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSemester('1')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    selectedSemester === '1'
                      ? 'bg-[#4F0080] text-white border-[#4F0080]'
                      : 'bg-white text-[#5C4A6E] border-[#E7DEF0] hover:bg-[#F2EBF8]'
                  }`}
                >
                  เทอม ๑
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSemester('2')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    selectedSemester === '2'
                      ? 'bg-[#4F0080] text-white border-[#4F0080]'
                      : 'bg-white text-[#5C4A6E] border-[#E7DEF0] hover:bg-[#F2EBF8]'
                  }`}
                >
                  เทอม ๒
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSemester('year')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    selectedSemester === 'year'
                      ? 'bg-[#4F0080] text-white border-[#4F0080]'
                      : 'bg-white text-[#5C4A6E] border-[#E7DEF0] hover:bg-[#F2EBF8]'
                  }`}
                >
                  วิชารายปี / คลินิก
                </button>
              </div>
            </div>

            {/* Search and Category Row */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A88]" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="ค้นหารหัสวิชา, ชื่อวิชาภาษาอังกฤษ, อาจารย์ผู้รับผิดชอบ, หรืออาจารย์พิเศษ..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#4F0080] transition-colors"
                />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7A6A88] hover:text-[#4F0080]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Segmented Control */}
              <div className="flex items-center gap-1 bg-[#F8F6FB] p-1 rounded-xl border border-[#E7DEF0] shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-white text-[#4F0080] shadow-2xs font-bold'
                      : 'text-[#7A6A88] hover:text-[#241033]'
                  }`}
                >
                  ทุกประเภท
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('clinic')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    selectedCategory === 'clinic'
                      ? 'bg-white text-[#4F0080] shadow-2xs font-bold'
                      : 'text-[#7A6A88] hover:text-[#241033]'
                  }`}
                >
                  วิชาคลินิก (Clinic)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('core')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    selectedCategory === 'core'
                      ? 'bg-white text-[#4F0080] shadow-2xs font-bold'
                      : 'text-[#7A6A88] hover:text-[#241033]'
                  }`}
                >
                  วิชาแกน (Core)
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Summary Bar if filtered */}
          {selectedYear !== 'all' && (
            <div
              className="p-3 rounded-xl border flex items-center justify-between gap-3 text-xs"
              style={{
                backgroundColor: YEAR_THEMES[selectedYear].softBgHex,
                borderColor: YEAR_THEMES[selectedYear].borderHex
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: YEAR_THEMES[selectedYear].colorCode }}
                />
                <span className="font-bold text-[#1E1128]">
                  {YEAR_THEMES[selectedYear].thaiLabel} ({YEAR_THEMES[selectedYear].engLabel})
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-[#5C4A6E]">
                  {YEAR_THEMES[selectedYear].phaseName}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-[#7A6A88]">
                  {YEAR_THEMES[selectedYear].curriculumStage}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedYear('all')}
                className="text-xs font-semibold text-[#5C4A6E] hover:text-[#241033] underline shrink-0 cursor-pointer"
              >
                ดูทุกชั้นปี
              </button>
            </div>
          )}

          {/* Courses Grid with Year Color Theming (No color name text) */}
          {filteredCatalog.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#E7DEF0] rounded-2xl p-6">
              <BookOpen className="w-12 h-12 text-[#C4AED4] mx-auto mb-3 opacity-40" />
              <h3 className="text-sm font-bold text-[#241033]">ไม่พบรายวิชาตามเงื่อนไขที่เลือก</h3>
              <p className="text-xs text-[#7A6A88] mt-1">
                ลองปรับเปลี่ยนคำค้นหา หรือเลือกชั้นปีและภาคเรียนอื่น
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedYear('all');
                  setSelectedSemester('all');
                  setSelectedCategory('all');
                  setCatalogSearch('');
                }}
                className="mt-3 px-3 py-1.5 rounded-lg bg-[#4F0080] text-white text-xs font-semibold cursor-pointer"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredCatalog.map((item) => {
                const isSaved = courses.some(
                  (c) => c.n.toLowerCase() === item.name.toLowerCase() || c.code === item.code
                );
                const yearTheme = getYearTheme(item.year);

                return (
                  <div
                    key={`${item.code}-${item.semester}`}
                    className="bg-white border border-[#EAE4F0] hover:border-slate-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3 relative overflow-hidden group"
                  >
                    {/* Left Accent Strip with Year Color */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5"
                      style={{ backgroundColor: yearTheme.colorCode }}
                    />

                    <div className="space-y-2 pl-1.5">
                      {/* Top Header: Code, Year Dot Tag, Credit */}
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[#241033] bg-[#F8F6FB] px-2 py-0.5 rounded border border-[#DECBEF]">
                            {item.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(item.code)}
                            title="คัดลอกรหัสวิชา"
                            className="text-[#7A6A88] hover:text-[#4F0080] transition-colors p-0.5 cursor-pointer"
                          >
                            {copiedCode === item.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {/* Year Badge (Without color name text) */}
                        <div className="flex items-center gap-1">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{
                              backgroundColor: yearTheme.softBgHex,
                              color: yearTheme.colorCode,
                              border: `1px solid ${yearTheme.borderHex}`
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: yearTheme.colorCode }}
                            />
                            <span>{yearTheme.shortThai}</span>
                          </span>

                          <span className="text-[10px] bg-[#FAF8FC] text-[#5C4A6E] font-medium px-1.5 py-0.5 rounded border border-[#EFE7F6]">
                            {item.credit}
                          </span>
                        </div>
                      </div>

                      {/* Course Title */}
                      <h4 className="text-xs font-bold text-[#1E1128] group-hover:text-[#4F0080] transition-colors line-clamp-2 leading-relaxed">
                        {item.name}
                      </h4>

                      {/* Semester and category unboxed metadata */}
                      <div className="flex items-center gap-2 text-[11px] text-[#7A6A88]">
                        <span>{item.semesterLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.category === 'clinic' ? 'วิชาคลินิก' : 'วิชาแกน'}</span>
                      </div>

                      {/* Coordinator / Instructor */}
                      <div className="text-[11px] text-[#5C4A6E] flex items-start gap-1 pt-1 border-t border-[#F8F6FB]">
                        <span className="text-[#7A6A88] shrink-0 font-medium">อาจารย์:</span>
                        <span className="font-semibold text-[#3B0060] line-clamp-1">
                          {item.instructor}
                        </span>
                      </div>

                      {/* Special Guest Lecturers List */}
                      {item.specialLecturers && item.specialLecturers.length > 0 && (
                        <div className="text-[10.5px] text-[#5C4A6E] bg-[#FCFAFE] p-2 rounded-lg border border-[#F2EBF8] space-y-0.5">
                          <div className="text-[10px] font-bold text-[#4F0080] flex items-center gap-1">
                            <span>👥</span>
                            <span>อาจารย์พิเศษ:</span>
                          </div>
                          <p className="line-clamp-2 text-[#4A3B5C]">
                            {item.specialLecturers.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-2 pl-1.5 border-t border-[#F2EBF8] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleUseCatalogInLetter(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4F0080] hover:bg-[#3B0060] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                        title="นำวิชานี้ไปออกหนังสือขอเชิญอาจารย์พิเศษ"
                      >
                        <Sparkles className="w-3 h-3 text-[#FBBF24]" />
                        <span>ออกหนังสือเชิญ</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailCourse(item)}
                          className="p-1.5 rounded-lg bg-[#FAF8FC] hover:bg-[#F2EBF8] text-[#5C4A6E] text-xs transition-colors cursor-pointer"
                          title="ดูรายละเอียดวิชาแบบละเอียด"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleImportFromCatalog(item)}
                          disabled={isSaved}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isSaved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                              : 'bg-[#F2EBF8] hover:bg-[#E8DCF4] text-[#4F0080] cursor-pointer'
                          }`}
                          title={isSaved ? 'มีในรายการแล้ว' : 'บันทึกเข้ารายการของฉัน'}
                        >
                          {isSaved ? (
                            <>
                              <BookmarkCheck className="w-3 h-3" />
                              <span>บันทึกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="w-3 h-3" />
                              <span>บันทึกวิชา</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: 6-YEAR CURRICULUM ROADMAP ================= */}
      {activeTab === 'roadmap' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E7DEF0] rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#241033] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#4F0080]" />
                <span>แผนผังโครงสร้างการศึกษาวิชาชีพทันตแพทย์ ๖ ชั้นปี (Dental Curriculum Roadmap)</span>
              </h3>
              <p className="text-xs text-[#7A6A88] mt-1">
                เปรียบเทียบสาระการเรียนรู้ และพัฒนาการทางวิชาชีพจากวิทยาศาสตร์พื้นฐานสู่ทันตแพทย์เต็มตัว
              </p>
            </div>

            {/* Matrix comparison table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F9F5FC] text-[#4F0080] border-b border-[#E7DEF0]">
                    <th className="py-2.5 px-3 text-left w-32">ชั้นปี</th>
                    <th className="py-2.5 px-3 text-left w-44">ระยะการศึกษา (Phase)</th>
                    <th className="py-2.5 px-3 text-left">สาระสำคัญ & ขอบเขตวิชาการ</th>
                    <th className="py-2.5 px-3 text-center w-28">สถานที่ปฏิบัติการ</th>
                    <th className="py-2.5 px-3 text-center w-24">จำนวนวิชา</th>
                    <th className="py-2.5 px-3 text-center w-28">สถานะการเปิดสอน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EBF8]">
                  {YEAR_THEMES_LIST.map((theme) => {
                    const stats = yearStats[theme.year];
                    return (
                      <tr key={theme.year} className="hover:bg-[#FCFAFE] transition-colors">
                        {/* Year */}
                        <td className="py-3 px-3 align-top">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: theme.colorCode }}
                            />
                            <div>
                              <div className="font-bold text-[#241033]">{theme.thaiLabel}</div>
                              <div className="text-[10.5px] text-[#7A6A88]">
                                {theme.engLabel}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Phase */}
                        <td className="py-3 px-3 align-top">
                          <div className="font-semibold text-[#1E1128]">{theme.phaseName}</div>
                          <div className="text-[10px] text-[#7A6A88]">{theme.phaseShort}</div>
                        </td>

                        {/* Description */}
                        <td className="py-3 px-3 align-top space-y-1">
                          <div className="text-[#3B294C] font-medium leading-relaxed">
                            {theme.curriculumStage}
                          </div>
                        </td>

                        {/* Location / Lab */}
                        <td className="py-3 px-3 text-center align-top text-[11px] text-[#5C4A6E]">
                          {theme.year === 1 && 'ห้องบรรยาย & Lab วิทยาศาสตร์'}
                          {theme.year === 2 && 'Dental Simulation Lab'}
                          {theme.year === 3 && 'Advanced Pre-clinical Lab'}
                          {theme.year === 4 && 'คลินิกทันตกรรมรวม สจล.'}
                          {theme.year === 5 && 'คลินิกเฉพาะทาง & รพ.'}
                          {theme.year === 6 && 'รพ.ศูนย์ & Externship'}
                        </td>

                        {/* Course count */}
                        <td className="py-3 px-3 text-center align-top font-bold text-[#4F0080]">
                          {stats?.count || 0} วิชา
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center align-top">
                          {theme.isUpcoming ? (
                            <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                              รอรับรุ่น ๑
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                              เปิดสอนปกติ
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Context Note */}
            <div className="p-3.5 bg-[#FAF8FD] border border-[#E7DEF0] rounded-xl flex items-start gap-2.5 text-xs text-[#5C4A6E]">
              <Info className="w-4 h-4 text-[#4F0080] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#4F0080]">หมายเหตุบริบทคณะทันตแพทยศาสตร์ สจล.:</strong> คณะทันตแพทยศาสตร์ สจล. เปิดดำเนินการเรียนการสอนมาได้ ๕ ปี ขณะนี้มีนักศึกษาถึงชั้นปีที่ ๕ และกำลังเตรียมความพร้อมของหลักสูตรชั้นปีที่ ๖ เพื่อรอรับนักศึกษารุ่นที่ ๑ ก้าวขึ้นสู่ปี ๖
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: CUSTOM SAVED COURSES ================= */}
      {activeTab === 'custom' && (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 items-start">
          {/* Form to Add / Edit */}
          <div className="bg-white border border-[#E7DEF0] rounded-2xl p-4 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2.5">
              <h3 className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>{editingId ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาใหม่'}</span>
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setCustomName('');
                    setCustomCode('');
                    setCustomYear('๒๕๖๙');
                    setCustomStd('ชั้นปีที่ ๔');
                  }}
                  className="text-xs text-[#B4003C] hover:underline cursor-pointer"
                >
                  ยกเลิกการแก้ไข
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitCustom} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                  ชื่อรายวิชา (ภาษาอังกฤษ) *
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="เช่น Fixed Prosthodontics"
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#4F0080]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                  รหัสวิชา (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="เช่น 20636402"
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs font-mono focus:bg-white focus:outline-none focus:border-[#4F0080]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                    ปีการศึกษา
                  </label>
                  <input
                    type="text"
                    value={customYear}
                    onChange={(e) => setCustomYear(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#4F0080]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                    ชั้นปีนักศึกษา
                  </label>
                  <select
                    value={customStd}
                    onChange={(e) => setCustomStd(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#4F0080]"
                  >
                    <option value="ชั้นปีที่ ๑">ชั้นปีที่ ๑</option>
                    <option value="ชั้นปีที่ ๒">ชั้นปีที่ ๒</option>
                    <option value="ชั้นปีที่ ๓">ชั้นปีที่ ๓</option>
                    <option value="ชั้นปีที่ ๔">ชั้นปีที่ ๔</option>
                    <option value="ชั้นปีที่ ๕">ชั้นปีที่ ๕</option>
                    <option value="ชั้นปีที่ ๖">ชั้นปีที่ ๖</option>
                  </select>
                </div>
              </div>

              {/* Year Visual Preview without color name */}
              {(() => {
                const previewTheme = getYearTheme(customStd);
                return (
                  <div
                    className="p-2.5 rounded-lg border text-xs flex items-center justify-between"
                    style={{
                      backgroundColor: previewTheme.softBgHex,
                      borderColor: previewTheme.borderHex
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: previewTheme.colorCode }}
                      />
                      <span className="font-bold text-[#1E1128]">
                        {previewTheme.thaiLabel}
                      </span>
                    </div>
                    <span className="text-[10.5px] text-[#7A6A88]">
                      {previewTheme.phaseName}
                    </span>
                  </div>
                );
              })()}

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#4F0080] hover:bg-[#3B0060] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingId ? 'บันทึกการแก้ไข' : 'เพิ่มเข้ารายการ'}</span>
              </button>
            </form>
          </div>

          {/* List of Custom Saved Courses */}
          <div className="bg-white border border-[#E7DEF0] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2.5 flex-wrap gap-2">
              <h3 className="text-xs font-bold text-[#4F0080]">
                รายวิชาในระบบ ({courses.length} วิชา)
              </h3>

              <div className="relative w-52">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#7A6A88]" />
                <input
                  type="text"
                  value={searchCustom}
                  onChange={(e) => setSearchCustom(e.target.value)}
                  placeholder="ค้นหาชื่อวิชา / รหัสวิชา..."
                  className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] focus:bg-white focus:outline-none focus:border-[#4F0080]"
                />
              </div>
            </div>

            {filteredCustom.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#7A6A88]">
                <BookOpen className="w-8 h-8 text-[#C4AED4] mx-auto mb-2 opacity-40" />
                <div>ไม่พบรายวิชาที่บันทึกไว้</div>
              </div>
            ) : (
              <div className="divide-y divide-[#F2EBF8] max-h-[calc(100vh-320px)] overflow-y-auto">
                {filteredCustom.map((c) => {
                  const theme = getYearTheme(c.s);
                  return (
                    <div
                      key={c.id}
                      className="py-2.5 flex items-center justify-between gap-3 hover:bg-[#FCFAFE] px-2 rounded-lg transition-colors group"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: theme.colorCode }}
                          title={theme.thaiLabel}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {c.code && (
                              <span className="font-mono text-[10.5px] font-bold text-[#4F0080] bg-[#F8F6FB] px-1.5 py-0.2 rounded border border-[#DECBEF]">
                                {c.code}
                              </span>
                            )}
                            <h4 className="text-xs font-bold text-[#241033] truncate">
                              {c.n}
                            </h4>
                          </div>
                          <div className="text-[10.5px] text-[#7A6A88] flex items-center gap-2 mt-0.5">
                            <span>{c.y || 'ปีการศึกษา ๒๕๖๙'}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-[#4A3B5C]">
                              {c.s || 'ชั้นปีที่ ๔'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onSelectCourse(c)}
                          className="px-2 py-1 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] text-[#4F0080] text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          ออกหนังสือ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditCustom(c)}
                          className="p-1 rounded text-[#7A6A88] hover:text-[#4F0080] hover:bg-[#F2EBF8] transition-colors cursor-pointer"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCourse(c.id)}
                          className="p-1 rounded text-[#7A6A88] hover:text-[#B4003C] hover:bg-[#FCE9EF] transition-colors cursor-pointer"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 4. COURSE DETAIL MODAL ================= */}
      {detailCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E7DEF0] rounded-2xl max-w-lg w-full p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#F2EBF8] pb-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                  style={{ backgroundColor: getYearTheme(detailCourse.year).colorCode }}
                >
                  <BookOpen className="w-5 h-5" />
                </span>
                <div>
                  <div className="font-mono text-xs font-bold text-[#4F0080]">
                    {detailCourse.code}
                  </div>
                  <h3 className="text-sm font-bold text-[#241033] leading-tight">
                    {detailCourse.name}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailCourse(null)}
                className="p-1 rounded-lg text-[#7A6A88] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Details */}
            <div className="space-y-3 text-xs">
              {/* Year Banner without color name */}
              {(() => {
                const theme = getYearTheme(detailCourse.year);
                return (
                  <div
                    className="p-3 rounded-xl border flex items-center justify-between"
                    style={{
                      backgroundColor: theme.softBgHex,
                      borderColor: theme.borderHex
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: theme.colorCode }}
                      />
                      <div>
                        <div className="font-bold text-[#1E1128]">
                          {detailCourse.stdYearThai} ({detailCourse.stdYearEng})
                        </div>
                        <div className="text-[11px] text-[#5C4A6E]">
                          {theme.phaseName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-[#241033]">{detailCourse.credit}</div>
                      <div className="text-[10px] text-[#7A6A88]">{detailCourse.semesterLabel}</div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2 bg-[#FCFAFE] p-3 rounded-xl border border-[#F2EBF8]">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[#7A6A88] font-medium">อาจารย์ผู้รับผิดชอบวิชา:</span>
                  <span className="font-bold text-[#241033] text-right">
                    {detailCourse.instructor}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-[#7A6A88] font-medium">ปีการศึกษา:</span>
                  <span className="font-semibold text-[#241033]">
                    {ACADEMIC_YEAR_DEFAULT} (พ.ศ. ๒๕๖๙)
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-[#7A6A88] font-medium">หมวดหมู่วิชา:</span>
                  <span className="font-semibold text-[#241033]">
                    {detailCourse.category === 'clinic'
                      ? 'ทันตกรรมคลินิก (Clinical Practice)'
                      : 'วิทยาศาสตร์ทันตกรรม (Dental Sciences)'}
                  </span>
                </div>
              </div>

              {detailCourse.specialLecturers && detailCourse.specialLecturers.length > 0 && (
                <div className="p-3 bg-[#FAF8FC] rounded-xl border border-[#EFE7F6] space-y-1">
                  <div className="font-bold text-[#4F0080] flex items-center gap-1.5">
                    <span>👥</span>
                    <span>รายชื่ออาจารย์พิเศษในรายวิชานี้:</span>
                  </div>
                  <ul className="list-disc list-inside text-[#4A3B5C] space-y-0.5 pl-1">
                    {detailCourse.specialLecturers.map((lec, idx) => (
                      <li key={idx}>{lec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-[#F2EBF8] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailCourse(null)}
                className="px-3 py-1.5 rounded-lg border border-[#E7DEF0] text-xs font-semibold text-[#5C4A6E] hover:bg-[#F8F6FB] cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>

              <button
                type="button"
                onClick={() => {
                  handleUseCatalogInLetter(detailCourse);
                  setDetailCourse(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-[#4F0080] hover:bg-[#3B0060] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
                <span>นำไปออกหนังสือเชิญทันที</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
