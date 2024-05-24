(function () {

  const path = require('path');
  const glob = require('glob');

  module.exports = {
    entry: glob.sync('./src/**/*.{ts,tsx}').reduce((acc, file) => {
      acc[file.replace(/^\.\/src\//, '').replace(/\.ts/, '')] = file;
      return acc;
    }, {}),
    devtool: 'source-map',
    mode: 'development',
    target: 'node',
    plugins: [],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', 'jsx'],
    },
    node: {
      __dirname: false,
      __filename: false
    },
    output: {
      library: 'myLib',
      libraryTarget: 'commonjs2',
      globalObject: 'this',
      filename: '[name].js',
      sourceMapFilename: '[name].js.map',
      path: path.resolve(__dirname, 'build'),
    },
  };

}());