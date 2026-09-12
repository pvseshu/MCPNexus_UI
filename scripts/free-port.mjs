import { execSync } from 'node:child_process';

const PORT = Number(process.env.PORT) || 3011;
const IS_WIN = process.platform === 'win32';

function run(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  } catch {
    return '';
  }
}

// 1) If the app's own Docker container is running and holding the port, stop it —
//    never blindly kill whatever owns the port, since on Windows Docker Desktop's
//    port-proxy can appear to "own" it and killing that process disrupts every
//    other container, not just this one.
const dockerPs = run('docker ps --filter "name=mcpnexus" --format "{{.Names}}"');
if (dockerPs.includes('mcpnexus')) {
  console.log(`[free-port] Stopping running "mcpnexus" Docker container (was holding port ${PORT})...`);
  run('docker stop mcpnexus');
}

// 2) Kill any stray local Node dev-server process still bound to the port.
//    Only ever targets node.exe / node processes — never touches Docker's own
//    backend or unrelated services that might also show up in the listener list.
if (IS_WIN) {
  const netstat = run(`netstat -ano | findstr :${PORT} | findstr LISTENING`);
  const pids = new Set(
    netstat
      .split('\n')
      .map((line) => line.trim().split(/\s+/).pop())
      .filter(Boolean)
  );
  for (const pid of pids) {
    const info = run(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
    if (info.toLowerCase().startsWith('"node.exe"')) {
      console.log(`[free-port] Killing stray node.exe process ${pid} on port ${PORT}...`);
      run(`taskkill /F /PID ${pid}`);
    }
  }
} else {
  const pids = run(`lsof -ti tcp:${PORT} -sTCP:LISTEN`).split('\n').map((s) => s.trim()).filter(Boolean);
  for (const pid of pids) {
    const info = run(`ps -p ${pid} -o comm=`);
    if (info.toLowerCase().includes('node')) {
      console.log(`[free-port] Killing stray node process ${pid} on port ${PORT}...`);
      run(`kill -9 ${pid}`);
    }
  }
}
