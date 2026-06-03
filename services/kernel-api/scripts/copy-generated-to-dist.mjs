import { cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src', 'generated');
const dest = join(root, 'dist', 'generated');

if (!existsSync(join(src, 'prisma', 'index.js'))) {
  console.error('Prisma client missing. Run: pnpm exec prisma generate');
  process.exit(1);
}

cpSync(src, dest, { recursive: true });
console.log('Copied Prisma client to dist/generated');
