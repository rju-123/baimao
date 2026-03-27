const fs = require('fs');
const path = process.argv[2];
const s = fs.readFileSync(path, 'utf8');
const rows = s.split('<w:tr');
console.log('rows', rows.length);
const re = /<w:t[^>]*>([^<]*)<\/w:t>/g;
for (let i = 1; i < Math.min(rows.length, 25); i++) {
  const r = rows[i];
  const texts = [];
  let m;
  while ((m = re.exec(r)) !== null) texts.push(m[1]);
  console.log('row', i, texts.join('|').slice(0, 400));
}
