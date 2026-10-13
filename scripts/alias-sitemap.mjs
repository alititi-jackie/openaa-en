import { copyFile, access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { basename } from 'node:path';

const dist = new URL('../dist/', import.meta.url);
const indexUrl = new URL('sitemap-index.xml', dist);
const targetUrl = new URL('sitemap.xml', dist);

await access(indexUrl, constants.R_OK);
const indexXml = await readFile(indexUrl, 'utf8');
const childUrls = [...indexXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());

if (childUrls.length === 1) {
  const childName = basename(new URL(childUrls[0]).pathname);
  const childUrl = new URL(childName, dist);
  await access(childUrl, constants.R_OK);
  await copyFile(childUrl, targetUrl);
  console.log(`Created dist/sitemap.xml from dist/${childName}`);
} else {
  // Keep all shards discoverable when the site exceeds one sitemap file.
  await copyFile(indexUrl, targetUrl);
  console.log('Created dist/sitemap.xml from dist/sitemap-index.xml (multiple shards)');
}

const xml = await readFile(targetUrl, 'utf8');
if (!xml.includes('<urlset') && !xml.includes('<sitemapindex')) {
  throw new Error('dist/sitemap.xml is not a valid sitemap document');
}
console.log('Verified dist/sitemap.xml');
