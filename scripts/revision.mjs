import fs from 'node:fs';
const bump = process.argv.includes('--bump');
const revision = JSON.parse(fs.readFileSync('version.json', 'utf8'));
if (
  !/^\d+\.\d+\.\d+$/.test(revision.version) ||
  !Number.isSafeInteger(revision.build) ||
  revision.build < 1
) {
  throw new Error('version.json requires version x.y.z and a positive integer build.');
}
if (bump) revision.build += 1;
const project = 'ios/App/App.xcodeproj/project.pbxproj';
const android = 'android/app/build.gradle';
fs.writeFileSync(
  project,
  fs
    .readFileSync(project, 'utf8')
    .replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${revision.build};`)
    .replace(/MARKETING_VERSION = [\d.]+;/g, `MARKETING_VERSION = ${revision.version};`),
);
fs.writeFileSync(
  android,
  fs
    .readFileSync(android, 'utf8')
    .replace(/versionCode \d+/, `versionCode ${revision.build}`)
    .replace(/versionName "[\d.]+"/, `versionName "${revision.version}"`),
);
for (const file of ['package.json', 'package-lock.json']) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.version = revision.version;
  if (data.packages?.['']) data.packages[''].version = revision.version;
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}
fs.writeFileSync('version.json', JSON.stringify(revision, null, 2) + '\n');
console.log(`Version ${revision.version} (build ${revision.build})`);
