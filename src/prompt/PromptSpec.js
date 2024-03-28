"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptSpec = void 0;
const fs = __importStar(require("fs"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const parser = __importStar(require("@babel/parser"));
const SourceLocation_1 = require("../util/SourceLocation");
const code_utils_1 = require("../util/code-utils");
/**
 * A PromptSpec specifies all information associated with code fragments that are included in prompts.
 *   file: the file name
 *   feature: the type of the language construct (if/switch/while/do-while/for/for-in/for-of/call)
 *   component: the part of the language construct that is to be changed (e.g., test/discriminant/update/left/right)
 *   location: the location of the component in the source code
 *   orig: the original contents of the placeholder
 *   references: the set of identifiers referenced in the expression that is to be changed
 */
class PromptSpec {
    constructor(file, feature, component, location, orig, parentLocation) {
        this.file = file;
        this.feature = feature;
        this.component = component;
        this.location = location;
        this.orig = orig;
        this.parentLocation = parentLocation;
        this.references = new Set();
        this.findReferences();
    }
    /**
     * Returns the code with a placeholder inserted at the appropriate location.
     */
    getCodeWithPlaceholder() {
        const code = fs.readFileSync(this.file, "utf8");
        const lines = code.split("\n");
        const lastLine = lines.length;
        const endColumnOfLastLine = lines[lastLine - 1].length;
        const codeWithPlaceHolder = ((0, code_utils_1.getText)(code, 1, 0, this.location.startLine, this.location.startColumn) +
            "<PLACEHOLDER>" +
            (0, code_utils_1.getText)(code, this.location.endLine, this.location.endColumn, lastLine, endColumnOfLastLine));
        return codeWithPlaceHolder;
    }
    /**
     * Finds the set of identifiers that are referenced in the expression that is to be changed.
     */
    findReferences() {
        const code = fs.readFileSync(this.file, "utf8");
        const ast = parser.parse(code, {
            sourceType: "module",
            plugins: ["typescript"],
        });
        const outerThis = this;
        (0, traverse_1.default)(ast, {
            enter(path) {
                if (path.isIdentifier()) {
                    const loc = new SourceLocation_1.SourceLocation(outerThis.file, path.node.loc.start.line, path.node.loc.start.column, path.node.loc.end.line, path.node.loc.end.column);
                    if (loc.containedIn(outerThis.location)) {
                        outerThis.references.add(path.node.name);
                    }
                }
            }
        });
    }
    addOriginalCodeAsCommentAtEndOfLineContainingPlaceholder(codeWithPlaceHolder) {
        const lines = codeWithPlaceHolder.split("\n");
        const lineNr = this.location.startLine - 1;
        const line = lines[lineNr];
        const newLine = line + " // original code was: " + this.orig;
        lines[lineNr] = newLine;
        return lines.join("\n");
    }
    isExpressionPlaceholder() {
        return ((this.feature === "if" && this.component === "test") ||
            (this.feature === "switch" && this.component === "discriminant") ||
            (this.feature === "while" && this.component === "test") ||
            (this.feature === "do-while" && this.component === "test") ||
            (this.feature === "for" && this.component === "test") ||
            (this.feature === "for-in" && this.component === "right") ||
            (this.feature === "for-of" && this.component === "right") ||
            (this.feature === "call" && this.component.startsWith("arg")) ||
            (this.feature === "call" && this.component === "callee"));
    }
    isArgListPlaceHolder() {
        return this.feature === "call" && this.component === "allArgs";
    }
    isForInitializerPlaceHolder() {
        return (this.feature === "for" && this.component === "init");
    }
    isForLoopHeaderPlaceHolder() {
        return (this.feature === "for" && this.component === "header");
    }
    isForInInitializerPlaceHolder() {
        return (this.feature === "for-in" && this.component === "left");
    }
    isForInLoopHeaderPlaceHolder() {
        return (this.feature === "for-in" && this.component === "header");
    }
    isForInRightPlaceHolder() {
        return (this.feature === "for-in" && this.component === "right");
    }
    isForOfInitializerPlaceHolder() {
        return (this.feature === "for-of" && this.component === "left");
    }
    isForOfLoopHeaderPlaceHolder() {
        return (this.feature === "for-of" && this.component === "header");
    }
    isCalleePlaceHolder() {
        return this.feature === "call" && this.component === "callee";
    }
}
exports.PromptSpec = PromptSpec;
//# sourceMappingURL=PromptSpec.js.map