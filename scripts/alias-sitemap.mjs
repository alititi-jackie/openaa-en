import { copyFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';

const source = new URL('../dist/sitemap-index.xml', import.meta.url);
const target = new URL('../dist/sitemap.xml', import.meta.url);

await access(source, constants.R_OK);
await copyFile(source, target);
console.log('Created dist/sitemap.xml from dist/sitemap-index.xml');
