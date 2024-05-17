(function() {

  'use strict';

  const eslint = require('eslint');
  const reporter = require('eslint-html-reporter');
  const fs = require('fs');
  const path = require('path');
  const helper = require('./helper');

  let ESLint;

  if(process.argv[2] && process.argv[2] === '--fix') {
    ESLint = new eslint.ESLint({ useEslintrc: true, fix: true });
  } else {
    ESLint = new eslint.ESLint({ useEslintrc: true, fix: false });
  }

  ESLint.lintFiles("src/**/*.ts").then(results => {

    const outputDir = path.join(__dirname, '..', 'reports', 'eslint-report');
    const jsonOutputFile = path.join(outputDir, 'eslint-report.json');
    const htmlOutputFile = path.join(outputDir, 'eslint-report.html');

    helper.clean(outputDir);
    helper.makeDirectories(outputDir);

    fs.writeFileSync(jsonOutputFile, JSON.stringify(results), 'utf8')

    const htmlOutput = require(reporter)(results);
    fs.writeFileSync(htmlOutputFile, htmlOutput, 'utf8');
  });

}());