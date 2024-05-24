(function () {

  const path = require('path');
  const packageJson = require('./package.json');

  module.exports = {
    entry: packageJson.entry,
    devtool: 'inline-source-map',
    mode: 'production',
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
      filename: packageJson.name + '.js',
      sourceMapFilename: packageJson.name + '.js.map',
      path: path.resolve(__dirname, 'dist'),
    },
  };

}());