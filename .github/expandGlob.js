const fg = require('fast-glob');

async function expandGlob(pattern, packagePath) {
  let files = (await fg([pattern], { })).map((file) => file.replace(packagePath, "./"));
  console.log(files.join(','));
}

const packagePath = process.argv[2].trim();
const glob = process.argv[3].trim();
expandGlob(packagePath + '/' + glob, packagePath);