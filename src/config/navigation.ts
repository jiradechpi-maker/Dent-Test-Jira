import {
  Archive,
  BookOpen,
  CalendarDays,
  CalendarSearch,
  ClipboardList,
  Database,
  FileStack,
  FileText,
  LayoutDashboard,
  Mail,
  Settings,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";
import { bi, type Bi } from "@/lib/i18n/locale";

export type ModuleStatus = "ready" | "planned";

export interface NavItem {
  id: string;
  label: Bi;
  href: string;
  icon: LucideIcon;
  description: Bi;
  status: ModuleStatus;
  /** Delivery phase for planned modules. */
  phase?: number;
  /** Extra search terms for the command palette (Thai + English). */
  keywords?: string[];
  /** Planned capabilities, shown on the module's empty state. */
  features?: Bi[];
}

export interface NavGroup {
  label: Bi;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: bi("ภาพรวม", "Overview"),
    items: [
      {
        id: "dashboard",
        label: bi("แดชบอร์ด", "Dashboard"),
        href: "/",
        icon: LayoutDashboard,
        description: bi("ภาพรวมงานวิชาการวันนี้", "Today's academic work at a glance"),
        status: "ready",
        keywords: ["dashboard", "home", "หน้าแรก"],
      },
    ],
  },
  {
    label: bi("ตารางเรียน-สอบ", "Teaching & exams"),
    items: [
      {
        id: "schedule",
        label: bi("ตารางสอนชั้นปี 4", "Year 4 timetable"),
        href: "/schedule",
        icon: CalendarDays,
        description: bi("ซิงก์จาก Google Drive อัตโนมัติ · ดูรายสัปดาห์ ค้นหาอาจารย์ และแจ้งเมื่อตารางเปลี่ยน", "Synced from Google Drive · weekly view, lecturer search and change alerts"),
        status: "ready",
        keywords: ["schedule", "timetable", "ตารางเรียน", "ตารางสอน", "ปี 4", "google sheets"],
      },
      {
        id: "courses",
        label: bi("รายวิชาในหลักสูตร", "Curriculum"),
        href: "/courses",
        icon: BookOpen,
        description: bi("รายวิชาแยกตามชั้นปีและภาคเรียน พร้อมสีประจำชั้นปีและสีประจำวัน", "Courses by year and semester, with cohort and weekday colours"),
        status: "ready",
        keywords: ["course", "curriculum", "subject", "รายวิชา", "หลักสูตร", "รหัสวิชา", "สีชั้นปี"],
      },
      {
        id: "exams",
        label: bi("ตารางสอบ", "Exam schedule"),
        href: "/exams",
        icon: ClipboardList,
        description: bi("ตารางคุมสอบรายเดือน · ตรวจห้องชน กรรมการซ้อนเวลา และวันสอบที่ไม่ตรงกับตารางสอน", "Monthly invigilation schedule · room clashes, double-booked invigilators and exams that disagree with the timetable"),
        status: "ready",
        keywords: ["exam", "สอบ", "คุมสอบ", "ห้องชน"],
      },
      {
        id: "invigilators",
        label: bi("ชั่วโมงคุมสอบ", "Invigilation hours"),
        href: "/invigilators",
        icon: Users,
        description: bi("ชั่วโมงคุมสอบสะสมรายบุคคล เรียงจากน้อยไปมากเพื่อจัดงานให้เท่ากัน", "Hours per invigilator, fewest first, to share work fairly"),
        status: "ready",
        keywords: ["invigilator", "proctor", "คุมสอบ", "ชั่วโมง"],
      },
      {
        id: "exam-papers",
        label: bi("คลังข้อสอบ", "Exam papers"),
        href: "/exam-papers",
        icon: Archive,
        description: bi("ติดตามข้อสอบ 9 สถานะ นับถอยหลัง T-7 และบันทึกเข้า-ออกตู้เซฟ", "Track papers through 9 stages, T-7 countdown and safe check-in/out"),
        status: "planned",
        phase: 4,
        keywords: ["exam paper", "kanban", "ข้อสอบ", "เซฟ"],
        features: [bi("Kanban 9 สถานะ ตั้งแต่ทวงข้อสอบจนคืนเซฟ", "9-stage Kanban from requesting papers to returning them to the safe"), bi("แจ้งเตือน T-7 ทาง LINE ทุกวัน 08:00 น.", "Daily T-7 reminders on LINE at 08:00"), bi("สร้างใบปะหน้าข้อสอบและป้ายซองอัตโนมัติ", "Automatic cover sheets and envelope labels")],
      },
    ],
  },
  {
    label: bi("เอกสาร", "Documents"),
    items: [
      {
        id: "invitations",
        label: bi("หนังสือเชิญอาจารย์พิเศษ", "Guest lecturer invitations"),
        href: "/documents/invitations",
        icon: Mail,
        description: bi("ออกหนังสือเชิญ (.docx / .pdf) ตามแบบฟอร์มคณะ พร้อมพรีวิว PDF", "Issue invitation letters (.docx / .pdf) on the faculty template, with PDF preview"),
        status: "ready",
        keywords: ["invitation", "letter", "หนังสือเชิญ", "อาจารย์พิเศษ", "docx", "pdf"],
      },
      {
        id: "documents",
        label: bi("คลังเอกสาร", "Document archive"),
        href: "/documents",
        icon: FileText,
        description: bi("ประวัติเอกสาร ฉบับแก้ไข และใบลงเวลาสอน", "Document history, revisions and teaching time sheets"),
        status: "planned",
        phase: 5,
        keywords: ["documents", "revision", "timesheet"],
        features: [bi("เก็บทุกฉบับพร้อมเลขหนังสือรันอัตโนมัติ", "Every version kept, with automatic document numbers"), bi("ตรวจจับตารางเปลี่ยน → ออกฉบับแก้ไขได้ในคลิกเดียว", "Timetable change detected → issue a revised letter in one click"), bi("ใบลงเวลาสอนสำหรับเบิกจ่าย", "Teaching time sheets for payment claims")],
      },
      {
        id: "templates",
        label: bi("แม่แบบเอกสาร", "Templates"),
        href: "/templates",
        icon: FileStack,
        description: bi("จัดการแม่แบบ .docx พร้อมเวอร์ชัน", "Manage versioned .docx templates"),
        status: "ready",
        keywords: ["template", "แม่แบบ", "docx"],
      },
    ],
  },
  {
    label: bi("เครื่องมือ", "Tools"),
    items: [
      {
        id: "exam-timer",
        label: bi("นาฬิกาจับเวลาสอบ", "Exam timer"),
        href: "/exam-timer",
        icon: Timer,
        description: bi("นับถอยหลังเต็มจอบนโปรเจกเตอร์ พร้อมข้อปฏิบัติก่อนสอบและเตือนเมื่อเหลือ 5 นาที", "Full-screen projector countdown with the exam rules and a 5-minute warning"),
        status: "ready",
        keywords: ["timer", "countdown", "clock", "exam rules", "notice", "จับเวลา", "นาฬิกา", "สอบ", "ข้อปฏิบัติ", "ประกาศ", "กติกา"],
      },
      {
        id: "slot-finder",
        label: bi("หาวันว่าง", "Slot finder"),
        href: "/slot-finder",
        icon: CalendarSearch,
        description: bi("ค้นหาช่วงว่างข้ามชั้นปี ห้องว่าง และเลื่อนคาบแบบ Cascade", "Find free slots across all years, free rooms and cascade rescheduling"),
        status: "planned",
        phase: 6,
        keywords: ["slot", "free", "ว่าง", "เลื่อน"],
        features: [bi("ตรวจชนทั้ง 6 ชั้นปี + ห้องว่าง + ปฏิทินอาจารย์", "Clash check across 6 years + free rooms + lecturer calendars"), bi("Cascade shift พร้อมตารางเปรียบเทียบก่อน-หลัง", "Cascade shift with a before/after comparison")],
      },
    ],
  },
  {
    label: bi("ระบบ", "System"),
    items: [
      {
        id: "master-data",
        label: bi("ข้อมูลหลัก", "Master data"),
        href: "/master-data",
        icon: Database,
        description: bi("บุคลากรคุมสอบ ห้องสอบ และรายวิชา", "Invigilators, exam rooms and courses"),
        status: "ready",
        keywords: ["master", "staff", "rooms", "courses", "ห้อง", "รายวิชา"],
      },
      {
        id: "settings",
        label: bi("ตั้งค่า", "Settings"),
        href: "/settings",
        icon: Settings,
        description: bi("สถานะระบบ บริการแปลง PDF และสิทธิ์ผู้ใช้", "System status, PDF service and user roles"),
        status: "ready",
        keywords: ["settings", "config", "ตั้งค่า"],
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export function findNavItem(pathname: string): NavItem | undefined {
  // Longest matching prefix wins ("/documents/invitations" beats "/documents").
  return [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => (item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`)));
}

export function getNavItem(id: string): NavItem {
  const item = NAV_ITEMS.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Unknown nav item: ${id}`);
  return item;
}
