import React, { useRef, useState } from 'react';
import { LetterData, SystemStandard } from '../types';
import { OFFICIAL_INFO, DEFAULT_STD } from '../constants/defaults';
import { generatePdfFromElements, downloadPdfBlob } from '../utils/pdfExport';
import {
  ImagePlus,
  Sliders,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Move,
  AlignLeft,
  Sparkles,
  Undo2,
  Redo2,
  Type,
  Split,
  Maximize2,
  Minimize2,
  Check,
  AlignJustify,
  Ruler,
  Compass,
  Layers,
  Crosshair,
  Printer,
  Download,
  FileDown,
  Loader2
} from 'lucide-react';

interface LetterPreviewProps {
  data: LetterData;
  std: SystemStandard;
  logoUrl?: string;
  zoom: number;
  showAxis: boolean;
  onZoomChange: (zoom: number) => void;
  onToggleAxis: (show: boolean) => void;
  onUploadLogo?: (dataUrl: string) => void;
  onUpdateStd?: (newStd: SystemStandard) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onExportDocx?: () => void;
  onPrint?: () => void;
}

type TuningTab = 'typography' | 'paragraphs' | 'positions' | 'spacing' | 'ruler_inspector';

export const LetterPreview: React.FC<LetterPreviewProps> = ({
  data,
  std,
  logoUrl,
  zoom,
  showAxis,
  onZoomChange,
  onToggleAxis,
  onUploadLogo,
  onUpdateStd,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onExportDocx,
  onPrint
}) => {
  const [showTuning, setShowTuning] = useState(false);
  const [tuningTab, setTuningTab] = useState<TuningTab>('ruler_inspector');
  const [guideMode, setGuideMode] = useState<'all' | 'vertical' | 'horizontal' | 'center' | 'none'>('all');
  const [showGuideLabels, setShowGuideLabels] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const contentW = 21.0 - std.mL - std.mR; // 16.0 cm
  const contentH = 29.7 - std.mT - std.mB; // 26.4 cm
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Direct client-side PDF download using <a> tag from Blob URL (bypasses iframe sandbox)
  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      const page1 = document.getElementById('a4-page-1');
      const page2 = document.getElementById('a4-page-2');
      const pagesToRender: HTMLElement[] = [];
      if (page1) pagesToRender.push(page1);
      if (page2 && data.items && data.items.length > 0) pagesToRender.push(page2);

      if (pagesToRender.length === 0) {
        window.print();
        return;
      }

      const { blobUrl } = await generatePdfFromElements(pagesToRender);
      downloadPdfBlob(blobUrl, `หนังสือเชิญ_${data.lecturer || 'อาจารย์พิเศษ'}.pdf`);
    } catch (err) {
      console.warn('Direct PDF download failed, falling back to print:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadLogo) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        onUploadLogo(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateStdField = <K extends keyof SystemStandard>(key: K, value: SystemStandard[K]) => {
    if (onUpdateStd) {
      onUpdateStd({
        ...std,
        [key]: value
      });
    }
  };

  const handleResetToStandard = () => {
    if (onUpdateStd) {
      onUpdateStd({
        ...DEFAULT_STD
      });
    }
  };

  // Prepend 6 spaces for writing day by hand if date doesn't start with day digits
  const formatIssueDate = (dStr: string) => {
    const trimmed = (dStr || '').trim();
    if (!trimmed) return '      กันยายน ๒๕๖๙';
    if (/^\d|^[๑-๙]/.test(trimmed)) {
      return trimmed;
    }
    return `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0${trimmed}`;
  };

  // Split footer strictly into 2 lines (Line 1: คณะ..., Line 2: โทรศัพท์...)
  const footerLines = OFFICIAL_INFO.foot2
    ? [OFFICIAL_INFO.foot1, OFFICIAL_INFO.foot2]
    : OFFICIAL_INFO.foot1.split('/').map((s) => s.trim());

  // Typography computation
  const textAlign = std.alignMode === 'left' ? 'left' : 'justify';
  const textJustify = std.alignMode === 'left' ? 'auto' : (std.textJustify || 'inter-cluster');
  const lineBreakMode = std.lineBreakMode || 'strict';
  const wordBreakMode = std.wordBreak || 'break-word';
  const charScale = std.charScale ?? 100;

  // Spacing type helper (Expanded / Condensed / Normal)
  const currentSpacingType =
    std.lsp > 0.02 ? 'expanded' : std.lsp < -0.02 ? 'condensed' : 'normal';

  // Per-paragraph individual line-spacing and space after
  const getParagraphStyle = (lhVal?: number, mbVal?: number, isFirst = false): React.CSSProperties => {
    const effectiveLh = lhVal ?? std.lh ?? 1.15;
    const effectiveMb = mbVal ?? std.paraSpacing ?? 12;
    const effectiveMt = isFirst ? (std.paraSpacing ?? 12) : 0;

    return {
      marginTop: `${effectiveMt}pt`,
      marginBottom: `${effectiveMb}pt`,
      lineHeight: effectiveLh,
      textIndent: `${std.rIndent}cm`,
      textAlign: textAlign as any,
      textJustify: textJustify as any,
      textAlignLast: 'left',
      lineBreak: lineBreakMode as any,
      WebkitLineBreak: lineBreakMode as any,
      wordBreak: wordBreakMode as any,
      overflowWrap: 'break-word',
      letterSpacing: `${std.lsp}px`,
      wordSpacing: `${std.wsp}px`,
      transform: charScale !== 100 ? `scaleX(${charScale / 100})` : undefined,
      transformOrigin: 'left top'
    };
  };

  const p1Style = getParagraphStyle(std.p1Lh, std.p1Mb, true);
  const p2Style = getParagraphStyle(std.p2Lh, std.p2Mb, false);
  const p3Style = getParagraphStyle(std.p3Lh, std.p3Mb, false);
  const p4Style = getParagraphStyle(std.p4Lh, std.p4Mb, false);
  const bodyParagraphStyle = p1Style;

  return (
    <div className="flex flex-col h-full">
      {/* Hidden file input for quick logo upload */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Control Toolbar */}
      <div className="bg-white border border-[#E7DEF0] rounded-xl px-3 py-2 flex items-center justify-between gap-2.5 flex-wrap mb-2 text-xs no-print shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[#4F0080]">ตัวอย่างเอกสาร A4</span>

          {/* Undo / Redo Buttons in Preview Toolbar */}
          {onUndo && (
            <div className="flex items-center gap-1 border-r border-[#E7DEF0] pr-2">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  canUndo
                    ? 'bg-[#FAF8FC] hover:bg-[#F2EBF8] text-[#4F0080] border border-[#DECBEF] cursor-pointer shadow-2xs active:scale-95'
                    : 'text-[#C9BFD5] bg-neutral-50 border border-neutral-200 cursor-not-allowed opacity-50'
                }`}
                title="ย้อนกลับการแก้ไข (Undo: Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">ย้อนกลับ</span>
              </button>

              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  canRedo
                    ? 'bg-[#FAF8FC] hover:bg-[#F2EBF8] text-[#4F0080] border border-[#DECBEF] cursor-pointer shadow-2xs active:scale-95'
                    : 'text-[#C9BFD5] bg-neutral-50 border border-neutral-200 cursor-not-allowed opacity-50'
                }`}
                title="ทำซ้ำการแก้ไข (Redo: Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">ทำซ้ำ</span>
              </button>
            </div>
          )}

          {/* Direct Quick Font Size (ขนาดฟอนต์) Control */}
          <div className="inline-flex items-center gap-1.5 bg-[#FAF7FD] border border-[#DECBEF] rounded-lg px-2 py-0.5 shadow-2xs">
            <span className="text-[#4F0080] font-bold text-[11px] whitespace-nowrap">ฟอนต์:</span>
            <button
              type="button"
              onClick={() => updateStdField('fs', Math.max(8, Number((std.fs - 0.5).toFixed(1))))}
              className="w-5 h-5 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
              title="ลดขนาดตัวอักษร (-0.5pt)"
            >
              -
            </button>
            <input
              type="range"
              min="8"
              max="18"
              step="0.5"
              value={std.fs}
              onChange={(e) => updateStdField('fs', parseFloat(e.target.value))}
              className="w-14 accent-[#4F0080] cursor-pointer h-1.5"
              title={`ขนาดฟอนต์: ${std.fs}pt`}
            />
            <button
              type="button"
              onClick={() => updateStdField('fs', Math.min(20, Number((std.fs + 0.5).toFixed(1))))}
              className="w-5 h-5 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
              title="เพิ่มขนาดตัวอักษร (+0.5pt)"
            >
              +
            </button>
            <span className="font-mono text-[#4F0080] font-bold text-[11px] min-w-8 text-center bg-white px-1 py-0.2 rounded border border-[#DECBEF]">
              {std.fs}pt
            </span>
            <button
              type="button"
              onClick={() => updateStdField('fs', 16)}
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                std.fs === 16
                  ? 'bg-[#4F0080] text-white border-[#4F0080]'
                  : 'bg-white text-[#6C567E] hover:text-[#4F0080] border-[#DECBEF]'
              }`}
              title="ขนาดมาตรฐานสารบรรณ 16pt (ขนาดจริงใน Word)"
            >
              16pt (มาตรฐาน)
            </button>
            <button
              type="button"
              onClick={() => updateStdField('fs', 14)}
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                std.fs === 14
                  ? 'bg-[#4F0080] text-white border-[#4F0080]'
                  : 'bg-white text-[#6C567E] hover:text-[#4F0080] border-[#DECBEF]'
              }`}
              title="ขนาด 14pt"
            >
              14pt
            </button>
          </div>

          {/* Direct Quick Word Typography Pill (Thai Distribute & Spacing) */}
          <div className="hidden lg:inline-flex items-center gap-1.5 bg-[#FAF7FD] border border-[#DECBEF] rounded-lg px-2 py-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setShowTuning(true);
                setTuningTab('typography');
              }}
              className="flex items-center gap-1 text-[#4F0080] font-bold text-[11px] hover:underline cursor-pointer"
              title="คลิกเพื่อเปิดเครื่องมือจัดการอักขระแบบเวิร์ด"
            >
              <Type className="w-3.5 h-3.5 text-[#4F0080]" />
              <span>{std.alignMode === 'left' ? 'ชิดซ้าย' : 'Thai Distributed'}</span>
            </button>
            <span className="text-[#A48FBC]">|</span>
            <span className="font-mono text-[#6C567E] text-[10px]">
              {currentSpacingType === 'condensed'
                ? `บีบ ${std.lsp}px`
                : currentSpacingType === 'expanded'
                ? `ขยาย +${std.lsp}px`
                : 'ปกติ'}
            </span>
          </div>

          {/* Direct Paragraph Line Spacing Pill */}
          <div className="hidden sm:inline-flex items-center gap-1.5 bg-[#FAF7FD] border border-[#DECBEF] rounded-lg px-2 py-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setShowTuning(true);
                setTuningTab('paragraphs');
              }}
              className="flex items-center gap-1 text-[#4F0080] font-bold text-[11px] hover:underline cursor-pointer"
              title="คลิกเพื่อปรับระยะห่างระหว่างบรรทัดและช่องว่างแยกแต่ละย่อหน้า"
            >
              <AlignJustify className="w-3.5 h-3.5 text-[#4F0080]" />
              <span>ระยะบรรทัด ๔ ย่อหน้า</span>
            </button>
            <span className="text-[#A48FBC]">|</span>
            <span className="font-mono text-[#6C567E] text-[10px]">
              {(std.p1Lh ?? std.lh ?? 1.15).toFixed(2)} บรรทัด
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Quick Word Typography & Tuning Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowTuning(!showTuning)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              showTuning
                ? 'bg-[#4F0080] text-white ring-2 ring-[#4F0080]/20'
                : 'bg-[#F2EBF8] hover:bg-[#E8DCF4] text-[#4F0080] border border-[#DFCDEE]'
            }`}
            title="เครื่องมือจัดการอักขระแบบเวิร์ด และตำแหน่งหน้ากระดาษ"
          >
            <Type className="w-3.5 h-3.5" />
            <span>จัดการอักขระ & พิกัดแบบ Word</span>
            {showTuning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {onUploadLogo && (
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF8FC] hover:bg-[#F2EBF8] border border-[#E7DEF0] text-[#5C4A6E] font-medium text-xs transition-colors cursor-pointer"
              title="คลิกเพื่ออัปโหลดตราสัญลักษณ์ สจล. ที่ถูกต้อง"
            >
              <ImagePlus className="w-3.5 h-3.5 text-[#4F0080]" />
              <span className="hidden sm:inline">เปลี่ยนโลโก้</span>
            </button>
          )}

          {/* Ruler & Guide lines control */}
          <div className="inline-flex items-center gap-1.5 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer text-[#5C4A6E] font-medium select-none bg-[#FAF8FC] px-2 py-1 rounded-lg border border-[#E7DEF0] hover:bg-[#F2EBF8] transition-colors">
              <input
                type="checkbox"
                checked={showAxis}
                onChange={(e) => onToggleAxis(e.target.checked)}
                className="accent-[#4F0080] rounded"
              />
              <span className="font-semibold text-xs text-[#4F0080] flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-[#4F0080]" />
                <span>ไม้บรรทัดบน & ซ้าย</span>
              </span>
            </label>

            {showAxis && (
              <div className="flex items-center gap-1 bg-[#FAF7FD] border border-[#DECBEF] rounded-lg p-0.5 shadow-2xs">
                <span className="text-[10px] text-[#4F0080] font-bold px-1 hidden md:inline">เส้นบอกแนว:</span>
                <select
                  value={guideMode}
                  onChange={(e) => setGuideMode(e.target.value as any)}
                  className="text-[10px] font-semibold bg-white text-[#4F0080] border border-[#DECBEF] rounded px-1.5 py-0.5 cursor-pointer"
                  title="เลือกรูปแบบเส้นบอกแนวพิกัดไม้บรรทัดใน Word"
                >
                  <option value="all">📐 ทุกเส้น (ตั้ง + นอน)</option>
                  <option value="vertical">↕️ เฉพาะแนวตั้ง (๗ เส้น)</option>
                  <option value="horizontal">↔️ เฉพาะแนวนอน</option>
                  <option value="center">🎯 เฉพาะกึ่งกลาง 10.5cm</option>
                  <option value="none">🚫 ซ่อนเส้นบอกแนว</option>
                </select>

                <button
                  type="button"
                  onClick={() => setShowGuideLabels(!showGuideLabels)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                    showGuideLabels
                      ? 'bg-[#4F0080] text-white border-[#4F0080]'
                      : 'bg-white text-[#6C567E] border-[#DECBEF] hover:text-[#4F0080]'
                  }`}
                  title="แสดง/ซ่อน ป้ายระบุตัวเลขพิกัดเซนติเมตร"
                >
                  {showGuideLabels ? 'เลขพิกัด: เปิด' : 'เลขพิกัด: ปิด'}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={zoom}
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
              className="border border-[#E7DEF0] rounded-lg px-2 py-1 text-xs bg-white text-[#241033]"
              title="ย่อ/ขยายตัวอย่างบนหน้าจอ"
            >
              <option value="0.5">50%</option>
              <option value="0.6">60%</option>
              <option value="0.7">70%</option>
              <option value="0.8">80%</option>
              <option value="0.85">85%</option>
              <option value="1">100%</option>
              <option value="1.15">115%</option>
            </select>

            {/* Direct PDF Blob Download Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#4F0080] hover:bg-[#3E0065] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="ดาวน์โหลด PDF โดยตรงจาก Blob (ไม่ติดบล็อก Iframe Sandbox)"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>ดาวน์โหลด PDF</span>
            </button>

            {onExportDocx && (
              <button
                type="button"
                onClick={onExportDocx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1F8A5B] hover:bg-[#186f49] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                title="ดาวน์โหลดไฟล์ Microsoft Word (.docx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด Word</span>
              </button>
            )}

            {/* Browser Print / PDF Fallback */}
            <button
              type="button"
              onClick={onPrint || (() => window.print())}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FAF8FC] hover:bg-[#F2EBF8] border border-[#E7DEF0] text-[#5C4A6E] text-xs font-medium transition-colors cursor-pointer"
              title="สั่งพิมพ์ผ่านหน้าต่างเบราว์เซอร์"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">พิมพ์</span>
            </button>
          </div>
        </div>
      </div>

      {/* Micro-Tuning & Word Typography Toolkit Drawer */}
      {showTuning && (
        <div className="bg-[#FAF7FD] border border-[#DECBEF] rounded-xl p-3 mb-2 shadow-sm no-print animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#E9DCF4] pb-2 mb-2.5 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#4F0080]" />
                <span>ตัวจัดการอักขระ & หน้ากระดาษแบบ Word</span>
              </span>
              <div className="inline-flex rounded-lg border border-[#DECBEF] p-0.5 bg-white flex-wrap gap-0.5">
                {/* Tab 5: Word Ruler Inspector (สังเกตเส้น & เลขไม้บรรทัดใน Word อย่างละเอียด) */}
                <button
                  type="button"
                  onClick={() => setTuningTab('ruler_inspector')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    tuningTab === 'ruler_inspector'
                      ? 'bg-[#4F0080] text-white shadow-xs'
                      : 'text-[#6C567E] hover:text-[#4F0080]'
                  }`}
                >
                  <Ruler className="w-3 h-3" />
                  <span>📏 สังเกตเส้น & เลขไม้บรรทัด Word (ทุกจุดเป๊ะ)</span>
                </button>

                {/* Tab 1: Word Typography Manager */}
                <button
                  type="button"
                  onClick={() => setTuningTab('typography')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    tuningTab === 'typography'
                      ? 'bg-[#4F0080] text-white shadow-xs'
                      : 'text-[#6C567E] hover:text-[#4F0080]'
                  }`}
                >
                  <Type className="w-3 h-3" />
                  <span>🔤 อักขระแบบ Word (Thai Distribute / บีบ-ขยาย)</span>
                </button>

                {/* Tab 2: Individual Paragraphs Line Spacing */}
                <button
                  type="button"
                  onClick={() => setTuningTab('paragraphs')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    tuningTab === 'paragraphs'
                      ? 'bg-[#4F0080] text-white shadow-xs'
                      : 'text-[#6C567E] hover:text-[#4F0080]'
                  }`}
                >
                  <AlignJustify className="w-3 h-3" />
                  <span>📄 ระยะบรรทัดแยกย่อหน้า (๔ ย่อหน้า)</span>
                </button>

                {/* Tab 3: Positions */}
                <button
                  type="button"
                  onClick={() => setTuningTab('positions')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    tuningTab === 'positions'
                      ? 'bg-[#4F0080] text-white shadow-xs'
                      : 'text-[#6C567E] hover:text-[#4F0080]'
                  }`}
                >
                  <Move className="w-3 h-3" />
                  <span>ตำแหน่ง ซ้าย-ขวา / ขึ้น-ลง</span>
                </button>

                {/* Tab 4: Spacing */}
                <button
                  type="button"
                  onClick={() => setTuningTab('spacing')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    tuningTab === 'spacing'
                      ? 'bg-[#4F0080] text-white shadow-xs'
                      : 'text-[#6C567E] hover:text-[#4F0080]'
                  }`}
                >
                  <AlignLeft className="w-3 h-3" />
                  <span>ช่องไฟ & ขนาดฟอนต์</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetToStandard}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#F2EBF8] border border-[#DECBEF] text-[11px] font-semibold text-[#872049] transition-colors cursor-pointer"
              title="รีเซ็ตค่ากลับสู่ค่ามาตรฐาน 100%"
            >
              <RotateCcw className="w-3 h-3" />
              <span>คืนค่ามาตรฐาน</span>
            </button>
          </div>

          {/* ================= TAB 0: WORD RULER & COORDINATES INSPECTOR ================= */}
          {tuningTab === 'ruler_inspector' && (
            <div className="space-y-3 text-xs">
              {/* Header Box with Status & Quick Lock Button */}
              <div className="bg-gradient-to-r from-[#FAF5FE] via-[#F4EBFA] to-[#EDE0F8] p-3 rounded-xl border border-[#D9C2EC] flex items-center justify-between gap-3 flex-wrap shadow-2xs">
                <div>
                  <h4 className="font-bold text-[#4F0080] text-sm flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-[#4F0080]" />
                    <span>การจัดวางตำแหน่งตามเส้นและเลขไม้บรรทัด MS Word (100% Word Alignment Compliance)</span>
                  </h4>
                  <p className="text-[11px] text-[#6C567E] mt-0.5">
                    ตรวจสอบเส้นบอกแนวทุกเส้นทั้งแนวนอน (แกน X จากไม้บรรทัดบน) และแนวตั้ง (แกน Y จากไม้บรรทัดซ้าย) ให้ตรงจุดตามพิกัดระเบียบงานสารบรรณ
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateStd) {
                        onUpdateStd({
                          ...std,
                          rIndent: 2.5,
                          rTab: 1.5,
                          rDate: 8.2,
                          rAddr: 8.5,
                          rAddrRight: -2.08,
                          mL: 3.0,
                          mR: 2.0,
                          mT: 1.5,
                          mB: 1.8,
                          logoXOffset: 7.5,
                          logoH: 3.0,
                          headerTopOffset: 12,
                          dateTopOffset: 12,
                          subjectTopOffset: 12,
                          signatureTopOffset: 18,
                          signGapHeight: 1.6,
                          alignMode: 'thaiDistributed',
                          textJustify: 'inter-cluster'
                        });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4F0080] hover:bg-[#3D0063] text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
                    title="ล็อคและจัดเอกสารตามเส้นพิกัดไม้บรรทัดเป๊ะ 100%"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>จัดเอกสารตามไม้บรรทัดเป๊ะ 100%</span>
                  </button>
                </div>
              </div>

              {/* Grid 2 Columns: Horizontal (X) and Vertical (Y) Coordinates */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Column 1: Vertical Lines on Top Horizontal Ruler (เส้นแนวตั้งบนไม้บรรทัดแนวนอน) */}
                <div className="bg-white p-3 rounded-xl border border-[#DECBEF] space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-1.5">
                    <span className="font-bold text-[#4F0080] flex items-center gap-1.5 text-xs">
                      <span>↔️</span>
                      <span>เส้นแนวตั้งบนไม้บรรทัดแนวนอน (๗ จุดพิกัดสำคัญ)</span>
                    </span>
                    <span className="text-[10px] text-[#1F8A5B] font-bold bg-[#E8F8F0] px-2 py-0.5 rounded-full border border-[#BDE8D2]">
                      ✓ ตรงจุดตามไม้บรรทัด
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {/* Line 1: 0.0 cm */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8FC] border border-[#EFE7F6] hover:bg-[#F5EFFB] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                        <div>
                          <div className="font-bold text-[#241033] text-[11px] flex items-center gap-1">
                            <span>พิกัด 0.0 cm บนไม้บรรทัด (๓.๐ ซม. จากขอบซ้ายกระดาษ)</span>
                          </div>
                          <div className="text-[10px] text-[#7A6A88]">
                            ชิดขอบซ้าย (Left Margin): ที่ {data.letter_no}, เรื่อง, เรียน, บรรทัดปกติ, ส่วนท้าย
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        0.0 cm
                      </span>
                    </div>

                    {/* Line 2: 1.5 cm */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8FC] border border-[#EFE7F6] hover:bg-[#F5EFFB] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
                        <div>
                          <div className="font-bold text-[#241033] text-[11px] flex items-center gap-1">
                            <span>พิกัด {std.rTab} cm บนไม้บรรทัด (๔.๕ ซม. จากขอบซ้ายกระดาษ)</span>
                          </div>
                          <div className="text-[10px] text-[#7A6A88]">
                            แท็บ (Tab Stop): เริ่มต้นข้อความหลังคำว่า "เรื่อง" และ "เรียน"
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {std.rTab} cm
                      </span>
                    </div>

                    {/* Line 3: 2.5 cm */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8FC] border border-[#EFE7F6] hover:bg-[#F5EFFB] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                        <div>
                          <div className="font-bold text-[#241033] text-[11px] flex items-center gap-1">
                            <span>พิกัด {std.rIndent} cm บนไม้บรรทัด (๕.๕ ซม. จากขอบซ้ายกระดาษ)</span>
                          </div>
                          <div className="text-[10px] text-[#7A6A88]">
                            ย่อหน้า (First-Line Indent): คำแรกของย่อหน้า ๑, ๒, ๓, ๔ ย่อหน้า ๒.๕ ซม. พอดี
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {std.rIndent} cm
                      </span>
                    </div>

                    {/* Line 4: 7.5 cm (10.5 cm Page Center) */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#FFF5F7] border border-[#FED7E2] hover:bg-[#FFE8EE] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                        <div>
                          <div className="font-bold text-[#E11D48] text-[11px] flex items-center gap-1">
                            <span>พิกัด 7.5 cm บนไม้บรรทัด = ๑๐.๕ ซม. กึ่งกลางกระดาษ A4</span>
                          </div>
                          <div className="text-[10px] text-[#9F1239]">
                            กึ่งกลางหน้ากระดาษ: ตราสัญลักษณ์ สจล. และ "ขอแสดงความนับถือ" / คณบดี จัดกึ่งกลางตรงจุดนี้
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        7.5 cm (10.5)
                      </span>
                    </div>

                    {/* Line 5: 8.2 cm */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8FC] border border-[#EFE7F6] hover:bg-[#F5EFFB] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-600 shrink-0" />
                        <div>
                          <div className="font-bold text-[#241033] text-[11px] flex items-center gap-1">
                            <span>พิกัด {std.rDate} cm บนไม้บรรทัด (๑๑.๒ ซม. จากขอบซ้ายกระดาษ)</span>
                          </div>
                          <div className="text-[10px] text-[#7A6A88]">
                            บรรทัดวันที่: เว้นวรรค ๖ เคาะสำหรับเขียนวัน และขึ้นต้นชื่อเดือนและปี พ.ศ.
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-fuchsia-700 bg-fuchsia-50 px-2 py-0.5 rounded border border-fuchsia-200">
                        {std.rDate} cm
                      </span>
                    </div>

                    {/* Line 6: 8.5 cm */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8FC] border border-[#EFE7F6] hover:bg-[#F5EFFB] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
                        <div>
                          <div className="font-bold text-[#241033] text-[11px] flex items-center gap-1">
                            <span>พิกัด {std.rAddr} cm บนไม้บรรทัด (๑๑.๕ ซม. จากขอบซ้ายกระดาษ)</span>
                          </div>
                          <div className="text-[10px] text-[#7A6A88]">
                            ที่อยู่สถาบัน: "สถาบันเทคโนโลยีพระจอมเกล้า..." (ระยะยื่นขวา {std.rAddrRight ?? -2.08} ซม.)
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {std.rAddr} cm
                      </span>
                    </div>

                    {/* Line 7: 16.0 cm */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8FC] border border-[#EFE7F6] hover:bg-[#F5EFFB] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                        <div>
                          <div className="font-bold text-[#241033] text-[11px] flex items-center gap-1">
                            <span>พิกัด 16.0 cm บนไม้บรรทัด (๑๙.๐ ซม. จากขอบซ้าย / ๒.๐ ซม. จากขวา)</span>
                          </div>
                          <div className="text-[10px] text-[#7A6A88]">
                            ชิดขอบขวา (Right Margin): จัดกระจายข้อความแบบไทย (Thai Distribute) ชิดแนวนี้พอดี
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        16.0 cm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Horizontal Lines on Left Vertical Ruler (เส้นแนวนอนบนไม้บรรทัดแนวตั้ง) */}
                <div className="bg-white p-3 rounded-xl border border-[#DECBEF] space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-1.5">
                    <span className="font-bold text-[#4F0080] flex items-center gap-1.5 text-xs">
                      <span>↕️</span>
                      <span>เส้นแนวนอนบนไม้บรรทัดแนวตั้ง (ระนาบสำคัญ)</span>
                    </span>
                    <span className="text-[10px] text-[#1F8A5B] font-bold bg-[#E8F8F0] px-2 py-0.5 rounded-full border border-[#BDE8D2]">
                      ✓ ตรงระนาบ 100%
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {/* H Line 1: Top Margin */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#FAF8FC] border border-[#EFE7F6]">
                      <div className="text-[11px] text-[#241033]">
                        <span className="font-bold">๑. ขอบบนกระดาษ (Top Margin):</span>
                        <span className="text-[#7A6A88] ml-1">ระยะขอบบน {std.mT} ซม.</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.2 rounded border border-[#DECBEF]">
                        {std.mT} cm
                      </span>
                    </div>

                    {/* H Line 2: Logo Base */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#FAF8FC] border border-[#EFE7F6]">
                      <div className="text-[11px] text-[#241033]">
                        <span className="font-bold">๒. ฐานตราสัญลักษณ์ สจล. (Logo Base):</span>
                        <span className="text-[#7A6A88] ml-1">ความสูงตรา {std.logoH} ซม. (289px)</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.2 rounded border border-[#DECBEF]">
                        {(std.mT + std.logoH).toFixed(1)} cm
                      </span>
                    </div>

                    {/* H Line 3: Header Baseline */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#EBF7EE] border border-[#C6ECD2]">
                      <div className="text-[11px] text-[#1B6338]">
                        <span className="font-bold">๓. ระนาบ 'ที่ อว.' และ 'สถาบันฯ' (Baseline):</span>
                        <span className="text-[#2F7F4E] ml-1">อยู่ระนาบเดียวกันเป๊ะ 100% ไม่เลื่อมล้ำ</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-[#1B6338] bg-white px-1.5 py-0.2 rounded border border-[#A7E2BA]">
                        เสมอกัน 100%
                      </span>
                    </div>

                    {/* H Line 4: Date Baseline */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#FAF8FC] border border-[#EFE7F6]">
                      <div className="text-[11px] text-[#241033]">
                        <span className="font-bold">๔. ระนาบ วันที่:</span>
                        <span className="text-[#7A6A88] ml-1">ห่างจากที่อยู่ {std.dateTopOffset ?? 12} pt</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.2 rounded border border-[#DECBEF]">
                        +{std.dateTopOffset ?? 12} pt
                      </span>
                    </div>

                    {/* H Line 5: Subject & Recipient */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#FAF8FC] border border-[#EFE7F6]">
                      <div className="text-[11px] text-[#241033]">
                        <span className="font-bold">๕. ระนาบ เรื่อง & เรียน:</span>
                        <span className="text-[#7A6A88] ml-1">คำว่า "เรื่อง" และ "เรียน" ชิดขอบซ้าย</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.2 rounded border border-[#DECBEF]">
                        +{std.subjectTopOffset ?? 12} pt
                      </span>
                    </div>

                    {/* H Line 6: Paragraphs 1-4 */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#FAF8FC] border border-[#EFE7F6]">
                      <div className="text-[11px] text-[#241033]">
                        <span className="font-bold">๖. ระนาบย่อหน้า ๑, ๒, ๓, ๔:</span>
                        <span className="text-[#7A6A88] ml-1">เว้นช่องว่าง {std.paraSpacing ?? 12} pt / ระยะบรรทัด {std.lh} เท่า</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.2 rounded border border-[#DECBEF]">
                        {std.lh} เท่า
                      </span>
                    </div>

                    {/* H Line 7: Sign-off & Dean Signature */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#FAF8FC] border border-[#EFE7F6]">
                      <div className="text-[11px] text-[#241033]">
                        <span className="font-bold">๗. ระนาบ ขอแสดงความนับถือ & ลายเซ็น:</span>
                        <span className="text-[#7A6A88] ml-1">เว้นลงนาม {std.signGapHeight ?? 1.6} ซม. กึ่งกลางหน้า</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.2 rounded border border-[#DECBEF]">
                        {std.signGapHeight ?? 1.6} cm
                      </span>
                    </div>

                    {/* H Line 8: Footer & Bottom Margin */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#FAF8FC] border border-[#EFE7F6]">
                      <div className="text-[11px] text-[#241033]">
                        <span className="font-bold">๘. ขอบล่างกระดาษ (Bottom Margin):</span>
                        <span className="text-[#7A6A88] ml-1">ระยะขอบล่าง {std.mB} ซม.</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.2 rounded border border-[#DECBEF]">
                        {std.mB} cm
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 1: ADVANCED WORD TYPOGRAPHY TOOLKIT ================= */}
          {tuningTab === 'typography' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Feature 1: Thai Distributed (การจัดกระจายข้อความแบบไทย) */}
              <div className="bg-white p-3 rounded-xl border-2 border-[#D9C2EC] space-y-2 shadow-2xs">
                <div className="flex justify-between items-center text-[#4F0080] font-bold text-[11px]">
                  <span className="flex items-center gap-1">
                    <AlignJustify className="w-3.5 h-3.5 text-[#4F0080]" />
                    <span>๑. การจัดกระจายข้อความ (Thai Distributed)</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.5 rounded border border-[#DECBEF] font-bold">
                    {std.alignMode === 'left' ? 'Left' : 'Thai Distribute'}
                  </span>
                </div>

                <div className="text-[10px] text-[#7A6A88] leading-tight">
                  จัดขอบซ้ายและขวาให้ขนานเท่ากันอย่างประณีตตามพจนานุกรมอักขระไทย (Inter-cluster) บรรทัดสุดท้ายชิดซ้าย
                </div>

                {/* Alignment Mode Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      updateStdField('alignMode', 'thaiDistributed');
                      updateStdField('textJustify', 'inter-cluster');
                    }}
                    className={`py-1.5 px-1 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center gap-0.5 border cursor-pointer transition-all ${
                      std.alignMode !== 'left' && std.textJustify !== 'inter-word'
                        ? 'bg-[#4F0080] text-white border-[#4F0080] shadow-xs'
                        : 'bg-[#FAF8FC] text-[#5C4A6E] border-[#DECBEF] hover:bg-[#F2EBF8]'
                    }`}
                  >
                    <span>🇹🇭 กระจายแบบไทย</span>
                    <span className="text-[8.5px] opacity-80">(Thai Distribute)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateStdField('alignMode', 'justify');
                      updateStdField('textJustify', 'inter-word');
                    }}
                    className={`py-1.5 px-1 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center gap-0.5 border cursor-pointer transition-all ${
                      std.alignMode === 'justify' && std.textJustify === 'inter-word'
                        ? 'bg-[#4F0080] text-white border-[#4F0080] shadow-xs'
                        : 'bg-[#FAF8FC] text-[#5C4A6E] border-[#DECBEF] hover:bg-[#F2EBF8]'
                    }`}
                  >
                    <span>⚖️ กระจายตามคำ</span>
                    <span className="text-[8.5px] opacity-80">(Justify Word)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateStdField('alignMode', 'left')}
                    className={`py-1.5 px-1 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center gap-0.5 border cursor-pointer transition-all ${
                      std.alignMode === 'left'
                        ? 'bg-[#4F0080] text-white border-[#4F0080] shadow-xs'
                        : 'bg-[#FAF8FC] text-[#5C4A6E] border-[#DECBEF] hover:bg-[#F2EBF8]'
                    }`}
                  >
                    <span>⬅️ ชิดซ้าย</span>
                    <span className="text-[8.5px] opacity-80">(Align Left)</span>
                  </button>
                </div>

                <div className="bg-[#FAF7FD] p-2 rounded-lg border border-[#E9DCF4] text-[10px] text-[#4F0080]">
                  💡 <strong>มาตรฐานงานสารบรรณ สจล.:</strong> ใช้โหมด <strong>Thai Distribute</strong> เพื่อความเรียบร้อยระดับสูงสุด
                </div>
              </div>

              {/* Feature 2: Thai Line Breaking (การตัดบรรทัดภาษาไทย) */}
              <div className="bg-white p-3 rounded-xl border-2 border-[#D9C2EC] space-y-2 shadow-2xs">
                <div className="flex justify-between items-center text-[#4F0080] font-bold text-[11px]">
                  <span className="flex items-center gap-1">
                    <Split className="w-3.5 h-3.5 text-[#4F0080]" />
                    <span>๒. การตัดบรรทัด (Thai Line Breaking)</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.5 rounded border border-[#DECBEF] font-bold">
                    {std.lineBreakMode || 'strict'}
                  </span>
                </div>

                <div className="text-[10px] text-[#7A6A88] leading-tight">
                  ควบคุมการตัดคำภาษาไทยไม่ให้สระหรือวรรณยุกต์ลอย หรือตัดคำฉีกขาดผิดหลักภาษาศาสตร์
                </div>

                {/* Line Break Mode Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      updateStdField('lineBreakMode', 'strict');
                      updateStdField('wordBreak', 'break-word');
                    }}
                    className={`py-1.5 px-1 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center gap-0.5 border cursor-pointer transition-all ${
                      (std.lineBreakMode || 'strict') === 'strict'
                        ? 'bg-[#4F0080] text-white border-[#4F0080] shadow-xs'
                        : 'bg-[#FAF8FC] text-[#5C4A6E] border-[#DECBEF] hover:bg-[#F2EBF8]'
                    }`}
                  >
                    <span>🔒 เคร่งครัด</span>
                    <span className="text-[8.5px] opacity-80">(Strict Rule)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateStdField('lineBreakMode', 'normal');
                      updateStdField('wordBreak', 'break-word');
                    }}
                    className={`py-1.5 px-1 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center gap-0.5 border cursor-pointer transition-all ${
                      std.lineBreakMode === 'normal'
                        ? 'bg-[#4F0080] text-white border-[#4F0080] shadow-xs'
                        : 'bg-[#FAF8FC] text-[#5C4A6E] border-[#DECBEF] hover:bg-[#F2EBF8]'
                    }`}
                  >
                    <span>🌐 ปกติสากล</span>
                    <span className="text-[8.5px] opacity-80">(Normal)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateStdField('lineBreakMode', 'anywhere');
                      updateStdField('wordBreak', 'break-all');
                    }}
                    className={`py-1.5 px-1 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center gap-0.5 border cursor-pointer transition-all ${
                      std.lineBreakMode === 'anywhere'
                        ? 'bg-[#4F0080] text-white border-[#4F0080] shadow-xs'
                        : 'bg-[#FAF8FC] text-[#5C4A6E] border-[#DECBEF] hover:bg-[#F2EBF8]'
                    }`}
                  >
                    <span>✂️ ตัดทุกจุด</span>
                    <span className="text-[8.5px] opacity-80">(Anywhere)</span>
                  </button>
                </div>

                <label className="flex items-center gap-1.5 pt-1 cursor-pointer select-none text-[11px] text-[#4F0080] font-semibold">
                  <input
                    type="checkbox"
                    checked={std.preventOrphanWords ?? true}
                    onChange={(e) => updateStdField('preventOrphanWords', e.target.checked)}
                    className="accent-[#4F0080] rounded"
                  />
                  <span>ป้องกันคำสำคัญตกหล่น (เช่น ชื่ออาจารย์, วันที่)</span>
                </label>
              </div>

              {/* Feature 3: Expanded / Condensed (ขยาย / บีบตัวอักษร เหมือนใน Word Font Dialog) */}
              <div className="bg-white p-3 rounded-xl border-2 border-[#D9C2EC] space-y-2 shadow-2xs">
                <div className="flex justify-between items-center text-[#4F0080] font-bold text-[11px]">
                  <span className="flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-[#4F0080]" />
                    <span>๓. Expanded / Condensed (ขยาย / บีบ)</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.5 rounded border border-[#DECBEF] font-bold">
                    {std.lsp > 0 ? `+${std.lsp}px (Expanded)` : std.lsp < 0 ? `${std.lsp}px (Condensed)` : 'Normal (0px)'}
                  </span>
                </div>

                {/* Spacing Type Buttons */}
                <div className="grid grid-cols-3 gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => updateStdField('lsp', -0.2)}
                    className={`py-1 px-1 rounded-lg font-bold text-[10px] border cursor-pointer transition-all ${
                      std.lsp < -0.02
                        ? 'bg-[#4F0080] text-white border-[#4F0080] shadow-xs'
                        : 'bg-[#FAF8FC] text-[#5C4A6E] border-[#DECBEF] hover:bg-[#F2EBF8]'
                    }`}
                  >
                    ⬅️ บีบ (Condensed)
                  </button>

                  <button
                    type="button"
                    onClick={() => updateStdField('lsp', 0)}
                    className={`py-1 px-1 rounded-lg font-bold text-[10px] border cursor-pointer transition-all ${
                      Math.abs(std.lsp) <= 0.02
                        ? 'bg-[#4F0080] text-white border-[#4F0080] shadow-xs'
                        : 'bg-[#FAF8FC] text-[#5C4A6E] border-[#DECBEF] hover:bg-[#F2EBF8]'
                    }`}
                  >
                    ⏺️ ปกติ (Normal)
                  </button>

                  <button
                    type="button"
                    onClick={() => updateStdField('lsp', 0.4)}
                    className={`py-1 px-1 rounded-lg font-bold text-[10px] border cursor-pointer transition-all ${
                      std.lsp > 0.02
                        ? 'bg-[#4F0080] text-white border-[#4F0080] shadow-xs'
                        : 'bg-[#FAF8FC] text-[#5C4A6E] border-[#DECBEF] hover:bg-[#F2EBF8]'
                    }`}
                  >
                    ➡️ ขยาย (Expanded)
                  </button>
                </div>

                {/* Fine slider */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => updateStdField('lsp', Number((std.lsp - 0.05).toFixed(2)))}
                    className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs"
                    title="บีบตัวอักษรเพิ่มขึ้น (-0.05px)"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="-1.5"
                    max="3.0"
                    step="0.05"
                    value={std.lsp}
                    onChange={(e) => updateStdField('lsp', parseFloat(e.target.value))}
                    className="flex-1 accent-[#4F0080] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateStdField('lsp', Number((std.lsp + 0.05).toFixed(2)))}
                    className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs"
                    title="ขยายตัวอักษรเพิ่มขึ้น (+0.05px)"
                  >
                    +
                  </button>
                </div>

                {/* Word Presets */}
                <div className="flex justify-between items-center text-[9.5px] text-[#7A6A88] pt-0.5 flex-wrap gap-1">
                  <button type="button" onClick={() => updateStdField('lsp', -0.4)} className="hover:underline font-medium">บีบแน่น (-0.4)</button>
                  <button type="button" onClick={() => updateStdField('lsp', -0.2)} className="hover:underline font-bold text-[#4F0080]">มาตรฐาน (-0.2)</button>
                  <button type="button" onClick={() => updateStdField('lsp', 0)} className="hover:underline font-medium">ปกติ (0.0)</button>
                  <button type="button" onClick={() => updateStdField('lsp', 0.4)} className="hover:underline font-medium">ขยายโปร่ง (+0.4)</button>
                  <button type="button" onClick={() => updateStdField('lsp', 0.8)} className="hover:underline font-medium">ขยายพิเศษ (+0.8)</button>
                </div>

                {/* Feature 4: Word Font Dialog Character Scale (มาตราส่วนตัวอักษร 80% - 120%) */}
                <div className="border-t border-[#E9DCF4] pt-2 mt-2">
                  <div className="flex justify-between items-center text-[#4F0080] font-semibold text-[11px] mb-1">
                    <span>มาตราส่วนตัวอักษร (Scale)</span>
                    <span className="font-mono text-[#4F0080] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#E9DCF4] font-bold">
                      {charScale}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="range"
                      min="80"
                      max="120"
                      step="1"
                      value={charScale}
                      onChange={(e) => updateStdField('charScale', parseInt(e.target.value))}
                      className="flex-1 accent-[#4F0080] cursor-pointer"
                    />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => updateStdField('charScale', 90)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                          charScale === 90 ? 'bg-[#4F0080] text-white border-[#4F0080]' : 'bg-[#FAF8FC] border-[#DECBEF]'
                        }`}
                      >
                        90%
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStdField('charScale', 100)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                          charScale === 100 ? 'bg-[#4F0080] text-white border-[#4F0080]' : 'bg-[#FAF8FC] border-[#DECBEF]'
                        }`}
                      >
                        100%
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStdField('charScale', 110)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer ${
                          charScale === 110 ? 'bg-[#4F0080] text-white border-[#4F0080]' : 'bg-[#FAF8FC] border-[#DECBEF]'
                        }`}
                      >
                        110%
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: INDIVIDUAL PARAGRAPH LINE SPACING & SPACE AFTER ================= */}
          {tuningTab === 'paragraphs' && (
            <div className="space-y-3">
              {/* Quick Preset Action Bar */}
              <div className="bg-white p-2.5 rounded-xl border border-[#DECBEF] flex items-center justify-between flex-wrap gap-2 text-xs shadow-2xs">
                <div className="flex items-center gap-1.5 text-[#4F0080] font-bold">
                  <AlignJustify className="w-4 h-4 text-[#4F0080]" />
                  <span>จัดการระยะห่างช่องว่างระหว่างบรรทัด แยกตามแต่ละย่อหน้า (Individual Line Spacing)</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateStd) {
                        onUpdateStd({
                          ...std,
                          p1Lh: 1.15,
                          p2Lh: 1.15,
                          p3Lh: 1.15,
                          p4Lh: 1.15,
                          p1Mb: 12,
                          p2Mb: 12,
                          p3Mb: 12,
                          p4Mb: 12
                        });
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF8FC] hover:bg-[#F2EBF8] border border-[#DECBEF] text-[#4F0080] text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    🔄 ค่ามาตรฐานสารบรรณ (1.15 บรรทัด / เว้น 12pt)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateStd) {
                        onUpdateStd({
                          ...std,
                          p1Lh: 1.05,
                          p2Lh: 1.05,
                          p3Lh: 1.05,
                          p4Lh: 1.05,
                          p1Mb: 6,
                          p2Mb: 6,
                          p3Mb: 6,
                          p4Mb: 6
                        });
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF8FC] hover:bg-[#F2EBF8] border border-[#DECBEF] text-[#4F0080] text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    ⚡ โหมดกระชับพอดีหน้า (1.05 บรรทัด / เว้น 6pt)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const baseLh = std.p1Lh ?? std.lh ?? 1.15;
                      const baseMb = std.p1Mb ?? std.paraSpacing ?? 12;
                      if (onUpdateStd) {
                        onUpdateStd({
                          ...std,
                          p2Lh: baseLh,
                          p3Lh: baseLh,
                          p4Lh: baseLh,
                          p2Mb: baseMb,
                          p3Mb: baseMb,
                          p4Mb: baseMb
                        });
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#4F0080] text-white hover:bg-[#3B0060] text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                    title="คัดลอกระยะบรรทัดและช่องว่างของย่อหน้าที่ ๑ ไปใช้กับทุกย่อหน้า"
                  >
                    🔗 ปรับทุกย่อหน้าให้เท่ากับย่อหน้าที่ ๑
                  </button>
                </div>
              </div>

              {/* 4 Paragraph Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                {/* Paragraph 1 */}
                <div className="bg-white p-3 rounded-xl border border-[#DECBEF] space-y-2.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2 border-b border-[#F2EBF8] pb-1.5">
                    <div>
                      <h4 className="font-bold text-[#4F0080] flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#F2EBF8] text-[#4F0080] flex items-center justify-center text-[10px] font-extrabold shrink-0">๑</span>
                        <span>ย่อหน้าที่ ๑: เกริ่นนำหลักสูตรและรายวิชา</span>
                      </h4>
                      <p className="text-[10px] text-[#7A6A88] line-clamp-1 italic mt-0.5">
                        "ด้วยคณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง..."
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-mono text-[10px] font-bold text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.5 rounded border border-[#DECBEF]">
                        {(std.p1Lh ?? std.lh ?? 1.15).toFixed(2)} บรรทัด
                      </span>
                      <span className="font-mono text-[10px] font-bold text-[#6C567E] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#DECBEF]">
                        เว้น {std.p1Mb ?? std.paraSpacing ?? 12}pt
                      </span>
                    </div>
                  </div>

                  {/* Line Spacing Control */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] text-[#5C4A6E]">
                      <span className="font-semibold">ระยะห่างระหว่างบรรทัด (Line Spacing):</span>
                      <span className="font-mono font-bold text-[#4F0080]">
                        {(std.p1Lh ?? std.lh ?? 1.15).toFixed(2)} เท่า
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateStdField('p1Lh', Math.max(0.85, Number(((std.p1Lh ?? std.lh ?? 1.15) - 0.05).toFixed(2))))}
                        className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
                        title="ลดระยะบรรทัด (-0.05)"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0.90"
                        max="2.00"
                        step="0.05"
                        value={std.p1Lh ?? std.lh ?? 1.15}
                        onChange={(e) => updateStdField('p1Lh', parseFloat(e.target.value))}
                        className="flex-1 accent-[#4F0080] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => updateStdField('p1Lh', Math.min(2.50, Number(((std.p1Lh ?? std.lh ?? 1.15) + 0.05).toFixed(2))))}
                        className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
                        title="เพิ่มระยะบรรทัด (+0.05)"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-[9.5px] text-[#7A6A88] pt-0.5">
                      <button type="button" onClick={() => updateStdField('p1Lh', 1.0)} className="hover:underline">1.0 (ชิด)</button>
                      <button type="button" onClick={() => updateStdField('p1Lh', 1.05)} className="hover:underline">1.05 (กระชับ)</button>
                      <button type="button" onClick={() => updateStdField('p1Lh', 1.15)} className="hover:underline font-bold text-[#4F0080]">1.15 (มาตรฐาน)</button>
                      <button type="button" onClick={() => updateStdField('p1Lh', 1.25)} className="hover:underline">1.25</button>
                      <button type="button" onClick={() => updateStdField('p1Lh', 1.50)} className="hover:underline">1.50</button>
                    </div>
                  </div>

                  {/* Space After Control */}
                  <div className="space-y-1 pt-1 border-t border-[#F2EBF8]">
                    <div className="flex justify-between items-center text-[11px] text-[#5C4A6E]">
                      <span className="font-semibold">ช่องว่างท้ายย่อหน้า (Space After):</span>
                      <span className="font-mono font-bold text-[#4F0080]">
                        {std.p1Mb ?? std.paraSpacing ?? 12} pt
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateStdField('p1Mb', Math.max(0, (std.p1Mb ?? std.paraSpacing ?? 12) - 1))}
                        className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
                        title="ลดช่องว่าง (-1pt)"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="36"
                        step="1"
                        value={std.p1Mb ?? std.paraSpacing ?? 12}
                        onChange={(e) => updateStdField('p1Mb', parseInt(e.target.value))}
                        className="flex-1 accent-[#4F0080] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => updateStdField('p1Mb', Math.min(48, (std.p1Mb ?? std.paraSpacing ?? 12) + 1))}
                        className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
                        title="เพิ่มช่องว่าง (+1pt)"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-[9.5px] text-[#7A6A88] pt-0.5">
                      <button type="button" onClick={() => updateStdField('p1Mb', 0)} className="hover:underline">0 pt (ไม่เว้น)</button>
                      <button type="button" onClick={() => updateStdField('p1Mb', 6)} className="hover:underline">6 pt (ครึ่งบรรทัด)</button>
                      <button type="button" onClick={() => updateStdField('p1Mb', 12)} className="hover:underline font-bold text-[#4F0080]">12 pt (มาตรฐาน)</button>
                      <button type="button" onClick={() => updateStdField('p1Mb', 18)} className="hover:underline">18 pt</button>
                      <button type="button" onClick={() => updateStdField('p1Mb', 24)} className="hover:underline">24 pt (๒ บรรทัด)</button>
                    </div>
                  </div>
                </div>

                {/* Paragraph 2 */}
                <div className="bg-white p-3 rounded-xl border border-[#DECBEF] space-y-2.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2 border-b border-[#F2EBF8] pb-1.5">
                    <div>
                      <h4 className="font-bold text-[#4F0080] flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#F2EBF8] text-[#4F0080] flex items-center justify-center text-[10px] font-extrabold shrink-0">๒</span>
                        <span>ย่อหน้าที่ ๒: ข้อความเรียนเชิญอาจารย์พิเศษ</span>
                      </h4>
                      <p className="text-[10px] text-[#7A6A88] line-clamp-1 italic mt-0.5">
                        "ในการนี้ คณะทันตแพทยศาสตร์ ขอเรียนเชิญท่านเป็นอาจารย์พิเศษในรายวิชา..."
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-mono text-[10px] font-bold text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.5 rounded border border-[#DECBEF]">
                        {(std.p2Lh ?? std.lh ?? 1.15).toFixed(2)} บรรทัด
                      </span>
                      <span className="font-mono text-[10px] font-bold text-[#6C567E] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#DECBEF]">
                        เว้น {std.p2Mb ?? std.paraSpacing ?? 12}pt
                      </span>
                    </div>
                  </div>

                  {/* Line Spacing Control */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] text-[#5C4A6E]">
                      <span className="font-semibold">ระยะห่างระหว่างบรรทัด (Line Spacing):</span>
                      <span className="font-mono font-bold text-[#4F0080]">
                        {(std.p2Lh ?? std.lh ?? 1.15).toFixed(2)} เท่า
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateStdField('p2Lh', Math.max(0.85, Number(((std.p2Lh ?? std.lh ?? 1.15) - 0.05).toFixed(2))))}
                        className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
                        title="ลดระยะบรรทัด (-0.05)"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0.90"
                        max="2.00"
                        step="0.05"
                        value={std.p2Lh ?? std.lh ?? 1.15}
                        onChange={(e) => updateStdField('p2Lh', parseFloat(e.target.value))}
                        className="flex-1 accent-[#4F0080] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => updateStdField('p2Lh', Math.min(2.50, Number(((std.p2Lh ?? std.lh ?? 1.15) + 0.05).toFixed(2))))}
                        className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
                        title="เพิ่มระยะบรรทัด (+0.05)"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-[9.5px] text-[#7A6A88] pt-0.5">
                      <button type="button" onClick={() => updateStdField('p2Lh', 1.0)} className="hover:underline">1.0 (ชิด)</button>
                      <button type="button" onClick={() => updateStdField('p2Lh', 1.05)} className="hover:underline">1.05 (กระชับ)</button>
                      <button type="button" onClick={() => updateStdField('p2Lh', 1.15)} className="hover:underline font-bold text-[#4F0080]">1.15 (มาตรฐาน)</button>
                      <button type="button" onClick={() => updateStdField('p2Lh', 1.25)} className="hover:underline">1.25</button>
                      <button type="button" onClick={() => updateStdField('p2Lh', 1.50)} className="hover:underline">1.50</button>
                    </div>
                  </div>

                  {/* Space After Control */}
                  <div className="space-y-1 pt-1 border-t border-[#F2EBF8]">
                    <div className="flex justify-between items-center text-[11px] text-[#5C4A6E]">
                      <span className="font-semibold">ช่องว่างท้ายย่อหน้า (Space After):</span>
                      <span className="font-mono font-bold text-[#4F0080]">
                        {std.p2Mb ?? std.paraSpacing ?? 12} pt
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateStdField('p2Mb', Math.max(0, (std.p2Mb ?? std.paraSpacing ?? 12) - 1))}
                        className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
                        title="ลดช่องว่าง (-1pt)"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="36"
                        step="1"
                        value={std.p2Mb ?? std.paraSpacing ?? 12}
                        onChange={(e) => updateStdField('p2Mb', parseInt(e.target.value))}
                        className="flex-1 accent-[#4F0080] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => updateStdField('p2Mb', Math.min(48, (std.p2Mb ?? std.paraSpacing ?? 12) + 1))}
                        className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
                        title="เพิ่มช่องว่าง (+1pt)"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-[9.5px] text-[#7A6A88] pt-0.5">
                      <button type="button" onClick={() => updateStdField('p2Mb', 0)} className="hover:underline">0 pt (ไม่เว้น)</button>
                      <button type="button" onClick={() => updateStdField('p2Mb', 6)} className="hover:underline">6 pt (ครึ่งบรรทัด)</button>
                      <button type="button" onClick={() => updateStdField('p2Mb', 12)} className="hover:underline font-bold text-[#4F0080]">12 pt (มาตรฐาน)</button>
                      <button type="button" onClick={() => updateStdField('p2Mb', 18)} className="hover:underline">18 pt</button>
                      <button type="button" onClick={() => updateStdField('p2Mb', 24)} className="hover:underline">24 pt (๒ บรรทัด)</button>
                    </div>
                  </div>
                </div>

                {/* Paragraph 3 */}
                <div className="bg-white p-3 rounded-xl border border-[#DECBEF] space-y-2.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2 border-b border-[#F2EBF8] pb-1.5">
                    <div>
                      <h4 className="font-bold text-[#4F0080] flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#F2EBF8] text-[#4F0080] flex items-center justify-center text-[10px] font-extrabold shrink-0">๓</span>
                        <span>ย่อหน้าที่ ๓: ผู้ประสานงานและข้อมูลติดต่อ</span>
                      </h4>
                      <p className="text-[10px] text-[#7A6A88] line-clamp-1 italic mt-0.5">
                        "ทั้งนี้ คณะทันตแพทยศาสตร์ ขอมอบหมายให้ {data.coName || 'ผู้ประสานงาน'} เป็นผู้ประสานงาน..."
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-mono text-[10px] font-bold text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.5 rounded border border-[#DECBEF]">
                        {(std.p3Lh ?? std.lh ?? 1.15).toFixed(2)} บรรทัด
                      </span>
                      <span className="font-mono text-[10px] font-bold text-[#6C567E] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#DECBEF]">
                        เว้น {std.p3Mb ?? std.paraSpacing ?? 12}pt
                      </span>
                    </div>
                  </div>

                  {/* Line Spacing Control */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] text-[#5C4A6E]">
                      <span className="font-semibold">ระยะห่างระหว่างบรรทัด (Line Spacing):</span>
                      <span className="font-mono font-bold text-[#4F0080]">
                        {(std.p3Lh ?? std.lh ?? 1.15).toFixed(2)} เท่า
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateStdField('p3Lh', Math.max(0.85, Number(((std.p3Lh ?? std.lh ?? 1.15) - 0.05).toFixed(2))))}
                        className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
                        title="ลดระยะบรรทัด (-0.05)"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0.90"
                        max="2.00"
                        step="0.05"
                        value={std.p3Lh ?? std.lh ?? 1.15}
                        onChange={(e) => updateStdField('p3Lh', parseFloat(e.target.value))}
                        className="flex-1 accent-[#4F0080] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => updateStdField('p3Lh', Math.min(2.50, Number(((std.p3Lh ?? std.lh ?? 1.15) + 0.05).toFixed(2))))}
                        className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
                        title="เพิ่มระยะบรรทัด (+0.05)"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-[9.5px] text-[#7A6A88] pt-0.5">
                      <button type="button" onClick={() => updateStdField('p3Lh', 1.0)} className="hover:underline">1.0 (ชิด)</button>
                      <button type="button" onClick={() => updateStdField('p3Lh', 1.05)} className="hover:underline">1.05 (กระชับ)</button>
                      <button type="button" onClick={() => updateStdField('p3Lh', 1.15)} className="hover:underline font-bold text-[#4F0080]">1.15 (มาตรฐาน)</button>
                      <button type="button" onClick={() => updateStdField('p3Lh', 1.25)} className="hover:underline">1.25</button>
                      <button type="button" onClick={() => updateStdField('p3Lh', 1.50)} className="hover:underline">1.50</button>
                    </div>
                  </div>

                  {/* Space After Control */}
                  <div className="space-y-1 pt-1 border-t border-[#F2EBF8]">
                    <div className="flex justify-between items-center text-[11px] text-[#5C4A6E]">
                      <span className="font-semibold">ช่องว่างท้ายย่อหน้า (Space After):</span>
                      <span className="font-mono font-bold text-[#4F0080]">
                        {std.p3Mb ?? std.paraSpacing ?? 12} pt
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateStdField('p3Mb', Math.max(0, (std.p3Mb ?? std.paraSpacing ?? 12) - 1))}
                        className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
                        title="ลดช่องว่าง (-1pt)"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="36"
                        step="1"
                        value={std.p3Mb ?? std.paraSpacing ?? 12}
                        onChange={(e) => updateStdField('p3Mb', parseInt(e.target.value))}
                        className="flex-1 accent-[#4F0080] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => updateStdField('p3Mb', Math.min(48, (std.p3Mb ?? std.paraSpacing ?? 12) + 1))}
                        className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
                        title="เพิ่มช่องว่าง (+1pt)"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-[9.5px] text-[#7A6A88] pt-0.5">
                      <button type="button" onClick={() => updateStdField('p3Mb', 0)} className="hover:underline">0 pt (ไม่เว้น)</button>
                      <button type="button" onClick={() => updateStdField('p3Mb', 6)} className="hover:underline">6 pt (ครึ่งบรรทัด)</button>
                      <button type="button" onClick={() => updateStdField('p3Mb', 12)} className="hover:underline font-bold text-[#4F0080]">12 pt (มาตรฐาน)</button>
                      <button type="button" onClick={() => updateStdField('p3Mb', 18)} className="hover:underline">18 pt</button>
                      <button type="button" onClick={() => updateStdField('p3Mb', 24)} className="hover:underline">24 pt (๒ บรรทัด)</button>
                    </div>
                  </div>
                </div>

                {/* Paragraph 4 */}
                <div className="bg-white p-3 rounded-xl border border-[#DECBEF] space-y-2.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2 border-b border-[#F2EBF8] pb-1.5">
                    <div>
                      <h4 className="font-bold text-[#4F0080] flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#F2EBF8] text-[#4F0080] flex items-center justify-center text-[10px] font-extrabold shrink-0">๔</span>
                        <span>ย่อหน้าที่ ๔: ข้อความปิดท้ายและขอบคุณ</span>
                      </h4>
                      <p className="text-[10px] text-[#7A6A88] line-clamp-1 italic mt-0.5">
                        "คณะทันตแพทยศาสตร์ หวังว่าจะได้รับความอนุเคราะห์จากท่าน และขอขอบพระคุณ..."
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-mono text-[10px] font-bold text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.5 rounded border border-[#DECBEF]">
                        {(std.p4Lh ?? std.lh ?? 1.15).toFixed(2)} บรรทัด
                      </span>
                      <span className="font-mono text-[10px] font-bold text-[#6C567E] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#DECBEF]">
                        เว้น {std.p4Mb ?? std.paraSpacing ?? 12}pt
                      </span>
                    </div>
                  </div>

                  {/* Line Spacing Control */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] text-[#5C4A6E]">
                      <span className="font-semibold">ระยะห่างระหว่างบรรทัด (Line Spacing):</span>
                      <span className="font-mono font-bold text-[#4F0080]">
                        {(std.p4Lh ?? std.lh ?? 1.15).toFixed(2)} เท่า
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateStdField('p4Lh', Math.max(0.85, Number(((std.p4Lh ?? std.lh ?? 1.15) - 0.05).toFixed(2))))}
                        className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
                        title="ลดระยะบรรทัด (-0.05)"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0.90"
                        max="2.00"
                        step="0.05"
                        value={std.p4Lh ?? std.lh ?? 1.15}
                        onChange={(e) => updateStdField('p4Lh', parseFloat(e.target.value))}
                        className="flex-1 accent-[#4F0080] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => updateStdField('p4Lh', Math.min(2.50, Number(((std.p4Lh ?? std.lh ?? 1.15) + 0.05).toFixed(2))))}
                        className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
                        title="เพิ่มระยะบรรทัด (+0.05)"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-[9.5px] text-[#7A6A88] pt-0.5">
                      <button type="button" onClick={() => updateStdField('p4Lh', 1.0)} className="hover:underline">1.0 (ชิด)</button>
                      <button type="button" onClick={() => updateStdField('p4Lh', 1.05)} className="hover:underline">1.05 (กระชับ)</button>
                      <button type="button" onClick={() => updateStdField('p4Lh', 1.15)} className="hover:underline font-bold text-[#4F0080]">1.15 (มาตรฐาน)</button>
                      <button type="button" onClick={() => updateStdField('p4Lh', 1.25)} className="hover:underline">1.25</button>
                      <button type="button" onClick={() => updateStdField('p4Lh', 1.50)} className="hover:underline">1.50</button>
                    </div>
                  </div>

                  {/* Space After Control */}
                  <div className="space-y-1 pt-1 border-t border-[#F2EBF8]">
                    <div className="flex justify-between items-center text-[11px] text-[#5C4A6E]">
                      <span className="font-semibold">ช่องว่างท้ายย่อหน้า (Space After):</span>
                      <span className="font-mono font-bold text-[#4F0080]">
                        {std.p4Mb ?? std.paraSpacing ?? 12} pt
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateStdField('p4Mb', Math.max(0, (std.p4Mb ?? std.paraSpacing ?? 12) - 1))}
                        className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
                        title="ลดช่องว่าง (-1pt)"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="36"
                        step="1"
                        value={std.p4Mb ?? std.paraSpacing ?? 12}
                        onChange={(e) => updateStdField('p4Mb', parseInt(e.target.value))}
                        className="flex-1 accent-[#4F0080] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => updateStdField('p4Mb', Math.min(48, (std.p4Mb ?? std.paraSpacing ?? 12) + 1))}
                        className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-xs transition-colors"
                        title="เพิ่มช่องว่าง (+1pt)"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-[9.5px] text-[#7A6A88] pt-0.5">
                      <button type="button" onClick={() => updateStdField('p4Mb', 0)} className="hover:underline">0 pt (ไม่เว้น)</button>
                      <button type="button" onClick={() => updateStdField('p4Mb', 6)} className="hover:underline">6 pt (ครึ่งบรรทัด)</button>
                      <button type="button" onClick={() => updateStdField('p4Mb', 12)} className="hover:underline font-bold text-[#4F0080]">12 pt (มาตรฐาน)</button>
                      <button type="button" onClick={() => updateStdField('p4Mb', 18)} className="hover:underline">18 pt</button>
                      <button type="button" onClick={() => updateStdField('p4Mb', 24)} className="hover:underline">24 pt (๒ บรรทัด)</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: POSITIONS (ปรับซ้าย-ขวา และ ขึ้น-ลง) ================= */}
          {tuningTab === 'positions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              {/* ตราสัญลักษณ์ สจล. (ซ้าย-ขวา กึ่งกลางเส้นแดง 7.5 cm) */}
              <div className="bg-white p-2.5 rounded-lg border-2 border-[#D9C2EC] space-y-1.5 shadow-2xs">
                <div className="flex justify-between items-center text-[#4F0080] font-bold text-[11px]">
                  <span>👑 โลโก้ สจล. (ขยับซ้าย-ขวา)</span>
                  <span className="font-mono text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.5 rounded border border-[#DECBEF] font-bold">
                    {std.logoXOffset ?? 7.5} ซม.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStdField('logoXOffset', Math.max(4.0, Number(((std.logoXOffset ?? 7.5) - 0.2).toFixed(1))))}
                    className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-[10px]"
                    title="ขยับโลโก้ไปทางซ้าย"
                  >
                    ◀ ซ้าย
                  </button>
                  <input
                    type="range"
                    min="5.0"
                    max="10.0"
                    step="0.1"
                    value={std.logoXOffset ?? 7.5}
                    onChange={(e) => updateStdField('logoXOffset', parseFloat(e.target.value))}
                    className="flex-1 accent-[#4F0080] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateStdField('logoXOffset', Math.min(11.0, Number(((std.logoXOffset ?? 7.5) + 0.2).toFixed(1))))}
                    className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-[10px]"
                    title="ขยับโลโก้ไปทางขวา"
                  >
                    ขวา ▶
                  </button>
                </div>
                <div className="text-[10px] text-[#7A6A88] flex justify-between items-center">
                  <span>กึ่งกลางหน้ากระดาษ (10.5 ซม.)</span>
                  <button
                    type="button"
                    onClick={() => updateStdField('logoXOffset', 7.5)}
                    className="hover:underline font-bold text-[#E0245E] bg-[#FFF0F4] px-1.5 py-0.5 rounded border border-[#FAD0DC]"
                  >
                    เส้นแดง 7.5 ซม.
                  </button>
                </div>
              </div>

              {/* บรรทัดที่อยู่มหาลัย (ซ้าย-ขวา) */}
              <div className="bg-white p-2.5 rounded-lg border-2 border-[#D9C2EC] space-y-1.5 shadow-2xs">
                <div className="flex justify-between items-center text-[#4F0080] font-bold text-[11px]">
                  <span>🏛️ ที่อยู่สถาบัน (ขยับซ้าย-ขวา)</span>
                  <span className="font-mono text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.5 rounded border border-[#DECBEF] font-bold">
                    {std.rAddr} ซม.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStdField('rAddr', Math.max(4.0, Number((std.rAddr - 0.2).toFixed(1))))}
                    className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-[10px]"
                    title="ขยับไปทางซ้าย"
                  >
                    ◀ ซ้าย
                  </button>
                  <input
                    type="range"
                    min="5.0"
                    max="11.5"
                    step="0.1"
                    value={std.rAddr}
                    onChange={(e) => updateStdField('rAddr', parseFloat(e.target.value))}
                    className="flex-1 accent-[#4F0080] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateStdField('rAddr', Math.min(13.0, Number((std.rAddr + 0.2).toFixed(1))))}
                    className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-[10px]"
                    title="ขยับไปทางขวา"
                  >
                    ขวา ▶
                  </button>
                </div>
                <div className="text-[10px] text-[#7A6A88] flex justify-between">
                  <span>ตรงระดับเดียวกับ เลขที่ อว.</span>
                  <button type="button" onClick={() => updateStdField('rAddr', 8.5)} className="hover:underline font-semibold text-[#4F0080]">
                    มาตรฐาน: 8.5 ซม.
                  </button>
                </div>
              </div>

              {/* บรรทัดวันที่ (ซ้าย-ขวา) */}
              <div className="bg-white p-2.5 rounded-lg border-2 border-[#D9C2EC] space-y-1.5 shadow-2xs">
                <div className="flex justify-between items-center text-[#4F0080] font-bold text-[11px]">
                  <span>📅 บรรทัดวันที่ (ขยับซ้าย-ขวา)</span>
                  <span className="font-mono text-[#4F0080] bg-[#F2EBF8] px-1.5 py-0.5 rounded border border-[#DECBEF] font-bold">
                    {std.rDate} ซม.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStdField('rDate', Math.max(4.0, Number((std.rDate - 0.2).toFixed(1))))}
                    className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-[10px]"
                    title="ขยับไปทางซ้าย"
                  >
                    ◀ ซ้าย
                  </button>
                  <input
                    type="range"
                    min="5.0"
                    max="11.5"
                    step="0.1"
                    value={std.rDate}
                    onChange={(e) => updateStdField('rDate', parseFloat(e.target.value))}
                    className="flex-1 accent-[#4F0080] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateStdField('rDate', Math.min(13.0, Number((std.rDate + 0.2).toFixed(1))))}
                    className="w-7 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer text-[10px]"
                    title="ขยับไปทางขวา"
                  >
                    ขวา ▶
                  </button>
                </div>
                <div className="text-[10px] text-[#7A6A88] flex justify-between">
                  <span>พิกัดวัน/เดือน/ปี</span>
                  <button type="button" onClick={() => updateStdField('rDate', 8.2)} className="hover:underline font-semibold text-[#4F0080]">
                    มาตรฐาน: 8.2 ซม.
                  </button>
                </div>
              </div>

              {/* บรรทัด ที่ อว. และ ที่อยู่ (ขึ้น-ลง พร้อมกัน) */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E9DCF4] space-y-1.5">
                <div className="flex justify-between items-center text-[#4F0080] font-semibold text-[11px]">
                  <span>↕️ บรรทัด ที่ อว. & ที่อยู่ (ขึ้น-ลง)</span>
                  <span className="font-mono text-[#6C567E] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#E9DCF4]">
                    {std.headerTopOffset ?? 12} pt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStdField('headerTopOffset', Math.max(-20, (std.headerTopOffset ?? 12) - 2))}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="เลื่อนขึ้น"
                  >
                    ▲
                  </button>
                  <input
                    type="range"
                    min="-20"
                    max="50"
                    step="1"
                    value={std.headerTopOffset ?? 12}
                    onChange={(e) => updateStdField('headerTopOffset', parseInt(e.target.value))}
                    className="flex-1 accent-[#4F0080] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateStdField('headerTopOffset', (std.headerTopOffset ?? 12) + 2)}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="เลื่อนลง"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* บรรทัดวันที่ (ขึ้น-ลง) */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E9DCF4] space-y-1.5">
                <div className="flex justify-between items-center text-[#4F0080] font-semibold text-[11px]">
                  <span>↕️ บรรทัดวันที่ (ขึ้น-ลง)</span>
                  <span className="font-mono text-[#6C567E] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#E9DCF4]">
                    {std.dateTopOffset ?? 12} pt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStdField('dateTopOffset', Math.max(-10, (std.dateTopOffset ?? 12) - 2))}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="เลื่อนขึ้น"
                  >
                    ▲
                  </button>
                  <input
                    type="range"
                    min="-10"
                    max="40"
                    step="1"
                    value={std.dateTopOffset ?? 12}
                    onChange={(e) => updateStdField('dateTopOffset', parseInt(e.target.value))}
                    className="flex-1 accent-[#4F0080] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateStdField('dateTopOffset', (std.dateTopOffset ?? 12) + 2)}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="เลื่อนลง"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* ตราสัญลักษณ์ สจล. (ขึ้น-ลง) */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E9DCF4] space-y-1.5">
                <div className="flex justify-between items-center text-[#4F0080] font-semibold text-[11px]">
                  <span>↕️ ตราสัญลักษณ์ สจล. (ขึ้น-ลง)</span>
                  <span className="font-mono text-[#6C567E] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#E9DCF4]">
                    {std.logoTopOffset ?? 0} pt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStdField('logoTopOffset', (std.logoTopOffset ?? 0) - 2)}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="เลื่อนขึ้น"
                  >
                    ▲
                  </button>
                  <input
                    type="range"
                    min="-30"
                    max="40"
                    step="1"
                    value={std.logoTopOffset ?? 0}
                    onChange={(e) => updateStdField('logoTopOffset', parseInt(e.target.value))}
                    className="flex-1 accent-[#4F0080] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateStdField('logoTopOffset', (std.logoTopOffset ?? 0) + 2)}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="เลื่อนลง"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* เรื่อง / เรียน (ขึ้น-ลง) */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E9DCF4] space-y-1.5">
                <div className="flex justify-between items-center text-[#4F0080] font-semibold text-[11px]">
                  <span>↕️ บรรทัด เรื่อง / เรียน (ขึ้น-ลง)</span>
                  <span className="font-mono text-[#6C567E] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#E9DCF4]">
                    {std.subjectTopOffset ?? 12} pt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStdField('subjectTopOffset', Math.max(0, (std.subjectTopOffset ?? 12) - 2))}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="เลื่อนขึ้น"
                  >
                    ▲
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="1"
                    value={std.subjectTopOffset ?? 12}
                    onChange={(e) => updateStdField('subjectTopOffset', parseInt(e.target.value))}
                    className="flex-1 accent-[#4F0080] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateStdField('subjectTopOffset', (std.subjectTopOffset ?? 12) + 2)}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="เลื่อนลง"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* ระยะห่างย่อหน้าเนื้อหา (ขึ้น-ลง) */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E9DCF4] space-y-1.5">
                <div className="flex justify-between items-center text-[#4F0080] font-semibold text-[11px]">
                  <span>↕️ ช่องว่างระหว่างย่อหน้าเนื้อหา</span>
                  <span className="font-mono text-[#6C567E] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#E9DCF4]">
                    {std.paraSpacing ?? 12} pt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStdField('paraSpacing', Math.max(0, (std.paraSpacing ?? 12) - 2))}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="ลดระยะห่าง"
                  >
                    ▲
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="36"
                    step="1"
                    value={std.paraSpacing ?? 12}
                    onChange={(e) => updateStdField('paraSpacing', parseInt(e.target.value))}
                    className="flex-1 accent-[#4F0080] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateStdField('paraSpacing', (std.paraSpacing ?? 12) + 2)}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="เพิ่มระยะห่าง"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* คำลงท้าย & ช่องว่างเซ็น */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E9DCF4] space-y-1.5">
                <div className="flex justify-between items-center text-[#4F0080] font-semibold text-[11px]">
                  <span>↕️ คำลงท้าย & ช่องว่างเซ็น</span>
                  <span className="font-mono text-[#6C567E] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#E9DCF4]">
                    เว้น {std.signatureTopOffset ?? 18}pt / เซ็น {std.signGapHeight ?? 1.6}cm
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStdField('signatureTopOffset', Math.max(4, (std.signatureTopOffset ?? 18) - 2))}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="ขยับขึ้น"
                  >
                    ▲
                  </button>
                  <input
                    type="range"
                    min="4"
                    max="50"
                    step="1"
                    value={std.signatureTopOffset ?? 18}
                    onChange={(e) => updateStdField('signatureTopOffset', parseInt(e.target.value))}
                    className="flex-1 accent-[#4F0080] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateStdField('signatureTopOffset', (std.signatureTopOffset ?? 18) + 2)}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="ขยับลง"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* ท้ายกระดาษ (ขึ้น-ลง) */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E9DCF4] space-y-1.5">
                <div className="flex justify-between items-center text-[#4F0080] font-semibold text-[11px]">
                  <span>↕️ ระยะท้ายกระดาษ (Footer)</span>
                  <span className="font-mono text-[#6C567E] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#E9DCF4]">
                    {std.footerBottomOffset ?? 24} pt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStdField('footerBottomOffset', Math.max(0, (std.footerBottomOffset ?? 24) - 4))}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="ขยับท้ายกระดาษขึ้น"
                  >
                    ▲
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="2"
                    value={std.footerBottomOffset ?? 24}
                    onChange={(e) => updateStdField('footerBottomOffset', parseInt(e.target.value))}
                    className="flex-1 accent-[#4F0080] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateStdField('footerBottomOffset', (std.footerBottomOffset ?? 24) + 4)}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="ขยับท้ายกระดาษลง"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: SPACING & FONT SIZE ================= */}
          {tuningTab === 'spacing' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              {/* Letter Spacing (ช่องไฟตัวอักษร) */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E9DCF4] space-y-1.5">
                <div className="flex justify-between items-center text-[#4F0080] font-semibold text-[11px]">
                  <span>ช่องไฟตัวอักษร (Letter Spacing)</span>
                  <span className="font-mono text-[#6C567E] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#E9DCF4]">
                    {std.lsp} px
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStdField('lsp', Number((std.lsp - 0.05).toFixed(2)))}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="ลดช่องไฟ"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="-1.5"
                    max="3.0"
                    step="0.05"
                    value={std.lsp}
                    onChange={(e) => updateStdField('lsp', parseFloat(e.target.value))}
                    className="flex-1 accent-[#4F0080] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateStdField('lsp', Number((std.lsp + 0.05).toFixed(2)))}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="เพิ่มช่องไฟ"
                  >
                    +
                  </button>
                </div>
                <div className="flex justify-between text-[10px] text-[#7A6A88]">
                  <button type="button" onClick={() => updateStdField('lsp', -0.4)} className="hover:underline">-0.4 (ชิด)</button>
                  <button type="button" onClick={() => updateStdField('lsp', -0.2)} className="hover:underline font-semibold text-[#4F0080]">-0.2 (มาตรฐาน)</button>
                  <button type="button" onClick={() => updateStdField('lsp', 0)} className="hover:underline">0.0 (ปกติ)</button>
                  <button type="button" onClick={() => updateStdField('lsp', 0.5)} className="hover:underline">+0.5 (โปร่ง)</button>
                </div>
              </div>

              {/* Word Spacing (ระยะห่างคำ) */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E9DCF4] space-y-1.5">
                <div className="flex justify-between items-center text-[#4F0080] font-semibold text-[11px]">
                  <span>ระยะห่างระหว่างคำ (Word Spacing)</span>
                  <span className="font-mono text-[#6C567E] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#E9DCF4]">
                    {std.wsp} px
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStdField('wsp', Number((std.wsp - 0.5).toFixed(1)))}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="ลดระยะห่างคำ"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="-2.0"
                    max="8.0"
                    step="0.5"
                    value={std.wsp}
                    onChange={(e) => updateStdField('wsp', parseFloat(e.target.value))}
                    className="flex-1 accent-[#4F0080] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateStdField('wsp', Number((std.wsp + 0.5).toFixed(1)))}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="เพิ่มระยะห่างคำ"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Line Height (ระยะบรรทัด) */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E9DCF4] space-y-1.5">
                <div className="flex justify-between items-center text-[#4F0080] font-semibold text-[11px]">
                  <span>ระยะระหว่างบรรทัด (Line Height)</span>
                  <span className="font-mono text-[#6C567E] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#E9DCF4]">
                    {std.lh}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStdField('lh', Math.max(0.9, Number((std.lh - 0.05).toFixed(2))))}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="ลดระยะบรรทัด"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="1.0"
                    max="1.9"
                    step="0.05"
                    value={std.lh}
                    onChange={(e) => updateStdField('lh', parseFloat(e.target.value))}
                    className="flex-1 accent-[#4F0080] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateStdField('lh', Number((std.lh + 0.05).toFixed(2)))}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="เพิ่มระยะบรรทัด"
                  >
                    +
                  </button>
                </div>
                <div className="flex justify-between text-[10px] text-[#7A6A88]">
                  <button type="button" onClick={() => updateStdField('lh', 1.05)} className="hover:underline">1.05</button>
                  <button type="button" onClick={() => updateStdField('lh', 1.15)} className="hover:underline font-semibold text-[#4F0080]">1.15 (มาตรฐาน)</button>
                  <button type="button" onClick={() => updateStdField('lh', 1.30)} className="hover:underline">1.30</button>
                  <button type="button" onClick={() => updateStdField('lh', 1.50)} className="hover:underline">1.50</button>
                </div>
              </div>

              {/* Font Size (ขนาดตัวอักษร) */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E9DCF4] space-y-1.5">
                <div className="flex justify-between items-center text-[#4F0080] font-semibold text-[11px]">
                  <span>ขนาดตัวอักษร (Font Size)</span>
                  <span className="font-mono text-[#6C567E] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#E9DCF4]">
                    {std.fs} pt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStdField('fs', Math.max(8, std.fs - 1))}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="ลดขนาดฟอนต์"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="8"
                    max="18"
                    step="0.5"
                    value={std.fs}
                    onChange={(e) => updateStdField('fs', parseFloat(e.target.value))}
                    className="flex-1 accent-[#4F0080] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateStdField('fs', Math.min(20, std.fs + 1))}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="เพิ่มขนาดฟอนต์"
                  >
                    +
                  </button>
                </div>
                <div className="flex justify-between text-[10px] text-[#7A6A88]">
                  <button type="button" onClick={() => updateStdField('fs', 16)} className={`hover:underline ${std.fs === 16 ? 'font-bold text-[#4F0080]' : ''}`}>16pt (มาตรฐานสารบรรณ)</button>
                  <button type="button" onClick={() => updateStdField('fs', 14)} className={`hover:underline ${std.fs === 14 ? 'font-bold text-[#4F0080]' : ''}`}>14pt</button>
                  <button type="button" onClick={() => updateStdField('fs', 12)} className={`hover:underline ${std.fs === 12 ? 'font-bold text-[#4F0080]' : ''}`}>12pt</button>
                  <button type="button" onClick={() => updateStdField('fs', 10)} className={`hover:underline ${std.fs === 10 ? 'font-bold text-[#4F0080]' : ''}`}>10pt</button>
                </div>
              </div>

              {/* First-line Indent (ระยะย่อหน้า) */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E9DCF4] space-y-1.5">
                <div className="flex justify-between items-center text-[#4F0080] font-semibold text-[11px]">
                  <span>ระยะย่อหน้าบรรทัดแรก (First-line Indent)</span>
                  <span className="font-mono text-[#6C567E] bg-[#FAF8FC] px-1.5 py-0.5 rounded border border-[#E9DCF4]">
                    {std.rIndent} ซม.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStdField('rIndent', Math.max(1.0, Number((std.rIndent - 0.1).toFixed(1))))}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="ลดย่อหน้า"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="1.0"
                    max="3.5"
                    step="0.05"
                    value={std.rIndent}
                    onChange={(e) => updateStdField('rIndent', parseFloat(e.target.value))}
                    className="flex-1 accent-[#4F0080] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => updateStdField('rIndent', Number((std.rIndent + 0.1).toFixed(1)))}
                    className="w-6 h-6 rounded bg-[#F2EBF8] hover:bg-[#E8DCF4] font-bold text-[#4F0080] flex items-center justify-center cursor-pointer"
                    title="เพิ่มย่อหน้า"
                  >
                    +
                  </button>
                </div>
                <div className="flex justify-between text-[10px] text-[#7A6A88]">
                  <button type="button" onClick={() => updateStdField('rIndent', 2.0)} className="hover:underline">2.0 ซม.</button>
                  <button type="button" onClick={() => updateStdField('rIndent', 2.5)} className="hover:underline font-semibold text-[#4F0080]">2.5 ซม. (พิกัด 2 ไม้บรรทัด)</button>
                  <button type="button" onClick={() => updateStdField('rIndent', 3.0)} className="hover:underline">3.0 ซม.</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Document Workspace with Word-style Top & Left Rulers */}
      <div className="preview-window-container preview-container overflow-auto max-h-[calc(100vh-170px)] rounded-xl border border-[#E7DEF0] print-area">
        <div
          id="preview-viewport"
          className="origin-top transition-transform flex flex-col items-center"
          style={{
            zoom: zoom,
            fontFamily: "'Sarabun', 'TH Sarabun PSK', sans-serif",
            lineHeight: std.lh,
            letterSpacing: `${std.lsp}px`,
            wordSpacing: `${std.wsp}px`,
            ['--doc-font-size' as string]: `${std.fs}pt`,
            ['--lsp' as string]: `${std.lsp}px`,
            ['--wsp' as string]: `${std.wsp}px`,
            ['--lh' as string]: `${std.lh}`,
            ['--text-align' as string]: textAlign,
            ['--text-justify' as string]: textJustify,
            ['--line-break' as string]: lineBreakMode,
            ['--word-break' as string]: wordBreakMode
          }}
        >
          {/* Top Horizontal Ruler with Left Corner Block */}
          {showAxis && (
            <div className="flex items-end mb-1 no-print select-none origin-bottom scale-[0.8]" style={{ width: 'calc(794px + 28px)' }}>
              {/* Corner junction block (where top & left rulers intersect, like MS Word) */}
              <div className="w-[28px] h-7 bg-[#EBE3F3] border-t border-l border-b border-[#C4B1D4] rounded-tl-sm flex flex-col items-center justify-center text-[8px] text-[#7A6A88] font-bold select-none shrink-0 shadow-2xs">
                <span>0,0</span>
              </div>

              {/* Horizontal Ruler Bar */}
              <div
                className="relative h-7 bg-white border border-[#C4B1D4] text-[9px] text-[#7A6A88] overflow-visible select-none shadow-2xs"
                style={{ width: '794px' }}
              >
                {/* Left Margin Shading (0 to 3.0cm) */}
                <div
                  className="absolute top-0 bottom-0 bg-[#EBE3F3] border-r-2 border-[#8E6F9F]"
                  style={{ left: 0, width: `${(std.mL / 21.0) * 100}%` }}
                >
                  <div className="absolute top-0 bottom-0 left-[33.3%] border-l border-[#D6C4E4]" />
                  <div className="absolute top-0 bottom-0 left-[66.6%] border-l border-[#D6C4E4]" />
                  <span className="absolute bottom-0.5 right-1 text-[8px] font-bold text-[#6B00AD]">0 cm (ซ้าย)</span>
                </div>

                {/* Right Margin Shading (19.0cm to 21.0cm) */}
                <div
                  className="absolute top-0 bottom-0 bg-[#EBE3F3] border-l-2 border-[#8E6F9F]"
                  style={{ right: 0, width: `${(std.mR / 21.0) * 100}%` }}
                >
                  <div className="absolute top-0 bottom-0 left-[50%] border-l border-[#D6C4E4]" />
                  <span className="absolute bottom-0.5 left-1 text-[8px] font-bold text-[#6B00AD]">16 cm (ขวา)</span>
                </div>

                {/* Centimeter ticks inside printable area (0 to 16cm) */}
                {Array.from({ length: Math.floor(contentW) + 1 }).map((_, i) => {
                  const xCm = std.mL + i;
                  const pct = (xCm / 21.0) * 100;
                  return (
                    <React.Fragment key={i}>
                      {/* Major cm line */}
                      <div
                        className="absolute top-0 bottom-0 border-l border-[#C4B1D4]"
                        style={{ left: `${pct}%` }}
                      />
                      {/* Number */}
                      <span
                        className="absolute top-0.5 font-bold text-[8.5px] text-[#5C4A6E] transform -translate-x-1/2"
                        style={{ left: `${pct}%` }}
                      >
                        {i}
                      </span>
                      {/* 0.5 cm mid-tick */}
                      {i < contentW && (
                        <>
                          <div
                            className="absolute top-2.5 bottom-0 border-l border-[#D9CBE4]"
                            style={{ left: `${((xCm + 0.5) / 21.0) * 100}%` }}
                          />
                          {/* Quarter ticks */}
                          <div
                            className="absolute top-4 bottom-0 border-l border-[#EDE4F3]"
                            style={{ left: `${((xCm + 0.25) / 21.0) * 100}%` }}
                          />
                          <div
                            className="absolute top-4 bottom-0 border-l border-[#EDE4F3]"
                            style={{ left: `${((xCm + 0.75) / 21.0) * 100}%` }}
                          />
                        </>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* MARKER 1: 0.0 CM (Left Indent - Left Margin) */}
                <div
                  className="absolute top-0 bottom-0 w-[1.5px] bg-[#2563EB] z-20 group cursor-pointer"
                  style={{ left: `${(std.mL / 21.0) * 100}%` }}
                  title="ขอบซ้าย 0 ซม. (3.0 ซม. จากขอบกระดาษ) - ที่ อว., เรื่อง, เรียน, บรรทัดปกติ, ส่วนท้าย"
                >
                  <span className="absolute bottom-0 -left-1 text-[9px] font-bold text-[#2563EB] leading-none">
                    ▲
                  </span>
                  <span className="absolute -top-3.5 -left-3 text-[7.5px] font-bold text-white bg-[#2563EB] px-1 py-0.2 rounded shadow-2xs whitespace-nowrap opacity-90 group-hover:opacity-100">
                    0.0 ซ้าย
                  </span>
                </div>

                {/* MARKER 2: 1.5 CM (Tab Stop for เรื่อง/เรียน) */}
                <div
                  className="absolute top-0 bottom-0 w-[1.5px] bg-[#9333EA] z-20 group cursor-pointer"
                  style={{ left: `${((std.mL + std.rTab) / 21.0) * 100}%` }}
                  title={`แท็บ เรื่อง/เรียน ${std.rTab} ซม.`}
                >
                  <span className="absolute bottom-0.5 -left-1 text-[8px] font-extrabold text-[#9333EA] leading-none">
                    ⌐
                  </span>
                  <span className="absolute -top-3.5 -left-2 text-[7.5px] font-bold text-white bg-[#9333EA] px-1 py-0.2 rounded shadow-2xs whitespace-nowrap opacity-90 group-hover:opacity-100">
                    {std.rTab} แท็บ
                  </span>
                </div>

                {/* MARKER 3: 2.5 CM (First-Line Indent for Paragraphs) */}
                <div
                  className="absolute top-0 bottom-0 w-[1.5px] bg-[#4F46E5] z-20 group cursor-pointer"
                  style={{ left: `${((std.mL + std.rIndent) / 21.0) * 100}%` }}
                  title={`ย่อหน้า ${std.rIndent} ซม. (First-line Indent)`}
                >
                  <span className="absolute top-0 -left-1 text-[9px] font-bold text-[#4F46E5] leading-none">
                    ▼
                  </span>
                  <span className="absolute -top-3.5 -left-3 text-[7.5px] font-bold text-white bg-[#4F46E5] px-1 py-0.2 rounded shadow-2xs whitespace-nowrap opacity-90 group-hover:opacity-100">
                    {std.rIndent} ย่อหน้า
                  </span>
                </div>

                {/* MARKER 4: 7.5 CM (Page Center Axis 10.5cm of 21.0cm A4 paper) */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-[#E11D48] z-30 group cursor-pointer"
                  style={{ left: '50%' }}
                  title="กึ่งกลางหน้ากระดาษ 10.5 ซม. (พิกัด 7.5 ซม. บนไม้บรรทัด) - ตรา สจล. และ ขอแสดงความนับถือ / คณบดี"
                >
                  <span className="absolute -top-4 -left-6 text-[8px] font-extrabold text-white bg-[#E11D48] px-1.5 py-0.2 rounded shadow-2xs whitespace-nowrap">
                    7.5 (กลาง 10.5)
                  </span>
                  <span className="absolute bottom-0 -left-1 text-[9px] font-bold text-[#E11D48] leading-none">
                    ◆
                  </span>
                </div>

                {/* MARKER 5: 8.2 CM (Date Line) */}
                <div
                  className="absolute top-0 bottom-0 w-[1.5px] bg-[#C026D3] z-20 group cursor-pointer"
                  style={{ left: `${((std.mL + std.rDate) / 21.0) * 100}%` }}
                  title={`บรรทัดวันที่ ${std.rDate} ซม.`}
                >
                  <span className="absolute bottom-0.5 -left-1 text-[8px] font-extrabold text-[#C026D3] leading-none">
                    ⌐
                  </span>
                  <span className="absolute -top-3.5 -left-2 text-[7.5px] font-bold text-white bg-[#C026D3] px-1 py-0.2 rounded shadow-2xs whitespace-nowrap opacity-90 group-hover:opacity-100">
                    {std.rDate} วันที่
                  </span>
                </div>

                {/* MARKER 6: 8.5 CM (Institution Address) */}
                <div
                  className="absolute top-0 bottom-0 w-[1.5px] bg-[#D97706] z-20 group cursor-pointer"
                  style={{ left: `${((std.mL + std.rAddr) / 21.0) * 100}%` }}
                  title={`ที่อยู่สถาบัน ${std.rAddr} ซม.`}
                >
                  <span className="absolute bottom-0.5 -left-1 text-[8px] font-extrabold text-[#D97706] leading-none">
                    ⌐
                  </span>
                  <span className="absolute -top-3.5 -left-2 text-[7.5px] font-bold text-white bg-[#D97706] px-1 py-0.2 rounded shadow-2xs whitespace-nowrap opacity-90 group-hover:opacity-100">
                    {std.rAddr} ที่อยู่
                  </span>
                </div>

                {/* MARKER 7: 16.0 CM (Right Indent - Right Margin) */}
                <div
                  className="absolute top-0 bottom-0 w-[1.5px] bg-[#2563EB] z-20 group cursor-pointer"
                  style={{ left: `${((21.0 - std.mR) / 21.0) * 100}%` }}
                  title="ขอบขวา 16.0 ซม. (2.0 ซม. จากขอบขวากระดาษ) - จัดกระจายข้อความแบบไทย"
                >
                  <span className="absolute bottom-0 -left-1 text-[9px] font-bold text-[#2563EB] leading-none">
                    ▲
                  </span>
                  <span className="absolute -top-3.5 -left-3 text-[7.5px] font-bold text-white bg-[#2563EB] px-1 py-0.2 rounded shadow-2xs whitespace-nowrap opacity-90 group-hover:opacity-100">
                    16.0 ขวา
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================= PAGE 1 WRAPPER (With Left Vertical Ruler) ================= */}
          <div className="flex items-start justify-center relative mb-8">
            {/* Left Vertical Ruler (like MS Word Left Ruler) */}
            {showAxis && (
              <div
                className="w-[28px] bg-white border border-[#C4B1D4] mr-0 shrink-0 relative text-[8px] text-[#7A6A88] select-none no-print overflow-visible shadow-2xs origin-top-right scale-[0.8]"
                style={{ height: '1123px' }}
              >
                {/* Top Margin Shading (0 to 1.5cm) */}
                <div
                  className="absolute left-0 right-0 top-0 bg-[#EBE3F3] border-b-2 border-[#8E6F9F]"
                  style={{ height: `${(std.mT / 29.7) * 100}%` }}
                >
                  <span className="absolute right-1 bottom-0.5 text-[7.5px] font-bold text-[#6B00AD]">0 cm</span>
                </div>

                {/* Bottom Margin Shading (27.9 to 29.7cm) */}
                <div
                  className="absolute left-0 right-0 bottom-0 bg-[#EBE3F3] border-t-2 border-[#8E6F9F]"
                  style={{ height: `${(std.mB / 29.7) * 100}%` }}
                >
                  <span className="absolute right-1 top-0.5 text-[7.5px] font-bold text-[#6B00AD]">ล่าง</span>
                </div>

                {/* Vertical cm ticks (0 to 26cm inside content) */}
                {Array.from({ length: Math.floor(contentH) + 1 }).map((_, i) => {
                  const yCm = std.mT + i;
                  const pct = (yCm / 29.7) * 100;
                  return (
                    <React.Fragment key={i}>
                      <div
                        className="absolute left-0 right-0 border-t border-[#C4B1D4]"
                        style={{ top: `${pct}%` }}
                      />
                      <span
                        className="absolute right-1 font-bold text-[7.5px] text-[#5C4A6E] transform -translate-y-1/2"
                        style={{ top: `${pct}%` }}
                      >
                        {i}
                      </span>
                      {i < contentH && (
                        <div
                          className="absolute left-3 right-0 border-t border-[#D9CBE4]"
                          style={{ top: `${((yCm + 0.5) / 29.7) * 100}%` }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* A4 Page 1 */}
            <div id="a4-page-1" className="a4-document-page a4-page relative shadow-md">
              {/* Full Word Ruler Guidelines Overlay (Vertical & Horizontal Lines across Page) */}
              {showAxis && guideMode !== 'none' && (
                <div className="absolute inset-0 pointer-events-none z-10 no-print overflow-hidden select-none">
                  {/* VERTICAL GUIDELINES */}
                  {(guideMode === 'all' || guideMode === 'vertical') && (
                    <>
                      {/* V1: Left Margin 0 cm (3.0 cm from paper edge) */}
                      <div
                        className="guide-line-v border-l-2 border-[#2563EB] opacity-75"
                        style={{ left: `${std.mL}cm` }}
                      >
                        {showGuideLabels && (
                          <span className="guide-badge absolute top-1 left-1 bg-blue-50 text-blue-700 border border-blue-300">
                            0.0 cm (ซ้าย)
                          </span>
                        )}
                      </div>

                      {/* V2: Tab Stop 1.5 cm (4.5 cm from paper edge) */}
                      <div
                        className="guide-line-v border-l border-dashed border-[#9333EA] opacity-60"
                        style={{ left: `${std.mL + std.rTab}cm` }}
                      >
                        {showGuideLabels && (
                          <span className="guide-badge absolute top-5 left-1 bg-purple-50 text-purple-700 border border-purple-300">
                            1.5 cm (แท็บ)
                          </span>
                        )}
                      </div>

                      {/* V3: First-Line Indent 2.5 cm (5.5 cm from paper edge) */}
                      <div
                        className="guide-line-v border-l border-dashed border-[#4F46E5] opacity-65"
                        style={{ left: `${std.mL + std.rIndent}cm` }}
                      >
                        {showGuideLabels && (
                          <span className="guide-badge absolute top-9 left-1 bg-indigo-50 text-indigo-700 border border-indigo-300">
                            2.5 cm (ย่อหน้า)
                          </span>
                        )}
                      </div>

                      {/* V5: Date Line 8.2 cm (11.2 cm from paper edge) */}
                      <div
                        className="guide-line-v border-l border-dashed border-[#C026D3] opacity-60"
                        style={{ left: `${std.mL + std.rDate}cm` }}
                      >
                        {showGuideLabels && (
                          <span className="guide-badge absolute top-5 left-1 bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-300">
                            {std.rDate} cm (วันที่)
                          </span>
                        )}
                      </div>

                      {/* V6: Address Line 8.5 cm (11.5 cm from paper edge) */}
                      <div
                        className="guide-line-v border-l border-dashed border-[#D97706] opacity-60"
                        style={{ left: `${std.mL + std.rAddr}cm` }}
                      >
                        {showGuideLabels && (
                          <span className="guide-badge absolute top-9 left-1 bg-amber-50 text-amber-700 border border-amber-300">
                            {std.rAddr} cm (ที่อยู่)
                          </span>
                        )}
                      </div>

                      {/* V7: Right Margin 16.0 cm (19.0 cm from paper edge) */}
                      <div
                        className="guide-line-v border-l-2 border-[#2563EB] opacity-75"
                        style={{ left: `${21.0 - std.mR}cm` }}
                      >
                        {showGuideLabels && (
                          <span className="guide-badge absolute top-1 right-1 bg-blue-50 text-blue-700 border border-blue-300">
                            16.0 cm (ขวา)
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {/* V4: Center Axis 7.5 cm (10.5 cm Page Center = 50%) */}
                  {(guideMode === 'all' || guideMode === 'vertical' || guideMode === 'center') && (
                    <div
                      className="guide-line-v border-l-2 border-dashed border-[#E11D48] opacity-80"
                      style={{ left: '50%' }}
                    >
                      {showGuideLabels && (
                        <span className="guide-badge absolute top-1 -left-12 bg-rose-50 text-rose-700 border border-rose-300 font-extrabold">
                          7.5 cm (กลาง 10.5)
                        </span>
                      )}
                    </div>
                  )}

                  {/* HORIZONTAL GUIDELINES */}
                  {(guideMode === 'all' || guideMode === 'horizontal') && (
                    <>
                      {/* H1: Top Margin 1.5 cm */}
                      <div
                        className="guide-line-h border-t-2 border-[#2563EB] opacity-70"
                        style={{ top: `${std.mT}cm` }}
                      >
                        {showGuideLabels && (
                          <span className="guide-badge absolute -top-4 left-[3.2cm] bg-blue-50 text-blue-700 border border-blue-300">
                            ขอบบน ({std.mT} cm)
                          </span>
                        )}
                      </div>

                      {/* H2: Logo Bottom 4.5 cm */}
                      <div
                        className="guide-line-h border-t border-dashed border-[#E11D48] opacity-50"
                        style={{ top: `${std.mT + std.logoH}cm` }}
                      >
                        {showGuideLabels && (
                          <span className="guide-badge absolute -top-3.5 right-[2.2cm] bg-rose-50 text-rose-700 border border-rose-300">
                            ฐานตรา สจล. ({std.logoH} cm)
                          </span>
                        )}
                      </div>

                      {/* H3: Header Baseline (ที่ อว. & สถาบันฯ) */}
                      <div
                        className="guide-line-h border-t border-dashed border-[#059669] opacity-60"
                        style={{ top: `${std.mT + std.logoH + (std.headerTopOffset ?? 12) * 0.0352778 + 0.38}cm` }}
                      >
                        {showGuideLabels && (
                          <span className="guide-badge absolute -top-3.5 left-[3.2cm] bg-emerald-50 text-emerald-700 border border-emerald-300">
                            ระนาบ ที่ อว. & สถาบันฯ (เสมอกัน 100%)
                          </span>
                        )}
                      </div>

                      {/* H4: Date Line */}
                      <div
                        className="guide-line-h border-t border-dashed border-[#C026D3] opacity-55"
                        style={{ top: `${std.mT + std.logoH + (std.headerTopOffset ?? 12) * 0.0352778 + (std.dateTopOffset ?? 12) * 0.0352778 + 1.25}cm` }}
                      >
                        {showGuideLabels && (
                          <span className="guide-badge absolute -top-3.5 right-[2.2cm] bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-300">
                            ระนาบ วันที่
                          </span>
                        )}
                      </div>

                      {/* H5: Subject Line */}
                      <div
                        className="guide-line-h border-t border-dashed border-[#0284C7] opacity-55"
                        style={{ top: `${std.mT + std.logoH + (std.headerTopOffset ?? 12) * 0.0352778 + (std.dateTopOffset ?? 12) * 0.0352778 + (std.subjectTopOffset ?? 12) * 0.0352778 + 2.05}cm` }}
                      >
                        {showGuideLabels && (
                          <span className="guide-badge absolute -top-3.5 left-[3.2cm] bg-sky-50 text-sky-700 border border-sky-300">
                            ระนาบ เรื่อง
                          </span>
                        )}
                      </div>

                      {/* H6: Bottom Margin 27.9 cm */}
                      <div
                        className="guide-line-h border-t-2 border-[#2563EB] opacity-70"
                        style={{ top: `${29.7 - std.mB}cm` }}
                      >
                        {showGuideLabels && (
                          <span className="guide-badge absolute -top-4 left-[3.2cm] bg-blue-50 text-blue-700 border border-blue-300">
                            ขอบล่าง ({std.mB} cm)
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 1. KMITL Emblem Logo (Aligned at 7.5cm on Word Ruler = Exactly on the Red Center Axis 10.5cm) */}
              <div
                className="relative z-0"
                style={{
                  marginTop: `${std.logoTopOffset ?? 0}pt`,
                  marginLeft: `${std.logoXOffset ?? 7.5}cm`,
                  transform: 'translateX(-50%)',
                  width: 'max-content',
                  textAlign: 'center'
                }}
              >
                <div
                  onClick={() => onUploadLogo && logoInputRef.current?.click()}
                  className={`inline-block relative group ${
                    onUploadLogo ? 'cursor-pointer' : ''
                  }`}
                  title={onUploadLogo ? 'คลิกเพื่อเปลี่ยนรูปตราสัญลักษณ์ สจล. (289px × 289px)' : undefined}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="ตราสัญลักษณ์ สจล."
                      className="inline-block object-contain group-hover:opacity-85 transition-opacity"
                      style={{
                        width: `${std.logoPx ?? 289}px`,
                        height: `${std.logoPx ?? 289}px`,
                        maxWidth: '100%',
                        maxHeight: `${std.logoH}cm`,
                        display: 'block',
                        margin: '0 auto'
                      }}
                    />
                  ) : (
                    <div
                      className="border border-dashed border-[#C4AED4] rounded-lg mx-auto flex items-center justify-center text-xs text-[#B49CC6] bg-[#FAF8FC] group-hover:bg-[#F2EBF8] transition-colors"
                      style={{
                        width: `${std.logoPx ?? 289}px`,
                        height: `${std.logoPx ?? 289}px`,
                        maxWidth: '100%',
                        maxHeight: `${std.logoH}cm`
                      }}
                    >
                      + คลิกใส่โลโก้ สจล. (289px × 289px)
                    </div>
                  )}
                  {onUploadLogo && (
                    <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#241033] text-white text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm pointer-events-none z-20">
                      คลิกเปลี่ยนโลโก้
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Letter Number & Institution Address Block (Exact Same Baseline 100%) */}
              <div
                className="relative z-10 flex items-start"
                style={{
                  marginTop: `${std.headerTopOffset ?? 12}pt`,
                  marginBottom: '0pt',
                  lineHeight: std.lh
                }}
              >
                {/* Left Column: ที่ อว... */}
                <div
                  className="shrink-0 whitespace-nowrap"
                  style={{
                    width: `${std.rAddr}cm`,
                    lineHeight: std.lh
                  }}
                >
                  ที่ {data.letter_no}
                </div>

                {/* Right Column: Address Block starting at std.rAddr with Right Indent */}
                <div
                  className="address-block address-institution flex-1"
                  style={{
                    marginRight: `${std.rAddrRight ?? -2.08}cm`,
                    lineHeight: std.lh
                  }}
                >
                  <div>{OFFICIAL_INFO.addr1}</div>
                  <div>{OFFICIAL_INFO.addr2}</div>
                </div>
              </div>

              {/* 3. Date Line (Start at std.rDate cm, 6 leading spaces for handwriting) */}
              <div
                className="date-line"
                style={{
                  marginLeft: `${std.rDate ?? 8.2}cm`,
                  marginTop: `${std.dateTopOffset ?? 12}pt`,
                  marginBottom: '0pt',
                  whiteSpace: 'pre-wrap',
                  lineHeight: std.lh
                }}
              >
                {formatIssueDate(data.issue_date)}
              </div>

              {/* 4. Subject and Recipient */}
              <div
                className="flex"
                style={{
                  marginTop: `${std.subjectTopOffset ?? 12}pt`,
                  marginBottom: '0pt'
                }}
              >
                <div className="shrink-0" style={{ width: `${std.rTab}cm` }}>
                  เรื่อง
                </div>
                <div className="flex-1">
                  ขอเรียนเชิญเป็นอาจารย์พิเศษ รายวิชา {data.course}
                </div>
              </div>

              <div
                className="flex"
                style={{
                  marginTop: '4pt',
                  marginBottom: '0pt'
                }}
              >
                <div className="shrink-0" style={{ width: `${std.rTab}cm` }}>
                  เรียน
                </div>
                <div className="flex-1 font-normal">{data.lecturer}</div>
              </div>

              {/* 5. Body Paragraphs (Rendered with Word Thai Distributed & Line Breaking & Per-Paragraph Spacing) */}
              <p className="body-paragraph" style={p1Style}>
                ด้วยคณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง
                ได้ดำเนินการจัดการเรียนการสอนในรายวิชา {data.course}{' '}
                <strong className="font-bold">{OFFICIAL_INFO.boldProgram}</strong>{' '}
                ปีการศึกษา {data.acadYear} ให้กับนักศึกษาระดับปริญญาตรี {data.stdYear}{' '}
                คณะทันตแพทยศาสตร์ นั้น
              </p>

              <p className="body-paragraph" style={p2Style}>
                ในการนี้ คณะทันตแพทยศาสตร์ ขอเรียนเชิญท่านเป็นอาจารย์พิเศษในรายวิชา {data.course}{' '}
                ซึ่งท่านเป็นผู้มีความรู้ ความสามารถ และมีประสบการณ์สูง โดยรายละเอียดปรากฏ
                ดังเอกสารที่แนบมาพร้อมนี้
              </p>

              <p className="body-paragraph" style={p3Style}>
                ทั้งนี้ คณะทันตแพทยศาสตร์ ขอมอบหมายให้ {data.coName} เป็นผู้ประสานงาน
                เบอร์โทรศัพท์ {data.coPhone} E-mail address:{' '}
                <a href={`mailto:${data.coMail}`} className="text-blue-700 underline">
                  {data.coMail}
                </a>
              </p>

              <p className="body-paragraph" style={p4Style}>
                คณะทันตแพทยศาสตร์ หวังว่าจะได้รับความอนุเคราะห์จากท่าน และขอขอบพระคุณ มา ณ
                โอกาสนี้
              </p>

              {/* 6. Sign-off Block (ขอแสดงความนับถือ + ชื่อคณบดี) */}
              <div
                className="signoff-block text-center"
                style={{
                  marginTop: `${std.signatureTopOffset ?? 18}pt`,
                  textAlign: 'center',
                  margin: '0 auto',
                  width: '100%'
                }}
              >
                <div>ขอแสดงความนับถือ</div>
                <div style={{ height: `${std.signGapHeight ?? 1.6}cm` }} />
                <div>{OFFICIAL_INFO.dean}</div>
                <div>{OFFICIAL_INFO.deanPos}</div>
              </div>

              {/* 7. Footer Left (0 cm left margin, split strictly into 2 lines) */}
              <div
                className="a4-footer document-footer footer-text"
                style={{
                  fontFamily: "'Sarabun', 'TH Sarabun PSK', sans-serif",
                  fontSize: '21.33px',
                  lineHeight: 1.15,
                  marginTop: `${std.footerBottomOffset ?? 24}pt`,
                  marginBottom: '0pt',
                  textAlign: 'left'
                }}
              >
                <div>{footerLines[0] || 'คณะทันตแพทยศาสตร์ ส่วนสนับสนุนวิชาการ'}</div>
                {footerLines[1] && <div>{footerLines[1]}</div>}
              </div>
            </div>
          </div>

          {/* ================= PAGE 2 WRAPPER (With Left Vertical Ruler) ================= */}
          <div className="flex items-start justify-center relative">
            {/* Left Vertical Ruler for Page 2 */}
            {showAxis && (
              <div
                className="w-[28px] bg-white border border-[#C4B1D4] mr-0 shrink-0 relative text-[8px] text-[#7A6A88] select-none no-print overflow-visible shadow-2xs origin-top-right scale-[0.8]"
                style={{ height: '1123px' }}
              >
                <div
                  className="absolute left-0 right-0 top-0 bg-[#EBE3F3] border-b-2 border-[#8E6F9F]"
                  style={{ height: `${(std.mT / 29.7) * 100}%` }}
                >
                  <span className="absolute right-1 bottom-0.5 text-[7.5px] font-bold text-[#6B00AD]">0 cm</span>
                </div>
                <div
                  className="absolute left-0 right-0 bottom-0 bg-[#EBE3F3] border-t-2 border-[#8E6F9F]"
                  style={{ height: `${(std.mB / 29.7) * 100}%` }}
                >
                  <span className="absolute right-1 top-0.5 text-[7.5px] font-bold text-[#6B00AD]">ล่าง</span>
                </div>
                {Array.from({ length: Math.floor(contentH) + 1 }).map((_, i) => {
                  const yCm = std.mT + i;
                  const pct = (yCm / 29.7) * 100;
                  return (
                    <React.Fragment key={i}>
                      <div
                        className="absolute left-0 right-0 border-t border-[#C4B1D4]"
                        style={{ top: `${pct}%` }}
                      />
                      <span
                        className="absolute right-1 font-bold text-[7.5px] text-[#5C4A6E] transform -translate-y-1/2"
                        style={{ top: `${pct}%` }}
                      >
                        {i}
                      </span>
                      {i < contentH && (
                        <div
                          className="absolute left-3 right-0 border-t border-[#D9CBE4]"
                          style={{ top: `${((yCm + 0.5) / 29.7) * 100}%` }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* A4 Page 2 */}
            <div id="a4-page-2" className="a4-document-page a4-page relative shadow-md">
              {/* Page 2 Word Ruler Guidelines Overlay */}
              {showAxis && guideMode !== 'none' && (
                <div className="absolute inset-0 pointer-events-none z-10 no-print overflow-hidden select-none">
                  {/* Left & Right margins */}
                  {(guideMode === 'all' || guideMode === 'vertical') && (
                    <>
                      <div className="guide-line-v border-l-2 border-[#2563EB] opacity-75" style={{ left: `${std.mL}cm` }}>
                        {showGuideLabels && (
                          <span className="guide-badge absolute top-1 left-1 bg-blue-50 text-blue-700 border border-blue-300">
                            0.0 cm (ซ้าย)
                          </span>
                        )}
                      </div>
                      <div className="guide-line-v border-l-2 border-[#2563EB] opacity-75" style={{ left: `${21.0 - std.mR}cm` }}>
                        {showGuideLabels && (
                          <span className="guide-badge absolute top-1 right-1 bg-blue-50 text-blue-700 border border-blue-300">
                            16.0 cm (ขวา)
                          </span>
                        )}
                      </div>
                    </>
                  )}
                  {/* Center axis */}
                  {(guideMode === 'all' || guideMode === 'vertical' || guideMode === 'center') && (
                    <div className="guide-line-v border-l-2 border-dashed border-[#E11D48] opacity-80" style={{ left: '50%' }}>
                      {showGuideLabels && (
                        <span className="guide-badge absolute top-1 -left-12 bg-rose-50 text-rose-700 border border-rose-300 font-extrabold">
                          7.5 cm (กลาง 10.5)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div
                className="font-bold text-center mb-[0.25cm]"
                style={{
                  marginLeft: `${10.5 - std.mL}cm`,
                  transform: 'translateX(-50%)',
                  width: 'max-content'
                }}
              >
                ปีการศึกษา {data.acadYear}
              </div>
              <div>หลักสูตรทันตแพทยศาสตรบัณฑิต (หลักสูตรนานาชาติ)</div>
              <div>ชื่อวิชา: {data.course}</div>
              <div className="mb-[0.25cm]">อาจารย์ผู้สอน: {data.lecturer}</div>

              {/* Schedule Table */}
              <table className="sched-doc">
                <thead>
                  {data.tableMode === '4' ? (
                    <tr>
                      <th style={{ width: '20%' }}>วัน/เดือน/ปี</th>
                      <th style={{ width: '16%' }}>เวลา</th>
                      <th>หัวข้อการสอน</th>
                      <th style={{ width: '13%' }}>จำนวนชั่วโมง</th>
                    </tr>
                  ) : (
                    <tr>
                      <th style={{ width: '26%' }}>วัน/ เวลา</th>
                      <th>หัวข้อการสอน</th>
                      <th style={{ width: '13%' }}>จำนวนชั่วโมง</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={data.tableMode === '4' ? 4 : 3} className="text-center py-6 text-neutral-400">
                        (ยังไม่มีรายการคาบสอน — กรุณาเพิ่มข้อมูลในแบบฟอร์มด้านซ้าย)
                      </td>
                    </tr>
                  ) : (
                    data.items.map((row, idx) => (
                      <tr key={row.id || idx}>
                        {data.tableMode === '4' ? (
                          <>
                            <td className="text-center">{row.date}</td>
                            <td className="text-center">{row.time}</td>
                            <td>{row.topic}</td>
                            <td className="text-center">{row.hours}</td>
                          </>
                        ) : (
                          <>
                            <td className="text-center">
                              {row.date}
                              {row.time && (
                                <>
                                  <br />
                                  {row.time}
                                </>
                              )}
                            </td>
                            <td>{row.topic}</td>
                            <td className="text-center">{row.hours}</td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
