import type { Metadata } from "next";
import { Download, FileStack, Info } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DOCUMENT_TEMPLATES } from "@/config/templates";

export const metadata: Metadata = { title: "แม่แบบเอกสาร" };

export default function TemplatesPage() {
  return (
    <PageContainer>
      <PageHeader icon={FileStack} title="แม่แบบเอกสาร" description="แม่แบบ .docx ที่ระบบใช้สร้างเอกสาร — ตัวแปรใช้ {tag} ลูปใช้ {#items}…{/items}" className="mb-5" />

      <div className="flex flex-col gap-4">
        {DOCUMENT_TEMPLATES.map((template) => (
          <Card key={template.file}>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {template.name} <Badge tone="brand">{template.version}</Badge>
                </CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </div>
              <a href={`/api/templates/${template.file}`} className={buttonVariants({ variant: "secondary" })} download>
                <Download aria-hidden /> ดาวน์โหลดแม่แบบ
              </a>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-[var(--radius-control)] border border-border scrollbar-thin">
                <table className="w-full min-w-[520px] text-left text-[13px]">
                  <thead className="sticky top-0 bg-neutral-50 text-xs text-neutral-500">
                    <tr className="h-[var(--spacing-row)]">
                      <th scope="col" className="px-3 font-medium">ตัวแปร</th>
                      <th scope="col" className="px-3 font-medium">ความหมาย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {template.variables.map((v) => (
                      <tr key={v.tag} className="h-[var(--spacing-row)] border-t border-border hover:bg-row-hover">
                        <td className="px-3 font-mono text-xs text-brand-800">{v.tag}</td>
                        <td className="px-3 text-neutral-700">{v.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                แม่แบบนี้สร้างจากสคริปต์ <code className="font-mono">npm run template:invitation</code> ใช้ถ้อยคำตามหนังสือต้นฉบับของคณะทุกตัวอักษร
                — การอัปโหลดแม่แบบใหม่พร้อมเก็บเวอร์ชันบน Supabase Storage จะเปิดใช้เมื่อเชื่อมฐานข้อมูล (Phase 1)
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
