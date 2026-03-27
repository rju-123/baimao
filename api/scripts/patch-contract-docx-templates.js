/**
 * 为 contract_other / contract_v1 的 Word XML 写入 Docxtemplater 表格行循环与总价占位符。
 * 运行：node api/scripts/patch-contract-docx-templates.js
 */
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const base = path.join(__dirname, '..', 'templates');
const otherXml = path.join(base, '_unzip_contract_other', 'word', 'document.xml');
const v1Xml = path.join(base, '_unzip_contract_v1', 'word', 'document.xml');

function patchContractOther(s) {
  let out = s;
  if (!out.includes('{#items}')) {
    const rowStart = out.indexOf('<w:tr w14:paraId="2D113EE6"');
    if (rowStart < 0)
      throw new Error('contract_other: 未找到数据行 w:tr 2D113EE6');
    const rowEnd = out.indexOf('</w:tr>', rowStart);
    if (rowEnd < 0)
      throw new Error('contract_other: 数据行结束标记未找到');
    let row = out.slice(rowStart, rowEnd + 7);

    row = row.replace(/<w:t>1<\/w:t>/, '<w:t>{#items}{index}</w:t>');
    row = row.replace(/<w:t>渗透测试服务<\/w:t>/, '<w:t>{name}</w:t>');
    row = row.replace(
      /<w:t>渗透测试服务利用主流的攻击技术和工具对目标网络、业务系统、数据库进行模拟黑客攻击测试，将发现的安全漏洞进行整理，给出详细说明，并针对每一个安全漏洞提供相应的解决建议。<\/w:t>/,
      '<w:t>{desc}</w:t>',
    );
    row = row.replace(/<w:t>2套<\/w:t>/, '<w:t>{quantity}套</w:t>');
    row = row.replace(/<w:t xml:space="preserve"> 4000<\/w:t>/, '<w:t>{unitPrice}</w:t>');
    const last4000 = row.lastIndexOf('<w:t>4000</w:t>');
    if (last4000 < 0)
      throw new Error('contract_other: 未找到小计单元格 4000');
    row = `${row.slice(0, last4000)}<w:t>{lineTotal}{/items}</w:t>${row.slice(last4000 + '<w:t>4000</w:t>'.length)}`;

    out = out.slice(0, rowStart) + row + out.slice(rowEnd + 7);
  }

  if (!out.includes('{payAmountFmt}')) {
    out = out.replace(/<w:t>4000\.00<\/w:t>/, '<w:t>{payAmountFmt}</w:t>');
    out = out.replace(/<w:t>肆仟<\/w:t>/, '<w:t>{amountWords}</w:t>');
  }
  return out;
}

function extractFirstTable(s) {
  const i = s.indexOf('<w:tbl>');
  const j = s.indexOf('</w:tbl>', i);
  if (i < 0 || j < 0)
    throw new Error('未找到 w:tbl');
  return s.slice(i, j + 8);
}

function buildContractV1Document(patchedOtherDoc) {
  const tbl = extractFirstTable(patchedOtherDoc);
  const tblIndented = tbl.includes('\n')
    ? tbl.split('\n').map(l => '    ' + l).join('\n')
    : '    ' + tbl;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="w14">
  <w:body>
    <w:p><w:r><w:t>服务合同</w:t></w:r></w:p>
    <w:p/>
    <w:p><w:r><w:t>订单编号：{orderNo}</w:t></w:r></w:p>
    <w:p/>
${tblIndented}
    <w:p/>
    <w:p><w:r><w:t>公司名称：{companyName}</w:t></w:r></w:p>
    <w:p><w:r><w:t>公司地址：{companyAddress}</w:t></w:r></w:p>
    <w:p><w:r><w:t>公司电话：{companyPhone}</w:t></w:r></w:p>
    <w:p/>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>
`;
}

function zipFolderToDocx(folder, outDocx) {
  const zip = new PizZip();
  function walk(absBase, rel) {
    const full = path.join(absBase, rel);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(full))
        walk(absBase, path.join(rel, name));
    }
    else {
      const entry = rel.split(path.sep).join('/');
      zip.file(entry, fs.readFileSync(full));
    }
  }
  walk(folder, '');
  const buf = zip.generate({ type: 'nodebuffer' });
  const tmp = outDocx + '.__tmp__';
  fs.writeFileSync(tmp, buf);
  try {
    try {
      fs.unlinkSync(outDocx);
    }
    catch (_) {}
    fs.renameSync(tmp, outDocx);
  }
  catch (e) {
    const alt = outDocx.replace(/\.docx$/i, '_rebuilt.docx');
    try {
      fs.renameSync(tmp, alt);
    }
    catch (e2) {
      fs.unlinkSync(tmp);
      throw e2;
    }
    console.warn(`无法覆盖 ${outDocx}（文件可能被占用），已写入 ${alt}`);
  }
}

// --- main
let other = fs.readFileSync(otherXml, 'utf8');
other = patchContractOther(other);
fs.writeFileSync(otherXml, other, 'utf8');

const v1Doc = buildContractV1Document(other);
fs.writeFileSync(v1Xml, v1Doc, 'utf8');

zipFolderToDocx(path.join(base, '_unzip_contract_other'), path.join(base, 'contract_other.docx'));
zipFolderToDocx(path.join(base, '_unzip_contract_v1'), path.join(base, 'contract_v1.docx'));

console.log('OK: contract_other.docx + contract_v1.docx 已更新');
