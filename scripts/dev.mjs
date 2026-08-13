#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd, args, env = {}) {
  return spawn(cmd, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: true,
  });
}

const api = run('npm', ['--prefix', 'apps/api', 'run', 'start:dev'], {
  PORT: '3001',
  HOST: '0.0.0.0',
});
const web = run('npm', ['--prefix', 'apps/web', 'run', 'start']);

function shutdown(code = 0) {
  api.kill('SIGTERM');
  web.kill('SIGTERM');
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
api.on('exit', (c) => { if (c) shutdown(c); });
web.on('exit', (c) => { if (c) shutdown(c); });
