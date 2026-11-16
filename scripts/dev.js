// Geliştirme: API sunucusu (3001) + Vite (5173) birlikte. Windows/macOS/Linux'ta çalışır.
import { spawn } from 'node:child_process';

const procs = [
  spawn(process.execPath, ['--watch', 'server/index.js'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' }),
];
const stop = () => procs.forEach((p) => p.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
procs.forEach((p) => p.on('exit', stop));
