/**
 * Writes clients/navayu/packs/gurgaon-pack.json and pataudi-pack.json
 * Run: pnpm exec tsx scripts/write-navayu-packs.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGurgaonPack, buildPataudiPack } from './navayu-pack-definitions.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const PACK_DIR = join(ROOT, 'clients', 'navayu', 'packs');

mkdirSync(PACK_DIR, { recursive: true });

writeFileSync(join(PACK_DIR, 'gurgaon-pack.json'), `${JSON.stringify(buildGurgaonPack(), null, 2)}\n`);
writeFileSync(join(PACK_DIR, 'pataudi-pack.json'), `${JSON.stringify(buildPataudiPack(), null, 2)}\n`);

console.log('Wrote gurgaon-pack.json and pataudi-pack.json');
