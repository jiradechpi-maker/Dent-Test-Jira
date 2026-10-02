# DentOps — ระบบบริหารจัดการงานวิชาการและเอกสารอัตโนมัติ

คณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง (สจล.)

## ใช้งานได้แล้ว

| เมนู | ทำอะไรได้ |
| --- | --- |
| **หนังสือเชิญอาจารย์พิเศษ** `/documents/invitations` | กรอกฟอร์มครั้งเดียว ได้หนังสือราชการ + เอกสารแนบตารางสอน เป็น `.docx` และ `.pdf` ถ้อยคำตรงตามต้นฉบับของคณะ มีพรีวิวจาก PDF จริง ระบบบันทึกฉบับร่างให้อัตโนมัติ |
| **นาฬิกาจับเวลาสอบ** `/exam-timer` | เลือกเวลาเลิกสอบแล้วนับถอยหลังทันที ตั้งเวลาเริ่มล่วงหน้าได้ (เช่น มาถึงห้อง 08:47 ตั้งเริ่ม 09:00 ระบบจะเริ่มให้เอง) เต็มจอสำหรับโปรเจกเตอร์ มีเสียงแจ้งเตือนก่อนหมดเวลา 30/15/5 นาที และเสียงกริ่งตอนหมดเวลา |
| **แม่แบบเอกสาร** `/templates` | ดาวน์โหลดแม่แบบ `.docx` และดูรายการตัวแปร |
| **ข้อมูลหลัก** `/master-data` | กรรมการคุมสอบ 19 คน กฎการจัดห้องสอบ รายวิชา สีประจำวัน |
| **⌘K / Ctrl+K** | ค้นหาเมนูและคำสั่งได้จากทุกหน้า · กด `[` เพื่อย่อ/ขยายเมนูด้านซ้าย |

โมดูลอื่น (ตารางสอนหลัก ตารางสอบ คลังข้อสอบ ฯลฯ) จะทยอยเปิดตามแผน Phase 1–8

## วิธีใช้นาฬิกาจับเวลาสอบ

1. เลือก **เลิกสอบเวลา** จากปุ่มลัด (เช่น `10:00`, `11:00`) หรือพิมพ์เวลาเอง
2. ถ้ายังไม่ถึงเวลาเริ่ม ให้เลือก **ตั้งเวลาเริ่ม** แล้วใส่เวลาเริ่ม ระบบจะนับถอยหลังถึงเวลาเริ่ม แล้วเริ่มจับเวลาสอบให้เอง
3. กด **เริ่มจับเวลา** แล้วกด **แสดงเต็มจอ** (หรือกดปุ่ม `F`)
4. กด **ทดสอบเสียง** ก่อนเริ่มสอบทุกครั้ง เพื่อตรวจลำโพงในห้อง

ระบบเทียบเวลากับเซิร์ฟเวอร์ให้อัตโนมัติ ถ้านาฬิกาเครื่องในห้องสอบเพี้ยน ระบบจะแก้ให้ และถ้าเผลอรีเฟรชหน้า การจับเวลาก็ยังเดินต่อ

## ไฟล์หนังสือเชิญ

- แม่แบบอยู่ที่ `templates/invitation-letter.docx` สร้างจากสคริปต์ `scripts/build-invitation-template.ts` (`npm run template:invitation`)
- เลย์เอาต์: ตรา สจล. 3 ซม. · TH SarabunPSK 16pt · A4 ขอบ บน 1.5 / ล่าง 1.8 / ซ้าย 3.0 / ขวา 2.0 ซม. · หัวหนังสือใช้ตารางไร้ขอบล็อกตำแหน่ง · ระยะบรรทัดคงที่ 19pt เพื่อให้ Word และ PDF ตัดหน้าเหมือนกัน
- ตัวเลขไทยมีสวิตช์เปิด-ปิด (รหัสห้องอย่าง `DT01` จะคงเป็นเลขอารบิกตามต้นฉบับ)

## เริ่มพัฒนา (Project IDX / เครื่องตัวเอง)

ต้องใช้ Node.js 20.11 ขึ้นไป

```bash
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

### บริการแปลง PDF (Gotenberg)

พรีวิวและการดาวน์โหลด PDF ต้องใช้ Gotenberg (LibreOffice headless) ที่ติดตั้งฟอนต์ TH Sarabun แล้ว
ถ้ายังไม่ได้ตั้งค่า ดาวน์โหลด `.docx` ได้ตามปกติ

```bash
docker compose up -d gotenberg   # build จาก docker/gotenberg (มีฟอนต์ TH Sarabun New)
# .env.local → GOTENBERG_URL="http://localhost:3001"
```

ถ้าไม่มี Docker แต่มี LibreOffice และฟอนต์ TH Sarabun ในเครื่อง ใช้ตัวแทนแบบง่ายได้: `node scripts/local-pdf-server.mjs`

### Deploy บน Vercel

1. Import repo นี้บน Vercel (Framework: Next.js ไม่ต้องตั้งค่าอื่น)
2. Deploy Gotenberg แยกต่างหาก เช่น Google Cloud Run จาก `docker/gotenberg/Dockerfile` (port 3000)
3. ตั้ง Environment Variable `GOTENBERG_URL` บน Vercel ให้ชี้ไปที่ URL ของ Gotenberg
   (ถ้าเปิด basic auth ให้ใส่ `GOTENBERG_USERNAME` / `GOTENBERG_PASSWORD` ด้วย)

## คำสั่งตรวจสอบ

```bash
npm run typecheck   # TypeScript strict
npm run lint        # ESLint (ห้ามมี warning)
npm test            # Vitest — รวมการตรวจถ้อยคำในหนังสือเชิญเทียบกับต้นฉบับ
npm run build
```

## โครงสร้าง

```
src/app/(app)/          หน้าต่าง ๆ (มี AppShell: Sidebar + Topbar + ⌘K)
src/app/api/            documents/invitation (docx/pdf) · templates · health · time
src/components/ui/      ชุดคอมโพเนนต์ (shadcn-style บน Radix)
src/components/shell/   Sidebar · Topbar · Command palette
src/lib/thai.ts         เลขไทย วันที่ พ.ศ. รูปแบบเอกสารราชการ
src/lib/invitation/     schema (Zod) · ข้อมูลที่ส่งเข้าแม่แบบ · ฉบับร่าง
src/lib/exam-timer/     ตรรกะจับเวลา (pure) · เสียงสังเคราะห์ Web Audio
src/server/             docxtemplater + Gotenberg
templates/              แม่แบบ .docx
legacy/dent-letter-vite แอปเวอร์ชันเดิม (Vite) เก็บไว้อ้างอิง
```

Tech: Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4 · Radix · TanStack Query · React Hook Form + Zod · Zustand · docxtemplater + PizZip · Gotenberg · react-pdf · sonner · lucide-react
