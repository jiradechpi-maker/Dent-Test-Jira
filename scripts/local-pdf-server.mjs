// Tiny stand-in for Gotenberg, for machines that have LibreOffice but no Docker.
// Implements POST /forms/libreoffice/convert and GET /health on http://localhost:3001.
//   node scripts/local-pdf-server.mjs     (requires `soffice` on PATH and TH Sarabun fonts installed)
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = Number(process.env.PORT ?? 3001);

function convert(dir, file) {
  return new Promise((resolve, reject) => {
    execFile(
      "soffice",
      [`-env:UserInstallation=file://${join(dir, "profile")}`, "--headless", "--convert-to", "pdf", "--outdir", dir, file],
      { timeout: 60_000 },
      (error) => (error ? reject(error) : resolve()),
    );
  });
}

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" }).end('{"status":"up"}');
    return;
  }
  if (req.method !== "POST" || req.url !== "/forms/libreoffice/convert") {
    res.writeHead(404).end();
    return;
  }
  const dir = await mkdtemp(join(tmpdir(), "pdf-"));
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const request = new Request("http://local", { method: "POST", headers: req.headers, body: Buffer.concat(chunks) });
    const form = await request.formData();
    const file = form.get("files");
    if (!(file instanceof Blob)) throw new Error("missing files field");
    const input = join(dir, "input.docx");
    await writeFile(input, Buffer.from(await file.arrayBuffer()));
    await convert(dir, input);
    const pdf = await readFile(join(dir, "input.pdf"));
    res.writeHead(200, { "Content-Type": "application/pdf" }).end(pdf);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain" }).end(String(error));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

server.listen(PORT, () => console.log(`local PDF server (Gotenberg-compatible) on http://localhost:${PORT}`));
