import { spawnSync } from 'child_process';
import path from 'path';

const ROOT = process.cwd();
const SCRIPT_GROUPS = {
  1: 'polish-top10-manual-2026-04-08.mjs',
  2: 'polish-top20-batch2-manual-2026-04-08.mjs',
  3: 'polish-top30-batch3-manual-2026-04-08.mjs',
  4: 'polish-top40-batch4-manual-2026-04-08.mjs',
  5: 'polish-top50-batch5-manual-2026-04-08.mjs'
};

function parseArgs(argv) {
  const args = {
    all: true,
    batches: []
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--batch') {
      const v = Number(argv[i + 1]);
      if (Number.isInteger(v) && SCRIPT_GROUPS[v]) {
        args.all = false;
        args.batches.push(v);
      }
      i += 1;
      continue;
    }
    if (arg === '--all') {
      args.all = true;
      args.batches = [];
    }
  }

  if (!args.all && !args.batches.length) {
    args.all = true;
  }
  return args;
}

function runScript(scriptName) {
  const abs = path.join(ROOT, 'scripts', scriptName);
  const result = spawnSync('node', [abs], {
    cwd: ROOT,
    stdio: 'inherit'
  });
  if (result.status !== 0) {
    throw new Error(`script failed: ${scriptName}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const targets = args.all
    ? Object.keys(SCRIPT_GROUPS).map((k) => Number(k))
    : Array.from(new Set(args.batches));

  for (const batch of targets) {
    runScript(SCRIPT_GROUPS[batch]);
  }

  console.log(JSON.stringify({
    ran: targets,
    count: targets.length
  }, null, 2));
}

main();
