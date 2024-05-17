(function(){

  'use strict';

  const jest = require("jest");
  const config = require("../jest.config");
  const path = require("path");
  const helper = require('./helper');

  const outputDir = path.join(__dirname, '..', 'reports', 'coverage');
  helper.clean(outputDir);
  helper.makeDirectories(outputDir);

  jest
    .runCLI(config, [path.resolve(__dirname, '..')])
    .then((success) => {
      process.exit(0);
    })
    .catch((failure) => {
      process.exit(1);
    });

}());