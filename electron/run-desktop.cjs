const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const desktopDistHtml = path.join(rootDir, 'desktop-dist', 'index.html');
const fallbackDistHtml = path.join(rootDir, 'dist', 'index.html');

async function ensureBuild() {
  const distHtml = fs.existsSync(desktopDistHtml) ? desktopDistHtml : fallbackDistHtml;
  if (!fs.existsSync(distHtml)) {
    console.log('\x1b[33m[VERTEX Desktop]\x1b[0m لم يتم العثور على desktop-dist/index.html. جاري بناء نسخة الإنتاج لمرة واحدة...');
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    await new Promise((resolve, reject) => {
      const buildProc = spawn(npmCmd, ['run', 'build'], {
        cwd: rootDir,
        stdio: 'inherit',
        shell: true
      });
      buildProc.on('close', (code) => {
        if (code === 0 && fs.existsSync(distHtml)) {
          resolve();
        } else {
          reject(new Error(`فشل بناء المشروع (Exit code: ${code})`));
        }
      });
      buildProc.on('error', reject);
    });
    console.log('\x1b[32m[VERTEX Desktop]\x1b[0m تم اكتمال بناء Production Build بنجاح.');
  }
}

async function main() {
  console.log('\x1b[36m[VERTEX Desktop]\x1b[0m بدء تشغيل VERTEX Desktop كنسخة Production مستقلة...');
  await ensureBuild();

  console.log('\x1b[32m[VERTEX Desktop]\x1b[0m تشغيل النسخة المبنية مباشرة عبر Electron بدون خادم محلي أو Vite...');

  let electronBin;
  const localExeWin = path.join(rootDir, 'node_modules', 'electron', 'dist', 'electron.exe');
  const localBinCmd = path.join(rootDir, 'node_modules', '.bin', process.platform === 'win32' ? 'electron.cmd' : 'electron');
  const subExeWin = path.join(rootDir, 'electron', 'node_modules', 'electron', 'dist', 'electron.exe');
  const subBinCmd = path.join(rootDir, 'electron', 'node_modules', '.bin', process.platform === 'win32' ? 'electron.cmd' : 'electron');

  if (process.platform === 'win32' && fs.existsSync(localExeWin)) {
    electronBin = localExeWin;
  } else if (process.platform === 'win32' && fs.existsSync(subExeWin)) {
    electronBin = subExeWin;
  } else if (fs.existsSync(localBinCmd)) {
    electronBin = localBinCmd;
  } else if (fs.existsSync(subBinCmd)) {
    electronBin = subBinCmd;
  } else {
    try {
      electronBin = require('electron');
    } catch (e) {
      electronBin = null;
    }
  }

  let electronProcess;
  if (electronBin && typeof electronBin === 'string' && fs.existsSync(electronBin)) {
    electronProcess = spawn(electronBin, ['.'], {
      cwd: rootDir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
  } else {
    const electronCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    electronProcess = spawn(electronCmd, ['-y', 'electron', '.'], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, NODE_ENV: 'production' }
    });
  }

  electronProcess.on('close', (code) => {
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error('\x1b[31m[VERTEX Desktop]\x1b[0m خطأ في التشغيل:', err.message || err);
  process.exit(1);
});
