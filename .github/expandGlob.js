const fg = require('fast-glob');

async function expandGlob(pattern, packagePath) {
  const files = await fg([pattern], {
    ignore: ['**/node_modules',
      '**/dist',
      '**/test',
      '**/*.test.*',
      '**/*.min.js',
      '**/*.d.ts',
      '**/rollup.config.js',
      "**/esm/index.js",
      'coverage',
      'lcov-report',
      `${packagePath}/**/*test*.js`,
      '**/examples',
      '**/example',
      '**/benchmark',
      '**/benchmarks',
      "**/*.spec.*",
      '**/build',
      '**/test.js',
      '**/Gruntfile.js',
      '**/design/**',
      '**/spec/**',
      '**/scripts/**',]
  });
  const filesWithoutProjectPath = files.map((file) => file.replace(packagePath, ""));
  return filesWithoutProjectPath;
}

console.log(`argv[0] = ${process.argv[0]}`);
console.log(`argv[1] = ${process.argv[1]}`);
console.log(`argv[2] = ${process.argv[2]}`);
console.log(`argv[3] = ${process.argv[3]}`);

const packagePath = process.argv[2].trim();
const glob = process.argv[3].trim();
expandGlob(packagePath + glob, packagePath).then((files) => {
  console.log(files.join(','));
});