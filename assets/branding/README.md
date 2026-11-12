# Branding assets

`app-icon.png` is the approved temporary icon master. Replace it and run `npm run icons:generate` on macOS to update browser, iOS and Android icons. Run `npm run cap:sync` before building native apps. The generator uses macOS `sips`; no extra image dependencies are required.

`tony-in-the-game-splash-v2.png` is a splash concept, not yet installed as the launch screen. Generated with the built-in image tool, preserving the controller and adapting the wordmark to the existing website at `/Users/anthonyzharoff/Projects/React/tzharoff.com`: yellow TONY, cream IN THE pill, coral GAME, cream outlines and navy/royal-blue palette. Source branding is in `src/styles.css` and `tailwind.config.js` in that site.

`tony-in-the-game-splash-v3.png` replaces the v2 controller with the website's excited illustrated Tony mascot. Built-in image edit prompt: replace only the controller with Tony from `public/tony/excited.png` in the website source, preserving his identity, raised fists, wordmark, palette, outlines and portrait background. Saved as a concept; not installed as the launch screen.

The v3 splash is approved and installed in the iOS Splash asset catalog. The launch storyboard uses aspect fit to keep the complete logo visible on all device shapes.

Icon updated to full bleed: the blue bevel reaches the canvas edges without exterior padding. Built-in image edit preserved the bolt and cyan/gold lighting while extending the blue surface into every corner.
