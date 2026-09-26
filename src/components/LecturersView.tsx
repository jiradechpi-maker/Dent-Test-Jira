import React, { useState } from 'react';
import { Lecturer } from '../types';
import { Users, UserPlus, Search, Trash2, Edit2, Check, ArrowRight, Building2, CreditCard } from 'lucide-react';

interface LecturersViewProps {
  lecturers: Lecturer[];
  onAddLecturer: (lec: Omit<Lecturer, 'id'>) => void;
  onUpdateLecturer: (id: string, lec: Partial<Lecturer>) => void;
  onDeleteLecturer: (id: string) => void;
  onSelectLecturer: (lec: Lecturer) => void;
}

export const LecturersView: React.FC<LecturersViewProps> = ({
  lecturers,
  onAddLecturer,
  onUpdateLecturer,
  onDeleteLecturer,
  onSelectLecturer
}) => {
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('ธนาคารกรุงไทย');
  const [bankAccount, setBankAccount] = useState('');
  const [idCard, setIdCard] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      onUpdateLecturer(editingId, {
        n: name.trim(),
        note: note.trim(),
        phone: phone.trim(),
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        idCard: idCard.trim()
      });
      setEditingId(null);
    } else {
      onAddLecturer({
        n: name.trim(),
        note: note.trim(),
        phone: phone.trim(),
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        idCard: idCard.trim()
      });
    }

    setName('');
    setNote('');
    setPhone('');
    setBankAccount('');
    setIdCard('');
  };

  const handleEdit = (lec: Lecturer) => {
    setEditingId(lec.id);
    setName(lec.n);
    setNote(lec.note || '');
    setPhone(lec.phone || '');
    setBankName(lec.bankName || 'ธนาคารกรุงไทย');
    setBankAccount(lec.bankAccount || '');
    setIdCard(lec.idCard || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setNote('');
    setPhone('');
    setBankAccount('');
    setIdCard('');
  };

  const filtered = lecturers.filter((l) =>
    l.n.toLowerCase().includes(search.toLowerCase()) ||
    (l.note && l.note.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 items-start">
      {/* Add / Edit Form */}
      <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2">
          <h3 className="text-xs font-bold text-[#4F0080] flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" />
            <span>{editingId ? 'แก้ไขข้อมูลอาจารย์' : 'เพิ่มอาจารย์พิเศษใหม่'}</span>
          </h3>
          {editingId && (
            <button
              onClick={handleCancelEdit}
              className="text-[11px] text-[#7A6A88] hover:underline"
            >
              ยกเลิก
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
              คำนำหน้า + ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ผู้ช่วยศาสตราจารย์ ดร.ทพญ.สมศรี ใจดี"
              className="w-full px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs font-medium focus:bg-white focus:outline-none focus:border-[#6B00AD]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
              สังกัด / ภาควิชา
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ภาควิชาทันตกรรมประดิษฐ์"
              className="w-full px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
              เบอร์โทรศัพท์
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081-234-5678"
              className="w-full px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
              เลขประจำตัวประชาชน (สำหรับเบิกจ่าย)
            </label>
            <input
              type="text"
              value={idCard}
              onChange={(e) => setIdCard(e.target.value)}
              placeholder="1-1002-00123-45-6"
              className="w-full px-3 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                ธนาคาร
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="ธนาคารกรุงไทย"
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#5C4A6E] mb-1">
                เลขบัญชีธนาคาร
              </label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="085-0-12345-6"
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] text-xs focus:bg-white focus:outline-none focus:border-[#6B00AD]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#4F0080] hover:bg-[#3D0063] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            {editingId ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            <span>{editingId ? 'บันทึกการแก้ไข' : 'บันทึกเข้าทะเบียน'}</span>
          </button>
        </form>
      </div>

      {/* Lecturers List */}
      <div className="bg-white border border-[#E7DEF0] rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#F2EBF8] pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#4F0080]" />
            <h3 className="text-xs font-bold text-[#4F0080]">
              ทะเบียนอาจารย์พิเศษ ({filtered.length} ท่าน)
            </h3>
          </div>

          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-[#7A6A88] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่ออาจารย์..."
              className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] focus:bg-white focus:outline-none focus:border-[#6B00AD]"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#7A6A88]">
            <Users className="w-8 h-8 text-[#C4AED4] mx-auto mb-2 opacity-40" />
            <div>ไม่พบรายชื่ออาจารย์ตามคำค้นหา</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
            {filtered.map((lec) => (
              <div
                key={lec.id}
                className="p-3 rounded-lg border border-[#E7DEF0] bg-[#FCFAFE] hover:border-[#6B00AD]/40 hover:bg-white transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#F2EBF8] text-[#4F0080] font-bold text-xs flex items-center justify-center shrink-0">
                    {lec.n.slice(-2, -1) || 'อ'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#241033] truncate">
                      {lec.n}
                    </div>
                    <div className="text-[11px] text-[#7A6A88] flex items-center gap-2 mt-0.5 truncate">
                      {lec.note && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-[#8B2FC9]" />
                          <span>{lec.note}</span>
                        </span>
                      )}
                      {lec.bankAccount && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-[#1F8A5B]" />
                          <span>{lec.bankName} {lec.bankAccount}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onSelectLecturer(lec)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#4F0080] hover:bg-[#3E0065] text-white text-[11px] font-semibold transition-colors cursor-pointer"
                    title="นำชื่อไปใช้ในแบบฟอร์มสร้างหนังสือเชิญทันที"
                  >
                    <span>เลือกใช้</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => handleEdit(lec)}
                    className="p-1 rounded text-[#5C4A6E] hover:text-[#4F0080] hover:bg-[#F2EBF8] transition-colors"
                    title="แก้ไขข้อมูล"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteLecturer(lec.id)}
                    className="p-1 rounded text-[#B4003C] hover:bg-[#FCE9EF] transition-colors"
                    title="ลบออกจากทะเบียน"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
