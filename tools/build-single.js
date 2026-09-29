// index.html + css + js 를 하나의 HTML 파일로 합친다.
// 사용법: node tools/build-single.js [출력 경로]   (기본값: zelda_recipe.html)
// 휴대폰 파일 앱 등 옆 폴더의 파일을 읽지 못하는 환경에서도 열 수 있다.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = process.argv[2] || path.join(root, 'zelda_recipe.html');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let html = read('index.html');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => `<style>\n${read(href)}</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) =>
  `<script>\n${read(src).replace(/<\/script/gi, '<\\/script')}</script>`);

fs.writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(1)} KB)`);
