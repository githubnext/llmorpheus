(function() {

  'use strict';

  const path = require('path');
  const fs = require('fs');
  const zipAFolder = require('zip-a-folder');

  const outputPath = path.resolve(__dirname, '..', 'submission.zip');
  const inputPath = path.resolve(__dirname, '..', 'src');

  if(fs.existsSync(outputPath)) {
    fs.rmSync(outputPath, { force: true });
    console.log('Old "submission.zip" deleted')
  }

  zipAFolder.zip(inputPath, outputPath);
  console.log('New "submission.zip" created');

}());