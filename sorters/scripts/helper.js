
(function() {

  'use strict';
  
  const fs = require('fs');
  const path = require('path');

  function generateFileList(filePath, excludeExtension) {

    return new Promise(async (resolve, reject) => {

      if (!fs.existsSync(filePath)) {
        return reject(new Error('File not found'));
      }

      const fileList = [];

      async function findJSFilesInDirectory(fileName) {
        const promises = [];
        const stat = await fs.promises.stat(fileName);
        if (stat.isDirectory()) {
          const files = await fs.promises.readdir(fileName);
          files.forEach(async (file) => {
            promises.push(findJSFilesInDirectory(path.resolve(fileName, file)));
          });
          return Promise.all(promises)
            .catch((e) => reject(e));
        } else {
          if (fileName.endsWith('.ts') && !fileName.endsWith(excludeExtension)) {
            fileList.push(fileName);
          }
          return Promise.resolve();
        }

      }

      await findJSFilesInDirectory(filePath);
      return resolve(fileList);

    });

  }

  function clean(filePath) {
    if(!fs.existsSync(filePath)) {
      return;
    }
    fs.rmSync(filePath, { force: true, recursive: true });
  }

  function makeDirectories(filePath) {
    if(fs.existsSync(filePath)) {
      return;
    }
    fs.mkdirSync(filePath, { recursive: true });
  }

  module.exports = {
    generateFileList,
    clean,
    makeDirectories
  };

}());
