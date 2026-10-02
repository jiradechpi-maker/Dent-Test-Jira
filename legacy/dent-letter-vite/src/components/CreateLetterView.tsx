import React, { useState, useRef } from 'react';
import {
  LetterData,
  SystemStandard,
  Lecturer,
  Course,
  TeachingScheduleItem
} from '../types';
import { LetterPreview } from './LetterPreview';
import { CourseCatalogSelector } from './CourseCatalogSelector';
import { CourseCatalogItem } from '../data/coursesData';
import { formatThaiDate, toThaiDigits } from '../utils/thaiFormatter';
import { YEAR_THEMES_LIST, getYearTheme } from '../constants/yearColors';
import { Plus, Trash2, ArrowRight, UserPlus, BookmarkPlus, Calendar, Upload, RotateCcw, CheckCircle2, Image as ImageIcon, Save, FolderOpen } from 'lucide-react';

interface CreateLetterViewProps {
  data: LetterData;
  std: SystemStandard;
  logoUrl?: string;
  hasCustomLogo?: boolean;
  lecturers: Lecturer[];
  courses: Course[];
  onChange: (data: LetterData) => void;
  onNextNumber: () => void;
  onSaveLecturer: (name: string) => void;
  onSaveCourse: (name: string, year: string, std: string) => void;
  onNotification: (msg: string, type?: 'ok' | 'err' | 'warn') => void;
  onUploadLogo?: (dataUrl: string) => void;
  onResetLogo?: () => void;
  onUpdateLogoHeight?: (heightCm: number) => void;
  onUpdateStd?: (newStd: SystemStandard) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onSaveDraft?: (customTitle?: string) => void;
  onOpenDraftsModal?: () => void;
  draftsCount?: number;
  lastSavedTime?: string;
  onResetForm?: () => void;
  onExportDocx?: () => void;
  onPrint?: () => void;
}

export const CreateLetterView: React.FC<CreateLetterViewProps> = ({
  data,
  std,
  logoUrl,
  hasCustomLogo,
  lecturers,
  courses,
  onChange,
  onNextNumber,
  onSaveLecturer,
  onSaveCourse,
  onNotification,
  onUploadLogo,
  onResetLogo,
  onUpdateLogoHeight,
  onUpdateStd,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onSaveDraft,
  onOpenDraftsModal,
  draftsCount = 0,
  lastSavedTime,
  onResetForm,
  onExportDocx,
  onPrint
}) => {
  const [zoom, setZoom] = useState(1);
  const [showAxis, setShowAxis] = useState(true);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadLogo) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        onUploadLogo(result);
        onNotification('อัปโหลดและเปลี่ยนตราสัญลักษณ์ สจล. เรียบร้อยแล้ว ✅', 'ok');
      }
    };
    reader.readAsDataURL(file);
  };

  const updateField = <K extends keyof LetterData>(key: K, value: LetterData[K]) => {
    onChange({
      ...data,
      [key]: value
    });
  };

  const handleSelectCatalogCourse = (course: CourseCatalogItem, selectedLecturer?: string) => {
    const updatedData: LetterData = {
      ...data,
      course: course.name,
      stdYear: course.stdYearThai,
      acadYear: std.thaiNum ? '๒๕๖๙' : '2569'
    };
    if (selectedLecturer) {
      updatedData.lecturer = selectedLecturer;
      onChange(updatedData);
      onNotification(`เลือกวิชา "${course.name}" และอาจารย์ "${selectedLecturer}" แล้ว`, 'ok');
    } else {
      onChange(updatedData);
      onNotification(`เลือกรายวิชา "${course.name}" (${course.stdYearThai}) แล้ว`, 'ok');
    }
  };

  const handleDatePick = (isoString: string) => {
    if (!isoString) return;
    const formatted = formatThaiDate(isoString, std.thaiNum);
    onChange({
      ...data,
      datePickerValue: isoString,
      issue_date: formatted
    });
  };

  const handleAddRow = () => {
    const newItems: TeachingScheduleItem[] = [
      ...data.items,
      {
        id: `sched-${Date.now()}`,
        date: '',
        time: '',
        topic: '',
        hours: std.thaiNum ? '๓' : '3'
      }
    ];
    updateField('items', newItems);
  };

  const handleUpdateRow = (index: number, field: keyof TeachingScheduleItem, val: string) => {
    const formattedVal = (field === 'hours' || field === 'date' || field === 'time') && std.thaiNum
      ? toThaiDigits(val)
      : val;
    const updated = [...data.items];
    updated[index] = {
      ...updated[index],
      [field]: formattedVal
    };
    updateField('items', updated);
  };

  const handleRemoveRow = (index: number) => {
    const updated = data.items.filter((_, idx) => idx !== index);
    updateField('items', updated);
  };

  const handleClearRows = () => {
    if (window.confirm('ต้องการล้างตารางกำหนดการสอนทั้งหมดใช่หรือไม่?')) {
      updateField('items', []);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4 items-start">
      {/* Hidden Logo File Input */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
      />

      {/* Form Left Column */}
      <div className="space-y-3.5 max-h-[calc(100vh-120px)] overflow-y-auto pr-1 no-print">
        {/* Autosave & Draft Bar */}
        <div className="bg-white border border-[#E7DEF0] rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold text-[#1F8A5B]">
                บันทึกโครงร่างอัตโนมัติแล้ว
              </span>
              {lastSavedTime && (
                <span className="text-[10.5px] text-[#7A6A88] font-mono">
                  ({lastSavedTime})
                </span>
              )}
              <span className="text-[10px] text-[#7A6A88] hidden sm:inline">
                · เมื่อกลับเข้ามาใหม่โครงสร้างเดิมยังคงอยู่ครบ ๑๐๐%
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {onSaveDraft && (
                <button
                  type="button"
                  onClick={() => onSaveDraft()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8FC] hover:bg-[#F2EBF8] text-[#4F0080] border border-[#DECBEF] text-[11px] font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="บันทึกโครงร่างแบบฟอร์มลงเบราว์เซอร์ทันที"
                >
                  <Save className="w-3 h-3 text-[#4F0080]" />
                  <span>บันทึกโครงร่าง</span>
                </button>
              )}

              {onResetForm && (
                <button
                  type="button"
                  onClick={onResetForm}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-rose-50 text-[#B4003C] border border-rose-200 text-[10.5px] font-semibold transition-colors cursor-pointer"
                  title="ล้างข้อมูลในแบบฟอร์มเพื่อเริ่มฉบับใหม่"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>เริ่มใหม่</span>
                </button>
              )}

              {onOpenDraftsModal && (
                <button
                  type="button"
                  onClick={onOpenDraftsModal}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8FC] hover:bg-[#F2EBF8] text-[#5C4A6E] border border-[#DECBEF] text-[11px] font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="เปิดดูและเรียกคืนโครงร่างที่บันทึกไว้"
                >
                  <FolderOpen className="w-3 h-3 text-[#4F0080]" />
                  <span>โครงร่าง ({draftsCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Logo Configuration Card */}
        <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2">
            <h3 className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
              <span>🏛️</span>
              <span>ตราสัญลักษณ์ สจล. (โลโก้หัวกระดาษ)</span>
            </h3>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                hasCustomLogo
                  ? 'bg-[#E8F7EF] text-[#1F8A5B]'
                  : 'bg-[#F2EBF8] text-[#4F0080]'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>{hasCustomLogo ? 'ใช้รูปที่อัปโหลด' : 'ใช้ตรามาตรฐาน'}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 p-2.5 bg-[#FAF8FC] border border-[#EFE7F6] rounded-lg">
            <div
              onClick={() => logoInputRef.current?.click()}
              className="w-14 h-14 rounded-lg bg-white border border-[#E7DEF0] p-1 flex items-center justify-center shrink-0 cursor-pointer hover:border-[#6B00AD] group relative shadow-2xs"
              title="คลิกเพื่อเลือกไฟล์รูปภาพโลโก้ใหม่"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="ตราสัญลักษณ์ สจล."
                  className="max-w-full max-h-full object-contain group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-[#C4AED4]" />
              )}
              <div className="absolute inset-0 bg-[#4F0080]/10 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                <Upload className="w-4 h-4 text-[#4F0080]" />
              </div>
            </div>

            <div className="text-xs min-w-0 space-y-0.5">
              <div className="font-semibold text-[#241033] text-[11.5px]">
                {hasCustomLogo ? 'ไฟล์โลโก้ที่คุณอัปโหลดแล้ว' : 'ตราสัญลักษณ์พระมหาพิชัยมงกุฎ สจล.'}
              </div>
              <div className="text-[10.5px] text-[#7A6A88] leading-tight">
                คลิกรูปหรือปุ่มด้านล่างเพื่อเลือกไฟล์ภาพโลโก้ที่ถูกต้อง
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#4F0080] hover:bg-[#3D0063] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>อัปโหลดรูปโลโก้ใหม่</span>
            </button>

            {hasCustomLogo && onResetLogo && (
              <button
                type="button"
                onClick={onResetLogo}
                className="px-2.5 py-2 rounded-lg bg-[#F2EBF8] hover:bg-[#E8DCF4] text-[#4F0080] text-xs font-semibold transition-colors cursor-pointer"
                title="กลับไปใช้รูปตราเริ่มต้นของระบบ"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {onUpdateLogoHeight && (
            <div className="flex items-center justify-between pt-1 border-t border-[#F2EBF8] text-[11px]">
              <span className="text-[#5C4A6E] font-medium">ความสูงในเอกสาร:</span>
              <div className="flex gap-1">
                {[2.5, 3.0, 3.5].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onUpdateLogoHeight(h)}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-colors cursor-pointer ${
                      Math.abs(std.logoH - h) < 0.1
                        ? 'bg-[#4F0080] text-white'
                        : 'bg-[#F2EBF8] text-[#4F0080] hover:bg-[#E8DCF4]'
                    }`}
                  >
                    {h.toFixed(1)} ซม.
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Official KMITL Course Catalog (AY 2569) Cascading Selector */}
        <CourseCatalogSelector
          onSelectCourse={handleSelectCatalogCourse}
          currentCourseName={data.course}
        />

        {/* Letter Info Card */}
        <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2">
            <h3 className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
              <span>📝</span>
              <span>ข้อมูลหนังสือราชการ</span>
            </h3>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
              เลขที่หนังสือ
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={data.letter_no}
                onChange={(e) => updateField('letter_no', e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs font-medium focus:bg-white focus:outline-none focus:border-[#6B00AD] focus:ring-2 focus:ring-[#6B00AD]/15"
              />
              <button
                type="button"
                onClick={onNextNumber}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F2EBF8] hover:bg-[#E8DCF4] text-[#4F0080] text-xs font-semibold shrink-0 cursor-pointer transition-all"
                title="รันเลขหนังสือฉบับถัดไปอัตโนมัติ"
              >
                <span>เลขถัดไป</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#7A6A88]" />
                <span>เลือกจากปฏิทิน</span>
              </label>
              <input
                type="date"
                value={data.datePickerValue || ''}
                onChange={(e) => handleDatePick(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                วันที่พิมพ์ในเอกสาร
              </label>
              <input
                type="text"
                value={data.issue_date}
                onChange={(e) => updateField('issue_date', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
              />
            </div>
          </div>

          {/* Lecturer Field */}
          <div>
            <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
              คำนำหน้า + ชื่อ-นามสกุล อาจารย์พิเศษ
            </label>
            <input
              type="text"
              value={data.lecturer}
              onChange={(e) => updateField('lecturer', e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD] font-medium"
              placeholder="ผู้ช่วยศาสตราจารย์ ดร.ทพญ.สมศรี ใจดี"
            />
            {/* Quick picks */}
            {lecturers.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {lecturers.slice(0, 6).map((lec) => (
                  <button
                    key={lec.id}
                    type="button"
                    onClick={() => {
                      updateField('lecturer', lec.n);
                      onNotification(`เลือก "${lec.n}" แล้ว`);
                    }}
                    className="text-[10.5px] px-2 py-0.5 rounded-full bg-[#F2EBF8] hover:bg-[#4F0080] text-[#4F0080] hover:text-white transition-colors truncate max-w-[170px]"
                    title={lec.n}
                  >
                    {lec.n}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Course Field */}
          <div>
            <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
              ชื่อรายวิชา (ภาษาอังกฤษ)
            </label>
            <input
              type="text"
              value={data.course}
              onChange={(e) => updateField('course', e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD] font-medium"
              placeholder="Fixed Prosthodontics"
            />
            {/* Quick picks */}
            {courses.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {courses.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      updateField('course', c.n);
                      if (c.y) updateField('acadYear', c.y);
                      if (c.s) updateField('stdYear', c.s);
                      onNotification(`เลือกรายวิชา "${c.n}" แล้ว`);
                    }}
                    className="text-[10.5px] px-2 py-0.5 rounded-full bg-[#F2EBF8] hover:bg-[#4F0080] text-[#4F0080] hover:text-white transition-colors truncate max-w-[170px]"
                    title={c.n}
                  >
                    {c.n}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                ปีการศึกษา
              </label>
              <input
                type="text"
                value={data.acadYear}
                onChange={(e) => updateField('acadYear', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-[#5C4A6E]">
                  ชั้นปีนักศึกษา
                </label>
                {(() => {
                  const currentTheme = getYearTheme(data.stdYear);
                  return (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-1.5 border"
                      style={{
                        backgroundColor: currentTheme.softBgHex,
                        color: currentTheme.colorCode,
                        borderColor: currentTheme.borderHex
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: currentTheme.colorCode }}
                      />
                      <span>{currentTheme.thaiLabel}</span>
                    </span>
                  );
                })()}
              </div>
              <input
                type="text"
                value={data.stdYear}
                onChange={(e) => updateField('stdYear', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
              />
              {/* Quick Year Pickers */}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {YEAR_THEMES_LIST.map((theme) => {
                  const isCur = data.stdYear?.includes(theme.shortThai.replace('ปี ', '')) || data.stdYear === theme.thaiLabel;
                  return (
                    <button
                      key={theme.year}
                      type="button"
                      onClick={() => updateField('stdYear', theme.thaiLabel)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                        isCur
                          ? 'shadow-2xs text-white'
                          : 'bg-white text-[#5C4A6E] border-[#E7DEF0] hover:bg-[#FAF8FC]'
                      }`}
                      style={{
                        backgroundColor: isCur ? theme.colorCode : undefined,
                        borderColor: isCur ? theme.colorCode : undefined
                      }}
                      title={`${theme.thaiLabel} (${theme.phaseShort})`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: isCur ? '#FFFFFF' : theme.colorCode }}
                      />
                      <span>{theme.shortThai}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Coordinator Info */}
        <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2">
            <h3 className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
              <span>📞</span>
              <span>ผู้ประสานงานรายวิชา (ฝ่ายสนับสนุนวิชาการ)</span>
            </h3>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
              ชื่อ-นามสกุล ผู้ประสานงาน
            </label>
            <input
              type="text"
              value={data.coName}
              onChange={(e) => updateField('coName', e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                เบอร์โทรศัพท์
              </label>
              <input
                type="text"
                value={data.coPhone}
                onChange={(e) => updateField('coPhone', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                อีเมลติดต่อ
              </label>
              <input
                type="text"
                value={data.coMail}
                onChange={(e) => updateField('coMail', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
              />
            </div>
          </div>
        </div>

        {/* Teaching Schedule Rows */}
        <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2">
            <h3 className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
              <span>🗓️</span>
              <span>ตารางกำหนดการสอน (หน้า ๒)</span>
            </h3>
            <span className="text-[10px] text-[#7A6A88]">
              {data.items.length} คาบ
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
              รูปแบบตาราง
            </label>
            <select
              value={data.tableMode}
              onChange={(e) => updateField('tableMode', e.target.value as '3' | '4')}
              className="w-full px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
            >
              <option value="3">๓ คอลัมน์ — วัน/ เวลา · หัวข้อการสอน · จำนวนชั่วโมง</option>
              <option value="4">๔ คอลัมน์ — วัน/เดือน/ปี · เวลา · หัวข้อการสอน · จำนวนชั่วโมง</option>
            </select>
          </div>

          {/* Schedule list */}
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {data.items.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#E7DEF0] rounded-lg text-xs text-[#7A6A88]">
                ยังไม่มีคาบสอน — กดปุ่ม &quot;เพิ่มคาบสอน&quot; ด้านล่าง
              </div>
            ) : (
              data.items.map((row, idx) => (
                <div
                  key={row.id || idx}
                  className="p-3 bg-[#FCFAFE] border border-[#E7DEF0] rounded-lg space-y-2 text-xs hover:border-[#8B2FC9]/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#4F0080]">
                    <span>คาบที่ {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="text-[#B4003C] hover:text-red-700 p-0.5"
                      title="ลบคาบนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#7A6A88] block">วัน/เดือน/ปี</label>
                      <input
                        type="text"
                        value={row.date}
                        onChange={(e) => handleUpdateRow(idx, 'date', e.target.value)}
                        placeholder="พฤหัสบดีที่ ๑๗/๐๙/๖๙"
                        className="w-full px-2 py-1 rounded border border-[#E7DEF0] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#7A6A88] block">เวลา</label>
                      <input
                        type="text"
                        value={row.time}
                        onChange={(e) => handleUpdateRow(idx, 'time', e.target.value)}
                        placeholder="๐๙.๐๐ - ๑๒.๐๐ น."
                        className="w-full px-2 py-1 rounded border border-[#E7DEF0] bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#7A6A88] block">หัวข้อการสอน</label>
                    <textarea
                      rows={2}
                      value={row.topic}
                      onChange={(e) => handleUpdateRow(idx, 'topic', e.target.value)}
                      placeholder="หัวข้อการสอน..."
                      className="w-full px-2 py-1 rounded border border-[#E7DEF0] bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#7A6A88] block">จำนวนชั่วโมง</label>
                    <input
                      type="text"
                      value={row.hours}
                      onChange={(e) => handleUpdateRow(idx, 'hours', e.target.value)}
                      placeholder="๓"
                      className="w-24 px-2 py-1 rounded border border-[#E7DEF0] bg-white text-xs font-medium"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddRow}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2EBF8] hover:bg-[#E8DCF4] text-[#4F0080] text-xs font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มคาบสอน</span>
            </button>
            <button
              type="button"
              onClick={handleClearRows}
              className="px-3 py-1.5 rounded-lg bg-[#FCE9EF] hover:bg-[#F8DCE5] text-[#B4003C] text-xs font-semibold cursor-pointer transition-colors"
            >
              ล้างทั้งหมด
            </button>
          </div>
        </div>

        {/* Quick Save to DB */}
        <div className="bg-white border border-[#E7DEF0] rounded-xl p-3.5 shadow-xs space-y-2">
          <div className="text-[11px] font-bold text-[#4F0080]">
            💾 บันทึกค่าด่วนเข้าทะเบียน
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSaveLecturer(data.lecturer)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FCFAFE] hover:bg-[#F2EBF8] border border-[#E7DEF0] text-[11px] font-semibold text-[#4F0080] transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>เก็บชื่ออาจารย์</span>
            </button>
            <button
              type="button"
              onClick={() => onSaveCourse(data.course, data.acadYear, data.stdYear)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FCFAFE] hover:bg-[#F2EBF8] border border-[#E7DEF0] text-[11px] font-semibold text-[#4F0080] transition-colors"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>เก็บรายวิชา</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Live A4 Document Preview */}
      <div className="sticky top-[72px]">
        <LetterPreview
          data={data}
          std={std}
          logoUrl={logoUrl}
          zoom={zoom}
          showAxis={showAxis}
          onZoomChange={setZoom}
          onToggleAxis={setShowAxis}
          onUploadLogo={onUploadLogo}
          onUpdateStd={onUpdateStd}
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onExportDocx={onExportDocx}
          onPrint={onPrint}
        />
      </div>
    </div>
  );
};
