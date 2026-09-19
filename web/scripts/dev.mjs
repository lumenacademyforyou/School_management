// Starts the admin console, parent app and teacher app together, each on its own port.
// `npm run dev:admin`, `dev:parent` and `dev:teacher` still start one app at a time.
import { spawn } from 'node:child_process';

const APPS = [
  { name: 'admin', port: 3000, args: [] },
  { name: 'parent', port: 3001, args: ['--mode', 'parent'] },
  { name: 'teacher', port: 3002, args: ['--mode', 'teacher'] },
];

const children = APPS.map(app => {
  const command = ['npx vite', ...app.args, `--port=${app.port}`, '--strictPort', '--host=0.0.0.0'].join(' ');
  const child = spawn(command, {
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const prefix = `[${app.name}]`.padEnd(10);
  const relay = stream => data =>
    String(data)
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach(line => stream.write(`${prefix}${line}\n`));
  child.stdout.on('data', relay(process.stdout));
  child.stderr.on('data', relay(process.stderr));
  // One app stopping leaves the others running; the launcher exits when all have stopped.
  child.on('exit', code => {
    console.log(`${prefix}stopped (exit ${code})`);
    if (children.every(c => c.exitCode !== null || c.signalCode !== null)) process.exit(0);
  });
  return child;
});

let stopping = false;
function shutdown(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode !== null) continue;
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 500);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('Admin console  http://localhost:3000/');
console.log('Parent app     http://localhost:3001/');
console.log('Teacher app    http://localhost:3002/');
