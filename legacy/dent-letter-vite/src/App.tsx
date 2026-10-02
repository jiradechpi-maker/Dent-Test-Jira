import React, { useState, useEffect, useCallback } from 'react';
import {
  LetterData,
  Lecturer,
  Course,
  DocumentHistoryItem,
  SystemStandard,
  LetterDraft
} from './types';
import {
  DEFAULT_STD,
  DEFAULT_LETTER_DATA,
  INITIAL_LECTURERS,
  INITIAL_COURSES,
  DEFAULT_KMITL_LOGO,
  OFFICIAL_INFO
} from './constants/defaults';
import { Sidebar, ViewTab } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { CreateLetterView } from './components/CreateLetterView';
import { BatchImportView } from './components/BatchImportView';
import { LecturersView } from './components/LecturersView';
import { CoursesView } from './components/CoursesView';
import { HistoryView } from './components/HistoryView';
import { DisbursementView } from './components/DisbursementView';
import { HelpSettingsView } from './components/HelpSettingsView';
import { DraftsModal } from './components/DraftsModal';
import { exportInvitationDocx } from './utils/docxExport';
import { generatePdfFromElements, downloadPdfBlob } from './utils/pdfExport';
import { toThaiDigits } from './utils/thaiFormatter';
import saveAs from 'file-saver';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('create');

  // Standard settings (Persistent across page reloads)
  const [std, setStd] = useState<SystemStandard>(() => {
    try {
      const saved = localStorage.getItem('dent_std');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STD,
          ...parsed,
          fs: (!parsed.fs || parsed.fs < 14) ? 16 : parsed.fs,
          logoPx: 113
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_STD;
  });

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('dent_logo');
      if (stored) return stored;
    } catch {
      // fallback
    }
    return DEFAULT_KMITL_LOGO;
  });

  const [hasCustomLogo, setHasCustomLogo] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('dent_logo');
    } catch {
      return false;
    }
  });

  const handleUpdateLogoHeight = (heightCm: number) => {
    setStd((prev) => ({
      ...prev,
      logoH: heightCm
    }));
    showNotification(`ปรับความสูงตราสัญลักษณ์เป็น ${heightCm.toFixed(1)} ซม. แล้ว`, 'ok');
  };

  // Main Form Data
  const [letterData, setLetterData] = useState<LetterData>(() => {
    try {
      const saved = localStorage.getItem('dent_form');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_LETTER_DATA;
  });

  // Lecturers Directory
  const [lecturers, setLecturers] = useState<Lecturer[]>(() => {
    try {
      const saved = localStorage.getItem('dent_lect');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_LECTURERS;
  });

  // Courses Catalog
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem('dent_course');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_COURSES;
  });

  // History List
  const [history, setHistory] = useState<DocumentHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('dent_hist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Topbar Alert Banner
  const [alert, setAlert] = useState<{ message: string; type: 'ok' | 'err' | 'warn' } | null>(null);

  const showNotification = useCallback((message: string, type: 'ok' | 'err' | 'warn' = 'ok') => {
    setAlert({ message, type });
    if (type !== 'err') {
      setTimeout(() => {
        setAlert((prev) => (prev?.message === message ? null : prev));
      }, 4500);
    }
  }, []);

  // ================= UNDO / REDO HISTORY ENGINE =================
  interface HistorySnapshot {
    letterData: LetterData;
    std: SystemStandard;
  }

  const historyStackRef = React.useRef<HistorySnapshot[]>([
    {
      letterData: JSON.parse(JSON.stringify(letterData)),
      std: JSON.parse(JSON.stringify(std))
    }
  ]);
  const historyIndexRef = React.useRef<number>(0);
  const isUndoRedoActionRef = React.useRef<boolean>(false);
  const debounceTimerRef = React.useRef<any>(null);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateCanUndoRedo = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyStackRef.current.length - 1);
  }, []);

  // Helper to record changes
  const recordHistory = useCallback(
    (newData: LetterData, newStd: SystemStandard) => {
      if (isUndoRedoActionRef.current) {
        isUndoRedoActionRef.current = false;
        return;
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const currentSnapshot = historyStackRef.current[historyIndexRef.current];
        if (currentSnapshot) {
          const dataUnchanged = JSON.stringify(currentSnapshot.letterData) === JSON.stringify(newData);
          const stdUnchanged = JSON.stringify(currentSnapshot.std) === JSON.stringify(newStd);
          if (dataUnchanged && stdUnchanged) return;
        }

        // Truncate future redos
        const newStack = historyStackRef.current.slice(0, historyIndexRef.current + 1);
        newStack.push({
          letterData: JSON.parse(JSON.stringify(newData)),
          std: JSON.parse(JSON.stringify(newStd))
        });

        // Limit stack size to 60 items
        if (newStack.length > 60) {
          newStack.shift();
        }

        historyStackRef.current = newStack;
        historyIndexRef.current = newStack.length - 1;
        updateCanUndoRedo();
      }, 300);
    },
    [updateCanUndoRedo]
  );

  const handleUpdateLetterData = useCallback(
    (newData: LetterData | ((prev: LetterData) => LetterData)) => {
      setLetterData((prev) => {
        const resolved = typeof newData === 'function' ? newData(prev) : newData;
        recordHistory(resolved, std);
        return resolved;
      });
    },
    [std, recordHistory]
  );

  const handleUpdateStd = useCallback(
    (newStd: SystemStandard | ((prev: SystemStandard) => SystemStandard)) => {
      setStd((prev) => {
        const resolved = typeof newStd === 'function' ? newStd(prev) : newStd;
        recordHistory(letterData, resolved);
        return resolved;
      });
    },
    [letterData, recordHistory]
  );

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const snapshot = historyStackRef.current[historyIndexRef.current];
      isUndoRedoActionRef.current = true;
      setLetterData(JSON.parse(JSON.stringify(snapshot.letterData)));
      setStd(JSON.parse(JSON.stringify(snapshot.std)));
      updateCanUndoRedo();
      showNotification('ย้อนกลับการแก้ไขแล้ว (Undo) ↩️', 'ok');
    }
  }, [showNotification, updateCanUndoRedo]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyStackRef.current.length - 1) {
      historyIndexRef.current += 1;
      const snapshot = historyStackRef.current[historyIndexRef.current];
      isUndoRedoActionRef.current = true;
      setLetterData(JSON.parse(JSON.stringify(snapshot.letterData)));
      setStd(JSON.parse(JSON.stringify(snapshot.std)));
      updateCanUndoRedo();
      showNotification('ทำซ้ำการแก้ไขแล้ว (Redo) ↪️', 'ok');
    }
  }, [showNotification, updateCanUndoRedo]);

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z, Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Save to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem('dent_form', JSON.stringify(letterData));
    } catch {
      // ignore
    }
  }, [letterData]);

  useEffect(() => {
    try {
      localStorage.setItem('dent_lect', JSON.stringify(lecturers));
    } catch {
      // ignore
    }
  }, [lecturers]);

  useEffect(() => {
    try {
      localStorage.setItem('dent_course', JSON.stringify(courses));
    } catch {
      // ignore
    }
  }, [courses]);

  useEffect(() => {
    try {
      localStorage.setItem('dent_hist', JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem('dent_std', JSON.stringify(std));
    } catch {
      // ignore
    }
  }, [std]);

  // Handle Logo Upload & Reset
  const handleUploadLogo = (newUrl: string) => {
    setLogoUrl(newUrl);
    setHasCustomLogo(true);
    try {
      localStorage.setItem('dent_logo', newUrl);
    } catch {
      // ignore
    }
  };

  const handleResetLogo = () => {
    setLogoUrl(DEFAULT_KMITL_LOGO);
    setHasCustomLogo(false);
    try {
      localStorage.removeItem('dent_logo');
    } catch {
      // ignore
    }
    showNotification('กลับไปใช้ตราสัญลักษณ์มาตรฐาน สจล. แล้ว', 'ok');
  };

  // Next running letter number
  const handleNextNumber = () => {
    const nextRun = (letterData.runNo || 311) + 1;
    const formattedNum = std.thaiNum ? toThaiDigits(nextRun) : nextRun;
    const fullNo = `${OFFICIAL_INFO.runPrefix} ${formattedNum}`;
    setLetterData((prev) => ({
      ...prev,
      runNo: nextRun,
      letter_no: fullNo
    }));
    showNotification(`รันเลขหนังสือเป็น "${fullNo}" แล้ว ✅`, 'ok');
  };

  // Draft persistence state & explicit Save Draft
  const [drafts, setDrafts] = useState<LetterDraft[]>(() => {
    try {
      const saved = localStorage.getItem('dent_drafts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('dent_drafts', JSON.stringify(drafts));
    } catch {}
  }, [drafts]);

  const [lastSavedTime, setLastSavedTime] = useState<string>(() => {
    try {
      const t = localStorage.getItem('dent_last_saved');
      if (t) return t;
    } catch {}
    return new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  });

  const handleSaveDraft = useCallback((customTitle?: string) => {
    try {
      localStorage.setItem('dent_form', JSON.stringify(letterData));
      localStorage.setItem('dent_std', JSON.stringify(std));
      const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem('dent_last_saved', nowStr);
      setLastSavedTime(nowStr);

      const title = customTitle || `${letterData.course || 'หนังสือเชิญ'} (${letterData.letter_no || 'ไม่ระบุเลข'})`;
      const newDraft: LetterDraft = {
        id: `draft-${Date.now()}`,
        title,
        savedAt: new Date().toISOString(),
        letterNo: letterData.letter_no,
        course: letterData.course,
        lecturer: letterData.lecturer,
        data: JSON.parse(JSON.stringify(letterData))
      };
      setDrafts((prev) => [newDraft, ...prev.slice(0, 49)]);
      showNotification('บันทึกโครงร่างเอกสารเรียบร้อยแล้ว ✅ (เมื่อเข้ามาใหม่ ข้อมูลจะคงอยู่เหมือนเดิม 100%)', 'ok');
    } catch {
      showNotification('ไม่สามารถบันทึกร่างลงหน่วยความจำเบราว์เซอร์ได้', 'err');
    }
  }, [letterData, std, showNotification]);

  const handleRestoreDraft = useCallback((draft: LetterDraft) => {
    setLetterData(JSON.parse(JSON.stringify(draft.data)));
    setCurrentTab('create');
    showNotification(`เรียกคืนโครงร่าง "${draft.title}" สู่แบบฟอร์มแล้ว ✅`, 'ok');
  }, [showNotification]);

  const handleDeleteDraft = useCallback((id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    showNotification('ลบโครงร่างที่บันทึกแล้ว', 'ok');
  }, [showNotification]);

  const handleResetForm = useCallback(() => {
    if (window.confirm('ต้องการล้างแบบฟอร์มเพื่อเริ่มสร้างฉบับใหม่ใช่หรือไม่? (ข้อมูลปัจจุบันจะถูกรีเซ็ต)')) {
      setLetterData(DEFAULT_LETTER_DATA);
      showNotification('รีเซ็ตแบบฟอร์มเพื่อเริ่มฉบับใหม่แล้ว', 'ok');
    }
  }, [showNotification]);

  // Quick save lecturer from current form
  const handleSaveLecturerFromForm = (name: string) => {
    if (!name.trim()) {
      showNotification('ยังไม่มีชื่ออาจารย์ในแบบฟอร์ม', 'err');
      return;
    }
    if (lecturers.some((l) => l.n.trim() === name.trim())) {
      showNotification('มีชื่ออาจารย์ท่านนี้ในทะเบียนแล้ว', 'warn');
      return;
    }
    const newLec: Lecturer = {
      id: `lec-${Date.now()}`,
      n: name.trim(),
      note: 'คณะทันตแพทยศาสตร์'
    };
    setLecturers((prev) => [newLec, ...prev]);
    showNotification(`บันทึก "${name}" เข้าทะเบียนเรียบร้อย ✅`, 'ok');
  };

  // Quick save course from current form
  const handleSaveCourseFromForm = (courseName: string, year: string, stdYear: string) => {
    if (!courseName.trim()) {
      showNotification('ยังไม่มีชื่อรายวิชาในแบบฟอร์ม', 'err');
      return;
    }
    if (courses.some((c) => c.n.trim() === courseName.trim())) {
      showNotification('มีรายวิชานี้ในคลังแล้ว', 'warn');
      return;
    }
    const newCourse: Course = {
      id: `crs-${Date.now()}`,
      n: courseName.trim(),
      y: year.trim(),
      s: stdYear.trim()
    };
    setCourses((prev) => [newCourse, ...prev]);
    showNotification(`บันทึกรายวิชา "${courseName}" เข้าคลังเรียบร้อย ✅`, 'ok');
  };

  // Add history item
  const addHistoryItem = (data: LetterData) => {
    const newItem: DocumentHistoryItem = {
      id: `hist-${Date.now()}`,
      t: new Date().toISOString(),
      no: data.letter_no,
      lect: data.lecturer,
      course: data.course,
      year: data.acadYear,
      std: data.stdYear,
      co: data.coName,
      ph: data.coPhone,
      mail: data.coMail,
      date: data.issue_date,
      mode: data.tableMode,
      items: JSON.parse(JSON.stringify(data.items))
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 199)]);
  };

  // Word export for current letter
  const handleExportDocx = async () => {
    try {
      await exportInvitationDocx(letterData, std, logoUrl);
      addHistoryItem(letterData);
      showNotification(`ดาวน์โหลดไฟล์ Word สำเร็จ และบันทึกเข้าประวัติแล้ว ✅`, 'ok');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`สร้างไฟล์ Word ไม่สำเร็จ: ${msg}`, 'err');
    }
  };

  const handlePrint = async () => {
    try {
      const page1 = document.getElementById('a4-page-1');
      const page2 = document.getElementById('a4-page-2');
      const pagesToRender: HTMLElement[] = [];
      if (page1) pagesToRender.push(page1);
      if (page2 && letterData.items && letterData.items.length > 0) pagesToRender.push(page2);

      if (pagesToRender.length > 0) {
        showNotification('กำลังสร้างไฟล์ PDF สำหรับดาวน์โหลด...', 'ok');
        const { blobUrl } = await generatePdfFromElements(pagesToRender);
        downloadPdfBlob(blobUrl, `หนังสือเชิญ_${letterData.lecturer || 'อาจารย์พิเศษ'}.pdf`);
        addHistoryItem(letterData);
        showNotification('ดาวน์โหลดไฟล์ PDF เรียบร้อยแล้ว ✅', 'ok');
      } else {
        window.print();
      }
    } catch (err: unknown) {
      console.warn('PDF direct generation failed, fallback to print:', err);
      window.print();
    }
  };

  // Restore history into main form
  const handleRestoreHistory = (item: DocumentHistoryItem) => {
    setLetterData({
      letter_no: item.no,
      runNo: letterData.runNo,
      issue_date: item.date,
      lecturer: item.lect,
      course: item.course,
      acadYear: item.year,
      stdYear: item.std,
      coName: item.co,
      coPhone: item.ph,
      coMail: item.mail,
      tableMode: item.mode,
      items: JSON.parse(JSON.stringify(item.items || []))
    });
    setCurrentTab('create');
    showNotification(`เรียกคืนเอกสารเลขที่ "${item.no}" สู่แบบฟอร์มแล้ว ✅`, 'ok');
  };

  // Delete history item
  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    showNotification('ลบรายการประวัติแล้ว', 'ok');
  };

  const handleClearAllHistory = () => {
    if (window.confirm('ต้องการล้างประวัติเอกสารทั้งหมดใช่หรือไม่?')) {
      setHistory([]);
      showNotification('ล้างประวัติเอกสารเรียบร้อยแล้ว', 'ok');
    }
  };

  // Lecturers management
  const handleAddLecturer = (lec: Omit<Lecturer, 'id'>) => {
    const newLec: Lecturer = { ...lec, id: `lec-${Date.now()}` };
    setLecturers((prev) => [newLec, ...prev]);
    showNotification(`เพิ่มอาจารย์ "${lec.n}" เข้าทะเบียนแล้ว ✅`, 'ok');
  };

  const handleUpdateLecturer = (id: string, updated: Partial<Lecturer>) => {
    setLecturers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updated } : l))
    );
    showNotification('อัปเดตข้อมูลอาจารย์เรียบร้อย ✅', 'ok');
  };

  const handleDeleteLecturer = (id: string) => {
    setLecturers((prev) => prev.filter((l) => l.id !== id));
    showNotification('ลบอาจารย์ออกจากทะเบียนแล้ว', 'ok');
  };

  const handleSelectLecturer = (lec: Lecturer) => {
    setLetterData((prev) => ({
      ...prev,
      lecturer: lec.n
    }));
    setCurrentTab('create');
    showNotification(`เลือกอาจารย์ "${lec.n}" เรียบร้อยแล้ว`, 'ok');
  };

  // Courses management
  const handleAddCourse = (c: Omit<Course, 'id'>) => {
    const newC: Course = { ...c, id: `crs-${Date.now()}` };
    setCourses((prev) => [newC, ...prev]);
    showNotification(`เพิ่มวิชา "${c.n}" เข้าคลังเรียบร้อย ✅`, 'ok');
  };

  const handleUpdateCourse = (id: string, updated: Partial<Course>) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
    showNotification('อัปเดตข้อมูลรายวิชาเรียบร้อย ✅', 'ok');
  };

  const handleDeleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    showNotification('ลบรายวิชาออกจากคลังแล้ว', 'ok');
  };

  const handleSelectCourse = (course: Course) => {
    setLetterData((prev) => ({
      ...prev,
      course: course.n,
      acadYear: course.y || prev.acadYear,
      stdYear: course.s || prev.stdYear
    }));
    setCurrentTab('create');
    showNotification(`เลือกรายวิชา "${course.n}" เรียบร้อยแล้ว`, 'ok');
  };

  // Backup & Restore
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      letterData,
      lecturers,
      courses,
      history,
      drafts
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json'
    });
    saveAs(blob, `dent_letter_backup_${new Date().toISOString().slice(0, 10)}.json`);
    showNotification('ส่งออกไฟล์สำรองฐานข้อมูลสำเร็จ ✅', 'ok');
  };

  const handleImportBackup = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.letterData) setLetterData(data.letterData);
      if (Array.isArray(data.lecturers)) setLecturers(data.lecturers);
      if (Array.isArray(data.courses)) setCourses(data.courses);
      if (Array.isArray(data.history)) setHistory(data.history);
      if (Array.isArray(data.drafts)) setDrafts(data.drafts);
      showNotification('นำเข้าฐานข้อมูลสำรองเรียบร้อยสมบูรณ์ ✅', 'ok');
    } catch {
      showNotification('ไฟล์สำรองไม่ถูกต้อง หรือรูปแบบผิดพลาด', 'err');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F6FB] text-[#241033] app-layout">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        lecturerCount={lecturers.length}
        courseCount={courses.length}
        historyCount={history.length}
        currentLetterNo={letterData.letter_no}
        hasLogo={hasCustomLogo || !!logoUrl}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 main-viewport">
        <Topbar
          currentTab={currentTab}
          onExportDocx={handleExportDocx}
          onPrint={handlePrint}
          alert={alert}
          onDismissAlert={() => setAlert(null)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onSaveDraft={handleSaveDraft}
          lastSavedTime={lastSavedTime}
          draftsCount={drafts.length}
          onOpenDraftsModal={() => setIsDraftsModalOpen(true)}
        />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {currentTab === 'dash' && (
            <DashboardView
              history={history}
              lecturerCount={lecturers.length}
              courseCount={courses.length}
              currentLetterNo={letterData.letter_no}
              std={std}
              onNavigate={setCurrentTab}
              onRestoreHistory={handleRestoreHistory}
            />
          )}

          {currentTab === 'create' && (
            <CreateLetterView
              data={letterData}
              std={std}
              logoUrl={logoUrl}
              hasCustomLogo={hasCustomLogo}
              lecturers={lecturers}
              courses={courses}
              onChange={handleUpdateLetterData}
              onNextNumber={handleNextNumber}
              onSaveLecturer={handleSaveLecturerFromForm}
              onSaveCourse={handleSaveCourseFromForm}
              onNotification={showNotification}
              onUploadLogo={handleUploadLogo}
              onResetLogo={handleResetLogo}
              onUpdateLogoHeight={handleUpdateLogoHeight}
              onUpdateStd={handleUpdateStd}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              onSaveDraft={handleSaveDraft}
              lastSavedTime={lastSavedTime}
              onResetForm={handleResetForm}
              draftsCount={drafts.length}
              onOpenDraftsModal={() => setIsDraftsModalOpen(true)}
              onExportDocx={handleExportDocx}
              onPrint={handlePrint}
            />
          )}

          {currentTab === 'batch' && (
            <BatchImportView
              std={std}
              logoUrl={logoUrl}
              onNotification={showNotification}
            />
          )}

          {currentTab === 'lect' && (
            <LecturersView
              lecturers={lecturers}
              onAddLecturer={handleAddLecturer}
              onUpdateLecturer={handleUpdateLecturer}
              onDeleteLecturer={handleDeleteLecturer}
              onSelectLecturer={handleSelectLecturer}
            />
          )}

          {currentTab === 'course' && (
            <CoursesView
              courses={courses}
              onAddCourse={handleAddCourse}
              onUpdateCourse={handleUpdateCourse}
              onDeleteCourse={handleDeleteCourse}
              onSelectCourse={handleSelectCourse}
            />
          )}

          {currentTab === 'hist' && (
            <HistoryView
              history={history}
              std={std}
              logoUrl={logoUrl}
              onRestore={handleRestoreHistory}
              onDelete={handleDeleteHistory}
              onClearAll={handleClearAllHistory}
              onNotification={showNotification}
            />
          )}

          {currentTab === 'pay' && (
            <DisbursementView
              currentLetter={letterData}
              history={history}
              lecturers={lecturers}
              std={std}
              logoUrl={logoUrl}
              onNotification={showNotification}
            />
          )}

          {currentTab === 'help' && (
            <HelpSettingsView
              std={std}
              logoUrl={logoUrl}
              hasCustomLogo={hasCustomLogo}
              onUploadLogo={handleUploadLogo}
              onResetLogo={handleResetLogo}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onNotification={showNotification}
            />
          )}
        </main>
      </div>

      {/* Saved Drafts Manager Modal */}
      <DraftsModal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        drafts={drafts}
        currentLetterNo={letterData.letter_no}
        currentCourse={letterData.course}
        onSaveCurrentDraft={handleSaveDraft}
        onRestoreDraft={handleRestoreDraft}
        onDeleteDraft={handleDeleteDraft}
      />
    </div>
  );
}
