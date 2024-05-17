(async function() {

  'use strict';

  const typeDoc = require('typedoc');
  const typeDocConfig = require('../typedoc');
  const helper = require('./helper');
  const path = require('path');

  const outputPath = path.resolve(__dirname, '..', 'documentation');
  helper.clean(outputPath);
  helper.makeDirectories(outputPath);

  typeDoc.Application.bootstrap(typeDocConfig).then(async app => {
      app.convert().then(reflection => {
        app.generateDocs(reflection, outputPath);
      });
  });

}());
