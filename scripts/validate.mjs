#!/usr/bin/env node
/**
 * openaa-en 构建产物校验：页面数、死链、SEO 要素、搜索索引、sitemap。
 * 失败时非零退出，CI 直接拦下。
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const errors = [];
const warns = [];

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.html')) out.push(p);
  }
  return out;
}

if (!existsSync(dist)) {
  console.error('FAIL: dist/ 不存在，先跑 npm run build');
  process.exit(1);
}

const pages = walk(dist);
console.log(`pages: ${pages.length}`);

// 1. 必备文件
for (const f of ['sitemap-index.xml', 'CNAME', 'robots.txt',
                 'search-index.words.json', 'search-index.phrases.json', 'search-index.scenes.json']) {
  if (!existsSync(join(dist, f))) errors.push(`缺失 dist/${f}`);
}
// sitemap 子文件
const smIndex = existsSync(join(dist, 'sitemap-index.xml')) ? readFileSync(join(dist, 'sitemap-index.xml'), 'utf8') : '';
for (const m of smIndex.matchAll(/<loc>(.*?)<\/loc>/g)) {
  const u = new URL(m[1]);
  if (!existsSync(join(dist, u.pathname))) errors.push(`sitemap 指向不存在的文件: ${u.pathname}`);
}

// 2. 每页 SEO 要素 + 死链
const urlToFile = new Map();
for (const p of pages) {
  const rel = p.slice(dist.length).replace(/\\/g, '/');
  const url = rel.endsWith('/index.html') ? rel.slice(0, -10) || '/' : rel;
  urlToFile.set(url, p);
}
let checkedLinks = 0;
for (const p of pages) {
  const html = readFileSync(p, 'utf8');
  const rel = p.slice(dist.length);
  if (!/<title>[^<]{6,}<\/title>/.test(html)) errors.push(`${rel}: 缺 title`);
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) warns.push(`${rel}: description 缺失或过短`);
  if (!/<link rel="canonical" href="https:\/\/en\.openaa\.com[^"]*"/.test(html))
    errors.push(`${rel}: canonical 缺失或域名错误`);
  if (/www\.openaa\.com/.test(html)) errors.push(`${rel}: 含 www.openaa.com（必须用裸域名）`);
  for (const m of html.matchAll(/href="(\/[^"#?]*?)"/g)) {
    const href = m[1];
    if (/\.(css|js|png|jpg|jpeg|svg|ico|json|xml|webmanifest)$/.test(href)) {
      if (!existsSync(join(dist, href))) errors.push(`${rel}: 静态资源 404 ${href}`);
      continue;
    }
    checkedLinks++;
    const key = href.endsWith('/') ? href : href + '/';
    if (!urlToFile.has(key) && !urlToFile.has(href))
      errors.push(`${rel}: 死链 ${href}`);
  }
}
console.log(`internal links checked: ${checkedLinks}`);

// 3. 404 页
if (!existsSync(join(dist, '404.html'))) warns.push('缺 404.html');

console.log(`\nerrors: ${errors.length}, warnings: ${warns.length}`);
for (const w of warns) console.log('WARN:', w);
for (const e of errors) console.log('ERROR:', e);
process.exit(errors.length ? 1 : 0);
