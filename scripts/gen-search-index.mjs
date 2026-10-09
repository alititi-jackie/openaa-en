/**
 * 构建时生成本地搜索索引：public/search-index.{words,phrases,scenes}.json
 * 字段精简：id, slug, en, zh, aliases, cat, title
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const contentDir = path.join(root, 'src', 'content');
const publicDir = path.join(root, 'public');

const stripExt = (f) => f.replace(/\.json$/, '');

async function readAll(dir) {
  let files = [];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const out = [];
  for (const f of files) {
    try {
      const raw = await readFile(path.join(dir, f), 'utf-8');
      out.push({ file: stripExt(f), data: JSON.parse(raw) });
    } catch (e) {
      console.error(`[gen-search-index] 跳过无效文件 ${f}: ${e.message}`);
    }
  }
  return out;
}

async function main() {
  await mkdir(publicDir, { recursive: true });

  const words = (await readAll(path.join(contentDir, 'words'))).map(({ file, data }) => ({
    id: data.id || file,
    slug: file,
    en: data.english || '',
    zh: data.chinese || '',
    aliases: data.aliases || [],
    cat: data.categoryIds || [],
    title: data.english || '',
  }));

  const phrases = (await readAll(path.join(contentDir, 'phrases'))).map(({ file, data }) => ({
    id: data.id || file,
    slug: file,
    en: data.english || '',
    zh: data.chinese || '',
    aliases: data.aliases || [],
    cat: data.categoryIds || [],
    title: data.english || '',
  }));

  const scenes = (await readAll(path.join(contentDir, 'scenes'))).map(({ file, data }) => ({
    id: data.id || file,
    slug: file,
    en: [data.title, data.featuredPhrase && data.featuredPhrase.en].filter(Boolean).join(' '),
    zh: data.summary || '',
    aliases: [],
    cat: data.categoryIds || [],
    title: data.title || '',
  }));

  await writeFile(path.join(publicDir, 'search-index.words.json'), JSON.stringify(words));
  await writeFile(path.join(publicDir, 'search-index.phrases.json'), JSON.stringify(phrases));
  await writeFile(path.join(publicDir, 'search-index.scenes.json'), JSON.stringify(scenes));

  console.log(
    `[gen-search-index] words=${words.length} phrases=${phrases.length} scenes=${scenes.length}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
