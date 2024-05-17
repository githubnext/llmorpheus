
# sorters

Project scaffold for sorters

This is a customized Typescript 5 project starter which includes the following features:
* Webpack bunding
* Webpack bundle analyzer
* Unit test with jest (with code coverage)
* ESLint (with HTML report)
* Code Duplicity (with git integration and html report)
* Documentation with Typedoc

## Running the code

Run *`npm run start`* to execute the code.  
This command will first build the project using *`npm run build`* (see below).  
Then, the the generated code will be executed as *`node dist/sorters.js`*.  
*Note:* The default Entry point for project is set to `index.ts` and can be modified in `package.json`.


## Build the code

### Building for Development

Run *`npm run build`* to build the project with [Webpack](https://webpack.js.org/).  
The build artifacts will be stored in the `dist/` directory.  
To execute the code, run *`node dist/sorters.js`*.  
*Note:* The default Entry point for project is set to `index.ts` and can be modified in `package.json`.

### Building for Debugging

Run *`npm run build:debug`* to build the project with [Webpack](https://webpack.js.org/).  
The build artifacts will be stored in the `build/` directory.
This command generates an individual `.js` file for every `.ts` file in `./src/` along with the source maps, which is helpful for debugging.
To execute the code, run *`node build/<file-path>.js`*.  

### Building for Development

Run *`npm run build:prod`* to build the project for production with [Webpack](https://webpack.js.org/).  
The build artifacts will be stored in the `dist/` directory.  
To execute the code, run *`node dist/sorters.js`*.  
*Note:* The default Entry point for project is set to `index.ts` and can be modified in `package.json`.


## Generate Code coverage Report for unit tests

Run *`npm run test`* to execute the unit tests via [Jest](https://jestjs.io/).
Coverage report for the tests is generated automatically.
Additionally, one can use [Chai](https://www.chaijs.com/) assertions and [Sinon](https://sinonjs.org/) mocks for a richer testing ecosystem. 
Report location: `reports/coverage/lcov-report`.


## Generate Webpack Bundle Analysis Report

Run *`npm run build:analysis`* to generate Webpack bundle Analysis report using [Webpack Bundle Analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer).    
Report location: `reports/build-analysis`.


## Generate ESLint Html Report

Run *`npm run lint`* to generate a json and html lint report using [ESLint](https://www.npmjs.com/package/eslint) and [ESLint-Html-Reporter](https://www.npmjs.com/package/eslint-html-reporter).  
Report location: `reports/eslint-report`

Run *`npm run lint:fix`* to auto-fix certain lint errors.

## Generate Code-Duplicity Report

Run *`npm run jscpd`* to generate a json and html duplicity report using [JSCPD-Html-report](https://www.npmjs.com/package/jscpd-html-reporter).  
Report location: `reports/code-duplicity`  


## Generate Documentation

Run *`npm run docs`* to generate documentation for the code using [Typedoc](https://typedoc.org/).  
Information for Params and Returns of functions is generated automatically.  
Use JSDoc comment format to provide description for functions:
```Javascript
  /**
   * This is the description for my method
   * */  
```
Report location: `documentation`  


## Create a .zip for submission

Run *`npm run zip`* to create a zip file from the contents of src/ called "submission.zip".
This file should be submitted to gradescope.
