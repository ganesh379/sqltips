// Usage:
//   node render_reel.js <folder> stills t1 t2 ...   -> <folder>/stills/f_<t>.jpg
//   node render_reel.js <folder> video               -> <folder>/final.mp4 (with voice.wav)
// <folder> holds scene.html, timing.json, voice.wav
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const dir = path.resolve(process.argv[2]), mode = process.argv[3];
const timing = JSON.parse(fs.readFileSync(path.join(dir, 'timing.json'), 'utf8'));
fs.writeFileSync(path.join(dir, 'timing.js'), 'window.TIMING=' + JSON.stringify(timing) + ';');
const FPS = 30;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await p.goto('file://' + path.join(dir, 'scene.html'));
  await p.waitForFunction(() => window.ready === true);
  const grab = async t => Buffer.from((await p.evaluate(t => window.frameJPEG(t), t)).split(',')[1], 'base64');
  if (mode === 'stills') {
    fs.mkdirSync(path.join(dir, 'stills'), { recursive: true });
    for (const t of process.argv.slice(4).map(Number))
      fs.writeFileSync(path.join(dir, 'stills', `f_${t.toFixed(2).padStart(6, '0')}.jpg`), await grab(t));
  } else {
    // one encoded file per ~10 s scene, then concat + voice
    const total = timing.total, cuts = [0];
    while (cuts[cuts.length - 1] + 10 < total) cuts.push(cuts[cuts.length - 1] + 10);
    cuts.push(total);
    const sdir = path.join(dir, 'scenes'); fs.mkdirSync(sdir, { recursive: true });
    const list = [];
    for (let s = 0; s < cuts.length - 1; s++) {
      const f0 = Math.round(cuts[s] * FPS), f1 = Math.round(cuts[s + 1] * FPS);
      const tmp = path.join(sdir, `s${s}.tmp.mp4`), out = path.join(sdir, `s${s}.mp4`);
      const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
      const done = new Promise(r => ff.on('close', r));
      for (let f = f0; f < f1; f++) {
        if (!ff.stdin.write(await grab(f / FPS))) await new Promise(r => ff.stdin.once('drain', r));
      }
      ff.stdin.end();
      if ((await done) !== 0) throw new Error('ffmpeg failed on scene ' + s);
      fs.renameSync(tmp, out); list.push(`file '${out}'`);
      console.log(`scene ${s}: ${f1 - f0} frames`);
    }
    fs.writeFileSync(path.join(sdir, 'list.txt'), list.join('\n') + '\n');
    const vid = path.join(dir, 'video_only.mp4'), fin = path.join(dir, 'final.mp4');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(sdir, 'list.txt'), '-c', 'copy', vid]);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', vid, '-i', path.join(dir, 'voice.wav'), '-map', '0:v', '-map', '1:a',
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-shortest', '-movflags', '+faststart', fin]);
    console.log('wrote', fin);
  }
  await b.close();
})();
