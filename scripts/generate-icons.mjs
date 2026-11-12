import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
// Run on macOS after replacing assets/branding/app-icon.png.
const source = 'assets/branding/app-icon.png';
function resize(size, out) {
  execFileSync('sips', ['-z', String(size), String(size), source, '--out', out], {
    stdio: 'ignore',
  });
}
mkdirSync('public/icons', { recursive: true });
for (const size of [32, 180, 192, 512]) resize(size, `public/icons/icon-${size}.png`);
resize(1024, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
for (const [density, size, adaptive] of [
  ['mdpi', 48, 108],
  ['hdpi', 72, 162],
  ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324],
  ['xxxhdpi', 192, 432],
]) {
  const dir = `android/app/src/main/res/mipmap-${density}`;
  for (const name of ['ic_launcher', 'ic_launcher_round']) resize(size, `${dir}/${name}.png`);
  // Full-bleed artwork; Android applies the launcher mask.
  resize(adaptive, `${dir}/ic_launcher_foreground.png`);
}
console.log('Updated browser, iOS, and Android icons.');
