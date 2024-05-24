/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MyProject = void 0;
/**
 * Sample TypeDoc comment for class MyProject
 */
class MyProject {
}
exports.MyProject = MyProject;
/**
 * Sample TypeDoc comment for my method.
 * Types for Params and Returns will be auto-generated
 *
 * @param arg1 Some string that goes into this method.
 * @param arg2 Some number that goes into this method.
 * @returns The number concatenated to the string.
 *
 */
MyProject.myMethod = (arg1, arg2) => arg1 + arg2;
console.log(MyProject.myMethod('The number is: ', 5));

})();

module.exports.myLib = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=index.js.map