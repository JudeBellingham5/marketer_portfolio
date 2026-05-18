const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'public', 'uploads');
const destDir = path.join(process.cwd(), 'public', 'assets');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

if (fs.existsSync(srcDir)) {
    const files = fs.readdirSync(srcDir);
    files.forEach(file => {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${file} to assets`);
    });
}
