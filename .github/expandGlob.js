const fg = require('fast-glob');

async function expandGlob(pattern, packagePath, ignore) {
  console.log('ignore:', ignore);
  if (packagePath.endsWith('/')) {
    packagePath = packagePath.substring(0, packagePath.length-1);
  }
  let files = await fg([pattern], ignore ? {ignore: ignore} : {});
  files = files.map(file => file.substring(packagePath.length+1));
  console.log(files.join(','));
}

const packagePath = process.argv[2].trim();
const glob = process.argv[3].trim();
const ignore = process.argv[4] ? process.argv[4].trim() : undefined;  
expandGlob(packagePath + '/' + glob, packagePath, ignore);