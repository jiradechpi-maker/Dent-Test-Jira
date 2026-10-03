/**
 * Guard: every piece of Thai text in a UI file must come with its English pair — inside t("ไทย", "English"),
 * a { th, en } object, bi(...), a `locale === "th" ? … : …` branch, an inline pair "ไทย · English", or an element
 * explicitly marked lang="th" (deliberately bilingual displays). A line can opt out with an `i18n-exempt` comment
 * (e.g. a language's own name). The official Thai letter is the only UI file exempt by design.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..");
const SCANNED = ["src/components", "src/app"];
const EXEMPT = new Set([
  // The official Thai government letter: its text IS the document.
  "src/components/documents/letter/letter-pages.tsx",
]);
const THAI = /[฀-๿]/;
const TRANSLATORS = new Set(["t", "tr", "bi"]);
/** "เวลาปัจจุบัน · Now", "Language / ภาษา" — both languages side by side in one string. */
const INLINE_PAIR = /[\u0e00-\u0e7f][^·/]*\s[·/]\s+[A-Za-z]|[A-Za-z][^·/]*\s[·/]\s+[\u0e00-\u0e7f]/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(tsx?|mts)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

function calleeName(call: ts.CallExpression): string {
  const callee = call.expression;
  if (ts.isIdentifier(callee)) return callee.text;
  if (ts.isPropertyAccessExpression(callee)) return callee.name.text;
  return "";
}

function hasLangTh(element: ts.JsxOpeningLikeElement): boolean {
  return element.attributes.properties.some(
    (attr) => ts.isJsxAttribute(attr) && attr.name.getText() === "lang" && attr.initializer !== undefined && ts.isStringLiteral(attr.initializer) && attr.initializer.text === "th",
  );
}

function isCovered(node: ts.Node): boolean {
  for (let current: ts.Node | undefined = node.parent; current; current = current.parent) {
    if (ts.isCallExpression(current) && TRANSLATORS.has(calleeName(current))) return true;
    if (ts.isPropertyAssignment(current) && current.name.getText().replace(/["']/g, "") === "th") return true;
    if (ts.isJsxElement(current) && hasLangTh(current.openingElement)) return true;
    if (ts.isJsxSelfClosingElement(current) && hasLangTh(current)) return true;
    if (ts.isJsxOpeningElement(current) && hasLangTh(current)) return true;
    // Regular expressions built from strings match spreadsheet text — data, not UI.
    if (ts.isNewExpression(current) && current.expression.getText() === "RegExp") return true;
    if (ts.isConditionalExpression(current) && /\blocale\b/.test(current.condition.getText())) return true;
  }
  return false;
}

function uncovered(path: string): string[] {
  const text = readFileSync(path, "utf-8");
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    const isText =
      ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node) || ts.isJsxText(node);
    if (isText && THAI.test(node.getText()) && !INLINE_PAIR.test(node.getText()) && !isCovered(node)) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart());
      const lines = text.split("\n");
      if (/i18n-exempt/.test(lines[line] ?? "") || /i18n-exempt/.test(lines[line - 1] ?? "")) return;
      found.push(`${relative(ROOT, path)}:${line + 1}  ${node.getText().trim().slice(0, 80)}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe("i18n coverage", () => {
  it("has an English pair for every Thai string in the UI", () => {
    const problems = SCANNED.flatMap((dir) => files(join(ROOT, dir)))
      .filter((path) => !EXEMPT.has(relative(ROOT, path)))
      .flatMap(uncovered);
    expect(problems).toEqual([]);
  });
});
