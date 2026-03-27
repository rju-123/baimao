/**
 * 清理 contract_other.docx 中残留的 STYLEREF 字段（会在导出 PDF 时显示“错误: 引用源未找到”）。
 *
 * 运行：
 *   node api/scripts/fix-contract-other-styleref.js
 */
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const base = path.join(__dirname, '..', 'templates');
const docxPath = path.join(base, 'contract_other.docx');

function removeStyleRefFields(xml) {
  let out = xml;

  // 移除复杂字段：begin ... instrText(STYLEREF) ... end
  // 兼容字段被拆分到多个 <w:r> 的情况，使用非贪婪匹配。
  out = out.replace(
    /<w:fldChar\b[^>]*w:fldCharType="begin"[^>]*\/>[\s\S]*?<w:instrText\b[^>]*>[\s\S]*?STYLEREF[\s\S]*?<\/w:instrText>[\s\S]*?<w:fldChar\b[^>]*w:fldCharType="end"[^>]*\/>/gi,
    '',
  );

  // 兼容简单字段：<w:fldSimple w:instr=" STYLEREF ..."> ... </w:fldSimple>
  out = out.replace(
    /<w:fldSimple\b[^>]*w:instr="[^"]*STYLEREF[^"]*"[^>]*>[\s\S]*?<\/w:fldSimple>/gi,
    '',
  );

  return out;
}

function main() {
  if (!fs.existsSync(docxPath)) {
    console.error('模板不存在：', docxPath);
    process.exit(1);
  }

  const buf = fs.readFileSync(docxPath);
  const zip = new PizZip(buf);
  const entry = 'word/document.xml';
  const xml = zip.file(entry)?.asText();
  if (!xml) {
    console.error('无法读取：', entry);
    process.exit(1);
  }

  const patched = removeStyleRefFields(xml);
  if (patched === xml) {
    console.log('未发现 STYLEREF 字段，跳过。');
    return;
  }

  zip.file(entry, patched);
  const outBuf = zip.generate({ type: 'nodebuffer' });
  fs.writeFileSync(docxPath, outBuf);
  console.log('OK：已清理 STYLEREF 字段 ->', docxPath);
}

main();

