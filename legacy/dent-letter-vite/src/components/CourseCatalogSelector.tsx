import React, { useState, useMemo } from 'react';
import {
  COURSES_DATA,
  YEARS_LIST,
  SEMESTERS_LIST,
  CourseCatalogItem,
  ACADEMIC_YEAR_DEFAULT
} from '../data/coursesData';
import {
  YEAR_THEMES,
  YEAR_THEMES_LIST,
  getYearTheme
} from '../constants/yearColors';
import {
  BookOpen,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  User,
  GraduationCap,
  Calendar,
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';

interface CourseCatalogSelectorProps {
  onSelectCourse: (course: CourseCatalogItem, selectedLecturer?: string) => void;
  currentCourseName?: string;
  className?: string;
}

export const CourseCatalogSelector: React.FC<CourseCatalogSelectorProps> = ({
  onSelectCourse,
  currentCourseName,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(4); // Default to Year 4 for dental clinics/invitations
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2' | 'year' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>('20636402'); // Fixed Prosthodontics default

  // Filtered courses based on Year, Semester, and Search Query
  const filteredCourses = useMemo(() => {
    return COURSES_DATA.filter((course) => {
      // Year filter
      if (selectedYear !== 'all' && course.year !== selectedYear) {
        return false;
      }
      // Semester filter
      if (selectedSemester !== 'all' && course.semester !== selectedSemester) {
        return false;
      }
      // Search query filter (matches code, name, instructor, or note)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = course.code.toLowerCase().includes(q);
        const matchesName = course.name.toLowerCase().includes(q);
        const matchesInstructor = course.instructor.toLowerCase().includes(q);
        const matchesSpecial = course.specialLecturers?.some((lec) =>
          lec.toLowerCase().includes(q)
        );
        return matchesCode || matchesName || matchesInstructor || matchesSpecial;
      }
      return true;
    });
  }, [selectedYear, selectedSemester, searchQuery]);

  // Current active course object
  const activeCourse = useMemo(() => {
    return (
      COURSES_DATA.find((c) => c.code === selectedCourseCode) ||
      filteredCourses[0] ||
      COURSES_DATA[0]
    );
  }, [selectedCourseCode, filteredCourses]);

  const handleApplyCourse = (course: CourseCatalogItem, lecturerName?: string) => {
    setSelectedCourseCode(course.code);
    onSelectCourse(course, lecturerName);
  };

  const activeTheme = getYearTheme(activeCourse?.year);

  return (
    <div
      className={`bg-white border-2 border-[#D9C2EC] rounded-xl overflow-hidden shadow-xs transition-all ${className}`}
    >
      {/* Header with Toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-2.5 bg-gradient-to-r from-[#FAF6FD] to-[#F2EBF8] border-b border-[#E7DEF0] flex items-center justify-between cursor-pointer select-none hover:bg-[#F2EBF8] transition-colors"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-6 h-6 rounded-lg bg-[#4F0080] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
            <BookOpen className="w-3.5 h-3.5" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-[#4F0080]">
                คลังรายวิชาทันตแพทย์ สจล. ปี ๑ – ๖ (ปีการศึกษา ๒๕๖๙)
              </h3>
              <span className="text-[10px] bg-[#4F0080] text-white font-bold px-1.5 py-0.2 rounded-full">
                {COURSES_DATA.length} วิชา
              </span>
            </div>
            <p className="text-[10.5px] text-[#7A6A88]">
              เลือกวิชาเพื่อกรอกรหัสวิชา, ชื่อวิชา, ชั้นปี, และอาจารย์ผู้สอนลงหนังสืออัตโนมัติ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[#6C567E]">
          <span className="text-[11px] font-semibold hidden sm:inline">
            {isOpen ? 'ย่อแผง' : 'เปิดเลือกวิชา'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Collapsible Body */}
      {isOpen && (
        <div className="p-3.5 space-y-3 bg-[#FCFAFE]">
          {/* Cascading Filter Controls: Year & Semester Tabs */}
          <div className="space-y-2">
            {/* Year Selector Tabs (1 - 6) with scrub colors */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[11px] font-bold text-[#5C4A6E] mr-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-[#4F0080]" />
                <span>ชั้นปี:</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedYear('all')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                  selectedYear === 'all'
                    ? 'bg-[#4F0080] text-white border-[#4F0080] shadow-xs'
                    : 'bg-white text-[#5C4A6E] border-[#E7DEF0] hover:bg-[#F2EBF8]'
                }`}
              >
                ทั้งหมด
              </button>

              {YEAR_THEMES_LIST.map((y) => {
                const isActive = selectedYear === y.year;
                return (
                  <button
                    key={y.year}
                    type="button"
                    onClick={() => setSelectedYear(y.year)}
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                      isActive
                        ? 'shadow-xs font-bold text-white'
                        : 'bg-white text-[#5C4A6E] border-[#E7DEF0] hover:bg-[#F2EBF8]'
                    }`}
                    style={{
                      backgroundColor: isActive ? y.colorCode : undefined,
                      borderColor: isActive ? y.colorCode : undefined
                    }}
                    title={y.thaiLabel}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: isActive ? '#FFFFFF' : y.colorCode }}
                    />
                    <span>{y.shortThai}</span>
                  </button>
                );
              })}
            </div>

            {/* Semester Selector Tabs */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[11px] font-bold text-[#5C4A6E] mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#4F0080]" />
                <span>ภาคเรียน:</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedSemester('all')}
                className={`px-2 py-0.5 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer border ${
                  selectedSemester === 'all'
                    ? 'bg-[#4F0080] text-white border-[#4F0080] shadow-xs'
                    : 'bg-white text-[#5C4A6E] border-[#E7DEF0] hover:bg-[#F2EBF8]'
                }`}
              >
                ทั้งหมด
              </button>

              <button
                type="button"
                onClick={() => setSelectedSemester('1')}
                className={`px-2 py-0.5 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer border ${
                  selectedSemester === '1'
                    ? 'bg-[#4F0080] text-white border-[#4F0080] shadow-xs'
                    : 'bg-white text-[#5C4A6E] border-[#E7DEF0] hover:bg-[#F2EBF8]'
                }`}
              >
                ภาคเรียนที่ ๑
              </button>

              <button
                type="button"
                onClick={() => setSelectedSemester('2')}
                className={`px-2 py-0.5 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer border ${
                  selectedSemester === '2'
                    ? 'bg-[#4F0080] text-white border-[#4F0080] shadow-xs'
                    : 'bg-white text-[#5C4A6E] border-[#E7DEF0] hover:bg-[#F2EBF8]'
                }`}
              >
                ภาคเรียนที่ ๒
              </button>

              <button
                type="button"
                onClick={() => setSelectedSemester('year')}
                className={`px-2 py-0.5 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer border ${
                  selectedSemester === 'year'
                    ? 'bg-[#4F0080] text-white border-[#4F0080] shadow-xs'
                    : 'bg-white text-[#5C4A6E] border-[#E7DEF0] hover:bg-[#F2EBF8]'
                }`}
              >
                วิชารายปี / Clinic
              </button>
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A6A88]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัสวิชา (เช่น 20636402), ชื่อวิชา (เช่น Endodontics), หรือชื่ออาจารย์..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-white text-xs focus:outline-none focus:border-[#4F0080] focus:ring-2 focus:ring-[#4F0080]/15"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#7A6A88] hover:text-[#4F0080]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Quick Dropdown Selector for Exact Course */}
          <div>
            <label className="block text-[11px] font-bold text-[#5C4A6E] mb-1">
              เลือกรายวิชาในแคตตาล็อก ({filteredCourses.length} รายการ):
            </label>
            <select
              value={selectedCourseCode}
              onChange={(e) => {
                const found = COURSES_DATA.find((c) => c.code === e.target.value);
                if (found) {
                  setSelectedCourseCode(found.code);
                }
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-white text-xs focus:outline-none focus:border-[#4F0080] focus:ring-2 focus:ring-[#4F0080]/15 font-medium"
            >
              {filteredCourses.map((c) => {
                const theme = getYearTheme(c.year);
                return (
                  <option key={`${c.code}-${c.semester}`} value={c.code}>
                    [{c.code}] {c.name} ({theme.shortThai}) — {c.credit}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Course Details Box with Year Badge */}
          {activeCourse && (
            <div
              className="p-3 rounded-lg border space-y-2.5 transition-all relative overflow-hidden"
              style={{
                backgroundColor: activeTheme.softBgHex,
                borderColor: activeTheme.borderHex
              }}
            >
              {/* Left Color Indicator Strip */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: activeTheme.colorCode }}
              />

              <div className="flex items-start justify-between gap-3 pl-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#4F0080] bg-white px-2 py-0.5 rounded border border-[#DECBEF]">
                      {activeCourse.code}
                    </span>
                    <span className="text-[10px] bg-white text-[#5C4A6E] font-medium px-1.5 py-0.5 rounded border border-[#EFE7F6]">
                      {activeCourse.credit}
                    </span>

                    {/* Year Badge */}
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 bg-white border"
                      style={{
                        borderColor: activeTheme.borderHex,
                        color: activeTheme.colorCode
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: activeTheme.colorCode }}
                      />
                      <span>{activeCourse.stdYearThai}</span>
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#241033] mt-1">
                    {activeCourse.name}
                  </h4>
                </div>

                {/* Primary Auto-fill Button */}
                <button
                  type="button"
                  onClick={() => handleApplyCourse(activeCourse)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#4F0080] hover:bg-[#3B0060] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                  title="เติมข้อมูลวิชา ชั้นปี และปีการศึกษาลงในหนังสือทันที"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
                  <span>ใช้รายวิชานี้</span>
                </button>
              </div>

              {/* Responsible Instructor / Special Lecturers Direct Click Pills */}
              <div className="space-y-1.5 text-xs pl-1">
                <div className="flex items-center gap-1 text-[11px] text-[#5C4A6E]">
                  <User className="w-3.5 h-3.5 text-[#4F0080]" />
                  <span className="font-semibold">ผู้รับผิดชอบรายวิชา:</span>
                  <span className="font-medium text-[#241033]">{activeCourse.instructor}</span>
                </div>

                {/* If there are special lecturers or quick pick pills */}
                {activeCourse.specialLecturers && activeCourse.specialLecturers.length > 0 && (
                  <div className="pt-1 border-t border-slate-200/60">
                    <div className="text-[10.5px] font-semibold text-[#4F0080] mb-1">
                      💡 คลิกชื่ออาจารย์พิเศษเพื่อเติมลงในหนังสือทันที:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {activeCourse.specialLecturers.map((lecName, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyCourse(activeCourse, lecName)}
                          className="px-2 py-0.5 rounded-full bg-white hover:bg-[#4F0080] text-[#4F0080] hover:text-white text-[10px] font-medium border border-[#DECBEF] transition-all cursor-pointer shadow-2xs"
                          title={`ใช้รายวิชา ${activeCourse.name} และเชิญ ${lecName}`}
                        >
                          + {lecName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick List of Popular Clinic / Laboratory Courses */}
          <div className="pt-1">
            <span className="text-[10px] text-[#7A6A88] font-bold block mb-1">
              ⚡ รายวิชายอดนิยมที่ออกหนังสือเชิญบ่อย (คลิกเลือกด่วน):
            </span>
            <div className="flex flex-wrap gap-1">
              {[
                { code: '20636402', label: 'Fixed Prostho (ปี ๔)' },
                { code: '20636412', label: 'Endodontics II (ปี ๔)' },
                { code: '20636404', label: 'Pediatric Dent (ปี ๔)' },
                { code: '20636411', label: 'Endodontics I (ปี ๔)' },
                { code: '20636308', label: 'Operative Dent (ปี ๓)' },
                { code: '20636201', label: 'Dental Anatomy (ปี ๒)' },
                { code: '20646510', label: 'Prostho Clinic I (ปี ๕)' }
              ].map((item) => {
                const matched = COURSES_DATA.find((c) => c.code === item.code);
                if (!matched) return null;
                const isSelected = activeCourse.code === item.code;
                const theme = getYearTheme(matched.year);

                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleApplyCourse(matched)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#4F0080] text-white border-[#4F0080]'
                        : 'bg-white text-[#5C4A6E] border-[#E7DEF0] hover:bg-[#F2EBF8]'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: theme.colorCode }}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
