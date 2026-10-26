#!/usr/bin/env node
/**
 * Offline verification for the scroll sequence analytics.
 *
 * Runs the actual-handler tests with the project's existing toolchain (Node's
 * built-in test runner). The child process starts from an empty environment
 * plus OS/path values and fixed synthetic configuration, no dotenv autoload,
 * and the tests deny network delivery.
 *
 * Usage: node posthog-analytics.verify.mjs
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const TEST_FILE = join(ROOT, 'test', 'posthog-analytics.test.mjs');
const TIMEOUT_MS = 120000;

function fail(message) {
  console.error(`posthog-analytics verify: ${message}`);
  process.exit(1);
}

const nodeBinary = process.execPath;
if (!nodeBinary || !existsSync(nodeBinary)) {
  fail(`no Node.js runner found at ${nodeBinary || '<execPath unset>'}`);
}
if (!existsSync(TEST_FILE)) {
  fail('missing test/posthog-analytics.test.mjs');
}

const testSource = readFileSync(TEST_FILE, 'utf8');
const assertionCount = (testSource.match(/\bassert\./g) || []).length;
if (assertionCount === 0) {
  fail('the test file contains no assertions');
}

const ALLOWED_ENV = [
  'PATH',
  'Path',
  'PATHEXT',
  'SystemRoot',
  'SYSTEMROOT',
  'windir',
  'WINDIR',
  'ComSpec',
  'TEMP',
  'TMP',
  'HOME',
  'USERPROFILE',
  'NUMBER_OF_PROCESSORS',
  'PROCESSOR_ARCHITECTURE',
];

const baseEnv = {};
for (const key of ALLOWED_ENV) {
  if (typeof process.env[key] === 'string') baseEnv[key] = process.env[key];
}
const syntheticEnv = {
  ...baseEnv,
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: 'synthetic-project-token',
  NEXT_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com',
  NODE_OPTIONS: '',
};

const result = spawnSync(
  nodeBinary,
  ['--test', '--test-reporter=tap', join('test', 'posthog-analytics.test.mjs')],
  {
    cwd: ROOT,
    env: syntheticEnv,
    shell: false,
    timeout: TIMEOUT_MS,
    encoding: 'utf8',
  }
);

const stdout = result.stdout || '';
const stderr = result.stderr || '';
process.stdout.write(stdout);
if (stderr.trim()) process.stderr.write(stderr);

if (result.error) {
  fail(`could not run the test runner: ${result.error.message}`);
}
if (result.signal) {
  fail(`the test runner was killed by ${result.signal}`);
}
if (result.status === null) {
  fail('the test runner produced no exit status');
}

const passMatch = stdout.match(/^# pass (\d+)$/m);
const failMatch = stdout.match(/^# fail (\d+)$/m);
const passed = passMatch ? Number(passMatch[1]) : 0;
const failed = failMatch ? Number(failMatch[1]) : 0;

if (result.status !== 0 || failed > 0) {
  fail(`${failed || 'unknown'} test(s) failed`);
}
if (passed === 0) {
  fail('zero tests ran');
}

console.log(
  `posthog-analytics verify: ${passed} test(s) passed, ${assertionCount} assertions, no network delivery`
);
