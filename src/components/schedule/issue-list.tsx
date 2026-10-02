import { CircleAlert, Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { ScheduleIssue } from "@/lib/schedule/checks";
import { shortDay } from "@/lib/schedule/format";
import { cn } from "@/lib/utils";

const ICON = { danger: TriangleAlert, warning: CircleAlert, info: Info } as const;
const TONE = { danger: "text-danger", warning: "text-warning", info: "text-info" } as const;

export function IssueList({ issues, empty }: { issues: ScheduleIssue[]; empty?: string }) {
  if (issues.length === 0) {
    return <p className="rounded-[var(--radius-control)] bg-success-bg px-3 py-2 text-[13px] text-success">{empty ?? "ไม่พบปัญหา"}</p>;
  }
  return (
    <ul className="divide-y divide-border rounded-[var(--radius-control)] border border-border">
      {issues.map((issue) => {
        const Icon = ICON[issue.severity];
        return (
          <li key={issue.id} className="flex gap-2.5 px-3 py-2 text-[13px]">
            <Icon className={cn("mt-0.5 size-4 shrink-0", TONE[issue.severity])} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-neutral-900">
                {issue.title}
                {issue.date ? <span className="ml-2 text-xs font-normal text-muted-foreground tabular">{shortDay(issue.date)}</span> : null}
              </p>
              <p className="mt-0.5 text-xs break-words text-muted-foreground">{issue.detail}</p>
              {issue.suggestion ? (
                <p className="mt-1 flex items-start gap-1.5 rounded-md bg-brand-50 px-2 py-1 text-xs text-brand-800">
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>{issue.suggestion}</span>
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
