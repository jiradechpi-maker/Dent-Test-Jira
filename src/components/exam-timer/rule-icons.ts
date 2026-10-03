import { Ban, Clock3, IdCard, ShieldAlert, Shirt, Smartphone, type LucideIcon } from "lucide-react";
import type { StudentRuleId } from "@/lib/exam-timer/student-rules";

/** One icon per rule, shared by the projector cards and the printed notice. */
export const RULE_ICONS: Record<StudentRuleId, LucideIcon> = {
  time: Clock3,
  "id-card": IdCard,
  phone: Smartphone,
  items: Ban,
  dress: Shirt,
  misconduct: ShieldAlert,
};
