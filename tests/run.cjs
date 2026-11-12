const { spawnSync } = require('node:child_process');
const path = require('node:path');
process.chdir(path.resolve(__dirname, '..'));
for (const file of [
  'engine.mjs',
  'boundary.mjs',
  'editor.mjs',
  'stuck.cjs',
  'charges.cjs',
  'bedtime.cjs',
  'tutorial.cjs',
  'campaign.cjs',
  'walls.cjs',
  'arrival.cjs',
  'pop.cjs',
  'timing.mjs',
  'sound.mjs',
  'idle.mjs',
  'covers.mjs',
  'native-store.mjs',
  'version.mjs',
]) {
  const result = spawnSync(process.execPath, [path.join('tests', file)], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
