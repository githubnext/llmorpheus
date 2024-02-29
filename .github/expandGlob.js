const fg = require('fast-glob');

async function expandGlob(pattern, packagePath) {
  const files = await fg([pattern], {
    dot: true,
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
  console.log(filesWithoutProjectPath.join(','));}

const packagePath = process.argv[2].trim();
const glob = process.argv[3].trim();
// console.log(`packagePath = ${packagePath}`);
// console.log(`glob = ${glob}`);

expandGlob(packagePath + '/' + glob, packagePath);