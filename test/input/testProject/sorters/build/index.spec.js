/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, exports) => {


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


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!***************************!*\
  !*** ./src/index.spec.ts ***!
  \***************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const index_1 = __webpack_require__(/*! ./index */ "./src/index.ts");
describe('MyProject', () => {
    describe('myMethod()', () => {
        it('should return "Hello 5"', () => {
            expect(index_1.MyProject.myMethod('Hello ', 5)).toEqual('Hello 5');
        });
    });
});

})();

module.exports.myLib = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=index.spec.js.map