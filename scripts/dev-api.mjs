// Starts the API for `pnpm dev`. If a Moon Maps API already answers on the port, it reuses it
// instead of failing with "Address already in use", so the web app still starts.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

const PORT = Number(process.env.MM_API_PORT ?? 8000);

function portFree(port) {
  return new Promise((resolve) => {
    const server = createServer()
      .once('error', () => resolve(false))
      .once('listening', () => server.close(() => resolve(true)))
      .listen(port, '127.0.0.1');
  });
}

async function isMoonMapsApi(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    const body = await res.json();
    return res.ok && body.ok === true && 'kernels' in body;
  } catch {
    return false;
  }
}

if (!(await portFree(PORT))) {
  if (await isMoonMapsApi(PORT)) {
    console.log(
      `A Moon Maps API is already running on port ${PORT}; using it. Stop it to get a fresh one.`,
    );
    process.exit(0);
  }
  console.error(
    `Port ${PORT} is used by another program. Find it with: lsof -iTCP:${PORT} -sTCP:LISTEN`,
  );
  process.exit(1);
}

const child = spawn(
  'uv',
  ['run', 'uvicorn', 'app.main:app', '--reload', '--port', String(PORT)],
  { cwd: new URL('../apps/api/', import.meta.url), stdio: 'inherit' },
);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('exit', (code) => process.exit(code ?? 0));
