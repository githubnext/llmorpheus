(function() {

  'use strict';

  const webpack = require('webpack');
  let config = {};
  const path = require('path');
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
  const helper = require('./helper');

  if (process.argv[2] && process.argv[2] === '--debug') {
    config = require('../webpack.debug.config');
  } else if(process.argv[2] && process.argv[2] === '--prod') {
    config = require('../webpack.prod.config');
  } else {
    config = require('../webpack.dev.config');
  }

  if (process.argv[2] && process.argv[2] === '--analyze') {
    
    const outputDir = path.resolve(__dirname, '..', 'reports', 'build-analysis');
    const outputFile = path.resolve(outputDir, 'report.html')

    helper.clean(outputDir);
    helper.makeDirectories(outputDir);

    config.plugins.push(new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: outputFile
    }));
  }

  const compiler = webpack(config);
  compiler.run((err, stats) => {
    if(err) {
      console.error(err);
    }
    console.log('Build complete');
  });

}());
