"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultOpenAIPostoptions = exports.defaultPostOptions = void 0;
exports.defaultPostOptions = {
    max_tokens: 250,
    temperature: 0,
    top_p: 1, // no need to change this
};
exports.defaultOpenAIPostoptions = {
    ...exports.defaultPostOptions,
    n: 5,
    stop: ["\n\n"], // list of tokens to stop at
};
//# sourceMappingURL=IModel.js.map