# Wupiko promo video

15 s, 1080x1920, 30 fps vertical promo. `promo.html` is a pure function of time (`window.renderAt(t)`);
`capture.js` renders 450 PNG frames with puppeteer-core + Chrome; `build.sh` encodes with ffmpeg
(H.264 + AAC, daybreak.wav looped from 2.5 s, faded out by 8.4 s) and writes the contact sheet.

```
mkdir -p SCRATCH && cd SCRATCH && npm init -y && npm i puppeteer-core
scripts/promo/build.sh SCRATCH
```

Output: `store-assets/promo/wupiko-promo.mp4` and `store-assets/promo/contact-sheet.jpg`.
Requires Google Chrome at /Applications, ffmpeg. Preview a single frame: `node capture.js SCRATCH OUTDIR 1 15`.
