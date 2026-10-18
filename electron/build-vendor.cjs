const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const outDir = path.resolve(__dirname, 'vendor');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

esbuild.buildSync({
  stdin: {
    contents: 'module.exports = { mssql: require("mssql"), tedious: require("tedious"), tarn: require("tarn") };',
    resolveDir: path.resolve(__dirname, '..'),
    loader: 'js'
  },
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: path.join(outDir, 'bundle.cjs')
});

fs.writeFileSync(
  path.join(outDir, 'mssql.cjs'),
  "const bundle = require('./bundle.cjs');\nmodule.exports = bundle.mssql;\n"
);

fs.writeFileSync(
  path.join(outDir, 'tedious.cjs'),
  "const bundle = require('./bundle.cjs');\nmodule.exports = bundle.tedious;\n"
);

fs.writeFileSync(
  path.join(outDir, 'tarn.cjs'),
  "const bundle = require('./bundle.cjs');\nmodule.exports = bundle.tarn;\n"
);

fs.writeFileSync(
  path.join(outDir, 'index.cjs'),
  "const bundle = require('./bundle.cjs');\nmodule.exports = { mssql: bundle.mssql, tedious: bundle.tedious, tarn: bundle.tarn };\n"
);

console.log('Production Vendor Bundle built successfully.');
