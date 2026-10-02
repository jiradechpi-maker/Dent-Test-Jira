/**
 * Renders the invitation template with the sample data → out/sample-invitation.docx.
 * Handy for checking the template in Word/LibreOffice after editing it.
 *   npx tsx scripts/render-invitation-sample.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildInvitationTemplateData } from "../src/lib/invitation/template-data";
import { SAMPLE_INVITATION } from "../src/lib/invitation/sample";
import { invitationSchema } from "../src/lib/invitation/schema";
import { renderDocx } from "../src/server/render-docx";

const root = join(__dirname, "..");
const input = invitationSchema.parse(SAMPLE_INVITATION);
const out = renderDocx(readFileSync(join(root, "templates", "invitation-letter.docx")), buildInvitationTemplateData(input));
mkdirSync(join(root, "out"), { recursive: true });
writeFileSync(join(root, "out", "sample-invitation.docx"), out);
console.log("✔ out/sample-invitation.docx");
