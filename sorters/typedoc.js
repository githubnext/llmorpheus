(function () {

  const packageJson = require('./package.json');

  module.exports = {
    "name": packageJson.name,
    "out": "./documentation",
    "tsconfig": "./tsconfig.json",
    "readme": "./README.md",
    "entryPoints": packageJson.entry
  }

}());
