#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiMain = join(root, 'apps/api/dist/main.js');
const webIndex = join(root, 'apps/web/dist/web/browser/index.html');

if (!existsSync(apiMain)) {
  console.error('API build missing. Run: npm run build:api');
  process.exit(1);
}
if (!existsSync(webIndex)) {
  console.warn('Angular build missing — API-only mode.');
}

const env = {
  ...process.env,
  PORT: process.env.PORT || '8080',
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'production',
};

const child = spawn(process.execPath, [apiMain], {
  cwd: join(root, 'apps/api'),
  env,
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code ?? 0));
