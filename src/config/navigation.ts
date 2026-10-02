import {
  Archive,
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

export type ModuleStatus = "ready" | "planned";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  status: ModuleStatus;
  /** Delivery phase for planned modules. */
  phase?: number;
  /** Extra search terms for the command palette (Thai + English). */
  keywords?: string[];
  /** Planned capabilities, shown on the module's empty state. */
  features?: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "ภาพรวม",
    items: [
      {
        id: "dashboard",
        label: "แดชบอร์ด",
        href: "/",
        icon: LayoutDashboard,
        description: "ภาพรวมงานวิชาการวันนี้",
        status: "ready",
        keywords: ["dashboard", "home", "หน้าแรก"],
      },
    ],
  },
  {
    label: "ตารางเรียน-สอบ",
    items: [
      {
        id: "schedule",
        label: "ตารางสอนหลัก",
        href: "/schedule",
        icon: CalendarDays,
        description: "ตารางเรียนชั้นปี 1-6 แหล่งข้อมูลเดียว (Single Source of Truth)",
        status: "planned",
        phase: 1,
        keywords: ["schedule", "timetable", "ตารางเรียน"],
        features: [
          "ตารางสอนชั้นปี 1–6 ในมุมมองตาราง / ปฏิทิน / ไทม์ไลน์",
          "เพิ่ม แก้ไข สลับคาบ เลื่อนคาบฉุกเฉิน พร้อม Audit log",
          "นำเข้า / ส่งออก Excel",
          "ซิงก์กับ Google Sheets แบบเรียลไทม์ (Phase 7)",
        ],
      },
      {
        id: "exams",
        label: "ตารางสอบ",
        href: "/exams",
        icon: ClipboardList,
        description: "สร้างตารางสอบรายเดือนพร้อมสีประจำวัน และจัดห้องสอบอัตโนมัติ",
        status: "planned",
        phase: 3,
        keywords: ["exam", "สอบ"],
        features: [
          "ดึงวันสอบจากตารางสอนหลักอัตโนมัติ",
          "ตารางสอบรายเดือนใช้สีประจำวันแบบไทย",
          "จัดห้องตามกฎ: ตึก 55 (ปี 1-2) และตึกคลินิก (ปี 3-5)",
        ],
      },
      {
        id: "invigilators",
        label: "กรรมการคุมสอบ",
        href: "/invigilators",
        icon: Users,
        description: "จัดกรรมการคุมสอบอย่างเป็นธรรมตามชั่วโมงสะสม",
        status: "planned",
        phase: 3,
        keywords: ["invigilator", "proctor", "คุมสอบ"],
        features: [
          "อัลกอริทึมกระจายชั่วโมงคุมสอบให้เท่ากัน (19 คน)",
          "สิทธิ์ประจำตึก 55 สำหรับ Aom, Pao, Time",
          "กราฟชั่วโมงสะสมรายบุคคล",
        ],
      },
      {
        id: "exam-papers",
        label: "คลังข้อสอบ",
        href: "/exam-papers",
        icon: Archive,
        description: "ติดตามข้อสอบ 9 สถานะ นับถอยหลัง T-7 และบันทึกเข้า-ออกตู้เซฟ",
        status: "planned",
        phase: 4,
        keywords: ["exam paper", "kanban", "ข้อสอบ", "เซฟ"],
        features: [
          "Kanban 9 สถานะ ตั้งแต่ทวงข้อสอบจนคืนเซฟ",
          "แจ้งเตือน T-7 ทาง LINE ทุกวัน 08:00 น.",
          "สร้างใบปะหน้าข้อสอบและป้ายซองอัตโนมัติ",
        ],
      },
    ],
  },
  {
    label: "เอกสาร",
    items: [
      {
        id: "invitations",
        label: "หนังสือเชิญอาจารย์พิเศษ",
        href: "/documents/invitations",
        icon: Mail,
        description: "ออกหนังสือเชิญ (.docx / .pdf) ตามแบบฟอร์มคณะ พร้อมพรีวิว PDF",
        status: "ready",
        keywords: ["invitation", "letter", "หนังสือเชิญ", "อาจารย์พิเศษ", "docx", "pdf"],
      },
      {
        id: "documents",
        label: "คลังเอกสาร",
        href: "/documents",
        icon: FileText,
        description: "ประวัติเอกสาร ฉบับแก้ไข และใบลงเวลาสอน",
        status: "planned",
        phase: 5,
        keywords: ["documents", "revision", "timesheet"],
        features: [
          "เก็บทุกฉบับพร้อมเลขหนังสือรันอัตโนมัติ",
          "ตรวจจับตารางเปลี่ยน → ออกฉบับแก้ไขได้ในคลิกเดียว",
          "ใบลงเวลาสอนสำหรับเบิกจ่าย",
        ],
      },
      {
        id: "templates",
        label: "แม่แบบเอกสาร",
        href: "/templates",
        icon: FileStack,
        description: "จัดการแม่แบบ .docx พร้อมเวอร์ชัน",
        status: "ready",
        keywords: ["template", "แม่แบบ", "docx"],
      },
    ],
  },
  {
    label: "เครื่องมือ",
    items: [
      {
        id: "exam-timer",
        label: "นาฬิกาจับเวลาสอบ",
        href: "/exam-timer",
        icon: Timer,
        description: "ตั้งเวลาเลิกสอบแล้วนับถอยหลังทันที แสดงเต็มจอบนโปรเจกเตอร์",
        status: "ready",
        keywords: ["timer", "countdown", "clock", "จับเวลา", "นาฬิกา", "สอบ"],
      },
      {
        id: "slot-finder",
        label: "หาวันว่าง",
        href: "/slot-finder",
        icon: CalendarSearch,
        description: "ค้นหาช่วงว่างข้ามชั้นปี ห้องว่าง และเลื่อนคาบแบบ Cascade",
        status: "planned",
        phase: 6,
        keywords: ["slot", "free", "ว่าง", "เลื่อน"],
        features: ["ตรวจชนทั้ง 6 ชั้นปี + ห้องว่าง + ปฏิทินอาจารย์", "Cascade shift พร้อมตารางเปรียบเทียบก่อน-หลัง"],
      },
    ],
  },
  {
    label: "ระบบ",
    items: [
      {
        id: "master-data",
        label: "ข้อมูลหลัก",
        href: "/master-data",
        icon: Database,
        description: "บุคลากรคุมสอบ ห้องสอบ และรายวิชา",
        status: "ready",
        keywords: ["master", "staff", "rooms", "courses", "ห้อง", "รายวิชา"],
      },
      {
        id: "settings",
        label: "ตั้งค่า",
        href: "/settings",
        icon: Settings,
        description: "สถานะระบบ บริการแปลง PDF และสิทธิ์ผู้ใช้",
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
