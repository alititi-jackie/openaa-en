#!/usr/bin/env node
/**
 * 构建前把仓库根目录的二进制品牌资产拷入 public/（Astro 只发布 public/）。
 * 这些文件走 git 正常提交，不经过 API，避免二进制上传问题。
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

for (const f of ['logo.png', 'favicon.ico']) {
  const src = join(root, f);
  if (existsSync(src)) cpSync(src, join(pub, f));
}
const favDir = join(root, 'favicon');
if (existsSync(favDir)) {
  mkdirSync(join(pub, 'favicon'), { recursive: true });
  cpSync(favDir, join(pub, 'favicon'), { recursive: true });
}
console.log('assets copied to public/');
