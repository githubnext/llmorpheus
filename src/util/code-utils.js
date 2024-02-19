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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDeclaration = exports.getEnv = exports.nextPosition = exports.charAtPosition = exports.getText = exports.toIndex = exports.insertCommentOnLineWithPlaceholder = exports.hasUnbalancedParens = exports.isObjectLiteral = exports.getEndColumn = exports.getStartColumn = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Find the start column of a code fragmenton a given line in a file.
 */
function getStartColumn(projectPath, fileName, lineNr, originalCode) {
    const lines = fs
        .readFileSync(path.join(projectPath, fileName))
        .toString()
        .split("\n");
    const line = lines[lineNr - 1];
    return line.indexOf(originalCode);
}
exports.getStartColumn = getStartColumn;
/**
 * Find the end column of a code fragment on a given line in a file.
 */
function getEndColumn(projectPath, fileName, lineNr, originalCode) {
    const lines = fs
        .readFileSync(path.join(projectPath, fileName))
        .toString()
        .split("\n");
    const line = lines[lineNr - 1];
    return line.indexOf(originalCode) + originalCode.length;
}
exports.getEndColumn = getEndColumn;
function isObjectLiteral(code) {
    return code.startsWith("{") && code.endsWith("}");
}
exports.isObjectLiteral = isObjectLiteral;
function hasUnbalancedParens(code) {
    let nrOpen = 0;
    let nrClose = 0;
    for (const c of code) {
        if (c === "(") {
            nrOpen++;
        }
        else if (c === ")") {
            nrClose++;
        }
    }
    return nrOpen !== nrClose;
}
exports.hasUnbalancedParens = hasUnbalancedParens;
function insertCommentOnLineWithPlaceholder(code, comment) {
    const lines = code.split("\n");
    const lineWithPlaceholder = lines.findIndex((line) => line.includes("<PLACEHOLDER>"));
    if (lineWithPlaceholder === -1) {
        throw new Error("No line with placeholder found");
    }
    else {
        const line = lines[lineWithPlaceholder];
        const lineWithComment = line + " // " + comment;
        lines[lineWithPlaceholder] = lineWithComment;
        return lines.join("\n");
    }
}
exports.insertCommentOnLineWithPlaceholder = insertCommentOnLineWithPlaceholder;
/**
 * Convert [line,col] to index.
 * @param code the code
 * @param line the line
 * @param column the column
 * @returns the index
 */
function toIndex(code, line, column) {
    let index = 0;
    let lineCount = 1;
    let columnCount = 0;
    for (let i = 0; i <= code.length; i++) {
        if (lineCount === line && columnCount === column) {
            index = i;
            break;
        }
        if (code[i] === "\n") {
            lineCount++;
            columnCount = 0;
        }
        else {
            columnCount++;
        }
    }
    return index;
}
exports.toIndex = toIndex;
/**
 * Retrieve the code fragment from [startLine, startColumn] to [endLine, endColumn].
 * @param code the code
 * @param startLine the start line
 * @param startColumn the start column
 * @param endLine the end line
 * @param endColumn the end column
 * @returns the code fragment
 */
function getText(code, startLine, startColumn, endLine, endColumn) {
    const startIndex = toIndex(code, startLine, startColumn);
    const endIndex = toIndex(code, endLine, endColumn);
    return code.substring(startIndex, endIndex);
}
exports.getText = getText;
function charAtPosition(code, line, column) {
    const lines = code.split("\n");
    return lines[line - 1].charAt(column - 1);
}
exports.charAtPosition = charAtPosition;
function nextPosition(code, line, column) {
    const lines = code.split("\n");
    if (column < lines[line - 1].length) {
        return { line, column: column + 1 };
    }
    else {
        return { line: line + 1, column: 1 };
    }
}
exports.nextPosition = nextPosition;
function getEnv(name) {
    const value = process.env[name];
    if (!value) {
        console.error(`Please set the ${name} environment variable.`);
        process.exit(1);
    }
    return value;
}
exports.getEnv = getEnv;
function isDeclaration(compl) {
    return compl.startsWith("const") || compl.startsWith("let") || compl.startsWith("var");
}
exports.isDeclaration = isDeclaration;
//# sourceMappingURL=code-utils.js.map