const fg = require('fast-glob');

async function expandGlob(pattern, packagePath) {
  if (packagePath.endsWith('/')) {
    packagePath = packagePath.substring(0, packagePath.length-1);
  }
  let files = await fg([pattern], { });
  files = files.map(file => file.substring(packagePath.length+1));
  console.log(files.join(','));
}

const packagePath = process.argv[2].trim();
const glob = process.argv[3].trim();
expandGlob(packagePath + '/' + glob, packagePath);