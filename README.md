# DentOps — ระบบบริหารจัดการงานวิชาการและเอกสารอัตโนมัติ

คณะทันตแพทยศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง (สจล.)

## ใช้งานได้แล้ว

| เมนู | ทำอะไรได้ |
| --- | --- |
| **หนังสือเชิญอาจารย์พิเศษ** `/documents/invitations` | กรอกฟอร์มครั้งเดียว ได้หนังสือราชการ + เอกสารแนบตารางสอน เป็น `.docx` และ `.pdf` ถ้อยคำตรงตามต้นฉบับของคณะ มีพรีวิวจาก PDF จริง ระบบบันทึกฉบับร่างให้อัตโนมัติ |
| **ตารางสอนชั้นปี 4** `/schedule` | ดึงจากไฟล์ตารางสอนบน Google Drive อัตโนมัติ (อ่านอย่างเดียว) · มุมมองรายสัปดาห์แบบเดียวกับชีต + รายการ + ค้นหาอาจารย์ · แจ้ง “มีอะไรเปลี่ยนตั้งแต่ครั้งก่อน” · ข้อความที่พักไว้นอกตารางแยกให้ตรวจ |
| **ตารางสอบ** `/exams` | จากตารางบันทึกเวลาคุมสอบ (ทุกแท็บรายเดือน) · ตรวจห้องชน กรรมการซ้อนเวลา สอบที่ยังไม่มีวัน/ห้อง/กรรมการ · เทียบวันสอบปี 4 กับตารางสอน (จับได้เมื่อตารางสอนย้ายวันแต่ตารางคุมสอบยังไม่แก้) |
| **ชั่วโมงคุมสอบ** `/invigilators` | ชั่วโมงสะสมรายคนตามแท็บสรุป + งานที่จัดในแท็บรายเดือนแต่ยังไม่ลงแท็บสรุป · เรียงจากน้อยไปมาก |
| **นาฬิกาจับเวลาสอบ** `/exam-timer` | เลือกเวลาเลิกสอบแล้วนับถอยหลังทันที ตั้งเวลาเริ่มล่วงหน้าได้ (เช่น มาถึงห้อง 08:47 ตั้งเริ่ม 09:00 ระบบจะเริ่มให้เอง) เต็มจอสำหรับโปรเจกเตอร์ มีเสียงแจ้งเตือนก่อนหมดเวลา 30/15/5 นาที และเสียงกริ่งตอนหมดเวลา |
| **แม่แบบเอกสาร** `/templates` | ดาวน์โหลดแม่แบบ `.docx` และดูรายการตัวแปร |
| **ข้อมูลหลัก** `/master-data` | กรรมการคุมสอบ 19 คน กฎการจัดห้องสอบ รายวิชา สีประจำวัน |
| **⌘K / Ctrl+K** | ค้นหาเมนูและคำสั่งได้จากทุกหน้า · กด `[` เพื่อย่อ/ขยายเมนูด้านซ้าย |

โมดูลอื่น (ตารางสอนหลัก ตารางสอบ คลังข้อสอบ ฯลฯ) จะทยอยเปิดตามแผน Phase 1–8

## เชื่อม Google Drive (ตารางสอน / ตารางคุมสอบ)

แอปอ่านไฟล์อย่างเดียว ไม่เขียนกลับ — การแก้ตารางยังทำในไฟล์ต้นฉบับเหมือนเดิม ปีอื่นที่เจ้าหน้าที่คนอื่นดูแลจึงไม่ถูกแตะต้อง
ระบบถาม Drive ทุก 30 วินาที (หน้าเว็บถามทุก 2 นาที) ว่าไฟล์ถูกแก้ไหม และดาวน์โหลดใหม่เฉพาะตอนที่ `modifiedTime` เปลี่ยน

1. Google Cloud Console → สร้างโปรเจกต์ → เปิด **Google Drive API**
2. IAM & Admin → Service Accounts → Create → เข้าไปที่ Keys → Add key → JSON (ได้ไฟล์ `.json`)
3. Vercel → Settings → Environment Variables → `GOOGLE_SERVICE_ACCOUNT_JSON` = เนื้อหาไฟล์ JSON ทั้งก้อน → Redeploy
4. เปิดไฟล์บน Drive แต่ละไฟล์ → **แชร์** → ใส่อีเมล `client_email` ของ service account → สิทธิ์ **ผู้มีสิทธิ์อ่าน (Viewer)**
   (ไฟล์ที่เราไม่ได้เป็นเจ้าของ ต้องเป็นผู้แก้ไขจึงจะแชร์ต่อได้ หรือขอให้เจ้าของไฟล์แชร์ให้)

ไฟล์ที่ใช้ตั้งค่าไว้ใน `src/config/data-sources.ts` (เปลี่ยนได้ด้วย `SCHEDULE_YEAR4_FILE_ID`, `INVIGILATION_FILE_ID`)
ถ้ายังไม่ได้ตั้ง service account แต่ไฟล์เปิด “ทุกคนที่มีลิงก์” ระบบจะอ่านผ่านลิงก์สาธารณะแทน และระหว่างนี้อัปโหลดไฟล์ `.xlsx` เองในหน้าเว็บได้

ตรวจตัวอ่านกับไฟล์จริงในเครื่อง: `npx tsx scripts/inspect-sheets.mts --teaching ปี4.xlsx --invigilation คุมสอบ.xlsx`

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
src/app/api/            documents/invitation (docx/pdf) · schedule (ซิงก์ Drive) · templates · health · time
src/components/ui/      ชุดคอมโพเนนต์ (shadcn-style บน Radix)
src/components/shell/   Sidebar · Topbar · Command palette
src/lib/thai.ts         เลขไทย วันที่ พ.ศ. รูปแบบเอกสารราชการ
src/lib/invitation/     schema (Zod) · ข้อมูลที่ส่งเข้าแม่แบบ · ฉบับร่าง
src/lib/exam-timer/     ตรรกะจับเวลา (pure) · เสียงสังเคราะห์ Web Audio
src/lib/sheets/         อ่านชีตแบบตาราง (merged cells, สีพื้น) · แปลงวันที่/เวลาแบบไทย
src/lib/schedule/       ตัวอ่านตารางสอน / ตารางคุมสอบ · ตรวจห้องชนและเทียบวันสอบ · diff การเปลี่ยนแปลง
src/server/             docxtemplater + Gotenberg · Google Drive (service account) · แคชการซิงก์
templates/              แม่แบบ .docx
legacy/dent-letter-vite แอปเวอร์ชันเดิม (Vite) เก็บไว้อ้างอิง
```

Tech: Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4 · Radix · TanStack Query · React Hook Form + Zod · Zustand · docxtemplater + PizZip · Gotenberg · react-pdf · sonner · lucide-react
