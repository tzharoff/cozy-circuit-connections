import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// iOS, Android, and version.json must always share one version and build number.
const revision = JSON.parse(await readFile('version.json', 'utf8'));
const ios = await readFile('ios/App/App.xcodeproj/project.pbxproj', 'utf8');
const android = await readFile('android/app/build.gradle', 'utf8');
const iosBuilds = [...ios.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)].map((m) => Number(m[1]));
const iosVersions = [...ios.matchAll(/MARKETING_VERSION = ([\d.]+);/g)].map((m) => m[1]);
assert(iosBuilds.length >= 2 && iosVersions.length >= 2);
for (const build of iosBuilds)
  assert.equal(build, revision.build, 'iOS build (run npm run version:sync)');
for (const version of iosVersions) assert.equal(version, revision.version, 'iOS version');
assert.equal(Number(android.match(/versionCode (\d+)/)[1]), revision.build, 'Android versionCode');
assert.equal(android.match(/versionName "([\d.]+)"/)[1], revision.version, 'Android versionName');
console.log(
  `PASS: version ${revision.version} (build ${revision.build}) matches on iOS and Android`,
);
