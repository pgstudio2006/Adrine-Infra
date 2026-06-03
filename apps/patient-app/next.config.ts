import type { NextConfig } from 'next';
import path from 'node:path';

/** Standalone output is required for Docker/Coolify; skip on Windows dev (symlink EPERM). */
const useStandalone =
  process.env.NEXT_SKIP_STANDALONE !== 'true' && process.platform !== 'win32';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(useStandalone ? { output: 'standalone' as const } : {}),
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;
