import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const python = process.env.PYTHON || 'python3';
if (Number(process.versions.node.split('.')[0]) !== 24) {
  console.error('Use Node.js 24 (see .nvmrc).');
  process.exit(1);
}
const temporary = mkdtempSync(path.join(tmpdir(), 'mercado-check-'));
const env = { ...process.env, PRICES_DB_PATH: path.join(temporary, 'catalog.sqlite3'),
  ENABLE_AI_SUGGESTIONS: 'false', OPENAI_API_KEY: '', NEXT_TELEMETRY_DISABLED: '1',
  PYTHONDONTWRITEBYTECODE: '1' };
function run(command, args) {
  console.log('\n> ' + command + ' ' + args.join(' '));
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Check failed: ' + args.join(' '));
}
try {
  run(python, ['data-pipeline/init_db.py', '--database', env.PRICES_DB_PATH]);
  for (const step of ['lint', 'typecheck', 'test:all', 'build']) run(npm, ['run', step]);
  console.log('\nAll checks passed. Checks used an isolated empty catalog, never your working database.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
